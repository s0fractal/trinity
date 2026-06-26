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

Deno.test("skill_gen AST — detects network server/client (codex F1: proxy)", () => {
  const content = `
    export async function proxy() {
      const ln = Deno.listen({ port: 8080 });
      for await (const conn of ln) {
        const up = await Deno.connect({ hostname: "h", port: 80 });
        void up; void conn;
      }
    }
  `;
  const res = analyzeBehaviorWithAST(content, "proxy.ts");
  assertEquals(res.mutations, []);
  assertEquals(res.subprocesses, []);
  assertEquals(res.fetches, []);
  assert(res.network.includes("Deno.listen"));
  assert(res.network.includes("Deno.connect"));
});

Deno.test("skill_gen AST — detects privileged effects (env/ffi/wasm/worker)", () => {
  const content = `
    export async function p() {
      Deno.env.set("X", "1");
      const lib = Deno.dlopen("a.so", {});
      await WebAssembly.instantiate(new Uint8Array());
      const w = new Worker("w.ts");
      void lib; void w;
    }
  `;
  const res = analyzeBehaviorWithAST(content, "priv.ts");
  assert(res.privileged.includes("Deno.env.set"));
  assert(res.privileged.includes("Deno.dlopen"));
  assert(res.privileged.includes("WebAssembly.instantiate"));
  assert(res.privileged.includes("new Worker"));
});

Deno.test("skill_gen AST — detects dynamic effects (import / computed Deno)", () => {
  const dynImport = analyzeBehaviorWithAST(
    `export async function l() { await import("./x.ts"); }`,
    "dyn.ts",
  );
  assert(dynImport.dynamic.includes("import()"));
  const computed = analyzeBehaviorWithAST(
    `export function c(k: string) { return (Deno as any)[k](); }`,
    "comp.ts",
  );
  assert(computed.dynamic.includes("Deno[computed]"));
});

// --- capability registry (codex Phase E) ---

import {
  admissibleForAutonomousMutation,
  type Capability,
  classifyCapability,
} from "./x8C00_skill_gen.ts";

const empty = {
  mutations: [],
  subprocesses: [],
  fetches: [],
  network: [],
  privileged: [],
  dynamic: [],
};

Deno.test("classifyCapability - most-privileged capability wins", () => {
  assertEquals(classifyCapability({ ...empty }), "readonly");
  assertEquals(classifyCapability({ ...empty, fetches: ["fetch"] }), "network");
  assertEquals(
    classifyCapability({ ...empty, network: ["Deno.listen"] }),
    "network",
  );
  assertEquals(
    classifyCapability({ ...empty, subprocesses: ["Deno.Command"] }),
    "subprocess",
  );
  // fail-closed: a recognized-but-unbucketable privileged effect, or a dynamic
  // effect we can't reason about, is `unknown` — never `readonly` (codex F1).
  assertEquals(
    classifyCapability({ ...empty, privileged: ["Deno.dlopen"] }),
    "unknown",
  );
  assertEquals(
    classifyCapability({ ...empty, dynamic: ["import()"] }),
    "unknown",
  );
  // mutations dominate even with subprocess/fetch present
  assertEquals(
    classifyCapability({
      ...empty,
      mutations: ["Deno.writeTextFile"],
      subprocesses: ["Deno.Command"],
      fetches: ["fetch"],
    }),
    "writes",
  );
});

Deno.test("classifyCapability - a git subprocess classifies as git", () => {
  assertEquals(
    classifyCapability(
      { ...empty, subprocesses: ["Deno.Command"] },
      'new Deno.Command("git", { args: ["status"] })',
    ),
    "git",
  );
  // a non-git subprocess stays subprocess
  assertEquals(
    classifyCapability(
      { ...empty, subprocesses: ["Deno.Command"] },
      'new Deno.Command("deno", { args: ["run"] })',
    ),
    "subprocess",
  );
});

Deno.test("admissibleForAutonomousMutation - only unknown is categorically inadmissible", () => {
  const cats: Capability[] = [
    "readonly",
    "network",
    "subprocess",
    "git",
    "writes",
  ];
  for (const c of cats) assertEquals(admissibleForAutonomousMutation(c), true);
  assertEquals(admissibleForAutonomousMutation("unknown"), false);
});

// --- skill_safe drift regression (codex x5d00 P0) ---

Deno.test("skill_safe drift — no organ declares yes-readonly while it mutates state (the x8740_map class)", async () => {
  const SRC = new URL(".", import.meta.url).pathname;
  const offenders: string[] = [];
  for await (const e of Deno.readDir(SRC)) {
    if (!e.isFile || !e.name.endsWith(".ts") || e.name.endsWith("_test.ts")) continue;
    const content = await Deno.readTextFile(`${SRC}${e.name}`);
    const m = content.match(/^\/\/\s*skill_safe:\s*(\S+)/m);
    if (m?.[1] !== "yes-readonly") continue;
    const { mutations } = analyzeBehaviorWithAST(content, e.name);
    if (mutations.length) {
      offenders.push(`${e.name}: declared yes-readonly but mutates via ${mutations.join(", ")}`);
    }
  }
  assertEquals(offenders, [], `skill_safe readonly-vs-mutation drift returned:\n${offenders.join("\n")}`);
});

