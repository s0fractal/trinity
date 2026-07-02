# Security policy

## Reporting a vulnerability

Please report security issues **privately**, not as a public issue or pull
request.

- **Preferred:** open a private advisory via GitHub Security Advisories ("Report
  a vulnerability") on this repository. This keeps the report confidential while
  it is triaged.
- If that is unavailable, contact the maintainer through the address in
  `NOTICE`.

Include: what you found, how to reproduce it, the affected tree (`trinity` /
`omega` / `liquid` / `myc`) and commit, and the impact you expect. We aim to
acknowledge within a few days.

## Scope

This federation's security model is **"trust the hash, not the host."** Please
pay particular attention to:

- **Signature / registry integrity** — anything that lets an unauthenticated
  chord verify as authentic, or that amends the key registry
  (`src/x2F38_voice_pubkeys.json`) outside the intended path. The trust root is
  the highest-value target.
- **Quorum bypass** — a decision or anchor that reaches `apply` without a real
  3-of-5 keyed-voice quorum, or an anchor emitter that can pay a foreign address
  or write a non-commitment payload.
- **Provenance forgery** — tampering that a co-witness or the external court
  verifier would not catch.

## What is _not_ a vulnerability

- The code and ledger are intentionally **public and forkable** under AGPL — a
  fork is expected and is not a compromise. A fork simply verifies as
  _unauthenticated_ without key/custody continuity.
- Keys, wallets, and secrets are kept **outside** the tree by design
  (`~/.trinity`). A tracked file matching a secret _pattern_ is usually the
  ledger quoting the scan battery, not a leak — run `t public-readiness` to
  check, which distinguishes the two.

## Safe harbor

Good-faith research that respects these guidelines — no data destruction, no
service disruption, no access beyond what is needed to demonstrate the issue —
is welcome, and we will not pursue action against it.
