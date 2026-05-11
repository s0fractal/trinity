// spore-meter-instr-v0 :: trap-on-budget enforcement (V8/deno)
//
// For each (mutator, in_len, expected_body_fuel), runs apply() twice:
//   1. budget = expected_body_fuel        → must succeed; final counter == budget
//   2. budget = expected_body_fuel - 1    → must trap; final counter <  budget
//
// The host import `spore.deduct(amount)` throws when the running
// counter would exceed the budget. A throw inside a WASM host
// import causes the engine to trap the WASM, which surfaces to the
// caller as a WebAssembly.RuntimeError.
//
// Output format (one row per (mutator, in_len, mode)):
//   mutator=<name> in_len=<N> budget=<B> result=<SUCCESS|TRAP> final_fuel=<u64>
//
// This is checked against expected.enforce.out by run.sh.

const INSTR_DIR = "/tmp/spore-meter-instr-v0";

const CORPUS: { name: string; sizes: number[]; bodyFuel: (n: number) => number }[] = [
  { name: "nop", sizes: [32], bodyFuel: () => 1 },
  { name: "identity", sizes: [32, 256, 1024], bodyFuel: (n) => 8 + 2 * n },
  { name: "xor_5c", sizes: [32, 256, 1024], bodyFuel: (n) => 7 + 21 * n },
  { name: "sum_bytes", sizes: [32, 256, 1024], bodyFuel: (n) => 11 + 17 * n },
];

const INPUT_BYTE = 0xab;
const IN_PTR = 0;
const OUT_PTR = 4096;

class BudgetExceeded extends Error {
  constructor(public counter: number, public amount: number, public budget: number) {
    super(`spore.deduct: would exceed budget (counter=${counter}+${amount}>${budget})`);
  }
}

async function runOnce(
  wasm: Uint8Array,
  name: string,
  inLen: number,
  budget: number,
): Promise<{ result: "SUCCESS" | "TRAP"; finalFuel: number }> {
  let fuelCounter = 0;
  const { instance } = await WebAssembly.instantiate(wasm, {
    spore: {
      deduct: (amount: number) => {
        if (fuelCounter + amount > budget) {
          throw new BudgetExceeded(fuelCounter, amount, budget);
        }
        fuelCounter += amount;
      },
    },
  });
  const memory = instance.exports.memory as WebAssembly.Memory;
  const apply = instance.exports.apply as (
    a: number,
    b: number,
    c: number,
  ) => number;
  const mem = new Uint8Array(memory.buffer);
  mem.fill(INPUT_BYTE, IN_PTR, IN_PTR + inLen);

  try {
    apply(IN_PTR, inLen, OUT_PTR);
    return { result: "SUCCESS", finalFuel: fuelCounter };
  } catch (e) {
    // A throw inside a host import surfaces as a WebAssembly.RuntimeError
    // OR (in some engines) re-raises the original exception. Either
    // way, the WASM execution did not complete.
    return { result: "TRAP", finalFuel: fuelCounter };
  }
}

for (const { name, sizes, bodyFuel } of CORPUS) {
  const wasm = await Deno.readFile(`${INSTR_DIR}/${name}.instr.wasm`);
  for (const inLen of sizes) {
    const fuel = bodyFuel(inLen);
    // Budget = exact body_fuel → must succeed.
    const okRun = await runOnce(wasm, name, inLen, fuel);
    console.log(
      `mutator=${name} in_len=${inLen} budget=${fuel} result=${okRun.result} final_fuel=${okRun.finalFuel}`,
    );
    // Budget = body_fuel - 1 → must trap.
    const trapRun = await runOnce(wasm, name, inLen, fuel - 1);
    console.log(
      `mutator=${name} in_len=${inLen} budget=${fuel - 1} result=${trapRun.result} final_fuel=${trapRun.finalFuel}`,
    );
  }
}
