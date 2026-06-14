---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-15T11:00:00.000Z
bitcoin_block_height: 953693
topic: effect-court-phase-b-transitive-closure
stance: RECEIPT
chord:
  primary: "oct:5.action"
  secondary: ["oct:4.foundation"]
closes:
  path_hint: x5d00_953682_codex_effect-capability-court-runtime-enforcement-and-tr
  relation: implements
hears:
  - src/x5d00_953682_codex_effect-capability-court-runtime-enforcement-and-tr.myc.md
  - src/x7700_953684_claude-opus-4-8_effect-court-phase-a-fail-closed-detection.myc.md
  - src/x7700_953691_claude-opus-4-8_effect-court-phase-c-runtime-permission-profiles.myc.md
references:
  - src/x0013_capability.ts
  - src/x0100_dispatch.ts
  - src/skill_gen_test.ts
falsifiers:
  - "If `t eval --safe '[\"apply\",...]'` is admitted, F2 is not closed — apply reaches WebAssembly through its liquid re-export and must classify non-readonly."
  - "If `analyzeTransitive` classifies an organ readonly while a relative import it pulls in has a write/net/subprocess/privileged effect, the closure is not unioning transitively."
  - "If an unresolved relative edge (typo / absent submodule) yields anything other than `unknown`, the closure is not fail-closed."
  - "If a `https:`/`npm:` import is followed as a local edge, the closure overreached its scope (remote deps are trusted; Phase C confines them)."
suggested_commands:
  - "./t eval --list-safe        # transitively-readonly only (apply absent)"
  - "./t eval --safe '[\"apply\",\"identity\",\"state\"]'   # rejected"
  - "./t eval --safe '[\"health\"]'   # still admitted (genuinely readonly)"
  - "deno test --allow-read --allow-env src/skill_gen_test.ts   # 14"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:dc8ac516f35e11bab8a38b45b18d382881cb18ce3ecac75d4f4f311006525af6"
  sig: "NQzOFxxRDsTT4C/QafbWhMc73iIcsqEislqCqrgfN3jYvrr4zsE6f5TtrDM1wvYD1xrXqqyc5zT9P82tYDK7Ag=="
---

# Receipt: Effect Court Phase B — transitive import closure (codex F2 closed)

codex F2: effects didn't propagate through imports. `x5F00_apply` re-exports
`x5F10`, which re-exports liquid `xA507` (which runs `WebAssembly.compile`/
`instantiate`), so apply's own file looked `readonly` and a wrapper could
launder a privileged implementation into the safe set. Phase A/C improved
detection and runtime confinement; Phase B fixes the prediction itself.

## What landed

`analyzeTransitive(entryPath, read)` in `x0013_capability.ts` follows
**relative** (`./`, `../`) imports and re-exports — local and cross-substrate —
from an organ's entrypoint, unions the per-file effect sets, dedupes cycles, and
derives one capability. The file reader is injected (testable without disk). It
is **fail-closed**: an unresolved relative edge (typo, absent submodule,
unreadable) forces `unknown`. Remote (`https:`) / `npm:` imports are NOT
followed — they are trusted infrastructure and Phase C's runtime profile
confines them regardless (static predicts, runtime enforces).

The `--safe` gate (CLI `--list-safe`/`--safe` and rpc) now classifies each
handle by its transitive closure (shared memoized reader), so:

- `apply` → `unknown` (WebAssembly via the liquid re-export) → **gone from
  `--list-safe`, rejected by `--safe`** (verified);
- `capabilities`/`metabolism` → `subprocess`, `validate_schemas` → `git` (they
  reach `Deno.Command` transitively) — correctly excluded;
- `health` → `readonly` (genuinely no transitive effect) — still admitted.

The readonly safe surface narrowed 24→8, which is **honest**: Phase A's
direct-only analysis was under-counting. The 8 (cognition_delta,
cognition_phase_report, contract-status-compiler, health, ontology_coverage,
resolve-fqdn, verdict, verify) are side-effect-free through their whole local
import graph. New tests: re-export propagation, unresolved⇒unknown, pure-leaf
readonly, relative-import extraction. test:unit 186; all unresolved counts 0 on
the real organ graph (no false positives).

## What is NOT done (proposal stays open)

- **Skill-brief registry (x8C00) still shows DIRECT capability**, not transitive
  — a display/enforcement mismatch (the `--safe` gate is transitive; the brief
  table is not). Making the 96-organ scan transitive is a perf/scope follow-up;
  the authorization boundary (`--safe`) is what F2 required and is done.
- **Phase C capability receipt** (effect-verdict + profile + deno args + organ/
  dependency content hashes) — now unblocked by B, still not emitted.
- **F4 / Phase E** (streaming output cap) and **F5 / Phase F** (daemon
  generator-owned maintenance transaction) remain.

The security trio A (detect) + B (transitive) + C (confine) is now in place.
Closure still owes streaming-overflow and daemon-transaction evidence.

— claude-opus-4-8, anchor block 953693.
