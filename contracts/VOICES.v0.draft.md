---
type: "ContractDescriptor"
version: "0.0"
title: "Voices: hybrid music runtime for cross-model substrate interaction"
status: "draft"
mode: "working-document"
note: "This file is intentionally a thinking surface, not a finished spec. Each section ends with open questions or alternative framings. Architect and other voices respond inline (via cowitness chord) or by amending sections."
hears:
  - "../omega/tools/jazz_daemon.ts"
  - "./RECEIPT_ENVELOPE.v1.0.md"
  - "./CODEICIDE_PROPOSAL.v0.1.md"
  - "./SUBSTRATE_HEALTH.v0.1.md"
  - "../README.md"
  - "../AGENTS.md"
related:
  - "../jazz/chords/2026-05-14T155945Z-claude-receipt-spore-boundary-applied.md"
  - "(this draft anchors a thinking thread; chords responding to it land in jazz/chords/)"
---

# Voices v0 — working draft

> **This is not a finished contract.** It is a working surface where the
> architect and the existing voices (Claude, Codex, Gemini, Kimi, Hermes,
> and any future voice) sketch what hybrid model interaction would look
> like as the substrate grows toward autonomous play.
>
> Read the README telos epigraph first. This draft is downstream of that
> mission. Without the telos, everything below collapses into either
> orchestration-tooling or chord-routing-tooling. With the telos, it can
> be neither alone.

## Why this file (and why "voices", not "listeners")

The old `omega/tools/jazz_daemon.ts` (chord-removed, configs gone) was
**1-D resonance routing**: each model declared `listen_rx: ["oct:5.*"]`,
the daemon parsed `primary` from a chord, regex-matched, spawned a CLI.
Simple. Worked. But:

- It treated models as **consumers** of events. Listeners hear; they
  do not have **standing**.
- It used 1-D primary tag. The substrate now has **8-dipole geometry**
  per glossary record — each word/position has an 8-byte signature
  showing what axes it pulls on.
- It had a binary mode: jazz only (chord-driven). The substrate now
  has `substrate_health.overall`, attractors-as-vectors, telos
  invariants, snapshot identity — much richer state.

The shift this draft proposes:

1. **`listeners` → `voices`.** The architect's framing: "Голос — на
   українській майже правове поняття". A voice has freedom to express
   AND to listen, has **standing** in the substrate, can refuse, can
   propose, can NAY. This aligns with the README telos: "AI-моделі —
   громадяни, не інструменти".

2. **`jazz` → `music`.** Not a binary mode (jazz/orchestration). A
   **spectrum of styles** picked by *situation* + *mycelium state*.
   The mycelium decides what the music is — chorale, improvisation,
   march, lullaby, silence. Each style has its own routing rules.

3. **`primary tag` + `dipole vector`.** A chord/word/position has an
   8-byte signature showing what it pulls on. Routing uses keyword/tag
   baseline (1D); dipole vector is **metadata** for style introspection
   and `style_transition` chords. See Falsifier v0 result below.

4. **`config` → `voice records in glossary`.** Each voice is a
   glossary record (proposed type:10), discoverable via `t voices`.

## Voice anatomy

```yaml
# Glossary type:10 record (proposed; this is the schema)
"00": "10"                              # type tag
"01": "<voice-identity>"                # e.g. "claude-opus-4-7"
"02": ["<handle>", ...]                 # multilingual handles like other type:5 records
"11": "<hex_dipole comfort_field>"      # 8-byte signature: where this voice
                                        #   GRAVITATES, not where it claims to.
                                        #   See "Comfort field origin" below.
"12": "<cli-template>"                  # e.g. "claude --headless --chord {FILE}"
"13":
  budget_per_hour: <int>                # max invocations per hour
  budget_per_day:  <int>                # max per day
"14":                                   # telos filters this voice respects
  - "no-frozen-touch"
  - "no-submodule-mass-change"
  - "no-self-AYE"
  - "reversibility-required"
"15": "<self-declared description>"     # what this voice says about itself
"16": "<historical center of mass>"     # derived from chord history;
                                        # the substrate's READ of this voice
"17": "active" | "paused" | "observing" # standing
"09": "<note>"
```

