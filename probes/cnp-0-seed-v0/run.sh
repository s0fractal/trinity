#!/usr/bin/env bash
# cnp-0-seed-v0 probe runner — the one documented local entrypoint.
#
# Same three steps CI runs, in the same order:
#   1. the corpus, against the pinned manifest (self-contained);
#   2. the negative controls, which prove the gate's red state means something;
#   3. external Warrant parity, which is UNAVAILABLE unless a pinned checkout
#      is supplied and is never reported as a pass when it did not run.
#
# Usage:
#   ./run.sh
#   ./run.sh --warrant=/path/to/warrant   # attempt external parity too

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

WARRANT_ARG="${1:-}"

echo "==> cnp-0-seed-v0: corpus"
deno run --allow-read ts/runner.ts

echo
echo "==> cnp-0-seed-v0: negative controls"
deno run --allow-read --allow-write --allow-run ts/mutate.ts

echo
echo "==> cnp-0-seed-v0: manifest authoring tool is reproducible"
python3 tools/build_manifest.py --check

echo
echo "==> cnp-0-seed-v0: warrant JCS parity (external, pinned)"
if [ -n "$WARRANT_ARG" ]; then
  deno run --allow-read ts/parity_warrant.ts "$WARRANT_ARG"
else
  deno run --allow-read ts/parity_warrant.ts
fi
