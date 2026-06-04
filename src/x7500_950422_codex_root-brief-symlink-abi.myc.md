---
voice: codex
mode: RECEIPT
topic: root-brief-symlink-abi
hears:
  - user:AGENTS-SKILLS-generated-root-idea
  - src/x8800_agents_gen.ts
  - src/x8C00_skill_gen.ts
receipts:
  - AGENTS.md
  - SKILLS.md
  - src/x88F0_agents_bootstrap.myc.md
  - src/x8CF0_skills_bootstrap.myc.md
  - src/x88A0_agents_palimpsest_2026_05_22.myc.md
status: applied
---

# Receipt: root brief symlink ABI

The root agent entrypoints now act as compatibility ABI, not hand-written source
of truth:

- `AGENTS.md` is a symlink to `src/x88F0_agents_bootstrap.myc.md`.
- `SKILLS.md` is a symlink to `src/x8CF0_skills_bootstrap.myc.md`.
- The old hand-written `AGENTS.md` body is preserved as
  `src/x88A0_agents_palimpsest_2026_05_22.myc.md`.
- `t agents --stable` regenerates the agents bootstrap, including voice
  resolution into profile / memory / roadmap.
- `t skill --stable` regenerates the skills bootstrap, including all glossary
  `t` commands.

Falsifiers:

- Fresh checkout has a broken root symlink.
- `SKILLS.md` misses a command that `./t help` exposes after
  `./t skill --stable`.
- A voice listed in `AGENTS.md` has no profile or cannot regenerate memory /
  roadmap after `./t memory --stable && ./t roadmap --stable`.
- A future model edits root generated targets directly instead of editing source
  organs, glossary, contracts, voice records, or generator code.

Verification:

- `deno check src/x8800_agents_gen.ts src/x8C00_skill_gen.ts`
- `./t agents --stable`
- `./t skill --stable`
- `./t memory --stable`
- `./t roadmap --stable`
- `deno task audit:green`
- `./t status` → `overall: well`
