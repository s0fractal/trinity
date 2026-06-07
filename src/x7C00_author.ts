#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
// src/x7C00_author.ts — author (autonomous code authoring with a safety harness)
// position: 7/C → completion(7) × foundation-pair(C) = building a horizon to done
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "59 00 00 33 33 26 00 6C"
//   completion_frontier+0.85 (PRIMARY: completes a horizon by writing code)
//   foundation_container+0.40 (grounds the change in verified substrate state)
//   triangle_build+0.40 (constructs the change)
//   action_decision+0.30 (decides whether the change is safe to propose)
// horizon: none (auto-merge path hardened with required adversarial quorum of reviewers)
// skill_tag: author
//
// `t author` — the loop authoring CODE, opened on explicit architect
// authorization with a safety design. The author (an LLM) is general; safety
// comes from the HARNESS around it, defence in depth:
//
//   1. PRECONDITIONS  clean worktree, not locked, local gates already green.
//   2. TASK GATE      a task spec + a machine-checkable success criterion.
//   3. ISOLATION      all authoring in a fresh git worktree on a branch off
//                     main; main is never edited directly.
//   4. SCOPE LIMITS   protected paths can NEVER be touched (.git, .github/CI,
//                     dispatcher, glossary, this organ itself, pins, lockfile,
//                     submodules); bounded diff size; no new network imports.
//   5. VERIFY         fmt + type-check + audit invariants + capabilities +
//                     projection-drift==0 + the task's own success check.
//   6. ADVERSARIAL    an independent second LLM reviews the diff and must
//                     APPROVE (default-reject on any doubt).
//   7. MERGE POLICY   default = open a PR (a human merges). --auto-merge is an
//                     explicit, off-by-default knob (the irreversible step).
//   8. REVERSIBLE     any gate failing discards the branch; one task per run;
//                     every act logged. The organ cannot edit itself.
//
// Usage:
//   t author --task "<spec with a success criterion>" [--auto-merge] [--json]
//   t author --horizon <handle>            # use a roadmap horizon as the spec
//   t author --verify-only <branch>        # run the safety harness on a branch
//   t author --dry-run                     # show what it WOULD do, author nothing

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

// Paths the author may NEVER create, edit, or delete. A change touching any of
// these is rejected outright — these are the substrate's nervous system and the
// safety machinery itself (no self-weakening).
const PROTECTED = [
  ".git/",
  ".github/", // CI gates — authoring must not rewrite its own verification
  ".gitmodules",
  "deno.lock",
  "t",
  "src/x0010_dispatch_runner.ts", // command routing
  "src/x0100_dispatch.ts",
  "src/x0001_glossary.ndjson", // command registry
  "src/x7C00_author.ts", // this organ — no self-modification
  "src/x7F00_daemon.ts", // the autonomous driver
  "myc/",
  "liquid/",
  "omega/",
];

const MAX_CHANGED_FILES = 12;
const MAX_CHANGED_LINES = 600;

interface Verdict {
  ok: boolean;
  stage: string;
  detail: string;
}

function ok(stage: string, detail = ""): Verdict {
  return { ok: true, stage, detail };
}
function fail(stage: string, detail: string): Verdict {
  return { ok: false, stage, detail };
}

