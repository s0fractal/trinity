#!/usr/bin/env -S deno run --allow-all
// src/x6E00_court.ts — court (Substrate Court verifier)
// position: 6/E → harmony(6) × harmony-pair(E) = verdict-of-witnesses
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "26 26 33 26 33 26 6C 59"
//   harmony_emergence+0.85 (PRIMARY: court harmonizes witness envelopes)
//   completion_frontier+0.70 (verdict completes a witness chain)
//   mirror_apex+0.40 (court reflects substrate state)
//   foundation_container+0.40 (verification is foundational)
//   action_decision+0.30, triangle_build+0.30 (composes verdict from inputs)
//   bucket 6/E: primary axis harmony (6), bucket 6 ← MATCH on axis 6
//               secondary 'E' → completion-pair, verdict-shape
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// court — multi-envelope cross-substrate verdict
//
// Routes to probes/substrate-court-v0/ts/court.ts. Accepts envelope
// JSON file paths as positional args; emits SubstrateCourtVerdict.
//
// Usage:
//   t court <env1.json> <env2.json> [<env3.json> ...]
//   t court --live    # adjudicate trinity's real status --envelope + the
//                     # live R3 law bridge (omega-native vs trinity-witnessed)
//
// Exit code 0 if agreement, non-zero if any conflict detected.
//
// Glossary words: court, verdict, witness-verdict, суд, вердикт

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const COURT = `${ROOT}/probes/substrate-court-v0/ts/court.ts`;

/** The R3 law bridge: does trinity's WITNESSED law_hash match omega's NATIVE
 *  one? `consistent` is only true when both are present and equal; absent
 *  (e.g. omega submodule stripped) is `null`, never a false positive. Pure;
 *  exported for the test. */
export function lawBridge(
  omegaNative: string | null,
  trinityWitnessed: string | null,
): {
  omega_native: string | null;
  trinity_witnessed: string | null;
  consistent: boolean | null;
} {
  const consistent = omegaNative === null || trinityWitnessed === null
    ? null
    : omegaNative === trinityWitnessed;
  return {
    omega_native: omegaNative,
    trinity_witnessed: trinityWitnessed,
    consistent,
  };
}

/** Run a deno organ and parse its JSON stdout (dropping `#` comment lines). */
async function runJson(args: string[]): Promise<unknown> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", ...args],
    stdout: "piped",
    stderr: "null",
  });
  const out = await proc.output();
  const text = new TextDecoder().decode(out.stdout)
    .split("\n").filter((l) => !l.trimStart().startsWith("#")).join("\n")
    .trim();
  return text ? JSON.parse(text) : null;
}

async function live() {
  // trinity's own signed substrate_health envelope + the law it witnessed.
  const trinityStatus = await runJson([
    join(HERE, "x2E00_status.ts"),
    "--envelope",
  ]) as Record<string, unknown> | null;
  const trinityEnvelope = trinityStatus?.substrate_health_envelope;
  const trinityWitnessed =
    ((trinityStatus?.substrate_health as Record<string, unknown> | undefined)
      ?.law_hash as string | null | undefined) ?? null;

  // omega's OWN signed witness + native law_hash, from omega's own status organ
  // (null when the submodule is absent — graceful, not fatal).
  let omegaNative: string | null = null;
  let omegaEnvelope: unknown = null;
  try {
    const omegaStatus = await runJson([
      join(ROOT, "omega", "src", "x2E00_status.ts"),
      "--envelope",
    ]) as Record<string, unknown> | null;
    omegaNative = (omegaStatus?.law_hash as string | undefined) ?? null;
    omegaEnvelope = omegaStatus?.substrate_health_envelope ?? null;
  } catch { /* omega absent — omegaNative/omegaEnvelope stay null */ }

  // Adjudicate the real, independently-signed envelopes via the probe court.
  const envelopes = [trinityEnvelope, omegaEnvelope].filter(Boolean);
  let court: unknown = null;
  if (envelopes.length > 0) {
    const tmps: string[] = [];
    try {
      const courtArgs: string[] = ["run", "--allow-read", COURT];
      for (const e of envelopes) {
        const tmp = await Deno.makeTempFile({ suffix: ".json" });
        tmps.push(tmp);
        await Deno.writeTextFile(tmp, JSON.stringify(e));
        courtArgs.push("--envelope", tmp);
      }
      const proc = new Deno.Command("deno", {
        args: courtArgs,
        stdout: "piped",
        stderr: "null",
      });
      const out = await proc.output();
      court = JSON.parse(new TextDecoder().decode(out.stdout).trim());
    } finally {
      for (const t of tmps) await Deno.remove(t).catch(() => {});
    }
  }

  const bridge = lawBridge(omegaNative, trinityWitnessed);
  console.log(JSON.stringify(
    {
      type: "SubstrateCourtLiveVerdict",
      position: "6/E",
      witnesses: envelopes.map((e) =>
        (e as Record<string, unknown>).substrate_tag
      ),
      law_bridge: bridge,
      court,
      note: omegaNative === null
        ? "omega absent — law bridge unverifiable; court reflects trinity's self-witness only"
        : "live: trinity's witnessed law_hash cross-checked against omega's native value",
    },
    null,
    2,
  ));
  Deno.exit(bridge.consistent === false ? 1 : 0);
}

async function main() {
  const args = Deno.args;

  if (args.includes("--live")) {
    await live();
    return;
  }

  if (args.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "court requires at least one envelope path",
      position: "6/E",
      available: "t court <envelope1.json> [envelope2.json ...]",
    }));
    Deno.exit(1);
  }

  const envelopeArgs: string[] = [];
  for (const a of args) {
    envelopeArgs.push("--envelope", a);
  }

  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-read", COURT, ...envelopeArgs],
    stdout: "piped",
    stderr: "inherit",
  });
  const out = await proc.output();

  // Pass through the verdict JSON verbatim (court already emits clean JSON).
  const verdict = new TextDecoder().decode(out.stdout);
  Deno.stdout.writeSync(new TextEncoder().encode(verdict));
  Deno.exit(out.code);
}

if (import.meta.main) {
  await main();
}
