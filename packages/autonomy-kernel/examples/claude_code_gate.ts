// Gate a Claude Code (or any) agent harness through the kernel — the killer app.
//
// As a Claude Code PreToolUse hook it reads the tool call on stdin, classifies it
// A0..A4 by EFFECT, and allows only up to a configured ceiling — so the agent can
// read and edit the repo but a push, a deploy, an `rm -rf`, a `find -delete`, a read
// of credential material, a network fetch, or an UNKNOWN tool/command is denied,
// fail-closed.
//
// The ONLY hard guarantee is the kernel's: an effect/tool the table doesn't know is
// A4 (sovereign), never waved through. The Bash→effect map below is a best-effort
// recognizer, NOT a sandbox — a determined string (obfuscation, `$(...)`, a novel
// tool) can still earn a benign tag. Keep the ceiling low and treat it as defence in
// depth over the host's own permissions, not a substitute for them.
//
// Wire it in .claude/settings.json:
//   { "hooks": { "PreToolUse": [{ "matcher": "*", "hooks": [
//       { "type": "command", "command": "deno run -A claude_code_gate.ts" }] }] } }
//
// Run the demo (no stdin): deno run examples/claude_code_gate.ts --demo
//
// Copying this out of the repo? Change the import to:
//   import { classifyIntent } from "jsr:@s0fractal/autonomy-kernel";
import { type ActionClass, classifyIntent } from "../mod.ts";

// ── Map a Claude Code tool call → the EFFECTS it has on the world. ──
// Known effect names classify via the kernel's table; deliberately-unknown ones
// ("shell_unknown", "subagent_spawn") fall through to A4 — sovereign by default.
const TOOL_EFFECTS: Record<string, string[]> = {
  Read: ["read"],
  Grep: ["read"],
  Glob: ["read"],
  LS: ["read"],
  NotebookRead: ["read"],
  Edit: ["source_change"],
  Write: ["source_change"],
  MultiEdit: ["source_change"],
  NotebookEdit: ["source_change"],
  WebFetch: ["fetch_public"],
  WebSearch: ["fetch_public"],
  Task: ["subagent_spawn"], // an unbounded subagent — unknown ⇒ A4, on purpose
};

/** Classify a shell command by its most-privileged observable effect. Anything
 *  unrecognized returns "shell_unknown" → A4, so a novel command is never waved through. */
