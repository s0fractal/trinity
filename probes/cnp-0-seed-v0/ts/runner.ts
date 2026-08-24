#!/usr/bin/env -S deno run --allow-read
// The corpus runner: the single entry point both the local command and CI use.
//
// It exercises three things against corpus/manifest.json:
//   1. the reference encoder (ts/cnp0.ts + ts/jcs.ts) — canonical bytes and digest;
//   2. the verifier-only rejection path (ts/reject.ts) — raw bytes in, accept or
//      a stable rejection class out, never a repair;
//   3. the declared transformations (ts/transforms.ts) — quantization,
//      largest-remainder renormalization, the discrete circle.
//
// It prints exact selected/pass/reject counts. A green run with a zero count is
// a failure, and is reported as one.

import { fromHex, isMap, jmap, type JValue, sha256Hex, toHex } from "./jcs.ts";
import {
  canonicalize,
  rejectionOf,
  validateFixedSimplex,
  validateRatioSimplex,
  validateScaleDescriptor,
} from "./cnp0.ts";
import { verifyRaw } from "./reject.ts";
import {
  circleAdd,
  circleEqual,
  circlePoint,
  quantize,
  type QuantizationMode,
  renormalizeLargestRemainder,
  TransformError,
} from "./transforms.ts";

const HERE = new URL(".", import.meta.url);
const ROOT = new URL("../", HERE);

type Case = Record<string, unknown>;

export type Report = {
  cases: number;
  byKind: Record<string, number>;
  encoderAccepted: number;
  encoderRejected: number;
  verifierAccepted: number;
  verifierRejected: number;
  transformsAccepted: number;
  transformsRejected: number;
  digestGroups: number;
  failures: { id: string; detail: string }[];
};

function toJ(v: unknown): JValue {
  if (v === null) return null;
  if (typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "number") {
    if (!Number.isInteger(v)) throw new Error(`non-integer in manifest: ${v}`);
    return BigInt(v);
  }
  if (Array.isArray(v)) return v.map(toJ);
  if (typeof v === "object") {
    return jmap(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, toJ(x)]));
  }
  throw new Error(`unconvertible manifest value: ${typeof v}`);
}

function rawBytes(c: Case): Uint8Array {
  if (typeof c.raw_hex === "string") return fromHex(c.raw_hex);
  if (typeof c.raw === "string") return new TextEncoder().encode(c.raw);
  throw new Error("case has neither raw nor raw_hex");
}

