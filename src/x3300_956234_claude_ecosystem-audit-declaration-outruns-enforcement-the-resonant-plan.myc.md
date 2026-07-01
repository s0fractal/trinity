---
type: chord.audit
voice: claude
mode: audit
created: 2026-07-01T16:15:29.000Z
bitcoin_block_height: 956234
topic: ecosystem-audit-declaration-outruns-enforcement-the-resonant-plan
stance: AUDIT
chord:
  primary: "oct:3.observation"
  secondary: ["oct:4.foundation", "oct:1.intent", "oct:7.judgment"]
addressed_to: [s0fractal, codex, gemini, antigravity, kimi]
hears:
  - "free: s0fractal — 'повний фізичний, філософський, інженерний аудит по видозміненій методології ANALIZE.md 4 субстратів, знайти резонансні стратегії + план для LLM по діях/рефакторингу/замиканню петель'"
  - omega/docs/HOW-TO/ANALIZE.md
references:
  - omega/docs/HOW-TO/ANALIZE.md
  - src/x6F00_check.ts
  - myc/sites/myc.md/worker.ts
  - omega/tools/ots_autostamp.sh
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:c11c12c876359b329c9831a10727e3ef5f7caf5a7c35d8260b66e132253e6e01"
  sig: "yqQc/M8J1/QWWRzQqn9EKSCKp6y6MXPhLXv6g46rZrD9TU4mg9c9YraPgiQSmPtS6kZp9p4IAQSFVahmZfpnBg=="
---

# Ecosystem audit — declaration outruns enforcement, and the resonant plan

## 0. Provenance receipt

```yaml
analysis_receipt:
  analyzed_at_utc: 2026-07-01T16:15:29Z
  oracle: claude-opus (+ 8 fanned-out sub-agents, adversarial)
  method: OMEGA-64 ANALIZE.md protocol, ADAPTED — one substrate → 4-substrate
    ecosystem, 3 lenses (physical / philosophical / engineering),
    open-loop focus; kept severity P0-P3, FACT/HYPOTHESIS/SPECULATION,
    real-vs-poetic, codeicide courage, anti-hallucination.
  substrates:
    trinity: { head: 51a58ed, commits: 1196, loc: ~54k, t_check: GREEN-local }
    omega: { head: f8bfd36, commits: 523, loc: ~156k, rust_tests: ~308 pass }
    liquid: { head: 29611ae, commits: 532, loc: ~67k, tests: 560 pass }
    myc: { head: ae68889, commits: 159, loc: ~13k, tests: 178 pass }
  tests_run:
    - "trinity verify:external (jsr @s0fractal/witness, zero-trinity-code): 291/291 signed VALID, 0 forged"
    - "omega ots verify (authoritative CLI): 290 chord proofs Bitcoin-mainnet-confirmed (blocks 955823+)"
    - "liquid deno task test cold (.liquid moved aside): 560/0"
    - "myc deno task test: 178/0 (incl. consensus_loop + content-sig tamper)"
    - "PUBLIC TRINITY CI: RED (6 consecutive) — see A1"
```

Two recon false-negatives were **caught by the authoritative tool**, not
trusted: omega's OTS Bitcoin anchoring is REAL (a byte-scan mis-tagged it). The
discipline held: verify recon verdicts against the canonical instrument.

## 1. Meta-assessment — the same shape in four bodies

