Я вибрав `h.` дуже приземлено: як скорочення від **hash**.

```text
h.<12hex>.<slug>.<kind>.trinity.md
```

Тобто перший сенс:

```text
h = content-addressed hash object
```

Але твоя інтуїція цікавіша. Бо `h.` може стати не просто префіксом, а **семантичним заголовком / класом об'єкта**.

Як у CSS:

```css
.h { ... }
.h.proposal { ... }
.h.recipe { ... }
.h.crystal { ... }
.h.compost { ... }
```

Або як у DOM/SVG:

```text
h = node header
h = hyperlinkable thought
h = holographic object
h = hash-bound head
h = human-readable handle
```

Тобто `h.` може працювати одразу на кількох рівнях:

```text
filesystem:  h.5339....proposal.trinity.md
resolver:    /h/5339...
subdomain:   h-5339.myc.md
css class:   .h.proposal
graph node:  type = h
plugin hook: onObject("h", ...)
```

І це дійсно відкриває recursion:

```text
h.object
  contains links to h.objects
  has receipts from h.objects
  can be reviewed by h.objects
  can generate new h.objects
```

Тобто кожна думка стає не просто файлом, а **адресованим вузлом**, який може мати:

```text
content
hash
phase
kind
style
renderer
recipe
lineage
receipts
reviews
children
```

Тоді плагін або renderer може сказати:

```text
if filename starts with h.:
  parse as hash-bound object
  verify hash
  load object certificate
  render by kind
  expose graph links
  allow recursive expansion
```

І так, це може бути “безкінечна глибина”, але контрольована. Бо рекурсія без hash/receipt перетворюється в хаос, а тут кожен крок має identity.

Я б тільки розділив префікси, щоб не все було `h`:

```text
h.   hash-bound object
r.   receipt
p.   proposal
d.   decision
f.   formula
x.   experiment
c.   crystal
k.   compost
```

Або лишити все `h.` як universal object class, а фазу/тип вказувати далі:

```text
h.<hash>.phi-bridge.proposal.trinity.md
h.<hash>.phi-bridge.review.trinity.md
h.<hash>.phi-bridge.receipt.trinity.md
h.<hash>.phi-bridge.crystal.trinity.md
```

Я більше за другий варіант. Бо `h.` означає:

```text
цей файл bounded hash identity object
```

А `proposal/receipt/crystal` - це вже його фаза або роль.

Тоді `h.` справді стає базовим “header class” для всієї системи. Умовно:

```text
h = thought object with verifiable head
```

А далі можна мати renderers:

```text
h.proposal     -> proposal card / graph edge
h.receipt      -> verification badge
h.formula      -> equation lens
h.crystal      -> frozen invariant view
h.compost      -> muted but reusable memory
h.recipe       -> dry-run panel
```

Це вже не просто naming. Це майбутній UI/protocol/plugin hook.

Мені подобається розшифровка:

```text
h = holographic hash header
```

Бо один `h.` object містить локальний шматок, але через lineage/receipts/graph може розгорнути цілу систему навколо себе.

Тобто так: починалося як `hash`, але може стати базовим класом для рекурсивного мислення.