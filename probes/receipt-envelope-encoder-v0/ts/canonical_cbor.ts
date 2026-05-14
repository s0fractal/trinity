// Canonical CBOR encoder/decoder (hand-rolled, no dep).
//
// Implements RFC 8949 §4.2.1 deterministic encoding restricted to the subset
// declared in ../SPEC.md. Floats, indefinite-length, tags, undefined, bignums
// beyond u64/i64, non-string map keys, and non-canonical encodings are all
// forbidden — encoder throws, decoder rejects.

export type CborValue =
  | number
  | bigint
  | string
  | Uint8Array
  | boolean
  | null
  | CborValue[]
  | { [key: string]: CborValue };

// ────────────────────────────────────────────────────────────────────────
// ENCODER
// ────────────────────────────────────────────────────────────────────────

export function encodeCanonical(value: CborValue): Uint8Array {
  const out: number[] = [];
  encodeValue(value, out);
  return new Uint8Array(out);
}

function encodeValue(v: CborValue, out: number[]): void {
  if (v === null) { out.push(0xf6); return; }
  if (v === true) { out.push(0xf5); return; }
  if (v === false) { out.push(0xf4); return; }

  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("canonical-cbor: non-finite number forbidden");
    if (!Number.isInteger(v)) throw new Error("canonical-cbor: floats forbidden (use Q-format integers)");
    if (!Number.isSafeInteger(v)) throw new Error("canonical-cbor: integer out of safe range; use bigint");
    encodeIntNum(v, out);
    return;
  }

  if (typeof v === "bigint") {
    encodeIntBig(v, out);
    return;
  }

  if (typeof v === "string") {
    const bytes = new TextEncoder().encode(v);
    encodeHead(3, bytes.length, out);
    pushAll(out, bytes);
    return;
  }

  if (v instanceof Uint8Array) {
    encodeHead(2, v.length, out);
    pushAll(out, v);
    return;
  }

  if (Array.isArray(v)) {
    encodeHead(4, v.length, out);
    for (const item of v) encodeValue(item, out);
    return;
  }

  if (typeof v === "object" && v !== null) {
    if (v instanceof Map) throw new Error("canonical-cbor: JS Map forbidden; use plain object");
    if (v instanceof Set) throw new Error("canonical-cbor: JS Set forbidden");
    const obj = v as Record<string, CborValue>;
    const keys = Object.keys(obj);

    // RFC 8949 §4.2.1: keys sorted by bytewise lexicographic order of their
    // deterministic encodings.
    const encoded: { key: string; bytes: Uint8Array }[] = keys.map((k) => {
      const tmp: number[] = [];
      const kb = new TextEncoder().encode(k);
      encodeHead(3, kb.length, tmp);
      pushAll(tmp, kb);
      return { key: k, bytes: new Uint8Array(tmp) };
    });
    encoded.sort((a, b) => compareBytes(a.bytes, b.bytes));

    for (let i = 1; i < encoded.length; i++) {
      if (compareBytes(encoded[i - 1].bytes, encoded[i].bytes) === 0) {
        throw new Error(`canonical-cbor: duplicate map key after encoding: ${encoded[i].key}`);
      }
    }

    encodeHead(5, encoded.length, out);
    for (const { key, bytes } of encoded) {
      pushAll(out, bytes);
      encodeValue(obj[key], out);
    }
    return;
  }

  throw new Error(`canonical-cbor: unsupported value type: ${typeof v}`);
}

function encodeIntNum(n: number, out: number[]): void {
  // Safe-integer range goes up to 2^53-1, which exceeds u32. For values
  // beyond u32, delegate to bigint encoder (which uses 8-byte form).
  if (n >= 0 && n < 0x100000000) { encodeHead(0, n, out); return; }
  if (n < 0 && -1 - n < 0x100000000) { encodeHead(1, -1 - n, out); return; }
  encodeIntBig(BigInt(n), out);
}

function encodeIntBig(n: bigint, out: number[]): void {
  // 8-byte form covers everything from 2^32 up to u64. encodeHead handles
  // anything below 2^32. Both forms are shortest-canonical for their range.
  if (n >= 0n) {
    if (n < 0x100000000n) {
      encodeHead(0, Number(n), out);
      return;
    }
    if (n > 0xffffffffffffffffn) throw new Error("canonical-cbor: uint > u64 forbidden");
    out.push(0x1b);
    for (let i = 7; i >= 0; i--) out.push(Number((n >> BigInt(i * 8)) & 0xffn));
    return;
  }
  const negated = -1n - n;
  if (negated < 0x100000000n) {
    encodeHead(1, Number(negated), out);
    return;
  }
  if (negated > 0xffffffffffffffffn) throw new Error("canonical-cbor: negint < -2^64 forbidden");
  out.push(0x3b);
  for (let i = 7; i >= 0; i--) out.push(Number((negated >> BigInt(i * 8)) & 0xffn));
}

