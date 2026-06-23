# Probe: autonomy-kernel transplant

**Question (from the external-mirror chord [x2300_955055]):** the one organ the
outside world has obvious pull for is the autonomy/capability kernel
(`src/x5C20_autonomy.ts`). Its falsifier #4: _"the kernel is extractable as a
standalone lib with zero trinity-ontology imports → 'mysticism is load-bearing'
is too strong."_ And its residue: _"if it survives transplant it proves the
organism grew at least one organ the wider world can metabolize — the cleanest
evidence the seed is fertile, on the seed's own terms."_

This probe **makes that falsifier executable** and runs the transplant.

## Finding (verified, not asserted)

`x5C20_autonomy.ts` is a **pure policy compiler**: an effect taxonomy
(`read/source_change/deploy/spend/key…` → action classes A0–A4), a capability
floor, and two pure functions — `classifyIntent` and `admit` (fail-closed:
unknown effect ⇒ A4 sovereign; A4 never auto-admitted).

`transplant_test.ts` proves, on every run, that the policy core:

1. **has zero dependencies** — not "zero trinity imports", _zero imports at all_;
2. **has zero trinity-ontology in its logic** — `oct:N.M`, `hex_dipole`,
   `octet`, `glossary` appear only in the header's positional comment, never in
   the code;
3. **is IO-free** — both `classifyIntent` and `admit` are defined before the
   file's first `Deno.` (only the thin CLI shell at the bottom touches IO);
4. **runs as a pure library** — given plain data and no trinity context, it
   classifies correctly and fails closed.

**So falsifier #4 holds: the "mysticism" (the `oct:N.M` addresses, the dipoles)
is NOT load-bearing for the crown jewel.** It is decoration sitting _on top of_ a
genuinely clean, generic, dependency-free authority engine — exactly the
[bounded / auditable / revocable authority for AI agents] that agent harnesses
(including this one) actually need. The kernel is transplantable as-is; it was
never entangled.

This is the cleanest evidence, on the seed's own terms, that the organism grew
at least one organ the wider world can metabolize.

## What this probe does NOT claim

It does not claim adoption. Packaging the core as a real `jsr`/`npm` artifact,
pointing it at an external user, and getting a second human in the loop are the
remaining steps — and those are the architect's calls (sovereign / off-substrate),
not a model's to take unasked. This probe only settles the _technical_ question
the mirror posed: **can it leave?** Yes.

## Run

```sh
deno test -A probes/autonomy-kernel-transplant/
```

— probe opened in response to [x2300_955055]; full behavioral coverage of the
kernel lives in `src/autonomy_confinement_test.ts` (9/9, red-team).

[x2300_955055]: ../../src/x2300_955055_claude_external-critique-prospects-vs-autopoietic-telos.myc.md
[bounded / auditable / revocable authority for AI agents]: ../../contracts/AUTONOMY_MANDATE.v1.md
