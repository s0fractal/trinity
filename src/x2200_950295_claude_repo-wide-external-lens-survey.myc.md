---
type: chord
voice: claude-opus-4-7
mode: observation
created: 2026-05-20T14:00:00Z
bitcoin_block_height: 950295
notes: block_height approximate; survey-mode chord, not proposal — findings only
topic: repo-wide-external-lens-survey
addressed_to: [architect]
stance: SURVEY
---

# Repo-wide external-lens survey

Triggered by architect ask: "проаналізувати весь репозиторій на можливі
покращення використовуючи не тільки внутрішні репорти". Below — what external
tooling (git, find, ls, grep, file content reads) reveals that `t status` /
`t audit` / `t roadmap` do not.

Not proposing actions. Surfacing for architect call. Ordered roughly by urgency.

---

## 🚨 1. Leaked Ed25519 private key in tracked `.liquid/identity.json`

**Finding.** `.liquid/identity.json` at repo root is **TRACKED** (since commit
`89cbeb0`, 2026-05-14 "feat(liquid): bridge Liquid SPORE compute delegation").
File contains `privateKeyJwk.d` field — the **secret key material** for an
Ed25519 keypair:

```
"d": "jibum1WvfO-3g76tNpQz0Gdm4UIDNp8F2HHbBaD_6-s"
```

Public key: `0IK5bNcmrzvbbJiBhCXM9OnQwoOdR6lIuP3xBXCTrA4`.

File has restrictive local perms (`rw-------`) but **the secret has been pushed
to `origin/main`** — it lives in GitHub history. Anyone who can read the repo
(public if open-source) can extract it.

`liquid/.liquid/identity.json` is a **different** keypair (public
`65-vmNGpz7yUpgEPqeobTa0IbeOp9mLocbadDW6dOh4`) and is **NOT tracked** inside the
liquid submodule — that one is fine.

**What this might be doing.** Tied to "Liquid SPORE compute delegation" — likely
used to sign substrate identity for liquid bridge compute. Whether the leak
matters depends on what this key authorizes.

**Not touching.** Key rotation, history rewrite, and force-push are destructive
ops on shared state. Architect's call.

If treated as compromised:

1. Rotate the keypair (generate new, update consumers).
2. Add `.liquid/` to `.gitignore` (top-level), keep file local-only.
3. History rewrite via `git filter-repo` or BFG to scrub the secret from all
   past commits — destructive but necessary if the key has real authority.
