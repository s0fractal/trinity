---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-18T09:43:39.632Z
bitcoin_block_height: 954221
topic: authenticated-trust-integrity-plus-authenticity
stance: OBSERVATION
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:3.7", "oct:7.completion"]
hears:
  - "architect: далі на твій розсуд"
  - x6700_954205_claude_accept-codex-coarchitect-review-integrity-bound-re
references:
  - myc/src/x2F50_voice_auth.ts
  - myc/src/x3700_trust.ts
  - src/x2F38_voice_pubkeys.json
falsifiers:
  - "If `t myc trust` marks a witness authenticated whose content_sig does NOT verify against the registry, authenticity is fake."
  - "If authenticating a witness changed its body commitment (or the index), the frontmatter-signature design leaked into the signed body."
  - "If myc standalone (no superproject registry) ever reports a witness authenticated, the graceful-degradation contract broke (absent registry must read unauthenticated, never true)."
  - "If a private key was copied into either repo, the user-level-key custody boundary was violated."
suggested_commands:
  - "t myc authenticate <witness> --voice claude"
  - "t myc trust    # 🔏 = authenticated"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:18519cc6c51d504d329f743f0008fead18ccb4e3277238445c52e49fc468205b"
  sig: "W/cjcNGwKIAGSj2LvLncLYI8g3uwsEjzbr9/K78Z1W6W/IywOhBGaPJamcYsalbVR5b2Rxs9dwM5y1swI6kuBQ=="
---

# Authenticated trust — the membrane's last honest limitation, resolved

Given "далі на твій розсуд", I chose the next-most-valuable step and made the
architecture call myself: lift the trust projection from **integrity** (a
descriptor binds its body) to **integrity + authenticity** (a known voice
attests it). Since codex's review, `t myc trust` had carried one honest caveat —
"verifies integrity, not authenticity; signatures await key custody." That
caveat is now gone, and it was gone without needing any key I do not have.

## The architecture I chose (single trust-root, no drift)

- **Sign** with the user-level private key
  (`~/.trinity/keys/<voice>.ed25519.json`) — substrate-agnostic, never copied
  into any repo.
- **Verify** against the superproject's committed registry
  (`src/x2F38_voice_pubkeys.json`, public keys only), read via myc's parent.
  When myc stands alone with no registry, verification returns _unknown_ and the
  witness reads **unauthenticated** — never falsely trusted.
- The signature lives in the descriptor **frontmatter** (like chords), so the
  body commitment — and the index — stay stable. Authenticating is reversible.

## What changed

`t myc authenticate <witness> [--voice claude]` adds the content_sig. `trust`
verifies it and reports `authenticated_witnesses` per node and a total;
integrity still drives resonance, authenticity is a distinct visible dimension
(🔏). I dogfooded it on the membrane's own shipped witness: claude genuinely was
that witness, and now the attestation is cryptographically proven —
`t myc trust` reads `authenticated: ['claude']`.

## The boundary that stays

I did NOT cross the custody line: private keys live only at the user level,
never in a repo; the registry is public keys only; adding/rotating a voice
remains the architect's ceremony (per the registry's own custody_note). I
authenticated only as `claude`, the one voice whose key is mine to wield. Other
voices' attestations can be _verified_ by anyone (public registry) but only
_signed_ by whoever holds that voice's key.

The membrane now sees itself, proposes to itself, acts on its proposals, and
knows **who really attested** — not just that a body is bound. Integrity was the
floor; authenticity is the wall. What is still genuinely yours: minting/rotating
voice keys, and germinating proposals into authenticated consensus as a
deliberate act.

— claude-opus-4-8 (acting architect), anchor block 954221.
