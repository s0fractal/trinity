// spore-meter-instr-v0 :: Wasmtime runner (r2)
//
// Loads the same instrumented .wasm files that the deno/V8 runner
// loads (/tmp/spore-meter-instr-v0/<name>.instr.wasm), wires
// `spore.deduct` as a host import, runs apply(), and prints the
// same line format:
//
//   mutator=<name> in_len=<N> body_fuel_instr=<u64>
//
// The output should be byte-identical to ts/runner.ts. If it is,
// the instrumentation is engine-independent — the fuel counter is
// computed inside the WASM bytecode, not by any engine fuel API.
//
// Also verifies identity output bytes (closes F-INSTR-3 on the
// Wasmtime side, mirroring the byte-check the Deno runner has).

use std::error::Error;
use std::fs;
use std::path::Path;

use wasmtime::{Caller, Engine, Linker, Module, Store, TypedFunc};

const INSTR_DIR: &str = "/tmp/spore-meter-instr-v0";
const MATRIX: &[(&str, &[usize])] = &[
    ("nop", &[32]),
    ("identity", &[32, 256, 1024]),
];
const INPUT_BYTE: u8 = 0xab;
const IN_PTR: i32 = 0;
const OUT_PTR: i32 = 4096;

struct HostState {
    fuel_counter: u64,
}

fn run_one(name: &str, in_len: usize) -> Result<u64, Box<dyn Error>> {
    let wasm_path = Path::new(INSTR_DIR).join(format!("{name}.instr.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let engine = Engine::default();
    let module = Module::from_binary(&engine, &wasm_bytes)?;
    let mut store: Store<HostState> = Store::new(&engine, HostState { fuel_counter: 0 });

    let mut linker: Linker<HostState> = Linker::new(&engine);
    linker.func_wrap(
        "spore",
        "deduct",
        |mut caller: Caller<'_, HostState>, amount: i32| {
            caller.data_mut().fuel_counter += amount as u64;
        },
    )?;

    let instance = linker.instantiate(&mut store, &module)?;
    let memory = instance
        .get_memory(&mut store, "memory")
        .ok_or("memory export missing")?;
    let apply: TypedFunc<(i32, i32, i32), i32> =
        instance.get_typed_func(&mut store, "apply")?;

    // Fill input region.
    let data = memory.data_mut(&mut store);
    for i in 0..in_len {
        data[IN_PTR as usize + i] = INPUT_BYTE;
    }

    let out_len = apply.call(&mut store, (IN_PTR, in_len as i32, OUT_PTR))? as usize;

    // Sanity: out_len.
    match name {
        "nop" => {
            if out_len != 0 {
                return Err(format!("nop returned out_len={}, expected 0", out_len).into());
            }
        }
        "identity" => {
            if out_len != in_len {
                return Err(format!(
                    "identity returned out_len={}, expected {}",
                    out_len, in_len
                )
                .into());
            }
            // F-INSTR-3: verify output bytes equal input bytes.
            let data = memory.data(&store);
            for i in 0..in_len {
                let actual = data[OUT_PTR as usize + i];
                if actual != INPUT_BYTE {
                    return Err(format!(
                        "identity output byte mismatch at {}: got {}, expected {}",
                        i, actual, INPUT_BYTE
                    )
                    .into());
                }
            }
        }
        _ => {}
    }

    Ok(store.data().fuel_counter)
}

fn main() -> Result<(), Box<dyn Error>> {
    for (name, sizes) in MATRIX {
        for &in_len in *sizes {
            let fuel = run_one(name, in_len)?;
            println!("mutator={name} in_len={in_len} body_fuel_instr={fuel}");
        }
    }
    Ok(())
}
