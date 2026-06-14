// backends.ts — two independent SPORE.v0 apply backends over the spore-execute-v0
// ABI `apply(in_ptr, in_len, out_ptr) -> out_len`. The probe's whole point: if a
// WASM engine and a from-scratch TS reference produce byte-identical output_hash
// for the same mutator+input, then SPORE.v0 is genuinely backend-agnostic and no
// substrate owns the protocol.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

/** Canonical output hash — blake3 of the output bytes under the spore.output.v0
 *  context (identical regime to liquid's xA507 SporeApplyBackend). */
export function outputHashHex(output: Uint8Array): string {
  const h = blake3(output, { context: "spore.output.v0", dkLen: 32 });
  return Array.from(h).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Backend A: execute the mutator's WASM via the host WebAssembly engine. */
export async function wasmBackend(
  wasmBytes: Uint8Array,
  input: Uint8Array,
): Promise<Uint8Array> {
  const module = await WebAssembly.compile(wasmBytes as BufferSource);
  const instance = await WebAssembly.instantiate(module, { env: {} });
  const exports = instance.exports as {
    memory: WebAssembly.Memory;
    apply: (inPtr: number, inLen: number, outPtr: number) => number;
  };
  if (!exports.memory || !exports.apply) {
    throw new Error("wasm mutator missing required exports (memory/apply)");
  }
  const IN_PTR = 0;
  const OUT_PTR = input.length + 64; // non-overlapping with the input region
  new Uint8Array(exports.memory.buffer).set(input, IN_PTR);
  const outLen = exports.apply(IN_PTR, input.length, OUT_PTR);
  return new Uint8Array(exports.memory.buffer).slice(OUT_PTR, OUT_PTR + outLen);
}

/** Backend B: a from-scratch TS reference for the basis mutators, written
 *  straight from each .wat's documented semantics — deliberately NOT WASM, so
 *  agreement is a real cross-engine fact. Unknown mutators return null
 *  (`backend_compatible: false`) rather than a bogus output. */
export function referenceBackend(
  mutator: string,
  input: Uint8Array,
): Uint8Array | null {
  switch (mutator) {
    case "identity": // out[i] = in[i]
      return input.slice();
    case "xor_5c": // out[i] = in[i] ^ 0x5C
      return input.map((b) => b ^ 0x5c);
    case "nop": // out_len = 0
      return new Uint8Array(0);
    default:
      return null; // backend cannot honor this mutator's semantics
  }
}
