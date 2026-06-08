import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { readProbe } from "./x8E00_probes_gen.ts";

const PROBES_DIR = new URL("../probes", import.meta.url).pathname;

Deno.test("probes_gen — parses declarative frontmatter from README", async () => {
  const testDir = join(PROBES_DIR, "temp-test-frontmatter-probe");
  try {
    await Deno.mkdir(testDir, { recursive: true });
    await Deno.writeTextFile(
      join(testDir, "README.md"),
      `---
status: graduated
graduation_target: src/x9999_fake_graduation.ts
graduation_date: 2026-06-08
---
# Temp Test Probe
`
    );

    const rec = await readProbe("temp-test-frontmatter-probe", new Set(), []);
    assertNotEquals(rec, null);
    assertEquals(rec!.status, "graduated");
    assertEquals(rec!.target, "src/x9999_fake_graduation.ts");
    assertEquals(rec!.graduation_date, "2026-06-08");
  } finally {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch { /* ignore clean up error */ }
  }
});

Deno.test("probes_gen — frontmatter status overrides regular banners", async () => {
  const testDir = join(PROBES_DIR, "temp-test-override-probe");
  try {
    await Deno.mkdir(testDir, { recursive: true });
    await Deno.writeTextFile(
      join(testDir, "README.md"),
      `---
status: deferred
graduation_target: src/x8888_override.ts
---
> **Status: graduated 2026-05-19 -> src/x1111_stale.ts**
# Temp Test Probe
`
    );

    const rec = await readProbe("temp-test-override-probe", new Set(), []);
    assertNotEquals(rec, null);
    // frontmatter status (deferred) overrides regular body status (graduated)
    assertEquals(rec!.status, "deferred");
    assertEquals(rec!.target, "src/x8888_override.ts");
  } finally {
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch { /* ignore clean up error */ }
  }
});
