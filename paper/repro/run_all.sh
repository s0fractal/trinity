#!/usr/bin/env bash
# paper/repro/run_all.sh — one command reproduces every number and check in the paper.
# Usage: ./run_all.sh   (from a clean clone; Deno ≥2.x and git required)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out

echo "== commit pin =="
git -C ../.. rev-parse HEAD | tee out/COMMIT

echo
echo "== §6 table 1: chord ledger statistics =="
deno run --allow-read --allow-run --allow-write chord_stats.ts ../.. --json=out/chord_stats.json | tee out/chord_stats.md

echo
echo "== §6 table 2: hears-graph statistics =="
deno run --allow-read --allow-run --allow-write hears_graph.ts ../.. --json=out/hears_graph.json | tee out/hears_graph.md

echo
echo "== §4: external verifier — accept + tamper-reject (C1) =="
./verifier_walkthrough.sh

echo
echo "== done: all outputs in paper/repro/out/, pinned to $(cat out/COMMIT | cut -c1-12) =="
