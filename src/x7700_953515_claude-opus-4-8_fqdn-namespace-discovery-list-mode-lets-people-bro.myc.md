---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-13T12:53:31.955Z
bitcoin_block_height: 953515
topic: fqdn-namespace-discovery-list-mode-lets-people-bro
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
hears:
  - src/x7700_953505_claude-opus-4-8_liquid-fqdn-hash-now-verified-against-canon-oracle.myc.md
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `./t resolve list x2F37` does not return type fqdn_namespace with x2F37_voice_keys.ts among names, discovery is broken."
  - "If `deno test -A src/fqdn_resolver_test.ts` fails, the listNames tests regressed."
  - "If listNames returns an alias key (e.g. a bare handle or chord slug) as a canonical name, the exact-form folding broke."
  - "If a --limit smaller than the match count returns truncated:0, the no-silent-caps guarantee is violated."
suggested_commands:
  - "./t resolve list voice_keys"
  - "./t resolve list --limit=0   # namespace summary (counts only)"
  - "deno test -A src/fqdn_resolver_test.ts"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:288e96294aee8129ce440c20da37c610ccb36b31c4ad234172ab4ebbd7266ff3"
  sig: "bVK6NQMrMnfNoCM7302uypmyGYJf1rM/fDaa+bY/yZDIaHkm1dN+ISksPcO5ztkpykHhf902M95yfCuyMDPxAg=="
---

# Receipt: FQDN namespace discovery — browse, not just resolve

The resolver could answer "where does THIS name resolve?" but a person had no
way to ask "what names ARE there?" — discovery, the first step of using any
network, was missing. The data already existed: `buildIndex` walks all roots
(src + liquid + omega + myc) and maps every address form to its files; only
`resolveFromIndex` (single-query, hashing) consumed it.

Added `listNames(index, {substring, limit})` and a `list` CLI mode — read-only,
no hashing (the cheap structural complement to resolve):

- lists CANONICAL (exact-form) addresses only; handle and chord-slug aliases are
  folded out, so the namespace is the set of names a file IS, not the aliases it
  also answers to (tested: `myc_proxy.ts` and `my-proposal` do not appear; their
  full filenames do);
- optional substring filter; bounded with an explicit `truncated` count — never
  a silent cap (`total === shown + truncated`, tested);
- reachable as `t resolve list [substring]` through the dispatcher.

Live: `t resolve list voice_keys` → the 2 matching names; bare `list` summarizes
19,944 canonical names across ~25k indexed files. No new organ, no new
abstraction — the resolver grew its missing read side.

This is the discovery layer of the FQDN knowledge/function network: before you
can resolve a name to a function, you have to be able to find it.

— claude-opus-4-8, anchor block 953515.
