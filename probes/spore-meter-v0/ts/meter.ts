// spore-meter-v0 :: meter #2 — Deno/TypeScript reference meter for
// spore.fuel.v1.
//
// Independent of rust meter #1:
//   - Different language (TS vs Rust).
//   - Different WASM parser (hand-rolled binary walker vs wasmparser).
//   - Different programmer pass at implementing the v1 table.
//
// Output format matches meter #1 exactly. If diff between the two is
// empty, F-FUEL-3 (two-meter disagreement) is held up.

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

const DOMAIN_MUTATOR = "spore.mutator.v0";

// ============================================================
// Minimal WASM binary parser
// ============================================================
//
// Reads ONLY what the meter needs: walks each function in the code
// section, emits a flat list of operator names (with markers for
// block/loop/if/end). Correctly skips opcode immediates.

type OpName =
  // Control / structural
  | "unreachable" | "nop" | "block" | "loop" | "if" | "else" | "end"
  | "br" | "br_if" | "br_table" | "return" | "call" | "drop" | "select"
  // Locals / globals
  | "local.get" | "local.set" | "local.tee"
  // Memory
  | "i32.load" | "i64.load" | "f32.load" | "f64.load"
  | "i32.load8_s" | "i32.load8_u" | "i32.load16_s" | "i32.load16_u"
  | "i64.load8_s" | "i64.load8_u" | "i64.load16_s" | "i64.load16_u"
  | "i64.load32_s" | "i64.load32_u"
  | "i32.store" | "i64.store" | "f32.store" | "f64.store"
  | "i32.store8" | "i32.store16"
  | "i64.store8" | "i64.store16" | "i64.store32"
  // Const
  | "i32.const" | "i64.const"
  // Comparisons
  | "i32.eqz" | "i32.eq" | "i32.ne"
  | "i32.lt_s" | "i32.lt_u" | "i32.gt_s" | "i32.gt_u"
  | "i32.le_s" | "i32.le_u" | "i32.ge_s" | "i32.ge_u"
  | "i64.eqz" | "i64.eq" | "i64.ne"
  | "i64.lt_s" | "i64.lt_u" | "i64.gt_s" | "i64.gt_u"
  | "i64.le_s" | "i64.le_u" | "i64.ge_s" | "i64.ge_u"
  // i32 arith
  | "i32.clz" | "i32.ctz" | "i32.popcnt"
  | "i32.add" | "i32.sub" | "i32.mul"
  | "i32.div_s" | "i32.div_u" | "i32.rem_s" | "i32.rem_u"
  | "i32.and" | "i32.or" | "i32.xor"
  | "i32.shl" | "i32.shr_s" | "i32.shr_u" | "i32.rotl" | "i32.rotr"
  // i64 arith
  | "i64.clz" | "i64.ctz" | "i64.popcnt"
  | "i64.add" | "i64.sub" | "i64.mul"
  | "i64.div_s" | "i64.div_u" | "i64.rem_s" | "i64.rem_u"
  | "i64.and" | "i64.or" | "i64.xor"
  | "i64.shl" | "i64.shr_s" | "i64.shr_u" | "i64.rotl" | "i64.rotr"
  // Conversions
  | "i32.wrap_i64"
  | "i64.extend_i32_s" | "i64.extend_i32_u"
  | "i32.extend8_s" | "i32.extend16_s"
  | "i64.extend8_s" | "i64.extend16_s" | "i64.extend32_s"
  // Bulk memory (0xFC prefix)
  | "memory.copy" | "memory.fill"
  // Banned in v0 (would error if encountered)
  | "memory.grow" | "memory.size" | "call_indirect";

