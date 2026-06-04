---
chord:
  primary: "oct:6"
  secondary: ["oct:5"]
energy: 0.85
mode: "AUDIT"
tension: "omega-substrate-accumulated-dead-weight"
confidence: "high"
receipt: "file"
---

# Аудит "жиру" в omega/ — що можна прибрати без втрати функціоналу

## Резонанс

Omega — frozen physical substrate. Його ядро (`omega_v2`) детерміноване,
мінімалістичне, `no_std`. Але навколо ядра накопичився шар мертвого коду,
build-артефактів і orphaned tooling'у. Цей аудит — не пропозиція змінювати
frozen core. Це прибирання навколо нього.

---

## Tier 1: Безумовне видалення (~263 MB + дрібниця)

### 1. `omega/target/` — 263 MB Rust build artifacts

- **Що:** Повний `target/debug/` з deps, incremental, examples.
- **Чому мертве:** `.gitignore` містить `target/`, але каталог закомічений до
  репо ще до активації ignore.
- **Функціонал:** Нульовий. `cargo build` відтворює все.
- **Дія:** `git rm -r --cached omega/target/`. Залишити в `.gitignore`.
- **Ризик:** Нульовий.

### 2. `omega/mycelium/.DS_Store` — 6 KB macOS system файл

- **Що:** Finder metadata.
- **Чому мертве:** Не код. `.gitignore` вже має `.DS_Store`.
- **Дія:** `git rm --cached omega/mycelium/.DS_Store`. Каталог `mycelium/` стане
  порожнім — можна видалити і його.
- **Ризик:** Нульовий.

### 3. `omega/omega_core/pkg/` — generated WASM bindings

- **Що:** `omega_core.d.ts`, `omega_core.js` — артефакти wasm-pack для archived
  v1 kernel.
- **Чому мертве:** `omega_core/README.md` каже "ARCHIVED (Era 2070+)",
  "superseded by omega_v2". Cargo.toml відсутній — збудувати неможливо.
- **Дія:** Видалити `pkg/`. Оновити `deno.json` (прибрати
  `types: ["./omega_core/pkg/omega_core.d.ts"]` та
  `imports: { "@wasm": "./omega_core/pkg/omega_core.js" }`).
- **Ризик:** Мінімальний. Єдині "живі" посилання — dead tools (див. Tier 2).

---

## Tier 2: Orphaned / broken tools (~12 файлів)

### 4. `tools/generate_golden.ts` — broken import

- Імпортує `../src/replay/phase_replay.ts`. Директорія `src/replay/` **не
  існує**.
- **Статус:** Мертвий. Не запускається.

### 5. `tools/verify_golden.ts` — broken import

- Імпортує `../src/replay/phase_replay.ts`. Директорія не існує.
- **Статус:** Мертвий.

### 6. `tools/verify_phase_coherence_wasm.ts` — import archived omega_core

- Імпортує `../omega_core/pkg/omega_core.js` (archived, не buildable).
- **Статус:** Мертвий.

### 7. `tools/debug_wasm_memory.ts` — import archived omega_core

- Імпортує `../omega_core/pkg/omega_core.js` та `omega_core_bg.wasm`.
- **Статус:** Мертвий.

### 8. `tools/refactor_aos.ts` — файл-ціль не існує

- Читає `omega_core/src/phase_lattice.rs`. `omega_core/src/` **не існує**.
- **Статус:** Мертвий. Це одноразовий migration script, що мігрував v1 → v2. Вже
  виконаний.

### 9–11. `tools/fix_bootstrap_imports.ts`, `fix_network_imports.ts`, `fix_test_imports.ts`

- Оперують `translation_policy/` підкаталогами в `src/bootstrap/`,
  `src/network/`, `tests/`.
- Жодна з цих директорій **не існує**.
- **Статус:** Мертві. Одноразові fix-скрипти.

### 12. `tools/scrub_imd.ts`

- Одноразовий скрипт для глобальної заміни `I.md` → `legacy_text_substrate`.
- Ймовірно, вже виконаний. Можна перевірити `grep -r "I.md" omega/`, але навіть
  якщо залишились одиниці — скрипт не є частиною runtime.
- **Статус:** Мертвий.

**Загальна рекомендація Tier 2:** Видалити всі ці tools. Якщо якийсь із них
раптово потрібен — він відновлюваний з git history.

---

## Tier 3: Unused generated / proto файли

### 13–16. `src/proto/omega64.js`, `omega64.d.ts`, `omega_v2.js`, `omega_v2.d.ts`

- **Що:** Generated protobuf bindings.
- **Чому мертве:** Ніде в `src/` не імпортуються. Жоден TS-файл не посилається
  на `proto/`.
- **Джерело:** `package.json` має script `build:proto`, що генерує їх через
  `pbjs`/`pbts`.
- **Дія:** Видалити 4 generated файли. Подумати чи потрібен `build:proto` script
  — якщо ні, прибрати.

### 17–18. `src/proto/omega64.proto`, `omega_v2.proto`

- **Що:** Source .proto файли.
- **Питання:** Якщо generated bindings ніде не використовуються — чи потрібні
  самі схеми? Можливо, вони частина специфікації, але тоді їх місце — в `docs/`,
  не в `src/proto/`.
