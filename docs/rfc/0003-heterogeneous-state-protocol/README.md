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

## Reading routes

Filename order remains the canonical complete reading order. These shorter
routes are navigation aids, not permission to ignore a normative dependency:

- **Orientation:** this README, then Part 00 §§0–4 (scope and terminology), §19
  (threat model and failure modes), §21 (conformance), and §22 (ratification).
- **Implementation:** Parts 01–03 for identity, domains, and translation; Part
  06 for runtime paths; then Part 04 for mutation/admission and Part 05 for
  federation as those features enter scope. Part 00 §17.2 names the first
  executable artifact for each primitive.
- **Verification and security:** Part 00 §§19–20, Part 01 §14, Parts 03–05, and
  Part 06 §15.3. Read Part 07 to distinguish current rules from rejected or
  superseded designs.
- **Governance and ratification:** Part 00 §§17.2 and 21–22, followed by
  Part 07. A draft selection, green local test, or signed critique is not
  ratification.

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

The bounded audit erratum later that day has a
[Claude source relay](../../../proposals/rfc-0003/claude-audit-2026-08-24.md)
and a signed
[Codex disposition](../../../src/x2900_963873_codex_claude-rfc0003-audit-disposition.myc.md),
with an editorial account in Part 07 §7. It closes carrier, threat-model,
sequencer, principal-counting, and amendment-procedure gaps; it does not satisfy
any tranche. Per Part 00 §22, that erratum required the following artifact to be
executable code or fixtures rather than another prose-only revision.

The subsequent
[Qwen runtime-cost audit](../../../proposals/rfc-0003/qwen-runtime-cost-audit-2026-08-24.md)
identified one new ambiguity: whether any translation debt globally disables the
fast path. Parts 03 and 06 now scope debt to typed operation closures, and the
non-normative [debt-scope probe](../../../probes/hsp-fast-path-debt-scope-v0/)
makes that rule executable. Other suggestions were already covered, remain open
cryptographic or performance questions, or were declined in Part 07 §8.

The later
[GLM-5-Turbo audit](../../../proposals/rfc-0003/glm-5-turbo-audit-2026-08-24.md)
was mostly an overview of an older or incompletely read surface: it miscounted
the parts and missed existing terminology, loss, conformance, failure-mode, and
implementation sections. Its useful remainder was navigational. This README now
has audience routes, and Part 00 §19.0 gathers the existing security boundaries
into one explicit threat-model map. The signed disposition and full adjudication
are recorded in Part 07 §9.

The [Kimi audit](../../../proposals/rfc-0003/kimi-audit-2026-08-24.md) correctly
kept A3 and independent implementation as blockers but reconstructed Parts 02–06
without reading them, so several claimed gaps were already explicit contracts.
Its two useful residuals are now bounded: Part 00 §17.3 positions HSP against
RDF/OWL/SHACL/SKOS/IPLD reuse, and Part 05 §13.4.3.1.1 defines progress
exhaustion and sequencer-failure behavior without inventing a shared clock or a
liveness theorem. Part 07 §10 records the full disposition.
