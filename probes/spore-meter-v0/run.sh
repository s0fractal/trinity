#!/usr/bin/env bash
# Reference v1 fuel meters — runs meter #1 (rust + wasmparser) and
# meter #2 (deno + hand-rolled WASM parser), then diffs.
#
# This is the F-FUEL-3 falsifier test: two independent meters must
# agree exactly on the test corpus.

set -euo pipefail
cd "$(dirname "$0")"

echo "── rust meter #1 (wasmparser) ──────────────────────────"
(cd rust && cargo run --quiet) | tee /tmp/spore-meter.rust.out

echo
echo "── ts meter #2 (hand-rolled parser) ────────────────────"
deno run --allow-read ts/meter.ts | tee /tmp/spore-meter.ts.out

echo
if diff -q /tmp/spore-meter.rust.out /tmp/spore-meter.ts.out >/dev/null; then
  echo "METERS_AGREE — F-FUEL-3 held up (rust ↔ ts meters byte-identical)"
  exit 0
else
  echo "METERS_DISAGREE — F-FUEL-3 fires"
  diff /tmp/spore-meter.rust.out /tmp/spore-meter.ts.out || true
  exit 1
fi
