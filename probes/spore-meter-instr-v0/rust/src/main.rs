// spore-meter-instr-v0 :: WASM-to-WASM instrumenter for spore.fuel.v1.
//
// Scope (post-r3): single-function v0 mutators with the v0 consensus
// instruction subset, including loops via block/loop/if/else/br/br_if.
// Modules with internal call, call_indirect, banned f32/f64/SIMD ops,
// or pre-existing imports are still refused.
//
// Strategy:
//   1. Add a type (func (param i32)) and an import (spore.deduct).
//      The import is function index 0, shifting all original function
//      indices by +1.
//   2. Update exports referencing function indices.
//   3. For each function body:
//        - Preserve original locals; add one scratch i32 local.
//        - Split the operator stream into basic blocks (BBs). A BB
//          ends at every control-flow op: block / loop / if / else /
//          end / br / br_if / br_table / return / unreachable / call.
//        - Compute static fuel for each BB as the sum of v1 instr
//          costs of every op inside the BB. memory.copy / memory.fill
//          contribute their fixed 4; their dynamic per-byte cost is
//          charged separately.
//        - Emit BB-entry charge (`i32.const cost; call $deduct`) at
//          the start of each BB whose cost > 0. Charges of 0 are
//          skipped (they would just be dead bytes in unreachable BBs
//          and structurally fine but pointless).
//        - Before each memory.copy / memory.fill, emit the dynamic
//          charge sequence (tee scratch, get scratch, *2 / *1, call
//          $deduct).
//
// Loop semantics rely on WASM's own control flow: a br to a loop
// label resumes at the instruction right after the `loop` opcode
// (which is where the exit-check BB's charge sits), so the exit-check
// charge naturally fires N+1 times and the loop-body BB charge fires
// N times — matching meter #3 (exec-aware) exactly.

use std::error::Error;
use std::fs;
use std::path::Path;

use wasm_encoder::{
    BlockType as EncBlockType, CodeSection, ConstExpr, EntityType, ExportKind,
    ExportSection, Function, FunctionSection, ImportSection, Instruction, MemArg,
    MemorySection, MemoryType, Module, TypeSection, ValType,
};
use wasmparser::{BlockType as ParseBlockType, Operator, Parser, Payload, Validator};

const INPUT_MUTATORS: &[&str] = &["nop", "identity", "xor_5c", "sum_bytes"];
const SOURCE_DIR_REL: &str = "../../spore-execute-v0";
const OUTPUT_DIR: &str = "/tmp/spore-meter-instr-v0";

const DEDUCT_FUNC_INDEX: u32 = 0;

/// Per-instruction v1 fuel cost. Returns None for ops outside the
/// supported subset.
fn op_static_fuel(op: &Operator) -> Option<u32> {
    use Operator::*;
    Some(match op {
        // 0 fuel (markers)
        End => 0,

        // 1 fuel (structural / control flow / arith)
        Nop | Drop
        | LocalGet { .. } | LocalSet { .. } | LocalTee { .. }
        | I32Const { .. } | I64Const { .. }
        | Block { .. } | Loop { .. } | If { .. } | Else
        | Br { .. } | BrIf { .. }
        | Return | Select | Unreachable
        // i32 arith
        | I32Add | I32Sub | I32Mul
        | I32DivS | I32DivU | I32RemS | I32RemU
        | I32And | I32Or | I32Xor
        | I32Shl | I32ShrS | I32ShrU | I32Rotl | I32Rotr
        | I32Clz | I32Ctz | I32Popcnt
        // i64 arith
        | I64Add | I64Sub | I64Mul
        | I64DivS | I64DivU | I64RemS | I64RemU
        | I64And | I64Or | I64Xor
        | I64Shl | I64ShrS | I64ShrU | I64Rotl | I64Rotr
        | I64Clz | I64Ctz | I64Popcnt
        // comparisons
        | I32Eqz | I32Eq | I32Ne
        | I32LtS | I32LtU | I32GtS | I32GtU
        | I32LeS | I32LeU | I32GeS | I32GeU
        | I64Eqz | I64Eq | I64Ne
        | I64LtS | I64LtU | I64GtS | I64GtU
        | I64LeS | I64LeU | I64GeS | I64GeU
        // conversions
        | I32WrapI64
        | I64ExtendI32S | I64ExtendI32U
        | I32Extend8S | I32Extend16S
        | I64Extend8S | I64Extend16S | I64Extend32S => 1,

        // 2 fuel: memory load/store, call
        I32Load { .. } | I64Load { .. }
        | I32Load8S { .. } | I32Load8U { .. }
        | I32Load16S { .. } | I32Load16U { .. }
        | I64Load8S { .. } | I64Load8U { .. }
        | I64Load16S { .. } | I64Load16U { .. }
        | I64Load32S { .. } | I64Load32U { .. }
        | I32Store { .. } | I64Store { .. }
        | I32Store8 { .. } | I32Store16 { .. }
        | I64Store8 { .. } | I64Store16 { .. } | I64Store32 { .. } => 2,

        // Bulk memory: fixed part is 4; dynamic part is handled
        // separately at instrumentation time.
        MemoryCopy { .. } | MemoryFill { .. } => 4,

        // Out of supported subset for now: internal call, call_indirect,
        // br_table (1+N cost, not yet implemented), banned f32/f64/SIMD.
        _ => return None,
    })
}

