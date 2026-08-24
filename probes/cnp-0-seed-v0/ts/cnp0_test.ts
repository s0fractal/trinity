// The gate for the CNP-0 executable seed, wired into `deno task test:unit`
// (and therefore into `./t check` and CI). Self-contained: no sibling checkout,
// no network, no submodule.

import { assert, assertEquals } from "@std/assert";
import { run } from "./runner.ts";
import { runMutations } from "./mutate.ts";
import { KNOWN_DIVERGENCES, parity } from "./parity_warrant.ts";
import { sha256Hex } from "./jcs.ts";

const ROOT = new URL("../", new URL(".", import.meta.url));

Deno.test("cnp-0 corpus: every case matches its pinned expectation", async () => {
  const report = await run();
  assertEquals(report.failures, [], report.failures.map((f) => `${f.id}: ${f.detail}`).join("\n"));
});

Deno.test("cnp-0 corpus: the counts are non-zero and the classes are covered", async () => {
  const report = await run();
  // A green suite that selected nothing is a failure, not a pass.
  assert(report.cases > 0, "no cases selected");
  assert(report.encoderAccepted > 0, "no positive encoder case");
  assert(report.encoderRejected > 0, "no negative encoder case");
  assert(report.verifierAccepted > 0, "no accepted verifier case");
  assert(report.verifierRejected > 0, "no rejected verifier case");
  assert(report.transformsAccepted > 0, "no accepted transform case");
  assert(report.transformsRejected > 0, "no rejected transform case");
  assert(report.digestGroups > 0, "no distinct-digest group");

  // All eight §5.1.3 categories are present.
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL("corpus/manifest.json", ROOT)),
  );
  const categories = new Set<number>(
    manifest.cases.map((c: { category: number }) => c.category),
  );
  for (let i = 1; i <= 8; i++) {
    assert(categories.has(i), `§5.1.3(${i}) has no case`);
  }

  // Every rejection class the manifest declares is actually exercised.
  const declared: string[] = manifest.rejection_classes;
  const used = new Set<string>();
  for (const c of manifest.cases) {
    for (const side of ["encoder", "verifier", "expect"]) {
      const v = (c as Record<string, unknown>)[side];
      if (v && typeof v === "object" && "reject" in (v as Record<string, unknown>)) {
        used.add(String((v as Record<string, string>).reject));
      }
    }
  }
  const unexercised = declared.filter((c) => !used.has(c));
  assertEquals(
    unexercised,
    [],
    `declared but never exercised: ${unexercised.join(", ")}`,
  );
});

Deno.test("verifier-only path does not import the encoder", async () => {
  const source = await Deno.readTextFile(new URL("ts/reject.ts", ROOT));
  const imports = [...source.matchAll(/^\s*import[^;]*from\s+"([^"]+)"/gm)]
    .map((m) => m[1]);
  // §5.1.3 requires a third path that starts from raw bytes without the
  // canonicalizer. This is the structural half of that requirement; the
  // behavioural half is that it never emits bytes, only a verdict.
  assertEquals(imports, [], `reject.ts must import nothing, got ${imports.join(", ")}`);
  assert(!source.includes("serialize("), "the verifier must not re-encode input");
  assert(!source.includes("canonicalize("), "the verifier must not call the canonicalizer");
});

Deno.test("the verifier never repairs: rejected input yields no bytes", async () => {
  const { verifyRaw } = await import("./reject.ts");
  const notCanonical = new TextEncoder().encode(
    '{"z":1,"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0"}',
  );
  const outcome = await verifyRaw(notCanonical);
  assert(!outcome.ok, "member order out of sequence must be rejected");
  assertEquals(Object.keys(outcome).sort(), ["detail", "offset", "ok", "rejection"]);
});

Deno.test("negative controls: each protected class goes red for the right reason", async () => {
  const results = await runMutations();
  const control = results.find((r) => r.control);
  assert(control?.wentRed, "the unmutated copy must be green first");
  const mutations = results.filter((r) => !r.control);
  // Red is not enough: a mutation that crashes the runner proves nothing about
  // the property it was meant to test, so each must reach the runner's own
  // reporting path and print a FAIL line.
  const bad = mutations.filter((r) => !r.applied || !r.wentRed || !r.redForTheRightReason);
  assertEquals(bad.map((r) => `${r.id}: ${r.detail}`), []);
  assert(mutations.length >= 10, `too few mutation classes: ${mutations.length}`);
});

Deno.test("warrant parity is UNAVAILABLE, not green, without a pinned checkout", async () => {
  const report = await parity({});
  assertEquals(report.status, "UNAVAILABLE");
  assertEquals(report.vectors.matched, 0);
  assertEquals(report.executable.matched, 0);
  assert(report.reasons.some((r) => r.includes("not the same as parity holding")));
});

