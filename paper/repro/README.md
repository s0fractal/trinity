# Reproduction — every number and check in the paper

One command, from a clean clone, reproduces every table, figure and verification
claim in `paper/main.pdf`:

```sh
git clone https://github.com/s0fractal/trinity && cd trinity
./paper/repro/run_all.sh
```

Requirements: `git`, Deno ≥ 2.x. Network is used exactly once, to fetch the
published `jsr:@s0fractal/witness` package (standard Ed25519); all repo data is
read locally. Expected wall-clock: well under 10 minutes (seconds, once Deno has
cached the package).

## What runs

| Step                            | Script                                                                 | Paper section | Output                                 |
| ------------------------------- | ---------------------------------------------------------------------- | ------------- | -------------------------------------- |
| commit pin                      | `git rev-parse HEAD`                                                   | all numbers   | `out/COMMIT`                           |
| ledger statistics               | `chord_stats.ts`                                                       | §6 Table 1    | `out/chord_stats.{md,json}`            |
| hears-graph statistics          | `hears_graph.ts`                                                       | §6 Table 2    | `out/hears_graph.{md,json}`            |
| verifier accept + tamper-reject | `verifier_walkthrough.sh` → `probes/external-trust-verifier-v0/run.sh` | §4 (claim C1) | exit 0 iff accept AND reject both hold |

## Counting rules (stated so the numbers are checkable, not just repeatable)

- A file counts as a **ledger chord** iff it lives in `src/`, matches
  `xNNNN_<key>_<voice>_<slug>.myc.md`, and its frontmatter satisfies the
  identification rule of `contracts/schema/chord.schema.json` (an octant claim,
  or `type: chord.*`/`mode` plus a voice/author, or legacy `id`+`speaker`).
  Generated projections in `src/` do not count.
- The external verifier (`verify.ts`) uses a broader denominator — every
  `*.myc.md` under `src/` — because its question is different: "does anything
  here carry a signature that fails?" Signed counts agree across both rules;
  unsigned totals differ by the projection files. Both rules are stated where
  their numbers appear.
- `hears` edges are counted as **resolved** only when the referenced stem is
  itself a ledger chord in this repository; references to contracts, docs, or
  other substrates are counted (and reported) as dangling, not dropped.
- **Self-inclusion:** the paper's own announcement receipt
  (`src/x7700_956525_…`) is a ledger chord and is **included** in the counts —
  landing it moved the ledger 734→735, after which the numbers were regenerated
  once and are at a fixpoint: editing existing chords adds no new chords, so
  re-running on any later commit with no new chords reproduces the same totals.

## Determinism

Same tree ⇒ same output: directory listings are sorted, ties in rankings are
broken lexicographically, and no timestamps or randomness enter any script. All
numbers in the paper cite the commit hash in `out/COMMIT`.

## Falsifiers for this reproduction itself

- `run_all.sh` exits non-zero on a clean clone → AC-1 fails.
- Any number in the paper differs from the regenerated `out/` at the pinned
  commit → the paper is wrong (numbers are generated, never hand-typed).
- `verifier_walkthrough.sh` accepting `court-attestation.tampered.json` → claim
  C1 is falsified (this is the paper's own stated falsifier).
