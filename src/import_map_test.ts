// src/import_map_test.ts — x0160 import map generator + end-to-end bare import.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildImportMap } from "./x0160_import_map_gen.ts";
import { startProxy } from "./x5510_myc_proxy.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

Deno.test("x0160 — map entries: full names always, handle aliases only when clean and unique", async () => {
  const dir = await Deno.makeTempDir({ prefix: "imap_" });
  try {
    const ts = "```typescript\nexport const x = 1;\n```\n";
    // Clean organ name → full + handle alias.
    await Deno.writeTextFile(join(dir, "x0888_skill.myc.md"), ts);
    // Chord-like name (underscores in remainder) → full name only.
    await Deno.writeTextFile(
      join(dir, "x7700_953391_claude_some-receipt.myc.md"),
      ts,
    );
    // Ambiguous handle pair → both full names, NO alias.
    await Deno.writeTextFile(join(dir, "x1000_dup.myc.md"), ts);
    await Deno.writeTextFile(join(dir, "x2000_dup.myc.md"), ts);
    // Non-executable (no typescript block) → excluded entirely.
    await Deno.writeTextFile(join(dir, "x3000_prose.myc.md"), "# words\n");

    const { map, skippedAmbiguous } = await buildImportMap(dir);
    const keys = Object.keys(map.imports);

    assert(keys.includes("x0888_skill.myc.md"));
    assertEquals(
      map.imports["skill.myc.md"],
      "http://myc.md/src/x0888_skill.myc.md",
    );
    assert(keys.includes("x7700_953391_claude_some-receipt.myc.md"));
    assert(!keys.includes("953391_claude_some-receipt.myc.md"));
    assert(keys.includes("x1000_dup.myc.md"));
    assert(keys.includes("x2000_dup.myc.md"));
    assert(!keys.includes("dup.myc.md"));
    assertEquals(skippedAmbiguous, ["dup.myc.md"]);
    assert(!keys.some((k) => k.includes("prose")));
    assertEquals(map.imports["myc.md/"], "http://myc.md/");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test('x0160 — end-to-end: bare `import "foo.myc.md"` resolves through map + proxy', async () => {
  const port = 18788;
  const abort = new AbortController();
  const proxyPromise = startProxy(port, abort.signal);
  await new Promise((r) => setTimeout(r, 50));

  const organName = "x9998_temp_bare_target.myc.md";
  const organPath = join(Deno.cwd(), "src", organName);
  const mapPath = join(Deno.cwd(), "src", ".tmp_bare_import_map.json");
  const callerPath = join(Deno.cwd(), "src", ".tmp_bare_caller.ts");
  try {
    await Deno.writeTextFile(
      organPath,
      '# Target\n```ts execution\nexport const bare = "resolved";\n```\n',
    );
    // Map the bare handle alias the generator would emit for this organ.
    await Deno.writeTextFile(
      mapPath,
      JSON.stringify({
        imports: {
          [organName]: `http://myc.md/src/${organName}`,
          "temp_bare_target.myc.md": `http://myc.md/src/${organName}`,
        },
      }),
    );
    await Deno.writeTextFile(
      callerPath,
      'import { bare } from "temp_bare_target.myc.md";\nconsole.log(bare);\n',
    );

    const child = await new Deno.Command("deno", {
      args: [
        "run",
        "--quiet",
        `--import-map=${mapPath}`,
        "--allow-import=myc.md:80",
        "--allow-net",
        callerPath,
      ],
      env: {
        HTTP_PROXY: `http://127.0.0.1:${port}`,
        DENO_DIR: await Deno.makeTempDir({ prefix: "imap_cache_" }),
      },
      stdout: "piped",
      stderr: "piped",
    }).output();

    const stdout = new TextDecoder().decode(child.stdout).trim();
    const stderr = new TextDecoder().decode(child.stderr).trim();
    assertEquals(child.code, 0, `child failed: ${stderr}`);
    assertEquals(stdout, "resolved");
  } finally {
    await Deno.remove(organPath).catch(() => {});
    await Deno.remove(mapPath).catch(() => {});
    await Deno.remove(callerPath).catch(() => {});
    abort.abort();
    await proxyPromise;
  }
});