/// Is this op a control-flow boundary that ends a basic block?
fn is_bb_terminator(op: &Operator) -> bool {
    use Operator::*;
    matches!(op,
        Block { .. } | Loop { .. } | If { .. } | Else | End
        | Br { .. } | BrIf { .. } | BrTable { .. }
        | Return | Unreachable | Call { .. }
    )
}

#[derive(Debug, Clone)]
struct BasicBlock {
    start: usize,
    end: usize, // exclusive
    cost: u32,
}

/// Walk the operator list, find BB boundaries, compute each BB's cost.
fn compute_basic_blocks(ops: &[Operator]) -> Result<Vec<BasicBlock>, String> {
    let mut bbs = vec![];
    let mut bb_start = 0;
    for (i, op) in ops.iter().enumerate() {
        if op_static_fuel(op).is_none() {
            return Err(format!(
                "op {:?} is outside supported subset (internal call, call_indirect, br_table, or banned)",
                op
            ));
        }
        if is_bb_terminator(op) {
            let cost: u32 = ops[bb_start..=i]
                .iter()
                .map(|o| op_static_fuel(o).unwrap_or(0))
                .sum();
            bbs.push(BasicBlock { start: bb_start, end: i + 1, cost });
            bb_start = i + 1;
        }
    }
    // Any trailing ops after the last BB terminator? In well-formed
    // WASM bodies the last op is End, so this should be empty.
    if bb_start < ops.len() {
        let cost: u32 = ops[bb_start..]
            .iter()
            .map(|o| op_static_fuel(o).unwrap_or(0))
            .sum();
        bbs.push(BasicBlock { start: bb_start, end: ops.len(), cost });
    }
    Ok(bbs)
}

fn mem_arg(m: &wasmparser::MemArg) -> MemArg {
    MemArg {
        offset: m.offset,
        align: m.align as u32,
        memory_index: m.memory,
    }
}

fn translate_block_type(bt: &ParseBlockType) -> EncBlockType {
    match bt {
        ParseBlockType::Empty => EncBlockType::Empty,
        ParseBlockType::Type(t) => EncBlockType::Result(convert_valtype(t)),
        ParseBlockType::FuncType(i) => EncBlockType::FunctionType(*i),
    }
}

