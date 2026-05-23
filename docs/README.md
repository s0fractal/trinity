# trinity/docs

Trinity has two parallel documentation surfaces:

| surface | shape | discoverable via |
|---------|-------|------------------|
| `contracts/` | formal contracts with YAML frontmatter (`type`, `version`, `status`, `maturity`) — every file is a query-target | `t contracts` |
| `docs/` (this directory) | longer-form prose; mix of essays + early-form documents that may or may not graduate to contracts | hand-navigation |

`t contracts` reads frontmatter and surfaces 32+ contracts as live
projection. `docs/` files generally lack that frontmatter and are not
indexed.

## What's currently in docs/

| file | shape | could promote? |
|------|-------|----------------|
| `AUDIT_MODEL.md` | essay on the trinity audit philosophy | unlikely — explanatory, not invocable |
| `COGNITIVE_THERMODYNAMICS.md` | essay framing the repo as a thermodynamic system of thought | unlikely — descriptive |
| `PROOF_CARRYING_RAW.md` | essay on raw-vs-derived representations | unlikely — descriptive |
| `PUBLIC_PROCESS_TRACE.md` | essay arguing that process traces are publishable | unlikely — philosophical |

The three contract-shaped files (`GOVERNANCE_FLOW.v0.md`, `INVARIANT_RELATIONS.v0.1.draft.md`, and `SHAPE_MAP.v0.md`) have been promoted to the `contracts/` registry. This unblocks `t contracts` from surfacing them and puts them on the same projection as everything else.

The four essays stay in `docs/` as the essay shelf. They serve a different role: explaining *why* things are the way they are, not *what* to invoke.

## Convention going forward

- **New essay** → `docs/<TOPIC>.md`, no frontmatter
- **New formal artifact** with versioning + status → `contracts/<NAME>.v<X>.<state>.md` with frontmatter
- **Versioned doc that started as an essay** → migrate when it stabilizes

## History

The three contract-shaped files in docs/ were migrated to `contracts/` on 2026-05-23 (anchor block 950678) following the recommendation in survey chord `x2200_950295_claude_repo-wide-external-lens-survey.myc.md` finding #4.
