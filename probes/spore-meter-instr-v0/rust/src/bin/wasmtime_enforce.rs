// spore-meter-instr-v0 :: trap-on-budget enforcement (wasmtime)
//
// Mirrors ts/enforce.ts but in Wasmtime. The host import
// `spore.deduct` returns `Err(...)` when the counter would exceed
// the budget; Wasmtime treats this as a trap.
//
// Output format matches ts/enforce.ts exactly:
//   mutator=<name> in_len=<N> budget=<B> result=<SUCCESS|TRAP> final_fuel=<u64>

use std::error::Error;
use std::fs;
use std::path::Path;

use wasmtime::{Caller, Engine, Linker, Module, Store, TypedFunc};

const INSTR_DIR: &str = "/tmp/spore-meter-instr-v0";
const INPUT_BYTE: u8 = 0xab;
const IN_PTR: i32 = 0;
const OUT_PTR: i32 = 4096;

struct Row {
    name: &'static str,
    sizes: &'static [usize],
    body_fuel: fn(usize) -> u64,
}

const CORPUS: &[Row] = &[
    Row { name: "nop", sizes: &[32], body_fuel: |_| 1 },
    Row { name: "identity", sizes: &[32, 256, 1024], body_fuel: |n| 8 + 2 * n as u64 },
    Row { name: "xor_5c", sizes: &[32, 256, 1024], body_fuel: |n| 7 + 21 * n as u64 },
    Row { name: "sum_bytes", sizes: &[32, 256, 1024], body_fuel: |n| 11 + 17 * n as u64 },
];

struct HostState {
    fuel_counter: u64,
    budget: u64,
}

#[derive(Debug, Clone, Copy)]
enum RunResult {
    Success,
    Trap,
}

fn run_once(name: &str, in_len: usize, budget: u64) -> Result<(RunResult, u64), Box<dyn Error>> {
    let wasm_path = Path::new(INSTR_DIR).join(format!("{name}.instr.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let engine = Engine::default();
    let module = Module::from_binary(&engine, &wasm_bytes)?;
    let mut store: Store<HostState> = Store::new(
        &engine,
        HostState { fuel_counter: 0, budget },
    );
    let mut linker: Linker<HostState> = Linker::new(&engine);
    linker.func_wrap(
        "spore",
        "deduct",
        |mut caller: Caller<'_, HostState>, amount: i32| -> Result<(), wasmtime::Error> {
            let st = caller.data_mut();
            let next = st.fuel_counter.saturating_add(amount as u64);
            if next > st.budget {
                anyhow::bail!(
                    "spore.deduct: would exceed budget (counter={}+{}>{})",
                    st.fuel_counter, amount, st.budget
                );
            }
            st.fuel_counter = next;
            Ok(())
        },
    )?;

    let instance = linker.instantiate(&mut store, &module)?;
    let memory = instance
        .get_memory(&mut store, "memory")
        .ok_or("memory export missing")?;
    let apply: TypedFunc<(i32, i32, i32), i32> =
        instance.get_typed_func(&mut store, "apply")?;

    let data = memory.data_mut(&mut store);
    for i in 0..in_len {
        data[IN_PTR as usize + i] = INPUT_BYTE;
    }

    let call_result = apply.call(&mut store, (IN_PTR, in_len as i32, OUT_PTR));
    let final_fuel = store.data().fuel_counter;
    match call_result {
        Ok(_) => Ok((RunResult::Success, final_fuel)),
        Err(_) => Ok((RunResult::Trap, final_fuel)),
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    for row in CORPUS {
        for &in_len in row.sizes {
            let fuel = (row.body_fuel)(in_len);
            let (ok_res, ok_fuel) = run_once(row.name, in_len, fuel)?;
            println!(
                "mutator={} in_len={} budget={} result={} final_fuel={}",
                row.name,
                in_len,
                fuel,
                match ok_res { RunResult::Success => "SUCCESS", RunResult::Trap => "TRAP" },
                ok_fuel
            );
            let (trap_res, trap_fuel) = run_once(row.name, in_len, fuel - 1)?;
            println!(
                "mutator={} in_len={} budget={} result={} final_fuel={}",
                row.name,
                in_len,
                fuel - 1,
                match trap_res { RunResult::Success => "SUCCESS", RunResult::Trap => "TRAP" },
                trap_fuel
            );
        }
    }
    Ok(())
}
