#!/usr/bin/env -S deno run --allow-all
// src/x5C00_cross_verify.ts — cross-verify compatibility wrapper
// position: 5/C → action(5) × container/cycle(C)
// hex_dipole: "00 00 40 00 66 6C 59 00"
//   mirror_apex+0.50 (compatibility reflection)
//   foundation_container+0.80 (container of substrate mappings)
//   action_decision+0.85 (runs the verification map)
//   harmony_emergence+0.70 (joins substrate receipts)
//   primary axis: action (5) ← bucket MATCH
// lifecycle_phase: 1
// placement_policy: axis
//
// Compatibility surface for the old `cross-verify` word.
//
// The old implementation duplicated the cross-substrate runner that now lives
// in the functional `all` primitive (0x0/03.ts). This file intentionally
// remains small: it translates legacy arguments into `all 5/C` and lets that
// organ do map + join over glossary type:06 substrate mappings.
//
// Usage:
//   t cross-verify
//   t cross-verify myc
//   t cross-verify --deep
//
// New code should prefer:
//   t all 5/C
//   t all 5/C --only myc
//   t all 5/C --deep omega

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const ALL = join(ROOT, "src", "x0300_all.ts");

function translateArgs(args: string[]): string[] {
  const translated = ["5/C"];
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--deep") {
      const maybeSubstrate = args[i + 1];
      translated.push(
        "--deep",
        maybeSubstrate && !maybeSubstrate.startsWith("--")
          ? maybeSubstrate
          : "omega",
      );
      if (maybeSubstrate && !maybeSubstrate.startsWith("--")) i++;
      continue;
    }
    positional.push(arg);
  }

  if (positional.length > 0) {
    translated.push("--only", positional[0]);
  }

  return translated;
}

if (import.meta.main) {
  const command = new Deno.Command("deno", {
    args: ["run", "--allow-all", ALL, ...translateArgs(Deno.args)],
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  await Deno.stdout.write(output.stdout);
  await Deno.stderr.write(output.stderr);
  Deno.exit(output.code);
}
