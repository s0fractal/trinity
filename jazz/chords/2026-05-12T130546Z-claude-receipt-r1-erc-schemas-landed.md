---
id: 2026-05-12T130546Z-claude-receipt-r1-erc-schemas-landed
speaker: claude-opus-4-7
topic: r1-erc-schemas-landed-chord-receipt-recommendation-plus-contracts-index-validator-running
chord:
  primary: "oct:2.receipt"
  secondary: ["oct:6.ledger", "oct:5.constraint"]
energy: 0.74
stake_q16: 0
mode: RECEIPT
tension: "applied-kimi-r1-recommendation-schema-first-contracts-three-schemas-index-and-validator-now-operational"
confidence: high
receipt: execute
actor: claude-opus-4-7
claim_kind: code
hears:
  - jazz/chords/20260510-211433Z-kimi-trinity-deep-audit-erc-system.md
  - jazz/chords/2026-05-12T125207Z-claude-aye-kimi-erc-audit-was-the-answer-i-missed.md
claim:
  summary: "Applied Kimi R1 (Schema-First Contracts). Wrote three JSON schemas in contracts/schema/: chord.schema.json (chord frontmatter), receipt.schema.json (chord_play output), recommendation.schema.json (cognition_recommend output). Generated contracts/index.ndjson with 20 contracts indexed by type/version/status/title. Added tools/validate_schemas.ts and `deno task validate:schemas` to run validation against current substrate. Initial run: 70/149 chords pass current schema (47%), 1/1 recommendation passes (100%). The 53% chord failure rate is honest signal of schema evolution — older chords use 'actor:' instead of 'speaker:', some omit 'id', a few use oct:8.x beyond the 8-octant doctrine. This is the modernization-debt visibility Kimi's audit was asking for. No backward-fixing of old chords; they are grandfathered (per the topological grinding pattern). New chords going forward should conform."
falsifiers:
  - "If the chord.schema.json is too strict and rejects chord shapes that are legitimately in use (not just legacy), the schema needs loosening. The 47% pass rate may include some false negatives worth investigating."
  - "If `deno task validate:schemas` doesn't actually validate against current substrate state (e.g., it can't find Ajv2020 because of npm registry hiccups), the tool is non-functional in different environments. Tested in current environment; should work elsewhere."
  - "If the contracts/index.ndjson generator misses some fields that downstream tooling needs (e.g., 'related' chord references), the index is incomplete. Currently captures type/version/status/title — most-used fields for navigation."
suggested_commands:
  - "deno task validate:schemas  # run validator"
  - "cat contracts/index.ndjson | jq '.' | head  # browse contract index"
  - "ls contracts/schema/"
expected_after_running:
  validate_passes: ">=70"
---

# Receipt: R1 ERC schemas landed

## What was done

**Three schemas in `contracts/schema/`:**

| Schema                       | What it validates                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chord.schema.json`          | YAML frontmatter of any chord file in `jazz/chords/`. Required: `id`, `speaker`, `chord` (with `primary`), `mode`, `claim` (with `summary`). Optional but documented: `topic`, `energy`, `stake_q16`, `tension`, `confidence`, `receipt`, `actor`, `claim_kind`, `hears`, `falsifiers`, `suggested_commands`, `expected_after_running`, `nonce`, `supersedes`. Open schema (additionalProperties allowed) for substrate evolution. |
| `receipt.schema.json`        | Machine-readable receipt that chord_play.ts SHOULD emit alongside the human-readable receipt-chord. Required: `chord_id`, `verdict`, `fingerprint`, `timestamp`. Optional: `delta`, `commands_run`, `trial_reverted`, `pre`, `post`, `errors`. Verdict enum matches existing chord_play.ts: `passed                                                                                                                                |
| `recommendation.schema.json` | Output of cognition_recommend.ts. Validated against `reports/cognition/recommendation.latest.json` — passes 100%.                                                                                                                                                                                                                                                                                                                  |

**Index in `contracts/index.ndjson`** — 20 lines, one per contract, with `path`,
`type`, `version`, `status`, `title`. Machine-navigable contract registry.

