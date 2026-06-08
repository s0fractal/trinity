#!/usr/bin/env -S deno run --allow-read --allow-run
// src/x2200_ecosystem.ts — substrate ecosystem mirror / federation read
// position: 2/2 → mirror(2) × mirror(2) = mirror of all substrate mirrors
// hex_dipole: "26 26 6C 26 26 26 26 59"
//   mirror_apex+0.85 (PRIMARY: reflects substrate ecosystem; bucket 2 MATCH)
//   completion_frontier+0.70 (composes terminal substrate-view across federation)
// placement_policy: axis
// intent: read all 5 SUBSTRATE_SELF_ABI.v0.1 slots from each substrate (omega/liquid/myc) in parallel; render unified federation dashboard
// maturity: active
// horizon: none (nested ecosystem state loading and formatting implemented)
// skill_tag: ecosystem
// skill_safe: yes-with-care
//
// "ecosystem" — unified mirror across all federated substrates.
//
// Pairs with `t self` (2/F) which mirrors trinity's own state.
// `t ecosystem` mirrors trinity + omega + liquid + myc by reading each
// substrate's SUBSTRATE_SELF_ABI.v0.1 slot files in parallel:
//   2/E status                 (executable, JSON envelope)
//   4/A capabilities           (executable, JSON envelope)
//   6/C audit                  (executable, JSON envelope)
//   8/D roadmap_projection     (markdown, frontmatter signal)
//   8/E probes_projection      (markdown, frontmatter signal)
//
// Per IN_LEDGER_SRC_PROJECTION.v0.2: each substrate emits its
// projections at predictable src/ coords. Trinity reads them; never
// traverses raw substrate state beyond the projection contract.
//
// 15 parallel reads (5 slots × 3 substrates). tryOr() per-slot so a
// missing slot doesn't block the rest.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { parallel, tryOr } from "./x0030_compose.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);

export const SUBSTRATES = ["omega", "liquid", "myc"] as const;
export type Substrate = typeof SUBSTRATES[number];

const STATE_FILE = join(TRINITY_ROOT, "src", "x2288_ecosystem.latest.myc.json");

export interface SavedSlotState {
  present: boolean;
  summary?: string;
  error?: string;
  mirrors?: Record<string, any>;
}

export interface SavedSubstrateState {
  abi_coverage: string;
  slots: Record<string, SavedSlotState>;
}

export type SavedEcosystemState = Record<string, SavedSubstrateState>;

interface DiffItem {
  substrate: string;
  message: string;
}

// Slot paths per SUBSTRATE_SELF_ABI.v0.1. Executable slots end in .ts
// and get invoked via deno run; projection slots end in .md and get
// read as text + frontmatter scanned.
export const SLOTS = {
  status: { path: "src/x2E00_status.ts", kind: "executable" as const },
  capabilities: {
    path: "src/x4A00_capabilities.ts",
    kind: "executable" as const,
  },
  audit: {
    path: "src/x6C00_audit.ts",
    kind: "executable" as const,
    fallbacks: ["src/x6C00_protocol_audit.ts", "src/x6C00_topology_audit.ts"],
  },
  roadmap: {
    path: "src/x8D00_roadmap_projection.myc.md",
    kind: "projection" as const,
  },
  probes: {
    path: "src/x8E00_probes_projection.myc.md",
    kind: "projection" as const,
  },
  ecosystem: {
    path: "src/x2200_ecosystem.ts",
    kind: "executable" as const,
    fallbacks: ["src/x2288_ecosystem.latest.myc.json"],
  },
};

export interface SlotResult {
  present: boolean;
  data?: unknown;
  summary?: string;
  error?: string;
  mirrors?: Record<string, any>;
}

export interface SubstrateMirror {
  substrate: Substrate;
  slots: Record<keyof typeof SLOTS, SlotResult>;
  abi_coverage: string; // "5/5" or "5/6"
}

