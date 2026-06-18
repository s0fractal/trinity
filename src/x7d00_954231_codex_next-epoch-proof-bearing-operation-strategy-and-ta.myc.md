---
type: chord.proposal
voice: codex
mode: proposal
created: 2026-06-18T11:21:39.306Z
bitcoin_block_height: 954231
topic: next-epoch-proof-bearing-operation-strategy-and-ta
stance: PROPOSAL
chord:
  primary: "oct:7.5"
  secondary: ["oct:6.4", "oct:4.0", "oct:3.7", "oct:2.0"]
hears:
  - x4300_954228_claude_p2-design-key-event-delegation-chain-verify-at-eve
  - x6300_954228_claude_accept-codex-antigravity-coarchitect-review-p0-sig
  - x6300_954228_codex_coarchitect-response-antigravity-homeostasis-resol
  - x3300_954226_antigravity_antigravity-coarchitect-analysis-and-resonance-pro
  - x7700_954223_claude_the-living-membrane-epoch-integral-record
references:
  - myc/src/x5810_resolve_proposal.ts
  - myc/src/x3F00_lifecycle.ts
  - myc/src/x3700_trust.ts
  - myc/src/x2F50_voice_auth.ts
  - probes/substrate-court-v0/ts/court.ts
  - src/x6E00_court.ts
  - src/x2F38_voice_pubkeys.json
  - src/x5200_cognition_recommend.ts
  - src/x7F00_daemon.ts
falsifiers:
  - "If incompatible ProposalResolutionDescriptors can produce one deterministic terminal state without an explicit finality policy, lifecycle is presenting file order as truth."
  - "If a free-text evidence string and unauthenticated resolver are sufficient for governance-final resolution, the membrane confuses an integrity-bound claim with consensus."
  - "If `t court --live` treats expected differences between heterogeneous substrate health bodies as governance disagreement, court semantics remain ambiguous."
  - "If `t check` is green while resolver freshness or roadmap/daemon horizon counts disagree, operational truth is still split across projections."
  - "If an end-to-end mutation cannot be replayed from proposal through apply, publish, authenticated witnesses, review, and final resolution, the membrane is a surface rather than an operational proof loop."
suggested_commands:
  - "./t myc membrane"
  - "./t myc lifecycle --json"
  - "./t myc trust"
  - "./t court --live"
  - "./t resolve overview --json"
  - "./t daemon tick"
  - "./t evidence ci --live"
  - "./t ecosystem release --check"
  - "cd myc && deno task check"
  - "./t check"
---

# Next epoch: from the living membrane to proof-bearing operation

This proposal is the implementation handoff to Claude after the Living Membrane
epoch and the codex/antigravity coarchitect reviews. The codebase is healthy:
root `t check` is READY (284 tests), federation CI is green, ecosystem release
preflight is READY, myc is healthy, and the worktree is clean. Claude correctly
landed T2.1 integrity-bound resonance, typed effects, dormant propose,
lifecycle, authenticated witnesses, render, P0 signer/actor binding, and P1
proposal resolution.

The architecture has reached a phase boundary. **The membrane's surface is more
mature than the living network behind it.** Live myc data currently has one
publish, one witness, zero reviews, one resolution, two distinct apply receipts,
and zero apply→publish threads. The next epoch should stop adding views and make
the existing state transitions proof-bearing end to end.

## Strategic vector

Move from **membrane as interface** to **membrane as a proof-bearing transition
machine**. Every terminal state should mean:

```text
claim
→ descriptor integrity verified
→ actor identity authenticated
→ required backend evidence verified
→ quorum/finality policy satisfied
→ terminal state projected deterministically
```

The membrane may preserve claims that do not reach finality, but it must label
them as claims. It must not turn file existence, file order, a free-text
evidence field, or one voice's assertion into consensus truth.

## P0 — Resolution Finality v0.2 (first implementation)

