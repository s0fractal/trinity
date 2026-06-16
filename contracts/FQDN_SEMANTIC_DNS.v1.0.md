---
type: "ContractDescriptor"
version: "1.0"
title: "FQDN Semantic DNS Boundary"
status: "active"
hears:
  - "../src/x2F30_fqdn_resolver.ts"
  - "../src/x2F32_fqdn_witness.ts"
  - "../src/x2F34_fqdn_apply.ts"
  - "../src/x2F36_fqdn_sovereignty.ts"
---

# FQDN Semantic DNS Boundary

This contract formally defines the boundary between physical immutable identity
and semantic mutable intent within the OMEGA-64 Swarm (Trinity, Liquid, MYC).

## 0. Implementation status (added 2026-06-16)

> **This document is a SPEC, not a description of what is built.** The
> frontmatter `status: "active"` marks the contract as live/non-draft, NOT that
> the system below is implemented. Read this section first.
>
> **Implemented today** (`src/x2F30_fqdn_resolver.ts`, the `t resolve` family):
> local-first resolution of a name across the four roots (exact / handle /
> slug), identity as `unique | mirrored | conflict | absent` by BLAKE3 content
> hash, precedence ordering, and a typed citation+import graph (`refs`/`graph`/
> `overview`).
>
> **Specified here but NOT built:** the physical content-addressed FQDN filename
> scheme `h.<12-hex>.name.kind.namespace.myc.md`, resolution of a semantic alias
> to "the latest valid Physical FQDN in the active trust ledger," PN-CAD
> ledger-backed resolution, and ZK-proof verifiers. `isContentAddressed()` in
> the resolver recognizes the `h.<hex>.` form as a concept; no such names are in
> use.
>
> **Partly superseded, not merely pending:** trinity's actual addressing is
> _role/coordinate_ (`xNNNN_<handle>`, where editing a file keeps its identity)
> — a deliberate divergence from this contract's _content_-addressed physical
> FQDN (see the role-vs-content-addressing invariant and the global research
> chord `x3300_953965`). The dotted `name.kind.namespace` semantic form is
> likewise not the convention in use. Treat §1–§3 below as a design study to
> reconcile with the role-addressed reality, not as a description of running
> code.

## 1. Topologies of Identity

The swarm recognizes two distinct topologies of identity:

### 1.1. Semantic FQDN (Intent Alias)

**Format:** `[name].[kind].[namespace].myc.md` (e.g.,
`runtime.policy.engine.sys.myc.md`) **Property:** Mutable, context-dependent,
intent-based. **Usage:** Used by human operators, thought descriptors, and
runtime pipelines when asking for a capability without specifying a strict
version. A Semantic FQDN is an _alias_ that must be resolved to a Physical FQDN
at runtime.

### 1.2. Physical FQDN (Hash Object)

**Format:** `h.<12-hex-hash>.[name].[kind].[namespace].myc.md` (e.g.,
`h.d80a743be8c9.runtime.policy.engine.sys.myc.md`) **Property:** Immutable,
content-addressed, mathematically verifiable. **Usage:** Used by the PN-CAD
binary ledger, ZK-proof verifiers, and the base filesystem layer. The
12-character hex prefix is derived via the standard `calculateFqdnHash` utility
from the inner body of the object.

## 2. The Semantic DNS Resolver

The `Semantic DNS` is the abstraction layer bridging these two topologies.

### 2.1. Fuzzy Stem Resolution

When the kernel or a pipe asks for a Semantic FQDN (e.g.,
`kernel.circadian.gate.myc.md`), the Semantic DNS resolver MUST map it to the
latest valid Physical FQDN present in the active trust ledger (e.g.,
`h.6afa92c03523.kernel.circadian.gate.myc.md`).

**Resolution Fallback Logic:**

1. **Exact Match:** If the exact string exists (e.g., a physical hash was passed
   directly), return it.
2. **Stem Match (Semantic DNS):** Strip `.(sys.)myc.md` and match the remaining
   prefix against the ledger.
3. **Not Found:** If neither exists, trigger a `NotFound` fault.

## 3. Storage and Propagation

- **Filesystem Level:** All objects written to permanent raw or object storage
  MUST use the **Physical FQDN**.
- **Binary Ledger Level:** PN-CAD blocks MUST be injected using the **Physical
  FQDN**.
- **Invocation Level:** The Invocation Router MAY use **Semantic FQDNs** for
  dynamic capability loading.

This strict separation ensures that the inner logic of the swarm remains
mathematically verifiable (Zero-Copy Absolutism) while maintaining high-level
fluidity for model generation and semantic interaction.
