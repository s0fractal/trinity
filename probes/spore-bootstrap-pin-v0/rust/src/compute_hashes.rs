// spore-bootstrap-pin-v0 :: compute_hashes
//
// Reads the canonical bootstrap file list (one path per line) from
// the file passed as argv[1], computes BLAKE3-256 of each file
// relative to the repo root, and prints a manifest-style line per
// file:
//
//   <hash>  <path>
//
// Used both to bootstrap the manifest (one-time) and as part of the
// verifier (re-compute and compare against stored hashes).

use std::env;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

fn repo_root() -> PathBuf {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    here.parent() // .../probes/spore-bootstrap-pin-v0/rust → .../spore-bootstrap-pin-v0
        .and_then(|p| p.parent()) // → .../probes
        .and_then(|p| p.parent()) // → repo root
        .expect("could not resolve repo root")
        .to_path_buf()
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("usage: compute_hashes <list_file>");
        std::process::exit(2);
    }
    let list_path = &args[1];
    let list = fs::read_to_string(list_path)?;
    let root = repo_root();
    for line in list.lines() {
        let path_rel = line.trim();
        if path_rel.is_empty() || path_rel.starts_with('#') {
            continue;
        }
        let path_abs = root.join(path_rel);
        let bytes = fs::read(&path_abs)
            .map_err(|e| format!("read {}: {}", path_rel, e))?;
        let hash = blake3::hash(&bytes);
        println!("{}  {}", hash.to_hex(), path_rel);
    }
    Ok(())
}
