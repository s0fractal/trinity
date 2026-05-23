# probes/ index

> **Status table is now generated.** See
> [`../src/x8E00_probes.myc.md`](../src/x8E00_probes.myc.md) (regenerate with
> `./t probes`).

This file used to hand-maintain the probe status table. As of 2026-05-22 (commit
replacing hand-maintained tables with generation), all status data lives
**per-probe** in `<probe>/{README,SPEC}.md` banners:

```markdown
> **Status: graduated 2026-05-19 → `src/xNNNN_*.ts` (`t name`).**
```

`x8E00_probes_gen.ts` scans each probe and projects the substrate-wide index.
The generator detects status via (highest signal first):

1. README.md banner (new format)
2. SPEC.md top banner (older format, same syntax)
3. SPEC.md `## Status` section first line (pre-banner format)
4. Filename inference (probe handle matches `src/xNNNN_*.ts`)
5. Default — unknown

## What lives here (substrate-level rules only)

The per-probe status table moved to the generator. These rules apply to probes/
as a whole and are NOT regeneratable from per-probe state:

### Discipline

Probes are isolated try-it-and-see directories. Prove a pattern in a probe
before promoting it to live `src/` organ or contract. Once the pattern lands as
a stable live artifact, the probe directory remains as **review trail** — not
deleted, not archived — preserving the Codex / Gemini / Kimi review history.

### Status legend (what the generator emits)

- **graduated** → live `src/xNNNN_*` organ exists; pattern proved.
- **graduated (contract)** → no single organ, but a contract is active (e.g.,
  `SPORE.v0`, `RECEIPT_ENVELOPE.v1.0`); probe is the test record.
- **meta-graduated** → no single artifact; the whole-substrate convention IS the
  graduation (e.g., flat-src layout).
- **meta** → watchdog or invariant-check pattern; no graduation expected by
  design (e.g., honesty-checks).
- **partial** → some components graduated, others remain probe-side.
- **deferred** → pattern proved but rollout pending architect call.
- **active** → still under construction or in TRIAL.
- **unknown** → no banner detected (generator could not classify).

### Conventions

- Newer probes use **`README.md`** with banner. Older probes use **`SPEC.md`**
  with banner or `## Status` section. Both detected.
- Probe outputs go to `<probe>/output/` and are NOT committed unless they are
  test fixtures. The `<probe>.manifest.json` sidecar with source hashes IS
  committed for graduated probes' review trail.

### Archive policy

Per `AGENTS.md` 2026-05-14 appendix: no probe is deleted. If a probe's pattern
is proven obsolete (not merely superseded), it goes through the codeicide
protocol (`t propose` → cowitnesses → verdict → apply) to
`archive/<isotimestamp>/probes/<name>/`. As of this writing, no probe has
reached that fate.
