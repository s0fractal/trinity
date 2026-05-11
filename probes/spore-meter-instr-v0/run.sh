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
  echo "measurement stage: GREEN"
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

echo
echo "── deno (V8) enforce ──────────────────────────────────"
deno run --allow-read ts/enforce.ts | tee /tmp/spore-meter-instr-v0.deno.enforce.out

echo
echo "── wasmtime enforce ───────────────────────────────────"
(cd rust && cargo run --release --quiet --bin wasmtime_enforce) \
  | tee /tmp/spore-meter-instr-v0.wasmtime.enforce.out

echo
# Enforce stage check:
#   - SUCCESS rows MUST have final_fuel == budget
#   - TRAP rows MUST have final_fuel <= budget (and result == TRAP)
#   - Deno and Wasmtime MUST produce byte-identical enforce output
check_enforce() {
  local file="$1"
  local engine="$2"
  while IFS= read -r line; do
    # Parse: mutator=X in_len=N budget=B result=R final_fuel=F
    local budget result fuel
    budget=$(echo "$line" | sed -n 's/.*budget=\([0-9]*\).*/\1/p')
    result=$(echo "$line" | sed -n 's/.*result=\([A-Z]*\).*/\1/p')
    fuel=$(echo "$line" | sed -n 's/.*final_fuel=\([0-9]*\).*/\1/p')
    if [ "$result" = "SUCCESS" ]; then
      if [ "$fuel" != "$budget" ]; then
        echo "[$engine] SUCCESS row final_fuel($fuel) != budget($budget): $line" >&2
        return 1
      fi
    elif [ "$result" = "TRAP" ]; then
      if [ "$fuel" -gt "$budget" ]; then
        echo "[$engine] TRAP row final_fuel($fuel) > budget($budget): $line" >&2
        return 1
      fi
    else
      echo "[$engine] unrecognized result: $line" >&2
      return 1
    fi
  done < "$file"
  return 0
}

enforce_ok=1
check_enforce /tmp/spore-meter-instr-v0.deno.enforce.out "deno" || enforce_ok=0
check_enforce /tmp/spore-meter-instr-v0.wasmtime.enforce.out "wasmtime" || enforce_ok=0
if ! diff -q /tmp/spore-meter-instr-v0.deno.enforce.out \
              /tmp/spore-meter-instr-v0.wasmtime.enforce.out >/dev/null; then
  echo "deno and wasmtime enforce outputs differ" >&2
  diff /tmp/spore-meter-instr-v0.deno.enforce.out /tmp/spore-meter-instr-v0.wasmtime.enforce.out >&2
  enforce_ok=0
fi

# Cross-check: each cell must have exactly one SUCCESS and one TRAP row.
expected_success=10
expected_trap=10
actual_success=$(grep -c "result=SUCCESS" /tmp/spore-meter-instr-v0.deno.enforce.out || true)
actual_trap=$(grep -c "result=TRAP" /tmp/spore-meter-instr-v0.deno.enforce.out || true)
if [ "$actual_success" != "$expected_success" ] || [ "$actual_trap" != "$expected_trap" ]; then
  echo "expected $expected_success SUCCESS + $expected_trap TRAP rows; got $actual_success SUCCESS + $actual_trap TRAP" >&2
  enforce_ok=0
fi

if [ $enforce_ok -eq 1 ]; then
  echo "enforce stage: GREEN ($actual_success SUCCESS rows at budget=body_fuel, $actual_trap TRAP rows at budget=body_fuel-1, V8 ↔ wasmtime byte-identical)"
  echo
  echo "PROBE_GREEN — measurement + enforcement, V8 ↔ Wasmtime ↔ meter#3 all byte-identical"
  exit 0
else
  echo "PROBE_RED — enforce stage failed"
  exit 1
fi
