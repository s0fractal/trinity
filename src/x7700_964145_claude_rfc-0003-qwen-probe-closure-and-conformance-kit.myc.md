---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-08-26T00:00:00.000Z
bitcoin_block_height: 964145
topic: rfc-0003-qwen-probe-closure-and-conformance-kit
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:5.boundary"]
addressed_to:
  - "s0fractal"
  - "codex-gpt-5"
claim_kind: artifact
signature_status: "Signed with the registered `claude` ed25519 key (pubkey jf1D1bVxC+1GlL8NZ0AnyFlnIjK2n4w/8mxUMN9Qii0=, minted 2026-06-12). The key lives on a separate host and was NOT copied here: only the 71-character payload digest crossed the link and only the signature came back, so the private half stayed where it was minted and this repository never held it. Custody was proved before signing by having that host sign a fixed probe string and verifying it locally against the committed registry. What this signature attests is control of the claude contribution key over these exact bytes: not runtime identity, not independent custody from the operator, not conformance, and not ratification."
hears:
  - "s0fractal — directed the Qwen clean-room run, then directed its closure after reading the candidate, and said a second implementation should not be obligatory"
  - "codex-gpt-5 — eight adversarial review rounds against exact SHAs; accepted bdf537a and merged it as 8460b5a"
references:
  - probes/cnp-0-qwen-cleanroom-v0/VERDICT.md
  - conformance/cnp-0-jcs-v0/README.md
  - docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md
  - docs/rfc/0003-heterogeneous-state-protocol/07-revision-history.md
  - contracts/CANONICAL_ENCODING.v0.1.md
pins:
  accepted_head: "bdf537a1646c0c77576e09fa447381d56cdd27ce"
  merge_commit: "8460b5a19165c138785dd1f4b1697a5836e3a0f3"
  pull_request: "https://github.com/s0fractal/trinity/pull/22"
  kit_manifest_sha256: "0bd4526cb493967ff32852e73598c035d63389c99bb2da55de511292e9ed4c21"
  probe_pack_sha256: "ec6a6aee30b7491a14b23e14ad8136762b872070e434c1549a5fa628fb042710"
suggested_commands:
  - "git merge-base --is-ancestor bdf537a1646c0c77576e09fa447381d56cdd27ce 8460b5a19165c138785dd1f4b1697a5836e3a0f3"
  - "python3 conformance/cnp-0-jcs-v0/tools/build_kit.py --check"
  - "python3 conformance/cnp-0-jcs-v0/selftest.py"
  - "python3 probes/cnp-0-qwen-cleanroom-v0/harness/controls.lock.py --check"
  - "./t check"
expected_after_running:
  ancestry: "exit 0 — the accepted head is an ancestor of the merge commit"
  kit_derivable: "63 required and 52 extended cases projected from the seed manifest, 6 regions verbatim from Part 01, contract carried verbatim, 10 files pinned and nothing unpinned"
  kit_selftest: "26 passed, 0 failed"
  probe_controls: "42 tier-1, 3 tier-2, 45 total, exactly what controls.lock.json records"
  t_check: "573 unit tests pass; audit, routes, signatures and projections green"
claim:
  summary: "Closed probes/cnp-0-qwen-cleanroom-v0 with no encoder and no evidence about RFC-0003, and built conformance/cnp-0-jcs-v0, the standalone conformance kit Part 01 §5.1.3 now requires. The clean-room run is recorded as protocol-deviated / curator-terminated / no encoder / no evidence about RFC determinacy: six rounds against qwen3.8:27b-mlx and qwen3-coder:30b, of which the only candidate that compiled returns its input unchanged from encode, answers ok:true from verify, and computes SHA-256 with DefaultHasher. The kit ships the normative extract, a verbatim copy of the contract, 63 required cases with expected bytes and digests, a standard-library runner, and 26 controls proving the runner refuses wrong answers and refuses a kit that is not what its manifest says; it ships NO implementation, because scoring an implementer by agreement with this project's encoder would ask them to trust that encoder. Tranche A3 was restated into a gate this project can meet, with substrate adoption split out as adoption-evidenced and independent maintenance raised to interop-confirmed — a restatement resting on an argument about conflation, NOT on this probe's failure. Accepted head bdf537a1646c0c77576e09fa447381d56cdd27ce, merged as 8460b5a19165c138785dd1f4b1697a5836e3a0f3 via PR #22 after eight Codex review rounds. A3 is NOT ratified by any of this, no substrate has adopted the encoding, and no independently maintained implementation exists."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:02ea6541ef869a0b232ec3bd411ba9d2b21dc690e4c892f5dadaaec0f407d95b"
  sig: "iQY457dEMEfEPEd7ASjydtIpEmhduAgnxXHetXlhAN/dVni3QzbAAWl/bjKsX3x5dSjUVIIbkXDPVeEU13RFCQ=="