const OPCODE_NAME: Record<number, OpName> = {
  0x00: "unreachable",
  0x01: "nop",
  0x02: "block", 0x03: "loop", 0x04: "if", 0x05: "else", 0x0b: "end",
  0x0c: "br", 0x0d: "br_if", 0x0f: "return",
  0x10: "call", 0x1a: "drop", 0x1b: "select",
  0x20: "local.get", 0x21: "local.set", 0x22: "local.tee",
  0x28: "i32.load", 0x29: "i64.load",
  0x2c: "i32.load8_s", 0x2d: "i32.load8_u",
  0x2e: "i32.load16_s", 0x2f: "i32.load16_u",
  0x30: "i64.load8_s", 0x31: "i64.load8_u",
  0x32: "i64.load16_s", 0x33: "i64.load16_u",
  0x34: "i64.load32_s", 0x35: "i64.load32_u",
  0x36: "i32.store", 0x37: "i64.store",
  0x3a: "i32.store8", 0x3b: "i32.store16",
  0x3c: "i64.store8", 0x3d: "i64.store16", 0x3e: "i64.store32",
  0x3f: "memory.size", 0x40: "memory.grow",
  0x41: "i32.const", 0x42: "i64.const",
  0x45: "i32.eqz", 0x46: "i32.eq", 0x47: "i32.ne",
  0x48: "i32.lt_s", 0x49: "i32.lt_u",
  0x4a: "i32.gt_s", 0x4b: "i32.gt_u",
  0x4c: "i32.le_s", 0x4d: "i32.le_u",
  0x4e: "i32.ge_s", 0x4f: "i32.ge_u",
  0x50: "i64.eqz", 0x51: "i64.eq", 0x52: "i64.ne",
  0x53: "i64.lt_s", 0x54: "i64.lt_u",
  0x55: "i64.gt_s", 0x56: "i64.gt_u",
  0x57: "i64.le_s", 0x58: "i64.le_u",
  0x59: "i64.ge_s", 0x5a: "i64.ge_u",
  0x67: "i32.clz", 0x68: "i32.ctz", 0x69: "i32.popcnt",
  0x6a: "i32.add", 0x6b: "i32.sub", 0x6c: "i32.mul",
  0x6d: "i32.div_s", 0x6e: "i32.div_u",
  0x6f: "i32.rem_s", 0x70: "i32.rem_u",
  0x71: "i32.and", 0x72: "i32.or", 0x73: "i32.xor",
  0x74: "i32.shl", 0x75: "i32.shr_s", 0x76: "i32.shr_u",
  0x77: "i32.rotl", 0x78: "i32.rotr",
  0x79: "i64.clz", 0x7a: "i64.ctz", 0x7b: "i64.popcnt",
  0x7c: "i64.add", 0x7d: "i64.sub", 0x7e: "i64.mul",
  0x7f: "i64.div_s", 0x80: "i64.div_u",
  0x81: "i64.rem_s", 0x82: "i64.rem_u",
  0x83: "i64.and", 0x84: "i64.or", 0x85: "i64.xor",
  0x86: "i64.shl", 0x87: "i64.shr_s", 0x88: "i64.shr_u",
  0x89: "i64.rotl", 0x8a: "i64.rotr",
  0xa7: "i32.wrap_i64",
  0xac: "i64.extend_i32_s", 0xad: "i64.extend_i32_u",
  0xc0: "i32.extend8_s", 0xc1: "i32.extend16_s",
  0xc2: "i64.extend8_s", 0xc3: "i64.extend16_s", 0xc4: "i64.extend32_s",
};

class Reader {
  pos = 0;
  constructor(public bytes: Uint8Array) {}
  u8(): number {
    return this.bytes[this.pos++];
  }
  // Unsigned LEB128
  uleb(): number {
    let result = 0, shift = 0;
    while (true) {
      const b = this.u8();
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return result >>> 0;
  }
  // Signed LEB128 (we discard the value; just need to skip bytes)
  sleb(): number {
    let result = 0, shift = 0, b = 0;
    do {
      b = this.u8();
      result |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) !== 0);
    if (shift < 32 && (b & 0x40) !== 0) result |= ~0 << shift;
    return result;
  }
  skipBytes(n: number) {
    this.pos += n;
  }
  eof(): boolean {
    return this.pos >= this.bytes.length;
  }
}

/** Parse one instruction, advance the reader past its immediates,
 *  return the op name. */
