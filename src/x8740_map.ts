#!/usr/bin/env -S deno run -A
// src/x8740_map.ts — render the live mycelium as a navigable 3D graph for humans
// position: 8/74 → void_infinity(8) × ... = reach across the whole namespace and
//   project it onto a human-perceivable space (the "membrane made visible")
// maturity: prototype
// skill_safe: yes-readonly
// hex_dipole: "59 00 00 00 00 00 00 00"
//   void_infinity+0.70 (PRIMARY: reaches across the whole namespace to render it;
//   bucket 8 = axis 0 strongest, audit-aligned)
// placement_policy: axis
// horizon: none
// skill_tag: map
//
// intent: the namespace is a graph the machine holds whole, but a human cannot.
//   This projects it onto perceptual channels (position / colour / size) and lets
//   a person TRAVERSE it — force-layout ↔ згортка-tree, colour by coordinate
//   (xRRGGBB preview) / voice / octet, search. A prototype to LOOK at; the form is
//   still emerging. Reads chords only; the HTML output is gitignored (writes
//   nothing into the substrate).
//
// Usage:
//   t map             write mycelium-map.html (gitignored) + print its path
//   t map --stdout    emit the self-contained HTML to stdout
//   t map --insights  print the graph's findings as text (hubs + governance loop)

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";

export interface Chord {
  name: string;
  content: string;
}
export interface Payload {
  leaves: Record<string, unknown>[];
  groups: Record<string, unknown>[];
  ledger: Record<string, unknown>[];
  semantic: { source: string; target: string }[];
  tree: { source: string; target: string }[];
}

function listItems(fm: string, key: string): string[] {
  const m = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s.*\\n?)+)`, "m"));
  if (!m) return [];
  return [...m[1].matchAll(/^\s+-\s+(.+?)\s*$/gm)].map((x) => x[1].trim());
}

/** Parse the ```json myc``` descriptor block of a ledger artifact (proposal /
 *  resolution). Returns the parsed object, or null if absent/malformed. */
function jsonBlock(content: string): Record<string, unknown> | null {
  const m = content.match(/```json myc\s*\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Pure: fold chord names into the згортка tree + extract citation edges. Exported
 *  for the test — no file I/O, so a fixture array exercises the whole projection. */
