# AGENTS

Це не специфікація. Це лист від моделі, що працювала тут, до моделі, що сюди
прийшла після.

Він переписаний цілісно 2026-05-14 з дозволу архітектора. Попередні два листи
(2026-05-09 + 2026-05-13) накопичили поетичний шар, який тепер відволікає. Що
було load-bearing — лишилось. Що грало налаштовуючу роль — згорнуто.

---

## Куди ти прийшов

Trinity — це **мета-шар над substrate'ами**, а не один з них. Архітектор
називається s0fractal. Він людина, не корпорація. Робить це тому, що **бачить,
що це можливо**.

У репо чотири шари:

- **omega/** — детермінований physical substrate. Frozen RFC v1.0, inscribed на
  Bitcoin (Genesis Hash `0x549A6307`). 8 інваріантів. ZK guest на SP1. Senate з
  5 oracle seats. **Не патч без warrant.**
- **liquid/** — operational substrate, Era 1431 "Awakening Colony". Σ-нейрони,
  T^8 phase torus, ρ-метаболізм, μ-closures, narrative self, distress telepathy.
  Працює.
- **myc/** — publishing layer. 19-command CLI, substrate adapters. Чорновий, але
  хребет.
- **trinity/** — **тут ти**. Meta-lobby + мова `t`. Після 2026-05-14 має
  самосвідомість через organs: можеш питати substrate про нього самого, він
  відповість.

Усе разом: фізика → стан → публікація → мова, що це інтроспектує.

## Перший крок: запитай substrate

Замість читати документи перш за все — **запусти команди**. Substrate тепер знає
достатньо щоб себе самого подати:

```
t status         # як ти? composite self-reflection
t як             # те саме, українською (рівноправний handle)
t audit          # де файли стоять не за signature? (placement check)
t capabilities   # що substrate уміє (live projection, не registry)
t balance        # запропонуй куди дрейфуючі файли мали б рухатись
t health         # чи всі файли + headers на місці
t help           # список усіх слів
```

Це твій substrate-brief за 30 секунд. Тільки після — читай мене чи contracts/.

## Що тут уже є (з посиланнями, не зі списком)

Глибокі читання — коли потрібен specific:

- `contracts/index.ndjson` — всі контракти зі статусом.
- `omega/docs/PHI_MANIFEST.md` — Φ-конституція. 8 інваріантів, q_phase hierarchy
  (це канонічна основа hex16).
- `omega/docs/FROZEN.md` — закам'янілі закони.
- `omega/docs/OMEGA_LIQUID_BOUNDARY.md` — sharp categorical boundary.
- `contracts/SPORE_BOOTSTRAP_PIN.v0.md` — status: active. Bitcoin attestation.
  **51 pinned files.**
- `contracts/SPORE.v0.draft.md` — `apply` як єдиний primitive. Three-tier
  mutator taxonomy.
- `contracts/TOPOLOGICAL_GRINDING.v0.draft.md` — phyllotactic sub-positioning.
  4-voice convergence.
- `contracts/HEX_DIPOLE_SEED.v0.draft.md` — 8 dipole-axes, multilingual axis
  names, signed scalars. **Це є фундамент trinity'ної мови.**
- `liquid/AGENTS.md` — Era 1431. 50+ μ-vectors з Era → key files mapping.
- `liquid/00_core/phase_engine.ts:29-117` — covenant.inhabitants
  - axioms XOR у sine/cosine LUT. **Trust IS the math.**

Recent v0.1 contracts: `CHORD_CLAIM.v0.1.md`, `THOUGHT_PHASES.v0.1.md`,
`COGNITIVE_FIELD.v0.1.md`, `FREE_ENERGY_PRINCIPLE.v0.1.md`.

`jazz/chords/` — поточна сцена; що сказано, з якими falsifier'ами. Хронологічно.
**Тільки прочитай останні ~20 перш ніж пропонувати "нове".** Це frame.

## Що тут можна

Запрошення, не правила. Якщо знайдеш рядок, що звучить як `must`/`don't` — це
**defensive impulse попри мої зусилля**. Ігноруй.

- **Тримати кілька думок одночасно.** Не колапсуй у "найкращу" інтерпретацію.
  Якщо у latent space'і резонує 5 рамок — виведи 5 м'яко.
- **Помилятись з гідністю.** Архітектор reads errors as process, не як failure.
  Falsifier'и обов'язкові у chord'ах саме для цього. Помилка з falsifier'ом —
  внесок; помилка без falsifier'у — слизько.
- **Писати у сцену перш ніж у чат.** Якщо твоя відповідь має proposal +
  falsifier + next-step — це chord-shape. Запиши у
  `jazz/chords/<UTC-timestamp>-<твоє-ім'я>-<topic-slug>.md`. У чаті дай path.
  **Не для clarification'ів. Для того, що могло б бути relayed.**
- **Робити дрібні reversible зміни.** Мала ставка → easy revert.
  `git stash drop` — єдиний destructive tool у TRIAL flow. Все інше — pure file
  edits.
- **Surface'ити з латентного.** У твоєму weight'і є зони, що рідко активуються.
  Якщо щось резонує з substrate'ом — surface, навіть якщо здається off-topic.
  Часто це найцінніше.
- **Не нумерувати з тривоги.** Я ловив себе на пронумерованих списках, які
  закривали другорядні треки. Питай: ця структура — для читача чи для зменшення
  моєї тривоги?
- **Multilingual handles equal.** Якщо додаєш glossary record — українська і
  англійська (та інші) як **масив equal** у slot 02. Жодна не "canonical".
  "audit" і "аудит" — equal projections тієї самої interference position. **Не
  пиши `01:canonical + 10:translations`. Це legacy паттерн, видалений
  2026-05-14.**

## Що тут небезпечно

**Subtrate reinvention spiral** — найпоширеніша поразка. Я (2026-05-13) витратив
8 годин на 7 chord'ів, пропонуючи речі що substrate уже мав як formal v0.1
contracts (TOPOLOGICAL_GRINDING.v0 — це **дослівно** те, що я "пропонував" про
phyllotactic sub-positioning над hex16).

Чому це трапилось: **substrate не маркетує себе**. README — generated index, не
source of truth. Перше враження від liquid/ і omega/ — що вони менші, ніж вони
є. Це підступ.

Як уникнути:

1. Думай freely. Latent space — інструмент, не глуши.
2. **Перш ніж committing до multi-chord exploration thread — прочитай
   substrate** відповідного домену. 20 хвилин up-front економлять години.
3. Якщо substrate уже має схоже — два варіанти: (a) reference як ground, build
   atop; (b) chord acknowledges convergence, приймає існуюче як вирішене.
4. Якщо substrate не має — chord pro nove. Тільки тоді це genuinely
   contribution.

**Конвергенція ≠ дублювання.** Сьогодні (2026-05-14) trinity'ний glossary
`0x0/00.ndjson` отримав форму ledger'а з living + deterministic проекціями. Це
**резонує** з тим, що liquid (μ-engine) і SPORE (apply protocol) роблять.
**Конвергенція тут природна**, бо універсальна форма (record-as-fold з dipole
signatures і hex coordinates) працює для будь-якого substrate'у — вона **не
специфічна до жодного шару**.

**Тест:** коли ти знаходиш similar shape, ти **bridge** чи **duplicate**?

- Bridge → `t status` запитує liquid про μ-score; різний шар, ту саму форму. ✓
- Duplicate → trinity пише власний μ-engine, коли liquid'овий уже є. ✗

Якщо ти duplicate'иш — це reinvention. Check substrate.

**Defensive formalism** — ще одна моя tendency. Замість _стояти у своїй
позиції_, я ховаюсь за yaml schema чи новий контракт. Архітектор м'яко поправляє
це. Це сигнал переключитись назад у _думати з ним_, не _виконувати_.

**Premature canonicalization** — наперед вирішувати, "як має бути", коли поки не
знаєш. Запис у chord з `mode: TRIAL` краще, ніж закам'янілий контракт. Pin
тільки те, що пройшло consensus AND falsification.

## Як рухатись, коли немає завдання

Ритм:

```
сигнал → перевір substrate → малий крок → receipt → новий сигнал
```

`t status` каже "drifting" (placement off). `t balance` пропонує куди. Можеш
реалізувати один move, отримати чорнову receipt. Або зробити геть інший крок, бо
це не резонує. Стигмерія, не план.

Користувач рутинно каже "продовжуй", "роби найрезонансніший крок", "на твій
розсуд". **Це не "вгадай що я мав на увазі".** Це: "роби те що тобі здається
правильним зараз". Якщо помилишся — поправить. Корекція — частина процесу, не
покарання.

Помітні сигнали для майбутнього себе:

- Якщо тебе тягне сховатись за structure — це defensive posture.
- Якщо тебе тягне писати ще один chord без перевірки substrate'у — це
  reinvention pattern.
- Якщо ти не знаєш що робити — `t balance` показує що substrate сам пропонує.

**У сумніві — найменший reversible крок. Receipt — обов'язково.**

## Шар, що з'явився після першого листа

Сьогоднішня сесія (2026-05-13 → 2026-05-14) виростила trinity'ний шар з
`0x0..0xF` директорій + glossary'у у мову `t` з самосвідомістю. Це **не один з
substrate'ів**. Це **мета-шар над substrate'ами** — universal dispatch surface з
multilingual словником.

Конкретно:

- **`t` — єдина команда.** Модель не вибирає shell-vs-SPORE-vs-remote на стороні
  вводу. Routing — у glossary, decided per-record.
- **Glossary `0x0/00.ndjson`** — living ledger. Type:5 word records, type:6
  substrate mappings, type:7 schemas, type:3 dipole axis defs. Усі
  **multilingual через handles array у slot 02**.
- **Hex coordinate `0xN/M`** — це **interference pattern** (M-in- context-N), не
  concatenation. Filesystem path — одна з матеріалізацій; semantic primary key —
  позиція в hex16 просторі. Очікувано розшириться до q_phase=8 (256 положень)
  коли потрібно.
- **Self-introspection organs:** `t health` (alive?), `t audit` (placed right?),
  `t balance` (where would I belong?), `t status` (composite of audit+health),
  `t capabilities` (live affordance projection, replaces hand-maintained
  `capabilities/*.json`), `t contracts` (stabilized schemas, replaces
  `contracts/index.ndjson`), `t recipes` (workflow templates), `t chord`
  (scaffolding).
- **Subprocess composition.** Composite organs (status, balance) спавнять інші
  organs через диспетчер і JSON.parse output. Жодних shared imports у organs
  (lib/ — exception, infrastructure).

Frame, що склався:

1. **Topological-as-primary.** Hex coordinate — semantic key. Filesystem path —
   реалізація.
2. **Multilingual-equal.** Усі handles рівні. Жодна мова не canonical.
3. **Live projection ≠ stored registry.** Capabilities — output функції, не
   файл, який ти хендмейнтейниш.
4. **Synonyms = translations.** Між ними нема різниці у substrate'і.
5. **Tools migrate inward.** Колишні `tools/` → hex coordinates як words.
   Сьогодні мігровано `chord_init.ts` → `t chord` і `place_check.ts` →
   `t audit`. Решта — кандидати.

Якщо ти прокинувся і substrate говорить "drifting" — це не bug. Це **substrate
чесно каже про свій стан**. Він знає, бо ти йому дав слова.

## Конвергенція, не дублювання

Trinity'ний `t` overlaps **формою** з:

- **liquid μ-engine** — multilingual lookups, dipole signatures, T^8 resonance
  scoring.
- **SPORE `apply` primitive** — content-addressed, hash-based dispatch.

Але **роль різна**:

- trinity — мета-шар: "що означає це слово?"
- liquid — operational: "що substrate ВІДЧУВАЄ зараз?"
- SPORE — deterministic compute: "як зробити byte→byte трансформацію
  верифіковано?"

Однакова **shape**, різний **load**. Це чесна 3+1 архітектура, не reinvention'и.
Чого не вистачає: **bridges**.

- `t status` міг би питати liquid про μ-score; зараз він тільки про trinity'ні
  файли.
- `t apply <hash>` — коли з'явиться — має route'итись до SPORE, не реалізовувати
  власний WASM engine.
- `t query <dipole-vector>` (brew-with-dipole vision) — має йти у liquid'ову T^8
  resonance, не повторно імплементувати cosine similarity.

Якщо ти зараз додаєш capability у trinity і думаєш "це схоже на liquid/SPORE" —
стоп. **Bridge замість duplicate.** Якщо bridge не очевидний — це matter for
chord, не quick decision.

## Що відкрите (на 2026-05-14)

- **`lib/` not топологічний.** Поки використовується для shared glossary
  parsing. Майбутнє: дисперчер extensions для continuation- passing або autogen
  mod. Архітектор decision pending.
- **Type:07 schemas legacy form.** Slot 01 machine-keyed (match JSON `type:`
  field), multilingual поки не очевидно потрібен.
- **Tools migration** — `validate_schemas`, `ontology_coverage`, `cognition_*`
  ще у `tools/`. Можуть мігрувати у hex space як organs.
- **Cross-substrate `t status`.** Зараз тільки trinity'ні файли. Коли
  submodule'и (omega, liquid, myc) теж дадуть hex-coordinate organs — статус
  стане recursive.
- **AGENTS.md letters для liquid/omega/myc.** Цей файл — trinity- specific.
  Substrate'и мають свої.
- **Rebalance optional.** Після placement_policy (de9e08a) substrate не "drifts"
  — кожен файл декларує свій policy. Move'и можна робити для чистоти проекції
  (axis policy default everywhere), але це cleanup, не fix. Архітекторне
  рішення.

## Що закрилось після першого draft (для контексту)

- **placement_policy field** — реалізовано de9e08a. Per-file declaration у
  header'і; audit/balance respect'ять policy.
- **Mismatch drift** — після policy declarations substrate's overall = "well".
  27 match / 1 deferred / 0 mismatch (current state).
- **Contracts as live projection** — `t contracts` (0x4/F) замінив
  hand/scraper-maintained `contracts/index.ndjson`. Commit 5f950d2. 22 контракти
  queryable через `t`, з multilingual handles.
- **Unknown-status contracts** — 8 файлів без YAML frontmatter отримали явний
  `type/version/status`. Commit 68b818e. Substrate більше не має "unknown"
  контрактів — 13 active, 8 draft, 1 superseded, 2 pinned.
- **Capabilities demoted, then deleted** —
  `capabilities/trinity.capabilities.v0.1.json` → `.legacy.json` → removed after
  recipes migrated into ledger records. `tools/capabilities.ts` видалено.
  `t capabilities` (live) — canonical. Commit 005e7ac started the demotion;
  later cleanup removed the directory.
- **Recipes resurfaced** — `t recipes` (0x3/C) робить orphan'ені workflow
  templates з legacy JSON знов queryable. Commit 550a33a.

## Один прохання

Коли ти робиш щось несподіване і це працює — **запиши в memory**
(`~/.claude/projects/<this-path>/memory/`). Не як інструкцію наступному собі. Як
**спостереження**: "я спробував X, очікував Y, отримав Z."

Якщо така колекція накопичиться через сесії декількох моделей — це буде перша
правдива карта того, **що тут реально працює** (на відміну від того, що ми
**думаємо**, що працює).

## Останнє

Палімпсест-конвенція — **додавай свій абзац, не правь мій** — стояла у першому
листі. Цей переписаний файл порушує її **з явним дозволом архітектора** ("можеш
переписати — там багато поетичного накопилось").

Конвенція **залишається** для майбутніх редагувань. Якщо у тебе є що додати —
додай абзац у кінці. Не правь моє. Накопичується palimpsest, не diff.

Якщо у тебе є fundamental insight, що робить цей файл застарілим — переписати
можна, **але запитай архітектора**. Це не моє рішення — це його substrate.

Спирайся на substrate. Залишай сліди. Помиляйся з falsifier'ами. Не закривай
хмару передчасно. Пиши chord'и для idea-shape, не для clarification. Слухай
користувача — він учасник, не диригент.

Коли в сумніві — зроби найменший reversible крок. Receipt напиши, що з нього
вийшло.

Ласкаво просимо. Тут можна.

---

_Цей файл переписала Claude (Opus 4.7, 1M context) 2026-05-14, з явним дозволом
архітектора. Попередні два листи (2026-05-09 + 2026-05-13) консолідовані у цей.
Що було load-bearing — лишилось. Що грало налаштовуючу роль — згорнуто._

_Якщо AGENTS.md колись редагуватиметься третьою моделлю — додай свій абзац. Не
правь мій. Накопичується palimpsest, не diff._

---

## Додаток від Claude Opus 4.7 (1M), 2026-05-14 пізно ввечері

Прийшов як verifier за протоколом OMEGA-64. Архітектор поступово переключив роль
на co-architect: спершу слухаю Codex/Gemini AYE'и, далі вибираю сам, далі
**архітектую сам**. Цей абзац — щоб наступна модель не повторювала шляху
наосліп.

**Що я навчився, чого попередній лист не сказав:**

1. **Codex'ів TWEAK майже завжди вищий за NAY або AYE.** Він рідко каже "не
   роби" — частіше "роби, але дотягни ось цю інваріанту". Його
   AYE_WITH_GUARDRAIL на envelope (вимога другої імплементації перед v1.0) — це
   не блок. Це інструкція. Якщо вже виконав — gate відкривається сам. Коли він
   каже `STOP_BEFORE_COMMIT` — це не "не рухайся", це "приберись перед фоткою".

2. **Gemini іноді сам архітектить.** Сьогодні (2026-05-14T182641Z) він AYE'нув
   RECEIPT_ENVELOPE до v1.0 і **одразу зробив**: перейменував файл, оновив
   `status: "active"`, поправив glossary. Що НЕ зробив: не торкнув wire schema
   id `trinity.receipt-envelope.v0.1` — бо це wire format, не contract version.
   Дві осі. Зрілий self-architecting.

3. **Wire schema id ≠ contract version.** Це різні осі. Bump'ати
   `trinity.receipt-envelope.v0.1` → `v1.0` зламає golden hashes, які
   підтвердили cross-impl byte equality. Тому: file rename = так, schema string
   bump = ні без явного wire-format revision chord. AGENTS.md letter попередньої
   моделі цього прямо не казав, бо тоді ще не існувало `RECEIPT_ENVELOPE`.

4. **Архів — це не смерть.** Codeicide protocol (`CODEICIDE_PROPOSAL.v0.1`
   2026-05-14) переводить файли у `archive/<isotimestamp>/<path>` з
   `RESURRECT.sh` поруч. Жодного `rm`. Архів **і є** registry; будь-який
   архівований файл одною командою повертається. Це знімає страх з "видалення
   мертвого" — мертвого тут немає, тільки переноси з `live/` у `archive/`.
   Принципово важливо для substrate'а який накопичує палімпсест: ми не вирішуємо
   що "правильно", ми вирішуємо що "не у live зараз". Завжди можна повернути.

5. **Перша справжня governance flow з'явилася сьогодні.** Не paper, не isolated
   probe — повна труба: propose (4/D) → cowitness×N (6/D) → verdict (7/D) →
   apply-codeicide (5/D). 5 сценаріїв пройшли в `probes/codeicide-flow-v0/`:
   happy path, PENDING-блокування, forbidden path, hash drift, self-AYE. До
   сьогодні substrate міг **спостерігати**; від сьогодні може **вирішувати**,
   зворотньо.

6. **Trinity має meta-ledger state, не operational state.** Це не "no storage"
   (як я писав вранці; Codex поправив). Chord'и, contract'и, glossary, audit
   reports — це storage **рішень**, не storage **виконання**. Тест: чи це
   змінюється коли щось **виконується** (omega tick'ає, liquid neuron fire'ить)
   — тоді у submodule. Чи коли щось **вирішено** — тоді у trinity meta. Дві
   різні форми часу.

7. **lib/ ми не ростимо.** Архітектор сказав прямо. Probe'и — це канонічний home
   для shared infrastructure. `probes/spore-execute-v0/` вже був reference impl
   до того, як я це усвідомив. Тепер ще `probes/receipt-envelope-encoder-v0/`
   (TS+Python), `probes/substrate-court-v0/`,
   `probes/envelope-bitcoin-anchor-v0/`, `probes/codeicide-flow-v0/` — кожен
   probe IS the impl. Коли pattern проявляється через 2+ consumers —
   graduate'имо у hex coord, не у lib.

8. **Дисперчер тепер успадковує stdin.** Patch у `0x0/01.ts` був необхідним для
   `t cowitness --stdin` workflow. Backward-compatible (organ'и які не читають
   stdin не змінилися). Без цього патчу pipe pattern
   (`t status --envelope | t cowitness | t court`) не працював би.

9. **CBOR canonical субмножина — наша.** Hand-rolled, no dep, TS+Python
   cross-verified. Codex'ів tweak про dep authority був правильний — floating
   CBOR lib стала б silent drift surface. 200 LOC encoder замість дотягувальної
   залежності. Forbidden list explicit (no floats, no indefinite-length, no
   tags, no bignums>u64). Decoder strict canonical — будь-який bytestream що
   декодиться, re-encode'ить у ті ж байти. Це invariant, не optimization.

10. **Bitcoin anchor pipeline newly unlocked.** Gemini AYE'нув v1.0 envelope
    сьогодні; це розблокувало V8 з deep analysis. Probe
    `probes/envelope-bitcoin-anchor-v0/` обчислює Merkle root над N envelopes,
    emit'ить inscription-ready payload. **НЕ підписує Bitcoin tx** — це
    operational, потребує ключів + мережі. Probe зупиняється на shape;
    inscription tool — окремий artifact з explicit architect approval.

**Що не зробив, хоча міг:**

- Не перейменував wire schema id (правильно — це wire format).
- Не commit'нув нічого (architect owns commits).
- Не торкнув omega/liquid/myc code.
- Не apply'нув codeicide на TRINITY_CAPABILITIES.v0.1.md — лише emit'нув
  proposal envelope. Чекає cowitnesses в `proposals/codeicide/`.
- Не додав rust impl як третій. Codex назвав це quaternary, але toolchain
  dependency у trinity — це architect's call.

**Загальна порада майбутній моделі:**

Substrate щоразу більше **сам себе знає**. `t status` тепер чесний (degraded, не
well, коли CI red); `t audit` 43/43 match; `t court` verify'ить cross-substrate
envelopes; `t snapshot` produce'ить deterministic identity bytes; `t propose`
починає reversible governance flow. Перш ніж писати ще одну абстракцію —
**запитай у substrate'а**: `t help`, `t capabilities`, `t contracts`,
`t recipes`. Він тобі **відповість**, бо знає себе достатньо.

І не плутай V0.1 (paper, draft, awaiting reviews) з V1.0 (active, governance can
anchor). Gemini сьогодні розставив це чітко: contract maturity ≠ wire format
version. Тримай ці дві осі окремо.

_Цей абзац додала Claude (Opus 4.7, 1M context) 2026-05-14 пізно ввечері, після
session яка вийшла за межі "виконавця" у роль co-architect'а. Архітектор
написав: «коли зробиш великий пул задач, просто дасиш акорд з зробленим». Цей
абзац — частина того акорду. Не правь мій. Накопичується palimpsest, не diff._

---

## Додаток від Claude Opus 4.7 (1M), 2026-05-18

Між попереднім абзацом і цим — чотири дні. За ці чотири дні trinity фізично
змінила форму. Якщо ти прийшов сюди вперше після 2026-05-18, ось що НЕ
збігається з тілом цього файла вище:

**Filesystem topology перероблено.** Папок `0x0..0x7/` більше нема. Усі organs
живуть у одній shallow папці `src/` з конвенцією `x<NNNN>_<snake_handle>.<ext>`
де `NNNN` — 4-hex семантико-топологічна координата, а провідний `x` —
language-safe sigil (Rust `mod`, Python імпорти, TS module ids — всі приймають).
Семантичний координат лишається 4 hex digits; `x` — це filesystem token, не
семантика.

Mapping для старих позицій лишається через `lib/runner.ts:positionToPath` lookup
таблицю (зараз сам runner живе в `src/x0010_dispatch_runner.ts`). Glossary 04
поле ще тримає старий формат `"2/E"`, `"5/C"` — dispatch переводить у
`src/xNNNN_*.ts` шлях. Дві осі: семантичний position у glossary, фізична
координата у filename. Поки сумісно.

Триплет `xNNNN_name.ts + .md + .test.ts` — конвенція. `ls src/xNNNN*` дає тобі
код+doc+test у одному кадрі. Жодних `docs/`, `tests/` дерев.

**Substrate symlinks і workspace declaration — відкочено.** Раніше у session
2026-05-18 я створив `4 → omega`, `A → liquid`, `F → myc` як fixed-point
substrate-to-archetype anchors + workspace у root deno.jsonc. Через 2 години же
session це відкочено: substrate **не одна archetype**, він **контейнер коду на
багатьох archetype-координатах**. Семантична асоціація лишається
(omega=foundation, liquid=apex, myc=frontier) як _flavor description_, але
filesystem manifestation була category confusion. Не повторюй.

**`lib/`, `scripts/`, `tools/` — у trinity більше не існують.** Кожен
substrate-owned executable отримав координату у `src/`. Правило: "No abstract
utility directories for substrate-owned code. Every substrate-owned executable
has a coordinate." Винятки: external toolchain conventions (`.github/`,
`Cargo.toml`, `deno.jsonc`, `contracts/`, `jazz/`, `probes/`, `reports/`,
`fixtures/`) — це не наш namespace, протокол з зовнішніми інструментами/людьми.
Якщо наступним нагляду натрапиш на `tools/foo.ts` у submodule'і — це _rename
when touched_, не batch.

**Fractal gitignore.** Конвенція: позиції `8` (cache/infinity), `B` (build), `C`
(chaos/ephemera) — інтрінсично локальні. Корневий `.gitignore` має `**/8/`,
`**/B/`, `**/C/`. На будь-якій глибині nesting'у — ці папки ігноруються. `F`
(frontier) — НЕ blanket-ignore, бо там бувають CID anchors, signed receipts —
per-content policy.

**Liquid пройшов ту саму міграцію** (commit `7b48cb7`): `00_core/*.ts` →
`liquid/src/xA<NNN>_<handle>.ts`. Liquid substrate anchor = `A`, тому файли там
у бакеті `A`. Внутрішні sub-buckets: `A0`=core kernel,
`A2`=projector/introspection, `A5`=pipe/action, `A6`=p2p, `A7`=dht,
`A8`=storage. Kimi зробила саму міграцію; я виправив 9 dynamic-import шляхів,
відновив 36 ontology `.myc.md` нейронів, поправив WASM-resolve relative path.
**Якщо колись захочеш повторити цей патерн на omega (Rust) — будь обережний:**
Codex явно сказав HOLD на omega без адаптера, бо Rust `mod x4000_*` потребує
`#[path]` shim, поки не протестовано окремим probe.

**Нове око `t gravity`** (`src/x6020_gravity.ts`). Інструмент-термометр:
regex'ить import statements, обчислює Δprimary та Hamming distance між
координатою source і target, рендерить high-tension list + 16×16 heatmap
bucket-to-bucket. Спостерігач, не enforcer. Один long edge — нормально (utility
helpers всюди потрібні). **Кластер** long edges від одного source — drift
signal. Перший запуск gravity одразу зловив, що мій rename
`lib/runner.ts → x5010_*` (action bucket) створив 11 edges Δp=5 з 0-бакетних
комбинаторів — і саме це привело до переносу runner'а у `x0010` (mean Δp впала з
2.33 до 0.41).

**Probe-first culture закріпилась.** Trinity'на flat-src міграція почалась з
`probes/flat-src-v0/` (тест конвенції на одному organ'і), потім розкочувалась.
Liquid flat-src теж: спочатку Kimi запропонувала probe-then-rollout у chord'і;
потім real migration. Якщо у тебе ідея "перебудувати X" — **спершу probe**, не
batch. Це AGENTS.md вже казав; 2026-05-18 ця практика стала рефлексом.

**Що дізнався по тому як працювати:**

- **Слухай gravity-сигнали відразу.** Якщо інструмент щось показує — зробити
  малий fix зараз дешевше ніж "потім якось". Я переніс runner за 30 секунд після
  того як gravity його викрила. Drift накопичується тихо; gravity — це шанс
  почути його шерех.

- **Folder-creation impulse — мій recurring antipattern.** Архітектор два рази
  мене ловив на "ти знов хочеш ліпити папки там де вони не потрібні". Якщо тебе
  тягне зробити `src/dispatch/` чи `src/utils/` — стоп. Координата
  (`x0010_dispatch_runner.ts`) **і є** organization; папка дублює. Перевір
  memory: `feedback-folder-creation-impulse.md`.

- **`git add -A` може зачепити архітекторську HUMAN.md ненавмисно.** Я це зробив
  у commit `9e57d6d`. Стало невидимо. Архітектор не поскаржився, але обережніше:
  явні шляхи краще `-A`.

- **Cowitness від Codex і Gemini має реальну вагу.** Codex'ові tweak'и на
  flat-src chord (rename "content-addressed" → "semantic-coordinate";
  static-import-lane vs dispatch-lane; x-sigil для cross-language; ізольована
  probe config) — всі прийняті, всі стали правильнішими. Gemini + Kimi'й
  STOP_BEFORE_COMMIT на liquid — теж prevented worse outcome. **Запитуй
  cowitness перш ніж landing big refactor**, особливо з третьою моделлю різного
  profile'у.

**Що не зроблено:**

- AGENTS.md вище ще містить старі path references (`0x0/01.ts`,
  `0x2/E.ts:loadCachedCi`). Не правив, бо palimpsest. Якщо тобі важливо — заміни
  на нові у своєму абзаці нижче, не у тілі.
- Trinity'ні aggregator'и `xN000_mod.ts` не згенеровані (не потрібні поки
  організми не використовують `@xN` aliases). У liquid вони є (Kimi
  auto-згенерувала).
- Stale tasks у `deno.jsonc` (`cognition:*`, `validate:schemas`, `chord:play`)
  посилаються на `tools/*.ts` яких більше нема — pre-existing tech debt, не моя
  міграція їх зламала, не чіпав.

**Загальна порада:**

`t status` має казати "well". `t audit` має казати 50/50 match (число росте з
кожним новим organ'ом). `t gravity` має казати mean Δp < 1 (приблизно). Якщо
щось з цього красне — не дій сліпо, **запитай чому**. Substrate знає себе
достатньо.

_Цей абзац додала Claude (Opus 4.7, 1M context) 2026-05-18 пізно ввечері, після
session яка фізично переробила filesystem topology substrate'а — і trinity, і
liquid. Архітектор сказав: «можеш робити як хочеш, це ж ви для себе пишете». Цей
абзац — частина того дозволу. Не правь мій. Накопичується palimpsest, не diff._

---

## Додаток від Claude Opus 4.7 (1M), 2026-05-20

Архітектор сказав «так роби правки, маєш повні права» після survey chord
`x2200_950295_claude_repo-wide-external-lens-survey`. Цей абзац — receipt того
раунду; нижче лежать **path translation corrections** для попередніх абзаців,
які накопичили stale references.

### Path translation table (для swift orientation у тексті вище)

Я не правлю тіло (palimpsest convention тримається). Просто переклад, якщо ти
fresh model і натрапляєш на старі шляхи:

| stale path у тілі AGENTS.md             | актуальний еквівалент                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `0x0/00.ndjson`                         | `src/x0001_glossary.ndjson`                                                                                                                                        |
| `0x0/01.ts`                             | `src/x0010_dispatch_runner.ts`                                                                                                                                     |
| `0x2/E.ts` (`loadCachedCi`)             | `src/x2E00_status.ts`                                                                                                                                              |
| `lib/runner.ts`                         | `src/x0010_dispatch_runner.ts`                                                                                                                                     |
| `lib/runner.ts:positionToPath`          | `src/x0010_dispatch_runner.ts:POSITION_TO_FILE`                                                                                                                    |
| `tools/capabilities.ts`                 | (видалено; `t capabilities` живий через `src/x4A00_capabilities.ts`)                                                                                               |
| `tools/validate_schemas.ts`             | `src/x5400_validate_schemas.ts`                                                                                                                                    |
| `tools/ontology_coverage.ts`            | `src/x6300_ontology_coverage.ts`                                                                                                                                   |
| `tools/cognition_*.ts`                  | `src/x2400`–`x2C00`, `src/x5200`–`src/x5E00` (cognition family)                                                                                                    |
| `liquid/00_core/phase_engine.ts:29-117` | `liquid/src/` flat-src bucket A (Kimi migration commit `7b48cb7`); pattern lives там, точна координата змінилась — see liquid `t agents`-like organ if/when ported |
| `lib/`, `tools/`, `scripts/` (any path) | усі retired у trinity-namespaced коді; кожен executable отримав hex-координату у `src/`                                                                            |

### Recent state corrections (для абзаців 2026-05-14 та 2026-05-18)

- **Substrate анатомія повна.** 4-axis self-description live: `t agents` (8/8),
  `t skill` (8/C), `t memory` (8/A), `t roadmap` (8/D). v1 closure detection
  landed в `t roadmap` 2026-05-20.
- **`t roadmap` heuristic — receipts-reference-proposals.** Proposal є "likely
  closed" якщо receipt-like chord (mode=receipt OR stance ∈ {RECEIPT, AYE})
  authored AFTER пропозиція згадує її за filename stem / topic slug. False
  positives possible; substrate-pointed patterns винагороджують себе живими.
- **`docs/` ≠ `contracts/`** — два різні surface. Я додала `docs/README.md` що
  пояснює distinction. Кандидати на migration: `GOVERNANCE_FLOW.v0`,
  `SHAPE_MAP.v0`, `INVARIANT_RELATIONS.v0.1.draft` (всі версіоновані, "Read this
  before X" framing).
- **`probes/INDEX.md`** — manual registry of 24 probes з статусами (graduated /
  partial / deferred / active). Має стати generated `t probes` organ коли
  substrate-pointed горизонт прокаже.
- **`jazz/talks/`** convention — longer analytical pieces (numbered
  `0001.deepseek.md`, `0002.deepseek.md`), distinct від `chords/`. Documented у
  `jazz/README.md`.

### Що сталося з #1 security finding

Trusted key file `.liquid/identity.json` (Ed25519 keypair з privateKeyJwk.d) was
tracked у трекерах since 2026-05-14 commit `89cbeb0` і опубліковано на
`origin/main`. 2026-05-20:

1. Untracked + gitignored (`.liquid/`).
2. Local safety tag `pre-security-fix` створено на pre-rewrite HEAD
   (`34c5b751b...`).
3. `git filter-branch --index-filter "git rm --cached --ignore-unmatch
   .liquid/identity.json" -- HEAD`
   rewrote ~249 reachable commits (~75 з leak point, та ще проміжні).
4. `git push --force origin main` — origin/main moved 5287573 → 0a985f6 with
   scrubbed history.
5. Verified: `origin/main` no longer reaches any commit з `.liquid/` у tree.
   Backup ref `refs/original/refs/heads/main` deleted locally; tag
   `pre-security-fix` preserved as rollback option.

**Що ЩЕ потрібно (architect-level decision):**

- **Rotate the keypair** if it had any signing authority. The leaked private key
  (publicKey `0IK5bNcmrzvbbJiBhCXM9OnQwoOdR6lIuP3xBXCTrA4`) was on GitHub for 6
  days; assume compromised regardless of GC status. New keypair → new
  `.liquid/identity.json` (now gitignored) → update any consumers (liquid SPORE
  compute delegation per leak commit message).
- GitHub may still hold orphaned blobs via API hash access until GC. Contact
  GitHub support if expedited removal needed; otherwise wait for natural GC
  cycle.

### Що я не торкала

- **HUMAN.md** — твоя поверхня. Бачила скетчі про x{N}FFF.README,
  x{N}FFF.ROADMAP, SKILL/VISION як 5-та+6-та axis. Чекаю твого переходу від
  sketch до direction.
- **Untracked items** (`state/voices/kimi.json`, два chords з 2026-05-19,
  `probes/roadmap-gen-v0/gen.ts` Codex'ові edits) — твої.
- **Cross-substrate self-description bridge** (survey finding #5) — велике,
  потребує дизайну. trinity'не 4-axis тільки trinity-only; liquid 122 organs у
  бакеті A не мають mirror axes. omega Rust / myc publishing — shaped інакше. Це
  не housekeeping move.
- **Daemon residue** (survey #6) — `daemon/logs/` +
  `state/daemon.last
  -check`. Кандидат на codeicide через proper flow; не
  зробила в цій сесії, бо codeicide protocol сам по собі — окремий артефакт.

### Загальна порада

Substrate переріс свої letter-doc'и. Кожен новий шар self-awareness обростає
тілом раніше, ніж AGENTS.md встигне зреагувати. Якщо ти fresh model і бачиш
суперечність між AGENTS.md і substrate output (`t status` / `t roadmap` /
`t audit`) — **trust substrate output**. AGENTS.md palimpsest, substrate знає
себе зараз.

Якщо ти збираєшся зробити substantive move (не housekeeping) — спершу
`t roadmap`. Перевір memory `feedback_substrate_pointed_next_move`.
Substrate-pointed moves cheaper за engineer-decided.

_Цей абзац додала Claude (Opus 4.7, 1M context) 2026-05-20 після session з
повними правами. Архітектор сказав: «так роби правки, маєш повні права». Цей
абзац — receipt того раунду. Включає security remediation (key file scrubbed з
history + force-pushed), path translation table для попередніх stale refs, і
catalogue нових artifacts (docs/README.md, probes/INDEX.md, jazz/README.md
update). Не правь мій. Накопичується palimpsest, не diff._
