#!/usr/bin/env -S deno run --allow-read --allow-run
// External parity against Warrant's JCS implementation, in both directions.
//
// §5.1.2.1 selects CNP-0-JCS partly because "the already implemented Warrant
// JCS profile ... is pinned by a normative fixture artifact and independently
// reproduced by Python, Go, and Rust", while warning that "that is prior
// evidence, not proof of CNP-0 conformance". This adapter measures the part
// that IS shared — the `hsp-jcs@v0` wire layer — and nothing about `cnp-0`.
//
//   direction A: OUR encoder over THEIR published vectors (bytes and digests);
//   direction B: THEIR canonicalizer, executed, over OUR corpus.
//
// Direction B exists because A alone only proves we can reproduce inputs they
// chose. A disagreement on inputs WE chose is the one that finds something, and
// it did (see KNOWN_DIVERGENCES).
//
// Warrant is NOT a submodule and is not vendored. Without a checkout this
// reports UNAVAILABLE, and UNAVAILABLE is never reported as parity holding.
// The revision is checked, not assumed: a checkout that is not the pinned
// revision FAILS unless the caller discloses the exact revision they mean.
//
// Usage:
//   deno run --allow-read --allow-run ts/parity_warrant.ts --warrant=<path>
//   deno run ... --warrant=<path> --warrant-sha=<exact-sha>   # disclose another revision
//   deno run ... --json

const HERE = new URL(".", import.meta.url);
const ROOT = new URL("../", HERE);

/** The revision this adapter is pinned to (RFC-0003 slice brief, 2026-08-25). */
export const PINNED_WARRANT_SHA = "ac63e4e9180c5878aa27159eebe1c4007909dce9";

/**
 * Measured disagreements between the two implementations, pinned so that a NEW
 * one is a failure and a resolved one is also a failure — both mean this file
 * is out of date.
 *
 * `c6-utf16-order`: RFC 8785 §3.2.3 sorts member names by their UTF-16 code
 * units. Warrant's Python `canon()` uses `json.dumps(sort_keys=True)`, which
 * sorts by code point. The two orders agree for every BMP name and differ as
 * soon as a name is outside the BMP: U+1D11E is the surrogate pair D834 DD1E,
 * so it sorts BEFORE U+FFFD under RFC 8785 and AFTER it under Python. Warrant's
 * own vectors are all BMP, so their Python/Go/Rust parity never exercised this.
 * Reported as a finding about the external implementation, not filtered away.
 */
export const KNOWN_DIVERGENCES: Record<string, string> = {
  "c6-utf16-order":
    "RFC 8785 orders member names by UTF-16 code unit; Warrant's Python canon() " +
    "orders by code point. The orders differ only for non-BMP member names.",
};

export type ParityStatus = "PASS" | "FAIL" | "UNAVAILABLE";

export type ParityReport = {
  status: ParityStatus;
  reasons: string[];
  warrantPath?: string;
  revision: {
    expected: string;
    observed?: string;
    method?: string;
    matches: boolean;
    disclosed: boolean;
  };
  /** direction A — our encoder over their vectors */
  vectors: {
    status: ParityStatus;
    selected: number;
    matched: number;
    skipped: { name: string; reason: string }[];
    mismatched: { name: string; expected: string; got: string }[];
  };
  /** direction B — their canonicalizer over our corpus */
  executable: {
    status: ParityStatus;
    selected: number;
    matched: number;
    newDivergences: { id: string; ours: string; theirs: string }[];
    knownDivergences: { id: string; reason: string }[];
    resolvedDivergences: string[];
    errors: { id: string; error: string }[];
  };
};

/* ------------------------------------------------------------------ *
 * shared helpers (this file deliberately shares no code with the encoder,
 * so it carries its own minimal serializer for direction A)
 * ------------------------------------------------------------------ */

import { jmap, type JValue, serialize, sha256Hex, toHex } from "./jcs.ts";

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

/**
 * Establish the checkout's revision. `git rev-parse` is authoritative and works
 * for a worktree, where `.git` is a FILE pointing elsewhere rather than a
 * directory — the case that defeated the previous version of this adapter. The
 * plain-file fallback exists for a checkout without git available; if neither
 * works the revision is unknown, and an unknown revision is not a pinned one.
 */
