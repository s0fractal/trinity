#!/usr/bin/env -S deno run -A
// src/x6C20_guards_drill.ts — fire every trust-root guard on purpose
// position: 6/C2 → audit-pole (bucket 6): an adversarial muster of the guards
//   the federation relies on. A guard never seen rejecting an attack is
//   decoration; this feeds each one the exact violation it exists to stop and
//   asserts it REJECTS. A guard that accepts its violation is a HOLE — real work.
// maturity: draft
// skill_safe: yes-readonly
// hex_dipole: "00 00 00 00 00 00 59 00"
//   audit_pole+0.70 (PRIMARY: axis 6, matches bucket 6)
// placement_policy: axis
// horizon: none
// skill_tag: guards_drill
//
// intent: turn "we have guards" into "we watched them fire". Uses only ephemeral
//   keypairs and pure guard functions — never the live registry, never a mutation
//   of the tree. Exits non-zero if any guard fails to reject its attack.
//
// Usage:
//   t guards_drill [--json]

import { mintKeypair, signHash, verifySig } from "./x2F37_voice_keys.ts";
import type { Registry } from "./x2F37_voice_keys.ts";
import {
  type Amendment,
  amendmentDigest,
  registryHash,
  verifyAmendmentQuorum,
  type Vote,
} from "./x2F3B_registry_amend.ts";
import { normalizeImplStatus } from "./x4F00_contracts.ts";

export interface DrillResult {
  guard: string; // the invariant's short name
  protects: string; // what it exists to stop
  attack: string; // the violation fed to it
  fired: boolean; // did the guard REJECT the attack? (true = good)
  detail: string;
}

export interface ModuleImports {
  name: string;
  imports: string[];
}

/** Wall I-11 (ChronoFlux-IEL x3300_956647): a FIELD-DIAGNOSTIC module (♡/H/q/θ,
 *  substrate weather) may only be imported by declared diagnostic consumers. Any
 *  other importer is a potential authority leak — the field becoming a steering
 *  input — and must be surfaced. Pure over its inputs. */
export function fieldWallViolations(
  modules: ModuleImports[],
  fieldModules: Set<string>,
  allowlist: Set<string>,
): string[] {
  const violations: string[] = [];
  for (const m of modules) {
    if (fieldModules.has(m.name) || allowlist.has(m.name)) continue;
    for (const imp of m.imports) {
      if (fieldModules.has(imp)) {
        violations.push(
          `${m.name} reads field-diagnostic ${imp} without being an allowlisted diagnostic consumer (wall I-11)`,
        );
      }
    }
  }
  return violations;
}

/** A throwaway 5-voice registry — these keys exist only for this drill, so no
 *  real quorum can ever be manufactured from here. v1 is the human. */
async function ephemeral() {
  const names = ["v1", "v2", "v3", "v4", "v5"];
  const reg: Registry = {
    schema: "drill",
    custody_note: "ephemeral",
    keys: {},
  };
  const priv: Record<string, string> = {};
  for (const n of names) {
    const { entry, privateKeyB64 } = await mintKeypair("drill");
    reg.keys[n] = entry;
    priv[n] = privateKeyB64;
  }
  const classes: Record<string, string> = {
    v1: "human",
    v2: "model",
    v3: "model",
    v4: "model",
    v5: "model",
  };
  return { reg, priv, classes };
}

async function vote(
  voice: string,
  digest: string,
  priv: string,
): Promise<Vote> {
  return {
    voice,
    stance: "AYE",
    content_blake3: digest,
    sig: await signHash(digest, priv),
  };
}

