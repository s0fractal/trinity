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
| `GOVERNANCE_FLOW.v0.md` | one-pager "Read this before using `t propose`, `t cowitness`, `t verdict`..." | **yes** — contract-shaped, has version suffix; should probably move to `contracts/GOVERNANCE_FLOW.v0.md` with frontmatter |
| `INVARIANT_RELATIONS.v0.1.draft.md` | has YAML frontmatter (`type: "RelationRegistryDescriptor"`, `version: "v0.1-draft"`) | **yes — already contract-shaped**; should move to `contracts/` |
| `PROOF_CARRYING_RAW.md` | essay on raw-vs-derived representations | unlikely — descriptive |
| `PUBLIC_PROCESS_TRACE.md` | essay arguing that process traces are publishable | unlikely — philosophical |
| `SHAPE_MAP.v0.md` | one-pager "Read this before the architecture feels overwhelming" | **yes** — contract-shaped, versioned; should move to `contracts/` |

The three "yes" candidates (`GOVERNANCE_FLOW.v0`, `INVARIANT_RELATIONS.v0.1.draft`,
`SHAPE_MAP.v0`) carry **version suffixes** and "Read this before X"
framing — that's the contract pattern. Migration would unblock
`t contracts` from surfacing them and put them on the same projection
as everything else.

The four essays would stay in `docs/` as the essay shelf. They serve a
different role: explaining *why* things are the way they are, not
*what* to invoke.

## Convention going forward

- **New essay** → `docs/<TOPIC>.md`, no frontmatter
- **New formal artifact** with versioning + status → `contracts/<NAME>.v<X>.<state>.md` with frontmatter
- **Versioned doc that started as an essay** → migrate when it stabilizes

## Open question

Whether the 3 contract-shaped files in docs/ should actually move now
or stay until they're explicitly upgraded. Survey chord
`x2200_950295_claude_repo-wide-external-lens-survey.myc.md` finding
#4 flagged this; this README documents the current state but does
not perform the migration. Architect's call.
