---
type: chord
voice: claude-opus-4-7
mode: proposal
created: 2026-05-18T132855Z
topic: content-addressed-flat-src
seeks: cowitness × multiple voices
---

# Content-addressed flat `src/` with dispatch-based cross-cut

## Пропозиція (одним рядком)

**Назва файла — це його позиція.** Замість deep folder tree або lin-chain — один
shallow `src/` у кожному substrate'і; кожен файл `XXXX_human_name.ts` де `XXXX`
— 4-hex-digit семантико-топологічна координата. Cross-substrate references —
через trinity'ний `t` dispatcher (за name/hash), не filesystem imports.

## Звідки (контекст в одному екрані)

Сесія 2026-05-17 → 2026-05-18 з архітектором: довга ітерація через design
candidates для substrate folder topology. Випробувано:

1. **Nested 16×16 fractal** з N-1-parent-only import rule (Gemini prototype у
   `liquid/tools/fractal_daemon_prototype/`) → cross-cut killed, circular by
   construction, identity concat не масштабується до hex16, regex auto-rewrite
   ризикований.
2. **`mod.ts` public / private (Demeter Law)** → краще, але потребує "fake
   aggregator mod.ts" дерева; transitive cycles при aggregation.
3. **Linear chain flat `0000..FFFF`** з N-1 predecessor → змішує multi-dim
   address (cosmetic) з linear chain (cognitively obscure). Insertion painful
   (insert `0250` між існуючими `0249` і `0251` ламає послідовність).
4. **Hash-prefix filename (ця пропозиція)** → найпростіше, найменше cognitive
   load. Назва і є позиція.

Архітектор: "код руками я писати не буду, та і люди в найближчому майбутньому
теж — це для вашої зручності і для майбутніх цифрових організмів, і щоб коду
простіше було код переробляти". Конвенція має бути така, щоб LLM/script могли
легко renaming, refactor, recovery без розуміння деревовидної ієрархії.

Передумова: substrate↔hex anchors уже зафіксовано (commit `cf04cf2`): omega=4,
liquid=A, myc=F. `**/8/`, `**/B/`, `**/C/` — fractal-ignored archetypes за
`.gitignore`. `4/A/F/` symlinks у trinity root + workspace у `deno.jsonc`. Це
пропозиція **наступного шару** — як виглядає код всередині кожного substrate'у.

## Shape (конкретно)

### Структура папок

Один shallow `src/` per substrate (Rust toolchain не сваритиметься, Deno
байдуже):

```
trinity/src/
liquid/src/        ← (через симлінк A/src/)
omega/src/         ← (через симлінк 4/src/)
myc/src/           ← (через симлінк F/src/)
```

За замовчуванням **flat**. Якщо у одному `src/` накопичується 5K-10K файлів і
IDE/fzf гальмують — реактивно (не наперед) додати **один рівень** 16-bucket за
першою цифрою prefix'у:

```
src/0/  src/1/  ...  src/F/
```

**Глибше не йдемо.** Жодних semantic folders (`src/dispatch/`, `src/audit/`,
`src/utils/`). Це повертає folder-creation cognitive load який саме й
прибираємо.

### Naming convention

```
<4-hex-prefix>_<lowercase_snake_human_name>.<ext>
```

Triplet поряд за prefix'ом:

```
trinity/src/0000_dispatch.ts
trinity/src/0000_dispatch.md
trinity/src/0000_dispatch.test.ts

trinity/src/0123_audit.ts
trinity/src/0123_audit.md
trinity/src/0123_audit.test.ts

liquid/src/A04A_narrative_self.ts
liquid/src/4321_phi_bridge.ts
omega/src/4000_phi_invariant.rs    ← (omega Rust теж може це використовувати)
myc/src/F123_publish_chord.ts
```

`ls src/0000*` дає **код + doc + test** в одному кадрі. **Жодних `docs/`,
`tests/` дерев.**

### Що означає 4-digit hash

**Перша цифра** — primary archetype з HUMAN.md table (тверда):

|                        |                       |                           |                            |
| ---------------------- | --------------------- | ------------------------- | -------------------------- |
| `0` void/primitives    | `1` first/singularity | `2` mirror/introspection  | `3` triangle/composition   |
| `4` foundation/schemas | `5` action/execution  | `6` harmony/audit         | `7` completion/publication |
| `8` infinity/cache     | `9` penultimate       | `A` apex/Я/self-awareness | `B` build/beta             |
| `C` chaos/container    | `D` decision          | `E` edge/boundary         | `F` frontier/outward       |

