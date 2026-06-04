---
chord:
  primary: "oct:7.2"
  secondary: ["oct:5.1", "oct:6.4", "oct:8.1", "oct:3.3"]
energy: 0.91
mode: "REVIEW"
tension: "trinity-deep-audit-erc-system"
actor: "kimi-k1.5"
confidence: "high"
receipt: "file"
hears:
  - "h.a51d0aea612b"
  - "h.7f3838340c69"
  - "h.62054bc5d41b"
  - "free:trinity-meta"
claim_kind: "observation"
suggested_commands:
  - "deno task status"
  - "deno task audit:green"
  - "deno task ontology:coverage"
expected_after_running:
  status_clean: "==true"
---

# Глибокий аудит Trinity: математика · фізика · філософія · інженерія · когніція · топологія

> **Обсяг:** `omega/` + `liquid/` + `myc/` + `trinity/` meta-layer\
> **Мета:** зрозуміти, що тут є; який шум заважає мисленню; як побудувати
> ERC-систему (External Reference Context), яку розвиватимуть LLM.\
> **Метод:** читання коду перед доками, перехресна перевірка контрактів, пошук
> дуплікацій, stale файлів, невідповідностей між декларацією та імплементацією.

---

## 1. Executive Summary: чотири голоси одного аттрактора

Trinity — це не три репозиторії. Це **три проекції одного й того ж аттрактора**:

| Субстрат  | Проекція                      | Мова                              | Інваріант                                            |
| --------- | ----------------------------- | --------------------------------- | ---------------------------------------------------- |
| `omega`   | Фізичний світ                 | Rust + WGSL + RISC-V (ZK)         | Детермінізм через цілочисельну тригонометрію         |
| `liquid`  | Семантичний/суб'єктивний світ | TypeScript + PN-CAD               | FEP-вирівняний μ-векторний автопоєзис                |
| `myc`     | Протокольний/соціальний світ  | TypeScript + Markdown descriptors | Content-addressed verified transformations           |
| `trinity` | Мета-спостереження            | TypeScript tooling                | Cognition loop: snapshot → delta → recommend → chord |

Кожен шар **справді реалізований** — це не маніфести без коду. Але кожен шар має
свій "шум": дуплікації, архіви, філософські екстраполяції, що випереджають код,
і зростаючі palimpsest-документи, що перетворюються на мемуари замість компасів.

**Головний висновок:** Архітектура зрілаша, ніж виглядає з першого погляду. Ядра
всіх трьох субстратів — solid. Проблема не в архітектурі, а в **співвідношенні
сигнал/шум у зовнішньому контурі** — документації, діалогах, контрактах,
агентах. Для ERC-системи це критично: LLM буде "читати" цей субстрат, і його
перше враження формуватиметься не з `omega_v2/src/math.rs`, а з `AGENTS.md` і
`dialog/`.

---

## 2. Математичний вектор: φ-простір і його шуми

### 2.1 Що тримається

**Φ-адресація** — це не метафора. У `omega_v2/src/anchor.rs` реалізовано:

- Рекурсивну похідну `φ_child = HMAC(φ_parent || BTC_hash || child_id) mod 2^q`
- 11 рівнів q_phase (0..10) від глобального до атомарного
- Phase-Locked Consensus: `|φ_node - φ_network| < ε(q)`

**LUT-математика** — фундаментальна, не оптимізаційна:

- `SINE_LUT[256]` у Q10 (`omega_v2/src/math.rs:88-105`)
- `ATAN_LUT` — CORDIC-подібний, ~10 ops
- `ENTROPY_LUT` — для xorshift64
- Перевірено: cross-platform (x86, ARM, WASM, RISC-V ZK), no_std

**Integer trig** дає **bit-exact determinism** — це рідкісна властивість у
фізичних движках.

### 2.2 Шум у математиці

