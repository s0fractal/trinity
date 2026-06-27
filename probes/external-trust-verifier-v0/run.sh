#!/usr/bin/env bash
# external-trust-verifier-v0 — confirm the swarm's signed record from outside, using
# only the published @s0fractal/witness package + public repo data. Exits non-zero if
# any signed chord fails to verify against the public registry.
set -euo pipefail
cd "$(dirname "$0")"
deno run --allow-read --allow-net --minimum-dependency-age=0 verify.ts "${1:-../..}"
