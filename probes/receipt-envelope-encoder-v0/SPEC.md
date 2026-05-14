# receipt-envelope-encoder-v0 probe

Hand-rolled minimal canonical CBOR encoder + `RECEIPT_ENVELOPE.v0.1`
reference implementation. Probe-scoped (NOT in `lib/`) per architect
constraint: trinity should not grow `lib/`.

This probe is the **canonical home** for envelope encoding bytes. Other
organs that need to wrap/unwrap receipts import directly from
`probes/receipt-envelope-encoder-v0/ts/` until the pattern proves through
two-plus consumers, at which point it may graduate to a hex coordinate.

Boundary reference:
- `contracts/RECEIPT_ENVELOPE.v0.1.md` — envelope contract (paper).
- `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md` — sibling boundary doc.

## Status

**TWO-IMPL CROSS-VERIFIED.** SPEC + TypeScript impl (`ts/`) + Python impl
(`python/`) + cross-language byte-equality test. Codex's TWEAK on Item B
(`2026-05-14T163324Z`) drove the hand-rolled-no-dep choice. Codex's
review (`2026-05-14T173027Z`) added the second-implementation gate as a
guardrail for promoting `RECEIPT_ENVELOPE.v0.1` to v1.0; this probe now
clears that gate by producing byte-identical canonical CBOR and envelope
hashes from both impls for the same fixtures.

## Canonical CBOR subset

Implements RFC 8949 §4.2.1 deterministic encoding **restricted** to the
following subset:

**ALLOWED:**

| Major type | Tag | TS source | CBOR encoding |
|---|---|---|---|
| 0 | uint | `number` (safe int ≥0) or `bigint` (≥0) | shortest form |
| 1 | negint | `number` (safe int <0) or `bigint` (<0) | shortest form |
| 2 | bytes | `Uint8Array` | length-prefixed, definite |
| 3 | text | `string` (UTF-8) | length-prefixed, definite |
| 4 | array | `Array` | length-prefixed, definite |
| 5 | map | plain object with string keys | length-prefixed, definite, keys sorted bytewise-lex |
| 7/20 | false | `false` | `0xf4` |
| 7/21 | true | `true` | `0xf5` |
| 7/22 | null | `null` | `0xf6` |

**FORBIDDEN (encoder throws; decoder rejects):**

- All floating-point values (major 7 / 25, 26, 27). Q-format integer
  math is the law; floats have no place in protocol bytes.
- Indefinite-length forms (initial byte info=31 for any major type).
- All CBOR tags (major type 6). None needed for envelope v0.1.
- Simple value 23 (`undefined`). Use explicit `null` instead.
- Bignums beyond u64/i64. Either fits in 8 bytes or it's not encoded.
- Non-string map keys. JSON heritage; envelope keys are all text.
- Duplicate keys after encoding.
- Trailing bytes after decode.
- Non-canonical re-encodings (e.g. `0x1801` for integer 1 when `0x01`
  would suffice).

## Determinism guarantees

If two implementations of this spec encode the same logical value, they
produce **byte-identical output**. This is the load-bearing claim for
envelope `body_hash` cross-substrate stability.

Decoder is **strict canonical**: any byte sequence that decodes
successfully MUST re-encode to the **same** bytes. A non-canonical
encoding (e.g. integer using wider length than necessary) is rejected at
decode time, not silently re-canonicalized.

## Multihash format

`body_hash` and `envelope_id` use the **SHA-256 multihash** wire form,
serialized as a hex string:

```text
"1220" + <64 hex chars>     // 0x12 = sha2-256, 0x20 = 32 bytes, then digest
```

This is content-addressable and self-describing. Future hash algorithm
upgrades change the leading two bytes.

## Envelope wrap algorithm

Input: `body` (any allowed CBOR value), `body_kind` (string),
`substrate_tag` (string), optional `law_hash`, `witness_chain`,
`bitcoin_anchor`, `parent_envelope_id`, `parent_relation`,
`created_at_logical`.

Steps:

