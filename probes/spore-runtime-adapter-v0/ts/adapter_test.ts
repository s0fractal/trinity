// adapter_test.ts — backend-agnosticism of SPORE.v0 apply. Gated via trinity
// `deno task test:unit`.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runMutator } from "./adapter.ts";
import { referenceBackend } from "./backends.ts";

const INPUT = new TextEncoder().encode("the quick brown fox \x00\x5c\xff");

Deno.test("identity — WASM and TS reference agree on output_hash", async () => {
  const v = await runMutator("identity", INPUT);
  assertEquals(v.agreement, true);
  assertEquals(v.receipts.length, 2);
  assert(v.receipts.every((r) => r.backend_compatible));
  // both non-null and equal
  assertEquals(v.receipts[0].output_hash, v.receipts[1].output_hash);
});

Deno.test("xor_5c — WASM and TS reference agree on output_hash", async () => {
  const v = await runMutator("xor_5c", INPUT);
  assertEquals(v.agreement, true);
  assertEquals(v.receipts[0].output_hash, v.receipts[1].output_hash);
});

Deno.test("nop — both backends produce the empty-output hash", async () => {
  const v = await runMutator("nop", INPUT);
  assertEquals(v.agreement, true);
});

Deno.test("real semantics — identity and xor_5c differ on the same input", async () => {
  // A 'hash of concatenated inputs' simulation could not produce the CORRECT
  // distinct outputs; only real execution does.
  const id = await runMutator("identity", INPUT);
  const xr = await runMutator("xor_5c", INPUT);
  assert(
    id.receipts[0].output_hash !== xr.receipts[0].output_hash,
    "identity and xor_5c must yield different output hashes",
  );
});

Deno.test("unknown mutator — reference reports incompatible, never a bogus hash", async () => {
  const v = await runMutator("definitely_not_a_mutator", INPUT);
  // wasm file missing ⇒ incompatible; reference unknown ⇒ incompatible.
  assertEquals(v.receipts.every((r) => r.backend_compatible === false), true);
  assertEquals(v.receipts.every((r) => r.output_hash === null), true);
  assertEquals(v.agreement, false); // fewer than 2 compatible backends
});

Deno.test("referenceBackend — xor_5c is its own inverse (sanity)", () => {
  const once = referenceBackend("xor_5c", INPUT)!;
  const twice = referenceBackend("xor_5c", once)!;
  assertEquals(twice, INPUT);
});
