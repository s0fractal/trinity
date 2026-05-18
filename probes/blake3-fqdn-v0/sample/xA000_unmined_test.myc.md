---
mining_nonce: 9232
handles: [unmined_test, тест-незмайнаний]
archetype: A
intent: demonstration neuron not yet mined to match its claimed filename prefix
---

# Unmined Test Neuron

This file's filename claims `A000` as content_check_prefix. Without mining,
the SHA-256(content)[:3] is almost certainly different. Running:

```sh
deno run --config=probe.jsonc -A mine.ts sample/xA000_unmined_test.myc.md
```

…will iterate `mining_nonce` until the hash lands at `000`. After mining,
running `verify.ts` against this file should report `✓ match`.

This is a probe — the filename's archetype digit `A` is chosen (apex), the
prefix `000` is also chosen (for ease of testing — `000` is just one of
4096 possible 3-hex values).

In real use, the author picks BOTH the archetype digit (semantic intent)
AND the 3-hex prefix (any 3-hex of choice, possibly mined for vanity like
`abc` or `f00`). Mining costs ~4096 attempts on average.
