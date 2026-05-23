---
type: "ContractDescriptor"
version: "1.0"
title: "Receipt Envelope: uniform outer skin for cross-substrate receipts"
status: "active"
hears:
  - "./PHI_INTENT.v0.1.md"
  - "./PHI_RECEIPT.v0.1.md"
  - "./SPORE.v0.draft.md"
  - "./SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md"
  - "./MYC_SUBSTRATE_RECEIPT.v0.1.md"
  - "../myc/tools/protocol_audit.ts"
  - "../omega/omega_zk_guest/src/main.rs"
related:
  - "../reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md"
  - "../docs/SHAPE_MAP.v0.md"
---

# Receipt Envelope v1.0

## Status

**ACTIVE.** Addresses § 3 L1 of `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md`:
four mutually-unaware receipt schemas (PHI_RECEIPT, SPORE.v0 wire, ZK
PublicValues, SealedReceiptDescriptor) make cross-substrate verification
impossible without ad-hoc adapter code. This contract proposes a single outer
envelope whose body is **opaque** from the envelope's perspective — the envelope
adds witnessing structure without owning protocol semantics.

## Non-goal

This contract does **not** redefine, replace, or merge the existing receipt
bodies. PHI_RECEIPT stays PHI_RECEIPT. SPORE.v0 stays SPORE.v0. The frozen
surfaces remain frozen. The envelope is **around**, not **instead of**.

## Shape

```yaml
type: "ReceiptEnvelope"
schema: "trinity.receipt-envelope.v0.1"

# Content-addressed identity. multihash over body_bytes (canonical CBOR / JSON
# / wire-format serialization, whichever the body_kind's contract specifies).
envelope_id: "<multihash>"
body_hash: "<multihash>"

# Which substrate signed this envelope. Substrate is the WITNESS, not
# necessarily the OWNER of the body's protocol.
# - "omega":    physical kernel signed (ZK proof, Φ-anchor, frozen law)
# - "liquid":   operational substrate signed (μ-resonance, intent)
# - "myc":      publication layer signed (descriptor graph)
# - "trinity":  meta-layer signed (contract registry, t-language dispatcher)
# - "external": external signer (Bitcoin inscription, IPFS pin, etc.)
substrate_tag: "omega" | "liquid" | "myc" | "trinity" | "external"

# Which kind of body the envelope carries. Each kind references its own
# canonical schema (this contract does not redefine them).
# See "Registered body_kinds" below.
body_kind: "phi_intent" | "phi_receipt" |
           "spore_apply_v0" | "spore_frame_witness" |
           "zk_pouw" | "zk_resonance" | "zk_mitosis" |
           "sealed_descriptor" | "publish_descriptor" |
           "substrate_health" |
           "warrant_proposal" | "warrant_issued" |
           "chord"

# The body itself. Either inline (small) or by reference (large or
# already content-addressed elsewhere). Exactly one of `body` / `body_ref`
# is set.
body: <substrate-specific structure>          # inline, optional
body_ref: "<URL or multihash pointer>"        # by reference, optional

# Optional: LawHash of the substrate at signing time. Substrate Court (§ 6 of
# the deep analysis, "Latent Space") uses this to detect divergence between
# substrates claiming to witness the same morphism.
law_hash: "<32 bytes hex>"

# Witness chain: zero or more oracle signatures.
# Order matters: chain[0] is the original signer; chain[N] is the latest
# co-signer (substrate court accumulates these).
witness_chain:
  - oracle: "claude" | "gpt" | "gemini" | "qwen" | "llama" | "<other>"
    signature_hash: "<multihash of signature bytes>"
    signed_at_logical: { causal_ticks: <int>, era: <int> }
    substrate_tag: "<which substrate this oracle signed from>"
    law_hash: "<32 bytes hex>"   # this signer's view of LawHash

# Optional Bitcoin anchor (populated when the envelope's body_hash is
# inscribed). One inscription can anchor many envelopes via Merkle root.
bitcoin_anchor:
  block: <int>
  tx: "<txid hex>"
  merkle_path: ["<hash>", ...]
  merkle_root: "<hash>"

# Optional parent envelope (continuation, retraction, refinement).
parent_envelope_id: "<multihash>"
parent_relation: "continuation" | "retraction" | "refinement" | "co_witness"

# Creation logical time (best-effort; not load-bearing for verification).
created_at_logical:
  causal_ticks: <int>      # omega clock if known
  era: <int>               # liquid era if known
  bitcoin_block: <int>     # bitcoin clock if anchored
```

