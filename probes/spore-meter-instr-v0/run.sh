#!/usr/bin/env bash
# spore-meter-instr-v0 probe runner.
#
# 1. Build & run the rust instrumenter (writes to /tmp/spore-meter-instr-v0/).
# 2. Run the deno runner against the instrumented modules.
# 3. Compare to expected body-fuel values (fuel_v1 - C_apply_base, where
#    C_apply_base = 5 for argc = 1).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "── rust instrumenter ──────────────────────────────────"
(cd rust && cargo run --release --quiet)

echo
echo "── deno runner ────────────────────────────────────────"
deno run --allow-read ts/runner.ts | tee /tmp/spore-meter-instr-v0.runner.out

echo
echo "── expected (fuel_v1 - 5 from meter #3) ───────────────"
EXPECTED=$(cat <<'EOF'
mutator=nop in_len=32 body_fuel_instr=1
mutator=identity in_len=32 body_fuel_instr=72
mutator=identity in_len=256 body_fuel_instr=520
mutator=identity in_len=1024 body_fuel_instr=2056
EOF
)
echo "$EXPECTED" > /tmp/spore-meter-instr-v0.expected.out
echo "$EXPECTED"

echo
if diff -q /tmp/spore-meter-instr-v0.runner.out /tmp/spore-meter-instr-v0.expected.out >/dev/null; then
  echo "PROBE_GREEN — instrumented body_fuel matches meter #3 body_fuel exactly"
  exit 0
else
  echo "PROBE_RED — instrumented body_fuel differs from meter #3 body_fuel"
  diff /tmp/spore-meter-instr-v0.runner.out /tmp/spore-meter-instr-v0.expected.out || true
  exit 1
fi