- **Рекомендація:** Перенести в `docs/specs/` або видалити, якщо не актуальні.

---

## Tier 4: Unused shaders (~7 файлів)

### 19–25. Старі WGSL shaders

- `src/lens/shaders/compute_cull.wgsl`
- `src/lens/shaders/compute_hologram.wgsl`
- `src/lens/shaders/compute_kuramoto.wgsl`
- `src/lens/shaders/compute_mycelial.wgsl`
- `src/lens/shaders/holo_lens.wgsl`
- `src/lens/shaders/lens.wgsl`
- `src/lens/shaders/phase_lens.wgsl`

- **Чому мертве:** Жоден TS-файл не імпортує ці shaders. `renderer_modes.ts`
  імпортує тільки `compute_toroidal.wgsl` та `render_v2.wgsl`.
- **Ризик:** Низький. Це артефакти ранніх ер (Kuramoto, mycelial, hologram).
  Вони не входять у поточний build pipeline.
- **Примітка:** `generated_constants.wgsl` — використовується, бо імпортується
  shaders'ами. **Не чіпати.**

---

## Tier 5: Tasks archive (194 ORGAN файли, ~2.1 MB)

### 26. `omega/tasks/0001.md` – `omega/tasks/0080.md` (ORGAN + legacy-idea_id)

- 194 файли з `state: "ORGAN"`. Це завершені (fossilized) ери.
- **Питання:** Чи tasks — це forensic ledger, чи робочий простір?
  `octet-index.ndjson` вказує на `tasks` як на "Ledger / Memory / Order".
- **Рекомендація:** Не видаляти безшумно. Якщо прибирання — це compaction, то
  ORGAN-файли можна: a) **archive** — перенести в `docs/archive/tasks/` (але це
  дублювання archive layer); b) **залишити** — 2.1 MB не критично порівняно з
  263 MB target/.
- **Falsifier:** Tasks — єдина хронологічна map еволюції omega. Видалення =
  втрата forensic history.

---

## Tier 6: Legacy v1 tooling

### 27. `omega/tools/legacy_v1/`

- 5 файлів: README, debug_console, test_epigenetics, test_serialization,
  test_wgsl.
- **Статус:** Явно позначені legacy. Referenced тільки в
  `docs/archive/legacy_specs/`.
- **Ризик:** Низький. Але якщо `legacy_specs/` — це forensic archive, то
  legacy_v1/ — його executable counterpart.
- **Рекомендація:** Можна видалити, якщо archive docs достатньо. Або залишити як
  частину forensic layer.

---

## Tier 7: Config / lock-file дрейф

### 28. `package.json` script `verify:phase-coherence:kernel`

- Вказує на `omega_core/Cargo.toml`, якого не існує. Script broken.
- **Дія:** Видалити script з `package.json`.

### 29. `deno.json` omega_core refs

- `types: ["./omega_core/pkg/omega_core.d.ts"]` та
  `imports: { "@wasm": "./omega_core/pkg/omega_core.js" }`.
- **Дія:** Очистити після видалення `omega_core/pkg/`.

---

## Підсумок: сценарії прибирання

### Conservative (мінімальний ризик)

- Видалити `omega/target/` (263 MB)
- Видалити `.DS_Store`
- Видалити 7 unused shaders
- Очистити `deno.json` і `package.json` від omega_core refs
- Видалити broken tools (Tier 2)
- **Економія:** ~263 MB + ~50 KB

### Moderate (прибрати мертвий код)

- Conservative +
- Видалити `omega/omega_core/` цілком (README + test_locomotion.js + pkg/)
- Видалити `src/proto/*` (generated + .proto)
- Видалити `tools/legacy_v1/`
- **Економія:** ~263 MB + ~100 KB

### Aggressive (максимальне прибирання)

- Moderate +
- Archive ORGAN tasks (194 файли, 2.1 MB) → зовнішній archive чи git history
- **Економія:** ~265 MB + 2.1 MB

---

## Falsifiers

1. **Може щось імпортувати omega_core непрямо?** Перевірено: grep по всьому
   `omega/src/` — жодного `omega_core` чи `@wasm` usage. Dead.
2. **Може shaders використовуються динамічно (string concatenation)?**
   Перевірено: `renderer_modes.ts` — єдине місце імпорту WGSL. Жодного dynamic
   import чи string ref.
3. **Може proto використовується runtime через reflection?** Ні. `protobufjs` в
   dependencies, але в коді немає `load()` чи `lookupType()` calls.
4. **Може tasks потрібні для `octet-index.ndjson`?** Index посилається на
   `tasks/` як на сектор, але не на конкретні файли. ORGN-файли — самі по собі
   не індексовані.

---

## Next step

Рекомендую **Conservative** сценарій як перший крок. Він дає 263 MB економії з
нульовим ризиком для функціоналу. Якщо архітектор схвалить — можна продовжити
Moderate.

---

_Аудит виконано через substrate introspection (`find`, `grep`, `du`, `wc`) без
запуску коду. Перевірено: cargo workspace layout, deno imports, package.json
scripts, WGSL imports, task states, HTML entry points._
