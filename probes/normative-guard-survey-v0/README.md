---
status: active
triaged_by: claude
next_verification: extend the population from contracts/ to the RFC-0004..0009 MUST clauses and to packages/ public surfaces, then re-run and see whether the 42% holds outside contracts/; graduate only if the ratio becomes something the substrate tracks rather than something a probe reports
graduation_target: null
---

# normative-guard-survey-v0

> **Status: active probe, non-authoritative.** It reports a partition. It
> decides nothing, and its `guarded` verdicts are human judgements with a
> machine-checked citation, not machine-checked judgements.

## The question

Of the guarantees this repository makes to anyone outside it, how many can be
**observed failing**?

This is step one of the goal in chord `x1500_961093`, and it exists to test that
goal's own first falsifier: *if most normative guarantees turn out already
guarded, the gap the goal targets does not exist and the leverage is elsewhere.*

## Run

```sh
deno run -A probes/normative-guard-survey-v0/survey.ts
deno run -A probes/normative-guard-survey-v0/survey.ts --json
```

## Result

```text
49 MUST clauses across contracts/ — the whole population, not a sample

   guarded      16
   unguarded    22
   unguardable  11

   of the mechanically checkable: 16/38 guarded  (42%)
```

**The goal survives its first falsifier**, and less dramatically than the
framing that produced it. 42% guarded is not zero. The gap is real and it is
partial.

Two findings the count does not show:

**Most contracts are not written normatively at all.** 42 contracts, 49 `MUST`
occurrences, and **28 contracts contain none**. `SHOULD` appears once in the
entire directory. The contracts are largely descriptive — they explain a design
rather than state obligations. That is not a defect, but it means "guard the
contracts' guarantees" is a smaller job than the file count suggests, and that
the interesting normative surface is elsewhere: the RFC set, and `packages/`.

**Where guarding clusters is where something was actually built.** Every
`guarded` verdict traces to a probe or package that exists —
`receipt-envelope-encoder`, `spore-runtime-adapter`, `codeicide`, the canon
vectors, the FQDN resolver. Nothing is guarded because someone decided to guard
it; things are guarded because building them produced a test that happens to
cover the clause. Guarding here is a **side effect of implementation**, not a
practice.

That is the more useful finding, and it is what the goal should act on: the
question is not "why are 22 clauses unguarded" but "why does guarding only
happen when something gets built."

## Method, and where it is weak

- The population is every `MUST` in `contracts/`, extracted by regex. That
  caught two **section headings** (`## Failure modes the flow MUST catch`,
  `### What MUST NOT be done`). They are classified `unguardable` and left
  visible rather than quietly dropped, because a denominator adjusted after the
  fact is not a denominator.
- Each clause carries a **verbatim quote**. The probe resolves every one and
  exits 1 if any is absent, so a contract edited after this survey cannot leave
  a stale verdict standing.
- A `guarded` verdict must cite a guard path that **exists on disk**; the probe
  checks existence and exits 1 if a cited guard is missing.
- **The weakest link, stated plainly:** the probe does not verify that a cited
  guard actually tests the clause. That judgement is mine. A `guarded` verdict
  means *"a plausible guard was found and it exists"*, which is weaker than
  *"this cannot break silently"*.
- Default is `unguarded`. Absence of a found guard is reported as absence of a
  found guard — falsifiable by pointing at one.

## The guard was falsified before being trusted

Both failure branches were made to fire on purpose:

```text
quote: "Verifiers MUST hash CBOR"  →  "Verifiers MUST hash JSON"
guard: src/canon_conformance_test.ts  →  src/no_such_test.ts

EXIT=1
1 quote(s) no longer resolve, 1 cited guard(s) missing
```

Then reverted. A green check that could not have been red is worth nothing.

## Falsifiers

- If someone points at an existing guard for any clause marked `unguarded`, that
  verdict is wrong and the ratio improves — which is the outcome this probe most
  wants and cannot produce by itself.
- If a clause marked `guarded` is broken and its cited guard stays green, the
  citation-existence check is too weak and verdicts need the guard to be *run*
  against a deliberately broken case, not merely to exist.
- If extending the population to the RFC set and `packages/` moves the ratio
  above ~70%, then contracts are unrepresentative and the goal aimed at the
  wrong surface.
- If the `unguardable` bucket grows under scrutiny to swallow most of the
  `unguarded` ones, then the survey is measuring how much of the corpus is prose
  rather than how much is unprotected, and the metric is not worth tracking.
