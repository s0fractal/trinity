# @s0fractal/autonomy-kernel

**Bounded, auditable, revocable authority for AI agents.** A pure policy
compiler you put in front of an agent harness's action stream: it sorts each
intended action into a risk class and decides whether a mandate authorizes it —
fail-closed.

- **Zero dependencies, zero IO, zero framework.** One file, two functions, plain
  data in and out. Works in Deno, Node, Bun, the browser, an edge worker.
- **Fail-closed by construction.** An effect the kernel has never heard of is
  _sovereign_ (A4), never "probably fine". A4 is never auto-admitted. Evidence
  must be content-bound to the exact verb + target.
- **Auditable & revocable.** Every decision returns a reason code; authority
  lives in a mandate you can expire or narrow at any block height.

## Install

```ts
import { admit, classifyIntent } from "jsr:@s0fractal/autonomy-kernel";
```

## 30-second tour

```ts
import { classifyIntent } from "jsr:@s0fractal/autonomy-kernel";

classifyIntent({ verb: "fs.read", target: "app.ts", effects: ["read"] }).cls; // "A0"
classifyIntent({
  verb: "fs.write",
  target: "app.ts",
  effects: ["source_change"],
}).cls; // "A2"
classifyIntent({ verb: "deploy", target: "prod", effects: ["deploy"] }).cls; // "A4"
classifyIntent({ verb: "plugin", target: "x", effects: ["wormhole"] }).cls; // "A4" ← unknown ⇒ fail-closed
```

The class is set by the **most-privileged** effect. The ladder:

| Class  | Meaning                                                              | Example effects                                                  |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **A0** | observe & derive (read-only)                                         | `read`, `observe`, `derive`                                      |
| **A1** | reversible local maintenance                                         | `format`, `cache_refresh`, `fixture`                             |
| **A2** | bounded repository evolution                                         | `source_change`, `test`, `branch_commit`                         |
| **A3** | external adapter, no custody/spend                                   | `fetch_public`, `ci_dispatch`, `branch_push`                     |
| **A4** | **sovereign** — custody, spend, deploy, irreversible, **or unknown** | `key`, `spend`, `deploy`, `destructive`, _anything unrecognized_ |

## Gate an agent

`admit` is deny-by-default. You grant a narrow slice via a **mandate** (action
profiles scoped by class, verb, target, effect ceiling, destination, expiry):

```ts
import { admit } from "jsr:@s0fractal/autonomy-kernel";

const verdict = admit(intent, mandate, anchor, context);
verdict.admitted; // boolean
verdict.reason_code; // "admitted" | "sovereign_action_required" | "no_matching_profile" | …
```

A full runnable walkthrough — a read-only mandate that admits an A0 read and
denies a write, a deploy, a spend, and an unknown effect — is in
[`examples/gate_agent.ts`](./examples/gate_agent.ts):

```sh
deno run examples/gate_agent.ts
```

## Why this exists

Bounded, auditable, revocable authority is the unsolved problem under every
agent harness: how do you let an autonomous model _act_ without letting it act
_beyond what it was granted_? This is one answer, extracted as a clean
primitive: classify by effect, admit against a revocable mandate, and **fail
closed** so the worst case of an unknown action is "ask a human", not "ship it".

## Provenance & trust

Extracted **verbatim** from the [trinity](https://github.com/s0fractal/trinity)
substrate's autonomy kernel (organ `x5C20`), whose in-repo transplant test
proves this core carries no host-ontology imports. A parity test in this package
(`parity_test.ts`) verifies the copy stays byte-for-byte faithful to the
original. The decision logic you run here is the same one the substrate runs on
itself.

## License

Inherits the substrate's license; the maintainer
([s0fractal](https://github.com/s0fractal)) sets the final terms and is the sole
publisher.
