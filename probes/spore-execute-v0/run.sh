#!/usr/bin/env bash
# Re-run the spore-execute-v0 probe and verify rust/ts execution
# determinism.
#
# Assumes identity.wasm exists. If you edit identity.wat, regenerate
# via:  (cd wat-compile && cargo run)
#
# Exit 0 on GREEN (mutator_hash, output_bytes, output_hash all match
# between runtimes), 1 on RED.

set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f identity.wasm ]]; then
  echo "identity.wasm not found — regenerating from identity.wat..."
  (cd wat-compile && cargo run --quiet)
fi

echo "── ts (deno + V8) ──────────────────────────────────────"
deno run --allow-read ts/probe.ts | tee /tmp/spore-execute-v0.ts.out

echo
echo "── rust (cargo + wasmtime) ─────────────────────────────"
(cd rust && cargo run --quiet) | tee /tmp/spore-execute-v0.rust.out

echo
if diff -q /tmp/spore-execute-v0.ts.out /tmp/spore-execute-v0.rust.out >/dev/null; then
  echo "PROBE_GREEN — execution outputs byte-identical (TS V8 ↔ Rust wasmtime)"
  exit 0
else
  echo "PROBE_RED — outputs differ"
  diff /tmp/spore-execute-v0.ts.out /tmp/spore-execute-v0.rust.out || true
  exit 1
fi
