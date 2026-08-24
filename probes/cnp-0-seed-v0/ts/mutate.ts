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
  applied: boolean;
  wentRed: boolean;
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
      const needle = "const sorted = [...v.entries].sort(";
      if (!t.includes(needle)) return undefined;
      return t.replace(needle, "const sorted = [...v.entries].reverse().slice(0).sort0(");
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

async function corpusFails(dir: string): Promise<{ red: boolean; output: string }> {
  const cmd = new Deno.Command("deno", {
    args: ["run", "--allow-read", `${dir}/ts/runner.ts`],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  const text = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
  return { red: out.code !== 0, output: text };
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
      applied: true,
      wentRed: !control.red,
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
          applied: false,
          wentRed: false,
          detail:
            `mutation could not be applied to ${m.target} — its anchor has moved, so ` +
            "this class is UNTESTED and must not be read as covered",
        });
        continue;
      }
      await Deno.writeTextFile(path, after);
      const { red, output } = await corpusFails(dir);
      results.push({
        id: m.id,
        applied: true,
        wentRed: red,
        detail: red
          ? `${m.what} → gate red`
          : `${m.what} → gate STAYED GREEN, which means this class is unprotected:\n${output}`,
      });
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  }
  return results;
}

if (import.meta.main) {
  const results = await runMutations();
  const bad = results.filter((r) => !r.applied || !r.wentRed);
  console.log("negative controls — one mutation per protected class");
  for (const r of results) {
    const mark = r.applied && r.wentRed ? "ok  " : "FAIL";
    console.log(`  ${mark} ${r.id.padEnd(30)} ${r.detail.split("\n")[0]}`);
  }
  console.log(
    `  ${results.length} mutation(s), ${results.length - bad.length} produced the ` +
      "expected failure",
  );
  if (bad.length > 0) {
    for (const r of bad) console.log(`\n${r.id}:\n${r.detail}`);
  }
  Deno.exit(bad.length === 0 ? 0 : 1);
}
