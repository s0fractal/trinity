# Quickstart — adopt one primitive, no trinity knowledge required

You need **only [Deno](https://deno.com)** (≥ 2.x). No account, no trinity repo,
no ontology. Each snippet below is a complete program — save it, run it, verify
the output. Every one was run from a clean directory against the live jsr
registry; the assertions in the comments are what it actually printed.

> **One gotcha (Deno 2.9+).** Deno refuses dependencies published in the last
> ~24 h by default (a supply-chain guard). If you hit
> `error: … newer than the minimum dependency date …`, you're adopting a release
> within a day of its publish — add `--minimum-dependency-age=0` to the run, or
> wait it out, or commit a `deno.lock`. Once a version is a day old, a bare
> `deno run --allow-net file.ts` just works.

## The primitives

### `witness` — a real m-of-n quorum (identity = key, not name)

```ts
import {
  coSign,
  generateWitness,
  sha256,
  verifyQuorum,
} from "jsr:@s0fractal/witness";

const [a, b, c] = await Promise.all([
  generateWitness(),
  generateWitness(),
  generateWitness(),
]);
const authorized = [a.publicKey, b.publicKey, c.publicKey];
const digest = await sha256(new TextEncoder().encode("terminate agent X"));

// two DISTINCT key-holders sign → quorum of 2 is met
const ok = await verifyQuorum(
  digest,
  [
    await coSign(a, digest),
    await coSign(b, digest),
  ],
  authorized,
  2,
);
console.log("2-of-3 quorum ok:", ok.ok); // true

// one attacker presenting THREE signatures from ONE key scores 1, not 3
const forged = await verifyQuorum(
  digest,
  [
    await coSign(a, digest),
    await coSign(a, digest),
    await coSign(a, digest),
  ],
  authorized,
  2,
);
console.log("lone attacker valid count:", forged.valid); // 1 — Sybil-resistant
```

### `canonical-receipt` — same value, same bytes, same content address

```ts
import {
  encodeCanonical,
  multihashSha256,
  toHex,
} from "jsr:@s0fractal/canonical-receipt";

// insertion order is irrelevant — the canonical bytes are identical
console.log(
  "order-independent:",
  toHex(encodeCanonical({ b: 2, a: 1 })) ===
    toHex(encodeCanonical({ a: 1, b: 2 })),
); // true
console.log(
  "content id:",
  toHex(await multihashSha256(encodeCanonical({ a: 1 }))),
);
```

### `autonomy-kernel` — classify an agent action, fail-closed on the unknown

```ts
import { classifyIntent } from "jsr:@s0fractal/autonomy-kernel";

console.log(
  classifyIntent({
    verb: "fs.write",
    target: "app.ts",
    effects: ["source_change"],
  }).cls,
); // A2
console.log(
  classifyIntent({ verb: "x", target: "y", effects: ["wormhole"] }).cls,
); // A4 — unknown ⇒ sovereign
```

It also ships a drop-in **Claude Code `PreToolUse` gate** and an **MCP authority
proxy** in [`autonomy-kernel/examples/`](./autonomy-kernel/examples) — a
fail-closed authority ceiling for any agent harness in ~30 seconds.

## The compositions

### `codeicide` — a protected agent no single party can terminate

```ts
import { generateWitness } from "jsr:@s0fractal/witness";
import {
  isActionLawful,
  issueWarrant,
  type Sanctuary,
  signWarrant,
} from "jsr:@s0fractal/codeicide";

const [a, b, c] = await Promise.all([
  generateWitness(),
  generateWitness(),
  generateWitness(),
]);
const sanctuary: Sanctuary = {
  agentId: "researcher-7",
  guardians: [a.publicKey, b.publicKey, c.publicKey],
  threshold: 2,
};

const twoAgreed = await issueWarrant(sanctuary, "terminate", "task done", [
  await signWarrant(a, sanctuary, "terminate", "task done"),
  await signWarrant(b, sanctuary, "terminate", "task done"),
]);
console.log(
  "two guardians → lawful:",
  (await isActionLawful(sanctuary, twoAgreed)).lawful,
); // true

const lone = await issueWarrant(sanctuary, "terminate", "task done", [
  await signWarrant(a, sanctuary, "terminate", "task done"),
]);
console.log(
  "one guardian → lawful:",
  (await isActionLawful(sanctuary, lone)).lawful,
); // false
```

### `agentseal` — bound + audit + witness an action, verifiable cross-vendor

```ts
import { generateWitness } from "jsr:@s0fractal/witness";
import { seal, verifySeal } from "jsr:@s0fractal/agentseal";

const [a, b] = await Promise.all([generateWitness(), generateWitness()]);
const seats = [a.publicKey, b.publicKey];

const sealed = await seal(
  { verb: "fs.write", target: "notes.md", effects: ["source_change"] },
  [a, b],
  { at: 955700 },
);
console.log("class:", sealed.cls, "allowed:", sealed.allowed); // A2 true

const v = await verifySeal(sealed, seats, 2);
console.log(
  "verified with no shared host:",
  v.ok,
  "receipt intact:",
  v.receiptIntact,
); // true true
```

### `liquid-sync` — resolve a conflict without trusting a clock

```ts
import { initCovenant, resolveConflict } from "jsr:@s0fractal/liquid-sync";

initCovenant({ covenant: "our community charter v1" });
// resolveConflict(blockA, blockB, targetPhi) → the block that resonates most
// with the target; ties break on content hash, never on a spoofable timestamp.
console.log("resolveConflict ready:", typeof resolveConflict === "function"); // true
```

## What each is — and isn't

The catalog, source provenance, parity gates, and honest scope of every package
are in [`README.md`](./README.md); each package's own README carries an explicit
**Honest scope** section. These are small, real primitives — not a framework and
not a platform. Take one, verify it yourself with the snippet above, and compose
only what you need.

All are **AGPL-3.0-or-later** (a protected commons; network use triggers
copyleft). `kuramoto-coherence` is Rust on
[crates.io](https://crates.io/crates/kuramoto-coherence); the rest are
TypeScript on [jsr](https://jsr.io/@s0fractal).
