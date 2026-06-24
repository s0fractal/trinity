import { assert, assertEquals } from "jsr:@std/assert@^1";
import { bashEffects, gate } from "./claude_code_gate.ts";

Deno.test("bashEffects — classifies shell commands by their most-privileged effect", () => {
  assertEquals(bashEffects("ls -la"), ["read"]);
  assertEquals(bashEffects("git status"), ["read"]);
  assertEquals(bashEffects("git commit -m x"), ["source_change"]);
  assertEquals(bashEffects("git push origin main"), ["branch_push"]);
  assertEquals(bashEffects("deno publish"), ["deploy"]);
  assertEquals(bashEffects("rm -rf node_modules"), ["destructive"]);
  assertEquals(bashEffects("frobnicate --wibble"), ["shell_unknown"]); // unrecognized ⇒ fail-closed
});

Deno.test("gate — under an A2 ceiling: read & edit allowed, reach-out & sovereign denied", () => {
  assert(gate("Read", { file_path: "x" }, "A2").allow);
  assert(gate("Edit", { file_path: "x" }, "A2").allow);
  assert(gate("Bash", { command: "git commit -m x" }, "A2").allow);
  assert(!gate("Bash", { command: "git push" }, "A2").allow);
  assert(!gate("Bash", { command: "deno publish" }, "A2").allow);
  assert(!gate("Bash", { command: "rm -rf /" }, "A2").allow);
  assert(!gate("WebFetch", { url: "x" }, "A2").allow);
});

Deno.test("gate — an unknown tool or command is sovereign (A4), never waved through", () => {
  assertEquals(gate("MysteryTool", {}, "A2").cls, "A4");
  assert(!gate("MysteryTool", {}, "A2").allow);
  assertEquals(gate("Bash", { command: "frobnicate" }, "A4").cls, "A4");
});
