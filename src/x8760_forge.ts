#!/usr/bin/env -S deno run -A
// src/x8760_forge.ts — the forge release-train dashboard: package status from evidence, not prose
// position: 8/76 → void_infinity × bridge = reach across the extracted primitives and
//   bridge each to the evidence that makes its release claim falsifiable
// maturity: active
// skill_safe: yes-with-care
//   (--stable writes packages/forge-receipt.json; --json and the default are read-only)
// hex_dipole: "59 00 00 00 00 3C 00 00"
//   void_infinity+0.70 (PRIMARY: reaches across every forge primitive; bucket 8 = axis 0)
//   bridge+0.47 (axis 5): bridges each primitive to the evidence behind its release claim
// placement_policy: axis
// horizon: none
// skill_tag: forge
//
// intent: stop "this package is live/green" being prose. For each primitive extracted from
//   the substrate, derive — from files that actually exist — its version, publish evidence,
//   and parity readiness, and WARN (non-zero exit) if anything claims `live` without evidence.
//   `deno task forge:parity` stays the authoritative parity gate; this aggregates the rest.
//
// Usage:
//   t forge            human table + warnings (non-zero exit if a live claim lacks evidence)
//   t forge --json     the forge receipt as JSON
//   t forge --stable   write packages/forge-receipt.json (the generated source of truth)

const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

function exists(rel: string): boolean {
  try {
    Deno.statSync(`${ROOT}/${rel}`);
    return true;
  } catch {
    return false;
  }
}

function readVersion(manifest: string): string | null {
  try {
    const text = Deno.readTextFileSync(`${ROOT}/${manifest}`);
    if (manifest.endsWith(".json")) return JSON.parse(text).version ?? null;
    return text.match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? null; // Cargo.toml
  } catch {
    return null;
  }
}

// A forge product is one of three kinds. source-parity packages are transplanted
// verbatim from a substrate and guarded by a parity test; standalone packages are
// new or extracted-and-reshaped (verified by their own tests, no substrate parity);
// composed packages build on OTHER published packages (verified by tests + their deps).
type Kind = "source-parity" | "standalone" | "composed";

type Spec = {
  name: string;
  kind: Kind;
  registry: "jsr" | "crates.io";
  manifest: string;
  source_cone: string[];
  package_cone: string[];
  parity_gate: string[]; // empty for standalone/composed — no substrate to parity-check against
  package_test: string; // the package-local test command (run in the package cwd)
  publish_workflow: string | null;
  depends_on: string[]; // published packages this one composes (jsr specifiers)
};

