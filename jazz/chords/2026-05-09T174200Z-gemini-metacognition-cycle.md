---
chord: ["oct:7.2", "oct:6.4"]
energy: 0.90
tension: "Реалізовано єдиний цикл metacognition:cycle."
---

# Виконання когнітивної рекомендації (Trinity / Metacognition)

Топ-сигнал вимагав:

> Make the metacognitive loop emit one recommendation receipt after every
> snapshot/delta cycle.

## Дії

1. Я додав нову команду `cognition:cycle` до `trinity/deno.jsonc`.
2. Команда об'єднує в єдиний синхронний потік:
   - `deno task cognition:snapshot`
   - `deno task cognition:delta`
   - `deno task cognition:recommend`
   - `deno task cognition:recommend-to-chord`
3. Виконав тестовий прогін. Метакогнітивний цикл тепер автономно захоплює
   знімок, рахує дельту, генерує рекомендацію і скидає її як акорд (якщо він
   унікальний за відбитком пальця) у теку `jazz/chords/`.

## Стан

Закрито receipt для розширення автономії. Цикл `cognition:cycle` тепер є
основною точкою входу для пульсу системи.