fn translate_op<'a>(op: &Operator<'a>) -> Instruction<'static> {
    use Operator as O;
    match *op {
        O::End => Instruction::End,
        O::Nop => Instruction::Nop,
        O::Drop => Instruction::Drop,
        O::Unreachable => Instruction::Unreachable,
        O::Return => Instruction::Return,
        O::LocalGet { local_index } => Instruction::LocalGet(local_index),
        O::LocalSet { local_index } => Instruction::LocalSet(local_index),
        O::LocalTee { local_index } => Instruction::LocalTee(local_index),
        O::I32Const { value } => Instruction::I32Const(value),
        O::I64Const { value } => Instruction::I64Const(value),
        O::Select => Instruction::Select,
        O::Block { blockty } => Instruction::Block(translate_block_type(&blockty)),
        O::Loop { blockty } => Instruction::Loop(translate_block_type(&blockty)),
        O::If { blockty } => Instruction::If(translate_block_type(&blockty)),
        O::Else => Instruction::Else,
        O::Br { relative_depth } => Instruction::Br(relative_depth),
        O::BrIf { relative_depth } => Instruction::BrIf(relative_depth),
        O::MemoryCopy { dst_mem, src_mem } => {
            Instruction::MemoryCopy { dst_mem, src_mem }
        }
        O::MemoryFill { mem } => Instruction::MemoryFill(mem),
        O::I32Load { memarg } => Instruction::I32Load(mem_arg(&memarg)),
        O::I64Load { memarg } => Instruction::I64Load(mem_arg(&memarg)),
        O::I32Load8S { memarg } => Instruction::I32Load8S(mem_arg(&memarg)),
        O::I32Load8U { memarg } => Instruction::I32Load8U(mem_arg(&memarg)),
        O::I32Load16S { memarg } => Instruction::I32Load16S(mem_arg(&memarg)),
        O::I32Load16U { memarg } => Instruction::I32Load16U(mem_arg(&memarg)),
        O::I64Load8S { memarg } => Instruction::I64Load8S(mem_arg(&memarg)),
        O::I64Load8U { memarg } => Instruction::I64Load8U(mem_arg(&memarg)),
        O::I64Load16S { memarg } => Instruction::I64Load16S(mem_arg(&memarg)),
        O::I64Load16U { memarg } => Instruction::I64Load16U(mem_arg(&memarg)),
        O::I64Load32S { memarg } => Instruction::I64Load32S(mem_arg(&memarg)),
        O::I64Load32U { memarg } => Instruction::I64Load32U(mem_arg(&memarg)),
        O::I32Store { memarg } => Instruction::I32Store(mem_arg(&memarg)),
        O::I64Store { memarg } => Instruction::I64Store(mem_arg(&memarg)),
        O::I32Store8 { memarg } => Instruction::I32Store8(mem_arg(&memarg)),
        O::I32Store16 { memarg } => Instruction::I32Store16(mem_arg(&memarg)),
        O::I64Store8 { memarg } => Instruction::I64Store8(mem_arg(&memarg)),
        O::I64Store16 { memarg } => Instruction::I64Store16(mem_arg(&memarg)),
        O::I64Store32 { memarg } => Instruction::I64Store32(mem_arg(&memarg)),
        // i32 arith
        O::I32Add => Instruction::I32Add,
        O::I32Sub => Instruction::I32Sub,
        O::I32Mul => Instruction::I32Mul,
        O::I32DivS => Instruction::I32DivS,
        O::I32DivU => Instruction::I32DivU,
        O::I32RemS => Instruction::I32RemS,
        O::I32RemU => Instruction::I32RemU,
        O::I32And => Instruction::I32And,
        O::I32Or => Instruction::I32Or,
        O::I32Xor => Instruction::I32Xor,
        O::I32Shl => Instruction::I32Shl,
        O::I32ShrS => Instruction::I32ShrS,
        O::I32ShrU => Instruction::I32ShrU,
        O::I32Rotl => Instruction::I32Rotl,
        O::I32Rotr => Instruction::I32Rotr,
        O::I32Clz => Instruction::I32Clz,
        O::I32Ctz => Instruction::I32Ctz,
        O::I32Popcnt => Instruction::I32Popcnt,
        // i64 arith
        O::I64Add => Instruction::I64Add,
        O::I64Sub => Instruction::I64Sub,
        O::I64Mul => Instruction::I64Mul,
        O::I64DivS => Instruction::I64DivS,
        O::I64DivU => Instruction::I64DivU,
        O::I64RemS => Instruction::I64RemS,
        O::I64RemU => Instruction::I64RemU,
        O::I64And => Instruction::I64And,
        O::I64Or => Instruction::I64Or,
        O::I64Xor => Instruction::I64Xor,
        O::I64Shl => Instruction::I64Shl,
        O::I64ShrS => Instruction::I64ShrS,
        O::I64ShrU => Instruction::I64ShrU,
        O::I64Rotl => Instruction::I64Rotl,
        O::I64Rotr => Instruction::I64Rotr,
        O::I64Clz => Instruction::I64Clz,
        O::I64Ctz => Instruction::I64Ctz,
        O::I64Popcnt => Instruction::I64Popcnt,
        // comparisons
        O::I32Eqz => Instruction::I32Eqz,
        O::I32Eq => Instruction::I32Eq,
        O::I32Ne => Instruction::I32Ne,
        O::I32LtS => Instruction::I32LtS,
        O::I32LtU => Instruction::I32LtU,
        O::I32GtS => Instruction::I32GtS,
        O::I32GtU => Instruction::I32GtU,
        O::I32LeS => Instruction::I32LeS,
        O::I32LeU => Instruction::I32LeU,
        O::I32GeS => Instruction::I32GeS,
        O::I32GeU => Instruction::I32GeU,
        O::I64Eqz => Instruction::I64Eqz,
        O::I64Eq => Instruction::I64Eq,
        O::I64Ne => Instruction::I64Ne,
        O::I64LtS => Instruction::I64LtS,
        O::I64LtU => Instruction::I64LtU,
        O::I64GtS => Instruction::I64GtS,
        O::I64GtU => Instruction::I64GtU,
        O::I64LeS => Instruction::I64LeS,
        O::I64LeU => Instruction::I64LeU,
        O::I64GeS => Instruction::I64GeS,
        O::I64GeU => Instruction::I64GeU,
        // conversions
        O::I32WrapI64 => Instruction::I32WrapI64,
        O::I64ExtendI32S => Instruction::I64ExtendI32S,
        O::I64ExtendI32U => Instruction::I64ExtendI32U,
        O::I32Extend8S => Instruction::I32Extend8S,
        O::I32Extend16S => Instruction::I32Extend16S,
        O::I64Extend8S => Instruction::I64Extend8S,
        O::I64Extend16S => Instruction::I64Extend16S,
        O::I64Extend32S => Instruction::I64Extend32S,
        _ => unreachable!("translate_op called on op outside supported subset"),
    }
}

