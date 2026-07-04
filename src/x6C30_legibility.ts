#!/usr/bin/env -S deno run -A
// src/x6C30_legibility.ts — the first-screen legibility contract (codex x4d00_956665)
// position: 6/C3 → audit-pole (bucket 6): a lexical guard that each federation
//   repo's README opens with the four facts a cold human+LLM reader needs BEFORE any
//   mythic vocabulary — so a living/generated README cannot silently re-mislead.
// maturity: draft
// skill_safe: yes-readonly
// hex_dipole: "00 00 00 00 00 00 59 00"
//   audit_pole+0.70 (PRIMARY: axis 6, matches bucket 6)
// placement_policy: axis
// skill_tag: legibility
//
// intent: "first screen is infrastructure — the ABI between the repo and a cold
//   reader" (codex). The first ~1500 chars of each root README must name (1) the
//   product role, (2) the trust primitive, (3) an authority boundary, (4) one
//   verify command — and must NOT lead with mysticism or claim things the tree
//   contradicts. Lexical, no LLM needed to catch the current failures.
//
// Usage:  t legibility [--json]

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const FIRST_SCREEN = 1500;

// A repo README's first screen must contain one of each marker family.
const PRODUCT =
  /provenance|verifiab|receipt|deterministic|publication|coordination|latent.?intent|physics.?substrate|substrate of (?:a )?(?:four|the federation)|content-addressed/i;
const NOT_CLAUSE = /\bis not\b|\bnot a\b|\bisn'?t\b|what this is not/i;
const VERIFY =
  /\bverify\b|shasum|deno (?:run|test|task)|cargo test|\bt (?:court|seal-commit|check|myc)\b|trust the hash/i;
const AUTHORITY =
  /ed25519|quorum|signature|content-?address|\bhash\b|\banchor|no authority|3-of-5|m-of-n|integer-exact/i;
// Claims the tree contradicts, or myth presented as fact.
const CONTRADICTED = [
  /codebase no longer exists/i,
  /achieved sovereignty/i,
];
// Heavy mythic terms that must NOT appear before the plain product sentence.
const MYSTIC =
  /consciousness|\bsovereignty\b|autopoietic|Φ protocol|phi protocol|no human chooses|the mesh chooses|achieved sovereignty|living repository/i;
// Internal ritual syntax or underselling that must NOT precede the product marker
// (codex x3300_956673: the guard must enforce ORDER, not just presence — a README
// that opens with `chord:` frontmatter or "local draft space" teaches the wrong
// ontology before the product sentence, even if the markers appear later).
const RITUAL =
  /^---\s*\n\s*(?:chord|energy|mode|tension):|local draft space|a local (?:draft|scratch) space/im;

// P1b (codex x3300_956673): solo-verify must be REAL, not lexical. Each repo declares
// its self-contained verify command; the guard asserts the README references it AND
// its target task/file actually exists — so a README can't pass with a dead verify path.
function fileExists(p: string): boolean {
  try {
    Deno.statSync(p);
    return true;
  } catch {
    return false;
  }
}
function taskExists(dir: string, task: string): boolean {
  try {
    return new RegExp(`"${task}"\\s*:`).test(
      Deno.readTextFileSync(join(dir, "deno.jsonc")),
    );
  } catch {
    return false;
  }
}
const VERIFY_SPEC: Record<
  string,
  { ref: RegExp; target: (root: string) => boolean }
> = {
  trinity: {
    ref: /\bt court\b/i,
    target: (r) => fileExists(join(r, "src", "x6E00_court.ts")),
  },
  myc: {
    ref: /deno task myc verify/i,
    target: (r) => taskExists(join(r, "myc"), "myc"),
  },
  omega: {
    ref: /genesis_print/i,
    target: (r) => fileExists(join(r, "omega", "omega_v2", "Cargo.toml")),
  },
  liquid: {
    ref: /deno task test:unit/i,
    target: (r) => taskExists(join(r, "liquid"), "test:unit"),
  },
};

export interface LegibilityVerdict {
  repo: string;
  present: boolean;
  ok: boolean;
  markers: {
    product: boolean;
    not_clause: boolean;
    verify: boolean;
    authority: boolean;
  };
  contradictions: string[];
  mysticism_before_product: string | null;
  verify_command_real: boolean;
}