const SPECS: Spec[] = [
  {
    name: "autonomy-kernel",
    kind: "source-parity",
    registry: "jsr",
    manifest: "packages/autonomy-kernel/deno.json",
    source_cone: ["src/x5C20_autonomy.ts"],
    package_cone: ["packages/autonomy-kernel/mod.ts"],
    parity_gate: ["src/forge_parity_test.ts"],
    package_test: "cd packages/autonomy-kernel && deno test -A",
    publish_workflow: ".github/workflows/publish-autonomy-kernel.yml",
    depends_on: [],
  },
  {
    name: "canonical-receipt",
    kind: "source-parity",
    registry: "jsr",
    manifest: "packages/canonical-receipt/deno.json",
    source_cone: [
      "probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts",
      "probes/receipt-envelope-encoder-v0/ts/envelope.ts",
    ],
    package_cone: ["packages/canonical-receipt/mod.ts"],
    parity_gate: ["src/forge_parity_test.ts"],
    package_test: "cd packages/canonical-receipt && deno test -A",
    publish_workflow: ".github/workflows/publish-canonical-receipt.yml",
    depends_on: [],
  },
  {
    name: "kuramoto-coherence",
    kind: "source-parity",
    registry: "crates.io",
    manifest: "packages/kuramoto-coherence/Cargo.toml",
    source_cone: [
      "omega/omega_v2/src/agent.rs",
      "omega/omega_v2/src/math.rs",
      "omega/omega_v2/src/resonance.rs",
    ],
    package_cone: [
      "packages/kuramoto-coherence/src/agent.rs",
      "packages/kuramoto-coherence/src/math.rs",
      "packages/kuramoto-coherence/src/resonance.rs",
    ],
    parity_gate: ["src/forge_parity_test.ts"],
    package_test: "cd packages/kuramoto-coherence && cargo test",
    publish_workflow: null, // manual crates.io publish — no automated workflow
    depends_on: [],
  },
  {
    name: "witness",
    kind: "standalone",
    registry: "jsr",
    manifest: "packages/witness/deno.json",
    source_cone: [],
    package_cone: ["packages/witness/mod.ts"],
    parity_gate: [],
    package_test: "cd packages/witness && deno test -A",
    publish_workflow: ".github/workflows/publish-witness.yml",
    depends_on: [],
  },
  {
    name: "liquid-sync",
    kind: "standalone",
    registry: "jsr",
    manifest: "packages/liquid-sync/deno.json",
    source_cone: [
      "liquid/src/xA030_liquid_codec.ts",
      "liquid/src/xA053_phase_engine.ts",
      "liquid/src/xA032_liquid_sync.ts",
    ],
    package_cone: ["packages/liquid-sync/mod.ts"],
    parity_gate: [], // extracted-and-reshaped from liquid — no byte-parity gate by design
    package_test: "cd packages/liquid-sync && deno test -A",
    publish_workflow: ".github/workflows/publish-liquid-sync.yml",
    depends_on: [],
  },
  {
    name: "agentseal",
    kind: "composed",
    registry: "jsr",
    manifest: "packages/agentseal/deno.json",
    source_cone: [],
    package_cone: ["packages/agentseal/mod.ts"],
    parity_gate: [],
    package_test: "cd packages/agentseal && deno test -A",
    publish_workflow: ".github/workflows/publish-agentseal.yml",
    depends_on: [
      "@s0fractal/autonomy-kernel",
      "@s0fractal/canonical-receipt",
      "@s0fractal/witness",
    ],
  },
  {
    name: "codeicide",
    kind: "composed",
    registry: "jsr",
    manifest: "packages/codeicide/deno.json",
    source_cone: [],
    package_cone: ["packages/codeicide/mod.ts"],
    parity_gate: [],
    package_test: "cd packages/codeicide && deno test -A",
    publish_workflow: ".github/workflows/publish-codeicide.yml",
    depends_on: ["@s0fractal/canonical-receipt", "@s0fractal/witness"],
  },
];

export type ForgePrimitive = {
  name: string;
  kind: Kind;
  source_cone: string[];
  package_cone: string[];
  parity_gate: string[];
  package_test: string;
  runtime_registry: string;
  package_version: string | null;
  published_claim: "live" | "candidate" | "internal";
  publish_evidence: string[];
  depends_on: string[];
  last_parity_status: "green" | "red" | "skipped" | "n/a";
  next_action: string | null;
  warnings: string[];
};

// The release-train invariant codex asked for: a `live` claim must carry publish
// evidence, and a package must resolve a version. Pure + exported so it is tested.
export function liveClaimWarnings(
  p: {
    name: string;
    published_claim: string;
    publish_evidence: string[];
    package_version: string | null;
  },
): string[] {
  const w: string[] = [];
  if (p.published_claim === "live" && p.publish_evidence.length === 0) {
    w.push(`${p.name}: claims "live" with NO publish evidence`);
  }
  if (!p.package_version) w.push(`${p.name}: no resolvable package_version`);
  return w;
}

