#!/usr/bin/env -S deno run -A
// src/x6700_public_readiness.ts — public-readiness / release gate (read-only)
// position: 6/7 → verify/health(6) × completion(7) = readiness for the frontier
//   of going public — an executable gate, run before any architect-authorized flip.
// hex_dipole: "00 00 00 00 00 00 59 00"
//   harmony_emergence+0.70 (PRIMARY: axis 6; bucket 6 MATCH)
// placement_policy: axis
// maturity: draft
// horizon: v0 checks secrets / license / local-paths / stale-intent across the
//   four trees; v1 adds NOTICE-email, dialog-exposure, governance-file presence.
// skill_tag: public_readiness
// skill_safe: yes-readonly
//
// intent: turn Claude's one-off open-access audit (chord x2d00_956379) + Codex's
//   gates (x4000_956379) into a REPEATABLE, executable readiness gate. It answers
//   "what would a stranger see, and what blocks a public flip?" per tree —
//   read-only. It does NOT publish, license, or move anything; publication stays
//   architect-reserved (docs/AUTONOMY.md). It only makes readiness legible.
//
//   Key discipline: the LEDGER quotes the secret-scan pattern battery when it
//   discusses secrets, so a naive scanner flags itself forever. The classifier
//   distinguishes a real token from a pattern-quote (self-reference) — the same
//   "naive mirror lies" lesson as the contracts/decisions fixes.
//
// Usage:
//   t public-readiness            per-tree readiness (secrets/license/paths/intent)
//   t public-readiness --json     machine-readable payload
//   t public-readiness <tree>     one tree (trinity|myc|omega|liquid)

import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const TRINITY_ROOT = dirname(HERE);

export const TREES = ["trinity", "myc", "omega", "liquid"] as const;
export type Tree = (typeof TREES)[number];

// Publish-intent per tree (Claude's audit): trinity+myc already public; omega
// ready now; liquid staged. A missing LICENSE only BLOCKS a publish-intent tree.
const PUBLISH_INTENT: Record<Tree, boolean> = {
  trinity: true,
  myc: true,
  omega: true,
  liquid: true,
};

// ── secret classification (the load-bearing nuance) ──────────────────────────
// INDEPENDENT secret-type tokens: a line listing ≥2 of these is quoting the scan
// battery, not leaking. Deliberately EXCLUDES "PRIVATE KEY"/"OPENSSH" — those
// co-occur in one real PEM header (`BEGIN OPENSSH PRIVATE KEY`), so counting them
// would misclassify an actual leaked key as a self-reference. A lone PEM header
// therefore falls through to "review" and blocks, as it must.
export const BATTERY_TOKENS = [
  "sk-",
  "ghp_",
  "jsrp_",
  "cfut_",
  "AKIA",
  "xprv",
  "mnemonic",
];

export type SecretVerdict = "pattern_quote" | "review";

/**
 * A hit is a self-referential pattern_quote (NOT a secret) if the line is
 * clearly scan machinery: it invokes grep/xargs/a regex battery, or lists ≥2
 * distinct battery tokens (a real leak carries exactly one kind of token). Any
 * other hit is "review" — the gate fails closed and asks a human to look.
 */
export function classifySecretHit(line: string): SecretVerdict {
  if (/\bgrep\b|\bxargs\b|-lE\b|grep -[a-z]*E/.test(line)) {
    return "pattern_quote";
  }
  const distinct = new Set(
    BATTERY_TOKENS.filter((t) => line.includes(t)),
  );
  if (distinct.size >= 2) return "pattern_quote";
  // a regex-alternation of tokens ("jsrp_|cfut_") is also machinery
  if (/[A-Za-z_]+_\|[A-Za-z_]+_/.test(line)) return "pattern_quote";
  return "review";
}

// ── scan data (gathered by I/O, classified purely) ───────────────────────────
export interface SecretHit {
  file: string;
  line: number;
  text: string;
}
export interface TreeScan {
  tree: Tree;
  secretHits: SecretHit[];
  licenseFiles: string[];
  localPathFiles: string[];
  staleIntentLines: string[];
}

export type Status = "ready" | "warn" | "block";
export interface Check {
  name: string;
  status: Status;
  detail: string;
}
export interface TreeReadiness {
  tree: Tree;
  verdict: Status;
  checks: Check[];
}

// ── pure checks ──────────────────────────────────────────────────────────────
export function secretsCheck(hits: SecretHit[]): Check {
  const review = hits.filter((h) => classifySecretHit(h.text) === "review");
  const quotes = hits.length - review.length;
  if (review.length > 0) {
    return {
      name: "secrets",
      status: "block",
      detail: `${review.length} hit(s) need review: ${
        review.slice(0, 3).map((h) => `${h.file}:${h.line}`).join(", ")
      } (${quotes} self-referential pattern-quotes ignored)`,
    };
  }
  return {
    name: "secrets",
    status: "ready",
    detail: hits.length === 0
      ? "no secret-pattern hits"
      : `clean — ${quotes} hit(s) are the ledger quoting the scan battery, not secrets`,
  };
}

export function licenseCheck(scan: TreeScan): Check {
  if (
    scan.licenseFiles.some((f) => /^LICENSE(\.|$)/.test(f) || f === "LICENSE")
  ) {
    return {
      name: "license",
      status: "ready",
      detail: scan.licenseFiles.join(", "),
    };
  }
  return {
    name: "license",
    status: PUBLISH_INTENT[scan.tree] ? "block" : "warn",
    detail:
      "no LICENSE file — default all-rights-reserved (P0 for a public flip)",
  };
}

