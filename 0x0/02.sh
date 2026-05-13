#!/bin/bash
# 0x0/02.sh — global shim for `t` command
# position: 0/02 → foundation × byte02 (shim slot after glossary 00 and runtime 01)
# wraps deno invocation of substrate runtime (0x0/01.ts) with full permissions
#
# Resolves real path through symlinks so substrate root stays correct
# regardless of where /usr/local/bin/t or ~/.local/bin/t points to.

# Resolve symlink to get real script location
SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"

exec deno run --allow-all "${SCRIPT_DIR}/01.ts" "$@"
