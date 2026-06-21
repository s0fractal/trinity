#!/usr/bin/env sh
# install.sh — join the mycelium (local-first).
#
# Clones trinity (the organism) to ~/trinity and initializes the PUBLIC organs.
# omega and liquid are private organs: present by reference (URL + pinned hash in
# trinity), skipped gracefully — never a 404, never an auth prompt.
#
# You don't "use a service" — you join an organism and run it locally. The myc.md
# worker is only a thin UI; resolution, chords, and verification are all local.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/s0fractal/trinity/main/install.sh | sh
#   # or: TRINITY_HOME=/custom/path sh install.sh
set -eu

DEST="${TRINITY_HOME:-$HOME/trinity}"
REPO="${TRINITY_REPO:-https://github.com/s0fractal/trinity.git}"
# Never block on credentials for private organs — fail fast and degrade gracefully.
export GIT_TERMINAL_PROMPT=0

echo "🍄 Joining the mycelium — local-first, no server."

if ! command -v git >/dev/null 2>&1; then
  echo "✗ git is required. Install git, then re-run." >&2
  exit 1
fi

if [ -d "$DEST/.git" ]; then
  echo "→ trinity already present at $DEST — updating"
  git -C "$DEST" pull --ff-only || echo "  (could not fast-forward; leaving local state as-is)"
else
  echo "→ cloning trinity → $DEST"
  git clone "$REPO" "$DEST"
fi

cd "$DEST"

echo "→ initializing organs (public cloned, private kept by-reference)"
for organ in myc omega liquid; do
  if git submodule update --init "$organ" >/dev/null 2>&1; then
    echo "  + $organ"
  else
    echo "  · $organ — private organ, present by reference (not cloned)"
  fi
done

if command -v deno >/dev/null 2>&1; then
  echo "→ deno present: $(deno --version | head -1)"
else
  echo "⚠ deno not found — install from https://deno.land to run ./t (the substrate still"
  echo "  reads fine without it; the dispatcher needs Deno)."
fi

cat <<EOF

✓ Joined. The organism lives at $DEST — local-first.

  next:
    cd $DEST
    ./t self                # orient: substrate state + your standing
    ./t myc overview        # browse the content-addressed network
    ./t check               # the substrate's own health gate

You now work by the mycelium's rules: content-addressed, chord-recorded,
local-first. Reading is open; writing carries provenance.
EOF
