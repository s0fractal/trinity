# Trinity RFCs

This directory contains human-authored architecture proposals and implementation
seeds.

Root repository briefs such as `README.md`, `AGENTS.md`, and `SKILLS.md` may be
generated projections. RFCs in this directory are intended as stable
human-readable design records unless a future substrate generator explicitly
takes custody of them.

---

## Index

| RFC                                                      | Title                                                            | Status                    | Purpose                                                                                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RFC-0001](0001-living-substrate-physics.md)             | The Physics of the s0Fractal Living Substrate                    | Draft Proposal            | Defines conservation laws, energy, fields, organisms, capability morphogenesis, metabolism, ecology, memory, decay, and death.                                                     |
| [RFC-0002](0002-living-substrate-implementation-seed.md) | Living Substrate Implementation Seed                             | Draft Implementation Seed | Converts RFC-0001 into the first buildable deterministic projection: node physics, organism physics, pressure reports, CLI shape, and falsifiers.                                  |
| [RFC-0003](0003-heterogeneous-state-geometries.md)       | Heterogeneous State Protocol — Architecture and Ratification Map | Draft (umbrella)          | Theses, non-goals, terminology, dependency graph, failure-mode catalogue, open problems, demos, and the tranche map. Almost no `MUST` — the normative weight is in RFC-0004…0009.  |
| [RFC-0004](0004-canonical-identity-and-encoding.md)      | Canonical Identity and Encoding                                  | Draft                     | Content-addressed references, one canonical encoding with a float policy, parity fixtures, ledger requirements, and the disclosure layer. **Blocks every other document.**         |
| [RFC-0005](0005-typed-state-domains.md)                  | Typed State Domains and Invariants                               | Draft                     | The state-domain contract as a small base plus capabilities, declared algebraic laws with epistemic status, invariant execution model, and composite state.                        |
| [RFC-0006](0006-translation-loss-and-suitability.md)     | Translation, Loss, Suitability and Debt                          | Draft                     | Five kinds of transformation, loss and debt algebras, suitability as an order with no self-report, translator composition and round-trip anchors, evidence bridges.                |
| [RFC-0007](0007-conflict-and-admission.md)               | Conflict, Bottleneck and Admission                               | Draft                     | Conflict as a ledger object, structural insufficiency and witness pairs, mutation budgets, and admission split into eligibility that replays and authorization that is attributed. |
| [RFC-0008](0008-federated-handshake.md)                  | Federated Handshake and Compatibility Boundaries                 | Draft                     | Federated translation, scoped compatibility contracts, irreversible-boundary consensus, and the genesis handshake over a shared execution floor.                                   |
| [RFC-0009](0009-identity-and-runtime-paths.md)           | Governed Identity and Runtime Paths                              | Draft                     | State profiles, identity mutation policy, and the two-path runtime with a fail-closed predicate and amortized receipting.                                                          |
| [REVISION HISTORY](0003-REVISION-HISTORY.md)             | RFC-0003 revision history                                        | Record                    | Where the specification changed its mind and why, kept out of the normative documents so a reader of one does not have to eat another's history.                                   |

---

## Reading order

Start with RFC-0001 for the conceptual physics.

Then read RFC-0002 when deciding what to implement first.

RFC-0003 is a separate track and its own document set. Read the umbrella first —
it holds the theses and the map — then the numbered documents in dependency
order, which is simply 0004 upward. RFC-0004 is the blocker: until its encoding
is selected, nothing after it is implementable across substrate boundaries.

Section numbers in that set are global and stable across all seven files, so a
reference of the form §7.2.2 resolves through RFC-0003 §22 regardless of which
document currently holds it.

The intended progression is:

```text
laws
  ↓
pressure visibility
  ↓
field navigation
  ↓
organism routing
  ↓
bounded metabolism
  ↓
evidence-based autonomy
```

---

## Design rule

An RFC in this directory should answer at least one of these questions:

1. What law does this add or clarify?
2. What pressure does this make visible?
3. What projection does this make reproducible?
4. What organism behavior does this bound?
5. What falsifier would prove the proposal wrong?
