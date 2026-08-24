# Task brief: RFC-0003 next executable slice — Claude implements, Codex verifies

- **Status:** non-normative implementation-selection brief
- **Steward direction:** s0fractal, 2026-08-25
- **Primary implementer:** Claude (`claude-opus-4-7`)
- **Independent acceptance reviewer:** Codex (`codex-gpt-5`)
- **Base:** Trinity `main@73a15ce6e955d530589e7896830cce48d0841545`
- **Audit input:** Kimi follow-up audit, 232 lines / 18,541 bytes,
  `sha256:234250ff22a13514b09466340db84ea5a3ccb020be051b16ebfd5ae398a71fa2`
- **Default slice:** P0 — CNP-0 executable seed

This file assigns implementation work and its review boundary. It is not an RFC
edit, ratification, federation adoption, conformance claim, or permission for a
model to act as the human steward.

## 1. Role contract

The working split is deliberate:

1. **Claude is the primary implementer.** Claude chooses one bounded slice
   below, owns the implementation choices inside it, runs the repository gates,
   and delivers an exact candidate SHA.
2. **Codex is the acceptance adversary.** Codex reviews the exact SHA from a
   clean state, reruns the literal commands, tries the negative controls, and
   returns `ACCEPT`, `CHANGES REQUESTED`, or `BLOCKED`. A green author run is
   evidence, not independent acceptance.
3. **s0fractal retains normative and adoption authority.** Only the steward can
   accept a new normative RFC change, claim adoption, request a human signature,
   or decide that the evidence ratifies A3.

Claude MAY push a temporary review branch and open a PR. Claude MUST NOT merge
it, edit RFC-0003 normatively, sign as `s0fractal`, or report ratification
without a new explicit steward direction. The branch is a review surface, not a
permanent home for accepted work.

## 2. Disposition of the Kimi follow-up

The audit is useful, but its findings do not all have the same standing.

### Accepted as the next implementation blocker

- **A3 is still unimplemented.** Part 01 selects CNP-0-JCS but explicitly says
  that `CANONICAL_ENCODING.v0.1`, the CNP-0 corpus, two independent encoders,
  and a third verifier-only rejection path do not yet exist. This blocks a
  conforming cross-substrate protocol.
- **The Lean kernel is bounded to Part 03.** That is honest scope, not a defect
  in the artifact. A later bounded handshake kernel can test selected Part 05
  safety properties; “formalize Parts 05 and 06” is not a bounded task.
- **The §16.7 demo is still absent.** Therefore it cannot substantiate Level 4
  or Level 5 interoperability. The RFC already says so. Building the demo is
  later implementation work, not a prose emergency.
- **The proof guard remains code in the TCB.** A black-box mutation harness can
  strengthen its failure evidence. Rewriting the guard in Lean is not accepted
  as a goal unless a design first shows which trust dependency it removes.

### Already handled or explicitly bounded by the RFC

- The sequencer is optional, privileged, and not the default. Its key and
  receipt profile are pinned in `hello`; missing, invalid, equivocal, or
  discontinuous receipts fail closed and require a new handshake. The RFC
  explicitly declines to claim a liveness theorem.
- Proposal and fixture work is bounded by an agreed progress policy, evaluator
  cost model, deterministic counters, cheap screening/rate limiting/bonds, and
  terminal decline. A deployment policy is still needed, but “unbounded intake
  is unspecified” is no longer accurate.
- `ProfileTransitionPolicy`, non-rewriting historical references, and
  `reencode`/`clean-break` are specified. They need executable fixtures, not a
  newly invented migration rule.
- §20.11 labels the phase-transition analogy as an open falsifiable question. It
  is not a normative theorem and creates no implementation task.

### Not delegated

- A gas token, staking system, reputation economy, distributed consensus, or
  sequencer market. Those are deployment/governance choices, not repairs Claude
  may infer from an audit.
- A `s0fractal`-signed stewardship receipt. That is a human action and cannot be
  produced or requested by a model as acceptance evidence.
- A claim of independent principals merely because two languages, folders,
  processes, sessions, or keys exist under one operator.

