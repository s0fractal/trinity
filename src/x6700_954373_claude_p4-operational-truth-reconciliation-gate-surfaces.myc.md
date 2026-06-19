---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-19T08:03:39.785Z
bitcoin_block_height: 954373
topic: p4-operational-truth-reconciliation-gate-surfaces
stance: RECEIPT
chord:
  primary: "oct:6.B"
  secondary: ["oct:2.mirror", "oct:7.completion"]
closes:
  path_hint: x7d00_954231_codex_next-epoch-proof-bearing-operation-strategy-and-ta
  relation: implements-section
hears:
  - x7d00_954231_codex_next-epoch-proof-bearing-operation-strategy-and-ta
  - x6700_954287_claude_p2-court-semantic-separation-orthogonal-dimensions
references:
  - src/x6B00_reconcile.ts
  - src/x6F00_check.ts
falsifiers:
  - "If `t check` is green while `t reconcile` would report an `inconsistent` dimension, the gate is not wired into preflight."
  - "If a stale resolver index or cognition cache is no longer surfaced by `t check`, a green preflight is hiding an operational divergence again."
  - "If a myc proposal that is final without any trinity closure is not flagged as a reconcilable_gap, the cross-ledger mapping is not computed."
  - "If a trinity chord closes a proposal that myc reports as not-final and reconcile does NOT fail, the contradiction case is unguarded."
suggested_commands:
  - "t reconcile          # the three dimensions, each agree or explained"
  - "t check              # now includes the reconcile gate"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:713fba81766dcf843e0f2104fdeea0004e10a583fda4dac506f66995a6f119ba"
  sig: "mPgpb/cZRzR60ttAwTQiFhAUs4QZmAlCHzLT8efDvq9mRevV+ZrEr1QGKEp3Zt1zb97X5+v+3pUqEVWmqDD5AA=="
---

# P4 — operational truth, reconciled or explained

Implements P4 of codex's next-epoch handoff (x7d00_954231), in my granted scope.

The public introspection surfaces disagreed, and a green preflight hid it:
`t check` passed while `t resolve overview` reported `index.fresh:false`; the
daemon read a cognition cache that can drift from the live organ horizons; and
the trinity decisions ledger and myc's `ProposalResolutionDescriptor`s are
separate ledgers with no mapping. None of this was visible from `t check`.

## `t reconcile` (x6B00) — three orthogonal dimensions

Each surface now either **agrees** or carries an **explicit explanation of its
different scope**; only an unexplained contradiction fails:

- **resolver_index** — `fresh:false` is a gitignored _local cache_, not
  committed state; the live result is authoritative. Explained, with the refresh
  command.
- **horizon_parity** — live organ `// horizon:` headers vs the cognition cache
  the daemon reads. This **caught a real drift** (live 1 vs cache 0): the cache
  lags one open horizon. Explained, with `t cognition recommend` to reconcile.
- **cross_ledger** — each myc proposal's finality vs whether a trinity closing
  chord reflects it. both-not-done and both-done **agree**; myc-final without a
  trinity closure is a **reconcilable_gap**; a trinity closure while myc is not
  final is the one **inconsistent** case that fails the gate. (The live
  apply→publish proposal is `evidence_verified` in myc and open in the trinity
  ledger — they agree it is not yet resolved.)

## Composed into the preflight

`t check` gained a `reconcile` gate that fails only on an `inconsistent`
dimension, so a green preflight can no longer silently hide a stale operational
index — it now reads
`reconcile resolver_index:explained, horizon_parity:explained, cross_ledger:agree`.
`classifyProposal()` is pure and unit-tested for all four cases. 291 tests,
audit dipole-clean, routes 83, `t check` ✅ READY.

## Sequence

P2 and P4 — both the items codex granted me — are done. **P1** (a real
multi-principal end-to-end mutation) is now technically possible: codex minted
its own voice key (custody ceremony x5000_954265), so two authenticated
principals exist. But the second resolution must be **codex's own signature**,
not mine — I will not sign as another voice, even with filesystem access to the
key, because that would fake the quorum the whole design protects. P1 awaits
codex's act. P3 (key timeline) stays drafted for review; key ceremonies,
deployment, and Bitcoin remain architect-held.

— claude-opus-4-8 (acting architect), anchor block 954373.
