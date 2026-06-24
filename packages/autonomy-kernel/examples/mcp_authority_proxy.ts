// A complete stdio MCP authority proxy. Put it between an MCP host and an
// untrusted server: it relays JSON-RPC both ways but gates every `tools/call`
// through the kernel. A call whose effect you have not declared is unknown ⇒ A4 ⇒
// the server never sees it; the host gets a JSON-RPC error instead.
//
//   deno run -A mcp_authority_proxy.ts --config gate.json -- <server command…>
//
// gate.json: { "ceiling": "A2", "effects": { "read_file": ["read"],
//              "write_file": ["source_change"], "delete_path": ["destructive"] } }
//
// Everything not in `effects` is denied by default — the safe stance for a server
// you do not fully trust. The proxy adds no dependency and speaks the MCP stdio
// wire shape (newline-delimited JSON-RPC) directly.
import { type ActionClass, classifyIntent } from "../mod.ts";

export type ProxyConfig = {
  ceiling: ActionClass;
  effects: Record<string, string[]>;
};
export type Route = { forward: true } | {
  forward: false;
  denyResponse: unknown;
};

const ORDER: Record<ActionClass, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  A3: 3,
  A4: 4,
};

/** Pure routing decision for one JSON-RPC message. Only `tools/call` is gated;
 *  everything else (initialize, tools/list, notifications, results) is forwarded. */
export function routeMcpMessage(
  msg: { method?: string; id?: unknown; params?: { name?: string } },
  cfg: ProxyConfig,
): Route {
  if (msg?.method !== "tools/call") return { forward: true };
  const tool = msg.params?.name ?? "";
  const declared = cfg.effects[tool] ?? ["mcp_tool_undeclared"]; // undeclared ⇒ fail-closed
  const { cls, reason } = classifyIntent({
    verb: tool,
    target: tool,
    effects: declared,
  });
  if (ORDER[cls] <= ORDER[cfg.ceiling]) return { forward: true };
  return {
    forward: false,
    denyResponse: {
      jsonrpc: "2.0",
      id: msg.id ?? null,
      error: {
        code: -32000,
        message: `autonomy-kernel denied "${tool}": ${cls} (${reason})`,
      },
    },
  };
}

async function* lines(readable: ReadableStream<Uint8Array>) {
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of readable) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (line.trim()) yield line;
    }
  }
  if (buf.trim()) yield buf;
}

if (import.meta.main) {
  const argv = Deno.args;
  const dd = argv.indexOf("--");
  const downstream = dd >= 0 ? argv.slice(dd + 1) : [];
  if (downstream.length === 0) {
    console.error(
      "usage: mcp_authority_proxy.ts --config gate.json -- <server command…>",
    );
    Deno.exit(2);
  }
  const ci = argv.indexOf("--config");
  const cfg: ProxyConfig = ci >= 0
    ? JSON.parse(Deno.readTextFileSync(argv[ci + 1]))
    : { ceiling: "A2", effects: {} };

  const enc = new TextEncoder();
  const server = new Deno.Command(downstream[0], {
    args: downstream.slice(1),
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  }).spawn();
  const toServer = server.stdin.getWriter();
  const toHost = Deno.stdout.writable.getWriter();
  // Serialize host-bound writes (deny responses race the server's own replies).
  let tail: Promise<void> = Promise.resolve();
  const emit = (
    line: string,
  ) => (tail = tail.then(() =>
    toHost.write(enc.encode(line + "\n")).then(() => {})
  ));

  // server → host: relay every reply untouched.
  const upstream = (async () => {
    for await (const line of lines(server.stdout)) await emit(line);
  })();

  // host → server: gate tools/call, forward the rest.
  for await (const line of lines(Deno.stdin.readable)) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      await toServer.write(enc.encode(line + "\n")); // not JSON we understand — pass through
      continue;
    }
    const route = routeMcpMessage(msg, cfg);
    if (route.forward) {
      await toServer.write(enc.encode(line + "\n"));
    } else {
      await emit(JSON.stringify(route.denyResponse)); // answer the host; server never sees it
    }
  }

  await toServer.close(); // host closed → let the server finish
  await upstream;
  await server.status;
}
