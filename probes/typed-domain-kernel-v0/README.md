---
status: active
owner_voice: claude
next_verification: review the boundaries before anything is built on them — this is an interface/evidence package, not an implementation. The five proof obligations below are the output that matters; each is a normative question the RFC leaves open, and each blocks a different downstream tranche.
graduation_target: null
---

# typed-domain-kernel-v0

> **Interfaces and evidence, not implementations.** No production state domain,
> no translator, no runtime integration. Executable schemas, validators,
> positive fixtures and countermodels — so the boundaries can be reviewed before
> anything rests on them.

Covers RFC-0003 Tranche B items **B1, B2, B3, B4, B5, B7, B8** as one package in
three layers. B6 (composite state) is out of scope and is the RFC's own open
question about associativity of composition (§6.5.3, §20.19).

## What this package is FOR

The RFC's §17.2 table says every primitive here has `existing source: none` and
gives each a "first executable test that fails today because the thing does not
exist". This package makes those tests runnable. It does not make them pass by
building the thing — it makes the **boundaries** checkable, so the thing gets
built against reviewed edges.

The most useful output is not the types. It is the **five proof obligations**:
places where the RFC states a requirement whose terms it never defines, and
where an implementer's reasonable guess becomes a normative decision nobody
made.

## Layers and dependency map

```
layer 1  domain / capabilities / delta        B1 B3
   │       ContentAddress, Capability, DeltaDescriptor, ValidationReport
   │       DomainDeclaration + validateDomain
   ↓
layer 2  invariants / context                 B4 B8
   │       Scope, CostClass, ContextSurface, Freshness
   │       InvariantDefinition + InvariantEvaluation + admitEvaluation
   │       (imports ContentAddress, ValidationReport, NotAssessedReason)
   ↓
layer 3  laws / policy / version DAG          B2 B7 B5
           LawClaim, LawStatus, BoundaryPolicy, Release
           decideLaw, decideComposition, validateVersionDag
           (imports ContentAddress, PredicateRef, EvidenceRef, FixtureRef)
```

Dependencies run one way only. Layer 3 is where the seam is, and it is last
because it needs the reference types the lower layers define — not because law
evidence is downstream of invariants in the RFC's own structure.

## Closed member sets

Every enumeration is closed, and a control asserts each against this table. An
open enumeration is a place where "unknown" silently becomes "allowed".

| set | members |
| --- | --- |
| `Capability` | `comparable` `ordered` `metric` `interpolable` `composable` `geometric` |
| `LawStatusKind` | `proved` `tested` `asserted` `falsified` |
| `Scope` | `state` `transition` `trace` |
| `CostClass` | `constant` `linear` `superlinear` `unbounded` |
| `ContextSurface` | `state` `transition` `trace` `world` `authority` `logical-step` |
| `BoundaryKind` | `local` `translation` `irreversible` `composition` |
| `NotAssessedReason` | `snapshot-stale` `snapshot-missing` `scope-not-available` `cost-class-exceeds-budget` `undeclared-surface-read` |

`Capability`, `LawStatusKind`, `Scope` and `CostClass` are quoted from the RFC.
`ContextSurface`, `BoundaryKind` and `NotAssessedReason` are **proposed** — see
the ambiguity table.

## Fail-closed boundary table

Every refusal has a code. Nothing returns a bare boolean, and nothing falls
through to an accept.

| boundary | refuses | code |
| --- | --- | --- |
| registry admission | capability declared, method absent | `capability-declared-not-implemented` |
| registry admission | method present, capability undeclared | `capability-implemented-not-declared` |
| registry admission | `move()` without a typed delta space | `geometric-without-delta-descriptor` |
| registry admission | `distance()` without metric axioms | `metric-without-axioms` |
| registry admission | forbidden operation with no reason | `forbidden-without-reason` |
| registry admission | any short handle used as a reference | `non-content-addressed-reference` |
| invariant definition | no falsifier fixture | `no-falsifier` |
| invariant definition | partially-held, no distortion measure | `partial-without-distortion-measure` |
| invariant evaluation | `transition` scope from one state | `missing-predecessor-for-transition` |
| invariant evaluation | `trace` scope from one state | `missing-trace-for-trace-scope` |
| invariant evaluation | `unbounded` gating a fast path | `unbounded-gates-fast-path` |
| invariant evaluation | a surface supplied that the definition never declared | `undeclared-surface-read` |
| law at any boundary | `falsified` — above policy, cannot be opted into | `falsified` |
| law at translation / irreversible | `asserted` — above policy | `asserted-across-boundary` |
| law at any boundary | `tested` with no generation domain | `generation-domain-unstated` |
| law at any boundary | law absent | `law-absent` |
| composition | the two sides declare the law at different scopes | `status-not-accepted` |
| version DAG | patch increment across a law weakening | `patch-across-law-weakening` |
| version DAG | cycle, orphan, or two roots | `cycle` `predecessor-unknown` `multiple-roots` |

