#!/usr/bin/env bash
# substrate-court-v0 probe runner.
#
# Orchestrates three witness subprocesses + one court subprocess.
# Asserts:
#   Scenario A: three honest witnesses → court verdict agreement=true
#   Scenario B: one tampered witness   → court verdict agreement=false
#                                        with kind=body_hash_divergence
#   Scenario C: one forward-schema     → court verdict agreement=false
#                                        with kind=schema_mismatch

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

BODY="$HERE/fixtures/body.json"
WITNESS="$HERE/ts/witness.ts"
COURT="$HERE/ts/court.ts"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ────────────────────────────────────────────────────────────────
# Scenario A — three honest witnesses
# ────────────────────────────────────────────────────────────────

echo "==> Scenario A: three honest witnesses (trinity / liquid / omega)"

deno run --allow-read --allow-env "$WITNESS" --substrate-tag trinity --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_trinity.json" 2>>"$WORK/witness_stderr.log"
deno run --allow-read --allow-env "$WITNESS" --substrate-tag liquid --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_liquid.json" 2>>"$WORK/witness_stderr.log"
deno run --allow-read --allow-env "$WITNESS" --substrate-tag omega --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_omega.json" 2>>"$WORK/witness_stderr.log"

deno run --allow-read "$COURT" \
  --envelope "$WORK/env_trinity.json" \
  --envelope "$WORK/env_liquid.json" \
  --envelope "$WORK/env_omega.json" \
  > "$WORK/verdict_A.json"

verdict_A_agreement=$(jq -r .agreement "$WORK/verdict_A.json")
verdict_A_witnesses=$(jq -r .witnesses_count "$WORK/verdict_A.json")
body_hashes_unique=$(jq -r '.body_hashes | to_entries | map(.value) | unique | length' "$WORK/verdict_A.json")
envelope_ids_unique=$(jq -r '.envelope_ids | to_entries | map(.value) | unique | length' "$WORK/verdict_A.json")

echo "    agreement=$verdict_A_agreement witnesses=$verdict_A_witnesses body_hash_unique=$body_hashes_unique envelope_id_unique=$envelope_ids_unique"

if [ "$verdict_A_agreement" != "true" ]; then
  echo "FAIL: Scenario A — expected agreement=true"
  cat "$WORK/verdict_A.json"
  exit 1
fi
if [ "$body_hashes_unique" != "1" ]; then
  echo "FAIL: Scenario A — expected exactly 1 unique body_hash, got $body_hashes_unique"
  exit 1
fi
if [ "$envelope_ids_unique" != "3" ]; then
  echo "FAIL: Scenario A — expected 3 unique envelope_ids, got $envelope_ids_unique"
  exit 1
fi

echo "    ✓ Scenario A passed"
echo

# ────────────────────────────────────────────────────────────────
# Scenario B — one tampered witness
# ────────────────────────────────────────────────────────────────

echo "==> Scenario B: one tampered witness (liquid flips a body byte)"

deno run --allow-read --allow-env "$WITNESS" --substrate-tag trinity --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_trinity_B.json" 2>>"$WORK/witness_stderr.log"
TAMPER_BODY=1 deno run --allow-read --allow-env "$WITNESS" --substrate-tag liquid --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_liquid_B.json" 2>>"$WORK/witness_stderr.log"
deno run --allow-read --allow-env "$WITNESS" --substrate-tag omega --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_omega_B.json" 2>>"$WORK/witness_stderr.log"

set +e
deno run --allow-read "$COURT" \
  --envelope "$WORK/env_trinity_B.json" \
  --envelope "$WORK/env_liquid_B.json" \
  --envelope "$WORK/env_omega_B.json" \
  > "$WORK/verdict_B.json"
court_B_exit=$?
set -e

verdict_B_agreement=$(jq -r .agreement "$WORK/verdict_B.json")
verdict_B_conflicts_n=$(jq -r '.conflicts | length' "$WORK/verdict_B.json")
verdict_B_first_kind=$(jq -r '.conflicts[0].kind' "$WORK/verdict_B.json")

echo "    agreement=$verdict_B_agreement conflicts=$verdict_B_conflicts_n first_kind=$verdict_B_first_kind court_exit=$court_B_exit"

if [ "$verdict_B_agreement" != "false" ]; then
  echo "FAIL: Scenario B — expected agreement=false"
  cat "$WORK/verdict_B.json"
  exit 1
fi
if [ "$verdict_B_first_kind" != "body_hash_divergence" ]; then
  echo "FAIL: Scenario B — expected first conflict body_hash_divergence, got $verdict_B_first_kind"
  cat "$WORK/verdict_B.json"
  exit 1
fi
if [ "$court_B_exit" = "0" ]; then
  echo "FAIL: Scenario B — court must exit non-zero on disagreement"
  exit 1
fi

echo "    ✓ Scenario B passed (tamper detected)"
echo

# ────────────────────────────────────────────────────────────────
# Scenario C — forward-compat schema mismatch
# ────────────────────────────────────────────────────────────────

echo "==> Scenario C: one witness emits forward-schema (trinity.receipt-envelope.v0.0)"

deno run --allow-read --allow-env "$WITNESS" --substrate-tag trinity --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_trinity_C.json" 2>>"$WORK/witness_stderr.log"
FAKE_SCHEMA="trinity.receipt-envelope.v0.0" deno run --allow-read --allow-env "$WITNESS" --substrate-tag liquid --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_liquid_C.json" 2>>"$WORK/witness_stderr.log"
deno run --allow-read --allow-env "$WITNESS" --substrate-tag omega --body-kind substrate_health --body "$BODY" \
  > "$WORK/env_omega_C.json" 2>>"$WORK/witness_stderr.log"

set +e
deno run --allow-read "$COURT" \
  --envelope "$WORK/env_trinity_C.json" \
  --envelope "$WORK/env_liquid_C.json" \
  --envelope "$WORK/env_omega_C.json" \
  > "$WORK/verdict_C.json"
court_C_exit=$?
set -e

verdict_C_agreement=$(jq -r .agreement "$WORK/verdict_C.json")
verdict_C_schema_mismatch=$(jq -r '.conflicts[] | select(.kind == "schema_mismatch") | .substrate' "$WORK/verdict_C.json")

echo "    agreement=$verdict_C_agreement schema_mismatch_for=$verdict_C_schema_mismatch court_exit=$court_C_exit"

if [ "$verdict_C_agreement" != "false" ]; then
  echo "FAIL: Scenario C — expected agreement=false"
  exit 1
fi
if [ "$verdict_C_schema_mismatch" != "liquid" ]; then
  echo "FAIL: Scenario C — expected schema_mismatch for liquid, got $verdict_C_schema_mismatch"
  exit 1
fi

echo "    ✓ Scenario C passed (schema mismatch detected)"
echo

# ────────────────────────────────────────────────────────────────

echo "==> All scenarios passed."
echo
echo "Diagnostic log (witness stderr):"
cat "$WORK/witness_stderr.log" | sed 's/^/    /'
