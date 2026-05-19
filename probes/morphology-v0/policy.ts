// policy.ts — import-policy checker
//
// Per Codex `x3500_950009_codex_substrate-morphology-language-layer.md`,
// section "Import control": coordinates can become capability boundaries.
//
// Probe v0 vocabulary (NOT authoritative — to be refined via cowitness):
//
//   - 0 void/primitives:    can be imported by ANY; may import 0, 4
//                           (foundation utilities like canonical hash are
//                           legitimate primitive dependencies — refined
//                           2026-05-19 after real-trinity scan)
//   - 1 singularity:        can import 0, 1, 4
//   - 2 mirror:             can import 0, 1, 2, 4, 5, 6
//   - 3 triangle:           can import 0, 1, 3, 4, 5
//   - 4 foundation/law:     can import 0, 1, 4; MUST NOT import 5, 8, C
//   - 5 action:             can import 0, 4, 5, 6, 7; MUST NOT import C
//   - 6 audit:              can import 0, 4, 5, 6, 7; MUST NOT import C
//   - 7 completion/seal:    can import 0, 4, 7; SHOULD NOT import 5, 6 directly
//   - 8 cache/generated:    can READ from anywhere, MUST NOT be imported by stable 0-7
//   - 9 penultimate:        can import 0, 1, 9
//   - A apex/Я:             special — can import anywhere (substrate's "subjective" pole)
//   - B build:              can import 0-7
//   - C chaos/scratch:      MUST NOT be imported by any production organ; isolates to 0, C
//   - D decision:           can import 0, 4, 5, 6, D
//   - E edge:               can import 0, 4, 5, 6, E
//   - F frontier:           can import 0, 4, 7, F

export type PolicyResult = "allow" | "warn" | "deny";

interface PolicyDecision {
  source: string;
  target: string;
  result: PolicyResult;
  rationale: string;
}

// archetype → set of allowed target archetypes
// Refined 2026-05-19 based on real trinity scan (Codex review): primitives
// (x0) MAY depend on foundation utilities (x4) — hash, canonical schemas,
// etc. — but NOT on action/audit/cache/chaos. Foundation builds on
// primitives, primitives may use foundation utilities. Symmetric on the
// "infrastructure" pole, asymmetric on the "operational" pole.
const ALLOWED: Record<string, Set<string>> = {
  "0": new Set(["0", "4"]),
  "1": new Set(["0", "1", "4"]),
  "2": new Set(["0", "1", "2", "4", "5", "6"]),
  "3": new Set(["0", "1", "3", "4", "5"]),
  "4": new Set(["0", "1", "4"]),
  "5": new Set(["0", "4", "5", "6", "7"]),
  "6": new Set(["0", "4", "5", "6", "7"]),
  "7": new Set(["0", "4", "7"]),
  "8": new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"]),
  "9": new Set(["0", "1", "9"]),
  "A": new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"]),
  "B": new Set(["0", "1", "2", "3", "4", "5", "6", "7", "B"]),
  "C": new Set(["0", "C"]),
  "D": new Set(["0", "4", "5", "6", "D"]),
  "E": new Set(["0", "4", "5", "6", "E"]),
  "F": new Set(["0", "4", "7", "F"]),
};

// Hard rules that override the allow table:
//   - 4 (foundation) MUST NOT import 5, 8, C — laws don't depend on actions/cache/chaos
//   - 7 (sealed) MUST NOT depend on 5, 6 — seals are stable
//   - C (chaos) MUST NOT be imported by 0..7 production archetypes
//   - 8 (cache) MUST NOT be imported by 0..7 (cache is downstream, not dependency)
const HARD_DENY: Array<[string, string, string]> = [
  ["4", "5", "foundation cannot depend on action"],
  ["4", "8", "foundation cannot depend on cache"],
  ["4", "C", "foundation cannot depend on chaos"],
  ["7", "5", "sealed cannot depend on action"],
  ["7", "6", "sealed cannot depend on audit"],
  ["7", "8", "sealed cannot depend on cache"],
  ["7", "C", "sealed cannot depend on chaos"],
  ["0", "C", "primitive cannot depend on chaos"],
  ["0", "8", "primitive cannot depend on cache"],
  ["1", "C", "singularity cannot depend on chaos"],
  ["1", "8", "singularity cannot depend on cache"],
];

// Warn rules: not deny, but flag
const WARN: Array<[string, string, string]> = [
  ["5", "8", "action reading cache is OK once but a pattern indicates state-leak"],
  ["6", "8", "audit reading cache should be receipt-style, not dependency"],
];

function canon(arch: string): string {
  return arch.toUpperCase();
}

export function canImport(sourceArchetype: string, targetArchetype: string): PolicyDecision {
  const s = canon(sourceArchetype);
  const t = canon(targetArchetype);

  // Self-import always allowed (same bucket)
  if (s === t) {
    return { source: s, target: t, result: "allow", rationale: "same-archetype import" };
  }

  // Hard denials
  for (const [src, tgt, reason] of HARD_DENY) {
    if (s === src && t === tgt) {
      return { source: s, target: t, result: "deny", rationale: reason };
    }
  }

  // Warnings
  for (const [src, tgt, reason] of WARN) {
    if (s === src && t === tgt) {
      return { source: s, target: t, result: "warn", rationale: reason };
    }
  }

  // Allow table
  const allowed = ALLOWED[s];
  if (allowed && allowed.has(t)) {
    return { source: s, target: t, result: "allow", rationale: `allow-table: ${s} can import ${t}` };
  }

  return {
    source: s,
    target: t,
    result: "deny",
    rationale: `default deny: archetype ${s} has no rule permitting import of ${t}`,
  };
}
