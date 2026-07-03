// paper/repro/hears_graph.ts — the hears-graph statistics in the paper's §6, derived from the tree.
// Run: deno run --allow-read --allow-run hears_graph.ts [repoRoot=../..]
// Nodes: chords in the ledger. Edges: chord --hears--> referenced stem.
// Edges to stems outside the ledger (other substrates, deleted files) are counted as dangling.

import { gitHead, loadLedger } from "./lib_chords.ts";

const repoRoot = Deno.args.find((a) => !a.startsWith("--")) ?? "../..";
const jsonPath = Deno.args.find((a) => a.startsWith("--json="))?.slice(7);

const ledger = await loadLedger(repoRoot);
const head = await gitHead(repoRoot);
const byStem = new Map(ledger.map((c) => [c.stem, c]));

let edges = 0, dangling = 0, crossVoice = 0;
const inDeg = new Map<string, number>();
const outDeg = new Map<string, number>();
for (const c of ledger) {
  for (const ref of c.hears) {
    edges++;
    outDeg.set(c.stem, (outDeg.get(c.stem) ?? 0) + 1);
    const target = byStem.get(ref);
    if (!target) {
      dangling++;
      continue;
    }
    inDeg.set(ref, (inDeg.get(ref) ?? 0) + 1);
    if (target.voice !== c.voice) crossVoice++;
  }
}

const nodesWithEdges = new Set([...inDeg.keys(), ...outDeg.keys()]).size;
const resolved = edges - dangling;
const top = ledger
  .map((c) => ({
    stem: c.stem,
    voice: c.voice,
    in: inDeg.get(c.stem) ?? 0,
    out: outDeg.get(c.stem) ?? 0,
  }))
  .filter((n) => n.in + n.out > 0)
  .sort((a, b) =>
    (b.in + b.out) - (a.in + a.out) || a.stem.localeCompare(b.stem)
  )
  .slice(0, 20);

const stats = {
  commit: head,
  nodes_total: ledger.length,
  nodes_with_hears_edges: nodesWithEdges,
  edges_total: edges,
  edges_resolved: resolved,
  edges_dangling: dangling,
  cross_voice_edges: crossVoice,
  cross_voice_pct_of_resolved: resolved
    ? +(100 * crossVoice / resolved).toFixed(1)
    : 0,
  max_in_degree: Math.max(0, ...inDeg.values()),
  max_out_degree: Math.max(0, ...outDeg.values()),
  mean_out_degree_all_nodes: +(edges / ledger.length).toFixed(2),
  top20_by_degree: top,
};

console.log(`# hears-graph statistics @ ${head.slice(0, 12)}`);
for (const [k, v] of Object.entries(stats)) {
  if (k === "top20_by_degree" || k === "commit") continue;
  console.log(`${k}: ${v}`);
}
console.log(
  `\n| top-20 chord by degree | voice | in | out |\n| --- | --- | ---: | ---: |`,
);
for (const n of top) {
  console.log(`| ${n.stem} | ${n.voice} | ${n.in} | ${n.out} |`);
}
console.log(
  `\n(degree = in+out over resolved hears edges; ties broken lexicographically)`,
);

if (jsonPath) {
  await Deno.writeTextFile(jsonPath, JSON.stringify(stats, null, 2) + "\n");
}
