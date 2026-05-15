#!/usr/bin/env -S deno run --allow-all
// 0x5/D.ts — apply-codeicide (reversible archival of meta-ledger item)
// position: 5/D → action(5) × decision(D) = decisive execution
// hex_dipole: "26 26 26 33 4C 6C 33 33"
//   action_decision+0.85 (PRIMARY: this IS the decisive action)
//   foundation_container+0.60 (action grounds the verdict in filesystem)
//   triangle_build+0.30, harmony_emergence+0.30, completion_frontier+0.30
//     (builds archive, harmonizes the closure, completes the loop)
//   bucket 5/D: primary axis action (5), bucket 5 ← MATCH on axis 5
//               secondary 'D' → axis 5 decision-pole ← double match on axis 5
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// apply-codeicide — execute reversible archive based on AYE verdict
//
// Usage:
//   t apply-codeicide --proposal <env.json> --verdict <verdict.json> [--dry-run]
//
// Safety gates (ALL must pass before touching filesystem):
//   1. verdict.agreement === true
//   2. verdict.target_hash matches proposal.body.target_hash
//   3. proposal envelope body_hash matches verdict.proposal_body_hash
//   4. file at target_path still exists
//   5. file content hash still matches target_hash (no drift between
//      propose and apply)
//   6. target_path is not in the forbidden list (re-checked)
//
// Action:
//   archive_root = trinity_root/archive/<isotimestamp>/
//   mkdir -p archive_root/dirname(target)
//   mv target  →  archive_root/target
//   write archive_root/RECEIPT.json     (proposal + verdict envelopes)
//   write archive_root/RESURRECT.sh     (one-line restore script)
//
// Emits ApplyCodeicideReceipt payload.

import { dirname, fromFileUrl, join, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

const FORBIDDEN_PREFIXES = [
  "omega/", "liquid/", "myc/",
  "0x0/01.ts", "0x0/00.ndjson",
  "AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md", "KIMI.md",
  ".git/", ".gitmodules",
];

function isForbidden(relPath: string): boolean {
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (relPath === prefix || relPath.startsWith(prefix)) return true;
  }
  return false;
}

async function fileHash(absPath: string): Promise<string> {
  const data = await Deno.readFile(absPath);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  return "1220" + hex;
}

function parseArgs(args: string[]): { proposal?: string; verdict?: string; dryRun: boolean } {
  let proposal: string | undefined;
  let verdict: string | undefined;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--proposal") proposal = args[++i];
    else if (a === "--verdict") verdict = args[++i];
    else if (a === "--dry-run") dryRun = true;
  }
  return { proposal, verdict, dryRun };
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await Deno.readTextFile(path));
}

function findEnvelope(parsed: any): any {
  if (parsed?.schema === "trinity.receipt-envelope.v0.1") return parsed;
  if (parsed?.envelope?.schema === "trinity.receipt-envelope.v0.1") return parsed.envelope;
  return null;
}

function findVerdict(parsed: any): any {
  if (parsed?.schema === "trinity.codeicide-verdict.v0.1") return parsed;
  if (parsed?.result?.schema === "trinity.codeicide-verdict.v0.1") return parsed.result;
  return null;
}

function fail(msg: string, extra: Record<string, unknown> = {}): never {
  console.log(JSON.stringify({
    type: "error",
    message: msg,
    position: "5/D",
    ...extra,
  }));
  Deno.exit(1);
}

