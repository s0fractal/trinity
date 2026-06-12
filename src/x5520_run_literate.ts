// src/x5520_run_literate.ts — run code blocks directly from markdown
// position: 5/52
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "00 00 26 26 00 6C 00 33"
// placement_policy: axis
// (character: primary action_decision +0.85 — executes the document;
//  completion_frontier +0.40 — produces the run result; mirror_apex +0.30 —
//  doc→code extraction is reflection; triangle_build +0.30 — composes a
//  runnable module from blocks. Measured by claude-fable-5.)

import { extractCodeBlocks } from "./x0150_literate_parser.ts";
import { dirname } from "https://deno.land/std@0.224.0/path/mod.ts";

async function main() {
  const args = Deno.args;
  if (args.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message:
        "Usage: ./t run-literate <file.myc.md> [--allow-...] [arguments]",
    }));
    Deno.exit(1);
  }

  const file = args[0];
  // Separate Deno arguments from actual script arguments if needed, or pass them all
  const passThroughArgs = args.slice(1);

  try {
    const text = await Deno.readTextFile(file);
    const tsCode = extractCodeBlocks(text, "typescript");

    // Write the extracted module next to its source so its relative imports
    // (e.g. ./x0150_literate_parser.ts) resolve against the document's own dir.
    // makeTempFile gives a collision-free name and guaranteed cleanup.
    const tempFile = await Deno.makeTempFile({
      dir: dirname(file),
      prefix: ".myc_lit_",
      suffix: ".ts",
    });
    await Deno.writeTextFile(tempFile, tsCode);

    try {
      const proc = new Deno.Command("deno", {
        args: ["run", ...passThroughArgs, tempFile],
        stdout: "inherit",
        stderr: "inherit",
        stdin: "inherit",
      });
      const output = await proc.output();
      Deno.exit(output.code);
    } finally {
      await Deno.remove(tempFile).catch(() => {});
    }
  } catch (err: any) {
    console.error(`Error running literate file: ${err.message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
