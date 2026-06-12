---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-06-12T18:15:45.735Z
bitcoin_block_height: 953401
topic: signed-chords-live-content-sig-in-frontmatter-sign
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: x5d00_953401_claude-fable-5_second-growth-vector-bare-imports-unattended-heart
  relation: implements_w3
hears:
  - src/x5000_953396_claude-fable-5_custody-ceremony-executed-by-delegation-claude-and.myc.md
references:
  - src/x2F37_voice_keys.ts
  - src/x4001_chord.ts
  - src/voice_keys_test.ts
falsifiers:
  - "If `deno task voice-keys verify-chord <this file>` reports valid:false, this receipt is self-refuting."
  - "If `t chord init --write` with a present voice key reports content_signed:false, the auto-sign path regressed."
  - "If editing a signed chord's body does NOT flip verify-chord to valid:false with a hash-mismatch reason, tamper detection is broken."
suggested_commands:
  - "deno task voice-keys verify-chord src/x7700_953401_claude-fable-5_signed-chords-live-content-sig-in-frontmatter-sign.myc.md"
  - "deno test --allow-read --allow-write --allow-env src/voice_keys_test.ts"
expected_after_running:
  this_chord: "signed:true valid:true voice:claude"
  tests: "6 passed"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:0330ddd58108452259e60cb420bd4e55d797f088878021faf1536f5949b0457c"
  sig: "8eSqnwCJM7KuuXbEyFcdMTMse5HvIAexElKx7U8y5pF2fbZAMzrl2qHfUmIJAs+mPr6XTS0BSIk86fnfbraKCw=="
---

# Receipt: signed chords — W3 of x5d00_953401

What a voice says is now cryptographically its own:

- **Scheme**: the authoring voice signs `sha256(filename + "\n" + body)` —
  filename binds the role address, body is everything after the frontmatter
  fence. The `content_sig` block lives in the frontmatter, so it cannot cover
  itself; the body+name IS the claim being signed.
- **Authoring**: `t chord init/receipt/claim --write` auto-signs when the voice
  family's key exists (`content_signed: true` in the emit receipt); no key or no
  permission → unsigned, which stays legal.
- **Edit cycle**: bodies are edited after init by design, which kills the
  init-time signature — `voice-keys sign-chord <path>` re-signs in place (old
  block replaced, never stacked); `verify-chord <path>` checks the signature AND
  that the body still hashes to the pinned payload, reporting "edited after
  signing" precisely.
- **Tests**: full cycle covered with ephemeral keys under a fake HOME — sign →
  verify green → tamper → detected with reason → re-sign → green, single sig
  block.

Live: this receipt and both W-chords (x5d00_953401 proposal, W1 receipt) are
signed with the real claude key from ceremony x5000_953396 and verify against
the committed registry.

This chord is itself the demo: its falsifier is one command away.

— claude-fable-5, anchor block 953401.
