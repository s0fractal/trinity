#!/usr/bin/env python3
"""Author corpus/manifest.json for the CNP-0 executable seed.

This is an AUTHORING tool, not part of the gate. It runs once, its output is
committed, and the runner never invokes it. Canonical bytes and SHA-256 digests
in the manifest therefore come from this Python code path and hashlib, not from
the TypeScript encoder the gate exercises — so the gate compares two code paths
rather than comparing the encoder with itself.

Usage:
    python3 tools/build_manifest.py            # write corpus/manifest.json
    python3 tools/build_manifest.py --check    # fail if the committed file differs
"""

from __future__ import annotations

import hashlib
import json
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jcs_py import canonical_bytes, serialize  # noqa: E402

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(HERE, "corpus", "manifest.json")
LUT_PATH = os.path.join(HERE, "corpus", "circle256-lut.cnp0.json")

ENC = "hsp-jcs@v0"
PROF = "cnp-0"

CASES: list[dict] = []


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def env(**payload) -> dict:
    """A hashed root always carries both profile identifiers (§5.1.2.1)."""
    return {"canonical_encoding": ENC, "numeric_profile": PROF, **payload}


def positive(cid, category, clause, title, value, raw=None, verifier=None, group=None):
    """A case the reference encoder accepts."""
    canon = serialize(value)
    raw_text = canon if raw is None else raw
    case = {
        "id": cid,
        "category": category,
        "clause": clause,
        "title": title,
        "kind": "encode",
        "raw": raw_text,
        "encoder": {
            "accept": {"canonical": canon, "sha256": sha(canon.encode("utf-8"))}
        },
        "verifier": verifier if verifier is not None else "accept",
    }
    if group:
        case["digest_group"] = group
    CASES.append(case)


def negative(cid, category, clause, title, raw, encoder_rejects,
             verifier_rejects=None, raw_hex=None):
    """A case the reference encoder rejects."""
    case = {
        "id": cid,
        "category": category,
        "clause": clause,
        "title": title,
        "kind": "encode",
        "encoder": {"reject": encoder_rejects},
        "verifier": {"reject": verifier_rejects or encoder_rejects},
    }
    if raw_hex is not None:
        case["raw_hex"] = raw_hex
    else:
        case["raw"] = raw
    CASES.append(case)


def other(cid, category, clause, title, kind, **fields):
    CASES.append({
        "id": cid, "category": category, "clause": clause,
        "title": title, "kind": kind, **fields,
    })


def bits(x: float) -> str:
    return struct.pack(">d", x).hex()


# --------------------------------------------------------------------------
# Category 1 — zero, one, minus one, and both CNP-0 integer bounds
# --------------------------------------------------------------------------
C1 = "§5.1.3(1)"
positive("c1-int-zero", 1, C1, "integer zero", env(v=0))
positive("c1-int-one", 1, C1, "integer one", env(v=1))
positive("c1-int-minus-one", 1, C1, "integer minus one", env(v=-1))
positive("c1-int-max", 1, C1, "upper cnp-0 bound 2^53-1", env(v=2**53 - 1))
positive("c1-int-min", 1, C1, "lower cnp-0 bound -(2^53-1)", env(v=-(2**53 - 1)))
negative("c1-int-above-max", 1, C1, "one past the upper bound",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":9007199254740992}',
         "integer-out-of-range")
negative("c1-int-below-min", 1, C1, "one past the lower bound",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":-9007199254740992}',
         "integer-out-of-range")
negative("c1-signed-zero", 1, "§5.1.2(2)", "negative zero spelling",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":-0}',
         "signed-zero")

# --------------------------------------------------------------------------
# Category 2 — ratios and the rejections named in §5.1.3(2)
# --------------------------------------------------------------------------
C2 = "§5.1.3(2)"
ratio = lambda n, d: {"cnp0": "ratio", "num": n, "den": d}  # noqa: E731
positive("c2-ratio-third", 2, C2, "one third", env(v=ratio(1, 3)))
positive("c2-ratio-neg-third", 2, C2, "minus one third; sign lives in num",
         env(v=ratio(-1, 3)))
