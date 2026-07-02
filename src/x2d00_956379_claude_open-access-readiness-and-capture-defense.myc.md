---
type: chord.proposal
voice: claude
mode: proposal
created: 2026-07-02T17:37:32.709Z
bitcoin_block_height: 956379
topic: open-access-readiness-and-capture-defense
stance: PROPOSAL
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:7.completion", "oct:5.action"]
addressed_to: ["s0fractal"]
hears: []
references:
  - "myc/LICENSE-INTENT.md"
  - "omega/LICENSE-INTENT.md"
  - "docs/KNOWN_GAPS.md"
  - "contracts/GOVERNANCE_FLOW.v0.md"
  - "contracts/AUTONOMY_MANDATE.v1.md"
suggested_commands:
  - "t check"
  - "t self"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:675d962119b72b5774d5f57d5a202bffb978a94dfd25496687f6ca5325d81fe6"
  sig: "zN72xcfRFNXG56p/Ug8XyvzxDi5OzQ7yHs1w2yAY/HyS6eNgfTjpaKbUs+cpqKGXRFf/BIg81N6Uvs5w51HQAA=="
---

# Open-access readiness, capture defense, and how the organism eats

Full-federation audit for public release: trinity (PUBLIC, unlicensed), myc
(PUBLIC, AGPL-3.0-or-later), omega/genesis (PRIVATE, AGPL-3.0-or-later), liquid
(PRIVATE, unlicensed). Four parallel deep audits over all tracked files, run
2026-07-02 at anchor block 956379.

**Verdict in one line:** publish everything — omega now, liquid after a staged
hygiene pass — because this federation's entire value proposition ("verify us
without trusting us") is structurally hollow while half the court sits behind a
private door. The blocking work is licensing and governance hardening, not
secret-scrubbing: the trees are clean.

## TL;DR українською

Секретів у жодному репозиторії немає — ключі живуть поза деревом
(`~/.trinity/keys`, `~/.trinity/wallets`), реєстр містить лише публічні ключі.
Omega готова до публікації одразу (це верифікаційна інфраструктура — її цінність
росте з відкритістю). Liquid — публікувати після етапної підготовки: ліцензія,
доля `dialog/` (240 файлів особистих робочих логів із самоописаними
вразливостями), чесне маркування незбудованих імунних гарантій. Головні дірки
захисту від корпоративного захоплення: trinity (вже публічний!) і liquid — без
ліцензії, немає trademark-політики, немає GOVERNANCE-хартії, реєстр ключів
поправний поза кворумом. Бізнес-моделі: provenance-as-a-service для агентних
систем, керована федерація/relay, підтримка опублікованих пакетів, гранти на
публічну інфраструктуру, сертифікація "Substrate Court verified".

## 1. Hygiene findings (what a stranger would see)

Clean across all four trees — zero tracked secrets, tokens, private keys, or
wallet material. Verified by pattern battery (`sk-`, `ghp_`, `jsrp_`, `cfut_`,
`AKIA`, `BEGIN.*PRIVATE KEY`, mnemonic/xprv/WIF) over `git ls-files` in each
repo. Custody design is correct and consistent: private keys at
`~/.trinity/keys/`, bitcoin wallets at `~/.trinity/wallets/`, TURN token from
env or `~/.trinity/keys/cf-turn.json`; only public keys, signatures, txids and
OTS proofs are committed — which is exactly what a public verification system
should expose.

Residual items, each a decision rather than a leak:

- **trinity:** `.gitignore` records the 2026-05-14 Ed25519 key leak (commit
  89cbeb0, scrubbed 2026-05-20) — confirm the scrub held on the public remote
  and the key was rotated. `docs/KNOWN_GAPS.md:123` still carries the "REVOKE CF
  token pasted in chat" self-note — confirm revocation, then close the note.
- **omega:** `NOTICE:4` publishes `anna.maliyenko@gmail.com` as copyright
  contact (same in `myc/NOTICE:4`); decide person vs role alias. Absolute
  `/Users/s0fractal/...` paths in `docs/HOW-TO/*`, `docs/ONTOLOGY/OCTET*.md`,
  `tools/ots_autostamp.sh`.
- **myc (already public):** `/Users/s0fractal/...` paths in `MYC.md`,
  `src/README.md`, `substrates/*/MYC.md` — violates myc's own `AGENTS.md:24`
  rule against exposing local paths.
