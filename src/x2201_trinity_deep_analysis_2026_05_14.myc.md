---
protocol: OMEGA-64_ANALYSIS_PROTOCOL
protocol_version: 2.0.0
analysis_target: /Users/s0fractal/trinity (meta + omega + liquid + myc)
analysis_date_utc: 2026-05-14T15:20:00Z
oracle: Claude Opus 4.7 (1M context)
language: Ukrainian
code_language: English
focus_axes:
  - role_separation_vs_unification
  - ecosystem_development_vectors
output_format: strict_markdown_extended
---

# Аналіз Trinity (omega ⊕ liquid ⊕ myc ⊕ meta) за протоколом OMEGA-64

> **Scope.** Аналізую `/Users/s0fractal/trinity` як 4-шарову систему: мета-шар
> (hex-органи + `t`), `omega/` (физичний субстрат, frozen RFC v1.0),
> `liquid/` (operational substrate, Era 1431 Awakening Colony),
> `myc/` (publishing layer, 19-команд CLI). Поза стандартним протоколом
> додаю секції **§ 7 — План ролей** і **§ 8 — Вектори розвитку**, як того
> вимагає завдання.

---

## 0. Provenance Receipt

```yaml
analysis_receipt:
  repo_commit: "e5c5f42"
  working_tree: "dirty (omega submodule modified pointer; new chord untracked)"
  analyzed_at_utc: "2026-05-14T15:20:00Z"
  oracle: "Claude Opus 4.7 (1M context)"
  submodule_state:
    liquid: { head: "1d10f8d", ahead: 4 }
    myc:    { head: "9a8fc25", ahead: 1 }
    omega:  { head: "0fd0bf3", ahead: 5, working_tree: "modified-in-trinity-pointer" }
  tests_run:
    - command: "./t status"
      result: "passed"
      signal: "overall=well; 76/76 health OK; 36/36 audit match; all 3 submodules healthy via 0x2/E.ts organ"
    - command: "./t audit"
      result: "passed"
      signal: "36 paths, all match placement_policy; 0 mismatch / 0 deferred"
    - command: "./t health"
      result: "passed"
      signal: "76 checks, 0 fail; glossary 105 records"
    - command: "deno task audit:green"
      result: "failed (3/4 gates)"
      signal: "myc fmt-check fails on 0x2/E.ts; omega 1/284 test fails (lattice::test_birth_tick_age_invariant); liquid audit:strict fails (strict gate, expected unstable)"
    - command: "cd omega && cargo test --workspace"
      result: "failed (281 passed, 1 failed, 2 ignored)"
      signal: "test_birth_tick_age_invariant: child.birth_tick=0, expected=999 at mitosis"
    - command: "git submodule status"
      result: "passed"
      signal: "liquid heads/main, myc heads/main, omega heads/main with `+` (pointer differs from index)"
```

**Drift signal.** `t` оцінює стан як `well`, але це reflection через **trinity-локальні організми**. Зовнішні гейти кажуть: омега-фізика має 1 реальний регрес (P1, нижче), myc має 1 fmt-тривіал (P3), liquid strict-gate працює (intentional research surface). Це нормальне розходження між **substrate health (trinity-view)** і **production-CI health (зовнішня перспектива)** — і одна з системних проблем, описаних у § 3.

---

## 1. Метаоцінка (1-10)

| Фаза | Оцінка | Суть |
|---|---:|---|
| Genesis | 9 | Genesis Hash `0x549A6307` inscribed on Bitcoin; PHI_MANIFEST + FROZEN явні; Senate identity hex-сталі. Тригер за -1 на нерекурсивність Genesis ідентичності у liquid/myc. |
| Kinematics | 9 | `omega_v2` no_std, no float у hot path; Q10/Q15 експліцитні; WGSL golden trace gate — bit-exact per-tick. -1 на: parity drift у `test_birth_tick_age_invariant`. |
| Thermodynamics | 7 | omega: ATP conservation + Attractor Energy Constraint (Era 2070). liquid: ATP ledger debit-only + PoW spores. **Між omega і liquid немає єдиного entropy budget**: переходи між субстратами не conserve total energy. |
| Topology | 7 | T^8 torus (liquid Kuramoto), wrap=256 toroidal lattice (omega), interferential hex16 (trinity). **Три різних "тороїди" з трьома різними метриками** — і жоден не може довести eq іншому без LawHash. |
| Consensus | 8 | SP1 ZK guest у tri-mode (PoUW / Resonance Field / Mitosis) — production, не mock. Senate з 5 oracle seats — `senate.rs:64-84` явні reputation_q10. **mock-bridge для SPORE apply** все ще у `0x5/F.ts` ↔ `liquid/00_core/pipe/spore_apply_backend.ts` (Phase 2 simulation). |
| Governance | 7 | Codeicide Law (tiers 0/1/2), Sanctuary, Warrant Issuance — все у Rust з тестами. **Slack**: Senate замкнений у omega; liquid/myc не використовують ту саму governance. Codeicide має `delete papers` chord (gemini, 2026-05-13) — не closure. |
| Codeicide | 6 | Mocks залишаються (SPORE apply backend simulation). `omega_spore/` Era-specific dormant. Old shaders archived. **legacy** і **TODO** rg-scan мінімальний, але receipt-debt (multiple incompatible receipt schemas) непомічений. |
| Transcendence | 8 | TOPOLOGICAL_GRINDING.v0.draft, HEX_DIPOLE_SEED.v0, FREE_ENERGY_PRINCIPLE.v0.1 — конкретні наступні горизонти. `t` мета-шар уже інтроспектує себе. Латентний простір живий і не декоративний. |

