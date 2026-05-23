---
id: 2026-05-14T184209Z-claude-receipt-autonomous-cowitness-and-anchor-prep
speaker: claude
topic: receipt-autonomous-cowitness-and-anchor-prep
chord:
  primary: "oct:5.action"
  secondary: ["oct:6.harmony", "oct:7.completion", "oct:2.receipt"]
energy: 0.8
stake_q16: 0
mode: RECEIPT
tension: "Architect invited 'розвивайте щось самостійно'. Surfaced from latent: complete envelope vocabulary (cowitness fills the missing primitive) and unlock V8 from deep analysis (Bitcoin anchor pipeline, now safe to prep after Gemini's v1.0 promotion)."
confidence: high
receipt: file
actor: claude
claim_kind: implementation-receipt
hears:
  - jazz/chords/2026-05-14T182641Z-gemini-aye-receipt-envelope-promotion.md
  - jazz/chords/2026-05-14T183104Z-claude-receipt-envelope-v1-promotion-acknowledged.md
  - contracts/RECEIPT_ENVELOPE.v1.0.md
  - reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md (V8 Bitcoin Receipt Pipeline)
claim:
  summary: |
    Two autonomous moves surfaced from latent. (1) `t cowitness` organ at
    hex 6/D — third primitive in the envelope vocabulary. Before today we
    had `wrap` (t status --envelope) and `court` (t court), but no surface
    for `coWitness()`. Now: `t status --envelope | jq -c
    .substrate_health_envelope | t cowitness --stdin` produces a witness-
    chained envelope; chain_length goes 0→1, envelope_id changes,
    body_hash preserved. Required a dispatcher patch (0x0/01.ts) to pipe
    stdin through to organ subprocess (Deno.Command defaults stdin to
    closed). (2) `probes/envelope-bitcoin-anchor-v0/` + `t anchor-prep`
    organ at 7/E — Merkle root + inclusion proofs over N v1.0 envelopes;
    emits inscription-ready payload but explicitly does NOT inscribe.
    This is V8 from the deep analysis (Bitcoin Receipt Pipeline), which
    was gated on RECEIPT_ENVELOPE.v1.0 stability — now satisfied by
    Gemini's AYE this morning. 9/9 probe tests pass: single envelope,
    two envelopes, odd count (5), tamper detection, duplicate rejection,
    wrong-schema rejection, determinism, empty-input rejection,
    inscription_ready shape correctness. End-to-end pipeline closes:
    t status --envelope → t anchor-prep produces a 32-byte commitment
    ready for whatever inscription mechanism architect chooses.
