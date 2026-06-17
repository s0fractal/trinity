#!/usr/bin/env -S deno run -A
// src/x4300_scaffold.ts — scaffold a new ORGAN skeleton from the substrate's own
// conventions, so a digital organism doesn't reverse-engineer them from 8 files.
// position: 4/3 → foundation(4) × triangle(3) = the foundational build primitive
//   (the empty, correct form a new organ grows from)
// maturity: active
// skill_safe: yes-with-care
//   with --write it creates TWO new files (the organ + its test); it NEVER edits
//   the shared, gated files (glossary, route table, deno.jsonc) — those it emits
//   as a copy-paste block for the author to apply and then verify with `t check`.
// hex_dipole: "00 00 00 33 59 00 00 00"
//   cardinal_foundation+0.70 (PRIMARY: lays the foundational ground a new organ
//   grows from; axis 4 — MATCH bucket 4)
//   triangle_build+0.40 (secondary: the act of constructing the skeleton)
// placement_policy: axis
// horizon: none (v0 scaffolds organs; chord scaffolding lives in `t chord init`)
// skill_tag: scaffold
//
// intent: close review x6d00_954112 A5 — the grow-loop's hardest step is BIRTHING
//   a new organ, because the conventions (coordinate-addressed filename, the 7
//   header fields, a dipole whose strongest axis matches the bucket, the glossary
//   word→position entry, the POSITION_TO_FILE route, the deno.jsonc task, a test)
//   are implicit and spread across the codebase. This generates the correct
//   skeleton + emits the exact wiring lines. The emitted route key is a candidate
//   the `t check` route gate (A3) then verifies — scaffold proposes, check confirms.
//
// Usage:
//   t scaffold organ <coord> <handle>     dry preview (organ + test + wiring)
//   t scaffold organ <coord> <handle> --write   write the 2 new files
//   t scaffold organ <coord> <handle> --json    machine-readable plan
//   (coord = 4 hex, e.g. 4300; handle = snake_case, e.g. my_organ)

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
// bucket-0 library — universally importable; used to detect a route collision.
import { POSITION_TO_FILE } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));

const AXES = [
  "void_infinity",
  "first_penultimate",
  "mirror_apex",
  "triangle_build",
  "cardinal_foundation",
  "action_decision",
  "harmony_emergence",
  "completion_frontier",
];

/** Derive the canonical "N/M" route-key candidate from a 4-hex coord by stripping
 *  trailing zeros off the 3-char remainder (bucket 4 → "300" → "3" → "4/3"). The
 *  convention is irregular across buckets (bucket 0 uses 2-digit subs like "01"),
 *  so this is a CANDIDATE — the `t check` route gate confirms the real key once
 *  wired. Returns null if coord isn't exactly 4 hex digits. */
export function candidateRouteKey(coord: string): string | null {
  if (!/^[0-9a-fA-F]{4}$/.test(coord)) return null;
  const c = coord.toUpperCase();
  const bucket = c[0];
  let rest = c.slice(1).replace(/0+$/, "");
  if (rest === "") rest = "0"; // a pure xN000 organ → "N/0"
  return `${bucket}/${rest}`;
}

/** A minimal valid hex_dipole: the strongest axis is the one the audit requires
 *  to match the bucket (axis index = bucket mod 8), set to +0.70 (0x59), zeros
 *  elsewhere. So a scaffolded organ passes the dipole-axis-match audit out of the
 *  box; the author then shapes the real vector with `t chord translate`. */
export function starterDipole(bucket: number): string {
  const bytes = Array(8).fill("00");
  bytes[bucket % 8] = "59";
  return bytes.join(" ");
}

function organSkeleton(
  coord: string,
  handle: string,
  pos: string,
  bucket: number,
): string {
  const dipole = starterDipole(bucket);
  const axis = AXES[bucket % 8];
  return `#!/usr/bin/env -S deno run -A
// src/x${coord}_${handle}.ts — TODO one-line purpose
// position: ${pos} → TODO archetype reading (bucket ${bucket})
// maturity: draft
// skill_safe: yes-readonly
// hex_dipole: "${dipole}"
//   ${axis}+0.70 (PRIMARY placeholder — set the real vector with \`t chord translate\`;
//   the strongest axis must stay axis ${
    bucket % 8
  } to match bucket ${bucket} in the audit)
// placement_policy: axis
// horizon: none
// skill_tag: ${handle}
//
// intent: TODO — what footgun/friction does this organ remove? what does it
//   read, and what receipt does it emit?
//
// Usage:
//   t ${handle} [--json]

interface Receipt {
  type: string;
  position: string;
  action: string;
}

function build(): Receipt {
  return { type: "${handle}", position: "${pos}", action: "${handle}" };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const r = build();
  if (wantJson) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(\`# ${handle} @ ${pos}\`);
    console.log(JSON.stringify(r, null, 2));
  }
}
`;
}