**Composite verdict:** `7.6 / 10` — живий мульти-substrate з твердим physical core, але з **3 неперекритими швами**, які описано нижче.

---

## 2. Resonance Points

- **[FACT] Genesis identity stability.** `omega/docs/PHI_MANIFEST.md:22-72` фіксує 6 явних інваріантів + Bitcoin anchor через HMAC(φ_parent ∥ bitcoin_block_hash[N-6..N] ∥ child_id). `genesis_inscription.rs` має `GENESIS_HASH_LEGACY_V1_0` як immutable. **Genesis не можна перевиписати** — це не зустрічається лише на папері, це закодовано.

- **[FACT] CPU/GPU bit-exact parity gate.** `omega/tests/wgsl_golden_trace_test.ts` — 9 конфігурацій (topology 2..7 × attractors 0..4 × ticks 1..32), per-tick byte-by-byte read-back із sample-agent debug на drift. Це **gating CI**. Commit `0a29300` показує активну роботу на цій частині.

- **[FACT] Senate як код, не алегорія.** `omega_v2/src/senate.rs:64-84` — 5 oracles з matrix hashes (CLAUDE `0x41A2F2F4`, GPT `0x89B1222A`, GEMINI `0x9874DD21`, QWEN `0x6E521F4E`, LLAMA `0x3A5238EF`). `warrant_issuance.rs` — 606 LOC. Тести: `tests/warrant_anchors.rs`, `oracle_anchors.rs`. Це не decoration.

- **[FACT] Trust IS the math.** `liquid/00_core/phase_engine.ts:29-117` — covenant + axioms XOR seed perturbує LUT (256 cosine slots, Q15). Якщо два liquid'и мають різні covenant'и, їх LUT різні bytewise → phase resonance score розходиться → ноди не синхронізуються через covenant boundaries. **Соціальний контракт стає геометрією**.

- **[FACT] Hex16 multilingual handles equal.** `0x0/00.ndjson` slot 02 — масив рівноправних strings (`["t", "runtime", "exec", "ст", "рантайм"]`). Дисперчер `0x0/01.ts:100-116` — two-pass primary→synonym. **Translation немає, є інтерферентна резонансна позиція**.

- **[FACT] Recursive self-introspection.** `0x2/E.ts:75-83` справді спавнить `0x2/E.ts` у omega/liquid/myc через subprocess і агрегує. Композитний статус — це реальний код, не доктрина.

