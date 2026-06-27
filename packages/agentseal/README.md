# @s0fractal/agentseal

**Bound, audit, and witness an agent's actions — cross-vendor, no trusted
host.**

As agents act with real consequences, two questions get sharp: _what was this
agent allowed to do_, and _what did it actually do_ — provable to someone who
doesn't share your identity provider. `agentseal` answers both by composing
three small real primitives:

- **classify** (`@s0fractal/autonomy-kernel`) — sort an action into A0..A4 by
  blast radius; fail-closed, so an unknown effect or a sovereign one (spend,
  deploy, `destructive`) is **never auto-allowed**.
- **address** (`@s0fractal/canonical-receipt`) — encode the bounded action to
  deterministic canonical bytes, giving one content id every party recomputes.
- **witness** (`@s0fractal/witness`) — collect m-of-n ed25519 co-signatures, so
  the authorization is **Sybil-resistant** and **verifiable locally** by anyone.

```ts
import { generateWitness } from "@s0fractal/witness";
import { seal, verifySeal } from "@s0fractal/agentseal";

const [alice, bob] = await Promise.all([generateWitness(), generateWitness()]);
const seats = [alice.publicKey, bob.publicKey];

const sealed = await seal(
  { verb: "fs.write", target: "notes.md", effects: ["source_change"] },
  [alice, bob],
  { at: 955600 },
);
// sealed.cls === "A2", sealed.allowed === true, two co-signatures attached.

const v = await verifySeal(sealed, seats, /* threshold */ 2);
// v.receiptIntact && v.ok — the action was bounded and a real quorum witnessed it,
// checked with no server in the loop. A `destructive` action would seal as A4 with
// allowed:false and zero authorizing witnesses.
```

## Why this is the wedge

The receipt is **locally verifiable across vendors**: agent A (vendor 1) hands
work to agent B (vendor 2), and B — or a human, or an auditor — verifies what A
did and was authorized to do without any shared identity provider, transparency
log, or trusted host. That cross-vendor, multi-hop, no-shared-root seam is
exactly where centralized identity providers and single logs structurally cannot
serve.

## Honest scope

- This MVP uses `classifyIntent` (the lightweight blast-radius classifier), not
  the full mandate-gated `admit` — that fuller authority path is a clean next
  step.
- It depends on the three packages above, resolved as **published `jsr:`
  specifiers** (see this package's import map). All three are live on jsr, so
  the composition installs and runs from the registry — not only in-repo.
- Custody of the witness keys is the caller's, always (see
  `@s0fractal/witness`).

Pure WebCrypto + the three primitives, zero other dependencies.
AGPL-3.0-or-later.
