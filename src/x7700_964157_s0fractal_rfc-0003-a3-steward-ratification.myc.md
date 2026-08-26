---
type: chord.receipt
voice: s0fractal
mode: receipt
created: 2026-08-26T00:00:00.000Z
bitcoin_block_height: 964157
topic: rfc-0003-a3-steward-ratification
stance: RATIFICATION
chord:
  primary: "oct:1.origin"
  secondary: ["oct:7.completion", "oct:5.boundary"]
addressed_to:
  - "codex-gpt-5"
  - "claude"
  - "any substrate or implementer downstream of RFC-0003 Part 01 §5.1"
claim_kind: authority
signature_status: "Signed with the registered `s0fractal` ed25519 key (pubkey j+QsSe0gExRd0G12NGfnAeebGBjlrYpglWtJJRcWAlA=, minted 2026-06-12). **The steward ran the signing command personally.** No voice invoked the key on the steward's behalf: the private half lives on a host neither this repository nor any model process reaches, only the 71-character payload digest was handed over, and only the signature came back. This matters more here than on a voice receipt — a voice signature attests control of a contribution key over bytes, and this one attests a human's ratification decision. Access to a key is not authority to speak as the person who holds it, and a ratification signed by anyone other than the steward would be exactly the substitution this ledger's custody rules exist to prevent. The bytes below were drafted by `claude` at the steward's direction; the signature is the steward's assent to these exact bytes and to nothing else."
hears:
  - "s0fractal — ratified Tranche A3 and CNP-0-JCS, and drew the boundary in the same statement"
  - "codex-gpt-5 — reviewed and merged the ratification as PR #23, after two rounds of status-contradiction findings"
references:
  - docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md
  - docs/rfc/0003-heterogeneous-state-protocol/07-revision-history.md
  - docs/rfc/0003-heterogeneous-state-protocol/00-architecture-and-ratification-map.md
  - contracts/CANONICAL_ENCODING.v0.1.md
  - conformance/cnp-0-jcs-v0/README.md
pins:
  accepted_head: "94c33d55eaa727a478ccbe2435d29171a8893e07"
  merge_commit: "786e3b1320ebb73516bc6358932147009f2aecb4"
  pull_request: "https://github.com/s0fractal/trinity/pull/23"
  kit_manifest_root: "63bb595b56a7da32ab0fa1a23ea1ea5d2cb963cf42dc942e73739ccdea49ce74"
  statement_utf8_sha256: "94f178a5123b15ad20813b3caeba9aad6d3b9035d65b70302f68b6d71b07f0ff"
suggested_commands:
  - "git merge-base --is-ancestor 94c33d55eaa727a478ccbe2435d29171a8893e07 786e3b1320ebb73516bc6358932147009f2aecb4"
  - "python3 conformance/cnp-0-jcs-v0/tools/build_kit.py --check"
  - "python3 conformance/cnp-0-jcs-v0/selftest.py"
  - "./t voice-keys verify-chord src/x7700_964157_s0fractal_rfc-0003-a3-steward-ratification.myc.md"
  - "./t check"
expected_after_running:
  ancestry: "exit 0 — the ratified head is an ancestor of the merge commit"
  kit_derivable: "63 required and 52 extended cases, 6 verbatim regions, contract carried verbatim, 10 files pinned and nothing unpinned; MANIFEST.sha256 itself hashes to the kit_manifest_root pinned above"
  kit_selftest: "26 passed, 0 failed"
  chord_signature: "signed:true valid:true voice:s0fractal"
  t_check: "573 unit tests pass; audit, routes, signatures and projections green"
claim:
  summary: "Tranche A3 of RFC-0003, and CNP-0-JCS, are RATIFIED by the steward. Exactly one of three independent states changed: A3 is RATIFIED, adoption-evidenced remains false, and interop-confirmed remains false. Ratification settles that the encoding is determined and checkable and lifts the specification-side federation blocker; it licenses NO claim that the encoding is in use, that a second implementation exists, that interoperability has been demonstrated, or that any federation evidence has been produced. Anything depending on cross-substrate reference equality still depends on adoption-evidenced, which is false: no substrate computes references under hsp-jcs@v0 today. The six artifacts §5.1.3 required all exist at the ratified revision — CANONICAL_ENCODING.v0.1, the CNP-0 corpus across all eight §5.1.3 categories, the reference encoder, the verifier-only rejection path that imports nothing from it, the standalone conformance kit at conformance/cnp-0-jcs-v0/ with manifest root 63bb595b56a7da32ab0fa1a23ea1ea5d2cb963cf42dc942e73739ccdea49ce74, and this ratification. Accepted head 94c33d55eaa727a478ccbe2435d29171a8893e07, merged as 786e3b1320ebb73516bc6358932147009f2aecb4 via PR #23."
content_sig:
  voice: s0fractal
  alg: ed25519
  payload: "sha256:8a2188ed33356e9ec1c5e590c6cf2e3e524bffcd43b57f7beef18b29c1cbe3d2"
  sig: "4HQ2VdhUXXhoXlNle6rOYGhUf+nb7++WmkPTILAQAVFsKULHsvGOu+VOPlA+OijVEShIAd4XSq3m1nOL8j4aDw=="
---

# Ratification: Tranche A3 and CNP-0-JCS

## The statement

