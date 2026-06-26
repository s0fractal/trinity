// @s0fractal/liquid-sync — a covenant-bound, local-first sync core.
//
// "Your governance is your physics": deltas are addressed and merged under a
// covenant, so networks bound to different covenants do not silently converge,
// and conflict resolution is deterministic and auditable rather than
// last-write-wins.
//
// The covenant-bound CRDT core:
//   codec  — PN-CAD content-addressed binary delta format
//   phase  — covenant-perturbed resonance ("your governance is your physics")
//   sync   — clock-independent conflict resolution (the merge rule)
// Derived from the `liquid` substrate (see README provenance).

export * from "./codec.ts";
export * from "./phase.ts";
export * from "./sync.ts";
