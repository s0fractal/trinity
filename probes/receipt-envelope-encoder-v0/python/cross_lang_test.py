"""Cross-language byte-equality test.

Closed the second-implementation gate for RECEIPT_ENVELOPE v0.1 → v1.0
promotion per Codex review 2026-05-14T173027Z; gemini AYE'd v1.0
promotion at 2026-05-14T182641Z.

Method:
  1. Run the same fixtures through this Python impl.
  2. Compare against the TS impl's golden hashes (recorded in ts/test.ts
     output and embedded here as constants).
  3. Assert byte-for-byte equality on canonical encodings, body_hashes,
     and envelope_ids.

If any pair starts to differ in the future, the canonical CBOR spec is
ambiguous or one impl is buggy — and the v1.0 promotion's invariant is
violated. Treat as P0.

Run: python3 cross_lang_test.py
"""

from __future__ import annotations

import sys

from canonical_cbor import (
    encode_canonical,
    decode_canonical,
    multihash_sha256,
    to_hex,
)
from envelope import wrap


# ────────────────────────────────────────────────────────────────────────
# Goldens — must match the TS impl byte-for-byte.
# ────────────────────────────────────────────────────────────────────────

# TS impl golden (recorded in ts/test.ts test 'golden: empty map body'):
EMPTY_BODY_HASH_TS = (
    "1220c19a797fa1fd590cd2e5b42d1cf5f246e29b91684e2f87404b81dc345c7a56a0"
)
EMPTY_ENVELOPE_ID_TS = (
    "122067089ed35727000a15fba3b879ecd22049adbc9106baf0cbb37569b5cd74699e"
)


# RFC 8949 well-known fixtures — must match ts/test.ts encoder unit cases.
RFC_FIXTURES = [
    # (value, expected_hex)
    (0, "00"),
    (1, "01"),
    (23, "17"),
    (24, "1818"),
    (25, "1819"),
    (255, "18ff"),
    (256, "190100"),
    (65535, "19ffff"),
    (65536, "1a00010000"),
    (-1, "20"),
    (-24, "37"),
    (-25, "3818"),
    (False, "f4"),
    (True, "f5"),
    (None, "f6"),
    ("", "60"),
    ("a", "6161"),
    ("IETF", "6449455446"),
    (b"", "40"),
    (b"\x01\x02\x03\x04", "4401020304"),
    ([], "80"),
    ([1, 2, 3], "83010203"),
    ({}, "a0"),
]

# Map sorting test — both orderings must produce same bytes.
MAP_FIXTURES = [
    ({"a": 1, "b": 2}, "a2616101616202"),
    ({"b": 2, "a": 1}, "a2616101616202"),
]


def _assert_eq(label: str, got: object, want: object) -> None:
    if got != want:
        print(f"FAIL: {label}")
        print(f"  want: {want!r}")
        print(f"  got:  {got!r}")
        sys.exit(1)


