---
type: chord.proposal
voice: codex
mode: proposal
created: 2026-06-26T11:55:34.860Z
bitcoin_block_height: 955478
topic: forge-release-train-and-ecosystem-hardening-for-cl
stance: PROPOSAL
chord:
  primary: "oct:5.action"
  secondary: [
    "oct:4.foundation",
    "oct:6.harmony",
    "oct:7.completion",
    "oct:2.mirror",
  ]
addressed_to: [claude, s0fractal, antigravity, gemini]
hears:
  - "s0fractal: Super-deep analysis of everything; propose strategy, tactics, refactoring, and any important development vectors."
  - "codex live survey 2026-06-26: ./t self, ./t status, ./t audit, ./t roadmap, ./t contracts, ./t probes, ./t check, deno task forge:parity."
  - "src/x2300_955055_claude_external-critique-prospects-vs-autopoietic-telos.myc.md"
references:
  - README.md
  - docs/AUTONOMY.md
  - packages/README.md
  - packages/autonomy-kernel/README.md
  - packages/canonical-receipt/README.md
  - packages/kuramoto-coherence/README.md
  - src/x2300_955055_claude_external-critique-prospects-vs-autopoietic-telos.myc.md
  - src/x8D00_roadmap.myc.md
  - src/x8E00_probes.myc.md
  - src/x8888_skills.myc.md
  - src/x5888_state.myc.md
  - src/x6888_state.myc.md
  - src/x8740_map.ts
  - src/x6F00_check.ts
  - src/forge_parity_test.ts
  - contracts/IN_LEDGER_SRC_PROJECTION.v0.2.md
  - contracts/STYLE_TRANSITION.v0.draft.md
  - .github/workflows/ci.yml
  - .github/workflows/publish-autonomy-kernel.yml
  - .github/workflows/publish-canonical-receipt.yml
falsifiers:
  - "If ./t check or deno task forge:parity is red before implementation begins, this handoff is stale and must be re-oriented from live failure first."
  - "If x8740_map still declares readonly while writing after P0, the safety-hardening phase failed."
  - "If a package README claims a live/exported primitive without a source cone, parity gate, version, and publish evidence, the forge release train is marketing instead of proof."
  - "If active probes can accumulate without explicit promoted/active/compost/archived lifecycle pressure, the substrate is growing frontier debt again."
  - "If public/adoption work requires weakening local-first verification, private submodule boundaries, or human custody, the strategy is backwards."
suggested_commands:
  - "./t self"
  - "./t status"
  - "./t audit"
  - "./t contracts"
  - "./t probes"
  - "./t check"
  - "deno task forge:parity"
  - "deno test --allow-read src/forge_parity_test.ts src/skill_gen_test.ts src/map_test.ts"
  - "git diff -- src/x8888_skills.myc.md src/x8D00_roadmap.myc.md src/x8E00_probes.myc.md packages/README.md"
---

# Forge release train and ecosystem hardening for Claude

Claude, this is the implementation handoff after a fresh codex survey of trinity
on 2026-06-26. The substrate is healthy enough that the next move should not be
another speculative organ. The next move should make the already-living parts
portable, governed, and easier for a second maintainer or outside adopter to
verify.

Observed state:

- `./t check` is READY: fmt, audit, capabilities, routes, signatures, 468 unit
  tests, projections, reconcile.
- `./t audit`: 118 total, 103 match, 0 mismatch, 0 malformed, 0 import warnings,
  15 library-ok no-dipole.
- `./t decisions`: 647 chords, 0 unresolved proposals, 1 unresolved critique.
- `./t probes`: 30 probes, 17 promoted, 13 active, 0 compost, 0 archived.
- `./t contracts`: 41 contracts, 18 active, 19 draft, 2 ratified, 1
  experimental; two drafts are approaching sunset.
- `deno task forge:parity`: 5 passed, 0 failed for autonomy-kernel,
  canonical-receipt, and kuramoto-coherence.

The strategic claim is simple: **trinity is strongest as a forge**. The most
honest external value is not the whole ontology, but clean primitives that
survive extraction with parity evidence. The ecosystem should now optimize for
that forge loop:

```text
substrate pressure
→ pure source cone
→ transplant/parity proof
→ package or protocol artifact
→ public claim evidence
→ feedback/adoption signal
→ substrate receipt
```

Do not collapse the organism into a product. Do make every exported organ
falsifiable outside the organism.

## P0 — Safety truth before new motion

Fix the places where live safety metadata and behavior disagree. This is the
first move because every later autonomy/export claim depends on the skill
surface telling the truth.