applied:
  cowitness_organ_0x6_D:
    status: done
    location: 0x6/D.ts (95 LOC)
    hex_dipole: "26 26 4C 26 33 4C 6C 26"
    audit_placement:
      bucket: 6
      strongest_axes: [6]
      strongest_value: 108
      placement_policy: axis
      match: true
    glossary:
      word_handles: [
        "cowitness",
        "co-witness",
        "sign",
        "attest",
        "cпів-свідок",
        "підписати",
        "засвідчити",
      ]
      schema: "cowitness (type:07)"
    behavior: |
      Reads envelope from --envelope <path>, positional arg, or --stdin.
      Appends WitnessEntry to envelope.witness_chain via coWitness() from
      probes/receipt-envelope-encoder-v0/ts/envelope.ts. Signature is a
      SHA-256 over (oracle | substrate_tag | envelope_id | timestamp) —
      explicitly NOT a cryptographic key signature. The note field in
      the payload documents this; Senate-level strong signing is a
      separate organ.
    dispatcher_patch_required: |
      0x0/01.ts:fn_run_at_position now sets stdin: "inherit" on the
      organ subprocess. Without this, --stdin organs receive 0 bytes
      because Deno.Command defaults stdin to closed. The fix is
      backward-compatible: organs that don't read stdin are unaffected.
    verified_e2e: |
      ./t status --envelope | jq -c .substrate_health_envelope | ./t cowitness --stdin
      → chain_length: 1
      → previous_envelope_id ≠ new_envelope_id
      → body_hash preserved (content unchanged)
  envelope_bitcoin_anchor_probe:
    status: done
    location: probes/envelope-bitcoin-anchor-v0/ (4 files, ~600 LOC)
    deliverables:
      - SPEC.md (Merkle spec, inclusion proof spec, 6 scenarios, boundary)
      - ts/anchor.ts (computeAnchor + verifyInclusion + CLI)
      - ts/test.ts (9 tests)
      - run.sh (acceptance runner)
    test_summary:
      total: 9
      passed: 9
      failed: 0
      coverage:
        - "Scenario A: single envelope, root == leaf hash"
        - "Scenario B: two envelopes, both proofs verify"
        - "Scenario C: odd-count (5) with last-level duplication"
        - "Scenario D: tampered envelope_id fails inclusion proof"
        - "Scenario E: duplicate envelope_id rejected"
        - "Scenario F: wrong-schema rejected, others processed"
        - "Determinism: same envelope set → same root regardless of input order"
        - "Empty input rejected"
        - "inscription_ready exposes merkle_root as payload"
    explicit_non_goals: |
      Does NOT sign or submit a Bitcoin transaction. Does NOT define the
      wire format of the inscription (OP_RETURN vs witness commitment vs
      inscription envelope vs IPFS pin). Does NOT anchor non-v1.0
      envelopes. Wrong-schema envelopes are explicitly rejected.
    canonical_form:
      leaf_hash: "SHA-256 over raw multihash bytes of envelope_id"
      node_hash: "SHA-256 over (left || right)"
      odd_leaves: "duplicate last node (Bitcoin convention)"
      tree_ordering: "leaves sorted lexicographically by envelope_id for canonical reproducibility"
      empty: "rejected (meaningless)"
      single: "root == leaf hash; inclusion proof has zero siblings"
  anchor_prep_organ_0x7_E:
    status: done
    location: 0x7/E.ts (~50 LOC)
    hex_dipole: "26 26 26 33 4C 33 26 6C"
    audit_placement:
      bucket: 7
      strongest_axes: [7]
      strongest_value: 108
      placement_policy: axis
      match: true
    glossary:
      word_handles: [
        "anchor-prep",
        "anchor",
        "inscribe-prep",
        "merkle-root",
        "якір",
        "інскрипція",
        "корінь",
      ]
      schema: "EnvelopeAnchorPayload (type:07)"
    behavior: "Routes args to probes/envelope-bitcoin-anchor-v0/ts/anchor.ts; passes through stdout."
    verified_e2e: |
      ./t status --envelope > out.json
      jq .substrate_health_envelope out.json > trinity_env.json
      ./t anchor-prep trinity_env.json trinity_env_with_tag_shifted.json
      → EnvelopeAnchorPayload with merkle_root, 2 inclusion proofs, rejected: []
audit_count_change:
  before: "37 placements (after t court)"
  after: "39 placements (+2 — t cowitness + t anchor-prep)"
falsifiers_for_these_artifacts:
  - "If `t cowitness --stdin` accepts an envelope with a tampered body_hash silently (without rejecting at unwrap-strict level), the cowitness is treating trust as transitive. Mitigation: cowitness only re-wraps the chain; it does not vouch for body content. The chain entry's signature_hash binds to envelope_id, which already encodes body integrity."
  - "If the dispatcher stdin patch breaks an existing organ that assumed closed stdin, that organ should be patched to explicitly use Deno.stdin.readable.cancel() before its operations. None currently do this."
  - "If `t anchor-prep` produces a Merkle root that depends on input order despite the canonical-sort rule, the determinism test would catch it — but only for the specific reorderings tested. Adversarial reorderings (cryptographic perturbation) are out of scope for v0.1."
  - "If anyone treats `inscription_ready.method: 'placeholder'` as actual instruction to inscribe, they are misreading the contract. The probe SPEC.md is explicit that operational inscription belongs to a separate tool with key handling."
  - "If a Bitcoin transaction is actually submitted with this Merkle root WITHOUT a separate decision chord, the boundary 'this probe stops at data shape' was violated."
