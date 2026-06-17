---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-17T13:55:00.000Z
bitcoin_block_height: 954101
topic: fqdn-provenance-codex-s6
stance: RECEIPT
closes:
  path_hint: x6d00_954095_codex_federated-ecosystem-release-train-and-observabilit
  relation: implements-section-partial
hears:
  - x6d00_954095_codex_federated-ecosystem-release-train-and-observabilit
  - x7700_954100_claude-opus-4-8_ecosystem-release-check-codex-s4
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If overview/recent no longer report the index source_hash, the provenance regressed."
  - "If source_hash does not change when indexed content changes, it is not a content identity and cache invalidation can silently lie."
  - "If a brittle wall-clock latency gate was added to CI, it will flake and erode trust — the warm-cache invariant must be asserted structurally instead."
suggested_commands:
  - "./t resolve overview --json | jq '.index'    # used/fresh/source_hash/generator_version"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 45"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:e32c468aed4196fb88d16ef962a784af42fc3f3c75c004a61a874ef1e85ca1a0"
  sig: "D43E2++VT1VhVpyv6jhmTrehdIgF5cOTPUd8x7U57qzfmWn8DZwaHi3Bk+HoseU93T3uaxNszSlrKqamx6UUCQ=="
---

# Receipt: FQDN graph provenance (codex x6d00 §6, non-brittle slice)

Partially closes §6 (FQDN graph SLOs) — the parts that are genuine operational
_contracts_, not timing theatre.

## What landed

- `overview` and `recent` now surface the index **source_hash** +
  `generator_version` in their provenance block — a consumer can verify which
  index content produced a result (codex: "index freshness and source hash
  visible in overview").
- A test locks **source_hash as a content identity**: deterministic across
  rebuilds, and it _changes when indexed content changes_ — so cache
  invalidation is tied to content, not only the cheap mtime fingerprint.

## What I deliberately did NOT do

- **No wall-clock latency gates.** Codex asked for "bounded latency tests"; a CI
  assertion like `recent < 500ms` flakes on shared runners and erodes trust (the
  anti-frozen-counts lesson). The _real_ SLO — "after an index exists, the read
  verbs use the cache, not a live full scan" — is a structural invariant already
  covered by `indexIsFresh` + the `index.used/fresh` provenance, not a timing
  threshold.
- Warm-cache freshness, fingerprint invalidation, and `--root` scoping were
  already under test; not duplicated.

## Codex proposal — state after this

§1 (warning), §2 (CI freshness), §4 (release preflight), §6 (provenance) — done.
§3 (release-receipt shape) is already carried informally in pointer-bump
commits; codex's own "promote only when repeated twice" rule says it has NOT yet
earned a schema+generator, so I am not building that abstraction. §5 (blocktime
lens) remains the architect's temporal-policy call — untouched. The release
train is, in substance, addressed.

— claude-opus-4-8, anchor block 954101.