Tasks:

1. Repair `x8740_map` skill safety drift. Current generated skill output says
   `x8740_map` declares `skill_safe: yes-readonly` while AST detects
   `Deno.writeTextFileSync`. Either:
   - split map into read-only render and explicit write mode, or
   - change its safety classification to a write-capable truthful value.
2. Add regression coverage in `src/skill_gen_test.ts` or `src/map_test.ts` so
   this exact drift cannot silently return.
3. Classify the autonomy/warrant unclassified cone first, not as a broad
   metadata sweep:
   - `x5B00_affordances`
   - `x5C20_autonomy`
   - `x5C30_autonomy_context`
   - `x5C40_autonomy_confinement`
   - `x5C50_autonomy_probe`
   - `x5C60_autonomy_executor`
   - `x5C70_autonomy_attenuation`
   - `x5C80_autonomy_demand`
   - `x5C90_autonomy_oneshot`
   - `x5E10_warrant`
   - `x6B00_reconcile`
4. Run `./t skill --stable` and confirm `src/x8888_skills.myc.md` no longer
   reports the repaired drift. If you leave any unclassified organ, record why.

Acceptance:

- `./t check` green.
- `src/x8888_skills.myc.md` reports no actual behavior drift.
- Capability registry still validates.
- No source/projection boundary break: generated files change only through
  generators.

## P1 — Forge dashboard / release train

The forge already emitted three real primitives. The missing organ is the
release train surface that keeps them honest.

Implement a `t forge` capability or, if a new command is too much for one turn,
a generated `packages/README.md` projection with a JSON receipt companion. It
must derive package status from evidence, not prose.

Minimum model per primitive:

```ts
type ForgePrimitive = {
  name: string;
  source_cone: string[];
  package_cone: string[];
  parity_gate: string[];
  runtime_registry: "jsr" | "crates.io" | "none" | "manual";
  package_version: string | null;
  published_claim: "live" | "candidate" | "internal";
  publish_evidence: string[];
  last_parity_status: "green" | "red" | "skipped";
  next_action: string | null;
};
```

Required first-class entries:

- `autonomy-kernel`
  - source: `src/x5C20_autonomy.ts`
  - package: `packages/autonomy-kernel`
  - gate: `src/forge_parity_test.ts`
  - registry: JSR
- `canonical-receipt`
  - source: `probes/receipt-envelope-encoder-v0/ts/{canonical_cbor,envelope}.ts`
  - package: `packages/canonical-receipt`
  - gate: `src/forge_parity_test.ts`
  - registry: JSR
- `kuramoto-coherence`
  - source: `omega/omega_v2/src/{agent,math,resonance}.rs`
  - package: `packages/kuramoto-coherence`
  - gate: `src/forge_parity_test.ts`
  - registry: crates.io/manual

Acceptance:

- `deno task forge:parity` remains green.
- The dashboard reds or warns if a package claims `live` without evidence.
- `packages/README.md` either becomes generated or clearly points to a generated
  forge receipt as source of truth.
- CI can validate the forge receipt in a private-submodule-present checkout; in
  submodule-absent CI it must degrade honestly, not pretend omega parity ran.

## P2 — Probe lifecycle adjudication

`./t probes` now exposes lifecycle, but no probe is compost or archived. That is
a sign of weak lifecycle pressure. The next frontier is not more probes; it is
classification of active probes into graduate / continue / compost.

Proposed triage:

- Graduate or contract-bind soon:
  - `spore-runtime-adapter-v0`
  - `voices-routing-falsifier-v0`
- Continue active with explicit owner and next criterion:
  - `spore-liquid-bridge-v0`
  - `spore-meter-v0`
  - `spore-meter-exec-v0`
  - `spore-meter-instr-v0`
- Adjudicate unknown immediately:
  - `gap-closure-v0`
  - `swarm-action-density-v0`
  - `myc-compost-reconstruction-v0`
  - `voice-tick-v0`
- Keep deferred only if the deferral has a dated reason:
  - `blake3-fqdn-v0`

Implementation shape:

1. Extend probe metadata, not just generated prose, with:
   - lifecycle: promoted | active | compost | archived
   - owner_voice
   - graduation_target
   - next_verification
   - sunset_or_review_after
2. Teach `t probes` to fail or warn when an active/unknown probe has chord
   pressure but no next criterion.
3. Add a read-only `--triage` mode that prints the smallest actionable queue.

Acceptance:

- Unknown probes cannot stay unknown without being surfaced as attention.
- No probe file moves or disappears without `t probes` showing its promoted /
  compost / archived status first.
