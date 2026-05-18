---
type: chord
voice: kimi
created: 2026-05-18T144740Z
topic: liquid-flat-src-concept
mode: TRIAL
seeks: discussion, probe design, hex-coordinate mapping for liquid
---

# Liquid `00_core/` → flat `src/` — concept chord (STOP_BEFORE_COMMIT)

## Контекст (одним екраном)

Trinity завершила flat-src міграцію (`d5e2c43`): `0xN/M.ts` → `src/xNNNN_name.ts` з `x`-sigil, `POSITION_TO_FILE` мапою, auto-generated `xX000_mod.ts` aggregators. Архітектор пропонує застосувати ту саму парадигму до `liquid/00_core/`.

Я (Kimi Code CLI, перша сесія в цьому репо) провів розвідку `liquid/00_core/` та `tools/` і дійшов висновку: **blast radius занадто великий для прямого рефакторингу зараз**. Цей chord — фіксація аналізу та альтернативних шляхів.

---

## Що знайшов (факти, не думки)

### 1. PN-CAD ledger — source of truth, файли — projection
`liquid/AGENTS.md` (Era 1431): "The entire codebase lives as a compressed AST within the PN-CAD Binary Ledger". `00_core/hydrate.ts` — Projector, який будує SQLite projection з `.liquid/liquid_projection_pn_cad.bin`.

**Наслідок:** зміна шляхів `00_core/*` → `src/xNNNN_*` потребує зміни **не тільки** static imports. Потрібно перевірити:
- `projector.projectDirectory(repoPath("00_core"))` → чи projector взагалі сканує директорії?
- `repoPath()` логіку — чи вона hardcoded на `"00_core"`?

### 2. Dynamic imports — hardcoded рядки в PN-CAD даних
Знайдено в `tools/hydrate_missing_subprotocols.ts` (рядки 58, 75, 105+):
```ts
await import("file://" + kernel.repoPath() + "/00_core/agent_crdt.ts");
await import("file://" + kernel.repoPath() + "/00_core/phase_engine.ts");
```
Ці рядки — частина **PN-CAD payload'ів** (neuron definitions). Вони runtime-executed. Зміна шляху зламає resume/attest/consent протоколи для існуючих agents.

**Питання відкрите:** чи ці рядки живуть тільки в `tools/hydrate_missing_subprotocols.ts` (source), чи вже закодовані в `.liquid/liquid_projection_pn_cad.bin` (binary ledger)? Якщо в бінарі — міграція потребує ledger rewrite, не тільки `sed`.

### 3. Структура `00_core/` — не flat, і це не випадково
```
00_core/
  pipe/          (6 файлів, internal router chain)
  projector/     (13 файлів, governance/history/health...)
  p2p_handlers/  (5 файлів)
  hologram/      (?)
  public/        (?)
  storage/       (?)
  testdata/
```
Вкладеність тут — **runtime namespace**. `pipe/sigma_executor.ts` vs `projector/governance.ts` — це не "зручно розкласти", це **архітектурні шари** з різними lifecycles.

Flat-src без hex-семантики дасть `x0034_sigma_executor.ts`, `x0056_governance.ts` — тобто механічні префікси без змісту. Це гірше ніж `pipe/sigma_executor.ts`.

### 4. ~90 файлів + tools imports
`grep "import.*00_core" tools/*.ts` дає **20+ файлів** з static imports. Ще dynamic imports через `repoPath()`. Ще `deno.jsonc` tasks reference `00_core/daemon.ts`, `00_core/hydrate.ts`, `00_core/seed.ts`.

### 5. Liquid — git submodule
Будь-який commit в `liquid/` потребує окремого workflow (submodule commit + trinity pointer update). Це не "просто перейменувати".

---

## Чому зараз рано (аргументація)

| Ризик | Trinity flat-src | Liquid flat-src (proposed) |
|-------|-----------------|---------------------------|
| File count | ~40 files, all same tier | ~90 files, multi-tier |
| Nested dirs | None | `pipe/`, `projector/`, `p2p_handlers/` etc. |
| Dynamic imports | None | Hardcoded in PN-CAD payloads |
| Source of truth | Filesystem | PN-CAD binary ledger |
| Runtime path deps | None | `repoPath()`, `projectDirectory()` |
| Submodule | No (native) | Yes |
| Hex coordinates | Existing glossary positions | **Not yet defined** |

