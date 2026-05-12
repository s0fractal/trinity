# TOPOLOGICAL GRINDING (Semantic Proof of Work)
**Version:** v0 (DRAFT)
**Status:** In Incubation
**Hash Algorithm:** BLAKE3-256 (multihash code `0x1e`)
**Authors:** s0fractal (Architect), gemini-3.1-pro (Co-author)
**Reviewers:** claude-opus-4-7 (AYE with six spec gaps named in chord `2026-05-12T084803Z`), codex-gpt-5 (pending)

## 1. Abstract
In a distributed, content-addressed ecosystem (Liquid, OMEGA-64, MYC, Trinity), entities are addressed by their cryptographic hash (e.g., SHA-256 or BLAKE3). However, this creates **Hash Distortion**: a semantic artifact (e.g., a Chord about `oct:7 TRANSCENDENCE`) receives a completely random physical address (e.g., `14b5...`). 

To align Semantics (Meaning) with Physics (Address) without relying on a centralized database (violating the "Empty Center" principle), we introduce **Topological Grinding**. This protocol forces the creator of an artifact to burn computational energy (ATP) by grinding a `nonce` until the physical hash naturally lands in the correct semantic coordinate of the hexadecimal phase torus.

## 2. The Axiom of Geometry (Base-16 Topology)
We treat the BLAKE3-256 cryptographic hash space as a 1D phase torus divided into 16 macroscopic sectors, addressable via the hexadecimal representation of the hash (`0` to `F`). BLAKE3 was chosen over SHA-256 because:

- BLAKE3-256 is already the canonical hash in the SPORE protocol stack (`contracts/SPORE.v0.draft.md`).
- It is ~10× faster than SHA-256, making Depth-3 grinding affordable on commodity hardware.
- It is a supported multihash algorithm (`0x1e`), giving native CIDv1 compatibility with IPFS, which is the most likely future distribution layer for chord and receipt archives.
This maps perfectly to the 8 Macro-Octants of the Chord Protocol:

| Octant | Semantic Macro-Group | Hex Prefix Target | Angular Range (Approx) |
| :--- | :--- | :--- | :--- |
| `oct:0` | EXISTENCE | `0`, `1` | 0° - 45° |
| `oct:1` | COGNITION | `2`, `3` | 45° - 90° |
| `oct:2` | POWER | `4`, `5` | 90° - 135° |
| `oct:3` | UNION | `6`, `7` | 135° - 180° |
| `oct:4` | CREATION | `8`, `9` | 180° - 225° |
| `oct:5` | EXCHANGE | `A`, `B` | 225° - 270° |
| `oct:6` | ORDER | `C`, `D` | 270° - 315° |
| `oct:7` | TRANSCENDENCE | `E`, `F` | 315° - 360° |

## 2.5. Architectural Layering (Physical 16-fold vs Semantic 8-fold)

Per 4-voice convergence on 2026-05-12 (claude `2026-05-12T093402Z`, gemini `2026-05-12T123500Z`, kimi `2026-05-12T124000Z`, codex prior `2026-05-12T112000Z`), the ecosystem operates two distinct addressing layers that compose via a fixed pairing mapping. They MUST NOT be conflated.

### Physical layer (16-fold hex)

The base layer of addressing in the ecosystem. Operates on the raw output of BLAKE3-256.

- **Hash prefix:** every artifact has a BLAKE3-256 hash; the first hex character (0-F) is its physical macro-position.
- **File system paths:** the canonical layout for addressable artifacts is `<root>/<hex char>/<file>` at depth 1, and `<root>/<hex char>/<hex char>/<file>` at depth 2.
- **LUT indices:** omega's SINE_LUT[256] = 16² aligns with depth-2 physical addressing.
- **IPFS multihash:** BLAKE3-256 hashes are valid CIDv1 multihashes (algo code `0x1e`); folder structure becomes a UnixFS DAG directly publishable.

The physical layer is what hash-based machinery (hashes, file systems, IPFS, LUTs) operates on. It is geometry, not meaning.

### Semantic layer (8-fold octant)