struct FunctionBody<'a> {
    locals: Vec<(u32, wasmparser::ValType)>,
    ops: Vec<Operator<'a>>,
    param_count: u32,
}

struct ModuleParts<'a> {
    types: Vec<wasmparser::FuncType>,
    imports: Vec<wasmparser::Import<'a>>,
    func_type_indices: Vec<u32>,
    memories: Vec<wasmparser::MemoryType>,
    exports: Vec<wasmparser::Export<'a>>,
    function_bodies: Vec<FunctionBody<'a>>,
}

fn parse_module<'a>(bytes: &'a [u8]) -> Result<ModuleParts<'a>, Box<dyn Error>> {
    let mut parts = ModuleParts {
        types: vec![],
        imports: vec![],
        func_type_indices: vec![],
        memories: vec![],
        exports: vec![],
        function_bodies: vec![],
    };

    let parser = Parser::new(0);
    for payload in parser.parse_all(bytes) {
        match payload? {
            Payload::Version { .. } => {}
            Payload::TypeSection(reader) => {
                for ty in reader.into_iter_err_on_gc_types() {
                    parts.types.push(ty?);
                }
            }
            Payload::ImportSection(reader) => {
                for imp in reader {
                    parts.imports.push(imp?);
                }
            }
            Payload::FunctionSection(reader) => {
                for ti in reader {
                    parts.func_type_indices.push(ti?);
                }
            }
            Payload::MemorySection(reader) => {
                for m in reader {
                    parts.memories.push(m?);
                }
            }
            Payload::ExportSection(reader) => {
                for ex in reader {
                    parts.exports.push(ex?);
                }
            }
            Payload::CodeSectionEntry(body) => {
                let body_idx = parts.function_bodies.len();
                let type_idx = parts.func_type_indices[body_idx];
                let param_count = parts.types[type_idx as usize].params().len() as u32;
                let mut locals = vec![];
                let locals_reader = body.get_locals_reader()?;
                for local in locals_reader {
                    locals.push(local?);
                }
                let ops_reader = body.get_operators_reader()?;
                let mut ops = vec![];
                for op in ops_reader {
                    ops.push(op?);
                }
                parts.function_bodies.push(FunctionBody { locals, ops, param_count });
            }
            _ => {}
        }
    }
    Ok(parts)
}

