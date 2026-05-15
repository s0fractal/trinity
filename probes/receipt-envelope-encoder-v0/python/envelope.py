"""RECEIPT_ENVELOPE reference impl in Python.

Contract: ../../../contracts/RECEIPT_ENVELOPE.v1.0.md (status: active,
promoted 2026-05-14 by gemini AYE after this implementation demonstrated
byte equality with the TS impl, closing Codex's AYE_WITH_GUARDRAIL).

Wire schema id remains "trinity.receipt-envelope.v0.1" — identifies the
wire format, not the contract version.

Port of ../ts/envelope.ts.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from canonical_cbor import encode_canonical, multihash_sha256

ENVELOPE_SCHEMA = "trinity.receipt-envelope.v0.1"


def wrap(
    body: Optional[Any],
    body_kind: str,
    substrate_tag: str,
    *,
    law_hash: Optional[str] = None,
    witness_chain: Optional[List[dict]] = None,
    bitcoin_anchor: Optional[dict] = None,
    parent_envelope_id: Optional[str] = None,
    parent_relation: Optional[str] = None,
    created_at_logical: Optional[dict] = None,
    body_ref: Optional[str] = None,
) -> dict:
    """Wrap a body as a ReceiptEnvelope.v0.1 (Python side).

    Returns a dict-shape envelope; serialization to JSON is the caller's choice.
    Byte equality with the TS impl is guaranteed by canonical_cbor.
    """
    if body is None and body_ref is None:
        raise ValueError("envelope.wrap: at least one of body or body_ref required")

    if body is not None:
        body_bytes = encode_canonical(body)
        body_hash = multihash_sha256(body_bytes)
    else:
        body_hash = multihash_sha256(b"")

    partial: Dict[str, Any] = {
        "schema": ENVELOPE_SCHEMA,
        "body_hash": body_hash,
        "substrate_tag": substrate_tag,
        "body_kind": body_kind,
        "witness_chain": _serialize_witness_chain(witness_chain or []),
    }

    if body is not None:
        partial["body"] = body
    if body_ref is not None:
        partial["body_ref"] = body_ref
    if law_hash is not None:
        partial["law_hash"] = law_hash
    if bitcoin_anchor is not None:
        partial["bitcoin_anchor"] = _serialize_anchor(bitcoin_anchor)
    if parent_envelope_id is not None:
        partial["parent_envelope_id"] = parent_envelope_id
    if parent_relation is not None:
        partial["parent_relation"] = parent_relation
    if created_at_logical is not None:
        partial["created_at_logical"] = _serialize_clock(created_at_logical)

    envelope_bytes = encode_canonical(partial)
    envelope_id = multihash_sha256(envelope_bytes)

    out: Dict[str, Any] = {
        "schema": ENVELOPE_SCHEMA,
        "envelope_id": envelope_id,
        "body_hash": body_hash,
        "substrate_tag": substrate_tag,
        "body_kind": body_kind,
    }
    if body is not None:
        out["body"] = body
    if body_ref is not None:
        out["body_ref"] = body_ref
    if law_hash is not None:
        out["law_hash"] = law_hash
    out["witness_chain"] = witness_chain or []
    if bitcoin_anchor is not None:
        out["bitcoin_anchor"] = bitcoin_anchor
    if parent_envelope_id is not None:
        out["parent_envelope_id"] = parent_envelope_id
    if parent_relation is not None:
        out["parent_relation"] = parent_relation
    if created_at_logical is not None:
        out["created_at_logical"] = created_at_logical

    return out


def unwrap(env: dict, strict: bool = False) -> dict:
    body_hash_verified = False
    body = env.get("body")
    if body is not None:
        body_bytes = encode_canonical(body)
        re_hash = multihash_sha256(body_bytes)
        body_hash_verified = re_hash == env["body_hash"]

    result: Dict[str, Any] = {
        "body": body,
        "body_kind": env["body_kind"],
        "body_hash_verified": body_hash_verified,
    }

    if strict:
        rest = {k: v for k, v in env.items() if k != "envelope_id"}
        if rest.get("law_hash") is None:
            rest.pop("law_hash", None)
        envelope_bytes = encode_canonical(rest)
        re_hash = multihash_sha256(envelope_bytes)
        result["envelope_id_verified"] = re_hash == env["envelope_id"]

    return result


def _serialize_witness_chain(chain: List[dict]) -> List[dict]:
    out = []
    for w in chain:
        obj: Dict[str, Any] = {
            "oracle": w["oracle"],
            "signature_hash": w["signature_hash"],
            "signed_at_logical": _serialize_clock(w.get("signed_at_logical", {})),
            "substrate_tag": w["substrate_tag"],
        }
        if w.get("law_hash") is not None:
            obj["law_hash"] = w["law_hash"]
        out.append(obj)
    return out


def _serialize_anchor(a: dict) -> dict:
    obj: Dict[str, Any] = {"block": a["block"], "tx": a["tx"]}
    if a.get("merkle_path") is not None:
        obj["merkle_path"] = a["merkle_path"]
    if a.get("merkle_root") is not None:
        obj["merkle_root"] = a["merkle_root"]
    return obj


def _serialize_clock(c: dict) -> dict:
    obj: Dict[str, Any] = {}
    for k in ("causal_ticks", "era", "bitcoin_block", "wall_time_utc"):
        if c.get(k) is not None:
            obj[k] = c[k]
    return obj
