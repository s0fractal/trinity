// spore-meter-instr-v0 :: WASM-to-WASM instrumenter for spore.fuel.v1.
//
// MVP scope: nop + identity only (single-BB mutators, optional
// memory.copy). Mutators containing loop/block/if/br_if/br/br_table/
// call are refused — see SPEC.md.
//
// Strategy:
//   1. Add a type (func (param i32)) and an import (spore.deduct).
//      The import is function index 0, shifting all original function
//      indices by +1.
//   2. Update exports that reference function indices.
//   3. For each function body:
//        - Add one scratch i32 local.
//        - Compute static body fuel = sum of v1 cost for every op in
//          the body, treating memory.copy / memory.fill as their
//          fixed cost of 4 only.
//        - Prepend `i32.const <static>; call $deduct` to the body.
//        - Before each memory.copy: emit dynamic charge sequence
//          (tee scratch, get scratch, *2, call deduct).
//        - Before each memory.fill: same but *1 (or omit the const).
//
// Output is written to /tmp/spore-meter-instr-v0/<name>.instr.wasm.

use std::error::Error;
use std::fs;
use std::path::Path;

use wasm_encoder::{
    CodeSection, ConstExpr, EntityType, ExportKind, ExportSection,
    Function, FunctionSection, ImportSection, Instruction, MemArg,
    MemorySection, MemoryType, Module, TypeSection, ValType,
};
use wasmparser::{Operator, Parser, Payload};

const INPUT_MUTATORS: &[&str] = &["nop", "identity"];
const SOURCE_DIR_REL: &str = "../../spore-execute-v0";
const OUTPUT_DIR: &str = "/tmp/spore-meter-instr-v0";

/// Per-instruction v1 fuel cost. Returns None for ops outside the
/// MVP-supported subset (these cause the instrumenter to refuse).
fn op_static_fuel(op: &Operator) -> Option<u32> {
    use Operator::*;
    Some(match op {
        // 0 fuel (markers)
        End => 0,

        // 1 fuel
        Nop | Drop
        | LocalGet { .. } | LocalSet { .. } | LocalTee { .. }
        | I32Const { .. } | I64Const { .. }
        | Select | Unreachable
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

        // 2 fuel: memory load/store
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

        // Anything else (loop, block, if, br, br_if, br_table, call,
        // call_indirect, return, banned f32/f64/SIMD ops, etc.) is
        // outside MVP scope. Return None to signal refuse.
        _ => return None,
    })
}

/// Walk a function body and either return its static fuel total or
/// refuse with an explanation if a non-MVP op is present. Also
/// returns the original op-list as we'll need to re-emit them.
fn analyze_body<'a>(
    body_ops: &'a [Operator<'a>],
) -> Result<u32, String> {
    let mut total = 0u32;
    for op in body_ops {
        match op_static_fuel(op) {
            Some(c) => total += c,
            None => {
                return Err(format!(
                    "op {:?} is outside MVP scope (loops/branches/calls/banned ops are deferred)",
                    op
                ));
            }
        }
    }
    Ok(total)
}

/// Translate a single wasmparser Operator into a wasm-encoder
/// Instruction we can re-emit. Only the MVP-supported subset is
/// handled; this mirrors op_static_fuel exactly.
fn translate_op<'a>(op: &Operator<'a>) -> Instruction<'static> {
    use Operator as O;
    match *op {
        O::End => Instruction::End,
        O::Nop => Instruction::Nop,
        O::Drop => Instruction::Drop,
        O::Unreachable => Instruction::Unreachable,
        O::LocalGet { local_index } => Instruction::LocalGet(local_index),
        O::LocalSet { local_index } => Instruction::LocalSet(local_index),
        O::LocalTee { local_index } => Instruction::LocalTee(local_index),
        O::I32Const { value } => Instruction::I32Const(value),
        O::I64Const { value } => Instruction::I64Const(value),
        O::Select => Instruction::Select,
        O::MemoryCopy { dst_mem, src_mem } => {
            Instruction::MemoryCopy { dst_mem, src_mem }
        }
        O::MemoryFill { mem } => Instruction::MemoryFill(mem),
        // Loads/stores need their MemArg; translate it.
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
        _ => unreachable!("translate_op called on op outside MVP subset"),
    }
}

fn mem_arg(m: &wasmparser::MemArg) -> MemArg {
    MemArg {
        offset: m.offset,
        align: m.align as u32,
        memory_index: m.memory,
    }
}

/// Index of the host import function after instrumentation.
const DEDUCT_FUNC_INDEX: u32 = 0;
/// Index of the scratch local we add. For mutators with 3 params and
/// no original locals, scratch is local 3.
const SCRATCH_LOCAL_INDEX: u32 = 3;

struct ModuleParts<'a> {
    types: Vec<wasmparser::FuncType>,
    imports: Vec<wasmparser::Import<'a>>,
    func_type_indices: Vec<u32>, // function section
    memories: Vec<wasmparser::MemoryType>,
    exports: Vec<wasmparser::Export<'a>>,
    function_bodies_ops: Vec<Vec<Operator<'a>>>, // per function, parsed ops
}

