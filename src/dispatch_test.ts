// src/dispatch_test.ts — JSON-RPC server mode (`t rpc`) pure helpers.
// The stdio loop itself is integration-tested by piping into `./t rpc`; here we
// lock the pure request-parsing, payload-extraction, and response shapes.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  extractJsonPayload,
  parseRpcRequest,
  rpcError,
  rpcResult,
} from "./x0100_dispatch.ts";

Deno.test("extractJsonPayload - parses pure JSON stdout", () => {
  assertEquals(extractJsonPayload('{"type":"block","value":953571}'), {
    type: "block",
    value: 953571,
  });
});

Deno.test("extractJsonPayload - tolerates leading # comment lines", () => {
  const raw = '# status → 2/E\n# note\n{"ok":true}';
  assertEquals(extractJsonPayload(raw), { ok: true });
});

Deno.test("extractJsonPayload - non-JSON content returns { text }", () => {
  assertEquals(extractJsonPayload("just some content"), {
    text: "just some content",
  });
});

Deno.test("extractJsonPayload - empty stdout is null", () => {
  assertEquals(extractJsonPayload("   \n  "), null);
});

Deno.test("parseRpcRequest - array params pass through as CLI args", () => {
  const r = parseRpcRequest(
    '{"jsonrpc":"2.0","id":1,"method":"resolve","params":["foo.ts","--show"]}',
  );
  assertEquals("req" in r, true);
  if ("req" in r) {
    assertEquals(r.req.method, "resolve");
    assertEquals(r.req.params, ["foo.ts", "--show"]);
    assertEquals(r.req.id, 1);
    assertEquals(r.req.isNotification, false);
  }
});

Deno.test("parseRpcRequest - object params map to --key=value flags", () => {
  const r = parseRpcRequest(
    '{"id":2,"method":"resolve","params":{"kind":"organ","cloud":true}}',
  );
  if ("req" in r) {
    assertEquals(r.req.params, ["--kind=organ", "--cloud"]);
  } else {
    throw new Error("expected a parsed request");
  }
});

Deno.test("parseRpcRequest - missing id marks a notification", () => {
  const r = parseRpcRequest('{"method":"block"}');
  if ("req" in r) {
    assertEquals(r.req.isNotification, true);
    assertEquals(r.req.id, null);
  } else {
    throw new Error("expected a parsed request");
  }
});

Deno.test("parseRpcRequest - missing method is an invalid request", () => {
  const r = parseRpcRequest('{"id":1,"params":[]}');
  assertEquals(r, {
    errorCode: -32600,
    message: "Invalid Request: missing method",
  });
});

Deno.test("parseRpcRequest - malformed JSON is a parse error", () => {
  const r = parseRpcRequest("{not valid");
  assertEquals(r, { errorCode: -32700, message: "Parse error" });
});

Deno.test("rpcResult / rpcError - shapes are JSON-RPC 2.0", () => {
  assertEquals(
    JSON.parse(rpcResult(7, { a: 1 })),
    { jsonrpc: "2.0", id: 7, result: { a: 1 } },
  );
  assertEquals(
    JSON.parse(rpcError(8, -32601, "Method not found: x")),
    {
      jsonrpc: "2.0",
      id: 8,
      error: { code: -32601, message: "Method not found: x" },
    },
  );
});

// --- evalAst: the `t eval` LISP-AST evaluator (T4) ---

import { evalAst, type LeafExec } from "./x0100_dispatch.ts";

/** Mock leaf executor: echoes the call; throws for a handle named "boom". */
const mockExec: LeafExec = (handle, args) => {
  if (handle === "boom") return Promise.reject(new Error("boom failed"));
  return Promise.resolve({ handle, args });
};

Deno.test("evalAst - literal passes through", async () => {
  assertEquals(await evalAst("hello", mockExec), "hello");
  assertEquals(await evalAst(42, mockExec), 42);
});

Deno.test("evalAst - leaf runs the handle with stringified args", async () => {
  assertEquals(await evalAst(["status", "--json"], mockExec), {
    handle: "status",
    args: ["--json"],
  });
});

Deno.test("evalAst - pipe runs in order, returns the last", async () => {
  assertEquals(await evalAst(["pipe", ["a"], ["b"], ["c"]], mockExec), {
    handle: "c",
    args: [],
  });
});

Deno.test("evalAst - all/each collects every result", async () => {
  assertEquals(await evalAst(["all", ["a"], ["b"]], mockExec), [
    { handle: "a", args: [] },
    { handle: "b", args: [] },
  ]);
});

Deno.test("evalAst - try returns fallback when the first arm throws", async () => {
  assertEquals(await evalAst(["try", ["boom"], ["ok"]], mockExec), {
    handle: "ok",
    args: [],
  });
  // no error ⇒ first arm's result, fallback ignored
  assertEquals(await evalAst(["try", ["ok"], ["other"]], mockExec), {
    handle: "ok",
    args: [],
  });
  // throwing with no fallback ⇒ null
  assertEquals(await evalAst(["try", ["boom"]], mockExec), null);
});

Deno.test("evalAst - cond picks the first truthy arm; lone arm is else", async () => {
  // truthy test (mock returns an object ⇒ truthy) → its 'then'
  assertEquals(
    await evalAst(["cond", [["a"], ["then1"]], [["fallback"]]], mockExec),
    { handle: "then1", args: [] },
  );
  // falsey test (literal false) skips to else arm
  assertEquals(
    await evalAst(["cond", [false, ["skip"]], [["elsebranch"]]], mockExec),
    { handle: "elsebranch", args: [] },
  );
});

