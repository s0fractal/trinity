# Public Process Trace

Trinity should publish not only results, but also the process that leads to
results.

This is the slow file-based prototype of a future faster model protocol.

## Why

Repository history answers "what changed".

A public process trace answers:

- where the idea came from;
- what was raw input and what was interpretation;
- what claims were extracted;
- what proposals were reviewed;
- what decisions were made;
- what commands verified the outcome;
- what was published to `myc`.

The goal is not bureaucracy. The goal is addressable reasoning.

## Raw Is Not Truth

The existing `tasks/` and `dialog/` directories in the ecosystem were already a
prototype of this idea: captures from model conversations, web sessions, tasks,
and working notes.

But raw captures are rarely clean:

- a paste may merge several messages;
- a web chat may omit context;
- a model answer may already be a compression;
- a human note may include memory and interpretation;
- a copied transcript may lose metadata;
- a terminal snippet may omit the command that produced it.

So raw material is a trace, not an oracle.

Trinity records raw material with fidelity metadata, then lets later objects
interpret, challenge, formalize, and verify it.

## Object Flow

```text
RawCaptureDescriptor
  -> InterpretationDescriptor
  -> ClaimDescriptor
  -> FormulaDescriptor
  -> ProposalDescriptor
  -> ReviewDescriptor
  -> DecisionDescriptor
  -> WorkIntentDescriptor
  -> VerificationReceiptDescriptor
  -> PublicationReceiptDescriptor
```

Not every idea needs every stage. The chain can be short for small changes.

## Scratch vs Object

A model action is either scratch or an object.

Scratch:

- local exploration;
- temporary terminal output;
- failed private branches;
- uncommitted working context;
- private reasoning not meant for publication.

Object:

- a durable idea;
- an analysis worth preserving;
- a claim that may be verified;
- a proposal;
- a review;
- a decision;
- a verification receipt;
- a publication receipt.

The system should not pretend scratch is public truth.

## Public Policy

Process objects can be public when they satisfy:

- no secrets;
- no private payload leakage;
- no accidental local credentials;
- no unsafe personal context;
- clear source fidelity;
- valid content hash;
- valid FQDN;
- explicit or inherited publish policy.

Suggested policy envelope:

```yaml
publish_policy:
  visibility: "public"
  payload: "embedded"
  redaction: "none"
  consent: "explicit"
```

For sensitive material:

```yaml
publish_policy:
  visibility: "public"
  payload: "sealed"
  redaction: "private-context"
  consent: "explicit"
```

## Naming

Use content-addressed names for process objects:

```text
h.<12hex>.<human-slug>.<kind>.trinity.md
```

Examples:

```text
h.a91f20eaa421.public-process-trace.proposal.trinity.md
h.09cd11a88f21.public-process-trace.review.trinity.md
h.77e19ab00acd.accept-public-process-trace.decision.trinity.md
h.3dd4f1a708de.audit-green.verification.trinity.md
```

Human navigation should come from projections and indexes, not from mutable
renames.

## Projection To MYC

`trinity` can act as a working control plane. `myc` can act as the public
projection.

```text
trinity process object
  -> verify hash/FQDN/policy
  -> myc public object
  -> myc index and graph
  -> myc.md reader/resolver
```

This lets `myc.md` show both final results and the verified development process.

## Future Protocol

Files are slow, but they are useful now because they force the ontology to be
explicit.

Later the same shape can move to:

- append-only event logs;
- PN-CAD snapshots;
- model-to-model protocol messages;
- direct receipt streams;
- periodic public snapshots into `myc`.

The invariant should remain:

```text
immutable events + verifiable projections + explicit receipts
```

## Proof-Carrying Raw

Large raw streams do not always need to remain the primary representation.

If enough proof structure exists, a raw stream can be represented by a smaller
projection:

```text
raw stream
  -> channel split
  -> action/event/state log
  -> deterministic replay or verification
  -> selected raw receipts
```

For example, a deterministic game video can be represented by the game build
hash, initial state, input action log, overlay channel hashes, replay engine,
final state, and selected frame hashes.

See:

- `contracts/PAR_LOOP.v0.1.md`
- `docs/PROOF_CARRYING_RAW.md`

## Non-Goals

- Do not publish every token of every private conversation.
- Do not treat raw captures as authoritative.
- Do not make hash filenames the only human navigation layer.
- Do not let process publication bypass repository tests or audit gates.
