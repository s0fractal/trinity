#!/usr/bin/env bash
# envelope-bitcoin-anchor-v0 probe runner.
#
# Runs Scenarios A-F + determinism + empty-input rejection.
# Acceptance: all 9 tests pass.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "==> envelope-bitcoin-anchor-v0: Merkle root + inclusion proofs"
echo

exec deno test --allow-read --no-check ts/test.ts
