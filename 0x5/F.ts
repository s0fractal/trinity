#!/usr/bin/env -S deno run --allow-all
// 0x5/F.ts — apply (SPORE Primitive)
// position: 5/F → action_frontier

import { SporeApplyBackend } from "../liquid/00_core/pipe/spore_apply_backend.ts";

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
    const result = await SporeApplyBackend.apply(mutatorHash, stateHash, inputHashes);
    const payload = {
      type: "spore_apply",
      action: "apply",
      position: "5/F",
      mutator: mutatorHash,
      state: stateHash,
      inputs: inputHashes,
      output: result.output_hash,
      receipt: result.receipt,
    };
    console.log(JSON.stringify(payload));
    Deno.exit(0);
  } catch (e: any) {
    const payload = {
      type: "error",
      message: e.message,
      position: "5/F"
    };
    console.log(JSON.stringify(payload));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
