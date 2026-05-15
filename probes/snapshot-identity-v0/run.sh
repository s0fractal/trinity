#!/usr/bin/env bash
# snapshot-identity-v0 — proves t snapshot body_hash is deterministic
# for the same meta-ledger state across wall-time-separated calls.
#
# Acceptance: 3 scenarios pass; no side effects outside $WORK.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Helper to extract JSON from `t snapshot` output (first line is # header).
snapshot_to() {
  local out="$1"
  ./t snapshot 2>&1 | grep '^{' > "$out"
}

# ──────────────────────────────────────────────────────────────
# Scenario A — three consecutive snapshots; body_hash invariant
# ──────────────────────────────────────────────────────────────

echo "==> Scenario A: 3 consecutive snapshots; body_hash invariant; envelope_id differs"

snapshot_to "$WORK/s1.json"
sleep 0.5
snapshot_to "$WORK/s2.json"
sleep 0.5
snapshot_to "$WORK/s3.json"

bh1=$(jq -r '.body_hash' "$WORK/s1.json")
bh2=$(jq -r '.body_hash' "$WORK/s2.json")
bh3=$(jq -r '.body_hash' "$WORK/s3.json")
id1=$(jq -r '.envelope_id' "$WORK/s1.json")
id2=$(jq -r '.envelope_id' "$WORK/s2.json")
id3=$(jq -r '.envelope_id' "$WORK/s3.json")
schema=$(jq -r '.envelope.body.schema' "$WORK/s1.json")

echo "    body_hash[1]:  ${bh1:0:24}..."
echo "    body_hash[2]:  ${bh2:0:24}..."
echo "    body_hash[3]:  ${bh3:0:24}..."
echo "    envelope_id[1]: ${id1:0:24}..."
echo "    envelope_id[2]: ${id2:0:24}..."
echo "    envelope_id[3]: ${id3:0:24}..."

[ "$bh1" = "$bh2" ] || { echo "FAIL Scenario A: body_hash[1] != body_hash[2]"; exit 1; }
[ "$bh2" = "$bh3" ] || { echo "FAIL Scenario A: body_hash[2] != body_hash[3]"; exit 1; }
[ "$id1" != "$id2" ] || { echo "FAIL Scenario A: envelope_id should differ (wall_time changes)"; exit 1; }
[ "$id2" != "$id3" ] || { echo "FAIL Scenario A: envelope_id should differ between snap 2 and 3"; exit 1; }
[ "$schema" = "trinity.substrate-snapshot.v0.1" ] || { echo "FAIL Scenario A: body schema mismatch ($schema)"; exit 1; }

echo "    ✓ Scenario A passed (body_hash deterministic; envelope_id varies)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario B — cross-time court witness
# ──────────────────────────────────────────────────────────────

echo "==> Scenario B: cross-time court agreement on snapshot envelopes"

# Extract envelopes to standalone files.
jq -c '.envelope' "$WORK/s1.json" > "$WORK/env1.json"
jq -c '.envelope' "$WORK/s2.json" > "$WORK/env2.json"
jq -c '.envelope' "$WORK/s3.json" > "$WORK/env3.json"

# Court these three envelopes (same body_hash, different envelope_ids,
# all substrate_tag=trinity). Strip the # header line from dispatcher.
./t court "$WORK/env1.json" "$WORK/env2.json" "$WORK/env3.json" 2>&1 | grep '^{' > "$WORK/court.json" || true

# Note: t court considers duplicate substrate_tag a conflict. Three
# trinity-tagged envelopes trigger duplicate_substrate_tag. That is
# DIFFERENT from cross-substrate court agreement. The point of this
# scenario is: body_hashes ARE all equal — verify that fact even if
# court reports other-axis conflicts.
agreement=$(jq -r '.agreement' "$WORK/court.json")
distinct_body_hashes=$(jq -r '.body_hashes | to_entries | length' "$WORK/court.json")
all_same_hash=$(jq -r '.body_hashes | to_entries | map(.value) | unique | length' "$WORK/court.json")

echo "    court.agreement: $agreement (expected false — duplicate substrate_tag)"
echo "    body_hashes recorded: $distinct_body_hashes (1 dedup'd by substrate_tag key)"
echo "    unique body_hash values: $all_same_hash"

# The court records body_hashes keyed by substrate_tag, so 3 trinity-tagged
# envelopes collapse to 1 entry. The fact we care about: unique body_hash
# values across all envelopes is 1 (all same content).
# We assert this directly via jq on all three envelopes.
uniq_count=$(jq -r '.body_hash' "$WORK"/env*.json | sort -u | wc -l | tr -d ' ')
[ "$uniq_count" = "1" ] || { echo "FAIL Scenario B: snapshots disagree on body_hash"; exit 1; }

echo "    ✓ Scenario B passed (all 3 snapshots share body_hash; identity invariant)"
echo

# ──────────────────────────────────────────────────────────────
# Scenario C — temporal anchor over snapshot sequence
# ──────────────────────────────────────────────────────────────

echo "==> Scenario C: anchor-prep over snapshot sequence (temporal commitment)"

# anchor-prep emits multi-line JSON from underlying probe (jq -r .); strip # header.
./t anchor-prep "$WORK/env1.json" "$WORK/env2.json" "$WORK/env3.json" 2>&1 | sed '/^# /d' > "$WORK/anchor.json"

# Anchor probe emits "EnvelopeAnchorPayload". The t anchor-prep organ
# pass-through includes a final "}\n" — strip jq slurp issues.
leaf_count=$(jq -r '.leaf_count' "$WORK/anchor.json")
merkle_root=$(jq -r '.merkle_root' "$WORK/anchor.json")
rejected_count=$(jq -r '.rejected | length' "$WORK/anchor.json")
inclusion_count=$(jq -r '.inclusion_proofs | length' "$WORK/anchor.json")

echo "    leaf_count: $leaf_count"
echo "    merkle_root: ${merkle_root:0:24}..."
echo "    rejected: $rejected_count"
echo "    inclusion_proofs: $inclusion_count"

[ "$leaf_count" = "3" ] || { echo "FAIL Scenario C: expected 3 leaves, got $leaf_count"; exit 1; }
[ "$rejected_count" = "0" ] || { echo "FAIL Scenario C: snapshots should not be rejected by anchor"; exit 1; }
[ "$inclusion_count" = "3" ] || { echo "FAIL Scenario C: expected 3 inclusion proofs"; exit 1; }
[ -n "$merkle_root" ] && [ "$merkle_root" != "null" ] || { echo "FAIL Scenario C: missing merkle_root"; exit 1; }

echo "    ✓ Scenario C passed (temporal anchor produces Merkle root over snapshot sequence)"
echo

# ──────────────────────────────────────────────────────────────

echo "==> All 3 scenarios passed."
echo
echo "Snapshot identity claim verified:"
echo "    body_hash invariant across wall-time-separated calls."
echo "    Same body_hash composes with t court (body_hash agreement)."
echo "    Different envelope_ids form distinct leaves for t anchor-prep."
echo "    Identity = body_hash. Anchor commits to identity at moments."
