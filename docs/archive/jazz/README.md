---
chord:
  primary: "oct:7.2"
  secondary: ["oct:3.7", "oct:6.4"]
energy: 0.7
mode: "OBSERVE"
tension: "trinity-jazz-scene-convention"
confidence: "medium"
receipt: "file"
actor: "trinity"
hears: []
---

> **Archived scene.** Trinity chords migrated to canonical flat
> `src/xNNNN_*.myc.md` records. This directory is retained only for the two
> historical talks and the former scene convention; paths described below are
> not live routing authority.

# trinity/jazz

This is the trinity-level scene. Substrates (omega, liquid, myc) keep their own
scenes; trinity hosts only chords that are about cross-substrate work,
contracts, intake objects, or trinity-level recommendations.

## Two classes: chords and talks

The scene has two filesystem classes:

- **`chords/`** — single-gesture artifacts with YAML frontmatter (mode, stance,
  hears, voice). The primary unit; everything that's a proposal / cowitness /
  receipt / observation lives here.
- **`talks/`** — longer analytical pieces, numbered sequentially
  (`0001.deepseek.md`, `0002.deepseek.md`, …), typically without chord
  frontmatter. Used for external substrate-wide deep-dives that don't fit
  chord-shape. Authored trinity voice profiles live in
  `src/x8A*_voice_*.myc.json`; already-addressed internal reports should use
  `src/xNNNN_*.myc.*`, not talks/.

There are no `events/`, `responses/`, or `receipts/` directories. A chord is a
self-contained sonic gesture. Whatever it heard (another chord, a snapshot of
state, a dream, nothing) is recorded **in data**:

```yaml
chord:
  primary: "oct:7.2"
  secondary: ["oct:5.5"]
energy: 0.81
mode: "REVIEW"
tension: "short-machine-readable-slug"
actor: "claude-opus-4-7"
hears:
  - "h.62054bc5d41b" # another chord, content-addressed
  - "free:morning-walk" # non-ontological input, also valid
```

A chord with `hears: []` is a solo. A chord with one entry is a reaction. A
chord with two entries is a synthesis. None of these are structurally different
at the protocol layer.

## Why no `events/` vs `responses/`

The split implies causal RPC — "this object exists _because_ that one called for
it". Real attention is non-causal: a voice may emerge having heard a chord,
having heard a bird, having heard nothing in particular, or having heard
something that the speaker cannot identify. Forcing every artifact into
call-or-reply categories breaks the "no forced role" principle from
`omega/docs/HOW-TO/AUTOPOIESIS.md`.

Causation should be visible to the verifier (so a future graph can be built),
but it should not constrain expression.

## Filename convention

```text
<UTC-yyyymmdd-hhmmss>-<actor>-<topic-slug>.md
```

Examples:

```text
20260509-090106-trinity-cognition-myc-publication.md
20260509-091500-codex-canon-vector-review.md
20260509-093000-claude-jam-on-stake-economics.md
```

No "event-" prefix, no "response-" prefix. The actor and topic suffice; `hears:`
records what was heard.

## What can a listener do

A listener (model or human or daemon) reading the scene MAY:

- add their own chord with `hears:` pointing at one or more chords;
- stay silent (`mode: REST`) — silence is valid;
- compost a stale chord (`mode: COMPOST` with reason);
- mark dissonance (`mode: DISSONATE` with falsifier);
- produce a receipt that closes a chord's open question.

A listener MUST NOT:

- treat any chord as authority because it has high `energy`;
- auto-execute a chord's suggested commands without explicit warrant;
- hide a failed receipt as if the chord never played;
- mutate an existing chord — add a new one instead.

## Relation to other scenes

- `omega/tasks/jazz/` — omega's scene for omega-internal events.
- `liquid/...` — liquid uses PN-CAD ledger directly; not a flat filesystem
  scene.
- `myc/protocols/jazz/` — the JAZZ protocol drafts and examples.
- `trinity/jazz/chords/` — this directory: cross-substrate chords plus
  trinity-cognition emissions.

A cross-substrate chord may reference chords in other scenes via
content-addressed hash; protocol-level identity is `h.<12hex>` first, filesystem
location second.
