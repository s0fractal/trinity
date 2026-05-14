#!/usr/bin/env bash
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec deno run -A "$HERE/0x0/01.ts" "$@"
