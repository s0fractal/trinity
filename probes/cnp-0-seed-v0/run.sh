#!/usr/bin/env bash
# cnp-0-seed-v0 probe runner — the one documented local entrypoint.
#
# Same three steps CI runs, in the same order:
#   1. the corpus, against the pinned manifest (self-contained);
#   2. the negative controls, which prove the gate's red state means something;
#   3. external Warrant parity in both directions, which is UNAVAILABLE unless a
#      pinned checkout is supplied and is never reported as a pass when it did
#      not run.
#
# Every deno invocation passes --no-config on purpose: the probe is meant to be
# self-contained, and resolving trinity's root workspace drags in submodule
# members that are absent from a fresh clone (codex review). The probe imports
# nothing outside itself, so it needs no import map.
#
# Usage:
#   ./run.sh
#   ./run.sh --warrant=/path/to/warrant   # attempt external parity too

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

WARRANT_ARG="${1:-}"

echo "==> cnp-0-seed-v0: corpus"
deno run --no-config --allow-read ts/runner.ts

echo
echo "==> cnp-0-seed-v0: negative controls"
deno run --no-config --allow-read --allow-write --allow-run ts/mutate.ts

echo
echo "==> cnp-0-seed-v0: manifest authoring tool is reproducible"
python3 tools/build_manifest.py --check

echo
echo "==> cnp-0-seed-v0: this encoder through the public conformance kit"
python3 ../../conformance/cnp-0-jcs-v0/run_conformance.py \
  --cmd "deno run --no-config --allow-read $HERE/ts/conformance_cli.ts"

echo
echo "==> cnp-0-seed-v0: warrant JCS parity (external, pinned)"
if [ -n "$WARRANT_ARG" ]; then
  deno run --no-config --allow-read --allow-write --allow-run ts/parity_warrant.ts "$WARRANT_ARG" "${2:-}"
else
  deno run --no-config --allow-read --allow-write --allow-run ts/parity_warrant.ts
fi
