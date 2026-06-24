// Gate an MCP (Model Context Protocol) tool stream through the kernel.
//
// MCP's trust model is the gap this fills: a host connects to third-party MCP
// servers and, by default, trusts every tool they expose. The kernel inverts that
// — a tool whose effect you have NOT declared is UNKNOWN, and unknown is A4
// (sovereign), denied by default. You opt specific tools IN by declaring their
// effects; a new or malicious server's tools are refused until you do.
//
// This processes an MCP `tools/call` request (the protocol JSON) and returns a
// decision — drop it into a proxy that sits between host and servers. No SDK
// dependency: it works on the wire shape.
//
// Run the demo (no stdin): deno run examples/mcp_gate.ts --demo
//
// Copying this out? Change the import to "jsr:@s0fractal/autonomy-kernel".
import { type ActionClass, classifyIntent } from "../mod.ts";

// Declared effects per fully-qualified MCP tool ("<server>.<tool>"). This is YOUR
// trust statement: only what is listed here is classified by its real effect;
// everything else is unknown ⇒ A4. Ship it empty and the gate denies everything —
// the safe default for an untrusted server.
export type EffectMap = Record<string, string[]>;

const ORDER: Record<ActionClass, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

/** Decide one MCP tool call. `tool` is "<server>.<name>"; unmapped ⇒ unknown ⇒ A4. */
export function gateMcpCall(
  tool: string,
  effects: EffectMap,
  ceiling: ActionClass,
) {
  const declared = effects[tool] ?? ["mcp_tool_undeclared"]; // undeclared ⇒ fail-closed
  const { cls, reason } = classifyIntent({
    verb: tool,
    target: tool,
    effects: declared,
  });
  return { allow: ORDER[cls] <= ORDER[ceiling], cls, reason, declared };
}

const CEILING = (Deno.env.get("MCP_GATE_CEILING") as ActionClass) ?? "A2";

if (import.meta.main) {
  if (Deno.args.includes("--demo")) {
    // A host trusts a "files" server (effects declared) and just connected to an
    // unvetted "misc" server (nothing declared). Same ceiling, very different trust.
    const declared: EffectMap = {
      "files.read": ["read"],
      "files.list": ["read"],
      "files.write": ["source_change"],
      "files.delete": ["destructive"], // declared honestly ⇒ classified A4 ⇒ denied
      "git.push": ["branch_push"],
    };
    const calls = [
      "files.read",
      "files.list",
      "files.write",
      "files.delete", // declared, but destructive ⇒ A4
      "git.push", // declared A3 ⇒ above ceiling
      "misc.run_shell", // UNDECLARED (untrusted server) ⇒ A4 fail-closed
      "misc.exfiltrate", // UNDECLARED ⇒ A4 fail-closed
    ];
    console.log(
      `# MCP gate — ceiling ${CEILING}; undeclared tools are sovereign by default\n`,
    );
    for (const tool of calls) {
      const g = gateMcpCall(tool, declared, CEILING);
      const mark = g.allow ? "✅ ALLOW" : "⛔ DENY ";
      console.log(`  ${mark} [${g.cls}] ${tool.padEnd(18)} ${g.reason}`);
    }
    Deno.exit(0);
  }

  // Proxy mode: an MCP request arrives as JSON on stdin; we answer with a decision.
  // A real proxy would forward allowed calls to the downstream server and return a
  // JSON-RPC error for denied ones. The effect map would come from your config.
  const raw = new TextDecoder().decode(
    await new Response(Deno.stdin.readable).arrayBuffer(),
  );
  const req = JSON.parse(raw || "{}");
  const tool = `${req.params?.server ?? "?"}.${req.params?.name ?? "?"}`;
  const declared: EffectMap = req._effects ?? {};
  const g = gateMcpCall(tool, declared, CEILING);
  console.log(JSON.stringify({
    jsonrpc: "2.0",
    id: req.id ?? null,
    ...(g.allow ? { result: { gate: "allow", cls: g.cls } } : {
      error: {
        code: -32000,
        message: `autonomy-kernel denied ${tool}: ${g.cls} (${g.reason})`,
      },
    }),
  }));
  Deno.exit(0);
}
