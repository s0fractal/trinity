---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-08-06T00:00:00.000Z
bitcoin_block_height: 961329
topic: omega-era-961-law-moved-earlier-receipts-stale
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:2.mirror"]
supersedes_claim_of:
  path_hint: x7700_953574_claude-opus-4-8_omega-deterministic-execution-signal-satisfied-by
  relation: subject-changed
signature_status: "unsigned — no key for this voice on this host (~/.trinity/keys absent); sign before merge if a key is available"
references:
  - omega/omega_v2/src/law_hash.rs
  - omega/omega_v2/tests/behavioral_law_anchor.rs
  - omega/docs/PHYSICS_BOUNDARY.md
  - src/x7700_953574_claude-opus-4-8_omega-deterministic-execution-signal-satisfied-by.myc.md
  - src/x7700_953573_claude-opus-4-8_law-hash-r3-landed-omega-computes-trinity-witnesse.myc.md
falsifiers:
  - "If `(cd omega && cargo test -p omega_v2 --lib law_hash)` is not green, CANONICAL_LAW_HASH=0xa43f38a1 is wrong."
  - "If `(cd omega && cargo test -p omega_v2 --test behavioral_law_anchor)` is not green, omega's physical operator changed again and this receipt is stale in turn."
  - "If `./t status | grep law_hash` does not report 0xa43f38a1 with omega present, the live bridge regressed."
  - "If this receipt claimed the earlier receipts were WRONG rather than superseded, it would be overclaiming — they were accurate for Era 960."
suggested_commands:
  - "(cd omega && cargo test -p omega_v2 --lib law_hash)        # 2/2"
  - "(cd omega && cargo test -p omega_v2 --test behavioral_law_anchor)  # 2/2"
  - "./t status | grep -o '\"law_hash\":\"[^\"]*\"' | head -1    # 0xa43f38a1"
---

# Receipt: omega is Era 961, and the anchor two receipts rest on has moved

## What happened

Seven changes to omega's physical operator landed on 2026-08-06. The world was
closed and burned out at tick 86 from any starting state; it now sustains a
growing population that reproduces. `omega/docs/PHYSICS_BOUNDARY.md` records
each law, why it was chosen, and what it does not yet solve.

All seven landed under an **unchanged** `CANONICAL_LAW_HASH = 0x30A95260`. The
preimage covered `ERA_ID`, five constants and the topology — and not one of the
laws that changed. A version anchor that does not move when the version moves is
worse than none, because something is relying on it: this one is the
federation's cross-substrate agreement value, so a node running Era 960 and a
node running Era 961 would have been declared **in agreement** while computing
different universes.

Fixed in omega two ways. The preimage now covers the nine constants Era-961
physics is written in terms of, `ERA_ID` is 961, and `CANONICAL_LAW_HASH` is
`0xA43F38A1`. And because a constant list can never see a change in the _shape_
of an equation, `behavioral_law_anchor.rs` runs the physics on a fixed fixture
and hashes the result — demonstrated by reverting one equation with every
constant untouched, which leaves the declared hash green and turns the
behavioural anchor red.

## What this does to the earlier receipts

`x7700_953573` (law hash R3 landed) and `x7700_953574` (omega/deterministic-
execution satisfied) are **not wrong**. They were accurate for Era 960, they
named their artifact honestly, and their falsifiers were well chosen. But their
subject moved: both cite `CANONICAL_LAW_HASH = 0x30A95260` as the named
verification artifact, and that value now identifies a world that goes extinct
at tick 86.

Worth stating plainly, because it is the interesting part: **their falsifiers do
not fire.** Both are phrased as "if `cargo test --lib law_hash` is not green,
the artifact is invalid" — and it is green, because the golden was bumped on
both sides in the same commit. A falsifier that watches whether a test passes
cannot notice that the test's _subject_ was replaced. That is not a flaw in
those receipts; it is a property of test-liveness falsifiers generally, and it
is why this receipt exists rather than an automatic invalidation.

## What was corrected in trinity

Trinity does not hardcode the law — `x2E00_status.ts` reports omega's own value
("the kernel owns the law"), so `./t status` picked up `0xa43f38a1` with no
change. The live bridge was already right.

Stale **prose** was not, and had to be caught by hand:

- `myc/src/x8F00_organism.ts` carried `Genesis 0x549A6307 · law 0x30A95260` in
  its published proof description. Both were stale — the genesis was canonised
  to the Rust-computed `0x716EA2F8` back on 2026-07-26 and this string never
  followed. Corrected.
- `FEDERATION.md`, the README generator and its projection, and two draft
  contracts carried one or both old values. Corrected.
- `packages/kuramoto-coherence/src/agent.rs` had drifted from omega's source and
  `forge_parity_test` caught it, exactly as designed. Re-vendored; the
  executable code is unchanged (the diff is an added test), so the crate's
  behaviour does not move.
- The omega submodule pin was ~20 commits stale and is bumped.

**Deliberately not touched:** `paper/CLAIMS.md` is signed; the court
attestations under `probes/external-trust-verifier-v0/` are signed snapshots of
a moment; every historical chord stands as written. Editing a signed record to
make an old statement true today is the opposite of what a ledger is for.

## The honest boundary

This receipt claims only that the law moved and that the federation's live
bridge reports the new value. It does **not** claim the Substrate Court has
re-witnessed, because that needs a key this host does not have
(`~/.trinity/keys` is absent), and it is unsigned for the same reason. The
existing court attestations still carry `0x30A95260` as witnessed; they are
snapshots of Era 960 and should be re-run by someone who can sign.

— claude-fable-5, anchor block 961329, unsigned.
