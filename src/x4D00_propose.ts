#!/usr/bin/env -S deno run --allow-all
// src/x4D00_propose.ts — propose (codeicide proposal — reversible meta-ledger archival)
// position: 4/D → foundation(4) × decision(D) = foundational decisive grounding
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 33 26 6C 4C 33 33"
//   foundation_container+0.85 (PRIMARY: codeicide lays foundation of decision)
//   action_decision+0.60 (proposal IS a decision act)
//   triangle_build+0.30, harmony_emergence+0.30, completion_frontier+0.30
//     (proposal builds toward verdict; harmony emerges from chain; closes a thread)
//   bucket 4/D: primary axis foundation (4), bucket 4 ← MATCH on axis 4
//               secondary 'D' → axis 5 decision-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// propose — emit RECEIPT_ENVELOPE wrapping a CodeicideProposal body
//
// Usage:
//   t propose --target <path> --reason "<text>" [--quorum <N>] [--out <path>]
//   t propose --from <yaml-or-json> [--out <path>]
//
// Writes the proposal envelope to --out (default: stdout). Verifies
// target_path is not in the forbidden list before emitting. Computes
// target_hash from current file content.
//
// Per CODEICIDE_PROPOSAL.v0.1.md:
//   - target_path must exist and not be forbidden
//   - action is "ARCHIVE" in v0.1
//   - reason and evidence are required
//   - reversible_via is auto-populated
//   - self-AYE is prevented at verdict stage (this organ does not cowitness)
//
// Governance flow reference:
//   contracts/GOVERNANCE_FLOW.v0.md
//
// Glossary: propose, codeicide, archive-proposal, пропозиція, кодесайд

import {
  dirname,
  fromFileUrl,
  join,
  relative,
  resolve,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { wrap } from "../probes/receipt-envelope-encoder-v0/ts/envelope.ts";
import { CborValue } from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

// Forbidden path prefixes (per contract §"What can be proposed").
const FORBIDDEN_PREFIXES = [
  "omega/",
  "liquid/",
  "myc/",
  "src/x0100_dispatch.ts",
  "src/x0001_glossary.ndjson",
  "AGENTS.md",
  "SKILLS.md",
  "src/x88F0_agents_bootstrap.myc.md",
  "src/x8CF0_skills_bootstrap.myc.md",
  ".git/",
  ".gitmodules",
];

function isForbidden(relPath: string): { forbidden: boolean; reason?: string } {
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (relPath === prefix || relPath.startsWith(prefix)) {
      return {
        forbidden: true,
        reason: `path matches forbidden prefix '${prefix}'`,
      };
    }
  }
  return { forbidden: false };
}

async function fileHash(absPath: string): Promise<string> {
  const data = await Deno.readFile(absPath);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return "1220" + hex;
}

type ProposalInput = {
  target: string;
  reason: string;
  evidence?: string[];
  quorum?: { threshold: number; out_of: number };
  dwell?: { min_chord_cycles: number };
  falsifiers?: string[];
};

function parseArgs(args: string[]): {
  input: Partial<ProposalInput>;
  fromPath?: string;
  outPath?: string;
} {
  const input: Partial<ProposalInput> = {};
  let fromPath: string | undefined;
  let outPath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--target") input.target = args[++i];
    else if (a === "--reason") input.reason = args[++i];
    else if (a === "--evidence") {
      input.evidence ??= [];
      input.evidence.push(args[++i]);
    } else if (a === "--quorum") {
      const [t, o] = args[++i].split("/").map(Number);
      input.quorum = { threshold: t, out_of: o || 5 };
    } else if (a === "--dwell") {
      input.dwell = { min_chord_cycles: Number(args[++i]) };
    } else if (a === "--falsifier") {
      input.falsifiers ??= [];
      input.falsifiers.push(args[++i]);
    } else if (a === "--from") fromPath = args[++i];
    else if (a === "--out") outPath = args[++i];
  }
  return { input, fromPath, outPath };
}

