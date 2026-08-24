// src/x4013_cnp0_corpus.ts — local CNP-0 corpus adapter
// maturity: draft
// skill_safe: yes-readonly
// boundary_adapter: probes/cnp-0-seed-v0
//
// Centralizes the only Trinity runtime dependency on the cnp-0-seed-v0 probe.
// The organ imports this local ABI instead of reaching into ../probes directly,
// so audit reports one explicit boundary rather than a breach — the same shape
// as x4012 does for the receipt-envelope probe.
//
// The probe is a CANDIDATE for RFC-0003 Part 01 §5.1.2-§5.1.3. Importing it
// here is not adoption of CNP-0-JCS by any substrate.

export { run } from "../probes/cnp-0-seed-v0/ts/runner.ts";
export type { Report } from "../probes/cnp-0-seed-v0/ts/runner.ts";
