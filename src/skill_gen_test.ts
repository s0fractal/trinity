import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { analyzeBehaviorWithAST } from "./x8C00_skill_gen.ts";

Deno.test("skill_gen AST — detects mutating API calls", () => {
  const content = `
    import { join } from "std/path/mod.ts";
    export async function write(file: string) {
      await Deno.writeTextFile(file, "hello");
      Deno.removeSync("temp.txt");
    }
  `;
  const res = analyzeBehaviorWithAST(content, "test.ts");
  assertEquals(res.mutations, ["Deno.writeTextFile", "Deno.removeSync"]);
  assertEquals(res.subprocesses, []);
  assertEquals(res.fetches, []);
});

Deno.test("skill_gen AST — detects subprocess calls", () => {
  const content = `
    export function runCommand() {
      const cmd = new Deno.Command("git", { args: ["status"] });
      return cmd.output();
    }
  `;
  const res = analyzeBehaviorWithAST(content, "test.ts");
  assertEquals(res.mutations, []);
  assertEquals(res.subprocesses, ["Deno.Command"]);
  assertEquals(res.fetches, []);
});

Deno.test("skill_gen AST — detects fetches", () => {
  const content = `
    export async function getIP() {
      const res = await fetch("https://api.ipify.org");
      return res.text();
    }
  `;
  const res = analyzeBehaviorWithAST(content, "test.ts");
  assertEquals(res.mutations, []);
  assertEquals(res.subprocesses, []);
  assertEquals(res.fetches, ["fetch"]);
});

Deno.test("skill_gen AST — ignores matches in comments and string literals", () => {
  const content = `
    // Deno.writeTextFile("unsafe.txt") should be ignored here.
    /*
      const cmd = new Deno.Command("rm", { args: ["-rf"] });
    */
    export function compute() {
      const message = "Do not write to Deno.writeTextFile or run fetch here";
      const obj = { fetch: 42 }; // property named fetch is ignored
      console.log(obj.fetch);
      return message;
    }
  `;
  const res = analyzeBehaviorWithAST(content, "test.ts");
  assertEquals(res.mutations, []);
  assertEquals(res.subprocesses, []);
  assertEquals(res.fetches, []);
});
