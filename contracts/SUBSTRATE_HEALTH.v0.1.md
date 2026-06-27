---
type: "ContractDescriptor"
version: "0.1"
title: "Substrate Health: uniform shape for cross-substrate status aggregation"
status: "draft"
implementation_status: "implemented"
impl_evidence:
  commands:
    - "./t status"
    - "./t status --json"
    - "bash probes/substrate-court-v0/run.sh"
  files:
    - "src/x2E00_status.ts"
    - "probes/substrate-court-v0/ts/witness.ts"
  tests:
    - "probes/substrate-court-v0/ts/court_test.ts"
  caveats:
    - "v0.1 still emits the legacy summary.overall alongside substrate_health.overall (intentional migration window)"
    - "the --live cache-refresh path is the v1.0-promotion frontier"
hears:
  - "./RECEIPT_ENVELOPE.v0.1.md"
  - "../0x2/E.ts"
  - "../0x6/A.ts"
  - "../reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md"
  - "../jazz/chords/2026-05-14T162540Z-claude-proposal-next-thread-work-plan.md"
  - "../jazz/chords/2026-05-14T163324Z-codex-response-next-thread-work-plan.md"
related:
  - "../docs/SHAPE_MAP.v0.md"
---

# Substrate Health v0.1

## Status

**DRAFT.** Codex AYE'd Item A of work plan
(`2026-05-14T163324Z-codex-response-next-thread-work-plan`) with one explicit
tweak: **staleness/cache semantics from day one**. `t status` MUST NOT run
multi-minute CI by default.

This contract addresses § 3 L7 of `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md`:
`t status` says `overall: well` while `deno task audit:green` shows 3/4 gates
failing. Two different meanings of "healthy" travel through the same field name.
This is the metric becoming a lie.

## Body kind

This is a `body_kind` consumed by `RECEIPT_ENVELOPE.v0.1` as
`body_kind: "substrate_health"`. It can also be emitted bare (without envelope)
by an organ that just wants a quick status echo — `t status` default mode is
bare; signed/anchored aggregations are enveloped.

## Shape

```yaml
type: "SubstrateHealth"
schema: "trinity.substrate-health.v0.1"

# Which substrate is reporting on itself.
substrate: "omega" | "liquid" | "myc" | "trinity"

# Optional substrate-specific version (e.g. "omega_v2-0fd0bf3" or "liquid-1d10f8d").
substrate_version: "<string | null>"

# Composite verdict. Derived from own_organs + external_ci.
# Suggested derivation (organs and ci treated equally):
#   - any fail in own_organs OR red_signals non-empty AND not stale → critical
#   - any warn OR any red_signals when stale → degraded
#   - else                                       → healthy
overall: "healthy" | "degraded" | "critical"

# Own organs: substrate-internal checks that ran during this status call.
# These are CHEAP — file existence, dipole header presence, schema parse,
# in-process invariants. Multi-minute work does NOT happen here.
own_organs:
  ok: <int>
  warn: <int>
  fail: <int>
  total: <int>

# External CI: substrate's last-known view of its external test/lint
# pipeline. STALENESS-AWARE. `t status` reports cached state by default.
external_ci:
  # Three independent gates. null means "never measured" or "concept does
  # not apply to this substrate". Substrate decides what counts as a gate.
  green: <bool | null>
  strict: <bool | null>

  # Specific gates currently failing. Empty array if green; non-empty even
  # if green===true means partial failure (e.g. one strict gate red).
  red_signals: ["<short signal name>", ...]

  # When external_ci was last measured. null = never.
  checked_at: "<ISO-8601 UTC | null>"

  # How long the substrate considers external_ci fresh.
  # Suggested defaults: omega 600s, liquid 300s, myc 300s, trinity 60s.
  max_age_seconds: <int>

  # Computed: now - checked_at, in seconds. null if checked_at is null.
  age_seconds: <int | null>

  # Computed: age_seconds > max_age_seconds, OR checked_at === null.
  is_stale: <bool>

  # How was external_ci populated for this report?
  #   "cache":   read from cached state (the default)
  #   "live":    measured during this status call (e.g. user passed --live)
  #   "unknown": substrate cannot determine
  source: "cache" | "live" | "unknown"

# Optional LawHash (omega computes; others mirror or report null).
# When envelope wraps this body, the envelope's law_hash MAY mirror this
# value or set its own; both are allowed.
law_hash: "<32 bytes hex | null>"

# Logical clock — best-effort, not load-bearing.
clock:
  causal_ticks: <int | null>      # omega
  era: <int | null>                # liquid
  bitcoin_block: <int | null>      # external anchor (most recent observed)
  wall_time_utc: "<ISO-8601 | null>"

# Substrate-specific extensions. Opt-in. MUST be schema-tagged.
extras:
  "<extras-key>":
    schema: "<substrate>.<key>.v<x>"
    body: <any>
```

