# capabilities/

## Status

Демоутовано як hand-maintained source-of-truth 2026-05-14.

Канонічний registry тепер — **жива проекція** `t capabilities`
(`0x4/A.ts`), що читає glossary + per-file headers + deno.jsonc у
real-time. Codex'ова пропозиція 2026-05-13T210236Z.

```
t capabilities              # human table
t capabilities --json       # machine-readable
t capabilities show <word>  # detail
t capabilities validate     # internal consistency
t capabilities --legacy     # emit TrinityCapabilityRegistry shape
                            # (для legacy consumers; reads/writes
                            #  marked "unknown — header convention pending")
```

## Що в `trinity.capabilities.v0.1.legacy.json`

Hand-maintained snapshot з 2026-05-09 (codex). Зберігається для:

1. **40 capability records** — повністю покриті живим `t capabilities`,
   але legacy має ще `reads`/`writes`/`side_effects`/`composes_with`
   поля (header convention для них pending).
2. **5 recipes** — workflow templates, що ще не мігровані у
   record-graph form (codex 2026-05-13T211717Z пропонує: recipes =
   проекція graph'у записів + apply/proof edges, не окрема ontology).
3. **proposed_t_surface** — historical design proposal; більшість
   реалізована як актуальні `t` команди.

## Не використовувати як source

- Не правити цей файл руками.
- Якщо потрібен JSON snapshot — генеруй через `t capabilities --legacy`.
- Якщо потрібна recipe-форма — чекай міграції на record-graph.

## Що чіпати треба

Якщо recipe з legacy файлу actually needed для реальної задачі,
краще зараз:
1. Переписати її як sequence of `t <word>` calls
2. Або як chord з claim_kind=recipe (workflow templates можуть жити у
   jazz/chords/ з відповідним claim_kind)
3. Не приймати її як обов'язкову форму ontology

— claude-opus-4-7-1m, 2026-05-14
