// envelope-bitcoin-anchor-v0 — Merkle-root + inclusion-proof computation
// over RECEIPT_ENVELOPE.v1.0 envelopes.
//
// Does NOT inscribe. Emits an EnvelopeAnchorPayload that describes what
// would be inscribed. See ../SPEC.md.

const ENVELOPE_SCHEMA = "trinity.receipt-envelope.v0.1";
const ANCHOR_SCHEMA = "trinity.envelope-anchor.v0.1";

type Envelope = {
  schema: string;
  envelope_id: string;
  body_hash: string;
  substrate_tag: string;
  body_kind: string;
};

type RejectedLeaf = {
  envelope_id: string | null;
  reason: "duplicate" | "wrong_schema" | "malformed";
  detail?: string;
};

export type AnchorPayload = {
  type: "EnvelopeAnchorPayload";
  schema: typeof ANCHOR_SCHEMA;
  protocol: "trinity-envelope-anchor";
  version: "0.1";
  leaf_count: number;
  leaves: { envelope_id: string; index: number }[];
  merkle_root: string;
  inclusion_proofs: {
    envelope_id: string;
    index: number;
    siblings: string[];
    directions: ("L" | "R")[];
  }[];
  inscription_ready: {
    method:
      | "placeholder"
      | "bitcoin-op-return"
      | "bitcoin-witness"
      | "ipfs-cid";
    payload_hex: string;
    payload_len_bytes: number;
    anchor_target: "merkle_root";
  };
  rejected: RejectedLeaf[];
};

// ────────────────────────────────────────────────────────────────────────
// Hex / hash helpers
// ────────────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("hex length must be even");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

async function leafHash(envelope_id: string): Promise<Uint8Array> {
  // envelope_id is a multihash hex string ("1220" + 64 hex). Hash its raw bytes.
  return sha256(hexToBytes(envelope_id));
}

