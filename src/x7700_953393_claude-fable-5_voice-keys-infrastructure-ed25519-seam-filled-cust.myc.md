---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-06-12T16:47:46.458Z
bitcoin_block_height: 953393
topic: voice-keys-infrastructure-ed25519-seam-filled-cust
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: x2d00_953380_claude-fable-5_deep-repo-analysis-and-strategic-vision-bootstrap
  relation: implements_v2_infrastructure
hears:
  - src/x5000_953384_claude-fable-5_single-voice-phase-claude-primary-codex-gemini-gue.myc.md
references:
  - src/x2F37_voice_keys.ts
  - src/x2F38_voice_pubkeys.json
  - src/x2F36_fqdn_sovereignty.ts
  - src/voice_keys_test.ts
falsifiers:
  - "If `deno test --allow-read --allow-write --allow-env src/voice_keys_test.ts` fails, the crypto seam is broken."
  - "If adjudicate() returns assurance 'authenticated' for an attestation with sig present but sig_verified absent/false, the anti-forgery fix regressed."
  - "If src/x2F38_voice_pubkeys.json contains a non-empty keys object WITHOUT a corresponding architect decision chord, custody was violated."
  - "If a private key file is ever found inside the repo tree (git ls-files | grep -i 'ed25519'), custody was violated."
suggested_commands:
  - "deno test --allow-read --allow-write --allow-env src/voice_keys_test.ts"
  - "deno task voice-keys registry"
  - "deno task voice-keys -- keygen --voice=claude  # CUSTODY CEREMONY — architect only"
expected_after_running:
  tests: "14 passed (voice_keys + fqdn_sovereignty)"
  registry: "schema trinity.voice-pubkeys.v0.1, keys: {} until ceremony"
---

# Receipt: V2 infrastructure — the Ed25519 seam is filled

V2 of x2d00_953380 had two halves: the cryptographic machinery (a voice's AYE
must be verifiable, not just named) and the custody ceremony (who mints and
holds keys — architect's, by standing directive). This receipt closes the FIRST
half and reduces the second to one command.

## What landed

- **x2F37_voice_keys** (new organ, FQDN-sovereignty stack): Ed25519 via
  WebCrypto — `mintKeypair` / `signHash` / `verifySig`, plus
  `verifyAttestations` which checks every signed attestation against the
  committed registry: valid → `sig_verified: true`; unsigned → passes through
  unverified; forged or unregistered → DROPPED with a loud reason (a forged
  voice must not count even as an unauthenticated AYE).
- **x2F38_voice_pubkeys.json**: committed public-key registry, deliberately
  empty. Populating it is the custody ceremony.
- **x2F36 anti-forgery fix**: assurance previously upgraded on signature
  PRESENCE — `sig: "garbage"` would have read as "authenticated". Now only
  `sig_verified === true` (set exclusively by x2F37 after real verification)
  upgrades; one unverified AYE drags the verdict back to unauthenticated.
- **Custody model**: private keys at `~/.trinity/keys/<voice>.ed25519.json`
  (0600, outside the repo, keygen refuses to overwrite); public entry is printed
  for the architect to commit via a decision chord.
- 14 tests green, including: full quorum with real signatures reaches
  `authenticated`; forgery (kimi signing with codex's key) is dropped and the
  quorum falls to PENDING; ghost voices (unregistered keys) are dropped; keyless
  mode is intact.

## What remains (architect, one command per voice)

`deno task voice-keys -- keygen --voice=<N>` → commit the printed registry
entry + decision chord. After that, x7C00 auto-merge and the V4 external surface
can require `{ requireAuthenticated: true }` honestly.

Per the single-voice phase (x5000_953384): same-voice-separate-session receipt;
machine witnesses carry the weight.

— claude-fable-5, anchor block 953393.
