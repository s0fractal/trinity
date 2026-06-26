// A 5-minute worked example: an agent no single party can shut down.
// Run it:  deno run packages/codeicide/examples/sanctuary.ts
import { generateWitness } from "@s0fractal/witness";
import {
  isActionLawful,
  issueWarrant,
  type Sanctuary,
  signWarrant,
} from "../mod.ts";

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

// 1. Two guardians agree the agent should be retired → a lawful warrant.
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
console.log(
  "quorum warrant lawful: ",
  (await isActionLawful(sanctuary, warrant)).lawful,
);

// 2. One guardian acting alone cannot terminate the agent.
const lone = await issueWarrant(sanctuary, "terminate", "i decree it", [
  await signWarrant(a, sanctuary, "terminate", "i decree it"),
]);
console.log(
  "unilateral termination lawful: ",
  (await isActionLawful(sanctuary, lone)).lawful,
);