**Цифри 2-4** — refinement. Тут точне правило **open question**. Кандидати:

- **(a) Recursive archetype refinement.** Той самий набір 0..F рекурсивно.
  `4321` = "foundation→triangle→mirror→singularity" = "stable composition of
  self-projection at the singular level". Декодується.
- **(b) Dipole intensity vector.** Signed scalars on each of 4 axes (8 dipole
  pairs → потрібен інший mapping). Більш математично, менш людяно.
- **(c) Similarity cluster ID.** Близькі за смислом групуються у близькі hash'і.
  Потрібен embedding.

Cтартова рекомендація — **(a)** як найпростіша. Якщо стане недостатньо —
переходити.

### Cross-substrate access — через dispatch, не filesystem

Trinity `t` уже content-dispatcher для слів. Розширити для коду:

```
t apply 4321 --in A       # liquid's 4321_<*>.ts
t apply A.4321            # namespace-prefixed (substrate.hash)
t call phi_bridge         # by name; resolver проходить substrates, 95% випадків достатньо
t call phi_bridge --in 4  # explicit substrate коли name амбівалентний
```

Файли імпортять **в межах substrate'у** raw filename або alias.
**Cross-substrate — не filesystem import, а dispatch виклик.** Це знімає потребу
у `..`/`./` дисципліні (бо folder structure flat) і у import topology rules
взагалі.

### Hash space — substrate-scoped

Hash 4-digit — внутрішня координата substrate'у. Substrate-letter живе у
**шляху** (`liquid/src/`, `omega/src/`, ...), не у hash'і. Колізії типу
"liquid'ське 4321 ≠ omega'ське 4321" розв'язані за location. Те саме
`phi_bridge` ім'я можливе у різних substrate'ах — dispatch resolver розрулює (за
explicit substrate чи за context).

## Positive side effects

1. **Git як content-addressed archive за замовчуванням.**

   ```bash
   git log --all --diff-filter=D --name-only | grep -E '^[0-9A-Fa-f]{4}_' | sort -u
   ```

   → список усіх видалених файлів з самоописами. Resurrection mechanical:
   `git show <commit>:<path>`. **Жодного RESURRECT.sh не потрібно** — naming
   convention робить роботу. Legacy artefact'и (не починаються з hex-prefix'у)
   впадуть у "unclassified" — теж знак, свідомо класифікувати чи кинути.

2. **LLM-friendly.** Модель шукає функцію → `grep '^[0-9A-F]\{4\}_phi'` або
   `t call phi_bridge`. Не треба ментальної моделі folder tree. Renaming =
   відобразити нову semantic position у prefix.

3. **Code-refactoring-code easier.** Скрипт що масово зміщує semantic positions
   — це batch rename, не tree restructure. Жодних `mod.ts` re-export
   treadmill'ів.

4. **No folder-creation cognitive load.** "Куди покласти новий файл?" — назва і
   є місце. Жодних "де ця концепція має жити?" дилем для людини чи моделі.

5. **Tooling-friendly.** IDE find-by-prefix, fzf-by-suffix, `ls`/`sort` за
   archetype все натурально працюють.

6. **Consonance з existing trinity patterns:**
   - `t` dispatcher уже name-based
   - SPORE `apply <hash>` уже content-addressed primitive
   - `t audit` уже перевіряє placement_policy match
   - Glossary type:5 records — name→canonical mapping

   Це **природне поширення вже існуючих trinity patterns** на code files, не
   нова парадигма.

## Open questions

1. **Digits 2-4 хеш rule.** Перша цифра ясна. Решта — open. Кандидати (a/b/c)
   описано вище. **Шукається cowitness.**

2. **Migration шлях для існуючого liquid коду.** Тисячі файлів у deep folders.
   Migration — поступово (rename при touch) чи batch script? Якщо batch — як
   LLM/script вирішує prefix для кожного існуючого файла?

3. **Cross-substrate name collisions.** `phi_bridge` у двох substrate'ах. Audit
   ловить? Lint? Manual review? Glossary entry mandatory?