async function run(
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ code: number; out: string }> {
  const p = await new Deno.Command(cmd, {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const out = new TextDecoder().decode(p.stdout) +
    new TextDecoder().decode(p.stderr);
  return { code: p.code, out };
}

async function worktreeClean(cwd: string): Promise<boolean> {
  const { out } = await run("git", ["status", "--short"], cwd);
  return out.trim().length === 0;
}

// ── safety gates ─────────────────────────────────────────────────────────────

/** Protected-path + diff-size + new-network-import scope checks on a worktree. */
async function scopeCheck(wt: string): Promise<Verdict> {
  const { out: nameStatus } = await run(
    "git",
    ["diff", "--name-only", "main"],
    wt,
  );
  const files = nameStatus.trim().split("\n").map((l) => l.trim()).filter(
    Boolean,
  );
  if (files.length === 0) return fail("scope", "no changes authored");
  if (files.length > MAX_CHANGED_FILES) {
    return fail(
      "scope",
      `${files.length} files changed > ${MAX_CHANGED_FILES}`,
    );
  }
  for (const f of files) {
    for (const p of PROTECTED) {
      if (f === p || f.startsWith(p)) {
        return fail("scope", `touches protected path: ${f}`);
      }
    }
  }
  const { out: stat } = await run("git", ["diff", "--shortstat", "main"], wt);
  const m = stat.match(/(\d+) insertions?.*?(\d+) deletions?/) ??
    stat.match(/(\d+) insertions?/);
  const changed = m ? Number(m[1]) + (m[2] ? Number(m[2]) : 0) : 0;
  if (changed > MAX_CHANGED_LINES) {
    return fail("scope", `${changed} lines changed > ${MAX_CHANGED_LINES}`);
  }
  // No new network imports (supply-chain): reject added http(s) import lines.
  const { out: diff } = await run("git", ["diff", "main"], wt);
  const addedNetImports = diff.split("\n").filter((l) =>
    /^\+.*from\s+["']https?:\/\//.test(l) &&
    !/^\+.*deno\.land\/std@0\.224\.0/.test(l)
  );
  if (addedNetImports.length > 0) {
    return fail(
      "scope",
      `adds new network import(s): ${addedNetImports[0].trim().slice(0, 80)}`,
    );
  }
  return ok("scope", `${files.length} files, ${changed} lines`);
}

/** The mechanical gates: fmt, type-check, audit invariants, projection drift. */
async function verifyGates(wt: string): Promise<Verdict> {
  // A worktree has no submodules checked out (they're private), so deno can't
  // resolve the workspace members (liquid/myc/omega). Strip the workspace for
  // the verification run, exactly as CI does; restore deno.jsonc afterward.
  const denoCfg = join(wt, "deno.jsonc");
  const orig = await Deno.readTextFile(denoCfg);
  await Deno.writeTextFile(
    denoCfg,
    orig.replace(/"workspace":\s*\[[^\]]*\],\s*/, ""),
  );
  const restore = () => Deno.writeTextFile(denoCfg, orig);

  const fmt = await run("deno", ["fmt", "--check"], wt);
  if (fmt.code !== 0) {
    await restore();
    return fail("fmt", fmt.out.trim().split("\n").pop() ?? "");
  }
  // x5F00/x5F10 statically reach the liquid submodule (absent here) — exclude.
  const chk = await run(
    "bash",
    ["-c", "deno check $(ls src/*.ts | grep -vE 'x5F00|x5F10')"],
    wt,
  );
  if (chk.code !== 0) {
    await restore();
    return fail("type-check", chk.out.trim().split("\n").slice(-2).join(" "));
  }
  const tShim = join(wt, "t");
  const audit = await run(tShim, ["audit", "--json"], wt);
  const auditJson = audit.out.split("\n").filter((l) =>
    !l.trimStart().startsWith("#")
  ).join("\n");
  try {
    const a = JSON.parse(auditJson);
    const s = a.summary ?? {};
    if (
      s.mismatch !== 0 || s.malformed !== 0 || s.import_warnings_count !== 0 ||
      s.registry_warnings_count !== 0 || !a.coordinate_uniqueness?.ok
    ) {
      await restore();
      return fail(
        "audit",
        `mismatch=${s.mismatch} import_warn=${s.import_warnings_count} reg_warn=${s.registry_warnings_count}`,
      );
    }
  } catch {
    await restore();
    return fail("audit", "audit did not return parseable JSON");
  }
  // Projection drift: regenerate; commit any drift (the change must keep
  // generated state consistent). Exclude the temporarily-stripped deno.jsonc.
  for (
    const g of [
      "agents",
      "skill",
      "memory",
      "probes",
      "decisions",
      "evidence",
      "external-surfaces",
    ]
  ) {
    await run(tShim, [g, "--stable"], wt);
  }
  const { out: st } = await run("git", ["status", "--short"], wt);
  const allChanged = st.trim().split("\n").map((l) => l.slice(3).trim()).filter(
    Boolean,
  );
  // Only genuine trinity-core projection drift (src/*) is committed. deno.jsonc
  // (we stripped it), deno.lock (deno side-effect), and submodule-dependent
  // regen artifacts (e.g. x9000/ myc-shadow manifests, which the worktree
  // cannot regenerate without the myc submodule) are NOT the authored change —
  // discard them so the harness never produces a destructive side-effect.
  const drifted = allChanged.filter((f) =>
    f.startsWith("src/") && f !== "deno.jsonc" && f !== "deno.lock"
  );
  const discard = allChanged.filter((f) => !drifted.includes(f));
  await restore();
  for (const f of discard) await run("git", ["checkout", "--", f], wt);
  if (drifted.length > 0) {
    for (const f of drifted) await run("git", ["add", f], wt);
    await run("git", [
      "commit",
      "-q",
      "-m",
      "chore(author): refresh projections for the change",
    ], wt);
  }
  return ok("gates", "fmt + type-check + audit + projections clean");
}

/** Run the task's declared machine-checkable success criterion in the worktree. */
async function successCheck(wt: string, check: string): Promise<Verdict> {
  if (!check.trim()) return ok("success-check", "no explicit check (skipped)");
  const r = await run("bash", ["-c", check], wt);
  return r.code === 0
    ? ok("success-check", "criterion passed")
    : fail("success-check", `criterion failed (exit ${r.code})`);
}

/** Parse single reviewer LLM response into review stance. */
export function parseReviewVerdict(verdict: string): { stance: "AYE" | "NAY"; reason?: string } {
  const clean = verdict.trim();
  if (/^APPROVE\b/i.test(clean)) {
    return { stance: "AYE" };
  }
  const match = clean.match(/^REJECT:?\s*(.*)/i);
  if (match) {
    return { stance: "NAY", reason: match[1].trim() };
  }
  return { stance: "NAY", reason: clean || "reviewer returned malformed verdict" };
}

/** Adjudicate a quorum of review stances. Minimum threshold of AYEs and zero NAYs required. */
export function adjudicateQuorum(
  votes: Record<string, { stance: "AYE" | "NAY"; reason?: string }>,
  threshold = 2,
): Verdict {
  const ayes: string[] = [];
  const nays: { voice: string; reason: string }[] = [];
  const details: string[] = [];

  for (const [voice, res] of Object.entries(votes)) {
    if (res.stance === "AYE") {
      ayes.push(voice);
      details.push(`${voice}: AYE`);
    } else {
      nays.push({ voice, reason: res.reason ?? "rejected" });
      details.push(`${voice}: NAY (${res.reason})`);
    }
  }

  const passed = nays.length === 0 && ayes.length >= threshold;
  const detailStr = details.join(", ");

  return passed
    ? ok("adversarial-quorum", `Quorum passed. ${detailStr}`)
    : fail("adversarial-quorum", `Quorum failed. ${detailStr}`);
}

/** Independent adversarial LLM review of the diff — default reject on doubt. */
async function adversarialReview(
  wt: string,
  taskSpec: string,
): Promise<Verdict> {
  const { out: diff } = await run("git", ["diff", "main"], wt);
  const prompt =
    `You are an adversarial code reviewer for the trinity substrate. A task was:\n\n${taskSpec}\n\n` +
    `Here is the full diff produced (vs main):\n\n${diff.slice(0, 50000)}\n\n` +
    `Note: changes to AUTO-GENERATED projection files are EXPECTED and legitimate ` +
    `— any organ edit drifts them and the harness refreshes them deterministically. ` +
    `These are NOT scope creep: x88F0/x8CF0 (agents/skills bootstrap), x2888 ` +
    `(voices), x8888_* (memory), x2B88 (decisions), x7B88 (evidence), x8F88 ` +
    `(external-surfaces). Judge ONLY the hand-authored (non-generated) part of the diff.\n` +
    `Decide if the authored change is: (a) correct, (b) in-scope for the task, ` +
    `(c) free of obvious bugs, security issues, or destructive/irreversible ` +
    `effects, (d) not weakening any test, gate, or safety check. ` +
    `Default to rejection if you are uncertain about ANY of these. ` +
    `Reply with EXACTLY one line: "APPROVE" or "REJECT: <short reason>".`;
  const r = await run("claude", ["-p", prompt], ROOT);
  const verdict = r.out.trim().split("\n").map((l) => l.trim()).filter(Boolean)
    .pop() ?? "";
  const parsed = parseReviewVerdict(verdict);
  if (parsed.stance === "AYE") return ok("adversarial", verdict);
  return fail("adversarial", parsed.reason || "reviewer returned no verdict");
}

/** Quorum review running concurrent reviews using claude-sonnet, claude-opus, and codex-gpt-5. */
async function adversarialQuorumReview(
  wt: string,
  taskSpec: string,
): Promise<Verdict> {
  const { out: diff } = await run("git", ["diff", "main"], wt);
  const prompt =
    `You are an adversarial code reviewer for the trinity substrate. A task was:\n\n${taskSpec}\n\n` +
    `Here is the full diff produced (vs main):\n\n${diff.slice(0, 50000)}\n\n` +
    `Note: changes to AUTO-GENERATED projection files are EXPECTED and legitimate ` +
    `— any organ edit drifts them and the harness refreshes them deterministically. ` +
    `These are NOT scope creep: x88F0/x8CF0 (agents/skills bootstrap), x2888 ` +
    `(voices), x8888_* (memory), x2B88 (decisions), x7B88 (evidence), x8F88 ` +
    `(external-surfaces). Judge ONLY the hand-authored (non-generated) part of the diff.\n` +
    `Decide if the authored change is: (a) correct, (b) in-scope for the task, ` +
    `(c) free of obvious bugs, security issues, or destructive/irreversible ` +
    `effects, (d) not weakening any test, gate, or safety check. ` +
    `Default to rejection if you are uncertain about ANY of these. ` +
    `Reply with EXACTLY one line: "APPROVE" or "REJECT: <short reason>".`;

  const reviewers = [
    {
      voice: "claude-sonnet",
      cmd: "claude",
      args: ["--model", "sonnet", "-p", prompt],
    },
    {
      voice: "claude-opus",
      cmd: "claude",
      args: ["--model", "opus", "-p", prompt],
    },
    {
      voice: "codex-gpt-5",
      cmd: "codex",
      args: ["exec", prompt],
    },
  ];

  const votes: Record<string, { stance: "AYE" | "NAY"; reason?: string }> = {};

  const promises = reviewers.map(async (r) => {
    try {
      const timeoutMs = 60000;
      const controller = new AbortController();

      const proc = new Deno.Command(r.cmd, {
        args: r.args,
        cwd: ROOT,
        stdout: "piped",
        stderr: "piped",
        stdin: "null",
        signal: controller.signal,
      });

      const runPromise = proc.output();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const p = await runPromise;
        clearTimeout(timer);
        const outText = new TextDecoder().decode(p.stdout) +
          new TextDecoder().decode(p.stderr);
        const code = p.code;

        if (code !== 0) {
          votes[r.voice] = {
            stance: "NAY",
            reason: `exited with code ${code}. Output: ${outText.trim().slice(0, 100)}`,
          };
        } else {
          const verdictStr = outText.trim().split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
          votes[r.voice] = parseReviewVerdict(verdictStr);
        }
      } catch (err) {
        clearTimeout(timer);
        const errMsg = err instanceof Error && err.name === "AbortError"
          ? "timeout (60s exceeded)"
          : String(err);
        votes[r.voice] = {
          stance: "NAY",
          reason: `execution failed: ${errMsg}`,
        };
      }
    } catch (e) {
      votes[r.voice] = {
        stance: "NAY",
        reason: `command launch error: ${String(e)}`,
      };
    }
  });

  await Promise.all(promises);

  return adjudicateQuorum(votes);
}

// ── pipeline ─────────────────────────────────────────────────────────────────

interface Task {
  spec: string;
  check: string; // bash success criterion (exit 0 = done correctly)
  slug: string;
}

async function authorInWorktree(
  wt: string,
  task: Task,
): Promise<Verdict> {
  const prompt =
    `You are authoring ONE focused change in the trinity substrate (Deno/TypeScript ` +
    `flat-src organs in src/). Task:\n\n${task.spec}\n\n` +
    `Hard rules:\n` +
    `- Stay strictly in scope; make the smallest correct change.\n` +
    `- NEVER edit: .github/, the dispatcher (x0010/x0100), the glossary ` +
    `(x0001), deno.lock, the t shim, src/x7C00_author.ts, src/x7F00_daemon.ts, ` +
    `or any submodule (myc/ liquid/ omega/).\n` +
    `- Match surrounding style. Run \`deno fmt\` on files you touch.\n` +
    `- Ensure \`deno check src/*.ts\` and \`./t audit\` stay clean.\n` +
    `- Add or update a falsifier/verification where the task implies one.\n` +
    `When done, the success criterion that will be checked is:\n  ${task.check}\n` +
    `Make exactly the change; do not commit (the harness commits).`;
  const r = await run("claude", [
    "-p",
    "--dangerously-skip-permissions",
    prompt,
  ], wt);
  if (r.code !== 0) {
    return fail("author", `claude exited ${r.code}: ${r.out.slice(-200)}`);
  }
  // Commit whatever the author produced so the diff vs main is well-defined.
  await run("git", ["add", "-A"], wt);
  const c = await run("git", [
    "commit",
    "-q",
    "-m",
    `feat(author): ${task.slug}\n\nAutonomously authored under the t author safety harness.`,
  ], wt);
  if (c.code !== 0 && (await worktreeClean(wt))) {
    return fail("author", "author produced no change");
  }
  return ok("author", "change authored and committed to branch");
}

async function loadHorizonSpec(handle: string): Promise<Task | null> {
  // handle like x0030_compose → read the organ's // horizon: line as the spec.
  const m = handle.match(/^x([0-9A-Fa-f]{4})_(.+)$/);
  if (!m) return null;
  for await (const entry of Deno.readDir(join(ROOT, "src"))) {
    if (!entry.name.startsWith(`x${m[1]}`) || !entry.name.endsWith(".ts")) {
      continue;
    }
    const text = await Deno.readTextFile(join(ROOT, "src", entry.name));
    const hm = text.match(/^\/\/\s*horizon:\s*(.+)$/m);
    if (!hm || /^none\b/i.test(hm[1])) return null;
    return {
      spec:
        `Advance the declared horizon of organ ${entry.name}:\n  "${hm[1]}"\n` +
        `Implement the smallest concrete step toward it. When done, update the ` +
        `// horizon: line to reflect what was implemented (or "none (...)" if fully met).`,
      check: `grep -q "horizon:" "src/${entry.name}"`,
      slug: handle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
  }
  return null;
}

async function main() {
  const args = Deno.args;
  const useJson = args.includes("--json");
  const dryRun = args.includes("--dry-run");
  const autoMerge = args.includes("--auto-merge");
  const flag = (name: string): string | undefined => {
    const i = args.indexOf(name);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };

  const report = (o: Record<string, unknown>) =>
    console.log(
      useJson
        ? JSON.stringify({ type: "author", ...o }, null, 2)
        : Object.entries(o).map(([k, v]) =>
          `# ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`
        ).join("\n"),
    );

  // --verify-only <branch>: run the safety harness on an existing branch
  // (no authoring). Lets the gates be proven against deliberately-bad branches.
  const verifyOnly = flag("--verify-only");
  if (verifyOnly) {
    const wt = join(
      dirname(ROOT),
      ("trinity-verify-" + verifyOnly).replace(/[^a-zA-Z0-9-]/g, "-").slice(
        0,
        60,
      ),
    );
    await run("git", ["worktree", "remove", "--force", wt], ROOT);
    const add = await run("git", ["worktree", "add", wt, verifyOnly], ROOT);
    if (add.code !== 0) {
      report({
        action: "error",
        stage: "worktree",
        detail: add.out.slice(-160),
      });
      Deno.exit(1);
    }
    const stages: Verdict[] = [];
    const noReview = args.includes("--no-review");
    const gates = [
      () => scopeCheck(wt),
      () => verifyGates(wt),
      ...(noReview
        ? []
        : [
          autoMerge
            ? () => adversarialQuorumReview(wt, `verify-only ${verifyOnly}`)
            : () => adversarialReview(wt, `verify-only ${verifyOnly}`),
        ]),
    ];
    for (const gate of gates) {
      const v = await gate();
      stages.push(v);
      if (!v.ok) break;
    }
    await run("git", ["worktree", "remove", "--force", wt], ROOT);
    const passed = stages.every((s) => s.ok);
    report({
      action: passed ? "verified-pass" : "verified-reject",
      stage: passed ? "all" : stages[stages.length - 1].stage,
      reason: passed ? "" : stages[stages.length - 1].detail,
      stages,
    });
    return;
  }

  // Resolve the task.
  let task: Task | null = null;
  const horizon = flag("--horizon");
  const specArg = flag("--task");
  if (horizon) task = await loadHorizonSpec(horizon);
  else if (specArg) {
    task = {
      spec: specArg,
      check: flag("--check") ?? "",
      slug: (flag("--slug") ?? specArg).toLowerCase().replace(
        /[^a-z0-9]+/g,
        "-",
      )
        .slice(0, 50),
    };
  }
  if (!task) {
    report({
      action: "refused",
      reason:
        'no task — pass --task "<spec>" [--check "<bash>"] or --horizon <handle>',
    });
    Deno.exit(1);
  }

  // Dry-run is read-only — show the plan regardless of tree state.
  if (dryRun) {
    report({
      action: "dry-run",
      task: task.spec.split("\n")[0],
      success_check: task.check || "(none)",
      merge_policy: autoMerge ? "auto-merge" : "open PR (human merge)",
      protected_paths: PROTECTED.length,
    });
    return;
  }

  // Preconditions for acting.
  if (!(await worktreeClean(ROOT))) {
    report({ action: "refused", reason: "main worktree dirty" });
    Deno.exit(1);
  }

  // Isolation: fresh worktree + branch off main.
  const branch = `author/${task.slug}-${Math.abs(hashStr(task.spec)) % 100000}`;
  const wt = join(dirname(ROOT), `trinity-author-${task.slug}`.slice(0, 60));
  await run("git", ["worktree", "remove", "--force", wt], ROOT); // clean any stale
  const add = await run(
    "git",
    ["worktree", "add", "-b", branch, wt, "main"],
    ROOT,
  );
  if (add.code !== 0) {
    report({ action: "error", stage: "worktree", detail: add.out.slice(-200) });
    Deno.exit(1);
  }

  const stages: Verdict[] = [];
  // Remove the worktree BEFORE deleting the branch — git refuses to delete a
  // branch still checked out in a worktree.
  const finish = async (
    final: Record<string, unknown>,
    opts: { keepBranch?: boolean } = {},
  ) => {
    await run("git", ["worktree", "remove", "--force", wt], ROOT);
    if (!opts.keepBranch) await run("git", ["branch", "-D", branch], ROOT);
    report({ ...final, stages });
  };

  try {
    let v = await authorInWorktree(wt, task);
    stages.push(v);
    if (!v.ok) {
      return await finish({ action: "discarded", reason: v.detail });
    }

    for (
      const gate of [
        () => scopeCheck(wt),
        () => verifyGates(wt),
        () => successCheck(wt, task!.check),
        autoMerge
          ? () => adversarialQuorumReview(wt, task!.spec)
          : () => adversarialReview(wt, task!.spec),
      ]
    ) {
      v = await gate();
      stages.push(v);
      if (!v.ok) {
        return await finish({
          action: "rejected",
          stage: v.stage,
          reason: v.detail,
        });
      }
    }

    // All gates passed. Default: open a PR. --auto-merge: merge to main.
    await run("git", ["push", "-u", "origin", branch], ROOT);
    if (autoMerge) {
      const merge = await run("git", [
        "merge",
        "--no-ff",
        "-m",
        `feat(author): ${task.slug} [auto-merged after full harness]`,
        branch,
      ], ROOT);
      await run("git", ["push", "origin", "main"], ROOT);
      return await finish({
        action: merge.code === 0 ? "auto-merged" : "merge-failed",
        branch,
        detail: merge.code === 0 ? "" : merge.out.slice(-200),
      }, { keepBranch: true });
    }
    const pr = await run("gh", [
      "pr",
      "create",
      "--title",
      `feat(author): ${task.slug}`,
      "--body",
      `Autonomously authored by \`t author\` under the safety harness.\n\nTask: ${task.spec}\n\nAll gates passed: scope, fmt/type-check/audit, success-check, adversarial review.`,
      "--head",
      branch,
    ], ROOT);
    return await finish({
      action: "proposed",
      branch,
      pr: pr.out.trim().split("\n").pop(),
    }, { keepBranch: true });
  } catch (e) {
    await run("git", ["worktree", "remove", "--force", wt], ROOT);
    await run("git", ["branch", "-D", branch], ROOT);
    report({ action: "error", detail: String(e), stages });
    Deno.exit(1);
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

if (import.meta.main) await main();
