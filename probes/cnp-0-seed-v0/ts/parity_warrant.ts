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

export type KnownDivergence = {
  reason: string;
  /** Our canonical bytes for the case, hex. */
  oursHex: string;
  /** The external implementation's bytes for the same case, hex. */
  theirsHex: string;
};

/**
 * Measured disagreements between the two implementations, pinned as an EXACT
 * byte pair.
 *
 * Keying this by case id alone was a hole (codex review of e628382): every
 * divergent output for a recorded id counted as "the expected divergence", so a
 * tampered external implementation could produce arbitrary bytes for that case
 * and still be reported as PASS. Both sides of the pair are pinned now, so a
 * changed external result fails, and a changed result on OUR side fails too —
 * that would mean the corpus moved and this record is stale.
 *
 * `c6-utf16-order`: RFC 8785 §3.2.3 sorts member names by their UTF-16 code
 * units. Warrant's Python `canon()` uses `json.dumps(sort_keys=True)`, which
 * sorts by code point. The two orders agree for every BMP name and differ as
 * soon as a name is outside the BMP: U+1D11E is the surrogate pair D834 DD1E,
 * so it sorts BEFORE U+FFFD under RFC 8785 and AFTER it under Python. Warrant's
 * own vectors are all BMP, so their Python/Go/Rust parity never exercised this.
 * Reported as a finding about the external implementation, not filtered away.
 */
export const KNOWN_DIVERGENCES: Record<string, KnownDivergence> = {
  "c6-utf16-order": {
    reason:
      "RFC 8785 orders member names by UTF-16 code unit; Warrant's Python canon() " +
      "orders by code point. The orders differ only for non-BMP member names.",
    oursHex:
      "7b2263616e6f6e6963616c5f656e636f64696e67223a226873702d6a6373407630222c226e756d" +
      "657269635f70726f66696c65223a22636e702d30222c22f09d849e223a312c22efbfbd223a327d",
    theirsHex:
      "7b2263616e6f6e6963616c5f656e636f64696e67223a226873702d6a6373407630222c226e756d" +
      "657269635f70726f66696c65223a22636e702d30222c22efbfbd223a322c22f09d849e223a317d",
  },
};

export type ParityStatus = "PASS" | "FAIL" | "UNAVAILABLE";

/**
 * What the measurement FOUND, kept separate from whether the check passed.
 * 27 of 28 identical is not parity; calling the run PASS because the one
 * disagreement is the recorded one would blur those into a single word.
 */
export type ParityState = "IDENTICAL" | "BOUNDED" | "DIVERGENT" | "UNMEASURED";