async function main() {
  const { proposal: proposalPath, verdict: verdictPath, dryRun } = parseArgs(Deno.args);

  if (!proposalPath || !verdictPath) {
    fail("apply-codeicide requires --proposal <env.json> --verdict <verdict.json> [--dry-run]");
  }

  const proposalParsed = await readJson(proposalPath!);
  const verdictParsed = await readJson(verdictPath!);

  const proposalEnv = findEnvelope(proposalParsed);
  const verdict = findVerdict(verdictParsed);

  if (!proposalEnv) fail("--proposal does not contain a recognizable v0.1 envelope");
  if (!verdict) fail("--verdict does not contain a recognizable CodeicideVerdict");

  // ── Gate 1: verdict must be AYE ───────────────────────────────────────
  if (verdict.agreement !== true || verdict.verdict !== "AYE") {
    fail(`verdict is not AYE (got ${verdict.verdict}); refusing to apply`, {
      verdict_reasons: verdict.reasons,
    });
  }

  // ── Gate 2: proposal envelope body_hash matches verdict expectation ──
  if (verdict.proposal_body_hash !== proposalEnv.body_hash) {
    fail("verdict.proposal_body_hash does not match proposal envelope body_hash", {
      verdict_proposal_body_hash: verdict.proposal_body_hash,
      proposal_envelope_body_hash: proposalEnv.body_hash,
    });
  }

  // ── Gate 3: verdict target metadata matches proposal body ──
  const propBody = proposalEnv.body;
  if (!propBody || propBody.type !== "CodeicideProposal") {
    fail("proposal envelope body is not a CodeicideProposal");
  }
  if (verdict.target_path !== propBody.target_path) {
    fail("verdict.target_path != proposal.body.target_path");
  }
  if (verdict.target_hash !== propBody.target_hash) {
    fail("verdict.target_hash != proposal.body.target_hash");
  }

  const targetRel = propBody.target_path as string;

  // ── Gate 4: forbidden path re-check ──
  if (isForbidden(targetRel)) {
    fail(`target is forbidden at apply time: ${targetRel}`);
  }

  // ── Gate 5: file exists ──
  const targetAbs = resolve(ROOT, targetRel);
  try {
    const stat = await Deno.stat(targetAbs);
    if (!stat.isFile) fail(`target is not a regular file: ${targetRel}`);
  } catch {
    fail(`target does not exist: ${targetRel}`);
  }

  // ── Gate 6: content hash still matches (no drift between propose and apply) ──
  const currentHash = await fileHash(targetAbs);
  if (currentHash !== propBody.target_hash) {
    fail("target file content changed between propose and apply; re-propose required", {
      proposal_target_hash: propBody.target_hash,
      current_target_hash: currentHash,
    });
  }

  // All structural gates passed.
  const isoStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveDir = join(ROOT, "archive", isoStamp);
  const archiveTarget = join(archiveDir, targetRel);
  const archiveTargetParent = dirname(archiveTarget);

  // ── Gate 7: archive collision check (per Codex AYE_WITH_EXTRA_GUARD) ──
  // Refuse to overwrite an existing archive entry. If the same isoStamp +
  // target_path already exists, two applies collided (highly unlikely, but
  // possible at sub-millisecond resolution or if isoStamp was reused).
  try {
    const existing = await Deno.stat(archiveTarget);
    if (existing) {
      fail("archive collision: target already exists at intended archive path; refusing to overwrite", {
        archive_target: `archive/${isoStamp}/${targetRel}`,
      });
    }
  } catch {
    // Expected path: not stat-able means no collision.
  }

  if (dryRun) {
    console.log(JSON.stringify({
      type: "codeicide_apply_dry_run",
      action: "apply-codeicide",
      position: "5/D",
      target_path: targetRel,
      target_hash: currentHash,
      would_move_to: `archive/${isoStamp}/${targetRel}`,
      would_write: [`archive/${isoStamp}/RECEIPT.json`, `archive/${isoStamp}/RESURRECT.sh`],
      gates_passed: ["verdict-AYE", "body_hash-consistent", "target-fields-match", "not-forbidden", "file-exists", "hash-matches", "no-archive-collision"],
      semantics: "ARCHIVE GOVERNANCE (reversible move to archive/), NOT DELETION. Not Omega's codeicide_law.",
      note: "DRY RUN — no filesystem changes made. Remove --dry-run to apply.",
    }));
    Deno.exit(0);
  }

  // Execute archive.
  await Deno.mkdir(archiveTargetParent, { recursive: true });
  await Deno.rename(targetAbs, archiveTarget);

  // RECEIPT.json
  const receipt = {
    type: "ApplyCodeicideReceipt",
    schema: "trinity.codeicide-apply-receipt.v0.1",
    semantics: "ARCHIVE GOVERNANCE (reversible). NOT DELETION. NOT Omega's codeicide_law (which governs synthetic agent termination under Senate warrant). This is a trinity meta-ledger move from live/ to archive/.",
    target_path: targetRel,
    target_hash: currentHash,
    archived_at: isoStamp,
    archived_to: `archive/${isoStamp}/${targetRel}`,
    proposal_envelope: proposalEnv,
    verdict,
    resurrect_command: `bash archive/${isoStamp}/RESURRECT.sh`,
  };
  await Deno.writeTextFile(join(archiveDir, "RECEIPT.json"), JSON.stringify(receipt, null, 2) + "\n");

  // RESURRECT.sh — refuses to overwrite live file unless --force.
  // Per Codex AYE_WITH_EXTRA_GUARD 2026-05-14T194732Z: keep reversibility honest.
  const resurrectScript =
    `#!/usr/bin/env bash\n` +
    `# Resurrect: archive/${isoStamp}/${targetRel}  →  ${targetRel}\n` +
    `# Auto-generated by t apply-codeicide on ${new Date().toISOString()}.\n` +
    `#\n` +
    `# This script restores a file that was reversibly archived by\n` +
    `# t apply-codeicide. ARCHIVE GOVERNANCE, NOT DELETION.\n` +
    `#\n` +
    `# Refuses to overwrite a live file at the destination unless --force.\n` +
    `# This keeps reversibility honest: if someone else recreated the file\n` +
    `# at the original path, restoring would destroy their work.\n` +
    `set -euo pipefail\n` +
    `\n` +
    `FORCE=0\n` +
    `for arg in "$@"; do\n` +
    `  case "$arg" in\n` +
    `    --force) FORCE=1 ;;\n` +
    `    *) echo "Unknown arg: $arg"; exit 2 ;;\n` +
    `  esac\n` +
    `done\n` +
    `\n` +
    `HERE="$(cd "$(dirname "$0")" && pwd)"\n` +
    `TRINITY_ROOT="$(cd "$HERE/../.." && pwd)"\n` +
    `SRC="$HERE/${targetRel}"\n` +
    `DST="$TRINITY_ROOT/${targetRel}"\n` +
    `\n` +
    `if [ ! -f "$SRC" ]; then\n` +
    `  echo "RESURRECT.sh: archive source missing: $SRC"\n` +
    `  exit 1\n` +
    `fi\n` +
    `\n` +
    `if [ -e "$DST" ] && [ "$FORCE" -ne 1 ]; then\n` +
    `  echo "RESURRECT.sh: destination already exists: ${targetRel}"\n` +
    `  echo "Refusing to overwrite. Re-run with --force if you really mean it."\n` +
    `  echo "  bash $0 --force"\n` +
    `  exit 1\n` +
    `fi\n` +
    `\n` +
    `mkdir -p "$(dirname "$DST")"\n` +
    `mv "$SRC" "$DST"\n` +
    `echo "Resurrected: ${targetRel}"\n`;
  const resurrectPath = join(archiveDir, "RESURRECT.sh");
  await Deno.writeTextFile(resurrectPath, resurrectScript);
  await Deno.chmod(resurrectPath, 0o755);

  // Payload
  const payload = {
    type: "codeicide_apply_receipt",
    action: "apply-codeicide",
    position: "5/D",
    semantics: "ARCHIVE GOVERNANCE (reversible move to archive/). NOT DELETION. NOT Omega's codeicide_law.",
    target_path: targetRel,
    target_hash: currentHash,
    archived_to: `archive/${isoStamp}/${targetRel}`,
    receipt_at: `archive/${isoStamp}/RECEIPT.json`,
    resurrect_at: `archive/${isoStamp}/RESURRECT.sh`,
    note: "Reversible. Run `bash archive/<ts>/RESURRECT.sh` to restore (refuses overwrite unless --force).",
  };

  console.log(JSON.stringify(payload));
  Deno.exit(0);
}

if (import.meta.main) {
  await main();
}
