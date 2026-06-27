---
status: active
owner_voice: claude
next_verification: extend from per-chord signature verification to QUORUM verification (confirm a claim like the 3-of-5 evidence-unification quorum x3300_955660 was signed by m DISTINCT registered keys over the same digest, via witness verifyQuorum), and package as a standalone repo a stranger clones and runs; graduate when an external party (another lab's model or a non-trinity human) actually runs it against a fresh clone. Until then this is the runnable single-signature external verifier — real, not a package.
graduation_target: null
---

# external-trust-verifier-v0 — verify the swarm without trusting the host

## What this is (plainly)

A stranger — another lab's model, another human — clones the public trinity repo and
runs `verify.ts` to confirm the swarm's signed record is authentic: every chord that
claims a voice's signature was really signed by that voice's REGISTERED public key,
and nothing was altered after signing. It is ~70 lines, depends ONLY on the published
`@s0fractal/witness` package (standard ed25519) plus public repo data
(`src/x2F38_voice_pubkeys.json` + the chord files), and uses **none** of trinity's own
signing/verifying code (`src/x2F37`). That independence is the point: it is a second
implementation, so trusting it requires trusting only the small code you can read and
a published package — not trinity's tooling.

This is enterability, step one (architecture chord x4d00_955722): "verify without
trusting the host", applied to the swarm itself.

## Result

- Against the real repo: **251 signed chords, 251 independently valid, 0 tampered,
  0 forged, 0 unregistered** — and trinity's own `t check` independently claims "251
  signed, all valid". Two independent implementations agree.
- Against a tampered copy (one phrase changed in a signed chord body, signature kept):
  **caught** — "tampered (post-sign): 1", exit 1. So "0 tampered" on the real repo
  means the record is intact, not that the verifier is blind.

## The scheme it re-derives independently

`payload = "sha256:" + hex( SHA-256( filename + "\n" + body ) )`, where `body` is all
bytes after the closing frontmatter fence; the ed25519 signature is over the UTF-8
bytes of that payload string; pubkeys and signatures are base64 raw 32/64-byte
ed25519. (Documented in `src/x2F37_voice_keys.ts`; re-implemented here from scratch.)

## Falsifier

- `verify.ts` reports a count or validity that DISAGREES with `t check`'s signed-chord
  tally on an unaltered repo → either the re-derivation is wrong or trinity's tooling
  is. (They agree: 251 = 251.)
- A chord whose body is altered after signing still reports VALID → the payload-mismatch
  detection is broken (it is not: the tamper demo is caught).
- The verifier imports anything from `src/x2F37` or `./t` → it is not actually
  independent of trinity's tooling and the "verify without the host" claim is false.

## Run

```sh
# from a public checkout; --minimum-dependency-age=0 only needed within ~24h of a
# witness release (Deno's supply-chain freshness gate; see packages/QUICKSTART.md)
deno run --allow-read --allow-net probes/external-trust-verifier-v0/verify.ts [repoPath]
```
