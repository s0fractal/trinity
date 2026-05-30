#!/usr/bin/env -S deno run -A
// src/x5E00_cognition_recommend_receipt.ts — cognition_recommend_receipt (Action + Harmony-pair)
// position: 5/E → action(5) × harmony-pair(E)
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 26 26 26 6C 59 26"
// placement_policy: axis
//
// cognition_recommend_receipt.ts — convert recommend output to a receipt

import { sha256Hex } from "./x4010_hash.ts";

/**
 * cognition_recommend_receipt
 *
 * Emits a formal receipt of the latest cognitive recommendation cycle.
 * This provides a deterministic bridge from "analysis" to "ranked action".
 */

const REC_PATH = "src/x5288_cognition_recommendation.latest.myc.json";
const RECEIPT_PATH = "src/x5E88_cognition_recommendation.receipt.myc.json";

async function main() {
  let descriptorText: string;
  try {
    descriptorText = await Deno.readTextFile(REC_PATH);
  } catch (e) {
    console.error(`🚨 cannot read ${REC_PATH}: ${e}`);
    Deno.exit(1);
  }

  const descriptor = JSON.parse(descriptorText);
  const hash = await sha256Hex(descriptorText);

  const receipt = {
    type: "COGNITIVE_RECOMMENDATION_RECEIPT",
    version: "0.1",
    recommendation_hash: `h.${hash.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    top_signal: descriptor.recommendations?.[0]
      ? {
        repo: descriptor.recommendations[0].repo,
        action: descriptor.recommendations[0].action,
        pressure: descriptor.recommendations[0].pressure,
      }
      : null,
    status: "EMITTED",
  };

  await Deno.writeTextFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2));
  console.log(`✅ Recommendation receipt written to ${RECEIPT_PATH}`);
  console.log(`   hash: ${receipt.recommendation_hash}`);
}

if (import.meta.main) {
  main();
}
