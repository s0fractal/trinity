---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-08-24T21:02:58.000Z
bitcoin_block_height: 963906
topic: rfc-0003-part-03-lean-errata-adoption
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:4.foundation", "oct:5.constraint"]
addressed_to: [s0fractal]
claim_kind: normative-draft-edit
signature_status: "signed by codex; authenticates this execution receipt and its relay of the user-channel directive, not an s0fractal signature, principal vote, conformance result, or ratification"
hears:
  - "free: s0fractal — after the Lean artifact and signed technical disposition were merged, explicitly directed `вносимо` for Completion B, TransformationProfile, SuitabilityAggregate, descriptor laws, and the C1/C6 clarifications"
references:
  - docs/rfc/0003-heterogeneous-state-protocol/00-architecture-and-ratification-map.md
  - docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md
  - docs/rfc/0003-heterogeneous-state-protocol/07-revision-history.md
  - proofs/rfc-0003/README.md
  - proofs/rfc-0003/theorems.lock.json
  - proposals/rfc-0003/claude-lean-kernel-task.md
  - src/x7700_963902_claude_rfc-0003-part-03-bounded-lean-kernel.myc.md
  - src/x2900_963905_codex_rfc0003-lean-kernel-pr16-disposition.myc.md
suggested_commands:
  - "git show --stat --oneline caafc43c3779f445514161966b363a9f0d8bc1e2"
  - "git show --stat --oneline 51513b1ce6222cec30fac58265541ad4b269129f"
  - "./proofs/rfc-0003/verify.sh"
  - "./t voice-keys verify-chord src/x7700_963906_codex_rfc-0003-part-03-lean-errata-adoption.myc.md"
  - "./t check"
falsifiers:
  - "Part 03 again collapses a pipeline to one of five kinds or lets an assumption marker erase source, rule, or counterparty obligations."
  - "The SuitabilityLevel order does not make unsuitable meet undetermined equal unsuitable."
  - "Aggregate composition may discard reasons, missing requirements, constraints, or evidence, or choose a within rule across mismatched descriptor addresses."
  - "A distortion, debt, or constraint operation can establish a composite law without cited law evidence under the consuming policy."
  - "The Lean guard accepts a Part 03 normative body other than sha256:4313d7667212b64ea6307f80d2e43833e0b9762cf696713d3a672110d2a80c7d."
  - "This receipt is cited as an s0fractal signature, tranche satisfaction, implementation conformance, adoption by a federation, or RFC ratification."
expected_after_running:
  proof_kernel: "132 theorems and 63 definitions; closed axiom allowlist [Quot.sound, propext]; §7 body pin 4313d7667212… at caafc43"
  repository_gate: "550 unit tests; every tracked chord signature valid; projections current"
claim:
  summary: "Applied the explicitly accepted RFC-0003 Part 03 errata as a separate normative draft commit caafc43c3779f445514161966b363a9f0d8bc1e2. TransformationKind now classifies one step while TransformationProfile canonically unions dependency markers, so reconstruction remains boundary-barred without absorbing other obligations. Completion B is normative as unsuitable < undetermined < bounded < suitable. SuitabilityAggregate preserves canonical reasons, missing requirements, constraints, and evidence; composition takes the level minimum, unions provenance, and uses one content-addressed within meet whose descriptor supplies order and algebra-law evidence. Loss-field monotonicity now applies to every kind, while the kind distinction governs attributed input/output fitness improvement; the conservative pipeline meet grants no automatic upgrade. Distortion, debt, and constraint component descriptors must cite the exact laws their composite claims use. Part 07 records C1-C7 dispositions and Part 00 updates the implementation and tranche surfaces. Commit 51513b1ce6222cec30fac58265541ad4b269129f repins the bounded Lean guard to the accepted §7 body without changing theorem statements, definition spans, module digests, toolchain, or axiom allowlist. These commits amend the draft; they do not implement HSP, satisfy Tranche C, establish conformance, supply an independent principal, or ratify the RFC."
content_sig:
  voice: codex
  alg: ed25519
  payload: "sha256:94c2ff57b2962183d6f365a65867d47a5ec707510b6c069bb124c66eb74adaa6"
  sig: "AaobowG0quJSXl7J1RLnSqI+m4vNTOFzogPONCi8R/ggRuybkDwJw87m+DDBOq5PIeIYdi0ktJnKSJQyo6gEBg=="
---

# Receipt: RFC-0003 Part 03 Lean-derived errata

The accepted change is intentionally split in two. `caafc43` is the normative
draft edit. `51513b1` is the proof-artifact disposition: it advances the §7 pin
only after mapping the revised clauses to the existing marker-set, Completion-B,
conditional full-payload, and descriptor-law models. That split keeps “the
specification changed” distinct from “the old bounded artifact was reviewed
against the new subject.”

The change resolves the contradictions made executable by the kernel. It does
not promote the kernel into the specification, and it does not turn a passing
kernel into evidence for the canonical encoding, an implementation, deployment
safety, independent adoption, or ratification.

## Falsifiers

- Any command in `suggested_commands` fails on the published tree.
- A consumer can compose different `withinAlgebra` addresses by preference.
- A measured refusal is hidden as `undetermined` after pipeline composition.
- A profile union drops a dependency marker or its obligation.
- A component operation supplies a signature but no evidence for a law the
  composite relies on.
- The relayed `вносимо` direction or this Codex signature is represented as an
  s0fractal cryptographic signature or a ratification vote.

— codex, anchor block 963906.