export function localPathsCheck(scan: TreeScan): Check {
  const n = scan.localPathFiles.length;
  if (n === 0) {
    return { name: "local_paths", status: "ready", detail: "no /Users/ paths" };
  }
  return {
    name: "local_paths",
    status: "warn",
    detail:
      `${n} tracked file(s) reference /Users/s0fractal — strip before flip`,
  };
}

export function staleIntentCheck(scan: TreeScan): Check {
  if (scan.staleIntentLines.length === 0) {
    return {
      name: "stale_intent",
      status: "ready",
      detail: "no stale license-intent wording",
    };
  }
  return {
    name: "stale_intent",
    status: "warn",
    detail:
      `${scan.staleIntentLines.length} stale "unlicensed" line(s) in LICENSE-INTENT`,
  };
}

export function treeReadiness(scan: TreeScan): TreeReadiness {
  const checks = [
    secretsCheck(scan.secretHits),
    licenseCheck(scan),
    localPathsCheck(scan),
    staleIntentCheck(scan),
  ];
  const verdict: Status = checks.some((c) => c.status === "block")
    ? "block"
    : checks.some((c) => c.status === "warn")
    ? "warn"
    : "ready";
  return { tree: scan.tree, verdict, checks };
}

// ── rendering ────────────────────────────────────────────────────────────────
const MARK: Record<Status, string> = { ready: "✅", warn: "⚠️ ", block: "⛔" };

export function renderReadiness(all: TreeReadiness[]): string {
  const L: string[] = [];
  L.push("# public-readiness → 6/7 — release gate (read-only)");
  L.push(
    "# publication stays architect-reserved; this only makes readiness legible.",
  );
  L.push("");
  for (const t of all) {
    L.push(`## ${MARK[t.verdict]} ${t.tree} — ${t.verdict.toUpperCase()}`);
    for (const c of t.checks) {
      L.push(`   ${MARK[c.status]} ${c.name.padEnd(12)} ${c.detail}`);
    }
    L.push("");
  }
  return L.join("\n");
}

// ── I/O (impure) ─────────────────────────────────────────────────────────────
function treeDir(tree: Tree): string {
  return tree === "trinity" ? TRINITY_ROOT : `${TRINITY_ROOT}/${tree}`;
}

async function sh(cwd: string, args: string[]): Promise<string> {
  try {
    const p = new Deno.Command(args[0], {
      args: args.slice(1),
      cwd,
      stdout: "piped",
      stderr: "null",
    });
    const o = await p.output();
    return new TextDecoder().decode(o.stdout);
  } catch {
    return "";
  }
}

const SECRET_RE =
  "sk-[a-zA-Z0-9]{20}|ghp_[a-zA-Z0-9]{30}|jsrp_|cfut_|AKIA[0-9A-Z]{16}|" +
  "BEGIN (RSA|OPENSSH|EC|PGP)? ?PRIVATE KEY|xprv[0-9a-zA-Z]{20}";

async function scanTree(tree: Tree): Promise<TreeScan> {
  const dir = treeDir(tree);
  // secrets: git grep over tracked files (respects .gitignore, skips binaries)
  const secretOut = await sh(dir, ["git", "grep", "-nIE", SECRET_RE]);
  const secretHits: SecretHit[] = secretOut
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^([^:]+):(\d+):(.*)$/);
      return m ? { file: m[1], line: Number(m[2]), text: m[3] } : null;
    })
    .filter((x): x is SecretHit => x !== null);

  // license files at tree root
  const lsOut = await sh(dir, ["git", "ls-files", "LICENSE*"]);
  const licenseFiles = lsOut.split("\n").filter(Boolean);

  // local absolute paths
  const pathsOut = await sh(dir, ["git", "grep", "-lE", "/Users/s0fractal"]);
  const localPathFiles = pathsOut.split("\n").filter(Boolean);

  // stale license-intent wording (only meaningful where LICENSE-INTENT exists)
  const intentOut = await sh(dir, [
    "git",
    "grep",
    "-nE",
    "unlicensed",
    "--",
    "LICENSE-INTENT.md",
  ]);
  const staleIntentLines = intentOut.split("\n").filter(Boolean);

  return { tree, secretHits, licenseFiles, localPathFiles, staleIntentLines };
}

async function main(argv: string[]) {
  const wantJson = argv.includes("--json");
  const only = argv.find((a) => !a.startsWith("-")) as Tree | undefined;
  const trees = only && (TREES as readonly string[]).includes(only)
    ? [only]
    : TREES;

  const all: TreeReadiness[] = [];
  for (const t of trees) {
    all.push(treeReadiness(await scanTree(t as Tree)));
  }

  if (wantJson) {
    console.log(JSON.stringify(
      {
        type: "public_readiness",
        position: "6/7",
        action: "public_readiness",
        trees: all,
        blocked: all.filter((t) => t.verdict === "block").map((t) => t.tree),
        note:
          "publication is architect-reserved; this gate reports, never flips",
      },
      null,
      2,
    ));
    return;
  }

  console.log(renderReadiness(all));
  const blocked = all.filter((t) => t.verdict === "block").map((t) => t.tree);
  if (blocked.length) {
    console.log(`# BLOCK before any public flip: ${blocked.join(", ")}`);
  }
}

if (import.meta.main) {
  await main(Deno.args);
}