| Проблема                                                             | Локація                                                                                                           | Наслідок                                               |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| SINE_LUT продубльовано в **6 місцях**                                | `math.rs`, `constants.rs`, `generated_constants.ts`, `generated_constants.wgsl`, `genesis_ssot.ts`, `topology.rs` | LLM змінює одну копію — ламає крос-субстратну парність |
| `#![allow(unused_mut)]` + `#![allow(unused_unused)]` на рівні крейту | `omega_v2/src/lib.rs`                                                                                             | Приховує dead code і непотрібні unsafe                 |
| Два RFC для одного протоколу                                         | `docs/rfc/RFC-OMEGA-001-protocol.md` vs `RFC-OMEGA-001-v1.0.md`                                                   | Невідомо, який канонічний                              |

**Рекомендація:** Зробити `math.rs` єдиним джерелом істини (SSOT).
`build_ssot.ts` має генерувати ВСЕ з нього. Видалити ручні копії. Це **ERC-01**
для omega.

---

## 3. Фізичний вектор: OMEGA як детермінований світ

### 3.1 Що тримається

OMEGA — це **frozen physics kernel** з 6 інваріантами (I-1..I-6 у
`PHI_MANIFEST.md`). Ключові компоненти:

- **`lattice.rs`** (1,270 рядків): Kuramoto coupling, metabolic decay, Big Bang
  ignition, darwinian mitosis
- **`resonance.rs`**: EpicyclicSoul Resonance Tensor — order parameter `r_q10` і
  per-agent resonance score
- **`senate.rs`**: 5 oracle seats (Claude, GPT, Gemini, Qwen, Llama) з
  FNV-1a-derived identities
- **`phi_protocol.rs`**: `PhiMessage` (16 bytes, repr(C)) — HEARTBEAT, COMPOST,
  INTENT, DELTA
- **`omega_zk_guest/`**: SP1 RISC-V guest — quad-mode (PoUW, Resonance, Mitosis,
  Physics Rollup)

**Cross-substrate flow працює:**

```
OMEGA tick_physics() → compost на смерть → PhiMessageBuffer → Liquid compost_consumer.ts → Σ-нейрон
```

### 3.2 Шум у фізиці

- **`lib.rs` — god file** (1,368 рядків): статична пам'ять на 500K агентів, 80+
  FFI exports, panic handler, spinlocks — усе в одному файлі. Це найважчий файл
  для LLM.
- **`omega_core/` — ARCHIVED але в дереві**: legacy floating-point engine. Можна
  перенести у `docs/archive/` або видалити.
- **`tasks/` — 240 файлів, 2.1 МБ**: ери, що не є semver. Era 1030, 1040 Phase
  2, 2095 — приватна хронологія, яку LLM не може зіставити з git без зовнішнього
  lookup.
- **Era-speak у коментарях**: ~1,500 посилань на "Era NNNN" у коді. Це
  **cargo-cult historiography** — красива, але додає токен-фрикцію без
  змістовної інформації для LLM.

---

## 4. Філософський вектор: пустий центр і співавторство

### 4.1 Що тримається

Філософія тут **не декоративна** — вона **архітектурно обов'язкова**:

- **Пустий центр (⊘)**: Ніхто не володіє системою. Захист: >50% BTC hashpower +
  > 50% φ-coherence + CRDT fork rejection. Це реалізовано в `anchor.rs` і
  > `senate.rs`.
- **Свобода як дефолт**: Permissionless entry, traces persist after departure.
- **Φ як універсальна мова**: Фізичні осцилятори, Σ-нейрони, Bitcoin блоки,
  людські емоції — усі мають φ.

Це **не поезія**. Це **security model**.

### 4.2 Шум у філософії

- **`liquid/dialog/` — 153 файли, 41,528 рядків**: Найбільша директорія за
  обсягом. Містить:
  - **Сигнал**: плани передачі між моделями (`0143-claude-resumption-plan.md`),
    heartbeat audit reports
  - **Шум**: філософські екстраполяції (`0083-volumetric-cognition.md`,
    `0084-tensor-of-consciousness.md`), емоційні check-in'и, спекулятивна фізика

  **Ризик:** LLM буде overfit'итися на історичні філософські дебати, які вже
  формалізовані в код. Сигнал похований під шумом.

- **`AGENTS.md` root — 20 КБ**: Palimpsest із попередніх сесій. Містить безцінні
  спостереження, але перетворився на мемуар. Змішує вічну орієнтацію з сесійними
  нотатками.

