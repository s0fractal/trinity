// src/x5510_myc_proxy.ts — local HTTP/TCP proxy for virtual FQDN resolution
// position: 5/51 → action(5) — resolves the `myc.md` virtual host to substrate organs
// maturity: active
// skill_safe: yes-with-care
//   (binds a TCP port and, when used as Deno's HTTP_PROXY,
//   tunnels all other imports through itself — not read-only)
//
// Purpose: collapse the difference between a file name and its canonical address.
// The end-goal is `import "myc.md/src/foo.myc.md"` (and eventually bare
// `import "foo.myc.md"`) resolving to the TypeScript extracted from the markdown
// organ — so for an LLM the handle IS the FQDN. To make that work the proxy is
// pointed at by Deno via HTTP_PROXY, which means EVERY remote import flows through
// here. Requests for the `myc.md` host are served locally (TS extracted from the
// .myc.md document); everything else MUST be passed through untouched, otherwise
// we would break deno.land/std and all other remote imports. The pass-through is
// therefore load-bearing, not scope creep.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { extractCodeBlocks } from "./x0150_literate_parser.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const SUBSTRATE_ROOT = dirname(HERE);

/**
 * Parses request line to extract method, target URI, and path elements.
 */
function parseRequestLine(
  firstLine: string,
): { method: string; host: string; port: number; path: string } {
  const parts = firstLine.split(" ");
  if (parts.length < 2) {
    return { method: "", host: "", port: 80, path: "" };
  }
  const method = parts[0];
  const uri = parts[1];

  if (method === "CONNECT") {
    const [host, portStr] = uri.split(":");
    return {
      method,
      host,
      port: parseInt(portStr) || 443,
      path: "",
    };
  }

  if (uri.startsWith("/")) {
    return { method, host: "myc.md", port: 80, path: uri };
  }

  try {
    const url = new URL(uri);
    return {
      method,
      host: url.hostname,
      port: url.port
        ? parseInt(url.port)
        : (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
    };
  } catch {
    // Relative/fallback
    return { method, host: "", port: 80, path: uri };
  }
}

/**
 * Resolve a file locally within the monorepo workspace.
 */
async function locateLocalFile(cleanPath: string): Promise<string | null> {
  // 1. Direct path check relative to SUBSTRATE_ROOT
  let filePath = join(SUBSTRATE_ROOT, cleanPath);
  try {
    const stat = await Deno.stat(filePath);
    if (stat.isFile) return filePath;
  } catch {}

  // 2. Direct path check under src/
  filePath = join(SUBSTRATE_ROOT, "src", cleanPath);
  try {
    const stat = await Deno.stat(filePath);
    if (stat.isFile) return filePath;
  } catch {}

  // 3. Fallback: resolve via FQDN resolver in myc if available
  try {
    const resolverPath = join(SUBSTRATE_ROOT, "myc", "src", "x0100_myc.ts");
    const stat = await Deno.stat(resolverPath);
    if (stat.isFile) {
      const { resolveFqdn } = await import(resolverPath);
      // Try resolving in root first
      let resolved = await resolveFqdn(SUBSTRATE_ROOT, cleanPath);
      if (!resolved) {
        resolved = await resolveFqdn(join(SUBSTRATE_ROOT, "myc"), cleanPath);
      }
      if (resolved && resolved.path) {
        return resolved.path;
      }
    }
  } catch (err) {
    console.error("[myc.md Proxy] resolveFqdn import/execution failed:", err);
  }

  return null;
}

/**
 * Handles target requests for myc.md domain by serving local TS modules or extracting from md.
 */
async function handleMycRequest(conn: Deno.Conn, path: string) {
  const cleanPath = path.replace(/^\//, "");
  const filePath = await locateLocalFile(cleanPath);

  if (!filePath) {
    const bodyText = `File not found: ${cleanPath}`;
    const bodyBytes = new TextEncoder().encode(bodyText);
    const headers = [
      "HTTP/1.1 404 Not Found",
      "Content-Type: text/plain; charset=utf-8",
      `Content-Length: ${bodyBytes.byteLength}`,
      "Connection: close",
      "",
      "",
    ].join("\r\n");
    try {
      await conn.write(new TextEncoder().encode(headers));
      await conn.write(bodyBytes);
    } catch {}
    return;
  }

  try {
    const text = await Deno.readTextFile(filePath);
    let bodyBytes: Uint8Array;
    let contentType = "application/typescript; charset=utf-8";

    if (filePath.endsWith(".myc.md") || filePath.endsWith(".md")) {
      const tsCode = extractCodeBlocks(text, "typescript");
      bodyBytes = new TextEncoder().encode(tsCode);
    } else {
      bodyBytes = new TextEncoder().encode(text);
      if (filePath.endsWith(".js")) {
        contentType = "application/javascript; charset=utf-8";
      } else if (!filePath.endsWith(".ts")) {
        contentType = "text/plain; charset=utf-8";
      }
    }

    const headers = [
      "HTTP/1.1 200 OK",
      `Content-Type: ${contentType}`,
      `Content-Length: ${bodyBytes.byteLength}`,
      "Connection: close",
      "",
      "",
    ].join("\r\n");
    await conn.write(new TextEncoder().encode(headers));
    await conn.write(bodyBytes);
  } catch (err: any) {
    const bodyText =
      `Internal error processing file ${cleanPath}: ${err.message}`;
    const bodyBytes = new TextEncoder().encode(bodyText);
    const headers = [
      "HTTP/1.1 500 Internal Server Error",
      "Content-Type: text/plain; charset=utf-8",
      `Content-Length: ${bodyBytes.byteLength}`,
      "Connection: close",
      "",
      "",
    ].join("\r\n");
    try {
      await conn.write(new TextEncoder().encode(headers));
      await conn.write(bodyBytes);
    } catch {}
  }
}

/**
 * Handles individual client TCP connection by parsing method, then proxying or serving locally.
 */
async function handleConnection(conn: Deno.Conn) {
  try {
    const buf = new Uint8Array(8192);
    const n = await conn.read(buf);
    if (n === null || n === 0) {
      conn.close();
      return;
    }
    const chunk = buf.subarray(0, n);
    const text = new TextDecoder().decode(chunk);

    const firstLineEnd = text.indexOf("\r\n");
    if (firstLineEnd === -1) {
      conn.close();
      return;
    }
    const firstLine = text.slice(0, firstLineEnd);
    const info = parseRequestLine(firstLine);

    if (info.method === "CONNECT") {
      try {
        const targetConn = await Deno.connect({
          hostname: info.host,
          port: info.port,
        });
        await conn.write(
          new TextEncoder().encode(
            "HTTP/1.1 200 Connection Established\r\n\r\n",
          ),
        );
        await Promise.all([
          conn.readable.pipeTo(targetConn.writable),
          targetConn.readable.pipeTo(conn.writable),
        ]);
      } catch (err: any) {
        try {
          await conn.write(
            new TextEncoder().encode(
              `HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\nError: ${err.message}`,
            ),
          );
        } catch {}
        conn.close();
      }
      return;
    }

    if (info.host === "myc.md") {
      await handleMycRequest(conn, info.path);
      conn.close();
      return;
    }

    // Pass-through proxying for other hosts
    if (info.host) {
      try {
        const targetConn = await Deno.connect({
          hostname: info.host,
          port: info.port,
        });
        await targetConn.write(chunk);
        await Promise.all([
          conn.readable.pipeTo(targetConn.writable),
          targetConn.readable.pipeTo(conn.writable),
        ]);
      } catch (err: any) {
        try {
          await conn.write(
            new TextEncoder().encode(
              `HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\nError: ${err.message}`,
            ),
          );
        } catch {}
        conn.close();
      }
      return;
    }

    conn.close();
  } catch {
    try {
      conn.close();
    } catch {}
  }
}

/**
 * Starts the proxy server loop.
 */
export async function startProxy(port: number, signal?: AbortSignal) {
  const listener = Deno.listen({ port });
  if (signal) {
    signal.addEventListener("abort", () => {
      try {
        listener.close();
      } catch {}
    });
  }

  try {
    for await (const conn of listener) {
      handleConnection(conn).catch(() => {});
    }
  } catch (err) {
    if (signal?.aborted) return;
    throw err;
  }
}

if (import.meta.main) {
  const port = 8787;
  const status = {
    type: "status",
    status: "healthy",
    overall: "healthy",
    note: `myc proxy server listening on 127.0.0.1:${port}`,
    port,
  };
  console.log(JSON.stringify(status));

  // Run the proxy server infinitely
  await startProxy(port);
}
