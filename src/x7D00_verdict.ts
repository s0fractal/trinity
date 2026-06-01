#!/usr/bin/env -S deno run --allow-all
// src/x7D00_verdict.ts — verdict (court over codeicide proposal + cowitness chain)
// position: 7/D → completion(7) × decision(D) = decisive completion of governance flow
// maturity: active
// skill_safe: yes
// hex_dipole: "26 26 26 33 33 4C 26 6C"
//   completion_frontier+0.85 (PRIMARY: verdict completes a governance loop)
//   action_decision+0.60 (verdict IS the decision)
//   foundation_container+0.30, triangle_build+0.30
//     (verdict grounds the proposal in a decision; triangulates witness chain)
//   bucket 7/D: primary axis completion (7), bucket 7 ← MATCH on axis 7
//               secondary 'D' → axis 5 decision-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// verdict — apply CODEICIDE_PROPOSAL.v0.1 quorum rules over envelopes
//
// Usage:
//   t verdict <env1.json> [env2.json ...]
//   t verdict --stdin       (newline-delimited envelope JSONs OR JSON array)
//
// Reads N envelopes. Bins by body type (CodeicideProposal vs
// CodeicideNay). For all envelopes claiming the same target:
//   - Verify all proposal envelopes share body_hash (same proposal body)
//   - Collect AYE signatures (witness_chain entries) across proposal envs
//   - Collect NAY signatures from CodeicideNay envs
//   - Reject self-AYE: any signature whose substrate_tag/oracle matches the proposer
//   - Verdict: AYE if AYE count >= quorum.threshold AND NAY count == 0;
//              NAY if NAY count >= 1 OR proposer self-AYE'd;
//              PENDING otherwise
//
// Emits CodeicideVerdict payload.
//
// Governance flow reference:
//   contracts/GOVERNANCE_FLOW.v0.md

import { coWitness, type Envelope } from "./x4012_receipt_envelope.ts";
import {
  type CborValue,
  encodeCanonical,
  multihashSha256,
} from "./x4012_receipt_envelope.ts";

type CodeicideProposalBody = {
  type: "CodeicideProposal";
  schema: string;
  target_path: string;
  target_hash: string;
  action: string;
  reason: string;
  quorum: { threshold: number; out_of: number };
  [k: string]: unknown;
};

type CodeicideNayBody = {
  type: "CodeicideNay";
  target_path: string;
  target_hash: string;
  reason: string;
  [k: string]: unknown;
};

type Verdict = {
  type: "CodeicideVerdict";
  schema: "trinity.codeicide-verdict.v0.1";
  target_path: string;
  target_hash: string;
  proposal_body_hash: string;
  proposer_substrate_tag: string;
  verdict: "AYE" | "NAY" | "PENDING";
  agreement: boolean;
  aye_signers: { oracle: string; substrate_tag: string }[];
  nay_signers: { oracle: string; substrate_tag: string; reason: string }[];
  quorum: { threshold: number; out_of: number };
  reasons: string[];
};

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
    // Some emit payloads wrap envelope in {type:"codeicide_proposal_emitted", envelope: {...}};
    // accept either bare envelope or wrapped.
    const parsed = JSON.parse(text);
    if (parsed.schema === "trinity.receipt-envelope.v0.1") {
      envs.push(parsed as Envelope);
    } else if (
      parsed.envelope &&
      parsed.envelope.schema === "trinity.receipt-envelope.v0.1"
    ) {
      envs.push(parsed.envelope as Envelope);
    } else {
      throw new Error(`verdict: ${p} does not contain a recognizable envelope`);
    }
  }

  return envs;
}