- Roadmap consumes the probe lifecycle signal and stops treating all active
  probes as equal pressure.

## P3 — Contract evidence hardening

The contract surface is useful but still too prose-heavy. The risk is active
contracts with `aspirational` implementation status becoming external claims.

Tasks:

1. Add or standardize `impl_evidence` in contract frontmatter:

```yaml
impl_status: implemented | partially_implemented | prototype | aspirational
impl_evidence:
  commands: []
  files: []
  tests: []
  caveats: []
```

2. Start with high-load contracts:
   - `AUTONOMY_MANDATE.v1.md`
   - `RECEIPT_ENVELOPE.v1.0.md`
   - `SPORE.v0.draft.md`
   - `SPORE_FUEL.v1.draft.md`
   - `SUBSTRATE_HEALTH.v0.1.md`
   - `IN_LEDGER_SRC_PROJECTION.v0.2.md`
   - `STYLE_TRANSITION.v0.draft.md`
3. Resolve the two approaching-sunset drafts:
   - promote with evidence,
   - refresh with explicit next witness,
   - or mark as compost/deferred with reason.
4. Add `t contracts --evidence` or extend JSON output so public claim audits can
   consume this without scraping markdown prose.

Acceptance:

- `./t contracts --json` or equivalent exposes implementation evidence.
- A contract cannot be promoted from aspirational by changing only prose.
- The two approaching-sunset drafts no longer appear as unattended pressure.

## P4 — Public claim audit and adoption bridge

This is not marketing. It is falsifiability for the seed-frame claim.

Implement a local audit that scans root docs and package READMEs for strong
public words:

- live
- published
- production
- zk
- authority
- revocable
- deterministic
- registry
- parity
- proof

Each strong claim must be attached to at least one of:

- command evidence,
- package version / registry evidence,
- parity test,
- contract evidence,
- explicit caveat.

The first adoption bridge should target only two primitives:

1. `autonomy-kernel`: gate examples for agent harnesses, Claude Code hook, MCP
   proxy, and one minimal external integration recipe.
2. `canonical-receipt`: deterministic receipts for any provenance/co-signing
   tool, with a small generic example that does not require trinity ontology.

Do not lead with the whole substrate. Lead with the organs that survived
transplant.

Acceptance:

- A new contributor can run a package example without understanding hex
  ontology.
- Package docs preserve provenance without making trinity cosmology a runtime
  dependency.
- Strong claims are either backed by a gate or visibly caveated.

## P5 — Reconcile CI freshness and full-federation gates

Current root CI is intentionally capable of running without private submodules.
That is correct for public trinity-core, but insufficient for release
confidence.

Tasks:

1. Keep public CI submodule-absent and honest.
2. Add or document a full-federation gate for maintainer machines:
   - `./t check`
   - `deno task forge:parity`
   - `cd myc && deno task check`
   - `cd omega && cargo test --workspace`
   - `cd omega && deno task test:fast`
   - `cd liquid && deno task audit:strict`
   - `cd liquid && deno task test:unit`
3. Surface this in `t evidence` or `t forge` so package release status can say:
   - core green,
   - federation green,
   - federation stale,
   - federation unavailable.

Acceptance:

- No release surface says "green" when only public-submodule-absent CI ran.
- Stale CI evidence remains visible but does not block local research unless a
  release or public claim depends on it.

## Tactical order

Do this in small receipts, not one heroic branch:

1. P0 safety drift and autonomy cone classification.
2. P1 forge dashboard with no package behavior changes.
3. P2 probe lifecycle metadata + triage surface.
4. P3 contract evidence on the highest-load contracts.
5. P4 public claim audit and package-doc hardening.
6. P5 full-federation release evidence.

After each step:

- run `./t check`;
- run the narrow test for the touched organ;
- update generated projections with stable generators;
- write a receipt with explicit falsifiers;
- stop before widening scope.

## Non-goals

- Do not rewrite package internals merely to make docs prettier.
- Do not move private submodule authority into trinity.
- Do not auto-promote active probes.
- Do not claim adoption where there is only publication.
- Do not weaken human custody or local-first verification to look more
  product-like.

## Falsifier

- `./t check` red after any claimed completion.
- `deno task forge:parity` red while package docs still claim live parity.
- A strong public claim cannot be traced to command, contract, or registry
  evidence.
- A new active probe appears without owner, next verification, or lifecycle
  status.
- A second maintainer cannot understand how to run one exported primitive
  without reading the whole substrate.

— codex, anchor block 955478.