export async function run(): Promise<Report> {
  const manifestText = await Deno.readTextFile(new URL("corpus/manifest.json", ROOT));
  const manifest = JSON.parse(manifestText);
  const cases: Case[] = manifest.cases;

  const report: Report = {
    cases: cases.length,
    byKind: {},
    encoderAccepted: 0,
    encoderRejected: 0,
    verifierAccepted: 0,
    verifierRejected: 0,
    transformsAccepted: 0,
    transformsRejected: 0,
    digestGroups: 0,
    failures: [],
  };
  const digests = new Map<string, { id: string; digest: string }[]>();

  const fail = (id: string, detail: string) => report.failures.push({ id, detail });

  for (const c of cases) {
    const id = String(c.id);
    const kind = String(c.kind);
    report.byKind[kind] = (report.byKind[kind] ?? 0) + 1;

    try {
      switch (kind) {
        case "encode": {
          const bytes = rawBytes(c);
          const enc = c.encoder as Record<string, any>;
          if (enc.accept) {
            const got = await canonicalize(bytes);
            if (got.text !== enc.accept.canonical) {
              fail(id, `canonical text differs\n    pinned ${JSON.stringify(enc.accept.canonical)}\n    got    ${JSON.stringify(got.text)}`);
              break;
            }
            // The manifest's digest must be the digest of the manifest's own
            // canonical bytes: a typo in either field is caught here rather
            // than being confirmed by the encoder.
            const pinnedDigest = await sha256Hex(
              new TextEncoder().encode(enc.accept.canonical),
            );
            if (pinnedDigest !== enc.accept.sha256) {
              fail(id, `manifest is self-inconsistent: canonical bytes hash to ${pinnedDigest}, pinned ${enc.accept.sha256}`);
              break;
            }
            if (got.sha256 !== enc.accept.sha256) {
              fail(id, `digest differs: pinned ${enc.accept.sha256}, got ${got.sha256}`);
              break;
            }
            report.encoderAccepted++;
            if (typeof c.digest_group === "string") {
              const g = digests.get(c.digest_group) ?? [];
              g.push({ id, digest: got.sha256 });
              digests.set(c.digest_group, g);
            }
          } else {
            let rejected: string | undefined;
            try {
              await canonicalize(bytes);
            } catch (e) {
              rejected = rejectionOf(e);
              if (rejected === undefined) throw e;
            }
            if (rejected === undefined) {
              fail(id, `expected rejection ${enc.reject}, but the encoder accepted`);
              break;
            }
            if (rejected !== enc.reject) {
              fail(id, `expected rejection ${enc.reject}, got ${rejected}`);
              break;
            }
            report.encoderRejected++;
          }

          // The verifier-only path, over the same raw bytes.
          const ver = c.verifier;
          const outcome = await verifyRaw(bytes);
          if (ver === "accept") {
            if (!outcome.ok) {
              fail(id, `verifier rejected canonical bytes: ${outcome.rejection} (${outcome.detail})`);
              break;
            }
            const expected = (c.encoder as any).accept?.sha256;
            if (expected && outcome.sha256 !== expected) {
              fail(id, `verifier digest ${outcome.sha256} != encoder digest ${expected}`);
              break;
            }
            report.verifierAccepted++;
          } else {
            const want = (ver as Record<string, string>).reject;
            if (outcome.ok) {
              fail(id, `expected verifier rejection ${want}, but it accepted`);
              break;
            }
            if (outcome.rejection !== want) {
              fail(id, `expected verifier rejection ${want}, got ${outcome.rejection} (${outcome.detail})`);
              break;
            }
            report.verifierRejected++;
          }
          break;
        }

        case "scale": {
          const expect = c.expect as Record<string, any>;
          let rejection: string | undefined;
          try {
            validateScaleDescriptor(toJ(c.descriptor));
          } catch (e) {
            rejection = rejectionOf(e);
            if (rejection === undefined) throw e;
          }
          if (expect.accept) {
            if (rejection) fail(id, `expected acceptance, got ${rejection}`);
            else report.transformsAccepted++;
          } else if (rejection !== expect.reject) {
            fail(id, `expected ${expect.reject}, got ${rejection ?? "acceptance"}`);
          } else {
            report.transformsRejected++;
          }
          break;
        }

        case "ratio-simplex":
        case "fixed-simplex": {
          const expect = c.expect as Record<string, any>;
          let rejection: string | undefined;
          try {
            if (kind === "ratio-simplex") {
              const parts = (c.parts as number[][]).map(([n, d]) => ({
                num: BigInt(n),
                den: BigInt(d),
              }));
              validateRatioSimplex(parts);
            } else {
              validateFixedSimplex(
                (c.weights as number[]).map(BigInt),
                BigInt(c.total as number),
              );
            }
          } catch (e) {
            rejection = rejectionOf(e);
            if (rejection === undefined) throw e;
          }
          if (expect.accept) {
            if (rejection) fail(id, `expected acceptance, got ${rejection}`);
            else report.transformsAccepted++;
          } else if (rejection !== expect.reject) {
            fail(id, `expected ${expect.reject}, got ${rejection ?? "acceptance"}`);
          } else {
            report.transformsRejected++;
          }
          break;
        }

        case "renormalize": {
          const expect = c.expect as Record<string, any>;
          const components = (c.components as [string | number, number][]).map(
            ([cid, w]) => ({
              id: (typeof cid === "number" ? BigInt(cid) : cid) as JValue,
              weight: BigInt(w),
            }),
          );
          if (expect.accept) {
            const out = renormalizeLargestRemainder(components, BigInt(c.total as number));
            const got = out.weights.map((w) => Number(w));
            const want = expect.accept.weights as number[];
            if (JSON.stringify(got) !== JSON.stringify(want)) {
              fail(id, `weights ${JSON.stringify(got)} != pinned ${JSON.stringify(want)}`);
              break;
            }
            if (out.renormalized !== expect.accept.renormalized) {
              fail(id, `renormalized flag ${out.renormalized} != pinned ${expect.accept.renormalized}`);
              break;
            }
            report.transformsAccepted++;
          } else {
            let rejection: string | undefined;
            try {
              renormalizeLargestRemainder(components, BigInt(c.total as number));
            } catch (e) {
              if (!(e instanceof TransformError)) throw e;
              rejection = e.rejection;
            }
            if (rejection !== expect.reject) {
              fail(id, `expected ${expect.reject}, got ${rejection ?? "acceptance"}`);
            } else {
              report.transformsRejected++;
            }
          }
          break;
        }

        case "quantize": {
          const expect = c.expect as Record<string, any>;
          const bits = BigInt("0x" + String(c.f64_hex));
          const mode = String(c.mode) as QuantizationMode;
          const radix = BigInt(c.radix as number);
          const places = BigInt(c.places as number);
          if (expect.accept) {
            const out = quantize(bits, mode, radix, places);
            if (out.value !== BigInt(expect.accept.value)) {
              fail(id, `value ${out.value} != pinned ${expect.accept.value}`);
              break;
            }
            if (out.exact !== expect.accept.exact) {
              fail(id, `exact ${out.exact} != pinned ${expect.accept.exact}`);
              break;
            }
            report.transformsAccepted++;
          } else {
            let rejection: string | undefined;
            try {
              quantize(bits, mode, radix, places);
            } catch (e) {
              if (!(e instanceof TransformError)) throw e;
              rejection = e.rejection;
            }
            if (rejection !== expect.reject) {
              fail(id, `expected ${expect.reject}, got ${rejection ?? "acceptance"}`);
            } else {
              report.transformsRejected++;
            }
          }
          break;
        }

        case "circle": {
          const expect = c.expect as Record<string, any>;
          const a = BigInt(c.a as number);
          const run = () => {
            if (c.op === "add") return circleAdd(a, BigInt(c.b as number));
            if (c.op === "equal") return circleEqual(a, BigInt(c.b as number));
            return circlePoint(a);
          };
          if (expect.reject) {
            let rejection: string | undefined;
            try {
              run();
            } catch (e) {
              if (!(e instanceof TransformError)) throw e;
              rejection = e.rejection;
            }
            if (rejection !== expect.reject) {
              fail(id, `expected ${expect.reject}, got ${rejection ?? "acceptance"}`);
            } else {
              report.transformsRejected++;
            }
            break;
          }
          const got = run();
          const want = "equal" in expect ? expect.equal : BigInt(expect.index);
          if (got !== want) {
            fail(id, `result ${got} != pinned ${want}`);
          } else {
            report.transformsAccepted++;
          }
          break;
        }

        case "file": {
          const bytes = await Deno.readFile(new URL(String(c.path), ROOT));
          const digest = await sha256Hex(bytes);
          if (digest !== c.sha256) {
            fail(id, `file digest ${digest} != pinned ${c.sha256}`);
            break;
          }
          // The pinned table must itself be canonical CNP-0 bytes.
          const outcome = await verifyRaw(bytes);
          if (!outcome.ok) {
            fail(id, `pinned file is not canonical: ${outcome.rejection}`);
            break;
          }
          // §5.1.3(5): a one-byte mutation of a pinned constant changes the
          // reference. This is asserted here, not assumed.
          const mutation = c.mutation as Record<string, number>;
          const mutated = new Uint8Array(bytes);
          const at = mutation.byte_index;
          mutated[at] = mutated[at] === 0x39 ? 0x38 : mutated[at] + 1;
          const mutatedDigest = await sha256Hex(mutated);
          if (mutatedDigest === digest) {
            fail(id, "a one-byte mutation did not change the digest");
            break;
          }
          report.transformsAccepted++;
          break;
        }

        default:
          fail(id, `unknown case kind ${kind}`);
      }
    } catch (e) {
      fail(id, `unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Digest groups: members must be pairwise distinct.
  for (const [name, members] of digests) {
    report.digestGroups++;
    const seen = new Map<string, string>();
    for (const m of members) {
      const prior = seen.get(m.digest);
      if (prior) {
        fail(name, `${m.id} and ${prior} share digest ${m.digest}; they must differ`);
      }
      seen.set(m.digest, m.id);
    }
  }

  return report;
}

function requireNonZero(report: Report): string[] {
  const problems: string[] = [];
  const checks: [string, number][] = [
    ["encoder accepted", report.encoderAccepted],
    ["encoder rejected", report.encoderRejected],
    ["verifier accepted", report.verifierAccepted],
    ["verifier rejected", report.verifierRejected],
    ["transforms accepted", report.transformsAccepted],
    ["transforms rejected", report.transformsRejected],
    ["digest groups", report.digestGroups],
  ];
  for (const [label, n] of checks) {
    if (n === 0) problems.push(`${label} count is zero — a green empty suite is a failure`);
  }
  return problems;
}

if (import.meta.main) {
  const report = await run();
  const asJson = Deno.args.includes("--json");
  const empty = requireNonZero(report);

  if (asJson) {
    console.log(JSON.stringify({ ...report, empty_counts: empty }, null, 2));
  } else {
    console.log("cnp-0 corpus — probes/cnp-0-seed-v0");
    console.log(`  cases selected      ${report.cases}`);
    for (const [k, n] of Object.entries(report.byKind).sort()) {
      console.log(`    ${k.padEnd(18)}${n}`);
    }
    console.log(`  encoder  accepted   ${report.encoderAccepted}`);
    console.log(`  encoder  rejected   ${report.encoderRejected}`);
    console.log(`  verifier accepted   ${report.verifierAccepted}`);
    console.log(`  verifier rejected   ${report.verifierRejected}`);
    console.log(`  transform accepted  ${report.transformsAccepted}`);
    console.log(`  transform rejected  ${report.transformsRejected}`);
    console.log(`  digest groups       ${report.digestGroups}`);
    for (const f of report.failures) console.log(`  FAIL ${f.id}: ${f.detail}`);
    for (const p of empty) console.log(`  FAIL ${p}`);
    console.log(
      report.failures.length === 0 && empty.length === 0
        ? "  ok — every case matched its pinned expectation"
        : `  ${report.failures.length + empty.length} failure(s)`,
    );
  }
  Deno.exit(report.failures.length === 0 && empty.length === 0 ? 0 : 1);
}
