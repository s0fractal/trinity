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

Deno.test("clean-room harness: every tier-1 negative control refuses", async () => {
  const report = await selftest();
  const tier1 = report.results.filter((r) => r.tier === 1);
  assert(tier1.length >= 41, `too few tier-1 controls: ${tier1.length}`);
  const bad = tier1.filter((r) => !r.ok || r.skipped);
  assertEquals(bad.map((r) => `${r.name}: ${r.detail}`), []);
});

Deno.test("clean-room harness: isolation controls are run or explicitly skipped", async () => {
  const report = await selftest();
  const tier2 = report.results.filter((r) => r.tier === 2);
  // Docker is not on every runner. What must never happen is a tier-2 control
  // vanishing: it is either exercised or reported as skipped, and a skipped
  // control is never counted as a pass.
  assert(tier2.length >= 3, "the isolation controls are missing entirely");
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
