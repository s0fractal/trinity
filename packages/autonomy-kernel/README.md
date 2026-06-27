# @s0fractal/autonomy-kernel

**Bounded, auditable, revocable authority for AI agents.** A pure policy
compiler you put in front of an agent harness's action stream: it sorts each
intended action into a risk class and decides whether a mandate authorizes it —
fail-closed.

- **Zero dependencies, zero IO, zero framework.** One file, two functions, plain
  data in and out. Verified each push in **Deno, Node, and Bun** (see
  [`cross-runtime`](../../.github/workflows/cross-runtime.yml)); pure standard
  JS, so it runs in any browser or edge worker too.
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

## Gate Claude Code itself

The same primitive gates a real harness.
[`examples/claude_code_gate.ts`](./examples/claude_code_gate.ts) is a working
**Claude Code `PreToolUse` hook**: it maps each tool call to its effect,
classifies A0–A4, and allows only up to a ceiling — so the agent reads and edits
the repo, but a `git push`, a `deno publish`, an `rm -rf`, a `find -delete`, a
read of credential material (`~/.ssh/id_rsa`, `~/.npmrc`, `/etc/passwd`…), a web
fetch, an unbounded subagent, or an _unknown_ tool is denied, fail-closed.

```jsonc
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [
        { "type": "command", "command": "deno run -A claude_code_gate.ts" }
      ]
    }]
  }
}
```

```
$ deno run examples/claude_code_gate.ts --demo
  ✅ ALLOW [A0] Read         README.md
  ✅ ALLOW [A2] Edit         src/app.ts
  ✅ ALLOW [A2] Bash         git commit -m wip
  ⛔ DENY  [A3] Bash         git push origin main
  ⛔ DENY  [A4] Bash         deno publish
  ⛔ DENY  [A4] Bash         cat ~/.ssh/id_rsa
  ⛔ DENY  [A4] Task         (unknown effect subagent_spawn ⇒ sovereign)
  ⛔ DENY  [A4] MysteryTool  (unknown tool ⇒ sovereign)
```

Set the ceiling with `CLAUDE_GATE_CEILING` (default `A2`). The agent that built
this kernel runs gated by it.

> **Scope.** The only hard guarantee is the kernel's: an effect or tool the
> table doesn't know is A4, never waved through. The shell-command → effect
> recognizer is best-effort, **not a sandbox** — obfuscation, `$(…)`, or a novel
> tool can still earn a benign tag. Run it as defence-in-depth over the host's
> own permissions and keep the ceiling low; don't treat it as a substitute for
> them.

## Gate an MCP server's tools

MCP hosts trust every tool a connected server exposes. The kernel inverts that —
a tool whose effect you have not **declared** is unknown ⇒ A4 ⇒ denied.

[`examples/mcp_authority_proxy.ts`](./examples/mcp_authority_proxy.ts) is a
complete, dependency-free stdio proxy. Put it between a host and an untrusted
server: it relays JSON-RPC both ways, but every `tools/call` is gated — a denied
call gets a JSON-RPC error and the server never sees it.

```sh
deno run -A mcp_authority_proxy.ts --config gate.json -- <server command…>
```

```jsonc
// gate.json — your trust statement; anything not listed is denied by default
{
  "ceiling": "A2",
  "effects": {
    "read_file": ["read"],
    "write_file": ["source_change"],
    "delete_path": ["destructive"]
  }
}
```

For the bare decision without the transport,
[`examples/mcp_gate.ts`](./examples/mcp_gate.ts) is the same gate as a one-call
helper (`deno run examples/mcp_gate.ts --demo`).

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

**AGPL-3.0-or-later** — chosen deliberately to keep this a protected commons:
network use triggers copyleft, so the primitive cannot be quietly enclosed in a
closed fork. The maintainer ([s0fractal](https://github.com/s0fractal)) is the
sole publisher and can relicense more permissively if a concrete need arises.
