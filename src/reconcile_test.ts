import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyProposal, reconcile } from "./x6B00_reconcile.ts";

Deno.test("reconcile — cross-ledger rule: both-not-done and both-done AGREE", () => {
  assertEquals(classifyProposal(false, false), "agree"); // myc open, trinity open
  assertEquals(classifyProposal(true, true), "agree"); // myc final, trinity closed
});

Deno.test("reconcile — myc FINAL without a trinity closure is a reconcilable gap", () => {
  assertEquals(classifyProposal(true, false), "reconcilable_gap");
});

Deno.test("reconcile — trinity CLOSED while myc is not final is a contradiction", () => {
  // the one case that must fail the gate: the two ledgers genuinely disagree
  assertEquals(classifyProposal(false, true), "inconsistent");
});

Deno.test("reconcile — live report has the three dimensions and only fails on contradiction", async () => {
  const r = await reconcile() as {
    reconciled: boolean;
    dimensions: Array<{ name: string; status: string }>;
  };
  const names = r.dimensions.map((d) => d.name).sort();
  assertEquals(names, ["cross_ledger", "horizon_parity", "resolver_index"]);
  // reconciled iff no dimension is an unexplained contradiction
  assertEquals(
    r.reconciled,
    !r.dimensions.some((d) => d.status === "inconsistent"),
  );
});