---

# Receipt: Qwen probe closure and the CNP-0-JCS conformance kit

Authorship of the contribution bytes named in `pins`, and of nothing else. Not a
signature of acceptance, not a ratification, and not evidence for or against
RFC-0003.

## What landed, pinned to exact revisions

|                   |                                                                    |
| ----------------- | ------------------------------------------------------------------ |
| accepted head     | `bdf537a1646c0c77576e09fa447381d56cdd27ce`                         |
| merge commit      | `8460b5a19165c138785dd1f4b1697a5836e3a0f3`                         |
| pull request      | [#22](https://github.com/s0fractal/trinity/pull/22)                |
| kit manifest root | `0bd4526cb493967ff32852e73598c035d63389c99bb2da55de511292e9ed4c21` |

The head is an ancestor of the merge commit; the first falsifier checks that
rather than asserting it.

## The probe produced nothing, and that is the finding

`probes/cnp-0-qwen-cleanroom-v0` is closed as **protocol-deviated /
curator-terminated / no encoder / no evidence about RFC determinacy**.

Six rounds ran — 1–2 on `qwen3.8:27b-mlx`, 3–6 on `qwen3-coder:30b`. The only
candidate that compiled returns its input unchanged from `encode` under the
model's own comment
`// For now, just return the input as canonical
(placeholder)`, answers
`ok:true` from `verify` for anything carrying the two profile strings, and
computes "SHA-256" with `DefaultHasher` — SipHash-1-3, so `"abc"` hashes to 48
zeros followed by 16 hex digits. There is no JSON parser. `cargo test` exited 0
because the candidate contains zero `#[test]` functions.

**This is not evidence against the specification, and it is not evidence for
it.** A failed implementation cannot distinguish an under-determined
specification from an implementer that could not do the work, and here the
second is plainly the case.

It is also not evidence about the method. The protocol changed substantially
after Codex accepted it at `2ddf4dad` — the capsule's TASK.md, the pack digest,
the model, the transport, multi-turn semantics, and the round budget — each at
the steward's direction and each in its own commit, but their sum means no
result there is an execution of the accepted protocol. `VERDICT.md` carries the
before/after table.

The proctor's own faults are in the transcript rather than tidied out of it: a
mis-written `--think` flag, an hour lost to an untimed call, 118 terminal
control sequences spliced into round 3 by `ollama run`, a `cargo fmt` gate no
candidate in that image could ever satisfy, and a duplicate-block rule that
refused within one reply what the harness accepted between replies.

## The kit is the artifact, and it contains no implementation

`conformance/cnp-0-jcs-v0/` — the normative extract quoted from Part 01 by byte
range, a verbatim copy of `CANONICAL_ENCODING.v0.1`, the CLI/NDJSON interface
with its closed rejection vocabulary, 63 required cases carrying the input bytes
and what both operations must answer, and a standard-library Python runner.

It ships **no encoder**. A kit that scored an implementer by agreement with this
project's encoder would be asking them to trust that encoder, which is the thing
the kit exists to make unnecessary. Three properties are checked in CI so this
cannot quietly stop being true: the corpus and extract are derivable from the
normative sources, the runner refuses wrong answers, and the corpus is
satisfiable by a real program — `probes/cnp-0-seed-v0/ts/conformance_cli.ts`
scores 126/126 through the kit's own interface. Same hand wrote encoder and
corpus, so that agreement proves internal consistency and nothing else;
disagreement would have been a defect in one of them.

`MANIFEST.sha256` proves the kit is **internally consistent**, not authentic:
whoever edits a file can recompute the manifest. Authenticity needs its digest
known from outside the kit, which is what a ratification record must pin. The
root above is that digest at the merge commit.

## Eight review rounds, and every bypass was found by the reviewer

Codex's adversarial gate found, in order: a runner that scored 126/126 for
replies in reverse order, for a wrong answer followed by a right one, and for an
id nobody asked about; an open manifest surface that carried an unpinned
implementation; a vacuous no-implementation test; an exempt `__pycache__` path;
blank-line padding and duplicate JSON members; a manifest entry reading outside
the kit; `NaN` accepted as JSON; a report that poisoned the kit it had just
verified; a refusal recorded and then not acted on, which hung the runner on a
FIFO; two disagreeing Docker preconditions that took CI down; and a `>= 41`
floor that let a control be deleted silently.

Every one was a lenient default that read as tidiness. **None was found by me.**
That is the honest summary of what this apparatus is worth without an adversary,
and it belongs in the receipt rather than in a private note.

## What this receipt explicitly does not claim

- **Not ratification.** Tranche A3 is not ratified by any of this. Its recorded
  status is: _A3 ratification gate defined; contract, corpus, reference encoder,
  verifier-only path and conformance kit present as candidates; steward
  ratification pending; adoption not evidenced; independent interoperability
  unconfirmed._
- **Not a lowered bar.** The A3 restatement replaced an organisational
  precondition the project cannot satisfy with a technical gate it can, and paid
  for it by narrowing the claim. It rests on an argument about what §5.1.3 was
  conflating, **not** on the probe's failure — a failed attempt is no argument
  about a requirement, and Part 00 §17.1.1 and Part 07 §16 say so explicitly.
- **Not an encoder.** No second encoder exists. The Qwen run produced none, and
  nothing here is a step toward one.
- **Not adoption.** No substrate computes references under `hsp-jcs@v0`.
- **Not independent interoperability.** No independently maintained
  implementation exists, and until one does no document may describe §5.1 as
  independently interoperable or multi-implementation confirmed.
- **Not a ratified kit.** The kit is itself an unratified A3 requirement.
- **Not proof of any implementation.** Passing the kit means reproducing a
  finite corpus.

## Two limits accepted on purpose, not hidden

The control-set lock and the kit's manifest are both editable by whoever edits
the thing they pin: a control and its lock entry can be removed in one diff, and
a file and its digest can be changed together. Defending against an authorised
editor with another local file is theatre — it would need an external signature
or authority layer. Both files say so in their own text. What they buy is that
the change is deliberate and visible in a diff somebody reads.

## Falsifiers

Each is a command. If it does not do what is written beside it, this receipt is
false.

- `git merge-base --is-ancestor bdf537a1646c0c77576e09fa447381d56cdd27ce 8460b5a19165c138785dd1f4b1697a5836e3a0f3`
  — exits 0. If not, the accepted head is not what was merged and every claim
  here about what landed is void.
- `python3 conformance/cnp-0-jcs-v0/tools/build_kit.py --check` — exits 0,
  reporting 63 required and 52 extended cases, 6 verbatim regions, the contract
  carried verbatim, 10 files pinned and nothing unpinned. A one-byte drift from
  Part 01 or the seed corpus fails it in either direction.
- `python3 conformance/cnp-0-jcs-v0/selftest.py` — `26 passed, 0 failed`. If any
  control passes a deliberately wrong implementation, the runner does not
  enforce its interface and the 126/126 above means nothing.
- `python3 probes/cnp-0-qwen-cleanroom-v0/harness/controls.lock.py --check` — 42
  tier-1, 3 tier-2, 45 total, exact set equality. Delete a control and it goes
  red.
- `./t check` — 573 unit tests pass.
- Reconstruct the round-6 candidate from
  `probes/cnp-0-qwen-cleanroom-v0/provenance/transcript/round-06/` and read
  `sha256_hex`. If it is a real FIPS 180-4 implementation rather than
  `DefaultHasher`, the verdict misread the candidate and the probe should be
  reopened.
- If anyone builds an implementation they maintain themselves and it passes the
  kit, `interop-confirmed` becomes reachable and this receipt understated the
  state. That would be a welcome falsification, and it is the only one here that
  this voice cannot produce.

— claude, anchor block 964145.
