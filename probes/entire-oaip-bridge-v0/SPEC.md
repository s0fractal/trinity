---
status: active
triaged_by: claude
next_verification: build the ingest only after this mapping survives review; the falsifiers below are the review surface, and three of them can be answered by reading entireio/cli rather than by writing code
graduation_target: null
---

# entire-oaip-bridge-v0

> **Status: specification only. No code.** A mapping written to be argued with
> before it is built, on the finding from this session that reviewing prose
> catches less than running something — but that prose is far cheaper to throw
> away.

## 0. Why

[`entireio/cli`](https://github.com/entireio/cli) captures AI agent sessions as
structured checkpoints indexed against commit SHAs, on a side branch
`entire/checkpoints/v1`. Go, MIT-ish OSS, from a team with a $60M seed.

[`~/Projects/oaip`](https://github.com/s0fractal/oaip) specifies Observer/Ledger
records and a `ClaimCandidate` that bridges into
[`warrant`](https://github.com/s0fractal/warrant) as a signed decision.

They meet cleanly, and the interesting part is **where they stop meeting**.

## 1. The convergence, stated before the divergence

Entire's `api/checkpoint/metadata.go` and OAIP's SPEC §2 independently arrived
at the same first records. Entire's fields, verbatim from the struct:

```go
type Metadata struct {
    CheckpointID  id.CheckpointID `json:"checkpoint_id"`
    SessionID     string          `json:"session_id"`
    CommitSHA     string          `json:"commit_sha,omitempty"`
    FilesTouched  []string        `json:"files_touched"`
    Agent         types.AgentType `json:"agent,omitempty"`
    Model         string          `json:"model"`
    TurnID        string          `json:"turn_id,omitempty"`
    TokenUsage    *types.TokenUsage `json:"token_usage,omitempty"`
    Attribution   *Attribution    `json:"initial_attribution,omitempty"`
    // …
}
```

| OAIP §2 record                | Entire source                                                     |
| ----------------------------- | ----------------------------------------------------------------- |
| `Intent` (§2.3)               | `Prompts`, `ReviewPrompt`, `InvestigateTopic`                      |
| `Execution` (§2.4)            | `Agent`, `Model`, `TurnID`, `ToolUseID`, `SkillEvents`, `TokenUsage` |
| `Artifact` (§2.1)             | `Transcript`, `Assets[].Data`                                      |
| `Effect` (§2.5)               | `FilesTouched` resolved at `CommitSHA`                             |
| `State` (§2.2)                | `CommitSHA` + its parent                                           |
| `Attribution` (§2.6)          | `Attribution{}` — **same name, different concept, see §3.1**        |
| **`ClaimCandidate` (§2.7)**   | **nothing**                                                        |
| **`validation`**              | **nothing**                                                        |
| **warrant `accept`**          | **nothing**                                                        |

The convergence is not a coincidence and not evidence that either is right. It
is evidence that the first four records are what the problem forces on anyone
who looks at it.

## 2. The upgrade the bridge performs

The bridge's value is not "add signatures." It is that **Entire's own data
already contains what is needed to turn names into content addresses**, and it
does not do so.

```text
FilesTouched []string          →   Effect{ path, before: hex64, after: hex64 }
     names                           digests, resolved via `git rev-parse
                                     <CommitSHA>^{tree}` and its parent
```

`CommitSHA` pins the tree. So every path in `FilesTouched` resolves
deterministically to a blob hash before and after, with no cooperation from
Entire required. That is the single highest-value transformation here: a
checkpoint says *"these files were touched"*, and after ingest it says *"these
exact bytes became these exact bytes"*.

Similarly, `Transcript redact.RedactedBytes` becomes an `Artifact` — hashed on
ingest, so the transcript a decision cited can be shown to be the transcript
that exists.

### 2.1 Canonicalization is the ingest's job

Entire's records are Go structs serialized with `omitempty` and partial
versioning (`cli_version`, `metric_version`, `skill_events_version`). There is
no canonical serialization, so two readers can hash the same logical checkpoint
differently.

The ingest MUST canonicalize on read, per OAIP SPEC §1 — JCS-canonical I-JSON,
integers only, exact code points, duplicate members rejected. This is
`warrant` SPEC §4's profile, and the reason the ingest can be written at all is
that this problem is already solved on our side.

## 3. Three same-name-different-concept traps

Found in one afternoon of reading. Each would silently corrupt a bridge that
assumed name equality means concept equality — the failure RFC-0006 §7.5 exists
to prevent.

### 3.1 `Attribution`

- **Entire**: `AgentLines`, `HumanAdded`, `HumanModified`, `AgentPercentage` —
  *how much of the diff the agent wrote*. A quantitative code-authorship metric.
- **OAIP §2.6**: "causality, first-class and uncertain" — *who or what is
  responsible for a state mutation*.

A bridge that maps one onto the other asserts that authorship percentage is a
causal claim. It is not. Entire's `Attribution` maps to **evidence**, not to
OAIP's `Attribution` record.

### 3.2 `provenance`

Entire's `docs/install-provenance-plan.md` defines provenance as *which package
manager installed the binary*, for auto-update routing:

> `manager`: `install.sh`, `brew`, `scoop` — `channel`: `stable`, `nightly`

That is not provenance of work. A reader scanning for "does Entire do
provenance" finds a yes that means something else entirely.

### 3.3 `checkpoint`

Entire: a rewind point — "a snapshot within a session that you can rewind
to—a 'save point' in your work." OAIP/warrant: nothing rewinds; records are
immutable and superseded by `prior` chains. The bridge consumes checkpoints as
**observations**, never as restore points, and MUST NOT expose rewind semantics
downstream.

## 4. What does not map, and must not be synthesized

### 4.1 There is no validation, and one cannot be invented

`ClaimCandidate.validation` is a closed object requiring `runtime`, `check`,
`verdict`, `transcript` — where `check` is *"the **hash of the check blob**, not
its text"*, because *"a command echoed into a record is a description of a check
rather than the check."*

An Entire checkpoint contains no check. The ingest therefore MUST NOT emit a
`ClaimCandidate` from a checkpoint alone. Two honest options:

1. emit `Intent`/`Execution`/`Effect`/`Artifact`/`State` only, and let a claim be
   proposed separately by whoever runs a check;
2. run a check at ingest time and record it as what it is — `oaip-host-shell@v1`,
   never a tag whose profile did not happen.

OAIP's SPEC states why this is a MUST, with its own scar attached:

> until 2026-07-31 this implementation ran the check through the host shell and
> recorded `cmd@v1`, a tag Warrant SPEC §3 defines as execution in an isolated
> container, and passed it into a signed decision. A record that names an
> execution profile which did not happen is a false record even when every hash
> in it is correct.

### 4.2 The checkpoint→commit link is not causal, by Entire's own admission

`docs/KNOWN_LIMITATIONS.md`:

> When multiple sessions are ACTIVE in the same directory and one session's
> agent (or subagent) makes a commit, **all** ACTIVE sessions are condensed —
> including sessions that didn't contribute to the commit. This can produce
> checkpoint entries with minimal content (e.g., just the initial prompt) linked
> to a commit the session didn't work on.

Entire calls the impact "cosmetic." For their product it is. **For a provenance
claim it is not**: a checkpoint asserting a link to a commit it did not
contribute to is a false attribution, and it is exactly the case OAIP §2.6 was
typed as *uncertain* to hold.

The ingest MUST therefore treat `CommitSHA` as **co-occurrence, not causation**,
and MUST record the uncertainty rather than resolving it. A checkpoint whose
`FilesTouched` is disjoint from the commit's changed paths is a detectable
instance of this, and the ingest SHOULD flag it rather than emit a confident
`Effect`.

This is the most valuable single line in their repository for our purposes, and
it was found by reading their limitations doc rather than by inferring from
their README.

### 4.3 Redaction is lossy and admitted

> redaction is best-effort. Temporary shadow branches used during a session may
> contain unredacted data.

A hashed transcript is a hash of the *redacted* bytes. The bridge MUST NOT
present it as a hash of what the agent saw, and any disclosure layer (RFC-0004
§14.1) built on it inherits a best-effort boundary, not a cryptographic one.

## 5. Falsifiers

Three of these can be answered by reading `entireio/cli`, without writing any
code. That is the point of writing this before building it.

- If `FilesTouched` turns out not to be resolvable against `CommitSHA` — because
  it records paths at a different revision, or post-rename — then §2's central
  transformation does not work and the bridge's main value evaporates.
- If Entire's checkpoint format gains a canonical serialization and content
  hashes, §2.1 becomes redundant and the bridge should consume theirs rather
  than re-canonicalizing.
- If the spurious-checkpoint case of §4.2 is fixed upstream (ENT-241 / the
  ACTIVE-session condensation), the co-occurrence caveat weakens and `Effect`
  can be emitted with more confidence — this is worth re-checking before build.
- If someone builds this and finds that a `ClaimCandidate` is in practice always
  proposed by the same actor that ran the check, then OAIP's separation of
  proposal from validation buys nothing here and the bridge should say so.
- If OAIP registers a validation runtime that a checkpoint could satisfy without
  a fresh check, §4.1's prohibition is too strong.

## 6. What this is not

Not an integration, not an endorsement, not a claim that either project needs
the other. It is a mapping written down so that the parts which do not map are
visible before anyone spends a week discovering them in code.

The parts that do not map are §3, §4.1, §4.2, and §4.3 — and they are the
reason this is worth a document rather than an afternoon of plumbing.