1. `body_bytes = encodeCanonical(body)`.
2. `body_hash = multihash(body_bytes)`.
3. Build envelope record with all fields **except** `envelope_id`. Omit
   undefined fields entirely (do not encode them as `null`).
4. `envelope_bytes_without_id = encodeCanonical(envelope_without_id)`.
5. `envelope_id = multihash(envelope_bytes_without_id)`.
6. Return envelope with `envelope_id` populated.

The `envelope_id` describes the envelope **excluding itself**, breaking
the chicken-and-egg recursion. To re-verify, drop `envelope_id`, re-encode,
re-hash, compare.

## Envelope unwrap algorithm

Input: `envelope` (parsed JSON or decoded CBOR record).

Steps:

1. If `body` is absent (`body_ref` case), return `{body: undefined, body_hash_verified: false}` — caller follows `body_ref` separately.
2. `body_bytes = encodeCanonical(envelope.body)`.
3. `body_hash_recomputed = multihash(body_bytes)`.
4. Return `{body, body_kind, body_hash_verified: body_hash_recomputed === envelope.body_hash}`.

Optional strict mode: also recompute `envelope_id` excluding the
existing `envelope_id` and require match.

## coWitness algorithm

Input: existing `envelope`, `oracle` name, `signer_substrate`, optional
`law_hash`, optional `signed_at_logical`.

Steps:

1. Build new `witness_chain` entry: `{oracle, signature_hash, signed_at_logical, substrate_tag: signer_substrate, law_hash}`.
2. Append to `envelope.witness_chain`.
3. Re-run wrap algorithm steps 3-6 to recompute `envelope_id` (it changes,
   because witness_chain changed).
4. Return new envelope.

The previous `envelope_id` is **not** retained automatically; a caller
who needs ancestry should set `parent_envelope_id = old_envelope.envelope_id`
before calling coWitness.

## Test plan

`ts/test.ts` covers:

1. **Encoder unit cases** — RFC 8949 well-known fixtures (empty map, `[1,2]`, etc.).
2. **Encoder forbidden cases** — assert encoder throws for floats,
   undefined, Maps, etc.
3. **Decoder strict canonical** — feed non-canonical bytes, assert reject.
4. **Round-trip property** — for a fixture set of envelope-shaped
   structures, encode→decode→encode produces byte-identical output.
5. **Golden bytes** — three fixed envelope bodies (sample SPORE.v0
   receipt, sample PHI_RECEIPT, sample SealedReceiptDescriptor) wrapped,
   golden `envelope_id` recorded.
6. **wrap/unwrap round-trip** — for each registered `body_kind`, wrap a
   synthetic fixture, unwrap, assert `body_hash_verified === true`.
7. **coWitness** — wrap an envelope, coWitness twice, assert
   `envelope_id` changes each time and `witness_chain.length` grows.

## Acceptance for promoting envelope v0.1 to v1.0

(per `contracts/RECEIPT_ENVELOPE.v0.1.md`):

- ✓ At least three of the registered body kinds wrapped and round-tripped — done in `ts/test.ts`.
- ✓ **CBOR canonical serialization confirmed byte-identical across at least two implementations** — TypeScript (`ts/`) + Python (`python/`), verified by `python/cross_lang_test.py` on 2026-05-14. Both impls produce identical `body_hash` and `envelope_id` on shared fixtures.
- ✓ Substrate Court primitive demoed — `probes/substrate-court-v0/`.
- ✓ `law_hash` populated or explicit null — this probe leaves it null/optional.
- ✓ Codex review — AYE_WITH_GUARDRAIL on `2026-05-14T173027Z`; guardrail cleared by the Python second impl on the same day.
- **Pending:** Gemini review.

## Out of scope

- Decoder of full RFC 8949 (we only need our subset).
- Streaming encoding/decoding.
- CBOR diagnostic notation (debug only; not protocol).
- Tag registry (we forbid tags).
- Compression.
- Encryption / signing primitives (witness_chain `signature_hash` is
  treated as opaque hex; signing protocol is a separate concern).