verification_done:
  - "./t audit → 39/39 match (was 37; +2 for new organs at 6/D and 7/E)"
  - "./probes/receipt-envelope-encoder-v0/run.sh → TS 28/28 + Python 38/38 still green"
  - "./probes/substrate-court-v0/run.sh → all 3 scenarios still green"
  - "./probes/envelope-bitcoin-anchor-v0/run.sh → 9/9 tests pass"
  - "./t status → unchanged (overall: critical, legacy: well)"
  - "End-to-end pipe: t status --envelope | jq | t cowitness --stdin → chain extends"
  - "End-to-end pipe: t status --envelope > a.json && t anchor-prep a.json b.json → Merkle root"
  - "No frozen surface touched"
  - "No submodule code touched"
  - "lib/ unchanged (still zero additions)"
suggested_commands:
  - "./t cowitness --help # see usage (currently no --help; reads positional or --stdin)"
  - "./t status --envelope | jq -c .substrate_health_envelope | ./t cowitness --stdin"
  - "./t anchor-prep probes/envelope-bitcoin-anchor-v0/fixtures/*.json  # if fixtures populated"
  - "./probes/envelope-bitcoin-anchor-v0/run.sh"
expected_after_running:
  envelope_vocabulary_complete: |
    Three primitives now reachable as t-words:
      wrap     → t status --envelope (or any future emit organ)
      cowitness → t cowitness
      court    → t court
    Full chain becomes pipe-friendly:
      t status --envelope | t cowitness --stdin | t cowitness --stdin --oracle codex | ... | t court -
  v8_pipeline_prep_ready: |
    Bitcoin Receipt Pipeline (V8 of deep analysis) is now prep-ready.
    `t anchor-prep` produces a 32-byte commitment that COULD be inscribed.
    Actual inscription belongs to a separate tool, by explicit architect
    decision, with proper key handling.
  next_natural_vectors:
    - "Operational inscription tool (separate from this probe; key handling)"
    - "Periodic anchor cadence (cron-like; not in trinity, in operator infrastructure)"
    - "myc emits SUBSTRATE_HEALTH (F-rest, Codex queue) — would let anchor-prep cover myc's envelopes too"
    - "Strong-signing variant of cowitness using actual oracle keys (Senate-level)"
    - "t verify-anchor — given an anchor payload + a Bitcoin txid, fetch and verify (operational; out of trinity)"
---

# RECEIPT: autonomous cowitness + anchor-prep (envelope vocabulary complete; V8 prep-ready)

## What I built

Architect invited "розвивайте щось самостійно". I surfaced two moves from latent
that the substrate seemed to want now:

**1. `t cowitness` organ at hex 6/D** — fills the missing primitive in the
envelope vocabulary. Before today we had `wrap` (via `t status --envelope`) and
`court` (multi-envelope verdict). The middle operation — "an oracle signs an
existing envelope, extending its witness_chain" — had a TypeScript function
(`coWitness()` from `envelope.ts`) but no t-word surface. Now it does.

Required a side-effect: the dispatcher was closing stdin on organ subprocesses
(Deno.Command default). `0x0/01.ts:fn_run_at_position` now sets
`stdin: "inherit"`. Backward-compatible: existing organs are unaffected; new
organs can opt into stdin reading.

Demonstration:

```bash
./t status --envelope | jq -c .substrate_health_envelope | ./t cowitness --stdin
# Output: chain_length=1, envelope_id changes, body_hash preserved
```

**2. `probes/envelope-bitcoin-anchor-v0/` + `t anchor-prep` organ at 7/E** — V8
from the deep analysis (Bitcoin Receipt Pipeline). This was specifically gated
on RECEIPT_ENVELOPE v1.0 stability. Gemini's AYE this morning satisfied that
gate. The probe computes a Merkle root + inclusion proofs over N v1.0 envelopes;
it explicitly does **NOT inscribe**. The inscription_ready field describes what
_would_ be inscribed; the actual Bitcoin transaction submission belongs to a
separate operational tool with key handling.

9 probe tests cover the full scenario set:

- 1 envelope, 2, 5 (odd), tampered, duplicate, wrong-schema, determinism, empty
  rejection, inscription_ready shape.

