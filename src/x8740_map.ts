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
//   t map            write mycelium-map.html (gitignored) + print its path
//   t map --stdout   emit the self-contained HTML to stdout

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";

export interface Chord {
  name: string;
  content: string;
}
export interface Payload {
  leaves: Record<string, unknown>[];
  groups: Record<string, unknown>[];
  semantic: { source: string; target: string }[];
  tree: { source: string; target: string }[];
}

function listItems(fm: string, key: string): string[] {
  const m = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s.*\\n?)+)`, "m"));
  if (!m) return [];
  return [...m[1].matchAll(/^\s+-\s+(.+?)\s*$/gm)].map((x) => x[1].trim());
}

/** Pure: fold chord names into the згортка tree + extract citation edges. Exported
 *  for the test — no file I/O, so a fixture array exercises the whole projection. */
export function buildGraph(chords: Chord[]): Payload {
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
  return { leaves: leafArr, groups: groupArr, semantic, tree };
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
const BUCKET = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e84393','#fd79a8','#00b894','#0984e3','#6c5ce7','#fdcb6e','#00cec9','#b2bec3','#dfe6e9'];
function coordColor(n){ if(!n.leaf) return '#33425a'; const c=n.coord||'0000'; return '#'+c.slice(0,2)+c.slice(2,4)+'a0'; }
function voiceColor(n){ if(!n.leaf) return '#33425a'; return VOICE[n.voice]||'#607d8b'; }
function bucketColor(n){ if(!n.leaf) return '#33425a'; return BUCKET[parseInt(n.bucket||'0',16)]||'#888'; }
const COLOR = {coord:coordColor, voice:voiceColor, bucket:bucketColor};
let colorMode='coord', layout='force', HL=null;
const G = ForceGraph3D()(document.getElementById('graph'))
  .backgroundColor('#05060a')
  .nodeLabel(n => '<div style="background:#000c;padding:3px 6px;border-radius:4px;color:#cfe;font:12px monospace">'+(n.leaf? (n.label+'  ·  '+(n.topic||'')) : n.label)+'</div>')
  .nodeVal('val').nodeOpacity(0.92)
  .linkColor(()=> 'rgba(120,160,200,0.15)').linkWidth(0.4)
  .onNodeClick(n => {
    const info=document.getElementById('info'); info.style.display='block';
    info.textContent = n.leaf ? (n.label+'\\n'+(n.topic||'')+'\\n\\nголос: '+n.voice+'   координата: x'+n.coord+'   зв\\'язків: '+Math.round(((n.val-1)/1.8)**2))
                              : ('▣ '+n.level+': '+n.label);
    const r=1+220/Math.hypot(n.x||1,n.y||1,n.z||1);
    G.cameraPosition({x:n.x*r,y:n.y*r,z:n.z*r},{x:n.x,y:n.y,z:n.z},700);
  });
function recolor(){ const f=COLOR[colorMode]; G.nodeColor(n => HL? (n.__m?'#ffffff':f(n)) : f(n)); }
function apply(){
  if(layout==='force'){ G.graphData({nodes:P.leaves, links:P.semantic}); G.dagMode(null); }
  else { G.graphData({nodes:P.leaves.concat(P.groups), links:P.tree}); G.dagMode('radialout'); G.dagLevelDistance(60); }
  recolor();
  document.getElementById('legend').innerHTML =
    layout==='force' ? P.leaves.length+' вузлів · '+P.semantic.length+' семантичних ребер'
    : 'згортка: октет → координата → голос → думка';
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
  for (const e of Deno.readDirSync(dir)) {
    if (e.isFile && e.name.endsWith(".myc.md")) {
      out.push({
        name: e.name,
        content: Deno.readTextFileSync(join(dir, e.name)),
      });
    }
  }
  return out;
}

if (import.meta.main) {
  const srcDir = dirname(fromFileUrl(import.meta.url));
  const p = buildGraph(readChords(srcDir));
  const html = renderHtml(p);
  if (Deno.args.includes("--stdout")) {
    console.log(html);
  } else {
    const out = join(dirname(srcDir), "mycelium-map.html");
    Deno.writeTextFileSync(out, html);
    console.log(JSON.stringify(
      {
        type: "map",
        position: "8/74",
        out,
        nodes: p.leaves.length,
        edges: p.semantic.length,
        groups: p.groups.length,
        note: "open in a browser (needs internet — 3d-force-graph CDN)",
      },
      null,
      2,
    ));
  }
}
