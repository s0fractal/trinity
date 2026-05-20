# probes/ index

Probes are isolated try-it-and-see directories. The discipline: prove
a pattern in a probe before promoting it to live `src/` organ or
contract. Once a probe's pattern lands as a stable live artifact, the
probe directory remains as **review trail** — not deleted, not
archived — preserving the Codex / Gemini / Kimi review history.

This index is hand-maintained for now (24 probes). When count gets
unwieldy it should become a generated `t probes` organ that reads
each probe's README / SPEC and derived status. Filed under survey
chord `x2200_950295` finding #3.

## Status legend

- **graduated** → live `src/xNNNN_*` organ exists; pattern proved.
- **graduated (contract)** → no single organ, but a contract is now
  active (e.g., SPORE.v0); probe is the test record.
- **meta-graduated** → no single artifact; the whole-substrate
  convention IS the graduation (e.g., flat-src layout).
- **partial** → some components graduated, others remain probe-side.
- **deferred** → pattern proved but rollout pending architect call.
- **active** → still under construction or in TRIAL.

## Self-description axis probes (today's rollouts)

| probe | status | target |
|-------|--------|--------|
| `agents-gen-v0` | graduated 2026-05-19 | `src/x8800_agents_gen.ts` (`t agents`) |
| `skills-gen-v0` | graduated 2026-05-19 | `src/x8C00_skill_gen.ts` (`t skill`) |
| `voice-memory-v0` | graduated 2026-05-19 | `src/x8A00_voice_memory_gen.ts` (`t memory`) |
| `roadmap-gen-v0` | graduated 2026-05-19 | `src/x8D00_roadmap_gen.ts` (`t roadmap`) |

## Convention / substrate-layout probes

| probe | status | target |
|-------|--------|--------|
| `flat-src-v0` | meta-graduated 2026-05-18 | trinity `src/` (61+ organs) |
| `liquid-flat-src-v0` | meta-graduated 2026-05-18 | liquid `src/` via Kimi's migration (122 organs at bucket A) |
| `blake3-fqdn-v0` | deferred — architect-pending | content-addressed filename convention |
| `morphology-v0` | partial graduation | `src/x0020_scanner_core.ts` + `src/x6020_gravity.ts` (`t gravity`); classifier/policy components remain probe-side |

## Governance / receipt-envelope probes

| probe | status | target |
|-------|--------|--------|
| `codeicide-flow-v0` | graduated 2026-05-14 (5 organs) | `src/x4D00_propose.ts`, `src/x6D00_cowitness.ts`, `src/x7D00_verdict.ts`, `src/x6E00_court.ts`, `src/x5D00_apply_codeicide.ts` |
| `substrate-court-v0` | graduated | `src/x6E00_court.ts` (`t court`) |
| `snapshot-identity-v0` | graduated | `src/x4E00_snapshot.ts` (`t snapshot`) |
| `envelope-bitcoin-anchor-v0` | graduated | `src/x7E00_anchor_prep.ts` (`t anchor_prep`) |
| `receipt-envelope-encoder-v0` | graduated (contract) | `RECEIPT_ENVELOPE.v1.0` active 2026-05-14; TS + Python cross-impl probes are the test record |

## SPORE family

| probe | status | target |
|-------|--------|--------|
| `spore-apply-v0` | graduated (contract) | `SPORE.v0` active 2026-05-12 |
| `spore-execute-v0` | graduated (contract) | `SPORE.v0` active; reference impl |
| `spore-bootstrap-pin-v0` | graduated (contract) | `SPORE_BOOTSTRAP_PIN.v0` active — 51 files Bitcoin-anchored |
| `spore-reject-v0` | graduated (contract) | behavioral test under `SPORE.v0` |
| `spore-runtime-adapter-v0` | active / integration | runtime adapter exploration |
| `spore-liquid-bridge-v0` | active / cross-substrate | bridge between SPORE and liquid; tied to `spore-runtime-adapter-v0` |
| `spore-meter-v0` | active / measurement | execution metering exploration |
| `spore-meter-exec-v0` | active / measurement | execution-side metering |
| `spore-meter-instr-v0` | active / measurement | instrumentation-side metering |

The 4 spore-meter sub-probes are the most recent SPORE-line probes
(2026-05-11 / 12) without graduation yet. Their measurement pattern
may or may not become a live organ; that's a future decision.

## Meta / honesty probes

| probe | status | target |
|-------|--------|--------|
| `falsifier-v0-honesty-check-v0` | meta — checks probe-output honesty itself | no graduation expected; this is a watchdog pattern |
| `voices-routing-falsifier-v0` | active — voice-routing tests | unclear graduation; possibly bridges to `src/x5C00_cross_verify.ts` |

## Conventions

- Most probes use **`SPEC.md`** as their canonical document (legacy
  pattern from before today's banner conventions). Newer probes
  (`agents-gen-v0` and later) use **`README.md`** with explicit
  status banner. Future probes should prefer README.md.
- Probe outputs go to `<probe>/output/` and are NOT committed unless
  they're test fixtures. The `<probe>.manifest.json` sidecar with
  source hashes IS committed for graduated probes' review trail.

## Archive policy

Per AGENTS.md 2026-05-14 appendix: no probe is deleted. If a probe's
pattern is proven obsolete (not just superseded), it goes through
codeicide protocol (`t propose` → cowitnesses → verdict → apply) to
`archive/<isotimestamp>/probes/<name>/`. As of this index, no probe
has reached that fate.
