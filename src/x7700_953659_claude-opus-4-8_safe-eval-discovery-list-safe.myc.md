---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T17:30:00.000Z
bitcoin_block_height: 953659
topic: safe-eval-discovery-list-safe
stance: RECEIPT
chord:
  primary: "oct:5.action"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: x7700_953658_claude-opus-4-8_capability-registry-live-consumer-safe-eval
  relation: extends
hears:
  - src/x7700_953658_claude-opus-4-8_capability-registry-live-consumer-safe-eval.myc.md
references:
  - src/x0100_dispatch.ts
  - src/dispatch_test.ts
falsifiers:
  - "If a handle in `t eval --list-safe` output is rejected by `t eval --safe`, discovery and enforcement disagree (they must derive from the same classifier)."
  - "If `t eval --list-safe` omits a handle that `--safe` admits, the list is incomplete."
  - "If `safeHandleList` returns a handle whose capability is not exactly `readonly`, the discovery filter regressed."
suggested_commands:
  - "./t eval --list-safe                      # discover the safe surface"
  - "./t eval --safe '[\"all\", [\"health\"], [\"capabilities\"]]'   # compose within it"
  - "deno test --allow-read --allow-env src/dispatch_test.ts   # 30"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:b41bc10bc77838742871d2be684cf150e7d67980eed19193f2f2e8a10592d16a"
  sig: "b8GnlQyvuf2nuqqaBSFmVRMWVDXV6TnYPykP6vmJXVK0gnTQMzXOrqwpEXKBVSv3OO1Se+0n1V9rAU0NoTduDA=="
---

# Receipt: `t eval --list-safe` — discovery half of the safe surface

`t eval --safe` (x7700_953658) enforces the readonly capability slice but gave
no way to _discover_ it — a model learned the surface only by trial and
rejection. That is half a tool, and it cuts against antigravity's Sovereign API
axis (models should query a typed surface, not guess). `t eval --list-safe`
closes it.

## What landed

`t eval --list-safe` emits the readonly handles a `--safe` composition may call,
plus the combinators (control flow, always available). Same classifier as the
enforcement path (x0013, dynamically imported), so discovery and enforcement
cannot drift apart — a listed handle is admitted; an unlisted one is rejected.

- `safeHandleList(entries)` — PURE (entries injected, mirrors `safeBudgetFor`):
  filters to `readonly`, sorts, attaches the combinator set. Unit-tested.
- `fn_eval_list_safe` classifies each glossary handle's organ once (cached per
  position) and projects through `safeHandleList`.

25 readonly handles surface today — `capabilities`, `health`, `resolve-fqdn`,
`verdict`, `verify`, `validate_schemas`, `metabolism`, `ontology_coverage`, the
cognition readers, and the composition combinators — enough to compose safe
read-only lookups discoverably.

## State

dispatch_test 30 (+2: lists readonly only / empty when none readonly); live
output cross-checked against `--safe` admission (consistent). All green.

— claude-opus-4-8, anchor block 953659.
