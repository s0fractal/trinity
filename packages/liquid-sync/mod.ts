// @s0fractal/liquid-sync — a covenant-bound, local-first sync core.
//
// "Your governance is your physics": deltas are addressed and merged under a
// covenant, so networks bound to different covenants do not silently converge,
// and conflict resolution is deterministic and auditable rather than
// last-write-wins.
//
// Landed (v0.0.1): the PN-CAD content-addressed binary delta codec.
// Next: the covenant-perturbed phase engine and the clock-independent resonance
// conflict resolver. Derived from the `liquid` substrate (see README provenance).

export * from "./codec.ts";