fn parse_module<'a>(bytes: &'a [u8]) -> Result<ModuleParts<'a>, Box<dyn Error>> {
    let mut parts = ModuleParts {
        types: vec![],
        imports: vec![],
        func_type_indices: vec![],
        memories: vec![],
        exports: vec![],
        function_bodies_ops: vec![],
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
                // Refuse if any locals are declared — MVP assumes no
                // pre-existing locals so we can use index 3 as scratch.
                let locals_reader = body.get_locals_reader()?;
                if locals_reader.get_count() != 0 {
                    return Err(format!(
                        "function body has {} local groups; MVP expects 0",
                        locals_reader.get_count()
                    ).into());
                }
                let ops_reader = body.get_operators_reader()?;
                let mut ops = vec![];
                for op in ops_reader {
                    ops.push(op?);
                }
                parts.function_bodies_ops.push(ops);
            }
            // Skip everything else (custom name section, etc).
            _ => {}
        }
    }
    Ok(parts)
}

fn build_instrumented(parts: &ModuleParts) -> Result<Vec<u8>, Box<dyn Error>> {
    // ---- 1. Type section: original types + new (func (param i32)) ----
    let mut type_section = TypeSection::new();
    for ty in &parts.types {
        let params: Vec<ValType> = ty
            .params()
            .iter()
            .map(|t| convert_valtype(t))
            .collect();
        let results: Vec<ValType> = ty
            .results()
            .iter()
            .map(|t| convert_valtype(t))
            .collect();
        type_section.ty().function(params, results);
    }
    // New type for $deduct: (param i32) (result)
    let deduct_type_index = parts.types.len() as u32;
    type_section.ty().function(vec![ValType::I32], vec![]);

    // ---- 2. Import section: spore.deduct as func index 0 ----
    let mut import_section = ImportSection::new();
    // Refuse if original module already has imports — MVP doesn't
    // support that (it would change function index math).
    if !parts.imports.is_empty() {
        return Err("MVP: original module already has imports; instrumenter would need to handle index shift accumulation".into());
    }
    import_section.import("spore", "deduct", EntityType::Function(deduct_type_index));

    // ---- 3. Function section: copy ----
    let mut function_section = FunctionSection::new();
    for ti in &parts.func_type_indices {
        function_section.function(*ti);
    }

    // ---- 4. Memory section: copy ----
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

    // ---- 5. Export section: shift function indices by +1 ----
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

    // ---- 6. Code section: instrumented bodies ----
    let mut code_section = CodeSection::new();
    for body_ops in &parts.function_bodies_ops {
        // Stripping trailing End from list when emitting; wasm-encoder's
        // Function::new manages locals; we feed instructions manually.
        let static_fuel = analyze_body(body_ops)
            .map_err(|e| -> Box<dyn Error> { e.into() })?;
        // Add one scratch i32 local.
        let mut function = Function::new(vec![(1u32, ValType::I32)]);
        // Prepend static charge: i32.const N; call deduct.
        function.instruction(&Instruction::I32Const(static_fuel as i32));
        function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
        // Re-emit original ops, inserting dynamic charge before each
        // memory.copy / memory.fill.
        for op in body_ops {
            match op {
                Operator::MemoryCopy { .. } => {
                    // Stack: [..., dst, src, len]
                    // tee scratch (keep len on stack, also store in scratch)
                    function.instruction(&Instruction::LocalTee(SCRATCH_LOCAL_INDEX));
                    // duplicate len
                    function.instruction(&Instruction::LocalGet(SCRATCH_LOCAL_INDEX));
                    // *2
                    function.instruction(&Instruction::I32Const(2));
                    function.instruction(&Instruction::I32Mul);
                    // call deduct
                    function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
                    // Stack now: [..., dst, src, len], ready for memory.copy
                    function.instruction(&translate_op(op));
                }
                Operator::MemoryFill { .. } => {
                    // Stack: [..., dst, val, len]
                    function.instruction(&Instruction::LocalTee(SCRATCH_LOCAL_INDEX));
                    function.instruction(&Instruction::LocalGet(SCRATCH_LOCAL_INDEX));
                    // *1 (omit i32.const 1 + i32.mul; equivalent)
                    function.instruction(&Instruction::Call(DEDUCT_FUNC_INDEX));
                    function.instruction(&translate_op(op));
                }
                _ => {
                    function.instruction(&translate_op(op));
                }
            }
        }
        // The original op list already ends with End (wasmparser emits it
        // as the last op of the body), which translate_op handles.
        code_section.function(&function);
    }

    // Suppress unused warning for ConstExpr (kept in case we later need
    // an init expr for a global instead of an import). Same for ImportSection
    // type alias clarity.
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
        wasmparser::ValType::Ref(_) => panic!("ref types not supported in MVP"),
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
        let static_fuel = analyze_body(&parts.function_bodies_ops[0])
            .map_err(|e| -> Box<dyn Error> { e.into() })?;
        let instr = build_instrumented(&parts)?;
        let dst = out_dir.join(format!("{name}.instr.wasm"));
        fs::write(&dst, &instr)?;
        eprintln!(
            "instrumented {} -> {} ({} bytes, static_body_fuel={})",
            src.display(),
            dst.display(),
            instr.len(),
            static_fuel
        );
    }
    Ok(())
}
