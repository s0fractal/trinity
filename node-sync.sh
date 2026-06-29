#!/usr/bin/env sh
# node-sync.sh — keep a mesh node's clone current. Fetches + fast-forwards the
# canonical trinity clone (+ submodules) from origin; the post-merge hook then
# validates it. Idempotent, safe (never clobbers local changes), cron/launchd-
# friendly. Pairs with install.sh: install once, node-sync forever.
#
#   sh node-sync.sh                 # one sync (canonical clone: ~/trinity)
#   TRINITY_HOME=/path sh node-sync.sh
#   # periodic (cron, every 30 min):
#   */30 * * * * /bin/sh $HOME/trinity/node-sync.sh >> $HOME/.trinity/node-sync.log 2>&1
set -eu

ROOT="${TRINITY_HOME:-$HOME/trinity}"
if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ no trinity clone at $ROOT — run install.sh first (or set TRINITY_HOME)." >&2
  exit 1
fi
cd "$ROOT"

# Make sure the validity hook is active for this clone.
git config core.hooksPath .githooks

BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo main)"
BEFORE="$(git rev-parse HEAD)"

# Refuse to touch a dirty tree — never clobber local work.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "→ $ROOT has uncommitted changes — skipping sync (won't clobber local work)."
  exit 0
fi

git fetch --prune --recurse-submodules=on-demand origin >/dev/null 2>&1 || {
  echo "✗ fetch failed (offline?) — leaving clone at $(git rev-parse --short HEAD)." >&2
  exit 1
}

# Fast-forward only: if the branch has diverged, do not force — report and stop.
if ! git merge-base --is-ancestor HEAD "origin/$BRANCH" 2>/dev/null; then
  echo "→ local $BRANCH has diverged from origin — not fast-forwardable; leaving as-is."
  exit 0
fi

git merge --ff-only "origin/$BRANCH" >/dev/null 2>&1   # triggers .githooks/post-merge
git submodule update --init --recursive >/dev/null 2>&1 || true

AFTER="$(git rev-parse HEAD)"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "✓ already current ($(git rev-parse --short HEAD)) on $BRANCH"
else
  echo "✓ synced ${BEFORE%${BEFORE#???????}}…→$(git rev-parse --short HEAD) on $BRANCH"
fi
