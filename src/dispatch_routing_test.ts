import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  exists,
  POSITION_TO_FILE,
  positionToPath,
} from "./x0010_dispatch_runner.ts";
import { isDirectPosition } from "./x0100_dispatch.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Routing-table integrity + multi-char hex dispatch (audit 2026-06-20). The
// word→hex→file router was previously untested, which let a regression survive:
// the direct-position regex matched only SINGLE-char segments, so multi-char
// coordinates (5/C9, 2/F37, 4/F1) silently fell through to "unknown word" despite
// being real entries in POSITION_TO_FILE.

Deno.test("routing — production dispatcher accepts multi-char hex coordinates", () => {
  for (const pos of ["5/C", "5/C9", "2/F3", "2/F37", "4/F1", "4/011", "8/85"]) {
    assert(
      isDirectPosition(pos),
      `${pos} must dispatch as a direct position`,
    );
  }
  assert(
    isDirectPosition("0x5/C9"),
    "0x-prefixed direct positions must resolve",
  );
  // non-coordinates must NOT match (still resolve as words)
  for (const w of ["check", "status", "autonomy-demand", "5", ""]) {
    assert(!isDirectPosition(w), `${w} must not be treated as a position`);
  }
});

Deno.test("routing — every POSITION_TO_FILE entry resolves to a file that exists", async () => {
  const missing: string[] = [];
  for (const [pos, file] of Object.entries(POSITION_TO_FILE)) {
    const path = positionToPath(pos);
    assert(path.endsWith(file), `positionToPath(${pos}) should map to ${file}`);
    if (!(await exists(path))) missing.push(`${pos} → ${file}`);
  }
  assertEquals(missing, [], `dangling routes: ${missing.join(", ")}`);
});

Deno.test("routing — multi-char coordinates are present in the table (regression guard)", () => {
  // these are the coords the old single-char regex silently dropped
  for (const pos of ["5/C9", "4/F1", "2/F3"]) {
    assert(pos in POSITION_TO_FILE, `${pos} must be a registered route`);
  }
});
