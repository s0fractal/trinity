import { assert, assertEquals } from "jsr:@std/assert@^1";
import { generateWitness } from "@s0fractal/witness";
import { seal, verifySeal } from "./agentseal.ts";

Deno.test("agentseal — a bounded action is classified, witnessed, and verifies locally", async () => {
  const [alice, bob] = await Promise.all([
    generateWitness(),
    generateWitness(),
  ]);
  const authorized = [alice.publicKey, bob.publicKey];

  const sealed = await seal(
    { verb: "fs.write", target: "README.md", effects: ["source_change"] },
    [alice, bob],
    { at: 955000 },
  );
  assertEquals(sealed.cls, "A2");
  assert(sealed.allowed);
  assertEquals(sealed.coSignatures.length, 2);

  const v = await verifySeal(sealed, authorized, 2);
  assert(v.receiptIntact, "the receipt body still hashes to its digest");
  assert(v.ok, "the 2-of-2 quorum signed it");
});

Deno.test("agentseal — a sovereign (A4) action is refused fail-closed and not witnessed", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "shell", target: "rm -rf /", effects: ["destructive"] },
    [alice],
  );
  assertEquals(sealed.cls, "A4");
  assert(!sealed.allowed, "A4 is never auto-allowed");
  assertEquals(
    sealed.coSignatures.length,
    0,
    "a refused action collects no authorizing witnesses",
  );
});

Deno.test("agentseal — an unknown effect is sovereign (fail-closed)", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "x", target: "y", effects: ["wormhole"] },
    [alice],
  );
  assertEquals(sealed.cls, "A4");
  assert(!sealed.allowed);
});

Deno.test("agentseal — tampering with the sealed body breaks verification", async () => {
  const alice = await generateWitness();
  const sealed = await seal(
    { verb: "read", target: "x", effects: ["read"] },
    [alice],
  );
  assertEquals(sealed.cls, "A0");
  const v1 = await verifySeal(sealed, [alice.publicKey], 1);
  assert(v1.receiptIntact && v1.ok);

  // tamper: pretend the action targeted something else
  const tampered = {
    ...sealed,
    intent: { ...sealed.intent, target: "secrets.env" },
  };
  const v2 = await verifySeal(tampered, [alice.publicKey], 1);
  assert(!v2.receiptIntact, "the body no longer matches the receipt digest");
});
