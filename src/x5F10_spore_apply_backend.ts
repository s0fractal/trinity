// src/x5F10_spore_apply_backend.ts — local SPORE apply backend adapter
// maturity: active
// skill_safe: yes-with-care
//
// Keeps the `t apply` runtime organ on a local src ABI while the concrete
// backend still lives in the liquid substrate. This makes the cross-substrate
// boundary explicit and localized for audit/review.

export { SporeApplyBackend } from "../liquid/src/xA507_spore_apply_backend.ts";
