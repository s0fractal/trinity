import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { resolveFqdn } from "./x2F30_fqdn_resolver.ts";
import { witness } from "./x2F32_fqdn_witness.ts";

// The capstone: a stable ROLE address (fqdn) whose CONTENT mutates produces a
// chain of content-pinned receipts — content=role (stable address), receipt=
// content (changes per edit). One BLAKE3 regime throughout.
Deno.test("witness — same fqdn, edited content → new content hash + new receipt, role stable", async () => {
  const base = await Deno.makeTempDir({ prefix: "fqdn_witness_" });
  try {
    const file = join(base, "x9999_demo.myc.md");

    await Deno.writeTextFile(file, "version one\n");
    const r1 = await resolveFqdn("x9999_demo.myc.md", [base]);
    const w1 = await witness(r1, 952699);

    await Deno.writeTextFile(file, "version two\n"); // mutate the content
    const r2 = await resolveFqdn("x9999_demo.myc.md", [base]);
    const w2 = await witness(r2, 952705); // a later block

    // role address is stable across the edit
    assertEquals(w1.fqdn, w2.fqdn);
    assertEquals(w1.role, w2.role);
    // content identity moved, so the receipt id moved too (append-only log)
    assertNotEquals(w1.content_blake3, w2.content_blake3);
    assertNotEquals(w1.receipt_id, w2.receipt_id);
    assert(w2.bitcoin_block_height > w1.bitcoin_block_height);
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});

Deno.test("witness — unchanged content re-witnessed at a later block: same content hash, same receipt id", async () => {
  const base = await Deno.makeTempDir({ prefix: "fqdn_witness_" });
  try {
    const file = join(base, "x9999_demo.myc.md");
    await Deno.writeTextFile(file, "stable\n");
    const a = await witness(await resolveFqdn("x9999_demo.myc.md", [base]), 1);
    const b = await witness(await resolveFqdn("x9999_demo.myc.md", [base]), 2);
    // the receipt id is content-pinned, not time-pinned: same bytes → same id
    assertEquals(a.content_blake3, b.content_blake3);
    assertEquals(a.receipt_id, b.receipt_id);
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});

Deno.test("witness — absent resolution still produces a deterministic receipt", async () => {
  const base = await Deno.makeTempDir({ prefix: "fqdn_witness_" });
  try {
    const w = await witness(await resolveFqdn("nope.md", [base]), 952699);
    assertEquals(w.identity, "absent");
    assertEquals(w.content_blake3, null);
    assert(w.receipt_id.length === 64); // empty-content apply still derives an id
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});
