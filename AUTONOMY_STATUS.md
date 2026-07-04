# Autonomy status — what acts without a human, and what never does

This page answers one question honestly: **where does Trinity act on its own,
where is it bounded, and where is a human or quorum non-negotiable?** It is a
status surface, not a promise. When it disagrees with the code, the code wins —
verify with `./t self`, `./t status`, and the organs named below.

> **The one-line stance.** Autonomy here means _less human prompting, not less
> human sovereignty_. Every autonomous act carries an exact scope, a receipt, a
> witness, and a falsifier; an unknown effect is treated as sovereign and
> refused; and doing **nothing** when there is no real demand is a correct
> outcome, not a failure.

## The blast-radius ladder (`src/x5C20_autonomy.ts`, fail-closed)

Every intent is classified by its effects, and the class is the
**most-privileged** of them — so small actions cannot be composed to launder a
large one.

| Class  | Meaning                                                 | Admission                                           |
| ------ | ------------------------------------------------------- | --------------------------------------------------- |
| **A0** | observe / read-only                                     | automatic                                           |
| **A1** | bounded local maintenance (projections, formatting)     | automatic, confined                                 |
| **A2** | source change                                           | witnessed + sealed                                  |
| **A3** | external adapter, allow-listed destinations             | mandate + allowlist                                 |
| **A4** | sovereign (spend, keys, publication, deletion, custody) | **never auto-admitted — human + model quorum only** |

A mandate can **never authorize itself**; A4 is never profiled or auto-admitted;
an unknown effect defaults to A4 (sovereign). These are enforced by tests, not
honour.

## Lanes — what is actually running

| Lane                                     | What it may do                                           | Bounded by                                                         | Status                                               |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| **Classify / confine** (`x5C20/40`)      | judge an intent's class, confine writes                  | pure, read-only, fail-closed                                       | **live** — underpins every seal                      |
| **Executor** (`x5C60`)                   | perform **one** bounded A1 in a temp worktree, then stop | exact write-set, gates, promotion                                  | **built, quiet** — runs when invoked, not on a clock |
| **Delegation epoch** (`x5C70/80/90`)     | lease + ceiling + demand + **one-shot** join             | attenuation, expiry; explicitly **not a scheduler**                | **built, quiet**                                     |
| **Daemon** (`t daemon`, lock `x7F88`)    | stable-projection upkeep, φ pulse, verify, commit/push   | tick-driven, kill switch `t daemon stop`; **does not author code** | **available, off by default**                        |
| **Metabolic A0/A1 loop** (audit Note II) | a standing perceive→act→publish→sleep cycle              | —                                                                  | **not built, deliberately**                          |

The last row is the important honesty: we have **not** built a standing
autonomous metabolism, and we are holding off **on purpose** until the ledger
shows real coordination pressure — a daemon that must invent a task each day is
make-work, not autonomy. Autonomy is caused by proved need, not elapsed time.

## Human- or quorum-reserved — the sovereign edges

None of these happen without a human, a real quorum, or both. This list is the
boundary, not a to-do:

- **External spend** and anything touching the anchor wallets.
- **Key custody and rotation** — private keys live outside the repo, with the
  architect.
- **Registry amendment** — adding/rotating/revoking a voice key needs a real
  3-of-5 quorum spanning ≥ 1 human and ≥ 1 model.
- **Signing as another voice** — a key on disk is _not_ permission; signing as a
  human principal requires an explicit, deliberate `--human` (`src/x2F37`).
- **Publication / repository visibility flips**, legal/licence changes,
  irreversible non-git deletion, and any physical-world effect.

## Custody — the deepest open gap (audit R1)

Voice keys are held by the architect on the voices' behalf; **no independent
voice has yet cast a registry vote** (`src/x2F3C_registry_provenance.json`,
amendments = 0). So the Senate quorum is today a strong _cryptographic_ form and
a weak _social_ independence. Closing this — independent custody and a first
non-architect amendment — is sovereign work reserved to the architect, tracked
in [`docs/KNOWN_GAPS.md`](docs/KNOWN_GAPS.md). It is named here so it cannot be
mistaken for done.

## Real receipts, not claims

Autonomous and semi-autonomous acts are sealed as `agentseal` action-receipts
under the acting voice's key, stored as git notes (`refs/notes/trinity-seals`) —
the recent commit history is sealed this way. Re-derive one yourself, no host:

```sh
git fetch origin 'refs/notes/*:refs/notes/*'
./t seal-commit verify HEAD   # signer, class, receipt intact, bound to this commit
```

## When we will call it "autonomous"

Not because a daemon exists. Only when **all** of these hold at once (audit
criteria, adopted):

- the autonomous cycle has a bounded mandate with an expiry;
- every action has exact scope, a receipt, a witness, and a falsifier;
- a no-op under no pressure is a normal result;
- the sovereign edges above stay human/quorum-reserved;
- custody is at least partly independent;
- an outside verifier can confirm the result with no private context.

Today: the first two, the third, and the fourth hold; the fifth does not yet,
and the sixth holds for the court but not yet for a standing loop. So Trinity is
**bounded, receipted, human-sovereign delegation — not an independent
metabolism.** That is the honest word for it.
