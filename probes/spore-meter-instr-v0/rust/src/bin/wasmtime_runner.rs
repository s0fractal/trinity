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
    ("xor_5c", &[32, 256, 1024]),
    ("sum_bytes", &[32, 256, 1024]),
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
        "xor_5c" => {
            if out_len != in_len {
                return Err(format!(
                    "xor_5c returned out_len={}, expected {}",
                    out_len, in_len
                )
                .into());
            }
            let data = memory.data(&store);
            let expected = INPUT_BYTE ^ 0x5c;
            for i in 0..in_len {
                let actual = data[OUT_PTR as usize + i];
                if actual != expected {
                    return Err(format!(
                        "xor_5c output byte mismatch at {}: got {}, expected {}",
                        i, actual, expected
                    )
                    .into());
                }
            }
        }
        "sum_bytes" => {
            if out_len != 4 {
                return Err(format!(
                    "sum_bytes returned out_len={}, expected 4",
                    out_len
                )
                .into());
            }
            let data = memory.data(&store);
            let actual_sum = u32::from_le_bytes([
                data[OUT_PTR as usize],
                data[OUT_PTR as usize + 1],
                data[OUT_PTR as usize + 2],
                data[OUT_PTR as usize + 3],
            ]);
            let expected_sum = (INPUT_BYTE as u32) * (in_len as u32);
            if actual_sum != expected_sum {
                return Err(format!(
                    "sum_bytes output mismatch: got {}, expected {}",
                    actual_sum, expected_sum
                )
                .into());
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