Deno.test("evalAst - non-string head is an error", async () => {
  let threw = false;
  try {
    await evalAst([42, ["a"]], mockExec);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("parseRpcRequest - preserves rawParams (nested AST survives for eval)", () => {
  const ast = ["all", ["block"], ["resolve", "x"]];
  const r = parseRpcRequest(
    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eval", params: [ast] }),
  );
  if (!("req" in r)) throw new Error("expected a parsed request");
  // params stringify (lossy) but rawParams keeps the AST intact for eval.
  assertEquals(r.req.rawParams, [ast]);
});

// --- execution-plan budgets (codex R3 / Phase C) ---

import {
  analyzeExecutionPlan,
  DEFAULT_BUDGET,
  evalAstBounded,
  type ExecutionBudget,
  planStats,
  safeBudgetFor,
} from "./x0100_dispatch.ts";
import type { Capability } from "./x8C00_skill_gen.ts";

Deno.test("planStats - counts depth, nodes, leaves, parallel width, handles", () => {
  // ["pipe", ["all", ["a"], ["b"], ["c"]], ["d"]]
  const s = planStats(["pipe", ["all", ["a"], ["b"], ["c"]], ["d"]]);
  assertEquals(s.leaves, 4); // a,b,c,d
  assertEquals(s.max_parallel, 3); // all of 3
  assertEquals(s.depth, 3); // pipe → all → leaf
  assertEquals(s.handles.sort(), ["a", "b", "c", "d"]);
});

Deno.test("analyzeExecutionPlan - within budget is admitted", () => {
  const a = analyzeExecutionPlan(
    ["all", ["block"], ["status"]],
    DEFAULT_BUDGET,
  );
  assertEquals(a.ok, true);
});

Deno.test("analyzeExecutionPlan - over max_parallel is rejected", () => {
  const tiny: ExecutionBudget = {
    max_depth: 8,
    max_nodes: 256,
    max_leaves: 64,
    max_parallel: 2,
  };
  const a = analyzeExecutionPlan(["all", ["x"], ["y"], ["z"]], tiny);
  assertEquals(a.ok, false);
  if (!a.ok) {
    assertEquals(a.violations.some((v) => v.includes("parallel")), true);
  }
});

Deno.test("analyzeExecutionPlan - capability allow-list rejects unknown handle", () => {
  const b: ExecutionBudget = {
    ...DEFAULT_BUDGET,
    allowed_handles: ["block"],
  };
  const a = analyzeExecutionPlan(["all", ["block"], ["status"]], b);
  assertEquals(a.ok, false);
  if (!a.ok) assertEquals(a.violations.some((v) => v.includes("status")), true);
});

Deno.test("evalAstBounded - a rejected plan executes ZERO leaves (admission is pre-execution)", async () => {
  let leafCalls = 0;
  const counting: LeafExec = (h) => {
    leafCalls++;
    return Promise.resolve({ h });
  };
  const tiny: ExecutionBudget = {
    max_depth: 1,
    max_nodes: 1,
    max_leaves: 1,
    max_parallel: 1,
  };
  let threw = false;
  try {
    await evalAstBounded(["all", ["a"], ["b"], ["c"]], counting, tiny);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
  assertEquals(leafCalls, 0); // codex R3 falsifier: not one leaf launched
});

Deno.test("evalAstBounded - admitted plan runs normally", async () => {
  const exec: LeafExec = (h, args) => Promise.resolve({ h, args });
  const r = await evalAstBounded(["all", ["a"], ["b"]], exec, DEFAULT_BUDGET);
  assertEquals(r, [{ h: "a", args: [] }, { h: "b", args: [] }]);
});

// --- safeBudgetFor: capability-gated --safe eval (Phase E live consumer) ---

Deno.test("safeBudgetFor - admits only readonly-classified handles", () => {
  const cap: Record<string, Capability> = {
    status: "readonly",
    roadmap: "readonly",
    apply: "writes",
    court: "subprocess",
  };
  const ast = ["all", ["status"], ["roadmap"], ["apply"], ["court"]];
  const budget = safeBudgetFor(ast, (h) => cap[h] ?? null);
  assertEquals(budget.allowed_handles, ["status", "roadmap"]);
  // Inherits the resource bounds of DEFAULT_BUDGET.
  assertEquals(budget.max_leaves, DEFAULT_BUDGET.max_leaves);
});

Deno.test("safeBudgetFor + admission - non-readonly handle is rejected pre-exec", () => {
  const ast = ["pipe", ["status"], ["apply"]];
  const budget = safeBudgetFor(
    ast,
    (h) => (h === "status" ? "readonly" : "writes"),
  );
  const adm = analyzeExecutionPlan(ast, budget);
  assertEquals(adm.ok, false);
  if (!adm.ok) {
    assertEquals(
      adm.violations.some((v) => v.includes("apply")),
      true,
    );
  }
});

Deno.test("safeBudgetFor - unknown/unresolved handle is inadmissible (fail-closed)", () => {
  // lookup returns null for every handle (unresolved / unknown capability).
  const ast = ["status"];
  const budget = safeBudgetFor(ast, () => null);
  assertEquals(budget.allowed_handles, []);
  const adm = analyzeExecutionPlan(ast, budget);
  assertEquals(adm.ok, false);
});

Deno.test("safeBudgetFor - all-readonly composition is admitted", () => {
  const ast = ["pipe", ["status"], ["roadmap"]];
  const budget = safeBudgetFor(ast, () => "readonly");
  const adm = analyzeExecutionPlan(ast, budget);
  assertEquals(adm.ok, true);
});
