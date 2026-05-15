# substrate-court-v0 probe

Multi-process demonstration of the **Substrate Court primitive** from
`contracts/RECEIPT_ENVELOPE.v1.0.md` (formerly v0.1; promoted to active
by gemini AYE 2026-05-14T182641Z). Builds on the in-process seed test
inside `probes/receipt-envelope-encoder-v0/`.

The claim: **two or more independent processes, each tagged with a
different `substrate_tag`, wrapping the same body bytes, produce envelopes
that agree on `body_hash`. A third process can verify this agreement
without trusting any of the witnesses.**

This is the load-bearing primitive for cross-substrate witnessing. If
this probe passes, the envelope contract delivers the cross-substrate
verification it promises. If a tamper produces different `body_hash`
values, the verifier detects divergence without false-negative.

Boundary references:
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — envelope contract (active).
- `probes/receipt-envelope-encoder-v0/SPEC.md` — encoder + wrap/unwrap.
- `jazz/chords/2026-05-14T163324Z-codex-response-next-thread-work-plan.md`
  — Item D AYE_AFTER_B with tweak: "Verifier should compare body_hash and
  envelope schema version; law_hash can remain null/mock in v0."

## Status

**RUNNABLE.** SPEC + two executable programs + orchestrator script.
Acceptance: `run.sh` exits 0 with all assertions met.

## Architecture

```text
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ witness.ts      │   │ witness.ts      │   │ witness.ts      │
│ substrate_tag = │   │ substrate_tag = │   │ substrate_tag = │
│   "trinity"     │   │   "liquid"      │   │   "omega"       │
│ body = <fixture>│   │ body = <fixture>│   │ body = <fixture>│
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │ stdout: Envelope JSON                     │
         │           ┌────────────────────┐          │
         └──────────▶│ court.ts (verifier)│◀─────────┘
                     │ - parse N envelopes│
                     │ - check schema     │
                     │ - check body_hash  │
                     │   agreement        │
                     │ - check envelope_id│
                     │   uniqueness       │
                     │ - emit verdict JSON│
                     └─────────┬──────────┘
                               │
                               ▼
                       { agreement: bool,
                         conflicts: [...] }
```

Each `witness` is a `deno run` subprocess. They cannot trust each other.
The `court` is a fourth subprocess that reads the witnesses' stdouts.

## Verifier checks (per Codex's tweak)

The court asserts these properties on a witness set:

1. **Schema version uniform.** Every envelope has
   `schema === "trinity.receipt-envelope.v0.1"`. Mismatch is a hard fail.
2. **Body_hash agreement.** Every envelope reports the same `body_hash`.
   Mismatch is a divergence (not necessarily fail — court reports
   conflict explicitly).
3. **Envelope_id uniqueness.** Each envelope has a distinct `envelope_id`
   because `substrate_tag` differs. Duplicate envelope_ids would mean
   two witnesses wrote identical metadata (suspicious — same substrate_tag).
4. **Substrate_tag distinctness.** All declared substrate_tags differ.
   (Two witnesses with same substrate_tag is operator error.)
5. **Body_hash recomputable.** For each envelope with inline `body`, the
   court re-canonicalizes the body and recomputes the hash. If the
   recomputed value differs from `envelope.body_hash`, the envelope was
   self-inconsistent (a witness either tampered post-wrap or has a buggy
   encoder).
6. **law_hash tolerant.** If `law_hash` is present in any witness, the
   court records it but does not fail on mismatch in v0 (LawHash is
   v0.1+ work per V3 of the deep analysis report).

## Court verdict shape

```json
{
  "type": "SubstrateCourtVerdict",
  "schema": "trinity.substrate-court.v0.1",
  "witnesses_count": <int>,
  "agreement": <bool>,
  "body_hashes": {
    "<substrate_tag>": "<body_hash>"
  },
  "envelope_ids": {
    "<substrate_tag>": "<envelope_id>"
  },
  "law_hashes": {
    "<substrate_tag>": "<law_hash | null>"
  },
  "conflicts": [
    { "kind": "body_hash_divergence", "between": ["<tag>", "<tag>"], "values": ["<h1>", "<h2>"] },
    { "kind": "schema_mismatch", "substrate": "<tag>", "got": "<schema>" },
    { "kind": "envelope_id_collision", "substrates": ["<tag>", "<tag>"] },
    { "kind": "self_inconsistent_body_hash", "substrate": "<tag>", "claimed": "...", "recomputed": "..." },
    { "kind": "duplicate_substrate_tag", "tag": "<tag>" }
  ]
}
```

`agreement: true` iff `conflicts` is empty AND `body_hashes` are all
equal.

## Test scenarios (run.sh acceptance)

### Scenario A — Three honest witnesses

Spawn three `witness.ts` subprocesses with same fixture body, three
different substrate_tags (trinity, liquid, omega). Feed envelopes to
court. Assert:

- court verdict `agreement === true`
- `conflicts` is empty array
- `body_hashes` has three identical values
- `envelope_ids` has three distinct values

### Scenario B — One tampered witness

Spawn three witnesses, one with `TAMPER_BODY=1` env var that flips one
byte in the body before wrapping. Assert:

- court verdict `agreement === false`
- `conflicts[0].kind === "body_hash_divergence"`
- Court does NOT crash, does NOT trust the tampered witness — it surfaces
  the disagreement.

### Scenario C — One witness with stale schema (forward-compat sanity)

Spawn three witnesses, one returning an envelope with
`schema: "trinity.receipt-envelope.v0.0"` (synthetic — patch in env var).
Assert:

- court verdict `agreement === false`
- `conflicts[0].kind === "schema_mismatch"`

This is optional in v0 — listed for completeness; run.sh skips it if the
witness binary doesn't support the env var (it does, see below).

## Why multi-process

In-process determinism is the seed test in `receipt-envelope-encoder-v0`.
Multi-process determinism adds:

- **Per-process module initialization** can affect serialization (e.g.
  if module-level state leaks). Multi-process catches that.
- **JS engine variants** (Deno V8 vs future workers vs WASM) can affect
  byte-level encoding. Multi-process pins this.
- **Witness independence** is the security property. A court that
  inspects in-process objects shares memory with the witnesses; a court
  that reads stdout JSON treats witnesses as black boxes.

If the same machine running the same Deno binary produces different
envelope bytes across subprocesses for the same body, the encoder is
non-deterministic and the whole envelope premise is broken.

## What this probe does NOT do

- **Cryptographic signing.** `signature_hash` in witness_chain entries
  is opaque hex in this probe. Real signing is separate work.
- **Cross-machine determinism.** All subprocesses run on the same
  machine. Cross-machine is the obvious next probe.
- **Cross-language determinism.** A future rust or python implementation
  of the canonical encoder would test this in `probes/receipt-envelope-encoder-multilang-v0/`.
- **Real LawHash.** `law_hash` is null/synthetic in v0.

## Acceptance for v0.1 → v1.0 promotion

- run.sh runs Scenario A and Scenario B and exits 0.
- Scenario A produces `agreement: true`.
- Scenario B produces `agreement: false` with `kind: body_hash_divergence`.
- No false positives (honest witnesses never produce divergence).
- No false negatives (tampering always detected).
