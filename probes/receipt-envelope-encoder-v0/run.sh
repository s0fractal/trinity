#!/usr/bin/env bash
# receipt-envelope-encoder-v0 probe runner.
#
# Runs the TS test suite AND the Python cross-language byte-equality test.
# Acceptance: all tests pass; golden bytes recorded; Python impl produces
# byte-identical canonical CBOR output to TS impl. The cross-lang gate
# (Codex review 2026-05-14T173027Z) is closed only when both impls agree.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "==> receipt-envelope-encoder-v0: TypeScript impl"
echo
deno test --allow-read --no-check ts/test.ts

echo
echo "==> receipt-envelope-encoder-v0: Python cross-lang byte equality"
echo
cd python
python3 cross_lang_test.py