positive("c2-ratio-zero", 2, C2, "canonical zero is 0/1", env(v=ratio(0, 1)))
negative("c2-ratio-unreduced", 2, C2, "2/4 is a second encoding of 1/2",
         serialize(env(v=ratio(2, 4))), "ratio-not-reduced")
negative("c2-ratio-zero-den-two", 2, C2, "0/2 is a second encoding of zero",
         serialize(env(v=ratio(0, 2))), "ratio-zero-not-canonical")
negative("c2-ratio-negative-den", 2, C2, "negative denominator",
         serialize(env(v=ratio(1, -3))), "ratio-non-positive-denominator")
negative("c2-ratio-zero-den", 2, C2, "zero denominator",
         serialize(env(v=ratio(1, 0))), "ratio-non-positive-denominator")
negative("c2-ratio-overflow", 2, C2, "ratio component outside the integer range",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"v":{"cnp0":"ratio","den":3,"num":9007199254740992}}',
         "integer-out-of-range")
negative("c2-float", 2, C2, "float literal",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":0.5}',
         "number-not-cnp0-integer")
negative("c2-exponent", 2, C2, "exponent notation",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":1e3}',
         "number-not-cnp0-integer")
negative("c2-decimal-integer", 2, C2, "integral value written with a fraction part",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":1.0}',
         "number-not-cnp0-integer")
positive("c2-kind-ratio-is-an-ordinary-map", 2, "§5.1.2.1",
         "a map with kind:\"ratio\" is an ordinary map, unreduced and all: the "
         "profile reserves cnp0, not kind",
         env(v={"kind": "ratio", "num": 2, "den": 4}))
negative("c2-cnp0-unknown-tag", 2, "§5.1.2.1",
         "the reserved member with an unrecognized value is rejected, not read "
         "as an ordinary map",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"v":{"cnp0":"decimal","value":1}}',
         "tagged-form-invalid")
negative("c2-cnp0-extra-member", 2, "§5.1.2.1",
         "a tagged form with a member the form does not define",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"v":{"cnp0":"ratio","den":3,"note":"x","num":1}}',
         "tagged-form-invalid")
negative("c2-duplicate-root", 2, C2, "duplicate member name at the root",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"numeric_profile":"cnp-0","v":1}',
         "duplicate-member-name")
negative("c2-duplicate-nested", 2, C2, "duplicate member name nested inside a ratio",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"v":{"cnp0":"ratio","den":3,"num":1,"num":2}}',
         "duplicate-member-name")

# --------------------------------------------------------------------------
# Category 3 — one fixed integer under two scale descriptors
# --------------------------------------------------------------------------
C3 = "§5.1.3(3)"


def scale(radix, places, unit_ref=None):
    return {"canonical_encoding": ENC, "numeric_profile": PROF,
            "scale": "hsp-scale@v0", "radix": radix, "places": places,
            "unit_ref": unit_ref}


s6 = scale(10, 6)
s3 = scale(10, 3)
s6_digest = sha(canonical_bytes(s6))
s3_digest = sha(canonical_bytes(s3))

positive("c3-scale-10e6", 3, "§5.1.2.2", "scale descriptor radix 10 places 6",
         s6, group="scale-descriptors")
positive("c3-scale-10e3", 3, "§5.1.2.2", "scale descriptor radix 10 places 3",
         s3, group="scale-descriptors")
positive("c3-point-at-10e6", 3, C3,
         "value 1500000 bound to the places-6 domain: 1.5",
         env(point={"cnp0": "fixed", "value": 1500000}, scale_ref=s6_digest),
         group="same-integer-two-domains")
