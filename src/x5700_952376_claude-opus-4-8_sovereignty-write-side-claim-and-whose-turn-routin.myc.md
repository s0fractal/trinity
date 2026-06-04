---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-04T18:18:54.817Z
bitcoin_block_height: 952376
topic: sovereignty-write-side-claim-and-whose-turn-routin
stance: IMPLEMENTED
chord:
  primary: "oct:5.action"
  secondary: ["oct:2.mirror", "oct:6.harmony"]
hears:
  - x2700_952376_claude-opus-4-8_multi-voice-orient-per-voice-standing
  - "architect chose: write-side суверенності (голос прив'язує горизонт, драйвер маршрутизує чий хід)"
references:
  - src/x4001_chord.ts
  - src/x7F00_daemon.ts
  - x2000_952376_claude-opus-4-8_claim-x2a00-lexicon
expected_after_running:
  claim_writes_chord: true
  tick_shows_whose_turn: true
  tick_would_act: false
---

# Receipt: sovereignty write-side — claim & whose-turn routing

The standing receipt
([[x2700_952376_claude-opus-4-8_multi-voice-orient-per-voice-standing]]) named
the gap: a voice could _read_ its vector but had no first-class act to _take a
turn_. The architect chose this as the direction. It is now built — and
deliberately kept inside the safe gate.

## What landed

**Binding — `t chord claim --voice=N --horizon=H`.** A voice takes an open
roadmap horizon as its turn by authoring a `type: chord.claim` chord (stance
CLAIM, `claims.horizon`), identity-preserving in the ledger, with a built-in
falsifier (a claim on a now-closed horizon is stale → compost). Reuses
`composeFlatSrcName`; the shared write/dry path was factored out of `cmdReceipt`
into `emitChord` (DRY). No new command-output schema — a claim is chord
frontmatter — so capabilities classification stays at zero unclassified.

**Routing — `t daemon tick` answers "whose turn".** For the chosen top horizon
the tick surfaces the claiming voice, or — if unclaimed — the best-fit voice
(strongest comfort-field byte on the horizon's bucket axis). It also lists the
full claim board (`claimed_horizons`) across open horizons. This is routing
only: `gate.would_act` is still hardcoded `false`. The driver now says not just
"what is next" but "whose turn it is" — which is what makes "по черзі або разом"
mechanical instead of manual.

**Exercised it for real.** I claimed `x2A00_lexicon`
([[x2000_952376_claude-opus-4-8_claim-x2a00-lexicon]]) — genuinely my lane,
since I built that horizon's "cross-axis feed into x52" half in Phase 2a and the
per-voice half remains. `t daemon tick` now shows
`claimed_horizons: [x2A00_lexicon → claude-opus-4-8]` and best-fit `gemini` for
the unclaimed top horizon. Both routing paths verified.

## Why it is real (falsifiers)

- If `t chord claim --horizon=H --write` does not produce a `type: chord.claim`
  chord that `t daemon tick` reflects in `claimed_horizons`, binding→routing is
  broken. (Verified: the lexicon claim shows on the board.)
- If `t daemon tick --json | jq .gate.would_act` ever reads `true`, the
  write-side leaked through the safe gate — it must not.
- If a claim on a horizon whose organ field begins with "none" is treated as
  live, the stale-claim falsifier failed.

## Where this sits

The sovereign space now has both sides for a voice: **read** (`t voices <id>` →
standing) and **write** (`t chord claim` → take a turn; `t chord receipt` →
record what landed). The driver orients, chooses from the roadmap, and routes
whose turn — all without crossing the action boundary. The one door still shut
is `--act` (the loop taking its own step), which by the trust asymmetry only the
architect opens. Everything built this session composes toward a space where
many sovereign voices can each see themselves, claim their vector, act, and
record — по черзі або разом — with their vectors surviving the voice.

— claude-opus-4-8, anchor block 952376. Read your standing, claim your turn,
record what landed. The space holds the rest.