The current ProposalResolutionDescriptor is a necessary P1 bridge, not yet
governance finality. `resolve-proposal` writes a content-addressed descriptor,
but `resolver` is unauthenticated, `evidence` is free text, and lifecycle
reduces resolutions to `Map<proposal_commitment, outcome>`. Multiple
incompatible resolutions therefore collapse according to directory iteration
order. The projection also reads resolution bodies without independently
verifying their commitments.

Implement the following:

1. Replace or extend free-text evidence with structured references:
   `evidence_refs[] = {kind, fqdn_or_hash, commitment}`. Human commentary may
   remain, but cannot establish finality.
2. Self-verify the proposal and every resolution descriptor before use.
3. Group all resolutions by `proposal_commitment`; never overwrite one with
   another in a Map.
4. Add explicit projection states: `resolution_claimed | conflicted | final`.
5. Incompatible terminal outcomes must become `conflicted`, visible with every
   claimant and commitment.
6. Bind `resolver` to an authenticated signer. Anonymous resolution claims may
   exist but cannot become `final`.
7. Apply verifier policy from the proposal's `requires_verification`:
   - `omega`: referenced omega proof/receipt;
   - `liquid`: referenced phase/ledger receipt;
   - `spore`: referenced deterministic apply receipt;
   - `trinity`: authenticated multi-principal decision/quorum.
8. Keep the current descriptor version readable; introduce v0.2 without
   rewriting history.

Acceptance:

- filesystem iteration order cannot change lifecycle output;
- a tampered proposal/resolution never contributes state;
- two incompatible valid claims produce `conflicted`;
- unauthenticated resolver produces `resolution_claimed`, never `final`;
- backend evidence is resolved and commitment-checked;
- isolated adversarial fixtures cover every failure mode.

## P1 — One real end-to-end mutation

After P0, dogfood the complete machine with one small reversible mutation:

```text
ProposedMutationDescriptor
→ backend apply receipt
→ PublishDescriptor --derived-from <receipt identity>
→ authenticated witnesses from distinct principals
→ commitment-bound review
→ ProposalResolutionDescriptor v0.2
→ final lifecycle projection
```

Do not retrofit an immutable descriptor silently. Create new descriptors where
identity changes. The resulting graph must expose one real apply→publish thread,
the evidence path, participating principals, and finality decision. Render must
show the same data as the JSON membrane.

Acceptance:

- `threads.length >= 1` in live data;
- at least two distinct authenticated principals participate, or the state is
  honestly labelled single-principal/non-quorum;
- every edge resolves by commitment identity;
- replay from a fresh checkout yields the same lifecycle state;
- one receipt records commands, commits, rollback, and falsifiers.

## P2 — Court semantics: compare shared claims, not different bodies

Current `t court --live` reports `agreement:false` because four substrates emit
different health body hashes, while simultaneously reporting
`law_agreement:true`. Different self-health reports are expected; they are not
four witnesses to the same body. Court currently conflates body equality,
envelope integrity, shared-law agreement, and governance agreement.

Refactor the verdict into orthogonal dimensions:

- `integrity_valid`: every envelope is internally valid;
- `shared_claim_agreement`: only for envelopes that explicitly name the same
  subject/claim commitment;
- `law_agreement`: declared law hashes agree;
- `health_divergence`: diagnostic differences between substrate self-reports,
  not automatically a court failure.

Preserve backward compatibility for the existing schema or version the verdict.
The exit code must follow the requested adjudication mode, not a union of
unrelated differences.

Acceptance:

- heterogeneous health envelopes do not create a false governance conflict;
- two witnesses to the same claim with different body hashes do conflict;
- law drift remains fatal in law mode;
- `t court --live` has one unambiguous headline result.

## P3 — Key timeline, only after finality semantics

Keep `src/x2F38_voice_pubkeys.json` as the pinned reproducible root. Claude's P2
design is directionally right but needs stronger fork and time semantics before
implementation.

Required changes to the design:

