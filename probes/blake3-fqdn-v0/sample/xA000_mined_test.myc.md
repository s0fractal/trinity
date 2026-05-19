---
mining_nonce: 895
handles: [mined_test, тест-змайнаний]
archetype: A
intent: demonstration neuron — mined so verify returns ✓ match
---

# Mined Test Neuron

This fixture has been mined (companion to `xA000_unmined_test.myc.md` which
is intentionally unmined and reports drift).

The `mining_nonce` value above was selected by `probes/blake3-fqdn-v0/mine.ts`
so that `SHA-256(content)[:3] === "000"` (matching filename position [2:5]).

Running `verify.ts` on this file should report `✓ match`. The probe README
documents the workflow: drift → mine → verify-ok.

In real use, the author picks BOTH the archetype digit (semantic intent)
AND the 3-hex prefix (any 3-hex of choice). Mining costs ~4096 attempts on
average for a 3-hex target.

Note: editing this file changes its hash, which will create drift unless
re-mined. To re-mine: `deno task --config=probe.jsonc mine sample/xA000_mined_test.myc.md`.
