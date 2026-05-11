// spore-meter-exec-v0 :: meter #3 — execution-aware walker.
//
// Same v1 table as meters #1 and #2. DIFFERENT algorithm: models
// control flow as actually executed. For each `loop` block, tracks
// an "exit-check phase" flag — operators in that phase are counted
// (in_len + 1) times rather than in_len times. This matches the
// canonical loop shape:
//
//   loop
//     <exit check>     ;; runs in_len + 1 times
//     br_if $exit      ;; ends exit-check phase
//     <body>           ;; runs in_len times
//     br $loop         ;; runs in_len times
//   end
//
// Output field name: fuel_v1_exec (distinguishes from static
// meters' fuel_v1).

use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};

use wasmparser::{Operator, Parser, Payload};

const DOMAIN_MUTATOR: &str = "spore.mutator.v0";

#[derive(Clone, Copy, PartialEq)]
enum BlockKind {
    Block,
    /// Loop with a per-iteration "are we still in the exit-check
    /// phase" flag. true = yes (multiplier is in_len + 1).
    Loop { in_exit_check: bool },
    If,
}

fn op_fuel(op: &Operator) -> Option<u64> {
    use Operator::*;
    let cost = match op {
        I32Const { .. } | I64Const { .. } => 1,
        LocalGet { .. } | LocalSet { .. } | LocalTee { .. } => 1,
        Drop | Nop => 1,
        I32Add | I32Sub | I32Mul | I32DivS | I32DivU | I32RemS | I32RemU => 1,
        I32And | I32Or | I32Xor => 1,
        I32Shl | I32ShrS | I32ShrU | I32Rotl | I32Rotr => 1,
        I32Clz | I32Ctz | I32Popcnt | I32Eqz => 1,
        I64Add | I64Sub | I64Mul | I64DivS | I64DivU | I64RemS | I64RemU => 1,
        I64And | I64Or | I64Xor => 1,
        I64Shl | I64ShrS | I64ShrU | I64Rotl | I64Rotr => 1,
        I64Clz | I64Ctz | I64Popcnt | I64Eqz => 1,
        I32Eq | I32Ne | I32LtS | I32LtU | I32GtS | I32GtU => 1,
        I32LeS | I32LeU | I32GeS | I32GeU => 1,
        I64Eq | I64Ne | I64LtS | I64LtU | I64GtS | I64GtU => 1,
        I64LeS | I64LeU | I64GeS | I64GeU => 1,
        I32WrapI64 | I64ExtendI32S | I64ExtendI32U => 1,
        I32Extend8S | I32Extend16S => 1,
        I64Extend8S | I64Extend16S | I64Extend32S => 1,
        I32Load { .. } | I32Load8S { .. } | I32Load8U { .. } => 2,
        I32Load16S { .. } | I32Load16U { .. } => 2,
        I64Load { .. } | I64Load8S { .. } | I64Load8U { .. } => 2,
        I64Load16S { .. } | I64Load16U { .. } => 2,
        I64Load32S { .. } | I64Load32U { .. } => 2,
        I32Store { .. } | I32Store8 { .. } | I32Store16 { .. } => 2,
        I64Store { .. } | I64Store8 { .. } | I64Store16 { .. } => 2,
        I64Store32 { .. } => 2,
        Block { .. } | Loop { .. } | If { .. } | Else => 1,
        Br { .. } | BrIf { .. } => 1,
        Return | Select => 1,
        Unreachable => 1,
        Call { .. } => 2,
        End => 0,
        MemoryCopy { .. } | MemoryFill { .. } => return None,
        BrTable { .. } => 1,
        _ => return Some(u64::MAX),
    };
    Some(cost)
}

