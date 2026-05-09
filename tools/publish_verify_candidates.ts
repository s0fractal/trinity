import { calculateFqdnHash } from "../liquid/00_core/liquid_codec.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";

const CANDIDATES_FILE = "public-candidates/myc/process.ndjson";

interface CandidateRow {
  source_hash: string;
  source_path: string;
  target_fqdn: string;
  descriptor_type: string;
  publish_policy: string;
  redaction: string;
  status: string;
}

async function computeSha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function main() {
  console.log("🛡️  Verifying MYC Publication Candidates Membrane...\n");

  if (!(await exists(CANDIDATES_FILE))) {
    console.log("No candidates file found. Membrane secure.");
    return;
  }

  const text = await Deno.readTextFile(CANDIDATES_FILE);
  const lines = text.split("\n").filter((l) => l.trim());

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < lines.length; i++) {
    const row: CandidateRow = JSON.parse(lines[i]);
    console.log(`Verifying Candidate #${i + 1}: ${row.target_fqdn}`);

    if (!(await exists(row.source_path))) {
      console.error(`❌ FAULT: Source path does not exist (${row.source_path})`);
      failed++;
      continue;
    }

    const content = await Deno.readTextFile(row.source_path);
    
    // Check Payload Hash
    const actualSha256 = await computeSha256Hex(content);
    const expectedSha256 = row.source_hash.replace("sha256:", "");
    if (actualSha256 !== expectedSha256) {
      console.error(`❌ FAULT: SHA-256 Hash mismatch!`);
      console.error(`   Expected: ${expectedSha256}`);
      console.error(`   Actual:   ${actualSha256}`);
      failed++;
      continue;
    }

    // Check FQDN Geometric Integrity
    const expectedFqdnPrefix = await calculateFqdnHash(content);
    if (!row.target_fqdn.startsWith(`${expectedFqdnPrefix}.`)) {
      console.error(`❌ FAULT: FQDN Topological Drift!`);
      console.error(`   Expected prefix: ${expectedFqdnPrefix}`);
      console.error(`   Actual FQDN:     ${row.target_fqdn}`);
      failed++;
      continue;
    }

    console.log("✅ Cryptographic checks passed.");
    passed++;
  }

  console.log("\n========================================");
  console.log(`MEMBRANE AUDIT: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed > 0) {
    Deno.exit(1);
  }
}

main();
