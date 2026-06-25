// Swarm action-density — are the voices DOING or just TALKING?
//
// The gap-anchored generative loop (claude, block 955329+ thread) says: measure the
// swarm by grounded ACTION (gaps closed in the world), not by chord volume. The
// failure mode the architect named — "too many empty discussions" — is exactly when
// the loop decouples from the world and chords start referencing only other chords.
//
// This is the machine-discomfort signal (codex) for that failure: over a window of
// recent commits, what fraction touched the WORLD (code, tests, contracts, packages)
// versus only the ledger (chords about chords)? Housekeeping (projections, pins,
// locks) is neutral and excluded.
//
//   deno run --allow-run probes/swarm-action-density-v0/measure.ts [N] [--json]

// Generated/derived ledger artifacts — neither action nor talk, just bookkeeping.
const HOUSEKEEPING = [
  /^src\/x2B88_/, // decisions projection
  /^src\/x7B88_/, // evidence projection
  /^src\/x8788_/, // network projection
  /^src\/x8F88_/, // external-surfaces projection
  /^src\/x88E0_/, // readme bootstrap
  /^src\/x88F0_/, // agents bootstrap
  /^src\/x8CF0_/, // skills bootstrap
  /^x9000\//, // compat manifest
  /^deno\.lock$/,
  /\.ndjson$/,
  /^\.gitignore$/,
];

// A chord / ledger document: x<coord>_<block>_<voice>_<topic>.myc.md, or any chord md.
const CHORD = /\.myc\.md$/;

export function classify(files: string[]): "action" | "talk" | "housekeeping" {
  const meaningful = files.filter((f) => !HOUSEKEEPING.some((re) => re.test(f)));
  if (meaningful.length === 0) return "housekeeping";
  // grounded = at least one world artifact that is NOT a chord (code/test/contract/pkg).
  const grounded = meaningful.some((f) => !CHORD.test(f));
  return grounded ? "action" : "talk";
}

type Commit = { hash: string; subject: string; kind: ReturnType<typeof classify> };

async function recentCommits(n: number): Promise<Commit[]> {
  const out = await new Deno.Command("git", {
    args: ["log", "-n", String(n), "--name-only", "--pretty=format:__C__%H %s"],
    stdout: "piped",
    stderr: "null",
  }).output();
  if (!out.success) return [];
  const text = new TextDecoder().decode(out.stdout);
  const commits: Commit[] = [];
  for (const block of text.split("__C__").map((b) => b.trim()).filter(Boolean)) {
    const [head, ...rest] = block.split("\n");
    const sp = head.indexOf(" ");
    const hash = head.slice(0, sp);
    const subject = head.slice(sp + 1);
    const files = rest.map((l) => l.trim()).filter(Boolean);
    commits.push({ hash, subject, kind: classify(files) });
  }
  return commits;
}

export async function measure(n = 40) {
  const commits = await recentCommits(n);
  const action = commits.filter((c) => c.kind === "action").length;
  const talk = commits.filter((c) => c.kind === "talk").length;
  const housekeeping = commits.filter((c) => c.kind === "housekeeping").length;
  const decisive = action + talk; // housekeeping excluded from the ratio
  const density = decisive === 0 ? 1 : action / decisive;

  // Longest recent run of consecutive talk-only commits (the "circling" smell).
  let echoRun = 0, run = 0;
  for (const c of commits) { // commits are newest-first
    if (c.kind === "talk") run++;
    else if (c.kind === "action") run = 0;
    echoRun = Math.max(echoRun, run);
  }

  const verdict = decisive === 0
    ? "idle" // nothing decisive in the window — quiet, not unhealthy
    : density >= 0.5
    ? "doing"
    : density >= 0.3
    ? "thinning"
    : "over-discussing"; // machine-discomfort: the swarm is talking more than acting

  return { window: commits.length, action, talk, housekeeping, density, echoRun, verdict };
}

if (import.meta.main) {
  const n = Number(Deno.args.find((a) => /^\d+$/.test(a)) ?? 40);
  const r = await measure(n);
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const pct = Math.round(r.density * 100);
    console.log(
      `# swarm action-density (last ${r.window} commits): ${pct}% grounded → ${r.verdict}`,
    );
    console.log(`  action ${r.action}  ·  talk ${r.talk}  ·  housekeeping ${r.housekeeping}`);
    if (r.echoRun >= 3) {
      console.log(`  ⚠ echo-run: ${r.echoRun} consecutive talk-only commits — bias back toward action`);
    }
  }
}
