#!/usr/bin/env bash
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec deno run -A "$HERE/src/x0100_dispatch.ts" "$@"
