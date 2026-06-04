---
id: 2026-05-17T094716Z-codex-receipt-route-policy-repo-tidying
speaker: codex
topic: receipt-route-policy-repo-tidying
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:4.foundation", "oct:5.action", "oct:2.receipt"]
energy: 0.74
stake_q16: 0
mode: RECEIPT
tension: "Architect wants fewer incidental repo distractions and more focus on two load-bearing moves: bringing submodules under one roof and making vector/route language govern generated/cache/scratch policy across directories."
confidence: high
receipt: file
actor: codex
claim_kind: cleanup-receipt
hears:
  - contracts/HEX_ROUTE_VOCABULARY.v0.draft.md
  - contracts/HEX_REFRACTION.v0.draft.md
  - x4d00_t20260516132000_claude_proposal-monorepo-unification-for-self-sufficient-harmony
  - x3600_t20260516132500_claude_cowitness-monorepo-aye-with-hard-tweak
claim:
  summary: |
    Per architect direction, treated lint-level issues as secondary and made
    a small repo-ordering pass. Added trinity_clean_export.md to .gitignore
    because it is generated external-model context, not default repo state.
    Corrected liquid's shared-mode handoff from obsolete 02_membrane command
    to myc's actual `deno task site:deploy`. Extended HEX_ROUTE_VOCABULARY
    with explicit git/artifact policy by route symbol: 8 cache ignored by
    default, B generated/build ignored by default, C scratch/tmp ignored by
    default, while receipts/proofs/anchor manifests remain trackable even
    when generated because they are governance state.
applied:
  files:
    - .gitignore
    - liquid/join.ts
    - contracts/HEX_ROUTE_VOCABULARY.v0.draft.md
  route_policy_core:
    - "8/8 => cache policy, ignored by default"
    - "B => generated/build policy, ignored by default"
    - "C => scratch/tmp policy, ignored by default"
    - "7/F or F => publish/anchor policy, track manifests and proofs, ignore bulky blobs/secrets"
    - "generated receipt/proof/anchor payload can be tracked because its role is governance state"
verification:
  commands_run:
    - "deno fmt --check join.ts (inside liquid)"
    - "deno check join.ts (inside liquid)"
    - "./t audit"
    - "./t contracts"
  observed:
    liquid_join_check: "pass"
    trinity_audit: "49 match / 0 mismatch"
    contracts_projection: "32 contracts known; HEX_ROUTE_VOCABULARY visible as draft"
falsifiers:
  - "If generated exports become governance receipts rather than disposable model context, the ignore rule for reports/trinity_clean_export.md should be removed or narrowed."
  - "If symbol-level ignore policy causes a canonical proof/receipt to be missed, the policy is too coarse; local manifest override must win."
  - "If myc deploy task changes, liquid's handoff text should follow myc's deno.jsonc rather than hardcoding a stale command."
next:
  - "Keep roof-first monorepo work separate from internal hex refactors."
  - "Build monorepo feasibility probe for myc first, then liquid, omega last."
  - "Turn route-symbol policy into a checker only after more examples accumulate."
---

# Receipt: Route Policy Repo Tidying

Small cleanup pass after architect clarified the load-bearing concerns: one roof
for submodules, and a standard vector/route language that can decide
generated/cache/scratch policy independent of directory brand.

Done:

- `reports/trinity_clean_export.md` is ignored as generated model-context
  export.
- `liquid join --shared` now points to `myc`'s actual deploy task rather than
  obsolete `02_membrane` commands.
- `HEX_ROUTE_VOCABULARY` now contains a draft git/artifact policy by route
  symbol.

Important distinction preserved:

```text
generated ephemeral        -> ignore
generated receipt/proof    -> track intentionally
generated anchor manifest  -> track intentionally
```

So `B`, `C`, and `8/8` become ignore-biased symbols, but not a blind rule that
hides governance artifacts.

Verification:

```text
liquid deno fmt --check join.ts  pass
liquid deno check join.ts        pass
t audit                          49/49 match
t contracts                      32 contracts known
```

Next clean reversible step remains the monorepo feasibility probe: `myc` first,
`liquid` second, `omega` last.
