---
status: active
triaged_by: claude
next_verification: fold the collision pair into fixtures/canon-vectors.json as a negative vector, so any implementation claiming CANONICAL_HASH conformance must also demonstrate that it distinguishes the two bodies by full digest; that turns this probe's finding into a standing gate rather than a one-off demonstration
graduation_target: fixtures/canon-vectors.json
---

# handle-collision-v0

> **Status: active probe. The claim it tests is now demonstrated, not asserted.**

## The claim

RFC-0004 §5.1 rule 4 says of trinity's `h.` handle:

> The 12-hex form is a handle, not a security binding. Forty-eight bits is
> adequate for human-readable addressing and accidental-collision avoidance,
> and inadequate against an adversary who can grind for a collision.

I wrote that. It is a textbook claim, and nobody in this repository had ever
made it fail. By this session's own standard — a claim never given the chance
to be wrong is a claim, not a check — it was unearned.

## The result

```text
input A         trinity-handle-collision-probe-126911747
input B         trinity-handle-collision-probe-178187457
shared handle   h.587014f87b80

full digest A   587014f87b803f9f07f29fc5759b9d83849016f86d92e90e5bd6f51477f85c44
full digest B   587014f87b80ba50b078b9586d5da9e5fb87a7ce7d84562161e50c31b3edeb37
digests differ  True

generated       178,187,458 candidates
stored            2,784,373
elapsed              67.0 s   one core, Python stdlib, no optimization
```

**Sixty-seven seconds.** Not a cluster, not a GPU, not a rented machine — one
core of a laptop, in an interpreted language, with a `dict`.

## Verified against trinity's own implementation

The probe is Python. Confirming a property of *my reimplementation* would have
proved nothing, so the pair was re-checked through `src/x4010_hash.ts`, which is
what the substrate actually runs:

```text
trinity fqdnPrefix(A) = h.587014f87b80
trinity fqdnPrefix(B) = h.587014f87b80
handles equal         = true
full digests equal    = false
inputs equal          = false
```

## Method

A full birthday search over 48 bits needs ~2²⁴ stored samples, which is
memory-heavy in pure Python. This keeps only candidates whose 48-bit prefix ends
in six zero bits — a distinguished-point filter — searching a 42-bit subspace
with 1/64 of the memory at the cost of generating 64× more candidates. Hashing
is cheap; RAM is not. The collision found is a genuine 48-bit prefix collision;
it merely lives in the filtered subspace.

Candidates are deterministic (`trinity-handle-collision-probe-<n>`), so either
side of the collision regenerates from its index alone. Nothing needs to be
committed as a blob for the result to be checkable.

## The first run failed, and said so

At `TRAILING_ZERO_BITS = 5, MAX_CANDIDATES = 2²⁷` the search stored 4.19M and
found nothing — about a 63% chance of success, so an unremarkable miss. The
probe exited 1 and reported:

> no collision within budget — this probe is underpowered, **NOT** evidence
> that a 48-bit handle is safe.

That wording exists because the opposite wording is the trap. A search that
finds nothing is the easiest thing in the world to read as a clean bill of
health, and it is not one.

## What this shows, and what it does not

**Shown.** An adversary can produce **two inputs sharing one handle**. That is
the attack the protocol cares about: author a benign object, get its handle
approved or witnessed, substitute the twin afterwards. A reference naming only
the handle does not identify which body it meant.

**Not shown, and not claimed.** A second preimage — taking an *existing* handle
and finding a fresh input matching it — is ~2⁴⁸ work and is out of reach here.
The distinction matters: it means existing handles in the ledger are not
retroactively forgeable, while *newly minted* handle-bearing references are
attackable by whoever mints them.

That refines §5.1.4 rather than merely confirming it. The rule should bite where
a handle is **minted by a party who benefits from ambiguity**, which is exactly
admission, identity amendment, and trust computation — the cases the rule
already names.

## Falsifiers

- If the pair fails to collide under any conforming `CANONICAL_HASH.v0.1`
  implementation, this probe found a bug in its own reimplementation rather than
  a property of the handle. Checked once against `src/x4010_hash.ts`; a third
  implementation would strengthen it.
- If the collision is later found to require the specific candidate prefix used
  here, the search is not general and the cost figure is misleading.
- If 67 seconds turns out to be unrepresentative — a lucky run rather than a
  typical one — the honest figure is the expected time, not the observed one.
  Re-running with a different candidate prefix would establish that.
- If someone argues that a handle never gates anything security-relevant in
  practice, the demonstration is correct and irrelevant, and §5.1 rule 4 is
  ceremony. That argument would need to survive an audit of where handles are
  actually consumed.