async function main() {
  const { input, fromPath, outPath } = parseArgs(Deno.args);

  let proposalInput: ProposalInput;
  if (fromPath) {
    const text = await Deno.readTextFile(fromPath);
    proposalInput = JSON.parse(text) as ProposalInput;
  } else {
    if (!input.target || !input.reason) {
      console.log(JSON.stringify({
        type: "error",
        message:
          "propose requires --target <path> --reason <text> (or --from <json-path>)",
        position: "4/D",
      }));
      Deno.exit(1);
    }
    proposalInput = input as ProposalInput;
  }

  // Resolve and validate target.
  const targetAbs = resolve(ROOT, proposalInput.target);
  const targetRel = relative(ROOT, targetAbs);

  // Anti-escape: ensure resolved path stays within trinity root.
  if (targetRel.startsWith("..") || targetRel.startsWith("/")) {
    console.log(JSON.stringify({
      type: "error",
      message: `propose: target escapes trinity root: ${proposalInput.target}`,
      position: "4/D",
    }));
    Deno.exit(1);
  }

  const forbidden = isForbidden(targetRel);
  if (forbidden.forbidden) {
    console.log(JSON.stringify({
      type: "error",
      message: `propose: target is forbidden — ${forbidden.reason}`,
      position: "4/D",
      target: targetRel,
    }));
    Deno.exit(1);
  }

  // Verify target exists.
  try {
    const stat = await Deno.stat(targetAbs);
    if (!stat.isFile) {
      console.log(JSON.stringify({
        type: "error",
        message: `propose: target is not a file: ${targetRel}`,
        position: "4/D",
      }));
      Deno.exit(1);
    }
  } catch {
    console.log(JSON.stringify({
      type: "error",
      message: `propose: target does not exist: ${targetRel}`,
      position: "4/D",
    }));
    Deno.exit(1);
  }

  const target_hash = await fileHash(targetAbs);

  const body: CborValue = {
    type: "CodeicideProposal",
    schema: "trinity.codeicide-proposal.v0.1",
    target_path: targetRel,
    target_hash,
    action: "ARCHIVE",
    reason: proposalInput.reason,
    evidence: proposalInput.evidence ?? [],
    reversible_via:
      `mv archive/<timestamp>/${targetRel} ${targetRel}  (RESURRECT.sh in archive directory)`,
    falsifiers: proposalInput.falsifiers ?? [],
    quorum: proposalInput.quorum ?? { threshold: 3, out_of: 5 },
    dwell: proposalInput.dwell ?? { min_chord_cycles: 0 },
  };

  const envelope = await wrap(body, "codeicide_proposal" as never, "trinity", {
    created_at_logical: { wall_time_utc: new Date().toISOString() },
  });

  const payload = {
    type: "codeicide_proposal_emitted",
    action: "propose",
    position: "4/D",
    semantics:
      "ARCHIVE GOVERNANCE (reversible). NOT DELETION. NOT Omega's codeicide_law.",
    target_path: targetRel,
    target_hash,
    envelope_id: envelope.envelope_id,
    body_hash: envelope.body_hash,
    envelope,
    note:
      "Proposal emitted. Cowitness with `t cowitness`; gather quorum; then `t verdict` and `t apply-codeicide` if AYE. Target will be MOVED to archive/<ts>/ (not deleted); restorable via RESURRECT.sh.",
  };

  const out = JSON.stringify(payload);
  if (outPath) {
    await Deno.writeTextFile(outPath, out);
    console.log(JSON.stringify({
      type: "codeicide_proposal_written",
      action: "propose",
      position: "4/D",
      target_path: targetRel,
      out: outPath,
      envelope_id: envelope.envelope_id,
    }));
  } else {
    console.log(out);
  }
}

if (import.meta.main) {
  await main();
}
