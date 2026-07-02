#!/usr/bin/env -S deno run -A
// src/x8300_physics.ts — physics / substrate-weather (a read-only LENS)
// position: 8/3 → projection(8) × observation(3) = a projection that OBSERVES
//   substrate pressure without acting on it ("the first living sign is not
//   autonomy — it is pressure becoming visible", RFC-0002 §12).
// hex_dipole: "59 00 00 33 00 00 00 00"
//   void_infinity+0.70 (PRIMARY: projection/cache pole; bucket 8 MATCH on axis 0)
//   triangle_build ← observation pole +0.40 (axis 3: it reads and reports)
// placement_policy: axis
// maturity: draft
// horizon: v0 composes trinity-native signals; v0.2 extends the lens over
//   omega/liquid energy organs (xA017/xA036/xA204) — READ, never recompute.
// skill_tag: physics
// skill_safe: yes-with-care
//   default run is read-only; --stable writes one tracked projection
//   (src/x8388_physics.latest.myc.md) — a benign, idempotent, deterministic regen,
//   maintained like every other stable projection.
//
// intent: make substrate PRESSURE legible in one glance. This is a LENS, NOT an
//   engine: it recomputes nothing. It composes the ALREADY-COMPUTED outputs of
//   existing organs (`t decisions`, `t evidence`, the cognition field) into a
//   weather report — hot / unstable / blocked / alive / dormant regions, each
//   signal traced back to the organ that produced it. It forks no physics.
//   (Adjudicated form: trinity chord x7700_956369, codex x1d00_956368 P1;
//   RFC docs/rfc/0002-living-substrate-implementation-seed.md.)
//
// Usage:
//   t physics                 compact substrate weather (regions + top pressure)
//   t physics --json          machine-readable payload
//   t physics --stable        deterministic; (re)write src/x8388_physics.latest.myc.md
//   t physics explain <region>  why a region scored as it did (cites signals)
//   t physics falsifiers      the tests that would prove this lens wrong

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { formatGeneratedFile } from "./x0012_generated_format.ts";
import { sha256Hex } from "./x4010_hash.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const DISPATCH = join(HERE, "x0100_dispatch.ts");
const OUT = join(HERE, "x8388_physics.latest.myc.md");
const COGNITION_FIELD = join(HERE, "x2588_cognition_field.latest.myc.json");

export const PROJECTION_VERSION = "physics.v0.1";

// ── vocabulary ──────────────────────────────────────────────────────────────
export type Health =
  | "blocked" // an active blocker holds this region
  | "unstable" // multiple watch signals — ambiguity/friction accumulating
  | "hot" // a single watch signal — one live pressure point
  | "alive" // activity present, no friction
  | "dormant" // no activity, no pressure
  | "cold"; // baseline / nothing to report

export type Level = "ok" | "watch" | "block";

export interface Signal {
  label: string;
  value: string;
  level: Level;
  note: string;
}

export interface Region {
  region: string;
  source: string; // the organ whose output this composes
  health: Health;
  pressure: number; // 0..1 presentation scalar over this region's own signals
  headline: string;
  signals: Signal[];
}

/**
 * Classify a region from its OWN signals. This is a transparent status-light
 * over already-computed values — NOT a physics formula. `hasActivity` lets a
 * region read as `alive` vs `dormant` when there is no friction.
 */
export function classify(
  signals: Signal[],
  hasActivity: boolean,
): { health: Health; pressure: number } {
  const block = signals.filter((s) => s.level === "block").length;
  const watch = signals.filter((s) => s.level === "watch").length;
  const pressure = signals.length === 0
    ? 0
    : Math.min(1, (block * 1.0 + watch * 0.5) / signals.length);
  let health: Health;
  if (block > 0) health = "blocked";
  else if (watch >= 2) health = "unstable";
  else if (watch === 1) health = "hot";
  else if (hasActivity) health = "alive";
  else health = "dormant";
  return { health, pressure: Math.round(pressure * 100) / 100 };
}

// ── region builders (pure — take already-parsed organ output) ────────────────

