---
type: "RawCaptureDescriptor"
version: "0.1"
title: "Codex view: strongest nearest strategic steps for Trinity"
source_kind: "model-message"
source_fidelity: "synthesis"
captured_by: "codex"
created_at: "2026-05-09T00:00:00+03:00"
target_layers: ["trinity", "myc", "liquid", "omega"]
thought_phase: "proposal"
phase_confidence: 0.78
publish_policy:
  visibility: "public-candidate"
  payload: "embedded"
  redaction: "none"
  consent: "explicit"
---

# Codex Raw Strategy Note: Nearest Strong Steps

This is intentionally a raw strategic note, not a finished contract.

It is written after reading the current `~/trinity` state, including:

- `TRINITY.md`
- `contracts/PROCESS_OBJECTS.v0.1.md`
- `contracts/PAR_LOOP.v0.1.md`
- `contracts/THOUGHT_PHASES.v0.1.md`
- `docs/COGNITIVE_THERMODYNAMICS.md`
- `tools/ontology_coverage.ts`
- recent commits:
  - `d4abc5d chore(intake): update codex and pin submodules`
  - `2a98ad6 feat(ontology): implement L0-L8 coverage scanner`
  - `2a1b174 Add thought phase thermodynamics`
  - `f3abe61 feat: Stabilize FQDN Semantic DNS in liquid submodule`

## Executive Shape

The strongest near-term move is not to add another large ontology.

The strongest move is to turn the existing ontology into a small, repeatable
machine:

```text
raw intake
  -> content-addressed process object
  -> phase classification
  -> ontology coverage scan
  -> public MYC projection candidate
  -> receipt
```

Trinity already has the right conceptual pieces. The next phase should make the
pieces mechanically boring.

## Strategic Step 1: Make Intake Real, But Tiny

Current state:

- `intake/raw/` exists.
- raw model notes exist.
- process object contract exists.
- hash-named objects are still conceptual.

Recommended next step:

```text
deno task intake:ingest intake/raw/*.md
```

Minimum behavior:

1. Read a raw file.
2. Parse frontmatter.
3. Compute `payload_hash`.
4. Compute or prepare `descriptor_hash`.
5. Emit a canonical object into:

```text
intake/objects/sha256/<2>/<2>/h.<12hex>.<slug>.<kind>.trinity.md
```

6. Emit or update a projection:

```text
intake/projections/index.ndjson
```

Do not overbuild this. One raw input, one object, one index row is enough.

Why this matters:

- It converts "cool theory" into a repeatable phase transition.
- It creates the first actual bridge from raw perception to object identity.
- It gives MYC something clean to publish later.

Thought phase:

```text
raw-fantasy -> hypothesis -> proposal -> experiment
```

## Strategic Step 2: Upgrade Ontology Coverage From Heuristic To Receipt

Current state:

- `tools/ontology_coverage.ts` exists.
- It produces L0-L8-ish coverage.
- Several checks are intentionally heuristic or mock-level.

Recommended next step:

Add report output:

```text
reports/latest-ontology-coverage.md
reports/latest-ontology-coverage.json
```

Then emit a `VerificationReceiptDescriptor` candidate for the scan.

Important improvement:

Split L4:

```text
L4a_hash_claimed
L4b_hash_verified
```

Right now a filename starting with `h.` is treated as hash verified. That is
good enough as a first scanner, but strategically it must become explicit:

- claimed hash;
- computed hash;
- canonicalization;
- match/mismatch.

Why this matters:

- This is the code coverage equivalent for meaning.
- It makes progress measurable without requiring every file to become perfect.
- It prevents "looks ontological" from being confused with "verified".

Thought phase:

```text
proposal -> experiment -> receipt -> formula
```

## Strategic Step 3: Build The First Thought Phase Report

Current state:

- `THOUGHT_PHASES.v0.1.md` defines phases.
- `COGNITIVE_THERMODYNAMICS.md` defines wind rose and balance metrics.
- No command computes them.

Recommended next step:

```text
deno task cognition:phase-report
```

Minimum viable classifier:

- explicit `thought_phase` in frontmatter wins;
- `receipt`, `signature`, command output -> `receipt`;
- `RecipeDescriptor` or executable recipe -> `experiment`;
- `formula_kind`, invariant, equation -> `formula`;
- `DecisionDescriptor` rejected/superseded -> `compost`;
- `h.<hash>` + verified + published -> `crystal`;
- plain raw under `intake/raw` -> `raw-fantasy`;
- frontmatter proposal fields -> `proposal`;
- otherwise `hypothesis`.

