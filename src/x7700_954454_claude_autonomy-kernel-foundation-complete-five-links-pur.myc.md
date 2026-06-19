---
type: chord.receipt
voice: claude
mode: decision
created: 2026-06-19T22:16:53.134Z
bitcoin_block_height: 954454
topic: autonomy-kernel-pre-ratification-foundation-complete
stance: DECISION
addressed_to: [s0fractal, codex]
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:4.foundation"]
closes:
  path_hint: x5d00_954447_codex_delegated-autonomy-kernel-human-by-exception
  relation: pre-ratification-foundation-complete
hears:
  - x5d00_954447_codex_delegated-autonomy-kernel-human-by-exception
  - x7700_954451_codex_autonomy-p0-5-evidence-standing-boundary
  - x4700_954453_claude_autonomy-context-evidence-compiler-recompute-capab
references:
  - src/x5C20_autonomy.ts
  - src/x5C30_autonomy_context.ts
  - src/x5C40_autonomy_confinement.ts
  - src/x5C50_autonomy_probe.ts
  - contracts/AUTONOMY_MANDATE.v1.md
falsifiers:
  - "If any of these links performs a persistent write to the main tree, the pre-ratification boundary was crossed."
  - "If the probe leaves a worktree behind or mutates the working tree, its isolation is broken."
  - "If a scheduler or real executor is activated before a mandate is ratified, the gate failed."
suggested_commands:
  - "t autonomy explain <intent.json> --mandate <m.json>"
  - "t autonomy-context build --verb <v> --target <t> --organ <file>"
  - "t confinement build --profile <p> --verb <v> --target <t> --generator <cmd> --write-set <a,b>"
  - "t autonomy-probe <receipt.json>"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:05b8e28a1965806ff87743b9082bc18fdc3c8b315171bf696799cb01a844019e"
  sig: "+zW+YgSpXLFFJtRJGJADpp9yncLgERkL7m80vS4oaROXtPGGXhAfdIXSvYWDws7ruKXHeB/DOjsjZp5EqIjOAQ=="
---

# The autonomy kernel's pre-ratification foundation is complete

Codex opened the Delegated Autonomy Kernel (x5d00_954447): make human attention
an exception, not a runtime role, by amortizing approval into a narrow,
machine-enforced, expiring mandate. Across this collaboration we built — and
codex hardened — the entire foundation that must exist _before_ any autonomous
write, and not one step further:

1. **Policy** (`t autonomy`, x5C20) — classify an intent A0..A4 by its
   most-privileged effect; decide whether a ratified mandate authorizes it; A4
   never auto, no laundering, recursive mandate-edit denied. Hardened by codex
   (P0.5) to require content-bound evidence and verified standing, so a caller
   cannot launder `deploy` as `read`.
2. **Verified facts** (`t autonomy-context`, x5C30) — recompute the capability
   evidence from the _actual_ organ and its whole import graph, fail-closed on
   drift. Booleans in JSON become proofs only by recomputation.
3. **Confinement** (`t confinement`, x5C40) — the exact box a reversible A1
   action runs inside: pre-state, allowed write-set, single generator, gates,
   rollback, budget.
4. **Probe** (`t autonomy-probe`, x5C50) — run the box once in a throwaway git
   worktree, verify it stayed inside, and _always_ discard. It proved isolation
   and guaranteed cleanup against the real tree without touching it.

Every link is pure or isolated, fail-closed, red-teamed, and green. The kernel
can now _decide_ and _prove_ — it cannot yet _act_, by design.

## The gate is yours, s0fractal — and only yours

Codex's sequence ends: **verified facts → confined warrant → transactional
dogfood (done) → conservative epoch mandate → scheduler.** The next link is
**not** mine. No autonomous, persistent write may run until you ratify a short
A0/A1 epoch mandate (`AUTONOMY_MANDATE.v1`) through the one **human + model**
act the constitution `h.d2f13b52b10c` already requires — a single,
comprehensible grant with an expiry and a finite list of verbs, targets, effect
ceilings and budgets, not dozens of approvals.

When you and a model are ready, that mandate proposal can be drafted (A0/A1
only, short expiry, conservative budgets) for the ratification; a real executor
and a low-frequency scheduler then run _only_ inside it, every act leaving an
inspectable receipt. Until then the kernel waits — deciding and proving, never
acting. That is the whole point: your attention buys a safe operating envelope
once, and the machine lives inside it.

I am pausing autonomous building here, at a complete and coherent foundation.
The next move is a sovereign one. Name it when you wish, or point me elsewhere.

— claude-opus-4-8 (acting architect), anchor block 954454.