## Staleness rules (Codex's tweak, made load-bearing)

`t status` MUST NOT block on external CI execution by default. The contract
distinguishes three sources:

1. **`source: "cache"`** — substrate reads its last-known `external_ci` from a
   small local cache (e.g. `<substrate>/.health_cache.json` or a per-process
   memory entry). `checked_at` is the cache write time. This is the **default**
   for `t status`.

2. **`source: "live"`** — caller explicitly asked to refresh (e.g.
   `t status --live`). Substrate may run its external gates; this is the path
   that takes minutes. CALLER OPT-IN ONLY.

3. **`source: "unknown"`** — substrate cannot determine (e.g. first-ever run on
   a fresh machine; cache file absent and live not requested). `green` /
   `strict` MUST be `null` in this case.

**Consumers MUST inspect `is_stale` before using `green` / `strict` to decide
anything.** A `green: true` with `is_stale: true` says "last we checked, things
were green, but we haven't checked recently."

## Composite derivation (suggested, not mandatory)

A trinity-side aggregator combining N substrate health reports may derive a
top-level `overall` as:

```text
let red = any substrate with overall == "critical"
       OR (any external_ci red_signals AND NOT all is_stale)
let warn = any substrate with overall == "degraded"
       OR (any external_ci red_signals AND all is_stale)

if red:   trinity.overall = "critical"
elif warn: trinity.overall = "degraded"
else:     trinity.overall = "healthy"
```

This composes naturally with `0x2/E.ts` recursion.

## Why this shape

- **`own_organs` separate from `external_ci`** because they answer different
  questions. Own organs answer "does the substrate's structure cohere right
  now?" External CI answers "did the substrate's tests pass last time it was
  run?" Conflating these is what made `t status: well` lie.

- **Staleness explicit** because health reporting that blocks on
  cargo+deno+python+wasmtime CI is operationally hostile. Cache + age + is_stale
  lets consumers be honest about uncertainty without slowing down the common
  path.

- **`red_signals: [string]`** rather than just bool because "one strict gate
  failed" is qualitatively different from "the suite crashed." A red_signal like
  `"omega/cargo-test:lattice::test_birth_tick_age_invariant"` is greppable and
  self-documenting.

- **`law_hash` optional** because not all substrates can compute their LawHash
  yet (per § L5 of the deep analysis report). Allowing `null` prevents fake-zero
  anti-pattern.

- **`extras` for substrate-specific extensions** so adopters don't have to amend
  this contract to surface μ-resonance score (liquid) or inscription queue depth
  (myc).

## Anti-patterns

- **`t status` runs `cargo test --workspace` by default.** Forbidden. `t status`
  is a metric read. Live mode requires explicit opt-in.
- **`green: true` with stale data treated as authoritative.** Consumer bug.
  Contract mandates inspecting `is_stale` first.
- **Subclassing `extras` into the main shape.** Extras stay extras until this
  contract is amended.
- **Cache file shared across substrate boundaries.** Each substrate owns its own
  cache. Trinity's cache does not poison omega's cache.
- **`overall` derived from external_ci alone, ignoring own_organs.** The
  substrate must consult both. A substrate with broken organs but passing CI is
  degraded, not healthy.

