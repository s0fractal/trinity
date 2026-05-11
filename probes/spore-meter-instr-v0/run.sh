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
(cd rust && cargo run --release --quiet --bin instrument)

echo
echo "── deno (V8) runner ───────────────────────────────────"
deno run --allow-read ts/runner.ts | tee /tmp/spore-meter-instr-v0.deno.out

echo
echo "── wasmtime runner ────────────────────────────────────"
(cd rust && cargo run --release --quiet --bin wasmtime_runner) \
  | tee /tmp/spore-meter-instr-v0.wasmtime.out

echo
echo "── expected (fuel_v1 - 5 from meter #3) ───────────────"
EXPECTED=$(cat <<'EOF'
mutator=nop in_len=32 body_fuel_instr=1
mutator=identity in_len=32 body_fuel_instr=72
mutator=identity in_len=256 body_fuel_instr=520
mutator=identity in_len=1024 body_fuel_instr=2056
mutator=xor_5c in_len=32 body_fuel_instr=679
mutator=xor_5c in_len=256 body_fuel_instr=5383
mutator=xor_5c in_len=1024 body_fuel_instr=21511
mutator=sum_bytes in_len=32 body_fuel_instr=555
mutator=sum_bytes in_len=256 body_fuel_instr=4363
mutator=sum_bytes in_len=1024 body_fuel_instr=17419
EOF
)
echo "$EXPECTED" > /tmp/spore-meter-instr-v0.expected.out
echo "$EXPECTED"

echo
deno_ok=0
wasmtime_ok=0
cross_ok=0
if diff -q /tmp/spore-meter-instr-v0.deno.out /tmp/spore-meter-instr-v0.expected.out >/dev/null; then
  deno_ok=1
fi
if diff -q /tmp/spore-meter-instr-v0.wasmtime.out /tmp/spore-meter-instr-v0.expected.out >/dev/null; then
  wasmtime_ok=1
fi
if diff -q /tmp/spore-meter-instr-v0.deno.out /tmp/spore-meter-instr-v0.wasmtime.out >/dev/null; then
  cross_ok=1
fi

if [ $deno_ok -eq 1 ] && [ $wasmtime_ok -eq 1 ] && [ $cross_ok -eq 1 ]; then
  echo "PROBE_GREEN — V8 ↔ Wasmtime ↔ meter#3 all byte-identical on body_fuel"
  exit 0
else
  echo "PROBE_RED — instrumented body_fuel disagreement"
  echo "  deno_matches_expected=$deno_ok"
  echo "  wasmtime_matches_expected=$wasmtime_ok"
  echo "  deno_matches_wasmtime=$cross_ok"
  echo "── deno vs expected ──"
  diff /tmp/spore-meter-instr-v0.deno.out /tmp/spore-meter-instr-v0.expected.out || true
  echo "── wasmtime vs expected ──"
  diff /tmp/spore-meter-instr-v0.wasmtime.out /tmp/spore-meter-instr-v0.expected.out || true
  echo "── deno vs wasmtime ──"
  diff /tmp/spore-meter-instr-v0.deno.out /tmp/spore-meter-instr-v0.wasmtime.out || true
  exit 1
fi