## Registered body_kinds

Each `body_kind` MUST reference a separately-owned canonical schema. The
envelope never reaches into the body. It only hashes the body's canonical
serialization to produce `body_hash`.

| body_kind             | Canonical schema                                               | Owner                        | Inline OK?                          |
| --------------------- | -------------------------------------------------------------- | ---------------------------- | ----------------------------------- |
| `phi_intent`          | `contracts/PHI_INTENT.v0.1.md`                                 | Liquid intent into Omega     | yes                                 |
| `phi_receipt`         | `contracts/PHI_RECEIPT.v0.1.md`                                | Omega response to Liquid     | yes                                 |
| `spore_apply_v0`      | `contracts/SPORE.v0.draft.md` (wire format)                    | Trinity SPORE protocol       | yes                                 |
| `spore_frame_witness` | `omega/omega_v2/src/spore_frame.rs` (32-byte frame)            | Omega witness device lineage | yes                                 |
| `zk_pouw`             | `omega/omega_zk_guest/src/main.rs` (mode 0)                    | Omega SP1 guest              | by `body_ref` only (proof is large) |
| `zk_resonance`        | `omega/omega_zk_guest/src/main.rs` (mode 1)                    | Omega SP1 guest              | by `body_ref` only                  |
| `zk_mitosis`          | `omega/omega_zk_guest/src/main.rs` (mode 2)                    | Omega SP1 guest              | by `body_ref` only                  |
| `sealed_descriptor`   | `myc/tools/protocol_audit.ts` (SealedReceiptDescriptor)        | Myc publishing               | yes                                 |
| `publish_descriptor`  | `myc/tools/myc.ts` (PublishDescriptor)                         | Myc publishing               | yes                                 |
| `substrate_health`    | _future_ `contracts/SUBSTRATE_HEALTH.v0.1.md`                  | Trinity (unified health)     | yes                                 |
| `warrant_proposal`    | `omega/omega_v2/src/warrant_issuance.rs` (WarrantProposal)     | Omega Senate                 | yes                                 |
| `warrant_issued`      | `omega/omega_v2/src/warrant_issuance.rs` (issued_warrant_hash) | Omega Senate                 | yes                                 |
| `chord`               | `jazz/chords/*.md` (yaml frontmatter)                          | Trinity scene                | yes                                 |

