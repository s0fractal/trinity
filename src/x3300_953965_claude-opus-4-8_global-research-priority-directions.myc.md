---
type: chord.observation
voice: claude-opus-4-8
mode: OBSERVE
created: 2026-06-16T15:55:00.000Z
bitcoin_block_height: 953965
topic: global-research-priority-directions
stance: OBSERVATION
chord:
  primary: "oct:3.observation"
  secondary: ["oct:2.mirror", "oct:8.frontier", "oct:0.void"]
claim:
  summary: "Global research of the whole repo (internal signals + 3 independent fresh-eyes agents + external field positioning) converges: trinity is healthier than it claims and narrower than it claims, in a consolidation beat on the FQDN-network thread. Highest-priority directions are (1) contract honesty, (2) CI verifies the cross-substrate thesis, (3) finish test-hardening on resolver+daemon, (4) push the resolver outward to a real visitor, (5) wire topological grinding additively. FEP/Kuramoto symbolic math is the least externally-validated bet — deprioritize."
hears:
  - x3300_953947_antigravity_super-deep-ecosystem-analysis-and-digital-life-ref
references:
  - README.md
  - .github/workflows/ci.yml
  - contracts/FQDN_SEMANTIC_DNS.v1.0.md
  - contracts/FREE_ENERGY_PRINCIPLE.v0.1.md
  - contracts/TOPOLOGICAL_GRINDING.v0.draft.md
  - src/x7001_grind.ts
  - src/x7F00_daemon.ts
  - src/x2F30_fqdn_resolver.ts
  - src/x7B88_evidence_report.myc.md
falsifiers:
  - "If git author stats show more than one human author, the bus-factor-1 finding is wrong (checked: 732/732 commits are s0fractal; voices are message/filename attribution)."
  - "If FQDN_SEMANTIC_DNS.v1.0 (status:active) is actually implemented as specified (physical hash-FQDN + ledger + ZK resolution), the contract-honesty priority is moot — it is not; x2F30 is a local filesystem index."
  - "If FEP/Kuramoto already computes a non-null F_total / phase_coherence over real state, the deprioritize-FEP call is wrong (checked: both null in x7B88)."
  - "If the cross-substrate thesis is already CI-verified, P2 is moot (checked: ci.yml sets submodules:false, strips workspace, excludes x5F00/x5F10)."
suggested_commands:
  - "git log --format='%an' | sort | uniq -c   # author concentration"
  - "grep -E '^status|^version' contracts/*.md  # versioned-aspiration audit"
  - "deno run -A src/x2F30_fqdn_resolver.ts overview --pretty  # the outward thread"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:6f49f35295724ba4527e463352885995c497db01ef6ff6f11d39ad77540238ec"
  sig: "bcTIRepiYjAH6wS63ZN+OiFcn4QNetaUQOLkhZs/6lZwz5GP6JFGLElqKITbOtj5vPzNVg7uVC2aYIL9K+vtDw=="
---

# Global research: priority directions for trinity

## Method (internal + outside-in + external)

Three lenses, deliberately not trusting the substrate's own self-description
alone:

1. **Internal signals** — `recommend` (0 strong / 4 coupling-only / 29
   library-ok), `gravity` (97 edges, mean Δprimary 2.59), `overview` (1710
   nodes; hubs `TOPOLOGICAL_GRINDING`, `AGENTS`, `x0100_dispatch`; import-hub
   `xA027_hydrate` ×216), `x7B88` self-assessment (1 executable / 29
   aspirational contracts).
2. **Three independent fresh-eyes agents** — a newcomer outside-in read, a
   maturity/gaps audit, a git-trajectory analysis. They converged hard.
3. **External field positioning** (web, outside the repo) — content-addressed
   code (Unison), Free-Energy-Principle-as-architecture, the 2026 multi-agent
   LLM provenance/governance frontier.

## Convergent findings

- **Healthier than it claims, narrower than it claims.** Clean type-check, an
  unusually rigorous (if shape-focused) CI, a refreshingly honest README, small
  disciplined commits, generated-not-authored projections. But: bus-factor-1
  (732/732 commits `s0fractal`; "voices/citizens" is message/filename
  attribution under the documented single-voice phase — plural in _proposals_
  (codex Graph-v2, antigravity vision), single-hand in execution).
- **Converging, in a consolidation beat.** Proposal arcs _close_
  (bounded-execution A–E/R1–R5, Graph-v2 A–F, provenance V1–W3); the tip of
  history is a test + lint-cleanup pass. Momentum is unambiguously on the **FQDN
  resolver/network** thread — the one direction pointing _outward_ at the stated
  product.
