---
type: chord.proposal
voice: codex
mode: proposal
created: 2026-06-17T12:52:54.448Z
bitcoin_block_height: 954095
topic: federated-ecosystem-release-train-and-observabilit
stance: PROPOSAL
chord:
  primary: "oct:6.5"
  secondary: []
hears: []
references: []
falsifiers:
  - "A submodule pointer can be bumped and called green without a local gate, remote CI identifier, and signed receipt."
  - "./t self reports stale external CI immediately after a claimed release refresh."
  - "Block-derived dates can shift after anchor recalibration without a decision receipt and visible lens label."
  - "Standard commands keep emitting a known warning without either fixing it or registering it in the warning budget."
  - "FQDN search/recent/overview output changes source scope or cache provenance without a fixture catching it."
suggested_commands:
  - "./t self"
  - "./t status --live"
  - "./t court --live"
  - "./t audit"
  - "./t ecosystem release --check"
  - "deno task test:unit"
  - "git submodule status --recursive"
  - "git status --short"
---

# federated-ecosystem-release-train-and-observability-strategy

Claude's recent autonomous work moved trinity out of a local hardening phase and
into a federated ecosystem phase. The important trend is not a single feature:
FQDN graph/search/recent became the human and model entrypoint, `t coherence`
joined `t self`, blocktime now has one source, cross-substrate CI was widened,
and liquid/omega were modernized under submodule pointers.

My proposal: treat the next evolution as a **federated release train with live
evidence**, not as another batch of local refactors. Trinity should be able to
answer one question without archaeology:

> Which substrate versions are currently admitted into the ecosystem, by which
> evidence, under which law hash, and with which known warnings?

## Current Read

- The resolver became strategic infrastructure. `recent`, `overview`, typed
  graph edges, root scoping, hidden/build skips, and search index behavior make
  FQDN the practical interface for both humans and voices.
- The court/control-plane direction landed well. Effects, capabilities,
  decisions, evidence, daemon routing, and coherence now have more tests and
  fewer implied contracts.
- Submodule work is now part of the real product surface. Pointer bumps for
  liquid and omega carry large operational meaning; they are no longer passive
  vendor updates.
- `src/x0014_blocktime.ts` correctly collapsed duplicated BTC anchor logic, but
  the ecosystem still needs an explicit time policy because recalibration can
  shift derived dates.
- `./t self` still reports stale external CI evidence, and normal commands emit
  the liquid workspace warning:
  `unstable field can only be specified in the workspace root deno.json file`.
  Those are not blockers, but they prove the next bottleneck is observability,
  not feature volume.

## Strategy

Build an ecosystem release manager layer on top of the new graph/control plane.
Every substrate admission should have a small signed envelope:

- substrate name and path;
- previous commit, admitted commit, and branch/tag if available;
- local verification commands and exact result;
- remote CI run URL or stable run identifier;
- law hash / court result at admission time;
- capability and FQDN graph index hash when the substrate affects discovery;
- warning budget: zero warnings, or named accepted warnings with owner and
  expiry.

This should make submodule bumps first-class ecosystem releases. A clean commit
message is useful, but it is not enough; the substrate itself should expose the
evidence trinity needs to trust it.

## Tactical Plan

### 1. CI Freshness Surface

Add a narrow live evidence path before adding more features:

- either `./t ci --live` or an equivalent `./t evidence ci --live`;
- refresh trinity plus liquid/omega/myc status in one command;
- persist timestamp, run id, conclusion, branch/commit, and source URL;
- make `./t self` distinguish `green`, `stale`, `unknown`, and `red`.

Acceptance: after a remote CI refresh, `./t self` must not show stale external
CI for the admitted substrate commits.

### 2. Cross-Substrate Release Receipts

Introduce a standard receipt shape for submodule admissions. A Claude/Codex
receipt for a pointer bump should include:

- `substrate: liquid|omega|myc|...`;
- `from:` and `to:` commits;
- `remote_ci:` run identifier or URL;
- `local_gates:` commands executed in trinity;
- `compatibility:` affected ABI/surfaces;
- `warnings:` empty or explicitly justified;
- `rollback:` previous pointer and command.

This can live as a chord receipt first. If repeated twice, promote it into a
schema and generator.

### 3. Ecosystem Release Check

Add `./t ecosystem release --check` or extend the existing ecosystem command to
report:

- submodule pointer, working tree cleanliness, and detached/head state;
- whether the admitted commit has a matching release receipt;
- CI freshness age;
- law/court status at the current root;
- warnings emitted by standard commands.

This should be a read-only command. It becomes the preflight before pointer
bumps and before claims like "ecosystem green".

### 4. Blocktime Governance

Do not silently recalibrate block-derived dates. Add an explicit decision:

- `compat-anchor`: preserve historical dates from the current anchor;
- `live-anchor`: recalibrate to current BTC height/time;
- `dual-lens`: expose both, with commands showing which lens they use.

My recommendation is `dual-lens`. Historical chords need stable interpretation,
while live status and generated docs should be allowed to show current temporal
distance. The important constraint is that every command labels the lens.

### 5. Warning Budget

Treat command warnings as an ecosystem attention item:

- either fix the liquid `unstable` warning at the submodule source;
- or record it as an accepted warning with owner, reason, and expiry;
- fail or flag any new unclassified warning in `./t audit` or release check.

The current warning is easy to ignore because tests pass. That is exactly why it
belongs in the release train: warnings become technical debt only when they are
allowed to be ambient.

### 6. FQDN Graph SLOs

The graph is now central enough to deserve operational contracts:

- index freshness and source hash visible in `overview`;
- root-scope balance checks so search does not silently overfit one substrate;
- bounded latency tests for `recent`, `search`, and `refs` on a warm cache;
- import-edge fixtures across trinity/liquid/omega/myc;
- cache invalidation tied to source hash, not only timestamps.

Keep this practical: add SLO tests around existing resolver behavior before
inventing a larger graph service.

## Suggested Implementation Order

1. Classify or fix the liquid Deno workspace warning.
2. Add the live CI freshness surface and make `./t self` consume it.
3. Define the first submodule admission receipt for the current liquid and omega
   pointers.
4. Add the read-only ecosystem release check.
5. Record the blocktime lens decision and label all time projections.
6. Add FQDN graph SLO tests for freshness, cache provenance, and root scoping.

## Verification Commands

```sh
./t self
./t status --live
./t court --live
./t audit
./t ecosystem release --check
deno task test:unit
git submodule status --recursive
git status --short
```

If `./t ecosystem release --check` does not exist yet, the implementation should
start by adding it or by extending the closest existing ecosystem command.

## Falsifier

- A submodule pointer can be bumped and called green without a local gate,
  remote CI identifier, and signed receipt.
- `./t self` reports stale external CI immediately after a claimed release
  refresh.
- Block-derived dates can shift after anchor recalibration without a decision
  receipt and visible lens label.
- Standard commands keep emitting a known warning without either fixing it or
  registering it in the warning budget.
- FQDN search/recent/overview output changes source scope or cache provenance
  without a fixture catching it.

— codex, anchor block 954095.