Two outcomes are deliberately **not** refusals — they are `not-assessed`:

| condition | outcome | why |
| --- | --- | --- |
| cost class over the boundary's budget | `cost-class-exceeds-budget` | reporting it held would be a claim nobody paid for |
| snapshot staler than the freshness requirement | `snapshot-stale` | §6.1.2 rule 5: an invariant that held against a snapshot no longer current has not been shown to hold now |

`held` / `failed` / `not-assessed` is three-valued because §6.1.2 rule 5 requires
it and the RFC never types `ValidationReport`. Collapsing it to a boolean is how
a boundary comes to believe an invariant held when nobody checked it.

## Properties, by category

Codex's warning is the method here, not just one fact: **typedness does not
confer associativity**, and the general form of that mistake is deriving a
property from a shape. Every property is labelled.

### Structural — follows from the definitions

| property | why |
| --- | --- |
| capability declaration and implementation agree in both directions | `validateDomain` compares two sets and refuses either asymmetry |
| a `geometric` domain has a content-addressed delta space | admission requires it; the converse is refused too |
| every reference is a full digest | one regex, one refusal code, checked on every reference in a declaration |
| a `transition`/`trace` invariant cannot be established from one state | the required surface is absent, and absence is checked before the predicate runs |
| `falsified` authorizes nothing | checked above policy, so a policy cannot opt in |
| a version DAG is a DAG | single root, no cycle, every predecessor present |

### Requires a `LawClaim` — does NOT follow, must be declared with evidence

| property | why not structural |
| --- | --- |
| delta composition is associative | see the countermodel: clamped translations are a well-typed delta space and are not associative |
| `distance` satisfies the triangle inequality | a similarity score is a function too; §6.2 rule 4 exists because naming a metric does not make one |
| `compose` is commutative or idempotent | nothing in the interface constrains it |
| `interpolate` at `t=0`/`t=1` returns the endpoints | not implied by the signature |

### Has a countermodel — executable, in `fixtures/countermodels/`

| claim | countermodel |
| --- | --- |
| "`proved` is stronger than `tested`" | `proved-narrower-than-tested.json` — a proof over a narrow precondition versus a test over a strictly wider generation domain. Neither dominates. |
| "a typed delta space composes associatively" | `delta-not-associative.json` — clamped translation, with the arithmetic witness |
| "scope widening preserves the report" | `scope-widening-unpinned.json` — same predicate and state, two legal world snapshots, two different reports |
| "a patch label is always admissible" | `patch-across-law-weakening.json` — the one conflict §6.2.1 rule 3 names |

**This category is non-empty on purpose.** If a package like this reports no
countermodels, that is not evidence the design is sound; it is evidence nobody
looked.

## The five proof obligations

Each is a normative question. None is discharged here, and none is closed by
picking whichever reading is convenient to implement.

### 1. `LawStatus` has no order, and §6.2 rule 2 requires a minimum over it

§6.2 rule 2: *"A policy MUST state the minimum status each boundary requires."*
Part 03 repeats it at §7.1 three times. **§6.2 defines no order on `LawStatus`.**

The text gives exactly two constraints — `falsified` below everything,
`asserted` below the evidenced kinds at translation and irreversible boundaries
— and never relates `proved` to `tested`. `LawClaim.scope`, `LawClaim.precondition`
and `tested.domain` make that gap load-bearing: a `proved` claim over a narrow
precondition and a `tested` claim over a strictly wider generation domain are
incomparable, and ranking `proved` first would let a boundary accept a proof
about a region it does not operate in over evidence about the region it does.