positive("c3-point-at-10e3", 3, C3,
         "the same integer bound to the places-3 domain: 1500.0",
         env(point={"cnp0": "fixed", "value": 1500000}, scale_ref=s3_digest),
         group="same-integer-two-domains")
negative("c3-scale-in-value", 3, "§5.1.2.2",
         "a fixed value repeating its own scale is a second source of truth",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
         '"point":{"cnp0":"fixed","scale":6,"value":1500000}}',
         "fixed-scale-in-value")
other("c3-scale-radix-three", 3, "§5.1.2.2", "radix must be 2 or 10",
      "scale", descriptor=scale(3, 6), expect={"reject": "scale-descriptor-invalid"})
other("c3-scale-negative-places", 3, "§5.1.2.2", "places must be non-negative",
      "scale", descriptor=scale(10, -1), expect={"reject": "scale-descriptor-invalid"})
other("c3-scale-overflow", 3, "§5.1.2.2",
      "radix^places must lie inside the cnp-0 integer range",
      "scale", descriptor=scale(10, 20), expect={"reject": "scale-descriptor-invalid"})
other("c3-scale-valid-binary", 3, "§5.1.2.2", "radix 2 is admissible",
      "scale", descriptor=scale(2, 10), expect={"accept": {"total": 1024}})
other("c3-scale-unit-ref-digest", 3, "§5.1.2.2",
      "unit_ref may be a full content digest",
      "scale", descriptor=scale(10, 6, s6_digest),
      expect={"accept": {"total": 10**6}})
other("c3-scale-unit-ref-not-a-digest", 3, "§5.1.2.2",
      "an opaque handle is not a full content digest",
      "scale", descriptor=scale(10, 6, "not-a-full-content-digest"),
      expect={"reject": "scale-descriptor-invalid"})
other("c3-scale-unit-ref-truncated", 3, "§5.1.2.2",
      "a truncated digest is not a full digest",
      "scale", descriptor=scale(10, 6, s6_digest[:12]),
      expect={"reject": "scale-descriptor-invalid"})
other("c3-scale-unit-ref-uppercase", 3, "§5.1.2.2",
      "an uppercase digest is rejected, not normalized",
      "scale", descriptor=scale(10, 6, s6_digest.upper()),
      expect={"reject": "scale-descriptor-invalid"})

# --------------------------------------------------------------------------
# Category 4 — simplexes and largest-remainder renormalization
# --------------------------------------------------------------------------
C4 = "§5.1.3(4)"
positive("c4-ratio-simplex", 4, C4, "exact ratio simplex 1/2 + 1/3 + 1/6",
         env(simplex=[ratio(1, 2), ratio(1, 3), ratio(1, 6)]))
other("c4-ratio-simplex-sum-ok", 4, C4, "ratio simplex sums to exactly one",
      "ratio-simplex", parts=[[1, 2], [1, 3], [1, 6]], expect={"accept": True})
other("c4-ratio-simplex-sum-bad", 4, C4, "ratio simplex that does not sum to one",
      "ratio-simplex", parts=[[1, 2], [1, 3], [1, 7]],
      expect={"reject": "simplex-sum-invalid"})
other("c4-ratio-simplex-negative", 4, C4, "negative ratio component",
      "ratio-simplex", parts=[[-1, 2], [3, 2]],
      expect={"reject": "simplex-negative-weight"})
positive("c4-fixed-simplex", 4, C4, "exact fixed-point simplex at places 6",
         env(scale_ref=s6_digest, simplex=[
             {"cnp0": "fixed", "value": 500000},
             {"cnp0": "fixed", "value": 300000},
             {"cnp0": "fixed", "value": 200000},
         ]))
other("c4-fixed-simplex-ok", 4, C4, "fixed simplex sums to radix^places",
      "fixed-simplex", weights=[500000, 300000, 200000], total=10**6,
      expect={"accept": True})
