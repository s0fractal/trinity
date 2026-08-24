#!/usr/bin/env -S deno run --allow-read
// External parity adapter for Warrant's JCS implementation.
//
// §5.1.2.1 selects CNP-0-JCS partly because "the already implemented Warrant
// JCS profile ... is pinned by a normative fixture artifact and independently
// reproduced by Python, Go, and Rust", while warning that "that is prior
// evidence, not proof of CNP-0 conformance". This adapter measures exactly the
// part that IS shared — the `hsp-jcs@v0` wire layer — and says nothing about
// the `cnp-0` profile layer, which Warrant's fixtures predate and do not
// contain.
//
// Warrant is NOT a submodule and is not vendored. This command reads a pinned
// checkout if one is supplied and otherwise reports UNAVAILABLE. A skipped
// external check is never green parity, and the self-contained Trinity gate
// (ts/runner.ts) does not depend on it.
//
// Usage:
//   deno run --allow-read ts/parity_warrant.ts --warrant=/path/to/warrant
//   deno run --allow-read ts/parity_warrant.ts            # UNAVAILABLE
//
// Exit status: 0 for PASS or UNAVAILABLE, 1 for FAIL. UNAVAILABLE is reported
// distinctly in the output and in --json.

import { jmap, type JValue, serialize, sha256Hex, toHex } from "./jcs.ts";

/** The revision this adapter was written against (RFC-0003 task brief, 2026-08-25). */
export const PINNED_WARRANT_SHA = "ac63e4e9180c5878aa27159eebe1c4007909dce9";
const VECTORS = "examples/canon-vectors.json";

export type ParityStatus = "PASS" | "FAIL" | "UNAVAILABLE";

export type ParityReport = {
  status: ParityStatus;
  reason?: string;
  warrantPath?: string;
  pinnedSha: string;
  observedSha?: string;
  shaMatches?: boolean;
  vectors: number;
  matched: number;
  mismatched: { name: string; expected: string; got: string }[];
  skipped: { name: string; reason: string }[];
};

/** Convert a decoded JSON value into the wire layer's object model. */
function toWire(v: unknown, path: string): JValue {
  if (v === null) return null;
  if (typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "number") {
    if (!Number.isInteger(v)) throw new Error(`${path}: non-integer number ${v}`);
    return BigInt(v);
  }
  if (Array.isArray(v)) return v.map((x, i) => toWire(x, `${path}[${i}]`));
  if (typeof v === "object") {
    return jmap(
      Object.entries(v as Record<string, unknown>).map((
        [k, x],
      ) => [k, toWire(x, `${path}.${k}`)]),
    );
  }
  throw new Error(`${path}: unconvertible ${typeof v}`);
}

async function readIfPresent(path: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return undefined;
  }
}

export async function parity(warrantPath?: string): Promise<ParityReport> {
  const base: ParityReport = {
    status: "UNAVAILABLE",
    pinnedSha: PINNED_WARRANT_SHA,
    vectors: 0,
    matched: 0,
    mismatched: [],
    skipped: [],
  };

  if (!warrantPath) {
    return {
      ...base,
      reason:
        "no --warrant=<path> given; external parity was not attempted, which is " +
        "not the same as parity holding",
    };
  }

  const vectorsPath = `${warrantPath.replace(/\/$/, "")}/${VECTORS}`;
  const text = await readIfPresent(vectorsPath);
  if (text === undefined) {
    return { ...base, warrantPath, reason: `cannot read ${vectorsPath}` };
  }

  // Report the checkout's revision when it is legible, and whether it is the
  // pinned one. A different revision is disclosed, never silently accepted.
  const head = await readIfPresent(`${warrantPath.replace(/\/$/, "")}/.git/HEAD`);
  let observedSha: string | undefined;
  if (head) {
    const trimmed = head.trim();
    if (trimmed.startsWith("ref: ")) {
      observedSha = (await readIfPresent(
        `${warrantPath.replace(/\/$/, "")}/.git/${trimmed.slice(5)}`,
      ))?.trim();
    } else {
      observedSha = trimmed;
    }
  }

  const doc = JSON.parse(text);
  const cases: { name: string; body: unknown; canon_hex: string; warrant_id?: string }[] =
    doc.cases ?? [];

  const report: ParityReport = {
    ...base,
    status: "PASS",
    warrantPath,
    observedSha,
    shaMatches: observedSha === PINNED_WARRANT_SHA,
    vectors: cases.length,
  };

  if (cases.length === 0) {
    return { ...report, status: "FAIL", reason: "the vector file selected zero cases" };
  }

  for (const c of cases) {
    let wire: JValue;
    try {
      wire = toWire(c.body, c.name);
    } catch (e) {
      // A Warrant vector outside the cnp-0 object model is skipped and counted,
      // never quietly folded into the pass count.
      report.skipped.push({ name: c.name, reason: (e as Error).message });
      continue;
    }
    const bytes = serialize(wire);
    const hex = toHex(bytes);
    const digest = await sha256Hex(bytes);
    const idOk = c.warrant_id === undefined || digest === c.warrant_id;
    if (hex === c.canon_hex && idOk) {
      report.matched++;
    } else {
      report.mismatched.push({
        name: c.name,
        expected: c.canon_hex,
        got: hex === c.canon_hex ? `digest ${digest} != ${c.warrant_id}` : hex,
      });
    }
  }

  if (report.mismatched.length > 0) report.status = "FAIL";
  if (report.matched === 0) {
    report.status = "FAIL";
    report.reason = "zero vectors matched; a green empty parity run is a failure";
  }
  return report;
}

if (import.meta.main) {
  const arg = Deno.args.find((a) => a.startsWith("--warrant="));
  const report = await parity(arg?.slice("--warrant=".length));
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`warrant JCS parity: ${report.status}`);
    if (report.reason) console.log(`  reason              ${report.reason}`);
    if (report.warrantPath) console.log(`  checkout            ${report.warrantPath}`);
    console.log(`  pinned revision     ${report.pinnedSha}`);
    if (report.observedSha) {
      console.log(
        `  observed revision   ${report.observedSha}` +
          (report.shaMatches ? " (pinned)" : " (DIFFERENT from the pin — disclosed)"),
      );
    }
    console.log(`  vectors selected    ${report.vectors}`);
    console.log(`  byte-identical      ${report.matched}`);
    console.log(`  skipped             ${report.skipped.length}`);
    for (const s of report.skipped) console.log(`    skip ${s.name}: ${s.reason}`);
    for (const m of report.mismatched) console.log(`    FAIL ${m.name}`);
    console.log(
      report.status === "PASS"
        ? "  ok — the hsp-jcs@v0 wire layer reproduces Warrant's pinned canonical bytes"
        : report.status === "UNAVAILABLE"
        ? "  not attempted — this is not evidence of parity"
        : "  parity FAILED",
    );
  }
  Deno.exit(report.status === "FAIL" ? 1 : 0);
}
