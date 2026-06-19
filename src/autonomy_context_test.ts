import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildCapabilityEvidence,
  verifyCapabilityEvidence,
} from "./x5C30_autonomy_context.ts";

const READONLY = `export function f(x: number) { return x + 1; }`;
const WRITES =
  `export async function f() { await Deno.writeTextFile("x", "y"); }`;

// an injected reader: organ content keyed by path (no disk, deterministic).
const readerFor = (map: Record<string, string>) => (p: string) =>
  Promise.resolve(map[p] ?? null);

Deno.test("context build — capability is RECOMPUTED from the organ, not asserted", async () => {
  const ro = await buildCapabilityEvidence(
    "f",
    "ro",
    "ro.ts",
    readerFor({ "ro.ts": READONLY }),
  );
  assertEquals(ro!.capability, "readonly");
  const wr = await buildCapabilityEvidence(
    "f",
    "wr",
    "wr.ts",
    readerFor({ "wr.ts": WRITES }),
  );
  assertEquals(wr!.capability, "writes"); // a write floors to A2 in the policy compiler
  // the verdict hash binds the actual content — different code, different hash.
  assert(ro!.verdict_hash !== wr!.verdict_hash);
});

Deno.test("context verify — matching organ is valid; ANY drift is invalid (fail closed)", async () => {
  const read = readerFor({ "ro.ts": READONLY });
  const ev = (await buildCapabilityEvidence("f", "ro", "ro.ts", read))!;
  assertEquals((await verifyCapabilityEvidence(ev, "ro.ts", read)).valid, true);
  // the organ changed underneath → invalid (organ_hash / verdict_hash drift).
  const drifted = readerFor({ "ro.ts": WRITES });
  const v = await verifyCapabilityEvidence(ev, "ro.ts", drifted);
  assertEquals(v.valid, false);
  assert(v.reason.includes("changed") || v.reason.includes("drift"));
});

Deno.test("context — an unreadable import forces unknown (fail closed)", async () => {
  const withImport = `import { x } from "./missing.ts"; export const y = x;`;
  const ev = await buildCapabilityEvidence(
    "f",
    "imp",
    "imp.ts",
    readerFor({ "imp.ts": withImport }),
  );
  assertEquals(ev!.capability, "unknown"); // unresolved edge ⇒ unknown ⇒ A4 floor
});
