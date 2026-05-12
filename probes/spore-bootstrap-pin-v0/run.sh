#!/usr/bin/env bash
# spore-bootstrap-pin-v0 :: verify the bootstrap pin manifest.
#
# Recomputes BLAKE3-256 of every file listed in
# contracts/SPORE_BOOTSTRAP_PIN.v0.md and compares against the
# manifest entry. Prints the bootstrap root hash on success.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

(cd rust && cargo run --release --quiet --bin verify_pin)
