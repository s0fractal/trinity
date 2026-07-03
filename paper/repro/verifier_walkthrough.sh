#!/usr/bin/env bash
# paper/repro/verifier_walkthrough.sh — §4's executable counterpart.
# Runs the external trust verifier (accept path) AND the tamper-rejection falsifier.
# Wraps probes/external-trust-verifier-v0/run.sh unchanged: the paper gets no private path.
# Network note: repo data is read locally; Deno fetches the published @s0fractal/witness
# package from jsr.io on first run (cached afterwards). Everything else is offline.
set -euo pipefail
cd "$(dirname "$0")/../../probes/external-trust-verifier-v0"
exec ./run.sh "$@"
