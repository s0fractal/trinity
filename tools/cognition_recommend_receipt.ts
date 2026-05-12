import { sha256Hex } from "../lib/canon/hash.ts";

/**
 * cognition_recommend_receipt
 * 
 * Emits a formal receipt of the latest cognitive recommendation cycle.
 * This provides a deterministic bridge from "analysis" to "ranked action".
 */

const REC_PATH = "reports/cognition/recommendation.latest.json";
const RECEIPT_PATH = "reports/cognition/recommendation.receipt.json";

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
    top_signal: descriptor.recommendations?.[0] ? {
      repo: descriptor.recommendations[0].repo,
      action: descriptor.recommendations[0].action,
      pressure: descriptor.recommendations[0].pressure,
    } : null,
    status: "EMITTED",
  };

  await Deno.writeTextFile(RECEIPT_PATH, JSON.stringify(receipt, null, 2));
  console.log(`✅ Recommendation receipt written to ${RECEIPT_PATH}`);
  console.log(`   hash: ${receipt.recommendation_hash}`);
}

if (import.meta.main) {
  main();
}