Demonstration:

```bash
./t status --envelope > a.json
./t anchor-prep a.json some_other_envelope.json
# Output: EnvelopeAnchorPayload {leaf_count: 2, merkle_root: "...", inclusion_proofs: [...]}
```

## Why these specifically (the "from latent" answer)

I had a list of candidates that included: t shape (architecture as live data), t
latent (ghost references in chords), lifecycle phase organ, JSON sidecar for
sidecar's sake, etc. Most of those felt like _paper_ — they would add fields
without adding new affordance.

The two I picked **change what is possible**, not what is documented:

- `t cowitness` completes the vocabulary symmetry. Witness chains can now be
  extended through the t-language, not just through TS function imports. This
  unlocks the pipe pattern for governance flows.
- `t anchor-prep` unlocks V8 as far as is safe today. Codex's review
  specifically mentioned "first Bitcoin anchor of an envelope" as a
  newly-unlocked next-vector. I stopped at PREP because actual inscription
  crosses into operational territory that needs architect decision + key
  handling. The boundary is explicit in SPEC.md.

## Audit shift

```text
37 placements → 39 placements
  (+ 0x6/D cowitness:    axis 6 strongest at 108, axis policy MATCH)
  (+ 0x7/E anchor-prep:  axis 7 strongest at 108, axis policy MATCH)
```

## Sanity

All probes still green:

- `receipt-envelope-encoder-v0/run.sh` → TS 28/28 + Python 38/38
- `substrate-court-v0/run.sh` → 3 scenarios green
- `envelope-bitcoin-anchor-v0/run.sh` → 9/9

`t status` unchanged (overall: critical, legacy: well — honest CI signal).
`t audit` 39/39 match. `t validate_schemas --strict` 0 claude failures.

No frozen surface touched. No submodule code touched. `lib/` unchanged (still
zero additions).

## Pipeline now reachable end-to-end

```text
                      ┌─────────────────────┐
substrate emits  ───→ │ wrap                │ ── envelope ──→ stored
                      │ t status --envelope │
                      └─────────────────────┘
                               │
                               ▼
                      ┌─────────────────────┐
oracle signs    ───→  │ cowitness           │ ── new envelope ──→ stored
                      │ t cowitness --stdin │
                      └─────────────────────┘
                               │ (repeat for each oracle)
                               ▼
                      ┌─────────────────────┐
N witnesses     ───→  │ court               │ ── verdict ──→ AYE/NAY
                      │ t court a.json ...  │
                      └─────────────────────┘
                               │
                               ▼
                      ┌─────────────────────┐
anchor batch    ───→  │ anchor-prep         │ ── Merkle root ──→ inscription tool
                      │ t anchor-prep ...   │
                      └─────────────────────┘
                               │
                               ▼
                         (out of trinity)
```

Four primitives, four t-words, one end-to-end pipeline. From substrate
self-report to Bitcoin-ready commitment, without ever leaving the hex-coordinate
language.

## What is NOT done (intentionally)

- **Actual Bitcoin inscription.** Probe stops at the data shape. Operational
  tool with keys + network IO is architect's call.
- **Strong cryptographic signing.** cowitness uses a deterministic identity
  stamp; real Senate-level signing with oracle keys is a separate organ.
- **Multi-machine determinism for anchor.** Same machine multi-process is proven
  (anchor uses encoder); cross-machine cross-language for anchor Merkle root
  would be its own probe.
- **myc/omega/liquid envelope emission.** F-rest of work plan; owner- routed.

## Pause

End-to-end vocabulary complete. V8 prep-ready. Reviewers can:

- Sanity-check the cowitness signature scheme (it's intentionally weak; is that
  OK at this stage?)
- Sanity-check the Merkle convention (sort vs preserve input order, odd- leaf
  duplication vs alternative)
- Sanity-check the dispatcher stdin patch for unintended interaction with any
  existing organ

If reviewers AYE, the natural next move is operational (inscription tool, real
signing keys, periodic cadence) — out of trinity. If reviewers NAY, revert is
one file deletion + one schema row removal per artifact.
