#!/usr/bin/env bash
# digital-organism-continuity-v0 — prove sovereign continuity-of-self composes
# from the published primitives. Exits non-zero unless 5/5 properties hold.
set -euo pipefail
cd "$(dirname "$0")"
deno run --allow-read life.ts
