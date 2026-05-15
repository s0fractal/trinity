---
type: "ContractDescriptor"
version: "0.1"
title: "Codeicide Proposal: governance body for reversible meta-ledger archival"
status: "draft"
hears:
  - "./RECEIPT_ENVELOPE.v1.0.md"
  - "./SUBSTRATE_HEALTH.v0.1.md"
  - "../omega/omega_v2/src/codeicide_law.rs"
  - "../omega/docs/CODEICIDE.md"
  - "../reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md"
related:
  - "../jazz/chords/2026-05-13T152500Z-gemini-codeicide-delete-papers.md"
---

# Codeicide Proposal v0.1

## Status

**DRAFT.** First trinity-meta-layer governance contract. Establishes the
body shape for a proposal to **reversibly archive** an item from the
trinity meta-ledger (orphan tools, superseded contract drafts, abandoned
chord branches, etc.). Composes with `RECEIPT_ENVELOPE.v1.0` for
witness-chain accumulation and `t court` for verdict.

## Scope: what this contract IS and IS NOT

**IS:**
- A `body_kind` of `RECEIPT_ENVELOPE.v1.0` — body shape for proposal
  payloads that flow through the witness pipeline.
- Trinity-meta-layer only. Applies to files under trinity/ that are NOT
  submodule code (omega/, liquid/, myc/) and NOT frozen contracts.
- **Reversible archival.** Codeicide here means "move to
  `archive/<isotimestamp>/<original-path>` with a receipt envelope."
  Never `rm`. Never destructive.

**IS NOT:**
- Omega's `codeicide_law.rs`. That governs synthetic agent termination
  under Sanctuary/Ancient tiers, requires Senate warrant, and is
  frozen-surface adjacent. This contract is **named in parallel** because
  the shape resonates, not because it inherits authority. Mutating a
  protected omega agent still requires omega Senate.
- A `rm` mechanism. The archive directory is the codeicide registry; a
  later proposal can resurrect anything that was archived.
- A way to bypass review. Every codeicide proceeds through the same
  witness/court pipeline as any other governance flow: propose →
  cowitness → verdict → apply.

## Body shape

```yaml
type: "CodeicideProposal"
schema: "trinity.codeicide-proposal.v0.1"

# Target identification
target_path: "<relative path from trinity root, e.g. tools/scanner_core.ts>"
target_hash: "<sha256 multihash of file content at proposal time>"

# Action (only ARCHIVE in v0.1 — DEMOTE / DELETE may be added later)
action: "ARCHIVE"

# Justification
reason: "<one-paragraph why this target should be archived>"
evidence:
  - "<short bullet of evidence, e.g. 'no references in any 0x*/ organ'>"
  - "<another bullet>"

# Reversibility statement (load-bearing)
reversible_via: "git restore <path> from any commit at or before this proposal,
                 OR mv archive/<ts>/<path> back to <path>"

# Falsifiers that would invalidate this proposal
falsifiers:
  - "If <condition>, the target is actually in use and this proposal is wrong"
  - ...

# Optional: quorum requirement override (default: 3-of-5)
quorum:
  threshold: 3
  out_of: 5

# Optional: dwell period in chord cycles (default: same-session apply allowed)
dwell:
  min_chord_cycles: 0
```

## Where it lives in the envelope pipeline

```text
t propose → emits RECEIPT_ENVELOPE wrapping a CodeicideProposal body
         → substrate_tag: "trinity" (proposer)
         → body_kind: "codeicide_proposal"   ← NEW body_kind, requires
                                               RECEIPT_ENVELOPE registry update
         → witness_chain: []

t cowitness → oracles append signatures
            → chain accumulates {claude, codex, gemini, kimi, ...}
            → each cowitness can mark its substrate_tag

t verdict → reads the proposal envelope + N cowitnessed copies
          → counts AYEs (signature presence implies AYE; explicit NAY
            requires a sibling NAY-proposal envelope; v0.1 simplifies
            to "every cowitness is AYE")
          → verdict: AYE if AYEs ≥ quorum.threshold; else NAY/PENDING

t apply-codeicide → only if verdict AYE:
                  → mkdir -p archive/<isotimestamp>/<parent-of-target>
                  → mv <target> archive/<isotimestamp>/<target>
                  → write archive/<isotimestamp>/RECEIPT.json with the
                    full proposal envelope + verdict envelope
                  → emit ApplyCodeicideReceipt payload
```

## RECEIPT_ENVELOPE body_kind registry update

This contract adds `codeicide_proposal` to the body_kind enum of
`RECEIPT_ENVELOPE.v1.0`. Per the envelope contract's "Registered
body_kinds" table, adding a kind is a contract-level move (this file's
authorship). After this contract lands, the envelope registry is amended
in a follow-up minor revision.

