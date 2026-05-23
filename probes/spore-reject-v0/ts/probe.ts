const CASES = [
  "ok_i32",
  "reject_f32",
  "reject_f64",
  "reject_memory_grow",
  "reject_call_indirect",
  "reject_simd",
] as const;

class Reader {
  offset = 0;
  constructor(readonly bytes: Uint8Array) {}

  eof(): boolean {
    return this.offset >= this.bytes.length;
  }

  u8(): number {
    if (this.offset >= this.bytes.length) throw new Error("eof");
    return this.bytes[this.offset++];
  }

  bytesN(n: number): Uint8Array {
    const out = this.bytes.slice(this.offset, this.offset + n);
    this.offset += n;
    return out;
  }

  varu32(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.u8();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result >>> 0;
      shift += 7;
      if (shift > 35) throw new Error("varu32_too_long");
    }
  }
}

const skipVar = (r: Reader): void => {
  r.varu32();
};

const skipMemArg = (r: Reader): void => {
  r.varu32(); // align
  r.varu32(); // offset
};

const skipBlockType = (r: Reader): void => {
  const b = r.u8();
  if (b === 0x40) return;
  if (b >= 0x7b && b <= 0x7f) return;
  // Multi-byte type index. We consumed the first byte, so keep
  // consuming until the LEB continuation bit clears.
  if ((b & 0x80) !== 0) {
    while ((r.u8() & 0x80) !== 0) {}
  }
};

const validateOpStream = (body: Uint8Array): string | null => {
  const r = new Reader(body);
  const localGroupCount = r.varu32();
  for (let i = 0; i < localGroupCount; i++) {
    r.varu32(); // count
    r.u8(); // valtype
  }

  while (!r.eof()) {
    const op = r.u8();

    if (op === 0x43) return "banned:f32"; // f32.const
    if (op === 0x44) return "banned:f64"; // f64.const
    if (op === 0x40) return "banned:memory.grow";
    if (op === 0x11) return "banned:call_indirect";
    if (op === 0xfd) return "banned:simd";
    if (op === 0xfe) return "banned:atomics";

    switch (op) {
      case 0x02: // block
      case 0x03: // loop
      case 0x04: // if
        skipBlockType(r);
        break;
      case 0x0c: // br
      case 0x0d: // br_if
      case 0x10: // call
      case 0x20: // local.get
      case 0x21: // local.set
      case 0x22: // local.tee
      case 0x23: // global.get
      case 0x24: // global.set
      case 0x41: // i32.const
      case 0x42: // i64.const
        skipVar(r);
        break;
      case 0x0e: { // br_table
        const n = r.varu32();
        for (let i = 0; i < n + 1; i++) r.varu32();
        break;
      }
      case 0x28:
      case 0x29:
      case 0x2a:
      case 0x2b:
      case 0x2c:
      case 0x2d:
      case 0x2e:
      case 0x2f:
      case 0x30:
      case 0x31:
      case 0x32:
      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
      case 0x37:
      case 0x38:
      case 0x39:
      case 0x3a:
      case 0x3b:
      case 0x3c:
      case 0x3d:
        skipMemArg(r);
        break;
      case 0x3f: // memory.size
        r.u8();
        break;
      case 0xfc: { // misc prefix, including memory.copy/fill
        const sub = r.varu32();
        if (sub === 10 || sub === 11) {
          r.u8();
          r.u8();
        }
        break;
      }
      default:
        // Most fixed-width numeric/control opcodes have no immediates.
        break;
    }
  }

  return null;
};

const validateV0 = (wasm: Uint8Array): string | null => {
  const r = new Reader(wasm);
  const magic = Array.from(r.bytesN(4));
  if (magic.join(",") !== "0,97,115,109") return "invalid:wasm";
  r.bytesN(4); // version

  while (!r.eof()) {
    const sectionId = r.u8();
    const sectionLen = r.varu32();
    const section = new Reader(r.bytesN(sectionLen));
    if (sectionId !== 10) continue; // code section

    const functionCount = section.varu32();
    for (let i = 0; i < functionCount; i++) {
      const bodyLen = section.varu32();
      const body = section.bytesN(bodyLen);
      const reason = validateOpStream(body);
      if (reason) return reason;
    }
  }

  return null;
};

for (const name of CASES) {
  const wasmPath = new URL(`../${name}.wasm`, import.meta.url);
  const wasm = await Deno.readFile(wasmPath);
  const reason = validateV0(wasm);
  if (reason) {
    console.log(`case=${name} accepted=false reason=${reason}`);
  } else {
    console.log(`case=${name} accepted=true`);
  }
}