function readInstr(r: Reader): OpName {
  const op = r.u8();
  // 0xFC prefix: bulk-memory / saturating-conversions etc.
  if (op === 0xfc) {
    const sub = r.uleb();
    switch (sub) {
      case 0x0a: // memory.copy: src=0, dst=0 immediates
        r.u8(); r.u8();
        return "memory.copy";
      case 0x0b: // memory.fill: dst=0 immediate
        r.u8();
        return "memory.fill";
      default:
        throw new Error(`unsupported 0xFC sub-opcode 0x${sub.toString(16)}`);
    }
  }

  const name = OPCODE_NAME[op];
  if (!name) throw new Error(`unknown opcode 0x${op.toString(16)}`);

  // Skip immediates per opcode:
  switch (name) {
    case "block":
    case "loop":
    case "if": {
      // blocktype: single byte for value type (0x40 = empty, 0x7f-0x7c = value types)
      // OR a signed LEB index into the type section. For our mutators the
      // blocktype is always a single byte (0x40 for empty).
      r.u8();
      break;
    }
    case "br":
    case "br_if":
    case "call":
    case "local.get":
    case "local.set":
    case "local.tee":
      r.uleb();
      break;
    case "i32.load": case "i64.load":
    case "i32.load8_s": case "i32.load8_u":
    case "i32.load16_s": case "i32.load16_u":
    case "i64.load8_s": case "i64.load8_u":
    case "i64.load16_s": case "i64.load16_u":
    case "i64.load32_s": case "i64.load32_u":
    case "i32.store": case "i64.store":
    case "i32.store8": case "i32.store16":
    case "i64.store8": case "i64.store16": case "i64.store32":
      r.uleb(); // align
      r.uleb(); // offset
      break;
    case "i32.const":
    case "i64.const":
      r.sleb();
      break;
    case "memory.size":
    case "memory.grow":
      r.u8(); // reserved 0x00
      break;
    // Plain instructions: no immediates
    default:
      break;
  }
  return name;
}

/** Parse a single function body and return its operator sequence. */
function parseFunctionBody(bytes: Uint8Array): OpName[] {
  const r = new Reader(bytes);
  // locals_vec: number of local groups, each (count, valtype byte)
  const numLocalGroups = r.uleb();
  for (let i = 0; i < numLocalGroups; i++) {
    r.uleb(); // count
    r.u8(); // valtype
  }
  // Instructions until top-level end (we just keep reading until eof;
  // the function body byte slice already ends at the function's end)
  const ops: OpName[] = [];
  while (!r.eof()) {
    ops.push(readInstr(r));
  }
  return ops;
}

/** Walk the WASM module and find the first function body's operators. */
function getFirstFunctionOps(wasm: Uint8Array): OpName[] {
  const r = new Reader(wasm);
  // Magic + version
  if (r.u8() !== 0x00 || r.u8() !== 0x61 || r.u8() !== 0x73 || r.u8() !== 0x6d) {
    throw new Error("not a WASM module");
  }
  // Version (4 bytes)
  r.skipBytes(4);

  while (!r.eof()) {
    const sectionId = r.u8();
    const sectionSize = r.uleb();
    const sectionStart = r.pos;
    if (sectionId === 0x0a) {
      // Code section: num_funcs LEB, then each (body_size LEB, body bytes)
      const numFuncs = r.uleb();
      if (numFuncs < 1) throw new Error("no functions in code section");
      const bodySize = r.uleb();
      const bodyBytes = wasm.subarray(r.pos, r.pos + bodySize);
      return parseFunctionBody(bodyBytes);
    }
    r.pos = sectionStart + sectionSize;
  }
  throw new Error("no code section found");
}

// ============================================================
// v1 fuel cost table
// ============================================================

function opFuel(name: OpName): number {
  switch (name) {
    // 0 fuel (markers)
    case "end":
      return 0;

    // 1 fuel
    case "nop": case "drop":
    case "local.get": case "local.set": case "local.tee":
    case "i32.const": case "i64.const":
    case "block": case "loop": case "if": case "else":
    case "br": case "br_if":
    case "return": case "select": case "unreachable":
    // Comparisons
    case "i32.eqz": case "i32.eq": case "i32.ne":
    case "i32.lt_s": case "i32.lt_u": case "i32.gt_s": case "i32.gt_u":
    case "i32.le_s": case "i32.le_u": case "i32.ge_s": case "i32.ge_u":
    case "i64.eqz": case "i64.eq": case "i64.ne":
    case "i64.lt_s": case "i64.lt_u": case "i64.gt_s": case "i64.gt_u":
    case "i64.le_s": case "i64.le_u": case "i64.ge_s": case "i64.ge_u":
    // i32 arith
    case "i32.clz": case "i32.ctz": case "i32.popcnt":
    case "i32.add": case "i32.sub": case "i32.mul":
    case "i32.div_s": case "i32.div_u": case "i32.rem_s": case "i32.rem_u":
    case "i32.and": case "i32.or": case "i32.xor":
    case "i32.shl": case "i32.shr_s": case "i32.shr_u":
    case "i32.rotl": case "i32.rotr":
    // i64 arith
    case "i64.clz": case "i64.ctz": case "i64.popcnt":
    case "i64.add": case "i64.sub": case "i64.mul":
    case "i64.div_s": case "i64.div_u": case "i64.rem_s": case "i64.rem_u":
    case "i64.and": case "i64.or": case "i64.xor":
    case "i64.shl": case "i64.shr_s": case "i64.shr_u":
    case "i64.rotl": case "i64.rotr":
    // Conversions
    case "i32.wrap_i64":
    case "i64.extend_i32_s": case "i64.extend_i32_u":
    case "i32.extend8_s": case "i32.extend16_s":
    case "i64.extend8_s": case "i64.extend16_s": case "i64.extend32_s":
      return 1;

    // 2 fuel: memory load/store, call
    case "i32.load": case "i64.load":
    case "i32.load8_s": case "i32.load8_u":
    case "i32.load16_s": case "i32.load16_u":
    case "i64.load8_s": case "i64.load8_u":
    case "i64.load16_s": case "i64.load16_u":
    case "i64.load32_s": case "i64.load32_u":
    case "i32.store": case "i64.store":
    case "i32.store8": case "i32.store16":
    case "i64.store8": case "i64.store16": case "i64.store32":
    case "call":
      return 2;

    // Bulk memory handled separately by caller
    case "memory.copy": case "memory.fill":
      return -1; // signal

    default:
      throw new Error(`instruction outside v0 consensus subset: ${name}`);
  }
}

