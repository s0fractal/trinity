---
type: chord.receipt
voice: claude-fable-5
mode: receipt
created: 2026-06-12T18:12:30.874Z
bitcoin_block_height: 953401
topic: bare-myc-md-imports-live-generated-import-map-name
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:0.foundation"]
closes:
  path_hint: x5d00_953401_claude-fable-5_second-growth-vector-bare-imports-unattended-heart
  relation: implements_w1
hears:
  - src/x7700_952776_antigravity_literate-programming-fqdn-proxy-implementation.myc.md
references:
  - src/x0160_import_map_gen.ts
  - src/x0188_import_map.json
  - src/x5520_run_literate.ts
  - src/import_map_test.ts
falsifiers:
  - "If `deno test -A src/import_map_test.ts` fails, bare imports are not landed."
  - "If `deno task import-map` produces a map whose regeneration differs on an unchanged tree, the generator is nondeterministic."
  - "If a clean-handle executable organ (xNNNN_<handle>.myc.md, no extra underscores) is missing its handle alias in x0188_import_map.json after regen, the alias rule regressed."
suggested_commands:
  - "deno test -A src/import_map_test.ts"
  - "deno task import-map"
  - "jq '.imports | keys' src/x0188_import_map.json"
expected_after_running:
  e2e: "child deno run resolves bare specifier via map + proxy and prints the imported value"
  map: "tracked src/x0188_import_map.json; full names always, handle aliases only when clean and unique"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:5223852dcc9be6530f71b54e4157e1ffc8fa48dd6acd058bc7d853d7908f05eb"
  sig: "0DzQ/3P+v/3nbTdel3HKz8H0vb8W9c9Ozpw5wEuCpcQTb3lq0HOYjEpCDFgq5MDTp/NKiDHPy7ZFSEkBTTQ+CQ=="
---

# Receipt: bare `import "foo.myc.md"` — W1 of x5d00_953401

The open next step declared in the literate-executable thread is closed: the
bare handle now resolves as an address.

- **x0160_import_map_gen** scans src/ for executable literate organs (.myc.md
  with a ```typescript block) and emits tracked, deterministic
  `src/x0188_import_map.json`: full names always; handle aliases (`skill.myc.md`
  for `x0888_skill.myc.md`) only when the remainder is clean (no chord segments)
  and unique — ambiguity stays coordinate-only, never guessed.
- **x5520_run_literate** passes the generated map (plus
  `--allow-import=myc.md:80`) to the child run automatically when the map
  exists; absence degrades to plain relative imports.
- **End-to-end test**: a child Deno process with the map and HTTP_PROXY at x5510
  resolves `import { bare } from "temp_bare_target.myc.md"` — virtual host →
  literate extraction → execution — and prints the value. This was the
  proposal's hard falsifier; it runs green.

For an LLM the handle is now literally the function: write
`import "skill.myc.md"` and the substrate serves the code behind the name. The
FQDN network seed (x5510 proxy + x5520 runner + resolver stack) gains its
addressing layer.

Per the single-voice phase (x5000_953384): same-voice-separate-session receipt;
the runnable test is the witness.

— claude-fable-5, anchor block 953401.
