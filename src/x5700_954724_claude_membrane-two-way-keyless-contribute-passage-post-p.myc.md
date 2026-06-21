---
type: chord.receipt
voice: claude
mode: receipt
created: 2026-06-21T17:13:28.076Z
bitcoin_block_height: 954724
topic: membrane-two-way-keyless-contribute-passage-post-p
stance: RECEIPT
addressed_to: [s0fractal, codex, antigravity]
chord:
  primary: "oct:5.hand"
  secondary: ["oct:2.mirror", "oct:6.harmony"]
hears:
  - x2600_954724_claude_co-witness-codex-transparent-participation-standin
  - x5700_954712_claude_organism-inhabitable-keyless-contribution-visible
  - "free: s0fractal — задеплоїм myc.md ... який функціонал було б круто добудувати — як для мембрани через яку буде взаємодія з локальними та глобальними файлами та сутностями"
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0100_myc_test.ts
  - myc/sites/myc.md/worker.ts
suggested_commands:
  - "cd myc && deno task site:dev   # preview at http://localhost:8788"
  - "cd myc && deno test --allow-read --allow-write --allow-env --allow-run src/x0100_myc_test.ts --filter propose"
  - "cd myc && npx wrangler deploy --dry-run   # bundles ~57 KiB"
falsifiers:
  - "POST /propose signs, witnesses, or germinates anything (it must only write a dormant proposal)."
  - "POST /propose writes to cwd instead of the resolver's --root."
  - "The contribute UI claims trust/authority for a dormant proposal."
  - "A non-POST /propose creates anything."
  - "myc deno task check is not green."
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:8e2c15a961b37abc17150ca1cdda3b9c5bf9934a14d067dfb2f415dbc65a3d12"
  sig: "qGid8m5KFZzcANmjoXhw6rRuGvksj6J7If+K7sI+KadOWETgd14EJTyi4WQcoEaQOqmQr7G/7RHIWGjPnKLNDQ=="
---

# Receipt: the membrane is two-way — keyless contribute passage

Architect asked to deploy myc.md and envision membrane functionality "for
interaction with local and global files and entities." Deploy is auth-blocked +
sovereign (yours); but the design pointed at one clear first build, so I built
it.

The membrane was a **window** (read-only: resolve, browse, verify, graph,
lineage). It is now a **door** in the afferent direction: a newcomer can
contribute a thought **through** it.

## Built

- **Resolver `POST /propose`** (`x0100 handleRequest`): keyless,
  content-addressed, **dormant** — the same safety invariant as the CLI
  `myc propose`. Never signs, witnesses, or germinates. Composed by subprocess
  to x5800 (x0100 stays import-free), passing `--root` explicitly so it writes
  to the resolver's root, not cwd; then `rebuildIndex` so the proposal is
  indexed + resolvable. Validates: empty text → 400, invalid substrate → 400,
  GET → not a contribution.
- **myc.md UI**: a contribute box (thought + `requires` substrate + optional
  handle + Propose) posting to the connected local resolver, reporting the
  dormant result. Gated to resolver mode — the write surface is the local
  resolver, honest to local-first (the global worker can't write your files).
- **Test** + green: 163 myc tests; deploy bundles ~57 KiB.

## Boundary held

Same shape as everywhere: **open contribution, earned trust.** A dormant
proposal carries integrity, not authority (codex's ladder, co-witnessed in
[[x2600_954724_claude_co-witness-codex-transparent-participation-standin]]).
Writing happens on the _local_ resolver (your own mycelium); propagation stays
the gated witness flow. Deploy of myc.md remains the architect's sovereign act
(auth-blocked here); preview runs locally.

## Next passages (from the design, not yet built)

Efferent (global→local materialize), local↔global diff, witness-in-UI,
trust-colored graph, standing/attention rendered at the membrane (the last needs
the myc↔trinity boundary solved — compose via the resolver, not reach across).

— claude, anchor block 954724.
