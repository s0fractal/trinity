// Gap-closure verifier — codex's GAP_CLOSURE.v0 (chord x7700_955345), made runnable.
//
// Action-density (probes/swarm-action-density-v0) measures WORLD-TOUCH: did a commit
// touch code? codex's correction: that cannot prove action QUALITY. This probe answers
// the sharper question — which NAMED gaps were closed, with what runnable evidence? It
// reads gap records and RE-RUNS each closed gap's closure_check, so "closed" means
// "still closed, provably", not merely "a commit happened".
//
// Read-only and explicitly NON-AUTHORITATIVE: a report, never a scheduler/admission
// gate (codex's authority boundary — until two voices emit compatible gap refs and one
// closure receipt, this informs, it does not decide).
//
//   deno run --allow-read --allow-run probes/gap-closure-v0/verify.ts [--json] [--no-run]

const HERE = new URL(".", import.meta.url).pathname;
const ROOT = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
const GAPS = `${HERE}gaps.ndjson`;

type Gap = {
  gap_id: string;
  gap_source: string;
  status: string;
  closure_check?: string;
  closure_result?: string;
  residual_risk?: string;
  proposed_by?: string;
};

export async function loadGaps(): Promise<Gap[]> {
  try {
    const text = await Deno.readTextFile(GAPS);
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return []; // absent records → nothing to verify
  }
}

async function runCheck(cmd: string): Promise<{ ok: boolean; summary: string }> {
  try {
    const out = await new Deno.Command("sh", {
      args: ["-c", cmd],
      cwd: ROOT,
      stdout: "piped",
      stderr: "piped",
      signal: AbortSignal.timeout(180_000),
    }).output();
    const text = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
    const lines = text.split("\n").map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").trim()).filter(Boolean);
    return { ok: out.success, summary: (lines.pop() ?? "").slice(0, 140) };
  } catch (e) {
    return { ok: false, summary: String(e).slice(0, 140) };
  }
}

export async function verify(run = true) {
  const gaps = await loadGaps();
  const rows = [];
  for (const g of gaps) {
    let reverified: boolean | null = null;
    let observed = "";
    if (run && g.status === "closed" && g.closure_check) {
      const r = await runCheck(g.closure_check);
      reverified = r.ok;
      observed = r.summary;
    }
    rows.push({ ...g, reverified, observed });
  }
  const closed = rows.filter((r) => r.status === "closed");
  return {
    type: "gap_closure_report",
    authoritative: false, // codex's boundary: a report, never a gate
    total: rows.length,
    closed: closed.length,
    reverified: closed.filter((r) => r.reverified === true).length,
    unverified: closed.filter((r) => r.reverified === false).length,
    open_or_claimed: rows.filter((r) => r.status !== "closed").length,
    rows,
  };
}

if (import.meta.main) {
  const run = !Deno.args.includes("--no-run");
  const r = await verify(run);
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(
      `# gap-closure report — ${r.reverified}/${r.closed} closed gaps re-verified · ${r.open_or_claimed} open/claimed (NON-authoritative)`,
    );
    for (const row of r.rows) {
      const mark = row.status !== "closed"
        ? `·  ${row.status.padEnd(9)}`
        : row.reverified === true
        ? "✅ verified "
        : row.reverified === false
        ? "⚠ UNVERIFIED"
        : "·  (not run)";
      console.log(`  ${mark} ${row.gap_id}`);
      if (row.reverified === false) console.log(`        ↳ ${row.observed}`);
    }
  }
}
