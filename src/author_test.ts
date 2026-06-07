import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  parseReviewVerdict,
  adjudicateQuorum,
} from "./x7C00_author.ts";

Deno.test("author review parsing — parseReviewVerdict", () => {
  // AYE cases
  assertEquals(parseReviewVerdict("APPROVE").stance, "AYE");
  assertEquals(parseReviewVerdict("  APPROVE  \n").stance, "AYE");
  assertEquals(parseReviewVerdict("approve").stance, "AYE");

  // NAY cases (rejections)
  const reject1 = parseReviewVerdict("REJECT: unsafe command line");
  assertEquals(reject1.stance, "NAY");
  assertEquals(reject1.reason, "unsafe command line");

  const reject2 = parseReviewVerdict("reject: bug in file.ts");
  assertEquals(reject2.stance, "NAY");
  assertEquals(reject2.reason, "bug in file.ts");

  // Malformed case treated as NAY
  const malformed = parseReviewVerdict("I am not sure, it looks okay but maybe check later");
  assertEquals(malformed.stance, "NAY");
  assert(malformed.reason?.includes("I am not sure"));
});

Deno.test("author quorum adjudication — adjudicateQuorum", () => {
  // 3 AYE, 0 NAY -> Passes
  const v1 = adjudicateQuorum({
    "claude-sonnet": { stance: "AYE" },
    "claude-opus": { stance: "AYE" },
    "codex-gpt-5": { stance: "AYE" },
  });
  assert(v1.ok);
  assert(v1.detail.includes("Quorum passed"));

  // 2 AYE, 0 NAY -> Passes (threshold is 2)
  const v2 = adjudicateQuorum({
    "claude-sonnet": { stance: "AYE" },
    "claude-opus": { stance: "AYE" },
  });
  assert(v2.ok);

  // 2 AYE, 1 NAY -> Fails (veto)
  const v3 = adjudicateQuorum({
    "claude-sonnet": { stance: "AYE" },
    "claude-opus": { stance: "AYE" },
    "codex-gpt-5": { stance: "NAY", reason: "bug on line 10" },
  });
  assert(!v3.ok);
  assert(v3.detail.includes("Quorum failed"));
  assert(v3.detail.includes("bug on line 10"));

  // 1 AYE, 0 NAY -> Fails (below threshold)
  const v4 = adjudicateQuorum({
    "claude-sonnet": { stance: "AYE" },
  });
  assert(!v4.ok);

  // Empty votes -> Fails
  const v5 = adjudicateQuorum({});
  assert(!v5.ok);
});