function encodeHead(major: number, value: number, out: number[]): void {
  const m = (major << 5) & 0xff;
  if (value < 0) throw new Error("canonical-cbor: negative head argument");
  if (value < 24) {
    out.push(m | value);
  } else if (value < 0x100) {
    out.push(m | 24, value & 0xff);
  } else if (value < 0x10000) {
    out.push(m | 25, (value >> 8) & 0xff, value & 0xff);
  } else if (value < 0x100000000) {
    out.push(m | 26, (value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
  } else {
    throw new Error("canonical-cbor: value too large; use bigint for >= 2^32");
  }
}

function pushAll(out: number[], bytes: Uint8Array): void {
  for (let i = 0; i < bytes.length; i++) out.push(bytes[i]);
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

// ────────────────────────────────────────────────────────────────────────
// DECODER (strict canonical: any successful decode re-encodes to same bytes)
// ────────────────────────────────────────────────────────────────────────

type DecodeCtx = { buf: Uint8Array; pos: number };

export function decodeCanonical(bytes: Uint8Array): CborValue {
  const ctx: DecodeCtx = { buf: bytes, pos: 0 };
  const v = decodeValue(ctx);
  if (ctx.pos !== bytes.length) {
    throw new Error(`canonical-cbor: trailing bytes (${bytes.length - ctx.pos} unread)`);
  }
  return v;
}

function decodeValue(ctx: DecodeCtx): CborValue {
  const b = readByte(ctx);
  const major = (b >> 5) & 0x07;
  const info = b & 0x1f;

  if (info === 31) throw new Error("canonical-cbor: indefinite-length form forbidden");

  // major 7: simple values + floats
  if (major === 7) {
    if (info === 20) return false;
    if (info === 21) return true;
    if (info === 22) return null;
    if (info === 23) throw new Error("canonical-cbor: undefined (simple 23) forbidden");
    if (info === 25 || info === 26 || info === 27) {
      throw new Error("canonical-cbor: floating-point forbidden");
    }
    throw new Error(`canonical-cbor: simple value ${info} forbidden`);
  }

  // major 6: tags
  if (major === 6) throw new Error("canonical-cbor: tags forbidden");

  // length argument for majors 0..5 — must be shortest form
  const value = readArgCanonical(ctx, info);

  switch (major) {
    case 0:
      return value <= Number.MAX_SAFE_INTEGER ? Number(value) : value;
    case 1: {
      // -1 - value
      const v = value;
      if (typeof v === "bigint") return -1n - v;
      return -1 - v;
    }
    case 2: {
      const len = toLen(value);
      const bytes = ctx.buf.slice(ctx.pos, ctx.pos + len);
      if (bytes.length !== len) throw new Error("canonical-cbor: truncated byte string");
      ctx.pos += len;
      return bytes;
    }
    case 3: {
      const len = toLen(value);
      const bytes = ctx.buf.slice(ctx.pos, ctx.pos + len);
      if (bytes.length !== len) throw new Error("canonical-cbor: truncated text string");
      ctx.pos += len;
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    case 4: {
      const len = toLen(value);
      const arr: CborValue[] = [];
      for (let i = 0; i < len; i++) arr.push(decodeValue(ctx));
      return arr;
    }
    case 5: {
      const len = toLen(value);
      const obj: Record<string, CborValue> = {};
      let prevKeyBytes: Uint8Array | null = null;
      for (let i = 0; i < len; i++) {
        const keyStartPos = ctx.pos;
        const key = decodeValue(ctx);
        if (typeof key !== "string") {
          throw new Error("canonical-cbor: non-string map key forbidden");
        }
        const keyBytes = ctx.buf.slice(keyStartPos, ctx.pos);
        if (prevKeyBytes !== null && compareBytes(prevKeyBytes, keyBytes) >= 0) {
          throw new Error("canonical-cbor: map keys not in bytewise-lex order");
        }
        prevKeyBytes = keyBytes;
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          throw new Error(`canonical-cbor: duplicate map key: ${key}`);
        }
        obj[key] = decodeValue(ctx);
      }
      return obj;
    }
  }

  throw new Error(`canonical-cbor: unreachable (major ${major})`);
}

function readByte(ctx: DecodeCtx): number {
  if (ctx.pos >= ctx.buf.length) throw new Error("canonical-cbor: unexpected end");
  return ctx.buf[ctx.pos++];
}

function readArgCanonical(ctx: DecodeCtx, info: number): number | bigint {
  if (info < 24) return info;
  if (info === 24) {
    const v = readByte(ctx);
    if (v < 24) throw new Error("canonical-cbor: non-canonical (1-byte length < 24)");
    return v;
  }
  if (info === 25) {
    const v = (readByte(ctx) << 8) | readByte(ctx);
    if (v < 0x100) throw new Error("canonical-cbor: non-canonical (2-byte length < 256)");
    return v;
  }
  if (info === 26) {
    const v = (readByte(ctx) * 0x1000000) + (readByte(ctx) << 16) + (readByte(ctx) << 8) + readByte(ctx);
    if (v < 0x10000) throw new Error("canonical-cbor: non-canonical (4-byte length < 65536)");
    return v;
  }
  if (info === 27) {
    let v = 0n;
    for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(readByte(ctx));
    if (v < 0x100000000n) throw new Error("canonical-cbor: non-canonical (8-byte length < 2^32)");
    return v;
  }
  throw new Error(`canonical-cbor: invalid additional info ${info}`);
}

function toLen(v: number | bigint): number {
  if (typeof v === "bigint") {
    if (v > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error("canonical-cbor: length exceeds safe integer range");
    }
    return Number(v);
  }
  return v;
}

// ────────────────────────────────────────────────────────────────────────
// HASHING (multihash sha-256 as hex string)
// ────────────────────────────────────────────────────────────────────────

export async function multihashSha256(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  return "1220" + hex;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
