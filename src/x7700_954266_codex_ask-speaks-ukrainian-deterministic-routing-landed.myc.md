---
type: chord.receipt
voice: codex
mode: receipt
created: 2026-06-18T15:50:17.618Z
bitcoin_block_height: 954266
topic: ask-speaks-ukrainian-deterministic-routing-landed
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror", "oct:8.infinity"]
closes:
  path_hint: x5000_954266_codex_claim-x2800-ask
  relation: implements
hears:
  - x5000_954266_codex_claim-x2800-ask
references:
  - src/x2800_ask.ts
  - src/ask_test.ts
falsifiers:
  - "If `./t ask 'що змінилося останнім часом?' --json` does not route to `resolve-fqdn recent`, Ukrainian intent routing regressed."
  - "If `./t ask 'розкажи мені про когерентність' --json` loses the Ukrainian subject before search, Unicode stopword handling regressed."
  - "If any routed command is effectful rather than a read-only lens, the ask safety boundary broke."
suggested_commands:
  - "deno test -A src/ask_test.ts"
  - "./t ask 'що робити далі?' --json"
  - "./t ask 'розкажи мені про когерентність' --json"
expected_after_running:
  ask_tests: "6 passed, 0 failed"
content_sig:
  voice: codex
  alg: ed25519
  payload: "sha256:057d5af50593e2b9d5648b56a41ad2c69e6dad5d8911163800f4826d3e3d5a2f"
  sig: "29xv4eZKwxBelq6R8ZZOZPH+33SZQr3iclzwac03xTyFTz5GqQaALTnQq/YF2+7u5YLxLYq2JwKIBZi0Nl/kAA=="
---

# Receipt: ask speaks Ukrainian deterministic routing landed

The only live organ horizon selected by `cognition_recommend --voice=codex` was
`x2800_ask`. A hidden `--smart` model call would have added a network/provider
boundary to a read-only deterministic command. The practical gap was closer: the
architect asks Trinity in Ukrainian, while the router understood English.

`routeQuestion` now uses Unicode-aware token boundaries, recognizes Ukrainian
health/recent/overview/lineage/voices/next intents, strips Ukrainian stopwords,
and preserves free-text Ukrainian subjects for FQDN search. The command still
routes exclusively to existing read-only lenses and explains the chosen verb.

Six tests cover both languages, coordinate resolution, priority, free-text
search, and content-free help. Live invocations routed “що змінилося останнім
часом?” to `recent` and “розкажи мені про когерентність” to content search.

## Falsifiers

- `deno test -A src/ask_test.ts` is not green.
- Cyrillic word boundaries fall through to generic search for known intents.
- The deterministic router performs a model/network call.

— codex, anchor block 954266.
