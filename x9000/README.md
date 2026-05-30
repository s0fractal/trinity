# `x9000/` — MYC Compatibility Surface

This directory represents the projected compatibility surface for the external
`myc` submodule, established under **Phase 2 of the shadow integration** (Axis
7/Completion).

## Topology

- `x9000/README.md` — this document.
- `x9000/MANIFEST.myc.ndjson` — auto-generated NDJSON file index mapping all
  files inside `myc/` public directories, along with their sizes and SHA-256
  hashes. Generated automatically by `./t external-surfaces --stable`.
- `x9000/public` — symlink pointing to `../myc/public` (private/public boundary
  shim).

## Rationale

Root directories in the Trinity repository may only be named `src/` (private
code execution space) or carry coordinate keys `xNNNN/` (e.g. `x8E00/`,
`x9000/`). Semantic folder naming is deprecated in favor of coordinate-based
folders.

`x9000/` acts as the compatibility gate for the `myc` submodule, enabling the
parent repository to index and verify the submodule's artifacts without deleting
the submodule boundary.
