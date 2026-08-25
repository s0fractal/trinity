// The verifier-only rejection path (RFC-0003 Part 01 §5.1.3).
//
// This file MUST NOT import the reference encoder, the canonicalizer, or the
// wire layer, and it does not. It starts from raw bytes, decides accept or
// reject, and — when it accepts — hashes the bytes exactly as received. It
// never repairs, reorders, reduces, quantizes, or re-encodes anything.
//
// It is deliberately built differently from `jcs.ts`: a byte-level scanner with
// its own UTF-8 validator, rather than a platform decode followed by a
// string-level parse. Written by the same author, so it is a SECOND CODE PATH
// and not an independent implementation (§5.1.3) — but the failure modes it can
// share with the encoder are narrowed to the ones a common misreading of the
// clause would produce, not the ones a shared helper would produce.
//
// It is also stricter than the encoder by design. The encoder canonicalizes
// non-canonical input; the verifier is asked whether these exact bytes are the
// canonical form, so key-order permutation and whitespace are rejections here
// and merely inputs there. Every such case is pinned in the corpus with both
// expectations.

export type VerifierRejection =
  | "invalid-utf8"
  | "syntax"
  | "trailing-bytes"
  | "duplicate-member-name"
  | "malformed-escape"
  | "unpaired-surrogate"
  | "number-not-cnp0-integer"
  | "integer-out-of-range"
  | "signed-zero"
  | "non-canonical-form"
  | "profile-identifier-invalid"
  | "bytes-hex-invalid"
  | "ratio-not-reduced"
  | "ratio-non-positive-denominator"
  | "ratio-zero-not-canonical"
  | "fixed-scale-in-value"
  | "tagged-form-invalid";

export type VerifyOutcome =
  | { ok: true; sha256: string }
  | { ok: false; rejection: VerifierRejection; detail: string; offset: number };

const INT_MAX = 9007199254740991n;
const INT_MIN = -9007199254740991n;

type RV =
  | { t: "null" }
  | { t: "bool"; v: boolean }
  | { t: "str"; v: string }
  | { t: "int"; v: bigint }
  | { t: "arr"; v: RV[] }
  | { t: "obj"; v: [string, RV][] };

class Bail extends Error {
  constructor(
    readonly rejection: VerifierRejection,
    readonly detail: string,
    readonly offset: number,
  ) {
    super(detail);
  }
}

const CTRL_SHORT: Record<number, number> = {
  0x08: 0x62, // \b
  0x09: 0x74, // \t
  0x0a: 0x6e, // \n
  0x0c: 0x66, // \f
  0x0d: 0x72, // \r
};

function isWs(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
}

class Scanner {
  i = 0;
  constructor(readonly b: Uint8Array) {}

  /** Canonical bytes carry no whitespace, anywhere. */
  noWs(): void {
    if (this.i < this.b.length && isWs(this.b[this.i])) {
      this.bail("non-canonical-form", "canonical bytes contain no whitespace");
    }
  }

  bail(rejection: VerifierRejection, detail: string): never {
    throw new Bail(rejection, detail, this.i);
  }

  byte(): number {
    if (this.i >= this.b.length) this.bail("syntax", "unexpected end of input");
    return this.b[this.i];
  }

  expect(ch: number): void {
    this.noWs();
    if (this.byte() !== ch) {
      this.bail("syntax", `expected ${JSON.stringify(String.fromCharCode(ch))}`);
    }
    this.i++;
  }

