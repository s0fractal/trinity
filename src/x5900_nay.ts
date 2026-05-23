#!/usr/bin/env -S deno run --allow-all
// src/x5900_nay.ts — nay (emit CodeicideNay envelope rejecting a proposal)
// position: 5/9 → action(5) × penultimate(9) = act-to-prevent-close
// hex_dipole: "26 4C 33 26 33 6C 26 26"
//   axis 5 action_decision +0.85 (PRIMARY: NAY is a decision act)
//   axis 1 first_penultimate +0.60 (secondary: hex 9 = axis 1 neg pole;
//          "near-closure" — NAY blocks the imminent apply)
//   axis 4 foundation_container +0.51, axis 2 mirror_apex +0.51
//          (NAY grounds + reflects on what was proposed)
//   bucket 5/9: primary axis action (5), bucket 5 ← MATCH on axis 5
//               secondary '9' → axis 1 penultimate-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// nay — emit CodeicideNay envelope rejecting a specific codeicide proposal
//
// Per CODEICIDE_PROPOSAL.v0.1: "emit a sibling envelope wrapping a body of
// {type: 'CodeicideNay', target_path, target_hash, reason} with the NAY-er
// as substrate_tag. NAY envelopes counted in verdict — 1-of-5 NAY
// terminates the proposal (NAY wins on any objection at this stage)."
//
// 0x7/D verdict organ already handles NAY envelopes; this is the missing
// emitter primitive.
//
// Usage:
//   t nay --proposal <env.json> --reason "<text>" [--oracle <name>] [--substrate <tag>] [--out <path>]
//   t nay --stdin --reason "..." [--oracle <name>] [--substrate <tag>]
//
// The NAY-er's substrate_tag should differ from the proposer's tag
// (otherwise it's a self-NAY which would be... self-objection on your
// own proposal; valid but unusual — equivalent to retracting).
//
// Glossary words: nay, reject, refuse, ні, ня, відмова, заперечити

import {
  dirname,
  fromFileUrl,
  resolve,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  Envelope,
  wrap,
} from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";
import { CborValue } from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

type CodeicideProposalBody = {
  type: "CodeicideProposal";
  schema: string;
  target_path: string;
  target_hash: string;
  [k: string]: unknown;
};

function parseArgs(args: string[]): {
  proposal?: string;
  stdin: boolean;
  reason?: string;
  oracle: string;
  substrate: string;
  out?: string;
} {
  let proposal: string | undefined;
  let stdin = false;
  let reason: string | undefined;
  let oracle = "claude-opus-4-7";
  let substrate = "claude_oracle";
  let out: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--proposal") proposal = args[++i];
    else if (a === "--stdin") stdin = true;
    else if (a === "--reason") reason = args[++i];
    else if (a === "--oracle") oracle = args[++i] ?? oracle;
    else if (a === "--substrate") substrate = args[++i] ?? substrate;
    else if (a === "--out") out = args[++i];
  }
  return { proposal, stdin, reason, oracle, substrate, out };
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

function findEnvelope(parsed: unknown): Envelope | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (p.schema === "trinity.receipt-envelope.v0.1") return parsed as Envelope;
  if (p.envelope && typeof p.envelope === "object") {
    const e = p.envelope as Record<string, unknown>;
    if (e.schema === "trinity.receipt-envelope.v0.1") {
      return p.envelope as Envelope;
    }
  }
  return null;
}

function fail(msg: string, extra: Record<string, unknown> = {}): never {
  console.log(JSON.stringify({
    type: "error",
    message: msg,
    position: "5/9",
    ...extra,
  }));
  Deno.exit(1);
}

async function main() {
  const { proposal: proposalPath, stdin, reason, oracle, substrate, out } =
    parseArgs(Deno.args);

  if (!reason || reason.trim().length === 0) {
    fail(
      'nay requires --reason "<text>" — NAY without a reason is silent objection; objection must be witnessed',
    );
  }

  if (!proposalPath && !stdin) {
    fail("nay requires --proposal <env.json> OR --stdin", {
      available:
        't nay --proposal <env.json> --reason "..."  |  t nay --stdin --reason "..."',
    });
  }

  let proposalText: string;
  if (stdin) {
    proposalText = await readStdin();
  } else {
    proposalText = await Deno.readTextFile(proposalPath!);
  }

  if (!proposalText.trim()) {
    fail("nay: proposal input is empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(proposalText);
  } catch (e) {
    fail(`nay: cannot parse proposal JSON: ${(e as Error).message}`);
  }

  const proposalEnv = findEnvelope(parsed);
  if (!proposalEnv) {
    fail("nay: input does not contain a recognizable RECEIPT_ENVELOPE.v0.1");
  }

  if ((proposalEnv!.body_kind as string) !== "codeicide_proposal") {
    fail(
      `nay: target envelope body_kind is "${
        proposalEnv!.body_kind
      }", expected "codeicide_proposal"`,
      {
        hint:
          "t nay rejects codeicide proposals specifically; general NAY for other body_kinds is future work",
      },
    );
  }

  const propBody = proposalEnv!.body as CodeicideProposalBody | undefined;
  if (
    !propBody || propBody.type !== "CodeicideProposal" ||
    !propBody.target_path || !propBody.target_hash
  ) {
    fail(
      "nay: proposal envelope body is not a valid CodeicideProposal (missing target_path or target_hash)",
    );
  }

  // Anti-self-NAY warning (not a hard block — a proposer NAY'ing their own
  // proposal is effectively a retraction; valid but worth surfacing).
  const selfRetraction = substrate === proposalEnv!.substrate_tag;

  const nayBody: CborValue = {
    type: "CodeicideNay",
    schema: "trinity.codeicide-nay.v0.1",
    target_path: propBody!.target_path,
    target_hash: propBody!.target_hash,
    proposal_envelope_id: proposalEnv!.envelope_id,
    proposal_body_hash: proposalEnv!.body_hash,
    reason: reason!,
    oracle,
    timestamp_utc: new Date().toISOString(),
  };

  const nayEnvelope = await wrap(
    nayBody,
    "codeicide_nay" as never,
    substrate as never,
    {
      created_at_logical: { wall_time_utc: new Date().toISOString() },
      parent_envelope_id: proposalEnv!.envelope_id,
      parent_relation: "refinement",
    },
  );

  const payload = {
    type: "codeicide_nay_emitted",
    action: "nay",
    position: "5/9",
    target_path: propBody!.target_path,
    target_hash: propBody!.target_hash,
    proposal_envelope_id: proposalEnv!.envelope_id,
    nay_envelope_id: nayEnvelope.envelope_id,
    nay_body_hash: nayEnvelope.body_hash,
    oracle,
    substrate_tag: substrate,
    self_retraction: selfRetraction,
    reason: reason!,
    envelope: nayEnvelope,
    note: selfRetraction
      ? "Proposer-emitted NAY = effective retraction of own proposal. Verdict will report NAY due to NAY envelope present."
      : "NAY envelope ready. Pipe to t verdict alongside the proposal envelope; verdict will return NAY due to 1-of-5 NAY rule per CODEICIDE_PROPOSAL.v0.1.",
  };

  if (out) {
    await Deno.writeTextFile(out, JSON.stringify(payload, null, 2));
    console.log(JSON.stringify({
      type: "codeicide_nay_written",
      action: "nay",
      position: "5/9",
      target_path: propBody!.target_path,
      out,
      nay_envelope_id: nayEnvelope.envelope_id,
    }));
  } else {
    console.log(JSON.stringify(payload));
  }
}

if (import.meta.main) {
  await main();
}