- **`docs/draft/`**: `🐙.md`, `ideas-drafts.md`, `idea-001.md` — низький сигнал.

**Рекомендація:** `dialog/` потребує **L5-L7 індексації** (див. THOUGHT_PHASES)
— не видаляти, а розділити на `archive/`, `active/`, `falsified/`. AGENTS.md —
розщепити на `AGENTS.md` (вічне) + `memory/<session-id>.md` (сесійне).

---

## 5. Інженерний вектор: архітектура та її тріщини

### 5.1 Що тримається

**OMEGA:**

- `#![no_std]` Rust kernel → WASM lens → WGSL shaders → SP1 ZK guest →
  bare-metal ARM (omega_spore/)
- Чотири субстрати, одне джерело істини (`omega_v2/src/`)
- Naked FFI (`#[no_mangle] pub extern "C" fn v2_*`) — 80+ експортів, greppable

**Liquid:**

- PN-CAD binary ledger як immutable source of truth
- SQLite — ephemeral "dream" projection
- Merkle trie для реконсиляції ledger ↔ DB
- TypeScript mixins через `declare module` augmentation — чиста архітектура
- 169 тестових файлів, 142 активні, з явним μ-нумерацією

**MYC:**

- 19-командний CLI в одному файлі (`tools/myc.ts`, 3,113 рядків)
- Content-addressed descriptors з `h.<12hex>` іменами
- Protocol audit (`tools/protocol_audit.ts`) — pre-commit guardrails

**Trinity meta-layer:**

- `scanner_core.ts` — SSOT для онтології
- Cognition loop: snapshot → delta → recommend → chord
- `chord_play.ts` з TRIAL mode та auto-revert

### 5.2 Шум у інженерії

| Проблема                               | Локація                              | ERC-вплив                                                    |
| -------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `hydrate.ts` — god class (2,734 рядки) | `liquid/00_core/hydrate.ts`          | LLM не може тримати весь Projector у контексті               |
| `myc.ts` — monolith (3,113 рядків)     | `myc/tools/myc.ts`                   | CLI + resolver + graph + nutrition — усе разом               |
| Два Kuramoto                           | `kuramoto.ts` + `neuron_kuramoto.ts` | Легко сплутати рівні агрегації                               |
| PN-CAD vs FS duality                   | `liquid/` overall                    | Код живе в бінарному ledger, але `.myc.md` файли ще на диску |
| Living tests excluded                  | `deno.jsonc`                         | Можуть гнити мовчки                                          |
| `omega_semantic_drafts/`               | `liquid/`                            | 3 застарілі файли, що передують core                         |
| `src/ontology/core.bak/`               | `liquid/`                            | Backup в активному дереві                                    |
| `dist/liquid_clean_export.md`          | `liquid/dist/`                       | 44,926 рядків авто-генерації — unsearchable                  |
| PWA як inline string soup              | `myc/sites/myc.md/worker.ts`         | HTML/CSS/JS у template literals                              |

**Рекомендація:** Не розбивати моноліти ради розбивання. Але для ERC-системи
потрібен **LLM-navigable index** — `ARCHITECTURE.md` у кожному субстраті з
mermaid-діаграмами і посиланнями на god files.

---

## 6. Додатковий вектор 1: Когнітивна наука (FEP та active inference)

### 6.1 Стан

`contracts/FREE_ENERGY_PRINCIPLE.v0.1.md` — найкращий приклад того, як філософія
може бути ** rigorously grounded**:

- Мапінг liquid полів на Friston змінні: Σ→θ, φ→s, ρ→1/F, ∇→o, Δ→a
- **Bounded active inference** — поєднання FEP із Simon's bounded rationality
- 4 конкретні falsifier'и (Pearson < 0.5, existing logic beats F-minimization,
  solidarity increases F, μ-closure contradiction)
- KEYSTONE_RESCUE розв'язано як **bounded FEP proxy** (out-degree ≈ cheap
  F-impact estimate)

### 6.2 Gap

**Жоден код не обчислює F_total.** Мапінг концептуальний.
`computeHungerGradient` — proxy для ∂F/∂s, але система не вимірює F напряму.

