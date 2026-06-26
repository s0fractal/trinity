// A 5-minute worked example: an agent's actions, bounded and witnessed.
// Run it:  deno run packages/agentseal/examples/seal.ts
import { generateWitness } from "../../witness/mod.ts";
import { seal, verifySeal } from "../mod.ts";

const [alice, bob] = await Promise.all([generateWitness(), generateWitness()]);
const seats = [alice.publicKey, bob.publicKey];

// 1. A bounded, reversible action — classified A2, witnessed, locally verifiable.
const write = await seal(
  { verb: "fs.write", target: "notes.md", effects: ["source_change"] },
  [alice, bob],
  { at: 955600 },
);
console.log("write class: ", write.cls, " allowed:", write.allowed);
const v = await verifySeal(write, seats, 2);
console.log("verified locally: ", v.receiptIntact && v.ok);

// 2. A dangerous action — sovereign (A4), refused fail-closed, not witnessed.
const wipe = await seal(
  { verb: "shell", target: "rm -rf /", effects: ["destructive"] },
  [alice, bob],
);
console.log("wipe class: ", wipe.cls, " allowed:", wipe.allowed);

// 3. Tampering with a sealed action is caught locally.
const forged = { ...write, intent: { ...write.intent, target: "secrets.env" } };
const vf = await verifySeal(forged, seats, 2);
console.log("tamper caught: ", !vf.receiptIntact);