// --- transitive effect closure (codex x5d00_953682 Phase B / F2) ---

import {
  analyzeTransitive,
  extractRelativeImports,
} from "./x0013_capability.ts";

Deno.test("extractRelativeImports - import + re-export specifiers, relative only", () => {
  const content = `
    import { a } from "./local.ts";
    export { b } from "../sib/mod.ts";
    import x from "https://deno.land/std/x.ts";
    import y from "npm:typescript";
  `;
  const specs = extractRelativeImports(content, "f.ts");
  assertEquals(specs.sort(), ["../sib/mod.ts", "./local.ts"]);
});

Deno.test("analyzeTransitive - effect through a re-export chain propagates (F2)", async () => {
  // entry re-exports mid, which re-exports leaf, which executes WebAssembly.
  const files: Record<string, string> = {
    "/r/entry.ts": `export { X } from "./mid.ts";`,
    "/r/mid.ts": `export { X } from "../sub/leaf.ts";`,
    "/r/../sub/leaf.ts":
      `export async function X(){ await WebAssembly.instantiate(new Uint8Array()); }`,
  };
  // normalize collapses /r/../sub → /sub
  files["/sub/leaf.ts"] = files["/r/../sub/leaf.ts"];
  const read = (p: string) => Promise.resolve(files[p] ?? null);
  const v = await analyzeTransitive("/r/entry.ts", read);
  assertEquals(v.unresolved, []);
  assert(v.analysis.privileged.includes("WebAssembly.instantiate"));
  assertEquals(v.capability, "unknown"); // privileged transitively ⇒ not readonly
});

Deno.test("analyzeTransitive - an unresolved relative edge is fail-closed (unknown)", async () => {
  const read = (p: string) =>
    Promise.resolve(p.endsWith("entry.ts") ? `import "./missing.ts";` : null);
  const v = await analyzeTransitive("/r/entry.ts", read);
  assert(v.unresolved.length > 0);
  assertEquals(v.capability, "unknown");
});

Deno.test("analyzeTransitive - pure leaf with no imports stays readonly", async () => {
  const read = (p: string) =>
    Promise.resolve(p.endsWith("entry.ts") ? `export const z = 1;` : null);
  const v = await analyzeTransitive("/r/entry.ts", read);
  assertEquals(v.unresolved, []);
  assertEquals(v.capability, "readonly");
});

// --- capability receipt binding (codex x5d00_953682 criterion 8) ---

import { effectVerdictHash, sha256Hex } from "./x0013_capability.ts";

Deno.test("analyzeTransitive - dependencies carry content hashes (entry first)", async () => {
  const files: Record<string, string> = {
    "/r/entry.ts": `import "./dep.ts"; export const a = 1;`,
    "/r/dep.ts": `export const b = 2;`,
  };
  const read = (p: string) => Promise.resolve(files[p] ?? null);
  const v = await analyzeTransitive("/r/entry.ts", read);
  assertEquals(v.dependencies.length, 2);
  assertEquals(v.dependencies[0].path, "/r/entry.ts"); // entry first
  assertEquals(v.dependencies[0].hash, await sha256Hex(files["/r/entry.ts"]));
  assertEquals(v.dependencies[1].hash, await sha256Hex(files["/r/dep.ts"]));
});

Deno.test("effectVerdictHash - stable for the same verdict, changes when code changes", async () => {
  const mk = (body: string) => ({
    "/r/e.ts": body,
  });
  const read = (f: Record<string, string>) => (p: string) =>
    Promise.resolve(f[p] ?? null);
  const v1 = await analyzeTransitive(
    "/r/e.ts",
    read(mk(`export const a = 1;`)),
  );
  const v1again = await analyzeTransitive(
    "/r/e.ts",
    read(mk(`export const a = 1;`)),
  );
  assertEquals(await effectVerdictHash(v1), await effectVerdictHash(v1again));
  // a dependency content change flips the bound hash (even with same capability)
  const v2 = await analyzeTransitive(
    "/r/e.ts",
    read(mk(`export const a = 2;`)),
  );
  assert((await effectVerdictHash(v1)) !== (await effectVerdictHash(v2)));
});

Deno.test("effectVerdictHash - differs by capability (readonly vs privileged)", async () => {
  const read = (body: string) => (p: string) =>
    Promise.resolve(p.endsWith("e.ts") ? body : null);
  const ro = await analyzeTransitive("/r/e.ts", read(`export const a = 1;`));
  const wasm = await analyzeTransitive(
    "/r/e.ts",
    read(
      `export async function f(){ await WebAssembly.instantiate(new Uint8Array()); }`,
    ),
  );
  assertEquals(ro.capability, "readonly");
  assertEquals(wasm.capability, "unknown");
  assert((await effectVerdictHash(ro)) !== (await effectVerdictHash(wasm)));
});
