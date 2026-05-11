use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};

use wasmparser::{Operator, Parser, Payload};

const CASES: &[&str] = &[
    "ok_i32",
    "reject_f32",
    "reject_f64",
    "reject_memory_grow",
    "reject_call_indirect",
    "reject_simd",
];

fn compile_cases(probe_dir: &Path) -> Result<(), Box<dyn Error>> {
    for case in CASES {
        let wat_path = probe_dir.join(format!("{case}.wat"));
        let wasm_path = probe_dir.join(format!("{case}.wasm"));
        let wat_src = fs::read_to_string(&wat_path)?;
        let wasm_bytes = wat::parse_str(&wat_src)?;
        fs::write(wasm_path, wasm_bytes)?;
    }
    Ok(())
}

fn validate_v0(wasm_bytes: &[u8]) -> Result<(), &'static str> {
    for payload in Parser::new(0).parse_all(wasm_bytes) {
        let payload = payload.map_err(|_| "invalid:wasm")?;
        if let Payload::CodeSectionEntry(body) = payload {
            let mut reader = body
                .get_operators_reader()
                .map_err(|_| "invalid:code")?;
            while !reader.eof() {
                let op = reader.read().map_err(|_| "invalid:op")?;
                if let Some(reason) = banned_reason(&op) {
                    return Err(reason);
                }
            }
        }
    }
    Ok(())
}

fn banned_reason(op: &Operator<'_>) -> Option<&'static str> {
    use Operator::*;
    match op {
        F32Const { .. }
        | F32Abs
        | F32Neg
        | F32Ceil
        | F32Floor
        | F32Trunc
        | F32Nearest
        | F32Sqrt
        | F32Add
        | F32Sub
        | F32Mul
        | F32Div
        | F32Min
        | F32Max
        | F32Copysign
        | F32Eq
        | F32Ne
        | F32Lt
        | F32Gt
        | F32Le
        | F32Ge
        | I32TruncF32S
        | I32TruncF32U
        | I64TruncF32S
        | I64TruncF32U
        | F32ConvertI32S
        | F32ConvertI32U
        | F32ConvertI64S
        | F32ConvertI64U
        | F32DemoteF64
        | F32ReinterpretI32 => Some("banned:f32"),

        F64Const { .. }
        | F64Abs
        | F64Neg
        | F64Ceil
        | F64Floor
        | F64Trunc
        | F64Nearest
        | F64Sqrt
        | F64Add
        | F64Sub
        | F64Mul
        | F64Div
        | F64Min
        | F64Max
        | F64Copysign
        | F64Eq
        | F64Ne
        | F64Lt
        | F64Gt
        | F64Le
        | F64Ge
        | I32TruncF64S
        | I32TruncF64U
        | I64TruncF64S
        | I64TruncF64U
        | F64ConvertI32S
        | F64ConvertI32U
        | F64ConvertI64S
        | F64ConvertI64U
        | F64PromoteF32
        | F64ReinterpretI64 => Some("banned:f64"),

        MemoryGrow { .. } => Some("banned:memory.grow"),
        CallIndirect { .. } => Some("banned:call_indirect"),

        // SIMD instructions are encoded with the 0xfd prefix. The exact
        // wasmparser enum surface changes across versions, so this
        // display-level check is intentionally a fallback below.
        _ => {
            let text = format!("{op:?}");
            if text.starts_with("V128") || text.contains("I8x16") || text.contains("I16x8")
                || text.contains("I32x4") || text.contains("I64x2")
                || text.contains("F32x4") || text.contains("F64x2")
            {
                Some("banned:simd")
            } else {
                None
            }
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("rust/ should have a parent");

    compile_cases(probe_dir)?;

    for case in CASES {
        let wasm_bytes = fs::read(probe_dir.join(format!("{case}.wasm")))?;
        match validate_v0(&wasm_bytes) {
            Ok(()) => println!("case={case} accepted=true"),
            Err(reason) => println!("case={case} accepted=false reason={reason}"),
        }
    }

    Ok(())
}

