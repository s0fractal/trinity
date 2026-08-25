// The clean-room harness's negative controls, wired into `deno task test:unit`
// and therefore into `./t check` and CI.
//
// Without this the probe's guarantees are prose: the harness could stop
// isolating, stop redacting, or start accepting an arbitrary feedback file, and
// every other test in the repository would stay green.

import { assert, assertEquals } from "@std/assert";

const HERE = new URL("../", import.meta.url).pathname;

type Result = {
  name: string;
  tier: number;
  ok: boolean;
  skipped: boolean;
  detail: string;
};

async function selftest(): Promise<{ results: Result[]; failed: number; skipped: number }> {
  const cmd = new Deno.Command("python3", {
    args: [`${HERE}harness/selftest.py`, "--json"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  const text = new TextDecoder().decode(out.stdout);
  const err = new TextDecoder().decode(out.stderr);

  // Check the exit code and carry stderr, before parsing. This used to go
  // straight to JSON.parse: when the harness crashed — a GitHub runner has the
  // docker CLI but not the pinned image, and sandbox.run raised before any
  // report was written — the failure surfaced as "Unexpected end of JSON input",
  // which names the parser and hides the cause. A crash should read as a crash.
  if (out.code !== 0) {
    throw new Error(
      `harness/selftest.py exited ${out.code} without completing.\n` +
        `stderr:\n${err}\nstdout:\n${text.slice(0, 2000)}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `harness/selftest.py exited 0 but produced no parseable report ` +
        `(${e instanceof Error ? e.message : e}).\nstderr:\n${err}\n` +
        `stdout:\n${text.slice(0, 2000)}`,
    );
  }
}

// The lock is the closed set. `>= 41` was a floor, and a floor is a permissive
// seam: a control could be deleted and all four of these tests stayed green, so
// the suite could shrink silently — the exact failure it exists to prevent in
// the harness it guards.
const LOCK: { tier1: string[]; tier2: string[]; total: number } = JSON.parse(
  await Deno.readTextFile(`${HERE}harness/controls.lock.json`),
);

function setDiff(got: string[], want: string[]) {
  const g = new Set(got), w = new Set(want);
  return {
    missing: want.filter((n) => !g.has(n)),
    unnamed: got.filter((n) => !w.has(n)),
    duplicated: got.filter((n, i) => got.indexOf(n) !== i),
  };
}

Deno.test("clean-room harness: the control set is exactly what the lock names", async () => {
  const report = await selftest();
  for (const tier of [1, 2] as const) {
    const got = report.results.filter((r) => r.tier === tier).map((r) => r.name);
    const want = tier === 1 ? LOCK.tier1 : LOCK.tier2;
    const { missing, unnamed, duplicated } = setDiff(got, want);
    assertEquals(
      missing,
      [],
      `tier ${tier} controls vanished: ${missing}. A control that disappears ` +
        `takes its guarantee with it; if removed on purpose, remove it from ` +
        `controls.lock.json in the same diff.`,
    );
    assertEquals(
      unnamed,
      [],
      `tier ${tier} controls the lock does not name: ${unnamed}. Add them to ` +
        `controls.lock.json so the set stays closed.`,
    );
    assertEquals(duplicated, [], `tier ${tier} reports ${duplicated} twice`);
  }
  assertEquals(report.results.length, LOCK.total);
});

Deno.test("clean-room harness: a vanished control turns the lock red", async () => {
  // Without this, the parity check above is a claim about a check nobody tested.
  // A real report with one control removed — and one added under a name the lock
  // does not know — must both be refused, by the same comparison CI runs.
  const report = await selftest();
  const tmp = await Deno.makeTempDir({ prefix: "cnp0-mutation-" });
  try {
    const check = async (results: unknown[], expect: string) => {
      const path = `${tmp}/report.json`;
      await Deno.writeTextFile(path, JSON.stringify({ ...report, results }));
      const cmd = new Deno.Command("python3", {
        args: [`${HERE}harness/controls.lock.py`, "--check", "--report", path],
        stdout: "piped",
        stderr: "piped",
      });
      const out = await cmd.output();
      const text = new TextDecoder().decode(out.stdout) +
        new TextDecoder().decode(out.stderr);
      assert(out.code !== 0, `mutation was not caught:\n${text}`);
      assert(text.includes(expect), `caught, but not as ${expect}:\n${text}`);
    };

    await check(report.results.slice(1), "is missing");
    await check(
      [...report.results, { ...report.results[0], name: "smuggled-in" }],
      "has gained",
    );
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});

Deno.test("clean-room harness: every tier-1 negative control refuses", async () => {
  const report = await selftest();
  const tier1 = report.results.filter((r) => r.tier === 1);
  const bad = tier1.filter((r) => !r.ok || r.skipped);
  assertEquals(bad.map((r) => `${r.name}: ${r.detail}`), []);
});

Deno.test("clean-room harness: isolation controls are run or explicitly skipped", async () => {
  const report = await selftest();
  const tier2 = report.results.filter((r) => r.tier === 2);
  // Docker is not on every runner. What must never happen is a tier-2 control
  // vanishing: it is either exercised or reported as skipped, and a skipped
  // control is never counted as a pass.
  assertEquals(tier2.length, LOCK.tier2.length, "an isolation control vanished");
  for (const r of tier2) {
    assert(r.ok || r.skipped, `${r.name} neither passed nor declared skipped: ${r.detail}`);
    if (r.skipped) assert(r.detail.length > 0, `${r.name} skipped without a reason`);
  }
});

// The probe is closed and its capsule is sealed, so the check verifies the
// committed capsule against its pin rather than re-deriving it from a
// specification that has since been amended. Either wording is a pass; a sealed
// capsule that had been hand-edited afterwards would still fail.
Deno.test("clean-room harness: the capsule is verbatim against the specification", async () => {
  const cmd = new Deno.Command("python3", {
    args: [`${HERE}harness/build_capsule.py`, "--check"],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  const text = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
  assertEquals(out.code, 0, text);
  assert(
    text.includes("capsule is verbatim") || text.includes("capsule sealed at"),
    text,
  );
});

Deno.test("clean-room harness: the pack names no implementation", async () => {
  const cmd = new Deno.Command("python3", {
    args: [`${HERE}harness/pack.py`],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await cmd.output();
  assertEquals(out.code, 0, new TextDecoder().decode(out.stdout));
});
