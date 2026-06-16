import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ageDays,
  isRuntimeCachePruneCandidate,
} from "./x8F00_external_surfaces_gen.ts";
import type { SurfaceEntry } from "./x8F10_external_surfaces_core.ts";

// Safety coverage for the `t external-surfaces --prune-stale-runtime` deletion
// gate. Each guard prevents a class of wrongful deletion; a regression risks
// data loss, and the CI diff-gate can't see it (prune is a separate path).

const NOW = Date.parse("2026-06-16T00:00:00Z");
const OLD = "2026-05-01T00:00:00Z"; // ~46 days before NOW

// A SurfaceEntry that SHOULD be prunable — vary one field per test to prove the
// corresponding guard holds.
const prunable = (over: Partial<SurfaceEntry> = {}): SurfaceEntry => ({
  surface: "src/x2F88_resolver_index.latest.myc.json",
  category: "local_cache",
  canonical_status: "runtime_cache",
  canonical_target: "",
  next_action: "ignore_runtime",
  blocked_by: "",
  size: 1234,
  mtime: OLD,
  ...over,
});

Deno.test("ageDays - explicit now; unknown/invalid → null; future → 0", () => {
  assertEquals(ageDays(OLD, NOW), 46);
  assertEquals(ageDays(undefined, NOW), null);
  assertEquals(ageDays("unknown", NOW), null);
  assertEquals(ageDays("not a date", NOW), null);
  assertEquals(ageDays("2026-07-01T00:00:00Z", NOW), 0); // future clamped
});

Deno.test("prune gate - a stale, untracked, src/ runtime cache IS a candidate", () => {
  const c = isRuntimeCachePruneCandidate(prunable(), new Set(), 7, NOW);
  assert(c !== null);
  assertEquals(c!.surface, "src/x2F88_resolver_index.latest.myc.json");
  assertEquals(c!.days_ago, 46);
  assertEquals(c!.size, 1234);
});

Deno.test("prune gate - too fresh (< minAgeDays) is spared", () => {
  const fresh = prunable({ mtime: "2026-06-15T00:00:00Z" }); // 1 day old
  assertEquals(isRuntimeCachePruneCandidate(fresh, new Set(), 7, NOW), null);
});

Deno.test("prune gate - git-tracked files are NEVER pruned", () => {
  const tracked = new Set(["src/x2F88_resolver_index.latest.myc.json"]);
  assertEquals(isRuntimeCachePruneCandidate(prunable(), tracked, 7, NOW), null);
});

Deno.test("prune gate - only paths under src/ with no traversal", () => {
  assertEquals(
    isRuntimeCachePruneCandidate(
      prunable({ surface: "docs/x.json" }),
      new Set(),
      7,
      NOW,
    ),
    null,
  );
  assertEquals(
    isRuntimeCachePruneCandidate(
      prunable({ surface: "src/../etc/passwd" }),
      new Set(),
      7,
      NOW,
    ),
    null,
  );
});

Deno.test("prune gate - only genuine runtime caches (category/status/next_action)", () => {
  assertEquals(
    isRuntimeCachePruneCandidate(
      prunable({ category: "canonical" as SurfaceEntry["category"] }),
      new Set(),
      7,
      NOW,
    ),
    null,
  );
  assertEquals(
    isRuntimeCachePruneCandidate(
      prunable({ canonical_status: "canonical" }),
      new Set(),
      7,
      NOW,
    ),
    null,
  );
  assertEquals(
    isRuntimeCachePruneCandidate(
      prunable({ next_action: "keep" }),
      new Set(),
      7,
      NOW,
    ),
    null,
  );
});
