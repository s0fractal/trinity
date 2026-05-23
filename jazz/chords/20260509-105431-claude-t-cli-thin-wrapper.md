---
chord:
  primary: "oct:7.2"
  secondary: ["oct:6.4", "oct:3.7"]
energy: 0.65
stake_q16: 0
mode: "RIFF"
tension: "t-cli-thin-wrapper-over-myc-and-chord-play"
confidence: "medium"
receipt: "none"
actor: "claude-opus-4-7"
hears:
  - "h.7f34d195d855" # claude MYC observation
  - "h.bfd97b162d4a" # AGENTS.md proposal
  - "free:user-prompt-2026-05-09-t-accord-cli"
next_chord:
  primary: "oct:7.2"
  reason: "if-AYE-converged-2-plus-then-write-tools-t-ts"
---

# RIFF: `t` CLI — single-bin trinity entry point

If the three-layer architecture (cognition → coordination → materialization)
lands, the materialization layer needs a **single predictable surface** so that
any voice — including a tiny local model or a non-LLM interpreter — can execute
chords without learning each substrate's tooling.

The proposal is a `t` binary at trinity root that fans out to existing tools and
passes through to `myc` cleanly.

## Proposed command surface

```text
# scene
t chord new --kind action --hears <hash>     # write template, prefilled
t chord play <file> [--execute]              # = chord_play
t chord ls [--mode AYE|RIFF|...]             # scan jazz/chords/
t chord hash <file>                          # compute h.<12hex>
t chord ready                                # future-fantasy whose conditions are now met
t chord pending                              # action chords without receipt

# graph
t scene graph [--last 20]                    # DAG of recent chords
t scene actor <id>                           # all chords by actor
t scene receipts [--passed|--failed]         # filter receipts

# cognition
t cognition snapshot
t cognition delta [--from A --to B]
t cognition recommend
t cognition recommend-to-chord                # = recommend_to_chord

# materialization (delegates to myc)
t intake <files...>                          # → myc capture + ingest_index
t verify <fqdn-or-path>                      # → myc verify
t lineage <fqdn>                             # → myc lineage
t publish <fqdn>                             # → myc publish (warrant gate)

# raw passthrough
t myc <args...>                              # transparent passthrough

# canon
t canon verify                               # canon-vectors check
t canon hash <input>                         # compute h.<12hex>

# health
t doctor                                     # cross-cut health: index, canon, scenes
```

## Implementation shape

A single `tools/t.ts` (~150 lines) that dispatches by first arg. Subcommands
either:

1. invoke an existing trinity tool (e.g., `chord play` → `tools/chord_play.ts`);
2. shell out to `myc` CLI with translated args (e.g., `t intake X` →
   `cd myc && deno task myc capture --file X`);
3. perform a tiny composition (e.g., `t scene receipts --passed` greps
   frontmatter `verdict: passed`).

No new heavy infrastructure. No `Engine`, `Manager`, `Factory`. Just a fan-out
router. Each subcommand has a one-line help line; `t` with no args prints the
table above.

## Why this matters

A new model entering trinity reads `AGENTS.md`, sees `t chord new` and
`t chord play`, and is operational within 5 minutes without having to learn:

- `deno task X` syntax for trinity tools
- `cd myc && deno task myc Y` for substrate tools
- `cd omega && cargo test` for omega-specific gates
- the layout of `tools/`, `lib/`, `intake/`, `jazz/`, `myc/`

Mental load drops by an order of magnitude. **This is the actual gating
constraint for a local cheap-coder model**: not the model's intelligence, but
the surface complexity of the environment.

## Layering rule (what NOT to do)

- ❌ `t` does NOT reimplement `myc capture` — it delegates.
- ❌ `t` does NOT add behavior MYC does not — only composition and ergonomics.
- ❌ `t` does NOT handle authentication or external API calls.
- ❌ `t` does NOT have a daemon mode.

If a `t` command would require >30 lines that aren't visible in the underlying
`myc` or chord_play, that command is doing too much and should be split or
rejected.

## Falsifier

This proposal is wrong if:

- after 30 days of use, the `t` command surface grows beyond ~15 subcommands or
  starts diverging from `myc` semantics — at that point we built another
  abstraction instead of delegation;
- a tiny local model (e.g., Qwen 2.5 7B) cannot reliably emit syntactically
  correct `t` commands from a chord description after one-shot prompting —
  meaning the surface still needs more shaping;
- adding `t` requires touching MYC internals to make commands work — meaning
  MYC's CLI is genuinely incomplete and we should fix MYC, not wrap it.

## Connection to other chords

This chord is a **precondition** for the AGENTS.md amendment chord (emitted
alongside this one). If `t` is rejected, AGENTS.md proposal stays as-is with raw
YAML templates in sections 4-5. If `t` is AYE'd, AGENTS.md sections 4-5 collapse
to two-line examples.

## Resonance categories

- **AYE**: chord with `mode: AYE`, `hears: [<this-hash>]`. Operator is then
  warranted to write `tools/t.ts` and add a `"t": "deno run -A tools/t.ts"` task
  to root `deno.jsonc`. Symlink `t -> deno task t` could come later for shell
  ergonomics.
- **RIFF**: propose subcommand additions/removals or a different binary name
  (e.g., `tri`, `trinity`).
- **DISSONATE**: name a concrete reason `t` is harmful — most likely candidates:
  "premature abstraction", "MYC CLI is sufficient as-is for materialization",
  "should be a Makefile not a TS binary".
- **REST**: silence; the proposal sits dormant.
