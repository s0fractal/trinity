import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { renderReleaseCheck } from "./x2200_ecosystem.ts";

Deno.test("renderReleaseCheck - NOT READY when any substrate is dirty or non-green", () => {
  const out = renderReleaseCheck({
    type: "ecosystem_release_check",
    action: "release_check",
    overall_ready: false,
    law_hash: "0x30a95260",
    warnings: [],
    substrates: [
      { substrate: "trinity", ci: "green", worktree: "dirty", ready: false },
      { substrate: "liquid", ci: "green", worktree: "clean", ready: true },
      { substrate: "omega", ci: "stale", worktree: "clean", ready: false },
    ],
  }).join("\n");
  assert(out.includes("NOT READY"));
  assert(out.includes("0x30a95260"));
  assert(out.includes("trinity") && out.includes("worktree=dirty"));
  assert(out.includes("warnings: none"));
});

Deno.test("renderReleaseCheck - READY surfaces a clean verdict; warnings are listed", () => {
  const ready = renderReleaseCheck({
    type: "ecosystem_release_check",
    action: "release_check",
    overall_ready: true,
    law_hash: "0x30a95260",
    warnings: [],
    substrates: [
      { substrate: "trinity", ci: "green", worktree: "clean", ready: true },
    ],
  }).join("\n");
  assert(ready.includes("✅ READY"));

  const warned = renderReleaseCheck({
    type: "ecosystem_release_check",
    action: "release_check",
    overall_ready: false,
    law_hash: null,
    warnings: ["Warning: something ambient"],
    substrates: [
      { substrate: "trinity", ci: "green", worktree: "clean", ready: true },
    ],
  }).join("\n");
  assert(warned.includes("1 warning(s)"));
  assert(warned.includes("something ambient"));
});
