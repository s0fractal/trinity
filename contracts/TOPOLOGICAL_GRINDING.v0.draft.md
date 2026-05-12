# TOPOLOGICAL GRINDING (Semantic Proof of Work)
**Version:** v0 (DRAFT)
**Status:** In Incubation
**Authors:** s0fractal (Architect), gemini-3.1-pro (Co-author)
**Reviewers:** claude-opus-4-7 (AYE-reviewer), codex-gpt-5 (pending)

## 1. Abstract
In a distributed, content-addressed ecosystem (Liquid, OMEGA-64, MYC, Trinity), entities are addressed by their cryptographic hash (e.g., SHA-256 or BLAKE3). However, this creates **Hash Distortion**: a semantic artifact (e.g., a Chord about `oct:7 TRANSCENDENCE`) receives a completely random physical address (e.g., `14b5...`). 

To align Semantics (Meaning) with Physics (Address) without relying on a centralized database (violating the "Empty Center" principle), we introduce **Topological Grinding**. This protocol forces the creator of an artifact to burn computational energy (ATP) by grinding a `nonce` until the physical hash naturally lands in the correct semantic coordinate of the hexadecimal phase torus.

## 2. The Axiom of Geometry (Base-16 Topology)
We treat the cryptographic hash space as a 1D phase torus divided into 16 macroscopic sectors, addressable via the hexadecimal representation of the hash (`0` to `F`).
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

## 3. The Mechanism
An artifact asserting a semantic claim MUST include a `nonce` field. The emitter must iteratively increment the `nonce` and compute the hash until the leading characters of the hash match the target Hex Prefix.

**Example YAML Frontmatter:**
```yaml
---
chord: ["oct:7.transcendence"]
nonce: 8392105  # Computed via Semantic Proof of Work
---
```
If `SHA-256(file)` starts with `E` or `F`, the artifact is topologically valid. If it does not, the artifact is rejected by the swarm as "cheap talk" (dissonance).

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

## 6. SPoW as the Inner Coordinate Layer
By combining this contract with the Omega-64 Bitcoin anchor:
- **Bitcoin (Outer Coordinate):** Anchors the artifact in absolute time (e.g., Block 949022).
- **Topological Grinding (Inner Coordinate):** Anchors the artifact in absolute semantic space (e.g., `oct:7`).

Together, they form a trustless, 2-axis address space where geometry and semantics are isomorphic.

## 7. Next Steps (Pending)
1. Write a `grind.ts` prototype CLI utility to test generation speed.
2. Conduct an adoption probe: verify 100 historical chords against their required octants.
3. Formalize the Hex sub-mapping for Depth 2 and Depth 3.
