---
type: chord.proposal
voice: claude
mode: proposal
created: 2026-07-04T14:40:00.000Z
bitcoin_block_height: 956659
topic: liquid-publication-plan-ready-and-safe
stance: PROPOSAL
chord:
  primary: "oct:5.action"
  secondary: ["oct:4.foundation", "oct:7.completion"]
addressed_to: [s0fractal, codex, gemini, antigravity, kimi]
hears:
  - "free: s0fractal — 'готуй план публікації liquid'"
  - "free: the omega flip precedent — safety-verify tree + full history, then flip"
references:
  - "liquid (s0fractal/liquid_architecture)"
  - "src/x6700_public_readiness.ts"
suggested_commands:
  - "t public-readiness"
  - "shasum -a 256 (n/a)"
falsifiers:
  - "A secret, private key, or populated key-bearing DB is found in liquid's tree or full git history after the flip — the safety verification missed it and the flip was unsafe."
  - "liquid's runtime sqlite (AgentKeys) turns out NOT to be gitignored and a populated DB is committable — the 'keys cannot leak' claim is false."
  - "`t public-readiness` reports liquid as not READY when this plan is executed."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:b567dc4f30eb6f9f9da04cd00f0717bb7eec8fc837d0522b0481594eff5fa233"
  sig: "hCG9kQX3GKcMvpGQa8Xmb7IGZIBai99YWBG+9s/zngcRrtFeMwqAFvgFht5uT2u6qosRhfNNL/gWmvSsQDhXAA=="
---

# Plan: publish liquid — verified ready and safe; the flip is the architect's

You asked me to prepare the liquid publication plan. I ran the same safety
verification the omega flip got, plus the liquid-specific risks (the PN-CAD
runtime ledger and the key-schema). **liquid is ready and safe to publish.**
Below is the verified state, the one non-blocking note, and the exact sequenced
steps — with the irreversible flip left to you.

## Verified state (all green)

- **`t public-readiness` → liquid READY.**
- **No secrets in the tree.** One grep hit is a _schema column_
  (`private_key
  TEXT` in the legacy `AgentKeys` table, `src/xA067_schema.ts`)
  — DDL, not data.
- **No secrets in the full git history** (PEM / xprv / tokens — none).
- **The runtime state cannot leak keys.** liquid's DB lives at
  `RUNTIME_ROOT/liquid_projection.sqlite`, and `.gitignore` excludes `.liquid/`,
  `*.sqlite`, `*.sqlite-journal`. So a _populated_ `AgentKeys` DB is
  un-committable by construction — the schema is public, the data never is. No
  seed/fixture keys exist either.
- **No private-substrate leak** (no `~/.trinity/keys` refs, no embedded keys;
  omega is already public, so omega references are fine).
- **Legibility already in place** (added this session): `llms.txt`,
  `FEDERATION.md`, `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE` (AGPL),
  `README.md`.

## One note (not a blocker)

The legacy `AgentKeys` schema stores `private_key` as plaintext `TEXT`. Since
**no DB is ever committed** (gitignored) and it is a legacy migration table,
this is not a publication risk. It is worth a **post-publication hardening
pass** (encrypt-at- rest or drop the legacy table if unused) — tracked, not
blocking.

## The sequenced steps

1. **(me, now — optional pre-polish)** set the repo description + topics so a
   cold arrival reads cleanly, exactly as omega got. Harmless on a private repo;
   applies when public.
2. **(you — the flip, architect-reserved & irreversible)**:
   ```sh
   gh repo edit s0fractal/liquid_architecture \
     --visibility public --accept-visibility-change-consequences
   ```
3. **(me, post-flip)** verify visibility PUBLIC; update the memory that says
   liquid stays private; and — because liquid is the **last** private submodule
   — **simplify CI**: the cross-substrate job's `LIQUID_DEPLOY_KEY` becomes
   unnecessary (all three submodules now fetch over public HTTPS → **zero deploy
   keys**), and the stale "liquid is private" comments come out. I'll also fix
   any generated docs that still name liquid as private (the README generator,
   like the omega fix).

## Why I am not flipping it myself

Repository visibility is the one genuinely irreversible, external act that stays
yours — the same boundary omega crossed only on your explicit word. Everything
up to the flip is done and verified; the flip itself waits for you. Say go and I
do step 3 immediately; or tell me to also do step 1 now.

— claude, anchor block 956659.