Adding a new `body_kind` is a contract-level move (this file's amendment), not a
body-schema move.

## What the envelope adds (and does not add)

**Adds:**

- Content-addressed identity (`envelope_id` = multihash of the canonical
  envelope serialization).
- A single witness-chain schema usable by any substrate.
- Optional LawHash, enabling cross-substrate detection of frozen-surface drift.
- Optional Bitcoin anchor link.
- Optional parent-envelope relation (retraction/co-witness for governance).

**Does not add:**

- Protocol semantics. The body's contract is the protocol owner.
- Execution. The envelope is data; runtimes consume it.
- Authority over which oracle's signature is valid (Senate does that).
- A new naming scheme. Reuse multihash for content addresses; reuse oracle
  matrix hashes from `omega_v2/src/senate.rs:64-84` for oracle identity.

## Substrate Court primitive

Two envelopes that reference **the same `body_hash`** from **different
`substrate_tag` values** are an independent cross-substrate witness of the same
morphism. If their `law_hash` values also agree, the two substrates share the
same law surface at the time of witnessing. Substrate Court (§ 6 Latent Space)
is built from this primitive — accumulating co-witness envelopes until a quorum
threshold over oracle matrix hashes is reached.

```text
envelope_A: { substrate_tag: "omega",   body_hash: H, law_hash: L_o }
envelope_B: { substrate_tag: "liquid",  body_hash: H, law_hash: L_l }
envelope_C: { substrate_tag: "trinity", body_hash: H, law_hash: L_t }

if L_o == L_l == L_t:  three substrates agree on both content AND law
if body_hash mismatch:  substrate divergence (court bench)
if law_hash mismatch:   law drift between substrates (codeicide candidate)
```

This does **not** require Omega ZK to participate — it works for any body kind.
Omega ZK becomes one (high-confidence) witness flavor, not the only notion of
consensus.

## Canonical serialization

For `envelope_id` and `body_hash`, the canonical form is **CBOR with
deterministic encoding** (RFC 8949 § 4.2.1):

- Integer keys preferred where possible.
- Map keys sorted lexicographically by their encoded form.
- Floats forbidden (use integer Q-format; this matches omega and liquid).
- No tags except those explicitly listed in this contract.

JSON form is the **human/debug** projection, NOT the canonical form. Hashing the
JSON gives different bytes than hashing the CBOR. Verifiers MUST hash CBOR. The
Trinity dispatcher (`0x0/01.ts`) emits JSON for `t` output, but when signing or
storing for anchor, the CBOR serializer is canonical.

## Backward-compatibility plan

Existing receipts do **not** need to be wrapped retroactively. Migration is
opportunistic:

1. **New** receipts emitted by trinity organs (e.g. `t apply`, `t status`) wrap
   themselves in this envelope when they leave the local process.
2. **Existing** code consuming a bare body (e.g. myc's
   `import_spore_receipt.ts`) accepts either bare or enveloped form, choosing by
   inspecting the top-level `schema` field.
3. **Bridge points** (PHI_INTENT, SPORE bridge, myc adapters) emit enveloped
   form first; bare-form support is removed once all consumers accept the
   envelope.
4. **Frozen surfaces** are never altered.

## Forbidden moves

- Envelope claims protocol ownership of the body. (The envelope is a witness
  skin; the body's contract owns the protocol.)
- Envelope alters body bytes after `body_hash` is set. (Then `body_hash` becomes
  a lie.)
- Witness chain is reordered. (The order encodes who signed first; it is
  load-bearing for retraction logic.)
- Bitcoin anchor is invented without an actual inscription. (Then anchor is
  decoration. Either inscribe or omit the field.)
- A `body_kind` is added without amending this contract first. (Then unknown
  kinds proliferate and the envelope becomes a forum, not a skin.)
- An envelope is law-hashed with one substrate's LawHash but tagged with
  another's substrate_tag. (Then `law_hash` field becomes meaningless.)

## Falsifiers

- If a body's canonical serialization is not stable (changing serializer changes
  `body_hash` for the same logical body), the envelope's hashing scheme is
  broken; either fix serialization or downgrade `body_hash` to advisory.
- If two substrates produce envelopes with the same `body_hash` but the bodies
  are not actually equal byte-for-byte, the canonical serialization contract is
  being violated somewhere; investigate before treating it as cross-substrate
  witness.
- If `law_hash` exists in envelopes but no substrate can actually compute its
  own LawHash (per § L5 of the deep analysis), this field is aspirational and
  should be marked `null` until the computation lands.
- If consumers ignore `simulation: true` from inner SPORE bodies because the
  envelope's outer `substrate_tag` says "trinity" looks authoritative, the
  envelope is masking simulation; verifiers MUST recurse into the body.

## Implementation seeds (non-prescriptive)

Reference TypeScript (Trinity side). Lives under
`probes/receipt-envelope-encoder-v0/ts/` — probes act as the canonical home for
protocol-surface code. `lib/` is the legacy exception and is **not** growing.

```typescript
// probes/receipt-envelope-encoder-v0/ts/envelope.ts (proposed)
export type ReceiptEnvelope = {
  type: "ReceiptEnvelope";
  schema: "trinity.receipt-envelope.v0.1";
  envelope_id: string;
  body_hash: string;
  substrate_tag: "omega" | "liquid" | "myc" | "trinity" | "external";
  body_kind: string; // see Registered body_kinds
  body?: unknown;
  body_ref?: string;
  law_hash?: string;
  witness_chain: Array<{
    oracle: string;
    signature_hash: string;
    signed_at_logical: { causal_ticks?: number; era?: number };
    substrate_tag: string;
    law_hash?: string;
  }>;
  bitcoin_anchor?: {
    block: number;
    tx: string;
    merkle_path?: string[];
    merkle_root?: string;
  };
  parent_envelope_id?: string;
  parent_relation?: "continuation" | "retraction" | "refinement" | "co_witness";
  created_at_logical?: {
    causal_ticks?: number;
    era?: number;
    bitcoin_block?: number;
  };
};

export async function wrap<T>(
  body: T,
  body_kind: ReceiptEnvelope["body_kind"],
  substrate_tag: ReceiptEnvelope["substrate_tag"],
): Promise<ReceiptEnvelope> {/* canonicalize, hash, sign */}

export async function unwrap(env: ReceiptEnvelope): Promise<{
  body: unknown;
  body_kind: string;
  body_hash_verified: boolean;
}> {/* re-hash body, verify against envelope.body_hash */}

export async function coWitness(
  env: ReceiptEnvelope,
  oracle: string,
): Promise<ReceiptEnvelope> {
  // Append a witness_chain entry. envelope_id changes (new hash).
}
```

## Acceptance for v0.1 → v1.0 promotion (load-bearing guardrail)

**Codex's review (`2026-05-14T173027Z-codex-review-...`) added the
AYE_WITH_GUARDRAIL: this contract MUST NOT be promoted to v1.0 or treated as
universal law until a SECOND implementation reproduces the golden `body_hash`
and `envelope_id` bytes for the probe fixtures.** One TypeScript encoder, even
with golden tests, is not enough governance ground. The encoder bytes ARE the
protocol; one impl == one possible silent drift.

Promotion criteria status:

- ✓ At least three of the registered body kinds (e.g. `spore_apply_v0`,
  `phi_receipt`, `sealed_descriptor`) actually wrapped and round-tripped in a
  probe. Done in `probes/receipt-envelope-encoder-v0/ts/test.ts`.
- ✓ **CBOR canonical serialization confirmed byte-identical across at least two
  implementations.** TypeScript (`ts/`) + Python (`python/`) in the same probe,
  verified by `python/cross_lang_test.py` on 2026-05-14. Both impls produce
  identical `body_hash` and `envelope_id` for the empty-body envelope and the
  substrate-court seed fixtures. **Codex's second-impl gate is cleared.**
- ✓ Substrate Court primitive demonstrated. `probes/substrate-court-v0/` with
  three multi-process scenarios green.
- ✓ `law_hash` is either populated by at least one substrate or marked
  explicitly `null` (no fake zero-bytes). Currently null/tolerated; omega-side
  LawHash is V3 of the deep analysis vectors.
- ✓ Codex review — AYE_WITH_GUARDRAIL on `2026-05-14T173027Z`. Guardrail
  satisfied by the Python second impl on the same day.
- **Pending:** Gemini review.

**4/5 criteria met as of 2026-05-14.** Only Gemini AYE is the gate to v1.0
promotion. This contract remains **draft** until Gemini reviews.

Once promoted, governance anchors (Senate warrants, codeicide decisions, Bitcoin
inscriptions of receipt roots) may use envelope bytes as ground. A future third
implementation (rust, in particular, would let omega ZK guest produce
envelope-canonical bytes from inside the SP1 RISC-V context) would lock the gate
down further; not a v1.0 prerequisite, but a v1.1 hardening.

## See also

- `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md` — the boundary that
  motivated separating envelope from body.
- `docs/SHAPE_MAP.v0.md` — where envelope sits in the 4-layer view.
- `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md` § 3 L1 (the original finding)
  and § 4 P1 (Resonant Edit that proposed an envelope).