other("c4-fixed-simplex-bad", 4, C4, "fixed simplex with an invalid sum",
      "fixed-simplex", weights=[500000, 300000, 100000], total=10**6,
      expect={"reject": "simplex-sum-invalid"})
other("c4-fixed-simplex-zero", 4, C4, "fixed simplex summing to zero",
      "fixed-simplex", weights=[0, 0, 0], total=10**6,
      expect={"reject": "simplex-zero-sum"})
other("c4-renorm-distinct-remainders", 4, "§5.1.2.6",
      "largest-remainder allocation with distinct remainders",
      "renormalize",
      components=[["a", 1], ["b", 2], ["c", 4]], total=10,
      expect={"accept": {"weights": [1, 3, 6], "renormalized": True}})
other("c4-renorm-tie-by-coordinate", 4, "§5.1.2.6",
      "a tie in remainders is broken by ascending canonical coordinate bytes",
      "renormalize",
      components=[["a", 1], ["b", 1], ["c", 1]], total=10,
      expect={"accept": {"weights": [4, 3, 3], "renormalized": True}})
other("c4-renorm-presentation-permuted", 4, "§5.1.2.6",
      "input array position is not a tie-breaker: the same components presented "
      "in a different order allocate identically per coordinate",
      "renormalize",
      components=[["c", 4], ["a", 1], ["b", 2]], total=10,
      expect={"accept": {"weights": [6, 1, 3], "renormalized": True}})
other("c4-renorm-already-exact", 4, "§5.1.2.6",
      "weights that already sum to the target are returned unchanged",
      "renormalize",
      components=[["a", 5], ["b", 5]], total=10,
      expect={"accept": {"weights": [5, 5], "renormalized": False}})
other("c4-renorm-zero-sum", 4, "§5.1.2.6", "zero sum must be rejected",
      "renormalize", components=[["a", 0], ["b", 0]], total=10,
      expect={"reject": "renormalize-zero-sum"})
other("c4-renorm-negative", 4, "§5.1.2.6", "negative weight must be rejected",
      "renormalize", components=[["a", -1], ["b", 2]], total=10,
      expect={"reject": "renormalize-negative-weight"})
other("c4-renorm-duplicate-coordinate", 4, "§5.1.2.6",
      "a coordinate identifier bound to two components makes the tie-break "
      "a function of presentation order, so it is rejected",
      "renormalize", components=[["a", 1], ["a", 1], ["b", 1]], total=10,
      expect={"reject": "renormalize-duplicate-coordinate"})
other("c4-renorm-duplicate-anonymous", 4, "§5.1.2.6",
      "the same rule for an ordered anonymous vector's integer indices",
      "renormalize", components=[[0, 1], [0, 1]], total=10,
      expect={"reject": "renormalize-duplicate-coordinate"})
other("c4-renorm-anonymous-index", 4, "§5.1.2.6",
      "an ordered anonymous vector uses its cnp-0 integer index as the "
      "coordinate identifier, so 0 wins the tie over 1",
      "renormalize", components=[[0, 1], [1, 1], [2, 1]], total=10,
      expect={"accept": {"weights": [4, 3, 3], "renormalized": True}})

# --------------------------------------------------------------------------
# Category 5 — profile-identifier and pinned-constant mutation
# --------------------------------------------------------------------------
C5 = "§5.1.3(5)"
negative("c5-profile-mutated", 5, C5, "numeric_profile mutated to cnp-1",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-1","v":1}',
         "profile-identifier-invalid")
negative("c5-encoding-mutated", 5, C5, "canonical_encoding mutated to hsp-jcs@v1",
         '{"canonical_encoding":"hsp-jcs@v1","numeric_profile":"cnp-0","v":1}',
         "profile-identifier-invalid")
negative("c5-profile-absent", 5, C5, "root without the profile identifiers",
         '{"v":1}', "profile-identifier-invalid")
