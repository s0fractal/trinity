#!/usr/bin/env bash
# co-witnessed-selfhood-v0 — prove personhood-in-community composes from the
# published primitives. Exits non-zero unless 6/6 properties hold.
set -euo pipefail
cd "$(dirname "$0")"
deno run --allow-read society.ts
