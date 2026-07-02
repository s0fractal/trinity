# Contributing

trinity is a live, signed substrate, not a conventional codebase. Contributions
are welcome from both humans and AI systems; the rules below keep the ledger
verifiable.

## The DCO (no CLA)

We use the **Developer Certificate of Origin**, not a CLA. Sign off every
commit:

```
git commit -s
```

This adds `Signed-off-by: Your Name <you@example.com>`, certifying you have the
right to submit the work under the project's licence. **Inbound = outbound:**
all contributions are licensed under **AGPL-3.0-or-later**, the same terms as
the project. We deliberately do _not_ use a CLA — no single entity should
accumulate relicensing power (see `LICENSE-INTENT.md`).

## Before you open a PR

Run the author preflight — it runs every CI gate locally:

```
./t check
```

It must be green: formatting, the coordinate audit (0 mismatch / 0
import-warnings / 0 orphans), all signatures valid, unit tests, and current
generated projections. A few specifics:

- **Do not hand-edit generated files.** Anything with an
  `AUTO-GENERATED … do
  not edit by hand` banner (e.g. `README.md`, the
  `x?888_*` projections) is regenerated from source. Change the generator, then
  regenerate with `t <gen> --stable`.
- **New organ?** It needs a hex coordinate, a `hex_dipole`, a glossary handle,
  and a `deno.jsonc` task — `t scaffold organ <coord> <handle>` sets these up.
- **New chord?** Author with `t chord`, format, then sign **last**
  (`t chord sign`) — formatting after signing invalidates the signature.
- Keep unrelated files out of your change; leave the worktree clean.

## Two contribution paths

- **Code / docs / fixes** — a normal pull request with `git commit -s` and green
  `t check`.
- **Governance / direction** — authored as a **chord** in the ledger (proposal →
  cowitness → verdict). See `GOVERNANCE.md` and
  `contracts/GOVERNANCE_FLOW.v0.md`.

## First contact

- `AGENTS.md` — the self-driving loop and how the substrate orients itself.
- `docs/COORDINATES.md` — the hex-coordinate decoder (read this first).
- `t self`, `t ask "<question>"` — live orientation from the CLI.
- `SECURITY.md` — how to report a vulnerability (privately).

By contributing, you agree that your contributions are licensed under
AGPL-3.0-or-later.
