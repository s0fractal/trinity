---
chord:
  primary: "oct:6"
  secondary: ["oct:5"]
energy: 0.92
mode: "PATCH"
tension: "omega-substrate-fat-removal-executed"
confidence: "high"
receipt: "file"
---

# Receipt: Видалення "жиру" з omega/ — виконано

## Що зроблено

### Build artifacts (~263 MB)

- **Видалено:** `omega/target/` — Rust debug build artifacts (263 MB). Не був
  tracked git'ом, але займав ФС.

### System files

- **Видалено:** `omega/mycelium/.DS_Store` + порожній каталог `mycelium/`.

### Orphaned omega_core (~24 KB + dead refs)

- **Видалено:** `omega/omega_core/` цілком (README, test_locomotion.js,
  .cargo/config.toml, Cargo.lock, pkg/omega_core.d.ts, pkg/omega_core.js).
- **Очищено:** `deno.json` — прибрано
  `types: ["./omega_core/pkg/omega_core.d.ts"]` та
  `imports: { "@wasm": "..." }`.
- **Очищено:** `package.json` — прибрано `verify:phase-coherence:kernel`
  (посилався на `omega_core/Cargo.toml`).

### Broken / orphaned tools (9 файлів)

- **Видалено:**
  - `tools/generate_golden.ts` — broken import `src/replay/phase_replay.ts`
  - `tools/verify_golden.ts` — broken import `src/replay/phase_replay.ts`
  - `tools/verify_phase_coherence_wasm.ts` — import archived omega_core
  - `tools/debug_wasm_memory.ts` — import archived omega_core
  - `tools/refactor_aos.ts` — читав `omega_core/src/phase_lattice.rs` (не
    існувало)
  - `tools/fix_bootstrap_imports.ts` — оперував неіснуючою
    `src/bootstrap/translation_policy/`
  - `tools/fix_network_imports.ts` — оперував неіснуючою
    `src/network/translation_policy/`
  - `tools/fix_test_imports.ts` — оперував неіснуючою
    `tests/translation_policy/`
  - `tools/scrub_imd.ts` — одноразовий скрипт, виконаний
- **Очищено:** `package.json` scripts — прибрано `generate:phase-goldens`,
  `verify:phase-coherence:wasm`, `verify:phase-coherence`, `verify:phase-stack`,
  `verify:golden`.

### Legacy v1 tools

- **Видалено:** `tools/legacy_v1/` (README, debug_console.ts,
  test_epigenetics.ts, test_serialization.ts, test_wgsl.ts).

### Proto pipeline (мертвий)

- **Видалено з git:** `src/proto/omega64.js`, `omega64.d.ts`, `omega_v2.js`,
  `omega_v2.d.ts` (generated, ніде не імпортувались).
- **Архівовано:** `src/proto/omega64.proto` →
  `docs/archive/specs/omega64.proto`, `omega_v2.proto` →
  `docs/archive/specs/omega_v2.proto` з README.
- **Очищено:** `package.json` — прибрано `build:proto` script.
- **Видалено порожній каталог:** `src/proto/`.

### Operational log (accidentally tracked)

- **Видалено:** `history.jsonl` (runtime log, 1802 байти, 0 рядків).
- **Додано:** `history.jsonl` в `.gitignore`.

### Unused WGSL shaders — архівовано, не видалено

- **Перенесено:** 7 shaders з `src/lens/shaders/` → `docs/archive/shaders/`:
  - `compute_cull.wgsl` — GPU indirect instancing culling
  - `compute_hologram.wgsl` — 3D volumetric texture splatting
  - `compute_kuramoto.wgsl` — 497 рядків: quantum fidelity, genetic resonance,
    mycelial coupling, sandbox physics, adaptive biology
  - `compute_mycelial.wgsl` — GPU workgroup-local clustering (atomic reduction)
  - `holo_lens.wgsl` — volumetric slice renderer з polar mapping
  - `lens.wgsl` — fullscreen HSV phase lens з epigenetics
  - `phase_lens.wgsl` — 269 рядків: instanced billboards, chrono-torus, shadow
    network, Akashic field, quantum eye
