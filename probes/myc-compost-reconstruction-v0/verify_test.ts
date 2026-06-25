import { assert, assertEquals } from "jsr:@std/assert@^1";
import { verify } from "./verify.ts";

Deno.test("compost reconstruction — safe ⇒ fully proven (terminal + git-tracked + commitment-pinned)", async () => {
  const r = await verify();
  assertEquals(r.type, "myc_compost_reconstruction");
  // The core safety property: nothing is ever marked safe-to-compost without the
  // full three-part proof. (Holds vacuously when myc is absent, e.g. a CI checkout
  // without submodules — there are simply 0 proposals.)
  for (const row of r.rows) {
    if (row.safe_to_compost) {
      assert(
        row.terminal && row.git_tracked && row.commitment_pinned,
        `${row.proposal} marked safe without the full reconstruction proof`,
      );
    }
  }
});

Deno.test("compost reconstruction — a non-terminal proposal is never safe", async () => {
  const r = await verify();
  for (const row of r.rows) {
    if (!row.terminal) assertEquals(row.safe_to_compost, false);
  }
});

Deno.test("compost reconstruction — the live ledger keeps every terminal proposal reconstructable", async () => {
  const r = await verify();
  // Standing invariant: if any implemented/rejected proposal ever becomes
  // non-reconstructable, this reds — the signal to NOT compost until fixed.
  assertEquals(
    r.all_terminal_reconstructable,
    true,
    "a terminal proposal is not reconstructable — composting it would lose data",
  );
});