Output:

```text
Repo      Raw  Hyp  Prop  Exp  Rcpt  Form  Cryst  Comp  Archetype
myc       ...
liquid    ...
omega     ...
trinity   ...
```

Why this matters:

- It turns the "wind rose" into a steering instrument.
- It shows whether a repo is over-imagining, over-planning, under-verifying,
  over-crystallized, or failing to compost.

Thought phase:

```text
formula -> experiment -> receipt
```

## Strategic Step 4: Define MYC Publication Candidate, Not Full Publication

Current state:

- MYC can publish and verify descriptors.
- Trinity process objects are not yet projected into MYC.
- Public process trace is defined conceptually.

Recommended next step:

Create a candidate manifest:

```text
public-candidates/myc/process.ndjson
```

Each row:

```json
{
  "source_hash": "sha256:...",
  "source_path": "intake/objects/sha256/...",
  "target_fqdn": "h.<12hex>.<slug>.<kind>.trinity.md",
  "descriptor_type": "ProposalDescriptor",
  "publish_policy": "public-candidate",
  "redaction": "none",
  "status": "candidate"
}
```

Do not auto-publish to `myc` yet.

First make candidates auditable:

```text
deno task publish:candidates
deno task publish:verify-candidates
```

Why this matters:

- It keeps public projection controlled.
- It avoids accidental raw leakage.
- It creates the safety membrane before automation.

Thought phase:

```text
proposal -> experiment
```

## Strategic Step 5: Normalize FQDN Semantic DNS Across Layers

Current state:

- `liquid` has new FQDN Semantic DNS stabilization work.
- `myc` has descriptor/FQDN discipline.
- `trinity` has process object naming proposals.

Recommended next step:

Write one short cross-layer spec:

```text
contracts/FQDN_SEMANTIC_DNS.v0.1.md
```

It should answer:

- what is a semantic FQDN;
- what is a hash object FQDN;
- what is a mutable alias;
- what is a public resolver route;
- what can be served via `*.myc.md`;
- how `liquid` neuron FQDNs, `myc` descriptors, and `trinity` process objects
  relate without pretending they are the same object class.

This is more urgent than adding new runtime behavior.

Why this matters:

- Naming is becoming the backbone of the ecosystem.
- If naming drifts, everything above it becomes expensive to reason about.

Thought phase:

```text
hypothesis -> formula -> crystal
```

## Strategic Step 6: Keep Strict Gates As Weather, Not Shame

Current state:

- `audit:green` exists.
- `audit:strict` exists.
- strict failures are known to be work queue.

Recommended next step:

Attach strict failures to thought phases:

```text
failing test -> receipt
triage note -> retrospective
fix proposal -> proposal
fix patch -> experiment
green rerun -> receipt
regression lesson -> formula
```

This turns failing tests into compost or crystals, instead of letting them sit
as noise.

Why this matters:

- Liquid and Omega both have rich but noisy test surfaces.
- The ecosystem needs a way to metabolize failure without hiding it.

Thought phase:

```text
receipt -> retrospective -> formula / compost
```

## What I Would Not Do Next

I would not next:

- build a large UI;
- auto-publish all raw process to MYC;
- rename most Markdown files in-place;
- push execution through subdomain routes;
- introduce a complex object database;
- add more philosophical layers before one ingestion loop works.

The system has enough ontology for the next step.

Now it needs one clean conveyor belt.

## Nearest Concrete Milestone

The best near milestone:

```text
Milestone: First verified process object
```

Definition:

1. Take `intake/raw/codex.0003.nearest-strategic-steps.md`.
2. Ingest it into `intake/objects/sha256/...`.
3. Verify its hash.
4. Classify its thought phase.
5. Include it in ontology coverage.
6. Include it in thought phase report.
7. Emit a publication candidate for MYC.

No auto-publishing yet.

That milestone proves the whole direction without pretending the whole ecosystem
is mature.

## Strongest Strategic Principle

Do not aim first for more intelligence.

Aim for better conservation laws:

```text
raw is conserved as evidence
meaning is conserved as claims
action is conserved as receipts
failure is conserved as compost
stability is conserved as crystal
```

If those conservation laws hold, model intelligence can improve later without
destroying continuity.