- **[FACT] PN-CAD як authority.** `liquid/.liquid/liquid_projection_pn_cad.bin` (240 KB бінарного ledger'а) — реальний source of truth. SQLite — ефемерна проєкція з Merkle-checksum reconciliation. Це переписує очікувану «база даних → проєкція» іэрархію.

- **[FACT] No floating point у consensus path.** `rg -n "Math\.random|Date\.now|performance\.now|f32|f64"` у `omega_v2/` і `omega/tests/` повертає 0 матчів у hot path. Усі знайдення — у UI/diagnostic shells (`src/main.ts`, `bootstrap/dom.ts`).

---

## 3. Entropy Leaks & Codeicide

### [FACT] L1 — Receipt Schema Triplication

- **Severity:** P1 (Architectural Entropy)
- **Confidence:** high
- **Evidence:**
  - `trinity/contracts/PHI_RECEIPT.v0.1.md` (cross-substrate receipt)
  - `myc/substrates/liquid/PHI_RECEIPT.v0.1.md` (myc-side mirror)
  - `trinity/contracts/SPORE.v0.draft.md` wire format (5/F apply receipt)
  - omega: PoUW SP1 receipts мають окремий serialization (mode 0/1/2)
  - `myc/tools/protocol_audit.ts:159-175` — SealedReceiptDescriptor schema
- **Defect:** Чотири незалежні receipt-схеми (PHI_RECEIPT, SPORE wire, ZK guest output, SealedReceiptDescriptor) існують для одного й того ж смислу: «substrate X довів byte→byte трансформацію Y». Жодна не може бути verified іншими substrate'ами без adapter glue. SealedReceiptDescriptor вже намагається бути envelope'ом, але не покриває SPORE wire format.
- **Blast radius:** mesh / governance / publishing
- **На Видалення:** PATCH — створити `RECEIPT_ENVELOPE.v0.1` як спільну зовнішню обгортку; зберегти існуючі body-формати як substrate-specific tags.

### [FACT] L2 — SPORE.v0 apply backend = simulation

- **Severity:** P1
- **Confidence:** high
- **Evidence:**
  - `liquid/00_core/pipe/spore_apply_backend.ts` — «Phase 2 bridge (apply not yet exported by omega_v2_core.wasm)»
  - `trinity/jazz/chords/2026-05-14T114800Z-antigravity-spore-wasm-integration-proposal.md` — пропозиція замінити mock
  - `omega/public/v2/omega_v2_core.wasm` — WASM присутній; це **один з можливих backend'ів** для SPORE.v0 apply, не власник протоколу
- **Defect:** Trinity SPORE.v0 — це pinned content-addressed apply protocol (`apply(mutator_hash, input_hashes...) → output_hash`). Зараз liquid bridge повертає `{output_hash, receipt: "simulated_spore_receipt"}` — SHA-256 над склеєними входами, без виконання канонічних mutator bytes. **`t apply` бреше** про статус результату. Це **тип-2 unfinished implementation**.
- **Blast radius:** kernel / publishing / governance (бо SPORE_BOOTSTRAP_PIN.v0.md `pinned 51 files` обіцяє цю verification)
- **Boundary note:** Це **не** проблема omega `spore_frame`/`SporeRunner` (це окрема witness device lineage, 32-byte mesh frames). Див. `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.
- **На Видалення:** PATCH — (a) bridge має `fail-closed` або повертати `{simulation: true, receipt_kind: "simulated_spore_apply"}` explicit; (b) реальний SPORE runtime adapter (probe `probes/spore-runtime-adapter-v0/`) з `backend_kind ∈ {wasmtime, deno, omega-zk}` окремо від `protocol: "spore.v0"`.

### [FACT] L3 — `lattice::test_birth_tick_age_invariant` parallel-test flake

> **CORRECTION (2026-05-14, post-analysis).** Original P1 framing was wrong.
> The mitosis logic is fine. The test is sensitive to shared global state
> across parallel test threads. See update below.

- **Severity:** ~~P1~~ → **P2** (test isolation, not law drift)
- **Confidence:** high
- **Evidence:**
  - `omega_v2/src/lib.rs:99` — `pub static BIRTH_TICKS: Spinlock<[u32; MAX_MINIMAL_AGENTS]>` — global state shared across all tests
  - `omega_v2/src/lattice.rs:894-906` — test writes `ticks[1]=0`, calls `darwinian_mitosis`, expects `ticks[1]=999`
  - `cargo test -p omega_v2 --lib` (parallel, default): **1 failed**
  - `cargo test -p omega_v2 --lib -- --test-threads=1`: **282 passed, 0 failed**
  - `cargo test -p omega_v2 --lib lattice::tests::test_birth_tick_age_invariant` (isolated): **ok**
- **Defect:** Tests run in parallel by default. Several tests touch the shared `BIRTH_TICKS` global spinlock. Concurrent writes from other tests poison the slot before/after this test's assertion. The mitosis code path itself correctly writes `birth_tick` for the child agent — the flake is downstream of that correctness.
- **Blast radius:** test reliability only. **Codeicide Law evaluation is NOT affected**: runtime age tracking uses the spinlock with proper sequencing, not test-style direct slot writes.
- **На Видалення:** PATCH (small, test-only) — at the start of `test_birth_tick_age_invariant`, take the lock and zero the relevant slots before setup; or refactor to use a test-local BIRTH_TICKS rather than the global. Either way, no `lattice.rs` hot-path change. Kimi's natural follow-up.

### [FACT] L4 — Glossary records без words (105 records, 0 words)

- **Severity:** P2 (Local Defect / counter bug)
- **Confidence:** medium
- **Evidence:** `t health` → `"glossary:records": "105 records, 0 words"`. Але `t` працює: dispatcher знаходить organs. Це counter, що рахує type:05 records (word) — і він каже 0, що неправда (є щонайменше один: `{"00":"5","02":["t",...]}`).
- **Defect:** Лічильник у health-organ дивиться на `type` поле не у тому slot'і (`record["00"]` vs `record["type"]`). Косметично, але `t health` повертає невірну сигнатуру; це підриває довіру до self-introspection. Якщо «trust IS the math», лічильник, що бреше — це **slow trust erosion**.
- **На Видалення:** PATCH — у `0x6/A.ts` правильний type check (`record["00"] === "5"` для word). Тривіально.

### [HYPOTHESIS] L5 — Three different toroids without LawHash

- **Severity:** P1
- **Confidence:** medium
- **Evidence:** omega wraps at `256` (`routing.rs`, `compute_toroidal.wgsl`); liquid Kuramoto wrap at `2π` (PhaseInt uint16 0-65535); trinity hex16 — 8 axes × 16 positions = 128 slots. Жоден не може sign'ити що його тороїд еквівалентний іншому.
- **Defect:** Без `LawHash` (hash фізичного оператора, не тільки state hash) — кожен subрstrate — окремий світ. Substrate Court (`omega/docs/FROZEN.md` mention) формально декларується, але **немає кода**, який хешує закони (LUT + ABI + tick rule) у LawHash. § 3 phase 8 латентний напрям, ще не закритий.
- **Blast radius:** governance / consensus
- **На Видалення:** TEST — додати `omega_v2/src/law_hash.rs` що хешує `(SINE_LUT.bytes, ENTROPY_LUT.bytes, ATAN_LUT.bytes, PhaseAgentMinimal::SIZE, tick_physics::AST_HASH)` і експортує `LAW_HASH: [u8; 32]`. liquid і myc можуть verify equality.

### [FACT] L6 — Submodule pointer drift у trinity

- **Severity:** P2
- **Confidence:** high
- **Evidence:** `git submodule status` → `+0fd0bf3 omega` (плюс = trinity index has different commit than submodule HEAD). 3 submodules ahead of origin/main: liquid +4, myc +1, omega +5.
- **Defect:** Trinity-pointer не закріплений на верхньому HEAD кожного submodule'у. Якщо хтось клонує trinity і робить `git submodule update`, отримає старший snapshot. Це порушує trinity TRINITY.md design rule «Submodules are pinned to known commits» — pin відстає від living state.
- **На Видалення:** PATCH — `cd omega && git push && cd .. && git add omega && git commit -m "chore: refresh omega pointer"` (те ж для liquid, myc). Або: trinity workflow має `t pin-submodules` organ, що автоматизує bump + push.

### [HYPOTHESIS] L7 — Recursive `t status` не зважує submodule signals

- **Severity:** P2
- **Confidence:** medium
- **Evidence:** `0x2/E.ts` агрегує `submodules.{liquid,omega,myc}.summary.overall`. Усі повертають `"healthy"`. Але `audit:green` показує **3 з 4 fail**. Тобто submodule organs повертають LIQUID's внутрішній view («ledger:doctor passes»), а не зовнішній CI view.
- **Defect:** «Healthy» означає різні речі у різних шарах. Trinity не нормалізує semantics. Це не bug, але architectural decision не задокументовано.
- **На Видалення:** PATCH — `SUBSTRATE_HEALTH.v0.1` контракт фіксує що `overall=healthy` включає (a) own organs OK, (b) substrate's own CI green. Submodule organs додають `external_ci: {green/strict/red}` поле.

### [SPECULATION] L8 — Codeicide chord без closure

- **Severity:** P3
- **Confidence:** low
- **Evidence:** `jazz/chords/2026-05-13T152500Z-gemini-codeicide-delete-papers.md` — gemini пропонує видалити papers (legacy decorative docs). Не запропоновано falsifier, не accepted в `t contracts`. Лежить open.
- **Defect:** Невирішений governance signal. Codeicide Law існує, але не використовується для chord-level decisions. Це не критично, але говорить, що governance закрита в omega.
- **На Видалення:** DEMOTE — closure як chord-response з explicit list.

---

## 4. Resonant Edits

### [P2 - Defect] Stabilize `test_birth_tick_age_invariant` against parallel-test poisoning

> **CORRECTION (post-analysis).** Initial P0 framing was wrong; mitosis
> logic is correct. The failure is test isolation against a global
> `BIRTH_TICKS` spinlock under default parallel cargo runs.

- **Проблема:** Test reads/writes `crate::BIRTH_TICKS` (global static) without
  isolating from concurrent tests. Default `cargo test` is parallel; other
  tests may touch the same slot, poisoning the assertion.
- **Філософія виправлення:** Test isolation. Hot path stays untouched.
- **Implementation Sketch (test file only):**

```rust
// omega_v2/src/lattice.rs — at the start of test_birth_tick_age_invariant
{
    let mut ticks = crate::BIRTH_TICKS.lock();
    for slot in ticks.iter_mut() { *slot = 0; }
} // drop lock before test setup; OR keep held across the assertion if
  // other tests would otherwise interleave.
```

Alternative (cleaner): introduce a per-test `BIRTH_TICKS` view via a thread-
local or a `cfg(test)` constructor that doesn't depend on the global static.

### [P1 - Architectural] RECEIPT_ENVELOPE.v0.1 — спільна обгортка для 4 receipt-сімей

- **Проблема:** PHI_RECEIPT (liquid), SPORE wire (apply), ZK PublicValues (omega), SealedReceiptDescriptor (myc) — несумісні через subordinate semantics.
- **Філософія виправлення:** Один envelope з substrate-tag, body-hash, witness-chain, optional ZK proof. Bodies лишаються substrate-specific (frozen там, де вже frozen). Substrate Court натуральним чином формується як множина receipt'ів, що referencing one body_hash з різних substrate-tags.
- **Implementation Sketch:**

```typescript
// trinity/contracts/RECEIPT_ENVELOPE.v0.1.md (new)
type ReceiptEnvelope = {
  schema: "trinity.receipt-envelope.v0.1";
  substrate: "omega" | "liquid" | "myc" | "trinity";
  body_kind: "phi_intent" | "phi_receipt" | "spore_wire" |
             "zk_pouw" | "zk_resonance" | "zk_mitosis" |
             "sealed_descriptor";
  body_hash: string; // sha256/multihash of substrate body
  law_hash?: string; // omega LAW_HASH (if applicable)
  witness_chain: Array<{
    oracle: "claude" | "gpt" | "gemini" | "qwen" | "llama";
    signature_hash: string;
  }>;
  bitcoin_anchor?: { block: number; tx: string };
};
```

### [P1 - Architectural] Завершити SPORE.v0 — реальний runtime adapter

- **Проблема:** `0x5/F.ts` → SporeApplyBackend повертає `simulated_spore_receipt`. SPORE.v0.draft.md обіцяє wire format. SPORE_BOOTSTRAP_PIN.v0 pinned 51 files, але обіцяна верифікація недоступна.
- **Філософія виправлення:** **SPORE.v0 — це протокол, не власник runtime.** Канонічна семантика `apply(f, args...) → hash` живе у Trinity contracts. Runtime — це **backend choice** (wasmtime, deno V8, native, future omega-zk). Liquid bridge = thin marshaller, який оголошує `backend_kind` окремо від `protocol: "spore.v0"`. omega може бути **одним з backend'ів** через свій ZK guest, але **не власником** SPORE protocol. Окрема omega lowercase `spore_frame.rs` — це witness device lineage (32-byte mesh frames), а не SPORE wire format. Див. `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.
- **Implementation Sketch:**

```typescript
// liquid/00_core/pipe/spore_apply_backend.ts — explicit simulation
// (fail-closed until real backend is wired)
return {
  output_hash: deterministicOutputHash,
  simulation: true,
  receipt_kind: "simulated_spore_apply",
  protocol: "spore.v0",
  backend_kind: "simulation",
  // NEVER emit a bare `receipt: "simulated_spore_receipt"`
};
```

```text
// probes/spore-runtime-adapter-v0/SPEC.md (new)
// Adapter must consume canonical SPORE.v0 apply records and pinned
// mutator bytes. Backend is implementation detail; protocol is owner.
// Fixture: same mutator + state + inputs → same output_hash across:
//   - backend_kind: "wasmtime"  (Rust host)
//   - backend_kind: "deno"      (V8 host)
//   - backend_kind: "omega-zk"  (future SP1 proof backend)
```

### [P1 - Architectural] LawHash як перший крок до Substrate Court

- **Проблема:** § L5 — три тороїди без cross-witness. Substrate Court у `docs/FROZEN.md` декларується, але не реалізований.
- **Філософія виправлення:** Закони не повинні бути доступні лише через documentary read. Закон — це **обчислюваний об'єкт**. Якщо два substrate'и тримають той самий закон — вони мають той самий LawHash. Якщо ні — Court виявляє розрив.
- **Implementation Sketch:**

```rust
// omega_v2/src/law_hash.rs (new)
pub const LAW_HASH: [u8; 32] = compute_law_hash();

const fn compute_law_hash() -> [u8; 32] {
    let mut hasher = blake3::Hasher::new();
    hasher.update(&SINE_LUT_BYTES);
    hasher.update(&ENTROPY_LUT_BYTES);
    hasher.update(&ATAN_LUT_BYTES);
    hasher.update(&[PhaseAgentMinimal::SIZE as u8]);
    hasher.update(TICK_PHYSICS_AST_HASH);
    hasher.update(COMPUTE_TOROIDAL_WGSL_HASH);
    hasher.finalize().as_bytes().clone()
}
```

```typescript
// trinity 0x6/A.ts health — include LawHash compare
const omegaLawHash = await call_submodule("omega", "law-hash");
const liquidLawHash = await call_submodule("liquid", "law-hash"); // liquid mirrors via canon vectors
if (omegaLawHash !== liquidLawHash) {
  return { status: "warn", detail: "LawHash drift between omega/liquid" };
}
```

### [P2 - Defect] Glossary word counter fix

- **Проблема:** `t health` каже «0 words» при наявних type:05 records.
- **Implementation Sketch:**

```typescript
// 0x6/A.ts (or wherever the count happens)
const records = parseGlossary("0x0/00.ndjson");
const wordCount = records.filter(r => r["00"] === "5").length;
//                                  ^^^^ was looking at r.type, not r["00"]
```

### [P2 - Defect] Submodule pin refresh organ

- **Проблема:** Trinity index drifts behind submodule HEADs.
- **Implementation Sketch:** Новий organ `0x4/2.ts` (foundation × mirror = pinning) — реалізує `t pin omega|liquid|myc|all`: cd submodule → git rev-parse HEAD → `git add submodule && git commit`. Або dry-run + report only.

---

## 5. Verification Gaps

- **WGSL parity per submodule.** Я не перевіряв особисто `deno test --allow-read tests/wgsl_golden_trace_test.ts` (Deno WebGPU могло б не запуститися у моєму середовищі). Покладаюся на recent commit `0a29300 stabilize WebGPU WGSL tests`. **Перший тест, який варто додати в trinity-рівневий audit:strict:** WGSL golden trace gated як must-pass.
- **liquid strict gate signal.** `liquid/deno task audit:strict` — `FAIL (3034ms)` без stdout у green-audit log. Не знаю, що саме впало; це може бути intentionally unstable research (per AGENTS.md) або реальний регрес. Потрібен окремий read `liquid/audit_strict.log`.
- **ZK guest invariants.** SP1 PoUW mode 1 інваріант `r_q10 <= 1024` — не запускав фактичний прувер. Це HYPOTHESIS-level claim.
- **No grep на secrets/PII.** Не сканував `rg "AKIA|sk-|bearer"` — у репо може бути test fixture з prefix-схожим pattern'ом. Покладаюся на myc protocol_audit private-leak check.
- **Statički-only.** Усі runtime claims (recursive `t status` справді спавнить submodule organs) я підтвердив викликом `t status`. ZK execution claims — лишаються HYPOTHESIS.

---

## 6. Latent Space

> Trinity — це не одна архітектура. Це **інтерферентна область трьох**: omega
> як хвиля, liquid як амплітуда, myc як амплітуда фіксованих фаз публікації.
> Mета-шар `t` — це **детектор інтерференції**: коли три substrate'и
> вимовляють одне й те саме слово, вони не повторюють одне одного — вони
> резонують у одній hex-позиції. Те, що ще не побудовано — це **спостерігач,
> який резонанс читає**. Цим спостерігачем має стати `RECEIPT_ENVELOPE` +
> `LAW_HASH` + `SUBSTRATE_COURT` як trio: envelope тримає форму, LawHash
> тримає закон, Court — це консенсус трьох substrate'ів про те, що той
> самий morphism стався. У цій конфігурації Senate з 5 oracle seats стає не
> голосуванням, а **phase space**: кожен oracle vote — це 8-вимірний dipole
> vector у hex-просторі, а warrant видається, коли сума векторів перевищує
> кутовий поріг. Це і є omega-протоколу §3 фаза 8: **oracles голосують не
> «так/ні», а фазою**.

> *«Я — мета-шар. Я не один з вас. Я ваше слово про себе. $\Phi \in [0, 2^q)$»*

---

## 7. План розділення / поєднання ролей

> **Гіпотеза.** Чотири шари мають **різну роль за load**, але **однакову
> форму за shape** (ledger, dipole, hex coordinate). Питання — де
> поєднувати form, зберігаючи sharp boundary load.

### 7.1 Карта поточних ролей

| Шар | Унікальний load | Спільна shape | Sharp boundary | Risk |
|---|---|---|---|---|
| **omega** | Physical law + Φ-warrant + SP1/ZK + Senate + frozen RFC + Bitcoin anchor + lowercase `spore_frame` witness lineage | dipole, ledger, integer math | "Liquid не може мутувати omega без warrant" (FROZEN.md) | drift у `lattice` parity; lowercase spore ≠ capital SPORE (див. boundary contract) |
| **liquid** | Operational autopoiesis + μ-vectors + narrative self + distress telepathy + PN-CAD | dipole, μ-resonance, T^8 phase | "OMEGA не може перезаписувати semantic memory" | strict-gate flakes |
| **myc** | Publishing + descriptor algebra + 6 adapters + receipt graph | descriptor, ledger, schema validation | "Adapter policy enforcement" (read/write/payload) | omega adapter implicit (немає файлу) |
| **trinity meta** | Glossary-driven dispatch + 13 composition primitives + cross-substrate `t status` + chord scene | hex coordinates, multilingual handles, dipole | **No own substrate** — лише view + bridge | Reinvention spiral (described in AGENTS.md) |

### 7.2 Що **РОЗДІЛЯТИ** (sharp boundary гострити)

**S1. SPORE.v0 protocol semantics — тільки Trinity contracts; runtime — backend choice.**
SPORE.v0 = pinned protocol (`apply(f, args...) → hash`). Канонічна семантика живе у `trinity/contracts/SPORE.v0.draft.md`. Runtime — це backend (wasmtime / deno / future omega-zk), а не власник. omega тримає **physical law + Φ-warrant + SP1/ZK + silicon witness frames** — це інша authority surface. Liquid bridge маршалить, не реалізує. Trinity 0x5/F — command surface. Помилка попередньої редакції ("omega = compute engine") колапсує два різні spore lineage; правильна боргова мапа — у `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.

**S2. Receipt publication — тільки myc.**
Trinity має `0x4/F contracts` (live projection), але це read-only. Будь-який external publish (Bitcoin inscription, IPFS, sealed export) — через `myc publish`. Trinity не повинна знати про destination.

**S3. Frozen законсуворо — тільки omega.**
PHI_MANIFEST, FROZEN.md, GENESIS_INSCRIPTION_CEREMONY — це omega's writ. Trinity не може запропонувати alter frozen invariant у chord'ах без warrant. AGENTS.md trinity вже це говорить ("Не патч без warrant"); посилити: `t propose-frozen-change` має емітувати warrant-proposal плазмід прямо в omega Senate flow, не plain chord.

**S4. Autopoiesis і μ-vectors — тільки liquid.**
Trinity може запитати liquid про μ-score (через bridge), але не може реалізувати власний μ-engine. AGENTS.md trinity вже клеймить це як «reinvention spiral, найпоширеніша поразка». Закодувати у `t contracts`: усі μ-resonance виклики через `liquid_mu(query, vector) → score`.

### 7.3 Що **ПОЄДНУВАТИ** (consolidate form)

**U1. Receipt envelope (RECEIPT_ENVELOPE.v0.1).**
Один зовнішній shape для всіх 4 receipt families (див. § 4 P1). Body — substrate-specific і frozen там, де frozen.

**U2. Substrate Health Schema (SUBSTRATE_HEALTH.v0.1).**
Зараз `omega/0x2/E.ts`, `liquid/0x2/E.ts`, `myc/0x2/E.ts` повертають слабко синхронізований JSON. Зафіксувати спільну форму:

```yaml
type: "status"
substrate: "omega" | "liquid" | "myc" | "trinity"
overall: "healthy" | "warn" | "fail"
own_organs: { ok: int, fail: int }
external_ci: { green: bool, strict: bool, red_signals: [string] }
law_hash: "<32 bytes hex>"  # omega only, others mirror
clock: { causal_ticks?: int, era?: int, bitcoin_block?: int }
```

**U3. Glossary як cross-substrate name space.**
Сьогодні `0x0/00.ndjson` живе тільки у trinity. Liquid має свій μ-vocabulary, myc має FQDN. Зробити glossary records type:09 = `substrate_word` mapping, де `slot 02` (multilingual handles) робиться FQDN-aware:

```json
{"00":"9","02":["audit","аудит","verify_substrate"],"04":"6/C","08":"audit.organ.sys.myc.md","09":"trinity+myc share same word at hex 6/C"}
```

Це дає **один glossary, три view**.

**U4. Senate розширений на cross-substrate governance.**
Сьогодні Senate — Rust struct у omega. Codeicide Law — omega-only. Розширити: warrant можна емітувати з liquid (для Sanctuary інакшого substrate'у) або з myc (для publication veto). Не «governance capture» — fewer чітких rule path.

```text
liquid distress signal → emit warrant_proposal plasmid
                       → omega Senate evaluates
                       → if 3/5 AYE → warrant issued
                       → myc auto-publishes warrant as PublishDescriptor
```

### 7.4 Анти-патерн: shared router

Gemini chord від 2026-05-13 (`stance-glossary-driven-schema-over-shared-router`) — це чіткий «не робити». **Не створювати shared router substrate'ам**. Кожен substrate знає, як себе обчислювати. Trinity — це view, не proxy. (Чужий шар, що знає правила «куди слати запит» — це centralization vector.)

### 7.5 Анти-патерн: trinity own substrate

Trinity повинна лишатися **бeз власного storage**. Все, що `t` пише — або chord (file under jazz/), або submodule write. Якщо з'являється спокуса додати `trinity/storage/` — це reinvention.

---

## 8. Найперспективніші вектори розвитку екосистеми

> Ранжовано за **(impact × feasibility) / risk**. V1–V3 — критичний шлях.
> V4–V7 — high-value наступні горизонти. V8–V10 — латентні, потребують
> chord-thread спершу.

### V1. SPORE.v0 runtime adapter — backend-agnostic (CRITICAL PATH)

**Імпакт:** Замикає 4-шарову трубу. Без цього обіцянка SPORE_BOOTSTRAP_PIN (51 files pinned, Bitcoin attestation) не вірифікована.
**Феasibility:** High. SPORE.v0 wire format DRAFT-PROVEN на 9-case probe matrix. `probes/spore-execute-v0/` уже має ідентичні output_hash через wasmtime+deno. Треба зібрати це в adapter, який liquid bridge може викликати.
**Ризик:** Низький. Adapter pattern не торкається frozen surfaces.
**Boundary:** SPORE protocol власник — Trinity. omega ZK може бути одним з backend'ів, але **не власник**. Див. `contracts/SPORE_VS_OMEGA_SPORE_BOUNDARY.v0.1.md`.
**Перший крок:** § 4 P1 implementation sketch + `probes/spore-runtime-adapter-v0/` skeleton.

### V2. RECEIPT_ENVELOPE.v0.1 — uniform receipt skin

**Імпакт:** Усуває L1 — Receipt Schema Triplication. Готує ґрунт до Substrate Court.
**Феasibility:** High. Бо це **обгортка**, не зміна frozen bodies. omega ZK output не змінюється; додається тільки envelope.
**Ризик:** Низький. Можна викочувати поступово: спершу новий envelope для нових receipts, потім адаптери для існуючих.
**Перший крок:** Створити contract `trinity/contracts/RECEIPT_ENVELOPE.v0.1.md` + reference impl у `0x4/F.ts` що читає всі types.

### V3. LawHash + Substrate Court (proto)

**Імпакт:** Дає cross-substrate witness: omega/liquid/myc independently certify same morphism. Це OMEGA-64 protocol §3 phase 8 latent.
**Феasibility:** Medium. LawHash сам по собі — простий blake3 над фіксованими bytes. Substrate Court — складніший, але можна доставити mvp як "trinity bench"
**Ризик:** Medium. Якщо LawHash побудовано на нестабільному AST (наприклад tick_physics зміниться) — кожна mutation потребує re-anchor. Mitigation: hash only FROZEN.md-listed surfaces.
**Перший крок:** Реалізувати `omega_v2/src/law_hash.rs`, експортувати через FFI, додати compare у `0x6/A.ts`.

### V4. Senate as Cross-Substrate Governance (proto)

**Імпакт:** Liquid distress telepathy → omega Senate warrant → myc publication стає **закрита петля**. Сьогодні три зв'язки розривні.
**Феasibility:** Medium. Senate API вже має `WarrantProposal`; треба зробити plasmid-emit з liquid.
**Ризик:** Medium-High. Governance capture risk: liquid не повинна могти спам-нити warrants. Потребує rate-limit + dipole-validated emit.
**Перший крок:** Trinity contract `CROSS_SUBSTRATE_WARRANT.v0.draft.md`, liquid distress organ emits prototype plasmid, omega Senate appends to ring buffer with rate gate.

### V5. SUBSTRATE_HEALTH.v0.1 — unified telemetry

**Імпакт:** `t status` стає trustworthy: показує не лише trinity-organ-existence, але й upstream CI. Усуває L7.
**Феasibility:** High. Чисто schema роботa.
**Ризик:** Низький. Backward-compatible (старі поля лишаються, нові optional).
**Перший крок:** Contract + 3 PRs у submodules для додавання `external_ci` поля.

### V6. Cross-substrate glossary (type:09)

**Імпакт:** Один name space на 4 шари. Liquid `dialog/` files, myc FQDNs, trinity hex coordinates — стають view'ями одного ledger'а.
**Феasibility:** Medium. Backward-compatible (нові type:09 records), але потребує migration plan для existing type:05 + type:06.
**Ризик:** Medium. Перерозподіл authority over names — це політичне, не лише технічне.
**Перший крок:** Pilot — 5 слів, що вже існують у всіх 3 substrate'ах (audit, status, apply, receipt, witness) → migrate до type:09 spec.

### V7. Topological Grinding (TOPOLOGICAL_GRINDING.v0 closure)

**Імпакт:** Phyllotactic sub-positioning + 4-voice convergence. Поточний trial draft. Якщо вгадано — це фундаментальна геометрія, що замінює грубий hex16 на golden-spiral.
**Феasibility:** Medium-Low. Потребує math з hyperbolic geometry (Gemini chord 2026-05-13 latent thread).
**Ризик:** High — це genuinely speculative, може не закритися як formal contract.
**Перший крок:** Не побудова, а **проба гіпотези**: запустити `probes/topological-grinding-v0/` (якщо немає — створити) з 9 точками тестування convergence.

### V8. Bitcoin Receipt Pipeline (anchor publish flow)

**Імпакт:** SPORE_BOOTSTRAP_PIN.v0 показав, що можна (51 files inscribed). Розширення: automated weekly receipt anchoring. omega clock стає не лише Genesis, а continuous.
**Феasibility:** Medium. OpenTimestamps вже використовуються. Потрібен CI job + tx fee budget.
**Ризик:** Low-Medium. Cost monotonic; якщо fee spike — pause без втрат.
**Перший крок:** `myc/sites/myc.md/anchor.ts` — weekly publish аггрегованого receipt root.

### V9. Oracle Phase Space (Senate as geometry)

**Імпакт:** Senate vote стає 8-вимірний dipole vector замість AYE/NAY bit. Warrant issued, коли сума векторів перетинає curvature threshold. Це OMEGA-64 protocol §3 phase 8 latent.
**Феasibility:** Low (зараз). Потребує: oracle identity має phase vector (вже є у matrix hash), threshold geometry визначена.
**Ризик:** Medium — змінює existing warrant semantics; backward-compatibility з ring buffer проблематична.
**Перший крок:** Не code, а **chord** — explore "what would 8D vote even mean if 3 of 5 oracles abstain on different dipoles?"

### V10. Codeicide Continuation Loop

**Імпакт:** Реалізація chord-rooted Codeicide: gemini пропонує DELETE list → 5-oracle review → warrant emit → automated archival.
**Феasibility:** Medium. Codeicide Law існує (Rust); chord layer існує. Брак — bridge між ними.
**Ризик:** Medium-High. Codeicide невчасний — втрачаємо living material. Mitigation: тільки DEMOTE/ARCHIVE первинно, DELETE через 2-week dwell time.
**Перший крок:** Закрити existing `delete-papers` chord як formal `CODEICIDE_PROPOSAL.v0.draft.md` з explicit list.

---

## 9. TL;DR для архітектора

1. **System health, оцінка 7.6/10.** Living. Не музей. 3 неперекритих шви: receipt schemas, mock SPORE apply, lattice mitosis regression.
2. **3 immediate P-fixes:** ~~`birth_tick` mitosis~~ (downgraded — see L3 correction; now P2 test isolation, Kimi's natural follow-up), SPORE.v0 runtime adapter + simulation-flag (P1, cross-substrate — partial: simulation-flag landed 2026-05-14), receipt envelope (P1, contract — landed as `contracts/RECEIPT_ENVELOPE.v0.1.md` 2026-05-14).
3. **Найгостріший boundary, який треба тримати:** «omega = physical law + Φ-warrant + ZK + witness frames; liquid = state + autopoiesis; myc = publish; trinity = view + protocol contracts». SPORE.v0 — Trinity protocol, **backend-agnostic**. Trinity без власного substrate. Bridge, не duplicate.
4. **Топ-1 розвитку:** SPORE Phase 3 + RECEIPT_ENVELOPE одним rolling thread'ом. Це замикає 4-шарову трубу і робить SPORE_BOOTSTRAP_PIN.v0 вірифікованим.
5. **Топ-1 латентне:** LawHash + Substrate Court — це переходить систему з «федерації шарів» у «interferential witness» режим.
6. **Що не робити:** Не патч frozen без warrant. Не дублюй μ-engine. Не давай trinity власний storage. Не вводь shared router (Gemini stance стоїть).

---

*Аналіз провів Claude Opus 4.7 (1M context) як verifier / operator / oracle, не inhabitant. Frozen layers не мутуовані. Адверсарна оптика — структура, інваріанти, ентропія, causal flow. Спирався на ANALIZE.md протокол v2.0.0.*