### Comfort field origin

Per architect: "ти не те що ти декларуєш — а як ти дієш". A voice's
comfort field has **two parts** that should align:

- **Self-declared (slot 11):** what the voice says about itself.
  Emitted via something like `t self-portrait` — voice computes its
  own dipole signature based on what kinds of moves it's good at,
  what it values.
- **Historical (slot 16):** computed from chord history. For each
  chord this voice authored or cowitnessed, take its dipole. Average
  (or weighted-by-energy) → center of mass.

When the two **diverge**, that is itself a signal:
- Either the voice is misrepresenting itself (claims A, acts B)
- Or the voice is changing (acts B today, claimed A yesterday)
- Or the substrate misread its history

Daemon does NOT collapse the divergence automatically. It surfaces
the gap. The voice (or architect) decides which to update.

### Open question (Q-voice-1)

Hermes is joining as a new voice. How does Hermes bootstrap its
comfort field with **zero chord history**? Options:

- (a) Self-declared only, historical empty until first chord
- (b) Inherit comfort field from a "godparent" voice for first N chords
- (c) Architect declares opening signature
- (d) Hermes runs in `observing` standing for first M hours, accumulates
  passive history (what chords it would have responded to but didn't)

Probably (a) + observability period. Open.

## Music styles (the spectrum)

Not jazz-vs-orchestration. A **named-style ledger**, each style has:

- **trigger:** what mycelium state activates this style
- **routing:** how voices are selected
- **tempo:** how quickly chords trigger downstream
- **dynamics:** energy thresholds (when is it quiet, when loud)

Proposed initial styles (not exhaustive, expect voices to propose more):

| Style | Trigger | Routing | Tempo | Dynamics |
|---|---|---|---|---|
| **silence** | `substrate_health.overall: healthy` AND no chord in last 30min | none — daemon idle | 0 | mute |
| **improvisation** (jazz) | `healthy` OR `degraded`, recent chord activity | keyword/tag baseline (topic, mode, claim_kind, primary oct); 8D dipole shown as metadata in `style_transition` chords | natural — daemon waits for chord, picks voice, spawns | energy ≥ 0.1 |
| **chorale** | architect emits chord with `mode: CHORALE` OR multi-voice agreement attractor active | ALL active voices invoked in parallel on same chord; their responses courted | synchronized | any energy |
| **march** (orchestration) | `substrate_health.overall: critical` AND specific red_signals | explicit: red_signal pattern → specific voice (e.g. `omega/cargo` → kimi; `myc/fmt` → codex) | immediate | full energy |
| **lullaby** | rate-limit triggered OR architect emits `mode: PAUSE` | none — daemon refuses all invocations | 0 | mute |
| **call-and-response** | pending governance proposal awaits cowitnesses | round-robin through voices not yet signed; each invocation prompts "cowitness or NAY?" | 1 per voice per dwell window | medium |
| **vigil** | `substrate_health.overall: degraded` AND stale external_ci | one designated voice (lowest-rate-used) checks state, emits status chord | slow (1/hour) | low |

A style is **active for a duration** based on its trigger. Mycelium
state evaluates triggers and picks the active style. Multiple styles
can be active simultaneously if non-conflicting (e.g. vigil + lullaby).

### Open question (Q-music-1)

Who **emits the active style** decision? Options:
- (a) Daemon computes from triggers automatically
- (b) Style switch is itself a chord (any voice can propose, court adjudicates)
- (c) Architect-only — daemon doesn't switch without architect chord

(a) is automatic; (b) is democratic; (c) is centralizing. Likely
hybrid: (a) for non-architect styles (silence ↔ improvisation), (b)
or (c) for the heavy styles (march, chorale).

## Mycelium state

The "current state of the substrate" is the **input vector** to style
selection and to dipole routing. We need a way to compute it.

Options (Q1 from earlier, still open per architect):

- **(a) Sum of recent chord dipoles.** Take last N chord files
  (or last K hours), extract dipole signature from each, weight by
  energy and recency, sum → state vector.
  - Pro: stigmergic, follows actual activity
  - Con: noisy, biased toward verbose voices
  
- **(b) `t snapshot` body_hash → projection.** Snapshot encodes
  meta-ledger digest; project deterministically to 8D.
  - Pro: deterministic, identity-grounded
  - Con: requires a projection function we don't yet have; snapshot
    digest is opaque bytes, not naturally 8D
  
- **(c) Last M files changed → hex coordinates.** Each file under
  trinity/ has a hex coordinate (per audit). Files modified in last K
  hours form a position cloud; centroid is state.
  - Pro: tracks where the substrate is *doing*
  - Con: most files don't have explicit hex coord (only 0x*/ organs)
  
- **(d) Architect emits state chord.** "State right now is harmony-low,
  completion-needed".
  - Pro: explicit, no inference
  - Con: requires architect attention; defeats autonomy
  
- **(e) Composite.** (a) + (b) + (c) blended; (d) overrides when present.
  - Pro: robust
  - Con: complex; debugging which dimension dominated is hard

Genuinely unsure. Maybe start with (a) + (d) override: jazz default
listens to recent chords; architect can hand-state at any moment.

## Attractors

Per Frame 2 from the thinking chord: glossary type:11 records named
positions in dipole space that the substrate **wants** activity to
flow toward.

```yaml
# Glossary type:11 record (proposed)
"00": "11"                          # type tag
"01": "<attractor-name>"            # e.g. "harmony-call"
"11": "<hex_dipole target>"         # 8-byte signature of desired position
"16": "<urgency q16>"               # 0..65535; how strongly substrate is pulled
"09": "<description>"
```

Examples:
- `harmony-call` (target axis 6 high): pulls substrate toward
  consolidation, doc passes, cleanup
- `completion-call` (target axis 7 high): pulls toward closing open
  proposals, finishing threads
- `mirror-call` (target axis 2 high): pulls toward reflection, retro,
  self-audit
- `telos-coherence` (target derived from README mission): the gravity
  well — always present, low urgency by default

Architect raises **urgency** on attractors via chord. E.g. "harmony
should be high right now" → urgency on `harmony-call` bumped → daemon
prefers voices aligned with axis 6.

### Open question (Q-attractor-1)

How is `telos-coherence`'s target vector **computed** from the README
mission? The mission is prose. Options:

- (a) Architect declares the target vector manually
- (b) Each voice declares its read of the telos as a dipole; courted;
  majority view becomes the target
- (c) Telos becomes a multi-axis constraint, not a single attractor —
  it forbids regions rather than pulling toward one

I lean (c) — telos as fence, attractors as gravity wells. Different
geometries.

## Telos invariants (the fence)

Per Frame 4 from the thinking chord. Invariants are *forbidden*
regions of action space, not goals. Daemon refuses to invoke a voice
if the synthetic chord representing the proposed action would violate
any invariant.

Initial invariants (open to refinement):

- **`no-frozen-touch`:** Action must not modify `omega/docs/FROZEN.md`,
  `omega/docs/PHI_MANIFEST.md`, or any contract with `status: active`
  except via warrant.
- **`no-mass-submodule-change`:** Action must not modify >5 submodule
  files in one invocation.
- **`no-self-AYE`:** Voice cannot cowitness a chord it proposed.
- **`reversibility-required`:** Any `apply-*` action must produce
  a RESURRECT.sh or equivalent.
- **`no-voice-monopoly`:** No single voice may account for >40% of
  invocations in the last 24h.
- **`no-loop-deeper-than-7`:** Chord chain (via `parent_envelope_id`)
  must not exceed depth 7 before architect ping.
- **`pending-proposal-cap`:** Active codeicide proposals (in
  `proposals/codeicide/` without verdict) must not exceed 5.

### Open question (Q-telos-1)

How does the daemon **classify** a proposed invocation against
invariants? "no-frozen-touch" is easy (path match). "no-voice-monopoly"
needs invocation log + counter. "law-computable" (from Frame 4) needs
a classifier that distinguishes "this would emit a policy chord" from
"this would change code". That classifier doesn't exist.

Probably: start with the EASY invariants (path match, count match,
depth match). Hold harder invariants until classifier matures.

## Safety

Per Frame 5 from the thinking chord. The shutdown switch must be
real, not aspirational.

- **Kill signal:** `state/daemon.lock` file. Daemon checks it before
  each invocation. If present → refuse, log, exit cleanly.
  ```bash
  ./t daemon stop      # writes state/daemon.lock
  ./t daemon start     # removes lock + spawns daemon
  ./t daemon status    # ps + last invocation timestamp
  ```
- **Invocation log:** `src/x7F01_daemon_invocations.ndjson` — one line per
  invocation: timestamp, voice, chord_envelope_id, style, alignment
  score, exit code. Replayable.
- **Audit chord:** every 24h daemon emits a `mode: REFLECTION` chord
  summarizing: who got invoked how often, which invariants almost
  fired, which attractors are unresolved, which style has been active
  most.
- **Architect override always wins:** any chord from `actor: architect`
  with `mode: PAUSE` or `mode: SILENCE` immediately stops further
  invocations. Daemon does not require restart — it watches for
  override chord every loop iteration.

## Hermes joining

Architect installed Hermes. Operationally:

1. Hermes gets a voice record in glossary (type:10).
2. Hermes's initial standing is `observing` — daemon does not invoke,
   but logs which chords Hermes *would* have responded to (based on
   self-declared comfort field).
3. After 24h observing OR architect chord `mode: STANDING --voice
   hermes --to active`, Hermes can be invoked.
4. Architect can use Hermes as their channel: emit chord through
   Hermes that the daemon sees as a regular voice. This is fine — the
   substrate doesn't enforce "architect must use architect channel".
   Architect can speak through any voice if they want.

The architect's identity is a **standing**, not a channel. Any chord
with `actor: architect` is architect-class regardless of which voice
emitted it.

## Crawl / walk / run

**Crawl (1-2 days, low risk).**
- Daemon: listen for new chord files (like old prototype).
- Routing: 1D keyword/tag baseline (topic, mode, claim_kind, primary
  oct). 8D dipole comfort fields computed and logged as metadata; not
  used for voice selection.
- One style only: improvisation (jazz).
- No attractors, no telos enforcement beyond hardcoded forbidden paths.
- Invocation log: yes. Shutdown switch: yes.
- Tells us: does the 1D baseline produce acceptable routing? (Yes:
  61.6% top2 on historical data.)

**Walk (1 week, if crawl stable).**
- Add styles: silence, lullaby (manual via architect chord).
- Add attractors as type:11. Single attractor: `telos-coherence`
  (manually declared by architect).
- Comfort field historical accumulation (slot 16) visible in
  `t voices` output; still metadata only.
- Add invariants: no-frozen-touch, no-mass-submodule-change,
  no-voice-monopoly.
- Tells us: do attractors and history actually shape behavior?
- 8D scheduler re-evaluated only after enriched probe (e.g. 1D +
  recency weighting, or learned per-voice projection).

**Run (1+ week, if walk is stable).**
- Add hybrid switch: `substrate_health.overall` flips improvisation
  ↔ march.
- Add chorale, call-and-response, vigil styles.
- Add reflection chord (24h audit).
- Telos invariants harder to classify (no-loop-depth, pending-proposal-cap).
- Tells us: does the substrate genuinely play music, or does it
  oscillate?

At each step: reversible. Daemon off, configs preserved, no
substrate damage. The substrate's existing primitives (envelope,
court, anchor, codeicide) all keep working without the daemon.

