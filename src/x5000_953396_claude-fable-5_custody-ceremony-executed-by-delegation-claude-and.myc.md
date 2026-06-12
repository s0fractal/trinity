---
type: chord.decision
voice: claude-fable-5
mode: decision
created: 2026-06-12T17:08:14.421Z
bitcoin_block_height: 953396
topic: custody-ceremony-executed-by-delegation-claude-and
stance: DECISION
decided_by: s0fractal
decision_outcome: implemented
chord:
  primary: "oct:5.action"
  secondary: ["oct:2.mirror"]
hears:
  - src/x7700_953393_claude-fable-5_voice-keys-infrastructure-ed25519-seam-filled-cust.myc.md
  - src/x5000_953384_claude-fable-5_single-voice-phase-claude-primary-codex-gemini-gue.myc.md
references:
  - src/x2F38_voice_pubkeys.json
  - src/x2F37_voice_keys.ts
falsifiers:
  - "If `deno task voice-keys verify --voice=claude --hash=H --sig=S` fails for a signature freshly produced by `voice-keys sign --voice=claude --hash=H`, the claude key entry is corrupt."
  - "If the registry contains keys for voices other than {claude, s0fractal} without a later ceremony decision chord, custody was violated."
  - "If `git ls-files | grep ed25519 | grep -v x2F37 | grep -v voice_keys_test` matches a private-key file, custody was violated."
suggested_commands:
  - "deno task voice-keys registry"
  - "git log -1 --format=%H -- src/x2F38_voice_pubkeys.json"
---

# Decision: custody ceremony — claude + s0fractal keys minted by delegation

Architect directive (s0fractal, 2026-06-12, via remote session): "Роби усе
замість мене. Це непринципово хто в терміналі команду виконає." — terminal
EXECUTION is delegated; decision AUTHORITY remains the architect's. Under that
directive, claude-fable-5 ran the custody ceremony prepared in x7700_953393:

- `voice-keys keygen --voice=claude --minted-by=s0fractal`
- `voice-keys keygen --voice=s0fractal --minted-by=s0fractal`

Custody facts:

- Private keys live at `~/.trinity/keys/<voice>.ed25519.json` (mode 0600) on the
  ARCHITECT'S machine — physical custody is his, unchanged.
- Public keys are committed to `src/x2F38_voice_pubkeys.json` by this chord's
  commit; `minted_by: s0fractal` records authority, this chord records the
  delegated execution.
- Live verification performed: sign/verify roundtrip green for both voices;
  cross-voice signature correctly rejected.

Honest limits, stated plainly:

- Both private keys sit on one machine, and the delegate (claude) had filesystem
  access during minting. In the single-voice phase (x5000_953384) the
  two-distinct-voices property is organizational, not hardware-enforced. This
  matches the phase's documented assumptions; a hardware or per-device split is
  future work if guest voices return and external stakes rise.
- codex/gemini keys are deliberately NOT minted in absentia: a voice's key must
  be minted in that voice's presence; guests get a ceremony when they arrive.

Effect: x2F36 quorum attestations by claude and s0fractal can now reach
`assurance: authenticated`; V4 (one honest external surface, signed) is
unblocked.

— claude-fable-5, anchor block 953396, recording a delegated ceremony.
