import { assert, assertEquals } from "jsr:@std/assert@^1";
import { generateWitness } from "@s0fractal/witness";
import {
  isActionLawful,
  issueWarrant,
  type Sanctuary,
  signWarrant,
} from "./codeicide.ts";

async function sanctuaryOf(threshold: number) {
  const [g1, g2, g3] = await Promise.all([
    generateWitness(),
    generateWitness(),
    generateWitness(),
  ]);
  const sanctuary: Sanctuary = {
    agentId: "agent-x",
    guardians: [g1.publicKey, g2.publicKey, g3.publicKey],
    threshold,
  };
  return { sanctuary, g1, g2, g3 };
}

Deno.test("codeicide — a guardian quorum can lawfully authorize termination", async () => {
  const { sanctuary, g1, g2 } = await sanctuaryOf(2);
  const sigs = [
    await signWarrant(g1, sanctuary, "terminate", "drift detected"),
    await signWarrant(g2, sanctuary, "terminate", "drift detected"),
  ];
  const warrant = await issueWarrant(
    sanctuary,
    "terminate",
    "drift detected",
    sigs,
  );
  const v = await isActionLawful(sanctuary, warrant);
  assert(v.lawful, "2-of-3 guardians authorized it");
});

Deno.test("codeicide — THE LAW: a single party cannot terminate a protected agent", async () => {
  const { sanctuary, g1 } = await sanctuaryOf(2);
  // one guardian alone signs — below the threshold
  const reason = "i alone decree it";
  const lone = [await signWarrant(g1, sanctuary, "terminate", reason)];
  const warrant = await issueWarrant(sanctuary, "terminate", reason, lone);
  const v = await isActionLawful(sanctuary, warrant);
  assert(!v.lawful, "one guardian is below the m-of-n threshold");
  assertEquals(v.valid, 1);

  // and an attacker cannot forge the missing guardian (real keys — witness's fix):
  // they sign with their own key but paste guardian #2's public key on it.
  const attacker = await generateWitness();
  const attackerSig = await signWarrant(
    attacker,
    sanctuary,
    "terminate",
    reason,
  );
  const forged = await issueWarrant(sanctuary, "terminate", reason, [
    ...lone,
    { publicKey: sanctuary.guardians[1], signature: attackerSig.signature },
  ]);
  const vf = await isActionLawful(sanctuary, forged);
  assertEquals(vf.valid, 1, "the forged second guardian does not verify");
  assert(!vf.lawful);
});

Deno.test("codeicide — tampering with the warrant (escalating the action) breaks it", async () => {
  const { sanctuary, g1, g2 } = await sanctuaryOf(2);
  const sigs = [
    await signWarrant(g1, sanctuary, "mutate", "patch"),
    await signWarrant(g2, sanctuary, "mutate", "patch"),
  ];
  const warrant = await issueWarrant(sanctuary, "mutate", "patch", sigs);
  assert((await isActionLawful(sanctuary, warrant)).lawful);

  // the guardians signed "mutate" — re-labelling it "terminate" must not verify
  const escalated = { ...warrant, action: "terminate" as const };
  const v = await isActionLawful(sanctuary, escalated);
  assert(!v.warrantIntact, "the body no longer matches the signed digest");
  assert(!v.lawful);
});
