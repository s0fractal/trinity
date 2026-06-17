#!/usr/bin/env -S deno run --allow-all
// src/x6E00_court.ts — court (Substrate Court verifier)
// position: 6/E → harmony(6) × harmony-pair(E) = verdict-of-witnesses
// maturity: active
// skill_safe: yes-with-care
//   no substrate-state change; touches the filesystem only via ephemeral temp
//   files that are written then removed within the same run
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
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

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

/** The single law-drift signal for `--live` (codex R2): true if the N-ary court
 *  reports any `law_hash_drift` conflict OR the omega/trinity bridge is
 *  explicitly inconsistent (false). A null/absent bridge is unverifiable, not
 *  drift. Process exit and the `law_drift` verdict field both derive from this,
 *  so they never disagree. Pure; exported for the test. */
export function liveLawDrift(
  court: unknown,
  bridgeConsistent: boolean | null | undefined,
): boolean {
  const c = (court ?? {}) as Record<string, unknown>;
  const conflicts = Array.isArray(c.conflicts) ? c.conflicts : [];
  const courtDrift = conflicts.some((x) =>
    (x as { kind?: string })?.kind === "law_hash_drift"
  );
  return courtDrift || bridgeConsistent === false;
}

/** Run a deno organ and parse its JSON stdout — through the shared execution
 *  kernel (x0010), so each substrate witness call is timeout- and byte-bounded
 *  (codex Phase B); a hung substrate status organ can't stall the court. */
async function runJson(args: string[]): Promise<unknown> {
  const r = await runOrgan("deno", ["run", "--allow-all", ...args]);
  const payload = extractOrganJson(r.stdout);
  // extractOrganJson returns {text} for non-JSON; the court's callers expect a
  // parsed object or null, matching the prior `text ? JSON.parse : null`.
  return (payload && typeof payload === "object" && "text" in payload)
    ? null
    : payload ?? null;
}

/** A substrate's own status organ + the law_hash it reported. */
async function statusWitness(
  path: string,
): Promise<{ envelope: unknown; law_hash: string | null } | null> {
  try {
    const s = await runJson([path, "--envelope"]) as
      | Record<string, unknown>
      | null;
    if (!s || !s.substrate_health_envelope) return null;
    const law_hash =
      ((s.substrate_health as Record<string, unknown> | undefined)
        ?.law_hash as string | null | undefined) ?? null;
    return { envelope: s.substrate_health_envelope, law_hash };
  } catch {
    return null; // substrate absent / no --envelope support
  }
}

async function live() {
  // Every substrate that emits a signed substrate_health envelope is a witness.
  // trinity is always present; the submodules join when checked out (graceful
  // when absent). The court is N-ary, not a trinity+omega special case.
  const sources = [
    { tag: "trinity", path: join(HERE, "x2E00_status.ts") },
    { tag: "omega", path: join(ROOT, "omega", "src", "x2E00_status.ts") },
    { tag: "liquid", path: join(ROOT, "liquid", "src", "x2E00_status.ts") },
    { tag: "myc", path: join(ROOT, "myc", "src", "x2E00_status.ts") },
  ];

  const envelopes: unknown[] = [];
  let omegaNative: string | null = null;
  let trinityWitnessed: string | null = null;
  for (const s of sources) {
    const w = await statusWitness(s.path);
    if (!w) continue;
    envelopes.push(w.envelope);
    if (s.tag === "omega") omegaNative = w.law_hash;
    if (s.tag === "trinity") trinityWitnessed = w.law_hash;
  }
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
  const law_drift = liveLawDrift(court, bridge.consistent);
  console.log(JSON.stringify(
    {
      type: "SubstrateCourtLiveVerdict",
      position: "6/E",
      witnesses: envelopes.map((e) =>
        (e as Record<string, unknown>).substrate_tag
      ),
      law_bridge: bridge,
      // Single authoritative law-drift signal (codex R2): the process exit and
      // this field agree, so machine callers don't need to know which of
      // law_bridge vs court.conflicts is decisive.
      law_drift,
      court,
      note: omegaNative === null
        ? "omega absent — law bridge unverifiable; court reflects trinity's self-witness only"
        : "live: trinity's witnessed law_hash cross-checked against omega's native value",
    },
    null,
    2,
  ));
  Deno.exit(law_drift ? 1 : 0);
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
