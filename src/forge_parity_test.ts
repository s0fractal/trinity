import { assertEquals } from "jsr:@std/assert@^1";

import * as akPackage from "../packages/autonomy-kernel/mod.ts";
import * as akSource from "./x5C20_autonomy.ts";
import {
  encodeCanonical as encodeCanonicalPackage,
  toHex as toHexPackage,
} from "../packages/canonical-receipt/mod.ts";
import {
  type CborValue,
  encodeCanonical as encodeCanonicalProbe,
} from "../probes/receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const rustPairs = [
  {
    name: "agent ABI",
    packagePath: "packages/kuramoto-coherence/src/agent.rs",
    sourcePath: "omega/omega_v2/src/agent.rs",
    normalize: identity,
  },
  {
    name: "math LUT/kernel",
    packagePath: "packages/kuramoto-coherence/src/math.rs",
    sourcePath: "omega/omega_v2/src/math.rs",
    normalize: identity,
  },
  {
    name: "resonance kernel",
    packagePath: "packages/kuramoto-coherence/src/resonance.rs",
    sourcePath: "omega/omega_v2/src/resonance.rs",
    // The package deliberately strips omega's mythic module prose; executable
    // Rust must remain identical after that demystifying header is ignored.
    normalize: stripLeadingRustModuleDocs,
  },
];

function identity(text: string): string {
  return text;
}

function stripLeadingRustModuleDocs(text: string): string {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].startsWith("//!")) i++;
  while (i < lines.length && lines[i].trim() === "") i++;
  return lines.slice(i).join("\n");
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

Deno.test("forge parity — autonomy-kernel package matches trinity source policy", () => {
  const cases = [
    ["read"],
    ["format"],
    ["source_change"],
    ["fetch_public"],
    ["deploy"],
    ["spend"],
    ["mandate_edit"],
    ["unknown_xyz"],
    ["read", "deploy"],
  ];
  const at = { kind: "bitcoin_block", height: 1 } as const;

  for (const effects of cases) {
    const intent = { verb: "v", target: "t", effects };
    assertEquals(
      akPackage.classifyIntent(intent).cls,
      akSource.classifyIntent(intent).cls,
      `classifyIntent drift on ${JSON.stringify(effects)}`,
    );
    assertEquals(
      akPackage.admit(intent, null, at).reason_code,
      akSource.admit(intent, null, at).reason_code,
      `admit drift on ${JSON.stringify(effects)}`,
    );
  }
});

Deno.test("forge parity — canonical-receipt encoder matches receipt-envelope probe", () => {
  const cases: CborValue[] = [
    0,
    1,
    -1,
    1000,
    255,
    65535,
    "hello",
    "",
    true,
    false,
    null,
    [1, 2, 3],
    { b: 2, a: 1 },
    { nested: { z: 26, a: 1 }, list: [{ k: "v" }, { k: "w" }] },
  ];

  for (const value of cases) {
    assertEquals(
      toHexPackage(encodeCanonicalPackage(value)),
      toHexPackage(encodeCanonicalProbe(value)),
      `canonical CBOR drift on ${JSON.stringify(value)}`,
    );
  }
});

for (const pair of rustPairs) {
  Deno.test(`forge parity — kuramoto-coherence ${pair.name} matches omega source`, async () => {
    if (!(await exists(pair.sourcePath))) {
      console.warn(`[forge parity] ${pair.sourcePath} absent — skipped`);
      return;
    }
    const [packageText, sourceText] = await Promise.all([
      Deno.readTextFile(pair.packagePath),
      Deno.readTextFile(pair.sourcePath),
    ]);
    assertEquals(
      pair.normalize(packageText),
      pair.normalize(sourceText),
      `${pair.packagePath} drifted from ${pair.sourcePath}`,
    );
  });
}
