---
mining_nonce: 0
handles: [unmined_test, тест-незмайнаний]
archetype: A
intent: demonstration neuron NOT yet mined — verify should report drift
---

# Unmined Test Neuron

This fixture is intentionally NOT mined. Filename claims content_check_prefix
`000` (positions 2-4 of filename), but the content's SHA-256 prefix is almost
certainly different at `mining_nonce: 0`.

Workflow demonstration:

```sh
deno task --config=probe.jsonc verify sample/xA000_unmined_test.myc.md
# → ✗ drift: filename claims 000, content hashes to <something else>

deno task --config=probe.jsonc mine sample/xA000_unmined_test.myc.md
# → mined nonce X (will modify mining_nonce in this file)

deno task --config=probe.jsonc verify sample/xA000_unmined_test.myc.md
# → ✓ ok
```

If you run `mine` on this file, it gets mutated to a mined state. To
re-demonstrate drift detection, either reset `mining_nonce: 0` here OR verify
the companion `xA000_mined_test.myc.md` fixture (already mined, returns ✓
match).