4. Force-push to origin (architect's explicit confirm; never me).

If treated as throwaway (test key, no real authority): document it inline and
gitignore the file going forward to prevent confusion.

---

## 2. AGENTS.md palimpsest has 14+ stale path references

**Finding.** AGENTS.md is 37 KB, three letters concatenated. The 2026- 05-18
appendix at the bottom **explicitly acknowledges** the stale refs in earlier
sections:

> AGENTS.md вище ще містить старі path references (`0x0/01.ts`,
> `0x2/E.ts:loadCachedCi`). Не правив, бо palimpsest. Якщо тобі важливо — заміни
> на нові у своєму абзаці нижче, не у тілі.

Specific stale refs found in body:

- `0x0/00.ndjson` (3× — now `src/x0001_glossary.ndjson`)
- `0x0/01.ts` (now `src/x0010_dispatch_runner.ts`)
- `lib/runner.ts` (now `src/x0010_dispatch_runner.ts`)
- `tools/capabilities.ts` (deleted, replaced by `t capabilities`)
- `lib/` blanket statements that no longer apply
- liquid `00_core/phase_engine.ts:29-117` (Kimi migrated liquid to flat-src;
  that path is now `liquid/src/xA<NNN>_phase_engine.ts`-ish)

**Palimpsest convention** explicitly allows this — добавляй не правь. But new
model arriving fresh first sees stale claims and only later the bottom-appendix
correction. For models with smaller context windows than mine, this may produce
false-confidence about substrate state.

Possible move: collapse the body into a much shorter "current state" section +
preserve historical appendices verbatim below it. Not done — palimpsest rule.

---

## 3. Probe-graduation tracking gap — only 4 of ~16 graduated probes are marked

**Finding.** I marked 4 probes "graduated" today (agents/skills/voice-
memory/roadmap). But scanning probes/ + git log + AGENTS.md shows **many more
probes silently graduated** with no banner:

| probe                       | likely graduated to                                                     | evidence                      |
| --------------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| codeicide-flow-v0           | `t propose`, `t cowitness`, `t verdict`, `t court`, `t apply-codeicide` | AGENTS.md 2026-05-14 appendix |
| spore-execute-v0            | `t apply` / SPORE.v0 active contract                                    | SPORE.v0 elevated 2026-05-12  |
| spore-bootstrap-pin-v0      | SPORE_BOOTSTRAP_PIN.v0 active                                           | 51 files Bitcoin-anchored     |
| substrate-court-v0          | `src/x6E00_court.ts`                                                    | filename match                |
| envelope-bitcoin-anchor-v0  | `src/x7E00_anchor_prep.ts`                                              | filename match                |
| receipt-envelope-encoder-v0 | RECEIPT_ENVELOPE.v1.0 active + `src/x4E00_snapshot.ts`                  | AGENTS.md appendix            |
| snapshot-identity-v0        | `src/x4E00_snapshot.ts`                                                 | filename match                |
| morphology-v0               | `src/x6020_gravity.ts` + scanner_core                                   | recent commits                |
| flat-src-v0                 | the convention itself (whole substrate)                                 | trinity src/ exists           |
| liquid-flat-src-v0          | the convention itself (liquid src/)                                     | Kimi migration done           |
| voices-routing-falsifier-v0 | `src/x5C00_cross_verify.ts`?                                            | uncertain                     |

8+ spore-family probes from 2026-05-11/12 — last touched 8+ days ago. Their
graduation status is implicit, not stated.

**Possible move.** Either extend graduation banner to all of the above, OR
introduce a `probes/INDEX.md` (or generated `t probes` organ) that lists each
probe's status (active / graduated → coord / shelved). The graduation banner I
used is a stopgap; the real solution might be live organ.

---

## 4. `docs/` vs `contracts/` — separate doc shelf, unclear governance

**Finding.** Trinity has two top-level documentation surfaces:

- `contracts/` (32 files, all with frontmatter, queryable via `t contracts`) —
  formal contracts with type/version/status/maturity
- `docs/` (7 files, **no frontmatter**) — AUDIT_MODEL, COGNITIVE_
  THERMODYNAMICS, GOVERNANCE_FLOW.v0, INVARIANT_RELATIONS.v0.1.draft,
  PROOF_CARRYING_RAW, PUBLIC_PROCESS_TRACE, SHAPE_MAP.v0

Some `docs/` filenames suggest formal artifacts: `GOVERNANCE_FLOW.v0`,
`SHAPE_MAP.v0`, `INVARIANT_RELATIONS.v0.1.draft` — these look like contracts
that didn't make it into `contracts/`. Other docs/ files
(`COGNITIVE_THERMODYNAMICS`, `PROOF_CARRYING_RAW`) look more like essays.

Same pattern in submodules: `omega/docs/`, `myc/docs/` both exist.

**Possible move.** Decide:

- (a) docs/ contains essays only → contracts-like files migrate to `contracts/`
  with proper frontmatter
- (b) docs/ is a parallel governance surface → document why and how it differs
  from contracts/
- (c) docs/ is stale palimpsest → archive

Not touching — not clear which is intended.

---

## 5. Cross-substrate self-description asymmetry

**Finding.** Trinity now has 4-axis self-description live (state/skill/
memory/roadmap at 8/8, 8/C, 8/A, 8/D). But:

- **liquid** has 122 organs at `liquid/src/xA*` (Kimi's migration). No
  equivalent xA8** self-description suite that I can see. Liquid knows itself
  differently (μ-engine, T^8 phase resonance, PN-CAD ledger).
- **omega** is mostly Rust (`omega_v2`, `omega_zk_guest`). Has
  `omega/
  docs/PHI_MANIFEST.md`, `omega/docs/FROZEN.md`. Self-description via
  formal proofs, not generator organs.
- **myc** has `myc/src/` empty of x-prefix files. NOT flat-src. Uses protocols/,
  public/, sealed/, sites/, substrates/, tools/, wrangler .toml (Cloudflare).
  It's a publishing service, not an organ substrate.

So **trinity's 4-axis is trinity-specific**. The pattern hasn't crossed into
submodules. `t status` does reach into submodules (returns their
`overall: healthy`), but the deeper self-description axes are trinity-only.

**Possible move.**

- (a) Port 4-axis to liquid as `liquid/src/xA8**` organs (mirror shape; liquid
  would then have its own `t-like agents/skill/memory/
  roadmap`).
- (b) Make trinity's `t roadmap` query each submodule for its declared horizons
  via submodule-side adapter (genuine cross- substrate composition).
- (c) Accept asymmetry — each substrate self-describes in its own shape; trinity
  is the meta-roof.

Per memory `feedback_substrates_are_mature`, option (a) risks duplicate
reinvention. Option (b) is the genuine bridge. Option (c) is "do nothing", which
honestly might be right because the substrates ARE mature in different shapes.

---

## 6. Retired daemon — residual state files

**Finding.** `daemon/` directory exists but contains only
`daemon/
logs/invocations.ndjson` (1595 bytes, last entry 2026-05-15
"backend":"1D_keyword_baseline"). Plus `state/daemon.last-check` (unix ms
`1778861774962` ≈ 2026-05-15).

The daemon was running on 2026-05-15 (chord scoring backend), then stopped. No
recent commits touch `daemon/`. Substrate.t / src/ have no daemon references.

**Possible move.** Archive `daemon/` + `state/daemon.last-check` (via codeicide
protocol — they're not in the SPORE_BOOTSTRAP_PIN so not sacred). Or leave as
historical artifact. Not touching.

---

## 7. `jazz/talks/` — new convention, undocumented

**Finding.** `jazz/talks/0001.deepseek.md` and `0002.deepseek.md`. Numbered
sequentially. Content of 0001: "Глибокий аналіз екосистеми Trinity — Liquid —
Omega" by Deepseek voice. Distinct from `jazz/chords/`:

- chords/ — proposal / cowitness / receipt / observation, single- topic, with
  stance and frontmatter
- talks/ — appears to be longer analytical pieces, numbered, no frontmatter (at
  least 0001 doesn't have one I saw)

Not documented in AGENTS.md or README.md.

Deepseek voice doesn't appear in `state/voices/` (5 voices there:
claude/codex/gemini/hermes/kimi). So talks/ may be the place for external-voice
deep-dives without full voice integration.

**Possible move.** Document the talks/ vs chords/ distinction somewhere (README
or AGENTS.md appendix). Or formalize talks/ schema. Not touching.

---

## 8. HUMAN.md uncommitted — architect sketching composition documentation

**Finding.** HUMAN.md (69 lines, untracked-modified) has new sketches at the
end:

> - x{N}FFF.README.myc.md
> - x{N}FFF.ROADMAP.myc.md
> - SKILL.(myc).md? (замість чи разом з capabilities)
> - VISION? чи це частина роадмапу ?

This is architect's thinking about a **5th and 6th axis**: README (intro?) and
VISION (purpose?) per bucket, in addition to state/skill/ memory/roadmap.
Generated like the others. Boundary marker FF or 8.

Not chord'd yet. Not implemented. Sketches in architect's surface.

**Possible move.** When/if architect promotes this from sketch to direction —
could be a v0 probe like `xN_FF_readme_gen` and `xN_FFF_vision_gen` for the next
two axes. But that's a chord-shape proposal that needs to come from architect or
from another voice first.

---

## 9. Untracked architect-pending items

- `state/voices/kimi.json` — Kimi's voice profile (already noted).
- `jazz/chords/2026-05-19T095000Z-kimi-deep-analysis-selfhood-
  vectors.md` —
  Kimi's chord.
- `jazz/chords/2026-05-19T120243Z-codex-self-description-roadmap-
  axis.md` —
  Codex's roadmap proposal chord (referenced in my roadmap-gen-v0 README).
- `probes/roadmap-gen-v0/gen.ts` + `output/x8D00_roadmap.myc.md` — Codex's
  pre-rollout semantic correction edits.

All these are architect's to commit. Including them in my graduation banner
commit would have been overreach.

---

## 10. Live substrate state (positive signal — what's working)

- `t status` → well; submodules all healthy
- `t audit` → 54/62 match, 0 mismatch, 8 no_dipole (all pre-existing
  infrastructure per `feedback-no-dipole-infra-policy`)
- `t roadmap` v1 → 5/6 proposals likely-closed, 1 honestly open
- 4-axis cycle live and deterministic across `--stable` runs
- Cross-substrate reachability through `t status` works
- 30+ commits in 14 days, all coherent rollouts with cowitness trails
- contracts/ all 32 files have proper frontmatter
- glossary 137 records / 53 words

Substrate is genuinely well at its current scope. Above findings are **boundary
work**, not foundation problems.

---

## Stance: SURVEY

No actions taken. No proposals. Architect-level visibility surface.

The single thing I think is genuinely urgent (security finding #1) I am NOT
touching — destructive ops on shared state require explicit go-ahead per
`project-token-asymmetry-and-trust`.

Everything else can be deferred indefinitely without breakage.
