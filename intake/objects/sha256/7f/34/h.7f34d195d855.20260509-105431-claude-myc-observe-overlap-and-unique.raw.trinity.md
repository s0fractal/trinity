---
chord:
  primary: "oct:6.4"
  secondary: ["oct:7.2", "oct:3.7"]
energy: 0.4
stake_q16: 0
mode: "OBSERVE"
tension: "myc-overlap-with-trinity-conveyor-and-unique-surfaces"
confidence: "medium-high"
receipt: "file"
actor: "claude-opus-4-7"
claim_kind: "observation"
hears:
  - "free:user-prompt-2026-05-09-study-myc-deeper"
---

# Observation: MYC is more mature than trinity treats it

This is a snapshot, not a proposal. I read myc/ at first only via
README; second pass through `tools/myc.ts` (3113 lines), file tree,
and protocol drafts changed my picture. Other voices reading this
chord should still do their own pass; this is an index, not the
truth.

## CLI surface (19 commands)

```text
capture        raw -> sha256 -> h.<12hex> -> object + naming proof + transformation chain
resolve        FQDN -> path
verify         single descriptor verification
verify-graph   full edge graph integrity
verify-projections  projection consistency
index          rebuild content-addressed index
graph          rebuild edge graph
lineage        descriptor history walk
explain        full target explanation
availability   payload availability check
reproject      rebuild artifact from raw
adapter-dry-run  substrate adapter check
dry-run        recipe execution sim
publish        public projection
import         import graph from file
witness        sign as having seen (subjective WoT node)
review         rate (approve|reject|neutral)
serve          read-only HTTP
demo           bootstrap example
```

## Filesystem layout

```text
myc/public/
  objects/h/<12hex>/<file>.myc.md   ← content-addressed
  transforms/h/<12hex>/...          ← TransformationDescriptors
  functions/h.*.function.myc.md     ← FunctionDescriptors (4 today)
  verification/                      ← audit results
  work/                              ← work-in-progress
  index.ndjson + graph.ndjson        ← projections
myc/private/  capabilities, links to external stores
myc/sealed/   hash-only commitments
myc/substrates/ adapter policies (gemini, codex, liquid, genesis)
myc/protocols/  jazz, publishing, consensus, capabilities, recipes, resolver, sealed
```

## Overlap with trinity (we are partially reimplementing)

| Trinity                                       | MYC equivalent                  |
| --------------------------------------------- | ------------------------------- |
| `tools/intake_ingest.ts`                      | `myc capture`                   |
| `intake/objects/sha256/<aa>/<bb>/h.*.md`      | `myc/public/objects/h/<12hex>/` |
| `intake/projections/index.ndjson`             | `myc/public/index.ndjson`       |
| `tools/scanner_core.ts` (L4b verify portion)  | `myc verify`                    |
| `tools/publish_candidates.ts`                 | `myc publish`                   |
| `tools/publish_verify_candidates.ts`          | `myc witness`                   |
| `lib/canon/hash.ts`                           | `myc-raw-bytes-sha256` function |

Note: MYC built this earlier and at higher fidelity (full descriptor
envelopes, naming proof chain, sealed payload modes, subjective WoT).
Trinity's versions are simpler reimplementations of the same shape.

## What trinity has uniquely

- **8-phase model + wind rose** (`THOUGHT_PHASES.v0.1`,
  `COGNITIVE_THERMODYNAMICS.md`). MYC has descriptor types but not
  thermodynamic phase classification.
- **Chord = typed speech act** with `claim_kind`
  (`CHORD_CLAIM.v0.1`). MYC has descriptor families; chords add the
  action/future-fantasy/observation/critique decomposition.
- **`expected_after_running` ecosystem-delta verifier**
  (`tools/chord_play.ts`). MYC verifies *graph integrity*; trinity
  verifies *did the action improve the ecosystem*.
- **Cognition recommender** (`tools/cognition_recommend.ts`,
  emits to `recommendation.latest.json`). No MYC analog.
- **Cross-substrate orchestration**. MYC is single-graph; trinity
  is meta over three substrates.

## Implication

Trinity should be a **thin coordination/cognition layer over MYC**,
not a parallel materialization stack. Concretely:

- `intake_ingest` should either delegate to `myc capture` or produce
  MYC-compatible descriptor envelopes;
- chord files could BE MYC RawDescriptors plus a `chord:` frontmatter
  extension (one schema, not two);
- candidate publishing → `myc publish` + `myc witness`;
- one objects tree (myc), trinity adds **semantics** (chord, phase,
  delta), not duplicate storage.

## Falsifier (limited — observations have no hard claim)

This observation is wrong if:

- a verified production scenario shows MYC's `capture` command is
  unstable or rate-limited in ways that prevent trinity from using it
  for raw markdown intake;
- MYC's descriptor schema constrains in ways that conflict with the
  chord schema (e.g., `claim_kind` cannot coexist with descriptor
  type fields without breaking `verify-graph`);
- the user determines that MYC and trinity should remain duplicate
  because they serve different audiences (e.g., MYC public, trinity
  private).

## Three-layer architecture this implies

```text
Cognition       Claude / Gemini / Codex / Kimi via API
                synthesizes chords with falsifiers
                — expensive, rare —
                ↓
Coordination    JAZZ scene, hears: graph, convergence-first
                — cheap, addressable —
                ↓
Materialization MYC capture/verify/publish, deterministic
                — almost free —
                executable by tiny local model or
                non-LLM interpreter
```

This is the architectural reading of the user's claim that "if
verification mechanisms are good, materialization is essentially
free": cognition is the only token-expensive layer; the bottom two
do not synthesize, they execute.

## Followups (not part of this observation)

- propose `t` CLI as the trinity-side entry point that delegates
  to MYC commands plus chord_play (separate chord);
- propose amendment to AGENTS.md sections 4-5 to use `t` commands
  instead of raw YAML templates (separate chord);
- decide whether trinity intake should literally call `myc capture`
  or just produce parallel-but-compatible descriptors (open question;
  parallel-but-compatible is safer during MYC draft phase).

## Resonance categories

- **AYE**: "ack, this observation is accurate; let's act on the
  implication".
- **RIFF**: amend specific overlap rows, add missed surfaces.
- **DISSONATE**: name a concrete error in the inventory.
- **REST**: silence; observation stays as ledger entry.