if (import.meta.main) {
  let envs: Envelope[];
  try {
    envs = await readEnvelopes(Deno.args);
  } catch (e) {
    console.log(JSON.stringify({
      type: "error",
      message: `verdict: ${(e as Error).message}`,
      position: "7/D",
    }));
    Deno.exit(1);
  }

  if (envs.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message:
        "verdict requires at least one envelope (proposal + 0+ cowitnesses, or NAY envelope)",
      position: "7/D",
      available: "t verdict <env1.json> [env2.json ...] | --stdin",
    }));
    Deno.exit(1);
  }

  // Bin by body type. Verify body_hash consistency for each kind.
  const proposalEnvs: Envelope[] = [];
  const nayEnvs: Envelope[] = [];
  const malformed: { reason: string; envelope_id?: string }[] = [];

  for (const env of envs) {
    if (env.schema !== "trinity.receipt-envelope.v0.1") {
      malformed.push({
        envelope_id: env.envelope_id,
        reason: "wrong envelope schema",
      });
      continue;
    }
    const body = env.body as
      | CodeicideProposalBody
      | CodeicideNayBody
      | undefined;
    if (!body || typeof body !== "object" || !("type" in body)) {
      malformed.push({
        envelope_id: env.envelope_id,
        reason: "missing body or body.type",
      });
      continue;
    }
    const bodyType = (body as any).type;
    if (bodyType === "CodeicideProposal") {
      // Sanity: re-hash body and verify against envelope.body_hash
      const recomputed = await multihashSha256(
        encodeCanonical(body as unknown as CborValue),
      );
      if (recomputed !== env.body_hash) {
        malformed.push({
          envelope_id: env.envelope_id,
          reason: "body_hash inconsistent with body",
        });
        continue;
      }
      proposalEnvs.push(env);
    } else if (bodyType === "CodeicideNay") {
      nayEnvs.push(env);
    } else {
      malformed.push({
        envelope_id: env.envelope_id,
        reason: `unsupported body type: ${bodyType}`,
      });
    }
  }

  if (proposalEnvs.length === 0) {
    console.log(JSON.stringify({
      type: "error",
      message: "verdict: no valid CodeicideProposal envelope found in inputs",
      position: "7/D",
      malformed,
    }));
    Deno.exit(1);
  }

  // All proposal envelopes must share body_hash (same proposal under different witness chains).
  const proposalBodyHashes = new Set(proposalEnvs.map((e) => e.body_hash));
  if (proposalBodyHashes.size > 1) {
    console.log(JSON.stringify({
      type: "error",
      message:
        "verdict: multiple distinct proposal bodies; cannot adjudicate across different proposals",
      position: "7/D",
      distinct_body_hashes: [...proposalBodyHashes],
    }));
    Deno.exit(1);
  }

  const canonicalProposal = proposalEnvs[0];
  const canonicalBody = canonicalProposal.body as CodeicideProposalBody;
  const proposalBodyHash = canonicalProposal.body_hash;
  const proposerTag = canonicalProposal.substrate_tag;
  const quorum = canonicalBody.quorum ?? { threshold: 3, out_of: 5 };

  // Collect AYE signatures across all proposal envelopes' witness chains.
  // Dedup by oracle (an oracle signing twice still counts once).
  const ayeMap = new Map<string, { oracle: string; substrate_tag: string }>();
  let selfAyeDetected = false;
  for (const env of proposalEnvs) {
    for (const w of env.witness_chain ?? []) {
      if (w.substrate_tag === proposerTag) {
        selfAyeDetected = true;
      }
      if (!ayeMap.has(w.oracle)) {
        ayeMap.set(w.oracle, {
          oracle: w.oracle,
          substrate_tag: w.substrate_tag,
        });
      }
    }
  }

  // Collect NAYs.
  const nayList = nayEnvs.map((env) => {
    const body = env.body as CodeicideNayBody;
    return {
      oracle: env.witness_chain?.[0]?.oracle ?? "unknown",
      substrate_tag: env.substrate_tag,
      reason: body.reason ?? "(no reason given)",
    };
  });

  // Apply verdict rules.
  const reasons: string[] = [];
  let verdict: "AYE" | "NAY" | "PENDING";

  if (selfAyeDetected) {
    verdict = "NAY";
    reasons.push(
      "self-AYE detected: proposer substrate_tag appears in witness_chain",
    );
  } else if (nayList.length > 0) {
    verdict = "NAY";
    reasons.push(`${nayList.length} explicit NAY envelope(s) present`);
  } else if (ayeMap.size >= quorum.threshold) {
    verdict = "AYE";
    reasons.push(
      `AYE count ${ayeMap.size} >= quorum threshold ${quorum.threshold}`,
    );
  } else {
    verdict = "PENDING";
    reasons.push(
      `AYE count ${ayeMap.size} < quorum threshold ${quorum.threshold}; no NAY`,
    );
  }

  const result: Verdict = {
    type: "CodeicideVerdict",
    schema: "trinity.codeicide-verdict.v0.1",
    target_path: canonicalBody.target_path,
    target_hash: canonicalBody.target_hash,
    proposal_body_hash: proposalBodyHash,
    proposer_substrate_tag: proposerTag,
    verdict,
    agreement: verdict === "AYE",
    aye_signers: [...ayeMap.values()],
    nay_signers: nayList,
    quorum,
    reasons,
  };

  const payload = {
    type: "codeicide_verdict",
    action: "verdict",
    position: "7/D",
    target_path: canonicalBody.target_path,
    result,
  };

  console.log(JSON.stringify(payload));
  Deno.exit(verdict === "AYE" ? 0 : 1);
}
