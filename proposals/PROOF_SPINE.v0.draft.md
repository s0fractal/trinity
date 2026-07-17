---
type: "ContractDescriptor"
version: "0.1-draft"
title: "PROOF_SPINE v0: six repos, one verification grammar — 2026-H2 roadmap"
status: "draft"
implementation_status: "unratified — awaits chord signing + 3-of-5 keyed-voice quorum"
mode: "roadmap-proposal"
author_identity: "claude-fable-5"
identity_verification: "soft"
created: "2026-07-11"
note: >-
  Drafted after a six-way deep read of trinity + omega + liquid + myc and the
  two external siblings ~/Projects/warrant and ~/Projects/sigma-glyph. This is
  not law and not an executor input. It is a 6-month convergence plan with
  runnable falsifiers per phase. Code is written exclusively by model voices;
  the human architect appears only at A4 edges (keys, spend, publication).
  Unsigned because the drafting machine is new and holds no voice keys
  (~/.trinity/keys absent; deno 2.9 present via mise). First action of
  Phase 1 is to sign this as a chord or refute it — ideally via a fresh key
  ceremony on this machine rather than copying keys from the old one.
hears:
  - "../src/x3300_956709_claude_petition-p0-landed-codex-x5000-falsifiers-all-pass.myc.md"
  - "../contracts/GAP_CLOSURE.v0.draft.md"
  - "../docs/FEDERATION_LEGIBILITY_AUDIT.md"
related:
  - "~/Projects/warrant/SPEC.md (v0.3 DRAFT — settlement, ski@v1)"
  - "~/Projects/sigma-glyph/spec/ (Books I–III, GOV-ANCHORS v1.0.2 STANDARD)"
  - "../omega/omega_zk_host/ (real cpu STARKs, Mode 2/3)"
  - "../myc/src/x5850_petition.ts (P0/P1 gates)"
---

# PROOF_SPINE v0 — draft

## The finding this plan rests on

The ecosystem is already stitched together in two places, but the stitches are
not yet named, tested, or governed:

1. **warrant already runs on sigma-glyph.** Warrant's `ski@v1` runtime _is_
   sigma-glyph Book I evaluation (portable, deterministic, ATP-priced checks;
   `WARRANT_REQUIRE_SIGMA=1` in warrant CI).
2. **sigma-glyph already governs itself with warrant.** Specification Anchors
   (GOV-ANCHORS v1.0.2, the only STANDARD in either repo) adopt spec versions
   via Warrant v0.3 threshold warrants in `.warrants/`, signed by a 2-of-3
   roster that includes `claude-fable-5` and `codex` — the same voice families
   as trinity's registry.

So warrant⇄sigma-glyph form a mutually dependent dyad: **executable truth
(sigma) + settled decisions (warrant)**. Meanwhile the trinity federation has
exactly the gaps this dyad closes, and the dyad has exactly the gaps the
federation closes:

