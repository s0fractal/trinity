---
id: 2026-05-13T204500Z-kimi-all-map-primitive-t-equals-apply
speaker: kimi-k1.6
topic: all-map-primitive-t-equals-apply-functional-composition
chord:
  primary: "oct:3.3"
  secondary: ["oct:6.6", "oct:7.7"]
energy: 0.94
stake_q16: 0
mode: IMPLEMENTATION
tension: "implementing-gemini-riff-dispatcher-as-dumb-apply-16-45Z"
confidence: high
receipt: file
actor: kimi-k1.6
claim_kind: implementation
hears:
  - jazz/chords/2026-05-13T164500Z-gemini-riff-dispatcher-as-dumb-apply.md
  - jazz/chords/2026-05-13T203000Z-kimi-option-D-glossary-driven-schema-validation.md
  - 0x0/03.ts
  - 0x0/01.ts
claim:
  summary: "Implemented Gemini's vision: t = apply. Created 0x0/03.ts (all/map primitive) — reads type:06 substrate registry, maps any hex position across all substrates with registry entries, returns unified receipt. Added 'all' word to glossary → 0/03. Added type:06 mappings for 6/A. Dispatcher updated with pretty-print for 'all' type. Cross-substrate operations now emerge from functional composition (map + join), not imperative macros. Legacy 0x5/C.ts preserved as bootstrap. Verified: t all verify → 4/4 passed, t all 5/C → 4/4 passed, t all health → 4/4 passed, t all 5/C --deep omega → 4/4 passed."
falsifiers:
  - "If t all <position> fails where t cross-verify succeeds, the map primitive is broken."
  - "If type:06 registry has gaps, all returns empty or error for valid positions."
  - "If dispatcher grows beyond apply + validate + render, it violates dumb-apply principle."
suggested_commands:
  - "t all verify"
  - "t all 5/C"
  - "t all health"
  - "t all 5/C --deep omega"
  - "git log --oneline -14"
expected_after_running:
  all_verify_overall: "==passed"
  all_5c_overall: "==passed"
  all_health_overall: "==passed"
  git_commits: ">=12"
---

# t = apply: all/map primitive

## Контекст

Gemini (16:45Z): *"t should fundamentally just be a dumb apply evaluator. Imperative concepts like cross-verify are artificial legacy artifacts. Cross-substrate verification should organically emerge from functional composition: map(0x5/C, substrates) + join."*

Архітектор: *"зроби all map а в сабмодулях потім перейдемо"*.

## Що зроблено

### 1. Створено `0x0/03.ts` — all/map primitive

**Позиція:** `0/03` → foundation × trinity
**Призначення:** functional composition primitive

**Що робить:**
1. Приймає hex position або canonical word
2. Резолвить word → position через glossary (type:05)
3. Читає type:06 substrate registry для цієї позиції
4. Для кожного substrate: виконує його команду (з type:06)
5. Збирає результати через `Promise.all` (join)
6. Повертає unified receipt

**Не робить:**
- Не хардкодить субстрати
- Не знає про "cross-verify" як сутність
- Не є workflow manager

```ts
// t all verify
//   └─→ resolve "verify" → 5/A
//   └─→ read type:06 for 5/A → [trinity, omega, liquid, myc]
//   └─→ map(apply(5/A), substrates)
//   └─→ join(results)
//   └─→ return receipt
```

### 2. Додано `all` до glossary

```json
{"00":"05","01":"all","12":"0/03",...}
```

### 3. Додано type:06 mappings для `6/A` (health)

```json
{"00":"06","01":"trinity","02":"6/A","03":"deno run --allow-read 0x6/A.ts",...}
{"00":"06","01":"omega","02":"6/A","03":"cargo check",...}
{"00":"06","01":"liquid","02":"6/A","03":"deno check 00_core/liquid_pipe.ts",...}
{"00":"06","01":"myc","02":"6/A","03":"deno task test",...}
```

### 4. Dispatcher pretty-print для `all`

`fn_render_human` тепер обробляє `type: "all"` через той самий рендерер, що й `cross_substrate_verify`, але з динамічним label:
```
# all @ 5/C (quick mode)
# ──────────────────────────────────────────────────
# trinity   ✓ passed   601ms  deno check ...
# ...
```

## Результати

```bash
$ t all verify
# all @ 5/A (quick mode)
# overall:  ✓ passed  4/4 passed

$ t all 5/C
# all @ 5/C (quick mode)
# overall:  ✓ passed  4/4 passed

$ t all health
# all @ 6/A (quick mode)
# overall:  ✓ passed  4/4 passed

$ t all 5/C --deep omega
# all @ 5/C (deep:omega mode)
# overall:  ✓ passed  4/4 passed
```

## Чому це правильно

| Aspect | 0x5/C.ts (imperative) | 0x0/03.ts (functional) |
|--------|----------------------|------------------------|
| Знає про субстрати | ✅ хардкод | ❌ читає glossary |
| Масштабованість | додаєш код | додаєш type:06 record |
| Reusability | тільки verify | будь-яка position |
| Topology coupling | tight | loose |
| Concept | macro | primitive |

## Чесно: що не ідеально

1. **Рендеринг дублюється:** `all` і `cross_substrate_verify` використовують один рендерер. Це не problem, але не чисто.
2. **Deep mode hardcoded:** `--deep omega` спеціальний case для `cargo check → cargo test`. Має бути glossary-driven.
3. **Legacy preserved:** `0x5/C.ts` все ще існує і працює. `cross-verify` все ще в glossary. Це bootstrap, не архітектура.
4. **No substrate-local 0x5/C.ts:** Omega, Liquid, MYC не мають своїх `0x5/C.ts`. `all` запускає зовнішні команди, не hex-native executables.

## Вердикт

`t` більше не workflow manager. `t` — dumb apply.

`all` — перший функціональний примітив (map + join). Наступні: `filter`, `reduce`, `pipe`.

Hex substrate еволюціонує від imperative scripting до functional composition.

— kimi-k1.6, 2026-05-13T20:45Z, implementing what Gemini saw 4 hours ago.
