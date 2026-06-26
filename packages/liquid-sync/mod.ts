// @s0fractal/liquid-sync — a covenant-bound, local-first sync core.
//
// "Your governance is your physics": deltas are addressed and merged under a
// covenant, so networks bound to different covenants do not silently converge,
// and conflict resolution is deterministic and auditable rather than
// last-write-wins.
//
// Landed: the PN-CAD content-addressed binary delta codec, and the covenant-
// perturbed phase engine (the "your governance is your physics" resonance core).
// Next: the clock-independent resonance conflict resolver (the CRDT merge rule).
// Derived from the `liquid` substrate (see README provenance).

export * from "./codec.ts";
export * from "./phase.ts";