/// Multiplier for ops at this stack state. Combines the standard
/// loop nesting (each Loop contributes either in_len or in_len+1
/// depending on its exit-check phase) with any non-loop blocks
/// (which contribute 1).
fn multiplier(stack: &[BlockKind], in_len: u64) -> u64 {
    let mut m: u64 = 1;
    for b in stack {
        match b {
            BlockKind::Loop { in_exit_check: true } => m *= in_len + 1,
            BlockKind::Loop { in_exit_check: false } => m *= in_len,
            _ => {}
        }
    }
    if m == 0 { 1 } else { m }
}

fn fuel_v1_exec(
    wasm_bytes: &[u8],
    in_len: u64,
    argc: u64,
) -> Result<u64, Box<dyn Error>> {
    let c_apply_base = 4 + argc;
    let mut body_fuel: u64 = 0;

    for payload in Parser::new(0).parse_all(wasm_bytes) {
        let payload = payload?;
        if let Payload::CodeSectionEntry(body) = payload {
            let mut reader = body.get_operators_reader()?;
            let mut stack: Vec<BlockKind> = Vec::new();

            while !reader.eof() {
                let op = reader.read()?;
                let mult = multiplier(&stack, in_len);

                match &op {
                    Operator::Block { .. } => {
                        body_fuel += mult * 1;
                        stack.push(BlockKind::Block);
                    }
                    Operator::Loop { .. } => {
                        body_fuel += mult * 1;
                        // New loop: starts in exit-check phase.
                        stack.push(BlockKind::Loop { in_exit_check: true });
                    }
                    Operator::If { .. } => {
                        body_fuel += mult * 1;
                        stack.push(BlockKind::If);
                    }
                    Operator::End => {
                        stack.pop();
                    }
                    Operator::MemoryCopy { .. } => {
                        body_fuel += mult * (4 + 2 * in_len);
                    }
                    Operator::MemoryFill { .. } => {
                        body_fuel += mult * (4 + in_len);
                    }
                    Operator::BrIf { .. } => {
                        // Standard fuel charge first.
                        let cost = op_fuel(&op).expect("BrIf has cost");
                        body_fuel += mult * cost;
                        // If we're currently in the exit-check phase
                        // of the innermost enclosing loop, this br_if
                        // ends that phase.
                        if let Some(top) = stack.last_mut() {
                            if let BlockKind::Loop { in_exit_check } = top {
                                if *in_exit_check {
                                    *in_exit_check = false;
                                }
                            }
                        }
                    }
                    _ => {
                        let cost = op_fuel(&op)
                            .expect("non-bulk op should have a v1 cost");
                        if cost == u64::MAX {
                            return Err(format!(
                                "instruction outside v0 consensus subset: {:?}",
                                op
                            )
                            .into());
                        }
                        body_fuel += mult * cost;
                    }
                }
            }
        }
    }
    Ok(c_apply_base + body_fuel)
}

fn to_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn run_one(
    execute_dir: &Path,
    name: &str,
    in_len: u64,
) -> Result<(), Box<dyn Error>> {
    let wasm_path = execute_dir.join(format!("{name}.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let mutator_hash = blake3::derive_key(DOMAIN_MUTATOR, &wasm_bytes);
    let fuel = fuel_v1_exec(&wasm_bytes, in_len, 1)?;

    println!(
        "mutator={name} in_len={in_len} fuel_v1_exec={fuel} mutator_hash={}",
        to_hex(&mutator_hash[..8])
    );
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("rust/ should have a parent");
    let probes_root = probe_dir
        .parent()
        .expect("probes/ should have a parent");
    let execute_dir = probes_root.join("spore-execute-v0");

    let matrix: &[(&str, &[u64])] = &[
        ("nop", &[32][..]),
        ("identity", &[32, 256, 1024][..]),
        ("xor_5c", &[32, 256, 1024][..]),
        ("sum_bytes", &[32, 256, 1024][..]),
    ];

    for (name, sizes) in matrix {
        for &in_len in *sizes {
            run_one(&execute_dir, name, in_len)?;
        }
    }
    Ok(())
}