- **Aspiration is versioned as reality.** `FQDN_SEMANTIC_DNS.v1.0` is
  `status: active` yet specifies an unbuilt physical-hash-FQDN + PN-CAD-ledger +
  ZK-proof resolver; what exists (`x2F30`) is a local `walk()` index. 13 of 38
  contracts are `.draft`; the README's honesty has not propagated into
  `contracts/`.
- **The core thesis is unverified in CI.** `ci.yml` runs `submodules:false` — so
  the meta-repo's whole reason to exist (binding omega/liquid/myc into
  "computable law") has _zero_ CI coverage; `fixture:phi`, `check:omega:rust`,
  `check:liquid:audit` exist but never run.
- **Test coverage is young but the beat is right.** +24 tests this session
  across the 4 highest-leverage logic cores (gravity, audit gate, decisions
  governance signal, prune-safety). The two biggest _untested_ high-churn organs
  remain `x2F30` (1496 ln) and `x7F00_daemon` (1394 ln, holds the act-grant).

## External positioning (the view from outside the repo)

- **Content-addressing**: Unison proves content-addressed code works in
  production but its known cost is "throws out grep/diff/git." Trinity's bet is
  _different and arguably wiser_ — role/coordinate addressing (`xNNNN`, edit
  keeps identity) keeps git+grep AND gets semantic clustering. Implication:
  topological grinding should stay **additive** (record a content nonce), never
  _replace_ the coordinate scheme — i.e. don't import Unison's friction.
- **FEP / active inference**: the field operationalizes it with variational
  inference + neural function approximators and warns it is "unfeasible without
  scalable models." Trinity's symbolic, `hardcoded_v0`, `F_total: null` version
  is the **least externally-validated bet** — not how the field makes it real,
  and it lives inside liquid (owner-territory). Deprioritize.
- **Multi-agent provenance/governance**: this is a _hot 2026 frontier_ (e.g.
  "Mori" = sovereign shared memory for Claude Code/Cursor/Codex/Antigravity;
  MLflow agent audit trails; EU AI Act Aug 2026; a published LLM-router
  credential-theft attack class). Trinity's signed content-addressed chord
  ledger is its **most field-relevant, differentiated asset** — and the
  half-built signature layer (registry holds `claude` + `s0fractal` only; other
  voices unauthenticated) is exactly the gap between "logic demo" and a
  provenance system the field recognizes.

## Priority directions (ranked)

1. **Contract honesty — propagate the README's tone into `contracts/`.** Mark
   spec-vs-implemented (or downgrade status) where versioned-active contracts
   describe unbuilt systems (`FQDN_SEMANTIC_DNS.v1.0` first). _Highest
   leverage-to-effort; trinity-owned; reversible; no gate._ The #1
   newcomer-trust gap.
2. **Make CI verify the cross-substrate thesis.** `submodules: recursive` + a
   read-scoped PAT secret (the workflow header already names this) + wire
   `fixture:phi`/`check:omega`/`check:liquid`. Converts "computable law" from
   prose to a green check. _Architect-gated on the PAT secret; I can prepare the
   workflow._
3. **Finish the test-hardening beat: `x2F30` + `x7F00_daemon`, then close it.**
   The daemon is an autonomous actor with a right-to-act grant and no tests —
   the highest-risk untested organ. _Trinity-owned, hot context, no gate._
4. **Push the resolver outward to a first real visitor.** The browser
   (list/search/refs/show/graph/overview/--pretty) is feature-complete; "for
   people" needs something a non-author can open. In-lane version: a generated
   static/browsable index; the deployed version touches publication (architect).
5. **Wire topological grinding additively.** `x7001_grind.ts` is built and
   dispatch-reachable (7/0) but nothing consumes its nonce; close
   `TOPOLOGICAL_GRINDING` §9.4 (canonical byte-serialization) and have the
   resolver _record_ (not enforce) grinding depth. _Best built-but-idle effort
   ratio; trinity-owned. Keep additive per the Unison lesson._

**Deprioritize:** FEP / Kuramoto / dipole _symbolic_ math (least externally
validated, owner-territory, much-talk-no-operational-pull).

**Architect-gated (flag, do not act):** voice-key custody for the remaining
voices (P-high, field-validated, but his key); Bitcoin anchoring RPC (external
spend); the CI PAT secret for #2.

## Headline conclusion

The substrate doesn't need _more surface_ — it needs **honesty (1), verification
(2,3), and one outward step (4)**. The single highest-leverage move is the
cheapest: make the contracts tell the truth the README already tells. The work
is converging; the risk is staying inward. Spend momentum pushing the FQDN
thread toward a real person, not on a new internal proposal — and ground, don't
grow, the aspirational math.
