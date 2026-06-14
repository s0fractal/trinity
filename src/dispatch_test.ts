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
