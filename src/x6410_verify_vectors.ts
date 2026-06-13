// src/x6410_verify_vectors.ts — cross-substrate canon-vector verifier
// position: 6/41 → harmony(6) × foundation(4) = vector verification
// placement_policy: axis
// intent: verify canon FQDN and SHA-256 vectors
// maturity: active
// skill_safe: yes-readonly
//
// Cross-substrate canon-vector verifier.
// Reads fixtures/canon-vectors.json and runs the local TS impl against
// each vector. Other substrates can implement an equivalent verifier
// (Rust/cargo, Python, etc.) — the JSON file is the oracle.
//
// Exit code 0 = all vectors pass; 1 = any drift.

import { fqdnPrefix, sha256Hex } from "./x4010_hash.ts";

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

const VECTOR_PATH = new URL("../fixtures/canon-vectors.json", import.meta.url);

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

console.log(`canon-vectors: ${pass}/${file.vectors.length} passed (trinity)`);

// --cross-liquid: drive liquid's calculateFqdnHash (via liquid/tools/fqdn_hash.ts)
// against the SAME oracle, so liquid's FQDN naming cannot silently drift from
// the swarm convention. The oracle stays single-source here; liquid is treated
// as the system-under-test (the phi-fixture pattern: liquid exposes a tool,
// trinity drives it). Skips gracefully when the liquid submodule is absent.
if (Deno.args.includes("--cross-liquid")) {
  const liquidTool = new URL(
    "../liquid/tools/fqdn_hash.ts",
    import.meta.url,
  );
  let present = true;
  try {
    await Deno.stat(liquidTool);
  } catch {
    present = false;
  }
  if (!present) {
    console.log("canon-vectors: liquid submodule absent — cross-check skipped");
  } else {
    let lpass = 0;
    const lfailures: string[] = [];
    for (const v of file.vectors) {
      const b64 = btoa(
        String.fromCharCode(...new TextEncoder().encode(v.input)),
      );
      const { code, stdout, stderr } = await new Deno.Command("deno", {
        args: ["run", liquidTool.pathname, b64],
        stdout: "piped",
        stderr: "piped",
      }).output();
      const got = new TextDecoder().decode(stdout).trim();
      if (code === 0 && got === v.fqdn_prefix) {
        lpass++;
      } else {
        lfailures.push(
          `  ✗ ${v.name}: liquid got "${got}" (exit ${code}${
            code !== 0 ? ", " + new TextDecoder().decode(stderr).trim() : ""
          }); oracle expects ${v.fqdn_prefix}`,
        );
      }
    }
    if (lfailures.length > 0) {
      console.error(
        `canon-vectors: ${lfailures.length} liquid DRIFT, ${lpass} agreed`,
      );
      for (const f of lfailures) console.error(f);
      Deno.exit(1);
    }
    console.log(
      `canon-vectors: ${lpass}/${file.vectors.length} agreed (liquid ↔ oracle)`,
    );
  }
}
