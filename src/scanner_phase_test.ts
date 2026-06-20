import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classifyPhase,
  structuralReceiptBacked,
} from "./x0020_scanner_core.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Phase classification is STRUCTURAL (refactor 2026-06-21): `classifyPhase` maps
// the computed L-ladder → thought phase per x2C10's L0→L8 mapping, instead of
// guessing from content substrings. Receipt-backing (L7) is structural, not a
// `content.includes("receipt:")` match (which counted `receipt:"none"` and prose).

const fm = (o: Record<string, unknown>) => o;
// L-profile subset builder: everything false, override the levels under test.
const L = (
  o: Partial<{
    L1_fqdn: boolean;
    L2_parseable: boolean;
    L3_schema_valid: boolean;
    L4b_hash_verified: boolean;
    L5_graph_linked: boolean;
    L6_recipe: boolean;
    L7_receipt_backed: boolean;
    L8_published: boolean;
  }> = {},
) => ({
  L1_fqdn: false,
  L2_parseable: false,
  L3_schema_valid: false,
  L4b_hash_verified: false,
  L5_graph_linked: false,
  L6_recipe: false,
  L7_receipt_backed: false,
  L8_published: false,
  ...o,
});

Deno.test("structuralReceiptBacked — typed chord / .receipt. / output-block count; mentions do not", () => {
  // structural receipts
  assertEquals(
    structuralReceiptBacked(fm({ type: "chord.receipt" }), "x.myc.md", "b"),
    true,
  );
  assertEquals(
    structuralReceiptBacked(fm({ stance: "RECEIPT" }), "x.myc.md", "b"),
    true,
  );
  assertEquals(
    structuralReceiptBacked(null, "h.abc.receipt.myc.md", "b"),
    true,
  );
  assertEquals(
    structuralReceiptBacked(null, "p.md", "x\n------- output -------\ny"),
    true,
  );
  // RED TEAM: a proposal's receipt-policy field, receipt:"none", or prose/code must NOT count
  assertEquals(
    structuralReceiptBacked(
      fm({ mode: "PROPOSE", receipt: "file", type: "ProposalDescriptor" }),
      "x.myc.md",
      "b",
    ),
    false,
  );
  assertEquals(
    structuralReceiptBacked(
      fm({ receipt: "none" }),
      "x.myc.md",
      'receipt: "none"\nsignature: pending',
    ),
    false,
  );
  assertEquals(
    structuralReceiptBacked(
      null,
      "x0020_scanner_core.ts",
      'includes("receipt:")',
    ),
    false,
  );
});

Deno.test("classifyPhase — the L-ladder maps to the maturity cycle (x2C10 L0→L8)", () => {
  assertEquals(classifyPhase(L(), null), "raw-fantasy"); // L0: no FQDN
  assertEquals(classifyPhase(L({ L1_fqdn: true }), null), "hypothesis");
  assertEquals(classifyPhase(L({ L2_parseable: true }), null), "hypothesis");
  assertEquals(classifyPhase(L({ L3_schema_valid: true }), null), "proposal");
  assertEquals(classifyPhase(L({ L6_recipe: true }), null), "experiment");
  assertEquals(classifyPhase(L({ L7_receipt_backed: true }), null), "receipt");
  assertEquals(classifyPhase(L({ L4b_hash_verified: true }), null), "receipt");
  assertEquals(classifyPhase(L({ L5_graph_linked: true }), null), "formula");
  assertEquals(classifyPhase(L({ L8_published: true }), null), "crystal");
  assertEquals(
    classifyPhase(L({ L4b_hash_verified: true, L5_graph_linked: true }), null),
    "crystal",
  );
});

Deno.test("classifyPhase — overrides, compost, and most-advanced-wins", () => {
  // explicit author override beats structure
  assertEquals(
    classifyPhase(
      L({ L8_published: true }),
      fm({ thought_phase: "hypothesis" }),
    ),
    "hypothesis",
  );
  // compost (off the active path) beats structural maturity
  assertEquals(
    classifyPhase(L({ L8_published: true }), fm({ status: "superseded" })),
    "compost",
  );
  // active contract → crystal
  assertEquals(
    classifyPhase(
      L({ L1_fqdn: true }),
      fm({ type: "ContractDescriptor", status: "active" }),
    ),
    "crystal",
  );
  // proposal descriptor with no higher structure → proposal
  assertEquals(
    classifyPhase(L({ L1_fqdn: true }), fm({ type: "ProposalDescriptor" })),
    "proposal",
  );
  // most-advanced wins: published receipt → crystal, not receipt
  assertEquals(
    classifyPhase(L({ L7_receipt_backed: true, L8_published: true }), null),
    "crystal",
  );
});