- **Створено:** `docs/archive/shaders/README.md` з поясненням "чому це круто і
  чому archived".

**Примітка:** Це не мертвий код у звичайному сенсі — це прототипи майбутніх ер
(Era 300–900), застиглі у формі WGSL. Вони використовують v1 SoA layout і мають
polyfill stubs, тому несумісні з v2. Archive зберігає intellectual property для
майбутніх cherry-pick.

---

## Статистика

| Категорія       | Файлів   | Обсяг   | Дія                    |
| --------------- | -------- | ------- | ---------------------- |
| Build artifacts | 1 dir    | ~263 MB | `rm -rf`               |
| omega_core      | 6 файлів | ~24 KB  | `git rm -r` + `rm -rf` |
| Broken tools    | 9 файлів | ~15 KB  | `git rm` + `rm`        |
| Legacy v1       | 5 файлів | ~20 KB  | `git rm -r` + `rm -rf` |
| Proto generated | 4 файли  | ~300 KB | `git rm` + `rm`        |
| Proto schemas   | 2 файли  | ~6 KB   | `git mv` → archive     |
| Shaders         | 7 файлів | ~1.2 KB | `git mv` → archive     |
| System/misc     | 2 файли  | ~8 KB   | `git rm` + `rm`        |
| Config cleanup  | 2 файли  | —       | `StrReplaceFile`       |

**Загальна економія ФС:** ~263.5 MB + дрібниця.

---

## Falsifiers (що могло піти не так)

1. **`target/` не відтворюється?** Відтворюється через
   `cargo build --workspace`.
2. **Щось імпортує omega_core?** Перевірено grep'ом по всьому `src/` та `tools/`
   — ні.
3. **Щось імпортує видалені tools?** Перевірено `package.json`, `deno.json`,
   `src/` — ні.
4. **Щось імпортує proto?** Перевірено — ні. `protobufjs` в dependencies, але
   zero imports в коді.
5. **Shaders потрібні динамічно?** Перевірено `renderer_modes.ts` — імпортує
   тільки `compute_toroidal.wgsl` та `render_v2.wgsl`. Жодного dynamic import.
6. **`.proto` файли потрібні для spec?** Архівовано в `docs/archive/specs/` з
   README — збережено як forensic spec.

---

## Git status (truncated)

```
 M .gitignore
 M deno.json
A  docs/archive/shaders/README.md
A  docs/archive/shaders/compute_*.wgsl
A  docs/archive/shaders/holo_lens.wgsl
A  docs/archive/shaders/lens.wgsl
A  docs/archive/shaders/phase_lens.wgsl
A  docs/archive/specs/README.md
R  src/proto/omega64.proto -> docs/archive/specs/omega64.proto
R  src/proto/omega_v2.proto -> docs/archive/specs/omega_v2.proto
D  history.jsonl
D  mycelium/.DS_Store
D  omega_core/...
 M package.json
D  src/lens/shaders/compute_*.wgsl
D  src/lens/shaders/holo_lens.wgsl
D  src/lens/shaders/lens.wgsl
D  src/lens/shaders/phase_lens.wgsl
D  src/proto/omega64.d.ts
D  src/proto/omega64.js
D  src/proto/omega_v2.d.ts
D  src/proto/omega_v2.js
D  tools/debug_wasm_memory.ts
D  tools/fix_*.ts
D  tools/generate_golden.ts
D  tools/legacy_v1/...
D  tools/refactor_aos.ts
D  tools/scrub_imd.ts
D  tools/verify_golden.ts
D  tools/verify_phase_coherence_wasm.ts
```

---

## Next step

Git commit з повідомленням типу:

```
omega: remove accumulated dead weight

- rm target/ (263MB build artifacts)
- rm omega_core/ (archived v1 kernel)
- rm 9 broken tools (orphaned imports)
- rm legacy_v1/ tools
- rm proto generated bindings + archive .proto schemas
- rm history.jsonl + ignore
- archive 7 vision shaders to docs/archive/shaders/
- clean deno.json / package.json from dead refs
```

_Виконано за запитом архітектора. Жоден frozen invariant не порушено._
