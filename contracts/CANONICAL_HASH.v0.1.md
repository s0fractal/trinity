---
type: "ContractDescriptor"
version: "0.1"
title: "Canonical Hash Identity"
status: "active"
---

# Canonical Hash Identity

This contract fixes the load-bearing identity primitive shared by `myc`,
`liquid`, `omega`, and `trinity`. It is intentionally narrow.

## 1. Definition

```text
fqdn_prefix(body) = "h." || first_12_hex( sha256( utf8_bytes(body) ) )
```

Where:

- `utf8_bytes(body)` is the body as a raw UTF-8 byte sequence with **no**
  whitespace stripping, **no** BOM removal, **no** line-ending normalization.
- `sha256(...)` is RFC 6234 SHA-256.
- `first_12_hex(...)` is the first twelve **lowercase** hex characters of the
  full digest.

Example:

```text
body  = "hello\n"
sha256 = 5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03
prefix = "h.5891b5b522d5"
```

## 2. Reference Implementations

The reference TypeScript impl lives in `lib/canon/hash.ts`. Other substrates MAY
have their own native impls (Rust, WGSL, SP1) but MUST verify against the golden
vectors in `fixtures/canon-vectors.json`.

Drift between substrates is detected by failing those vectors, not by code
review.

## 3. Canonicalization Boundary

This contract **only** specifies how a hash is produced from a `body` byte
sequence. It does **not** specify what `body` is. A descriptor that wants to
hash "the canonical form of an artifact" must first define its own
canonicalization rule (frontmatter ordering, whitespace policy, key sort, etc.)
and then pass the canonicalized bytes to this function.

## 4. Stability Promise

Once an artifact has a verified `h.<12hex>` prefix that has been published or
witnessed externally, the algorithm above MUST NOT change without a new contract
version (`CANONICAL_HASH.v0.2`) and an explicit migration that re-issues new
prefixes alongside the old.

Truncation length (12 hex = 48 bits) is intentionally short for filename
ergonomics. Collisions are tolerated **only** when the full sha256 is also
recorded in a curated receipt, contract, or ledger projection.

## 5. Cross-Substrate Authority

Any disagreement between substrate impls is resolved by:

1. The vectors in `fixtures/canon-vectors.json`.
2. If the vectors themselves are wrong, by recomputing SHA-256 from the raw
   input bytes using a third-party library and updating the vectors in a
   `formula → crystal` transition.

The TS reference impl is convenient, not authoritative. SHA-256 is.