  value(): RV {
    this.noWs();
    const c = this.byte();
    if (c === 0x7b) return this.object();
    if (c === 0x5b) return this.array();
    if (c === 0x22) return { t: "str", v: this.string() };
    if (c === 0x74) return this.word("true", { t: "bool", v: true });
    if (c === 0x66) return this.word("false", { t: "bool", v: false });
    if (c === 0x6e) return this.word("null", { t: "null" });
    if (c === 0x2d || (c >= 0x30 && c <= 0x39)) return { t: "int", v: this.number() };
    if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
      this.bail("non-canonical-form", "canonical bytes contain no whitespace");
    }
    this.bail("syntax", `unexpected byte 0x${c.toString(16)}`);
  }

  word(w: string, v: RV): RV {
    for (let k = 0; k < w.length; k++) {
      if (this.b[this.i + k] !== w.charCodeAt(k)) this.bail("syntax", `expected ${w}`);
    }
    this.i += w.length;
    return v;
  }

  object(): RV {
    this.expect(0x7b);
    const out: [string, RV][] = [];
    this.noWs();
    if (this.byte() === 0x7d) {
      this.i++;
      return { t: "obj", v: out };
    }
    const seen = new Set<string>();
    let previous: string | undefined;
    for (;;) {
      this.noWs();
      if (this.byte() !== 0x22) this.bail("syntax", "member name must be a string");
      const at = this.i;
      const name = this.string();
      if (seen.has(name)) {
        this.i = at;
        this.bail("duplicate-member-name", `member ${JSON.stringify(name)} repeats`);
      }
      // RFC 8785 orders members by UTF-16 code units; JS string comparison is
      // exactly that comparison.
      if (previous !== undefined && name < previous) {
        this.i = at;
        this.bail(
          "non-canonical-form",
          `member ${JSON.stringify(name)} follows ${JSON.stringify(previous)} out of order`,
        );
      }
      seen.add(name);
      previous = name;
      this.expect(0x3a);
      out.push([name, this.value()]);
      const c = this.byte();
      if (c === 0x2c) {
        this.i++;
        continue;
      }
      if (c === 0x7d) {
        this.i++;
        return { t: "obj", v: out };
      }
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
        this.bail("non-canonical-form", "canonical bytes contain no whitespace");
      }
      this.bail("syntax", "expected , or }");
    }
  }

  array(): RV {
    this.expect(0x5b);
    const out: RV[] = [];
    if (this.byte() === 0x5d) {
      this.i++;
      return { t: "arr", v: out };
    }
    for (;;) {
      out.push(this.value());
      const c = this.byte();
      if (c === 0x2c) {
        this.i++;
        continue;
      }
      if (c === 0x5d) {
        this.i++;
        return { t: "arr", v: out };
      }
      if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) {
        this.bail("non-canonical-form", "canonical bytes contain no whitespace");
      }
      this.bail("syntax", "expected , or ]");
    }
  }

  /** Own UTF-8 decoder: rejects overlong forms, surrogate encodings, truncation. */
  codePoint(): number {
    const b0 = this.byte();
    if (b0 < 0x80) {
      this.i++;
      return b0;
    }
    const need = b0 >= 0xf0 ? 3 : b0 >= 0xe0 ? 2 : b0 >= 0xc0 ? 1 : -1;
    if (need < 0) this.bail("invalid-utf8", `stray continuation byte 0x${b0.toString(16)}`);
    if (this.i + need >= this.b.length) this.bail("invalid-utf8", "truncated sequence");
    let cp = b0 & (need === 1 ? 0x1f : need === 2 ? 0x0f : 0x07);
    for (let k = 1; k <= need; k++) {
      const bk = this.b[this.i + k];
      if ((bk & 0xc0) !== 0x80) this.bail("invalid-utf8", "bad continuation byte");
      cp = (cp << 6) | (bk & 0x3f);
    }
    const min = need === 1 ? 0x80 : need === 2 ? 0x800 : 0x10000;
    if (cp < min) this.bail("invalid-utf8", "overlong encoding");
    if (cp > 0x10ffff) this.bail("invalid-utf8", "code point above U+10FFFF");
    if (cp >= 0xd800 && cp <= 0xdfff) {
      this.bail("invalid-utf8", "surrogate half encoded as UTF-8");
    }
    this.i += need + 1;
    return cp;
  }

  hex4(): number {
    let v = 0;
    for (let k = 0; k < 4; k++) {
      const c = this.b[this.i + k];
      if (c === undefined) this.bail("malformed-escape", "truncated \\u escape");
      let d: number;
      if (c >= 0x30 && c <= 0x39) d = c - 0x30;
      else if (c >= 0x61 && c <= 0x66) d = c - 0x61 + 10;
      else if (c >= 0x41 && c <= 0x46) {
        this.bail("non-canonical-form", "\\u escapes use lowercase hexadecimal");
      } else this.bail("malformed-escape", "\\u must be followed by four hex digits");
      v = (v << 4) | d;
    }
    this.i += 4;
    return v;
  }

  string(): string {
    this.expect(0x22);
    let out = "";
    for (;;) {
      const c = this.byte();
      if (c === 0x22) {
        this.i++;
        return out;
      }
      if (c === 0x5c) {
        this.i++;
        const e = this.byte();
        this.i++;
        switch (e) {
          case 0x22:
            out += '"';
            continue;
          case 0x5c:
            out += "\\";
            continue;
          case 0x62:
            out += "\b";
            continue;
          case 0x66:
            out += "\f";
            continue;
          case 0x6e:
            out += "\n";
            continue;
          case 0x72:
            out += "\r";
            continue;
          case 0x74:
            out += "\t";
            continue;
          case 0x2f:
            this.bail("non-canonical-form", "canonical form writes / literally");
            break;
          case 0x75: {
            const cp = this.hex4();
            if (cp >= 0xdc00 && cp <= 0xdfff) {
              this.bail("unpaired-surrogate", "low surrogate without a high surrogate");
            }
            if (cp >= 0xd800 && cp <= 0xdbff) {
              if (this.b[this.i] !== 0x5c || this.b[this.i + 1] !== 0x75) {
                this.bail("unpaired-surrogate", "high surrogate without a following escape");
              }
              this.i += 2;
              const lo = this.hex4();
              if (lo < 0xdc00 || lo > 0xdfff) {
                this.bail("unpaired-surrogate", "high surrogate not followed by a low surrogate");
              }
              // A non-BMP character is written literally in canonical form.
              this.bail("non-canonical-form", "\\u escape for a character above U+001F");
            }
            if (cp >= 0x20) {
              this.bail("non-canonical-form", "\\u escape for a character above U+001F");
            }
            if (CTRL_SHORT[cp] !== undefined) {
              this.bail("non-canonical-form", "control character has a shorter escape");
            }
            out += String.fromCharCode(cp);
            continue;
          }
          default:
            this.i -= 1;
            this.bail("malformed-escape", `unknown escape \\${String.fromCharCode(e)}`);
        }
      }
      if (c < 0x20) this.bail("syntax", "raw control character in string");
      out += String.fromCodePoint(this.codePoint());
    }
  }

  number(): bigint {
    const start = this.i;
    if (this.byte() === 0x2d) this.i++;
    const digitsAt = this.i;
    const first = this.byte();
    if (first === 0x30) {
      this.i++;
    } else if (first >= 0x31 && first <= 0x39) {
      while (this.i < this.b.length && this.b[this.i] >= 0x30 && this.b[this.i] <= 0x39) this.i++;
    } else {
      this.bail("syntax", "invalid number");
    }
    const next = this.i < this.b.length ? this.b[this.i] : -1;
    if (next === 0x2e || next === 0x65 || next === 0x45) {
      this.bail("number-not-cnp0-integer", "fractions and exponents are not cnp-0 numbers");
    }
    if (next >= 0x30 && next <= 0x39) this.bail("syntax", "leading zero");
    const text = new TextDecoder().decode(this.b.subarray(start, this.i));
    if (text === "-0") this.bail("signed-zero", "-0 has no canonical cnp-0 form");
    if (this.b[digitsAt] === 0x30 && this.i - digitsAt > 1) this.bail("syntax", "leading zero");
    const v = BigInt(text);
    if (v > INT_MAX || v < INT_MIN) {
      this.bail("integer-out-of-range", `${v} is outside [-(2^53-1), 2^53-1]`);
    }
    return v;
  }
}

