// spore-meter-v0 :: reference software meter for spore.fuel.v1
// (canonical execution-aware model — 3-voice consensus 2026-05-11).
//
// Walks each mutator WASM with wasmparser and applies the v1 cost
// table directly. Models control flow as actually executed: a loop's
// exit-check phase fires (in_len + 1) times, body phase fires in_len
// times. Does NOT execute any WASM. Output is deterministic given
// (mutator_wasm_bytes, in_len, argc). See ../SPEC.md.

use std::error::Error;
use std::fs;
use std::path::PathBuf;

use wasmparser::{Operator, Parser, Payload};

const DOMAIN_MUTATOR: &str = "spore.mutator.v0";

#[derive(Clone, Copy, PartialEq)]
enum BlockKind {
    Block,
    /// Loop with phase flag. On loop entry, in_exit_check = true.
    /// The first br_if encountered inside the loop switches it to
    /// false (the exit-check is over, body has begun).
    Loop { in_exit_check: bool },
    If,
}

/// Per-instruction fuel cost from SPORE_FUEL.v1.draft.md (excluding
/// bulk-memory which is dynamic and handled by the caller).
fn op_fuel(op: &Operator) -> Option<u64> {
    use Operator::*;
    let cost = match op {
        // Stack / locals / const / drop / nop: 1
        I32Const { .. } | I64Const { .. } => 1,
        LocalGet { .. } | LocalSet { .. } | LocalTee { .. } => 1,
        Drop | Nop => 1,

        // i32 ALU: 1
        I32Add | I32Sub | I32Mul | I32DivS | I32DivU | I32RemS | I32RemU => 1,
        I32And | I32Or | I32Xor => 1,
        I32Shl | I32ShrS | I32ShrU | I32Rotl | I32Rotr => 1,
        I32Clz | I32Ctz | I32Popcnt | I32Eqz => 1,

        // i64 ALU: same as i32
        I64Add | I64Sub | I64Mul | I64DivS | I64DivU | I64RemS | I64RemU => 1,
        I64And | I64Or | I64Xor => 1,
        I64Shl | I64ShrS | I64ShrU | I64Rotl | I64Rotr => 1,
        I64Clz | I64Ctz | I64Popcnt | I64Eqz => 1,

        // Comparisons: 1
        I32Eq | I32Ne | I32LtS | I32LtU | I32GtS | I32GtU => 1,
        I32LeS | I32LeU | I32GeS | I32GeU => 1,
        I64Eq | I64Ne | I64LtS | I64LtU | I64GtS | I64GtU => 1,
        I64LeS | I64LeU | I64GeS | I64GeU => 1,

        // Conversions: 1
        I32WrapI64 | I64ExtendI32S | I64ExtendI32U => 1,
        I32Extend8S | I32Extend16S => 1,
        I64Extend8S | I64Extend16S | I64Extend32S => 1,

        // Memory load / store: 2
        I32Load { .. } | I32Load8S { .. } | I32Load8U { .. } => 2,
        I32Load16S { .. } | I32Load16U { .. } => 2,
        I64Load { .. } | I64Load8S { .. } | I64Load8U { .. } => 2,
        I64Load16S { .. } | I64Load16U { .. } => 2,
        I64Load32S { .. } | I64Load32U { .. } => 2,
        I32Store { .. } | I32Store8 { .. } | I32Store16 { .. } => 2,
        I64Store { .. } | I64Store8 { .. } | I64Store16 { .. } => 2,
        I64Store32 { .. } => 2,

        // Control flow: 1 (end is 0 — handled separately, see below)
        Block { .. } | Loop { .. } | If { .. } | Else => 1,
        Br { .. } | BrIf { .. } => 1,
        Return | Select => 1,
        Unreachable => 1,
        Call { .. } => 2,

        // End: not counted (heuristic — end is a structural marker,
        // not an executed instruction in this meter)
        End => 0,

        // Bulk memory: handled by caller (dynamic cost). Returning
        // None signals "caller takes over".
        MemoryCopy { .. } | MemoryFill { .. } => return None,

        // br_table — not used in the v0 test corpus; cost would be 1 + N
        // but skipping until needed.
        BrTable { .. } => 1,

        // Anything else falls through. In v0 most other instructions are
        // banned (f32/f64/SIMD/atomics/memory.grow/call_indirect), so
        // their appearance in a real consensus mutator would be an error
        // we ought to surface, not silently zero out.
        _ => return Some(u64::MAX), // sentinel: caller should panic
    };
    Some(cost)
}

fn fuel_v1(
    wasm_bytes: &[u8],
    in_len: u64,
    argc: u64,
) -> Result<u64, Box<dyn Error>> {
    let c_apply_base = 4 + argc;
    let mut body_fuel: u64 = 0;

    for payload in Parser::new(0).parse_all(wasm_bytes) {
        let payload = payload?;
        if let Payload::CodeSectionEntry(body) = payload {
            // Probe assumes a single function (apply) in the code section.
            let mut reader = body.get_operators_reader()?;
            let mut stack: Vec<BlockKind> = Vec::new();

            while !reader.eof() {
                let op = reader.read()?;

                // Execution-aware multiplier: enclosing Loop in
                // exit_check phase contributes (in_len + 1); Loop in
                // body phase contributes in_len.
                let multiplier: u64 = stack
                    .iter()
                    .map(|b| match b {
                        BlockKind::Loop { in_exit_check: true } => in_len + 1,
                        BlockKind::Loop { in_exit_check: false } => in_len,
                        _ => 1,
                    })
                    .product();
                let multiplier = if multiplier == 0 { 1 } else { multiplier };

                match &op {
                    Operator::Block { .. } => {
                        body_fuel += multiplier
                            * op_fuel(&op).expect("Block has a cost");
                        stack.push(BlockKind::Block);
                    }
                    Operator::Loop { .. } => {
                        body_fuel += multiplier
                            * op_fuel(&op).expect("Loop has a cost");
                        stack.push(BlockKind::Loop { in_exit_check: true });
                    }
                    Operator::If { .. } => {
                        body_fuel += multiplier
                            * op_fuel(&op).expect("If has a cost");
                        stack.push(BlockKind::If);
                    }
                    Operator::End => {
                        stack.pop();
                    }
                    Operator::MemoryCopy { .. } => {
                        body_fuel += multiplier * (4 + 2 * in_len);
                    }
                    Operator::MemoryFill { .. } => {
                        body_fuel += multiplier * (4 + in_len);
                    }
                    Operator::BrIf { .. } => {
                        let cost = op_fuel(&op).expect("BrIf has cost");
                        body_fuel += multiplier * cost;
                        // The first BrIf inside a Loop ends its
                        // exit-check phase.
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
                        body_fuel += multiplier * cost;
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
    execute_dir: &std::path::Path,
    name: &str,
    in_len: u64,
) -> Result<(), Box<dyn Error>> {
    let wasm_path = execute_dir.join(format!("{name}.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let mutator_hash = blake3::derive_key(DOMAIN_MUTATOR, &wasm_bytes);
    let fuel = fuel_v1(&wasm_bytes, in_len, 1)?;

    println!(
        "mutator={name} in_len={in_len} fuel_v1={fuel} mutator_hash={}",
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
        // thrash_copy is intentionally excluded from the canonical
        // matrix: it uses (memory.copy len = const 32), but the
        // static meter assumes memcopy.len = in_len. That mismatch
        // would mis-price it under this meter. Handled separately
        // in spore-execute-v0's DoS bench.
    ];

    for (name, sizes) in matrix {
        for &in_len in *sizes {
            run_one(&execute_dir, name, in_len)?;
        }
    }
    Ok(())
}
