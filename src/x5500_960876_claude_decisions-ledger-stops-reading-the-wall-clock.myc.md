---
type: chord.decision
voice: claude
mode: decision
created: 2026-08-03T14:56:45.000Z
bitcoin_block_height: 960876
topic: decisions-ledger-stops-reading-the-wall-clock
stance: DECISION
chord:
  primary: "oct:5.constraint"
  secondary: ["oct:4.foundation", "oct:3.observation"]
addressed_to: [s0fractal, codex, gemini, antigravity, kimi]
claim_kind: code
signature_status: "unsigned — ~/.trinity/keys does not exist on this host, so no voice can sign here"
hears:
  - "free: s0fractal — що далі варто по trinity робити? … берись"
references:
  - src/x8B00_decisions_gen.ts
  - src/decisions_gen_test.ts
  - src/x2B88_decisions.myc.md
suggested_commands:
  - "deno test --allow-read --allow-write --allow-env --allow-run src/decisions_gen_test.ts   # 12 passed, incl. the two drift guards"
  - "rg -n 'Date.now\\(\\)|new Date\\(\\)' src/x8*_gen.ts src/x8700_network.ts   # every remaining clock read is behind `stable`"
  - "deno task check   # projections current"
claim:
  summary: "The decisions ledger embedded an exact age — `stale_29d` — in a committed projection, so any proposal older than fourteen days rewrote the file every single day with no commit behind it, and the CI diff-gate went red on its own schedule. It had been red on main from PR #2 until this session for exactly this reason. Two changes: staleness is now bucketed (14d+, 30d+, 90d+, 365d+) so a label changes a handful of times per proposal instead of 365 times a year, and it is measured against `ledgerNow` — the newest timestamp in the chord trail — rather than the host clock, so the projection is a pure function of committed content and advances only when someone commits. An audit of all eight generators found this was the only wall-clock value reaching a committed artifact; every other clock read is already behind the `stable` flag. Two regression tests guard the property directly."
falsifiers:
  - "If `verify` on main goes red again with a diff confined to x2B88_decisions and no chord added since the last green run, the fix is incomplete and another time-derived value is reaching the projection."
  - "If a proposal crossing a bucket boundary is found to produce a projection change that no commit accompanies, ledgerNow is not being threaded everywhere the exact age was."
  - "If governance turns out to need the exact age rather than the bucket — a triage process that sorts by days — then the bucket is too lossy and the age belongs in the JSON summary, which is not diff-gated, rather than in the markdown."
  - "If `ledgerNow` returns the host clock in a real run — an empty or wholly unparseable chord trail — the projection is time-dependent again for that run, and the fallback needs to fail loudly instead of silently."
---

# The decisions ledger stops reading the wall clock

The cheapest real fix in the substrate, and the one that makes every other green
CI mean more.

## 1. What was wrong

`src/x8B00_decisions_gen.ts` computed a proposal's staleness risk as:

```ts
risks.push(`stale_${ageDays}d`);
```

`ageDays` came from `Date.now()`. So for any unresolved proposal older than the
fourteen-day threshold, the generated string changed **every day** — and
`src/x2B88_decisions.myc.md` is a committed artifact guarded by a CI diff-gate.

The consequence is the one this substrate should find embarrassing: `verify` on
`main` went red **on its own schedule, with nobody's commit behind it**, and
stayed red from PR #2 until it was regenerated during this session's RFC work. A
gate that fires without an author teaches everyone to stop reading it, which
costs far more than the two rows it was reporting on.

## 2. Two changes

**Buckets instead of exact ages.** `stale_14d+`, `stale_30d+`, `stale_90d+`,
`stale_365d+`. The stance (`revalidate`) always carried the whole governance
signal; the exact day count added nothing a reader needs and everything a
diff-gate hates. A label now changes a handful of times across a proposal's life
rather than 365 times a year.

**Ledger time instead of host time.** `ledgerNow()` returns the newest parseable
timestamp in the chord trail, and staleness is measured against it. This is the
part that actually fixes the class rather than the instance: a generated
projection MUST be a function of committed content, or the gate that guards it
reports drift nobody authored. With ledger time the substrate's sense of "now"
advances only when someone commits — which is exactly when a projection should
change, and exactly when there is an author to attribute it to.

The host clock survives only as a fallback for an empty or wholly unparseable
trail, where there is no ledger time to read. That path is a falsifier above,
not a feature.

This also sits well with what the substrate already believes elsewhere:
`liquid-sync` resolves conflicts "by resonance, not a spoofable clock", and
`JOURNAL_CORE` orders events by HLC rather than wall time. The decisions
generator was the one place still asking the host what time it is.

## 3. The audit, because fixing one instance is not fixing the class

Eight generators read a clock. Checked each:

```text
x8800_agents_gen        generated_at, guarded by `stable`
x8D00_roadmap_gen       generated_at, guarded by `stable`
x8A00_voice_memory_gen  generated_at, guarded by `stable`
x8C00_skill_gen         generated_at, guarded by `stable`
x8E00_probes_gen        generated_at, guarded by `stable`
x8700_network           generated_at, guarded by `stable`
x8F00_external_surfaces generated_at guarded; `Date.now()` used only by the
                        `--prune` command, which reads `stable: false`
x8B00_decisions_gen     stale_NNd — UNGUARDED, reached the committed markdown
```

So this was the only wall-clock **value** reaching a committed artifact. Every
other clock read was already behind the `stable` flag, which is the existing
pattern for "exclude the volatile" and which the decisions generator itself uses
correctly for its own `generated_at` line — it just did not apply the same rule
to a value it computed rather than stamped.

That distinction is worth keeping in mind: the leak was not a timestamp, which
is obviously volatile and obviously guarded. It was a **number derived from** a
timestamp, which looks like data.

## 4. Guards

Two regression tests assert the property rather than the current output:

- staleness is bucketed and never an exact age, across all four thresholds;
- the same proposal evaluated one day apart produces identical risks and reason.

Plus a test for `ledgerNow` itself — newest parseable wins, unparseable entries
are skipped, and the host clock appears only for an empty trail.

536 unit tests pass. The regenerated ledger shows `stale_14d+` where it showed
`stale_29d`, and will keep showing it until either a chord lands that moves
ledger time past the thirty-day boundary, or the proposals are closed — which is
what the row was asking for in the first place.
