#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec deno run --allow-read --allow-write "$DIR/run.ts" "$@"