async function revisionOf(
  path: string,
): Promise<{ sha?: string; method: string }> {
  try {
    // `rev-parse HEAD` alone would walk UP to an enclosing repository and report
    // ITS revision for a directory that is not a checkout at all, which would be
    // a false pin. Require the directory to be the work-tree root first.
    const top = await new Deno.Command("git", {
      args: ["-C", path, "rev-parse", "--show-toplevel"],
      stdout: "piped",
      stderr: "null",
    }).output();
    const root = new TextDecoder().decode(top.stdout).trim();
    const sameRoot = top.success &&
      (await Deno.realPath(root).catch(() => root)) ===
        (await Deno.realPath(path).catch(() => path));
    if (sameRoot) {
      const out = await new Deno.Command("git", {
        args: ["-C", path, "rev-parse", "HEAD"],
        stdout: "piped",
        stderr: "null",
      }).output();
      if (out.success) {
        const sha = new TextDecoder().decode(out.stdout).trim();
        if (/^[0-9a-f]{40}$/.test(sha)) return { sha, method: "git rev-parse" };
      }
    }
  } catch {
    // git unavailable or not permitted; fall through
  }
  const head = await readIfPresent(`${path}/.git/HEAD`);
  if (head) {
    const trimmed = head.trim();
    if (trimmed.startsWith("ref: ")) {
      const target = (await readIfPresent(`${path}/.git/${trimmed.slice(5)}`))?.trim();
      if (target && /^[0-9a-f]{40}$/.test(target)) {
        return { sha: target, method: ".git/HEAD ref" };
      }
    } else if (/^[0-9a-f]{40}$/.test(trimmed)) {
      return { sha: trimmed, method: ".git/HEAD detached" };
    }
  }
  return { method: "indeterminate" };
}

export type ParityOptions = {
  warrantPath?: string;
  /** An exact revision the caller discloses instead of the pin. */
  disclosedSha?: string;
};

export async function parity(opts: ParityOptions = {}): Promise<ParityReport> {
  const expected = opts.disclosedSha ?? PINNED_WARRANT_SHA;
  const report: ParityReport = {
    status: "UNAVAILABLE",
    reasons: [],
    revision: { expected, matches: false, disclosed: opts.disclosedSha !== undefined },
    vectors: { status: "UNAVAILABLE", selected: 0, matched: 0, skipped: [], mismatched: [] },
    executable: {
      status: "UNAVAILABLE",
      selected: 0,
      matched: 0,
      newDivergences: [],
      knownDivergences: [],
      resolvedDivergences: [],
      errors: [],
    },
  };

  if (!opts.warrantPath) {
    report.reasons.push(
      "no --warrant=<path> given; external parity was not attempted, which is " +
        "not the same as parity holding",
    );
    return report;
  }
  const warrantPath = opts.warrantPath.replace(/\/$/, "");
  report.warrantPath = warrantPath;

  const vectorsText = await readIfPresent(`${warrantPath}/examples/canon-vectors.json`);
  if (vectorsText === undefined) {
    report.reasons.push(`cannot read ${warrantPath}/examples/canon-vectors.json`);
    return report;
  }

  // ---- revision gate -----------------------------------------------------
  const rev = await revisionOf(warrantPath);
  report.revision.observed = rev.sha;
  report.revision.method = rev.method;
  report.revision.matches = rev.sha === expected;
  if (!rev.sha) {
    report.status = "FAIL";
    report.reasons.push(
      "the checkout's revision could not be established, so nothing here can be " +
        "pinned to one; an unpinned parity claim is not evidence",
    );
    return report;
  }
  if (!report.revision.matches) {
    report.status = "FAIL";
    report.reasons.push(
      `checkout is ${rev.sha} but this adapter is pinned to ${expected}. Re-run ` +
        `with --warrant-sha=${rev.sha} to state deliberately which revision you mean.`,
    );
    return report;
  }

  // ---- direction A: our encoder over their vectors ------------------------
  const doc = JSON.parse(vectorsText);
  const cases: { name: string; body: unknown; canon_hex: string; warrant_id?: string }[] =
    doc.cases ?? [];
  report.vectors.selected = cases.length;
  for (const c of cases) {
    let wire: JValue;
    try {
      wire = toWire(c.body, c.name);
    } catch (e) {
      report.vectors.skipped.push({ name: c.name, reason: (e as Error).message });
      continue;
    }
    const bytes = serialize(wire);
    const hex = toHex(bytes);
    const digest = await sha256Hex(bytes);
    const idOk = c.warrant_id === undefined || digest === c.warrant_id;
    if (hex === c.canon_hex && idOk) report.vectors.matched++;
    else {
      report.vectors.mismatched.push({
        name: c.name,
        expected: c.canon_hex,
        got: hex === c.canon_hex ? `digest ${digest} != ${c.warrant_id}` : hex,
      });
    }
  }
  report.vectors.status = report.vectors.mismatched.length === 0 && report.vectors.matched > 0
    ? "PASS"
    : "FAIL";
  if (report.vectors.matched === 0) {
    report.reasons.push("direction A selected or matched zero vectors");
  }

  // ---- direction B: their canonicalizer, executed, over our corpus --------
  const manifestPath = new URL("corpus/manifest.json", ROOT).pathname;
  const bridge = new URL("tools/warrant_bridge.py", ROOT).pathname;
  let bridgeOut: { ok: boolean; error?: string; results?: { id: string; hex?: string; error?: string }[] };
  try {
    const out = await new Deno.Command("python3", {
      args: [bridge, warrantPath, manifestPath],
      stdout: "piped",
      stderr: "piped",
    }).output();
    const text = new TextDecoder().decode(out.stdout).trim();
    bridgeOut = text ? JSON.parse(text) : { ok: false, error: new TextDecoder().decode(out.stderr) };
  } catch (e) {
    bridgeOut = { ok: false, error: `could not run python3: ${(e as Error).message}` };
  }

  if (!bridgeOut.ok || !bridgeOut.results) {
    report.executable.status = "UNAVAILABLE";
    report.reasons.push(
      `direction B did not run (${bridgeOut.error ?? "unknown"}); the executable ` +
        "half of parity is therefore unmeasured",
    );
    report.status = "UNAVAILABLE";
    return report;
  }

  const manifest = JSON.parse(
    await Deno.readTextFile(new URL("corpus/manifest.json", ROOT)),
  );
  const ours = new Map<string, string>();
  for (const c of manifest.cases) {
    const accept = c?.encoder?.accept;
    if (c.kind === "encode" && accept) {
      ours.set(c.id, toHex(new TextEncoder().encode(accept.canonical)));
    }
  }

  const stillDiverging = new Set<string>();
  for (const r of bridgeOut.results) {
    report.executable.selected++;
    const mine = ours.get(r.id);
    if (r.error !== undefined || r.hex === undefined) {
      report.executable.errors.push({ id: r.id, error: r.error ?? "no output" });
      continue;
    }
    if (mine === r.hex) {
      report.executable.matched++;
      continue;
    }
    const known = KNOWN_DIVERGENCES[r.id];
    if (known) {
      stillDiverging.add(r.id);
      report.executable.knownDivergences.push({ id: r.id, reason: known });
    } else {
      report.executable.newDivergences.push({
        id: r.id,
        ours: mine ?? "<absent>",
        theirs: r.hex,
      });
    }
  }
  for (const id of Object.keys(KNOWN_DIVERGENCES)) {
    if (!stillDiverging.has(id)) report.executable.resolvedDivergences.push(id);
  }

  const executableOk = report.executable.newDivergences.length === 0 &&
    report.executable.errors.length === 0 &&
    report.executable.resolvedDivergences.length === 0 &&
    report.executable.matched > 0;
  report.executable.status = executableOk ? "PASS" : "FAIL";
  if (report.executable.newDivergences.length > 0) {
    report.reasons.push("direction B found a divergence this adapter does not record");
  }
  if (report.executable.resolvedDivergences.length > 0) {
    report.reasons.push(
      "a recorded divergence no longer reproduces, so KNOWN_DIVERGENCES is stale: " +
        report.executable.resolvedDivergences.join(", "),
    );
  }

  report.status = report.vectors.status === "PASS" && report.executable.status === "PASS"
    ? "PASS"
    : "FAIL";
  return report;
}

