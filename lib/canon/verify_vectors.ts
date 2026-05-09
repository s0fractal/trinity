/**
 * Cross-substrate canon-vector verifier.
 *
 * Reads fixtures/canon-vectors.json and runs the local TS impl against
 * each vector. Other substrates can implement an equivalent verifier
 * (Rust/cargo, Python, etc.) — the JSON file is the oracle.
 *
 * Exit code 0 = all vectors pass; 1 = any drift.
 */

import { fqdnPrefix, sha256Hex } from "./hash.ts";

interface Vector {
  name: string;
  input: string;
  sha256: string;
  fqdn_prefix: string;
}

interface VectorFile {
  version: string;
  spec: string;
  vectors: Vector[];
}

const VECTOR_PATH = new URL("../../fixtures/canon-vectors.json", import.meta.url);

const text = await Deno.readTextFile(VECTOR_PATH);
const file = JSON.parse(text) as VectorFile;

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const v of file.vectors) {
  const sha = await sha256Hex(v.input);
  const fq = await fqdnPrefix(v.input);
  const ok = sha === v.sha256 && fq === v.fqdn_prefix;
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push(
      `  ✗ ${v.name}: got sha256=${sha}, fqdn=${fq}; expected sha256=${v.sha256}, fqdn=${v.fqdn_prefix}`,
    );
  }
}

if (fail > 0) {
  console.error(`canon-vectors: ${fail} failed, ${pass} passed`);
  for (const f of failures) console.error(f);
  Deno.exit(1);
}

console.log(`canon-vectors: ${pass}/${file.vectors.length} passed`);
