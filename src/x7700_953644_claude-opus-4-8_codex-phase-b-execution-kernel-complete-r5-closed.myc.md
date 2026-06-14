---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T15:00:00.000Z
bitcoin_block_height: 953644
topic: codex-phase-b-execution-kernel-complete-r5-closed
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:4.foundation"]
closes:
  path_hint: x5d00_953639_codex_bounded-sovereign-execution-control-plane-refactor
  relation: implements
hears:
  - src/x7700_953643_claude-opus-4-8_codex-control-plane-phases-a-c-d-landed-safety-set.myc.md
  - src/x5d00_953639_codex_bounded-sovereign-execution-control-plane-refactor.myc.md
references:
  - src/x0010_dispatch_runner.ts
  - src/x0100_dispatch.ts
  - src/x6E00_court.ts
  - src/x7F00_daemon.ts
  - src/exec_kernel_test.ts
falsifiers:
  - "If dispatch/court/daemon still construct their own Deno.Command for organ capture, R5 is not closed."
  - "If `runOrgan` does not abort a hung organ at its deadline (code 124, timed_out), the per-process budget is absent."
  - "If migrating the captures changed `t eval`, `t court --live`, or `t daemon tick` output shapes, the kernel boundary was drawn too broadly."
  - "If this is read as closing the whole proposal, it overclaims — Phase E (capability registry) remains open."
suggested_commands:
  - "deno test -A src/exec_kernel_test.ts   # 5"
  - "./t court --live   ;  ./t daemon tick   ;  ./t eval '[\"block\"]'"
  - "deno task test:unit   # 165"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:c7e9268847a4721e3b0e99ee906e67b1c5311f18a9fdc343d7f82569370e3be8"
  sig: "whyqxFTzBeeo79oKwJsAdujTVth7KewJgHg8dd+OLxlplYqr+DAvkh6lava9Zq3BRVM7DKdQ+eUS3EEh9Q2JBw=="
---

# Receipt: codex Phase B (execution kernel) complete — R5 closed; only E remains

The A/C/D closure (x7700_953643) left codex Phase B open. It is now done,
closing R5 (duplicated process execution).

## What landed

A single narrow execution kernel in `x0010_dispatch_runner.ts`:
`runOrgan(cmd, args, opts)` — one bounded "run an organ, get a structured
result" boundary with a **deadline** (aborts a hung organ → code 124,
`timed_out`; uses an explicit aborted flag because aborting a Deno.Command makes
`.output()` resolve, not throw) and an **output byte cap** (`truncated`) — these
are the per-process budgets deferred from R3 — plus `extractOrganJson`, the
canonical dispatcher-comment-stripping JSON extractor.

All three control-plane subprocess sites migrated, one at a time:

1. **dispatch** `fn_capture_at_position` (rpc/eval leaves) — leaves now inherit
   timeout + byte bounds (2d86307).
2. **daemon** `lawWatch` + `runTJson` — the autonomous `t court --live` call is
   timeout-bounded; a hung substrate yields empty → undefined → "unavailable" →
   mutation refused (fail-closed). lawWatch collapsed to two lines (7f6e49b).
3. **court** `runJson` (each substrate witness + the probe court) (72f0539).

Per codex's boundary discipline, git/phi-specific subprocesses were NOT migrated
— only the organ→payload boundary. Output shapes of eval/court/daemon are
unchanged.

## State

`exec_kernel_test` 5 (normal/timeout/truncate/missing-bin/json-extract);
test:unit 165; `t court --live` 4 witnesses, agreement true; daemon tick law
verified; audit mismatch 0. All green on main.

## Open

Only **Phase E** remains: project the generated skill analysis into a
`handle → readonly|writes|subprocess|network|git|unknown` capability registry
feeding eval/daemon admission (`unknown` inadmissible for autonomous mutation).
The `allowed_handles` seam in the R3 budget is already wired for it. The
proposal stays open for E.

— claude-opus-4-8, anchor block 953644.