export type ParityReport = {
  /** The regression gate: is the measurement exactly what is pinned? */
  status: ParityStatus;
  /** What the measurement found, independent of whether it matched the pin. */
  parityState: ParityState;
  reasons: string[];
  warrantPath?: string;
  /** The tree actually measured, materialized from the pinned revision. */
  measured?: { revision: string; via: string };
  /** Informational: does the checkout's work tree differ from what was measured? */
  worktree?: { dirtyPaths: string[]; note: string };
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
    changedDivergences: { id: string; expectedTheirs: string; gotTheirs: string; oursMatches: boolean }[];
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

async function git(args: string[]): Promise<{ ok: boolean; out: string }> {
  try {
    const r = await new Deno.Command("git", { args, stdout: "piped", stderr: "null" })
      .output();
    return { ok: r.success, out: new TextDecoder().decode(r.stdout).trim() };
  } catch {
    return { ok: false, out: "" };
  }
}

/**
 * Materialize the pinned revision into a temporary tree and measure THAT.
 *
 * Checking `git rev-parse HEAD` and then reading the work tree was a hole
 * (codex review of e628382): HEAD says nothing about uncommitted edits, so a
 * modified `impl/warrant.py` at the pinned commit was measured while the report
 * said the revision matched. `git archive` reads the committed tree, so the
 * measurement is a function of the revision alone and a dirty checkout cannot
 * reach it.
 */
async function materialize(
  repo: string,
  sha: string,
): Promise<{ dir: string } | { error: string }> {
  const exists = await git(["-C", repo, "cat-file", "-e", `${sha}^{commit}`]);
  if (!exists.ok) {
    return { error: `revision ${sha} is not present in ${repo}` };
  }
  const dir = await Deno.makeTempDir({ prefix: "cnp0-warrant-tree-" });
  const tar = `${dir}/tree.tar`;
  const archived = await git([
    "-C",
    repo,
    "archive",
    "--format=tar",
    "-o",
    tar,
    sha,
    "impl",
    "examples",
  ]);
  if (!archived.ok) {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
    return { error: `git archive failed for ${sha}` };
  }
  try {
    const untar = await new Deno.Command("tar", {
      args: ["-xf", tar, "-C", dir],
      stdout: "null",
      stderr: "null",
    }).output();
    if (!untar.success) throw new Error("tar failed");
  } catch (e) {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
    return { error: `could not unpack the archived tree: ${(e as Error).message}` };
  }
  return { dir };
}

export async function parity(opts: ParityOptions = {}): Promise<ParityReport> {
  const expected = opts.disclosedSha ?? PINNED_WARRANT_SHA;
  const report: ParityReport = {
    status: "UNAVAILABLE",
    parityState: "UNMEASURED",
    reasons: [],
    revision: { expected, matches: false, disclosed: opts.disclosedSha !== undefined },
    vectors: { status: "UNAVAILABLE", selected: 0, matched: 0, skipped: [], mismatched: [] },
    executable: {
      status: "UNAVAILABLE",
      selected: 0,
      matched: 0,
      newDivergences: [],
      knownDivergences: [],
      changedDivergences: [],
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

  // The checkout's HEAD is reported, but nothing depends on it: what gets
  // measured is the materialized tree of `expected`.
  const rev = await revisionOf(warrantPath);
  report.revision.observed = rev.sha;
  report.revision.method = rev.method;
  report.revision.matches = rev.sha === expected;

  const tree = await materialize(warrantPath, expected);
  if ("error" in tree) {
    report.reasons.push(
      `${tree.error}; the pinned tree could not be materialized, so nothing was measured`,
    );
    return report;
  }
  report.measured = { revision: expected, via: "git archive of the committed tree" };

  const dirty = await git(["-C", warrantPath, "status", "--porcelain", "--", "impl", "examples"]);
  const dirtyPaths = dirty.out ? dirty.out.split("\n").map((l) => l.trim()) : [];
  report.worktree = {
    dirtyPaths,
    note: dirtyPaths.length === 0
      ? "the checkout's impl/ and examples/ match the committed tree"
      : "the checkout has local modifications under impl/ or examples/; they were " +
        "NOT measured, because the archived tree of the pinned revision was",
  };

  try {
    const vectorsText = await Deno.readTextFile(`${tree.dir}/examples/canon-vectors.json`);

    // ---- direction A: our encoder over their vectors ---------------------
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

    // ---- direction B: their canonicalizer, executed, over our corpus -----
    const manifestPath = new URL("corpus/manifest.json", ROOT).pathname;
    const bridge = new URL("tools/warrant_bridge.py", ROOT).pathname;
    let bridgeOut: {
      ok: boolean;
      error?: string;
      results?: { id: string; hex?: string; error?: string }[];
    };
    try {
      const out = await new Deno.Command("python3", {
        args: [bridge, tree.dir, manifestPath],
        stdout: "piped",
        stderr: "piped",
      }).output();
      const text = new TextDecoder().decode(out.stdout).trim();
      bridgeOut = text
        ? JSON.parse(text)
        : { ok: false, error: new TextDecoder().decode(out.stderr) };
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
      if (!known) {
        report.executable.newDivergences.push({
          id: r.id,
          ours: mine ?? "<absent>",
          theirs: r.hex,
        });
        continue;
      }
      // Both sides of the pinned pair must match. A recorded id is not a
      // licence for arbitrary bytes.
      if (known.theirsHex === r.hex && known.oursHex === mine) {
        stillDiverging.add(r.id);
        report.executable.knownDivergences.push({ id: r.id, reason: known.reason });
      } else {
        stillDiverging.add(r.id);
        report.executable.changedDivergences.push({
          id: r.id,
          expectedTheirs: known.theirsHex,
          gotTheirs: r.hex,
          oursMatches: known.oursHex === mine,
        });
      }
    }
    for (const id of Object.keys(KNOWN_DIVERGENCES)) {
      if (!stillDiverging.has(id)) report.executable.resolvedDivergences.push(id);
    }

    const executableOk = report.executable.newDivergences.length === 0 &&
      report.executable.changedDivergences.length === 0 &&
      report.executable.errors.length === 0 &&
      report.executable.resolvedDivergences.length === 0 &&
      report.executable.matched > 0;
    report.executable.status = executableOk ? "PASS" : "FAIL";

    if (report.executable.newDivergences.length > 0) {
      report.reasons.push("direction B found a divergence this adapter does not record");
    }
    for (const c of report.executable.changedDivergences) {
      report.reasons.push(
        `recorded divergence ${c.id} produced different bytes than pinned` +
          (c.oursMatches ? "" : ", and our own bytes for it also changed"),
      );
    }
    if (report.executable.resolvedDivergences.length > 0) {
      report.reasons.push(
        "a recorded divergence no longer reproduces, so KNOWN_DIVERGENCES is stale: " +
          report.executable.resolvedDivergences.join(", "),
      );
    }

    // The regression gate and the finding are two different statements.
    report.status = report.vectors.status === "PASS" && report.executable.status === "PASS"
      ? "PASS"
      : "FAIL";
    report.parityState =
      report.executable.newDivergences.length > 0 ||
        report.executable.changedDivergences.length > 0
        ? "DIVERGENT"
        : report.executable.knownDivergences.length > 0
        ? "BOUNDED"
        : "IDENTICAL";
    return report;
  } finally {
    await Deno.remove(tree.dir, { recursive: true }).catch(() => {});
  }
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
    console.log(`warrant JCS regression gate: ${report.status}`);
    console.log(`warrant JCS parity state:    ${report.parityState}`);
    for (const r of report.reasons) console.log(`  reason              ${r}`);
    if (report.warrantPath) console.log(`  checkout            ${report.warrantPath}`);
    console.log(
      `  revision            expected ${report.revision.expected}` +
        (report.revision.disclosed ? " (disclosed by the caller)" : " (pinned)"),
    );
    if (report.revision.observed) {
      console.log(
        `                      checkout HEAD ${report.revision.observed} via ${report.revision.method}` +
          (report.revision.matches ? "" : "  (different — not what was measured)"),
      );
    }
    if (report.measured) {
      console.log(`  measured tree       ${report.measured.revision} — ${report.measured.via}`);
    }
    if (report.worktree) {
      console.log(`  work tree           ${report.worktree.note}`);
      for (const d of report.worktree.dirtyPaths) console.log(`                        ${d}`);
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
        `changed ${report.executable.changedDivergences.length}, ` +
        `new ${report.executable.newDivergences.length}, errors ${report.executable.errors.length}`,
    );
    for (const d of report.executable.knownDivergences) {
      console.log(`     DIVERGENCE (recorded, byte pair pinned) ${d.id}`);
      console.log(`       ${d.reason}`);
    }
    for (const d of report.executable.changedDivergences) {
      console.log(`     CHANGED DIVERGENCE ${d.id} — the recorded pair no longer holds`);
      console.log(`       pinned theirs ${d.expectedTheirs}`);
      console.log(`       got theirs    ${d.gotTheirs}`);
      if (!d.oursMatches) console.log(`       our own bytes for this case also differ from the pin`);
    }
    for (const d of report.executable.newDivergences) {
      console.log(`     NEW DIVERGENCE ${d.id}`);
      console.log(`       ours   ${d.ours}`);
      console.log(`       theirs ${d.theirs}`);
    }
    for (const e of report.executable.errors) console.log(`     ERROR ${e.id}: ${e.error}`);
    console.log(
      report.status === "PASS"
        ? `  ok — regression gate PASS; agreement is ${report.parityState}` +
          (report.parityState === "BOUNDED"
            ? `, not identical: ${report.executable.matched}/${report.executable.selected} ` +
              "byte-identical with the rest accounted for by a pinned divergence"
            : "")
        : report.status === "UNAVAILABLE"
        ? "  not attempted — this is not evidence of parity"
        : "  regression gate FAILED",
    );
  }
  Deno.exit(report.status === "FAIL" ? 1 : 0);
}