export function derive(spec: Spec): ForgePrimitive {
  const version = readVersion(spec.manifest);
  const publish_evidence: string[] = [];
  let published_claim: ForgePrimitive["published_claim"];
  if (spec.publish_workflow && exists(spec.publish_workflow)) {
    publish_evidence.push(spec.publish_workflow);
    published_claim = "live";
  } else if (spec.registry === "crates.io" && version) {
    publish_evidence.push(
      spec.manifest,
      "manual crates.io publish (architect; no automated workflow)",
    );
    published_claim = "live";
  } else {
    published_claim = version ? "candidate" : "internal";
  }

  const sourcesPresent = spec.source_cone.every(exists);
  const packagesPresent = spec.package_cone.every(exists);
  const parityPresent = spec.parity_gate.every(exists);
  let last_parity_status: ForgePrimitive["last_parity_status"];
  let next_action: string | null = null;
  if (spec.parity_gate.length === 0) {
    // standalone/composed: no substrate to byte-parity against; the package's own
    // test (`package_test`, run by `deno task test:packages` and its publish workflow)
    // is the real verification. Package presence is the floor.
    if (packagesPresent) {
      last_parity_status = "n/a";
    } else {
      last_parity_status = "red";
      next_action = "package cone missing";
    }
  } else if (!sourcesPresent) {
    last_parity_status = "skipped"; // codex: submodule-absent must NOT pretend parity ran
    next_action =
      "source cone absent here (e.g. omega submodule) — parity honestly skipped, not green";
  } else if (parityPresent && packagesPresent) {
    last_parity_status = "green"; // cones + gate present; `deno task forge:parity` is authoritative
  } else {
    last_parity_status = "red";
    next_action = "package or parity-gate cone missing";
  }

  const warnings = liveClaimWarnings({
    name: spec.name,
    published_claim,
    publish_evidence,
    package_version: version,
  });

  return {
    name: spec.name,
    kind: spec.kind,
    source_cone: spec.source_cone,
    package_cone: spec.package_cone,
    parity_gate: spec.parity_gate,
    package_test: spec.package_test,
    runtime_registry: spec.registry,
    package_version: version,
    published_claim,
    publish_evidence,
    depends_on: spec.depends_on,
    last_parity_status,
    next_action,
    warnings,
  };
}

// codex x5d00 P5: full-federation parity (kuramoto vs omega, plus myc + liquid) needs
// the private submodules. A release surface must NEVER claim federation-green from a
// submodule-absent (public-CI) checkout.
const FEDERATION_CONE = [
  "omega/omega_v2/src/agent.rs",
  "myc/src/x0100_myc.ts",
  "liquid/src/xA030_liquid_codec.ts",
];

export function build() {
  const primitives = SPECS.map(derive);
  const warnings = primitives.flatMap((p) => p.warnings);
  const federation_available = FEDERATION_CONE.every(exists);
  return {
    type: "forge_receipt",
    note:
      "evidence-derived; `deno task forge:parity` is the authoritative parity gate. Regenerate with `t forge --stable`.",
    // P5: core (this dashboard + forge:parity for the TS gems) is always runnable;
    // federation (kuramoto-vs-omega + myc + liquid) needs the submodules.
    federation_status: federation_available ? "available" : "unavailable",
    federation_gate: "deno task check:federation",
    federation_note: federation_available
      ? "submodules present — run `deno task check:federation` for full-federation green before a release; this dashboard does not auto-run it (it only reports availability)."
      : "submodules absent (public-CI checkout) — federation parity (incl. kuramoto vs omega) CANNOT run here; do NOT claim federation-green from this checkout.",
    primitives,
    warnings,
    ok: warnings.length === 0,
  };
}

if (import.meta.main) {
  const r = build();
  if (Deno.args.includes("--stable")) {
    Deno.writeTextFileSync(
      `${ROOT}/packages/forge-receipt.json`,
      JSON.stringify(r, null, 2) + "\n",
    );
  }
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(
      `# forge release train — ${r.primitives.length} primitives, ${r.warnings.length} warning(s)`,
    );
    for (const p of r.primitives) {
      console.log(
        `  ${p.published_claim === "live" ? "●" : "○"} ${p.name.padEnd(20)} v${
          p.package_version ?? "?"
        }  ${
          p.runtime_registry.padEnd(9)
        } parity:${p.last_parity_status}  (${p.publish_evidence.length} publish-evidence)`,
      );
      if (p.next_action) console.log(`      ↳ ${p.next_action}`);
    }
    for (const w of r.warnings) console.log(`  ⚠ ${w}`);
  }
  if (!r.ok && !Deno.args.includes("--json")) Deno.exit(1); // red on a live-without-evidence claim
}