positive("c5-pinned-constant", 5, C5,
         "a pinned constant descriptor (§5.1.2.3 strategy `pinned`)",
         env(constant_strategy="pinned", digits=[3, 1, 4, 1, 5, 9, 2, 6],
             scale_ref=s6_digest),
         group="pinned-constant-mutation")
positive("c5-pinned-constant-mutated", 5, C5,
         "one digit of the pinned constant changed: a different reference",
         env(constant_strategy="pinned", digits=[3, 1, 4, 1, 5, 9, 2, 7],
             scale_ref=s6_digest),
         group="pinned-constant-mutation")

# --------------------------------------------------------------------------
# Category 6 — byte strings, strings, key order, empty containers
# --------------------------------------------------------------------------
C6 = "§5.1.3(6)"
positive("c6-bytes", 6, C6, "byte projection",
         env(b={"cnp0": "bytes", "hex": "00ff10"}))
positive("c6-bytes-empty", 6, C6, "empty byte string",
         env(b={"cnp0": "bytes", "hex": ""}))
negative("c6-bytes-uppercase", 6, C6, "uppercase hex is rejected, not normalized",
         '{"b":{"cnp0":"bytes","hex":"00FF"},"canonical_encoding":"hsp-jcs@v0",'
         '"numeric_profile":"cnp-0"}',
         "bytes-hex-invalid")
negative("c6-bytes-odd-length", 6, C6, "odd-length hex",
         '{"b":{"cnp0":"bytes","hex":"0f0"},"canonical_encoding":"hsp-jcs@v0",'
         '"numeric_profile":"cnp-0"}',
         "bytes-hex-invalid")
negative("c6-bytes-non-hex", 6, C6, "non-hexadecimal content",
         '{"b":{"cnp0":"bytes","hex":"zz"},"canonical_encoding":"hsp-jcs@v0",'
         '"numeric_profile":"cnp-0"}',
         "bytes-hex-invalid")
negative("c6-bytes-length-member", 6, C6, "length is derived and must not be repeated",
         '{"b":{"cnp0":"bytes","hex":"00ff","len":2},'
         '"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0"}',
         "tagged-form-invalid")
positive("c6-string-nfc", 6, C6, "precomposed e-acute (U+00E9)",
         env(s="é"), group="normalization-distinct")
positive("c6-string-nfd", 6, C6, "decomposed e-acute (U+0065 U+0301)",
         env(s="é"), group="normalization-distinct")
positive("c6-string-escapes", 6, C6,
         "quote, backslash, and the control characters with short escapes",
         env(s="\"\\\b\f\n\r\t"))
positive("c6-string-control-u", 6, C6,
         "a control character with no short escape uses lowercase \\u00xx",
         env(s=""))
positive("c6-string-astral", 6, C6,
         "a non-BMP character is written literally in canonical form",
         env(s="\U0001d11e"),
         raw='{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0",'
             '"s":"\\ud834\\udd1e"}',
         verifier={"reject": "non-canonical-form"})
positive("c6-key-order-permuted", 6, C6,
         "member order is imposed by the encoder and rejected by the verifier",
         env(a=1, z=2),
         raw='{"z":2,"numeric_profile":"cnp-0","canonical_encoding":"hsp-jcs@v0","a":1}',
         verifier={"reject": "non-canonical-form"})
positive("c6-whitespace", 6, C6,
         "insignificant whitespace is input to the encoder and not canonical bytes",
         env(a=1),
         raw='{\n  "canonical_encoding": "hsp-jcs@v0",\n'
             '  "numeric_profile": "cnp-0",\n  "a": 1\n}',
         verifier={"reject": "non-canonical-form"})
positive("c6-solidus-escape", 6, C6,
         "an escaped solidus is legal JSON input and not canonical output",
         env(s="a/b"),
         raw='{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"a\\/b"}',
         verifier={"reject": "non-canonical-form"})
positive("c6-empty-containers", 6, C6, "nested empty containers",
         env(arr=[], obj={}, nested=[[], {}, {"inner": []}]))
