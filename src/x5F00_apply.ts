#!/usr/bin/env -S deno run --allow-all
// src/x5F00_apply.ts — apply (SPORE Primitive)
// position: 5/F → action_frontier
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 40 33 40 6C 40 59"
// placement_policy: axis
//
// UNGATED BACKEND (codex x6d00_954417 P2): this runs with --allow-all and executes
// the Liquid SPORE backend DIRECTLY — with no warrant admission, pre-state binding,
// or transaction confinement. It produces a receipt (the EVIDENCE step of the
// proof-bearing loop), it is NOT authorized autonomous actuation. Until it is
// warrant-bound (action_grant + final proposal + pre-state + rollback), it is
// `yes-with-care`, surfaced as `ungated_backend` in affordances, and must never be
// advertised as safe autonomous action.

import { SporeApplyBackend } from "./x5F10_spore_apply_backend.ts";

async function main() {
  const args = Deno.args;

  if (args.length < 2) {
    const payload = {
      type: "error",
      message: "apply requires at least a mutatorHash and stateHash",
      position: "5/F",
      available: "t apply <mutatorHash> <stateHash> [inputHashes...]",
    };
    console.log(JSON.stringify(payload));
    Deno.exit(1);
  }

  const [mutatorHash, stateHash, ...inputHashes] = args;

  try {
    const result = await SporeApplyBackend.apply(
      mutatorHash,
      stateHash,
      inputHashes,
    );
    const payload = {
      type: "spore_apply",
      action: "apply",
      position: "5/F",
      protocol: result.protocol ?? "spore.v0",
      backend_kind: result.backend_kind ?? "unknown",
      simulation: result.simulation === true,
      receipt_kind: result.receipt_kind ?? "unknown",
      mutator: mutatorHash,
      state: stateHash,
      inputs: inputHashes,
      output: result.output_hash,
      note: result.note,
    };
    console.log(JSON.stringify(payload));
    Deno.exit(0);
  } catch (e: any) {
    const payload = {
      type: "error",
      message: e.message,
      position: "5/F",
    };
    console.log(JSON.stringify(payload));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
