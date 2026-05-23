# flat-src-v0

> **Status: meta-graduated 2026-05-18.** The convention itself became the
> substrate layout — trinity's entire `src/` (now 61+ organs) follows this
> naming. There is no single live organ to point at; the directory structure IS
> the graduation. See AGENTS.md 2026-05-18 appendix for the migration narrative.
> This probe remains as the origin spec.

Probe of semantic-coordinate flat `src/` convention.

## Convention

```
x<4-hex-coordinate>_<snake_human_name>.<ext>
```

- Leading `x` is a **language-safe coordinate sigil** — makes filenames legal as
  identifiers in TS, Rust (`mod x4321_phi_bridge;`), Python, etc. Not part of
  the semantic coordinate.
- Semantic coordinate is the 4 hex digits (`4321`); `x` is filesystem/identifier
  token only.
- One shallow `src/` directory per substrate. No nested folders.
- Each file paired with `.md` (doc) and `.test.ts` (test) under the same prefix.
- Auto-generated `xX000_mod.ts` aggregator per first hex digit (one re-export
  bucket).
- Position `xX000` across all archetypes is **reserved** for the aggregator.
  User code lives at `xX001+`.

## Topological N-1 rule

- **Same-bucket access**: direct filename import. `x4322_*.ts` imports
  `./x4321_*.ts`.
- **Cross-bucket access**: via `@xN` alias → `./src/xN000_mod.ts` aggregator.
- No `../` upward escape. No deeply nested folders.

The aggregator is the only "membrane" between archetype buckets. Auto-generation
means it never goes stale.

## Layout

```
src/
  x0000_mod.ts            # AUTO-GENERATED (aggregator for bucket 0)
  x0042_dispatch.ts       # void/primitives
  x0042_dispatch.md
  x0042_dispatch.test.ts
  x0100_glossary.ts       # same bucket as x0042
  x4000_mod.ts            # AUTO-GENERATED (aggregator for bucket 4)
  x4321_phi_bridge.ts     # foundation (imports @x0)
  x4322_schema_check.ts   # same bucket as x4321 (imports ./x4321 directly)
  xA000_mod.ts            # AUTO-GENERATED (aggregator for bucket A)
  xA04A_narrative.ts      # apex (imports @x0 and @x4)
```

## Tasks

```
deno task --config=probe.jsonc gen    # regenerate aggregators after add/remove
deno task --config=probe.jsonc test   # run all *.test.ts under src/
```

Probe config is named `probe.jsonc` (not `deno.jsonc`) to avoid auto-discovery
by the trinity-root workspace. Lock churn isolated to
`probes/flat-src-v0/deno.lock` (small).

## What this probe demonstrates

1. **Flat `src/` works** — Deno resolves filenames with `x` prefix,
   IDE/typecheck happy.
2. **`xX000_mod.ts` auto-generation** — no manual aggregator maintenance.
3. **`@xN` alias resolves through aggregator** — cross-bucket import chain
   executes.
4. **Code/doc/test triplet** — natural co-location by prefix, `ls src/x0042*`
   shows all three.
5. **Same-bucket direct import** allowed (no false friction within an
   archetype).
6. **Cross-language uniform** — same convention works for TS, Rust, Python
   without per-language shims.

## What this probe does NOT demonstrate

- Migration from existing deep-folder code.
- Cross-substrate dispatch (`t call` / `t apply`).
- Audit verifying prefix matches semantic content.
- Actual omega Rust use of `x4000_*.rs` files in real cargo build (separate
  probe).

## Tweaks applied (from cowitness)

- **Codex**: "semantic-coordinate flat src" naming (not "content-addressed");
  two-lane (static-within / dispatch-cross-substrate); metadata in `.md`
  sidecar; `x` prefix as language-safe sigil; isolated probe config to keep root
  lock clean.
- **Gemini**: variant (a) recursive archetype refinement for digits 2-4;
  aggregator-as-membrane between buckets (not free-for-all).
- **Architect**: uniform 4-hex format extended to aggregator (`xX000_mod.ts`),
  not `mod_X.ts` exception.