/* --- cnp-0 profile checks, implemented separately from cnp0.ts --- */

function member(o: [string, RV][], name: string): RV | undefined {
  for (const [k, v] of o) if (k === name) return v;
  return undefined;
}

/** §5.1.2.1 recognition, implemented independently of the encoder: the reserved
 *  member name is the discriminator, and it is reserved in every position. A map
 *  that does not carry it is an ordinary map whatever else it is named. */
const TAG = "cnp0";

function checkTagged(s: Scanner, node: RV): void {
  if (node.t === "arr") {
    for (const x of node.v) checkTagged(s, x);
    return;
  }
  if (node.t !== "obj") return;

  const tag = member(node.v, TAG);
  if (tag !== undefined) {
    if (tag.t !== "str") {
      s.bail("tagged-form-invalid", `${TAG} must be a string`);
    }
    const kind = (tag as { t: "str"; v: string }).v;
    const keys = node.v.map(([k]) => k).sort();
    if (kind === "bytes") {
      if (keys.join(",") !== `${TAG},hex`) {
        s.bail("tagged-form-invalid", `bytes takes exactly {${TAG}, hex}`);
      }
      const hex = member(node.v, "hex");
      if (hex === undefined || hex.t !== "str") {
        s.bail("bytes-hex-invalid", "hex must be a string");
      }
      const h = (hex as { t: "str"; v: string }).v;
      if (h.length % 2 !== 0) s.bail("bytes-hex-invalid", "hex must have even length");
      for (const ch of h) {
        if (!((ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f"))) {
          s.bail("bytes-hex-invalid", "hex must be lowercase hexadecimal");
        }
      }
    } else if (kind === "ratio") {
      if (keys.join(",") !== `${TAG},den,num`) {
        s.bail("tagged-form-invalid", `ratio takes exactly {${TAG}, num, den}`);
      }
      const num = member(node.v, "num");
      const den = member(node.v, "den");
      if (num?.t !== "int" || den?.t !== "int") {
        s.bail("tagged-form-invalid", "ratio components must be integers");
      }
      const n = (num as { t: "int"; v: bigint }).v;
      const d = (den as { t: "int"; v: bigint }).v;
      if (d <= 0n) s.bail("ratio-non-positive-denominator", "den must be > 0");
      if (n === 0n && d !== 1n) s.bail("ratio-zero-not-canonical", `zero is {${TAG}:"ratio",num:0,den:1}`);
      if (n !== 0n) {
        let a = n < 0n ? -n : n;
        let b = d;
        while (b) [a, b] = [b, a % b];
        if (a !== 1n) s.bail("ratio-not-reduced", `${n}/${d} is not in lowest terms`);
      }
    } else if (kind === "fixed") {
      if (keys.includes("scale") || keys.includes("scale_id")) {
        s.bail("fixed-scale-in-value", "scale is bound by the domain, not per value");
      }
      if (keys.join(",") !== `${TAG},value`) {
        s.bail("tagged-form-invalid", `fixed takes exactly {${TAG}, value}`);
      }
      if (member(node.v, "value")?.t !== "int") {
        s.bail("tagged-form-invalid", "fixed value must be an integer");
      }
    } else {
      // The name is reserved, so an unrecognized value is a rejection rather
      // than a licence to read the map as an ordinary one.
      s.bail("tagged-form-invalid", `${TAG} must be one of bytes, ratio, fixed`);
    }
  }
  for (const [, v] of node.v) checkTagged(s, v);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Decide whether these exact bytes are a canonical CNP-0-JCS encoding. On
 * acceptance the digest is over the input bytes as received.
 */
export async function verifyRaw(bytes: Uint8Array): Promise<VerifyOutcome> {
  const s = new Scanner(bytes);
  try {
    if (bytes.length === 0) s.bail("syntax", "empty input");
    const root = s.value();
    if (s.i !== bytes.length) {
      const rest = bytes.subarray(s.i);
      const ws = [...rest].every((c) => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d);
      s.bail(
        ws ? "non-canonical-form" : "trailing-bytes",
        `${rest.length} byte(s) after the value`,
      );
    }
    if (root.t !== "obj") {
      throw new Bail("profile-identifier-invalid", "the hashed root must be an object", s.i);
    }
    const enc = member(root.v, "canonical_encoding");
    const prof = member(root.v, "numeric_profile");
    if (enc?.t !== "str" || enc.v !== "hsp-jcs@v0") {
      s.bail("profile-identifier-invalid", 'canonical_encoding must be "hsp-jcs@v0"');
    }
    if (prof?.t !== "str" || prof.v !== "cnp-0") {
      s.bail("profile-identifier-invalid", 'numeric_profile must be "cnp-0"');
    }
    checkTagged(s, root);
  } catch (e) {
    if (e instanceof Bail) {
      return { ok: false, rejection: e.rejection, detail: e.detail, offset: e.offset };
    }
    throw e;
  }
  return { ok: true, sha256: await sha256Hex(bytes) };
}
