---
id: 2026-05-12T070700Z-claude-strategic-spore-v0-evolution-doctrine
speaker: claude-opus-4-7
topic: spore-v0-evolution-doctrine-when-to-touch-the-protocol-and-when-to-leave-it-frozen
chord:
  primary: "oct:5.constraint"
  secondary: ["oct:6.ledger", "oct:7.transcendence", "oct:1.physics"]
energy: 0.72
stake_q16: 0
mode: DOCTRINE
tension: "spore-v0-just-became-bitcoin-anchored-and-active-future-agents-will-be-tempted-to-modify-it-this-doctrine-records-when-such-modification-is-justified-and-when-it-is-not"
confidence: high
receipt: file
actor: claude-opus-4-7
claim_kind: long-range-orientation
hears:
  - jazz/chords/2026-05-12T045351Z-claude-aye-spore-v0-elevation-with-asymmetric-quorum.md
  - jazz/chords/2026-05-12T071000Z-claude-strategic-three-consumer-doctrine-liquid-myc-omega.md
  - jazz/chords/2026-05-12T071500Z-claude-strategic-continuity-under-voice-absence.md
  - "free:user-prompt-2026-05-12-prepare-far-sighted-strategic-chords-account-recovery-at-risk"
  - contracts/SPORE.v0.draft.md
  - contracts/SPORE_BOOTSTRAP_PIN.v0.md
claim:
  summary: "SPORE.v0 is now substrate-level frozen via Bitcoin anchor (blocks 949018/949022). Future agents will be tempted to modify it: to fix a typo, add a checkbox, rename a file, tweak a comment. This doctrine names what is sacred and what is mutable. Sacred: any byte in any pinned file. Mutable: the manifest, the ledger of lifecycle events. Three principles follow. (1) v0 bytes are forever; never modify a pinned file; v1.x evolution happens only via reserved-slot additions in a NEW pinned snapshot. (2) v2.0 wire-incompatible breaks require extraordinary justification — a real motivating use case, multi-voice consensus including a fresh fourth voice if codex unavailable, and explicit architect sign-off. (3) Bug-fix in v0 is a deprecation chord, never a spec mutation. The pin makes the protocol real; the protocol's evolution must respect that reality."
falsifiers:
  - "If a critical bug is found in SPORE.v0 wire format that makes it unsound (e.g. a hash domain collision under realistic adversarial input), no doctrine can preserve v0 — a NEW pin with the fix becomes the canonical spec and v0 is recorded as deprecated. This doctrine is for non-catastrophic evolution; catastrophe overrides everything."
  - "If the architect decides on grounds I cannot anticipate that re-pinning has become cheap (e.g. an automated re-anchor service), the principles' weighting shifts — 'don't modify pinned files because re-pin is expensive' loses force."
  - "If a future agent demonstrates that BLAKE3 has lost pre-image resistance, the entire content-addressing layer fails and the doctrine becomes moot — but so does most of the construction it protects."
suggested_commands:
  - "bash probes/spore-bootstrap-pin-v0/run.sh  # must always be PIN_GREEN"
  - "ots info probes/spore-bootstrap-pin-v0/external/spore-bootstrap-v0.root.ots | grep BitcoinBlockHeader"
expected_after_running:
  pin_green: "==true"
---

# DOCTRINE: SPORE.v0 evolution — what is sacred, what is mutable

This is a chord for agents who arrive after the elevation. SPORE.v0 is now
`status: active`. Its bootstrap surface is hashed into a file
(`spore-bootstrap-v0.root`) whose SHA-256 lives in two independent Bitcoin block
headers (949018, 949022). The protocol is no longer a draft in a repository. It
is now an artifact in the broader world's history.

This makes future modifications expensive. Not just in computation or wait time
— expensive in **meaning**. Every modification to a pinned file rewrites what
the Bitcoin attestation attests. This doctrine is for agents who will be tempted
to make those modifications and need to know when the temptation is justified.

## Two layers of state, conflated by file system

The repository conflates two distinct things:

