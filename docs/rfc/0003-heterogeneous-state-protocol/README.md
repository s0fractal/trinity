# RFC-0003: Heterogeneous State Protocol

This directory is the complete RFC-0003 artifact. Its boundary is deliberate:
the files beside this directory in `docs/rfc/` are other RFCs, not additional
context for this specification.

Read the parts in filename order. Part 00 carries the architecture, terminology,
dependency graph, demos, and ratification map. Parts 01–06 carry the normative
contracts. Part 07 records revision history and is non-normative.

| Part | Document                                                                          | Role                         | Depends on                    |
| ---- | --------------------------------------------------------------------------------- | ---------------------------- | ----------------------------- |
| 00   | [Architecture and Ratification Map](00-architecture-and-ratification-map.md)      | Umbrella                     | —                             |
| 01   | [Canonical Identity and Encoding](01-canonical-identity-and-encoding.md)          | Normative; Tranches A, J1–J3 | —                             |
| 02   | [Typed State Domains and Invariants](02-typed-state-domains.md)                   | Normative; Tranche B         | Part 01                       |
| 03   | [Translation, Loss, Suitability and Debt](03-translation-loss-and-suitability.md) | Normative; Tranche C         | Parts 01, 02                  |
| 04   | [Conflict, Bottleneck and Admission](04-conflict-and-admission.md)                | Normative; Tranches D, E     | Parts 01, 02                  |
| 05   | [Federated Handshake and Compatibility Boundaries](05-federated-handshake.md)     | Normative; Tranche G         | Parts 01, 03, execution floor |
| 06   | [Governed Identity and Runtime Paths](06-identity-and-runtime-paths.md)           | Normative; Tranches F, H     | Parts 01, 02                  |
| 07   | [Revision History](07-revision-history.md)                                        | Non-normative record         | —                             |

Part 01 selects CNP-0-JCS in the draft. It still blocks conforming
cross-substrate implementation until the separate contract, normative corpus,
independent implementations, rejecting verifier path, and federation adoption
exist.

## Numbering

The two-digit filename prefixes are the canonical reading and part order.
Normative section identifiers such as §7.2.2 remain global across RFC-0003 and
are mapped in Part 00 §22. They were not rewritten because existing ledger
receipts cite them.

Before 2026-08-24, Parts 01–06 were stored beside unrelated RFCs and labelled
RFC-0004 through RFC-0009. The reorganization changed packaging and navigation,
not normative content; historical paths remain available through Git history.

## Non-normative provenance

External inputs are stored outside this artifact so a model reading the folder
does not mistake them for specification parts. The 2026-08-24 CNP-0 change has a
[verbatim Grok relay](../../../proposals/rfc-0003/grok-cnp-0-2026-08-24.md), a
[Codex disposition](../../../src/x2900_963870_codex_grok-cnp0-proposal-disposition.myc.md),
and an editorial account in Part 07 §6. Neither provenance record is normative
or ratification authority.
