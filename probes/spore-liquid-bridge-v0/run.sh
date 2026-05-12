#!/usr/bin/env bash
# run.sh - Liquid -> Spore Adapter Bridge

set -euo pipefail

SCRIPT_DIR=$(dirname "$0")

echo "--- Running SPORE Liquid Thin Bridge (TypeScript/Deno) ---"
deno run -A "$SCRIPT_DIR/ts/bridge.ts"
