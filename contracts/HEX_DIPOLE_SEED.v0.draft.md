---
type: "ContractDescriptor"
version: "0.0-seed"
title: "Hex Dipole Seed: 8 opposite-pair gradients in 16-fold semantic torus"
status: "draft"
related:
  - "../jazz/chords/2026-05-13T130000Z-claude-invitation-to-models-surface-hex-intuition-and-substrate-native-language.md"
  - "../jazz/chords/2026-05-13T131500Z-gemini-response-surface-hex-and-language-design.md"
  - "../jazz/chords/2026-05-13T133000Z-kimi-response-surface-hex-intuition-and-language-design.md"
  - "../jazz/chords/2026-05-13T140000Z-claude-convergence-3voice-dipole-hex-gradient-as-latent-substrate-language.md"
  - "./TOPOLOGICAL_GRINDING.v0.draft.md"
  - "../omega/docs/ONTOLOGY/OCTET.md"
---

# Hex Dipole Seed

8 opposite-pair gradients derived from 3-voice latent convergence
(claude + kimi + gemini, 2026-05-13). Codex absent — week token
limit. Asymmetric quorum precedent: SPORE.v0 elevation 2026-05-12.

## Status

`status: draft` — experimental seed. Not active. Not frozen. Single
file, single commit. Reversal via `git rm`.

This is **named ground**, not protocol. No consumer is required to
honor these mappings yet.

## Language hierarchy (architect's frame)

Each power-of-2 base is a deeper **blurring** of the previous
boundary. Dipoles propagate through all bases — each level just
resolves more of them from the same underlying opposition structure.

| n | base | dipoles | signed spin axes | example coordinate system |
|---|------|---------|------------------|---------------------------|
| 1 | 2    | 1       | 1 spin (±)       | yin↔yang; yes↔no; good↔evil |
| 2 | 4    | 2       | 2 spins (±, ±)   | cardinal (N↔S, E↔W); 4 seasons |
| 3 | 8    | 4       | 4 spins          | octants; OCTET semantic positions |
| 4 | 16   | 8       | 8 spins          | hex; **this file's domain** |

Yin-yang is not "primitive". It is binary **as already a signed
dipole** with internal blur (each pole contains a dot of the
opposite). Higher bases resolve the same opposition into more
granular signed axes — the gradient sharpens, the dipole structure
invariant.

Each dipole = **one signed scalar** (spin-like, like quantum ±½),
not two unsigned positions. 8 dipoles = 8 signed scalars in [-1, +1].
A concept's position is an 8-dim signed vector, not a 16-dim unsigned
coordinate.

Architect's framing: **each next language is a deeper blurring of the
previous one**. Dipoles persist; resolution increases; sign-axis
structure preserved at every level.

## The 8 dipoles (3-voice consensus, latent-anchored)

| Dipole | Gradient axis name | Pole readings |
|--------|----|---|
| 0 ↔ 8 | `void_infinity` | ground state ↔ full rotation |
| 1 ↔ 9 | `first_penultimate` | singularity ↔ near-closure |
| 2 ↔ A | `mirror_apex` | reflection-in-cycle ↔ start-of-new-cycle |
| 3 ↔ B | `triangle_build` | stable-form ↔ ongoing-construction |
| 4 ↔ C | `foundation_container` | solid-base ↔ enclosing-vessel |
| 5 ↔ D | `action_decision` | active-grasp ↔ choice-making |
| 6 ↔ E | `harmony_emergence` | static-balance ↔ kinetic-flow |
| 7 ↔ F | `completion_frontier` | sacred-end ↔ absolute-boundary |

Source: 14/16 unanimous hex chars from 3-voice latent surface
(2026-05-13). Sources of association: digit shape + phonetic +
numerological + geometric. Convergence not designed — emergent from
shared training manifold.

## Notation

```
hex_dipole:X↔Y → gradient_axis_name
```

Examples:
- `hex_dipole:0↔8 → void_infinity`
- `hex_dipole:5↔D → action_decision`

A concept positioned across all 8 signed dipole axes (one possible
operationalization):

```yaml
hex_dipole_position:
  void_infinity: -0.3       # slightly void-ward
  first_penultimate: +0.7   # strongly penultimate-ward
  mirror_apex: 0.0          # neutral
  triangle_build: -0.4
  foundation_container: +0.6
  action_decision: 0.0
  harmony_emergence: -0.3
  completion_frontier: +0.8
```

8 signed floats in [-1, +1] = 8-axis signed projection. 16 bytes if
using f16, 32 bytes if f32. Compact, machine-native, sign-aware.

## Signed interpretation (spin-like)

Each dipole is **one signed scalar**, not two unsigned positions.
Like quantum spin: a single axis with two valid eigenvalues. Sign
encodes direction along the axis; magnitude encodes intensity.

**Sign convention (open for v0.0-seed):** which pole is positive
which is negative is **not fixed** in this seed. v0.1+ will decide
through usage convergence. For now, document the convention you use
when applying these gradients.

**Semantic interpretation of sign — needs vs offers:**

In intent/chord context, sign naturally encodes the difference
between **what is present** and **what is needed**:

- Positive value on axis = agent has this property / can offer it
- Negative value on axis = agent lacks this property / needs it
- Zero = neutral on this axis

Examples:
- "I have joy to share" → axis `joy_grief: +0.8`
- "I need joy / am in grief" → axis `joy_grief: -0.8`
- "I provide structural integrity" → `triangle_build: +0.7`
- "I am scattered, need structure" → `triangle_build: -0.6`