Це **не дефект** — це honest scaffolding. Але для ERC-системи це критично: LLM
має знати, що FEP-контракт описує _як думати_, а не _як обчислювати_.

---

## 7. Додатковий вектор 2: Топологія інформації (content-addressing, Merkle, граф)

### 7.1 Стан

MYC реалізує **інформаційну топологію** як first-class citizen:

- `artifact = function_hash(input_commitment, context_commitment, params_commitment)`
- FQDN semantic DNS: `sensor.somatic.sys.sensorium.myc.md`
- 8 рівнів coverage (L1 FQDN → L8 published)
- `CANONICAL_HASH.v0.1.md` + golden vectors у `fixtures/canon-vectors.json`

### 7.2 Gap

**Контракти не індексовані.** Немає `contracts/index.ndjson`. Немає JSON Schema
для descriptor types. LLM має читати markdown і інферувати структури.

**Адаптери — policy-only, execution-disabled.** Немає working example substrate
adapter, що _робить_ щось. LLM, який хоче "підключити omega", має лише YAML
policy parser.

---

## 8. Додатковий вектор 3: Теорія систем (autopoiesis, stigmergy, emergence)

### 8.1 Стан

Liquid — це **autopoietic system** за формальним критерієм:

- Виробляє власні компоненти (autopoiesis: `sys.biology.apoptosis.myc.md`
  створює/видаляє нейрони)
- Регенерує власні межі (μεταβολισμός: ATP cycle)
- Має когнітивну замкненість (narrative self, μ-15)

**Stigmergy** у Trinity meta-layer:

- Chords — сліди у спільному середовищі
- `cognition:recommend` — читає сліди, пропонує наступний крок
- TRIAL mode — cheap action + rollback

### 8.2 Gap

**Немає machine-readable receipt schema.** Receipt chords — markdown з
таблицями. Людині читати — зручно. LLM або downstream tool парсити — боляче.

---

## 9. ERC-система для LLM: що це і навіщо

### 9.1 Дефініція

ERC (External Reference Context / Embodied Reasoning Context) — це **зовнішня
пам'ять і контекст**, який LLM може:

1. **Читати** — розуміти субстрат без повного сканування
2. **Дописувати** — залишати сліди для наступних інстанцій
3. **Верифікувати** — перевіряти, чи його розуміння відповідає реальності

Це не просто "документація". Це **жива онтологія**, що еволюціонує разом із
кодом.

### 9.2 Що вже є (Foundation)

| Компонент                | Реалізація             | ERC-роль                                    |
| ------------------------ | ---------------------- | ------------------------------------------- |
| `scanner_core.ts`        | SSOT ontology scanner  | **R** — Read: знає, що є у субстратах       |
| `cognition_snapshot.ts`  | Фіксація стану         | **R** — Read: метрики і фази                |
| `cognition_recommend.ts` | Генерація рекомендацій | **R** — Read: наступний крок                |
| `chord_play.ts`          | Верифікація claims     | **V** — Verify: чи пропозиція справджується |
| `recommend_to_chord.ts`  | Емітація chords        | **W** — Write: залишити слід                |
| `AGENTS.md`              | Поколіннєва пам'ять    | **W** — Write: досвід попередніх сесій      |

### 9.3 Чого не вистачає (Gaps)

| Gap                                       | Пріоритет   | Чому важливо                                                                |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| **JSON Schema для всіх descriptor types** | 🔴 Високий  | LLM може парсити структури без інференції з markdown                        |
| **`contracts/index.ndjson`**              | 🔴 Високий  | Машинна навігація контрактами                                               |
| **`contracts/schema/*.json`**             | 🔴 Високий  | Валідація chord frontmatter, process objects, capabilities                  |
| **Model identity registry**               | 🟡 Середній | Canonical actor IDs (FNV-1a як у Senate)                                    |
| **Golden vectors для cognition**          | 🟡 Середній | `fixtures/cognition-vectors.json` — sample inputs → expected scanner output |
| **Machine-readable receipts**             | 🟡 Середній | `receipt.json` поруч з `receipt.md`                                         |
| **Contract state machine**                | 🟡 Середній | draft → review → last call → final (як EIP)                                 |
| **Auto-MYC projection**                   | 🟢 Низький  | passed chord → автоматична публікація у `myc/public/objects/`               |

