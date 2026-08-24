// hsp-jcs@v0 — the wire layer of CNP-0-JCS (RFC-0003 Part 01 §5.1.2.1).
//
// RFC 8785 JCS over strict I-JSON. This file knows nothing about the `cnp-0`
// numeric profile: it is the byte encoding alone, so it can be checked for
// parity against Warrant's already-published JCS fixtures, which predate and do
// not contain the CNP-0 profile members.
//
// Two entry points, deliberately separate:
//   readStrict(bytes) — raw bytes to a value, rejecting what a decode-then-look
//     pipeline cannot see: invalid UTF-8, duplicate member names, malformed
//     escapes, unpaired surrogates, trailing bytes.
//   serialize(value)  — a value to its one canonical byte sequence.
//
// Integers are carried as bigint. A JSON number that is not an integer never
// becomes a JS number here, so no float ever enters the object model
// (§5.1.2 rule 2).

export type JValue =
  | null
  | boolean
  | string
  | bigint
  | JValue[]
  | JMap;

/** Insertion-ordered map. Canonical order is imposed at serialization. */
export type JMap = { readonly __map: true; entries: [string, JValue][] };

export function jmap(entries: [string, JValue][]): JMap {
  return { __map: true, entries };
}

export function isMap(v: JValue): v is JMap {
  return typeof v === "object" && v !== null && (v as JMap).__map === true;
}

/** Stable rejection classes. The set is closed; see CANONICAL_ENCODING.v0.1. */
export type RejectionClass =
  | "invalid-utf8"
  | "syntax"
  | "trailing-bytes"
  | "duplicate-member-name"
  | "malformed-escape"
  | "unpaired-surrogate"
  | "number-not-cnp0-integer"
  | "integer-out-of-range"
  | "signed-zero";

export class RejectError extends Error {
  constructor(readonly rejection: RejectionClass, message: string) {
    super(`${rejection}: ${message}`);
    this.name = "RejectError";
  }
}

export const INT_MAX = 9007199254740991n; // 2^53 - 1
export const INT_MIN = -9007199254740991n;

const WS = new Set([0x20, 0x09, 0x0a, 0x0d]);

/**
 * Decode raw bytes as UTF-8, rejecting every ill-formed sequence. The platform
 * decoder in fatal mode rejects overlong forms, surrogate halves encoded as
 * UTF-8, out-of-range scalars, and truncated sequences — the cases that
 * disappear if a pipeline decodes leniently before looking.
 */
export function decodeUtf8Strict(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false })
      .decode(bytes);
  } catch {
    throw new RejectError("invalid-utf8", "input is not well-formed UTF-8");
  }
}

class Reader {
  pos = 0;
  constructor(readonly s: string) {}

  error(rejection: RejectionClass, msg: string): never {
    throw new RejectError(rejection, `${msg} at offset ${this.pos}`);
  }

  peek(): string | undefined {
    return this.pos < this.s.length ? this.s[this.pos] : undefined;
  }

  skipWs(): void {
    while (this.pos < this.s.length) {
      const c = this.s.charCodeAt(this.pos);
      if (!WS.has(c)) break;
      this.pos++;
    }
  }

  expect(ch: string): void {
    if (this.s[this.pos] !== ch) this.error("syntax", `expected ${ch}`);
    this.pos++;
  }

  value(): JValue {
    this.skipWs();
    const c = this.peek();
    if (c === undefined) this.error("syntax", "unexpected end of input");
    if (c === "{") return this.object();
    if (c === "[") return this.array();
    if (c === '"') return this.string();
    if (c === "t") return this.literal("true", true);
    if (c === "f") return this.literal("false", false);
    if (c === "n") return this.literal("null", null);
    if (c === "-" || (c >= "0" && c <= "9")) return this.number();
    this.error("syntax", `unexpected character ${JSON.stringify(c)}`);
  }

  literal<T extends JValue>(word: string, v: T): T {
    if (this.s.slice(this.pos, this.pos + word.length) !== word) {
      this.error("syntax", `expected ${word}`);
    }
    this.pos += word.length;
    return v;
  }

  object(): JMap {
    this.expect("{");
    const entries: [string, JValue][] = [];
    const seen = new Set<string>();
    this.skipWs();
    if (this.peek() === "}") {
      this.pos++;
      return jmap(entries);
    }
    for (;;) {
      this.skipWs();
      if (this.peek() !== '"') this.error("syntax", "member name must be a string");
      const name = this.string();
      // §5.1.1 rule 4 / §5.1.2.1: unique in the RAW input, not last-wins.
      if (seen.has(name)) {
        this.error("duplicate-member-name", `member ${JSON.stringify(name)} repeats`);
      }
      seen.add(name);
      this.skipWs();
      this.expect(":");
      entries.push([name, this.value()]);
      this.skipWs();
      const c = this.peek();
      if (c === ",") {
        this.pos++;
        continue;
      }
      if (c === "}") {
        this.pos++;
        return jmap(entries);
      }
      this.error("syntax", "expected , or }");
    }
  }

  array(): JValue[] {
    this.expect("[");
    const out: JValue[] = [];
    this.skipWs();
    if (this.peek() === "]") {
      this.pos++;
      return out;
    }
    for (;;) {
      out.push(this.value());
      this.skipWs();
      const c = this.peek();
      if (c === ",") {
        this.pos++;
        continue;
      }
      if (c === "]") {
        this.pos++;
        return out;
      }
      this.error("syntax", "expected , or ]");
    }
  }

