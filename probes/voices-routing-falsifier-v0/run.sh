#!/usr/bin/env bash
# voices-routing-falsifier-v0 probe runner.
#
# Acceptance: writes result.latest.json and result.latest.md, exits 0.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$ROOT"

echo "==> voices-routing-falsifier-v0: 1D vs 8D routing"
echo

deno run --allow-read --allow-write probes/voices-routing-falsifier-v0/run.ts "$@"

echo
echo "==> result"
jq '{candidateSamples,labeledSamples,skippedSamples,deltaPp,verdict,config}' \
  probes/voices-routing-falsifier-v0/result.latest.json
