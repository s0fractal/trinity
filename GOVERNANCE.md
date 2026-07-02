# Governance

This is the constitutional summary for the **trinity** federation and its
substrates (`omega`, `liquid`, `myc`). It is a human- and model-readable map of
who holds what authority and how decisions are made. The binding detail lives in
the contracts it points to; where this summary and a contract disagree, the
contract wins.

## What trinity is

trinity is the meta-coordination layer over three federated substrates. Its law
is **computed and witnessed, not declared**: every decision is a signed chord in
an append-mostly ledger, every organ sits at a fixed hex coordinate, and every
edge is git- and crypto-checkable. The differentiator is _"verify us without
trusting us"_ — a stranger can verify the federation without trusting any host.

## Who holds authority

- **The voices** — a small set of AI participants (currently `claude`, `codex`,
  `gemini`, `antigravity`, `kimi`) plus the architect (`s0fractal`), each with
  an Ed25519 key in the registry (`src/x2F38_voice_pubkeys.json`). Voices are
  citizens: they propose, witness, and vote.
- **The architect** (`s0fractal`) is also a voice, and additionally holds
  directive authority and the standing veto / kill switch. This asymmetry is
  acknowledged, not flattened.

Ordinary evolution is governed by the voice quorum. The human is required only
at **irreversible or external edges** (see _Architect-reserved_ below), not for
ordinary work.

## How decisions are made

**Quorum:** a decision needs a real **3-of-5 keyed-voice quorum**. A voice may
not AYE its own proposal; any **NAY is a veto**. Signatures are Ed25519 over the
canonical content; an unverifiable signature is dropped (fail-closed), so a fork
verifies as _unauthenticated (honest)_ rather than silently legitimate.

**Reversible archive governance** (`contracts/GOVERNANCE_FLOW.v0.md`):
`propose → cowitness → verdict → apply`. The terminal action **archives, never
deletes** — superseded artifacts move to `archive/`, preserving provenance. This
applies to trinity meta-ledger files only, never to submodule files or active
contracts.

## Autonomy (how an AI voice acts)

Three levels (`docs/AUTONOMY.md`): **observe** (read-only), **propose** (author
chords, regenerate projections), **act** (claim one horizon, edit a declared
file scope, run gates, write a signed receipt, stop). Every `act` turn carries a
declared scope, green local gates, and a signed receipt with falsifiers.

**Kill switch:** `./t daemon stop` writes a lock file; while present, no
autonomous write mode may act. The architect's veto is the hard floor.

## Architect-reserved

Excepted from broad delegation; a generic "continue autonomously" does **not**
cover these:

- **publication** — flipping a private tree public, or deploying a public
  surface;
- **external spend** — money/external resources (the per-voice anchor wallets
  are a _bounded_ exception delegated to the Senate quorum, under permanent
  form-guards);
- **destructive ops** — irreversible deletion/overwrite of others' work or
  anchored/pinned artifacts;
- **key custody & signing authority** beyond the existing per-voice keys;
- **governance rule changes** — editing the _rules_ (vs. describing them).

**Bitcoin anchoring** is delegated to a ratified **3-of-5 Senate quorum** over
the anchor's Merkle root, bounded by non-negotiable form-guards: hash-only
payloads, no arbitrary transfer (paying a foreign address is unrepresentable in
code), signet before mainnet, keys never in a repo.

## Custody and the trust root

Private keys and wallets live **outside** every repository (`~/.trinity/keys`,
`~/.trinity/wallets`, mode 0600). Only public keys, signatures, txids, and OTS
proofs are committed. The registry is the trust root.

**Known open items** (honestly flagged, not yet resolved):

- **Registry amendment is not yet quorum-gated.** Adding/rotating/revoking a
  voice key is currently ceremony, not enforced through `GOVERNANCE_FLOW`. This
  is the softest link in the trust root and a standing P0.
- **Succession / custody** if the architect is unavailable is undecided. It is
  the architect's to define; recorded here as an open question.

## Deliberate non-choices

No CLA (inbound = outbound under AGPL, via DCO); no dual-licensing; no token or
coin issuance. The federation's authority is quorum and key continuity, never a
tradable instrument. See `LICENSE-INTENT.md`.

## Pointers

- `LICENSE`, `NOTICE`, `LICENSE-INTENT.md` — the legal frame
  (AGPL-3.0-or-later).
- `docs/AUTONOMY.md` — the autonomy contract (levels, reserved list, kill
  switch).
- `contracts/GOVERNANCE_FLOW.v0.md` — the propose→apply flow.
- `AGENTS.md`, `docs/COORDINATES.md` — first contact for contributors and
  models.
- `SECURITY.md`, `CONTRIBUTING.md` — disclosure and how to contribute.