function testSkeleton(coord: string, handle: string): string {
  return `import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
// import the PURE functions from src/x${coord}_${handle}.ts and test them here.
// (organs export their deterministic core; main() stays a thin shell.)

Deno.test("${handle} - TODO replace with a real assertion", () => {
  assertEquals(1 + 1, 2);
});
`;
}

interface Plan {
  type: "scaffold";
  kind: "organ";
  coord: string;
  handle: string;
  candidate_position: string;
  bucket: number;
  organ_file: string;
  test_file: string;
  route_collision: string | null;
  wiring: {
    glossary_ndjson_line: string;
    position_to_file_entry: string;
    deno_task_line: string;
  };
  written: boolean;
  next: string;
}

if (import.meta.main) {
  const args = Deno.args;
  const sub = args[0];
  const wantJson = args.includes("--json");
  const write = args.includes("--write");
  const positional = args.filter((a) => !a.startsWith("--"));

  if (sub !== "organ") {
    console.log("# scaffold @ 4/3");
    console.log("usage: t scaffold organ <coord> <handle> [--write] [--json]");
    console.log(
      "  (chord scaffolding lives in `t chord init` / `t chord receipt`)",
    );
    Deno.exit(sub ? 1 : 0);
  }

  const coordRaw = positional[1] ?? "";
  const handle = positional[2] ?? "";
  const coord = coordRaw.toUpperCase();
  const pos = candidateRouteKey(coord);

  if (!pos || !/^[a-z][a-z0-9_]*$/.test(handle)) {
    console.log("# scaffold @ 4/3 — ⛔ invalid input");
    if (!pos) {
      console.log(`#   coord must be exactly 4 hex digits (got "${coordRaw}")`);
    }
    if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
      console.log(`#   handle must be snake_case (got "${handle}")`);
    }
    Deno.exit(1);
  }

  const bucket = parseInt(coord[0], 16);
  const organFile = `src/x${coord}_${handle}.ts`;
  const testFile = `src/${handle}_test.ts`;
  const collision = POSITION_TO_FILE[pos] ?? null;

  const plan: Plan = {
    type: "scaffold",
    kind: "organ",
    coord,
    handle,
    candidate_position: pos,
    bucket,
    organ_file: organFile,
    test_file: testFile,
    route_collision: collision,
    wiring: {
      glossary_ndjson_line: JSON.stringify({
        "00": "5",
        "02": [handle],
        "04": pos,
        "09": "TODO one-line description (shown in `t skill` / lexicon)",
        "11": starterDipole(bucket),
      }),
      position_to_file_entry: `  "${pos}": "x${coord}_${handle}.ts",`,
      deno_task_line:
        `    "${handle}": "deno run -A src/x${coord}_${handle}.ts",`,
    },
    written: false,
    next:
      "add the 3 wiring lines (glossary / x0010 POSITION_TO_FILE / deno.jsonc), then run `t check` — the route gate confirms the position resolves.",
  };

  const organText = organSkeleton(coord, handle, pos, bucket);
  const testText = testSkeleton(coord, handle);

  if (write) {
    const organPath = join(HERE, `x${coord}_${handle}.ts`);
    const testPath = join(HERE, `${handle}_test.ts`);
    let exists = false;
    try {
      await Deno.stat(organPath);
      exists = true;
    } catch { /* good — does not exist */ }
    if (exists) {
      console.log(
        `# scaffold @ 4/3 — ⛔ ${organFile} already exists; not overwriting`,
      );
      Deno.exit(1);
    }
    await Deno.writeTextFile(organPath, organText);
    await Deno.writeTextFile(testPath, testText);
    plan.written = true;
  }

  if (wantJson) {
    console.log(JSON.stringify(plan, null, 2));
    Deno.exit(0);
  }

  console.log(`# scaffold @ 4/3 — organ x${coord}_${handle} (${pos})`);
  if (collision) {
    console.log(
      `#   ⚠ route ${pos} already maps to ${collision} — pick another coord`,
    );
  }
  console.log(
    plan.written
      ? `#   ✅ wrote ${organFile}`
      : `#   (dry) would write ${organFile}`,
  );
  console.log(
    plan.written
      ? `#   ✅ wrote ${testFile}`
      : `#   (dry) would write ${testFile}`,
  );
  console.log("#");
  console.log("# add these 3 wiring lines, then run `t check`:");
  console.log(`#   1. src/x0001_glossary.ndjson (a new line):`);
  console.log(`      ${plan.wiring.glossary_ndjson_line}`);
  console.log(`#   2. src/x0010_dispatch_runner.ts (in POSITION_TO_FILE):`);
  console.log(`    ${plan.wiring.position_to_file_entry}`);
  console.log(`#   3. deno.jsonc (in tasks):`);
  console.log(`    ${plan.wiring.deno_task_line}`);
  if (!plan.written) {
    console.log("#\n# re-run with --write to create the 2 files.");
  }
}