export function buildGraph(
  chords: Chord[],
  proposals: Chord[] = [],
  resolutions: Chord[] = [],
): Payload {
  const stems = new Set(chords.map((c) => c.name.replace(/\.myc\.md$/, "")));
  const resolve = (tok: string): string | null => {
    const t = tok.replace(/\.myc\.md$/, "").replace(/^.*\//, "").trim();
    if (stems.has(t)) return t;
    for (const s of stems) if (s.startsWith(t) || t.startsWith(s)) return s;
    return null;
  };
  type Leaf = {
    id: string;
    topic: string;
    coord: string;
    bucket: string;
    voice: string;
    deg: number;
  };
  const leaves = new Map<string, Leaf>();
  const semKey = new Set<string>();
  const semantic: { source: string; target: string }[] = [];
  for (const c of chords) {
    const stem = c.name.replace(/\.myc\.md$/, "");
    const fm = c.content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const coord = (stem.match(/^x([0-9A-Fa-f]{4})/)?.[1] ?? "0000")
      .toLowerCase();
    const voice = (stem.match(/^x[0-9A-Fa-f]+_[^_]+_([a-z0-9-]+)_/)?.[1] ??
      fm.match(/voice:\s*"?([a-z0-9-]+)/i)?.[1] ?? "?").split("-")[0];
    const topic = fm.match(/topic:\s*(.+)/)?.[1]?.trim() ?? stem;
    if (!leaves.has(stem)) {
      leaves.set(stem, {
        id: stem,
        topic,
        coord,
        bucket: coord[0],
        voice,
        deg: 0,
      });
    }
    const closes = fm.match(/path_hint:\s*(\S+)/)?.[1];
    for (
      const tok of [
        ...listItems(fm, "hears"),
        ...(closes ? [closes] : []),
        ...listItems(fm, "references"),
      ]
    ) {
      const tgt = resolve(tok);
      if (!tgt || tgt === stem) continue;
      const k = stem + "|" + tgt;
      if (semKey.has(k)) continue;
      semKey.add(k);
      semantic.push({ source: stem, target: tgt });
    }
  }
  for (const l of semantic) {
    const a = leaves.get(l.source);
    if (a) a.deg++;
    const b = leaves.get(l.target);
    if (b) b.deg++;
  }
  // згортка: root → octet bucket → coordinate → voice → leaf (implicit group nodes
  // exist only because the names imply them — no separate file)
  const groups = new Map<
    string,
    { id: string; label: string; level: string; val: number }
  >();
  const grp = (id: string, label: string, level: string, val: number) => {
    if (!groups.has(id)) groups.set(id, { id, label, level, val });
    return id;
  };
  grp("^root", "myc.md", "root", 8);
  const treeSeen = new Set<string>();
  const tree: { source: string; target: string }[] = [];
  const edge = (s: string, t: string) => {
    const k = s + "|" + t;
    if (!treeSeen.has(k)) {
      treeSeen.add(k);
      tree.push({ source: s, target: t });
    }
  };
  for (const lf of leaves.values()) {
    const b = grp("^b" + lf.bucket, "x" + lf.bucket + "···", "bucket", 5);
    const c = grp("^c" + lf.coord, "x" + lf.coord, "coord", 3);
    const v = grp("^v" + lf.coord + lf.voice, lf.voice, "voice", 2);
    edge("^root", b);
    edge(b, c);
    edge(c, v);
    edge(v, lf.id);
  }
  const leafArr = [...leaves.values()].map((l) => ({
    id: l.id,
    label: l.id,
    topic: l.topic,
    coord: l.coord,
    bucket: l.bucket,
    voice: l.voice,
    val: 1 + Math.sqrt(l.deg) * 1.8,
    leaf: true,
  }));
  const groupArr = [...groups.values()].map((x) => ({
    id: x.id,
    label: x.label,
    level: x.level,
    val: x.val,
    leaf: false,
  }));

  // antigravity Proposal 1 (x3300_955041): weave the MYC ledger into the graph —
  // proposals as state-coloured nodes, cross-linked to the chords that JUSTIFY
  // them (resolution evidence) and CITE them (references). So the map unifies
  // "what was written" with "what was ratified". Coarse state from resolution
  // outcomes — not the full x3F00 finality, which the viewer doesn't need.
  const TERMINAL = new Set(["rejected", "superseded", "withdrawn", "expired"]);
  const ledger: Record<string, unknown>[] = [];
  const byCommit = new Map<string, Record<string, unknown>>();
  const byFqdn = new Map<string, string>();
  const xlink = (s: string, t: string) => {
    const k = s + "|" + t;
    if (!semKey.has(k)) {
      semKey.add(k);
      semantic.push({ source: s, target: t });
    }
  };
  for (const pr of proposals) {
    const d = jsonBlock(pr.content);
    if (!d) continue;
    const fqdn = (d.fqdn as string) ?? pr.name;
    const commit = (d.commitment as { value?: string } | undefined)?.value;
    const body = d.body as { proposal?: string } | undefined;
    const node: Record<string, unknown> = {
      id: "P|" + fqdn,
      label: fqdn,
      topic: String(body?.proposal ?? "").slice(0, 90),
      kind: "proposal",
      state: "proposed",
      val: 4,
      ledger: true,
      leaf: false,
    };
    ledger.push(node);
    byFqdn.set(fqdn, "P|" + fqdn);
    if (commit) byCommit.set(commit, node);
  }
  for (const rs of resolutions) {
    const d = jsonBlock(rs.content);
    if (!d) continue;
    const body = d.body as {
      outcome?: string;
      proposal_commitment?: string;
      evidence_refs?: { kind?: string; ref?: string }[];
    } | undefined;
    const node = body?.proposal_commitment
      ? byCommit.get(body.proposal_commitment)
      : undefined;
    if (!node) continue;
    if (body?.outcome === "implemented") node.state = "implemented";
    else if (
      body?.outcome && TERMINAL.has(body.outcome) &&
      node.state !== "implemented"
    ) node.state = "terminal";
    for (const e of body?.evidence_refs ?? []) {
      if (e.kind === "chord" && e.ref) {
        const tgt = resolve(e.ref);
        if (tgt) xlink(node.id as string, tgt); // proposal → evidence chord
      } else if (e.kind === "proposal" && e.ref && byFqdn.has(e.ref)) {
        xlink(node.id as string, byFqdn.get(e.ref)!); // superseded → successor (lineage)
      }
    }
  }
  for (const c of chords) {
    const stem = c.name.replace(/\.myc\.md$/, "");
    const fm = c.content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    for (
      const ref of [...listItems(fm, "references"), ...listItems(fm, "hears")]
    ) {
      const id = byFqdn.get(ref.replace(/^.*\//, "").trim());
      if (id) xlink(stem, id); // chord → proposal it cites
    }
  }

  return { leaves: leafArr, groups: groupArr, ledger, semantic, tree };
}

function renderHtml(p: Payload): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>mycelium — living map</title>
<style>
 body{margin:0;background:#05060a;color:#9fb;font:13px/1.4 ui-monospace,monospace;overflow:hidden}
 #graph{position:fixed;inset:0}
 #ui{position:fixed;top:10px;left:12px;z-index:10;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
 .grp{background:#0b0f18cc;border:1px solid #1c2738;border-radius:7px;padding:5px 8px}
 .grp b{color:#cfe} button{background:#13202e;color:#9cf;border:1px solid #244;border-radius:5px;padding:3px 8px;cursor:pointer;font:inherit}
 button.on{background:#2a4a66;color:#dff;border-color:#5af}
 input{background:#0b0f18;border:1px solid #244;color:#cfe;border-radius:5px;padding:3px 7px;font:inherit;width:170px}
 #info{position:fixed;bottom:10px;left:12px;right:12px;z-index:10;color:#9cd;white-space:pre-wrap;
   max-height:24vh;overflow:auto;background:#0b0f18dd;padding:8px 10px;border-radius:7px;display:none;border:1px solid #1c2738}
 #legend{position:fixed;top:10px;right:12px;z-index:10;color:#789;font-size:11px;text-align:right;background:#0b0f18aa;padding:4px 8px;border-radius:6px}
</style></head><body>
<div id="ui">
 <div class="grp"><b>розкладка</b> <button id="L-force" class="on">сила</button><button id="L-tree">згортка</button></div>
 <div class="grp"><b>колір</b> <button id="C-coord" class="on">координата</button><button id="C-voice">голос</button><button id="C-bucket">октет</button></div>
 <div class="grp"><input id="q" placeholder="пошук вузла…"></div>
</div>
<div id="legend"></div>
<div id="info"></div>
<div id="graph"></div>
<script src="https://unpkg.com/3d-force-graph"></script>
<script>
const P = ${JSON.stringify(p)};
const VOICE = {claude:'#4fc3f7',codex:'#81c784',gemini:'#ba68c8',antigravity:'#ffb74d',kimi:'#f06292',s0fractal:'#fff176',fable:'#a1887f','?':'#607d8b'};
// the substrate's 8-axis dipole language as a colour WHEEL; mirror pairs (N↔N+8) share the hue, darker
const OCTET = ['void∞','first·penult','mirror·apex','triangle','foundation','action','harmony','completion'];
function coordColor(n){ if(!n.leaf) return '#33425a'; const c=n.coord||'0000'; return '#'+c.slice(0,2)+c.slice(2,4)+'a0'; }
function voiceColor(n){ if(!n.leaf) return '#33425a'; return VOICE[n.voice]||'#607d8b'; }
function octetColor(n){ if(!n.leaf) return '#33425a'; const b=parseInt(n.bucket||'0',16); return 'hsl('+((b%8)*45)+',66%,'+(b<8?58:38)+'%)'; }
const COLOR = {coord:coordColor, voice:voiceColor, bucket:octetColor};
const STATE = {proposed:'#3aa0ff', implemented:'#2ecc71', terminal:'#c0392b'};
let colorMode='coord', layout='force', HL=null;
const G = ForceGraph3D()(document.getElementById('graph'))
  .backgroundColor('#05060a')
  .nodeLabel(n => '<div style="background:#000c;padding:3px 6px;border-radius:4px;color:#cfe;font:12px monospace">'+(n.ledger? ('▷ '+n.state+' · '+n.label+' — '+(n.topic||'')) : (n.leaf? (n.label+'  ·  '+(n.topic||'')) : n.label))+'</div>')
  .nodeVal('val').nodeOpacity(0.92)
  .linkColor(()=> 'rgba(120,160,200,0.15)').linkWidth(0.4)
  .onNodeClick(n => {
    const info=document.getElementById('info'); info.style.display='block';
    info.textContent = n.ledger ? ('▷ пропозиція ['+n.state+']\\n'+n.label+'\\n'+(n.topic||''))
                      : n.leaf ? (n.label+'\\n'+(n.topic||'')+'\\n\\nголос: '+n.voice+'   координата: x'+n.coord+'   зв\\'язків: '+Math.round(((n.val-1)/1.8)**2))
                              : ('▣ '+n.level+': '+n.label);
    const r=1+220/Math.hypot(n.x||1,n.y||1,n.z||1);
    G.cameraPosition({x:n.x*r,y:n.y*r,z:n.z*r},{x:n.x,y:n.y,z:n.z},700);
  });
function updateLegend(){
  const L=document.getElementById('legend');
  if(colorMode==='bucket'){
    L.innerHTML = '<b style="color:#9cd">октет-вісь</b><br>'+OCTET.map((nm,i)=>'<span style="color:hsl('+(i*45)+',66%,60%)">●</span> '+nm).join('<br>')+'<br><span style="color:#567">8–F = дзеркало (темніше)</span>';
  } else {
    L.innerHTML = (layout==='force' ? P.leaves.length+' акордів · '+(P.ledger?P.ledger.length:0)+' пропозицій · <span style="color:#3aa0ff">●</span>proposed <span style="color:#2ecc71">●</span>implemented <span style="color:#c0392b">●</span>terminal' : 'згортка: октет → координата → голос → думка');
  }
}
function recolor(){ const f=COLOR[colorMode]; G.nodeColor(n => n.ledger? (STATE[n.state]||'#888') : (HL? (n.__m?'#ffffff':f(n)) : f(n))); updateLegend(); }
function apply(){
  if(layout==='force'){ G.graphData({nodes:P.leaves.concat(P.ledger||[]), links:P.semantic}); G.dagMode(null); }
  else { G.graphData({nodes:P.leaves.concat(P.groups), links:P.tree}); G.dagMode('radialout'); G.dagLevelDistance(60); }
  recolor();
}
function setBtns(pfx,id){ document.querySelectorAll('[id^="'+pfx+'"]').forEach(b=>b.classList.toggle('on', b.id===id)); }
const $=id=>document.getElementById(id);
$('L-force').onclick=()=>{layout='force';setBtns('L-','L-force');apply()};
$('L-tree').onclick =()=>{layout='tree'; setBtns('L-','L-tree'); apply()};
$('C-coord').onclick =()=>{colorMode='coord'; setBtns('C-','C-coord'); recolor()};
$('C-voice').onclick =()=>{colorMode='voice'; setBtns('C-','C-voice'); recolor()};
$('C-bucket').onclick=()=>{colorMode='bucket';setBtns('C-','C-bucket');recolor()};
$('q').oninput = (e)=>{
  const v=e.target.value.toLowerCase().trim(); const data=G.graphData();
  if(!v){ HL=null; data.nodes.forEach(n=>n.__m=false); recolor(); return; }
  HL=v; let best=null;
  data.nodes.forEach(n=>{ n.__m=(n.id+(n.topic||'')).toLowerCase().includes(v); if(n.__m && !best) best=n; });
  recolor();
  if(best && best.x!=null){ const r=1+220/Math.hypot(best.x||1,best.y||1,best.z||1);
    G.cameraPosition({x:best.x*r,y:best.y*r,z:best.z*r},{x:best.x,y:best.y,z:best.z},700); }
};
G.d3Force('charge').strength(-45);
apply();
</script></body></html>`;
}

function readChords(dir: string): Chord[] {
  const out: Chord[] = [];
  let entries: Deno.DirEntry[];
  try {
    entries = [...Deno.readDirSync(dir)];
  } catch {
    return out; // dir absent (e.g. myc submodule not checked out) — empty ledger
  }
  for (const e of entries) {
    if (e.isFile && e.name.endsWith(".myc.md")) {
      out.push({
        name: e.name,
        content: Deno.readTextFileSync(join(dir, e.name)),
      });
    }
  }
  return out;
}

/** A text projection of the same graph — the unified view's findings for readers
 *  who can't see 3D (models) or just want the numbers: load-bearing chords + the
 *  governance apply-loop (how many proposals have both a citing chord AND linked
 *  evidence — a chord or a successor proposal). Exported for the test. */
export function insights(p: Payload): string {
  const deg = new Map<string, { in: number; out: number }>();
  const bump = (id: string, d: "in" | "out") => {
    const v = deg.get(id) ?? { in: 0, out: 0 };
    v[d]++;
    deg.set(id, v);
  };
  for (const e of p.semantic) {
    bump(e.source, "out");
    bump(e.target, "in");
  }
  const L: string[] = [
    `# ${p.leaves.length} chords · ${p.ledger.length} proposals · ${p.semantic.length} edges`,
    "",
    "## load-bearing chords (most connected)",
  ];
  for (
    const h of p.leaves
      .map((l) => {
        const d = deg.get(l.id as string);
        return { id: l.id as string, d: (d?.in ?? 0) + (d?.out ?? 0) };
      })
      .sort((a, b) => b.d - a.d).slice(0, 8)
  ) L.push(`  ${String(h.d).padStart(3)}  ${h.id}`);
  const states: Record<string, number> = {};
  let complete = 0, unevidenced = 0;
  const gaps: string[] = [];
  for (const pr of p.ledger) {
    const st = pr.state as string;
    states[st] = (states[st] ?? 0) + 1;
    const d = deg.get(pr.id as string) ?? { in: 0, out: 0 };
    if (d.in > 0 && d.out > 0) complete++;
    if (d.out === 0) {
      unevidenced++;
      gaps.push(`  no linked evidence: ${pr.label} [${st}]`);
    }
  }
  L.push(
    "",
    "## governance (the unified view's payoff)",
    `  states: ${
      Object.entries(states).map(([k, v]) => `${k}=${v}`).join("  ")
    }`,
    `  complete apply-loop (cited AND evidenced): ${complete}/${p.ledger.length}`,
    `  no linked evidence (chord or successor): ${unevidenced}/${p.ledger.length}`,
  );
  if (gaps.length) L.push("", "## gaps", ...gaps);
  return L.join("\n");
}

if (import.meta.main) {
  const srcDir = dirname(fromFileUrl(import.meta.url));
  const repo = dirname(srcDir);
  const proposals = readChords(join(repo, "myc", "public", "proposals"));
  const resolutions = readChords(join(repo, "myc", "public", "resolutions"));
  const p = buildGraph(readChords(srcDir), proposals, resolutions);
  if (Deno.args.includes("--insights")) {
    console.log(insights(p));
  } else if (Deno.args.includes("--stdout")) {
    console.log(renderHtml(p));
  } else {
    const out = join(repo, "mycelium-map.html");
    Deno.writeTextFileSync(out, renderHtml(p));
    console.log(JSON.stringify(
      {
        type: "map",
        position: "8/74",
        out,
        nodes: p.leaves.length,
        ledger: p.ledger.length,
        edges: p.semantic.length,
        groups: p.groups.length,
        note: "open in a browser (needs internet — 3d-force-graph CDN)",
      },
      null,
      2,
    ));
  }
}