**This is the same shape the Lean kernel already proved for suitability** —
`proofs/rfc-0003/HSP/Suitability.lean`, `no_meet`, finding C3: a document saying
"the lower of two levels" over an order with no meet. That precedent is why this
package does not invent a total order.

*Obligation:* either state a partial order on `LawStatus` and prove every pair a
policy must compare has a greatest lower bound, **or** replace "minimum status"
with an accept-set formulation, which needs no order. This package implements
the second as `BoundaryPolicy.accepts` and **does not amend the RFC**.

**This is the one seam where Lean would decide something**, and the argument for
it is that the analogous theorem already exists next door: `no_meet` is
four-valued, `LawStatus` is four-valued, and the failure mode is identical. The
theorem candidate is stated below. It is not written here, because the normative
question — which of the two repairs the RFC wants — is the steward's, and a
proof of the wrong one is wasted rigour.

### 2. `InvariantDefinition` has no field for the surfaces §6.1.2 requires it to declare

§6.1.2 rule 1 obligates the definition to declare which context surfaces its
predicate reads. The type at §6.1.1 has no such field. The obligation exists;
its carrier does not. `reads: ContextSurface[]` is **proposed** here.

*Obligation:* add the field to §6.1.1's type, or state where else the
declaration lives.

### 3. `DeltaDescriptor` is required and never defined

§6 :127-131 requires it, with its own content address, or *"`move` is an untyped
hole in an otherwise typed contract"*. The RFC names the type three times and
never gives its shape. Proposed here as `{address, validate, encoding,
composition?}`, with `composition` optional and **not defaulted to associative**.

*Obligation:* define it, and say explicitly whether an absent `composition` means
"no claim" (this package's reading) or "no law".

### 4. The version-label projection is required and never specified

§6.2.1 rule 2 requires `version` to be a projection of the DAG. Rule 3 requires a
registry to reject a label that "conflicts with its position in the DAG", and
gives exactly one example. Neither the projection function nor the general notion
of conflict is defined. This package checks DAG well-formedness and the one named
conflict, and reports the rest as open.

*Obligation:* specify the projection, or state that only the named conflict is
normative and the label is otherwise unconstrained.

### 5. Scope widening is neither permitted nor forbidden

The RFC refuses checking at a **narrower** scope than declared. It says nothing
about wider. Widening is not obviously safe: a predicate declaring
`reads: [state, world]` evaluated inside a trace context may see a world snapshot
from a different logical step than the state it judges, and §6.1.2 rule 2's
reproducibility guarantee is then a claim about a pairing the RFC never pins.

*Obligation:* state whether widening preserves reports, and under what constraint
on the logical step of each supplied surface.

## Theorem candidate, if the steward takes repair (a) for obligation 1

```
For the four-valued LawStatus with the two relations §6.2 rule 2 states,
and for LawClaim carrying scope and precondition:

  (i)  the stated relation is a strict partial order;
  (ii) `proved` and `tested` are incomparable in it;
  (iii) therefore { proved, tested } has no greatest lower bound,
        and "the minimum status" is undefined for any policy that must
        compare a proved claim against a tested one.
```

(iii) is what makes it worth proving rather than asserting: it is the same
conclusion `Suitability.lean`'s `no_meet` reaches, and if it holds then repair
(a) is not available and (b) is forced. **If the steward takes repair (b), no
Lean is needed at all** — an accept set has no order to prove things about, and
adding theorems would be weight rather than evidence.

## What this package does NOT establish

- **Not an implementation.** No production domain exists; `validateDomain`
  validates a *declaration*, not behaviour.
- **Not conformance.** Nothing here is a conformance result for anything.
- **Not ratification.** Tranche B is not ratified by this package and this
  package does not ask for it.
- **Not a completeness claim** about capabilities or context surfaces. §6.4 says
  the domain families are "examples, not a normative completeness claim"; the
  same caution applies to every closed set here that is proposed rather than
  quoted.
- **Not B6.** Composite state and coupling consistency are out of scope, and the
  RFC's own open question about whether composition associates (§20.19) is
  untouched.

## Running it

```sh
deno test --allow-read probes/typed-domain-kernel-v0/ts/kernel_test.ts
```

20 controls. Positive fixtures prove the validators admit something;
countermodels prove they refuse, and refuse with the stated code. A validator
that only ever passes is indistinguishable from one that checks nothing.
