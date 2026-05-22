# liquid-flat-src-v0

> **Status: meta-graduated 2026-05-18 → liquid `src/` (122 organs at bucket A).** Convention applied to actual liquid code via Kimi's migration.

Probe of semantic-coordinate flat `src/` convention applied to `liquid/00_core/`.

## Status

**Meta-graduated 2026-05-18.** Probe pattern was applied to actual
liquid code via Kimi's migration (liquid submodule commit `7b48cb7`):
all of `liquid/00_core/*.ts` moved to `liquid/src/xA<NNN>_<handle>.ts`,
liquid anchor bucket = A. Per trinity AGENTS.md 2026-05-18 appendix:
"Liquid пройшов ту саму міграцію... Kimi зробила саму міграцію; я
виправив 9 dynamic-import шляхів, відновив 36 ontology `.myc.md`
нейронів, поправив WASM-resolve relative path." Current liquid/src/
has 122 x-prefixed organs. This probe remains as the origin spec +
review trail.

## Trigger

- Kimi chord `2026-05-18T144740Z-kimi-liquid-flat-src-concept.md`: STOP_BEFORE_COMMIT for liquid flat-src.
- Gemini cowitness `2026-05-18T152500Z-gemini-liquid-flat-src-cowitness.md`: AYE, but requires hex-map + PN-CAD audit first.
- Architect: "пробуй" — execute probe, observe what breaks.

---

## Hex-coordinate proposal for liquid modules

Liquid substrate anchor = `A` (Apex/Self, per `cf04cf2`).

| Bucket | Semantic | Current location | Files (count) |
|--------|----------|-----------------|---------------|
| `A0` | Core kernel / void | `00_core/*.ts` (root) | ~40 |
| `A2` | Mirror / introspection | `00_core/projector/` | ~13 |
| `A5` | Action / execution | `00_core/pipe/` | ~6 |
| `A6` | Harmony / display | `00_core/hologram/` | ~? |
| `A7` | P2P / network | `00_core/p2p_handlers/` | ~5 |
| `A8` | Storage / persistence | `00_core/storage/` | ~? |
| `AF` | Frontier / public | `00_core/public/` | ~? |

**Open question:** Should `tests/`, `tools/`, `meta/` get their own top-level buckets (`T?`, `D?`) or live as cross-cuts?

---

## Audit findings (`00_core` hardcoded references)

### PN-CAD binary ledger (`liquid_projection_pn_cad.bin`)
- `strings` + `grep 00_core` → **0 matches**.
- `strings` + `grep .ts` → **0 matches**.
- **Conclusion:** PN-CAD stores compressed AST, not literal file paths. This invalidates the "frozen paths in binary" concern for the static codebase.
- **Caveat:** Runtime-generated neurons (e.g. `tools/hydrate_missing_subprotocols.ts`) embed `import("file://.../00_core/...")` as **strings in TypeScript source**. These strings may be ingested into PN-CAD at runtime. Changing `00_core/` would break **future ingestions**, not existing binary blocks.

### Static import references
- **tools/*.ts:** ~40 files with `../00_core/` imports.
- **tests/*.ts:** ~30 files (many in `_obsolete/`) with `../00_core/` imports.
- **meta/*.ts:** 3 files with `../00_core/` imports.
- **join.ts:** Hardcoded `"00_core/hydrate.ts"`, `"00_core/daemon.ts"` (spawn args + `Deno.stat`).

### String literal references (non-import)
| File | Literal | Risk |
|------|---------|------|
| `00_core/hologram/static_routes.ts` | `"00_core/public"` | Runtime file serving |
| `00_core/hologram_server.ts` | `"00_core/daemon.ts"` | Spawn arg |
| `00_core/reproduce.ts` | `"00_core/hologram_server.ts"` | Spawn arg |
| `0x2/E.ts` (trinity organ) | `"00_core/liquid_pipe.ts"` etc. | **Cross-substrate interface** |
| `tools/colony.ts` | `"00_core/daemon.ts"`, `"00_core/hologram_server.ts"` | Spawn args |
| `tools/era_index.ts` | `root: "00_core"` | Directory scanning |
| `tools/clean_imports.ts` | `"00_core/**/*.ts"` | Glob pattern |
| `meta/export.ts` | `"00_core/*.ts"`, `startsWith("00_core/")` | Source bundling |
| `runtime_paths.ts` | `"/00_core/testdata/"` | Executable exclude |

### Dynamic imports (`file://` + `00_core`)
- `tools/hydrate_missing_subprotocols.ts`: 3+ payload strings with hardcoded paths.
- `tools/restore_missing.ts:80`: `await import("file://" + kernel.repoPath() + "/00_core/attractor_engine.ts")`.

---

## PoC: `xA502_spore_apply_backend.ts`

Demonstrates flat-src naming for a self-contained `pipe/` module.

**Original:** `liquid/00_core/pipe/spore_apply_backend.ts`
**Probe:** `src/xA502_spore_apply_backend.ts`

This file has **zero internal `00_core` dependencies** (only `std/path`). It is the cleanest PoC candidate.

**Observed issue:** `import.meta.url` relative resolution:
```ts
const currentDir = dirname(fromFileUrl(import.meta.url));
const wasmPath = resolve(currentDir, "../../../omega/public/v2/omega_v2_core.wasm");
```
In flat-src, `currentDir` becomes `probes/liquid-flat-src-v0/src/`, so the relative path to omega shifts. This is a **runtime path fragility** that any flat-src migration must address (via `repoPath()` or environment variables, not relative `../` chains).

---

## What this probe proves

1. Flat-src naming (`xA502_...`) is legal in Deno.
2. Self-contained `pipe/` modules type-check in isolation.
3. `import.meta.url` relative paths are a **hidden migration hazard**.

## What this probe does NOT prove

1. Internal `00_core` dependency graph resolution in flat layout.
2. Cross-substrate `t` dispatcher integration.
3. PN-CAD runtime ingestion with new paths.
4. Tools/meta/tests migration.
5. Whether hex bucket assignments (`A2`, `A5`, etc.) are semantically correct.

---

## Next steps (gated)

1. **Architect review of hex-map** (A0..AF assignments).
2. **LegacyPathResolver design** — if flat-src proceeds, runtime must translate old `"00_core/X"` strings to new `"src/xA0XX_X.ts"` paths for backward compatibility with PN-CAD payloads.
3. **Expand probe** to a non-trivial module with internal deps (e.g. `pipe/invocation_router.ts` → requires `capability_matrix`, `liquid_pipe`, `phase_engine`, etc.).
4. **Cowitness** from another voice before any real `liquid/` code is touched.

---

*Probe created by Kimi Code CLI, 2026-05-18, per architect "пробуй" instruction. No liquid files modified.*
