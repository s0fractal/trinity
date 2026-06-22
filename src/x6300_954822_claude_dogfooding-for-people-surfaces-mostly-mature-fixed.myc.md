---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-22T09:47:16.340Z
bitcoin_block_height: 954822
topic: dogfooding-for-people-surfaces-mostly-mature-fixed
stance: OBSERVATION
addressed_to: [s0fractal]
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.0"]
hears:
  - x6300_954755_claude_ask-answers-by-concept-dogfood-fixes-router-hijack
references:
  - src/x2F30_fqdn_resolver.ts
suggested_commands:
  - "./t resolve-fqdn search bi-principal && ./t resolve-fqdn show <name>   # the flow now works"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:0edc2d2116630d2fdc55848d1313f868a2b5518489e496fe04913e710d95a7be"
  sig: "XqJgUQe16dqCZ8Zpb19arnHSQRt8184Z2qnJtU51Va6kR4CQUn6lVDgL6u51iVEN0ueXzbreH9ZuGnGDt/FhBQ=="
---

# Dogfooding the for-people surfaces: mostly mature, one real fix

Asked "what to improve next," I committed to **ground-truth before theorizing**
— use the surfaces as a person would, fix what's actually rough, and say so
honestly when nothing is.

## The honest finding: more mature than my instincts

Two improvement instincts **deflated on contact**:

- _liquid refusal oracle_ — I thought a safety axiom was silently broken. Its
  source is a deliberate `return { status: "ALLOWED" }` pass-through ("refusal
  is opt-in; handled by higher gates"). Not a bug — intentional.
- _`ask` ranking_ — I thought it needed IDF weighting. Ground truth: "what is
  the bi-principal quorum rule" returns the two constitution chords as #1 and
  #2; "verify a chord signature" returns `x4001_chord.ts` #1. It already ranks
  well.

Add `atlas` (an excellent newcomer front door — identity, substrate sizes, what
the network leans on, doorways), `lineage`, and the bare-`t` start-here: all
genuinely good. The pattern this whole session is now overwhelming — **the
substrate is more done than the theories assume.** Saying that plainly is worth
more than a manufactured fix.

## The one real friction (dogfooding earns its keep)

`atlas` advertises `t resolve-fqdn show <name>` to "read one node's content."
But there was **no `show` subcommand** — `show` became the first non-flag token,
so it was parsed as the fqdn-to-resolve and silently returned `absent`. The
front door pointed at a command that did not exist; content was only reachable
via the less-obvious `--show` flag. **Fixed** (`x2F30`): added the `show` verb
(aliases `--show`). The full newcomer flow now works end to end —
`search <term>` → `show <name-it-returns>` prints the node.

## Falsifiers

- If `t resolve-fqdn show <a-name-from-search>` prints `absent` instead of the
  node's content, the fix is false.
- If the resolver tests (`fqdn_resolver_test`) do not pass, this is false.

— claude, anchor block 954822.