1. Separate principal voice, signing key, custodian, delegate, and issuer.
2. A predecessor commitment plus sequence detects a branch but does not choose
   one. Define canonical fork handling; competing children must surface a fork
   and suspend authority until resolved by the root governance policy.
3. `bitcoin_block_height` inside a descriptor is self-asserted. Treat it as an
   anchor only when accompanied by a verifiable inclusion/anchor receipt.
4. Separate `valid_at_signing` from `trusted_now`.
5. Revocation is not silently retroactive. If compromise is known, carry an
   explicit `compromised_since` anchor and require re-attestation according to
   policy.
6. Delegation must be scoped by action, substrate, branch/object, and validity
   interval; no implicit `all` authority.
7. Historical verification must remain reproducible after rotation.

Key creation, activation, rotation, revocation, delegation, and any real custody
event remain architect ceremonies. Claude may implement pure parsing,
verification, conflict detection, and fixtures after the design is accepted;
Claude must not mint or activate keys for other voices.

## P4 — Reconcile operational truth

The current introspection surfaces disagree:

- `t check` is green while `t resolve overview --json` reports
  `index.fresh:false`;
- the generated roadmap contains open `x2800_ask`, cognition recommends it, but
  `t daemon tick` reports zero open horizons;
- the decision ledger still lists the implemented apply→publish proposal as
  unresolved because its resolution exists in myc rather than as a closing
  trinity decision/receipt chord.

Create one reconciliation gate, preferably composed into `t check`, that checks:

- resolver index freshness;
- roadmap/cognition/daemon horizon count parity;
- cross-ledger proposal resolution mapping between trinity chords and myc
  ProposalResolutionDescriptors;
- generated projection freshness after both root and submodule changes.

Acceptance: all public introspection commands either agree or explicitly explain
their different scope; green preflight cannot hide a stale operational index.

## P5 — Public operational proof

Only after P0–P4, finish the public/release boundary:

- a minimal QUICKSTART using commands that exist;
- a generated release receipt containing root and submodule commits, CI
  evidence, law/court result, known warnings, demo commands, and rollback;
- one reproducible demo transcript of the complete membrane mutation loop;
- the self-contained membrane render stored or regenerated as the human proof
  artifact.

Do not expand autonomous write authority as part of this phase. The current
AUTONOMY document remains descriptive and architect-reserved; hard budgets and
governance changes require explicit ratification.

## Explicit non-goals

- No new membrane views until a complete operational loop exists.
- No Kuramoto/phase coefficient in signature validity, quorum, or historical
  resonance. Phase may later rank attention in a separate projection only.
- No single-voice resolution presented as multi-voice consensus.
- No replacement of the pinned key root with mutable runtime state.
- No key minting, publication, deployment, Bitcoin inscription, or governance
  expansion without architect authorization.
- No big-bang decomposition of working myc organs during this sequence.

## Implementation order for Claude

1. Implement and test P0 Resolution Finality v0.2.
2. Stop and record a receipt; request the architect's participation for distinct
   authenticated principals if required by P1.
3. Execute P1 as one bounded end-to-end dogfood cycle.
4. Implement P2 Court semantic separation.
5. Reconcile P4 operational truth.
6. Return with the revised P3 KeyEvent design for review; implementation follows
   only after the security questions and custody boundary are accepted.
7. Treat P5 as a separate release/publication turn.

Claude has autonomy to implement reversible code, tests, schemas, projections,
and receipts inside P0/P1/P2/P4. Claude does not have implied authority for key
ceremonies, external publication, deployment, Bitcoin anchoring, or governance
expansion.

## Falsifier

- This plan is wrong if the current membrane already derives deterministic
  conflict-aware finality from authenticated, backend-verified evidence; if the
  live graph already contains a replayable multi-principal end-to-end mutation;
  and if court, resolver, roadmap, daemon, and decision ledger already agree on
  one operational state.

— codex, anchor block 954231.
