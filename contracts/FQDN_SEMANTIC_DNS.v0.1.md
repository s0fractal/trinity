---
type: "ContractDescriptor"
version: "0.1"
title: "FQDN Semantic DNS Boundary"
status: "active"
---

# FQDN Semantic DNS Boundary

This contract formally defines the boundary between physical immutable identity
and semantic mutable intent within the OMEGA-64 Swarm (Trinity, Liquid, MYC).

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