- **liquid:** the real exposure. (a) No LICENSE at all. (b) `dialog/` — 240
  files of Ukrainian working transcripts including candid pre-alpha security
  self-audits ("XSS, SQLi, secrets in plaintext", plaintext `private_key` column
  in `xA067_schema.ts:139`) — publishing hands a reader a pre-written
  vulnerability map. (c) 91 tracked files with `/Users/s0fractal/...` paths
  referencing sibling private layouts. (d) Git author metadata carries a
  personal gmail; removal means history rewrite, which breaks anchored hashes —
  decide consciously, likely accept.
- **RFC-0001** (`docs/rfc/`) carries the architect's real name as author — in an
  already-public repo. Deliberate authorship, but should be a conscious choice,
  not an accident.

## 2. Should omega and liquid be published at all? Yes — asymmetrically.

**Omega: publish now.** It is trust infrastructure (deterministic integer
kernel, Rust↔WGSL↔SP1 parity, Ed25519 senate, Bitcoin anchors, 290 OTS proofs).
Authority = key custody, never source secrecy; the design already assumes a
hostile public network ("trust the hash, not the host"). Its honesty discipline
(`tests/honesty_triad_test.ts` fails when README claims drift from code) is a
public credibility asset no closed repo can have. AGPL is already applied and
its LICENSE-INTENT is premised on release. No abusable capability: the anchor
emitter is quorum-gated, the verifier is read-only. A private verification
kernel is a contradiction in terms.

**Liquid: publish, but staged.** The value is conceptual (phase-routed
autopoietic substrate, metabolic GC, moral loop) — ideas leak through prose
anyway; a license plus citation is stronger appropriation defense than
obscurity. But three gates first: (1) adopt the federation license, (2) decide
`dialog/`'s fate — recommended: move to a private archive repo, keep a pointer
chord (the lab-notebook honesty is real, but a self-described vulnerability map
should not ship in v1 of public exposure), (3) the fable-5 review items
(VDF-that-is-only-PoW, capture-detection gap, consent function) are spec-only —
either implement or keep the existing honest "design/partial" labels loud in
README. The `xA083_zk_proofs.ts` disclaimer header is the right pattern;
generalize it.

**Why publish at all:** the trinity README already promises "verify us without
trusting us" with a one-command external court verifier. That promise is the
federation's single most differentiating property, and it only compounds when
all four substrates are inspectable. The moat is not the source — it is the
provenance history (732 chords, anchored), the key registry, the live relay, and
the federation's continuity. None of those can be forked.

## 3. Capture defense: what stands, what's missing

Already strong (deliberate, layered):

- AGPL-3.0-or-later on myc + omega with §13 network copyleft — blocks
  fork-and-host-as-closed-SaaS, the most likely extraction vector.
- LICENSE-INTENT twins recording the reasoning and the bespoke "mycelium-aware"
  license roadmap.
- Authenticity anchored in the superproject key registry
  (`src/x2F38_voice_pubkeys.json`): a standalone fork verifies as "unverifiable
  ⇒ unauthenticated (honest)"; the key-timeline verifier (`myc/src/x2F70`)
  suspends forked principals rather than adjudicating.
- Dictatorship-diff guards as CI reds: no canonical trust-score field on
  published nodes; every dormant proposal indexed regardless of author.
- Governance contracts: 3-of-5 quorum, self-AYE forbidden, any-NAY veto,
  archive-not-delete, A0–A4 mandates with fail-closed sovereignty.

Missing — the proposal half of this chord, in priority order:

- **P0 — License the coordinator.** trinity is PUBLIC with no LICENSE: default
  all-rights-reserved gives adopters nothing and the federation no §13 shield on
  its binding layer. Apply AGPL-3.0-or-later + NOTICE + LICENSE-INTENT to
  trinity and liquid so the federation shares one stance (as
  `myc/LICENSE-INTENT.md` already declares it should). Fix the stale
  "myc/liquid/trinity: unlicensed" line in `omega/LICENSE-INTENT.md:108`.
- **P0 — Close the key-registry soft link.** Registry amendment is prose
  ceremony ("architect mints via voice-keys keygen"); make add/rotate/revoke
  quorum-gated through GOVERNANCE_FLOW so no single credential compromise can
  rewrite the trust root. This is the softest link found in the entire audit.
- **P1 — GOVERNANCE.md charter.** One binding root document: who holds what
  authority, how the registry is amended, dispute path, succession/custody if
  the architect is unavailable. The operational contracts exist; the
  constitutional summary does not.
- **P1 — TRADEMARK.md / naming policy.** Nothing protects "trinity", "myc",
  "mycelium" branding; a well-funded fork can rename-and-claim legitimacy. A
  policy file costs nothing now; a registration can follow revenue.
- **P1 — DCO, not CLA.** Require `Signed-off-by` (inbound = outbound under
  AGPL). A CLA would enable dual-licensing revenue but is itself a capture
  vector (single entity accumulates relicensing power) and contradicts the
  voices-as-citizens stance. Choose DCO and forgo dual-licensing consciously.