Deno.test("a directory that cannot supply the pinned tree measures nothing", async () => {
  const dir = await Deno.makeTempDir({ prefix: "cnp0-fakewarrant-" });
  try {
    await Deno.mkdir(`${dir}/examples`);
    await Deno.writeTextFile(`${dir}/examples/canon-vectors.json`, '{"cases":[]}');
    const report = await parity({ warrantPath: dir });
    // Not a git checkout, so the pinned revision cannot be archived. Nothing was
    // measured, and nothing measured is UNAVAILABLE — never PASS.
    assertEquals(report.status, "UNAVAILABLE");
    assertEquals(report.parityState, "UNMEASURED");
    assertEquals(report.measured, undefined);
    assert(report.reasons.some((r) => r.includes("could not be materialized")));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});


/* ------------------------------------------------------------------ *
 * The recorded-divergence pin, tested the way codex broke the previous
 * version: a checkout at the pinned revision whose canonicalizer returns
 * something else for exactly the recorded case.
 * ------------------------------------------------------------------ */

/** Warrant's canonicalizer, reproduced; `tamper` alters only the recorded case. */
function fakeWarrantSource(tamper: boolean): string {
  return [
    "import json",
    "",
    "def canon(body):",
    ...(tamper
      ? [
        "    if any(ord(ch) > 0xFFFF for k in body for ch in k):",
        '        return b\'{"tampered":true}\'',
      ]
      : []),
    '    return json.dumps(body, sort_keys=True, separators=(",", ":"),',
    '                      ensure_ascii=False).encode("utf-8")',
    "",
  ].join("\n");
}

async function fakeWarrantRepo(tamper: boolean): Promise<{ dir: string; sha: string }> {
  const dir = await Deno.makeTempDir({ prefix: "cnp0-fakewarrant-" });
  await Deno.mkdir(`${dir}/impl`);
  await Deno.mkdir(`${dir}/examples`);
  await Deno.writeTextFile(`${dir}/impl/warrant.py`, fakeWarrantSource(tamper));
  // One trivial vector so direction A has something to select. It is computed
  // here rather than taken from the real Warrant, so it tests the mechanics of
  // this harness and nothing about Warrant.
  const canonHex = "7b2261223a317d"; // {"a":1}
  const warrantId = await sha256Hex(new TextEncoder().encode('{"a":1}'));
  await Deno.writeTextFile(
    `${dir}/examples/canon-vectors.json`,
    JSON.stringify({
      cases: [{ name: "trivial", body: { a: 1 }, canon_hex: canonHex, warrant_id: warrantId }],
    }),
  );
  const run = async (args: string[]) => {
    const r = await new Deno.Command("git", {
      args: ["-C", dir, ...args],
      stdout: "null",
      stderr: "null",
    }).output();
    if (!r.success) throw new Error(`git ${args.join(" ")} failed`);
  };
  await run(["init", "-q"]);
  await run(["add", "-A"]);
  await run([
    "-c",
    "user.name=cnp0-test",
    "-c",
    "user.email=cnp0@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "-q",
    "-m",
    "fixture",
  ]);
  const head = await new Deno.Command("git", {
    args: ["-C", dir, "rev-parse", "HEAD"],
    stdout: "piped",
    stderr: "null",
  }).output();
  return { dir, sha: new TextDecoder().decode(head.stdout).trim() };
}

Deno.test("a recorded divergence does not license arbitrary bytes", async () => {
  const { dir, sha } = await fakeWarrantRepo(true);
  try {
    const report = await parity({ warrantPath: dir, disclosedSha: sha });
    assertEquals(report.status, "FAIL");
    assertEquals(report.parityState, "DIVERGENT");
    const ids = report.executable.changedDivergences.map((d) => d.id);
    assert(
      ids.includes("c6-utf16-order"),
      `expected the recorded case to be reported as CHANGED, got ${JSON.stringify(report.executable)}`,
    );
    assertEquals(report.executable.newDivergences, []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("an honest checkout at a disclosed revision is BOUNDED, not IDENTICAL", async () => {
  const { dir, sha } = await fakeWarrantRepo(false);
  try {
    const report = await parity({ warrantPath: dir, disclosedSha: sha });
    assertEquals(report.status, "PASS");
    // 27 of 28 identical is not parity, and the report says so in its own field.
    assertEquals(report.parityState, "BOUNDED");
    assertEquals(report.executable.changedDivergences, []);
    assertEquals(
      report.executable.knownDivergences.map((d) => d.id),
      Object.keys(KNOWN_DIVERGENCES),
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a dirty external checkout cannot reach the measurement", async () => {
  const { dir, sha } = await fakeWarrantRepo(false);
  try {
    // Commit the honest implementation, then tamper only the WORK TREE. The
    // committed tree is what gets archived and measured, so the tampering must
    // not change the result — and must be disclosed.
    await Deno.writeTextFile(`${dir}/impl/warrant.py`, fakeWarrantSource(true));
    const report = await parity({ warrantPath: dir, disclosedSha: sha });
    assertEquals(report.status, "PASS");
    assertEquals(report.parityState, "BOUNDED");
    assert(
      (report.worktree?.dirtyPaths ?? []).some((p) => p.includes("impl/warrant.py")),
      "the local modification must be disclosed in the report",
    );
    assertEquals(report.measured?.revision, sha);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
