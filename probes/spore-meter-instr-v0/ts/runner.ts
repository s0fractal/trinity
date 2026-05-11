// spore-meter-instr-v0 :: runner
//
// Loads instrumented WASM produced by ../rust, sets up the host
// import (spore.deduct), runs apply() with each test input, and
// prints the body_fuel total observed.
//
// Output format:
//   mutator=<name> in_len=<N> body_fuel_instr=<u64>
//
// Verified by run.sh against expected values derived from meter #3
// (fuel_v1 - C_apply_base, with C_apply_base = 5 for argc = 1).

const INSTR_DIR = "/tmp/spore-meter-instr-v0";

const MATRIX: { name: string; sizes: number[] }[] = [
  { name: "nop", sizes: [32] },
  { name: "identity", sizes: [32, 256, 1024] },
];

// All mutators use these byte conventions (per spore-execute-v0/SPEC.md).
const INPUT_BYTE = 0xab;
const IN_PTR = 0;
const OUT_PTR = 4096;

for (const { name, sizes } of MATRIX) {
  const wasm = await Deno.readFile(`${INSTR_DIR}/${name}.instr.wasm`);
  for (const inLen of sizes) {
    let fuelCounter = 0;
    const { instance } = await WebAssembly.instantiate(wasm, {
      spore: {
        deduct: (amount: number) => {
          fuelCounter += amount;
        },
      },
    });
    const memory = instance.exports.memory as WebAssembly.Memory;
    const apply = instance.exports.apply as (
      inPtr: number,
      inLen: number,
      outPtr: number,
    ) => number;
    // Fill input region.
    const mem = new Uint8Array(memory.buffer);
    mem.fill(INPUT_BYTE, IN_PTR, IN_PTR + inLen);
    // Run apply.
    const outLen = apply(IN_PTR, inLen, OUT_PTR);
    // Sanity: outLen for nop is 0, for identity is in_len.
    if (name === "nop" && outLen !== 0) {
      throw new Error(`nop returned out_len=${outLen}, expected 0`);
    }
    if (name === "identity" && outLen !== inLen) {
      throw new Error(`identity returned out_len=${outLen}, expected ${inLen}`);
    }
    console.log(
      `mutator=${name} in_len=${inLen} body_fuel_instr=${fuelCounter}`,
    );
  }
}