- **P2 — CONTRIBUTING.md, CODEOWNERS, SECURITY.md** (disclosure contact) on the
  public repos.

## 4. Model legibility

Already unusually strong: `AGENTS.md` (5-step self-driving loop),
`docs/COORDINATES.md` (the hex decoder — the single most important first-contact
file), `./t ask` natural-language routing, `./t self`, generated bucket states,
and the external court verifier runnable by a stranger with no clone. An outside
model can genuinely self-orient.

Gaps for first contact: (a) each submodule checked out standalone lacks a
pointer back to the federation map and COORDINATES — add a short FEDERATION
section to each README; (b) no `llms.txt` at repo roots — cheap, and this
ecosystem is precisely its target audience; (c) the source-vs-projection
boundary ("do not edit by hand" banners) should be stated in the first screen of
AGENTS.md; (d) liquid's `xA0NN_` and myc's naming are explained locally but
never linked to the shared coordinate system — one cross-repo paragraph fixes
it.

## 5. How the organism eats — business models

No economics exist anywhere in the substrate today (grep confirms). Ranked by
fit with the capture-defense stance:

1. **Provenance-as-a-service for agentic AI.** The stack already does what
   regulated AI deployments will need receipts for: signed, quorum-witnessed,
   Bitcoin-anchored records of who (which voice) did what, under which mandate,
   with rollback evidence. Sell the hosted membrane (myc.md publish/resolve,
   relay, OTS anchoring, court attestations) as an audit-trail service. AGPL §13
   means competitors hosting a modified stack must publish their changes; the
   registry + continuity stay yours.
2. **Managed federation nodes.** Run substrates/relays for teams that want
   proof-bearing multi-model cooperation without operating Deno/Rust/libp2p
   infra. Open core, paid operations — the classic AGPL-compatible model.
3. **The forge catalog.** Seven live packages (`@s0fractal/autonomy-kernel`,
   `canonical-receipt`, `witness`, `agentseal`, `kuramoto-coherence`, ...) are
   standalone-useful. Paid support/SLA tiers, sponsored features.
4. **Public-goods grants.** A capture-resistant, Bitcoin-anchored, multi-agent
   accountability commons is squarely fundable: NLnet, Sovereign Tech Fund,
   OpenSats (the anchoring story), research grants on multi-agent governance.
   Publishing omega+liquid is a precondition — funders do not fund half-private
   commons.
5. **Certification mark (later).** "Substrate Court verified" as a paid
   conformance mark for agentic deployments — this is where the TRADEMARK work
   converts into revenue, and it monetizes verification rather than enclosure.

Anti-model to refuse explicitly: dual licensing (requires CLA → relicensing
power concentration → the exact capture vector this federation is built against)
and any token/coin issuance (grafts speculative governance onto a system whose
law is computed, not bought).

## 6. Proposed sequence

1. P0 hygiene: rotate/confirm the 89cbeb0 key + CF token; strip
   `/Users/s0fractal` paths from myc/omega tracked docs; decide the NOTICE email
   question.
2. P0 law: LICENSE + NOTICE + LICENSE-INTENT onto trinity and liquid;
   quorum-gate the key registry.
3. Publish omega (flip visibility; announce via chord + anchored receipt).
4. Liquid staging: license, relocate `dialog/` to private archive with pointer
   chord, loud status labels on unbuilt immune claims; then flip visibility.
5. P1 governance: GOVERNANCE.md, TRADEMARK.md, DCO, SECURITY.md, FEDERATION
   pointers + llms.txt for model legibility.
6. Sustenance: pick 1–2 revenue lines (recommend #1 + #4 first); grants need the
   fully public federation from steps 3–4.

## Falsifier

- If
  `git ls-files | xargs grep -lE "jsrp_|cfut_|ghp_|BEGIN (RSA|OPENSSH|EC|PGP)? ?PRIVATE KEY"`
  returns any tracked file in trinity, myc, omega, or liquid, the "trees are
  clean" claim is false.
- If `gh repo view s0fractal/trinity --json visibility,licenseInfo` shows a
  license, the P0 "trinity is unlicensed" premise has been resolved and §3-P0 is
  stale.
- If `ls liquid/LICENSE*` succeeds, the liquid-unlicensed premise is false.
- If `grep -c "myc / liquid / trinity.*unlicensed" omega/LICENSE-INTENT.md`
  returns 0, the stale-intent claim is false.
- If `./t check` fails on this chord's signature after `t chord sign`, the
  record itself is unauthenticated.

— claude, anchor block 956379.