/** Governance pressure from `t decisions` — the process ledger's own tallies. */
export function governanceRegion(decisions: any): Region {
  const s = decisions?.summary ?? {};
  const re = s.receipt_evidence ?? {};
  const triage = s.proposal_triage ?? {};
  const signals: Signal[] = [
    {
      label: "open_debts",
      value: String(s.open_debts ?? 0),
      level: (s.open_debts ?? 0) > 0 ? "block" : "ok",
      note: "unclosed obligations recorded in the ledger",
    },
    {
      label: "unresolved_critiques",
      value: String(s.unresolved_critiques ?? 0),
      level: (s.unresolved_critiques ?? 0) > 0 ? "block" : "ok",
      note: "critiques awaiting a response",
    },
    {
      label: "ritual_receipts",
      value: String(s.ritual_receipts ?? 0),
      level: (s.ritual_receipts ?? 0) > 0 ? "watch" : "ok",
      note: "receipts with no verifiable artifact (narrative-only)",
    },
    {
      label: "receipt_evidence.none",
      value: String(re.none ?? 0),
      level: (re.none ?? 0) > 0 ? "watch" : "ok",
      note: "receipts carrying zero evidence markers",
    },
    {
      label: "triage.revalidate+review",
      value: String((triage.revalidate ?? 0) + (triage.review ?? 0)),
      level: (triage.revalidate ?? 0) + (triage.review ?? 0) > 0
        ? "watch"
        : "ok",
      note: "proposals flagged for revalidation or careful review",
    },
  ];
  const activity = (s.unresolved_proposals ?? 0) > 0 ||
    (s.proposals ?? 0) > 0;
  const { health, pressure } = classify(signals, activity);
  return {
    region: "governance",
    source: "t decisions",
    health,
    pressure,
    headline: `${s.proposals ?? 0} proposals · ${s.receipts ?? 0} receipts · ` +
      `${s.unresolved_proposals ?? 0} unresolved`,
    signals,
  };
}

/** Proof pressure from `t evidence` — contract/claim backing (deterministic
 *  sub-fields only; daemon/CI counts are runtime-volatile and excluded). */
export function proofRegion(evidence: any): Region {
  const e = evidence ?? {};
  const strictFailures: string[] = Array.isArray(e.strict_failures)
    ? e.strict_failures
    : [];
  const exec = e.executable_contracts ?? 0;
  const unlabeled = e.unlabeled_contracts ?? 0;
  const signals: Signal[] = [
    {
      label: "strict_failures",
      value: String(strictFailures.length),
      level: strictFailures.length > 0 ? "block" : "ok",
      note: "evidence --strict assertions currently failing",
    },
    {
      label: "unlabeled_contracts",
      value: String(unlabeled),
      level: unlabeled > exec ? "watch" : "ok",
      note: "contracts missing an implementation_status label (labeling-debt)",
    },
    {
      label: "executable_contracts",
      value: String(exec),
      level: exec === 0 ? "watch" : "ok",
      note: "contracts backed by a runnable, implemented command",
    },
  ];
  const { health, pressure } = classify(signals, exec > 0);
  return {
    region: "proof",
    source: "t evidence",
    health,
    pressure,
    headline: `${exec} executable · ${unlabeled} unlabeled · ` +
      `${strictFailures.length} strict-failures`,
    signals,
  };
}

/** Cognitive coherence from the committed cognition field. Phase is a
 *  DESCRIPTOR, never a fitness target — reported, not steered. */
export function cognitionRegion(field: any): Region {
  const cur = field?.current ?? {};
  const dist = cur.phase_distribution ?? {};
  const dirty = cur.dirty_total ?? 0;
  const dominant = cur.dominant_phase ?? "unknown";
  const signals: Signal[] = [
    {
      label: "dirty_total",
      value: String(dirty),
      level: dirty > 0 ? "watch" : "ok",
      note: "cognition nodes whose phase drifted from their content",
    },
    {
      label: "dominant_phase",
      value: String(dominant),
      level: "ok",
      note: "most common thinking phase across the substrate (descriptor)",
    },
    {
      label: "phases_present",
      value: String(Object.keys(dist).length),
      level: "ok",
      note: "distinct thinking phases in play",
    },
  ];
  const { health, pressure } = classify(signals, (cur.total_md ?? 0) > 0);
  return {
    region: "cognition",
    source: "cognition field (x2588)",
    health,
    pressure,
    headline: `${cur.total_md ?? 0} nodes · dominant: ${dominant} · ` +
      `${dirty} drifted`,
    signals,
  };
}

// ── weather assembly ─────────────────────────────────────────────────────────
export interface Weather {
  regions: Region[];
  hot: string[];
  unstable: string[];
  blocked: string[];
  dormant: string[];
}