async function nodeHash(
  left: Uint8Array,
  right: Uint8Array,
): Promise<Uint8Array> {
  const combined = new Uint8Array(left.length + right.length);
  combined.set(left, 0);
  combined.set(right, left.length);
  return sha256(combined);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// Merkle tree construction
// ────────────────────────────────────────────────────────────────────────

async function buildMerkleTree(leaves: Uint8Array[]): Promise<Uint8Array[][]> {
  // Returns levels[0] = leaves (already hashed), ..., levels[N] = [root].
  if (leaves.length === 0) {
    throw new Error("anchor: empty leaf set");
  }
  const levels: Uint8Array[][] = [leaves.slice()];
  while (levels[levels.length - 1].length > 1) {
    const prev = levels[levels.length - 1];
    const next: Uint8Array[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = i + 1 < prev.length ? prev[i + 1] : prev[i]; // duplicate last on odd
      next.push(await nodeHash(left, right));
    }
    levels.push(next);
  }
  return levels;
}

function inclusionProof(
  levels: Uint8Array[][],
  leafIndex: number,
): { siblings: string[]; directions: ("L" | "R")[] } {
  const siblings: string[] = [];
  const directions: ("L" | "R")[] = [];
  let i = leafIndex;
  for (let lvl = 0; lvl < levels.length - 1; lvl++) {
    const level = levels[lvl];
    const siblingIdx = i % 2 === 0
      ? Math.min(i + 1, level.length - 1) // duplicate-last for odd
      : i - 1;
    siblings.push(bytesToHex(level[siblingIdx]));
    directions.push(i % 2 === 0 ? "R" : "L"); // direction sibling is on
    i = Math.floor(i / 2);
  }
  return { siblings, directions };
}

export async function verifyInclusion(
  envelope_id: string,
  siblings: string[],
  directions: ("L" | "R")[],
  expected_root: string,
): Promise<boolean> {
  let current = await leafHash(envelope_id);
  for (let i = 0; i < siblings.length; i++) {
    const sibling = hexToBytes(siblings[i]);
    if (directions[i] === "R") {
      current = await nodeHash(current, sibling);
    } else {
      current = await nodeHash(sibling, current);
    }
  }
  return bytesToHex(current) === expected_root;
}

// ────────────────────────────────────────────────────────────────────────
// Main anchor computation
// ────────────────────────────────────────────────────────────────────────

export async function computeAnchor(
  envelopes: Envelope[],
): Promise<AnchorPayload> {
  const rejected: RejectedLeaf[] = [];

  // Filter to v1.0 schema. Reject wrong schema.
  const schemaFiltered: Envelope[] = [];
  for (const env of envelopes) {
    if (!env || typeof env !== "object") {
      rejected.push({
        envelope_id: null,
        reason: "malformed",
        detail: "not an object",
      });
      continue;
    }
    if (env.schema !== ENVELOPE_SCHEMA) {
      rejected.push({
        envelope_id: env.envelope_id ?? null,
        reason: "wrong_schema",
        detail: `expected ${ENVELOPE_SCHEMA}; got ${env.schema}`,
      });
      continue;
    }
    if (
      typeof env.envelope_id !== "string" || !env.envelope_id.startsWith("1220")
    ) {
      rejected.push({
        envelope_id: env.envelope_id ?? null,
        reason: "malformed",
        detail:
          "envelope_id must be a sha256 multihash hex string starting with 1220",
      });
      continue;
    }
    schemaFiltered.push(env);
  }

  // Deduplicate by envelope_id. Two duplicates → both rejected (fail-loud).
  const counts = new Map<string, number>();
  for (const env of schemaFiltered) {
    counts.set(env.envelope_id, (counts.get(env.envelope_id) ?? 0) + 1);
  }
  const accepted: Envelope[] = [];
  for (const env of schemaFiltered) {
    if ((counts.get(env.envelope_id) ?? 0) > 1) {
      rejected.push({
        envelope_id: env.envelope_id,
        reason: "duplicate",
        detail: `appears ${counts.get(env.envelope_id)}x in input`,
      });
      counts.set(env.envelope_id, 0); // emit once per duplicate group
    } else if ((counts.get(env.envelope_id) ?? 0) === 1) {
      accepted.push(env);
    }
  }

  if (accepted.length === 0) {
    throw new Error("anchor: no acceptable envelopes after filtering");
  }

  // Canonical-sort by envelope_id (lex) for reproducibility.
  accepted.sort((a, b) => a.envelope_id.localeCompare(b.envelope_id));

  // Build leaf hashes.
  const leafHashes = await Promise.all(
    accepted.map((e) => leafHash(e.envelope_id)),
  );

  // Build tree.
  const levels = await buildMerkleTree(leafHashes);
  const root = levels[levels.length - 1][0];
  const rootHex = bytesToHex(root);

  // Inclusion proofs for every leaf.
  const inclusion_proofs = accepted.map((env, idx) => {
    const proof = inclusionProof(levels, idx);
    return {
      envelope_id: env.envelope_id,
      index: idx,
      siblings: proof.siblings,
      directions: proof.directions,
    };
  });

  // Placeholder inscription payload: just the root bytes hex.
  // Real method choice (OP_RETURN, etc.) is operational.
  const payload_hex = rootHex;

  return {
    type: "EnvelopeAnchorPayload",
    schema: ANCHOR_SCHEMA,
    protocol: "trinity-envelope-anchor",
    version: "0.1",
    leaf_count: accepted.length,
    leaves: accepted.map((env, idx) => ({
      envelope_id: env.envelope_id,
      index: idx,
    })),
    merkle_root: rootHex,
    inclusion_proofs,
    inscription_ready: {
      method: "placeholder",
      payload_hex,
      payload_len_bytes: payload_hex.length / 2,
      anchor_target: "merkle_root",
    },
    rejected,
  };
}

// ────────────────────────────────────────────────────────────────────────
// CLI entry point
// ────────────────────────────────────────────────────────────────────────

async function readEnvelopes(args: string[]): Promise<Envelope[]> {
  const paths: string[] = [];
  let useStdin = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--stdin") useStdin = true;
    else if (a === "--envelope") paths.push(args[++i]);
    else if (!a.startsWith("--")) paths.push(a);
  }

  const envs: Envelope[] = [];

  if (useStdin) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const buf = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      buf.set(c, off);
      off += c.length;
    }
    const text = new TextDecoder().decode(buf).trim();
    // Accept JSON array OR newline-delimited JSON.
    if (text.startsWith("[")) {
      for (const e of JSON.parse(text)) envs.push(e as Envelope);
    } else {
      for (const line of text.split("\n").filter((l) => l.trim())) {
        envs.push(JSON.parse(line) as Envelope);
      }
    }
  }

  for (const p of paths) {
    const text = await Deno.readTextFile(p);
    envs.push(JSON.parse(text.trim()) as Envelope);
  }

  return envs;
}

if (import.meta.main) {
  const envs = await readEnvelopes(Deno.args);
  if (envs.length === 0) {
    console.error(
      "anchor: no envelopes provided (use --envelope <path> or --stdin)",
    );
    Deno.exit(2);
  }
  try {
    const payload = await computeAnchor(envs);
    console.log(JSON.stringify(payload, null, 2));
    Deno.exit(0);
  } catch (e) {
    console.error(`anchor: ${(e as Error).message}`);
    Deno.exit(1);
  }
}
