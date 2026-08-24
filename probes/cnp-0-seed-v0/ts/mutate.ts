#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
// Negative controls: proof that the gate's red state means something.
//
// A suite that passes tells you nothing until you have watched it fail for the
// right reason. This harness copies the probe into a temporary tree, applies
// exactly ONE controlled mutation per protected class, runs the corpus there,
// and requires the run to fail. It touches nothing in the live checkout, and it
// reports a mutation that could not be applied as an error rather than as a
// silent skip — an unapplied mutation would otherwise look like a pass.

const HERE = new URL(".", import.meta.url);
const ROOT = new URL("../", HERE);

export type Mutation = {
  id: string;
  target: string;
  what: string;
  /** Returns the mutated bytes, or undefined when the anchor was not found. */
  apply: (text: string) => string | undefined;
};

export type MutationResult = {
  id: string;
  /** The unmutated baseline is reported separately: it is a control, not a mutation. */
  control: boolean;
  applied: boolean;
  wentRed: boolean;
  /** Red because a pinned expectation failed — not because the process crashed. */
  redForTheRightReason: boolean;
  detail: string;
};

const MUTATIONS: Mutation[] = [
  {
    id: "corpus-byte",
    target: "corpus/manifest.json",
    what: "flip one byte inside a pinned canonical byte string",
    apply: (t) => {
      const anchor = '"canonical": "{\\"canonical_encoding\\":\\"hsp-jcs@v0\\"';
      const at = t.indexOf(anchor);
      if (at < 0) return undefined;
      const hit = t.indexOf('\\"cnp-0\\"', at);
      if (hit < 0) return undefined;
      return t.slice(0, hit + 3) + "C" + t.slice(hit + 4);
    },
  },
  {
    id: "expected-digest",
    target: "corpus/manifest.json",
    what: "change one pinned SHA-256 expectation",
    apply: (t) => {
      const m = /"sha256": "([0-9a-f]{64})"/.exec(t);
      if (!m) return undefined;
      const flipped = (m[1][0] === "a" ? "b" : "a") + m[1].slice(1);
      return t.replace(m[0], `"sha256": "${flipped}"`);
    },
  },
  {
    id: "expected-rejection-class",
    target: "corpus/manifest.json",
    what: "change a negative case's expected rejection class",
    apply: (t) => {
      const needle = '"reject": "ratio-not-reduced"';
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, '"reject": "syntax"');
    },
  },
  {
    id: "encoder-drops-member-sort",
    target: "ts/jcs.ts",
    what: "make the encoder emit members in insertion order",
    apply: (t) => {
      // A semantic change that still type-checks: the comparator is replaced by
      // one that preserves insertion order. An earlier version of this mutation
      // called a method that does not exist, so the gate went red on a crash
      // rather than on the ordering it was meant to test (codex review).
      const needle = "const sorted = [...v.entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "const sorted = [...v.entries].sort(() => 0);");
    },
  },
  {
    id: "circle-accepts-out-of-range-point",
    target: "ts/transforms.ts",
    what: "let an out-of-range index be normalized into a point",
    apply: (t) => {
      const needle = "  if (index < 0n || index >= CIRCLE_MODULUS) {";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "  if (false) {");
    },
  },
  {
    id: "renormalize-allows-duplicate-coordinate",
    target: "ts/transforms.ts",
    what: "drop the unique-coordinate-identifier requirement",
    apply: (t) => {
      const needle = "    if (seen.has(key)) {";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "    if (false) {");
    },
  },
  {
    id: "encoder-accepts-unreduced-ratio",
    target: "ts/cnp0.ts",
    what: "remove the ratio reduction rule from the encoder",
    apply: (t) => {
      const needle = "if (num !== 0n && gcd(num, den) !== 1n) {";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "if (false) {");
    },
  },
  {
    id: "verifier-tolerates-whitespace",
    target: "ts/reject.ts",
    what: "let the verifier accept non-canonical whitespace",
    apply: (t) => {
      const needle = "  noWs(): void {\n    if (this.i < this.b.length && isWs(this.b[this.i])) {";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "  noWs(): void {\n    if (false) {");
    },
  },
  {
    id: "lut-byte",
    target: "corpus/circle256-lut.cnp0.json",
    what: "flip one byte of the pinned circle256 lookup table",
    apply: (t) => {
      const at = t.indexOf('"sin":[');
      if (at < 0) return undefined;
      const digit = at + 7;
      const ch = t[digit];
      if (ch < "0" || ch > "9") return undefined;
      return t.slice(0, digit) + (ch === "9" ? "8" : String.fromCharCode(ch.charCodeAt(0) + 1)) +
        t.slice(digit + 1);
    },
  },
  {
    id: "empty-corpus",
    target: "corpus/manifest.json",
    what: "select zero cases — a green empty suite must be a failure",
    apply: (t) => {
      const doc = JSON.parse(t);
      doc.cases = [];
      return JSON.stringify(doc, null, 2) + "\n";
    },
  },
];

