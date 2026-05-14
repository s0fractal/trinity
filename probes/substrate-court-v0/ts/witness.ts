// witness.ts — wraps a body fixture with a declared substrate_tag and
// emits the envelope JSON to stdout.
//
// Args:
//   --substrate-tag <trinity|liquid|myc|omega|external>
//   --body-kind <body_kind>
//   --body <path-to-json-fixture>
//
// Env:
//   TAMPER_BODY=1   — flip one byte in the body for Scenario B
//   FAKE_SCHEMA=<s> — emit envelope with a different schema string (Scenario C)
//
// Stdout: single-line JSON envelope.
// Stderr: diagnostic ("witness <tag> wrote body_hash=...")

import { wrap, ENVELOPE_SCHEMA, BodyKind, SubstrateTag } from "../../receipt-envelope-encoder-v0/ts/envelope.ts";
import { CborValue } from "../../receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

function parseArgs(args: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i];
    const v = args[i + 1];
    if (k.startsWith("--")) out[k.slice(2)] = v;
  }
  return out;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args);
  const substrate_tag = (args["substrate-tag"] ?? "trinity") as SubstrateTag;
  const body_kind = (args["body-kind"] ?? "substrate_health") as BodyKind;
  const bodyPath = args["body"];

  if (!bodyPath) {
    console.error("witness: --body <path> required");
    Deno.exit(2);
  }

  const bodyText = await Deno.readTextFile(bodyPath);
  let body = JSON.parse(bodyText) as CborValue;

  // Scenario B: tamper one byte (mutate a known field).
  if (Deno.env.get("TAMPER_BODY") === "1") {
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      (body as Record<string, CborValue>).tampered_at = "1970-01-01T00:00:00Z";
    }
    console.error(`witness[${substrate_tag}]: TAMPER_BODY=1 applied`);
  }

  const envelope = await wrap(body, body_kind, substrate_tag, {
    created_at_logical: { wall_time_utc: new Date().toISOString() },
  });

  // Scenario C: forward-compat schema mismatch — synthetic.
  // We can't change the schema via wrap(), so emit a modified envelope.
  const fakeSchema = Deno.env.get("FAKE_SCHEMA");
  let emitted: Record<string, unknown> = { ...envelope };
  if (fakeSchema) {
    emitted = { ...emitted, schema: fakeSchema };
    console.error(`witness[${substrate_tag}]: FAKE_SCHEMA=${fakeSchema} applied`);
  }

  console.error(`witness[${substrate_tag}]: body_hash=${envelope.body_hash.slice(0, 16)}... envelope_id=${envelope.envelope_id.slice(0, 16)}...`);
  console.log(JSON.stringify(emitted));
}