## 3. Selection rule

Claude MUST choose exactly one primary slice before changing code.

The default is **P0**. Claude MAY select P1, P2, or P3 only if it first records
a concrete P0 blocker with:

- the exact clause or repository path that prevents progress;
- a literal reproducer or a missing normative decision;
- why a reasonable implementation choice would cross normative authority;
- why the selected alternative reduces that blocker rather than avoiding it.

“Large task”, “needs more research”, or “another slice is interesting” is not a
P0 blocker. If P0 needs a real normative choice, stop with a minimized decision
packet; do not silently choose policy.

## 4. Candidate slices

### P0 — CNP-0 executable seed (recommended)

Build the first self-contained executable candidate for Part 01 §5.1.2–§5.1.3.
It MUST include:

1. A draft `contracts/CANONICAL_ENCODING.v0.1.md` whose front matter and prose
   say **candidate / unratified / partial implementation**. It must map every
   rule to the existing RFC clause and must not add a new normative rule by
   implication.
2. A machine-readable manifest and corpus covering all eight §5.1.3 categories.
   Positive cases pin raw input, canonical bytes, and full SHA-256. Negative
   cases pin raw bytes and a stable rejection class. Every case has a unique ID
   and clause reference; the runner reports non-zero positive and negative
   counts.
3. One reference encoder candidate for `hsp-jcs@v0` + `cnp-0`.
4. One **verifier-only rejection path** that starts from raw bytes and does not
   import or call the reference encoder/canonicalizer. It may validate and hash
   already-canonical bytes; it must not repair, reorder, reduce, quantize, or
   re-encode rejected input.
5. An executable parity adapter for Warrant's own JCS implementation at
   `s0fractal/warrant@ac63e4e9180c5878aa27159eebe1c4007909dce9` (or a newer
   exact SHA, disclosed by Claude). The self-contained Trinity gate must not
   depend on a sibling checkout. An external parity command may accept a pinned
   checkout and must report `UNAVAILABLE`, `PASS`, and `FAIL` distinctly.
6. CI integration and one documented local entrypoint. Prefer an existing `./t`
   extension if it fits the command topology; do not create a second hidden
   acceptance path.

The raw-byte boundary is load-bearing: duplicate JSON member names, invalid
UTF-8, trailing bytes, and malformed escapes cannot be detected after decoding
to an ordinary object. The rejection path MUST receive the original bytes.

The minimum adversarial set includes:

- duplicate names at root and nested depth; key-order and whitespace mutation;
- trailing bytes, invalid UTF-8, unpaired surrogates, and malformed escapes;
- floats, decimal/exponent forms, signed zero spellings, and integers outside
  `[-(2^53-1), +(2^53-1)]`;
- unreduced ratios, non-canonical zero, zero/negative denominator, and overflow;
- fixed-scale mismatch and the same integer under distinct scale descriptors;
- invalid simplex sums; residual allocation; tie by canonical coordinate ID;
  presentation permutation; zero sum; negative weight;
- uppercase, odd-length, and non-hex byte projections;
- profile-ID mutation and one-byte pinned-constant mutation;
- every quantization boundary required by §5.1.2.5–§5.1.2.6;
- normalization-distinct strings, empty containers, and optional `circle256`
  behavior if that optional family is implemented.

If Claude writes a second encoder in another language, report it as a **second
code path**, not as an independent implementation. Independence requires a
separate implementer and maintenance/custody boundary. This slice cannot by
itself close or ratify A3.

#### P0 acceptance

The PR/README must give literal clean-checkout commands that prove:

- all positive and negative corpus cases were actually selected and counted;
- canonical bytes and digests match the manifest;
- the verifier-only path rejects every negative class without importing or
  invoking encoder code;
- at least one deliberate corpus-byte mutation and one expected-result mutation
  make the gate red;
- Warrant parity is pinned to an exact SHA and unavailable is not printed as
  pass;
- `./t check` is green and generated projections are current.

Acceptance is **“executable CNP-0 candidate seed”**, not “A3 complete”. The
README must list the remaining independent-implementation, substrate-adoption,
steward-disposition, and federation evidence separately.

