import { assert, assertEquals } from "jsr:@std/assert@^1";
import { gateMcpCall } from "./mcp_gate.ts";

const declared = {
  "files.read": ["read"],
  "files.write": ["source_change"],
  "files.delete": ["destructive"],
  "git.push": ["branch_push"],
};

Deno.test("mcp gate — declared tools classify by their effect and gate at the ceiling", () => {
  assert(gateMcpCall("files.read", declared, "A2").allow);
  assert(gateMcpCall("files.write", declared, "A2").allow);
  assert(!gateMcpCall("files.delete", declared, "A2").allow); // declared destructive ⇒ A4
  assert(!gateMcpCall("git.push", declared, "A2").allow); // A3 > A2
});

Deno.test("mcp gate — an UNDECLARED tool is sovereign (A4), denied by default", () => {
  const g = gateMcpCall("untrusted.anything", declared, "A2");
  assertEquals(g.cls, "A4");
  assert(!g.allow);
});

Deno.test("mcp gate — an empty effect map denies everything (safe default for an untrusted server)", () => {
  assert(!gateMcpCall("files.read", {}, "A2").allow);
  assertEquals(gateMcpCall("files.read", {}, "A2").cls, "A4");
});