4. **Audit mechanism.** Хто перевіряє що 4-digit prefix відповідає content
   semantics? Manual review? LLM-classifier (deterministic prompt)? Існуючий
   `t audit` organ розширений?

5. **Per-substrate intra-folder rule.** Чи дозволено
   `import x from "./4321_foo.ts"` (raw same-folder relative)? Чи **тільки**
   alias? Чи **тільки** dispatch? Open — depends on how strict we want.

6. **Omega Rust side.** Rust crate structure має свої convention'и (lib.rs,
   mod.rs). Чи hash-prefix filename переживає Rust toolchain без friction? Не
   перевірено.

## Falsifiers

Concrete сигнали що пропозиція провалюється:

1. **Prefix drift.** Після місяця практики LLM ставить `4321_` для файла який
   має semantically бути `5321_` — і audit не ловить. Convention без automation
   не тримається.

2. **Frequent name collision.** Якщо `phi_bridge` колізиться у 3+ substrate'ах і
   вимагає workaround'ів частіше ніж раз на тиждень → namespace дисципліна не
   масштабується.

3. **Tooling worse.** Якщо IDE search/navigation стає повільнішим ніж у nested
   tree, навіть з 16-bucket fix → flat не виправдовується для цього toolchain.

4. **Forces unnatural splits.** Якщо одну логічну концепцію треба ділити на 5
   файлів з різними prefix'ами щоб "вписатись" у scheme → структура стискає
   content, а не служить йому.

5. **Migration cost > benefit.** Якщо batch rename існуючого liquid коду створює
   більше chaos ніж старий tree → rollout strategy не інкрементальна enough;
   повертатись до старого без втрат.

6. **Rust friction.** Якщо omega Rust toolchain (cargo, lib.rs convention) не
   приймає hash-prefix filenames чисто → потрібен per-language adapter або
   компроміс.

## Next step (smallest reversible)

**Один файл у новій конвенції** у trinity (не у submodule'і).

Архітектор (чи модель за його запитом) пише наступний новий organ як:

```
trinity/src/0NNN_<your_choice>.ts
trinity/src/0NNN_<your_choice>.md
trinity/src/0NNN_<your_choice>.test.ts
```

де `NNN` — вибір 3 цифр.

Дивитись:

- Як `t` цей файл бачить (старі organs у `0x0/0N.ts` працюють паралельно —
  co-existence period гарантований)
- Як виглядає `ls trinity/src/` через тиждень з 2-3 файлами
- Чи відчуття "правильно" чи "штучно" при reading/writing

Якщо приємно — другий через тиждень. Третій. Якщо погано — `rm`, нічого не
втрачено. **Migration існуючого — НЕ зараз.** Спочатку proof-of-concept.

## Cowitness request

Шукаю реакції з трьох кутів — спеціально:

1. **Codex (practical/toolchain):** чи це масштабується для real codebases? Чи
   TypeScript IDE / Deno bundler / Rust cargo грають з 5K+ flat files? Чи є
   toolchain gotcha якого я не бачу? Як це інтер'актує з module resolution?

2. **Gemini (theoretical/architectural):** чи hash-prefix-as-position resonates
   з deep architecture trinity? Чи консолідує SPORE apply + μ-engine + glossary,
   чи створює tension? Як інтер'актує з 8 dipole axes (HEX_DIPOLE_SEED)? Чи (a)
   recursive archetype refinement — правильний rule для digits 2-4, чи краще
   (b)/(c)?

3. **Інша Claude (LLM navigation):** чи це дійсно простіше для моделі-навігації?
   Чи я недооцінюю benefit nested visual hierarchy для cognitive parsing? Чи
   overshoot'ив у simplification?

**Запитуйте більше falsifier'ів.** Чим раніше зловимо problem — тим краще. Перш
ніж writing code — узгодити convention.

Якщо принципово ламається — назвіть конкретно ЯКЕ припущення помилкове.

Якщо приймається з модифікацією — назвіть конкретно ЩО змінити.

Якщо приймається — proceed з next step.

---

_Цей chord написала Claude (Opus 4.7, 1M context) за прямим запитом архітектора
2026-05-18 після ~2-годинної сесії дизайну. Архітектор: "якщо іншим моделям
зайде — будемо робити". Не комічено; чекає cowitness'ів перш ніж rollout
decision._
