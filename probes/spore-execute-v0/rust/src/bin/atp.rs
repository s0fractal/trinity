// spore-execute-v0 :: ATP / fuel accounting probe
//
// Enables wasmtime fuel metering and records fuel consumed per
// (mutator, input_len) pair. The point of this probe is to show:
//
//   1. Fuel cost is deterministic for the same mutator + same input
//      across multiple runs (re-run the probe, identical numbers).
//   2. Fuel cost scales predictably with input length for mutators
//      that loop over input bytes.
//   3. A `nop` mutator gives the apply-boundary cost (≈ C_apply_base
//      from the contract).
//
// This is the rust-canonical ATP reference. V8 has no native fuel
// metering, so there is no direct deno equivalent; cross-runtime
// ATP agreement is a future probe.

use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};

use wasmtime::{Config, Engine, Instance, Module, Store, TypedFunc};

const DOMAIN_MUTATOR: &str = "spore.mutator.v0";
const DOMAIN_OUTPUT: &str = "spore.output.v0";

const INPUT_BYTE: u8 = 0xAB;
const IN_PTR: i32 = 0;
const OUT_PTR: i32 = 4096; // far from input region; safe for 1024-byte inputs

const FUEL_BUDGET: u64 = 10_000_000;

/// (mutator name, list of input lengths to test)
const MATRIX: &[(&str, &[usize])] = &[
    ("nop", &[32]),
    ("identity", &[32, 256, 1024]),
    ("xor_5c", &[32, 256, 1024]),
    ("sum_bytes", &[32, 256, 1024]),
];

fn to_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn run_once(
    probe_dir: &Path,
    name: &str,
    in_len: usize,
) -> Result<(u64, Vec<u8>, [u8; 32], [u8; 32]), Box<dyn Error>> {
    let wasm_path = probe_dir.join(format!("{name}.wasm"));
    let wasm_bytes = fs::read(&wasm_path)?;
    let mutator_hash = blake3::derive_key(DOMAIN_MUTATOR, &wasm_bytes);

    let mut config = Config::new();
    config.consume_fuel(true);
    let engine = Engine::new(&config)?;
    let module = Module::from_binary(&engine, &wasm_bytes)?;
    let mut store: Store<()> = Store::new(&engine, ());
    store.set_fuel(FUEL_BUDGET)?;
    let instance = Instance::new(&mut store, &module, &[])?;

    let memory = instance
        .get_memory(&mut store, "memory")
        .ok_or("memory export missing")?;
    let apply: TypedFunc<(i32, i32, i32), i32> =
        instance.get_typed_func(&mut store, "apply")?;

    let data = memory.data_mut(&mut store);
    for i in 0..in_len {
        data[IN_PTR as usize + i] = INPUT_BYTE;
    }

    let fuel_before = store.get_fuel()?;
    let out_len = apply.call(&mut store, (IN_PTR, in_len as i32, OUT_PTR))? as usize;
    let fuel_after = store.get_fuel()?;
    let fuel_consumed = fuel_before - fuel_after;

    let data = memory.data(&store);
    let output_bytes = data[OUT_PTR as usize..OUT_PTR as usize + out_len].to_vec();
    let output_hash = blake3::derive_key(DOMAIN_OUTPUT, &output_bytes);

    Ok((fuel_consumed, output_bytes, mutator_hash, output_hash))
}

fn main() -> Result<(), Box<dyn Error>> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("rust/ should have a parent");

    for (name, in_lens) in MATRIX {
        for &in_len in *in_lens {
            // Run twice to assert run-to-run determinism.
            let (fuel_a, _, mh_a, oh_a) = run_once(probe_dir, name, in_len)?;
            let (fuel_b, _, mh_b, oh_b) = run_once(probe_dir, name, in_len)?;
            assert_eq!(fuel_a, fuel_b, "fuel must be deterministic across runs");
            assert_eq!(mh_a, mh_b, "mutator_hash must be deterministic");
            assert_eq!(oh_a, oh_b, "output_hash must be deterministic");

            println!(
                "mutator={name} in_len={in_len} fuel={fuel_a} mutator_hash={} output_hash={}",
                to_hex(&mh_a),
                to_hex(&oh_a)
            );
        }
    }
    Ok(())
}