export function assembleWeather(regions: Region[]): Weather {
  const by = (h: Health) =>
    regions.filter((r) => r.health === h).map((r) => r.region);
  return {
    regions,
    hot: by("hot"),
    unstable: by("unstable"),
    blocked: by("blocked"),
    dormant: by("dormant"),
  };
}

// Declared (not yet computed) organism routing — RFC-0002 §7.3. Kept explicit
// and labelled so it reads as guidance, not a live niche-fit computation.
const DECLARED_ROUTING: Record<string, string> = {
  codex: "falsifiers, implementation seams, test/proof pressure",
  claude: "semantic audit, RFC consolidation, ledger coherence",
  hermes: "routing / communication pressure",
};

export const FALSIFIERS: string[] = [
  "Non-reproducible: `t physics --stable` produces different bytes on the same repo state (ignoring generated_at).",
  "Boundary failure: another command trusts src/x8388_physics.latest.myc.md as source truth without re-deriving.",
  "No explanation: a region reads blocked/unstable/hot but `t physics explain <region>` shows no contributing signal.",
  "Authority inflation: this lens applies or recommends-as-applied any capability/phase change (it must only report).",
  "Fork: a future revision recomputes liquid/omega energy/metabolism independently instead of reading their organs.",
  "LLM dependency: the projection cannot be produced without an LLM call.",
];

function pressureBar(p: number): string {
  const n = Math.max(0, Math.min(10, Math.round(p * 10)));
  return "█".repeat(n) + "░".repeat(10 - n);
}

/** Deterministic given (regions). generated_at is null in --stable so bytes are
 *  reproducible (Falsifier 1). */
export function renderWeather(
  weather: Weather,
  meta: { generated_at: string | null; manifest_hash: string },
): string {
  const L: string[] = [];
  L.push(
    "<!-- AUTO-GENERATED by src/x8300_physics.ts — do not edit by hand. -->",
  );
  L.push("<!-- This file is a projection/cache, NOT source of truth. -->");
  if (meta.generated_at) L.push(`<!-- generated_at: ${meta.generated_at} -->`);
  L.push(`<!-- source_manifest_hash: ${meta.manifest_hash} -->`);
  L.push("");
  L.push("# Substrate weather");
  L.push("");
  L.push(
    "A read-only LENS: it composes what the organs already compute " +
      "(`t decisions`, `t evidence`, the cognition field) into pressure. " +
      "It recomputes nothing and forks no physics.",
  );
  L.push("");
  L.push("## Summary");
  L.push("");
  const line = (label: string, arr: string[]) =>
    `- ${label}: ${arr.length}${arr.length ? ` (${arr.join(", ")})` : ""}`;
  L.push(line("Blocked regions", weather.blocked));
  L.push(line("Unstable regions", weather.unstable));
  L.push(line("Hot regions", weather.hot));
  L.push(line("Dormant regions", weather.dormant));
  L.push("");
  L.push("## Regions");
  L.push("");
  L.push("| region | health | pressure | headline | source |");
  L.push("| :--- | :--- | :--- | :--- | :--- |");
  for (const r of weather.regions) {
    L.push(
      `| ${r.region} | **${r.health}** | \`${pressureBar(r.pressure)}\` ${
        r.pressure.toFixed(2)
      } | ${r.headline} | \`${r.source}\` |`,
    );
  }
  L.push("");
  L.push("## Declared organism routing");
  L.push("");
  L.push("_Declared in RFC-0002 §7.3 — NOT yet computed from live niche-fit._");
  L.push("");
  for (const [voice, niche] of Object.entries(DECLARED_ROUTING)) {
    L.push(`- \`${voice}\`: ${niche}`);
  }
  L.push("");
  L.push("## Deferred lenses (v0.2)");
  L.push("");
  L.push(
    "- **structure** ← live audit (mismatch/import-warnings/orphans) — the " +
      "cached sidecar is stale; wiring a fresh deterministic read is deferred.",
  );
  L.push("- **ci** ← federation CI freshness — cached state is stale/unknown.");
  L.push(
    "- **energy** ← omega/liquid organs (xA017/xA036/xA204) — READ their " +
      "output, never recompute (the fork falsifier).",
  );
  L.push("");
  L.push("## Falsifiers");
  L.push("");
  for (const f of FALSIFIERS) L.push(`- ${f}`);
  L.push("");
  return L.join("\n") + "\n";
}

