#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Voices Routing Falsifier v0
 *
 * Tests whether 8D dipole routing predicts the next responding voice
 * better than 1D keyword/tag baseline on historical chord chains.
 *
 * Usage:
 *   cd /Users/s0fractal/trinity
 *   deno run --allow-read --allow-write probes/voices-routing-falsifier-v0/run.ts
 *   deno run --allow-read --allow-write probes/voices-routing-falsifier-v0/run.ts --all
 *   deno run --allow-read --allow-write probes/voices-routing-falsifier-v0/run.ts --limit 100
 *
 * Output:
 *   probes/voices-routing-falsifier-v0/result.latest.json
 *   probes/voices-routing-falsifier-v0/result.latest.md
 */

import { parse as parseYaml } from "jsr:@std/yaml@^1.0.0";

// ── Types ──────────────────────────────────────────────────────────

interface ChordFrontmatter {
  id?: string;
  speaker?: string;
  topic?: string;
  chord?: {
    primary?: string;
    secondary?: string[];
  };
  mode?: string;
  claim_kind?: string;
  energy?: number;
  hears?: string[];
  [key: string]: unknown;
}

interface Chord {
  path: string;
  mtime: number;
  fm: ChordFrontmatter;
  body: string;
}

interface VoiceProfile {
  speaker: string;
  total: number;
  primaryOct: Record<string, number>;
  secondaryOct: Record<string, number>;
  topics: Record<string, number>;
  claimKinds: Record<string, number>;
  modes: Record<string, number>;
  avgEnergy: number;
}

interface BaselineResult {
  predicted: string[];
  score: number;
}

interface Sample {
  sourceId: string;
  sourceSpeaker: string;
  targetSpeaker: string;
  sourceTime: number;
  targetTime: number;
  oneD: BaselineResult;
  eightD: BaselineResult;
}

interface FalsifierResult {
  candidateSamples: number;
  totalValidChords: number;
  labeledSamples: number;
  skippedSamples: number;
  oneD: {
    top1HitRate: number;
    top2HitRate: number;
    meanReciprocalRank: number;
  };
  eightD: {
    top1HitRate: number;
    top2HitRate: number;
    meanReciprocalRank: number;
  };
  deltaPp: number;
  verdict: "adopt_8d" | "keep_metadata" | "reject_8d_scheduler";
  failuresOrAmbiguities: string[];
  voices: Record<string, VoiceProfile>;
  samples: Sample[];
  config: {
    limit: number | null;
    leakageGuard: "profiles_before_source_only";
  };
}

// ── Utilities ──────────────────────────────────────────────────────

function extractFrontmatter(
  text: string,
): { fm: Record<string, unknown>; body: string } | null {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  try {
    const fm = parseYaml(text.slice(4, end)) as Record<string, unknown>;
    return { fm, body: text.slice(end + 4).trim() };
  } catch {
    return null;
  }
}

function normOct(tag: string): string {
  return tag.trim().toLowerCase();
}

function normSpeaker(s: string): string {
  const lower = s.trim().toLowerCase();
  if (lower.startsWith("claude")) return "claude";
  if (lower.startsWith("codex")) return "codex";
  if (lower.startsWith("gemini")) return "gemini";
  if (lower.startsWith("kimi")) return "kimi";
  if (lower.startsWith("antigravity")) return "antigravity";
  return lower;
}