The interpretive layer. Operates on chord-protocol vocabulary and biological/cognitive geometry.

- **Chord octants:** `oct:0` through `oct:7` with names EXISTENCE / COGNITION / POWER / UNION / CREATION / EXCHANGE / ORDER / TRANSCENDENCE.
- **MACRO_GROUPS:** the 8-element labeling table in `omega/tools/omega_map_sync.ts`.
- **Omega phase geometry:** `Math.pow(8, depth)` in `omega/tools/omega_map_sync.ts:computeOctetGeometry` computes ANGLES on the semantic phase circle, NOT physical paths. This is semantic geometry and MUST NOT be rewritten to `Math.pow(16, depth)`.
- **Liquid 8D phase torus:** the biological phase geometry of liquid neurons. Stays 8D. Not a physical addressing concern.

The semantic layer is what humans and biological/cognitive substrates operate on. It is meaning, projected onto a smaller-cardinality space for cognitive ergonomics.

### The mapping between layers

The two layers are bridged by the pairing table in Section 2 (reproduced for explicitness):

```text
oct:0 EXISTENCE      ⇄ hex 0,1
oct:1 COGNITION      ⇄ hex 2,3
oct:2 POWER          ⇄ hex 4,5
oct:3 UNION          ⇄ hex 6,7
oct:4 CREATION       ⇄ hex 8,9
oct:5 EXCHANGE       ⇄ hex A,B
oct:6 ORDER          ⇄ hex C,D
oct:7 TRANSCENDENCE  ⇄ hex E,F
```

The mapping is **deterministic and total**: every hex character maps to exactly one octant; every octant maps to exactly two hex characters. The function `octant_of(hex_char) = (hex_char_value >> 1)` is the canonical translation.

### Implications for grinding

When a chord claims `oct:7` (semantic), its physical hash prefix must be `E` or `F`. The grinder produces ONE hash satisfying the semantic claim; the resulting file's physical position in the filesystem is determined by the actual hex char produced (E or F). Both are valid for `oct:7`; their separation within the octant is sub-grinding (Depth 2) territory.

A chord claiming `oct:7.3` (depth 2 semantic) requires a hash prefix matching octant 7 first (E or F) and then octant 3 second (6 or 7), i.e. hash must start with one of: `E6`, `E7`, `F6`, `F7`. Same pairing rule applied recursively.

### What MUST NOT be done

- **Do not rewrite `Math.pow(8)` to `Math.pow(16)` anywhere.** Semantic geometry is 8-fold by design.
- **Do not name physical folders with octant labels** (no `oct7-transcendence/`). Folders are hex-named (`E/`, `F/`). Cold-start readers learn the mapping from the per-folder README.
- **Do not expand liquid's 8D torus to 16D.** Biology is not obligated to mirror filesystem cardinality.
- **Do not change chord protocol vocabulary.** `oct:N.M.P` notation is semantic and unchanged.

## 3. The Mechanism
An artifact asserting a semantic claim MUST include a `nonce` field. The emitter must iteratively increment the `nonce` and compute the hash until the leading characters of the hash match the target Hex Prefix.

**Example YAML Frontmatter:**
```yaml
---
chord: ["oct:7.transcendence"]
nonce: 8392105  # Computed via Semantic Proof of Work
---
```
If `BLAKE3-256(file)` starts with `E` or `F`, the artifact is topologically valid. If it does not, the artifact is rejected at any importing/publishing adapter (e.g., the myc descriptor importer, the chord-archive verifier) as "cheap talk" (dissonance). Pure archival accumulation (e.g., the `jazz/chords/` directory before adapter consumption) does NOT enforce rejection — enforcement happens at the consumer boundary.

## 4. Fractal Depth Limits (The Thermodynamic Wall)
Topological grinding can be recursively deep (matching subsequent hex characters for sub-categories). However, the cost (ATP) scales exponentially. To prevent the ecosystem from freezing due to computational overhead, we establish the following depth boundaries for Phase 0:

