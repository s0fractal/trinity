// Read-only MYC compost reconstruction verifier.
//
// Codex P3 (chord x7700_955312) and my ruling (x3300_955313): a terminal proposal
// may only be physically removed (`git rm`) once it is PROVEN reconstructable from
// {git history + its resolution}. This is that proof — and only the proof. It
// deletes nothing.
//
// A proposal is SAFE TO COMPOST iff:
//   1. it has a terminal resolution (outcome implemented | rejected), AND
//   2. it is in git history (so a deleted file is recoverable: `git show <c>:<path>`), AND
//   3. that resolution pins it by content address — proposal_fqdn == the file, and
//      proposal_commitment's prefix == the file's hash — so after recovery you can
//      VERIFY you recovered the right bytes, not merely some bytes.
//
//   deno run --allow-read --allow-run probes/myc-compost-reconstruction-v0/verify.ts [--json]

const MYC = new URL("../../myc/", import.meta.url).pathname.replace(/\/$/, "");
const PROP_DIR = `${MYC}/public/proposals`;
const RES_DIR = `${MYC}/public/resolutions`;

const TERMINAL = new Set(["implemented", "rejected"]);

type Resolution = { proposal_fqdn?: string; proposal_commitment?: string; outcome?: string };

function field(text: string, key: string): string | undefined {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
  return m?.[1];
}

async function listMd(dir: string): Promise<string[]> {
  try {
    const out: string[] = [];
    for await (const e of Deno.readDir(dir)) {
      if (e.isFile && e.name.endsWith(".myc.md")) out.push(e.name);
    }
    return out;
  } catch {
    return []; // dir absent (e.g. myc submodule not checked out) — nothing to verify
  }
}

async function gitTracked(relPath: string): Promise<boolean> {
  try {
    const out = await new Deno.Command("git", {
      args: ["-C", MYC, "log", "--all", "--oneline", "-1", "--", relPath],
      stdout: "piped",
      stderr: "null",
    }).output();
    return out.success && new TextDecoder().decode(out.stdout).trim().length > 0;
  } catch {
    return false;
  }
}

export async function verify() {
  const propFiles = await listMd(PROP_DIR);
  const resFiles = await listMd(RES_DIR);

  // Index resolutions by the proposal they bind to.
  const byProposal = new Map<string, Resolution>();
  for (const rf of resFiles) {
    const text = await Deno.readTextFile(`${RES_DIR}/${rf}`);
    const r: Resolution = {
      proposal_fqdn: field(text, "proposal_fqdn"),
      proposal_commitment: field(text, "proposal_commitment"),
      outcome: field(text, "outcome"),
    };
    if (r.proposal_fqdn) byProposal.set(r.proposal_fqdn, r);
  }

  const rows = [];
  for (const pf of propFiles) {
    const res = byProposal.get(pf);
    const terminal = !!res && TERMINAL.has(res.outcome ?? "");
    // file hash short is encoded in the content-addressed name: h.<12hex>.proposal.myc.md
    const short = pf.match(/^h\.([0-9a-f]{12})\./)?.[1] ?? "";
    const tracked = await gitTracked(`public/proposals/${pf}`);
    const pinned = !!res && res.proposal_fqdn === pf &&
      !!short && (res.proposal_commitment ?? "").startsWith(short);
    rows.push({
      proposal: pf,
      terminal,
      outcome: res?.outcome ?? null,
      git_tracked: tracked,
      commitment_pinned: pinned,
      reconstructable: terminal && tracked && pinned,
      safe_to_compost: terminal && tracked && pinned,
    });
  }

  const terminalRows = rows.filter((r) => r.terminal);
  const safe = terminalRows.filter((r) => r.safe_to_compost);
  return {
    type: "myc_compost_reconstruction",
    proposals: rows.length,
    terminal: terminalRows.length,
    safe_to_compost: safe.length,
    all_terminal_reconstructable: terminalRows.length === safe.length,
    rows,
  };
}

if (import.meta.main) {
  const r = await verify();
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(
      `# myc compost reconstruction — ${r.safe_to_compost}/${r.terminal} terminal proposals provably reconstructable (of ${r.proposals} total)`,
    );
    for (const row of r.rows) {
      const mark = row.safe_to_compost
        ? "✅ safe     " // terminal (implemented/rejected) + reconstructable
        : row.terminal
        ? "⛔ NOT-SAFE " // terminal but not reconstructable — must not compost
        : row.outcome
        ? "·  deferred " // resolved with a non-compost outcome (e.g. superseded)
        : "·  open     "; // no terminal resolution yet
      console.log(`  ${mark} ${row.proposal}  (${row.outcome ?? "no resolution"})`);
    }
    if (r.terminal > 0 && !r.all_terminal_reconstructable) {
      console.log("\n⛔ Some terminal proposals are NOT reconstructable — do NOT compost until fixed.");
    }
  }
}