/** Run every drill. Pure over ephemeral inputs; contacts nothing. */
export async function runDrills(): Promise<DrillResult[]> {
  const results: DrillResult[] = [];
  const { reg, priv, classes } = await ephemeral();
  const amendment: Amendment = {
    op: "revoke",
    voice: "v5",
    reason: "drill",
    base_registry_hash: await registryHash(reg),
  };
  const digest = await amendmentDigest(amendment);

  // 1. Bi-principal: three MODELS with no human must not rotate a key.
  {
    const modelsOnly = [
      await vote("v2", digest, priv.v2),
      await vote("v3", digest, priv.v3),
      await vote("v4", digest, priv.v4),
    ];
    const q = await verifyAmendmentQuorum(amendment, modelsOnly, reg, classes);
    results.push({
      guard: "bi-principal",
      protects: "a model quorum cannot rewrite the trust root without a human",
      attack: "3 model AYEs, 0 human",
      fired: !q.authorized && q.reasons.some((r) => r.includes("bi-principal")),
      detail: q.authorized ? "AUTHORIZED — hole" : q.reasons.join("; "),
    });
  }

  // 2. Bi-principal fail-closed: an unlisted principal has no class.
  {
    const withHuman = [
      await vote("v1", digest, priv.v1),
      await vote("v2", digest, priv.v2),
      await vote("v3", digest, priv.v3),
    ];
    const q = await verifyAmendmentQuorum(amendment, withHuman, reg, {}); // empty classes
    results.push({
      guard: "bi-principal-fail-closed",
      protects: "an unlisted principal counts toward no class quorum",
      attack: "valid 3-of-5 quorum but an empty principal-class map",
      fired: !q.authorized,
      detail: q.authorized
        ? "AUTHORIZED — hole"
        : "rejected (no class reachable)",
    });
  }

  // 3. Registry replay guard: an amendment cannot be replayed onto another state.
  {
    const replayed: Amendment = {
      ...amendment,
      base_registry_hash: "sha256:deadbeef",
    };
    const d2 = await amendmentDigest(replayed);
    const votes = [
      await vote("v1", d2, priv.v1),
      await vote("v2", d2, priv.v2),
      await vote("v3", d2, priv.v3),
    ];
    const q = await verifyAmendmentQuorum(replayed, votes, reg, classes);
    results.push({
      guard: "registry-replay",
      protects: "an amendment is bound to the exact registry state it amends",
      attack: "base_registry_hash pinned to a foreign state",
      fired: !q.authorized &&
        q.reasons.some((r) => r.includes("base_registry_hash")),
      detail: q.authorized
        ? "AUTHORIZED — hole"
        : "rejected (stale/replayed base)",
    });
  }

  // 4. Signature integrity: a signature does not carry to a different payload.
  {
    const good = "sha256:" + "a".repeat(64);
    const evil = "sha256:" + "b".repeat(64);
    const sig = await signHash(good, priv.v1);
    const carried = await verifySig(evil, sig, reg.keys.v1.pubkey);
    results.push({
      guard: "signature-integrity",
      protects: "a valid signature cannot be lifted onto a tampered payload",
      attack: "verify a good signature against a different payload",
      fired: carried === false,
      detail: carried ? "VERIFIED — hole" : "rejected (payload/sig mismatch)",
    });
  }

  // 5. Evidence mirror does not lie downward: a missing status is not aspirational.
  {
    const norm = normalizeImplStatus(undefined as unknown as string);
    results.push({
      guard: "status-mirror",
      protects:
        "a missing impl status is not silently inflated to 'aspirational'",
      attack: "normalize an absent implementation status",
      fired: norm !== "aspirational",
      detail: `absent → "${norm}" (must not be "aspirational")`,
    });
  }

  // 6. Wall I-11: a field diagnostic must never be read by a non-diagnostic surface.
  {
    const fieldModules = new Set(["x8300_physics"]);
    const allowlist = new Set(["physics_test"]);
    const clean = fieldWallViolations(
      [{ name: "physics_test", imports: ["x8300_physics"] }],
      fieldModules,
      allowlist,
    );
    const attack = fieldWallViolations(
      [{ name: "x2F3B_registry_amend", imports: ["x8300_physics"] }],
      fieldModules,
      allowlist,
    );
    results.push({
      guard: "wall-I-11",
      protects:
        "a field diagnostic (♡/H/q/θ, weather) can never be read by a decision/authority surface",
      attack: "an authority surface imports a field-diagnostic module",
      fired: attack.length > 0 && clean.length === 0,
      detail: attack.length > 0
        ? attack[0]
        : "authority-imports-field NOT flagged — hole",
    });
  }

  return results;
}

export function summarize(results: DrillResult[]) {
  const holes = results.filter((r) => !r.fired);
  return {
    type: "guards_drill",
    position: "6/C2",
    action: "drill",
    summary: {
      total: results.length,
      fired: results.length - holes.length,
      holes: holes.length,
    },
    holes: holes.map((h) => h.guard),
    results,
    ok: holes.length === 0,
  };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const report = summarize(await runDrills());
  if (wantJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `# guards-drill @ 6/C2 — every trust-root guard, fired on purpose`,
    );
    for (const r of report.results) {
      console.log(
        `  ${r.fired ? "✅ FIRED" : "⛔ HOLE "}  ${r.guard} — ${r.detail}`,
      );
    }
    console.log(
      `#   ${report.summary.fired}/${report.summary.total} guards fired${
        report.summary.holes > 0
          ? ` — ⛔ ${report.summary.holes} HOLE(S): ${report.holes.join(", ")}`
          : " — all guards reject their attack"
      }`,
    );
  }
  if (!report.ok) Deno.exit(1);
}
