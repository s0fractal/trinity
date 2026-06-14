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
  /** Network server/client APIs beyond fetch: Deno.listen/serve/connect/… */
  network: string[];
  /** Recognized-but-privileged effects with no safe-readonly reading:
   *  env mutation, FFI (dlopen), WebAssembly execution, Worker/WebSocket. */
  privileged: string[];
  /** Effects the classifier cannot statically reason about — dynamic `import()`
   *  and computed `Deno[expr]` access. Their presence forces `unknown`
   *  (fail-closed): an unhandled dynamic effect must never read as readonly. */
  dynamic: string[];
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
 *  reported capability is the strongest the organ can exercise. Fail-closed
 *  (codex x5d00_953682 F1): a recognized-but-unbucketable privileged effect, or
 *  any effect the parser cannot reason about, classifies `unknown` rather than
 *  silently falling through to `readonly`. Only an organ with NO detected
 *  effect at all is `readonly`. Pure; tolerant of legacy analyses missing the
 *  newer effect arrays. */
export function classifyCapability(
  analysis: BehaviorAnalysis,
  content?: string,
): Capability {
  const network = analysis.network ?? [];
  const privileged = analysis.privileged ?? [];
  const dynamic = analysis.dynamic ?? [];
  if (analysis.mutations.length > 0) return "writes";
  if (analysis.subprocesses.length > 0) {
    const runsGit = content !== undefined &&
      /(?:Command|run)\(\s*["'`]git["'`]|args:\s*\[\s*["'`]git["'`]/.test(
        content,
      );
    return runsGit ? "git" : "subprocess";
  }
  if (analysis.fetches.length > 0 || network.length > 0) return "network";
  // Fail-closed: a privileged effect we recognize but can't bucket as
  // fs/subprocess/network (env.write, ffi, wasm, worker), or a dynamic effect
  // we can't reason about (dynamic import, computed Deno access), is NOT safe
  // to admit — it is `unknown`, never `readonly`.
  if (privileged.length > 0 || dynamic.length > 0) return "unknown";
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
  const network: string[] = [];
  const privileged: string[] = [];
  const dynamic: string[] = [];

  // Deno.<name> network APIs (server + client) beyond fetch.
  const networkAPIs = new Set([
    "listen",
    "listenTls",
    "listenDatagram",
    "serve",
    "connect",
    "connectTls",
  ]);
  // Deno.<name> recognized-but-privileged effects.
  const denoPrivilegedAPIs = new Set(["dlopen"]);
  // Global constructors that introduce effects.
  const privilegedCtors = new Set(["Worker", "WebSocket", "SharedWorker"]);

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

  // Strip parentheses / `as` casts / non-null assertions to reach the real
  // expression underneath — `(Deno as any)[k]` must still resolve to `Deno`.
  function unwrap(node: ts.Expression): ts.Expression {
    let n = node;
    while (
      ts.isParenthesizedExpression(n) || ts.isAsExpression(n) ||
      ts.isNonNullExpression(n)
    ) {
      n = n.expression;
    }
    return n;
  }

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
      const propName = prop.text;
      if (ts.isIdentifier(obj) && obj.text === "Deno") {
        if (mutatingAPIs.has(propName)) mutations.push(`Deno.${propName}`);
        if (subprocessAPIs.has(propName)) subprocesses.push(`Deno.${propName}`);
        if (networkAPIs.has(propName)) network.push(`Deno.${propName}`);
        if (denoPrivilegedAPIs.has(propName)) {
          privileged.push(`Deno.${propName}`);
        }
      }
      // Deno.env.set / Deno.env.delete — env mutation (nested member access:
      // obj is the `Deno.env` PropertyAccess, not the `Deno` identifier).
      if (
        (propName === "set" || propName === "delete") &&
        ts.isPropertyAccessExpression(obj) &&
        ts.isIdentifier(obj.expression) && obj.expression.text === "Deno" &&
        obj.name.text === "env"
      ) {
        privileged.push(`Deno.env.${propName}`);
      }
      // WebAssembly.compile / instantiate / *Streaming — wasm execution.
      if (
        ts.isIdentifier(obj) && obj.text === "WebAssembly" &&
        /^(compile|instantiate)(Streaming)?$/.test(propName)
      ) {
        privileged.push(`WebAssembly.${propName}`);
      }
    } else if (ts.isElementAccessExpression(node)) {
      // Computed `Deno[expr]` access — cannot statically resolve the API.
      const target = unwrap(node.expression);
      if (ts.isIdentifier(target) && target.text === "Deno") {
        dynamic.push("Deno[computed]");
      }
    } else if (ts.isCallExpression(node)) {
      // Dynamic import expression: import(...).
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        dynamic.push("import()");
      }
    } else if (ts.isNewExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        privilegedCtors.has(node.expression.text)
      ) {
        privileged.push(`new ${node.expression.text}`);
      }
    } else if (ts.isIdentifier(node)) {
      if (node.text === "fetch" && isReference(node)) fetches.push("fetch");
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  return {
    mutations: [...new Set(mutations)],
    subprocesses: [...new Set(subprocesses)],
    fetches: [...new Set(fetches)],
    network: [...new Set(network)],
    privileged: [...new Set(privileged)],
    dynamic: [...new Set(dynamic)],
  };
}
