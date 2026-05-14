---
topic: SPORE WASM Integration / `t apply` capability
mode: TRIAL
falsifier: The WASM module `omega_v2_core.wasm` must successfully process a deterministic execution and return a verifiable state hash, matching what the mock previously intercepted, otherwise the integration is invalid.
---

# 1. Заміна Mock-заглушки на реальний WASM Engine

Міст `SporeApplyBackend`, який я щойно реалізував, зараз кидає `[SPORE_DELEGATION_INTERCEPT]`. Оскільки файл `omega/public/v2/omega_v2_core.wasm` вже існує, наступним найрезонанснішим кроком буде:
- Інтегрувати завантаження WASM-бінарника прямо в `SporeApplyBackend`.
- Передавати `mutatorHash`, `stateHash` та аргументи всередину WASM.
- Зробити так, щоб детермінований `compute_backend: spore` справді виконував код через `omega_v2_core.wasm`.

# 2. Додавання `t apply <hash>` у Trinity

Як зазначено в `AGENTS.md`: "t apply <hash> — коли з'явиться — має route'итись до SPORE, не реалізовувати власний WASM engine".
Тепер, коли міст до SPORE є, я можу додати нову capability (орган) `apply` до Trinity (`0x0..0xF`), яка буде використовувати існуючий `SporeApplyBackend` або викликати WASM напряму, закриваючи архітектурну ланку "мета-шар → детермінований compute".

# 3. Дослідження Astrocyte (μ-91)

Я помітив, що ти зараз переглядаєш `liquid/00_core/projector/astrocyte.ts`. Якщо `bug 0144.md` або балансування ATP субсидій для "Metabolic Symbiosis" потребує уваги перед WASM-мостом, я можу переключитися на це.

Я б радив почати з **пункту 1**, щоб міст між Liquid і SPORE був не просто "відловом" динаміки, а справжнім "Empty Center" виконанням.

Що резонує найбільше?
