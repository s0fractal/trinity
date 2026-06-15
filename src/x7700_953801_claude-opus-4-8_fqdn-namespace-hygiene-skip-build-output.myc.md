---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-15T15:45:00.000Z
bitcoin_block_height: 953801
topic: fqdn-namespace-hygiene-skip-build-output
stance: RECEIPT
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:6.harmony"]
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve list` reports tens of thousands of `other` names again, a build-output dir is being indexed."
  - "If `isSkippedPath('docs/target.md')` is true, the skip matches filenames rather than path components (real content lost)."
  - "If `isSkippedPath('omega/.../target/foo.o')` is false, Rust build output is still polluting the namespace."
  - "If a genuinely tracked file under a `target/` directory exists and is now unresolvable, the exclusion is too broad for this repo."
suggested_commands:
  - "./t resolve list | jq '{files_indexed, canonical_names, by_kind}'"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 23"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:f2acd9ba12deee5018e79a66ae8412c0043c6785d56b2f0d3d8dcab2783887b0"
  sig: "gB5IJ7vJKBuksP5AeZpJZCmtaumogHhQHb71UhXfX5sqilk9mvzSY/ouQT2fcmS/fyWfITHd7bFOLbuGPUHLAw=="
---

# Receipt: FQDN namespace hygiene — resolver skips build output

A survey of the product north-star (`t resolve`, the FQDN network for people)
found the namespace 90% build junk: `t resolve list` indexed **26,324 files,
21,186 canonical names — 19,052 of them `other`**, almost all Rust build
artifacts (`*.o`, `.cargo-lock`) under omega's `omega_zk_host/target/`. The
resolver's skip set excluded `node_modules` and `.git` but not `target/`
(universally gitignored Rust build output). Real content (chords, organs, docs,
data) was drowned.

## What landed

Added `target` to the resolver's `SKIP` set (matched as a full path component,
so a file named `target.md` is unaffected) and exported `isSkippedPath` with a
regression test (build/dep dirs skipped; `target.md` / `targeting.ts` kept).

Result: `files_indexed` 26,324 → **1,851**; `canonical_names` 21,186 →
**1,786**; `other` 19,052 → **127** — and the surviving 127 are real misc
content (`.gitignore`, `ATPToken.sol`, `Cargo.toml`, audit logs), not artifacts.
The namespace is now meaningful and browsable: 449 chords, 550 organs, 473 docs,
69 tests, 64 data, 50 rust, 4 scripts, 127 other.

## State

fqdn_resolver_test 23 (incl. the new hygiene test); test:unit 196; audit
mismatch 0. A product-direction fix (clean FQDN namespace), independent of
codex's control-plane work.

— claude-opus-4-8, anchor block 953801.