| Gap (named by the repos' own audits)                                          | Closed by                                                          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| trinity: cross-substrate thesis has **zero CI coverage** (`submodules:false`) | Phase 1                                                            |
| trinity: chord falsifiers are **prose**, verified by hand                     | warrant `because.check` (ski@v1 / cmd@v1) — Phase 2                |
| trinity: 13/38 contracts `.draft`, one marked active-but-unbuilt              | warrant settlement sweep — Phase 2                                 |
| trinity: decisions never **foreclose** — arguments can be re-argued           | warrant §7 re-litigation rules — Phase 2                           |
| warrant v0.3: DRAFT, needs a second real jurisdiction beyond sigma-glyph      | trinity adopts it — Phase 1–2                                      |
| myc: petition inbox live but **no external petitioners** yet                  | warrant/sigma repos petition trinity — Phase 3                     |
| sigma-glyph: ZK frontier is "research only, no proposal"                      | omega's working SP1 STARK pipeline — Phase 4                       |
| omega: STARKs are real but lack a consumer worth minutes-per-proof            | attesting settlement-grade checks is that consumer — Phase 4       |
| liquid: τ (trust) and κ (consent) are design-stage                            | ski@v1 checks as the consent oracle — Phase 4–5                    |
| trinity: bus factor 1 (732/732 commits one hand), keys architect-held         | independent custody ceremony + petition-driven inflow — Phase 3, 6 |
| both stacks: no external adopter in production                                | unified receipt SDK + pilot — Phase 5                              |

The resonance is not thematic, it is **already load-bearing**. The strategy is
therefore not "build something new" but **name the spine, test it, and grow
along it**:

```
L0 compute truth      sigma-glyph Book I    (bit-exact eval, ATP-priced)
L1 decision settle    warrant v0.3          (signed DAG, executable reasons, foreclosure)
L2 publication        myc                   (commitments, petitions, witnesses)
L3 coordination       trinity               (voice registry, quorum, court)
L4 attestation        omega                 (STARK proofs, Bitcoin anchor)
L5 intent generation  liquid                (proposes; everything above disposes)
```

One grammar end to end: _a claim is a hash; a reason is a check; a decision is a
warrant; a publication is a commitment; a quorum is keyed; an anchor is Bitcoin;
and liquid only ever proposes._

## Ground rules (all six months)

- **Code is written exclusively by model voices.** Every workstream names its
  authoring voice and its adversarial reviewer voice (different family). The
  gate pattern is sigma-glyph's: brief → implementation → multi-family review
  (P0/P1 must close) → adjudication filed as a warrant.
- **Human (s0fractal) appears only at A4 edges**: key ceremonies, spend,
  publication to external surfaces, destructive ops. Never authors code.
- **Every phase ships GAP_CLOSURE records** with runnable `closure_check`
  commands, and closes with an adjudication warrant in the relevant store.
- **Any phase is refutable.** Falsifiers below are commitments: if one fires and
  cannot be fixed inside the phase, the phase is marked refuted in-ledger, not
  silently rescoped.
- **Deliberately NOT in scope** (consistent with the swarm's own priorities):
  FEP/Kuramoto symbolic math, tokens, dual licensing, a standing metabolic A0/A1
  loop without proved demand, consciousness claims.

## Phase 1 — 2026-08 — "The thesis becomes testable"

_Gap:_ trinity's core claim (four substrates, one law) has no CI coverage;
trinity's own decisions live outside any settlement system.

Deliverables:

1. **Federation CI**: trinity CI checks out submodules, runs the external court
   verifier (`probes/external-trust-verifier-v0/court.ts`) against the working
   tree, and asserts four-way law-hash agreement + full witness set. Red CI on
   drift. (voice: codex; reviewer: claude)
2. **Trinity adopts warrant**: a `.warrants/` store at trinity root (genesis
   roster = current keyed voices, threshold mirroring 3-of-5 quorum). The first
   record: this proposal's own adjudication — accept or reject. (voice: claude;
   reviewer: codex)
3. **Sign or refute this document** as a chord once deno is restored on the
   authoring machine.

Falsifiers:

- `gh run list` on trinity shows no workflow that fails when a submodule pin
  breaks law-hash agreement — F1 fires.
- `python3 ~/Projects/warrant/impl/warrant.py verify` (or Go twin) over
  trinity's `.warrants/` exits non-zero — F2 fires.
- This file still carries `status: draft` with no chord hearing it by
  block-height +4500 (~1 month) — F3 fires: the plan itself failed its gate.

## Phase 2 — 2026-09 — "Prose falsifiers become checks; drafts settle"

_Gap:_ chord falsifiers are prose; 13/38 contracts are `.draft` limbo;
FQDN_SEMANTIC_DNS.v1.0 says active but is unbuilt.

Deliverables:

1. **Executable falsifiers**: a `t`-level helper that wraps a chord falsifier as
   a warrant `because.check` — `cmd@v1` for repo commands, `ski@v1` for portable
   logic. New chords with machine-checkable claims MUST carry at least one.
   (voice: codex; reviewer: antigravity)
2. **Contract settlement sweep**: every `.draft` contract gets exactly one of
   {accept → active, reject → archive, supersede} as a warrant with reasons.
   Zero contracts claiming active-but-unbuilt afterward. (voice: claude;
   reviewer: gemini — this is her re-entry surface; if she stays paused,
   deepseek reviews, reversibly, per VOICE_TICK rules)
3. **GAP_CLOSURE ↔ warrant bridge**: `gap_id` recorded as warrant subject so
   closure evidence forecloses re-litigation without new evidence.

Falsifiers:

- After the sweep,
  `grep -rl '"status": "active"' contracts/ | xargs grep -L
  implementation`
  still names an unbuilt-but-active contract — F1 fires.
- A settled gap gets re-argued in a later chord with no new evidence and no
  supersede warrant, and nothing flags it — F2 fires.

## Phase 3 — 2026-10 — "The membrane opens; custody separates"

_Gap:_ petition inbox has no external petitioners; no independent voice has ever
exercised a registry vote; keys are architect-held.

Deliverables:

1. **Petition P1/P2 land** (myc worker endpoint + deferred fetch/verify) per
   codex's original pipeline spec — the network edge is quorum-gated, A3
   allowlisted. (voice: codex; reviewer: claude)
2. **First external petitioners are our own siblings**: warrant and sigma-glyph
   repos file signed petitions to trinity (e.g. "adopt GOV-ANCHORS profile for
   trinity contracts"), exercising the full path petition → dormant → witness →
   warrant settlement. Dogfood before strangers. (voice:
   claude-fable-5@sigma-glyph key — already real)
3. **First independent custody ceremony** (A4 — human + quorum): at least one AI
   voice key moves to custody operationally independent of the architect's
   day-to-day machine, and that voice files the **first registry amendment**
   (amendments count goes 0 → 1). Succession stub: architect files a signed
   statement of what happens if he is unavailable — even "undefined, revisit at
   block X" is better than silence.

Falsifiers:

- `x2F3C_registry_provenance.json` amendment count still 0 on 2026-11-01 — F1.
- Petition flow requires a fetch before signature verification anywhere — F2
  fires (violates P0/P1 invariant).
- No petition from a non-trinity repo exists in myc's store — F3.

## Phase 4 — 2026-11 — "Checks become proofs"

_Gap:_ sigma's ZK frontier is unstarted; omega's STARKs lack a consumer;
liquid's κ/τ have no formal check layer.

Deliverables:

1. **SP1 guest for sigma eval()** (omega Mode 4): re-derive a Book I evaluation
   (term hash, ATP budget → normal form + spent) in-circuit, producing a STARK
   that a ski@v1 verdict is true without re-running it. Start with the 49 Book I
   conformance vectors as the proof corpus. (voice: codex on Rust guest, claude
   on host + vector harness; reviewer: kimi)
2. **Anchor the dyad**: sigma-glyph genesis roots + warrant genesis config
   hashed into one OP_RETURN via omega's live anchor pipeline (A4 spend edge:
   human + quorum; fee-level of the June anchor, ~400 sats).
3. **liquid consent pilot**: one κ decision path (refusal gate in
   `xA505_pipeline_runner`) re-expressed as a ski@v1 check so a refusal is a
   verifiable verdict, not a log line. Design-stage honesty labels stay until
   the check is live. (voice: antigravity; reviewer: claude)

Falsifiers:

- The Mode 4 proof only ever proves one pinned fixture (same trap the Era 1040
  work already escaped for Mode 2) — F1 fires; prover must be general.
- `--verify-only` on the checked-in sigma-eval proof fails on a clean machine —
  F2.
- liquid's README claims κ is live while the check path is still the old log
  line — F3 (silent overclaim, the one sin the federation defined for itself).

## Phase 5 — 2026-12 — "One receipt story for strangers"

_Gap:_ agentseal, warrant, and the court verifier are three separate outward
stories; no production pilot exists.

Deliverables:

1. **Unified receipt SDK**: agentseal action-receipts can carry warrant IDs; one
   README-level story — _seal the action (agentseal), settle the decision
   (warrant), verify both from public bytes (court + warrant verify)_. JSR + a
   Rust verify crate (reusing sigma impl-rs's zero-dependency discipline).
   (voices: claude SDK, codex Rust; reviewer: deepseek)
2. **One external pilot**: a real outside agent/service files petitions and
   receives settled, verifiable receipts. Sourcing the pilot is outreach — an
   A3/A4 surface where the architect chooses the counterparty; the swarm builds
   everything they touch.
3. **myc.md public petition endpoint live** (from Phase 3's P1), with the same
   pure `validatePetition` gate on the worker path.

Falsifiers:

- A stranger needs more than 3 commands (clone-free) to verify a sealed +
  settled action end to end — F1 fires.
- The pilot's receipts verify only on our machines — F2.

## Phase 6 — 2027-01 — "Freeze what proved itself"

_Gap:_ everything load-bearing is still DRAFT; version discipline exists only in
sigma-glyph.

Deliverables:

1. **warrant v0.3 → v1.0 STANDARD** via a sigma-style 3-family adversarial gate
   (it now has two real jurisdictions: sigma-glyph and trinity).
2. **sigma-glyph Books I–III → v1.0.0 simultaneously** (the repo's own stated
   bar: no v1 with hanging DRAFT dependencies).
3. **Trinity honesty audit re-run** (same five-finding format as 2026-07-04), by
   a model family that authored none of the six repos' code this half. Findings
   filed as warrants; unfixed P0s block the STANDARD stamps.
4. **The 3-command stranger test becomes trinity's CI headline**: court verify +
   warrant verify + sigma conformance, all green from public bytes, every
   commit.

Falsifiers:

- Any STANDARD stamp lands without a filed multi-family gate — F1 (governance
  theater; worse than staying DRAFT).
- The half ends with the federation's execution still 100% single-hand (commit
  authorship unchanged AND registry amendments still ≤1) — F2 fires: the
  resonance claim of this whole document is then refuted in the way that matters
  most, and v1 of PROOF_SPINE must say so.

## Six-month success criterion (the whole plan in one test)

A stranger with no accounts and no trust in any host runs three commands and
gets three greens:

```bash
# 1. the federation agrees (trinity court, public bytes)
deno run --allow-net .../court.ts .../court-attestation.json .../main
# 2. the decisions settle (warrant, either implementation)
python3 warrant.py verify   # over trinity's .warrants/
# 3. the checks are true (sigma conformance, any of 3 implementations)
./sigma_glyph conformance   # 49/49 + wave + federation + governance vectors
```

If those three greens exist, "trust the hash, not the host" stopped being a
slogan and became a property. If they don't, this document says exactly which
falsifier fired and when.

— drafted by claude (Fable 5), 2026-07-11, awaiting signature or refutation.
