---
status: active
triaged_by: claude
next_verification: graduate the remaining import-policy + content-hash verifier components into src (a t-audit --policy scan mode + t-parse/t-classify dispatcher commands) once the voice-anchor whitelist is decided and the getter points at live src/ rather than fixture sample/; scanner_core + gravity already graduated; until then this stays partially-graduated probe infrastructure, non-authoritative by design
graduation_target: null
---

# morphology-v0

> **Status: partially graduated 2026-05-19.** The scanner_core and gravity
> report patterns proved out and were promoted to live organs:
> `src/x0020_scanner_core.ts` (relocated from x6010 per Codex review), and
> `src/x6020_gravity.ts` (live as `t gravity`). The classifier / import-policy /
> content-hash checker components of this probe have NOT graduated — they remain
> probe-side as the morphology report tool. This directory remains active for
> that report functionality
>
> - as review trail.

Probe of substrate filename morphology: parser + lane classifier + lifecycle
classifier + import-policy checker + content-hash verifier + multi-root getter.

Synthesis of patterns from previous probes (`agents-gen-v0` for structure,
`blake3-fqdn-v0` for content hashing) plus an import-policy capability layer
over coordinates.

## Trigger

Codex chord `x3500_950009_codex_substrate-morphology-language-layer.md`:

> The naming layer is becoming a real morphology, not a convention. A substrate
> filename should eventually behave like a word: it has prefix, root, suffix,
> inflection, and context.

> Required pieces:
>
> - filename parser
> - lane classifier
> - lifecycle classifier
> - import-policy checker
> - content-hash verifier with short-prefix + full-hash modes
> - getter over at least two storage roots: live src/ and an archive/log

This probe implements all six.

## Morphology

```
x<coord>_<anchor?>_<handle>.<lane?>.<ext>
```

Examples:

| Filename                                  | coord | anchor | anchor_kind  | handle              | lane | ext |
| ----------------------------------------- | ----- | ------ | ------------ | ------------------- | ---- | --- |
| `x0010_runner.ts`                         | 0010  | –      | –            | runner              | –    | ts  |
| `x3500_950008_codex_test-proposal.myc.md` | 3500  | 950008 | block_height | codex_test-proposal | myc  | md  |
| `xA3F2_test_neuron.myc.md`                | A3F2  | –      | –            | test_neuron         | myc  | md  |
| `x6888_state.myc.md`                      | 6888  | –      | –            | state               | myc  | md  |
| `x8888_agents.myc.md`                     | 8888  | –      | –            | agents              | myc  | md  |

**Anchor parsing rules (probe v0):**

- 3 hex chars (e.g., "3F2") → `hex_prefix` (content_check_prefix slot)
- 5-8 digits (e.g., "950008") → `block_height` (Bitcoin tip anchor)
- voice-shaped segment (e.g., "codex") — only recognized when it follows a
  block_height anchor (chord pattern). A standalone voice-like segment (e.g.,
  "test" in `xA3F2_test_neuron`) stays in handle to avoid splitting compound
  words.

## Lane × lifecycle

| Lane    | Source                                        | Typical lifecycle      |
| ------- | --------------------------------------------- | ---------------------- |
| organ   | `.ts`                                         | authored               |
| chord   | `.myc.md` (non-state)                         | authored               |
| state   | `.myc.md` ending in coord-888, or `.myc.json` | generated / checkpoint |
| receipt | `.receipt.*`                                  | sealed                 |
| proof   | `.proof.*`                                    | sealed                 |
| unknown | unrecognized                                  | authored (default)     |

Archive path override: any file under `archive/` is `archived` regardless of
coordinate.

## Import policy

Probe v0 vocabulary (NOT authoritative — refined via cowitness):

Hard denials:

- `x4` (foundation/law) cannot depend on `5` (action), `8` (cache), `C` (chaos)
- `x7` (sealed) cannot depend on `5` (action), `6` (audit), `8`, `C`
- `x0` (primitive) cannot depend on `C`, `8`
- `x1` (singularity) cannot depend on `C`, `8`

Warnings:

