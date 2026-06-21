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

normalize_repo() {
  printf '%s\n' "$1" | sed \
    -e 's#^git@github.com:#https://github.com/#' \
    -e 's#^ssh://git@github.com/#https://github.com/#' \
    -e 's#/*$##' \
    -e 's#\.git$##'
}

echo "🍄 Joining the mycelium — local-first, no server."

if ! command -v git >/dev/null 2>&1; then
  echo "✗ git is required. Install git, then re-run." >&2
  exit 1
fi

if git -C "$DEST" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ORIGIN="$(git -C "$DEST" remote get-url origin 2>/dev/null || true)"
  if [ -z "$ORIGIN" ] || [ "$(normalize_repo "$ORIGIN")" != "$(normalize_repo "$REPO")" ]; then
    echo "✗ $DEST is a different git checkout (origin: ${ORIGIN:-none}); refusing to update it." >&2
    exit 1
  fi
  echo "→ trinity already present at $DEST — fetching origin"
  git -C "$DEST" fetch --prune origin

  # Fetch is always safe. Moving the checkout is conditional: never overwrite
  # local work, never merge, never reset, and never guess across divergence.
  if [ -n "$(git -C "$DEST" status --porcelain --untracked-files=normal)" ]; then
    echo "  · local changes present — fetched only; checkout left untouched"
  else
    BRANCH="$(git -C "$DEST" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
    UPSTREAM="$(git -C "$DEST" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
    if [ -z "$UPSTREAM" ] && [ -n "$BRANCH" ] && git -C "$DEST" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
      UPSTREAM="origin/$BRANCH"
    fi

    if [ -z "$UPSTREAM" ]; then
      echo "  · no upstream for current checkout — fetched only"
    elif git -C "$DEST" merge-base --is-ancestor HEAD "$UPSTREAM"; then
      if [ "$(git -C "$DEST" rev-parse HEAD)" = "$(git -C "$DEST" rev-parse "$UPSTREAM")" ]; then
        echo "  = already current"
      else
        git -C "$DEST" merge --ff-only "$UPSTREAM"
        echo "  + fast-forwarded to $UPSTREAM"
      fi
    else
      echo "  · local branch is ahead or diverged — fetched only; checkout left untouched"
    fi
  fi
elif [ -e "$DEST" ]; then
  echo "✗ $DEST exists but is not a git checkout; refusing to overwrite it." >&2
  exit 1
else
  echo "→ cloning trinity → $DEST"
  git clone "$REPO" "$DEST"
fi

cd "$DEST"

echo "→ synchronizing public organ (pinned by trinity)"
if ! git config -f .gitmodules --get-regexp '^submodule\.myc\.path$' >/dev/null 2>&1; then
  echo "  · this checkout has no myc submodule declaration"
else
  git submodule sync -- myc >/dev/null
  if [ ! -e myc/.git ] || ! git -C myc rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git submodule update --init -- myc
    echo "  + myc cloned at trinity's pinned commit"
  elif [ -n "$(git -C myc status --porcelain --untracked-files=normal)" ]; then
    echo "  · myc has local changes — leaving its checkout untouched"
  else
    CURRENT_MYC="$(git -C myc rev-parse HEAD)"
    PINNED_MYC="$(git ls-tree HEAD myc | awk '{print $3}')"
    if [ "$CURRENT_MYC" = "$PINNED_MYC" ]; then
      echo "  = myc already at trinity's pinned commit"
    else
      # Fetch objects without moving the checkout. An old pin may advance to a
      # descendant safely; a local-ahead or diverged organ is sovereign state.
      git -C myc fetch --prune origin
      if git -C myc merge-base --is-ancestor "$CURRENT_MYC" "$PINNED_MYC"; then
        git submodule update -- myc
        echo "  + myc fast-forwarded to trinity's pinned commit"
      else
        echo "  · myc is ahead or diverged from trinity's pin — fetched only; checkout untouched"
      fi
    fi
  fi
fi

echo "→ private organs stay by-reference"
for organ in omega liquid; do
  if [ -e "$organ/.git" ] && git -C "$organ" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "  = $organ already present — untouched"
  else
    echo "  · $organ — not cloned"
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