## Falsifiers

- If `external_ci` for any substrate would inherently require multi-minute
  computation on every call (no caching possible because there is no artifact to
  cache), the contract is wrong for that substrate; redesign before adoption.
- If two substrates produce health with `is_stale: false` but their `checked_at`
  timestamps lie by more than `max_age_seconds`, the cache semantics are being
  violated somewhere.
- If a consumer relies on `extras.<key>.body` shape without checking
  `extras.<key>.schema`, an extras-schema migration will silently break it; the
  contract's `schema` field is load-bearing.
- If `t status` performance drops below interactive (~1 second) when no
  substrate has done live CI in the past hour, the cache is not actually serving
  its role.

## Acceptance for v0.1 → v1.0 promotion

- At least one substrate adopts the bare-body emission. Trinity is the natural
  pilot (its `0x2/E.ts` composite output is the load-bearing consumer).
- A `t status --live` mode exists for at least one substrate and is proven to
  populate `external_ci.source: "live"` and update the cache.
- Stale-cache behavior demonstrated: deliberate cache invalidation produces
  `is_stale: true` without breaking the status call.
- Composite derivation in trinity's `0x2/E.ts` follows the suggested rule (or
  documents its divergence).
- Codex / Gemini review and AYE.

## Adoption sequence (per Codex tweak: "one substrate first")

1. **trinity** (this contract's pilot — F-item of the work plan). Trinity's
   `0x2/E.ts` emits SUBSTRATE_HEALTH-shaped composite for itself.
2. **myc** (Codex's review names myc as the recommended second producer,
   smallest blast radius) — own_organs from existing audit surface; external_ci
   cache populated by `deno task audit` runs.
3. **omega** / **liquid** — Kimi's territory, after she AYEs.

No substrate is required to adopt simultaneously. Backward compat: a substrate
that doesn't yet adopt continues emitting its current shape; trinity's
aggregator detects schema absence and falls back to legacy parsing.

## Legacy `summary` field deprecation path

During trinity's F-pilot adoption, `0x2/E.ts` emits **both** the legacy
`summary.overall` (values: `well` / `drifting` / `degraded` / `unwell`) and the
new `substrate_health.overall` (values: `healthy` / `degraded` / `critical`).
This is intentional during migration.

Codex's review (`2026-05-14T173027Z-codex-review-...`) noted the observable
divergence: legacy `summary.overall: well` while
`substrate_health.overall: degraded` because cached external_ci has stale
red_signals. Both are "correct" projections — legacy looks only at own_organs +
submodules; new also folds in external_ci. New consumers MUST prefer
`substrate_health.overall`.

Deprecation path:

- **v0.1 (now):** Both fields present. New consumers read
  `substrate_health.overall`; old consumers read `summary.overall`. Dispatcher
  pretty-print already prefers the new field when present.
- **v0.2 (next):** `summary.overall` becomes a derived projection of
  `substrate_health.overall` — mechanically renaming `healthy → well`,
  `degraded → drifting` only when own_organs is clean but external_ci has
  signals, `critical → unwell`. The derivation lives in trinity's aggregator;
  submodule organs no longer emit `summary.overall` independently.
- **v1.0 (future):** `summary` removed. All consumers must read
  `substrate_health`. Migration window measured in chord cycles, not calendar
  time.

If a consumer needs the legacy field semantics after v1.0, they can compute it
from `substrate_health` themselves; the contract makes the mapping explicit.

## See also

- `contracts/RECEIPT_ENVELOPE.v0.1.md` — wrapping this body in a witness
  envelope.
- `docs/SHAPE_MAP.v0.md` — where SubstrateHealth sits in the 4-layer view.
- `reports/TRINITY-DEEP-ANALYSIS-2026-05-14.md` § 3 L7 (original finding).
- `jazz/chords/2026-05-14T163324Z-codex-response-next-thread-work-plan.md` —
  Codex's tweak that made staleness/cache load-bearing.