  string(): string {
    this.expect('"');
    let out = "";
    for (;;) {
      if (this.pos >= this.s.length) this.error("syntax", "unterminated string");
      const ch = this.s[this.pos];
      const code = this.s.charCodeAt(this.pos);
      if (ch === '"') {
        this.pos++;
        return out;
      }
      if (ch === "\\") {
        this.pos++;
        out += this.escape();
        continue;
      }
      // Raw control characters are not permitted in JSON strings.
      if (code < 0x20) this.error("syntax", "raw control character in string");
      // A non-BMP character arrives here as a well-formed surrogate PAIR: the
      // input was decoded with a fatal UTF-8 decoder, so a lone surrogate
      // cannot reach this point. Both code units are copied through.
      out += ch;
      this.pos++;
    }
  }

  escape(): string {
    const c = this.s[this.pos];
    this.pos++;
    switch (c) {
      case '"':
        return '"';
      case "\\":
        return "\\";
      case "/":
        return "/";
      case "b":
        return "\b";
      case "f":
        return "\f";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "u":
        return this.unicodeEscape();
      default:
        this.error("malformed-escape", `unknown escape \\${c ?? "<eof>"}`);
    }
  }

  hex4(): number {
    const h = this.s.slice(this.pos, this.pos + 4);
    if (h.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(h)) {
      this.error("malformed-escape", "\\u must be followed by four hex digits");
    }
    this.pos += 4;
    return parseInt(h, 16);
  }

  unicodeEscape(): string {
    const first = this.hex4();
    if (first >= 0xdc00 && first <= 0xdfff) {
      this.error("unpaired-surrogate", "low surrogate without a preceding high surrogate");
    }
    if (first >= 0xd800 && first <= 0xdbff) {
      if (this.s[this.pos] !== "\\" || this.s[this.pos + 1] !== "u") {
        this.error("unpaired-surrogate", "high surrogate without a following escape");
      }
      this.pos += 2;
      const second = this.hex4();
      if (second < 0xdc00 || second > 0xdfff) {
        this.error("unpaired-surrogate", "high surrogate not followed by a low surrogate");
      }
      return String.fromCharCode(first, second);
    }
    return String.fromCharCode(first);
  }

  number(): bigint {
    const start = this.pos;
    if (this.peek() === "-") this.pos++;
    const intStart = this.pos;
    if (this.peek() === "0") {
      this.pos++;
    } else if (this.peek() !== undefined && this.peek()! >= "1" && this.peek()! <= "9") {
      while (this.pos < this.s.length && this.s[this.pos] >= "0" && this.s[this.pos] <= "9") {
        this.pos++;
      }
    } else {
      this.error("syntax", "invalid number");
    }
    const intText = this.s.slice(intStart, this.pos);
    // Fraction or exponent: syntactically valid JSON, outside cnp-0.
    if (this.peek() === "." || this.peek() === "e" || this.peek() === "E") {
      // Consume the rest so the message points at the whole literal.
      while (
        this.pos < this.s.length && /[0-9eE+\-.]/.test(this.s[this.pos])
      ) this.pos++;
      throw new RejectError(
        "number-not-cnp0-integer",
        `${this.s.slice(start, this.pos)} is not an integer`,
      );
    }
    const negative = this.s[start] === "-";
    if (negative && intText === "0") {
      throw new RejectError("signed-zero", "-0 has no canonical cnp-0 form");
    }
    const v = BigInt(this.s.slice(start, this.pos));
    if (v > INT_MAX || v < INT_MIN) {
      throw new RejectError(
        "integer-out-of-range",
        `${v} is outside [-(2^53-1), 2^53-1]`,
      );
    }
    return v;
  }
}

/** Raw bytes to a value under hsp-jcs@v0's input rules. */
export function readStrict(bytes: Uint8Array): JValue {
  const text = decodeUtf8Strict(bytes);
  const r = new Reader(text);
  const v = r.value();
  r.skipWs();
  if (r.pos !== text.length) {
    throw new RejectError("trailing-bytes", `${text.length - r.pos} byte(s) after the value`);
  }
  return v;
}

const ESCAPES: Record<number, string> = {
  0x08: "\\b",
  0x09: "\\t",
  0x0a: "\\n",
  0x0c: "\\f",
  0x0d: "\\r",
  0x22: '\\"',
  0x5c: "\\\\",
};

/** RFC 8785 §3.2.2.2 string escaping: shortest form, lowercase \u00xx. */
export function escapeString(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const esc = ESCAPES[code];
    if (esc !== undefined) {
      out += esc;
    } else if (code < 0x20) {
      out += "\\u" + code.toString(16).padStart(4, "0");
    } else {
      out += s[i];
    }
  }
  return out + '"';
}

/** Serialize a value to its canonical text. Member names sort by UTF-16 code unit. */
export function serializeText(v: JValue): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "bigint") return v.toString(10);
  if (typeof v === "string") return escapeString(v);
  if (Array.isArray(v)) return "[" + v.map(serializeText).join(",") + "]";
  if (isMap(v)) {
    const sorted = [...v.entries].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return "{" +
      sorted.map(([k, val]) => escapeString(k) + ":" + serializeText(val)).join(",") +
      "}";
  }
  throw new RejectError("syntax", `unencodable value ${typeof v}`);
}

export function serialize(v: JValue): Uint8Array {
  return new TextEncoder().encode(serializeText(v));
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("odd-length hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
