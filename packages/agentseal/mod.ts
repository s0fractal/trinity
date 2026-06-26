// @s0fractal/agentseal — bound, audit, and witness agent actions.
//
// Composes three real primitives into one product:
//   autonomy-kernel  — classify an action's blast radius (A0..A4), fail-closed on
//                      sovereign and on any unknown effect
//   canonical-receipt — deterministic canonical bytes → one content address
//   witness           — m-of-n ed25519 co-signing, Sybil-resistant
//
// The result is a tamper-evident, locally-verifiable, multi-party-witnessed receipt
// of a bounded agent action — cross-vendor, with no shared identity provider and no
// trusted host. Single-player value the day you install it (classify and audit your
// own agent); cross-vendor provenance as the receipts spread.

export * from "./agentseal.ts";
