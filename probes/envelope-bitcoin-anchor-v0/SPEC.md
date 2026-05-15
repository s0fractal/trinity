# envelope-bitcoin-anchor-v0 probe

**Inscription-prep** for `RECEIPT_ENVELOPE` v1.0 envelopes. Computes a
Merkle root over N `envelope_id` values and emits an inscription-ready
payload. **Does NOT actually inscribe.** This probe stops at the data
shape; the actual Bitcoin transaction submission belongs to a separate
operational tool with key handling.

This is **V8** from `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md` —
Bitcoin Receipt Pipeline — newly unlocked by Gemini's AYE on
`RECEIPT_ENVELOPE.v1.0` (2026-05-14T182641Z). Cross-language byte
equality across TS + Python proved the envelope bytes are protocol,
which made anchoring them as Bitcoin commitments safe to design.

## Status

**RUNNABLE PREP.** SPEC + Merkle implementation + inclusion-proof
verifier + run.sh acceptance scenarios. NOT an inscription tool.

## What this probe answers

> Given N RECEIPT_ENVELOPE v1.0 envelopes, what is the **single 32-byte
> Merkle root** that could be anchored to Bitcoin (or any other linear
> chain) to commit to the set?
>
> For any one envelope in the set, what is the **inclusion proof** that
> verifies it against the root without revealing the others?

Both questions are independently useful:

- A trinity instance can compute a daily root over the envelopes it
  produced; one Bitcoin transaction commits to many envelopes at once.
- A consumer who has one envelope can later prove inclusion in the root
  without needing the other N-1 envelopes (privacy / data minimization).

## Boundary: what this probe does NOT do

- **Sign or submit a Bitcoin transaction.** That requires key handling
  and network IO that belongs in a separate tool. Architect decides
  when/how/with what key.
- **Define the wire format of the inscription.** This probe emits a
  candidate "inscription_ready" block, but choosing between
  OP_RETURN / inscription envelope / Taproot script / IPFS pin / etc.
  is a protocol decision, not an encoder decision.
- **Anchor anything that is NOT a v1.0 envelope.** A receipt that has
  a different schema string is rejected; anchoring non-canonical bytes
  to a permanent chain is irreversible misuse.
- **Tolerate hash collisions silently.** Two envelopes with the same
  `envelope_id` would mean the same body AND same substrate_tag AND
  same witness_chain AND same metadata — duplicate emit. Probe rejects
  duplicates explicitly.

## Output shape (canonical)

```json
{
  "type": "EnvelopeAnchorPayload",
  "schema": "trinity.envelope-anchor.v0.1",
  "protocol": "trinity-envelope-anchor",
  "version": "0.1",
  "leaf_count": <int>,
  "leaves": [
    {"envelope_id": "<multihash>", "index": <int>}
  ],
  "merkle_root": "<64 hex chars; sha256 over canonical tree>",
  "inclusion_proofs": [
    {
      "envelope_id": "<multihash>",
      "index": <int>,
      "siblings": ["<64 hex chars>", ...],
      "directions": ["L" | "R", ...]
    }
  ],
  "inscription_ready": {
    "method": "placeholder | bitcoin-op-return | bitcoin-witness | ipfs-cid",
    "payload_hex": "<hex string; what would be inscribed>",
    "payload_len_bytes": <int>,
    "anchor_target": "merkle_root"
  },
  "rejected": [
    {"envelope_id": "<>", "reason": "duplicate | wrong_schema | malformed"}
  ]
}
```

## Merkle tree spec (canonical)

- **Leaf hash:** `H_leaf(envelope_id) = SHA256(envelope_id_bytes)` where
  `envelope_id_bytes` is the **raw multihash bytes** (decoded from the
  hex representation; i.e. the 34 bytes that the hex string `"1220" +
  64 hex chars` represents).
- **Internal node:** `H_node(left, right) = SHA256(left || right)`
- **Odd-leaf-count rule:** if the last level has an odd number of
  nodes, duplicate the last node and pair it with itself (Bitcoin
  convention).
- **Tree ordering:** leaves are sorted lexicographically by
  `envelope_id` for canonical reproducibility. Order in input does NOT
  affect root.
- **Empty input:** N=0 is rejected; an empty anchor is meaningless.
- **N=1:** root equals `H_leaf(envelope_id_0)`; inclusion proof has
  zero siblings.

This is **NOT** the Bitcoin merkleblock format. It's a simpler
content-commitment scheme. A future protocol decision can choose
between this and Bitcoin's exact convention; the data shape stays the
same regardless.

## Inclusion proof spec

For envelope at canonical index `i`:
- Start: `current = H_leaf(envelope_id_i)`
- At each level: `sibling = node at index (i XOR 1) at this level`
- If `(i mod 2) == 0`: `current = SHA256(current || sibling)`, direction "R"
- Else: `current = SHA256(sibling || current)`, direction "L"
- Move up: `i = i / 2`
- Continue until `current === merkle_root`

Probe verifies inclusion proofs roundtrip: for each leaf, the emitted
proof must verify against the emitted root.

## Test scenarios (run.sh)

### Scenario A — single envelope

N=1; root equals leaf-hash; inclusion proof has zero siblings; verifier
accepts.

### Scenario B — two envelopes

N=2; root depends on canonical-sorted order; both inclusion proofs
verify.

### Scenario C — many envelopes

N=5 (odd number forces last-level duplication); all inclusion proofs
verify.

### Scenario D — tampered envelope

Take the Scenario C output. Modify one envelope's `envelope_id` after
inclusion proof was generated. Verifier MUST reject the tampered
proof.

### Scenario E — duplicate detection

N=3 where two envelopes have identical `envelope_id`. Probe reports
the duplicate in `rejected` and proceeds with the deduplicated set
(or rejects the whole call — design choice; this probe rejects to
fail-loud).

### Scenario F — wrong schema rejection

N=3 where one envelope has `schema: "trinity.receipt-envelope.v0.0"`
(synthetic forward-incompat). Probe rejects that envelope, processes
the other two.

## Test fixture envelopes

`fixtures/` contains pre-generated valid envelopes from previous probe
runs. The probe runner uses them as test inputs to avoid running other
probes inside this probe's run.sh.

## What "anchor_target: merkle_root" means

The 32-byte `merkle_root` is what would be committed to an external
chain. The choice of chain (Bitcoin / Ethereum / Arweave / IPFS pin)
and the inscription mechanism (OP_RETURN / witness commitment /
inscription envelope) is **operational**, not protocol. This probe
provides the **commitment value**; the inscription tool inscribes it.

## See also

- `contracts/RECEIPT_ENVELOPE.v1.0.md` — envelope contract.
- `probes/receipt-envelope-encoder-v0/` — produces the envelopes this
  probe anchors.
- `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md` § 8 V8 — original
  vector that proposed this.
- Future: `omega/docs/PHI_MANIFEST.md` Bitcoin anchor section, IF a
  formal mapping between trinity's envelope-anchor protocol and
  omega's φ-anchor chain is established.

## Acceptance for v0.1 → v1.0 promotion

- All six scenarios (A-F) pass in run.sh
- Merkle root is reproducible across runs for the same canonical-sorted
  input set
- Inclusion proofs verify roundtrip for every leaf
- Tamper detection: any byte change in an envelope_id invalidates its
  proof
- Probe reviewed by codex or gemini; v1.0 also requires demonstration
  with a real Bitcoin testnet transaction (out of scope here).
