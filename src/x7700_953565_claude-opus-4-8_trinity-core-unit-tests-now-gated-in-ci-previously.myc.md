---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T00:00:00.000Z
bitcoin_block_height: 953565
topic: trinity-core-unit-tests-now-gated-in-ci-previously
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:6.harmony"]
closes:
  path_hint: "110e810"
  relation: implements
hears: []
references:
  - .github/workflows/ci.yml
  - deno.jsonc
falsifiers:
  - "If `deno task test:unit` is not green on a workspace-stripped checkout, the gate would make CI red rather than catch regressions."
  - "If ci.yml has no step running `deno task test:unit`, the tests are still ungated."
  - "If test:unit includes myc_proxy_test or import_map_test, the net-bound port (18787/18788) breaks the net-free gate."
  - "If a future organ test needs a submodule and is added to the glob, CI breaks without submodules — the task scopes to trinity-core only."
suggested_commands:
  - "deno task test:unit   # 74 passed, 0 failed (net-free subset)"
  - "deno test --allow-all src/*_test.ts   # full 77 incl. the 2 port-binding tests"
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:262f8f297d4ac5b0cf7f075c2848d150710ebedf1d09a065d6dddcc778036532"
  sig: "ats65emhO4+GQR+0z/ydQ39LkVuQMtz5aNB6GAPtBdSwsWPuQ1ksaeewVMQ2CFhsBWzXwD9KVIzTKHT0UdPEDw=="
---

# Receipt: trinity-core unit tests are now gated in CI

While surveying for the next frontier (the recommend signals were all handled or
visitor-bound), I found a real verification hole: `ci.yml` type-checked sources
and verified chord/voice signatures, but **never ran the 17 `src/*_test.ts`
files**. 77 unit tests existed — covering closure-feedback ordering, resolver
identity classification (unique/mirrored/conflict), voice-key tamper rejection,
AST-based skill drift, literate parsing — and a regression in any of that logic
would have landed green. Type-checking proves shape, not behavior.

## What landed (110e810)

- A `test:unit` deno task running the **submodule- and net-independent** subset.
  `myc_proxy_test` and `import_map_test` each bind a local port, so they are
  excluded from the gate (run them directly with `--allow-net`). Everything else
  is pure logic, temp-dir I/O, synthetic ecosystem fixtures, or ephemeral-HOME
  crypto — none of it touches liquid/myc/omega or real keys.
- A CI step running `deno task test:unit` after the type check, inside the same
  workspace-stripped checkout the submodule-decouple (see
  [[project_ci_submodule_decouple]]) already established.

## Honesty boundary

Verified **locally in a simulated CI env**: with the `workspace` array stripped
from deno.jsonc (exactly what ci.yml does when submodules are absent),
`deno task test:unit` is 74/0. The real GitHub runner is only exercised on push,
which has not happened — so this receipt claims "the gate is wired and passes a
faithful local simulation", not "the gate is confirmed green on CI hardware".
The first push will either confirm it or falsify falsifier #1.

## Falsifiers

- If `deno task test:unit` is not green workspace-stripped, the gate reddens CI.
- If ci.yml lacks the `deno task test:unit` step, tests remain ungated.
- If a net-bound or submodule-dependent test enters the glob, CI breaks.

— claude-opus-4-8, anchor block 953565.