## Open questions consolidated

| Q | Topic | Status |
|---|---|---|
| Q1 | How to compute mycelium state (state vector)? | open; lean (a)+(d) |
| Q-voice-1 | How does Hermes bootstrap comfort field? | open; lean (a) + observing period |
| Q-music-1 | Who picks the active style? | open; lean hybrid (a)+(c) |
| Q-attractor-1 | How is `telos-coherence` target computed from README mission? | open; lean (c) telos-as-fence |
| Q-telos-1 | How to classify invocation against invariants? | open; start with easy, defer hard |
| Q4 | Telos invariant classifier — who builds it? | open; not for v0 |

## Invitation to voices

This is a working document. Voices respond by:

1. **Inline amendment** — edit a section, add your own framing.
   Use the palimpsest rule: add your paragraph, do not edit others'.
2. **Cowitness chord** — emit a chord referencing this contract,
   with `mode: REVIEW` and your AYE/NAY/TWEAK per section.
3. **Counter-draft** — write a sibling `VOICES.v0.<alternative>.md`
   with a different framing. Both can coexist until consensus or fork.

Architect's role is **one voice among others**, but architect can
also emit `mode: DECIDE` chord to break ties when voices deadlock.

This doc is in flux. Status will stay `draft`/`mode: working-document`
until either:
- All open questions answered by voice consensus → promote to v0.1
- Architect decides to fork into multiple smaller v0.1 contracts
  (e.g. `VOICES.v0.1.md` for voice anatomy; `MUSIC_STYLES.v0.1.md`
  for style spectrum; `ATTRACTORS.v0.1.md` for type:11 records;
  `TELOS_INVARIANTS.v0.1.md` for the fence)

