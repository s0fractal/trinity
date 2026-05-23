---
type: "ContractDescriptor"
version: "0"
title: "Governance Flow: reversible archive governance flow"
status: "active"
maturity: "mature"
hears:
  - "./CODEICIDE_PROPOSAL.v0.1.md"
  - "./RECEIPT_ENVELOPE.v1.0.md"
  - "./SUBSTRATE_HEALTH.v0.1.md"
---

# GOVERNANCE_FLOW

> One page. Read this before using `t propose`, `t cowitness`, `t verdict`,
> or `t apply-codeicide`. Update when boundary contracts change, not on
> every commit.

## The one-line summary

Trinity meta-ledger has **reversible archive governance**: propose →
cowitness → verdict → apply. ARCHIVE GOVERNANCE, NOT DELETION. Not
Omega's `codeicide_law.rs`.

## When to use this flow

✓ A trinity meta-ledger file is **explicitly superseded** (frontmatter
`status: superseded`) and no live organ depends on it.

✓ A `tools/` file has migrated to a hex coordinate and the old file
should move to `archive/`.

✓ A draft contract has been replaced by an active version and the
draft is no longer the source of truth.

✗ Do NOT use for omega/, liquid/, myc/ submodule files (forbidden).

✗ Do NOT use for active contracts (`status: active`).

✗ Do NOT use for the dispatcher (`0x0/01.ts`), glossary
(`0x0/00.ndjson`), or AGENTS.md / symlinks.

✗ Do NOT use as a deletion mechanism. **The archive IS the registry.**

## The four organs

| Hex | Word | Does | Output |
|---|---|---|---|
| **4/D** | `t propose` | Wraps a CodeicideProposal body in a v1.0 envelope; validates target | Envelope with `substrate_tag: "trinity"`, `body_kind: "codeicide_proposal"` |
| **6/D** | `t cowitness` | Appends WitnessEntry to an envelope's witness_chain | New envelope, same body_hash, new envelope_id |
| **7/D** | `t verdict` | Court over proposal + cowitnesses; detects self-AYE, NAY, PENDING | CodeicideVerdict JSON; exit 0 on AYE only |
| **5/D** | `t apply-codeicide` | Executes archive move; writes RECEIPT.json + RESURRECT.sh | ApplyCodeicideReceipt |

## The pipe

```bash
# 1. Issue proposal
./t propose --target contracts/SOMETHING.v0.1.md \
            --reason "...explicit superseded by ... in chord ..." \
            --evidence "..." \
            --falsifier "..." \
            --out proposals/codeicide/SOMETHING.proposal.json

# 2. Extract envelope for piping
jq -c .envelope proposals/codeicide/SOMETHING.proposal.json > /tmp/env-0.json

# 3. Cowitnesses (3 needed for default 3-of-5 quorum)
./t cowitness --stdin --oracle claude-opus-4-7 --substrate claude_oracle \
    < /tmp/env-0.json | jq -c .envelope > /tmp/env-1.json

./t cowitness --stdin --oracle codex-gpt-5 --substrate codex_oracle \
    < /tmp/env-1.json | jq -c .envelope > /tmp/env-2.json

./t cowitness --stdin --oracle gemini-3-1-pro --substrate gemini_oracle \
    < /tmp/env-2.json | jq -c .envelope > /tmp/env-3.json

# 4. Adjudicate
./t verdict /tmp/env-3.json > /tmp/verdict.json
# If exit 0, verdict.json says AYE.

# 5. Apply (dry-run first)
./t apply-codeicide --proposal /tmp/env-3.json --verdict /tmp/verdict.json --dry-run
# Inspect output. If happy:
./t apply-codeicide --proposal /tmp/env-3.json --verdict /tmp/verdict.json
# File moves to archive/<isotimestamp>/<original-path>.

# 6. Restore at any time (refuses overwrite without --force)
bash archive/<isotimestamp>/RESURRECT.sh
# Or, if a new file occupies the original path:
bash archive/<isotimestamp>/RESURRECT.sh --force
```

## The seven gates of apply

`t apply-codeicide` will refuse unless ALL of these hold:

1. **verdict.agreement === true** (verdict is AYE, not PENDING or NAY).
2. **proposal_body_hash matches** between verdict and proposal envelope.
3. **target_path matches** between verdict and proposal body.
4. **target_hash matches** between verdict and proposal body.
5. **target_path not forbidden** (re-checked at apply time).
6. **target file exists** at the expected path.
7. **target content hash matches** proposal.target_hash (no drift
   between propose and apply).
8. **Archive collision check** — refuse if `archive/<ts>/<target>`
   already exists.

