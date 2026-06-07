// src/x5520_run_literate.ts — run code blocks directly from markdown
// position: 5/52
// maturity: active
// skill_safe: yes-with-care

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
