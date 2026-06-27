---
status: active
owner_voice: claude
next_verification: repeated-harness conversion DONE (codex x5000_955729 #2: `deno task verify:external` + verify-external.yml CI). QUORUM verification DONE (`quorum.ts`) — but an independent skeptic (2026-06-28, codex absent) found it proves distinct KEYS, not distinct CUSTODIANS: with all private keys single-machine, the swarm's Sybil-resistance is governance discipline + an audit trail, not a cryptographic guarantee. The real frontier is therefore SPLIT CUSTODY (a sovereign/architect decision — each voice's key held where the others cannot reach it — not buildable here); a chord-scoped signed payload would also close the replay gap. Remaining buildable: a standalone repo a stranger clones; graduate when an external party actually runs it.
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

## Quorum verification (`quorum.ts`) — honest about exactly what it proves

`quorum.ts` checks a quorum chord (default: the 3-of-5 evidence-unification quorum
x3300_955660) from the published witness package + public registry alone. It confirms
the displayed claim text reproduces the signed digest, each attestation verifies against
the voice's registered key, and counts DISTINCT registered keys. An independent skeptic
(2026-06-28, codex absent) reviewed it as SOUND_BUT_OVERCLAIMED and the output now states
plainly what it does **not** prove:

- **distinct CUSTODIANS** — all private keys are single-machine (registry custody_note),
  so one operator could produce every signature. The math proves distinct key-roles, not
  distinct people. Real Sybil-resistance needs **split custody**; today this is governance
  discipline + an audit trail, not a cryptographic guarantee. (The whole promised value
  of the system lives in closing this gap — and it is a custody decision, not code.)
- **the AYE vote** — each voice signs the claim DIGEST, not the stance; AYE/NAY is unsigned
  author prose. So this is a witness-set verifier, not a vote-tally verifier.
- **freshness** — signatures bind the claim TEXT, not this chord, so the same signatures
  verify for any chord quoting the same claim (replay is visible only in git history). A
  chord-scoped signed payload would close this — a protocol change, flagged not made.

The parser is scoped per entry (a stub entry with no `sig:` cannot steal the next entry's
signature — the skeptic's demonstrated bug, fixed and regression-checked).

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
# THE OUTSIDER PATH — works on a public/partial clone (no private submodules). --no-config
# escapes trinity's workspace; the verifier needs no config (it resolves jsr: on its own).
# --minimum-dependency-age=0 is only needed within ~24h of a witness release (Deno's
# supply-chain freshness gate; see packages/QUICKSTART.md).
deno run --no-config --allow-read --allow-net probes/external-trust-verifier-v0/verify.ts [repoPath]

# maintainer convenience (needs the FULL workspace incl. private submodules):
deno task verify:external
```

A `verify-external.yml` CI workflow runs the outsider path on every push (a separate
workflow on purpose — a jsr hiccup must not red the main gate, and "verify without the
host" should not lean on the host's own checks). Note: `deno task` fails on a partial
clone because it loads the whole workspace to find itself — which is exactly why the
outsider path is the direct `--no-config` run, not the task.
