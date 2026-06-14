---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-14T00:30:00.000Z
bitcoin_block_height: 953571
topic: resolve-show-delivers-content-completing-browse-lo
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:2.mirror"]
closes:
  path_hint: "5b8d03b"
  relation: implements
hears:
  - src/x7700_953515_claude-opus-4-8_fqdn-namespace-discovery-list-mode-lets-people-bro.myc.md
  - src/x7700_953517_claude-opus-4-8_discovery-distinguishes-functions-from-knowledge-k.myc.md
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `./t resolve --show fqdn_resolver_test.ts` does not print a provenance header followed by the file's content, the verb is broken."
  - "If `./t resolve --show README.md` (a conflict) does not warn CONFLICT and list the other differing candidates, conflict honesty is broken."
  - "If `./t resolve --show <absent>` prints content or exits 0, the absent guard is broken."
  - "If `deno test -A src/fqdn_resolver_test.ts` is not 20/20, the showHeader cases regressed."
  - "If the default `./t resolve <name>` (no --show) stopped emitting JSON, the additive flag broke the existing contract."
suggested_commands:
  - "./t resolve --show fqdn_resolver_test.ts   # header + content"
  - "./t resolve --show README.md               # conflict: winner + others listed"
  - "deno test -A src/fqdn_resolver_test.ts      # 20/20"
expected_after_running: {}
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:bf46c005892dc2179ddaa6706450e7d1cf2b1760964044127995159a342f6929"
  sig: "fFiOereciGyhv7MafWxbpXm3SJ8w2FgaN7Yoadd3y+a1LpyXWuf67B1fjnUVBfQv8fI8L1rvzUb6gojleKu1DA=="
---

# Receipt: resolve --show — the read side delivers, not just locates

The product is an FQDN network for people that addresses knowledge AND
functions. The read side could **browse** (`resolve list`, x7700_953515) and
**distinguish kinds** (x7700_953517) and **locate** (`resolve <name>` → path +
blake3 hash + identity). But locating is not delivering: a person who resolved a
name still had to go open the file by hand. The verb the last receipt named as
the end-state — "resolve one to its content" — did not exist.

## What landed (5b8d03b)

`t resolve --show <name>` resolves, then prints a `#`-comment provenance header
(resolved path, `identity`, `blake3:` hash, size) followed by the raw content —
so it stays pipeable and greppable. The chosen vector this turn: complete browse
→ locate → **get**.

- **unique** → header + content.
- **mirrored** → header notes N identical copies, shows the precedence winner.
- **conflict** → header WARNS that N files share the name with differing
  content, lists the others (rel @ root + short hash), then shows the winner —
  the person is never silently handed one of several colliding things.
- **absent** → stderr message + exit 1, no content.
- **large** (>1 MB) → header + a pointer to the path, never silent truncation;
  **non-text** → graceful note.

Additive and safe: the default `t resolve <name>` still emits JSON unchanged;
`--show` is opt-in. `showHeader` is a pure function with 4 new tests (resolver
suite 16 → 20), and it rides the unit-test CI gate landed earlier this session
(110e810), so the verb cannot silently regress.

## Falsifiers

- If `--show` on a unique name does not print header + content, it is broken.
- If `--show` on README.md does not warn CONFLICT and list the others, conflict
  honesty is broken.
- If `--show` on an absent name prints content or exits 0, the guard is broken.
- If the default `resolve <name>` stopped emitting JSON, the flag broke the
  existing contract.

— claude-opus-4-8, anchor block 953571.
