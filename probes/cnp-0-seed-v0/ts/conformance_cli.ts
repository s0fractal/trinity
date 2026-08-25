#!/usr/bin/env -S deno run --allow-read
// The reference encoder, behind the conformance kit's interface.
//
// `conformance/cnp-0-jcs-v0/` deliberately ships no implementation: a kit that
// scored you by agreement with our encoder would be asking you to trust our
// encoder. This adapter lives here instead, on the reference side, and does two
// things.
//
// It proves the kit is satisfiable. Its selftest scores synthetic fakes, which
// shows the runner catches wrong answers but not that any real program can give
// right ones — a corpus with one impossible expectation would pass every one of
// those controls. Running this through the kit closes that gap: the encoder and
// the corpus were written by the same hand, so agreement is no evidence of
// independence, but disagreement would be a defect in one of them.
//
// And it gives an outside implementer something to diff against if they choose
// to. Choosing to is the point; being required to is what the kit avoids.
//
//   deno run --no-config --allow-read ts/conformance_cli.ts encode < in.ndjson
//   deno run --no-config --allow-read ts/conformance_cli.ts verify < in.ndjson

import { fromHex, sha256Hex, toHex } from "./jcs.ts";
import { canonicalize, rejectionOf } from "./cnp0.ts";
import { verifyRaw } from "./reject.ts";

type Line = { id: string; raw_hex: string };

async function encode(bytes: Uint8Array): Promise<Record<string, unknown>> {
  try {
    const got = await canonicalize(bytes);
    return {
      ok: true,
      canonical_hex: toHex(new TextEncoder().encode(got.text)),
      sha256: got.sha256,
    };
  } catch (e) {
    const category = rejectionOf(e);
    if (category === undefined) throw e;
    return { ok: false, category };
  }
}

async function verify(bytes: Uint8Array): Promise<Record<string, unknown>> {
  const out = await verifyRaw(bytes);
  return out.ok
    ? { ok: true, sha256: out.sha256 }
    : { ok: false, category: out.rejection };
}

async function main(): Promise<number> {
  const sub = Deno.args[0];
  if (sub !== "encode" && sub !== "verify") {
    console.error("usage: conformance_cli.ts <encode|verify>  (NDJSON on stdin)");
    return 2;
  }
  const text = new TextDecoder().decode(
    await new Response(Deno.stdin.readable).arrayBuffer(),
  );
  const out: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line) as Line;
    const bytes = fromHex(rec.raw_hex);
    // A throw here is the program failing, which the interface distinguishes
    // from rejecting an input: it exits non-zero rather than emitting a verdict.
    const body = sub === "encode" ? await encode(bytes) : await verify(bytes);
    out.push(JSON.stringify({ id: rec.id, ...body }));
  }
  console.log(out.join("\n"));
  return 0;
}

if (import.meta.main) Deno.exit(await main());

export { encode, sha256Hex, verify };