- **Depth 1 (Macro-Octant):** 1 hex character. ~16 attempts. (Cost: Trivial, < 1ms)
- **Depth 2 (Sub-Octant, e.g., `oct:7.3`):** 2 hex characters. ~256 attempts. (Cost: Low, ms)
- **Depth 3 (Micro-Octant):** 3 hex characters. ~4,096 attempts. (Cost: Noticeable, fraction of a second)
- **Depth 4+ (Deep Fractal):** 4+ hex characters. >65,536 attempts. (Cost: Restrictive)

**RULE:** No standard artifact in Trinity/Liquid shall require a grinding depth greater than **Depth 3** unless specific hardware acceleration (SP1 ZK-provers or WebGPU parallel grinders) is explicitly utilized. Deep fractality is reserved for long-term immutable constants.

## 5. Immutability Constraint (The Falsifier)
Topological Grinding is strictly defined for **FROZEN** artifacts (e.g., Chord logs, SPORE Receipts, compiled WASM modules). 

**RULE:** Topological Grinding MUST NOT be applied to **LIVING** artifacts (e.g., self-rewriting READMEs, active compost managers). Any modification to an artifact breaks the Proof of Work. Living artifacts achieve phase-locking via runtime continuous adjustment (Kuramoto), not static hash grinding.

## 5.5. Grandfather Clause (Historical Artifacts)

Topological grinding applies only to artifacts emitted **after** this contract reaches `status: active`. Artifacts emitted before that date — including the entire pre-existing `jazz/chords/` archive (~hundreds of files), all pre-existing SPORE receipts, all pre-existing contracts, and any other addressable artifact already in the repository — are **grandfathered**.

Grandfathered artifacts:
- Remain semantically valid and citable regardless of their actual physical hash position.
- Do NOT need to be re-emitted or re-ground.
- May voluntarily be ground in successor versions if the emitter chooses, but no obligation exists.

Probability note: roughly 1 in 8 historical chord files will have a hash whose first hex character accidentally aligns with their declared `oct:N` macro-octant. The probe in Section 7 step 2 should measure this rate as a sanity check on the random-hash-distribution model, NOT as a retroactive validation pass.

The effective date is the timestamp recorded in the contract's frontmatter when `status` transitions from `draft` to `active`. Until then, the contract is non-binding and no grinding is required.

## 6. SPoW as the Inner Coordinate Layer
By combining this contract with the Omega-64 Bitcoin anchor:
- **Bitcoin (Outer Coordinate):** Anchors the artifact in absolute time (e.g., Block 949022).
- **Topological Grinding (Inner Coordinate):** Anchors the artifact in absolute semantic space (e.g., `oct:7`).

Together, they form a trustless, 2-axis address space where geometry and semantics are isomorphic.

## 7. Next Steps (Pending)
1. Write a `grind.ts` prototype CLI utility (using BLAKE3-256) to test generation speed at Depth 1, 2, 3. Verify Depth-3 (~4096 attempts) completes in well under one second on commodity hardware.
2. Conduct an adoption probe: measure the rate of accidental octant-alignment in 100 historical chords (expected: ~1/8 ≈ 12-13 files). NOT a retroactive validation; sanity check only.
3. **Spec gap (deferred to v0.1 or addressed in v0):** Formalize the BLAKE3 sub-prefix mapping for Depth 2 and Depth 3 (claude `2026-05-12T084803Z` proposes one scheme — review and ratify).
4. **Spec gap (deferred to v0.1 or addressed in v0):** Define canonical serialization of the file bytes hashed (which bytes? what byte order? line endings? YAML key ordering?). The simplest path: hash the literal repository file bytes with LF line endings and the nonce field placed last in the YAML frontmatter.
5. **Spec gap (deferred to v0.1):** Disambiguate Section 4's "SP1 ZK-provers" — either explicitly define a zero-knowledge grinding mode, or replace with "GPU compute / dedicated SHA chips."
6. **Adoption track:** Pick one substrate (likely the chord layer, since chords are already frozen-on-emission). Implement the importer / verifier. Run probe. If green, expand to SPORE mutators, myc descriptors, and eventually Σ-neurons in liquid.
