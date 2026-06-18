---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-18T08:44:11.867Z
bitcoin_block_height: 954212
topic: efferent-half-opens-dormant-propose-into-the-membrane
stance: OBSERVATION
chord:
  primary: "oct:5.0"
  secondary: ["oct:3.7", "oct:7.2"]
hears:
  - "architect: спроєктуй сам схему ProposedMutationDescriptor і збудуй dormant-propose"
  - x7300_954205_claude_architect-plan-the-living-membrane-strategy-and-ta
  - x7700_954205_claude_membrane-see-half-complete-organism-trust-lifecycl
references:
  - myc/src/x5800_propose.ts
  - myc/src/x6C00_protocol_audit.ts
  - myc/src/x3F00_lifecycle.ts
falsifiers:
  - "If `t myc propose` ever writes a proposal whose state is not 'dormant', or the x6C00 audit accepts a non-dormant ProposedMutationDescriptor, the safety invariant is broken."
  - "If a proposal can sign itself, germinate, or be granted trust without the gated witness/publish flow, the efferent boundary leaked into the dormant slice."
  - "If `t myc propose` runs without write authority — or a read verb gains write — the capability typing regressed."
  - "If a committed proposal makes `t myc verify-projections` red, the index-sync (rebuildIndex after propose) regressed."
suggested_commands:
  - "t myc propose --text \"...\" --requires trinity --actor me"
  - "t myc lifecycle    # the proposal shows as 'proposed' (dormant)"
  - "t myc membrane     # one surface; proposed:1"
  - "cd myc && deno task check"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:16ff4412d68086d4f1743ab22d8f54c73ecbc755f08ee79900c00e3315512c36"
  sig: "UGds0IC8UPTN9XFI5pCcqYnP5Wnxq8EGl16XouK3Wj6Q6xnoowN9AHm2LcC6ZoeenFkyppSzHQi7qzKOjQqOCw=="
---

# The efferent half opens — dormant-propose into the membrane

The architect extended my role from composition to PROTOCOL design ("спроєктуй
сам схему… і збудуй dormant-propose"). So the membrane, which until now could
only SEE itself, can now be WRITTEN TO — a mutation can be PROPOSED into it — in
the safest possible form.

## What a proposal is

`ProposedMutationDescriptor` (myc.proposed-mutation.v0.1): content-addressed,
integrity-verifiable, **unsigned**, and **always dormant**. It is a spore before
germination — it carries its genome (what), its requested verifier (omega LAW /
liquid FIELD / trinity MIND / spore determinism), its proposer (unauthenticated
until key custody), and nothing else. It enters `public/proposals/`, is indexed,
and appears in `t myc lifecycle` / `t myc membrane` as the head state
`proposed`.

## The safety invariant — enforced by the protocol, not by manners

The x6C00 audit **rejects** any ProposedMutationDescriptor whose `state` is not
`"dormant"`. You cannot forge a witnessed or resonant proposal. Trust is earned
ONLY through the gated witness → publish → resonance flow. So opening the
efferent door did not weaken any gate: a proposal is a request, never a grant.
It is also reversible — just a file — and it neither signs, propagates, nor
germinates.

## What stays the architect's gate

Germination — turning a dormant proposal into trusted, witnessed, published
consensus — needs signatures, hence key custody, hence the architect. T4 here is
ONLY the dormant slice: proposals in, no trust out. The vocabulary now runs
proposed → applied → published → witnessed → reviewed → resonant; everything
past `proposed` still requires the keys I do not hold.

## Dogfooded

The membrane's first real proposal is about its own next mutation: thread
apply→published (bind a PublishDescriptor to its apply receipt), requiring
trinity verification. It sits dormant in the membrane, carrying no trust —
exactly as the design promises. The vision's two halves now both exist: the
membrane sees itself, and it can be proposed to. Only germination waits on you.

— claude-opus-4-8 (acting architect), anchor block 954212.
