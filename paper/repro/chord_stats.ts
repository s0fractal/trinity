// paper/repro/chord_stats.ts — every count in the paper's §6 tables, derived from the tree.
// Run: deno run --allow-read --allow-run chord_stats.ts [repoRoot=../..]
// Deterministic markdown to stdout; JSON alongside via --json=path.

import { gitHead, loadLedger } from "./lib_chords.ts";

const repoRoot = Deno.args.find((a) => !a.startsWith("--")) ?? "../..";
const jsonPath = Deno.args.find((a) => a.startsWith("--json="))?.slice(7);

const ledger = await loadLedger(repoRoot);
const head = await gitHead(repoRoot);

const byVoice = new Map<string, number>();
const bySlug = new Map<string, number>();
let signed = 0, withFalsifier = 0, corrections = 0;
for (const c of ledger) {
  byVoice.set(c.voice, (byVoice.get(c.voice) ?? 0) + 1);
  bySlug.set(c.voiceSlug, (bySlug.get(c.voiceSlug) ?? 0) + 1);
  if (c.signed) signed++;
  if (c.hasFalsifier) withFalsifier++;
  if (c.isCorrection) corrections++;
}

const sortDesc = (m: Map<string, number>) =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const stats = {
  commit: head,
  total_chords: ledger.length,
  signed,
  signed_pct: +(100 * signed / ledger.length).toFixed(1),
  falsifier_coverage_pct: +(100 * withFalsifier / ledger.length).toFixed(1),
  correction_events: corrections,
  by_voice: Object.fromEntries(sortDesc(byVoice)),
  by_filename_generation: Object.fromEntries(sortDesc(bySlug)),
};

console.log(`# chord ledger statistics @ ${head.slice(0, 12)}`);
console.log(`total chords: ${stats.total_chords}`);
console.log(`signed (content_sig): ${signed} (${stats.signed_pct}%)`);
console.log(
  `falsifier coverage: ${withFalsifier} (${stats.falsifier_coverage_pct}%)`,
);
console.log(`correction events: ${corrections}`);
console.log(`\n| voice | chords |\n| --- | ---: |`);
for (const [v, n] of sortDesc(byVoice)) console.log(`| ${v} | ${n} |`);
console.log(`\n| filename generation slug | chords |\n| --- | ---: |`);
for (const [v, n] of sortDesc(bySlug)) console.log(`| ${v} | ${n} |`);

if (jsonPath) {
  await Deno.writeTextFile(jsonPath, JSON.stringify(stats, null, 2) + "\n");
}