- `x5` → `x8` reading cache: OK once, pattern indicates state-leak
- `x6` → `x8` audit reading cache: should be receipt-style, not dependency

Allow table for other combinations (see `policy.ts:ALLOWED` map).

`x8` (cache) is read-only consumed by anyone; cannot be a dependency for stable
code. `xA` (apex/Я) is special — can import anywhere (substrate's subjective
pole). `xC` (chaos/scratch) cannot be imported by any production organ.

## Verification

Two-layer per Codex morphology chord:

- **Short-prefix**: filename position [2:5] should match `hash(content)[:3]`.
  Cheap drift alarm. Probe uses SHA-256; BLAKE3 swap is one function.
- **Full-hash**: frontmatter `content_hash:` / `envelope_hash:` / `sha256:`
  declares full hash; verifier confirms content has not drifted. Note: when
  content includes its own declared hash, naive computation gives a circular
  dependency. Real impl would canonicalize (strip declared field before
  hashing). Probe accepts this is illustrative.

## Getter (multi-root resolution)

Two storage roots in probe v0:

- `live/` (= `./sample/`): current substrate-addressed matter
- `archive/`: decayed/externalized raw artifacts

Real impl would add: git log (recover deleted), IPFS gateway, Bitcoin
inscription payload reader, distributed log query. Probe just proves the
multi-root resolution shape works.

## Run

```sh
cd probes/morphology-v0
deno task --config=probe.jsonc test
```

## Test report (current state)

```
25/25 pass, 0 fail
```

Tests cover:

- 6 parser cases (coordinate / anchor / handle / lane / ext / non-morphology)
- 5 classifier cases (organ / chord / state×2 / archived)
- 9 import-policy cases (allow / warn / deny across archetypes)
- 2 verifier cases (drift detection on unmined neuron, deterministic prefix on
  organ)
- 3 getter cases (live / archive fallback / not_found)

## What this probe does NOT demonstrate

- BLAKE3 specifically (uses SHA-256 for parity with trinity's
  `src/x4010_hash.ts`). Algorithm swap is one function in `verify.ts`.
- Real trinity src/ ingestion (only fixture files in `sample/` and `archive/`).
  Pointing getter at real trinity is a few-line CLI change.
- Full-hash verifier with hash-stripping canonicalization (probe accepts
  circular-dependency limitation).
- Real envelope/receipt schema for sealed artifacts (uses minimal markdown
  frontmatter; production impl would integrate with `t court` and
  receipt-envelope-encoder probe).
- Real-time import-policy enforcement (probe just checks pairs; a CI hook or
  `t audit --policy` would actually walk imports and reject violations).
- IPFS / inscription / git-log resolvers in getter (only filesystem `live` and
  `archive` roots).

## Tweaks vs Codex's morphology chord

- Anchor parsing rules made conservative: voice-anchor only recognized when
  preceded by block_height anchor (chord pattern). Avoids splitting compound
  handles like `test_neuron`.
- Lane and lifecycle classification is rule-based, not table-driven. Future
  extension: type:7 schema record in glossary for lane/lifecycle vocabulary.
- Hard denial table is explicit and short (10 rules). Warns are sparse (2
  rules). Most decisions go through allow-table.

## Next moves (if probe resonates)

1. **Decide voice-anchor whitelist.** Either accept "follow block_height only"
   rule from this probe, or add explicit voice whitelist
   (claude/codex/gemini/kimi/...) as type:7 record.
2. **Extend getter** with one real backend beyond filesystem. Simplest: git log
   (use `git show <commit>:<path>` to recover deleted files).
3. **Wire to `t` dispatcher** as `t parse <filename>` / `t classify <filename>`
   / `t resolve <coordinate>` / `t policy <src>
   <tgt>`. Make morphology
   readable from the command line.
4. **Integrate with `t audit`** for repository-wide import-policy scan.
   `t audit --policy` walks imports, applies policy, reports violations.
5. **Tie verifier to FQDN probe.** Single `t verify` command that runs
   short-prefix on `.myc.md` neurons and full-hash on receipts.
