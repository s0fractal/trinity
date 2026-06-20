import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { renderReadme, snapshotFromAgents } from "./x8850_readme_gen.ts";

Deno.test("README generator — derives a deterministic human brief from AGENTS receipt", () => {
  const agents = `<!-- source_manifest_hash: sha256:${"a".repeat(64)} -->
<!-- source_files: 3 -->
## Voice Resolution
| voice | handles | standing | profile | memory | roadmap |
|-------|---------|----------|---------|--------|---------|
| codex | codex | active | p | m | r |
## Commands
- command
- bucket 0: 2 organs → state
- bucket 8: 1 organs → state
`;
  const snapshot = snapshotFromAgents(agents);
  assertEquals(snapshot.sourceFiles, 3);
  assertEquals(snapshot.voices, 1);
  assertEquals(snapshot.buckets, [{ id: "0", organs: 2 }, {
    id: "8",
    organs: 1,
  }]);
  const one = renderReadme(snapshot);
  assertEquals(renderReadme(snapshot), one);
  assertEquals(one.includes("| Source organs | 3 |"), true);
});
