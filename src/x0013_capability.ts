// src/x0013_capability.ts — organ capability classifier (codex Phase E core)
// position: 0/13 → foundation(0) × byte13 = shared behavior-analysis helper
// maturity: active
//
// Library helper (no main entry point): foundational analysis infrastructure,
// not a dispatchable organ — so it is exempt from the coordinate gravity law
// and may be imported by any bucket (x8C00 skill-gen for the registry, x0100
// dispatch for `t eval --safe`). Pure: AST-parses an organ's source and reports
// the most-privileged capability it can exercise. The single source of truth
// for "what can this organ do" — consumers must import it, never re-derive it.

import ts from "npm:typescript";

export interface BehaviorAnalysis {
  mutations: string[];
  subprocesses: string[];
  fetches: string[];
}

export type Capability =
  | "readonly"
  | "network"
  | "subprocess"
  | "git"
  | "writes"
  | "unknown";

/** Classify an organ's most-privileged capability from its AST analysis (and
 *  source, to spot a `git` subprocess). Ordered most→least privileged so the
 *  reported capability is the strongest the organ can exercise. Pure. */
export function classifyCapability(
  analysis: BehaviorAnalysis,
  content?: string,
): Capability {
  if (analysis.mutations.length > 0) return "writes";
  if (analysis.subprocesses.length > 0) {
    const runsGit = content !== undefined &&
      /(?:Command|run)\(\s*["'`]git["'`]|args:\s*\[\s*["'`]git["'`]/.test(
        content,
      );
    return runsGit ? "git" : "subprocess";
  }
  if (analysis.fetches.length > 0) return "network";
  return "readonly";
}

/** Codex Phase E rule: only an UNKNOWN capability is categorically inadmissible
 *  for autonomous mutation (it can't be reasoned about). Finer policy — e.g. an
 *  autonomous evaluator restricting to readonly — layers on top via the eval
 *  budget's allow-list. Pure. */
export function admissibleForAutonomousMutation(cap: Capability): boolean {
  return cap !== "unknown";
}

/** Parse organ source with typescript AST and extract relevant API usages. */
export function analyzeBehaviorWithAST(
  content: string,
  filename: string,
): BehaviorAnalysis {
  const sourceFile = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
  );

  const mutations: string[] = [];
  const subprocesses: string[] = [];
  const fetches: string[] = [];

  const mutatingAPIs = new Set([
    "writeTextFile",
    "writeTextFileSync",
    "writeFile",
    "writeFileSync",
    "remove",
    "removeSync",
    "mkdir",
    "mkdirSync",
    "rename",
    "renameSync",
    "copyFile",
    "copyFileSync",
    "truncate",
    "truncateSync",
    "create",
    "createSync",
    "chmod",
    "chmodSync",
    "chown",
    "chownSync",
    "makeTempDir",
    "makeTempDirSync",
    "makeTempFile",
    "makeTempFileSync",
    "symlink",
    "symlinkSync",
  ]);

  const subprocessAPIs = new Set(["Command", "run"]);

  function isReference(node: ts.Identifier): boolean {
    const parent = node.parent;
    if (!parent) return true;
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
      return false;
    }
    if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
    if (ts.isMethodDeclaration(parent) && parent.name === node) return false;
    if (ts.isMethodSignature(parent) && parent.name === node) return false;
    if (ts.isPropertyDeclaration(parent) && parent.name === node) return false;
    if (ts.isPropertySignature(parent) && parent.name === node) return false;
    if (ts.isFunctionDeclaration(parent) && parent.name === node) return false;
    if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
    if (
      ts.isImportSpecifier(parent) &&
      (parent.name === node || parent.propertyName === node)
    ) return false;
    return true;
  }

  function walk(node: ts.Node) {
    if (ts.isPropertyAccessExpression(node)) {
      const obj = node.expression;
      const prop = node.name;
      if (ts.isIdentifier(obj) && obj.text === "Deno") {
        const propName = prop.text;
        if (mutatingAPIs.has(propName)) {
          mutations.push(`Deno.${propName}`);
        }
        if (subprocessAPIs.has(propName)) {
          subprocesses.push(`Deno.${propName}`);
        }
      }
    } else if (ts.isIdentifier(node)) {
      if (node.text === "fetch" && isReference(node)) {
        fetches.push("fetch");
      }
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  return {
    mutations: [...new Set(mutations)],
    subprocesses: [...new Set(subprocesses)],
    fetches: [...new Set(fetches)],
  };
}
