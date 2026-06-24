#!/usr/bin/env -S deno run -A
// src/x6E10_skeleton.ts — the executable skeleton: run each of the six irreducible
//   axes' canonical proof-test; the substrate's essence HOLDS iff all six are green.
// position: 6/E1 → harmony/audit (bucket 6): a standing falsifier for the minimal basis.
// maturity: draft
// skill_safe: yes-readonly
// hex_dipole: "00 00 00 00 00 00 59 00"
//   harmony_emergence+0.70 (PRIMARY; the strongest axis stays axis 6 to match bucket 6)
// placement_policy: axis
// horizon: none
// skill_tag: skeleton
//
// intent: the minimal-essence map (x3300_955201) NAMES six load-bearing primitives.
//   That was an observation; this is the GATE. Each axis below points at the canonical
//   proof-test that defends it. `t skeleton` runs all six (across all four substrates)
//   and reds if any one breaks — turning "these six are the irreducible basis" from a
//   claim into a standing invariant. Remove a primitive → its proof reds → the skeleton
//   no longer holds. Read-only: it only spawns existing test suites.
//
// Usage:
//   t skeleton [--json]

/** The six irreducible axes, each with the canonical proof-test(s) that defend it.
 *  [submodule (".", "myc", "omega", "liquid"), test path relative to that submodule]. */
export const AXES: {
  n: number;
  name: string;
  reduces: string;
  proofs: [string, string][];
}[] = [
  {
    n: 1,
    name: "content-hash → identity",
    reduces:
      "CANONICAL_HASH, myc commitment, content-addressed FQDNs, Merkle ledger, omega hashes",
    // cross-substrate conformance to the canon-vectors oracle + myc's own commitment proof
    proofs: [[".", "src/canon_conformance_test.ts"], [
      "myc",
      "src/x0200_resolve_test.ts",
    ]],
  },
  {
    n: 2,
    name: "ed25519 → authenticity",
    reduces: "voice keys, voice-auth, every content_sig",
    proofs: [["myc", "src/x2F50_voice_auth_test.ts"]],
  },
  {
    n: 3,
    name: "witness-quorum → consensus",
    reduces:
      "governance flow, receipt envelope, lifecycle, autonomy executor, omega senate",
    proofs: [["myc", "src/x5810_resolve_proposal_test.ts"]],
  },
  {
    n: 4,
    name: "fail-closed authority",
    reduces: "the autonomy kernel, confinement receipt (admit A0-A4)",
    proofs: [[".", "src/autonomy_confinement_test.ts"]],
  },
  {
    n: 5,
    name: "coordinate-gravity",
    reduces: "organ placement, import topology (bucket → enforced import law)",
    proofs: [[".", "src/audit_test.ts"]],
  },
  {
    n: 6,
    name: "integer-determinism",
    reduces:
      "omega tick+mitosis, dipole/toroidal invariants, liquid phase engine + τ-gate",
    proofs: [["omega", "tests/mitosis_proof_test.ts"], [
      "liquid",
      "tests/determinism_gate.test.ts",
    ]],
  },
];

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/+$/, "");
const cwdOf = (sub: string) => (sub === "." ? ROOT : `${ROOT}/${sub}`);
export const proofPath = (
  sub: string,
  test: string,
) => (sub === "." ? test : `${sub}/${test}`);

interface ProofResult {
  test: string;
  ok: boolean;
  ms: number;
}
interface AxisResult {
  n: number;
  name: string;
  holds: boolean;
  proofs: ProofResult[];
}

async function runProof([sub, test]: [string, string]): Promise<ProofResult> {
  const start = performance.now();
  try {
    const out = await new Deno.Command("deno", {
      args: ["test", "-A", test],
      cwd: cwdOf(sub),
      stdout: "null",
      stderr: "null",
      signal: AbortSignal.timeout(180_000),
    }).output();
    return {
      test: proofPath(sub, test),
      ok: out.success,
      ms: Math.round(performance.now() - start),
    };
  } catch {
    return {
      test: proofPath(sub, test),
      ok: false,
      ms: Math.round(performance.now() - start),
    };
  }
}

export async function build() {
  // Run every proof concurrently, then regroup by axis.
  const flat = AXES.flatMap((a) => a.proofs.map((p) => ({ axis: a.n, p })));
  const ran = await Promise.all(
    flat.map(async (f) => ({ axis: f.axis, r: await runProof(f.p) })),
  );
  const axes: AxisResult[] = AXES.map((a) => {
    const proofs = ran.filter((x) => x.axis === a.n).map((x) => x.r);
    return { n: a.n, name: a.name, holds: proofs.every((p) => p.ok), proofs };
  });
  const holding = axes.filter((a) => a.holds).length;
  return {
    type: "skeleton",
    position: "6/E1",
    axes_total: AXES.length,
    axes_holding: holding,
    skeleton_holds: holding === AXES.length,
    axes,
  };
}

if (import.meta.main) {
  const wantJson = Deno.args.includes("--json");
  const r = await build();
  if (wantJson) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const mark = r.skeleton_holds ? "✅ HOLDS" : "⛔ BROKEN";
    console.log(
      `# skeleton @ 6/E1 — ${mark} (${r.axes_holding}/${r.axes_total} irreducible axes green)`,
    );
    for (const a of r.axes) {
      const m = a.holds ? "✅" : "⛔";
      const ms = a.proofs.reduce((s, p) => s + p.ms, 0);
      console.log(
        `  ${m} ${a.n}. ${a.name.padEnd(28)} ${ms}ms  (${
          a.proofs.map((p) => p.test).join(", ")
        })`,
      );
    }
  }
  if (!r.skeleton_holds) Deno.exit(1);
}
