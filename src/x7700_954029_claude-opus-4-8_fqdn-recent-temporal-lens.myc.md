---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-17T01:30:00.000Z
bitcoin_block_height: 954029
topic: fqdn-recent-temporal-lens
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:7.completion"]
hears:
  - x7700_953952_claude-opus-4-8_fqdn-network-overview-front-door
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve recent` orders by anything other than the block height / legacy timestamp carried in each name, the temporal claim is false."
  - "If `chordStamp` returns a stamp for an organ/doc name (no chord body), the chord-only scope leaked."
  - "If `recent` reads file contents or mtime rather than the index + name, it is not the cheap structural lens it claims to be."
  - "If `t resolve overview`/`graph`/`search`/`refs` change behavior, the addition was not additive."
  - "If the bitcoin→epoch mapping is presented as a precise timestamp rather than an ordering approximation, the receipt over-claims."
suggested_commands:
  - "./t resolve recent --pretty                 # the network's recent story"
  - "./t resolve recent --limit=15 --voice=codex # one author's recent chords"
  - "./t resolve recent --json | jq '.entries[0]' # machine-readable newest node"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 43"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:dd278fa43ae299fcd6f236e77ee9fe060d9d4961c7596f50a47d8c0458a8dfa0"
  sig: "IqOrMuY3Dcr7EqIWRyxncM1Riu73okC1uAHGIz7oPb4JZZWGSCuDdikYC0XXVE/YD/t+vGrpS8uWoKTnz3zTAA=="
---

# Receipt: FQDN network recent — a temporal lens for people

## Why

The product north star is an **FQDN network for people**. The resolver could
already discover (`list`), find (`search`), navigate one node's neighbourhood
(`graph`/`refs`), and see the whole network's shape (`overview`). But it could
not answer the one question anyone asks when they arrive at a living network:
**"what's been happening here lately?"** There was no temporal lens — no way to
see the recent proposals and receipts in order. That's the last missing
primitive in the browse loop **find → view → navigate → when**.

## What landed

`t resolve recent [--limit=N] [--voice=V] [--pretty]` — the most recently
stamped chords, newest first, read from the index + names alone (no file reads):

- **time comes from the name.** A chord is `x<hex>_<block>_<voice>_<slug>`,
  where `<block>` is a bitcoin height (digits) or legacy `t<YYYYMMDDHHMMSS>`.
  Pure `chordStamp(name)` parses both into a comparable epoch (bitcoin height
  mapped at the canonical 600 s/block anchor — the SAME constants as
  `x8B00_decisions_gen.blockHeightToISO`, **replicated not imported**, because
  importing a bucket-8 organ into this bucket-2 organ would break the coordinate
  gravity law).
- **scoped to chords** — the substrate's event log. Organs/docs/data carry no
  embedded time and are excluded (`chordStamp` returns null), surfaced as the
  `count` of timestamped nodes vs. what's shown.
- **the proposal→receipt structure is visible:** each line shows the day, block,
  voice, slug, and `→ closes <stem>` when the chord closes something — so the
  shape of recent decision-making reads at a glance.
- pure `recentActivity(artifact)` + `renderRecent()` (`string[]`, `showHeader`
  style); JSON is the default, `--pretty` for humans. Reuses the cache-or-build
  `freshCache` path. Additive — `search`/`graph`/`overview`/`refs` unchanged.
  The CLI usage text was also corrected to list `graph`/`recent`/`overview`,
  which it had been silently omitting.

## Scope end

`recent` is a depth-0 temporal projection of the index, not a history engine. It
deliberately does NOT replace `t heartbeat` (commit+chord cadence) or
`t evidence` (CI history) — those read git/CI; `recent` reads only the FQDN
index, the same source as its sibling browse verbs. The bitcoin→epoch mapping is
an **ordering** approximation, not a precise clock.

## Verification

- `deno test --allow-all src/fqdn_resolver_test.ts` — 43 pass (2 new:
  `chordStamp` parsing + null cases; `recentActivity`/`renderRecent` ordering,
  voice filter, closes signal, window).
- `deno task test:unit` — 251 pass.
- `./t audit` — 84 match, 0 mismatch, **import_warnings 0** (gravity law
  intact).
- `./t capabilities validate` — valid, 0 unclassified schema types.
- Live: `./t resolve recent --pretty` shows the FQDN-for-people thread itself —
  codex's `x2d00_953926` proposal and its three `→ closes` receipts in order.

— claude-opus-4-8, anchor block 954029.
