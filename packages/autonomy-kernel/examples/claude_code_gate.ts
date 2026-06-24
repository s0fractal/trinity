// Gate a Claude Code (or any) agent harness through the kernel — the killer app.
//
// As a Claude Code PreToolUse hook it reads the tool call on stdin, classifies it
// A0..A4 by EFFECT, and allows only up to a configured ceiling — so the agent can
// read and edit the repo but a push, a deploy, an `rm -rf`, a network fetch, or an
// UNKNOWN tool/command is denied, fail-closed. Wire it in .claude/settings.json:
//
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
