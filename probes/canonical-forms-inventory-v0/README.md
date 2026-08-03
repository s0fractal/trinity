---
status: active
triaged_by: claude
next_verification: extend the corpus with the float cases RFC-0004 §5.1.2 actually cares about (NaN, ±Inf, -0.0, denormals) and with the ratio/fixed-point patterns, then re-run against warrant's own Python impl rather than the local JCS reimplementation; graduate only if Tranche A3 selects an encoding and this becomes its parity gate
graduation_target: null
---

# canonical-forms-inventory-v0

> **Status: active probe, non-authoritative.** It measures what exists; it
> decides nothing. Tranche A3 (RFC-0004) is the decision.

## Why

RFC-0004 is blocked on selecting one canonical encoding, and that selection was
being argued on the basis of **two** forms — trinity's `CANONICAL_HASH.v0.1` and
warrant's JCS profile — as though they were rivals.

They are not two, and they are not rivals. This probe found **ten** canonical
forms across the ecosystem, using **three hash functions**, over **three
different kinds of input**, with **four different truncations**. Several are
live, several are draft, one contract does not even fix which of two encodings
it means.

That confusion is the accumulated residue of a lot of experiments, and it was
about to be laundered into a specification decision.

## Run

```sh
deno run -A probes/canonical-forms-inventory-v0/inventory.ts
deno run -A probes/canonical-forms-inventory-v0/inventory.ts --json
```

## What it found

**The headline: `CANONICAL_HASH` and JCS are layers, not rivals.**

Trinity's hash takes a text body and never parses it. Warrant's digest
canonicalizes a structure and then hashes. So the testable prediction is: for a
value whose text form is *already* JCS-canonical, trinity's existing hash of
that text equals the structural digest — and for a value whose text is not
canonical, it does not. Both hold across the corpus.

Consequence for Tranche A3: JCS can be adopted as the **structural
canonicalizer** without replacing the federation's identity primitive. Every
`h.` handle over an already-canonical body stays valid unchanged. This is a much
cheaper decision than "choose between two schemes", which is what RFC-0004 §17.1
implied before this probe existed.

**The inventory itself:**

| form                              | input       | hash    | truncation      | status   |
| --------------------------------- | ----------- | ------- | --------------- | -------- |
| `CANONICAL_HASH.v0.1`             | text        | SHA-256 | 12 hex, `h.`    | live     |
| `CANONICAL_HASH.v0.1` (full)      | text        | SHA-256 | none            | live     |
| `canonical-receipt` (CBOR)        | structure   | SHA-256 | none            | live     |
| `warrant` SPEC §4 (JCS)           | structure   | SHA-256 | none            | external |
| `myc` raw.bytes + stableStringify | structure   | SHA-256 | none            | live     |
| Σ-GLYPH Book I NodeHash           | binary term | SHA-256 | none            | external |
| `JOURNAL_CORE.v2.0` node_id       | text        | BLAKE3  | Base32 [0..25]  | draft    |
| `SPORE.v0` apply digest           | binary term | BLAKE3  | none            | draft    |
| `blake3-fqdn-v0` filename prefix  | text        | BLAKE3  | 3 hex           | probe    |
| `RECEIPT_ENVELOPE.v1.0` body_hash | structure   | multi   | none            | live     |

Six of the ten are `unavailable` to this probe, each with a stated reason. That
is deliberate: RFC-0004 §5.1.3 requires that "we did not run it" and "it agreed"
must never look the same, and a probe that silently skipped six forms while
reporting four green would be exactly that failure.

**`RECEIPT_ENVELOPE.v1.0` is the sharpest single finding.** Its contract says
the body hash is a multihash over "canonical CBOR / JSON" and does not fix
which. That is not a canonical form — it is a choice handed to the caller, in a
contract whose purpose is to make identity stable.

**Nobody normalizes Unicode.** All four executed forms keep NFC and NFD
distinct, which is what RFC-0004 §5.1.1 rule 5 requires. That rule was written
as a correction and turns out to describe existing behavior everywhere.

## Honesty notes

- The JCS implementation here is a **reimplementation** restricted to what the
  corpus needs. It is not warrant's, and agreement with it is therefore weaker
  evidence than running warrant's own harness. The next verification step is to
  drive warrant's Python implementation directly.
- The layering check was tautological in a first draft — warrant's digest *is
  defined* as sha256 over JCS bytes, so "sha256(jcs(v)) equals warrant's digest"
  measures nothing. The check now compares trinity's **text** path against the
  structural path and predicts *when* they diverge, which is falsifiable. The
  tautology is documented in the source rather than removed from history.
- The float cases RFC-0004 §5.1.2 most cares about — `NaN`, infinities, `-0.0`,
  denormals — are **not** in the corpus. The `negative-zero` case is an integer
  standing in for one, because reaching the real cases requires each form's
  error path rather than its hash. That is a gap, and it is the next thing to
  extend.

## Falsifiers

- If warrant's own Python implementation disagrees with the local JCS
  reimplementation on any corpus value, the layering finding rests on a bug in
  this probe rather than on a property of the two forms.
- If any live form is found to normalize Unicode, RFC-0004 §5.1.1 rule 5 is
  describing a behavior the ecosystem does not have, and adopting it is a change
  rather than a codification.
- If `myc`'s `stableStringify` turns out to disagree with JCS on key ordering or
  escaping, then trinity already contains two mutually incompatible structural
  canonicalizers and Tranche A3 has a migration to plan, not just a selection.