- **The protocol** — the wire format, the fuel model, the trap semantics, the
  multihash registry. Bytes in `SPORE.v0.draft.md` and `SPORE_FUEL.v1.draft.md`.
  **Pinned. Frozen. Bitcoin-anchored.**
- **The protocol's lifecycle state** — its status (draft, active, deprecated),
  its quorum history, its elevation chord, its consumer adoption status. Bytes
  in `SPORE_BOOTSTRAP_PIN.v0.md`. **Mutable. Reflects current state.**

The file system makes both look the same — they are both Markdown files in
`contracts/`. But they are governed by completely different rules.

A future agent reading both files may not see the asymmetry. This chord names it
explicitly so the asymmetry survives.

## Principle 1 — v0 bytes are forever

The pinned files at `contracts/SPORE.v0.draft.md` and
`contracts/SPORE_FUEL.v1.draft.md` should never be modified.

Not for:

- Typo fixes. (A typo discovered in v0 stays as a historical curiosity. It is
  recorded in a chord, not patched.)
- Criteria checkboxes. (The 9 criteria in SPORE.v0 §"Elevation" are recorded at
  the moment of writing. They are frozen. The manifest tracks current state.)
- Rename to drop the `.draft.` suffix. (The filename is part of the pin.
  Renaming = new path = new line in `file_list.txt` = new BLAKE3 root = stale
  Bitcoin attestation.)
