#!/usr/bin/env -S deno run -A
// src/x6C40_cnp0.ts — the CNP-0-JCS canonical encoding corpus gate
// position: 6/C4 → audit-pole (bucket 6): a conformance corpus is an audit
//   surface — it answers "do these bytes still hash to what the manifest pinned"
//   rather than producing anything.
// maturity: draft
// skill_safe: yes-readonly
// hex_dipole: "00 00 00 00 00 00 59 00"
//   audit_pole+0.70 (PRIMARY: axis 6, matches bucket 6)
// placement_policy: axis
// skill_tag: cnp0
//
// intent: RFC-0003 Part 01 §5.1.3 says parity "is proven, not assumed" and then
//   records that the corpus proving it does not exist. This runs the candidate
//   corpus: 102 cases over all eight §5.1.3 categories, through the reference
//   encoder AND the verifier-only rejection path, with exact counts. A green run
//   that selected nothing is reported as a failure.
//
//   Scope: this is the read-only half. The negative controls (which need to
//   write a temporary tree and spawn a child) and external Warrant parity live
//   in probes/cnp-0-seed-v0/run.sh, and the whole gate runs under
//   `deno task test:unit`.
//
//   This command is not a conformance claim, not adoption, and not ratification
//   of Tranche A3. See contracts/CANONICAL_ENCODING.v0.1.md.
//
// Usage:  t cnp0 [--json]

import { run } from "./x4013_cnp0_corpus.ts";

if (import.meta.main) {
  const report = await run();
  const zero = [
    ["encoder accepted", report.encoderAccepted],
    ["encoder rejected", report.encoderRejected],
    ["verifier accepted", report.verifierAccepted],
    ["verifier rejected", report.verifierRejected],
    ["transform accepted", report.transformsAccepted],
    ["transform rejected", report.transformsRejected],
    ["digest groups", report.digestGroups],
  ].filter(([, n]) => n === 0).map(([label]) => String(label));

  const ok = report.failures.length === 0 && zero.length === 0;

  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(
      {
        command: "cnp0",
        status: ok ? "ok" : "fail",
        candidate: "cnp-0-seed-v0",
        contract: "contracts/CANONICAL_ENCODING.v0.1.md",
        clauses: "RFC-0003 Part 01 §5.1.2-§5.1.3",
        report,
        empty_counts: zero,
        claims: {
          conformance: false,
          adoption: false,
          ratifies_a3: false,
          independent_encoders: 1,
        },
      },
      null,
      2,
    ));
  } else {
    console.log(
      `# cnp0 → 6/C4 — CNP-0-JCS corpus (candidate, not conformance)`,
    );
    console.log(`#   cases selected      ${report.cases}`);
    console.log(
      `#   encoder  accept/reject   ${report.encoderAccepted} / ${report.encoderRejected}`,
    );
    console.log(
      `#   verifier accept/reject   ${report.verifierAccepted} / ${report.verifierRejected}`,
    );
    console.log(
      `#   transform accept/reject  ${report.transformsAccepted} / ${report.transformsRejected}`,
    );
    console.log(`#   distinct-digest groups   ${report.digestGroups}`);
    for (const f of report.failures) {
      console.log(`#   ⛔ ${f.id}: ${f.detail.split("\n")[0]}`);
    }
    for (const z of zero) {
      console.log(
        `#   ⛔ ${z} count is zero — an empty green suite is a failure`,
      );
    }
    console.log(
      ok
        ? "#   ✅ every case matched its pinned expectation"
        : `#   ⛔ ${report.failures.length + zero.length} failure(s)`,
    );
    console.log(
      "#   negative controls + warrant parity: probes/cnp-0-seed-v0/run.sh",
    );
  }
  if (!ok) Deno.exit(1);
}
