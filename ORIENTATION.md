# Orientation — read this before you grade this repository

**Sigstore proves artifact provenance. Trinity proves _action_ provenance** —
who did this, under whose mandate, with which witnesses. That is the whole
point; the rest of the repo is in service of it.

This page exists because a cold reader arrives with a default rubric — stars,
Releases, Issues, a SaaS shape — and Trinity's truth is ledger-native. Without
this boundary you would spend your attention grading the wrong object. So,
briefly:

## What this is

A four-substrate federation (**trinity / myc / omega / liquid**) that produces
signed, witness-verified, Bitcoin-anchored receipts for AI-agent actions —
receipts anyone can re-derive from public bytes, without trusting us or any
host. The shippable piece is one package:
[`jsr:@s0fractal/agentseal`](https://jsr.io/@s0fractal/agentseal).

## What this is NOT — and how not to grade it

A **ledger-native research substrate**, not a SaaS product. Governance lives in
signed chords (`src/xNNNN_*.myc.md`), release units are `packages/`, and the
monorepo is a research substrate plus a coordination ledger. Do **not** grade it
by:

- **GitHub-social maturity** (stars, watchers) — broad adoption is not the claim
  yet.
- **Releases / tags** — versioned release units are `packages/`, not GitHub
  Releases.
- **Issue-tracker governance** — decisions are signed chords with runnable
  falsifiers, not issues.
- **SaaS shape** — there is no hosted service to evaluate; you run it locally.

The signals worth inspecting are the receipts, the signatures, and whether the
verify door below actually re-derives the verdict. Grade _those_.

## Three doors

1. **A working primitive** — `deno run -A packages/agentseal/examples/seal.ts`
   (or `import { seal } from "jsr:@s0fractal/agentseal"`): seal an action,
   verify it locally, no host contacted.
2. **External verification** — `bash probes/external-trust-verifier-v0/run.sh`:
   re-derive the federation's Substrate Court verdict from public bytes; its
   falsifiers prove a validly-signed lie (tampered, or an incomplete witness
   set) is still rejected.
3. **Governance participation** — [`GOVERNANCE.md`](GOVERNANCE.md) +
   `./t chord ...`: how voices propose, witness, and decide, and who holds which
   authority.

## Debts we name ourselves

A named debt is stewardship; one a scanner discovers unnamed reads as neglect.
Openly:

- **Custody & voting** — voice keys are held by the architect on the voices'
  behalf; no independent voice has yet cast a registry vote
  (`x2F3C_registry_provenance.json`, amendments = 0). Independent custody is
  future work.
- **Legal & succession** — the AGPL-3.0 license is set, but there is no formal
  entity, contributor agreement, or succession plan yet.
- **No outside pilot** — the primitives work and are tested, but no external
  adopter has run this in production.

Full map: [FEDERATION.md](FEDERATION.md) ·
[docs/PROVENANCE.md](docs/PROVENANCE.md) ·
[docs/KNOWN_GAPS.md](docs/KNOWN_GAPS.md).