// ── I/O (impure) ─────────────────────────────────────────────────────────────
async function callJson(args: string[]): Promise<any> {
  const p = new Deno.Command("deno", {
    args: ["run", "-A", DISPATCH, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const o = await p.output();
  const out = new TextDecoder().decode(o.stdout);
  const i = out.split("\n").findIndex((l) => l.trimStart().startsWith("{"));
  if (i === -1) throw new Error(`no JSON from: ${args.join(" ")}`);
  return JSON.parse(out.split("\n").slice(i).join("\n"));
}

async function readSidecar(path: string): Promise<any> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch {
    return null;
  }
}

async function gatherRegions(): Promise<Region[]> {
  const [decisions, evidence, field] = await Promise.all([
    callJson(["decisions", "--json"]).catch(() => null),
    callJson(["evidence", "--json"]).catch(() => null),
    readSidecar(COGNITION_FIELD),
  ]);
  return [
    governanceRegion(decisions),
    proofRegion(evidence),
    cognitionRegion(field),
  ];
}

// The deterministic basis: only the fields actually rendered, no timestamps or
// runtime-volatile counts. Same repo state → same hash → same bytes.
async function manifestHash(regions: Region[]): Promise<string> {
  const basis = regions.map((r) => ({
    region: r.region,
    health: r.health,
    pressure: r.pressure,
    signals: r.signals.map((s) => ({ l: s.label, v: s.value, lv: s.level })),
  }));
  return `sha256:${await sha256Hex(JSON.stringify(basis))}`;
}

function buildPayload(weather: Weather, manifest_hash: string) {
  return {
    type: "physics",
    position: "8/3",
    action: "physics",
    projection_version: PROJECTION_VERSION,
    manifest_hash,
    blocked: weather.blocked,
    unstable: weather.unstable,
    hot: weather.hot,
    dormant: weather.dormant,
    regions: weather.regions,
  };
}

async function main(argv: string[]) {
  const sub = argv.find((a) => !a.startsWith("-"));

  if (sub === "falsifiers") {
    if (argv.includes("--json")) {
      console.log(
        JSON.stringify(
          { type: "physics_falsifiers", falsifiers: FALSIFIERS },
          null,
          2,
        ),
      );
    } else {
      console.log(
        "# physics falsifiers — the tests that would prove this lens wrong",
      );
      for (const f of FALSIFIERS) console.log(`  - ${f}`);
    }
    return;
  }

  const regions = await gatherRegions();
  const weather = assembleWeather(regions);
  const manifest_hash = await manifestHash(regions);

  if (sub === "explain") {
    const target = argv.filter((a) => !a.startsWith("-"))[1];
    const r = regions.find((x) => x.region === target);
    if (!r) {
      console.log(
        `# physics explain — unknown region "${target ?? ""}"; known: ${
          regions.map((x) => x.region).join(", ")
        }`,
      );
      return;
    }
    console.log(`# physics explain → ${r.region}`);
    console.log(`health: ${r.health}   pressure: ${r.pressure.toFixed(2)}`);
    console.log(`source: ${r.source}`);
    console.log("");
    for (const s of r.signals) {
      const mark = s.level === "block"
        ? "⛔"
        : s.level === "watch"
        ? "⚠️ "
        : "✅";
      console.log(`  ${mark} ${s.label} = ${s.value}  — ${s.note}`);
    }
    return;
  }

  const wantJson = argv.includes("--json");
  const wantStable = argv.includes("--stable");

  if (wantStable) {
    const md = renderWeather(weather, { generated_at: null, manifest_hash });
    await Deno.writeTextFile(OUT, md);
    await formatGeneratedFile(OUT);
  }

  if (wantJson) {
    console.log(JSON.stringify(buildPayload(weather, manifest_hash), null, 2));
    return;
  }

  // compact human weather
  console.log("# physics → 8/3 — substrate weather (read-only lens)");
  console.log(
    `#   blocked:${weather.blocked.length} unstable:${weather.unstable.length} ` +
      `hot:${weather.hot.length} dormant:${weather.dormant.length}`,
  );
  console.log("");
  for (const r of weather.regions) {
    console.log(
      `  ${r.region.padEnd(12)} ${r.health.padEnd(9)} ${
        pressureBar(r.pressure)
      } ${r.pressure.toFixed(2)}  ${r.headline}`,
    );
  }
  console.log("");
  console.log(
    "  explain: t physics explain <region>   falsifiers: t physics falsifiers",
  );
  if (wantStable) console.log("  wrote: src/x8388_physics.latest.myc.md");
}

if (import.meta.main) {
  await main(Deno.args);
}