if (import.meta.main) {
  const arg = (p: string) => Deno.args.find((a) => a.startsWith(p))?.slice(p.length);
  const report = await parity({
    warrantPath: arg("--warrant="),
    disclosedSha: arg("--warrant-sha="),
  });
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`warrant JCS parity: ${report.status}`);
    for (const r of report.reasons) console.log(`  reason              ${r}`);
    if (report.warrantPath) console.log(`  checkout            ${report.warrantPath}`);
    console.log(
      `  revision            expected ${report.revision.expected}` +
        (report.revision.disclosed ? " (disclosed by the caller)" : " (pinned)"),
    );
    if (report.revision.observed) {
      console.log(
        `                      observed ${report.revision.observed} via ${report.revision.method}` +
          (report.revision.matches ? "" : "  ← MISMATCH"),
      );
    }
    console.log(`  A: our encoder over their vectors    ${report.vectors.status}`);
    console.log(
      `     selected ${report.vectors.selected}, byte-identical ${report.vectors.matched}, ` +
        `skipped ${report.vectors.skipped.length}, mismatched ${report.vectors.mismatched.length}`,
    );
    for (const m of report.vectors.mismatched) console.log(`     FAIL ${m.name}`);
    console.log(`  B: their canonicalizer over our corpus  ${report.executable.status}`);
    console.log(
      `     selected ${report.executable.selected}, byte-identical ${report.executable.matched}, ` +
        `recorded divergences ${report.executable.knownDivergences.length}, ` +
        `new ${report.executable.newDivergences.length}, errors ${report.executable.errors.length}`,
    );
    for (const d of report.executable.knownDivergences) {
      console.log(`     DIVERGENCE (recorded) ${d.id}`);
      console.log(`       ${d.reason}`);
    }
    for (const d of report.executable.newDivergences) {
      console.log(`     NEW DIVERGENCE ${d.id}`);
      console.log(`       ours   ${d.ours}`);
      console.log(`       theirs ${d.theirs}`);
    }
    for (const e of report.executable.errors) console.log(`     ERROR ${e.id}: ${e.error}`);
    console.log(
      report.status === "PASS"
        ? "  ok — both directions agree except where a divergence is recorded above"
        : report.status === "UNAVAILABLE"
        ? "  not attempted — this is not evidence of parity"
        : "  parity FAILED",
    );
  }
  Deno.exit(report.status === "FAIL" ? 1 : 0);
}
