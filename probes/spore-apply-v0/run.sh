#!/usr/bin/env bash
# Re-run the spore-apply-v0 probe and verify rust/ts byte-equivalence.
#
# Exit 0 on GREEN (outputs identical), 1 on RED (any byte differs).

set -euo pipefail
cd "$(dirname "$0")"

echo "── ts (deno) ───────────────────────────────────────────"
deno run -A ts/probe.ts | tee /tmp/spore-apply-v0.ts.out

echo
echo "── rust (cargo) ────────────────────────────────────────"
(cd rust && cargo run --quiet) | tee /tmp/spore-apply-v0.rust.out

echo
echo "── python (venv) ───────────────────────────────────────"
(cd python && source venv/bin/activate && python3 probe.py) | tee /tmp/spore-apply-v0.python.out

echo
if diff -q /tmp/spore-apply-v0.ts.out /tmp/spore-apply-v0.rust.out >/dev/null && diff -q /tmp/spore-apply-v0.ts.out /tmp/spore-apply-v0.python.out >/dev/null; then
  echo "PROBE_GREEN — outputs byte-identical across TS, Rust, Python"
  exit 0
else
  echo "PROBE_RED — outputs differ"
  diff /tmp/spore-apply-v0.ts.out /tmp/spore-apply-v0.rust.out || true
  diff /tmp/spore-apply-v0.ts.out /tmp/spore-apply-v0.python.out || true
  exit 1
fi
