#!/usr/bin/env bash
# sovereign-agency-v0 — does bounded sovereign agency compose, and where is the seam?
# Exits non-zero unless 6/6 properties hold.
set -euo pipefail
cd "$(dirname "$0")"
deno run --allow-read agency.ts
