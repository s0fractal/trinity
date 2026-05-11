#!/usr/bin/env bash
# Meter #3 (execution-aware walker). Runs the exec meter and also
# the static meters from spore-meter-v0 for side-by-side comparison.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "── meter #3 — execution-aware walker ───────────────────"
(cd rust && cargo run --quiet) | tee /tmp/spore-meter.exec.out

echo
echo "── meter #1 + #2 — static walkers (for comparison) ─────"
STATIC_RAW="/tmp/spore-meter.static.raw.out"
bash "$SCRIPT_DIR/../spore-meter-v0/run.sh" > "$STATIC_RAW" 2>&1
awk '/^mutator=/ { print; if (++n == 10) exit }' "$STATIC_RAW" \
  | tee /tmp/spore-meter.static.out

echo
echo "── diff: exec vs static ─────────────────────────────────"
paste <(awk '{print $1, $2, $3}' /tmp/spore-meter.exec.out) \
      <(awk '{print $3}' /tmp/spore-meter.static.out) \
  | awk '{
      exec_val = $3; sub(/.*=/, "", exec_val);
      static_val = $4; sub(/.*=/, "", static_val);
      diff = exec_val - static_val;
      printf "%-32s exec=%-8s static=%-8s diff=%+d\n", $1" "$2, exec_val, static_val, diff
    }'
