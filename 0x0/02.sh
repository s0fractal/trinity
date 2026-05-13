#!/bin/bash
# 0x0/02.sh — global shim for `t` command
# position: 0/02 → foundation × byte02 (shim slot after glossary 00 and runtime 01)
# hex_dipole: "00 00 00 00 00 00 59 00"
# placement_policy: tier
#   harmony_emergence+0.70 (Kimi reading: restores execution flow)
#   bucket 0/02: primary axis harmony (6), bucket 0 ← MISMATCH (projection)
#                secondary '02' → axis 2 mirror, dipole 0 ← does not rescue
#   alt reading (claude): void+foundation+completion-heavy would put it at 0/04
#                         not re-measured; Kimi's reading kept
#   audit phase 1 annotation: claude-opus-4-7-1m, anchor block 949260
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
