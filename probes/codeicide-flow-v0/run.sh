#!/usr/bin/env bash
# codeicide-flow-v0 — end-to-end governance flow demonstration.
#
# Acceptance: all 5 scenarios pass; no leftover archive/ entries from
# this probe; exit 0.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"

FIXTURES="$HERE/fixtures"
WORK="$(mktemp -d)"
mkdir -p "$FIXTURES"

# Track archive directories we create so we can clean up.
PROBE_ARCHIVES=()
cleanup() {
  for adir in "${PROBE_ARCHIVES[@]:-}"; do
    if [ -d "$adir" ]; then
      rm -rf "$adir"
    fi
  done
  rm -rf "$WORK"
  rm -rf "$FIXTURES"
}
trap cleanup EXIT

# Helper: extract envelope from a propose/cowitness/verdict emit payload.
extract_envelope() {
  jq -c '.envelope // .' "$1"
}

# Helper: most recent archive dir under archive/
latest_archive() {
  ls -td "$ROOT/archive"/*/ 2>/dev/null | head -1 | sed 's|/$||'
}

# ──────────────────────────────────────────────────────────────
# Scenario A: happy path
# ──────────────────────────────────────────────────────────────

echo "==> Scenario A: propose → 3 cowitnesses → AYE → apply → resurrect"

mkdir -p "$FIXTURES"
echo "Sacrifice A content $(date +%s)" > "$FIXTURES/sacrifice-A.txt"
TARGET_A="probes/codeicide-flow-v0/fixtures/sacrifice-A.txt"

./t propose --target "$TARGET_A" --reason "Scenario A: probe fixture" \
  --evidence "ephemeral test file in probe fixtures/" \
  --out "$WORK/propose-A.json" >/dev/null

extract_envelope "$WORK/propose-A.json" > "$WORK/env-A-0.json"

# 3 sequential cowitnesses (chain grows: claude → codex → gemini).
< "$WORK/env-A-0.json" ./t cowitness --stdin --oracle claude-opus-4-7 --substrate claude_oracle \
  | jq -c '.envelope' > "$WORK/env-A-1.json"
< "$WORK/env-A-1.json" ./t cowitness --stdin --oracle codex-gpt-5 --substrate codex_oracle \
  | jq -c '.envelope' > "$WORK/env-A-2.json"
< "$WORK/env-A-2.json" ./t cowitness --stdin --oracle gemini-3-1-pro --substrate gemini_oracle \
  | jq -c '.envelope' > "$WORK/env-A-3.json"

./t verdict "$WORK/env-A-3.json" > "$WORK/verdict-A.json" || true
verdict_A=$(jq -r '.result.verdict' "$WORK/verdict-A.json")
agreement_A=$(jq -r '.result.agreement' "$WORK/verdict-A.json")
aye_count_A=$(jq -r '.result.aye_signers | length' "$WORK/verdict-A.json")

echo "    verdict=$verdict_A agreement=$agreement_A aye_signers=$aye_count_A"
[ "$verdict_A" = "AYE" ] || { echo "FAIL Scenario A: expected AYE, got $verdict_A"; cat "$WORK/verdict-A.json"; exit 1; }
[ "$agreement_A" = "true" ] || { echo "FAIL Scenario A: agreement not true"; exit 1; }
[ "$aye_count_A" = "3" ] || { echo "FAIL Scenario A: expected 3 aye_signers, got $aye_count_A"; exit 1; }

# Apply.
./t apply-codeicide --proposal "$WORK/env-A-3.json" --verdict "$WORK/verdict-A.json" > "$WORK/apply-A.json"
archive_A=$(jq -r '.archived_to' "$WORK/apply-A.json")
echo "    archived_to: $archive_A"
PROBE_ARCHIVES+=("$ROOT/$(echo "$archive_A" | cut -d/ -f1-2)")

# Assert file gone from original, present in archive.
[ ! -f "$ROOT/$TARGET_A" ] || { echo "FAIL Scenario A: target still at original path"; exit 1; }
[ -f "$ROOT/$archive_A" ] || { echo "FAIL Scenario A: archived file missing"; exit 1; }

# Resurrect.
resurrect_path="$ROOT/$(jq -r '.resurrect_at' "$WORK/apply-A.json")"
[ -x "$resurrect_path" ] || { echo "FAIL Scenario A: RESURRECT.sh not executable"; exit 1; }
bash "$resurrect_path" >/dev/null

[ -f "$ROOT/$TARGET_A" ] || { echo "FAIL Scenario A: target not resurrected"; exit 1; }
echo "    ✓ Scenario A passed"
echo

# ──────────────────────────────────────────────────────────────
# Scenario B: PENDING blocks apply
# ──────────────────────────────────────────────────────────────

echo "==> Scenario B: 1 cowitness → PENDING → apply refused"

echo "Sacrifice B content" > "$FIXTURES/sacrifice-B.txt"
TARGET_B="probes/codeicide-flow-v0/fixtures/sacrifice-B.txt"

./t propose --target "$TARGET_B" --reason "Scenario B" --out "$WORK/propose-B.json" >/dev/null
extract_envelope "$WORK/propose-B.json" > "$WORK/env-B-0.json"
< "$WORK/env-B-0.json" ./t cowitness --stdin --oracle claude-opus-4-7 --substrate claude_oracle \
  | jq -c '.envelope' > "$WORK/env-B-1.json"

set +e
./t verdict "$WORK/env-B-1.json" > "$WORK/verdict-B.json"
verdict_exit_B=$?
set -e

verdict_B=$(jq -r '.result.verdict' "$WORK/verdict-B.json")
echo "    verdict=$verdict_B (expected PENDING)"
[ "$verdict_B" = "PENDING" ] || { echo "FAIL Scenario B: expected PENDING, got $verdict_B"; exit 1; }
[ "$verdict_exit_B" != "0" ] || { echo "FAIL Scenario B: verdict should exit non-zero for non-AYE"; exit 1; }

set +e
./t apply-codeicide --proposal "$WORK/env-B-1.json" --verdict "$WORK/verdict-B.json" > "$WORK/apply-B.json"
apply_exit_B=$?
set -e
[ "$apply_exit_B" != "0" ] || { echo "FAIL Scenario B: apply should refuse non-AYE"; exit 1; }
[ -f "$ROOT/$TARGET_B" ] || { echo "FAIL Scenario B: target was moved despite non-AYE!"; exit 1; }

echo "    ✓ Scenario B passed (apply correctly refused)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario C: forbidden target rejected at propose
# ──────────────────────────────────────────────────────────────

echo "==> Scenario C: propose against forbidden path"

set +e
./t propose --target "omega/some/file.rs" --reason "Scenario C" > "$WORK/propose-C.json"
prop_exit_C=$?
set -e

[ "$prop_exit_C" != "0" ] || { echo "FAIL Scenario C: propose should reject forbidden target"; exit 1; }
type_C=$(jq -r '.type' "$WORK/propose-C.json")
[ "$type_C" = "error" ] || { echo "FAIL Scenario C: expected error type"; exit 1; }

echo "    ✓ Scenario C passed (forbidden path rejected)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario D: hash drift between propose and apply
# ──────────────────────────────────────────────────────────────

echo "==> Scenario D: target modified between propose and apply"

echo "Sacrifice D content original" > "$FIXTURES/sacrifice-D.txt"
TARGET_D="probes/codeicide-flow-v0/fixtures/sacrifice-D.txt"

./t propose --target "$TARGET_D" --reason "Scenario D" --out "$WORK/propose-D.json" >/dev/null
extract_envelope "$WORK/propose-D.json" > "$WORK/env-D-0.json"
< "$WORK/env-D-0.json" ./t cowitness --stdin --oracle claude-opus-4-7 --substrate claude_oracle | jq -c '.envelope' > "$WORK/env-D-1.json"
< "$WORK/env-D-1.json" ./t cowitness --stdin --oracle codex-gpt-5 --substrate codex_oracle | jq -c '.envelope' > "$WORK/env-D-2.json"
< "$WORK/env-D-2.json" ./t cowitness --stdin --oracle gemini-3-1-pro --substrate gemini_oracle | jq -c '.envelope' > "$WORK/env-D-3.json"

./t verdict "$WORK/env-D-3.json" > "$WORK/verdict-D.json" || true
verdict_D=$(jq -r '.result.verdict' "$WORK/verdict-D.json")
[ "$verdict_D" = "AYE" ] || { echo "FAIL Scenario D: expected AYE, got $verdict_D"; exit 1; }

# Modify the target — induce hash drift.
echo "DRIFTED content!" >> "$FIXTURES/sacrifice-D.txt"

set +e
./t apply-codeicide --proposal "$WORK/env-D-3.json" --verdict "$WORK/verdict-D.json" > "$WORK/apply-D.json"
apply_exit_D=$?
set -e

[ "$apply_exit_D" != "0" ] || { echo "FAIL Scenario D: apply should refuse on hash drift"; exit 1; }
[ -f "$ROOT/$TARGET_D" ] || { echo "FAIL Scenario D: target was moved despite hash drift!"; exit 1; }

echo "    ✓ Scenario D passed (hash drift detected, apply refused)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario E: self-AYE blocked
# ──────────────────────────────────────────────────────────────

echo "==> Scenario E: proposer self-cowitness → NAY"

echo "Sacrifice E content" > "$FIXTURES/sacrifice-E.txt"
TARGET_E="probes/codeicide-flow-v0/fixtures/sacrifice-E.txt"

./t propose --target "$TARGET_E" --reason "Scenario E" --out "$WORK/propose-E.json" >/dev/null
extract_envelope "$WORK/propose-E.json" > "$WORK/env-E-0.json"
# Self-cowitness: substrate_tag matches proposer (trinity).
< "$WORK/env-E-0.json" ./t cowitness --stdin --oracle claude-opus-4-7 --substrate trinity | jq -c '.envelope' > "$WORK/env-E-1.json"

set +e
./t verdict "$WORK/env-E-1.json" > "$WORK/verdict-E.json"
set -e

verdict_E=$(jq -r '.result.verdict' "$WORK/verdict-E.json")
reasons_E=$(jq -r '.result.reasons[]' "$WORK/verdict-E.json")
echo "    verdict=$verdict_E"
echo "    reasons: $reasons_E"
[ "$verdict_E" = "NAY" ] || { echo "FAIL Scenario E: expected NAY for self-AYE, got $verdict_E"; exit 1; }

echo "    ✓ Scenario E passed (self-AYE detected)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario F: RESURRECT.sh refuses overwrite of existing live file
# (per Codex AYE_WITH_EXTRA_GUARD 2026-05-14T194732Z)
# ──────────────────────────────────────────────────────────────

echo "==> Scenario F: RESURRECT.sh refuses overwrite without --force"

echo "Sacrifice F original" > "$FIXTURES/sacrifice-F.txt"
TARGET_F="probes/codeicide-flow-v0/fixtures/sacrifice-F.txt"

./t propose --target "$TARGET_F" --reason "Scenario F" --out "$WORK/propose-F.json" >/dev/null
extract_envelope "$WORK/propose-F.json" > "$WORK/env-F-0.json"
< "$WORK/env-F-0.json" ./t cowitness --stdin --oracle claude-opus-4-7 --substrate claude_oracle | jq -c '.envelope' > "$WORK/env-F-1.json"
< "$WORK/env-F-1.json" ./t cowitness --stdin --oracle codex-gpt-5 --substrate codex_oracle | jq -c '.envelope' > "$WORK/env-F-2.json"
< "$WORK/env-F-2.json" ./t cowitness --stdin --oracle gemini-3-1-pro --substrate gemini_oracle | jq -c '.envelope' > "$WORK/env-F-3.json"

./t verdict "$WORK/env-F-3.json" > "$WORK/verdict-F.json" || true
./t apply-codeicide --proposal "$WORK/env-F-3.json" --verdict "$WORK/verdict-F.json" > "$WORK/apply-F.json"

archive_F=$(jq -r '.archived_to' "$WORK/apply-F.json")
PROBE_ARCHIVES+=("$ROOT/$(echo "$archive_F" | cut -d/ -f1-2)")

# Recreate a live file at the original path (simulate "someone else's work").
echo "FRESH content at the original path" > "$ROOT/$TARGET_F"

# Attempt RESURRECT.sh without --force — MUST refuse.
resurrect_path_F="$ROOT/$(jq -r '.resurrect_at' "$WORK/apply-F.json")"
set +e
bash "$resurrect_path_F" > "$WORK/resurrect-F-noforce.out" 2>&1
resurrect_noforce_exit=$?
set -e

[ "$resurrect_noforce_exit" != "0" ] || { echo "FAIL Scenario F: RESURRECT.sh should refuse without --force"; cat "$WORK/resurrect-F-noforce.out"; exit 1; }
grep -q "Refusing to overwrite" "$WORK/resurrect-F-noforce.out" || { echo "FAIL Scenario F: expected 'Refusing to overwrite' message"; cat "$WORK/resurrect-F-noforce.out"; exit 1; }

# Verify the FRESH content is still intact (RESURRECT did not silently overwrite).
fresh_content=$(cat "$ROOT/$TARGET_F")
[ "$fresh_content" = "FRESH content at the original path" ] || { echo "FAIL Scenario F: live file was silently overwritten"; exit 1; }

# Attempt with --force — MUST succeed.
bash "$resurrect_path_F" --force > "$WORK/resurrect-F-force.out" 2>&1

restored_content=$(cat "$ROOT/$TARGET_F")
[ "$restored_content" = "Sacrifice F original" ] || { echo "FAIL Scenario F: --force did not restore archived content"; exit 1; }

echo "    ✓ Scenario F passed (RESURRECT.sh refused overwrite; --force succeeded)"
echo

# ──────────────────────────────────────────────────────────────

echo "==> All 6 scenarios passed."
echo
echo "Probe-created archives that will be cleaned up:"
for adir in "${PROBE_ARCHIVES[@]:-}"; do
  echo "    $adir"
done