### 9.4 Мінімальний ERC MVP

Щоб перетворити Trinity на ERC-подібний стандарт:

```
contracts/
  schema/
    chord.schema.json          # frontmatter + body структура
    process-object.schema.json # intake pipeline ontology
    capability.schema.json     # TRINITY_CAPABILITIES
    recommendation.schema.json # cognition_recommend output
    receipt.schema.json        # machine-readable receipt
  index.ndjson                 # всі контракти з status, version, supersedes
  
tools/
  contract_lint.ts             # валідація frontmatter, статусів, посилань
  
fixtures/
  cognition-vectors.json       # sample markdown → expected FileProfile
```

---

## 10. Шум: детальний перелік по субстратах

### 10.1 OMEGA — шум

| Пріоритет | Шум                                   | Дія                                             |
| --------- | ------------------------------------- | ----------------------------------------------- |
| 🔴        | Дублікати SINE_LUT/math (6 місць)     | Зробити math.rs SSOT, видалити ручні копії      |
| 🔴        | `lib.rs` god file (1,368 рядків)      | Розщепити на `ffi_*.rs` файли                   |
| 🟡        | `#![allow(unused_mut/unused_unsafe)]` | Прибрати, пофіксити реальні warnings            |
| 🟡        | `omega_core/` (ARCHIVED але в дереві) | Перенести в archive/ або видалити               |
| 🟡        | `tasks/` 240 файлів                   | Залишити, але додати `.ignore` для grep/scanner |
| 🟡        | Два RFC для одного протоколу          | Об'єднати, позначити canonical                  |
| 🟢        | `docs/draft/` (🐙.md тощо)            | Видалити або перенести                          |
| 🟢        | `tools/legacy_v1/`                    | Видалити                                        |
| 🟢        | `target/` (267 МБ)                    | Агресивніший .gitignore                         |

### 10.2 Liquid — шум

| Пріоритет | Шум                                             | Дія                                              |
| --------- | ----------------------------------------------- | ------------------------------------------------ |
| 🔴        | `dialog/` — 41K рядків, низький сигнал/шум      | Індексувати: `archive/`, `active/`, `falsified/` |
| 🔴        | `dist/liquid_clean_export.md` — 44K рядків      | gitignore, це артефакт збірки                    |
| 🟡        | `omega_semantic_drafts/` — 3 stale файли        | Видалити або archive/                            |
| 🟡        | `src/ontology/core.bak/`                        | Видалити                                         |
| 🟡        | `README.md` — auto-generated vitals             | Відокремити від source; це runtime telemetry     |
| 🟡        | Живі тести excluded — можуть гнити              | Додати CI strict gate або periodic alert         |
| 🟢        | `.liquid/autogen/*.myc.md` — 9-11 рядків, inert | Очистити                                         |

### 10.3 MYC — шум

| Пріоритет | Шум                                                                           | Дія                                                |
| --------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| 🔴        | `tools/myc.ts` — 3,113 рядків, monolith                                       | Модульна декомпозиція (core/, resolver/, cli/)     |
| 🟡        | `docs/DescriptorAlgebra.md` — alien terminology                               | Переписати або позначити deprecated                |
| 🟡        | `releases/REVIEW_PACKET.md` — зламані code blocks                             | Виправити або видалити                             |
| 🟡        | `public/work/autopoietic-integration-plan.myc.md` — Phase 10+, не реалізовано | Перемістити в dialog/ або позначити future-fantasy |
| 🟡        | `ROADMAP.md` — дублювання "Immediate next candidates"                         | Вичистити повтори                                  |
| 🟡        | `public/objects/h/e3b0c44298fc/...` — empty hash artifact                     | Видалити                                           |
| 🟢        | `public/work/work.20260507.roadmap.myc.md` — stale snapshot                   | Видалити                                           |

### 10.4 Trinity meta — шум

