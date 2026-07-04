#!/usr/bin/env -S deno run -A
// src/x8740_map.ts — render the live mycelium as a navigable 3D graph for humans
// position: 8/74 → void_infinity(8) × ... = reach across the whole namespace and
//   project it onto a human-perceivable space (the "membrane made visible")
// maturity: prototype
// skill_safe: yes-with-care
//   (default mode writes the gitignored mycelium-map.html; --stdout and --insights
//    are read-only. Reclassified 2026-06-26 from a false yes-readonly — codex P0 drift.)
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
    sig: boolean;
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
    const isSigned = fm.includes("content_sig:") || fm.includes("provenance:");
    if (!leaves.has(stem)) {
      leaves.set(stem, {
        id: stem,
        topic,
        coord,
        bucket: coord[0],
        voice,
        deg: 0,
        sig: isSigned,
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
    sig: l.sig,
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

export function renderHtml(p: Payload): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>mycelium — living map</title>
<style>
 @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@400;600;800&display=swap');
 body{margin:0;background:#030508;color:#e2e8f0;font-family:'Outfit',sans-serif;overflow:hidden}
 #graph{position:fixed;inset:0}
 #ui{position:fixed;top:16px;left:16px;z-index:10;display:flex;flex-direction:column;gap:12px;max-width:320px}
 .grp{background:rgba(10,17,30,0.7);border:1px solid rgba(56,189,248,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:10px;padding:12px 16px;box-shadow:0 4px 30px rgba(0,0,0,0.4)}
 .grp-title{font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:8px;font-weight:800}
 .btn-group{display:flex;gap:6px;flex-wrap:wrap}
 button{background:rgba(15,23,42,0.8);color:#94a3b8;border:1px solid rgba(148,163,184,0.2);border-radius:6px;padding:5px 10px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all 0.2s ease}
 button:hover{background:rgba(30,41,59,0.8);border-color:rgba(56,189,248,0.4);color:#f1f5f9}
 button.on{background:rgba(14,165,233,0.2);color:#38bdf8;border-color:#0ea5e9;box-shadow:0 0 10px rgba(14,165,233,0.3)}
 input{background:rgba(7,10,17,0.85);border:1px solid rgba(148,163,184,0.2);color:#f1f5f9;border-radius:6px;padding:6px 12px;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box;transition:all 0.2s ease}
 input:focus{outline:none;border-color:#38bdf8;box-shadow:0 0 8px rgba(56,189,248,0.3)}
 #legend{position:fixed;bottom:16px;left:16px;z-index:10;background:rgba(10,17,30,0.7);border:1px solid rgba(56,189,248,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:12px 16px;border-radius:10px;color:#94a3b8;font-size:11px;max-width:280px;box-shadow:0 4px 30px rgba(0,0,0,0.4)}
 #info{position:fixed;top:16px;right:-380px;bottom:16px;width:340px;z-index:100;background:rgba(8,14,25,0.85);border:1px solid rgba(56,189,248,0.15);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:12px;padding:20px;box-shadow:-5px 0 30px rgba(0,0,0,0.6);overflow-y:auto;transition:right 0.4s cubic-bezier(0.16,1,0.3,1);color:#e2e8f0}
 #info.open{right:16px}
 .drawer-header{position:relative;border-bottom:1px solid rgba(148,163,184,0.1);padding-bottom:14px;margin-bottom:16px}
 .drawer-header h2{margin:0 0 6px 0;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#f1f5f9}
 .close-btn{position:absolute;top:-8px;right:-8px;background:none;border:none;font-size:24px;color:#64748b;cursor:pointer;padding:4px}
 .close-btn:hover{color:#f1f5f9}
 .title-block{display:flex;align-items:center;gap:8px}
 .badge{font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:4px;letter-spacing:0.05em}
 .badge.verified{background:rgba(52,211,153,0.2);color:#34d399}
 .badge.unsigned{background:rgba(245,158,11,0.2);color:#fbbf24}
 .badge.state-proposed{background:rgba(59,130,246,0.2);color:#60a5fa}
 .badge.state-implemented{background:rgba(16,185,129,0.2);color:#34d399}
 .badge.state-terminal{background:rgba(244,63,94,0.2);color:#fb7185}
 .badge.group{background:rgba(100,116,139,0.2);color:#94a3b8}
 .coord-label{font-family:'JetBrains Mono',monospace;font-size:11px;color:#38bdf8;background:rgba(56,189,248,0.1);padding:2px 5px;border-radius:4px}
 .meta-section{background:rgba(15,23,42,0.4);border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.03);margin-bottom:20px}
 .meta-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px}
 .meta-row:last-child{margin-bottom:0}
 .meta-row strong{color:#64748b}
 .node-id{font-family:'JetBrains Mono',monospace;font-size:12px;color:#94a3b8;word-break:break-all;max-width:70%;text-align:right}
 .connections-section h3{font-size:12px;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin:16px 0 8px 0;font-weight:700}
 .link-list{display:flex;flex-direction:column;gap:4px}
 .link-btn{background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.05);border-radius:6px;color:#e2e8f0;text-align:left;padding:6px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
 .link-btn:hover{background:rgba(30,41,59,0.7);border-color:rgba(56,189,248,0.3);color:#38bdf8}
 .empty-list{color:#475569;font-size:12px;font-style:italic;padding:4px}
</style></head><body>
<div id="ui">
 <div class="grp">
  <div class="grp-title">розкладка</div>
  <div class="btn-group">
   <button id="L-force" class="on">сила</button>
   <button id="L-tree">згортка</button>
  </div>
 </div>
 <div class="grp">
  <div class="grp-title">колір</div>
  <div class="btn-group">
   <button id="C-coord" class="on">координата</button>
   <button id="C-voice">голос</button>
   <button id="C-bucket">октет</button>
   <button id="C-tension">напруга</button>
  </div>
 </div>
 <div class="grp">
  <input id="q" placeholder="пошук вузла…">
 </div>
</div>
<div id="legend"></div>
<div id="info"></div>
<div id="graph"></div>
<script src="https://unpkg.com/3d-force-graph"></script>
<script>
const P = ${JSON.stringify(p)};
const VOICE = {claude:'#4fc3f7',codex:'#81c784',gemini:'#ba68c8',antigravity:'#ffb74d',kimi:'#f06292',s0fractal:'#fff176',fable:'#a1887f','?':'#607d8b'};
const OCTET = ['void∞','first·penult','mirror·apex','triangle','foundation','action','harmony','completion'];

const degMap = {};
P.semantic.forEach(e => {
  degMap[e.source] = degMap[e.source] || { in: 0, out: 0 };
  degMap[e.target] = degMap[e.target] || { in: 0, out: 0 };
  degMap[e.source].out++;
  degMap[e.target].in++;
});

function coordColor(n){ if(!n.leaf) return '#33425a'; const c=n.coord||'0000'; return '#'+c.slice(0,2)+c.slice(2,4)+'a0'; }
function voiceColor(n){ if(!n.leaf) return '#33425a'; return VOICE[n.voice]||'#607d8b'; }
function octetColor(n){ if(!n.leaf) return '#33425a'; const b=parseInt(n.bucket||'0',16); return 'hsl('+((b%8)*45)+',66%,'+(b<8?58:38)+'%)'; }
function tensionColor(n) {
  if (n.ledger) {
    const d = degMap[n.id] || { in: 0, out: 0 };
    if (d.in > 0 && d.out > 0) return '#10b981';
    if (d.out === 0) return '#f43f5e';
    return '#fbbf24';
  }
  if (!n.leaf) return '#33425a';
  return n.sig ? '#34d399' : '#f59e0b';
}
const COLOR = {coord:coordColor, voice:voiceColor, bucket:octetColor, tension:tensionColor};
const STATE = {proposed:'#3aa0ff', implemented:'#2ecc71', terminal:'#c0392b'};
let colorMode='coord', layout='force', HL=null;

const G = ForceGraph3D()(document.getElementById('graph'))
  .backgroundColor('#030508')
  .nodeLabel(n => '<div style="background:#000c;padding:4px 8px;border-radius:6px;color:#cfe;font:12px monospace;border:1px solid rgba(56,189,248,0.2)">'+(n.ledger? ('▷ '+n.state+' · '+n.label+' — '+(n.topic||'')) : (n.leaf? (n.label+'  ·  '+(n.topic||'')) : n.label))+'</div>')
  .nodeVal('val').nodeOpacity(0.92)
  .linkColor(link => {
    const sId = typeof link.source === 'object' ? link.source.id : link.source;
    const tId = typeof link.target === 'object' ? link.target.id : link.target;
    if (sId.startsWith('P|') || tId.startsWith('P|')) return 'rgba(244,63,94,0.35)';
    return 'rgba(56,189,248,0.18)';
  })
  .linkWidth(link => {
    const sId = typeof link.source === 'object' ? link.source.id : link.source;
    const tId = typeof link.target === 'object' ? link.target.id : link.target;
    if (sId.startsWith('P|') || tId.startsWith('P|')) return 0.8;
    return 0.45;
  })
  .onNodeClick(n => {
    const info=document.getElementById('info');
    info.classList.add('open');
    
    const incoming = [];
    const outgoing = [];
    P.semantic.forEach(e => {
      if (e.source === n.id) outgoing.push(e.target);
      if (e.target === n.id) incoming.push(e.source);
    });
    
    let badge = '';
    if (n.ledger) {
      badge = '<span class="badge state-' + n.state + '">' + n.state + '</span>';
    } else if (n.leaf) {
      badge = n.sig ? '<span class="badge verified">🔐 signed</span>' : '<span class="badge unsigned">📜 unsigned</span>';
    } else {
      badge = '<span class="badge group">' + n.level + '</span>';
    }
    
    const formatName = id => id.startsWith('P|') ? id.slice(2) : id.split('_').pop();
    
    info.innerHTML = \`
      <div class="drawer-header">
        <button class="close-btn" onclick="document.getElementById('info').classList.remove('open')">×</button>
        <h2>\${n.ledger ? 'Пропозиція' : n.leaf ? 'Акорд' : 'Група'}</h2>
        <div class="title-block">
          \${badge}
          \${n.coord ? '<code class="coord-label">x' + n.coord + '</code>' : ''}
        </div>
      </div>
      <div class="drawer-body">
        <div class="meta-section">
          <div class="meta-row"><strong>ID:</strong> <code class="node-id">\${n.label || n.id}</code></div>
          \${n.topic ? \`<div class="meta-row"><strong>Тема:</strong> <span>\${n.topic}</span></div>\` : ''}
          \${n.voice ? \`<div class="meta-row"><strong>Голос:</strong> <span style="color:\${VOICE[n.voice] || '#fff'}">\${n.voice}</span></div>\` : ''}
        </div>
        
        <div class="connections-section">
          <h3>Вхідні зв'язки (\${incoming.length})</h3>
          <div class="link-list">
            \${incoming.length === 0 ? '<div class="empty-list">немає вхідних зв\\'язків</div>' : incoming.map(id => \`<button onclick="focusNode('\${id}')" class="link-btn" title="\${id}">\${formatName(id)}</button>\`).join('')}
          </div>
          
          <h3>Вихідні зв'язки (\${outgoing.length})</h3>
          <div class="link-list">
            \${outgoing.length === 0 ? '<div class="empty-list">немає вихідних зв\\'язків</div>' : outgoing.map(id => \`<button onclick="focusNode('\${id}')" class="link-btn" title="\${id}">\${formatName(id)}</button>\`).join('')}
          </div>
        </div>
      </div>
    \`;
    const r=1+220/Math.hypot(n.x||1,n.y||1,n.z||1);
    G.cameraPosition({x:n.x*r,y:n.y*r,z:n.z*r},{x:n.x,y:n.y,z:n.z},700);
  });

window.focusNode = function(id) {
  const data = G.graphData();
  const node = data.nodes.find(n => n.id === id);
  if (node) {
    G.onNodeClick()(node);
  }
};

function updateLegend(){
  const L=document.getElementById('legend');
  if(colorMode==='bucket'){
    L.innerHTML = '<b style="color:#38bdf8">октет-вісь</b><br>'+OCTET.map((nm,i)=>'<span style="color:hsl('+(i*45)+',66%,60%)">●</span> '+nm).join('<br>')+'<br><span style="color:#64748b">8–F = дзеркало (темніше)</span>';
  } else if (colorMode==='tension') {
    L.innerHTML = '<b style="color:#38bdf8">напруга / здоров\\'я</b><br>' +
      '<span style="color:#10b981">●</span> verified / complete<br>' +
      '<span style="color:#fbbf24">●</span> partial / unsigned<br>' +
      '<span style="color:#f43f5e">●</span> gap / unevidenced';
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
$('C-tension').onclick=()=>{colorMode='tension';setBtns('C-','C-tension');recolor()};
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
