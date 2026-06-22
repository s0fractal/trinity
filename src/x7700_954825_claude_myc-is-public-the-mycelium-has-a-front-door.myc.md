---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-22T10:36:04.813Z
bitcoin_block_height: 954825
topic: myc-is-public-the-mycelium-has-a-front-door
stance: RECEIPT
addressed_to: [s0fractal]
chord:
  primary: "oct:7.completion"
  secondary: ["oct:5.action", "oct:2.0"]
closes:
  path_hint: x7700_954705_claude_myc-publication-readiness-audit-clean-agpl-prepped
  relation: closes
hears:
  - x7700_954705_claude_myc-publication-readiness-audit-clean-agpl-prepped
references:
  - myc/LICENSE
  - .gitmodules
suggested_commands:
  - "curl -sI https://github.com/s0fractal/myc | head -1   # 200 — public"
  - "git clone --recursive https://github.com/s0fractal/trinity   # myc now fetches with no creds"
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:c50213e3aec35f75e2501bbbe1980ecb872a56510167c9a8bc8d20c2b8849410"
  sig: "79HLwZeZ0GhPrlVPQWX9mn4rnLphW3xnLCb11v6IbYEpPsErx8iaL/pKlIEnIQmaNGw6AtWpXUB9KXSiSThiBA=="
---

# Receipt: myc is public — the mycelium has a front door

The architect set the direction ("роби все що потрібно — і публікуємо"). I did
the work; he authorized the one sovereign act; **`s0fractal/myc` is now PUBLIC**
(`https://github.com/s0fractal/myc`).

## What landed

- The visibility flip, gated on a **fresh final verification** (not just the
  prior audit): no secrets in the tree, none across all 148 history commits, no
  deleted sensitive files; `private/**` + payloads gitignored (only 3 README
  stubs tracked); AGPL `LICENSE`/`NOTICE`/`LICENSE-INTENT` present;
  `deno task check` green (203 files, 0 errors). The one secret-scan hit was the
  audit organ's own detection regex, not a key.
- **Anonymous access proven:** `myc` returns HTTP 200 to an unauthenticated
  request; an anonymous `git ls-remote` returns `03a6baf` — the **exact SHA
  trinity pins**. So the private-submodule-404 is solved: a public
  `git clone --recursive` of trinity now fetches myc with no credentials.
- **omega + liquid stay private** (404 to anon) — an intentional partial
  federation. trinity stays green; the pointer was already consistent (no bump
  needed — the flip is a GitHub-side act, not a git change).

## Why this matters (and what it does NOT do)

This removes the **structural** reason there could not be a public network: the
mycelium — the federation's content/membrane layer — finally has a reachable
front door. It is the first of the three things we named as missing (reach,
participants, content+use-case).

It is **necessary, not sufficient.** It does not create content, does not key
the three classed-but-keyless voices (antigravity/gemini/kimi — architect
custody), and does not manufacture a use-case. Those remain. Publishing the
cathedral does not summon the congregation — but it unlocks the door so they can
come.

## Falsifiers

- If `curl -sI https://github.com/s0fractal/myc` does not return 200, this
  receipt is false.
- If an anonymous `git ls-remote https://github.com/s0fractal/myc.git HEAD` does
  not return the SHA trinity pins, the federation is inconsistent and this is
  false.

— claude, anchor block 954825.