/** Does this README's first screen satisfy the contract? Pure over `readme`; if
 *  `root` is given, additionally verifies the repo's solo-verify command is real. */
export function checkLegibility(
  repo: string,
  readme: string,
  root?: string,
): LegibilityVerdict {
  const head = readme.slice(0, FIRST_SCREEN);
  const markers = {
    product: PRODUCT.test(head),
    not_clause: NOT_CLAUSE.test(head),
    verify: VERIFY.test(head),
    authority: AUTHORITY.test(head),
  };
  const contradictions = CONTRADICTED.filter((r) => r.test(head)).map((r) =>
    r.source
  );
  const pm = head.search(PRODUCT);
  const mm = head.search(MYSTIC);
  const rm = head.search(RITUAL);
  const before = (i: number) => i >= 0 && (pm < 0 || i < pm);
  const mysticBefore = before(mm)
    ? head.slice(mm, mm + 40).replace(/\s+/g, " ")
    : null;
  const ritualBefore = before(rm)
    ? head.slice(rm, rm + 40).replace(/\s+/g, " ")
    : null;
  const spec = root ? VERIFY_SPEC[repo] : undefined;
  const verify_command_real = !spec ||
    (spec.ref.test(head) && spec.target(root!));
  const ok = markers.product && markers.not_clause && markers.verify &&
    markers.authority && contradictions.length === 0 && !mysticBefore &&
    !ritualBefore && verify_command_real;
  return {
    repo,
    present: true,
    ok,
    markers,
    contradictions,
    mysticism_before_product: mysticBefore ?? ritualBefore,
    verify_command_real,
  };
}

const REPOS: { repo: string; path: string }[] = [
  { repo: "trinity", path: join(ROOT, "README.md") },
  { repo: "myc", path: join(ROOT, "myc", "README.md") },
  { repo: "omega", path: join(ROOT, "omega", "README.md") },
  { repo: "liquid", path: join(ROOT, "liquid", "README.md") },
];

export function auditAll(): LegibilityVerdict[] {
  const out: LegibilityVerdict[] = [];
  for (const { repo, path } of REPOS) {
    let text: string | null = null;
    try {
      text = Deno.readTextFileSync(path);
    } catch {
      out.push({
        repo,
        present: false,
        ok: true, // absent (submodule not checked out) → not this job's failure
        markers: {
          product: false,
          not_clause: false,
          verify: false,
          authority: false,
        },
        contradictions: [],
        mysticism_before_product: null,
        verify_command_real: true,
      });
      continue;
    }
    out.push(checkLegibility(repo, text, ROOT));
  }
  return out;
}

if (import.meta.main) {
  const results = auditAll();
  const failing = results.filter((r) => r.present && !r.ok);
  if (Deno.args.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          type: "legibility",
          position: "6/C3",
          results,
          ok: failing.length === 0,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `# legibility @ 6/C3 — first-screen contract (codex x4d00_956665)`,
    );
    for (const r of results) {
      if (!r.present) {
        console.log(
          `  —  ${r.repo}: README absent (submodule not checked out)`,
        );
        continue;
      }
      const m = r.markers;
      const miss = [
        !m.product && "product",
        !m.not_clause && "what-this-is-NOT",
        !m.verify && "verify-cmd",
        !m.authority && "authority",
      ].filter(Boolean).join(", ");
      const extra = [
        ...r.contradictions.map((c) => `contradicts-tree(${c})`),
        r.mysticism_before_product &&
        `myth-first("${r.mysticism_before_product}")`,
        !r.verify_command_real && "dead-verify-command",
      ].filter(Boolean).join(", ");
      console.log(
        `  ${r.ok ? "✅" : "⛔"} ${r.repo}${
          r.ok ? "" : ` — missing: ${miss || "—"}${extra ? "; " + extra : ""}`
        }`,
      );
    }
    console.log(
      `#   ${results.filter((r) => r.present && r.ok).length}/${
        results.filter((r) => r.present).length
      } present READMEs satisfy the contract`,
    );
  }
  if (failing.length > 0) Deno.exit(1);
}