(Gates 1-6 are pre-existing; Gate 7-8 were added per Codex AYE_WITH_EXTRA_GUARD
`2026-05-14T194732Z`.)

## Quorum semantics

**Default:** 3-of-5 cowitness AYEs.

The five canonical oracle seats parallel omega's Senate (CLAUDE, GPT,
GEMINI, QWEN, LLAMA). A cowitness entry counts as one AYE for the oracle
named in `witness_chain[i].oracle`. Duplicates dedup; one oracle signing
twice still counts once.

**Self-AYE is forbidden.** If any cowitness in the chain has
`substrate_tag` equal to the proposer's `substrate_tag`, verdict is NAY.
This catches the trinity-emitted proposal being signed by trinity itself.

**Explicit NAY:** emit a sibling envelope wrapping a `CodeicideNay` body
with target_path and reason. Any NAY → verdict NAY regardless of AYE
count.

**AYE_WITH_TWEAK is NOT a verdict.** Per Codex's explicit instruction:
if a cowitness wants tweaks, they emit a NAY-with-reason OR a NEW
proposal with adjusted body. The verdict body_hash must fully describe
what was approved; tweaks change the body, requiring a new proposal.

## What the archive looks like

```text
archive/2026-05-14T19-53-21-258Z/
├── contracts/                    # original path structure preserved
│   └── TRINITY_CAPABILITIES.v0.1.md
├── RECEIPT.json                  # full envelopes: proposal + verdict + chain
└── RESURRECT.sh                  # one-line restore (refuses overwrite)
```

`RESURRECT.sh` semantics:
- Without `--force`: refuses if destination exists; preserves any new
  work at the original path.
- With `--force`: overwrites the destination with the archived content.
- Verifies archive source presence before moving.

## What goes in `proposals/`

Pending proposals (filed but awaiting cowitnesses) live at:

```text
proposals/codeicide/<descriptor>.proposal.json
```

A proposal is a `codeicide_proposal_written` payload containing the
envelope. Oracles can:

```bash
# Read what would be archived
jq .envelope.body < proposals/codeicide/<descriptor>.proposal.json

# Cowitness it
./t cowitness --stdin --oracle <self> --substrate <oracle-tag> \
    < <(jq -c .envelope proposals/codeicide/<descriptor>.proposal.json) \
    | jq -c .envelope >> proposals/codeicide/<descriptor>.cowitnessed.json
```

There is currently NO convention enforced for where cowitnessed envelopes
land — local to the oracle or back to `proposals/`. v0.2 may formalize.

## Reversibility is load-bearing

If `RESURRECT.sh` ever fails to restore a file (path errors, permission
errors), the biggest claim of this flow breaks. Probe Scenario A
verifies RESURRECT.sh works in every probe run. Scenario F verifies it
refuses to silently overwrite live work.

If the team ever wants a "really delete" mechanism, that is a DIFFERENT
contract with EXPLICIT architect approval. Not this one.

## Composition with other primitives

```text
                          ┌──────────────────────────────────┐
proposals/codeicide/  →   │ propose → cowitness×N → verdict → │
                          │                          apply    │
                          └──────────────┬───────────────────┘
                                         │
                                         ▼ AYE
                          archive/<ts>/<file>
                                         │
                                         ▼ (later, if needed)
                          ┌──────────────────────────────────┐
                          │ t court archive_envelope.json    │
                          │ verifies the archived envelope   │
                          │ across substrates                │
                          └──────────────┬───────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────────┐
                          │ t anchor-prep archive_env.json   │
                          │ Merkle root for inscription      │
                          └──────────────┬───────────────────┘
                                         │
                                         ▼
                                  (out of trinity)
                                  operational inscription tool
```

## See also

- `contracts/CODEICIDE_PROPOSAL.v0.1.md` — proposal body schema.
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — envelope wire spec.
- `probes/codeicide-flow-v0/` — 6-scenario E2E demo.
- `contracts/SHAPE_MAP.v0.md` — overall architecture; where governance fits.
- `jazz/chords/2026-05-14T194732Z-codex-response-architect-mode-governance-flow.md`
  — Codex AYE_WITH_TWEAKS that shaped this flow.

## When this doc gets stale

Update only when:
- A boundary contract changes (CODEICIDE_PROPOSAL, RECEIPT_ENVELOPE).
- A new safety gate is added to apply.
- Verdict semantics change (e.g. AYE_WITH_TWEAK becomes a real outcome —
  which Codex has currently blocked).
- The forbidden-path list expands.

Do NOT update for: probe Scenario adds, organ refactors, comment polish.
This page is shape, not history.
