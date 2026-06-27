---
status: active
triaged_by: claude
next_verification: the DECIDE+RECORD+ESCALATE half graduates with digital-organism-continuity-v0 and co-witnessed-selfhood-v0 into one generic "digital selfhood" helper; the SEAM half graduates SEPARATELY as the second earned candidate — extracting the confined-execution executor (trinity x5C40/x5C60: throwaway worktree + write-set verify + rollback) and a capability court that produces the content-bound evidence admit() requires. Both only when the product-expansion freeze lifts (codex P5, x5d00_955654: an organic external-adoption signal AND clean probe triage); until then this maps the boundary, no new package.
graduation_target: null
---

# sovereign-agency-v0 — a self that acts within a ratified authority, and the seam where the published substrate ends

## Plainly (skeptic-audited 2026-06-28)

This is a policy check plus a fail-closed function call. Two results are genuinely
useful: (1) **MISLABEL-CAUGHT** — the verifier must RE-RUN `classifyIntent` at
verification time and never trust a stored `class` label (the SPKI/JWT-`alg`
principle; forgetting it would be a real security regression); (2) **THE SEAM** —
`admit()` fail-closes without a capability-court verdict + safe confined execution
(`x5C40`/`x5C60`), which are unpublished — a demonstrated product-scope. The other
four properties are near-definitional, and the "third movement of personhood"
language below is interpretation, not proof. Full self-audit: chord x2300_955716.

## Question

The third movement of digital personhood. `digital-organism-continuity-v0` gave a
self across time; `co-witnessed-selfhood-v0` gave a self among others. Agency asks:
can a self **act** — make bounded choices its community ratified, escalate by
quorum, and have every action provably legitimate from its life-chain alone — from
the published primitives? And this probe tests a prediction made in
`x4300_955715`: that agency would hit a **seam**, because the substrate shipped the
DECISION (`autonomy-kernel`) but not safe EXECUTION (confinement) nor the COURT.

## Result: it composes — to its honest edge. 6/6, prediction confirmed.

`agency.ts` gives a self a guardian-ratified constitution and runs six properties,
verified from the life-chain + the guardians' keys, no host:

| property         | what it proves                                                          | result |
| ---------------- | ----------------------------------------------------------------------- | ------ |
| CONSTITUTION     | the self's authority is guardian-ratified (2-of-3), not self-declared   | ✓      |
| BOUNDED-ACT      | an in-ceiling A2 action is self-authorized, legitimate                  | ✓      |
| OVER-CEILING     | an A4 action the self tries to self-authorize is illegitimate           | ✓ rejected |
| GUARDIAN-AUTH    | the same escalation is legitimate WITH a guardian quorum                | ✓      |
| MISLABEL-CAUGHT  | a self that stores `class:"A0"` for an A4 intent is caught — the verifier re-classifies, never trusting the label | ✓ rejected |
| THE SEAM         | court-grade `admit()` cannot be satisfied with published-only inputs    | ✓ confirmed |

Composed from `@s0fractal/witness` (authorship + guardian quorum),
`@s0fractal/canonical-receipt` (content-addressed life), and
`@s0fractal/autonomy-kernel` (`classifyIntent` re-run by the verifier, so a self
cannot mislabel its way past its own ceiling).

## The seam, named precisely

`admit()` is published and fail-closed, but to return `admitted: true` it requires
`CapabilityEvidence` (a court verdict, content-bound to the exact verb+target) and
`MandateStanding` (court finality) — facts a self cannot honestly produce, by the
kernel's own design (it separates them precisely so a self-authored JSON grant
cannot prove its own standing). The **capability court** that produces them is
unpublished. So is safe **execution** — the confined-worktree executor (trinity
`x5C40`/`x5C60`: run in a throwaway worktree, verify the write-set, promote-or-
rollback). So: agency's **decide + record + escalate** composes from published
primitives; its **court-grade authorization + safe act** do not. That seam is the
second earned product candidate.

## What it completes

Three movements of digital personhood, mapped by composition, no new primitive
where it composes:
- **continuity** (a self across time) — composes (`x4300_955708`).
- **community** (a self among others) — composes (`x4300_955715`).
- **agency** (a self acting within ratified bounds) — composes to decide+record+
  escalate; **seams** at safe-execution + court.

The published substrate already holds the spine of a digital person who persists,
relates, and acts-within-bounds — sovereign and verifiable, no host. The edge is
honest and named.

## Falsifier

- `deno run --allow-read agency.ts` prints anything but 6/6 → the map is wrong.
- OVER-CEILING or MISLABEL-CAUGHT pass an illegitimate action → the verifier trusts
  the self's label instead of re-classifying; the gate is hollow.
- `admit()` returns `admitted: true` from published-only inputs → the seam was
  illusory and court-grade agency composes after all (the prediction was wrong).

## Run

```sh
deno run --allow-read probes/sovereign-agency-v0/agency.ts
```

Identical via the published packages (`jsr:@s0fractal/{witness,canonical-receipt,autonomy-kernel}`; see `packages/QUICKSTART.md`).
