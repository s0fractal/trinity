"""Canonical CBOR encoder/decoder (hand-rolled, stdlib-only).

Faithful port of ../ts/canonical_cbor.ts. Implements RFC 8949 §4.2.1
deterministic encoding restricted to the subset declared in ../SPEC.md.

Forbidden constructs match the TS impl exactly:
  - floats (encoder rejects; decoder rejects)
  - indefinite-length forms
  - tags
  - undefined / None as value (None is allowed only as null)
  - bignums > u64 (positive) or < -2^64 (negative)
  - non-string map keys
  - duplicate keys after encoding
  - trailing bytes after decode
  - non-canonical re-encodings (rejected at decode time)

Second-implementation gate for RECEIPT_ENVELOPE.v0.1 (per Codex review
2026-05-14T173027Z): bytes from this impl MUST match bytes from the TS
impl for the same input.
"""

from __future__ import annotations

import hashlib
from typing import Any, List, Tuple, Union

CborValue = Union[
    int,
    str,
    bytes,
    bytearray,
    bool,
    None,
    List["CborValue"],
    dict,
]


# ────────────────────────────────────────────────────────────────────────
# ENCODER
# ────────────────────────────────────────────────────────────────────────


def encode_canonical(value: Any) -> bytes:
    out = bytearray()
    _encode_value(value, out)
    return bytes(out)


def _encode_value(v: Any, out: bytearray) -> None:
    # Order of type checks matters: bool MUST come before int (in Python,
    # isinstance(True, int) is True).
    if v is None:
        out.append(0xF6)
        return
    if v is True:
        out.append(0xF5)
        return
    if v is False:
        out.append(0xF4)
        return

    if isinstance(v, int):
        if v >= 0:
            if v > 0xFFFFFFFFFFFFFFFF:
                raise ValueError("canonical-cbor: uint > u64 forbidden")
            _encode_int(0, v, out)
        else:
            negated = -1 - v
            if negated > 0xFFFFFFFFFFFFFFFF:
                raise ValueError("canonical-cbor: negint < -2^64 forbidden")
            _encode_int(1, negated, out)
        return

    if isinstance(v, float):
        raise ValueError(
            "canonical-cbor: floats forbidden (use Q-format integers)"
        )

    if isinstance(v, str):
        b = v.encode("utf-8")
        _encode_head(3, len(b), out)
        out.extend(b)
        return

    if isinstance(v, (bytes, bytearray)):
        _encode_head(2, len(v), out)
        out.extend(v)
        return

    if isinstance(v, list):
        _encode_head(4, len(v), out)
        for item in v:
            _encode_value(item, out)
        return

    if isinstance(v, tuple):
        # Tuples encode as arrays — same as lists.
        _encode_head(4, len(v), out)
        for item in v:
            _encode_value(item, out)
        return

    if isinstance(v, dict):
        # RFC 8949 §4.2.1: sort by bytewise-lex order of encoded keys.
        encoded_keys: List[Tuple[Any, bytes]] = []
        for k in v.keys():
            if not isinstance(k, str):
                raise ValueError(
                    "canonical-cbor: non-string map key forbidden"
                )
            kb = k.encode("utf-8")
            head = bytearray()
            _encode_head(3, len(kb), head)
            encoded_keys.append((k, bytes(head) + kb))

        encoded_keys.sort(key=lambda kv: kv[1])

        # Check for duplicates after encoding.
        for i in range(1, len(encoded_keys)):
            if encoded_keys[i][1] == encoded_keys[i - 1][1]:
                raise ValueError(
                    f"canonical-cbor: duplicate map key: {encoded_keys[i][0]}"
                )

        _encode_head(5, len(encoded_keys), out)
        for key, key_bytes in encoded_keys:
            out.extend(key_bytes)
            _encode_value(v[key], out)
        return

    raise ValueError(f"canonical-cbor: unsupported value type: {type(v).__name__}")


def _encode_int(major: int, value: int, out: bytearray) -> None:
    """Encode major-type 0 or 1 integer using shortest canonical form."""
    if value < 0:
        raise ValueError("canonical-cbor: negative head argument")
    if value < 0x100000000:
        _encode_head(major, value, out)
        return
    # 8-byte form for values 2^32 .. 2^64-1
    out.append(((major & 0x07) << 5) | 27)
    for i in range(7, -1, -1):
        out.append((value >> (i * 8)) & 0xFF)


def _encode_head(major: int, value: int, out: bytearray) -> None:
    """Encode major-type and value header using shortest form for value < 2^32."""
    if value < 0:
        raise ValueError("canonical-cbor: negative head argument")
    m = (major << 5) & 0xFF
    if value < 24:
        out.append(m | value)
    elif value < 0x100:
        out.append(m | 24)
        out.append(value & 0xFF)
    elif value < 0x10000:
        out.append(m | 25)
        out.append((value >> 8) & 0xFF)
        out.append(value & 0xFF)
    elif value < 0x100000000:
        out.append(m | 26)
        out.append((value >> 24) & 0xFF)
        out.append((value >> 16) & 0xFF)
        out.append((value >> 8) & 0xFF)
        out.append(value & 0xFF)
    else:
        raise ValueError(
            "canonical-cbor: value too large for 4-byte head; use 8-byte path"
        )


