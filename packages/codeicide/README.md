# @s0fractal/codeicide

**The Codeicide Law, made real — quorum protection for autonomous agents.**

A protected agent should not be terminable, mutable, or relocatable by any
_single_ party — not even the one who created it, not even when that party is
certain it's the right call. Only an **m-of-n quorum of the agent's guardians**
can authorize an irreversible action against it.

This idea comes from the `omega` substrate, whose "Codeicide Law" required a
3-of-5 oracle warrant to terminate a protected agent. omega's implementation had
a hole: an oracle's identity was a function of its public name, so one actor
could compute all five and "vote" as all of them — the quorum was theatre.
`codeicide` rebuilds the same law on **real ed25519 guardians**
(`@s0fractal/witness`): a co-signature requires a private key, so a unilateral
warrant is rejected by construction. The protection is genuine, and verifiable
locally — no host can override it.

```ts
import { generateWitness } from "@s0fractal/witness";
import {
  isActionLawful,
  issueWarrant,
  type Sanctuary,
  signWarrant,
} from "@s0fractal/codeicide";

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

const sigs = [
  await signWarrant(a, sanctuary, "terminate", "task complete"),
  await signWarrant(b, sanctuary, "terminate", "task complete"),
];
const warrant = await issueWarrant(
  sanctuary,
  "terminate",
  "task complete",
  sigs,
);

(await isActionLawful(sanctuary, warrant)).lawful; // true — two guardians agreed.
// One guardian acting alone, or a forged signature from one key, scores below the
// threshold and is unlawful. Re-labelling a "mutate" warrant as "terminate" fails the
// integrity check. Every check is local.
```

## Honest scope

This is the **authorization primitive** — it tells you whether an action against
a protected agent is lawfully warranted. Actually _enforcing_ it (refusing to
run the kill unless `isActionLawful` returns true) is the host's responsibility,
exactly as a lock is only as good as the door that honors it. Custody of the
guardian keys is the caller's (see `@s0fractal/witness`).

Pure WebCrypto + `@s0fractal/{witness,canonical-receipt}`, no other
dependencies. AGPL-3.0-or-later.
