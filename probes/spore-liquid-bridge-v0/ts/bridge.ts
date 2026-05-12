// spore-liquid-bridge-v0/ts/bridge.ts
//
// Liquid -> Spore Adapter.
// This script takes a synthetic Liquid event (SubstrateStateClaim),
// serializes it, and wraps it in a SPORE.v0 apply record using the
// `identity` mutator. It proves the SPORE format can encapsulate
// Liquid semantics without modifying Liquid's internal storage.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

// --- SPORE v0 Constants ---
const MAGIC = new Uint8Array([0x53, 0x50, 0x4f, 0x52]);
const VERSION = 0x00;
const KIND_APPLY = 0x01;
const ALGO_BLAKE3_256 = 0x1e;
const DIGEST_LEN = 0x20;

const DOMAIN_APPLY = "spore.apply.v0";
const DOMAIN_MUTATOR = "spore.mutator.v0";
const DOMAIN_OUTPUT = "spore.output.v0";

const FLAG_HAS_EXPECT = 0x0001;
const C_APPLY_BASE_ARGC1 = 5;

type Multihash = { algoTag: number; digest: Uint8Array };

const mh = (digest: Uint8Array, algoTag = ALGO_BLAKE3_256): Multihash => {
  if (digest.length !== DIGEST_LEN) throw new Error("digest must be 32 bytes");
  return { algoTag, digest };
};

const encodeMultihash = (m: Multihash): Uint8Array => {
  const out = new Uint8Array(2 + m.digest.length);
  out[0] = m.algoTag;
  out[1] = m.digest.length;
  out.set(m.digest, 2);
  return out;
};

// --- SPORE Apply Record Builder ---
const buildApplyRecord = (
  fHash: Multihash,
  argHashes: Multihash[],
  flags: number,
  expectHash?: Multihash,
): Uint8Array => {
  const argc = argHashes.length;
  if (argc > 0xff) throw new Error("argc must fit in one byte");

  const header = new Uint8Array(9);
  header.set(MAGIC, 0);
  header[4] = VERSION;
  header[5] = KIND_APPLY;
  header[6] = (flags >>> 8) & 0xff;
  header[7] = flags & 0xff;
  header[8] = argc;

  const fields: Uint8Array[] = [encodeMultihash(fHash)];
  for (const a of argHashes) fields.push(encodeMultihash(a));
  if (flags & FLAG_HAS_EXPECT) {
    if (!expectHash) throw new Error("HAS_EXPECT set but no expectHash");
    fields.push(encodeMultihash(expectHash));
  }

  const totalLen = header.length + fields.reduce((s, f) => s + f.length, 0);
  const out = new Uint8Array(totalLen);
  out.set(header, 0);
  let off = header.length;
  for (const f of fields) {
    out.set(f, off);
    off += f.length;
  }
  return out;
};

const sporeId = (record: Uint8Array): Uint8Array =>
  blake3(record, { context: DOMAIN_APPLY, dkLen: 32 });

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// --- Liquid Synthetic Event ---
const buildSyntheticLiquidEvent = (): Uint8Array => {
  const claim = {
    stream: "substrate",
    kind: "SUBSTRATE_STATE",
    provenance: "observed",
    payload: {
      neuron_count: 42,
      compost_count: 7,
      chronic_count: 1,
      healing_count: 2,
      futile_count: 0,
      mercy_rescues_recent: 0,
      nash_collapses_recent: 0,
      merkle_root:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      epoch: 12345,
    },
  };
  const jsonStr = JSON.stringify(claim);
  return new TextEncoder().encode(jsonStr);
};

