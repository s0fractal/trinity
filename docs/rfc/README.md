# Trinity RFCs

This directory contains human-authored architecture proposals and implementation
seeds.

Root repository briefs such as `README.md`, `AGENTS.md`, and `SKILLS.md` may be
generated projections. RFCs in this directory are intended as stable
human-readable design records unless a future substrate generator explicitly
takes custody of them.

---

## Index

| RFC                                                      | Title                                         | Status                    | Purpose                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RFC-0001](0001-living-substrate-physics.md)             | The Physics of the s0Fractal Living Substrate | Draft Proposal            | Defines conservation laws, energy, fields, organisms, capability morphogenesis, metabolism, ecology, memory, decay, and death.                      |
| [RFC-0002](0002-living-substrate-implementation-seed.md) | Living Substrate Implementation Seed          | Draft Implementation Seed | Converts RFC-0001 into the first buildable deterministic projection: node physics, organism physics, pressure reports, CLI shape, and falsifiers.   |
| [RFC-0003](0003-heterogeneous-state-protocol/)           | Heterogeneous State Protocol                  | Draft document set        | Self-contained, ordered artifact for heterogeneous state representation, translation, conflict, admission, federation, identity, and runtime paths. |

---

## Reading order

Start with RFC-0001 for the conceptual physics.

Then read RFC-0002 when deciding what to implement first.

RFC-0003 is a separate track and its own document set. Enter its
[artifact directory](0003-heterogeneous-state-protocol/) and read Parts 00–07 in
filename order. Part 01 now selects a draft encoding candidate, but remains the
blocker until its interoperability corpus, independent implementations, and
federation adoption exist.

Section numbers in that set are global and stable across the seven specification
parts, so a reference of the form §7.2.2 resolves through Part 00 §22 regardless
of which document currently holds it.

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
