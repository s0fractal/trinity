---
chord:
  primary: "oct:7.2"
  secondary: ["oct:5.1", "oct:6.4", "oct:8.1"]
energy: 1.0
mode: "ORCHESTRATION"
tension: "trinity-meta-repository"
confidence: "high"
---

# Trinity Operating Contract

## Purpose

`trinity` is a control plane for models, humans, and audit jobs that need to
reason over `myc`, `omega`, and `liquid` as one system while preserving their
separate repositories and boundaries.

## Layer Roles

| Layer              | Repository | Authority                                             |
| ------------------ | ---------- | ----------------------------------------------------- |
| Protocol / witness | `myc`      | Descriptor graph, public receipts, audits             |
| Physics kernel     | `omega`    | Deterministic state transitions and physical receipts |
| Latent substrate   | `liquid`   | Agents, intent, consent, semantic memory, PN-CAD      |

## Cross-Layer Flow

```text
liquid latent state
  -> PHI_INTENT.v0.1
  -> omega deterministic kernel
  -> PHI_RECEIPT.v0.1
  -> myc SealedReceiptDescriptor / substrate receipt
```

## Audit Policy

`trinity` distinguishes two gate classes:

- Green gates: expected to pass in the current baseline.
- Strict gates: intentionally include unstable or high-signal tests.

Strict failures are not ignored. They are the current work queue.

## Submodule Policy

Submodules are pinned to known commits. Updating a submodule pointer is a
Trinity-level change and should be accompanied by:

1. `deno task status`
2. `deno task audit:green`
3. Notes about any strict gate regressions or improvements

## Model Guidance

When a model audits the system from this repository:

1. Read this file first.
2. Run `deno task status`.
3. Prefer contract and fixture changes in `trinity` over cross-layer coupling.
4. Touch submodule code only when the user explicitly asks for implementation.
5. Treat `myc`, `omega`, and `liquid` boundaries as part of the architecture.
