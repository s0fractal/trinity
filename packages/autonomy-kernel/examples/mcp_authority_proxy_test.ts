import { assert, assertEquals } from "jsr:@std/assert@^1";
import { type ProxyConfig, routeMcpMessage } from "./mcp_authority_proxy.ts";

const cfg: ProxyConfig = {
  ceiling: "A2",
  effects: {
    read_file: ["read"],
    write_file: ["source_change"],
    delete_path: ["destructive"],
  },
};

Deno.test("route — non-tools/call messages always forward", () => {
  assertEquals(
    routeMcpMessage({ method: "initialize", id: 1 }, cfg).forward,
    true,
  );
  assertEquals(
    routeMcpMessage({ method: "tools/list", id: 2 }, cfg).forward,
    true,
  );
});

Deno.test("route — declared tools gate at the ceiling", () => {
  assert(
    routeMcpMessage({
      method: "tools/call",
      id: 1,
      params: { name: "read_file" },
    }, cfg).forward,
  );
  assert(
    routeMcpMessage({
      method: "tools/call",
      id: 2,
      params: { name: "write_file" },
    }, cfg).forward,
  );
  assert(
    !routeMcpMessage({
      method: "tools/call",
      id: 3,
      params: { name: "delete_path" },
    }, cfg).forward,
  ); // destructive A4
});

Deno.test("route — an UNDECLARED tool is denied by default (fail-closed)", () => {
  const r = routeMcpMessage({
    method: "tools/call",
    id: 9,
    params: { name: "exfiltrate" },
  }, cfg);
  assertEquals(r.forward, false);
  if (!r.forward) assert(JSON.stringify(r.denyResponse).includes("A4"));
});

Deno.test("end-to-end — allowed calls reach the server, denied calls never do", async () => {
  const cfgFile = await Deno.makeTempFile({ suffix: ".json" });
  await Deno.writeTextFile(cfgFile, JSON.stringify(cfg));
  // Inline mock MCP server: reads JSON-RPC, echoes "SERVER RAN <tool>" for tools/call.
  const mock =
    `const t=await new Response(Deno.stdin.readable).text();for(const l of t.split(String.fromCharCode(10))){if(!l.trim())continue;const m=JSON.parse(l);const r=m.method==="tools/call"?{content:[{type:"text",text:"SERVER RAN "+m.params.name}]}:{ok:m.method};console.log(JSON.stringify({jsonrpc:"2.0",id:m.id,result:r}))}`;
  const proxy = new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      new URL("./mcp_authority_proxy.ts", import.meta.url).pathname,
      "--config",
      cfgFile,
      "--",
      "deno",
      "eval",
      mock,
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "null",
  }).spawn();

  const enc = new TextEncoder();
  const w = proxy.stdin.getWriter();
  for (
    const req of [
      { jsonrpc: "2.0", id: 1, method: "initialize" },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "read_file" },
      }, // A0 ⇒ allowed
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "delete_path" },
      }, // A4 ⇒ denied
    ]
  ) await w.write(enc.encode(JSON.stringify(req) + "\n"));
  await w.close();

  const out = await new Response(proxy.stdout).text();
  await proxy.status;
  await Deno.remove(cfgFile);

  assert(out.includes('"ok":"initialize"'), "initialize must reach the server");
  assert(
    out.includes("SERVER RAN read_file"),
    "an allowed call must reach the server",
  );
  assert(
    !out.includes("SERVER RAN delete_path"),
    "a denied call must NEVER reach the server",
  );
  assert(
    out.includes("autonomy-kernel denied") && out.includes("delete_path"),
    "the host must receive the kernel's denial for the blocked call",
  );
});
