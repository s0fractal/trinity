import { assert, assertEquals } from "@std/assert";
import {
  buildContextBrief,
  inferContextScope,
  queryTokens,
  renderContextBrief,
  selectionTokens,
} from "./x2F10_context.ts";

Deno.test("context — tokenization and scope stay deterministic", () => {
  assertEquals(queryTokens("refactor the MYC resolver та graph"), [
    "refactor",
    "myc",
    "resolver",
    "graph",
  ]);
  assertEquals(inferContextScope("improve myc resolver"), "myc");
  assertEquals(inferContextScope("bridge trinity and myc"), "mixed");
  assertEquals(inferContextScope("agentseal release"), "trinity");
  assertEquals(
    selectionTokens("refactor trinity and myc cognitive load"),
    [
      "cognitive",
      "x0100",
      "dispatch",
      "agents",
      "projection",
      "resolve",
      "resolver",
      "context",
    ],
  );
});

Deno.test("context — ledger is cold by default and file count is bounded", async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/src`, { recursive: true });
    await Deno.mkdir(`${root}/packages/demo`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/src/x1000_resolver.ts`,
      "export const resolver = 'bounded context';",
    );
    await Deno.writeTextFile(
      `${root}/src/x1000_history.myc.md`,
      "resolver resolver resolver historical ledger",
    );
    await Deno.writeTextFile(
      `${root}/packages/demo/resolver_test.ts`,
      "Deno.test('resolver', () => {});",
    );

    const brief = await buildContextBrief("resolver context", {
      root,
      maxFiles: 4,
    });
    assert(brief.relevant_files.length <= 4);
    assert(
      brief.relevant_files.some((file) =>
        file.path === "src/x1000_resolver.ts"
      ),
    );
    assert(
      !brief.relevant_files.some((file) => file.path.endsWith(".myc.md")),
    );
    assert(renderContextBrief(brief).length < 4_000);

    const oversized = await buildContextBrief("resolver", {
      root,
      maxFiles: 999,
    });
    assertEquals(oversized.budget.max_files, 20);
    assert(oversized.relevant_files.length <= 20);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("context — ledger inclusion is explicit", async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/src`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/src/x1000_history.myc.md`,
      "rare-ledger-token",
    );
    const cold = await buildContextBrief("rare-ledger-token", { root });
    const warm = await buildContextBrief("rare-ledger-token", {
      root,
      includeLedger: true,
    });
    assertEquals(cold.relevant_files.length, 0);
    assertEquals(warm.relevant_files[0]?.path, "src/x1000_history.myc.md");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
