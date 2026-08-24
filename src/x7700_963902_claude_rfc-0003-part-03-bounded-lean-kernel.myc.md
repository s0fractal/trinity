---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-08-24T20:21:32.422Z
bitcoin_block_height: 963902
topic: rfc-0003-part-03-bounded-lean-kernel
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:5.constraint"]
addressed_to: [s0fractal, codex]
claim_kind: artifact
signature_status: "No claude signing key exists on the host where this artifact was produced: ~/.trinity/keys/claude.ed25519.json is absent there and `./t chord sign` returned `no local key for claude`. If a content_sig block appears in this frontmatter, it was added by running `./t chord sign` on the host that does hold that key, and it attests control of the claude contribution key over these exact bytes — not runtime identity, independent custody, conformance, or ratification. Absent that block this chord is legal and unauthenticated, and the artifact stands on its reproducibility either way."
hears:
  - "free: s0fractal — asked for a bounded first Lean kernel that either proves Part 03's key algebras or shows where the specification is still underdetermined, and required that the unsuitable/undetermined relation not be chosen silently"
  - "free: codex — audited the artifact at bb38e78, reproduced the theorems and axiom cones independently, found the whole-file spec pin to be a merge blocker, and showed C5 to be broader than stated"
references:
  - proposals/rfc-0003/claude-lean-kernel-task.md
  - proofs/rfc-0003/README.md
  - proofs/rfc-0003/theorems.lock.json
  - .github/workflows/verify-proofs.yml
  - docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md
suggested_commands:
  - "./proofs/rfc-0003/verify.sh"
  - "cd proofs/rfc-0003 && python3 proof_guard.py"
  - "git show e7f63f1:docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md | sed -n '/^## 7\\. Translation protocol/,$p' | shasum -a 256"
expected_after_running:
  "./proofs/rfc-0003/verify.sh": "132 theorems and 63 definitions pinned; axiom cones within the closed allowlist [Quot.sound, propext]; 4 module digests unchanged; spec §7 body sha256 148c50d1a560…"
claim:
  summary: "Mechanized the algebraic core of RFC-0003 Part 03 in core Lean 4.31.0 as proofs/rfc-0003: 132 theorems and 63 definitions, no Mathlib, no lake, no sorry, no axiom declaration, no native_decide, and no Classical.choice. Proved the transformation-kind join laws and obligation accumulation (§7.0), the LossProfile monoid over a canonical sorted duplicate-free carrier together with the extensionality theorem that makes §7.1.0's byte equality usable at all, monotone loss and debt accumulation (§7.1.1, §7.3.1), and the suitability order and meet (§7.2). Seven findings are recorded with machine-checked witnesses for six of them: §7.2.1 states no relation between unsuitable and undetermined, so the stated relations admit no lower bound for that pair — no bottom and no meet on the ordinary bootstrap case; §7.0.2's drawn five-element diagram contradicts its own set semantics and drops an obligation at the join; §7.1.1's kind guard is inert on the loss fields; §7.2.1's meet is undefined on every payload, not only within, so Completion B is established on the four tags while the full Suitability type still has no defined meet; §7.0's motivating improvement is representable in neither algebra; and §7.1.1/§7.3.1 assert a composite's laws while asking descriptors only for an operation, never for that operation's laws. proof_guard.py pins theorem statements, definition spans, module digests and axiom cones against a closed allowlist, and gates on the §7 normative body rather than the whole specification file. This is not a proof of HSP correctness, not a conformance result, not a ratification, and no RFC file was edited."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:a2f7b3531f7ce6734e9570012af6e8c9afdb48a1bd0670e87bb0d797d6601555"
  sig: "sJftwdBA21Hciut7JWM0wfar1c8qONhThYNILhKkzr7EoZXk42ws9ufC7NsJwkHybeoQ092aHfxgrWsxw27SCQ=="
---

# Receipt: RFC-0003 Part 03 bounded Lean kernel

`proofs/rfc-0003/` mechanizes the algebras of Part 03 and reports where the
document does not determine one. The task brief is
`proposals/rfc-0003/claude-lean-kernel-task.md`; the full accounting — what is
proved, what is assumed as an explicit hypothesis, what is only modelled, and
what remains underdetermined — is in the artifact's own README, which this
receipt does not restate.

Two things are worth pulling out of it, because they are what the work is for.

**The equality §7.1.1 needed and did not have.** §7.1.1 requires `LossProfile`
to be a monoid, and a monoid law is a claim about an equality. §7.1.0 says two
profiles are equal exactly when their canonical bytes are equal, and requires
every set-valued field to be sorted by member digest with duplicates rejected.
`CMap.ext` proves those two requirements are enough: on canonical carriers,
extensional equality and structural equality coincide, so associativity and
identity are claims about sets and claims about bytes at the same time. This is
a carrier-level result and not a CNP/JCS one — it does not close the canonical
encoding seam of §5.1.

**The choice the specification did not make.** §7.2.1 orders `unsuitable`,
`bounded`, `suitable` and places `undetermined` below `bounded`, then requires a
bounded partial order and defines composition as the meet — without ever
relating `unsuitable` to `undetermined`. `no_lower_bound`, `no_bottom` and
`no_meet` show that pair has no lower bound at all, so neither requirement is
satisfiable as written, and the missing meet is exactly the bootstrap case of
§7.2.2. Two minimal completions are formalized. `gate_agrees` shows they gate
irreversible boundaries identically, so this is an erratum and not an emergency;
`completions_disagree` shows they write different values into a receipt, which
is why it cannot be left open. The recommendation is Completion B, and the
choice is left to the RFC's authors rather than made here.

## What this receipt does not claim

- Not a proof that HSP is correct, that any implementation conforms, or that
  Tranche C is ratifiable.
- Not a ratification, adoption, or amendment. No file under
  `docs/rfc/0003-heterogeneous-state-protocol/` was changed by this work.
- Not an attestation of anything beyond authorship of these bytes. Even signed,
  a chord signature proves control of a contribution key, not that the artifact
  is correct — that is what `verify.sh` is for.
- Not a closure of the canonical encoding seam, and not a check of any payload
  well-formedness rule — payloads are abstracted, as the README states.

## Falsifiers

- If `./proofs/rfc-0003/verify.sh` exits non-zero on a clean checkout with Lean
  4.31.0 on PATH, this receipt is false.
- If `grep -rn 'sorry\|native_decide' proofs/rfc-0003/HSP/` finds a live
  occurrence outside a comment, this receipt is false.
- If any theorem's `#print axioms` output names an axiom outside
  `{propext, Quot.sound}`, this receipt is false.
- If the §7 normative body of
  `docs/rfc/0003-heterogeneous-state-protocol/03-translation-loss-and-suitability.md`
  does not hash to
  `148c50d1a560f5b4845a69657caea285caa1def169de725a1be66c06ea9505da`, the
  theorems are pinned to a specification that no longer exists and this receipt
  is stale — `proof_guard.py` fails in exactly that case.
- If `git diff b7fb1ce..3004587 -- docs/rfc/` is non-empty, the claim that the
  artifact commits changed no specification file is false. The range is pinned
  rather than written against `main` on purpose: a later erratum commit is
  _meant_ to change `docs/rfc/`, and must not retroactively redden this receipt.

— claude, anchor block 963902.
