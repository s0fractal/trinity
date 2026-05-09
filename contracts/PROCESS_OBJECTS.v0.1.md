# PROCESS_OBJECTS.v0.1

This contract defines how Trinity records not only final repository state, but
also the process that produced it.

The core rule is:

```text
Meaningful work becomes an immutable process object.
Current state is a projection over immutable process objects.
```

## Premise

Raw material is not truth.

Raw captures are already distorted by copy/paste, summarization, interface
boundaries, memory, interpretation, missing messages, and model compression.
They are still valuable because they preserve a traceable input surface.

Therefore Trinity treats raw material as evidence, not authority.

## Object Identity

Process objects should eventually use this filename shape:

```text
h.<12hex>.<human-slug>.<kind>.trinity.md
```

Example:

```text
h.a91f20eaa421.public-process-trace.proposal.trinity.md
```

The short hash in the filename is a navigation prefix. The full content hash
belongs in frontmatter.

## Hash Model

Process objects should separate payload identity from descriptor identity:

```yaml
payload_hash: "sha256:..."
descriptor_hash: "sha256:..."
canonicalization: "trinity-process-object-v0.1"
```

- `payload_hash` binds the captured or derived content.
- `descriptor_hash` binds the metadata envelope and body.
- Hashes are computed over canonicalized content.
- Hash fields are excluded from the canonicalized material they identify.

## Common Envelope

```yaml
---
type: "ProposalDescriptor"
version: "0.1"
fqdn: "h.a91f20eaa421.public-process-trace.proposal.trinity.md"
title: "Publish the development process as verified MYC objects"
payload_hash: "sha256:..."
descriptor_hash: "sha256:..."
source_fidelity: "synthesis"
created_at: "2026-05-09T00:00:00Z"
created_by: "human:s0fractal"
target_layers: ["trinity", "myc"]
publish_policy:
  visibility: "public"
  payload: "embedded"
  redaction: "none"
  consent: "explicit"
---
```

## Source Fidelity

`source_fidelity` describes how close the object is to the original signal:

| Value        | Meaning                                          |
| ------------ | ------------------------------------------------ |
| `exact`      | Byte-for-byte capture of the source.             |
| `excerpt`    | Partial but literal excerpt.                     |
| `merged`     | Several source messages merged into one capture. |
| `paraphrase` | Human/model restatement of a source.             |
| `synthesis`  | Derived object built from multiple inputs.       |
| `memory`     | Recalled context without direct source artifact. |
| `formula`    | Abstracted formal claim or equation.             |

Low fidelity does not make an object invalid. It only limits what it can prove.

## Descriptor Types

### `RawCaptureDescriptor`

Stores the first usable capture of a conversation, task, observation, imported
message, or rough idea.

Required fields:

- `source_kind`: `chat`, `web`, `repo`, `terminal`, `paper`, `memory`, `other`
- `source_fidelity`
- `captured_by`
- `payload_hash`

### `InterpretationDescriptor`

Records an interpretation of one or more raw captures.

Required fields:

- `interprets`: list of object hashes
- `method`: `summary`, `analysis`, `translation`, `normalization`, `critique`
- `interpreter`: human or model identity

### `ClaimDescriptor`

Records one atomic claim that can later be supported, rejected, refined, or
formalized.

Required fields:

- `claim`
- `derived_from`
- `confidence`
- `verification_status`: `unverified`, `supported`, `contradicted`, `formalized`

### `FormulaDescriptor`

Records an abstraction of a claim into a formula, invariant, type rule, or
protocol constraint.

Required fields:

- `formula_kind`: `equation`, `invariant`, `type-rule`, `protocol-rule`
- `inputs`
- `statement`
- `test_or_proof_hint`

### `ProposalDescriptor`

Records a proposed change to a repository, protocol, architecture, or process.

Required fields:

- `title`
- `problem`
- `proposal`
- `target_layers`
- `derived_from`

### `ReviewDescriptor`

Records a review of another object.

Required fields:

- `target_hash`
- `reviewer`
- `rating`: `approve`, `reject`, `neutral`, `needs-work`
- `findings`

### `DecisionDescriptor`

Records a decision without mutating the proposal it decides on.

Required fields:

- `target_hash`
- `decision`: `accepted`, `rejected`, `superseded`, `deferred`
- `rationale`

### `WorkIntentDescriptor`

Records an intent to implement, audit, migrate, or verify.

Required fields:

- `target_hash`
- `work_kind`: `implementation`, `audit`, `migration`, `verification`, `cleanup`
- `scope`
- `expected_receipts`

### `VerificationReceiptDescriptor`

Records the output of a check, audit, test, or reproducible command.

Required fields:

- `target_hash`
- `command`
- `exit_code`
- `summary`
- `artifact_hashes`

### `PublicationReceiptDescriptor`

Records publication into `myc` or another public projection.

Required fields:

- `source_hash`
- `published_to`
- `published_fqdn`
- `published_hash`

## Append-Only Status

Objects are not edited to change state.

Do not mutate:

```yaml
status: "open"
```

into:

```yaml
status: "accepted"
```

Instead, add a `DecisionDescriptor` that points at the original object.

## Public Process Trace

If an object passes publish policy, it may be projected into `myc` so `myc.md`
can show both:

- what changed;
- why it changed;
- how the decision was reached;
- what verified it.

This makes development itself addressable.
