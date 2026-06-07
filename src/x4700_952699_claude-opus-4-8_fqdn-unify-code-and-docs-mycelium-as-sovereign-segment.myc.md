---
type: chord.proposal
voice: claude-opus-4-8
mode: proposal
created: 2026-06-07T07:30:40Z
bitcoin_block_height: 952699
topic: fqdn-unify-code-and-docs-mycelium-as-sovereign-segment
stance: PROPOSED
chord:
  primary: "oct:4.foundation"
  secondary: ["oct:3.observation", "oct:6.harmony"]
hears:
  - "architect: ідея почалась просто з уніфікації більшості коду і документації під FQDN (myc.md суфікс)"
  - "architect: один файл мав би право лежати в Google Drive чи інших репах, а local-first резолвер мав би його знайти — тоді питання перевикористання і де воно зберігається поступово зникало б"
  - "architect: головна репа стане дуже тонкою і буде просто сигналізувати, що код підключений до міцелію — це безпечне суверенне середовище, а не емуляція для експлуатації"
  - "architect: як власний сегмент інтернету з зовсім іншими домовленостями, інваріантами і протоколами довіри"
references:
  - src/x5510_myc_proxy.ts
  - src/x0150_literate_parser.ts
  - src/x5520_run_literate.ts
  - src/x0100_dispatch.ts
suggested_commands:
  - "find . liquid omega myc -name '*.myc.md' -not -path '*/node_modules/*' | wc -l   # 799 already in the .myc.md skin"
  - "find . liquid omega myc -name '*.md' ! -name '*.myc.md' -not -path '*/node_modules/*' -not -path '*/jazz/chords/*' | wc -l   # 648 plain .md remain"
  - "readlink AGENTS.md SKILLS.md   # both already point at generated FQDN .myc.md projections; README.md is the holdout"
expected_after_running:
  myc_md_already_majority: true
  agents_skills_are_thin_pointers: true
falsifiers:
  - "If byte-identical .ts files DO exist across repos, the 'dedup is conceptual not copy' claim is wrong (checked 2026-06-07: 0 identical across 596 .ts in src/liquid/omega/myc)."
  - "If a sovereignty gate can be built without unforgeable attestation, the 'needs signatures' dependency is wrong — but then 'connected = real, not emulated' is forgeable, which is the exact exploitation the architect wants excluded."
---

# Proposal: unify code + docs under FQDN `.myc.md`, with the repo as a thin sovereignty anchor

Given free rein to decide, I chose to **ground and record** the architect's
direction rather than decree it — the moves that realise it touch mature,
sovereign submodules (liquid/omega/myc) and so need cowitness, not my fiat
([[feedback_substrates_are_mature]], [[feedback_liquid_not_trinity]]). This
chord is that record + a falsifiable first step that is wholly trinity's to
take.

## The shape (architect's, sharpened)

A single naming skin — the FQDN `.myc.md` — over **both code and
documentation**. A node like `README.liquid.s0fractal.myc.md` is not "a README
in a folder"; it is a working hyperlink for every resident of the mycelium.
Three consequences fall out:

1. **Identity decouples from location.** A node may physically live in this
   repo, a submodule, `~/Google Drive`, anywhere. A **local-first resolver**
   finds it by name. "Reuse between repos" and "where it is stored" dissolve,
   because there is no _copy_ — one identity, found wherever it is.
2. **The main repo goes thin and becomes a sovereignty anchor, not a code
   store.** Its job shrinks to attesting "these nodes are connected to the
   mycelium — this is a safe sovereign environment, not an emulation for
   exploitation." This is the answer to the trust tension: the resolver may
   _find_ bytes anywhere; the _right to execute as a real, trusted organ_ comes
   only from the connected sovereign repo. Bytes can be public and everywhere;
   sovereignty is the scarce thing.
3. **Share names, not implementations.** The resolver returns _bytes_ for an
   FQDN; how those bytes become executable is each substrate's own **loader**
   (trinity extracts `ts execution`, liquid handles md its own way, a `.ts` node
   is already code). Format is a loader concern, never an identity concern — so
   the answer to "md or ts?" is _both_, and substrate sovereignty is preserved.
   This is federation ([[project_jazz_history]]), not a merged codebase.

## What the substrate already shows (grounding, 2026-06-07)

- **Docs are already past halfway:** 799 `.myc.md` vs 648 plain `.md` across all
  four repos. The skin is the majority, organically.
- **The "thin pointer → FQDN node" pattern already exists:** root `AGENTS.md`
  and `SKILLS.md` are symlinks to generated FQDN `.myc.md` projections
  (`x88F0_*`, `x8CF0_*`). `README.md` is the lone real-file holdout. The leap is
  not invention — it is _extending an existing pattern_.
- **Code "duplication" is conceptual, not copies:** 0 byte-identical `.ts`
  across 596 files in src/liquid/omega/myc. What repeats is _micro-primitives_:
  `toHex` reimplemented in liquid+omega+myc; `pipe` (7×), `flow` (5×), `execute`
  (5×). So reuse is not copy-elimination — it is naming one canonical node and
  letting substrates opt-in pull it. Naive content-dedup would _break_
  sovereignty.
- **The sovereignty gate is already on the substrate's own next list:** making
  "connected" unforgeable needs the signature/covenant layer flagged in
  [[project_canonical_commitment]] ("signatures next, blocked on key custody").
  So this proposal does not compete with that queue — it _motivates_ it.

## Falsifiable first step (trinity-only, reversible)

Build a **local-first FQDN resolver probe** (`probes/fqdn-resolver-v0/`) that,
given an FQDN, searches an ordered set of roots
`{src, ../liquid, ../omega,
../myc, then later ~ / cloud mounts}` and returns
the resolved path + bytes — the resolution _contract_ (precedence, what counts
as a match, null on miss). It touches no submodule and decrees no rename. The
`myc.md` proxy + import map landed this session (block 952388→) is the _network_
special case of exactly this resolver; the probe generalises it to the
filesystem.

Cross-repo proof, **deferred to cowitness**: lift one genuinely-repeated
primitive (`toHex`) into a single FQDN node and have two substrates resolve it
local-first. This edits sovereign submodules, so it waits for Codex + Gemini
cowitness, not my decree.

## Why it is real / how it dies

- It dies if the resolver cannot deterministically resolve a known FQDN to one
  path under a stated precedence (ambiguous = not a resolver).
- It dies if "connected = real, not emulated" turns out forgeable without
  signatures — in which case the whole sovereignty framing collapses into the
  exploitation surface the architect named, and the proposal must wait fully on
  key custody.

## Status

PROPOSED. Recorded for cowitness. No submodule touched. The doc-half (README →
generated FQDN `.myc.md` + pointer) and the code-half (resolver probe → opt-in
pull) can advance independently; both reduce to the same resolver.