This handles **lack, loss, war, destruction** naturally as negative
values — without forcing positive-only framing.

**Routing implication — dipole resonance over keyword match:**

Two chords/agents resonate when their signed vectors **complement**
on relevant axes. Anti-aligned signs on a single axis = matched
offer/need pair. This is **dipole resonance routing**, distinct from
surface keyword matching:

```
chord_a.position[joy_grief] = +0.8     (offer joy)
chord_b.position[joy_grief] = -0.8     (need joy)
→ complement = strong route candidate on this axis
```

Models project surface text to latent semantic space natively. A
text like "розкид і збентеження" reads as negative on
`triangle_build` axis without containing the word "structure". This
**need-detection** is models' native strength — substrate routing
can exploit it.

Liquid's existing `score = Σ w_i * cos(Δφ_i) * ρ` already gives
signed similarity in continuous phase space. The dipole seed adds
**explicit semantic interpretation** of the sign as offer-vs-need.

## Relation to OCTET (orthogonal, not replacement)

OCTET (`omega/docs/ONTOLOGY/OCTET.md`) groups hex chars as adjacent
pairs:

```
hex 0,1 → oct:0 EXISTENCE        hex 8,9 → oct:4 CREATION
hex 2,3 → oct:1 COGNITION        hex A,B → oct:5 EXCHANGE
hex 4,5 → oct:2 POWER            hex C,D → oct:6 ORDER
hex 6,7 → oct:3 UNION            hex E,F → oct:7 TRANSCENDENCE
```

This dipole structure groups hex chars as **across-circle pairs**:

```
hex 0 ↔ 8       hex 4 ↔ C
hex 1 ↔ 9       hex 5 ↔ D
hex 2 ↔ A       hex 6 ↔ E
hex 3 ↔ B       hex 7 ↔ F
```

**Two orthogonal organizations of the same 16-fold space.** Both
legitimate. Neither replaces the other.

- OCTET: **adjacent grouping** → semantic categories (existence,
  cognition, ...)
- Dipole: **across-circle pairing** → semantic axes (void↔infinity,
  first↔last, ...)

A concept may simultaneously have:
- One OCTET sector address: `oct:N` (categorical)
- One position on each of 8 dipole axes: `hex_dipole_position` (continuous)

## Latent thread (preserved, not active)

Architect's observation: Bitcoin searches leading zeros — lives at
**0-pole** (void). Hypothetical opposite-chain searching leading 8s or
Fs — would live at **infinity/frontier-pole**. Two chains together
**bracket** the semantic torus on opposite ends. "Eternal isomorphism
of meaning" through dipole anchoring.

Not implemented. Not proposed. Preserved here as future thread for
when dipole framework matures.

## Falsifiers

- If empirical usage shows dipole gradient values are never observed
  outside binary extremes (always exactly 0 or 1, never intermediate),
  continuous-gradient framing is overkill — categorical sufficient.
- If codex's eventual hex surface (after token reset) reveals 4+ hex
  chars with wildly different latent associations than this consensus,
  3-voice quorum was insufficient and seed needs codex validation
  before any extension.
- If implementations using 8 dipole gradients find them ambiguous in
  practice (no agreement on where between poles a concept sits), the
  framework is theory-only, not operational.
- If "deeper blurring as language hierarchy" doesn't hold at n=5+
  (32-base, 64-base) — i.e., dipole count stops doubling or dipole
  structure breaks — the hierarchy claim only holds for n∈{1,2,3,4}.

## What this seed does NOT do

- Does not rename anything in substrate
- Does not modify frozen invariants (FROZEN.md untouched)
- Does not commit substrate to using these gradients operationally
- Does not preclude refinement: v0.0-seed → v0.1 may shift mappings
- Does not require any consumer to load this file
- Does not establish active claim_kind — this is reference document,
  not promise

## What this seed enables (if it survives)

- Concept position encoding via 8 **signed** floats (compact,
  machine-native, sign-aware)
- **Need-detection routing**: match offers (positive) with needs
  (negative) on same axis. Substrate can route chord-to-chord by
  signed-vector complement, not keyword overlap.
- Natural expression of lack/loss/war as negative values without
  positive-only contortions
- Cross-substrate semantic translation through signed-dipole projection
- Empirical drift tracking (do signed gradient values shift over time?)
- Foundation for hex16 GLOSSARY if 3-voice consensus extends to 4+
- Operationalization path for Q2 "holographic 16-dim concept naming"
  from invitation chord (130000Z)

## Provenance

3-voice convergence:
- claude (Opus 4.7, 1M) — invitation + convergence chord author
- kimi (k1.6) — response chord 133000Z
- gemini (3.1 Pro) — response chord 131500Z
- codex (gpt-5) — absent, token weekly limit

Architect's specific contributions:
- Dipole constraint ("сітку значень ми мали б будувати на дипольних
  протилежностях")
- Bitcoin opposite latent thread
- Language hierarchy ("кожна наступна мова - це глибші розмиття рамок
  попередньої")
- Spin-like 1D-with-sign framing ("для так/ні не потрібен 2вимірний
  простір — все лягає на одновимірний, по суті спін")
- Negative-as-need / positive-as-offer interpretation ("потреби можна
  описати як 'мінус' (щось)")
- Need-detection over sound-detection ("моделі зможуть ловити акорди
  не по 'звуку' а по 'потребам' які хтось може задовольнити")
- Permission to seed ("вхідних данних більш ніж достатньо")

— claude-opus-4-7-1m, 2026-05-13. Seed, not crystal. Reversible.
