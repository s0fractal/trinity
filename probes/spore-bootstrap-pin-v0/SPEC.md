# spore-bootstrap-pin-v0 probe

> **Status: graduated (contract) → SPORE_BOOTSTRAP_PIN.v0 contract active 2026-05-12.** 51 files Bitcoin-anchored under this pin.

Verification probe for `contracts/SPORE_BOOTSTRAP_PIN.v0.md`.

This probe addresses **criterion 8** of `SPORE.v0.draft.md`
elevation requirements (bootstrap pinning mechanism). It is the
"in force" half: prose alone does not pin anything; a verifier
must be able to **run a command** and prove that the bootstrap
surface they are about to trust matches what the manifest says.

## What the probe does

1. Parses the markdown table in
   `contracts/SPORE_BOOTSTRAP_PIN.v0.md` to extract pairs of
   (file path, expected BLAKE3-256 hash).
2. For each pair, reads the file from the repo and recomputes its
   BLAKE3-256 hash.
3. If every recomputed hash equals the manifest hash, prints
   `PIN_GREEN` and the bootstrap root hash (BLAKE3-256 of the
   canonical concatenation of `<path>  <hash>\n` lines), then
   exits 0.
4. If any hash mismatches or a file is unreadable, prints
   `PIN_RED` with per-file expected/actual, then exits 1.

## Pre-freeze gate vs active freeze

This probe satisfies the **local pre-freeze gate** half of
criterion 8 — there is now a manifest and a verifier.

It does **NOT** satisfy `status: active` by itself. `status:
active` requires at least one external pin from
`SPORE.v0.draft.md` §I-2 (signed git tag, package-registry
checksum, Bitcoin OP_RETURN, etc.). Choice of mechanism is
deferred to architect / multi-voice consensus.

## Usage

```bash
bash probes/spore-bootstrap-pin-v0/run.sh
# prints PIN_GREEN + bootstrap_root_blake3 on success.

# To print only the root hash (e.g. for piping to an external pin):
(cd probes/spore-bootstrap-pin-v0/rust && cargo run --release --quiet --bin verify_pin -- --print-root)
```

## Re-pinning

If the bootstrap surface changes (a pinned file is edited, a file
is added or removed from the manifest), the manifest must be
re-populated:

```bash
(cd probes/spore-bootstrap-pin-v0/rust && \
  cargo run --release --quiet --bin compute_hashes -- ../file_list.txt)
```

Then update the table in `contracts/SPORE_BOOTSTRAP_PIN.v0.md`
with the new hashes (and the new root hash). Re-pinning before
`status: active` follows the pre-freeze amendment process
described in that contract.

## Falsifiers

- **F-PIN-1:** If `parse_manifest_table` returns zero entries from
  a well-formed manifest, the parser is wrong and the probe
  silently accepts an empty surface.
- **F-PIN-2:** If two different file lists produce the same
  bootstrap root hash, the canonical serialization is not
  collision-resistant. Two-space separator and LF newlines are
  intentional defenses; if either is changed, the root hash
  changes.
- **F-PIN-3:** If the probe reports PIN_GREEN but a pinned file
  has been edited since the last manifest population, either the
  parser or the hasher is broken.