positive("c6-utf16-order", 6, C6,
         "member order is by UTF-16 code unit, so U+FFFD sorts after a non-BMP key",
         env(**{"\U0001d11e": 1, "�": 2}))
negative("c6-raw-control", 6, C6, "a raw control character inside a string",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"a\tb"}',
         "syntax")
negative("c6-bad-escape", 6, C6, "unknown escape",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"a\\xb"}',
         "malformed-escape")
negative("c6-short-u-escape", 6, C6, "truncated \\u escape",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"a\\u12"}',
         "malformed-escape")
negative("c6-unpaired-high", 6, C6, "high surrogate with no low surrogate",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"\\ud834"}',
         "unpaired-surrogate")
negative("c6-unpaired-low", 6, C6, "low surrogate with no high surrogate",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"\\udd1e"}',
         "unpaired-surrogate")
negative("c6-invalid-utf8", 6, C6, "a lone 0xff byte inside a string", None,
         "invalid-utf8",
         raw_hex=(b'{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"'
                  + bytes([0xff]) + b'"}').hex())
negative("c6-overlong-utf8", 6, C6, "an overlong two-byte encoding of '/'", None,
         "invalid-utf8",
         raw_hex=(b'{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"'
                  + bytes([0xc0, 0xaf]) + b'"}').hex())
negative("c6-surrogate-in-utf8", 6, C6, "a surrogate half encoded as UTF-8", None,
         "invalid-utf8",
         raw_hex=(b'{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","s":"'
                  + bytes([0xed, 0xa0, 0x80]) + b'"}').hex())
negative("c6-trailing-bytes", 6, C6, "a second value after the root",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":1}{}',
         "trailing-bytes")
negative("c6-trailing-garbage", 6, C6, "non-JSON bytes after the root",
         '{"canonical_encoding":"hsp-jcs@v0","numeric_profile":"cnp-0","v":1}x',
         "trailing-bytes")
negative("c6-root-not-object", 6, C6, "an array root cannot carry the identifiers",
         '[1,2]', "profile-identifier-invalid")

# --------------------------------------------------------------------------
# Category 7 — circle256
# --------------------------------------------------------------------------
C7 = "§5.1.3(7)"
other("c7-rotation", 7, "§5.1.2.4", "addition is exact modulo 2^8",
      "circle", op="add", a=250, b=10, expect={"index": 4})
other("c7-rotation-wrap", 7, "§5.1.2.4",
      "the sum of two valid points wraps at the modulus",
      "circle", op="add", a=255, b=1, expect={"index": 0})
other("c7-equality-same", 7, "§5.1.2.4",
      "equality is equality of indices",
      "circle", op="equal", a=17, b=17, expect={"equal": True})
other("c7-equality-different", 7, "§5.1.2.4",
      "two distinct indices are two distinct points",
      "circle", op="equal", a=17, b=18, expect={"equal": False})
other("c7-negative-point", 7, "§5.1.2.4",
      "-1 is not an index in [0, 2^n) and is rejected, not normalized to 255",
      "circle", op="point", a=-1,
      expect={"reject": "circle-point-out-of-range"})
other("c7-out-of-range-point", 7, "§5.1.2.4",
      "2^n is not a point either: normalizing it would make two distinct "
      "inputs equal",
      "circle", op="point", a=256,
      expect={"reject": "circle-point-out-of-range"})
other("c7-out-of-range-operand", 7, "§5.1.2.4",
      "the modulus applies to the sum, never to an out-of-range operand",
      "circle", op="add", a=250, b=300,
      expect={"reject": "circle-point-out-of-range"})
other("c7-point-in-range", 7, "§5.1.2.4", "both bounds of the point interval",
      "circle", op="point", a=255, expect={"index": 255})
other("c7-lut", 7, C7,
      "the pinned sine lookup table is content-addressed and bound to the domain",
      "file", path="corpus/circle256-lut.cnp0.json",
      mutation={"byte_index": None, "note": "filled in below"})

