// spore-execute-v0 probe — TypeScript / Deno implementation.
//
// Iterates over the mutator matrix. For each mutator: loads WASM
// from disk, computes mutator_hash, executes `apply` over a fixed
// 32-byte input (0xAB × 32), reads output, computes output_hash.
// Mutators that trap produce a single
// `mutator=X mutator_hash=Y trapped=true` line.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

const DOMAIN_MUTATOR = "spore.mutator.v0";
const DOMAIN_OUTPUT = "spore.output.v0";

const INPUT_BYTE = 0xab;
const INPUT_LEN = 32;
const IN_PTR = 0;
const OUT_PTR = 64;

const MUTATORS = [
  "identity",
  "xor_5c",
  "sum_bytes",
  "trap_div0",
  "trap_unreachable",
  "trap_oob",
] as const;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const tryRun = async (name: string): Promise<void> => {
  const wasmPath = new URL(`../${name}.wasm`, import.meta.url);
  const wasmBytes = await Deno.readFile(wasmPath);
  const mutatorHash = blake3(wasmBytes, {
    context: DOMAIN_MUTATOR,
    dkLen: 32,
  });
  const mhHex = toHex(mutatorHash);

  const module = await WebAssembly.compile(wasmBytes);
  const instance = await WebAssembly.instantiate(module, {});
  const memory = instance.exports.memory as WebAssembly.Memory;
  const apply = instance.exports.apply as (
    inPtr: number,
    inLen: number,
    outPtr: number,
  ) => number;

  const mem = new Uint8Array(memory.buffer);
  for (let i = 0; i < INPUT_LEN; i++) mem[IN_PTR + i] = INPUT_BYTE;

  let outLen: number;
  try {
    outLen = apply(IN_PTR, INPUT_LEN, OUT_PTR);
  } catch {
    // V8 throws WebAssembly.RuntimeError on trap. We don't compare
    // trap-kind text across runtimes; the protocol-level invariant is
    // that a trap means "no commit, no output".
    console.log(`mutator=${name} mutator_hash=${mhHex} trapped=true`);
    return;
  }

  const memAfter = new Uint8Array(memory.buffer);
  const outputBytes = memAfter.slice(OUT_PTR, OUT_PTR + outLen);
  const outputHash = blake3(outputBytes, {
    context: DOMAIN_OUTPUT,
    dkLen: 32,
  });
  console.log(
    `mutator=${name} mutator_hash=${mhHex} out_len=${outLen} output_bytes=${
      toHex(outputBytes)
    } output_hash=${toHex(outputHash)}`,
  );
};

for (const name of MUTATORS) {
  await tryRun(name);
}