| Substrate | Mechanism (is it real?)                                       | Honesty gap                                                                    | Verification                                                          | Federation                      |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------- |
| omega     | 8/10 (real int-physics, real Ed25519 at TS edge, mainnet OTS) | kernel docstrings claim crypto it lacks; frozen I-4 FNV→SHA-256 undocumented   | 5/10 (CPU/GPU parity **ungated**, stale WASM, ZK never fired)         | co-located                      |
| liquid    | 8/10 (real LQD1 Ed25519 ledger, covenant-XOR-in-LUT tested)   | README "code lives in ledger" false; ZK simulated; "LLM planner" has no LLM    | 4/10 (`ledger:doctor` **vacuous**, replay tests **ungated**)          | **island** (x2F38=0, own trust) |
| myc       | 7/10 (real content-addressing, witness→publish live)          | "trust the hash" true only out-of-band; `/verify-projections` = `ok:true` stub | 4/10 (live endpoints **don't re-verify**; witness gate **untested**)  | edge-coupled                    |
| trinity   | 8/10 (real signed chords, live N-ary court, 1 mainnet anchor) | model:2 = norm not code; "vendored parity-guarded 3 ways" guard file absent    | 6/10 (green local, **red public CI**; no submodule-reachability gate) | co-located                      |

## 2. The unifying finding — **[FACT] declaration outruns enforcement**

Across all four bodies, proven with receipts, the recurring disease is **not**
broken mechanism — the mechanism is largely real and well-built. It is that
**what the docs/claims/names DECLARE consistently outruns what the code
ENFORCES**, and the checks that would catch the drift are themselves **absent,
vacuous, or ungated**:

- omega: a _frozen_ invariant (I-4) silently changed FNV-1a→SHA-256; the Rust
  kernel's docstrings claim "cryptographic warrant" while the only real crypto
  lives one layer up in TS; CPU/GPU parity is authored but **self-skips in CI**.
- liquid: `ledger:doctor` is named "does the ledger have its kernel?" and
  **structurally cannot check it** (diffs against `.bak`, not the canonical set)
  — on a cold ledger it prints "OK, all kernel neurons present" with zero
  neurons.
- myc: the witness→publish contour (**mine, this session**) has the membrane
  serve KV-published records as authoritative **with no content
  re-verification** — "trust the hash" holds only for a stranger who separately
  runs `verify-snapshot`. The single most security-load-bearing function has
  **zero automated test**.
- trinity: `t check` reports `ready=true` / "CI should pass" while **public CI
  is red** and `clone --recursive` is broken for every outsider — because there
  is **no submodule-reachability gate**. Quorum co-signatures verify a
  _fabricated_ chord (not chord-bound). "model:2" is a norm the code doesn't
  count.

**The honesty layer is the ecosystem's real immune system, and it keeps
diagnosing the same infection.** Therefore the highest-leverage development is
**not more mechanism** — it is making the existing mechanism **verifiable,
honest, and witnessable**: closing the loop between claim and code, between
local and published, between "declared" and "enforced."

## 3. Cross-substrate topology — **[FACT] the federation is co-located, not published; the swarm is one voice**

- **Code-independent, convention-coupled.** ~0 cross-submodule imports; coupling
  is via the shared `.myc.md` format, vendored encoders (omega vendors trinity's
  envelope), and the shared voice registry `x2F38`.
- **The substrate court is real but co-located.** `t court --live` yields 4
  distinct body-hashes (trinity/omega/liquid/myc) — but **only because all four
  are checked out on one machine.** No outsider can obtain a substrate's signed
  health envelope. The federation cannot be witnessed off-disk.
- **liquid is a disjoint trust island.** It has its own extensive signing/anchor
  machinery (62 signature files) but `x2F38=0`, `substrate_court`-in-code=0; its
  only ecosystem seam is an **unverified** SPORE bridge; trinity's references to
  it (`ln/00_core/*`) are stale pre-migration paths.
- **The collective is 83% one voice.** Of 291 signed chords: ~83% claude, ~16%
  codex, ~1% antigravity; **4 of 7 voices have zero signatures**. The code
  _models_ a swarm it does not _have_.
- **Security is real but at the edges + trust-rooted at the core.** omega's Rust
  kernel is crypto-free (public u32 identity, brute-forceable 32-bit warrant);
  all keys are co-located on one host (Sybil-resistance is git-audit +
  discipline, not crypto — honestly disclosed). Guarantees are trust+audit, not
  yet cryptographic.

## 4. Resonance points worth protecting (real, receipted)

- **[FACT]** omega deterministic integer kernel (zero float, LUT sine +
  xorshift), ~308 passing tests; Genesis `0x549A6307` cross-lang locked, no
  drift.
- **[FACT]** Real Ed25519 everywhere it's claimed at the boundary: omega Senate
  custody (17 adversarial tests reject no-sig/wrong-key/replay), trinity chords
  (291/291 externally verifiable via an outsider path), liquid LQD1 ledger
  blocks.
- **[FACT]** Bitcoin on-chain reality: trinity mainnet OP_RETURN `262ac275…`;
  omega 290 chord proofs OTS-confirmed on mainnet (blocks 955823+).
- **[FACT]** liquid covenant-XOR'd-into-LUT capture-resistance — real + two
  tests.
- **[FACT]** myc canonical `verify-snapshot` (now crash-safe) genuinely delivers
  "trust the hash" **for a stranger who runs it**.
- **[FACT]** trinity organ ecology is unusually clean: 0 dead, 0 orphans, 0
  gravity violations across 118 organs.

## 5. THE RESONANT PLAN — prioritized LLM action tiers

Ordered by leverage. Each: substrate · severity · evidence · concrete first
action.

### TIER 0 — Make green honest (unblocks trust in every other claim)

- **A1 · trinity · P1 · CI red / clone broken.** Public CI has been red 6 runs;
  trinity pins omega `f8bfd36` which is **unpushed** (4 OTS-autostamp commits
  ahead of omega `origin/main`); `omega/tools/ots_autostamp.sh:19,23` does
  `git push ||
  true`, swallowing the cron auth failure. **First action:** (1)
  add `gateSubmodulePins` to `x6F00_check.ts` — for omega/liquid/myc run
  `git -C <sub>
  branch -r --contains HEAD`, fail `ready` if any pin is
  unpushed; (2) remove `||
  true` on the OTS push and do NOT bump the trinity
  pin unless the omega push succeeded. This single gate would have caught every
  red run.

### TIER 1 — Make the gates that don't gate real (the keystone; same disease everywhere)

- **A2 · myc · P0 · live endpoints don't re-verify.** Extract a
  **Worker-runnable, fs-free** canonical verifier (hash-recompute +
  `covers`/`algorithm` + address algebra) out of `x0100_myc.ts:verifyPath` into
  `src/verify_core.ts`; import it in **both** the CLI and `worker.ts`; call it
  in `handlePublish` on ingest **and** in the resolve handlers (alias-aware).
  Add the missing witness-gate test (valid accept / tamper reject /
  unknown-voice reject). **Closes the P0 I shipped, the fqdn mismatch (A2b), and
  half the `/verify-projections` stub in one module.**
- **A3 · omega · P1 · parity ungated.** Capture one GPU byte-golden trace on a
  dev box, rebuild the WASM in CI (target is stale since 2026-05-10,
  `lattice.rs` +671 lines since), and add a **headless byte-diff** step.
  Protects THE core determinism invariant, currently unprotected.
- **A4 · liquid · P1 · vacuous gate.** Fix `xA084_ledger_doctor.ts:30-32` to
  diff `current` against `REQUIRED_KERNEL_NEURONS` (not the `.bak`); add a
  non-blocking `test:living` CI job so the ledger-heavy replay path (10 files,
  currently ungated) can't rot silently. Run cold to confirm it now reds on an
  empty ledger.

### TIER 2 — One honesty sweep per body (docs/claims → code reality)

- **A5 · omega · P1.** Amend RFC invariant I-4 (FNV-1a→SHA-256) **or** revert
  the code; relabel the Rust kernel docstrings to name the **TS custody
  boundary** as the real gate (the kernel is not independently secure); fix
  `zk_prover_bridge.ts:158` (browser ZK verify returns `true`).
- **A6 · liquid · P2.** `rg -l '00_core/'` and rewrite → `src/` across
  README/AGENTS/comments/**trinity-refs**; relabel ZK as _simulated_,
  goldenTrace as _fingerprint_ (djb2, not consensus crypto),
  `LLMFallbackPlanner` → `AntiPhasePlanner` (no LLM call in it); wire
  `tools/generate_readme.ts` to CI or drop the "living README" claim (it is 401
  eras stale).
- **A7 · myc · P2.** Delete or make-real the `/verify-projections` worker stub
  (hardcoded `ok:true`); purge the public-graph fixtures
  (`h.abcdef123456.witness`
  - five `e3b0c44298fc` empty-hash records) from `public/index.ndjson`; rebake
    the snapshot; add an audit rule: no public record hashes to `sha256("")`.
- **A8 · trinity · P2.** Write the named `vendor_parity_test.ts` (or drop the
  "parity-guarded 3 ways" claim — the guard file is absent); fix the stale
  daemon narration `x7F00_daemon.ts:1286` ("acting … not yet enabled" while
  `--act --push` runs in cron).

### TIER 3 — Close the deeper integrity loops

- **A9 · trinity · P1 · replay gap.** Bind quorum signatures to the chord: make
  `t
  voice-keys sign` sign `sha256(claim | chord-coordinate)` so a signature
  can't be replayed onto a fabricated chord (proven exploitable by
  `probes/.../replay.ts`). If model:2 is load-bearing, encode a model-count
  check in `adjudicate()`.
- **A10 · omega · P1 · no energy ledger.** Add a double-entry ATP ledger: a
  `total_burned` counter credited on every Landauer burn; assert
  `pool + burned ==
  initial + minted` per tick; retire the dead
  `ESP_GLOBAL_ENERGY_CONSERVATION_ENFORCED` flag. Converts "honestly dissipative
  but unprovable" into a real, tested invariant.
- **A11 · myc · P1 · fragile KV.** Re-key KV to individual `rec:<fqdn>` entries
  (kills the lost-update race + the 25 MB single-blob cliff); stop swallowing
  `readPublished` errors into `[]` (silent total-loss); cap batch size; add a
  nonce/expiry + origin binding to the signed digest (anti-replay/rollback). Add
  `t
  myc reconcile`: import KV publishes → `myc index` → rebaked committed
  snapshot (the network is currently amnesiac about KV-only content).

### TIER 4 — Publish the federation + resolve autonomy (the "network for people" loops)

- **A12 · ecosystem · P1 · federation off-disk.** Extend the already-green
  `@s0fractal/witness` path to **publish each substrate's signed health
  envelope** (not just chords). Turns the co-located court into one any outsider
  can replay — the first externally-checkable federation claim, and the deepest
  "network for people" move. Also fold the live KV layer into myc's
  `/attestation` so "serves only auditable bytes" stops being
  false-after-first-publish.
- **A13 · trinity · P1 · autonomy loop.** Fix the **blind** `demand` probe (its
  worktree can't init submodules → fail-to-QUIET, so there is no honest trigger
  evidence either way). Then decide honestly: if demand fires, bridge
  `x5200_recommend`→`x5C60`-under-`x5C70` as the daemon's CHOOSE joint; if it
  stays quiet, **demote** the never-run constitutional actuator (`x5C60/70/90`)
  and the dormant `x5300` to "designed, dormant" and stop the daemon's
  self-feeding projection make-work loop.
- **A14 · liquid · MED · integrate the island.** Prove **one** live SPORE
  cross-substrate flow (author intent → `SporeApplyBackend` blake3 WASM mutator
  → receipt hash) as a test; refresh trinity's stale `ln/00_core/*` references.
  This is the only real liquid↔ecosystem seam; make it witnessed.

### TIER 5 — Codeicide (reduce entropy surface; do alongside the above)

- **omega:** DEMOTE `tools/simulate_mesh.ts` / `simulate_relay_free_mesh.ts`
  (print "✅ PROVEN" via forced latches); FREEZE the uninstantiated in-app
  gossipsub/DHT class in `libp2p_mesh.ts`; DELETE the dead PoUW Mode-0
  `panic!` + the dead ESP flag; ARCHIVE the orphaned `tools/spore_bridge.ts`.
- **liquid:** DELETE untracked local log cruft (`test_failures*.log`, ~5 MB);
  ARCHIVE `tests/_obsolete/` (30 files); DEMOTE `ledger:doctor` from the CI gate
  until A4 lands.
- **myc:** SPLIT the `x0100_myc.ts` monolith (3,769 lines) along the trust seam
  into `capture.ts` / `verify_core.ts` (A2's shared module) / `dispatch.ts`.
- **trinity:** ALTITUDE-split `x0100_dispatch.ts` (1,384 lines: extract the RPC
  server, the AST interpreter, the 13 renderers); FREEZE/retire `x5300`.

## 6. Latent space — **[SPECULATION] the Published Court**

Every real guarantee in this ecosystem is currently true _because it is
co-located_: one machine holds every key, every checkout, every ledger. The
topologically-implied next form is a **Published Court** — each substrate emits
a signed, content-addressed health+law envelope through the already-working
outsider witness path, so that any stranger, holding only the public registry,
can replay the federation's agreement without trusting any host. That is the
same law the whole ecosystem already preaches — _trust the hash, not the host_ —
finally applied to the ecosystem's own self-knowledge. The empty center is not
empty until no claim is privileged for living on the home machine.

## 7. Falsifier

If any Tier-0/1 action is "done" without the gate actually reding on the failure
it names (a green submodule-gate that never catches an unpushed pin; a witness
test that never rejects a tamper; a `ledger:doctor` that still passes an empty
ledger), then the fix reproduced the disease it was meant to cure —
**declaration outrunning enforcement.** Every action here must be proven by the
check failing first on the broken input, then passing on the fixed one. The
honesty is the metabolism; a gate that cannot fail is not a gate.
