import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { startProxy } from "./x5510_myc_proxy.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

Deno.test("x5510_myc_proxy - intercepts and serves local files", async () => {
  const port = 18787;
  const abort = new AbortController();
  const proxyPromise = startProxy(port, abort.signal);

  // Allow short duration for listener to spin up
  await new Promise((r) => setTimeout(r, 50));

  try {
    const tempFileName = "x9999_temp_test_literate.myc.md";
    const tempFilePath = join(Deno.cwd(), "src", tempFileName);
    const tempFileContent = `
# Temp
\`\`\`ts execution
export const testVal = "hello_proxy";
\`\`\`
`;
    await Deno.writeTextFile(tempFilePath, tempFileContent);

    try {
      const conn = await Deno.connect({ hostname: "127.0.0.1", port });
      const request = [
        `GET http://myc.md/src/${tempFileName} HTTP/1.1`,
        "Host: myc.md",
        "Connection: close",
        "",
        "",
      ].join("\r\n");
      await conn.write(new TextEncoder().encode(request));

      const buf = new Uint8Array(8192);
      const n = await conn.read(buf);
      const response = new TextDecoder().decode(buf.subarray(0, n!));
      conn.close();

      assert(response.includes("HTTP/1.1 200 OK"), "should return 200 OK");
      assert(
        response.includes(
          "Content-Type: application/typescript; charset=utf-8",
        ),
        "should serve application/typescript contentType",
      );
      assert(
        response.includes('export const testVal = "hello_proxy";'),
        "should serve parsed TS body",
      );
    } finally {
      await Deno.remove(tempFilePath).catch(() => {});
    }
  } finally {
    abort.abort();
    await proxyPromise;
  }
});
