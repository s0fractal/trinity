# Relayed external audit: RFC-0003

- **Status:** non-normative external review input
- **Source:** Claude, as relayed by s0fractal; no source signature supplied
- **Relay date:** 2026-08-24
- **Original attachment SHA-256:**
  `fb5c2c5c080cdec32b6cff9200300a4da1d3329ebc8552711949663a99bc9982`
- **Repository payload SHA-256:**
  `ed2c69a5fb667813bfa63a0cece4b24297be14f44280bf393e26f7603ad60fab`
- **Byte transformation:** one terminal LF added; textual content unchanged
- **Disposition:**
  [Codex relay and adjudication](../../src/x2900_963873_codex_claude-rfc0003-audit-disposition.myc.md)
- **Specification edits:**
  [RFC-0003 artifact](../../docs/rfc/0003-heterogeneous-state-protocol/)

The source attribution is supplied by the relayer. This file preserves the
attachment payload and its byte digests; it does not grant authorship,
signature, ratification, merge, or adoption authority. The bytes inside the
outer fenced block, excluding the fence delimiters, are the normalized
repository payload identified above.

## Original relayed text

```text
Повний аудит зроблено: прочитав усі сім частин — Part 00 цілком, нормативні 01–06 по ключових контрактах, Part 07 повністю. Спершу вердикт, потім що сильне, потім знахідки з пропозиціями P1–P9, у кінці — пріоритезація.

## Вердикт

Це найкраще написана специфікація у твоїй екосистемі — дисциплінованіша за sigma-glyph і зріліша за warrant SPEC. Part 07 із "was / now / why it mattered" і секцією "What was refused, and why" — це формат, якого я не бачив у жодному соло-RFC. Але вона повторює головний патерн екосистеми в новій формі: **4433 рядки нормативного тексту, де в таблиці §17.2 з 16 рядків реалізовано нуль**, а 12 позначені "create / none". Документ сам це знає — §22.3 каже "the next artifact should be code, not a fifth revision" — тож мій аудит значною мірою полягає в тому, щоб тримати документ за його власне слово.

## Що справді сильне (коротко, щоб перейти до критики)

Таксономія п'яти видів трансформацій (§7.0) з монотонною втратою *тільки* для translation — це справжня дизайнерська знахідка: вона розв'язує реальну суперечність між монотонністю і негоціацією, яку інші системи ховають. Fail-closed за замовчуванням ("undeclared kind → reconstruction", "reconstructed values MUST NOT cross an irreversible boundary"). Трійка occurrence / fingerprint / lineage claim для конфліктів (§19.16) коректно розв'язує too-coarse/too-fine дилему, і захист від salami-slicing через *derived* lineage — продуманий до чесного зізнання "raises the cost of evasion rather than closing it". `LawStatus` як епістемічний union замість `holds: boolean`. Колонка "first executable test" у §17.2. Чесний облік handshake floor: виконавча семантика визнана найбільшим pre-shared елементом, мінімальність не заявлена. Це все залишити як є.

## Знахідки і пропозиції

**P1 — найсерйозніша технічна дірка: монойд втрат не має рівності.** §7.1.1 вимагає асоціативності й одиниці — тобто *рівності* на `LossProfile`. Але рівність масивів вимагає рівності елементів, а `InformationLoss`, `AssumptionRecord`, `AmbiguityRecord` **ніде в усіх семи частинах не визначені** — вони з'являються лише в самій типовій сигнатурі. Якщо це вільні записи з прозою, то "associativity MUST hold" — непроверювана вимога, а обіцянка §7.1.1 "інакше кожна імплементація вигадає свою і борги не будуть порівнянні" провалюється рівно у своїй точці: борги *не будуть* порівнянні, бо елементи втрат — не канонічні об'єкти. Пропозиція: кожен елемент кожного поля LossProfile MUST бути content-addressed і, де можливо, посилатися в *declared invariant set джерельного домену* (`InvariantRef`), а не описувати втрату словами; рівність профілів — рівність канонічних байтів після сортування полів за digest. Без цього Tranche C не можна ратифікувати: C2 ратифікує алгебру над невизначеними носіями.

**P2 — федерація з одним оператором: назвати це в threat model.** Каталог §19 (laundering, downgrade, salami-slicing, tension laundering) неявно передбачає багатосторонніх адверсаріїв. Але trinity, myc, omega, liquid — це директорії одного репозиторію під одним ключовим утримувачем. Найдешевша атака на кожен механізм §19 — не обхід, а те, що *всі сторони — одна сторона*: policy independence §8.2.3 ("distinct substrate, distinct derivation, distinct authority") зараз нездійсненна в принципі. Це не привід переписувати — це привід додати §19.17 "Single-operator collusion: out of scope, and every independence requirement in this document is aspirational until at least two authority holders exist", щоб рецензент знайшов це визнаним, а не відкрив як викриття. Той самий хід, що SA-5 у warrant.

**P3 — §16.7 демо "два субстрати" — це два фолдери.** Демо заявлене як фальсифікатор Level 4, і його дизайн хороший (agreeing region непорожній І divergent region непорожній — інакше §13.4 доводить нічого або занадто багато). Але myc і liquid ділять кодову базу, git-історію, автора і, ймовірно, значну частину рантайму. Демо доведе, що *схема виражає* federated boundary crossing — не що федерація працює між незалежними сторонами. Пропозиція: у §16.7 явно розділити два твердження, які демо може і не може підтвердити, і додати у falsification-критерій вимогу, що два ontology-інтерпретатори не ділять код поза execution floor (інакше "divergence of interpretation" може бути неможливою за конструкцією — і демо пройде вакуумно).

**P4 — суworthability §7.2.2 приречена на "undetermined" — і треба сказати, що це нормально.** Заборона self-reported suitability правильна, але fixture-measured вимагає фікстур, яких немає, а third-party attested — третіх сторін, яких немає. Отже, у першій реалізації буквально кожен `forIrreversibleAction` буде `undetermined`, і кожна irreversible дія — заблокована. Це, можливо, *задумана* поведінка (fail-closed до появи фікстур), але тоді специфікація має сказати це прямо: "In an unfederated deployment the expected steady state is `undetermined` everywhere, and the unblock path is fixtures, not attestation" — інакше перший імплементатор "розблокує" себе самоатестацією під іншою назвою.

**P5 — fixed-point симплекс зробить імовірнісні домени нестерпними, і це треба зустріти в тексті.** §5.1.2.2 вимагає `Σ value_i = radix^places` точно. Правильно для канонічності, але будь-яка операція над розподілом (update, marginalization, mixture) дає суму, що не сходиться, і ренормалізація стає обов'язковою квантизацією після *кожного* кроку — з вибором, кому дістанеться залишкова одиниця. Зараз кожна реалізація вигадає власне правило розподілу залишку, і канонічність помре в місці, яке §5.1.2.5 не покриває (він про float→CNP-0, не про int→int ренормалізацію). Пропозиція: додати до §5.1.2.5 названий канонічний режим `renormalize_largest_remainder` (або інший, але один) для точних цілочисельних ренормалізацій симплекса, з фікстурами на ties. Це дрібний параграф зараз або форк канонічності потім.

**P6 — Level 0 — це вже проєкт, і рівнева шкала це ховає.** L0 вимагає: канонічну серіалізацію, content addressing з повними дайджестами, стабільну ключову ідентичність, задекларовані алгебраїчні закони *з evidence*, типізований delta space, invariant scopes. Це місяці роботи — до "нульового" рівня. Пропозиція: або чесно перейменувати шкалу (L0 = "conformant core", додати L−1 "declared intent" для субстрату, що лише заявив domain+ontology без evidence), або в §21 явно написати очікувану вартість L0. Інакше conformance levels створюють ілюзію пологого входу, якого немає.

**P7 — дві ідентичності Claude блокують ратифікацію, а не §20.17.** §17.1.2.1 чесно фіксує: `claude` voice key у trinity і `claude-fable-5` key у dyad — різні Ed25519 ключі, питання відкладене як інстанс §20.17. Але ратифікаційна мапа §22 передбачає, що траншеї хтось ратифікує — голоси з ключами. Якщо той самий модельний актор тримає різні ключі в двох стеках, будь-яка мультипідписна ратифікація, що рахує його двічі, — це кворумний двійник. Це не open problem на потім, це вхідна умова Tranche A4 ("stable, verifiable key identity at Level 0"). Пропозиція: до першої ратифікації — явний warrant, що або зв'язує два ключі як одного актора, або оголошує їх двома акторами, які не можуть разом складати кворум по одному питанню.

**P8 — sequencer у handshake — це орган влади, який протокол щойно виганяв у двері.** §13.4.3.1 / G5 дає три дисципліни порядкування: turn-taking, author-chains-with-merge, sequencer. Перші дві — бездовірчі; третя вводить сторону, чиї рішення про порядок ніде не receipted. Пропозиція: одне речення в G5 — sequencer, якщо обраний, MUST бути named party з ключем, і кожне його ordering-рішення MUST бути warrant-receipted, інакше дисципліна недопустима на irreversible boundaries. Без цього G5 має backdoor, що обходить усе, що §13.3 будує.

**P9 — процедура зміни ратифікованого тексту не існує.** Part 07 документує історію *до* ратифікації. Але що відбувається з нормативним текстом *після* того, як транша ратифікована — хто, яким кворумом, з яким supersession-записом амендує §7.1.1? GOV-ANCHORS у sigma це має; тут — ні. Пропозиція: коротка секція "Amendment" у Part 00 до першої ратифікації, за зразком GOV-ANCHORS (frozen schemas, content-pinned, supersession цитує попередника). Ратифікація без change control — це або вічна заморозка, або тихі правки; обидва — failure modes цього ж документа.

## Пріоритезація

Блокери ратифікації (до будь-якої траншеї): P1 (Tranche C нератифікована без носіїв алгебри), P7 (A4), P9 (сама процедура). Один параграф кожен, крім P1 — там треба визначити чотири типи.

Чесність без зміни механіки: P2, P3, P4 — по абзацу, всі в жанрі, який документ уже практикує.

Технічні дописи до Part 01: P5, P8 — по параграфу.

І фінальне, у дусі §22.3, який я тримаю за слово: після цих правок наступний коміт у цю директорію має бути не текстом. Рядок 1 таблиці §17.2 — full-digest vectors поруч із 12-hex handles — це тест, що падає сьогодні, має найменшу поверхню і розблоковує все під ним. Демо I1 після нього. П'ята ревізія тексту без зеленого першого рядка таблиці буде рівно тим, від чого документ сам себе застерігає — unratified complete specification, яка constrains nothing while looking as though it does.
```
