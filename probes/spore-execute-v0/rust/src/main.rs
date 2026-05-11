// spore-execute-v0 probe — Rust / wasmtime implementation.
//
// Iterates over the mutator matrix. For each mutator: loads the WASM
// from disk, computes mutator_hash, executes its `apply` export over
// a fixed 32-byte input (0xAB × 32), reads the output bytes, computes
// output_hash. Mutators that trap produce a single
// `mutator=X mutator_hash=Y trapped=true` line instead.

use std::fs;
use std::path::{Path, PathBuf};

use wasmtime::{Engine, Instance, Module, Store, TypedFunc};

const DOMAIN_MUTATOR: &str = "spore.mutator.v0";
const DOMAIN_OUTPUT: &str = "spore.output.v0";

const INPUT_BYTE: u8 = 0xAB;
const INPUT_LEN: usize = 32;
const IN_PTR: i32 = 0;
const OUT_PTR: i32 = 64;

const MUTATORS: &[&str] = &[
    "identity",
    "xor_5c",
    "sum_bytes",
    "trap_div0",
    "trap_unreachable",
    "trap_oob",
];

fn to_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn try_run(probe_dir: &Path, name: &str) {
    let wasm_path = probe_dir.join(format!("{name}.wasm"));
    let wasm_bytes = match fs::read(&wasm_path) {
        Ok(b) => b,
        Err(e) => {
            println!("mutator={name} error=read_failed:{e}");
            return;
        }
    };
    let mutator_hash = blake3::derive_key(DOMAIN_MUTATOR, &wasm_bytes);
    let mh_hex = to_hex(&mutator_hash);

    let engine = Engine::default();
    let module = match Module::from_binary(&engine, &wasm_bytes) {
        Ok(m) => m,
        Err(e) => {
            println!("mutator={name} mutator_hash={mh_hex} error=compile_failed:{e}");
            return;
        }
    };
    let mut store: Store<()> = Store::new(&engine, ());
    let instance = match Instance::new(&mut store, &module, &[]) {
        Ok(i) => i,
        Err(e) => {
            println!("mutator={name} mutator_hash={mh_hex} error=instantiate_failed:{e}");
            return;
        }
    };

    let memory = match instance.get_memory(&mut store, "memory") {
        Some(m) => m,
        None => {
            println!("mutator={name} mutator_hash={mh_hex} error=memory_missing");
            return;
        }
    };
    let apply: TypedFunc<(i32, i32, i32), i32> =
        match instance.get_typed_func(&mut store, "apply") {
            Ok(f) => f,
            Err(e) => {
                println!("mutator={name} mutator_hash={mh_hex} error=apply_missing:{e}");
                return;
            }
        };

    let data = memory.data_mut(&mut store);
    for i in 0..INPUT_LEN {
        data[IN_PTR as usize + i] = INPUT_BYTE;
    }

    let result = apply.call(&mut store, (IN_PTR, INPUT_LEN as i32, OUT_PTR));
    match result {
        Err(_) => {
            // Wasmtime returns Err on trap; we do not depend on the trap-kind
            // text matching ts, so just signal that a trap occurred.
            println!("mutator={name} mutator_hash={mh_hex} trapped=true");
        }
        Ok(out_len) => {
            let out_len = out_len as usize;
            let data = memory.data(&store);
            let output_bytes =
                &data[OUT_PTR as usize..OUT_PTR as usize + out_len];
            let output_hash = blake3::derive_key(DOMAIN_OUTPUT, output_bytes);
            println!(
                "mutator={name} mutator_hash={mh_hex} out_len={out_len} output_bytes={} output_hash={}",
                to_hex(output_bytes),
                to_hex(&output_hash)
            );
        }
    }
}

fn main() {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("rust/ should have a parent");

    for name in MUTATORS {
        try_run(probe_dir, name);
    }
}