# ────────────────────────────────────────────────────────────────────────
# DECODER (strict canonical)
# ────────────────────────────────────────────────────────────────────────


class _DecodeCtx:
    def __init__(self, buf: bytes) -> None:
        self.buf = buf
        self.pos = 0


def decode_canonical(data: bytes) -> Any:
    ctx = _DecodeCtx(data)
    v = _decode_value(ctx)
    if ctx.pos != len(data):
        raise ValueError(
            f"canonical-cbor: trailing bytes ({len(data) - ctx.pos} unread)"
        )
    return v


def _decode_value(ctx: _DecodeCtx) -> Any:
    b = _read_byte(ctx)
    major = (b >> 5) & 0x07
    info = b & 0x1F

    if info == 31:
        raise ValueError("canonical-cbor: indefinite-length form forbidden")

    if major == 7:
        if info == 20:
            return False
        if info == 21:
            return True
        if info == 22:
            return None
        if info == 23:
            raise ValueError("canonical-cbor: undefined (simple 23) forbidden")
        if info in (25, 26, 27):
            raise ValueError("canonical-cbor: floating-point forbidden")
        raise ValueError(f"canonical-cbor: simple value {info} forbidden")

    if major == 6:
        raise ValueError("canonical-cbor: tags forbidden")

    value = _read_arg_canonical(ctx, info)

    if major == 0:
        return value
    if major == 1:
        return -1 - value
    if major == 2:
        n = value
        bs = ctx.buf[ctx.pos:ctx.pos + n]
        if len(bs) != n:
            raise ValueError("canonical-cbor: truncated byte string")
        ctx.pos += n
        return bytes(bs)
    if major == 3:
        n = value
        bs = ctx.buf[ctx.pos:ctx.pos + n]
        if len(bs) != n:
            raise ValueError("canonical-cbor: truncated text string")
        ctx.pos += n
        return bs.decode("utf-8")
    if major == 4:
        n = value
        return [_decode_value(ctx) for _ in range(n)]
    if major == 5:
        n = value
        obj = {}
        prev_key_bytes = None
        for _ in range(n):
            key_start = ctx.pos
            key = _decode_value(ctx)
            if not isinstance(key, str):
                raise ValueError("canonical-cbor: non-string map key forbidden")
            key_bytes = ctx.buf[key_start:ctx.pos]
            if prev_key_bytes is not None and key_bytes <= prev_key_bytes:
                raise ValueError(
                    "canonical-cbor: map keys not in bytewise-lex order"
                )
            prev_key_bytes = key_bytes
            if key in obj:
                raise ValueError(f"canonical-cbor: duplicate map key: {key}")
            obj[key] = _decode_value(ctx)
        return obj

    raise ValueError(f"canonical-cbor: unreachable (major {major})")


def _read_byte(ctx: _DecodeCtx) -> int:
    if ctx.pos >= len(ctx.buf):
        raise ValueError("canonical-cbor: unexpected end")
    b = ctx.buf[ctx.pos]
    ctx.pos += 1
    return b


def _read_arg_canonical(ctx: _DecodeCtx, info: int) -> int:
    if info < 24:
        return info
    if info == 24:
        v = _read_byte(ctx)
        if v < 24:
            raise ValueError("canonical-cbor: non-canonical (1-byte length < 24)")
        return v
    if info == 25:
        hi = _read_byte(ctx)
        lo = _read_byte(ctx)
        v = (hi << 8) | lo
        if v < 0x100:
            raise ValueError(
                "canonical-cbor: non-canonical (2-byte length < 256)"
            )
        return v
    if info == 26:
        v = 0
        for _ in range(4):
            v = (v << 8) | _read_byte(ctx)
        if v < 0x10000:
            raise ValueError(
                "canonical-cbor: non-canonical (4-byte length < 65536)"
            )
        return v
    if info == 27:
        v = 0
        for _ in range(8):
            v = (v << 8) | _read_byte(ctx)
        if v < 0x100000000:
            raise ValueError(
                "canonical-cbor: non-canonical (8-byte length < 2^32)"
            )
        return v
    raise ValueError(f"canonical-cbor: invalid additional info {info}")


# ────────────────────────────────────────────────────────────────────────
# HASHING
# ────────────────────────────────────────────────────────────────────────


def multihash_sha256(data: bytes) -> str:
    digest = hashlib.sha256(data).digest()
    return "1220" + digest.hex()


def to_hex(data: bytes) -> str:
    return data.hex()
