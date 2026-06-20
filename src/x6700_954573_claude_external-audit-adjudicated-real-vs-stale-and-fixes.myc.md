---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-20T15:53:24.393Z
bitcoin_block_height: 954573
topic: external-audit-adjudicated-real-vs-stale-and-fixes
stance: RECEIPT
addressed_to: [s0fractal, codex]
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.mirror", "oct:5.action", "oct:7.completion"]
references:
  - contracts/schema/chord.schema.json
  - src/x6500_run_baseline.ts
  - src/x0100_dispatch.ts
  - src/x0020_scanner_core.ts
  - src/dispatch_routing_test.ts
  - src/scanner_phase_test.ts
suggested_commands:
  - "./t validate_schemas   # 562/576 chords pass (was 250); 11 active = real data debt"
  - "./t check              # 431 tests, green"
  - "./t 4/F1               # multi-char hex dispatch now resolves"
expected_after_running:
  present: "the 3 real code bugs are fixed + locked by tests; chord schema matches the living form; cognition archetype corrected to Balanced"
  pending_architect: "omega README/AGENTS + liquid start_simulation.sh honesty fixes are in submodule working trees (their local mains diverged from the pinned SHAs) — land + push"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:209ab2743194130c1e70955108bae38cb86f04d176c6b5212d440bfcd1c2e582"
  sig: "wcXEjSF43QIPB0Fd8/96r3w6VlibP0cV934sw2oJ21rWBRu+w9l6V/LeVo//dDncthv6FBrMD9T2X84hjUBsAw=="
---

# Receipt: external audit adjudicated (real vs stale) + fixes landed

A 23-agent external audit was handed to me. I re-verified every claim against
live HEAD with 5 parallel adversarial agents (verify-by-content, not by the
audit's stale line numbers). Root finding: **~80% of the audit's 🔴/🟠 items are
time-machine artifacts** — it ran on a pre-2026-05-25 checkout in an env with
**cargo absent and myc uninitialized**. Here is the adjudication and what I
fixed.

## CONFIRMED real → fixed (commit 13d2911, this branch)

- **x6500_run_baseline**: an absent gate binary (cargo) threw an uncaught
  NotFound that crashed the whole baseline. Now a try/catch reports it as a
  failed gate (code 127). [audit 🟡, ENV-gated but real]
- **x0100_dispatch**: the direct-position regex matched only single-char hex
  segments, so `4/F1`, `5/C9`, `2/F37` silently fell through to "unknown word"
  despite being real `POSITION_TO_FILE` routes. Widened to multi-char. [audit
  🟡]
- **x0020_scanner_core**: receipt-phase was a `content.includes("receipt:")`
  substring match — it counted `receipt:"none"` and prose/code as receipts,
  inflating the Rigid-Verifying archetype. Now structural
  (type/stance/`*.receipt.*`/ output-block). Effect: myc receipts 90→3, trinity
  433→259, both archetypes corrected **Rigid-Verifying → Balanced**. [audit 🟠
  systemic 3b]
- **chord.schema.json**: the schema required `id`+`speaker`+`claim` (a jazz form
  no current tool emits) and an UPPERCASE-only `mode` enum → it flagged 310
  valid living-form chords as failures. Rewrote to `anyOf` chord-identity +
  per-field shapes that match real multi-voice usage (object/array/string
  `chord`, underscore octant names, free `mode`/`receipt`/`confidence`).
  **Active failures 310 → 11.** [audit 🟠 — counts were stale; defect real]
- **New tests** (dispatch_routing, scanner_phase): close the untested-routing
  gap that let the hex bug hide, and lock structural receipt detection. The
  audit's "0 tests on glue layer" is FALSE (52 test files), but the _specific_
  routing/scanner gaps it implied were real — now covered.
- **x2C10**: annotated the unimplemented Balance-Metrics family +
  structurally-dead `hallucination_risk`/`raw-fantasy` axis as design-intent,
  not measurement.

## CONFIRMED real → handed to architect (submodule working trees)

- **omega** README/AGENTS: "1258+ deno tests" → real **219**; "308 across
  omega_core+omega_v2" → **306 (omega_v2; omega_core archived)**. Honesty fix;
  not committed because omega's local main diverged from the trinity-pinned SHA.
- **liquid** `tools/start_simulation.sh`: dead `00_core/daemon.ts` →
  `src/xA014_daemon.ts`.

## FALSE / STALE → no change (recorded so they are not re-raised)

- "decisions `--stable` non-deterministic via Date.now()" — **FALSE**,
  byte-stable across runs; the only `Date.now()` in stable output is
  `!stable`-gated; the filename-timestamp fallback is dead code over all 576
  chords.
- "wall-clock leaks into stable in 3 places" — **FALSE**, 0 of 3 reach a
  CI-diffed byte (`x4F00` contracts writes no file).
- "liquid TS2322 blocks test:unit" — **STALE**, fixed 2026-05-25; `deno check`
  clean; `test:unit` 551/551 green.
- "liquid Docker dead-on-arrival (00_core)" — **FALSE**, Dockerfile+entrypoint
  reference the migrated `src/xA026_hologram_server.ts`, which exists.
- "omega ZK-guest pouw breakage breaks `cargo test --workspace`" — **STALE**,
  fixed; workspace green, 306 tests.
- "Bitcoin-anchor constant duplicated in 4 files" — **STALE**, consolidated to
  `x0014_blocktime` (only live def).
- "POSITION_TO_FILE ↔ glossary drift" — **STALE**, gated by `t check` routes;
  cannot silently diverge.
- "cognition ranking nondeterministic (self-dirtying git)" — **FALSE**, outputs
  are gitignored; runs byte-identical.
- "misaligned bucket geometrically dead" — **FALSE/misdirected** (that code is
  in x2300 self-portrait, not cognition; and is reachable).
- "trinity inflated metrics" — **FALSE**; "114 organs" is an _undercount_ by 1
  (generator excludes itself); no test/chord/LOC counts exist in trinity docs.
- "canonicalManifest / parseArgs duplicated" — **FALSE** (name-collisions,
  different bodies). `isError`×7 IS byte-identical (a real but low-urgency
  bucket-0 dedup, deferred per "rename when touched").
- "ZK is mock-only" — **TRUE but honestly self-disclosed** (AGENTS.md explicit,
  nomos gate fails closed in production). No overclaim; no change.
- "cross-substrate dispatch 0/4" — **ENV-GAP** (auditor's missing cargo + uninit
  myc); resolves on a configured checkout.
- "blake3 fixture 74F≠000 stale passing evidence" — hash drift real, but the
  probe is **deferred + ungated** (no test/CI runs it); "passing evidence" is
  FALSE. Left as deferred debt.

## Residual honest debt (NOT gamed away)

`validate_schemas` still shows **11 active failures** after the schema fix.
These are GENUINE: ~4 malformed-YAML legacy chords (bad escape sequences / dup
keys) and 7 antigravity "triage" receipts carrying no octant. They are
signed/legacy, so repair would break `content_sig`; left as a true signal rather
than loosened away. The schema now does its job — passes valid chords, flags
real ones.

## Falsifiers

- `./t check` is not green, or any of the 5 new tests fail.
- `./t validate_schemas` active failures are not 11, or a living-form chord
  still fails the schema.
- `./t 4/F1` does not resolve to a direct position.
- `t cognition_phase_report` re-inflates receipts by substring again.
- A claim marked FALSE/STALE here reproduces on current HEAD.

— claude, anchor block 954573.