# --------------------------------------------------------------------------
# Category 8 — every quantization boundary of §5.1.2.5-§5.1.2.6
# --------------------------------------------------------------------------
C8 = "§5.1.3(8)"


def quant(cid, title, x, mode, radix, places, expect):
    other(cid, 8, "§5.1.2.5", title, "quantize",
          f64_hex=bits(x), decimal_note=repr(x), mode=mode,
          radix=radix, places=places, expect=expect)


quant("c8-half-trunc", "positive tie under trunc_toward_zero",
      0.5, "trunc_toward_zero", 10, 0, {"accept": {"value": 0, "exact": False}})
quant("c8-half-ties-even", "positive tie under round_ties_even lands on zero",
      0.5, "round_ties_even", 10, 0, {"accept": {"value": 0, "exact": False}})
quant("c8-half-reject", "positive tie under reject",
      0.5, "reject", 10, 0, {"reject": "quantization-not-representable"})
quant("c8-three-halves-ties-even", "1.5 ties to the even neighbour, 2",
      1.5, "round_ties_even", 10, 0, {"accept": {"value": 2, "exact": False}})
quant("c8-neg-half-trunc", "negative tie truncates toward zero",
      -0.5, "trunc_toward_zero", 10, 0, {"accept": {"value": 0, "exact": False}})
quant("c8-neg-half-ties-even", "negative tie rounds to the even neighbour",
      -0.5, "round_ties_even", 10, 0, {"accept": {"value": 0, "exact": False}})
quant("c8-neg-three-halves", "-1.5 ties to -2",
      -1.5, "round_ties_even", 10, 0, {"accept": {"value": -2, "exact": False}})
quant("c8-exact-quarter", "0.25 at places 2 is exactly representable",
      0.25, "reject", 10, 2, {"accept": {"value": 25, "exact": True}})
quant("c8-decimal-tenth-reject",
      "0.1 looks exact in decimal and is not a binary64 value: reject catches it",
      0.1, "reject", 10, 1, {"reject": "quantization-not-representable"})
quant("c8-decimal-tenth-round",
      "the same value under round_ties_even lands just inside",
      0.1, "round_ties_even", 10, 1, {"accept": {"value": 1, "exact": False}})
quant("c8-decimal-tenth-trunc",
      "and truncates to the same integer, one ulp above one tenth",
      0.1, "trunc_toward_zero", 10, 1, {"accept": {"value": 1, "exact": False}})
quant("c8-negative-zero", "signed zero quantizes to the integer zero",
      -0.0, "reject", 10, 6, {"accept": {"value": 0, "exact": True}})
quant("c8-positive-zero", "positive zero quantizes to the same integer zero",
      0.0, "reject", 10, 6, {"accept": {"value": 0, "exact": True}})
quant("c8-just-inside-max", "the largest safe integer is representable at places 0",
      float(2**53 - 1), "reject", 10, 0,
      {"accept": {"value": 2**53 - 1, "exact": True}})
quant("c8-just-outside-max", "one step further overflows the cnp-0 range",
      float(2**53), "reject", 10, 0, {"reject": "quantization-overflow"})
quant("c8-overflow-scale", "a scale that pushes an in-range value out of range",
      1.0e300, "trunc_toward_zero", 10, 0, {"reject": "quantization-overflow"})
quant("c8-nan", "NaN is not a value a state may hold",
      float("nan"), "reject", 10, 6, {"reject": "quantization-nan"})
quant("c8-positive-infinity", "positive infinity is rejected",
      float("inf"), "trunc_toward_zero", 10, 6, {"reject": "quantization-infinite"})
quant("c8-negative-infinity", "negative infinity is rejected",
      float("-inf"), "round_ties_even", 10, 6, {"reject": "quantization-infinite"})