function parseArgs(args: string[]): { limit: number | null } {
  let limit: number | null = 50;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--all") limit = null;
    else if (a === "--limit") {
      const raw = args[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--limit must be a positive integer, got ${raw}`);
      }
      limit = n;
    }
  }
  return { limit };
}

function localPath(url: string): string {
  return decodeURIComponent(new URL(url).pathname);
}

function octToVector(tag: string): number[] {
  // Synthetic 8D: oct:N.X -> axis N = 1.0
  const m = tag.match(/oct:(\d)/);
  if (!m) return new Array(8).fill(0);
  const v = new Array(8).fill(0);
  v[parseInt(m[1], 10)] = 1.0;
  return v;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function softmax(
  scores: Record<string, number>,
): { voice: string; score: number }[] {
  const entries = Object.entries(scores);
  const max = Math.max(...entries.map(([, s]) => s));
  const exps = entries.map(([v, s]) => ({ v, e: Math.exp(s - max) }));
  const sum = exps.reduce((a, b) => a + b.e, 0);
  return exps.map(({ v, e }) => ({ voice: v, score: e / sum })).sort((a, b) =>
    b.score - a.score
  );
}

function normalizeToSlug(name: string): string {
  let s = name.toLowerCase();
  // Remove path
  const lastSlash = s.lastIndexOf("/");
  if (lastSlash !== -1) {
    s = s.slice(lastSlash + 1);
  }
  // Remove extension
  s = s.replace(/\.myc\.md$/, "").replace(/\.md$/, "");
  // Remove coordinate prefix (e.g. x1234_ or x1234_952776_ or x1234_t12345678901234_)
  s = s.replace(/^x[0-9a-f]{4}_(?:\d+_|t\d{14}_)?/, "");
  // Remove timestamp prefixes
  s = s.replace(/^\d{4}-\d{2}-\d{2}t\d{6}z-/, "");
  s = s.replace(/^t\d{14}z-/, "");
  // Remove voice prefix if followed by _ or -
  s = s.replace(/^(?:claude-opus-4-8|claude-opus-4-7-1m|claude-opus-4-7|claude-opus|claude|gemini-pro-1-5|gemini-3-1-pro|gemini|codex-gpt-5|codex|kimi-code-cli|kimi-k1\.6|kimi-k1-6|kimi-k1\.5|kimi-k1-5|kimi|antigravity|s0fractal|hermes|architect|trinity-cognition)[_-]/, "");
  // Remove non-alphanumeric characters
  return s.replace(/[^a-z0-9]/g, "");
}

// ── Load chords ────────────────────────────────────────────────────

async function loadChords(dir: string): Promise<Chord[]> {
  const chords: Chord[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const path = `${dir}/${entry.name}`;
    const text = await Deno.readTextFile(path);
    const parsed = extractFrontmatter(text);
    if (!parsed) continue;
    const fm = parsed.fm as ChordFrontmatter;
    
    // Derive speaker/voice
    const rawSpeaker = fm.voice ?? fm.speaker;
    if (!rawSpeaker) continue;
    fm.speaker = normSpeaker(String(rawSpeaker));
    
    // Derive ID if missing
    if (!fm.id) {
      fm.id = entry.name.replace(/\.myc\.md$/, "").replace(/\.md$/, "");
    }

    const stat = await Deno.stat(path);
    chords.push({
      path,
      mtime: stat.mtime?.getTime() ?? 0,
      fm,
      body: parsed.body,
    });
  }
  // Sort by bitcoin block height first, then created timestamp, then mtime (oldest first)
  return chords.sort((a, b) => {
    const bhA = Number(a.fm.bitcoin_block_height ?? 0);
    const bhB = Number(b.fm.bitcoin_block_height ?? 0);
    if (bhA !== bhB) return bhA - bhB;

    const tA = a.fm.created ? new Date(String(a.fm.created)).getTime() : 0;
    const tB = b.fm.created ? new Date(String(b.fm.created)).getTime() : 0;
    if (tA !== tB) return tA - tB;

    return a.mtime - b.mtime;
  });
}

// ── Build voice profiles ───────────────────────────────────────────

function buildVoiceProfiles(chords: Chord[]): Record<string, VoiceProfile> {
  const raw: Record<string, {
    primaryOct: Record<string, number>;
    secondaryOct: Record<string, number>;
    topics: Record<string, number>;
    claimKinds: Record<string, number>;
    modes: Record<string, number>;
    energies: number[];
  }> = {};

  for (const c of chords) {
    const s = c.fm.speaker!;
    if (!raw[s]) {
      raw[s] = {
        primaryOct: {},
        secondaryOct: {},
        topics: {},
        claimKinds: {},
        modes: {},
        energies: [],
      };
    }
    const p = raw[s];
    const pri = normOct(c.fm.chord?.primary ?? "unknown");
    p.primaryOct[pri] = (p.primaryOct[pri] || 0) + 1;
    for (const sec of (c.fm.chord?.secondary ?? [])) {
      const n = normOct(sec);
      p.secondaryOct[n] = (p.secondaryOct[n] || 0) + 1;
    }
    const t = c.fm.topic ?? "unknown";
    p.topics[t] = (p.topics[t] || 0) + 1;
    const ck = c.fm.claim_kind ?? "unknown";
    p.claimKinds[ck] = (p.claimKinds[ck] || 0) + 1;
    const m = c.fm.mode ?? "unknown";
    p.modes[m] = (p.modes[m] || 0) + 1;
    p.energies.push(c.fm.energy ?? 0.5);
  }

  const profiles: Record<string, VoiceProfile> = {};
  for (const [speaker, d] of Object.entries(raw)) {
    profiles[speaker] = {
      speaker,
      total: d.energies.length,
      primaryOct: d.primaryOct,
      secondaryOct: d.secondaryOct,
      topics: d.topics,
      claimKinds: d.claimKinds,
      modes: d.modes,
      avgEnergy: d.energies.reduce((a, b) => a + b, 0) / d.energies.length,
    };
  }
  return profiles;
}

// ── Build chord graph / target labels ──────────────────────────────

function buildSamples(
  chords: Chord[],
  sourceWindow: Chord[],
): { samples: Sample[]; skipped: number; ambiguous: string[] } {
  const byId = new Map<string, Chord>();
  for (const c of chords) byId.set(c.fm.id!, c);

  const samples: Sample[] = [];
  let skipped = 0;
  const ambiguous: string[] = [];

  for (const src of sourceWindow) {
    const i = chords.indexOf(src);
    if (i < 0) {
      skipped++;
      continue;
    }
    // Find next different speaker that responds to src
    const candidates: { chord: Chord; delta: number }[] = [];
    for (let j = i + 1; j < chords.length; j++) {
      const dst = chords[j];
      if (dst.fm.speaker === src.fm.speaker) continue;
      // Check if dst hears, references, or closes src
      const rawHears = dst.fm.hears ?? [];
      const rawRefs = dst.fm.references ?? [];
      const rawCloses = dst.fm.closes ?? [];
      const hears = [
        ...(Array.isArray(rawHears) ? rawHears : [rawHears]),
        ...(Array.isArray(rawRefs) ? rawRefs : [rawRefs]),
        ...(Array.isArray(rawCloses) ? rawCloses : [rawCloses]),
      ].map((h) => String(h).trim());
      const hearsSrc = hears.some((h) => {
        const hSlug = normalizeToSlug(h);
        const srcSlug = normalizeToSlug(src.fm.id!);
        return hSlug === srcSlug && hSlug !== "";
      });
      if (!hearsSrc) continue;
      const delta = (dst.mtime - src.mtime) / 1000;
      candidates.push({ chord: dst, delta });
    }

    if (candidates.length === 0) {
      skipped++;
      continue;
    }

    // If multiple candidates within 60s, ambiguous
    if (
      candidates.length > 1 && candidates[1].delta - candidates[0].delta < 60
    ) {
      skipped++;
      ambiguous.push(
        `ambiguous: ${src.fm.id} -> [${
          candidates.slice(0, 3).map((c) => c.chord.fm.id).join(", ")
        }]`,
      );
      continue;
    }

    const target = candidates[0].chord;
    samples.push({
      sourceId: src.fm.id!,
      sourceSpeaker: src.fm.speaker!,
      targetSpeaker: target.fm.speaker!,
      sourceTime: src.mtime,
      targetTime: target.mtime,
      oneD: { predicted: [], score: 0 },
      eightD: { predicted: [], score: 0 },
    });
  }

  return { samples, skipped, ambiguous };
}

// ── 1D Baseline ────────────────────────────────────────────────────

function run1D(
  src: Chord,
  profiles: Record<string, VoiceProfile>,
): BaselineResult {
  const scores: Record<string, number> = {};
  const pri = normOct(src.fm.chord?.primary ?? "unknown");
  const secs = (src.fm.chord?.secondary ?? []).map(normOct);
  const topic = src.fm.topic ?? "unknown";
  const ck = src.fm.claim_kind ?? "unknown";
  const mode = src.fm.mode ?? "unknown";

  for (const [voice, p] of Object.entries(profiles)) {
    let s = 0;
    // Primary oct match (weight 3)
    s += (p.primaryOct[pri] || 0) / p.total * 3;
    // Secondary oct matches (weight 1 each)
    for (const sec of secs) {
      s += (p.secondaryOct[sec] || 0) / p.total * 1;
    }
    // Topic match (weight 2)
    s += (p.topics[topic] || 0) / p.total * 2;
    // Claim kind match (weight 1.5)
    s += (p.claimKinds[ck] || 0) / p.total * 1.5;
    // Mode match (weight 1)
    s += (p.modes[mode] || 0) / p.total * 1;
    scores[voice] = s;
  }

  const ranked = softmax(scores);
  return {
    predicted: ranked.map((r) => r.voice),
    score: ranked[0]?.score ?? 0,
  };
}

// ── 8D Synthetic ───────────────────────────────────────────────────

function run8D(
  src: Chord,
  profiles: Record<string, VoiceProfile>,
): BaselineResult {
  // Build source vector from chord oct tags (synthetic)
  const srcVec = new Array(8).fill(0);
  const pri = normOct(src.fm.chord?.primary ?? "");
  const priV = octToVector(pri);
  for (let i = 0; i < 8; i++) srcVec[i] += priV[i] * 3;
  for (const sec of (src.fm.chord?.secondary ?? []).map(normOct)) {
    const v = octToVector(sec);
    for (let i = 0; i < 8; i++) srcVec[i] += v[i] * 1;
  }

  const scores: Record<string, number> = {};
  for (const [voice, p] of Object.entries(profiles)) {
    // Build voice comfort vector from historical oct tag frequencies
    const vVec = new Array(8).fill(0);
    for (const [tag, count] of Object.entries(p.primaryOct)) {
      const vec = octToVector(tag);
      const w = count / p.total * 3;
      for (let i = 0; i < 8; i++) vVec[i] += vec[i] * w;
    }
    for (const [tag, count] of Object.entries(p.secondaryOct)) {
      const vec = octToVector(tag);
      const w = count / p.total * 1;
      for (let i = 0; i < 8; i++) vVec[i] += vec[i] * w;
    }
    scores[voice] = cosine(srcVec, vVec);
  }

  const ranked = Object.entries(scores)
    .map(([voice, score]) => ({ voice, score }))
    .sort((a, b) => b.score - a.score);
  return {
    predicted: ranked.map((r) => r.voice),
    score: ranked[0]?.score ?? 0,
  };
}

// ── Metrics ────────────────────────────────────────────────────────

function computeMetrics(samples: Sample[], key: "oneD" | "eightD") {
  let top1 = 0, top2 = 0, mrr = 0;
  for (const s of samples) {
    const ranked = s[key].predicted;
    const target = s.targetSpeaker;
    const idx = ranked.indexOf(target);
    if (idx === 0) top1++;
    if (idx >= 0 && idx < 2) top2++;
    if (idx >= 0) mrr += 1 / (idx + 1);
  }
  const n = samples.length;
  return {
    top1HitRate: n > 0 ? top1 / n : 0,
    top2HitRate: n > 0 ? top2 / n : 0,
    meanReciprocalRank: n > 0 ? mrr / n : 0,
  };
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const { limit } = parseArgs(Deno.args);
  const outDir = localPath(new URL(".", import.meta.url).href).replace(
    /\/$/,
    "",
  );
  const root = localPath(new URL("../..", import.meta.url).href).replace(
    /\/$/,
    "",
  );
  let chordsDir = `${root}/jazz/chords`;
  try {
    const stat = await Deno.stat(chordsDir);
    if (!stat.isDirectory) throw new Error();
  } catch {
    chordsDir = `${root}/src`;
  }

  console.log("Loading chords...");
  const chords = await loadChords(chordsDir);
  console.log(`  Loaded ${chords.length} chords with valid frontmatter`);

  const sourceWindow = limit === null ? chords : chords.slice(-limit);
  console.log(
    `  Source window: ${
      limit === null ? "all chords" : `last ${limit} chords`
    }`,
  );

  console.log("Building samples (source -> target)...");
  const { samples, skipped, ambiguous } = buildSamples(chords, sourceWindow);
  console.log(`  Candidate chords: ${sourceWindow.length}`);
  console.log(`  Labeled samples: ${samples.length}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Ambiguous: ${ambiguous.length}`);

  console.log(
    "Running baselines with leakage guard (profiles before source only)...",
  );
  const finalProfiles = buildVoiceProfiles(chords);
  const voices = Object.keys(finalProfiles);
  for (const s of samples) {
    const src = chords.find((c) => c.fm.id === s.sourceId)!;
    const training = chords.filter((c) => c.mtime < src.mtime);
    const profiles = buildVoiceProfiles(training);
    s.oneD = run1D(src, profiles);
    s.eightD = run8D(src, profiles);
  }

  const oneDMetrics = computeMetrics(samples, "oneD");
  const eightDMetrics = computeMetrics(samples, "eightD");
  const deltaPp = (eightDMetrics.top1HitRate - oneDMetrics.top1HitRate) * 100;

  let verdict: FalsifierResult["verdict"];
  if (
    eightDMetrics.top1HitRate >= oneDMetrics.top1HitRate + 0.10 &&
    samples.length >= 25
  ) {
    verdict = "adopt_8d";
  } else if (eightDMetrics.top1HitRate < oneDMetrics.top1HitRate - 0.10) {
    verdict = "reject_8d_scheduler";
  } else {
    verdict = "keep_metadata";
  }

  const result: FalsifierResult = {
    candidateSamples: sourceWindow.length,
    totalValidChords: chords.length,
    labeledSamples: samples.length,
    skippedSamples: skipped,
    oneD: oneDMetrics,
    eightD: eightDMetrics,
    deltaPp,
    verdict,
    failuresOrAmbiguities: ambiguous,
    voices: finalProfiles,
    samples: samples.map((s) => ({
      sourceId: s.sourceId,
      sourceSpeaker: s.sourceSpeaker,
      targetSpeaker: s.targetSpeaker,
      sourceTime: s.sourceTime,
      targetTime: s.targetTime,
      oneD: s.oneD,
      eightD: s.eightD,
    })),
    config: {
      limit,
      leakageGuard: "profiles_before_source_only",
    },
  };

  // Write JSON
  await Deno.writeTextFile(
    `${outDir}/result.latest.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(`\nWrote ${outDir}/result.latest.json`);

  // Write Markdown
  const md = `# Voices Routing Falsifier v0 — Result

**Date:** ${new Date().toISOString()}
**Config:** ${
    limit === null ? "all candidate chords" : `last ${limit} candidate chords`
  }; profiles built only from chords before each source
**Samples:** ${result.labeledSamples} labeled, ${result.skippedSamples} skipped, ${result.candidateSamples} candidate chords
**Voices:** ${voices.join(", ")}

## Metrics

| Baseline | top1_hit_rate | top2_hit_rate | MRR |
|---|---:|---:|---:|
| 1D keyword | ${(oneDMetrics.top1HitRate * 100).toFixed(1)}% | ${
    (oneDMetrics.top2HitRate * 100).toFixed(1)
  }% | ${oneDMetrics.meanReciprocalRank.toFixed(3)} |
| 8D synthetic | ${(eightDMetrics.top1HitRate * 100).toFixed(1)}% | ${
    (eightDMetrics.top2HitRate * 100).toFixed(1)
  }% | ${eightDMetrics.meanReciprocalRank.toFixed(3)} |

**Delta:** ${deltaPp.toFixed(1)} percentage points (8D − 1D)

## Verdict

\`\`\`json
${
    JSON.stringify(
      { verdict, reason: verdictExplanation(verdict, deltaPp, samples.length) },
      null,
      2,
    )
  }
\`\`\`

## Ambiguities / Skips

${ambiguous.length > 0 ? ambiguous.map((a) => `- ${a}`).join("\n") : "_None_"}

## Voice Profiles

${
    voices.map((v) => {
      const p = finalProfiles[v];
      const topPri = Object.entries(p.primaryOct).sort((a, b) =>
        b[1] - a[1]
      )[0]?.[0] ?? "none";
      const topTopic = Object.entries(p.topics).sort((a, b) =>
        b[1] - a[1]
      )[0]?.[0] ?? "none";
      return `### ${v}\n- Chords: ${p.total}\n- Top primary oct: ${topPri}\n- Top topic: ${topTopic}\n- Avg energy: ${
        p.avgEnergy.toFixed(2)
      }`;
    }).join("\n\n")
  }

## Sample Details

| Source | Target | 1D top-1 | 8D top-1 |
|---|---|---|---|
${
    samples.slice(0, 20).map((s) =>
      `| ${s.sourceId} | ${s.targetSpeaker} | ${s.oneD.predicted[0]} | ${
        s.eightD.predicted[0]
      } |`
    ).join("\n")
  }

${
    samples.length > 20
      ? `_... ${samples.length - 20} more samples in result.latest.json_`
      : ""
  }
`;

  await Deno.writeTextFile(`${outDir}/result.latest.md`, md);
  console.log(`Wrote ${outDir}/result.latest.md`);

  console.log("\n=== SUMMARY ===");
  console.log(`Verdict: ${verdict}`);
  console.log(`1D top1: ${(oneDMetrics.top1HitRate * 100).toFixed(1)}%`);
  console.log(`8D top1: ${(eightDMetrics.top1HitRate * 100).toFixed(1)}%`);
  console.log(`Delta:   ${deltaPp.toFixed(1)}pp`);
}

function verdictExplanation(
  verdict: string,
  deltaPp: number,
  n: number,
): string {
  if (verdict === "adopt_8d") {
    return `8D beats 1D by ${
      deltaPp.toFixed(1)
    }pp with ${n} samples. Promote to scheduler default.`;
  }
  if (verdict === "reject_8d_scheduler") {
    return `8D loses to 1D by ${
      Math.abs(deltaPp).toFixed(1)
    }pp. Do not use for scheduling.`;
  }
  return `8D within ${
    Math.abs(deltaPp).toFixed(1)
  }pp of 1D or underpowered (${n} samples). Keep as metadata only.`;
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