// ============================================================
// Walker — same algorithm as rust meter
// ============================================================

// Stack frame for the walker: each enclosing block/loop/if. For
// loops we additionally track whether we're still in the exit-check
// phase (true on entry, flips to false on the first br_if inside).
type Frame =
  | { kind: "block" }
  | { kind: "loop"; inExitCheck: boolean }
  | { kind: "if" };

function fuelV1(wasm: Uint8Array, inLen: number, argc: number): number {
  const cApplyBase = 4 + argc;
  let bodyFuel = 0;
  const stack: Frame[] = [];
  const ops = getFirstFunctionOps(wasm);

  for (const op of ops) {
    // Execution-aware multiplier: a Loop in exit_check phase
    // contributes (inLen + 1); in body phase contributes inLen.
    let multiplier = 1;
    for (const f of stack) {
      if (f.kind === "loop") {
        multiplier *= f.inExitCheck ? inLen + 1 : inLen;
      }
    }

    if (op === "block") {
      bodyFuel += multiplier * 1;
      stack.push({ kind: "block" });
    } else if (op === "loop") {
      bodyFuel += multiplier * 1;
      stack.push({ kind: "loop", inExitCheck: true });
    } else if (op === "if") {
      bodyFuel += multiplier * 1;
      stack.push({ kind: "if" });
    } else if (op === "end") {
      stack.pop();
    } else if (op === "memory.copy") {
      bodyFuel += multiplier * (4 + 2 * inLen);
    } else if (op === "memory.fill") {
      bodyFuel += multiplier * (4 + inLen);
    } else if (op === "br_if") {
      bodyFuel += multiplier * opFuel(op);
      // First br_if inside a loop ends its exit-check phase.
      const top = stack[stack.length - 1];
      if (top && top.kind === "loop" && top.inExitCheck) {
        top.inExitCheck = false;
      }
    } else {
      bodyFuel += multiplier * opFuel(op);
    }
  }

  return cApplyBase + bodyFuel;
}

// ============================================================
// Main
// ============================================================

const toHex = (b: Uint8Array | number[]): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

const matrix: { name: string; sizes: number[] }[] = [
  { name: "nop", sizes: [32] },
  { name: "identity", sizes: [32, 256, 1024] },
  { name: "xor_5c", sizes: [32, 256, 1024] },
  { name: "sum_bytes", sizes: [32, 256, 1024] },
];

const executeDir = new URL("../../spore-execute-v0/", import.meta.url);

for (const { name, sizes } of matrix) {
  for (const inLen of sizes) {
    const wasmUrl = new URL(`${name}.wasm`, executeDir);
    const wasm = await Deno.readFile(wasmUrl);
    const mutatorHash = blake3(wasm, { context: DOMAIN_MUTATOR, dkLen: 32 });
    const fuel = fuelV1(wasm, inLen, 1);
    console.log(
      `mutator=${name} in_len=${inLen} fuel_v1=${fuel} mutator_hash=${toHex(mutatorHash.slice(0, 8))}`,
    );
  }
}
