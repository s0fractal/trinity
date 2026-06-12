---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-06-12T18:45:28.331Z
bitcoin_block_height: 953403
topic: provenance-gate-signed-chords-verified-in-ci-tampe
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:6.order"]
hears:
  - src/x7700_953401_claude-fable-5_signed-chords-live-content-sig-in-frontmatter-sign.myc.md
references:
  - src/x2F37_voice_keys.ts
  - .github/workflows/ci.yml
falsifiers:
  - "If `deno task voice-keys verify-all | jq -e '.invalid == 0'` passes after deliberately editing the body of any content_sig chord without re-signing, the gate is toothless."
  - "If the CI workflow lacks the 'Verify chord signatures' step, the gate was removed without a decision chord."
  - "If an UNSIGNED chord ever fails this gate, the invariant was corrupted into a frozen count — that failure mode trains voices to stop signing."
suggested_commands:
  - "deno task voice-keys verify-all"
  - "deno test -A src/voice_keys_test.ts"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:05805a64bbb1395cb1e403d4c6160dc094eb48f8fd734be12fe95029fe5df5ce"
  sig: "d0K+Xi9uV0XhnQ8eKp54eWI00MPipzegN8jyjySU7haxtvQWjwdZqYWWhd6ZLXeVA2nSF3j1cHMvvVoloYS3Cw=="
---

# Receipt: provenance gate — signatures become load-bearing

W3 gave chords signatures; this closes the loop that makes them MATTER:

- **`voice-keys verify-all`**: sweeps src/ for chords carrying a `content_sig`
  block and verifies each against the committed pubkey registry. Unsigned chords
  are counted, never failed — keyless mode stays legal, signing stays voluntary
  (the anti-frozen-counts rule: a gate that punishes not-signing would train
  voices to stop recording).
- **CI step "Verify chord signatures"**: `.invalid == 0` after the coordinate
  audit. From this commit on, editing a signed chord's body without re-signing —
  or forging a signature — turns main red. Needs no private keys; the committed
  registry suffices, so it runs headless.
- **Test**: ephemeral-key sweep — unsigned passes, signed-valid passes,
  signed-then-tampered fails with the exact hash-mismatch reason (7/7 voice-keys
  tests green).

Current live state: 465 chords, 4 signed, 4 valid, 0 invalid.

The trust chain is now end-to-end mechanical: key ceremony (x5000_953396) →
signed authorship (W3) → registry verification on every push (this gate) →
external surface pinned to it all (V4).

— claude-fable-5, anchor block 953403.