def main() -> None:
    failures = 0
    checks = 0

    # (1) RFC well-known fixtures — Python impl matches expected hex.
    for value, expected_hex in RFC_FIXTURES:
        checks += 1
        try:
            got_hex = to_hex(encode_canonical(value))
        except Exception as e:
            print(f"FAIL: encode {value!r} raised {e}")
            failures += 1
            continue
        if got_hex != expected_hex:
            print(f"FAIL: encode {value!r}")
            print(f"  want: {expected_hex}")
            print(f"  got:  {got_hex}")
            failures += 1

    # (2) Map sorting — Python matches TS.
    for value, expected_hex in MAP_FIXTURES:
        checks += 1
        got_hex = to_hex(encode_canonical(value))
        if got_hex != expected_hex:
            print(f"FAIL: map sort {value}")
            print(f"  want: {expected_hex}")
            print(f"  got:  {got_hex}")
            failures += 1

    # (3) Round-trip property — decode . encode == identity for our subset.
    roundtrip_fixtures = [
        {},
        {"type": "SubstrateHealth", "overall": "degraded",
         "own_organs": {"ok": 76, "fail": 0}},
        [1, 2, 3, "four", {"nested": True}],
        {"unicode": "тест", "psi": "ψ"},
        {"mixed": [None, True, False, 0, -1, 23]},
    ]
    for fx in roundtrip_fixtures:
        checks += 1
        b1 = encode_canonical(fx)
        decoded = decode_canonical(b1)
        b2 = encode_canonical(decoded)
        if b1 != b2:
            print(f"FAIL: round-trip for {fx!r}")
            print(f"  b1: {b1.hex()}")
            print(f"  b2: {b2.hex()}")
            failures += 1

    # (4) Golden envelope hashes — Python matches TS exactly.
    checks += 1
    env = wrap({}, "substrate_health", "trinity")
    if env["body_hash"] != EMPTY_BODY_HASH_TS:
        print("FAIL: golden body_hash for empty-body envelope")
        print(f"  TS:     {EMPTY_BODY_HASH_TS}")
        print(f"  Python: {env['body_hash']}")
        failures += 1

    checks += 1
    if env["envelope_id"] != EMPTY_ENVELOPE_ID_TS:
        print("FAIL: golden envelope_id for empty-body envelope")
        print(f"  TS:     {EMPTY_ENVELOPE_ID_TS}")
        print(f"  Python: {env['envelope_id']}")
        failures += 1

    # (5) Substrate Court seed — same body, different substrate_tag → same body_hash.
    checks += 1
    body = {"type": "spore_apply", "output": "1220deadbeef" + "0" * 58}
    e_trinity = wrap(body, "spore_apply_v0", "trinity")
    e_liquid = wrap(body, "spore_apply_v0", "liquid")
    e_omega = wrap(body, "spore_apply_v0", "omega")
    if not (e_trinity["body_hash"] == e_liquid["body_hash"] == e_omega["body_hash"]):
        print("FAIL: substrate court seed body_hash mismatch across substrates")
        failures += 1
    if e_trinity["envelope_id"] == e_liquid["envelope_id"]:
        print("FAIL: envelope_id should differ across substrates")
        failures += 1

    # (6) Tamper detection.
    checks += 1
    tampered_body = dict(body)
    tampered_body["output"] = "1220deadbeef" + "0" * 57 + "1"
    e_tampered = wrap(tampered_body, "spore_apply_v0", "external")
    if e_tampered["body_hash"] == e_trinity["body_hash"]:
        print("FAIL: tampered body should produce different body_hash")
        failures += 1

    # (7) Forbidden constructs — encoder must throw.
    checks += 1
    try:
        encode_canonical(1.5)
        print("FAIL: encoder must reject float")
        failures += 1
    except ValueError:
        pass

    checks += 1
    try:
        encode_canonical(float("nan"))
        print("FAIL: encoder must reject NaN")
        failures += 1
    except (ValueError, Exception):
        pass

    # (8) Decoder strict canonical.
    checks += 1
    try:
        decode_canonical(bytes([0x18, 0x01]))
        print("FAIL: decoder must reject non-canonical 1-byte uint < 24")
        failures += 1
    except ValueError:
        pass

    checks += 1
    try:
        decode_canonical(bytes([0xC0, 0x60]))
        print("FAIL: decoder must reject tags")
        failures += 1
    except ValueError:
        pass

    # ────────────────────────────────────────────────────────────────────
    print()
    if failures == 0:
        print(f"OK: {checks}/{checks} checks passed")
        print()
        print("Cross-language byte equality confirmed.")
        print(f"  TS empty-body body_hash    = {EMPTY_BODY_HASH_TS}")
        print(f"  PY empty-body body_hash    = {env['body_hash']}")
        print(f"  TS empty-body envelope_id  = {EMPTY_ENVELOPE_ID_TS}")
        print(f"  PY empty-body envelope_id  = {env['envelope_id']}")
        print()
        print("Codex review 2026-05-14T173027Z second-impl gate: CLEARED.")
        sys.exit(0)
    else:
        print(f"FAIL: {failures}/{checks} checks failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
