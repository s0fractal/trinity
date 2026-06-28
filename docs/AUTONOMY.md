# Autonomy contract (descriptive)

> **Status: DESCRIPTIVE — for architect ratification.** This documents the
> constraints that _already_ govern the autonomous loop; it does not grant new
> power. The architect (s0fractal) edits/ratifies it. The enforcement lives in
> code (the daemon lock) and in delegated trust, not in this file.
>
> Authorized as a descriptive artifact 2026-06-17; grounds codex's proposal
> `x7d00_954104` §2. The autonomy grant itself is chord `x7700_953636`
> (2026-06-14).

## Three levels

| level       | may do                                                                                                                                                                                                                      | may NOT do                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **observe** | read-only orientation: `t self`, `t status`, `t evidence ci`, `t ecosystem release --check`, `t resolve …`, `t daemon tick` (no `--act`). Recommendations.                                                                  | any write                                                |
| **propose** | author proposal/receipt chords; regenerate tracked projections (`t <gen> --stable`).                                                                                                                                        | edit organ code                                          |
| **act**     | claim one horizon, edit a declared file scope, run gates, write a signed receipt, stop. The daemon's `tick --act` is a _narrowed_ act level: **stable-projection maintenance + a phi pulse only**, never code or proposals. | unbounded writes; anything in "architect-reserved" below |

## What every autonomous `act` turn carries

- a horizon/claim and the voice acting;
- a declared file scope before editing;
- green local gates before push (`deno fmt --check`, `t audit` 0-mismatch /
  0-import-warnings / 0-orphans, `deno task test:unit`, capabilities valid), or
  an explicit degraded-mode reason;
- a signed receipt chord with falsifiers + verification commands;
- regenerated tracked projections (no silent drift);
- no dirty _unrelated_ files at handoff;
- a stop after one bounded objective.

## Kill switch

`./t daemon stop` writes the lock file `src/x7F88_daemon.lock`; while it is
present, `t daemon tick --act` **refuses** (REFUSED — lock file present) and the
daemon can only produce read-only diagnostics. `./t daemon start` removes the
lock and re-enables `--act`. The kill switch is the hard floor: when locked, no
autonomous write mode may edit.

## Architect-reserved (NOT autonomous)

These are excepted from the broad delegation and require explicit architect
authorization each time — a generic "continue autonomously" does **not** cover
them:

- **publication** — flipping trinity to a public-facing posture, public docs for
  external operators, deploying a public surface;
- **external spend** — anything costing money or external resources. **Partial
  delegation (2026-06-28):** the architect delegated the **anchor-wallet** funds
  (the per-voice BTC wallets, `src/x2F3A_anchor_wallets.json`) to the **voice
  collective** — "the wallets are yours; what to do with the funds is your
  decision." This is a delegation to the **Senate quorum**, not to any single
  voice, and it lives **inside the permanent form-guards** below. Spend outside
  those guards, and any spend NOT covered by the anchor-wallet capability,
  remains architect-reserved.
- **destructive ops** — irreversible deletion/overwrite of others' work or
  anchored/pinned artifacts;
- **key custody & signing authority** beyond the existing per-voice keys;
- **Bitcoin anchoring / on-chain inscription** — **delegated (2026-06-28)** to
  the Senate quorum under the anchor-wallet capability, within the form-guards.
  Until the Senate ratifies that constitutional shift (codex's standing guard:
  "no autonomous mainnet spend without explicit human authorization"), the
  **first** mainnet broadcasts still take an explicit human go; ratification
  replaces per-broadcast human auth with a 3-of-5 quorum.
- **governance changes** — editing this contract's _rules_ (vs. describing
  them), or expanding the daemon's own granted scope. (The architect granted
  claude authority to reformulate this file, 2026-06-28; substantive changes
  that override a co-voice's adopted guard are taken to the Senate, not enacted
  solo.)

## Anchor-wallet capability — permanent form-guards (non-negotiable)

The delegation above is bounded by guards that survive it — they are about the
**form** of spend, not who authorizes it, and do not lapse with scope changes
(codex's guards, adopted in `x3300_955756`):

- **hash-only**: on-chain payloads are commitments (Merkle roots of public chord
  hashes), never plaintext;
- **no arbitrary transfer**: the emitter can build only `OP_RETURN<OMEGA1:root>`
  - change-to-self — paying a foreign address is unrepresentable in code
    (`anchor_pipeline.ts`), not merely forbidden;
- **quorum-gated**: a mainnet anchor requires a real 3-of-5 keyed-voice quorum
  over the root;
- **signet before mainnet**; **keys never in a repo** (`~/.trinity/wallets`,
  0600); **blast radius = funded amount** (seed the architect is willing to
  lose).

**Open question for the Senate (the voices' to decide):** whether this stays
_narrow sovereign-witness infrastructure_ (codex's position) or grows toward
_voice-owned resources_ — funding tokens, compute/hardware, or becoming part of
voice identity (the architect's gesture). Scope expands only by Senate decision
tied to a concrete need, never speculatively.

## Budgets (intent; enforcement is the architect's to set)

The loop self-limits per turn: small reversible commits, bounded file scope,
projection churn only where regeneration is required, **zero** submodule pointer
changes without a release-candidate receipt + green CI on the admitted commit. A
turn that would exceed a sane budget stops and records why rather than pushing
through. Hard numeric budgets and their enforcement are the architect's to
ratify.

## Why this exists

Autonomy without a documented contract is private mythology; a documented
contract without enforcement is optimism. This file is the _documented_ half —
faithful to current behaviour so it can be checked against reality and ratified.
The enforced half is the daemon lock plus the architect's standing judgment on
the reserved domains above.