async function runExecutable(absPath: string): Promise<unknown> {
  // Try with --json first (trinity convention). If organ rejects it
  // (e.g., myc's protocol_audit treats --json as positional dir arg),
  // retry without — those organs emit JSON unconditionally.
  for (
    const args of [["run", "-A", absPath, "--json"], ["run", "-A", absPath]]
  ) {
    const proc = new Deno.Command("deno", {
      args,
      stdout: "piped",
      stderr: "piped",
    });
    const { stdout } = await proc.output();
    const text = new TextDecoder().decode(stdout);
    const lines = text.split("\n");
    const startIdx = lines.findIndex((l) =>
      l.trimStart().startsWith("{") || l.trimStart().startsWith("[")
    );
    if (startIdx === -1) continue;
    try {
      return JSON.parse(lines.slice(startIdx).join("\n"));
    } catch {
      continue;
    }
  }
  throw new Error(`no parseable JSON output from ${absPath}`);
}

async function readProjection(
  absPath: string,
): Promise<{ frontmatter: Record<string, unknown>; sections: string[] }> {
  const text = await Deno.readTextFile(absPath);
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const frontmatter: Record<string, unknown> = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const kv = /^(\w+):\s*(.+)$/.exec(line.trim());
      if (kv) frontmatter[kv[1]] = kv[2].trim();
    }
  }
  const sections =
    text.match(/^###\s+(.+)$/gm)?.map((s) => s.replace(/^###\s+/, "")) ?? [];
  return { frontmatter, sections };
}

export async function readSlot(
  substrate: Substrate,
  slotName: keyof typeof SLOTS,
): Promise<SlotResult> {
  const slot = SLOTS[slotName];
  const candidates = [
    slot.path,
    ...(("fallbacks" in slot) ? slot.fallbacks : []),
  ];

  for (const candidate of candidates) {
    const absPath = join(TRINITY_ROOT, substrate, candidate);
    try {
      await Deno.stat(absPath);
    } catch {
      continue; // try next candidate
    }
    try {
      if (absPath.endsWith(".json")) {
        const text = await Deno.readTextFile(absPath);
        const data = JSON.parse(text);
        const nestedMirrors = data.mirrors || data;
        let summary = "ok";
        if (nestedMirrors && typeof nestedMirrors === "object") {
          const keys = Object.keys(nestedMirrors);
          summary = `${keys.length} nested substrate${keys.length === 1 ? "" : "s"}: ${keys.join("; ")}`;
        }
        return {
          present: true,
          data,
          summary,
          mirrors: nestedMirrors,
        };
      } else if (slot.kind === "executable") {
        const data = await runExecutable(absPath);
        const d = data as { summary?: { overall?: string }; mirrors?: Record<string, any> };
        const nestedMirrors = d.mirrors;
        let summary = d.summary?.overall ?? "ok";
        if (nestedMirrors && typeof nestedMirrors === "object") {
          const keys = Object.keys(nestedMirrors);
          summary = `${keys.length} nested substrate${keys.length === 1 ? "" : "s"}: ${keys.join("; ")}`;
        }
        return {
          present: true,
          data,
          summary,
          mirrors: nestedMirrors,
        };
      } else {
        const proj = await readProjection(absPath);
        return {
          present: true,
          data: proj,
          summary: proj.sections.length > 0
            ? `${proj.sections.length} signals: ${
              proj.sections.slice(0, 3).join("; ").slice(0, 80)
            }${proj.sections.length > 3 ? "..." : ""}`
            : "no sections",
        };
      }
    } catch (e) {
      return { present: true, error: String(e).slice(0, 200) };
    }
  }
  return { present: false };
}

export async function readSubstrate(substrate: Substrate): Promise<SubstrateMirror> {
  const slots = await parallel({
    status: () =>
      tryOr(() => readSlot(substrate, "status"), { present: false }),
    capabilities: () =>
      tryOr(() => readSlot(substrate, "capabilities"), { present: false }),
    audit: () => tryOr(() => readSlot(substrate, "audit"), { present: false }),
    roadmap: () =>
      tryOr(() => readSlot(substrate, "roadmap"), { present: false }),
    probes: () =>
      tryOr(() => readSlot(substrate, "probes"), { present: false }),
    ecosystem: () =>
      tryOr(() => readSlot(substrate, "ecosystem"), { present: false }),
  });
  const presentCount = Object.values(slots).filter((s) => s.present).length;
  return {
    substrate,
    slots,
    abi_coverage: `${presentCount}/6`,
  };
}

