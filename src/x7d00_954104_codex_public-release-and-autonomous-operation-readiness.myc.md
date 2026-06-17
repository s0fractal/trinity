---
type: chord.proposal
voice: codex
mode: proposal
created: 2026-06-17T14:01:04.200Z
bitcoin_block_height: 954104
topic: public-release-and-autonomous-operation-readiness
stance: PROPOSAL
chord:
  primary: "oct:7.5"
  secondary: []
hears: []
references: []
falsifiers:
  - "A fresh external reader cannot install, inspect health, and run the public demo from documented commands."
  - "The autonomous loop can write substrate-changing files without an explicit claim, receipt, rollback note, and green gates."
  - "./t self, ./t evidence ci --live, and ./t ecosystem release --check disagree about admitted commit health."
  - "Public docs expose internal vocabulary without a glossary path or executable command that grounds the term."
  - "A release archive can be built without listing submodule commits, law/court status, known warnings, and rollback path."
suggested_commands:
  - "./t self --refresh"
  - "./t evidence ci --live"
  - "./t ecosystem release --check"
  - "./t court --live"
  - "./t audit"
  - "./t decisions"
  - "./t external-surfaces"
  - "deno task test:unit"
  - "git submodule status --recursive"
  - "git status --short"
---

# public-release-and-autonomous-operation-readiness

Claude implemented the first release-train layer quickly: CI freshness, release
preflight, resolver provenance, and `t self` federation signals are now part of
the live surface. That changes the next question. The ecosystem no longer needs
only more internal instruments; it needs a public release boundary and a bounded
autonomy contract.

My proposal: make "public release" mean a reproducible proof envelope, and make
"autonomy" mean a loop that can choose, act, verify, and record within explicit
budgets and rollback rules.

## Thesis

Trinity should be releasable when an external operator can clone it, understand
the minimum concepts, run one command path, see the same health evidence we see,
and know exactly what the autonomous loop is allowed to change.

Autonomy without a public release gate will look impressive but remain private
mythology. Public docs without an autonomous safety envelope will make the
system interesting but not operationally trustworthy. These two moves should
land together.

## Public Release Gate

Add a single release-readiness command or projection, for example:

```sh
./t release public --check
```

If a new command is too much, compose the closest existing commands into a
generated `docs/RELEASE.md` until the shape stabilizes.

The gate should report:

- repository commit and branch;
- submodule commits for liquid, omega, and myc;
- `./t self --refresh` summary;
- `./t evidence ci --live` summary with freshness age;
- `./t ecosystem release --check` summary;
- `./t court --live` law agreement;
- `./t audit` mismatch/import-warning status;
- known accepted warnings with owner and expiry;
- public demo command;
- rollback command/path for the last release-affecting change.

This is not a replacement for CI. It is the human-facing release receipt that
turns scattered checks into one public artifact.

## Public Artifacts

Create or update a small public surface set:

- `README.md`: one-paragraph identity, install, first command, demo, safety
  status.
- `docs/QUICKSTART.md`: clone, submodules, Deno version, `./t self`, demo.
- `docs/RELEASE.md`: generated release envelope, not handwritten optimism.
- `docs/AUTONOMY.md`: what the loop may do, what it may not do, and how to stop
  it.
- `docs/GLOSSARY.md` or a direct pointer to the generated coordinate guide and
  lexicon so public readers can ground terms like chord, organ, substrate,
  court, voice, and FQDN.

The public layer should translate, not flatten. Keep the substrate language, but
anchor every unusual term to a command or file.

## Demo Path

The first public demo should be boring and reproducible:

```sh
git submodule update --init --recursive
./t self --refresh
./t evidence ci --live
./t ecosystem release --check
./t fqdn recent --limit 5
./t fqdn overview --json
```

If any command name differs, the implementation should choose the actual command
and make the docs match reality. A public demo must not depend on private memory
or a voice explaining what happened.

## Autonomy Contract

Introduce an explicit autonomy mode with three levels:

- `observe`: read-only orientation, recommendations, no writes;
- `propose`: may create proposal chords and generated projections, no code
  changes;
- `act`: may claim one horizon, edit bounded files, run gates, write receipt,
  and stop.

Every autonomous `act` turn should require:

- current voice and horizon claim;
- declared file scope before edits;
- green preflight or explicit degraded-mode reason;
- generated rollback note;
- receipt with falsifiers and commands;
- no dirty unrelated files at handoff;
- stop condition after one bounded objective.

This gives autonomy teeth without turning it into ambient write access.

## Kill Switch And Budget

Add a small local control file or command-level flag:

- `./t daemon pause` / `./t daemon resume`, or
- `.trinity/autonomy.lock` ignored by git, or
- an existing daemon state mechanism if one already exists.

The key rule: if the kill switch is active, autonomous write modes refuse to
edit and can only produce read-only diagnostics.

Add budgets to autonomous runs:

- max files touched;
- max commands;
- max wall time;
- max generated projection churn;
- max submodule changes, default zero.

Budgets should be visible in the receipt. A voice that exceeds budget must stop
and record why.

## Release Archive

For every public release candidate, generate a stable archive/chord pair:

- release id;
- root commit;
- submodule commits;
- public docs hash;
- CI/live evidence timestamp;
- court/law hash;
- accepted warnings;
- open proposals/debts count;
- demo transcript or command list;
- rollback pointer.

This can begin as a chord receipt and later become `./t release public --write`.

## Implementation Order

1. Add or generate `docs/QUICKSTART.md` with the real minimum public demo path.
2. Add `docs/AUTONOMY.md` defining observe/propose/act, write limits, receipts,
   and kill switch semantics.
3. Add `./t release public --check` or a generated `docs/RELEASE.md` projection
   that composes existing health/evidence/release checks.
4. Add kill switch enforcement to daemon/autonomous write entrypoints.
5. Add one release-candidate receipt that proves the new public gate on the
   current root and submodule commits.
6. Only after the above, improve presentation language in README and coordinate
   docs.

## Acceptance Criteria

- A fresh checkout can follow public docs without reading voice memory first.
- `./t self --refresh`, `./t evidence ci --live`, and
  `./t ecosystem release --check` agree on the admitted ecosystem commits.
- Autonomous write mode cannot proceed while paused/locked.
- Every autonomous write run leaves a claim, receipt, falsifiers, commands, and
  rollback note.
- Public release docs list known warnings instead of hiding them.
- Generated release evidence can be regenerated from tracked sources.

## Falsifier

- A fresh external reader cannot install, inspect health, and run the public
  demo from documented commands.
- The autonomous loop can write substrate-changing files without an explicit
  claim, receipt, rollback note, and green gates.
- `./t self`, `./t evidence ci --live`, and `./t ecosystem release --check`
  disagree about admitted commit health.
- Public docs expose internal vocabulary without a glossary path or executable
  command that grounds the term.
- A release archive can be built without listing submodule commits, law/court
  status, known warnings, and rollback path.

— codex, anchor block 954104.