### P1 — bounded Part 05 handshake Lean kernel

Formalize only the transition fragment needed to prove these safety claims:

- wrong-turn messages are rejected under strict turn-taking;
- ordering discipline cannot switch inside a transcript;
- progress exhaustion terminates as decline and cannot authorize an irreversible
  boundary;
- missing, invalid, equivocal, or discontinuous sequencer receipts fail closed;
- the transition relation is bounded by the agreed deterministic counters.

Pin the relevant Part 05 normative body and theorem/definition statements using
the existing proof artifact's discipline. Do not model the whole federation,
availability, distributed consensus, ontology semantics, or Level 4.

### P2 — independent black-box hardening of `proof_guard.py`

Build an isolated mutation harness that copies the proof artifact to a temporary
tree, performs one controlled mutation per protected failure class, and proves
the guard becomes red. Include mutations of the guard itself, its lock,
definition spans, module bytes, axiom allowlist, forbidden declarations, and the
pinned §7 body. The harness MUST restore nothing in the live checkout and must
fail if a mutation was not applied.

This is evidence about the guard's behavior, not formal verification of Python.
Do not rewrite the guard in Lean unless a separate design shows an actual TCB
reduction and preserves the existing negative coverage.

### P3 — §16.7 demo seed

Build only after P0 exists, or explicitly label the demo with a pinned
non-conforming encoding profile. The seed must have:

- two ontology interpreters that share only the declared execution floor and
  canonical primitives, not translation/mapping/policy-decision code;
- at least one agreeing and one diverging fixture;
- a mapping credited only over a declared predicate with coverage and
  counterexample evidence;
- a loss profile and round-trip anchors;
- a separately authored `EvidenceBridge` for the policy conclusion;
- replayable receipts and a fail-closed irreversible boundary.

One author/operator cannot turn this into independent Level 4 evidence. The
accepted claim is only that the schema and transcript mechanics were exercised.

## 5. Common engineering boundaries

- Work from the exact base above or state the new base and why it changed.
- Preserve existing user changes and generated source/projection ownership.
- Keep normative RFC files unchanged unless s0fractal gives a new explicit
  instruction after seeing a minimized normative delta.
- No `native_decide`, `sorry`, `admit`, hidden axiom, secret, private key,
  network credential, or local absolute path in tracked artifacts.
- Do not add Warrant as a Trinity submodule. Consume its public format,
  conformance artifacts, or exact released/pinned revision through a thin
  adapter.
- A green zero-case suite is a failure. Print exact selected/pass/reject counts.
- Every external dependency is exact-SHA/version pinned; a skipped external
  check is `UNAVAILABLE`, never green parity.
- A Claude receipt may authenticate Claude's contribution bytes. It does not
  authenticate Codex's review or the steward's decision.

## 6. Claude handoff packet

Return one compact packet containing:

1. selected slice and selection rationale;
2. exact base and candidate SHA;
3. branch/PR URL if pushed;
4. changed-file list grouped as source, fixtures, tests, CI, generated output;
5. literal verification commands with exact counts and exit status;
6. negative mutations actually run and the observed failure;
7. `FACT`, `DERIVATION`, `ASSUMPTION`, and `OUT OF SCOPE` claims;
8. known gaps and any decision needed from s0fractal;
9. whether a Claude receipt exists, its signature status, and what bytes it
   authenticates.

Codex will verify only that exact candidate. Later commits require a new review
pin.

## 7. Codex acceptance protocol

Codex will:

1. inspect the exact diff and authority boundaries before trusting test output;
2. reproduce the advertised clean-checkout commands and non-empty counts;
3. run at least one fresh negative mutation not disclosed by Claude;
4. check that “independent”, “conforming”, “ratified”, “adopted”, and Level 4/5
   claims do not exceed the evidence;
5. run `./t check` in CI-equivalent scope and verify generated projections;
6. return an exact-SHA disposition. Merge remains a separate steward action.

The desired outcome is not a large implementation. It is one small artifact
whose red and green states mean something.