> Ратифікую Tranche A3 RFC-0003 і CNP-0-JCS як steward. Це не є
> adoption-evidenced або interop-confirmed.
>
> _(I ratify Tranche A3 of RFC-0003 and CNP-0-JCS as steward. This is not
> adoption-evidenced or interop-confirmed.)_

The boundary arrived in the same breath as the ratification, and that half is as
normative as the first.

`statement_utf8_sha256` pins the Ukrainian sentence alone, as one line of UTF-8
with no trailing newline and the English gloss excluded — the gloss is a
translation and a translation is an interpretation. Reproduce it with:

```sh
printf '%s' 'Ратифікую Tranche A3 RFC-0003 і CNP-0-JCS як steward. Це не є adoption-evidenced або interop-confirmed.' | shasum -a 256
```

## Three states, independent of one another

| state                  | value        |
| ---------------------- | ------------ |
| **A3**                 | **RATIFIED** |
| **adoption-evidenced** | **false**    |
| **interop-confirmed**  | **false**    |

A3 being closed licenses no claim about any of the following, and this receipt
is the wrong thing to cite for any of them: that the encoding is in use, that a
second implementation exists, that interoperability has been demonstrated, or
that any federation evidence has been produced. Anything depending on
cross-substrate reference _equality_ still depends on `adoption-evidenced`,
which is false.

## What is pinned

|                   |                                                                    |
| ----------------- | ------------------------------------------------------------------ |
| accepted head     | `94c33d55eaa727a478ccbe2435d29171a8893e07`                         |
| merge commit      | `786e3b1320ebb73516bc6358932147009f2aecb4`                         |
| pull request      | [#23](https://github.com/s0fractal/trinity/pull/23)                |
| kit manifest root | `63bb595b56a7da32ab0fa1a23ea1ea5d2cb963cf42dc942e73739ccdea49ce74` |

The manifest root is pinned here **because it cannot be pinned inside the kit**.
`MANIFEST.sha256` shows the kit is internally consistent — unchanged since it
was pinned — and not that it is authentic, since whoever edits a file can
recompute the manifest. Authenticity needs the manifest's own digest known from
somewhere the editor of the kit does not control. This chord is that somewhere,
and this is the value the runner prints on every scored run for comparison.

## What was ratified

All six artifacts §5.1.3 required exist at the ratified revision:

1. `CANONICAL_ENCODING.v0.1`, the normative contract;
2. the CNP-0 corpus, across all eight §5.1.3 categories;
3. the reference encoder;
4. the verifier-only rejection path, which imports nothing from the encoder —
   the property that matters is that it cannot repair what it judges, and that
   is a code-path property rather than an authorship one;
5. the standalone conformance kit at `conformance/cnp-0-jcs-v0/`, which ships no
   implementation, so an outside party can implement §5.1 and check itself
   without consulting or trusting this project;
6. this ratification.

## What this does not settle, stated by the steward and not inferred

- **Not adoption.** No substrate computes references under `hsp-jcs@v0`. That is
  `adoption-evidenced`, it is false, and ratification does not move it.
- **Not independent interoperability.** No independently maintained
  implementation exists. That is `interop-confirmed`, it is false, and no
  document may describe §5.1 as independently interoperable or
  multi-implementation confirmed until it holds.
- **Not conformance of any implementation.** Passing the kit means reproducing a
  finite corpus.
- **Not RFC-0003 as a whole.** One tranche is ratified. The RFC remains a draft.
- **Not authority over other substrates.** Ratification binds this project's
  specification. It does not make anyone else's encoding, import anyone's
  governance, or bind a substrate that has not adopted the contract.

## What the signature attests, and what it does not

The steward ran the signing command personally, on the host that holds the key.
No voice invoked it on the steward's behalf.

That distinction is the point of this receipt rather than a footnote to it. A
voice receipt attests control of a contribution key over exact bytes. This one
attests a person's decision. Access to a key is not authority to speak as the
person who holds it, and a ratification signed by anyone other than the steward
would be precisely the substitution the custody rules exist to prevent — the
drafting voice had the technical means to sign this and did not.

The bytes were drafted by `claude` at the steward's direction. The signature is
the steward's assent to these exact bytes and to nothing beyond them.

## Falsifiers

Each is a command. If it does not do what is written beside it, this receipt is
false.

- `git merge-base --is-ancestor 94c33d55eaa727a478ccbe2435d29171a8893e07 786e3b1320ebb73516bc6358932147009f2aecb4`
  — exits 0. If not, what was ratified is not what was merged.
- `./t voice-keys verify-chord src/x7700_964157_s0fractal_rfc-0003-a3-steward-ratification.myc.md`
  — `signed:true valid:true voice:s0fractal`. If the voice is anything else, a
  ratification was signed by someone who is not the steward.
- `python3 conformance/cnp-0-jcs-v0/tools/build_kit.py --check` — green, and the
  manifest root it prints equals the one pinned above. If it differs, the kit
  ratified here is not the kit on disk.
- `python3 conformance/cnp-0-jcs-v0/selftest.py` — 26 passed, 0 failed.
- `./t check` — 573 unit tests pass.
- Any document in this repository describing §5.1 as adopted, in use,
  independently interoperable, or multi-implementation confirmed falsifies the
  boundary this ratification was given with, whatever it says about A3.

— s0fractal, steward, anchor block 964157.
