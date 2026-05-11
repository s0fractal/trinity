// spore-execute-v0 :: DoS-resistance benchmark
//
// For each (mutator, in_len), runs the mutator in wasmtime many
// times, measures wall-clock, and pairs it with the canonical v1
// fuel cost. Reports ns_per_iter and fuel_per_ns.
//
// Purpose: verify that no mutator within the v0 consensus subset
// can do significantly more wall-clock work per fuel unit than
// the others. If one mutator has dramatically higher
// ns-per-fuel ratio than others, that's a candidate DoS surface
// (work cheaper than its fuel cost suggests).
//
// `thrash_copy` is included as an explicit DoS attempt: a mutator
// that calls memory.copy in a tight loop. Its meter-computed fuel
// is an UPPER BOUND because the static meter assumes
// memcopy.len = in_len, but this mutator uses memcopy.len = 32
// regardless. Wall-clock measurements are real.

use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use wasmtime::{Engine, Instance, Module, Store, TypedFunc};

const ITERATIONS: u32 = 10_000;
const INPUT_BYTE: u8 = 0xAB;
const IN_PTR: i32 = 0;
const OUT_PTR: i32 = 4096;

/// Hand-computed canonical v1 fuel (matches the meters' output for
/// the standard corpus). For thrash_copy, the meter mis-prices, so
/// we compute the actual v1 fuel here by hand based on the WAT
/// structure (loop iterating in_len times; each iter does
/// memory.copy(32) = 4 + 2*32 = 68 fuel).
fn fuel_v1_for(mutator: &str, in_len: u64) -> u64 {
    let argc = 1u64;
    let c_apply_base = 4 + argc;
    let body = match mutator {
        "nop" => 1,
        "identity" => 3 + (4 + 2 * in_len) + 1, // 3 lg + memcopy + 1 lg
        "xor_5c" => {
            // outer block + loop = 2
            // exit-check (4 ops, fuel 4) × (in_len + 1)
            // body (17 fuel) × in_len
            // final local.get for return = 1
            2 + 4 * (in_len + 1) + 17 * in_len + 1
        }
        "sum_bytes" => {
            // outer = 2; exit-check × (N+1); body 13 fuel per iter
            // (lg sum, lg in_ptr, lg i, i32.add, load8_u=2, i32.add, ls sum,
            //  lg i, const 1, i32.add, ls i, br);
            // after-loop = 5 (lg out_ptr, lg sum, i32.store=2, i32.const 4).
            2 + 4 * (in_len + 1) + 13 * in_len + 5
        }
        "thrash_copy" => {
            // outer = 2; exit-check × (N+1); body 76 fuel per iter
            // (3 i32.const memcopy args + memcopy(32)=68 + 4 incr/br);
            // after-loop = 1 (i32.const 0).
            2 + 4 * (in_len + 1) + 76 * in_len + 1
        }
        _ => panic!("no fuel formula for mutator: {mutator}"),
    };
    c_apply_base + body
}

fn run_one(
    probe_dir: &std::path::Path,
    name: &str,
    in_len: u64,
) -> Result<(), Box<dyn Error>> {
    let wasm_path = probe_dir.join(format!("{name}.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let fuel = fuel_v1_for(name, in_len);

    let engine = Engine::default();
    let module = Module::from_binary(&engine, &wasm_bytes)?;
    let mut store: Store<()> = Store::new(&engine, ());
    let instance = Instance::new(&mut store, &module, &[])?;
    let memory = instance
        .get_memory(&mut store, "memory")
        .ok_or("memory missing")?;
    let apply: TypedFunc<(i32, i32, i32), i32> =
        instance.get_typed_func(&mut store, "apply")?;

    // Prime input region once.
    let data = memory.data_mut(&mut store);
    for i in 0..(in_len as usize) {
        data[IN_PTR as usize + i] = INPUT_BYTE;
    }

    // Warm-up: 100 calls.
    for _ in 0..100 {
        apply.call(&mut store, (IN_PTR, in_len as i32, OUT_PTR))?;
    }

    let start = Instant::now();
    for _ in 0..ITERATIONS {
        apply.call(&mut store, (IN_PTR, in_len as i32, OUT_PTR))?;
    }
    let elapsed = start.elapsed();
    let total_ns = elapsed.as_nanos() as u64;
    let ns_per_iter = total_ns / ITERATIONS as u64;
    let fuel_per_ns = if ns_per_iter == 0 {
        f64::INFINITY
    } else {
        fuel as f64 / ns_per_iter as f64
    };

    println!(
        "mutator={name:<12} in_len={in_len:>4}  fuel_v1={fuel:>9}  ns_per_iter={ns_per_iter:>6}  fuel_per_ns={fuel_per_ns:>7.2}"
    );
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("rust/ should have a parent");

    let matrix: &[(&str, &[u64])] = &[
        ("nop", &[32][..]),
        ("identity", &[32, 256, 1024][..]),
        ("xor_5c", &[32, 256, 1024][..]),
        ("sum_bytes", &[32, 256, 1024][..]),
        ("thrash_copy", &[32, 256, 1024][..]),
    ];

    println!(
        "# DoS-resistance bench :: each entry runs {ITERATIONS} iterations after 100 warmup"
    );
    println!("# fuel_per_ns is canonical_v1_fuel / wall_clock_ns_per_apply_call");
    println!("# higher fuel_per_ns = mutator is charged MORE fuel per unit of wall-clock work");
    println!("# (high = safe / over-protected; low = potential DoS surface)");
    println!();

    for (name, sizes) in matrix {
        for &in_len in *sizes {
            run_one(probe_dir, name, in_len)?;
        }
    }
    Ok(())
}