const COPY = [
  "ts/jcs.ts",
  "ts/cnp0.ts",
  "ts/reject.ts",
  "ts/transforms.ts",
  "ts/runner.ts",
  "corpus/manifest.json",
  "corpus/circle256-lut.cnp0.json",
];

async function copyTree(into: string): Promise<void> {
  for (const rel of COPY) {
    const dest = `${into}/${rel}`;
    await Deno.mkdir(dest.slice(0, dest.lastIndexOf("/")), { recursive: true });
    await Deno.writeFile(dest, await Deno.readFile(new URL(rel, ROOT)));
  }
}

type CorpusRun = { red: boolean; expectationFailure: boolean; output: string };

async function corpusFails(dir: string): Promise<CorpusRun> {
  const cmd = new Deno.Command("deno", {
    args: ["run", "--no-config", "--allow-read", `${dir}/ts/runner.ts`],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  const text = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
  // Red is not enough. A mutation that makes the runner crash proves nothing
  // about the property it was meant to test, so the harness requires the
  // failure to be a REPORTED expectation failure: the runner reached its own
  // reporting path and printed a FAIL line.
  const reachedReport = text.includes("cnp-0 corpus — probes/cnp-0-seed-v0");
  const crashed = /error: Uncaught|TypeError:|is not a function/.test(text);
  const printedFailure = /^ {2}FAIL /m.test(text);
  return {
    red: out.code !== 0,
    expectationFailure: reachedReport && printedFailure && !crashed,
    output: text,
  };
}

export async function runMutations(): Promise<MutationResult[]> {
  const results: MutationResult[] = [];

  // Control: the unmutated copy must be green, or every result below is noise.
  const cleanDir = await Deno.makeTempDir({ prefix: "cnp0-clean-" });
  try {
    await copyTree(cleanDir);
    const control = await corpusFails(cleanDir);
    results.push({
      id: "control-unmutated",
      control: true,
      applied: true,
      wentRed: !control.red,
      redForTheRightReason: !control.red,
      detail: control.red
        ? `the unmutated copy FAILED, so no mutation result is meaningful:\n${control.output}`
        : "the unmutated copy is green",
    });
    if (control.red) return results;
  } finally {
    await Deno.remove(cleanDir, { recursive: true });
  }

  for (const m of MUTATIONS) {
    const dir = await Deno.makeTempDir({ prefix: `cnp0-${m.id}-` });
    try {
      await copyTree(dir);
      const path = `${dir}/${m.target}`;
      const before = await Deno.readTextFile(path);
      const after = m.apply(before);
      if (after === undefined || after === before) {
        results.push({
          id: m.id,
          control: false,
          applied: false,
          wentRed: false,
          redForTheRightReason: false,
          detail:
            `mutation could not be applied to ${m.target} — its anchor has moved, so ` +
            "this class is UNTESTED and must not be read as covered",
        });
        continue;
      }
      await Deno.writeTextFile(path, after);
      const { red, expectationFailure, output } = await corpusFails(dir);
      results.push({
        id: m.id,
        control: false,
        applied: true,
        wentRed: red,
        redForTheRightReason: expectationFailure,
        detail: !red
          ? `${m.what} → gate STAYED GREEN, which means this class is unprotected:\n${output}`
          : expectationFailure
          ? `${m.what} → gate red on a reported expectation failure`
          : `${m.what} → gate red, but NOT on a reported expectation failure ` +
            `(a crash proves nothing about this property):\n${output}`,
      });
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  }
  return results;
}

if (import.meta.main) {
  const results = await runMutations();
  const bad = results.filter((r) =>
    !r.applied || !r.wentRed || (!r.control && !r.redForTheRightReason)
  );
  const mutations = results.filter((r) => !r.control);
  const good = mutations.filter((r) => r.applied && r.wentRed && r.redForTheRightReason);
  console.log("negative controls — one mutation per protected class");
  for (const r of results) {
    const ok = r.applied && r.wentRed && (r.control || r.redForTheRightReason);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${r.id.padEnd(34)} ${r.detail.split("\n")[0]}`);
  }
  console.log(
    `  1 unmutated control + ${mutations.length} mutation(s); ` +
      `${good.length} of ${mutations.length} went red on a reported expectation failure`,
  );
  if (bad.length > 0) {
    for (const r of bad) console.log(`\n${r.id}:\n${r.detail}`);
  }
  Deno.exit(bad.length === 0 ? 0 : 1);
}