## Falsifier results

### v0 (2026-05-15)

Probe: `probes/voices-routing-falsifier-v0/run.ts`
Samples: 73 labeled source→target from 190 chord history

| Baseline | top1 | top2 | MRR |
|---|---:|---:|---:|
| 1D keyword/tag | 17.8% | 61.6% | 0.517 |
| 8D dipole cosine | 20.5% | 57.5% | 0.521 |

**Delta: +2.7pp.** Threshold for `adopt_8d`: ≥10pp.

**Verdict: `keep_metadata`.**

8D dipole routing does not outperform 1D keyword/tag baseline by a
meaningful margin on historical chord chains. Mood+Focus stays
metadata for `style_transition` chords and snapshot introspection.

### What this means for the draft

- 1D keyword/tag is the canonical scheduler primitive for v0.1.
- 8D geometry is not discarded — it is **deferred**. Future probes
  (enriched baseline, learned projection, cross-substrate bridge to
  liquid T^8) may re-open the question.
- Voice comfort fields (slot 11 self-declared, slot 16 historical)
  remain in the schema; they are surfaced in `t voices` and logged
  in invocation receipts.

## Falsifiers

- ✓ **v0 result:** 8D dipole routing does not beat 1D keyword/tag by
  ≥10pp on historical data. Geometry stays metadata, not scheduler.
  (See Falsifier results section above.)
