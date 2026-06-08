import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  listChordSurfaceFiles,
  normalizeChordRef,
  ROOT,
} from "./x2F21_chord_surface.ts";

Deno.test("normalizeChordRef translates legacy reference to topological flat ID", () => {
  const ref = "../jazz/chords/2026-05-09T172600Z-gemini-myc-candidate-publication.md";
  const normalized = normalizeChordRef(ref);
  assertEquals(normalized, "x3000_t20260509172600_gemini_gemini-myc-candidate-publication");
});

Deno.test("normalizeChordRef preserves non-migrated ref", () => {
  const ref = "non-existent-chord";
  const normalized = normalizeChordRef(ref);
  assertEquals(normalized, "non-existent-chord");
});

Deno.test("listChordSurfaceFiles dedupes legacy when topological counterpart exists", async () => {
  const legacyDir = join(ROOT, "jazz", "chords");
  const testLegacyFile = join(legacyDir, "2026-05-09T172600Z-gemini-myc-candidate-publication.md");
  
  let createdDir = false;
  try {
    try {
      await Deno.mkdir(legacyDir, { recursive: true });
      createdDir = true;
    } catch (e) {
      if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
    }

    await Deno.writeTextFile(testLegacyFile, "---\ntype: chord.proposal\n---\n");

    const files = await listChordSurfaceFiles();
    const hasLegacy = files.some(
      (f) => f.relPath === "jazz/chords/2026-05-09T172600Z-gemini-myc-candidate-publication.md"
    );
    
    // It should be filtered out because the topological counterpart
    // (src/x3000_t20260509172600_gemini_gemini-myc-candidate-publication.myc.md) is present in src/
    assertEquals(hasLegacy, false, "Legacy chord should have been deduped.");
  } finally {
    try {
      await Deno.remove(testLegacyFile);
    } catch { /* ignore */ }
    if (createdDir) {
      try {
        await Deno.remove(legacyDir);
      } catch { /* ignore */ }
    }
  }
});