fn build_instrumented(parts: &ModuleParts) -> Result<Vec<u8>, Box<dyn Error>> {
    // Type section: original types + new (func (param i32))
    let mut type_section = TypeSection::new();
    for ty in &parts.types {
        let params: Vec<ValType> = ty.params().iter().map(convert_valtype).collect();
        let results: Vec<ValType> = ty.results().iter().map(convert_valtype).collect();
        type_section.ty().function(params, results);
    }
    let deduct_type_index = parts.types.len() as u32;
    type_section.ty().function(vec![ValType::I32], vec![]);

    // Import section
    let mut import_section = ImportSection::new();
    if !parts.imports.is_empty() {
        return Err("module already has imports; index-shift accumulation not yet handled".into());
    }
    import_section.import("spore", "deduct", EntityType::Function(deduct_type_index));

    // Function section
    let mut function_section = FunctionSection::new();
    for ti in &parts.func_type_indices {
        function_section.function(*ti);
    }

    // Memory section
    let mut memory_section = MemorySection::new();
    for m in &parts.memories {
        memory_section.memory(MemoryType {
            minimum: m.initial,
            maximum: m.maximum,
            memory64: m.memory64,
            shared: m.shared,
            page_size_log2: None,
        });
    }

    // Export section (shift func indices by +1)
    let mut export_section = ExportSection::new();
    for ex in &parts.exports {
        let (kind, idx) = match ex.kind {
            wasmparser::ExternalKind::Func => (ExportKind::Func, ex.index + 1),
            wasmparser::ExternalKind::Memory => (ExportKind::Memory, ex.index),
            wasmparser::ExternalKind::Global => (ExportKind::Global, ex.index),
            wasmparser::ExternalKind::Table => (ExportKind::Table, ex.index),
            wasmparser::ExternalKind::Tag => (ExportKind::Tag, ex.index),
        };
        export_section.export(ex.name, kind, idx);
    }

    // Code section: instrumented bodies
    let mut code_section = CodeSection::new();
    for body in &parts.function_bodies {
        let bbs = compute_basic_blocks(&body.ops)
            .map_err(|e| -> Box<dyn Error> { e.into() })?;

        let original_locals_total: u32 = body.locals.iter().map(|(c, _)| *c).sum();
        let scratch_local_index: u32 = body.param_count + original_locals_total;

        let mut new_locals: Vec<(u32, ValType)> = body
            .locals
            .iter()
            .map(|(c, t)| (*c, convert_valtype(t)))
            .collect();
        new_locals.push((1, ValType::I32));

        let mut function = Function::new(new_locals);

        for bb in &bbs {
            if bb.cost > 0 {
                function.instruction(&Instruction::I32Const(bb.cost as i32));
                function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
            }
            for op in &body.ops[bb.start..bb.end] {
                match op {
                    Operator::MemoryCopy { .. } => {
                        function.instruction(&Instruction::LocalTee(scratch_local_index));
                        function.instruction(&Instruction::LocalGet(scratch_local_index));
                        function.instruction(&Instruction::I32Const(2));
                        function.instruction(&Instruction::I32Mul);
                        function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
                        function.instruction(&translate_op(op));
                    }
                    Operator::MemoryFill { .. } => {
                        function.instruction(&Instruction::LocalTee(scratch_local_index));
                        function.instruction(&Instruction::LocalGet(scratch_local_index));
                        function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
                        function.instruction(&translate_op(op));
                    }
                    _ => {
                        function.instruction(&translate_op(op));
                    }
                };
            }
        }
        code_section.function(&function);
    }

    let _ = ConstExpr::i32_const(0);

    let mut module = Module::new();
    module.section(&type_section);
    module.section(&import_section);
    module.section(&function_section);
    module.section(&memory_section);
    module.section(&export_section);
    module.section(&code_section);

    Ok(module.finish())
}

fn convert_valtype(t: &wasmparser::ValType) -> ValType {
    match t {
        wasmparser::ValType::I32 => ValType::I32,
        wasmparser::ValType::I64 => ValType::I64,
        wasmparser::ValType::F32 => ValType::F32,
        wasmparser::ValType::F64 => ValType::F64,
        wasmparser::ValType::V128 => ValType::V128,
        wasmparser::ValType::Ref(_) => panic!("ref types not supported"),
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let source_dir = Path::new(SOURCE_DIR_REL);
    let out_dir = Path::new(OUTPUT_DIR);
    fs::create_dir_all(out_dir)?;

    for name in INPUT_MUTATORS {
        let src = source_dir.join(format!("{name}.wasm"));
        let bytes = fs::read(&src)?;
        let parts = parse_module(&bytes)?;
        let bbs = compute_basic_blocks(&parts.function_bodies[0].ops)
            .map_err(|e| -> Box<dyn Error> { e.into() })?;
        let total_static: u32 = bbs.iter().map(|b| b.cost).sum();
        let instr = build_instrumented(&parts)?;
        Validator::new().validate_all(&instr)?;
        let dst = out_dir.join(format!("{name}.instr.wasm"));
        fs::write(&dst, &instr)?;
        eprintln!(
            "instrumented {} -> {} ({} bytes, {} BBs, sum_bb_static_fuel={})",
            src.display(),
            dst.display(),
            instr.len(),
            bbs.len(),
            total_static
        );
    }
    Ok(())
}