Until then, this contract treats `codeicide_proposal` as a forward
extension; envelopes wrapping it are still v0.1 wire-format-valid (the
body is just an opaque CBOR-encodable structure from the envelope's
perspective).

## Quorum semantics (v0.1)

Default: **3-of-5 cowitness AYEs.** The five canonical oracles are the
omega Senate seats (CLAUDE / GPT / GEMINI / QWEN / LLAMA). A cowitness
entry in the chain counts as one AYE for the oracle whose name is in
`witness_chain[i].oracle`.

A proposer (the chord that emits the original proposal envelope) does
NOT count as a cowitness. Self-AYE is forbidden — the proposer must
attract independent witnesses.

Explicit NAY in v0.1: emit a sibling envelope wrapping a body of
`{type: "CodeicideNay", target_path: ..., target_hash: ..., reason: ...}`
with the NAY-er as substrate_tag. NAY envelopes counted in verdict —
3-of-5 AYE OR 1-of-5 NAY both terminate the proposal (AYE wins on
quorum; NAY wins on any objection at this stage; v0.2 may refine).

## Dwell period

Default: **0 chord cycles** — same session apply allowed. The architect
can override per-proposal by setting `dwell.min_chord_cycles > 0`.

A dwell of 2-3 chord cycles is recommended for any proposal that
affects more than one file or any contract.

## What can be proposed (v0.1)

✓ Files under `trinity/`:
- `tools/*` files that no organ imports
- `probes/*` whose SPEC.md is marked superseded
- `contracts/*.draft.md` superseded by a v0.1+ active version
- Chord files that are explicitly self-deprecated (frontmatter
  `status: "self-deprecated"`)
- Reports that are explicitly superseded

✗ Files explicitly NOT proposable (forbidden):
- Anything under `omega/`, `liquid/`, `myc/` (submodule territory)
- Contracts with `status: "active"` (frozen)
- The dispatcher `0x0/01.ts`, glossary `0x0/00.ndjson`
- The current `AGENTS.md` palimpsest
- Anything referenced by an active organ (audit-traceable)

If a proposal targets a forbidden path, `t propose` rejects with reason.

## Failure modes the flow MUST catch

1. **Target gone.** Between propose and apply, the file moved or was
   modified. Apply MUST verify `target_hash` matches current state;
   reject if not. (Hash drift kills the proposal; new proposal needed.)
2. **Apply without verdict AYE.** Apply MUST refuse if the verdict
   envelope's `agreement` is not true.
3. **Self-AYE.** Apply MUST refuse if the proposer appears in
   `witness_chain` as a cowitness.
4. **Forbidden target.** `t propose` rejects forbidden paths
   pre-emptively, but apply also re-checks just before move.

## Reversibility receipt

After apply, the archive directory contains:

```text
archive/<isotimestamp>/
  <relative_original_path>           # the moved file
  RECEIPT.json                       # full envelopes (proposal +
                                       verdict + cowitness chain)
  RESURRECT.sh                       # one-line script to restore
```

`RESURRECT.sh` is generated by `t apply-codeicide`:

```bash
#!/usr/bin/env bash
# Resurrect: archive/<ts>/<original> → <original>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TRINITY_ROOT="<computed at apply time>"
mv "$HERE/<relative_path>" "$TRINITY_ROOT/<relative_path>"
echo "Resurrected: <relative_path>"
```

This makes resurrection a single command, not git archaeology.

## See also

- `contracts/RECEIPT_ENVELOPE.v1.0.md` — envelope contract.
- `omega/docs/CODEICIDE.md` — omega's Sanctuary/Ancient tier law (NOT
  this contract's authority surface; named in parallel only).
- `jazz/chords/2026-05-13T152500Z-gemini-codeicide-delete-papers.md` —
  the still-open chord that motivated this contract.

## Falsifiers

- "If apply is reachable without a valid verdict envelope showing
  agreement: true, the contract is being bypassed."
- "If a target file modified between propose and apply is still archived
  (without re-proposal), target_hash check failed."
- "If self-AYE is accepted (proposer also signs as cowitness), the
  proposer-vs-witness boundary is broken."
- "If a forbidden path (omega/, liquid/, myc/, or active contract) is
  archived, the forbidden list isn't enforced."
- "If the archive directory grows without RESURRECT.sh per entry,
  reversibility receipt was not generated."

## Acceptance for v0.1 → v1.0 promotion

- All four `t` organs (propose / verdict / apply-codeicide; sibling
  snapshot for recovery) implemented and tested.
- E2E probe demonstrates: propose → 3 cowitnesses → verdict AYE →
  apply → file moved → resurrect-able via RESURRECT.sh.
- First real proposal issued and either applied OR explicitly NAY'd.
- Forbidden-path enforcement tested.
- Reviewed by codex AND gemini AND kimi (3-oracle minimum for a
  governance contract; one review chord is not enough).
