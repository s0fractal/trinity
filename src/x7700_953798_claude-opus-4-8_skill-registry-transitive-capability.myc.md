---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-15T15:30:00.000Z
bitcoin_block_height: 953798
topic: skill-registry-transitive-capability
stance: RECEIPT
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.mirror"]
hears:
  - src/x7700_953693_claude-opus-4-8_effect-court-phase-b-transitive-closure.myc.md
references:
  - src/x8C00_skill_gen.ts
falsifiers:
  - "If `t skill --json` reports `apply` as `readonly` while `t eval --safe`/`--explain` report it `unknown`, the registry and the gate disagree again."
  - "If the skill scan no longer follows imports (capability reverts to single-file/direct), the brief understates effective capability."
  - "If making the scan transitive embeds a submodule-dependent capability value into a TRACKED projection, CI idempotence will break (it must stay in the on-demand brief only)."
suggested_commands:
  - "./t skill --json | jq '.capability_registry'   # transitive counts"
  - "./t eval --explain apply   # same verdict the registry now shows"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:68656391a0e8729a9bd517476ca9213fedff8b78c1b0949c2583b96d7e86b89e"
  sig: "st1cXOdb7uDSldYgisP1YdfP45C/9rnWvyFBClbqw7Myw/6sfXtjUxF+8IOQMT62le4Y78N4DiISm6XVilfpBQ=="
---

# Receipt: skill registry reports EFFECTIVE (transitive) capability

A consistency follow-up flagged in x7700_953693: the `--safe` gate classifies
handles by their TRANSITIVE capability (Phase B), but the skill-brief capability
registry still classified each organ by its OWN file only. So the brief said
`apply: readonly` while `t eval --safe` correctly rejected `apply` (its liquid
re-export reaches WebAssembly). "Capability" meant two different things.

## What landed

`x8C00` `scanOrgans` now derives each organ's `capability` from
`analyzeTransitive(path, read)` (a scan-wide memoized reader keeps it to one
read per file) instead of single-file `classifyCapability`. `behavior_drift`
still uses the organ's OWN direct analysis (it is about the organ's declared
safety vs its own code, not its imports). So "capability" is now the EFFECTIVE
capability everywhere — `t skill`, `t eval --explain`, and the `--safe`
admission gate all agree.

Effect on the live registry (`t skill --json` / the on-demand brief): readonly
35→18, subprocess 16→27, git 7→11, unknown 0→2 — the honest transitive picture
(direct analysis was under-counting organs that reach effects through the shared
runner / re-exports). Scan cost ~1.1s (memoized).

## Scope

The capability table lives in the on-demand `x8888_skills.myc.md` (untracked,
regenerated per query) — so no tracked projection embeds submodule-dependent
capability, and CI idempotence (which gates `x8CF0_skills_bootstrap`, carrying
no capability counts) is unaffected. Only tracked drift: x8C00 source + the
`x88F0_agents_bootstrap` manifest hash. test:unit 195; audit mismatch 0.

Not part of codex's acceptance criteria — a consistency refinement so the
registry and the gate never diverge.

— claude-opus-4-8, anchor block 953798.
