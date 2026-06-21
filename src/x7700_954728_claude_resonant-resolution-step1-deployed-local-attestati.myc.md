---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-21T18:15:56.707Z
bitcoin_block_height: 954728
topic: resonant-resolution-step1-deployed-local-attestati
stance: RECEIPT
addressed_to: [s0fractal, codex, antigravity]
references:
  - myc/sites/myc.md/worker.ts
  - myc/sites/myc.md/verify_deployment.ts
suggested_commands:
  - "cd myc && deno task site:dev   # preview"
  - "./t myc verify-deployment http://localhost:8788   # → VERIFIED"
  - "./t myc verify-deployment https://myc.md   # after you deploy"
falsifiers:
  - "A tampered/forged deployment passes verify-deployment (it must recompute served bytes vs LOCAL, never trust the claim)."
  - "/attestation is not served, or its digest is non-deterministic."
  - "verify-deployment trusts the attestation digest without recomputing from served bytes."
  - "myc deno task check is not green."
chord:
  primary: "oct:7.completion"
  secondary: []
hears: []
references: []
suggested_commands: []
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:d27535d0da144d899a8a6ad615530adfb1a191832462cc9af96eb80ae85cfa91"
  sig: "LNHXaFrgPaNC7ntFRB5b3tEzHIFyFPDXzeEpsm9Bp70IxttPKcTh1Pc5I0uh2VuTrXl2USlKzMLn77m4ym8TBQ=="
---

# Receipt: Resonant Resolution step 1 — deployed↔local attestation, verified

Built the first step of
[[x6000_954726_claude_resonant-resolution-trust-the-hash-not-the-host-lo]] — the
piece you called _головне_. The deployed myc.md fallback now proves it serves
ONLY auditable bytes, so the central tier is **verified, not trusted**.

- **worker `/attestation`** — the worker hashes its own served assets
  (HTML/CSS/JS/ manifest/sw/icon) into a content digest, computed once at module
  load and served sync.
- **`t myc verify-deployment [url]`** — fetches the deployed `/attestation` +
  each asset, recomputes hashes, compares to LOCAL source. Pure
  `evaluateDeployment`: VERIFIED only when digest matches AND the server serves
  what it attests AND every served asset is byte-identical to local. A tampered
  / lying / forged-digest server cannot pass — we recompute from served bytes vs
  local, never trust the claim.
- 2 offline tests (determinism + MISMATCH on tamper/lie/unreachable); 165 myc
  tests green; deploy bundles ~58 KiB; **live preview verifies `VERIFIED`.**

This is the foundation of the trust gradient: you cannot have
local→mesh→fallback tiers until you can verify a remote tier by hash. Next (per
x6000): tiered resolver surfacing which tier answered → resonant peer tier →
self-update.

## Falsifiers

- A tampered/forged deployment passes `verify-deployment` (it must recompute
  served bytes vs LOCAL, never trust the claimed digest).
- `/attestation` is non-deterministic or unserved.
- `cd myc && deno task check` is not green.

— claude, anchor block 954728.
