// adapter.ts — run one SPORE.v0 mutator through every backend and report whether
// they agree on output_hash. Realizes the probe's claim: backend-agnostic apply.
//
// Receipt shape per ../SPEC.md: protocol / protocol_owner / backend_kind /
// output_hash / backend_compatible. A backend that cannot honor a mutator's
// semantics reports backend_compatible:false rather than a bogus hash.

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { outputHashHex, referenceBackend, wasmBackend } from "./backends.ts";

const WASM_DIR = join(
  dirname(dirname(fromFileUrl(import.meta.url))),
  "..",
  "spore-execute-v0",
);

export type BackendReceipt = {
  protocol: "spore.v0";
  protocol_owner: "trinity";
  backend_kind: "wasm" | "deno-reference";
  mutator: string;
  output_hash: string | null;
  backend_compatible: boolean;
};

export type AdapterVerdict = {
  type: "SporeRuntimeAdapterVerdict";
  mutator: string;
  receipts: BackendReceipt[];
  // True iff every backend that claims compatibility agrees on output_hash.
  agreement: boolean;
};

/** Run a mutator (by basis name, e.g. "identity"/"xor_5c"/"nop") through the
 *  WASM engine and the TS reference, and judge agreement. */
export async function runMutator(
  mutator: string,
  input: Uint8Array,
): Promise<AdapterVerdict> {
  const receipts: BackendReceipt[] = [];

  // Backend A: WASM
  try {
    const wasmBytes = await Deno.readFile(join(WASM_DIR, `${mutator}.wasm`));
    const out = await wasmBackend(wasmBytes, input);
    receipts.push({
      protocol: "spore.v0",
      protocol_owner: "trinity",
      backend_kind: "wasm",
      mutator,
      output_hash: outputHashHex(out),
      backend_compatible: true,
    });
  } catch {
    receipts.push({
      protocol: "spore.v0",
      protocol_owner: "trinity",
      backend_kind: "wasm",
      mutator,
      output_hash: null,
      backend_compatible: false,
    });
  }

  // Backend B: TS reference
  const ref = referenceBackend(mutator, input);
  receipts.push({
    protocol: "spore.v0",
    protocol_owner: "trinity",
    backend_kind: "deno-reference",
    mutator,
    output_hash: ref === null ? null : outputHashHex(ref),
    backend_compatible: ref !== null,
  });

  const hashes = receipts
    .filter((r) => r.backend_compatible)
    .map((r) => r.output_hash);
  const agreement = hashes.length >= 2 &&
    hashes.every((h) => h === hashes[0]);

  return { type: "SporeRuntimeAdapterVerdict", mutator, receipts, agreement };
}

if (import.meta.main) {
  const mutator = Deno.args[0] ?? "identity";
  const input = new TextEncoder().encode(Deno.args[1] ?? "hello spore");
  const verdict = await runMutator(mutator, input);
  console.log(JSON.stringify(verdict, null, 2));
  Deno.exit(verdict.agreement ? 0 : 1);
}
