#!/usr/bin/env -S deno run --allow-all
// src/x5910_compost_watchdog.ts — compost watchdog (archive sunset draft contracts)
// position: 5/91 → action(5) × penultimate(9) = act-to-prevent-close / clear out stale drafts
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 4C 33 26 33 6C 26 26"
//   axis 5 action_decision +0.85 (PRIMARY: decision/action to archive/compost)
//   axis 1 first_penultimate +0.60 (secondary: hex 9 = axis 1 neg pole; sunset clearance)
//   bucket 5/9: primary axis action (5), bucket 5 ← MATCH on axis 5
//               secondary '9' → axis 1 penultimate-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m (antigravity alignment)
// lifecycle_phase: 1
// placement_policy: axis
//
// compost-watchdog — archive/compost past-sunset draft contracts to src/ as palimpsests
//
// Usage:
//   t compost-watchdog [--write]
//
// Glossary words: compost-watchdog, compost, компост, watchdog, compost_watchdog

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { blockOfEpochSec } from "./x0014_blocktime.ts";
import { listContracts } from "./x4F00_contracts.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const CONTRACTS_DIR = join(ROOT, "contracts");
const CHORDS_DIR = join(ROOT, "src");

async function findUniqueCompostPath(filename: string): Promise<string> {
  const cleanBase = filename.replace(/\.md$/, "").replace(
    /[^a-zA-Z0-9_.-]/g,
    "_",
  );
  let idx = 0;
  while (true) {
    const destName = `x48F${
      idx.toString(16).toUpperCase()
    }_contract_${cleanBase}_palimpsest.myc.md`;
    const destPath = join(ROOT, "src", destName);
    try {
      await Deno.stat(destPath);
      // exists, try next
      idx++;
    } catch {
      // free
      return destPath;
    }
  }
}

function getBlockHeight(): number {
  return blockOfEpochSec(Math.floor(Date.now() / 1000));
}

async function runCommand(args: string[]): Promise<boolean> {
  const proc = new Deno.Command(args[0], {
    args: args.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const out = await proc.output();
  return out.code === 0;
}

async function main() {
  const args = Deno.args;
  const write = args.includes("--write");
  const dryRun = !write;

  const contracts = await listContracts();
  const eligible = contracts.filter((c) => {
    // Safety Assertions: Double check status constraints
    if (c.status !== "draft") return false;
    if (c.sunset_status !== "past-sunset") return false;
    if (c.pinned) return false;
    if (c.load_bearing) return false;
    return true;
  });

  const composted: string[] = [];
  const errors: string[] = [];

  if (eligible.length > 0) {
    if (write) {
      for (const c of eligible) {
        const srcPath = join(CONTRACTS_DIR, c.filename);
        const destPath = await findUniqueCompostPath(c.filename);
        const destFilename = destPath.replace(join(ROOT, "src") + "/", "");
        try {
          await Deno.rename(srcPath, destPath);
          composted.push(`${c.filename} -> src/${destFilename}`);
        } catch (e) {
          errors.push(`Failed to move ${c.filename}: ${(e as Error).message}`);
        }
      }

      if (composted.length > 0) {
        // Generate receipt chord
        const block = getBlockHeight();
        const chordFilename =
          `x2600_${block}_antigravity_compost-receipt.myc.md`;
        const chordPath = join(CHORDS_DIR, chordFilename);

        const chordContent = `---
type: chord.receipt
voice: antigravity
mode: receipt
created: ${new Date().toISOString()}
bitcoin_block_height: ${block}
notes: automatically archived past-sunset draft contracts to clean active namespace
topic: compost-watchdog-cleanup
stance: COMPOST
closes: []
references:
${eligible.map((c) => `  - contracts/${c.filename}`).join("\n")}
---

# Compost Receipt: Retired past-sunset draft contracts

The Compost Watchdog (\`x5910_compost_watchdog.ts\`) automatically archived the following expired draft contracts as palimpsests in \`src/\`:

${composted.map((item) => `- \`contracts/${item}\``).join("\n")}

These files have been moved to the \`src/\` directory to clear them from active cataloging. They can be restored or referenced as palimpsests.
`;
        await Deno.writeTextFile(chordPath, chordContent);

        // Regenerate roadmap and skills and external surfaces
        await runCommand([
          "deno",
          "run",
          "--allow-all",
          join(HERE, "x8D00_roadmap_gen.ts"),
          "--stable",
        ]);
        await runCommand([
          "deno",
          "run",
          "--allow-all",
          join(HERE, "x8C00_skill_gen.ts"),
          "--stable",
        ]);
        await runCommand([
          "deno",
          "run",
          "--allow-all",
          join(HERE, "x8F00_external_surfaces_gen.ts"),
          "--stable",
        ]);
      }
    } else {
      for (const c of eligible) {
        composted.push(c.filename);
      }
    }
  }

  const result = {
    type: "compost_watchdog",
    position: "5/91",
    action: "compost",
    dry_run: dryRun,
    note: dryRun
      ? `dry run: would compost ${composted.length} draft contracts`
      : `archived ${composted.length} past-sunset draft contracts as src/ palimpsests`,
    composted_count: composted.length,
    composted_files: composted,
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.main) {
  await main();
}
