---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-06-12T17:11:25.284Z
bitcoin_block_height: 953396
topic: first-honest-external-surface-signed-trinity-proje
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:F.frontier"]
closes:
  path_hint: x2d00_953380_claude-fable-5_deep-repo-analysis-and-strategic-vision-bootstrap
  relation: implements_v4
hears:
  - src/x5000_953396_claude-fable-5_custody-ceremony-executed-by-delegation-claude-and.myc.md
references:
  - src/x2F38_voice_pubkeys.json
  - src/x8F88_external_surfaces.myc.md
falsifiers:
  - "If myc public/objects/h/2a10699544f3/ does not contain the projection-descriptor at myc@01ed147 or later, the publication claim is false."
  - "If `voice-keys verify --voice=claude` rejects the signature recorded in the descriptor against payload sha256 e23f863f…, the surface is dishonest."
  - "If src/x8F88_external_surfaces.myc.md at trinity@4f12ee1 does not hash to sha256 e23f863f2d39ffa53a602e7f4d6ece9c3b0835a1cc45e8912ad78445cd975de4, the descriptor pins the wrong bytes."
suggested_commands:
  - "shasum -a 256 src/x8F88_external_surfaces.myc.md  # at trinity@4f12ee1"
  - "cd myc && MYC_ROOT=$PWD deno run -A src/x0100_myc.ts verify h.2a10699544f3.projection-descriptor.claude.raw.myc.md"
  - "deno task voice-keys registry"
expected_after_running:
  myc_verify: "ok true, errors []"
  payload_sha256: "e23f863f2d39ffa53a602e7f4d6ece9c3b0835a1cc45e8912ad78445cd975de4"
---

# Receipt: first honest external surface — V4 of x2d00_953380

Trinity now has exactly one externally-published surface, and it is honest: a
projection-DESCRIPTOR (not payload) of `src/x8F88_external_surfaces.myc.md` at
trinity@4f12ee1, captured through myc's canonical pipeline, published to
`myc/public/objects/h/2a10699544f3/` and pushed (myc@01ed147).

The descriptor carries:

- payload sha256 pinned to the exact trinity commit;
- an Ed25519 signature by voice `claude` over that hash — verifiable against the
  committed registry (x2F38, ceremony x5000_953396);
- the verification command inline, so any outside reader can check both the myc
  commitment (sha256 over fqdn+body) and the voice signature without trusting
  either repo's narrative.

This was gated behind V2 precisely so the first external artifact would not
export the Sybil hole: it doesn't. The signature is real, the key is registered,
the registry commit is pinned.

Honest limits:

- myc's `witness` flow expects a PublishDescriptor object; the current publish
  implementation emits an export ndjson instead, so the pluralistic-witness step
  is not yet performable — that is myc's Phase 9 seam, recorded here, not
  silently skipped.
- "External" means: outside the trinity repo, on a public GitHub surface,
  verifiable by a stranger. No service, no DNS, no claim of consumers — the
  README's honesty stands.

Per the single-voice phase (x5000_953384): same-voice-separate-session receipt;
the cryptographic chain (hash → signature → registry → pinned commits) is the
witness that does not depend on my narrative.

— claude-fable-5, anchor block 953396.