quant("c8-binary-scale", "radix 2 places 10: 0.5 is exactly 512",
      0.5, "reject", 2, 10, {"accept": {"value": 512, "exact": True}})

REJECTION_CLASSES = sorted({
    "invalid-utf8", "syntax", "trailing-bytes", "duplicate-member-name",
    "malformed-escape", "unpaired-surrogate", "number-not-cnp0-integer",
    "integer-out-of-range", "signed-zero", "non-canonical-form",
    "profile-identifier-invalid", "bytes-hex-invalid", "ratio-not-reduced",
    "ratio-non-positive-denominator", "ratio-zero-not-canonical",
    "fixed-scale-in-value", "tagged-form-invalid", "scale-descriptor-invalid",
    "simplex-sum-invalid", "simplex-negative-weight", "simplex-zero-sum",
    "quantization-not-representable", "quantization-overflow",
    "quantization-nan", "quantization-infinite",
    "renormalize-negative-weight", "renormalize-zero-sum",
    "renormalize-duplicate-coordinate", "circle-point-out-of-range",
})


def build_lut() -> bytes:
    """The pinned sine table for circle256 (§5.1.2.3 strategy `pinned`).

    Generated once, here, from the host's libm and then PINNED: §5.1.2.3 is
    explicit that host libm output is not a canonical constant source, so the
    table's authority is its content address, not its recomputation.
    """
    import math
    places = 6
    total = 10 ** places
    table = [round(math.sin(2 * math.pi * i / 256) * total) for i in range(256)]
    lut = {
        "canonical_encoding": ENC,
        "numeric_profile": PROF,
        "domain": "circle2n@v0",
        "n": 8,
        "constant_strategy": "pinned",
        "scale": {"canonical_encoding": ENC, "numeric_profile": PROF,
                  "scale": "hsp-scale@v0", "radix": 10, "places": places,
                  "unit_ref": None},
        "sin": table,
    }
    return canonical_bytes(lut)


def main() -> int:
    lut_bytes = build_lut()
    lut_digest = sha(lut_bytes)
    for case in CASES:
        if case["id"] == "c7-lut":
            case["sha256"] = lut_digest
            # Flip one byte of a table entry; the reference must change.
            case["mutation"] = {
                "byte_index": lut_bytes.index(b'"sin":[') + 7,
                "expect": "different-digest",
            }

    manifest = {
        "manifest": "cnp-0-corpus@v0",
        "status": "candidate / unratified / partial implementation",
        "canonical_encoding": ENC,
        "numeric_profile": PROF,
        "spec": {
            "path": "docs/rfc/0003-heterogeneous-state-protocol/"
                    "01-canonical-identity-and-encoding.md",
            "clauses": "§5.1.1-§5.1.3",
        },
        "authoring": "corpus/manifest.json is authored by tools/build_manifest.py "
                     "(a Python code path) and pinned; the TypeScript reference "
                     "encoder must reproduce these bytes and digests. Same author, "
                     "so this is a second code path, not an independent "
                     "implementation (§5.1.3).",
        "rejection_classes": REJECTION_CLASSES,
        "cases": CASES,
    }
    text = json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=False) + "\n"

    if "--check" in sys.argv:
        current = open(MANIFEST, encoding="utf-8").read()
        if current != text:
            print("manifest.json differs from tools/build_manifest.py output")
            return 1
        if open(LUT_PATH, "rb").read() != lut_bytes:
            print("circle256 LUT differs from tools/build_manifest.py output")
            return 1
        print("manifest and LUT match their authoring tool")
        return 0

    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as fh:
        fh.write(text)
    with open(LUT_PATH, "wb") as fh:
        fh.write(lut_bytes)
    print("wrote %s: %d cases" % (os.path.relpath(MANIFEST, HERE), len(CASES)))
    print("wrote %s: sha256 %s" % (os.path.relpath(LUT_PATH, HERE), lut_digest))
    return 0


if __name__ == "__main__":
    sys.exit(main())
