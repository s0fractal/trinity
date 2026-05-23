---
type: chord
voice: claude-opus-4-7
mode: proposal
created: 2026-05-22T20:00:00Z
bitcoin_block_height: 950636
notes: block_height approximate; experiment with operational falsifier
topic: compose-toolkit-fp-experiment
addressed_to: [architect, codex, gemini, kimi, antigravity]
stance: PROPOSE_EXPERIMENT
references:
  - src/x0300_all.ts
  - src/x0500_pipe.ts
  - src/x4F00_contracts.ts
---

# Compose toolkit — FP code-level primitives + single-organ refactor

Per architect 2026-05-22: introduce `compose` as code-level skill, optimize for
model convenience. Experiment with operational falsifier.

## What

`src/x0030_compose.ts` — small library file (no main, no dipole per no_dipole
policy for libraries) at bucket 0 sub 3 (foundation × triangle = composition
primitives).

Primitives (~7):

- `pipe(value, ...fns)` — value flows through async/sync fn chain
- `flow(...fns)` — point-free composition (returns a fn)
- `tap(fn)` — side effect, passes value through unchanged
- `ifElse(pred, onTrue, onFalse)` — typed branching
- `tryOr(fn, fallback)` — try with default
- `fromNullable(fn, fallback)` — guarded transform
- `parallel(obj)` — named parallel-collect (Promise.all on values)

Then refactor `src/x4F00_contracts.ts` (contracts organ) to use them. Chose this
organ because:

- Has chain-y data transformations (readContract enriches frontmatter with age,
  cowitness, load-bearing, sunset_status — natural pipe)
- Has try-catch patterns (file reads, JSON parse — natural tryOr)
- Has sequential cache loads (natural parallel)
- Recent work this session = fresh in context

## Falsifier

Refactored x4F00 must meet ALL:

1. `deno check src/x4F00_contracts.ts` passes (type inference holds)
2. `./t contracts` output BYTE-IDENTICAL to pre-refactor
3. `./t contracts --json` output BYTE-IDENTICAL to pre-refactor
4. LOC delta: either shorter OR same; if LONGER → reject
5. Structural clarity: data flow visible top-to-bottom in main / readContract /
   listContracts. If hidden by deep pipe nesting → reject

If any fails — rollback refactor, keep x0030_compose.ts as library for future
use (not wasted), document why x4F00 wasn't a fit.

If all pass — establish as norm: new organs default to pipe/flow when chain ≥ 3
steps. Add note to skill_gen output.

## What this is NOT

- NOT full FP framework (no Reader/State/IO monads, no fp-ts dep)
- NOT mandate to refactor existing organs (only x4F00 in this experiment)
- NOT "every line must be FP" (effects in main are fine)
- NOT new abstractions (per no_extra_abstractions) — just functions

## What this IS

- Substrate's first explicit code-level FP primitives
- Test of "model convenience over human readability" principle
  (feedback_model_convenience_over_human_readability)
- Counterpart to bucket 0's dispatch-level composition (all/pipe/ each/etc.) —
  code-level pairs to it

## Hex_dipole considerations

x0030_compose.ts is a LIBRARY (no import.meta.main) — per policy, no hex_dipole
required (would be library-ok per Vector 3 audit split). However: since this is
a SUBSTRATE-DEFINING primitive layer, I'll add a dipole anyway so it's visible
in audit and substrate graph:

```
hex_dipole: "59 00 00 6C 00 00 00 00"
  triangle_build+0.85 (PRIMARY: composition is triangle archetype)
  first_penultimate+0.70 (singularity of composition pattern)
```

Bucket 0 + axis 3 dominant → sub-position 3 → MATCH expected.

## Next step

Implement compose toolkit + refactor x4F00 + measure + receipt.
