#!/usr/bin/env bash
# Negative-determinism probe for SPORE.v0 banned WASM subset.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "── rust validator ─────────────────────────────────────"
(cd rust && cargo run --quiet) | tee /tmp/spore-reject-v0.rust.out

echo
echo "── ts validator ───────────────────────────────────────"
deno run --allow-read ts/probe.ts | tee /tmp/spore-reject-v0.ts.out

echo
if diff -q /tmp/spore-reject-v0.rust.out /tmp/spore-reject-v0.ts.out >/dev/null; then
  echo "PROBE_GREEN — v0 banned-subset rejection byte-identical (Rust ↔ TS)"
  exit 0
else
  echo "PROBE_RED — validators disagree"
  diff /tmp/spore-reject-v0.rust.out /tmp/spore-reject-v0.ts.out || true
  exit 1
fi

