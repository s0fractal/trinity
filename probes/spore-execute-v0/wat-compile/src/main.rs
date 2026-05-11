// One-shot WAT → WASM compiler for the execute probe.
// Compiles every *.wat in the probe directory to a matching *.wasm.

use std::fs;
use std::path::PathBuf;

fn main() {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let probe_dir = here.parent().expect("wat-compile/ should have a parent");

    let mut count = 0;
    for entry in fs::read_dir(probe_dir).expect("read probe dir") {
        let path = entry.expect("entry").path();
        if path.extension().and_then(|s| s.to_str()) != Some("wat") {
            continue;
        }
        let wasm_path = path.with_extension("wasm");
        let wat_src = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("read {}: {}", path.display(), e));
        let wasm_bytes = wat::parse_str(&wat_src)
            .unwrap_or_else(|e| panic!("parse {}: {}", path.display(), e));
        fs::write(&wasm_path, &wasm_bytes)
            .unwrap_or_else(|e| panic!("write {}: {}", wasm_path.display(), e));
        println!(
            "compiled {} bytes → {}",
            wasm_bytes.len(),
            wasm_path.display()
        );
        count += 1;
    }
    println!("{count} mutator(s) compiled");
}
