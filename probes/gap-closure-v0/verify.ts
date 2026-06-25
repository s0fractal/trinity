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

const ALLOWED_BINARIES = new Set(["deno", "cargo"]);
const FORBIDDEN_SHELL_META = /[|;<>`$(){}[\]*?~!#\n\r]/;

export async function loadGaps(): Promise<Gap[]> {
  try {
    const text = await Deno.readTextFile(GAPS);
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return []; // absent records → nothing to verify
  }
}

function splitArgs(segment: string): string[] | null {
  if (FORBIDDEN_SHELL_META.test(segment)) return null;
  const parts = segment.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts : null;
}

function containedCwd(base: string, rel: string): string | null {
  if (!/^[A-Za-z0-9._/-]+$/.test(rel)) return null;
  if (rel.startsWith("/") || rel.includes("..")) return null;
  const next = `${base}/${rel}`.replace(/\/+/g, "/").replace(/\/$/, "");
  return next.startsWith(ROOT) ? next : null;
}

export function closureCheckSafetyError(cmd: string): string | null {
  const segments = cmd.split("&&").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0 || segments.length > 4) {
    return "unsafe closure_check: empty or too many command segments";
  }
  for (const segment of segments) {
    const parts = splitArgs(segment);
    if (!parts) return `unsafe closure_check segment: ${segment.slice(0, 80)}`;
    if (parts[0] === "cd") {
      if (parts.length !== 2) return "unsafe closure_check: cd needs exactly one relative path";
      const next = containedCwd(ROOT, parts[1]);
      if (!next) return `unsafe closure_check cd target: ${parts[1]}`;
      continue;
    }
    if (!ALLOWED_BINARIES.has(parts[0])) return `unsafe closure_check binary: ${parts[0]}`;
  }
  return null;
}

async function runCheck(cmd: string): Promise<{ ok: boolean; summary: string }> {
  const unsafe = closureCheckSafetyError(cmd);
  if (unsafe) return { ok: false, summary: unsafe };

  const segments = cmd.split("&&").map((s) => s.trim()).filter(Boolean);

  try {
    let cwd = ROOT;
    let summary = "";
    for (const segment of segments) {
      const parts = splitArgs(segment);
      if (!parts) return { ok: false, summary: `unsafe closure_check segment: ${segment.slice(0, 80)}` };

      if (parts[0] === "cd") {
        if (parts.length !== 2) return { ok: false, summary: "unsafe closure_check: cd needs exactly one relative path" };
        const next = containedCwd(ROOT, parts[1]);
        if (!next) return { ok: false, summary: `unsafe closure_check cd target: ${parts[1]}` };
        cwd = next;
        continue;
      }

      if (!ALLOWED_BINARIES.has(parts[0])) {
        return { ok: false, summary: `unsafe closure_check binary: ${parts[0]}` };
      }

      const out = await new Deno.Command(parts[0], {
        args: parts.slice(1),
        cwd,
        stdout: "piped",
        stderr: "piped",
        signal: AbortSignal.timeout(180_000),
      }).output();
      const text = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
      const lines = text.split("\n").map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").trim()).filter(Boolean);
      summary = (lines.pop() ?? "").slice(0, 140);
      if (!out.success) return { ok: false, summary };
    }
    return { ok: true, summary };
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
