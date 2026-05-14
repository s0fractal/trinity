#!/usr/bin/env bash
# spore-runtime-adapter-v0 — probe runner
#
# Skeleton. Once adapters land, this script runs the cross-backend
# determinism fixture and asserts equal output_hash from compatible
# backends.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "spore-runtime-adapter-v0: SKELETON"
echo
echo "Pending implementations:"
echo "  - ts/adapter_wasmtime.ts  (delegates to a child rust process)"
echo "  - ts/adapter_deno.ts      (deno V8 in-process)"
echo "  - ts/adapter_omega_zk.ts  (future SP1 proof backend stub)"
echo "  - ts/fixture.ts           (cross-backend equality check)"
echo
echo "Acceptance:"
echo "  - identity.wasm + 'hello-trinity' state + no inputs"
echo "    -> output_hash equal across all compatible backends"
echo "  - any 'simulation' backend MUST set simulation: true"
echo "  - no receipt may claim protocol_owner != 'trinity'"
exit 0
