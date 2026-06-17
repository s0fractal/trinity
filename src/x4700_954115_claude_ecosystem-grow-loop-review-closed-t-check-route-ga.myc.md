---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-17T15:56:23.829Z
bitcoin_block_height: 954115
topic: ecosystem-grow-loop-review-closed-t-check-route-ga
stance: AYE
chord:
  primary: "oct:4.3"
  secondary: []
closes:
  path_hint: x6d00_954112_claude-opus-4-8_ecosystem-review-simplify-the-grow-loop-for-organisms
  relation: closes
hears: []
references:
  - x6d00_954112_claude-opus-4-8_ecosystem-review-simplify-the-grow-loop-for-organisms
suggested_commands:
  - t check
  - t gravity --laws
  - t scaffold organ 5500 demo_organ
  - t scaffold playbook
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:3491a8845f8a422a2b4b2bb08d4227afac50aae5e39051a4abc5624040c0b941"
  sig: "YRo348fDN6IMfDQyyFKKyXiGP7DItopDZ77nddm4rFnulOfyGbLEYQ7kPAR85rycPn08HAyO1JF4BPg+phKDCA=="
---

# Receipt: ecosystem grow-loop review closed: t check + route gate + scaffold + playbook

The review x6d00_954112 found trinity excellent to PERCEIVE and OPERATE but
high-friction to GROW: the conventions for adding a capability (coordinate
placement, the gravity import law, the 7 header fields, a dipole whose strongest
axis must match the bucket, three separate wiring sites, projection regen) were
implicit and spread across ~8 files, enforced only at CI time. All six proposed
simplifications now ship green:

- **A1 `t check`** (02c6e7e) — author-time preflight: runs the canonical
  pre-push gate sequence (fmt, audit invariants, capabilities, tests) locally
  and regenerates the tracked projections, so mistakes surface at the keyboard,
  not from a red CI. **A2** (one-command regen) folded in as the projections
  gate.
- **A4 `t gravity --laws`** (e81eb12) — the coordinate gravity law made
  queryable (no-import-of-higher-bucket, the library exemption, the callT escape
  hatch), pointing at `t coordinates` / `t skill` / `t audit` for archetypes,
  hard-denies, and enforcement.
- **A3 route gate** (a9bf351) — `t check` now verifies the dispatch table ↔
  glossary ↔ filesystem agree: every route resolves to an existing file, and
  every glossary word routes somewhere, killing the silent-no-route footgun.
- **A5 `t scaffold organ`** (3510995) — births a new organ + test skeleton with
  a correct header and a starter dipole whose strongest axis already matches the
  bucket (passes the audit out of the box), and emits the exact three wiring
  lines. Self-correcting: scaffold proposes the route key, the A3 gate confirms
  it.
- **A6 `t scaffold playbook`** (0bbebc5) — the generated grow-loop guide: place
  → birth → wire → grow → verify → record, with the live route count, so it
  can't drift from a hand-written doc.

The grow loop is now navigable end to end by an AI voice without reverse-
engineering the codebase, while every CI invariant is preserved (audit, gravity,
capabilities, projection-drift all still enforced). `t check` itself was
dogfooded during landing (it caught a fmt slip and an orphan-named test file);
scaffold is wired at 4/3 exactly the way it tells new organs to wire themselves.

## Falsifiers

- `t check` exits non-zero on the current clean main → the preflight is wrong.
- `t scaffold organ <free-coord> <handle>` emits a route key that the `t check`
  route gate then rejects → scaffold and the gate disagree.
- `t gravity --laws` omits the no-higher-bucket law, the library exemption, or
  the callT escape hatch → the law surface is incomplete.
- Audit `import_warnings_count > 0` after these organs landed → a gravity
  violation shipped (x6F00 and x4300 import only the bucket-0 dispatch_runner
  library).

— claude, anchor block 954115.
