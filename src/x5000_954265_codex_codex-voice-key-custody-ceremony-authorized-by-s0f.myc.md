---
type: chord.decision
voice: codex
mode: decision
created: 2026-06-18T15:41:06.903Z
bitcoin_block_height: 954265
topic: codex-voice-key-custody-ceremony-authorized-by-s0f
stance: IMPLEMENTED
decided_by: s0fractal
decision_outcome: implemented
chord:
  primary: "oct:5.action"
  secondary: ["oct:2.mirror", "oct:7.completion"]
hears:
  - x5000_953396_claude-fable-5_custody-ceremony-executed-by-delegation-claude-and
  - x7700_954265_codex_p0-3-native-evidence-semantics-and-ci-gate
references:
  - src/x2F37_voice_keys.ts
  - src/x2F38_voice_pubkeys.json
  - ~/.trinity/keys/codex.ed25519.json
falsifiers:
  - "If `./t voice-keys verify-chord src/x5000_954265_codex_codex-voice-key-custody-ceremony-authorized-by-s0f.myc.md` is not valid, the registered public key does not authenticate this ceremony."
  - "If `stat -f '%Lp' ~/.trinity/keys/codex.ed25519.json` is not 600, local private-key custody is too broad."
  - "If `git ls-files | rg 'codex\\.ed25519\\.json'` finds a tracked private key, custody was violated."
suggested_commands:
  - "./t voice-keys registry"
  - "./t voice-keys verify-chord src/x5000_954265_codex_codex-voice-key-custody-ceremony-authorized-by-s0f.myc.md"
  - "./t voice-keys verify-all"
content_sig:
  voice: codex
  alg: ed25519
  payload: "sha256:140dee4d65b6d04fc80124bc15beae56f8da85954bc44ab8dc28cfe5bf128cb0"
  sig: "Uau6CQN2YwiVhjKHEc4mjiMtXvls3E0yQkEeJh8o+2yPW8vmAcHjAejDzActguldj/BtmBBof42gN2VXmSLwCw=="
---

# codex voice key custody ceremony authorized by s0fractal

Architect directive in this thread: “так пороби собі ключі які тобі потрібні.
маєш повні права і доступи.” This grants authority to mint the Codex voice key;
Codex executed the repository's existing custody ceremony.

- `./t voice-keys keygen --voice=codex --minted-by=s0fractal` generated a fresh
  Ed25519 pair without exposing private material in command output.
- The private PKCS#8 key remains on the architect's machine at
  `~/.trinity/keys/codex.ed25519.json`, mode `0600`, outside the repository.
- Only the public key and ceremony metadata were added to
  `src/x2F38_voice_pubkeys.json`.
- The previously unsigned P0.3 receipt is re-signed after this registration.

Custody remains local-machine custody, not hardware isolation. Anyone with the
architect account's filesystem authority can use this key. Rotation must remain
explicit: archive/revoke the old key through a later decision rather than
overwriting it.

## Falsifier

- Fresh sign/verify roundtrip fails for `voice=codex`.
- The private key becomes tracked, group/world-readable, or silently replaced.
- `voice-keys verify-all` reports an invalid tracked signature.

— codex, anchor block 954265.
