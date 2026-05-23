# spore-apply-v0 probe

> **Status: graduated (contract) → SPORE.v0 contract active 2026-05-12.** Probe
> is the cross-language test record (TS + Rust).

Cross-language probe verifying that the `apply` record wire format and
`spore_id` hash are byte-identical between independent rust and ts
implementations.

This probe does **not** execute mutators. It only verifies encoding and hashing
determinism.

---

## Wire format (frozen for this probe)

```text
offset  size  field        value
─────── ────  ───────────  ─────────────────────────────
0       4     magic        "SPOR"  (0x53 0x50 0x4F 0x52)
4       1     version      0x00
5       1     kind         0x01 (= apply)
6       2     flags        big-endian u16, bitfield
8       1     argc         N
9       ...   fields       multihash entries
```

Each multihash entry:

```text
offset  size  field        value
─────── ────  ───────────  ─────────────────────────────
0       1     algo_tag     0x1e BLAKE3-256, 0x12 SHA-256, 0x1d BLAKE2b-256
1       1     length       L
2       L     digest       raw L bytes
```

Field order for `kind = 0x01`:

```text
field[0]           = f_hash
field[1..1+argc]   = arg_hashes[0..argc-1]
field[1+argc..]    = optional fields in flag-bit order
```

Flag bits (big-endian u16):

```text
0x0001  HAS_EXPECT      expect_hash multihash
0x0002  HAS_CAPS        caps_hash multihash
0x0004  HAS_SIG         signature block (not a multihash)
0x0008  HAS_DEPENDS     depends_on_hash multihash
0x0010..0x8000          reserved, MUST be zero (else REJECT)
```

If a non-reserved flag bit is set, its associated multihash appears after
`arg_hashes` in the order: EXPECT, CAPS, DEPENDS (HAS_SIG is trailing block, not
in v0).

---

## `spore_id`

```text
spore_id = BLAKE3.derive_key("spore.apply.v0", record_bytes_without_sig)
```

The context string is `"spore.apply.v0"` exactly. ASCII, no padding, no null, no
whitespace.

**In v0, `spore_id` is ALWAYS BLAKE3.** SHA-256 (algo_tag 0x12) is permitted
only inside multihash fields, never as the `spore_id` hash function. v0 records
use BLAKE3 derive_key for the wrapper hash even if internal fields use SHA-256.

---

## Test vector matrix

For each case, both implementations produce one line of output.

Digest convention: `0xNN × 32` means "32 bytes all equal to NN". This is
positional, not computed — purely for byte-level inspectability.

```text
case  argc  flags    fields                                                outcome
────  ────  ──────   ────────────────────────────────────────────────────  ───────
1     0     0x0000   f=01×32                                               ok
2     1     0x0000   f=01×32, a0=02×32                                     ok
3     2     0x0000   f=01×32, a0=02×32, a1=03×32                           ok
4     3     0x0000   f=01×32, a0=02×32, a1=03×32, a2=04×32                 ok
5     1     0x0001   f=01×32, a0=02×32, expect=05×32                       ok
6     1     0x0008   f=01×32, a0=02×32, depends=06×32                      ok
7     1     0x0000   f=01×32 [BLAKE3], a0=07×32 [SHA-256, tag 0x12]        ok
8     1     0x0009   f=01×32, a0=02×32, expect=05×32, depends=06×32        ok
9     1     0x0010   f=01×32, a0=02×32                                     reject
```

All algo tags default to `0x1e` (BLAKE3-256) unless otherwise noted.

---

## Output format

Each implementation prints one line per case:

```text
case=N record_hex=<hex>   spore_id=<hex>
```

For rejection:

```text
case=N reject=<reason>
```

The reject reason is a fixed string from the spec. For case 9:
`reason=reserved_flag_set`.

Whitespace: exactly one space between `case=N`, `record_hex=...`, and
`spore_id=...`. No trailing whitespace. Hex lowercase, no separators.

---

## Success criterion

```bash
bash run.sh
# exits 0 with PROBE_GREEN if all 9 cases match byte-for-byte
# across rust and ts implementations.
```