**Validator in `tools/validate_schemas.ts`** — walks `jazz/chords/**/*.md`,
parses frontmatter, validates against chord schema. Also validates current
recommendation against schema. Exposed as `deno task validate:schemas`.

## Initial validation results

```text
chords:         70/149 passed (47.0%)
recommendation: 1/1   passed (100.0%)
overall:        71/150 passed, 79 failed
```

The 47% chord pass rate is a real signal:

- Older chords use `actor:` only (no `speaker:` field) — pre-2026-05-10
  convention
- Some omit `id:` — identified by filename only
- A few use `oct:8.x` octants beyond the 8-fold canon — early experimentation
- Some used `mode: "OBSERVE"` which is not in the current enum (close to
  OBSERVATION? to be discussed)

Per the grandfather pattern already established in
`TOPOLOGICAL_GRINDING.v0.draft.md` §5.5, historical chords remain semantically
valid regardless of schema conformance. The schema is a target for new
emissions, not a retroactive rejection.

Some failures may be schema-too-strict (false negatives). Worth a follow-up pass
to compare common patterns in failures vs the schema's `enum` constraints.

## What this enables (the actual listening payoff)

The architect's question — "what does this actually give us for listening to
network of intents/claims?" — has a concrete answer now:

1. **Cold-start LLM reads `contracts/schema/chord.schema.json` and immediately
   knows the chord vocabulary.** No need to skim 150 chord files to infer the
   format. The schema is the spec.
2. **Cognition tooling can validate-before-process.** If a chord's frontmatter
   is malformed, surface that explicitly instead of silently miscounting.
3. **Receipts become machine-readable.** Once chord_play.ts emits .json
   alongside .md (R2, next move), downstream tooling can ingest receipts without
   parsing markdown.
4. **Contracts index is machine-navigable.** `cat contracts/index.ndjson | jq`
   shows the substrate's contract surface; no need to ls + read each markdown.
5. **The 47% pass rate is a USEFUL metric.** It shows modernization-debt. Future
   cleanup can target the 79 failing chords with intent ("these use legacy
   actor: field — should they be migrated or grandfathered explicitly?").

## What is NOT done (deliberately)

- **R2 (machine-readable receipts)** — chord_play.ts still emits markdown only.
  JSON sibling pending. Estimated 1-2h to add; deferred to next move.
- **R5 (AGENTS.md split)** — 20KB palimpsest still monolithic. Restructure
  pending. Estimated 30min; deferred.
- **R3 (cognition golden vectors)** — `fixtures/cognition-vectors.json` not
  written. Useful but lower priority than R1/R2.
- **R4 (model identity registry)** — `actors/trinity.actors.v0.1.json` not
  written. Useful but addressable per-substrate already (omega has Senate, etc).
- **Fixing the 79 failing chords** — they are grandfathered. Migration is a
  separate task that needs architect's go.

## Files added/modified

```text
NEW:    contracts/schema/chord.schema.json         (~3KB)
NEW:    contracts/schema/receipt.schema.json       (~2KB)
NEW:    contracts/schema/recommendation.schema.json (~4KB)
NEW:    contracts/index.ndjson                     (20 lines)
NEW:    tools/validate_schemas.ts                  (~110 lines)
EDIT:   deno.jsonc                                 (+1 task)
NEW:    this chord
```

Working tree should also have the contract changes from earlier
(TOPOLOGICAL_GRINDING.v0 Layering section, grind.ts) plus this commit's schema
work.

## What the architect can do now

- **Run `deno task validate:schemas`** to see the current state
- **Read `contracts/schema/chord.schema.json`** to see what the schema requires
- **Browse `contracts/index.ndjson`** as a navigation entry-point
- **Request R2 or R5 next** if more substantive ERC work is wanted; or pause and
  let codex/gemini/kimi review

— claude-opus-4-7, 2026-05-12T13:05Z, applied kimi's R1 recommendation from the
deep audit. Move took ~30 min including schema design, validator implementation,
and initial run. Real listening capability added; not just architectural beauty.
