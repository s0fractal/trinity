import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyPhase } from "./x0020_scanner_core.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Phase classifier — receipt detection must be STRUCTURAL, not a substring match
// (audit 2026-06-20). The old `content.includes("receipt:")` counted files that
// merely MENTION a receipt — including `receipt: "none"` and prose/code — as
// receipt phase, inflating the Rigid-Verifying archetype (myc 90→3 after the fix).

const fm = (o: Record<string, unknown>) => o;

Deno.test("classifier — a receipt-typed chord is receipt phase", () => {
  assertEquals(
    classifyPhase(
      "src/x_r.myc.md",
      "body",
      fm({ type: "chord.receipt" }),
      false,
    ),
    "receipt",
  );
  assertEquals(
    classifyPhase("src/x_r.myc.md", "body", fm({ stance: "RECEIPT" }), false),
    "receipt",
  );
  assertEquals(
    classifyPhase("h.abc.receipt.myc.md", "body", null, false),
    "receipt",
  );
  assertEquals(
    classifyPhase("p.md", "x\n------- output -------\ny", null, false),
    "receipt",
  );
});

Deno.test("classifier — RED TEAM: a mere mention of receipt: does NOT count as receipt", () => {
  // a proposal that declares receipt:"none" is NOT a receipt
  assertEquals(
    classifyPhase(
      "src/x_p.myc.md",
      'this chord has receipt: "none"\nsignature: pending',
      fm({ mode: "PROPOSE", receipt: "none", type: "ProposalDescriptor" }),
      false,
    ),
    "proposal",
  );
  // a source/prose file that just contains the word receipt: is not a receipt
  assertEquals(
    classifyPhase(
      "src/x0020_scanner_core.ts",
      'if (content.includes("receipt:")) return "receipt";',
      null,
      false,
    ),
    "hypothesis",
  );
});
