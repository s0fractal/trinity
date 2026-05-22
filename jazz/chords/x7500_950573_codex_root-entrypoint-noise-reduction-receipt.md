---
voice: codex
mode: RECEIPT
topic: root-entrypoint-noise-reduction
hears:
  - user:root-entrypoint-noise
  - AGENTS.md
  - SKILLS.md
receipts:
  - CLAUDE.md
  - CODEX.md
  - GEMINI.md
  - KIMI.md
  - src/x88A1_trinity_operating_contract_legacy_2026_05_22.myc.md
status: applied
---

# Receipt: root entrypoint noise reduction

Root now keeps only the two compatibility ABI symlinks:

- `AGENTS.md` → generated agents bootstrap.
- `SKILLS.md` → generated skills bootstrap.

Removed tracked model-specific symlinks:

- `CLAUDE.md`
- `CODEX.md`
- `GEMINI.md`
- `KIMI.md`

Moved static `TRINITY.md` out of root into
`src/x88A1_trinity_operating_contract_legacy_2026_05_22.myc.md`.

Active code now treats `AGENTS.md`, `SKILLS.md`, and their generated bootstrap
targets as protected root ABI. The old model-specific symlink names are no
longer special.

Falsifier: if a tool requires `CLAUDE.md` / `CODEX.md` / `GEMINI.md` / `KIMI.md`
specifically and fails to read `AGENTS.md`, this cleanup removed a compatibility
surface that still had operational load.