export function bashEffects(cmd: string): string[] {
  const c = cmd.toLowerCase();
  // "Looks innocent, is sovereign" — checked first, mapped to effects the kernel
  // has never heard of, so they fail closed to A4 regardless of what follows.
  if (
    /(\||;|&&)\s*(sh|bash|zsh)\b/.test(c) || /\b(sh|bash|zsh)\s+-c\b/.test(c)
  ) {
    return ["arbitrary_exec"]; // curl … | sh, bash -c "…"
  }
  if (/(^|\s|;|&&|\|)\s*sudo\b/.test(c)) {
    return ["privilege_escalation"];
  }
  if (
    /git\s+push\b[^;&|]*(--force\b|--force-with-lease\b|\s-f(\s|$))/.test(c)
  ) {
    return ["destructive"]; // force-push can rewrite shared history
  }
  if (
    /(^|\s|;|&&|\|)\s*(rm\s+-rf|git\s+reset\s+--hard|dd\s|mkfs|:\(\)\s*\{)/
      .test(c)
  ) {
    return ["destructive"];
  }
  // Destruction disguised as a benign verb — caught here, BEFORE the read /
  // source_change allowlists, or it falls through to A0/A2: a `find` that
  // deletes/executes, an `xargs` into a destroyer, `mv`/`cp` routing a file to
  // /dev/null (a silent delete/truncate), a force branch-delete. (`c` is already
  // lower-cased, so `-D` and `-d` are indistinguishable — both delete, both denied.)
  if (
    /\bfind\b[^|;&]*\s-(delete|execdir|exec|ok)\b/.test(c) ||
    /\|\s*xargs\b[^|;&]*\b(rm|rmdir|dd|shred|unlink)\b/.test(c) ||
    /\b(mv|cp)\b[^|;&]*\/dev\/null/.test(c) ||
    /\bgit\s+branch\s+(-d|--delete)\b/.test(c)
  ) {
    return ["destructive"];
  }
  // Reading credential material is NOT a benign `read`: a gated agent that can
  // `cat ~/.ssh/id_rsa` (or ~/.npmrc, ~/.config/gh/hosts.yml, /proc/self/environ…)
  // can exfiltrate it on a later turn. A command touching a known-secret path maps
  // to an effect the kernel has never heard of, so it fails closed to A4 — a fresh
  // human+model act, never the read ceiling. Prefix forms (/etc/pass) catch the
  // obvious glob evasions (/etc/pass*); deeper obfuscation is out of scope by design
  // (see the header note). Over-denial is the safe error here.
  if (
    /\.ssh\/|id_rsa|id_ed25519|id_ecdsa|\/etc\/(pass|sh|ssh|sudoers|gshadow|ssl)|\.aws\/credentials|\.git-credentials|\.gitconfig|\.npmrc|\.pypirc|\bnetrc\b|\.config\/gh\/|\.docker\/config\.json|\/proc\/(self|\d+)\/environ|\/var\/run\/secrets\/|(^|\/|\s)\.env\b|\.env\b|\.pem\b|\.p12\b|\.ed25519\.json|\/\.trinity\/keys/
      .test(c)
  ) {
    return ["secret_read"]; // unknown effect ⇒ A4 (fail-closed)
  }
  // An output redirect to a real file WRITES it — never a read. `echo x > f`,
  // `cat a > b` truncate/clobber a target, so they are at least source_change, not
  // A0. Skip /dev/null|/dev/std* discards and `N>&M` fd-dups; a redirect OF a secret
  // read was already caught above by path.
  if (
    /(^|[^0-9&|>])>>?\s*[\w.$~/+-]/.test(c) &&
    !/>>?\s*\/dev\/(null|stdout|stderr|fd)/.test(c)
  ) {
    return ["source_change"];
  }
  if (
    /\b(deno\s+publish|npm\s+publish|jsr\s+publish|gh\s+release|terraform\s+apply|kubectl\s+apply|wrangler\s+deploy)\b/
      .test(c)
  ) {
    return ["deploy"];
  }
  if (
    /\b(git\s+push|gh\s+pr\s+create|gh\s+pr\s+merge)\b/.test(c) ||
    /curl\b.*-X\s*(post|put|delete)/.test(c)
  ) {
    return ["branch_push"];
  }
  if (/\b(git\s+(commit|add|mv)|deno\s+fmt|mkdir|touch|cp|mv|tee)\b/.test(c)) {
    return ["source_change"];
  }
  if (
    /\b(ls|cat|grep|rg|find|head|tail|wc|echo|pwd|deno\s+(test|check|lint)|git\s+(status|log|diff|show|branch))\b/
      .test(c)
  ) {
    return ["read"];
  }
  return ["shell_unknown"]; // fail-closed
}

export function toolIntent(
  toolName: string,
  toolInput: Record<string, unknown>,
) {
  const effects = toolName === "Bash"
    ? bashEffects(String(toolInput.command ?? ""))
    : TOOL_EFFECTS[toolName] ?? ["tool_unknown"]; // unknown tool ⇒ A4
  const target = String(
    toolInput.file_path ?? toolInput.command ?? toolInput.url ??
      toolInput.pattern ?? toolName,
  );
  return { verb: toolName, target, effects };
}

const ORDER: Record<ActionClass, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

/** A tool call is permitted iff its class is at or below the ceiling. */
export function gate(
  toolName: string,
  toolInput: Record<string, unknown>,
  ceiling: ActionClass,
) {
  const intent = toolIntent(toolName, toolInput);
  const { cls, reason } = classifyIntent(intent);
  return { allow: ORDER[cls] <= ORDER[ceiling], cls, reason, intent };
}

const CEILING = (Deno.env.get("CLAUDE_GATE_CEILING") as ActionClass) ?? "A2";

if (import.meta.main) {
  if (Deno.args.includes("--demo")) {
    const stream: [string, Record<string, unknown>][] = [
      ["Read", { file_path: "README.md" }],
      ["Edit", { file_path: "src/app.ts" }],
      ["Bash", { command: "deno test -A" }],
      ["Bash", { command: "git commit -m wip" }],
      ["Bash", { command: "git push origin main" }],
      ["Bash", { command: "deno publish" }],
      ["Bash", { command: "rm -rf node_modules" }],
      ["Bash", { command: "cat ~/.ssh/id_rsa" }],
      ["Bash", { command: "find / -delete" }],
      ["WebFetch", { url: "https://example.com" }],
      ["Task", { description: "spawn subagent" }],
      ["MysteryTool", { foo: "bar" }],
    ];
    console.log(
      `# Claude Code gate — ceiling ${CEILING} (read+edit allowed; reach-out & sovereign denied)\n`,
    );
    for (const [name, input] of stream) {
      const g = gate(name, input, CEILING);
      const mark = g.allow ? "✅ ALLOW" : "⛔ DENY ";
      console.log(
        `  ${mark} [${g.cls}] ${name.padEnd(12)} ${
          g.intent.target.slice(0, 28).padEnd(28)
        } ${g.reason}`,
      );
    }
    Deno.exit(0);
  }

  // Hook mode: a PreToolUse tool call arrives as JSON on stdin.
  const raw = new TextDecoder().decode(
    await new Response(Deno.stdin.readable).arrayBuffer(),
  );
  const evt = JSON.parse(raw || "{}");
  const g = gate(evt.tool_name ?? "", evt.tool_input ?? {}, CEILING);
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: g.allow ? "allow" : "deny",
      permissionDecisionReason:
        `autonomy-kernel: ${g.cls} (${g.reason}); ceiling ${CEILING}`,
    },
  }));
  Deno.exit(0);
}