// --- Execution ---
const runBridge = async () => {
  // 1. Generate Liquid Event
  const eventBytes = buildSyntheticLiquidEvent();
  const argHashBytes = blake3(eventBytes, { dkLen: 32 }); // Data hash
  const argHash = mh(argHashBytes);

  console.log(`[BRIDGE] Liquid Event bytes: ${eventBytes.length}`);
  console.log(`[BRIDGE] Liquid Event hash:  ${toHex(argHashBytes)}`);

  // 2. Load the identity mutator WASM
  const wasmPath = new URL(
    `../../spore-execute-v0/identity.wasm`,
    import.meta.url,
  );
  const wasmBytes = await Deno.readFile(wasmPath);
  const mutatorHashBytes = blake3(wasmBytes, {
    context: DOMAIN_MUTATOR,
    dkLen: 32,
  });
  const mutatorHash = mh(mutatorHashBytes);

  console.log(`[BRIDGE] Mutator (identity): ${toHex(mutatorHashBytes)}`);

  // 3. Execute the WASM mutator
  const module = await WebAssembly.compile(wasmBytes);
  const instance = await WebAssembly.instantiate(module, {});
  const memory = instance.exports.memory as WebAssembly.Memory;
  const apply = instance.exports.apply as (
    inPtr: number,
    inLen: number,
    outPtr: number,
  ) => number;

  const IN_PTR = 0;
  const OUT_PTR = Math.max(64, eventBytes.length + 8); // Ensure output pointer is safe

  const mem = new Uint8Array(memory.buffer);
  mem.set(eventBytes, IN_PTR);

  let outLen: number;
  try {
    outLen = apply(IN_PTR, eventBytes.length, OUT_PTR);
  } catch (e) {
    console.error(`[BRIDGE] Execution trapped:`, e);
    return;
  }

  // 4. Read output and compute hashes
  const memAfter = new Uint8Array(memory.buffer);
  const outputBytes = memAfter.slice(OUT_PTR, OUT_PTR + outLen);
  if (outLen !== eventBytes.length) {
    throw new Error(
      `identity returned out_len=${outLen}, expected ${eventBytes.length}`,
    );
  }
  for (let i = 0; i < eventBytes.length; i++) {
    if (outputBytes[i] !== eventBytes[i]) {
      throw new Error(
        `identity output mismatch at byte ${i}: got ${
          outputBytes[i]
        }, expected ${eventBytes[i]}`,
      );
    }
  }
  const outputHashBytes = blake3(outputBytes, {
    context: DOMAIN_OUTPUT,
    dkLen: 32,
  });
  const outputHash = mh(outputHashBytes);
  if (toHex(outputHashBytes) === toHex(argHashBytes)) {
    throw new Error(
      "domain separation failed: output hash equals liquid event hash",
    );
  }

  console.log(`[BRIDGE] Output length:      ${outLen}`);
  console.log(`[BRIDGE] Output hash:        ${toHex(outputHashBytes)}`);

  // 5. Build the final Apply Record
  const flags = FLAG_HAS_EXPECT;
  const record = buildApplyRecord(mutatorHash, [argHash], flags, outputHash);
  const id = sporeId(record);

  // 6. Calculate canonical fuel for identity.
  // body_fuel = 3 local.get + memory.copy(4 + 2*N) + final local.get = 8 + 2*N.
  // full apply fuel adds C_apply_base = 4 + argc = 5.
  const bodyFuel = eventBytes.length * 2 + 8;
  const fuelUsed = C_APPLY_BASE_ARGC1 + bodyFuel;

  console.log(`\n========================================`);
  console.log(`          SPORE RECEIPT V0              `);
  console.log(`========================================`);
  console.log(`Spore ID:    ${toHex(id)}`);
  console.log(`Record Hex:  ${toHex(record)}`);
  console.log(`Body Fuel:   ${bodyFuel} ATP`);
  console.log(`Fuel Used:   ${fuelUsed} ATP`);
  console.log(`Trapped:     false`);
  console.log(`Output Hash: ${toHex(outputHashBytes)}`);
  console.log(`========================================\n`);

  // 7. Output JSON Receipt for MYC Importer
  const jsonReceipt = {
    type: "SPORE_APPLY_RECEIPT",
    spore_id: toHex(id),
    record_hex: toHex(record),
    mutator_hash: toHex(mutatorHashBytes),
    arg_hashes: [toHex(argHashBytes)],
    output_hash: toHex(outputHashBytes),
    body_fuel: bodyFuel,
    total_fuel: fuelUsed,
    trapped: false,
  };

  const outPath = new URL(`../spore_receipt.json`, import.meta.url);
  await Deno.writeTextFile(outPath, JSON.stringify(jsonReceipt, null, 2));
  console.log(`[BRIDGE] Wrote JSON receipt to spore_receipt.json`);
};

await runBridge();