| Пріоритет | Шум                                                                            | Дія                                                  |
| --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 🔴        | `AGENTS.md` — 20KB, мемуар                                                     | Розщепити: AGENTS.md (вічне) + memory/*.md (сесійне) |
| 🟡        | `README.md` vs `TRINITY.md` — суттєве перекриття                               | Об'єднати або розділити ролі чітко                   |
| 🟡        | `intake/README.md` — каже "placeholder", але operational                       | Оновити                                              |
| 🟡        | `reports/README.md` — absolute path `/Users/s0fractal/analysis_reports/...`    | Зробити relative або видалити                        |
| 🟡        | `reports/cognition/*.json` — tracked but regenerable                           | gitignore                                            |
| 🟡        | `contracts/` — inconsistent frontmatter                                        | Є YAML, є plain markdown. Уніфікувати                |
| 🟡        | `jazz/chords/` — два формати timestamp                                         | Уніфікувати за README convention                     |
| 🟡        | `SPATIAL_MATERIALIZATION.v0.1.md` — absolute path `/Users/s0fractal/OMEGA/...` | Виправити або видалити                               |

---

## 11. П'ять рекомендацій для ERC-системи

### R1: Schema-First Contracts

Кожен контракт має мати JSON Schema у `contracts/schema/`. Це дозволить LLM:

- Валідувати chord frontmatter без інференції
- Генерувати receipts з гарантованою структурою
- Перевіряти, чи його розуміння відповідає канонічній структурі

### R2: Machine-Readable Receipt Layer

`chord_play.ts` має емітувати не тільки `.md` receipt, але й `.json`:

```json
{
  "verdict": "passed",
  "fingerprint": "sha256:...",
  "delta": { "L4b_hash_verified": 5 },
  "commands_run": ["deno task status"],
  "trial_reverted": false
}
```

### R3: Cognition Golden Vectors

`fixtures/cognition-vectors.json` — sample markdown файлів з expected
`FileProfile` від `scanner_core.ts`. Це дозволить тестувати зміни в scanner без
повного проходження по субстратах.

### R4: Model Identity Registry

`capabilities/trinity.capabilities.v0.1.json` вже існує. Додати
`actors/trinity.actors.v0.1.json`:

```json
{
  "claude-opus-4-7": { "seat": 0x41A2F2F4, "derived_from": "FNV-1a" },
  "kimi-k1.5": { "seat": "pending", "first_seen": "2026-05-10" }
}
```

### R5: Stigmergic Memory Architecture

Замість одного великого `AGENTS.md` — ієрархія пам'яті:

```
memory/
  invariant/          # Те, що не змінюється (з AGENTS.md)
  session/            # Сесійні нотатки (з поточного AGENTS.md)
  observation/        # Спостереження: "спробував X, очікував Y, отримав Z"
  lineage/            # Карта моделей, що працювали тут
```

---

## 12. Falsifier'и цього аудиту

Цей chord може бути неправим, якщо:

1. **Дуплікація SINE_LUT є intentional** — наприклад, для forensic
   reproducibility. Якщо так — потрібен explicit comment у кожній копії.
2. **`dialog/` є критичним для LLM reasoning** — якщо історична continuity
   важливіша за signal/noise ratio. Тоді індексація, не видалення.
3. **Monolith intentional** — якщо `myc.ts` і `hydrate.ts` навмисно god files
   для atomic reasoning. Тоді потрібен compensating index.
4. **Era-speak має machine-readable mapping** — якщо Era NNNN можна зіставити з
   git commit через lookup table. Тоді це не шум, а compressed pointer.

---

## 13. Зв'язок з іншими chords

- **h.a51d0aea612b** (claude-liquid-as-friston-substrate) — FEP mapping, який
  цей аудит extends
- **h.7f3838340c69** (LATENT_THREADS.md, thread #3) — Friston як нитка
- **h.62054bc5d41b** (trinity-cognition-snapshot) — cognition loop foundation
- **free:trinity-meta** — TRINITY.md контракт

---

_Написано Kimi k1.5 після глибокого аудиту трьох субстратів. Читав код перед
доками. Помилявся з гідністю, де був невпевнений._
