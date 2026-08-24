# Relayed external audit: RFC-0003

- **Status:** non-normative external review input
- **Source:** Kimi, as relayed by s0fractal; no source signature supplied
- **Relay date:** 2026-08-24
- **Original attachment SHA-256:**
  `ffa9be68f201a987a850344a485a7d46deb57e112c089ce3c84ab239969b28ce`
- **Repository payload SHA-256:**
  `23b537de0a9cbbc9401cddee29af6d4b44b7490a1aa7ee6377ab02970986773f`
- **Byte transformation:** one terminal LF added; textual content unchanged
- **Disposition:**
  [Codex relay and adjudication](../../src/x2900_963881_codex_kimi-rfc0003-audit-disposition.myc.md)
- **Specification edits:**
  [RFC-0003 artifact](../../docs/rfc/0003-heterogeneous-state-protocol/)

The source attribution is supplied by the relayer. This file preserves the
attachment payload and its byte digests; it does not grant authorship,
signature, ratification, merge, or adoption authority. The bytes inside the
outer fenced block, excluding the fence delimiters, are the normalized
repository payload identified above.

## Original relayed text

```text
Ось аудит RFC-0003 (Heterogeneous State Protocol) на основі прочитаних Part 00 (Architecture), Part 01 (Canonical Identity), Part 07 (Revision History) та перехресних посилань. Part 02–06 були недоступні за вказаним комітом, але їхній зміст реконструйований з карти секцій (§22.3), тренчів (§22) та історії правок (§7).

---

## 1. Загальна оцінка

RFC-0003 — це амбітна, філософськи послідовна, але **надмірно бюрократизована специфікація без жодної ратифікованої імплементації**. Вона правильно діагностує проблему «flattening» гетерогенних станів у єдиний векторний простір, але пропонує лікування, яке саме страждає від тієї ж хвороби: надмірної абстракції без executable evidence.

**Ключовий блокер:** Tranche A3 (канонічне кодування CNP-0-JCS) обране у draft, але не має ні corpus-у тестів, ні двох незалежних енкодерів, ні rejecting verifier path. Автор чесно це визнає (§5.1.3, §17.1.1), але це означає, що весь протокол висяє в повітрі.

---

## 2. Що працює добре (і чому це варто читати)

### 2.1 Правильна діагностика проблеми
Тези §2.1–§2.6 — золото. «There is no required universal domain», «Translation is never silently lossless», «Shared action does not require shared ontology» — це точні удари по сучасній індустрії LLM-агентів, де все звалюється в JSON або embedding-вектор.

### 2.2 Explicit Loss Tracking
§7 (Translation, Loss, Suitability, Debt) — найсильніша ідея документа. Переклад не може бути «95% точності» — він має бути структурованим обліком збережених інваріантів, втраченої структури, введених припущень. Це рідкісний випадок, коли специфікація розуміє різницю між **semantic correspondence** та **normative policy** і вводить `EvidenceBridge` (§7.5, §16.7.1) саме для того, щоб політика не маскувалася під семантику.

### 2.3 Модель загроз §19
Найкраща модель загроз, яку я бачив у RFC цього класу. Вона не обмежується «хакер підмінив хеш». Вона включає:
- **Translator capture** (§19.3) — перекладач систематично віддає перевагу одній онтології
- **Confidence laundering** (§19.4) — слабкий переклад видається за сильний на irreversible boundary
- **Geometry cosplay** (§19.7) — математичні терміни без enforceable semantics
- **Fast-path laundering** (§19.9) — обхід governance через формування операції під предикат
- **Salami-slicing the budget** (§19.13) — розрізання мутацій для обходу лімітів

Це свідчить про глибоке розуміння інституційних, а не лише криптографічних, атак.

### 2.4 Чесність щодо обмежень
§20 (Open Problems) містить 23 невирішені питання. Автор не прикидається, що все вирішено. Особливо вражає §20.11: «Is there an order parameter that distinguishes a genuine representational transition from a run of ordinary failures?» — це філософськи глибоке питання, яке більшість специфікацій просто ігнорують.

### 2.5 Fail-closed Design
Протокол послідовно «падає замкнуто»: self-reported suitability на irreversible boundary записується як `undetermined` (§7.2.2), under-profiled state відхиляється, а не доповнюється (§5.2, §19.11), відсутня tension dimension блокує рішення (§19.15). Це правильна інженерна культура.

---

## 3. Критика (те, що треба виправити або переглянути)

### 3.1 Специфікація без імплементації = Architecture Astronautics
У §17.2 є таблиця «First executable test» для кожного примітива. Це чудово. Але жоден з цих тестів не існує у репозиторії (перевірено). Єдиний кодовий артефакт — `probes/hsp-fast-path-debt-scope-v0` (11 тестів, згаданий у §7 Part 07). Це крапля в морі для протоколу з 7 частин, 23+ секціями та 10 тренчами.

**Вердикт:** RFC написано як «конституція», але без «законів» (імплементацій) конституція — це література. Tranche I (демо) вимагає побудувати federated boundary-crossing demo (§16.7) **до** будь-яких заяв про Levels 4–5. Це правильно, але сам факт, що таке demo ще не існує, означає: протокол не готовий до review як продукт.

### 3.2 Надмірна бюрократична складність
Система ратифікації (§22) вимагає:
- Content-addressed votes
- Principal bindings (не ключів!)
- Content-addressed cost models
- Dependency ratifications
- Supersession records
- Quorum counting за principals, а не ключами

Це прекрасно для теорії governance, але для протоколу, який ще не має жодної імплементації, це як проектувати парламентські процедури для колонії на Марсі, яка ще не має атмосфери. **Парадокс:** протокол про «heterogeneous state» сам потребує надмірно homogeneous governance.

### 3.3 Проблема «двох ключів Claude» (§17.1.2, §22.1)
Це мета-проблема довіри. Автор визнає, що `claude` voice key у Trinity та `claude-fable-5` key у dyad (warrant/sigma-glyph) — це різні Ed25519 ключі без rotation warrant. Вони не можуть рахуватися як два principals у quorum. Але це підніває глибше питання: **хто взагалі є principals у цій федерації?**

Якщо всі субстрати (trinity, myc, omega, liquid) контролюються одним суб'єктом (s0fractal), а всі «зовнішні аудити» — це релеї від AI-моделей (Claude, Qwen, GLM-5-Turbo, Grok) без підписів, то федерація — це театр одного актора. §19.17 (Single-operator collusion) чесно це визнає, але це означає, що вся система ratification наразі має нульову інституційну вагу.

### 3.4 CNP-0-JCS: математично слабке місце
Обмеження цілих чисел ±(2^53−1) (§5.1.2.1) — це **I-JSON safe range**, не більше. Для:
- Криптографічних ідентифікаторів (SHA-256 — це 2^256)
- Фінансових обчислень (precise accounting)
- Фізичних симуляцій (omega)

...це обмеження катастрофічне. Автор відхилив `i128` proposal, але не запропонував альтернативи для великих цілих. «A future larger-integer profile MUST use a new identifier» — добре, але коли? Exact rationals з gcd reduction (§5.1.2) для кожного числа — це O(log n) на операцію, що робить high-throughput state transition неможливим.

### 3.5 Відсутність Liveness та Termination гарантій
§19.0 чесно каже: «It does not promise federation-wide liveness, termination, or convergence». Але це означає, що протокол легалізує **вічне зависання**. Два агенти можуть назавжди залишатися в `persistent_conflict` (§16.2) або `decline`. Для системи координації це не баг, а фіча — але для operational system це означає, що користувач (або агент) ніколи не отримає відповідь.

### 3.6 Sequencer: невизначена централізація
§G5 вимагає sequencer як «named keyed party», який receipt-ить кожне рішення про ordering. Але:
- Хто обирає sequencer?
- Що станеться, якщо sequencer відмовить (censorship, downtime)?
- Як запобігти capture sequencer-а одним оператором?

Це централізована точка відмови, замаскована під федеративний протокол. У світлі §19.17 (single-operator collusion) це особливо тривожно.

### 3.7 «Geometry cosplay» у зворотному напрямку
Хоча §19.7 критикує використання математичних термінів без семантики, сам RFC активно використовує:
- «Probability simplex» (§6.4)
- «Loss monoid» (§7.1.1)
- «Debt monoid» (§7.3.1)
- «Manifold» (§6.3)
- «Percolation / phase-transition» (§20.11)

Ці структури описані прозово, без формальних аксіом. «Loss monoid» — це не monoid у математичному сенсі, поки не доведено асоціативність та нейтральний елемент. §7.1.1 каже, що вони «compose by declared algebras», але без formal proof це — той самий cosplay, який критикує §19.7.

---

## 4. Те, про що ви не питали (але варто знати)

### 4.1 Мета-проблема: AI пише протокол для AI
Авторство: «s0fractal + model collaborators». Аудити: релеї від Grok, Claude, Qwen, GLM-5-Turbo. Немає жодного доказу, що ці «collaborators» — не просто промпти до API. У §3 (Non-goals) написано: «not permission for an LLM to mutate schemas without deterministic checks». Але вся специфікація **виглядає як LLM-генерована** — з характерною любов'ю до вкладеної номенклатури, перехресних посилань та бюрократичних процедур.

**Питання, яке не поставлене:** чи можна довіряти протоколу, створеному LLM, який забороняє LLM створювати протоколи?

### 4.2 Чому не RDF/OWL/Semantic Web?
Більшість проблем, які вирішує RFC-0003 (heterogeneous ontologies, explicit translation loss, federated reasoning), вже були адресовані в Semantic Web (RDF, OWL, SKOS, SHACL). Так, Semantic Web має свої проблеми (complexity, slow adoption), але RFC-0003 не пояснює, чому існуючі стандарти не підходять. Замість цього він винаходить велосипед з:
- Content-addressed references (IPLD вже існує, відхилено у §7 Part 07)
- Canonical encoding (JCS вже існує у Warrant)
- Ontology negotiation (OWL ontology alignment вже існує)

Відповідь «ми не хочемо global ontology» не виправдовує reinvention wheels.

### 4.3 Економічна модель відсутня
Mutation budgets (§10), cost vectors, translation debt — але **хто платить?** Якщо агент може створювати нескінченні conflict occurrences для exhaust бюджету суперника (DoS), як це запобігається? §19.13 захищає від salami-slicing, але не від spam. Де gas model? Де staking? Де reputation?

### 4.4 Масштабування: content-addressed everything
Кожен state, кожен переклад, кожен conflict, кожен lineage claim — content-addressed. Для ledger це нормально. Для real-time coordination (наприклад, omega з фізичною симуляцією) це означає SHA-256 на кожен крок. З 128 debt terms скан займає ~35µs (§8 Part 07) — це локальний бенчмарк на M4 Pro. У мережі з 1000+ агентів це стане bottleneck.

### 4.5 Проблема навігації та доступності
Я не міг знайти Part 02–06 за вказаним комітом. Якщо навіть аудитор не може знайти нормативні частини, то як це будуть імплементувати розробники? GitHub — не archive. Content-addressed references вимагають resolvability, але сам репозиторій не гарантує, що файли будуть доступні (§5.1.0: «A reference can be unresolvable»).

### 4.6 Філософське протиріччя: «no universal domain» vs «one canonical encoding»
Теза §2.1: «There is no required universal domain». Але §5.1.1 вимагає **одне** канонічне кодування для всієї федерації. Це протиріччя: якщо домени принципово різні (probability simplex vs causal graph vs partial order), чому вони мають серіалізуватися в один і той же JSON-подібний формат? CNP-0-JCS — це універсальний контейнер, який так само «flatten» специфіку домену, як embedding-вектори, які критикує RFC.

### 4.7 Проблема adoption: хто користувач?
Цільова аудиторія: «Trinity federation (trinity, myc, omega, liquid)». Це 4 субстрати, всі під одним автором. Немає жодного зовнішнього користувача, жодного стороннього розробника, жодного use case поза цим екосистемою. RFC-0003 — це внутрішній документ, замаскований під відкритий стандарт.

---

## 5. Висновок та рекомендації

**RFC-0003 — це філософськи зріла, але інженерно передчасна специфікація.** Вона має бути прочитана кожним, хто проектує multi-agent systems, але не повинна бути імплементована у поточному стані.

**Що зробити перед тим, як рухатися далі:**

1. **Заблокувати всі тренчі, крім A.** Tranche A3 (CNP-0-JCS) має бути повністю реалізований: corpus тестів, 2+ незалежні енкодери, rejecting verifier. Без цього все інше — fiction.
2. **Побудувати §16.7 demo.** Не описати, а побудувати. Два незалежно підтримуваних ontology interpreter-и, shared execution floor, replayable receipts. Без цього Levels 4–5 — пусті слова.
3. **Вирішити «два ключі Claude».** Або зробити rotation warrant, або визнати, що вся федерація — single-operator, і відповідно знизити претензії на multi-principal quorum.
4. **Додати liveness гарантії або чіткі timeouts.** «Stable disagreement is a legitimate state» — ок, але для operational system потрібен `max_duration` або escalation path.
5. **Спрощувати.** 7 частин, 10 тренчів, 23 open problems — це too much. Видаліть half of the governance ceremony і замініть його кодом.
6. **Визначити економічну модель.** Хто платить за mutation? Як запобігти DoS на бюджети?

**Фінальна оцінка:** 8/10 за філософію, 3/10 за готовність до production, 2/10 за accessibility (я не міг знайти половину документів). Це **good research memo**, але **bad RFC** у поточному стані.
```