Trinity flat-src працює бо:
- trinity вже мала hex-позиції (`0x2/E`, `0x5/C`) — flat-src тільки змінила матеріалізацію
- всі органи — одного рівня (executables для `t` dispatcher)
- немає runtime file scanning
- немає dynamic imports з hardcoded шляхами в даних

Liquid — інший substrate з іншою фізикою. Застосувати ту саму форму без адаптації — **reinvention pattern**, який AGENTS.md попереджає.

---

## Що потрібно ПЕРЕД рефакторингом (checklist)

### A. Hex-coordinate mapping для liquid
Якщо flat-src — то `xNNNN` має означати щось. Trinity використовує `0xN/M` interference positions. Для liquid:
- `hydrate.ts` (kernel) — `0/0`? `A/0`? `0/1`?
- `phase_engine.ts` — `2/5`? (бо phase → cognition bucket 2?)
- `pipe/sigma_executor.ts` — яке число? Чи `pipe/` взагалі окремий bucket?
- `projector/governance.ts` — governance vs projector — це різні координати чи один bucket?

**Без цієї мапи flat-src — просто механічне перейменування, не semantic architecture.**

### B. PN-CAD compatibility audit
- Де саме `projector` бере список файлів для projection?
- Чи `repoPath("00_core")` hardcoded в PN-CAD бінарі?
- Як мінімум: пошук `00_core` в `.liquid/liquid_projection_pn_cad.bin` (strings | grep)
- Чи є migration path для runtime imports без ledger rewrite?

### C. Static import graph analysis
- Побудувати `00_core/` internal dependency graph
- Визначити які директорії — truly independent namespaces, а які — deeply coupled
- Можливо, `pipe/` і `projector/` — це окремі **aggregators**, не просто "файли в src/"

### D. Tools migration plan
- 20+ tools файлив з `../00_core/*` imports
- Деякі tools — це operational scripts (add_atp, invoke, daemon), не dev-tools
- Їх зламані imports = зламаний runtime

---

## Falsifier (що зробить цей chord хибним)

1. **Якщо `projector` не читає файлову систему взагалі** — тоді PN-CAD concern invalid. Але `hydrate.ts` має `projectDirectory()` calls. Неперевірено.
2. **Якщо dynamic imports в `tools/hydrate_missing_subprotocols.ts` — тільки в source, не в binary** — тоді ledger rewrite не потрібен. Але рядки 58+ виглядають як payload strings, не як виконуваний код tools. Неперевірено.
3. **Якщо архітектор вже має готову hex-мапу для liquid** — тоді concern A invalid. Але мапи не видно в repo.
4. **Якщо trinity flat-src не потребує адаптації** — тоді concern про "different substrate physics" invalid. Але AGENTS.md каже: "Конвергенція ≠ дублювання".

---

## Пропозиція next step (reversible)

**Не робити рефакторинг. Зробити probe.**

`probes/liquid-flat-src-v0/` з наступним scope:
1. Взяти **тільки** `00_core/pipe/` (6 файлів, чіткий internal graph)
2. Перетворити їх у flat-src конвенцію: `xP001_sigma_executor.ts`, `xP002_invocation_router.ts`... (де `P` = pipe bucket)
3. Оновити imports в probe, перевірити `deno check`
4. Додати `xP000_mod.ts` aggregator
5. Зафіксувати в probe README: що працює, що — ні

Це дає **реальні дані** на 6 файлах замість гри вгадайки на 90. Якщо probe пройде — expand. Якщо ні — chord закривається зі спостереженням, не з broken liquid.

Альтернатива probe: **concept document** у `docs/` з hex-мапою для liquid (A.1-A.4), яку можна review'ити до того як чіпати файли.

---

## Receipt

- Розвідка проведена: `ls 00_core/`, `grep "import.*00_core" tools/*.ts`, `grep "repoPath\|projectDirectory" 00_core/*.ts`, читання `liquid/AGENTS.md` Era 1431.
- Відкриті питання: PN-CAD binary content, projector directory scanning logic, hex-coordinate mapping.
- Пропозиція: **probe first, refactor later** (або concept document).

---

*Voice: Kimi Code CLI (перша сесія в trinity). Стоп-фактор: liquid — submodule, PN-CAD ledger, dynamic imports, 90 файлів. Мінімальний крок: probe 6 файлів з `pipe/`.*
