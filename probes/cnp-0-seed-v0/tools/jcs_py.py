"""A small, independent RFC 8785 JCS serializer used to AUTHOR the corpus.

This is a third code path, written for the manifest rather than for the gate:
the TypeScript reference encoder must reproduce the bytes this produces, and the
verifier-only path must accept them. It is not an independent implementation in
the sense Part 01 §5.1.3 requires — same author, same repository, same
maintenance boundary — and the README says so.

Integers only, matching cnp-0: no float ever reaches this code.
"""

from __future__ import annotations

SHORT_ESCAPES = {
    0x08: "\\b",
    0x09: "\\t",
    0x0A: "\\n",
    0x0C: "\\f",
    0x0D: "\\r",
    0x22: '\\"',
    0x5C: "\\\\",
}

INT_MAX = 2**53 - 1


def escape(s: str) -> str:
    out = ['"']
    for ch in s:
        code = ord(ch)
        if code in SHORT_ESCAPES:
            out.append(SHORT_ESCAPES[code])
        elif code < 0x20:
            out.append("\\u%04x" % code)
        else:
            out.append(ch)
    out.append('"')
    return "".join(out)


def sort_key(name: str) -> tuple[int, ...]:
    """RFC 8785 orders members by UTF-16 code units, not by code point."""
    raw = name.encode("utf-16-be")
    return tuple(
        int.from_bytes(raw[i:i + 2], "big") for i in range(0, len(raw), 2)
    )


def serialize(v) -> str:
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, int):
        if not (-INT_MAX <= v <= INT_MAX):
            raise ValueError("integer outside cnp-0 range: %d" % v)
        return str(v)
    if isinstance(v, str):
        return escape(v)
    if isinstance(v, list):
        return "[" + ",".join(serialize(x) for x in v) + "]"
    if isinstance(v, dict):
        items = sorted(v.items(), key=lambda kv: sort_key(kv[0]))
        return "{" + ",".join(escape(k) + ":" + serialize(x) for k, x in items) + "}"
    raise TypeError("unencodable %r" % type(v))


def canonical_bytes(v) -> bytes:
    return serialize(v).encode("utf-8")