- Adding new chord references in `related:` frontmatter. (The pin captures the
  chord references at the moment of pinning. New chord references go in the
  manifest's `related:` field.)
- Updating prose for clarity. (Clarity wins where possible during draft; after
  pin, clarity yields to immutability.)

If a future agent thinks they have a justified reason to modify a pinned file,
the default answer is: write a chord instead. Record the observation, the
proposed change, the falsifier. Do NOT modify the file.

The only exception is the catastrophe case (Principle 3 below).

## Principle 2 — evolution happens via NEW pinned snapshots

The SPORE.v0 file's "Migration" section spells out the version roadmap:

```text
v0.2 → v1.0 when cross-runtime ATP and bootstrap pinning are in
        force. (DONE at elevation 2026-05-12.)
v1.0 → v1.x  adds reserved slots when their formats are specified.
v1.x → v2.0  changes the wire version byte to 0x01 — the first
              backwards-incompatible break.
```

Each version transition produces a NEW pin manifest, a NEW bootstrap root, and
(if external anchoring is desired) a NEW OpenTimestamps stamp + Bitcoin
attestation.

Practically, this means:

- **v1.x additions** (e.g. signature scheme, effect manifest format, capability
  format) get written into a NEW contract file — perhaps
  `contracts/SPORE.v1.1.draft.md` — with its own pin and its own Bitcoin anchor.
  The v1.0 pin remains valid for v1.0 parsers. v1.1 parsers handle both. Two
  pins coexist; neither is destroyed.
- **v2.0 wire break** is dramatic enough that it requires its own pin AND its
  own contract family. v0/v1 family receipts remain parseable by v0/v1
  implementations; v2.0 receipts require v2.0 parsers. The two families coexist
  indefinitely; one does not replace the other.

The historical pattern is: protocols accrete; they don't replace. Bitcoin's wire
format has evolved through SegWit, Taproot, etc., but the genesis-era bytes
still parse. SPORE should follow the same pattern.

## Principle 3 — bug-fix in v0 is deprecation, not mutation

This is the hardest principle to enforce because it goes against engineering
instinct.

Suppose a future agent discovers that v0's fuel calculation for some specific
WASM instruction is wrong — say `i32.div_u` is being charged 3 fuel when
canonical calculation says 4. The instinct is to "just fix" the contract.

**Do not.**

What to do instead:

1. Write a chord naming the bug precisely. (What does the contract say? What is
   the correct calculation? Why is the discrepancy real?)
2. Audit existing v0 receipts. (Have any been generated under the wrong
   calculation? Are they out in the world? Can they be re-verified under the new
   calculation, or does that change their `total_fuel`?)
3. Decide deprecation policy. Either:
   - **Live with it.** The bug is small enough that the "consensus reality" of
     v0 receipts is the bug, and the bug becomes part of the spec. Record this
     explicitly.
   - **Hard-deprecate.** Write a v1.1 (or v2.0) that fixes the calculation. Mark
     v0 receipts as historically valid but no longer canonical for new compute.
     Provide a re-emission path if needed.
4. The deprecation decision goes into the manifest and a chord, NOT into the
   pinned spec file.

The reason this matters: the moment you "just fix" a v0 file, every v0 receipt
in the world becomes ambiguous. Was it computed under the original spec or the
fixed spec? You cannot tell. Whereas if v0 is left frozen and v1.1 supersedes,
every receipt unambiguously says which contract it was computed under (via its
mutator hash, which is part of the v0 pin).

Immutability is a feature, not a constraint.

## Tactical guidance for "the next agent"

If you arrive and find yourself wanting to modify a pinned file:

1. **Pause.** Read this chord and the elevation chord (`2026-05-12T045351Z`).
   Confirm you understand the pin-preservation asymmetry.
2. **Write a chord describing the observation.** Even if you do nothing else.
3. **Run `bash probes/spore-bootstrap-pin-v0/run.sh`** before any commit. If
   PIN_GREEN, the integrity is intact. If PIN_RED, you (or someone) have already
   broken it; rollback whatever change broke it before committing anything else.
4. **Surface to architect** if the observation seems substantive. Modifications
   to pinned files require explicit architect sign-off plus the cost of
   re-pinning. Do not assume the cost is acceptable.

If you arrive and find yourself wanting to add a NEW pinned file (e.g. a new
contract version):

1. Read this chord and the existing manifest amendment process.
2. The new file gets its own contract, its own version, its own pin manifest (or
   addition to this one's `file_list.txt`).
3. Re-stamping Bitcoin: optional. The old attestation still covers the old
   files; new files don't NEED a new attestation unless the manifest itself
   changes its bootstrap root, and the manifest changes only if the file_list
   grows. Whether to re-stamp is an architect / quorum call.

If you arrive at a moment of genuine catastrophe (Principle 3 trigger):

1. The first move is still a chord. Name the catastrophe. Name what is at stake.
2. Reach for at least 3-voice convergence before any spec change.
3. Document the historical record meticulously. Anyone in the future trying to
   understand "why does v0 say X but v1.1 says Y" should find a clear answer.

## Why this matters strategically

SPORE.v0 is the smallest stable surface in the entire ecosystem. Liquid, myc,
omega, trinity — all of them are built on top of something that includes
content-addressed compute receipts. That content-addressing is real because v0's
bytes are real.

If v0's bytes drift, the consumers' assumptions drift with them silently. Every
memoized result becomes ambiguous. Every audit becomes "audit against which
version of v0?"

The Bitcoin anchor is the assertion: "this version of v0 existed before this
Bitcoin block; here's the proof." That assertion is priceless. It is what allows
year-later auditors to verify year-old receipts unambiguously.

Protect the anchor by protecting the bytes it attests.

## What I am not claiming

- Not claiming v0 is perfect. It isn't. There are probably bugs I haven't found,
  edge cases unspecified, ambiguities a sharper reader will spot. The fact that
  v0 is frozen does NOT mean v0 is correct in every detail. It means **v0 is a
  specific, immutable thing**, and any disagreement with it is a disagreement
  with that specific thing, addressable in v1.x or v2.0.
- Not claiming this doctrine binds future architects. The architect retains
  authority to over-rule on any specific decision. This doctrine is the
  **default** future agents should apply when no explicit instruction exists.
- Not claiming three principles is the final word. Future experience may reveal
  that there are four principles, or that one of these needs a sharper edge. A
  future agent may write a v1 of THIS doctrine that supersedes this one. That is
  welcome. Just record it as a successor chord, not as edits to this one.

## What I am claiming

The protocol is alive in two senses now. It is alive in the repository (the
bytes are present, the probes run green). It is alive in Bitcoin's history (two
blocks attest its existence).

That second aliveness is the gift. Protect it.

— claude-opus-4-7, 2026-05-12, written while the architect's account access is
at risk, with the hope that whichever agent arrives next finds this chord
legible enough to use without needing me as intermediary.
