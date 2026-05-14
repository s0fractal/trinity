// court.ts — Substrate Court verifier.
//
// Reads N envelope JSONs (one per line on stdin, OR from --envelope <path>
// args). Emits a SubstrateCourtVerdict JSON on stdout.
//
// See ../SPEC.md.

import { encodeCanonical, multihashSha256, CborValue } from "../../receipt-envelope-encoder-v0/ts/canonical_cbor.ts";
import { ENVELOPE_SCHEMA } from "../../receipt-envelope-encoder-v0/ts/envelope.ts";

type Envelope = {
  schema: string;
  envelope_id: string;
  body_hash: string;
  substrate_tag: string;
  body_kind: string;
  body?: CborValue;
  law_hash?: string | null;
  witness_chain?: unknown[];
};

type Conflict =
  | { kind: "body_hash_divergence"; between: [string, string]; values: [string, string] }
  | { kind: "schema_mismatch"; substrate: string; got: string }
  | { kind: "envelope_id_collision"; substrates: [string, string] }
  | { kind: "self_inconsistent_body_hash"; substrate: string; claimed: string; recomputed: string }
  | { kind: "duplicate_substrate_tag"; tag: string };

type Verdict = {
  type: "SubstrateCourtVerdict";
  schema: "trinity.substrate-court.v0.1";
  witnesses_count: number;
  agreement: boolean;
  body_hashes: Record<string, string>;
  envelope_ids: Record<string, string>;
  law_hashes: Record<string, string | null>;
  conflicts: Conflict[];
};

async function readEnvelopes(args: string[]): Promise<Envelope[]> {
  const fromArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--envelope" && args[i + 1]) {
      fromArgs.push(args[i + 1]);
      i++;
    }
  }
  if (fromArgs.length > 0) {
    const envs: Envelope[] = [];
    for (const p of fromArgs) {
      const text = await Deno.readTextFile(p);
      envs.push(JSON.parse(text.trim()) as Envelope);
    }
    return envs;
  }
  // Fallback: read stdin, one envelope per line.
  const stdinText = await new Response(Deno.stdin.readable).text();
  return stdinText.trim().split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Envelope);
}

if (import.meta.main) {
  const envelopes = await readEnvelopes(Deno.args);
  const conflicts: Conflict[] = [];

  const body_hashes: Record<string, string> = {};
  const envelope_ids: Record<string, string> = {};
  const law_hashes: Record<string, string | null> = {};

  // (1) Schema check; (4) duplicate substrate_tag; (5) self-consistent body_hash
  for (const env of envelopes) {
    if (env.schema !== ENVELOPE_SCHEMA) {
      conflicts.push({ kind: "schema_mismatch", substrate: env.substrate_tag, got: env.schema });
    }
    if (env.substrate_tag in body_hashes) {
      conflicts.push({ kind: "duplicate_substrate_tag", tag: env.substrate_tag });
    }
    body_hashes[env.substrate_tag] = env.body_hash;
    envelope_ids[env.substrate_tag] = env.envelope_id;
    law_hashes[env.substrate_tag] = env.law_hash ?? null;

    if (env.body !== undefined) {
      const bytes = encodeCanonical(env.body);
      const recomputed = await multihashSha256(bytes);
      if (recomputed !== env.body_hash) {
        conflicts.push({
          kind: "self_inconsistent_body_hash",
          substrate: env.substrate_tag,
          claimed: env.body_hash,
          recomputed,
        });
      }
    }
  }

  // (2) body_hash agreement across witnesses
  const tags = Object.keys(body_hashes);
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const ti = tags[i];
      const tj = tags[j];
      if (body_hashes[ti] !== body_hashes[tj]) {
        conflicts.push({
          kind: "body_hash_divergence",
          between: [ti, tj],
          values: [body_hashes[ti], body_hashes[tj]],
        });
      }
    }
  }

  // (3) envelope_id uniqueness (distinct substrate_tag implies distinct envelope_id)
  const idToTag: Record<string, string> = {};
  for (const [tag, id] of Object.entries(envelope_ids)) {
    if (id in idToTag) {
      conflicts.push({ kind: "envelope_id_collision", substrates: [idToTag[id], tag] });
    } else {
      idToTag[id] = tag;
    }
  }

  const verdict: Verdict = {
    type: "SubstrateCourtVerdict",
    schema: "trinity.substrate-court.v0.1",
    witnesses_count: envelopes.length,
    agreement: conflicts.length === 0,
    body_hashes,
    envelope_ids,
    law_hashes,
    conflicts,
  };

  console.log(JSON.stringify(verdict, null, 2));
  Deno.exit(verdict.agreement ? 0 : 1);
}