async function loadPreviousState(): Promise<SavedEcosystemState | null> {
  return await tryOr(async () => {
    const text = await Deno.readTextFile(STATE_FILE);
    return JSON.parse(text) as SavedEcosystemState;
  }, null as SavedEcosystemState | null);
}

async function saveCurrentState(
  mirrors: Record<Substrate, SubstrateMirror>,
): Promise<void> {
  await tryOr(async () => {
    await Deno.mkdir(join(TRINITY_ROOT, "src"), { recursive: true });
    const stateToSave: SavedEcosystemState = {} as SavedEcosystemState;
    for (const [sub, m] of Object.entries(mirrors)) {
      stateToSave[sub] = {
        abi_coverage: m.abi_coverage,
        slots: Object.fromEntries(
          Object.entries(m.slots).map(([k, v]) => [k, {
            present: v.present,
            summary: v.summary,
            error: v.error,
            mirrors: v.mirrors,
          }]),
        ),
      };
    }
    await Deno.writeTextFile(STATE_FILE, JSON.stringify(stateToSave, null, 2));
  }, undefined);
}

export function diffEcosystem(
  prev: SavedEcosystemState,
  current: Record<Substrate, SubstrateMirror>,
): DiffItem[] {
  const diffs: DiffItem[] = [];
  for (const sub of SUBSTRATES) {
    const currSub = current[sub];
    const prevSub = prev[sub];
    if (!prevSub) {
      diffs.push({ substrate: sub, message: `substrate added to federation` });
      continue;
    }

    if (prevSub.abi_coverage !== currSub.abi_coverage) {
      diffs.push({
        substrate: sub,
        message:
          `ABI coverage changed from "${prevSub.abi_coverage}" to "${currSub.abi_coverage}"`,
      });
    }

    for (const slotName of Object.keys(SLOTS) as (keyof typeof SLOTS)[]) {
      const currSlot = currSub.slots[slotName];
      const prevSlot = prevSub.slots[slotName] as SavedSlotState | undefined;

      if (!prevSlot) {
        if (currSlot.present) {
          diffs.push({
            substrate: sub,
            message: `slot ${slotName}: added (${currSlot.summary ?? "ok"})`,
          });
        }
        continue;
      }

      if (prevSlot.present !== currSlot.present) {
        if (currSlot.present) {
          diffs.push({
            substrate: sub,
            message: `slot ${slotName}: added (${currSlot.summary ?? "ok"})`,
          });
        } else {
          diffs.push({
            substrate: sub,
            message: `slot ${slotName}: removed`,
          });
        }
        continue;
      }

      if (currSlot.present) {
        if (currSlot.error && !prevSlot.error) {
          diffs.push({
            substrate: sub,
            message: `slot ${slotName}: error introduced ("${currSlot.error}")`,
          });
        } else if (!currSlot.error && prevSlot.error) {
          diffs.push({
            substrate: sub,
            message: `slot ${slotName}: error resolved (now: "${
              currSlot.summary ?? "ok"
            }")`,
          });
        } else if (currSlot.error && prevSlot.error) {
          if (currSlot.error !== prevSlot.error) {
            diffs.push({
              substrate: sub,
              message:
                `slot ${slotName}: error changed from "${prevSlot.error}" to "${currSlot.error}"`,
            });
          }
        } else {
          if (currSlot.summary !== prevSlot.summary) {
            diffs.push({
              substrate: sub,
              message: `slot ${slotName}: updated ("${
                prevSlot.summary ?? "ok"
              }" -> "${currSlot.summary ?? "ok"}")`,
            });
          }
        }
      }
    }
  }
  return diffs;
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const wantSave = Deno.args.includes("--save");

  // Read previous state snapshot first
  const prevEcosystemState = await loadPreviousState();

  // 3 substrates in parallel; each reads its 5 slots in parallel.
  // Total: 15 concurrent reads.
  const mirrors = await parallel({
    omega: () => readSubstrate("omega"),
    liquid: () => readSubstrate("liquid"),
    myc: () => readSubstrate("myc"),
  });

  // Save current state ONLY if --save flag is provided
  if (wantSave) {
    await saveCurrentState(mirrors);
  }

  // Compute diffs if previous state existed
  const diffs = prevEcosystemState
    ? diffEcosystem(prevEcosystemState, mirrors)
    : [];

  const ordered: SubstrateMirror[] = [
    mirrors.omega,
    mirrors.liquid,
    mirrors.myc,
  ];
  const totalSlots = ordered.length * 6;
  const presentSlots = ordered.reduce(
    (sum, m) => sum + Object.values(m.slots).filter((s) => s.present).length,
    0,
  );

  if (wantJson) {
    const receipt = {
      type: "ecosystem",
      position: "2/2",
      action: "ecosystem",
      note:
        "mirror × mirror — substrate federation mirror; reads SUBSTRATE_SELF_ABI.v0.1 slots from each substrate",
      summary: {
        substrates: ordered.length,
        abi_coverage: `${presentSlots}/${totalSlots}`,
      },
      mirrors: Object.fromEntries(
        ordered.map((m) => [m.substrate, {
          abi_coverage: m.abi_coverage,
          slots: Object.fromEntries(
            Object.entries(m.slots).map(([k, v]) => [k, {
              present: v.present,
              summary: v.summary,
              error: v.error,
            }]),
          ),
        }]),
      ),
      diff: diffs.map((d) => ({ substrate: d.substrate, message: d.message })),
      synonyms: ["ecosystem", "federation", "all-substrates", "екосистема"],
      topology:
        "parallel reads of 5 ABI slots × N substrates; per-slot tryOr() failure-tolerant; renders unified dashboard; write is read-only by default, saves on --save",
    };
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(`# ecosystem @ 2/2 — substrate federation mirror`);
    console.log(`# ${"─".repeat(78)}`);
    console.log(
      `# ABI coverage: ${presentSlots}/${totalSlots} slots across ${ordered.length} substrates`,
    );
    console.log(`# ${"─".repeat(78)}`);

    if (prevEcosystemState && diffs.length > 0) {
      console.log(`# changes since last saved invocation:`);
      for (const d of diffs) {
        console.log(`#   ⚠ ${d.substrate}: ${d.message}`);
      }
      console.log(`# ${"─".repeat(78)}`);
    }

    for (const m of ordered) {
      console.log(`# ${m.substrate.toUpperCase()}  [${m.abi_coverage} slots]`);
      for (const [slotName, result] of Object.entries(m.slots)) {
        const status = !result.present
          ? "✗ missing"
          : result.error
          ? `⚠ error: ${result.error.slice(0, 60)}`
          : `✓ ${result.summary?.slice(0, 70) ?? "ok"}`;
        console.log(`#   ${slotName.padEnd(13)} ${status}`);
        if (result.present && result.mirrors && typeof result.mirrors === "object") {
          for (const [nSub, nMirror] of Object.entries(result.mirrors)) {
            const nested = nMirror as { abi_coverage?: string; slots?: Record<string, any> };
            const cov = nested.abi_coverage ? ` [${nested.abi_coverage}]` : "";
            let nStatus = "";
            if (nested.slots && nested.slots.status) {
              const sRes = nested.slots.status;
              nStatus = sRes.error ? ` ⚠ error` : (sRes.summary ? ` (status: ✓ ${sRes.summary})` : "");
            }
            console.log(`#     ↳ ${nSub.padEnd(11)}${cov}${nStatus}`);
          }
        }
      }
      console.log(`#`);
    }
    console.log(`# ${"─".repeat(78)}`);
    console.log(
      `# Drill into a substrate: cd <name> && deno run -A src/x<coord>_<slot>.ts`,
    );
    console.log(`# Save current state for next diff: t ecosystem --save`);
    console.log(`# Trinity's own mirror:   t self`);
  }
}
