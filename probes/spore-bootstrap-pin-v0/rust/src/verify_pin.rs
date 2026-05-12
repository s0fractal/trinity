// spore-bootstrap-pin-v0 :: verify_pin
//
// Reads the manifest at contracts/SPORE_BOOTSTRAP_PIN.v0.md, extracts
// the (path, hash) pairs from the "Pin Manifest" markdown table, and
// re-hashes each listed file with BLAKE3-256. Exits 0 only if every
// recomputed hash equals the manifest hash.
//
// The contract is the single source of truth for what is pinned.
// `file_list.txt` is informational; it is consumed by compute_hashes
// when populating or repinning the manifest.

use std::env;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

const MANIFEST_REL: &str = "contracts/SPORE_BOOTSTRAP_PIN.v0.md";

fn repo_root() -> PathBuf {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    here.parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent())
        .expect("could not resolve repo root")
        .to_path_buf()
}

/// Parse pairs of (path, hash) from the markdown manifest table.
/// Table rows look like: `| path | hash |` (with surrounding pipes
/// and optional spaces). Header and divider rows are skipped.
fn parse_manifest_table(manifest_text: &str) -> Vec<(String, String)> {
    let mut out = vec![];
    let mut in_table = false;
    for line in manifest_text.lines() {
        let trimmed = line.trim();
        if !trimmed.starts_with('|') {
            in_table = false;
            continue;
        }
        // It is a pipe-row.
        if !in_table {
            // Detect header vs divider. The header has alphabetic
            // characters; the divider has only -, :, and pipes.
            let is_divider = trimmed
                .chars()
                .all(|c| matches!(c, '|' | '-' | ':' | ' '));
            if is_divider {
                in_table = true;
            }
            continue;
        }
        // Body row.
        let cells: Vec<&str> = trimmed
            .trim_matches('|')
            .split('|')
            .map(|s| s.trim())
            .collect();
        if cells.len() != 2 {
            continue;
        }
        let path = cells[0].trim_matches('`').to_string();
        let hash = cells[1].trim_matches('`').to_string();
        if path.is_empty() || hash.is_empty() {
            continue;
        }
        // Validate that the hash looks like 64 hex chars (BLAKE3-256).
        if hash.len() == 64 && hash.chars().all(|c| c.is_ascii_hexdigit()) {
            out.push((path, hash));
        }
    }
    out
}

/// Compute the bootstrap root hash from the parsed manifest entries.
/// Canonical serialization:
///   for each (path, hash) in order:
///     emit "<path>  <hash>\n"
/// (two spaces between path and hash; LF newlines; no trailing newline
/// after the final entry).
fn bootstrap_root(pinned: &[(String, String)]) -> String {
    let mut buf = String::new();
    for (i, (path, hash)) in pinned.iter().enumerate() {
        if i > 0 {
            buf.push('\n');
        }
        buf.push_str(path);
        buf.push(' ');
        buf.push(' ');
        buf.push_str(hash);
    }
    blake3::hash(buf.as_bytes()).to_hex().to_string()
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = env::args().collect();
    let print_root_only = args.iter().any(|a| a == "--print-root");

    let root = repo_root();
    let manifest_path = root.join(MANIFEST_REL);
    let manifest_text = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("read manifest {}: {}", manifest_path.display(), e))?;

    let pinned = parse_manifest_table(&manifest_text);
    if pinned.is_empty() {
        return Err("no pinned entries parsed from manifest".into());
    }

    if print_root_only {
        println!("{}", bootstrap_root(&pinned));
        return Ok(());
    }

    let mut mismatches: Vec<(String, String, String)> = vec![];
    let mut ok_count = 0u32;
    for (path_rel, expected_hex) in &pinned {
        let path_abs = root.join(path_rel);
        let bytes = match fs::read(&path_abs) {
            Ok(b) => b,
            Err(e) => {
                mismatches.push((path_rel.clone(), expected_hex.clone(), format!("READ_ERROR: {}", e)));
                continue;
            }
        };
        let actual_hex = blake3::hash(&bytes).to_hex().to_string();
        if &actual_hex == expected_hex {
            ok_count += 1;
        } else {
            mismatches.push((path_rel.clone(), expected_hex.clone(), actual_hex));
        }
    }

    if mismatches.is_empty() {
        let root_hex = bootstrap_root(&pinned);
        println!(
            "spore-bootstrap-pin-v0: PIN_GREEN — {} pinned files, all BLAKE3-256 hashes match",
            ok_count
        );
        println!("bootstrap_root_blake3: {}", root_hex);
        Ok(())
    } else {
        eprintln!("spore-bootstrap-pin-v0: PIN_RED — {} mismatches", mismatches.len());
        for (path, expected, actual) in &mismatches {
            eprintln!("  {}", path);
            eprintln!("    expected: {}", expected);
            eprintln!("    actual:   {}", actual);
        }
        std::process::exit(1);
    }
}