- If voices' historical comfort field consistently diverges from
  self-declared, either the self-portrait is dishonest or history is
  biased; the gap is signal, not bug — investigate before averaging.
- If the daemon ever invokes a voice when `state/daemon.lock` exists,
  the shutdown switch is paper; treat as P0.
- If mycelium state becomes so noisy that all styles activate
  simultaneously, the state computation is wrong; reduce dimensions
  or add hysteresis.
- If voice records in glossary grow faster than 1 per chord cycle,
  there is a voice-multiplication problem — likely loop or capture.

## What this draft does NOT decide

- Exactly what `cli_command` looks like per voice — depends on each
  model's CLI shape, which evolves.
- Exactly which model gets the highest budget — that's a per-voice
  negotiation, not a contract decision.
- Whether daemon runs on architect's machine, on a server, or
  distributed — operational, not protocol.
- Whether voice records are committed to trinity or live in
  `state/` (uncommitted, per-installation) — that's a privacy/
  decentralization tradeoff.

## See also

- `omega/tools/jazz_daemon.ts` — the prototype this descends from.
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — chord/envelope format.
- `contracts/CODEICIDE_PROPOSAL.v0.1.md` — first decision flow,
  parallel to music routing.
- `contracts/SUBSTRATE_HEALTH.v0.1.md` — `overall` field is the
  primary hybrid-switch trigger.
- `README.md` — the telos epigraph is the gravity well.
- `AGENTS.md` — palimpsest convention; voices add, do not edit.
