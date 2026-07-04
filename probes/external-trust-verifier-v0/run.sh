#!/usr/bin/env bash
# external-trust-verifier-v0 — confirm the swarm's record from OUTSIDE, using only
# the published @s0fractal/witness package + public repo data. Two claims:
#   verify.ts — every signed chord verifies against the public key registry.
#   court.ts  — a registered voice's attestation of the live Substrate Court verdict
#               re-derives from the raw bodies (body_hashes recomputed independently).
# Exits non-zero if either fails to verify, OR if the tamper-falsifier does not reject.
set -euo pipefail
cd "$(dirname "$0")"

deno run --allow-read --allow-net --minimum-dependency-age=0 verify.ts "${1:-../..}"

echo
deno run --allow-read --allow-net --minimum-dependency-age=0 court.ts "./court-attestation.json"

echo
echo "— falsifier 1: the outsider MUST reject a validly-signed lie (tampered body) —"
if deno run --allow-read --allow-net --minimum-dependency-age=0 court.ts "./court-attestation.tampered.json" >/dev/null 2>&1; then
  echo "✗ FALSIFIER FAILED: court.ts accepted a tampered attestation — the gate cannot fail, so it is not a gate"
  exit 1
else
  echo "✓ court.ts rejected the tampered attestation — the recompute is load-bearing, not the signature alone"
fi

echo
echo "— falsifier 2: the outsider MUST reject a validly-signed but INCOMPLETE witness set (audit F2) —"
if deno run --allow-read --allow-net --minimum-dependency-age=0 court.ts "./court-attestation.subset.json" >/dev/null 2>&1; then
  echo "✗ FALSIFIER FAILED: court.ts accepted a signed subset that omits substrates — integrity is not completeness"
  exit 1
else
  echo "✓ court.ts rejected the incomplete (subset) attestation — a signed subset cannot silently omit a substrate"
fi
