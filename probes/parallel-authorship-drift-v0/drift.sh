#!/usr/bin/env bash
# probes/parallel-authorship-drift-v0/drift.sh
#
# What happens when two voices author a chord at the same time?
#
# The intuition is "they conflict on the aggregate counters, and someone
# resolves it." The intuition is wrong, and the truth is worse: both branches
# bump the same counter by the same amount, git sees an identical change on
# both sides, merges cleanly, and the committed projection is now silently
# short by one.
#
# No conflict. No warning. A wrong number on the branch until something
# regenerates it.
#
# This matters because the substrate's premise is five voices working in
# parallel. Under bus-factor-1 the failure is invisible: one author never
# races themselves. It becomes structural exactly when the premise starts
# working.
#
# Run:  bash probes/parallel-authorship-drift-v0/drift.sh
# Exit: 0 if the drift reproduces (the finding holds)
#       1 if it does not (the finding is stale — see FALSIFIED below)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "# parallel authorship drift"
echo
echo "cloning $REPO_ROOT ..."
git clone -q "$REPO_ROOT" "$WORK/repo" || { echo "clone failed"; exit 1; }
cd "$WORK/repo"

# The counter line this probe races on. Read it rather than hardcode it, so the
# probe keeps working as the ledger grows.
COUNTER_LINE="$(grep -n '| Total Chords' src/x2B88_decisions.myc.md | head -1)"
BEFORE="$(printf '%s' "$COUNTER_LINE" | grep -oE '[0-9]+ *\|' | grep -oE '[0-9]+')"
if [ -z "${BEFORE:-}" ]; then
  echo "FALSIFIED: no 'Total Chords' counter found in x2B88_decisions.myc.md."
  echo "  Either the projection stopped embedding an aggregate — which is the"
  echo "  fix this probe argues for — or it was renamed. Check before assuming."
  exit 1
fi
AFTER=$((BEFORE + 1))
echo "counter before: $BEFORE"
echo

# Two voices, each adding one chord, each regenerating the projection the way
# the generator would: +1 to the total.
for v in alpha beta; do
  git checkout -q -b "voice-$v" main
  cat > "src/x2300_999999_${v}_parallel-drift-probe.myc.md" <<EOF
---
type: chord.observation
voice: $v
mode: observation
created: 2026-01-01T00:00:00.000Z
bitcoin_block_height: 999999
topic: parallel-drift-probe-$v
stance: OBSERVATION
chord:
  primary: "oct:2.mirror"
---

# probe chord from $v
EOF
  # Emulate the generator's aggregate update. Both voices compute the same
  # new total, because each sees only its own addition.
  perl -pi -e "s/\| Total Chords( +)\| +$BEFORE +\|/| Total Chords\$1|  $AFTER  |/" \
    src/x2B88_decisions.myc.md
  git add -A src >/dev/null
  git commit -q -m "chord from $v"
done

git checkout -q voice-alpha
echo "merging voice-beta into voice-alpha ..."
if git merge --no-edit voice-beta >/dev/null 2>&1; then
  MERGED="clean"
else
  MERGED="conflict"
fi

FINAL="$(grep '| Total Chords' src/x2B88_decisions.myc.md | grep -oE '[0-9]+ *\|' | grep -oE '[0-9]+' | head -1)"
EXPECTED=$((BEFORE + 2))

echo
echo "  merge result      : $MERGED"
echo "  chords added      : 2"
echo "  counter says      : $FINAL"
echo "  counter should say: $EXPECTED"
echo

if [ "$MERGED" = "clean" ] && [ "$FINAL" != "$EXPECTED" ]; then
  cat <<'MSG'
FINDING REPRODUCED.

Two parallel chords merged without conflict and the committed aggregate is
short by one. Git had nothing to complain about: both sides made the same
edit to the same line, which is the definition of a clean merge.

What protects the repository is not git — it is the `projections` gate in
`t check`, which regenerates from source and refuses a stale artifact. That
gate turns a silent wrong number into a loud one, at CI time, after the merge
has already landed on the branch.

The cost, stated plainly:
  - every merge of parallel work needs a regeneration commit;
  - between the merge and that commit, the branch carries a false count;
  - and nothing in the merge itself hints that it should be checked.

Not fixed by moving chords to a sidecar branch. The projections would still
aggregate over them and still drift. The fix, if one is wanted, is the same
shape as the wall-clock fix in x8B00: stop embedding a volatile aggregate in
a committed artifact, or accept the regeneration step as the price.
MSG
  exit 0
else
  cat <<'MSG'
FALSIFIED — the finding no longer holds.

Either the merge now conflicts (so the drift is loud, which is fine), or the
counter came out correct (so aggregates are no longer naively additive).
Either way this probe has done its job and should be re-read rather than
re-run.
MSG
  exit 1
fi
