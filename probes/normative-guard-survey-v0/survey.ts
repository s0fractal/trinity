// probes/normative-guard-survey-v0/survey.ts
//
// Of the guarantees this repository makes to anyone outside it, how many can
// be observed failing?
//
// The question is the first step of the goal in chord x1500_961093. Its own
// first falsifier turns on the answer: if most guarantees are already guarded,
// the gap that goal targets does not exist.
//
// Method, and its limits stated up front:
//
//   - The population is every `MUST` clause in `contracts/` — 49 of them
//     across 14 of 42 contracts. That is the whole population, not a sample.
//   - Each clause carries a VERBATIM quote from its contract. The probe
//     resolves every quote and FAILS if one no longer appears, so a contract
//     edited after this survey cannot leave a stale verdict standing.
//   - A `guarded` verdict must cite a guard that exists on disk. The probe
//     checks existence. It does NOT check that the guard actually tests the
//     clause — that is a human judgement, recorded as such, and it is the
//     weakest link here.
//   - Default is `unguarded`. Absence of a found guard is reported as absence
//     of a found guard, which is falsifiable by pointing at one.
//
// Run: deno run -A probes/normative-guard-survey-v0/survey.ts
//      deno run -A probes/normative-guard-survey-v0/survey.ts --json

const ROOT = new URL("../../", import.meta.url).pathname;

type Verdict =
  /** Something on disk goes red if this is broken. `guard` cites it. */
  | "guarded"
  /** No guard found by this survey. Falsifiable: point at one. */
  | "unguarded"
  /** Not mechanically checkable — a judgement, a naming rule, a prohibition
   *  on human conduct. Recording these separately keeps the denominator
   *  honest instead of inflating the failure. */
  | "unguardable";

interface Clause {
  contract: string;
  /** Verbatim, must resolve in the contract. */
  quote: string;
  what: string;
  verdict: Verdict;
  /** Required when guarded: a path that must exist. */
  guard?: string;
  note?: string;
}

const CLAUSES: Clause[] = [
  // ── CANONICAL_HASH.v0.1 (active) ──────────────────────────────────────────
  {
    contract: "contracts/CANONICAL_HASH.v0.1.md",
    quote: "MUST verify against the golden",
    what: "other impls must reproduce the golden vectors",
    verdict: "guarded",
    guard: "src/canon_conformance_test.ts",
    note: "`deno task canon:verify` runs 7/7; CI also cross-checks liquid",
  },
  {
    contract: "contracts/CANONICAL_HASH.v0.1.md",
    quote: "MUST NOT change without a new contract",
    what: "the algorithm is frozen",
    verdict: "guarded",
    guard: "fixtures/canon-vectors.json",
    note: "a silent algorithm change breaks the pinned vectors",
  },

  // ── RECEIPT_ENVELOPE.v1.0 (active) ────────────────────────────────────────
  {
    contract: "contracts/RECEIPT_ENVELOPE.v1.0.md",
    quote: "Verifiers MUST hash CBOR",
    what: "JSON is a debug projection, never the canonical form",
    verdict: "guarded",
    guard: "probes/receipt-envelope-encoder-v0/ts/test.ts",
    note: "in test:unit; TS/Python parity checked by cross_lang_test.py",
  },
  {
    contract: "contracts/RECEIPT_ENVELOPE.v1.0.md",
    quote: "MUST reference a separately-owned canonical schema",
    what: "each body_kind owns its serialization",
    verdict: "unguarded",
    note:
      "nothing checks that a registered body_kind actually names a schema; a new kind could be added with none",
  },
  {
    contract: "contracts/RECEIPT_ENVELOPE.v1.0.md",
    quote: "verifiers MUST recurse into the body",
    what: "an envelope must not mask a simulated body",
    verdict: "unguarded",
    note: "the masking case has no test; it is the contract's own named risk",
  },
  {
    contract: "contracts/RECEIPT_ENVELOPE.v1.0.md",
    quote: "MUST NOT be promoted to v1.0 or treated as",
    what: "a guardrail on the contract's own promotion",
    verdict: "unguardable",
    note: "a rule about a governance act, not about a computation",
  },

  // ── FQDN_SEMANTIC_DNS.v1.0 (active) ───────────────────────────────────────
  {
    contract: "contracts/FQDN_SEMANTIC_DNS.v1.0.md",
    quote: "Semantic DNS resolver MUST map it to the",
    what: "semantic names resolve to physical FQDN",
    verdict: "guarded",
    guard: "src/fqdn_resolver_test.ts",
  },
  {
    contract: "contracts/FQDN_SEMANTIC_DNS.v1.0.md",
    quote: "MUST use the **Physical FQDN**",
    what: "hash/anchor layers use the physical name",
    verdict: "guarded",
    guard: "src/fqdn_witness_test.ts",
    note: "CI additionally checks liquid's FQDN hash against the canon oracle",
  },
  {
    contract: "contracts/FQDN_SEMANTIC_DNS.v1.0.md",
    quote: "PN-CAD blocks MUST be injected using the **Physical",
    what: "ledger-level injection uses physical names",
    verdict: "unguarded",
    note: "PN-CAD injection lives in liquid; no trinity-side gate found",
  },

  // ── SUBSTRATE_HEALTH.v0.1 (draft, but t status is live) ───────────────────
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "Consumers MUST inspect `is_stale` before using",
    what: "staleness must be read before green/strict are trusted",
    verdict: "guarded",
    guard: "src/check_test.ts",
    note: "CI: 'Verify status CI freshness shape' and health warning propagation",
  },
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "`t status` MUST NOT run",
    what: "status must not run expensive work inline",
    verdict: "unguarded",
    note: "no timing or side-effect assertion found",
  },
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "MUST NOT block on external CI execution by default",
    what: "status must not wait on external CI",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "`strict` MUST be `null` in this case",
    what: "strict is null when staleness is unknown",
    verdict: "guarded",
    guard: "src/check_test.ts",
  },
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "MUST be schema-tagged",
    what: "substrate-specific extensions carry a schema tag",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SUBSTRATE_HEALTH.v0.1.md",
    quote: "New consumers MUST prefer",
    what: "consumers prefer the newer shape",
    verdict: "unguardable",
    note: "advice to future authors, not a property of any artifact",
  },

  // ── CODEICIDE_PROPOSAL.v0.1 (draft; package is live) ──────────────────────
  {
    contract: "contracts/CODEICIDE_PROPOSAL.v0.1.md",
    quote: "Apply MUST verify `target_hash` matches current state",
    what: "apply refuses if the target moved",
    verdict: "guarded",
    guard: "packages/codeicide/codeicide_test.ts",
  },
  {
    contract: "contracts/CODEICIDE_PROPOSAL.v0.1.md",
    quote: "Apply MUST refuse if the verdict envelope",
    what: "apply refuses without an AYE verdict",
    verdict: "guarded",
    guard: "packages/codeicide/codeicide_test.ts",
  },
  {
    contract: "contracts/CODEICIDE_PROPOSAL.v0.1.md",
    quote: "Apply MUST refuse if the proposer appears in",
    what: "self-AYE is refused",
    verdict: "guarded",
    guard: "packages/codeicide/codeicide_test.ts",
  },
  {
    contract: "contracts/CODEICIDE_PROPOSAL.v0.1.md",
    quote: "## Failure modes the flow MUST catch",
    what: "section heading, not a clause",
    verdict: "unguardable",
    note: "counted by the regex; kept visible rather than silently dropped",
  },

  // ── COGNITIVE_RECOMMENDATION.v0.1 (active) ────────────────────────────────
  {
    contract: "contracts/COGNITIVE_RECOMMENDATION.v0.1.md",
    quote: "It MUST NOT treat raw counts as proof",
    what: "counts are pressure indicators, not evidence",
    verdict: "unguardable",
    note: "a rule about how a reader interprets output",
  },
  {
    contract: "contracts/COGNITIVE_RECOMMENDATION.v0.1.md",
    quote: "it MUST NOT be",
    what: "closure must be explicit and voice-declared",
    verdict: "guarded",
    guard: "src/decisions_gen_test.ts",
    note: "closure validity is also a CI step (no invalid manual closures)",
  },

  // ── IN_LEDGER_SRC_PROJECTION.v0.2 (draft) ─────────────────────────────────
  {
    contract: "contracts/IN_LEDGER_SRC_PROJECTION.v0.2.md",
    quote: "New OUT artifacts MUST use src/ projection form",
    what: "new emitted artifacts follow the src projection",
    verdict: "guarded",
    guard: "src/external_surfaces_prune_test.ts",
    note: "CI also checks cross-substrate flat-src mappings",
  },

  // ── IN_LEDGER_OUT.v0.1 (SUPERSEDED) ───────────────────────────────────────
  {
    contract: "contracts/IN_LEDGER_OUT.v0.1.md",
    quote: "file MUST be deleted",
    what: "consumed in/ files are removed",
    verdict: "unguardable",
    note: "contract status is superseded; not a live guarantee",
  },
  {
    contract: "contracts/IN_LEDGER_OUT.v0.1.md",
    quote: "MUST NOT be edited by hand",
    what: "out/ is emitted, never hand-edited",
    verdict: "unguardable",
    note: "superseded",
  },
  {
    contract: "contracts/IN_LEDGER_OUT.v0.1.md",
    quote: "The probe MUST verify this for at least one non-core neuron",
    what: "a probe obligation",
    verdict: "unguardable",
    note: "superseded",
  },

  // ── SUBSTRATE_SELF_ABI.v0.1 (active) ──────────────────────────────────────
  {
    contract: "contracts/SUBSTRATE_SELF_ABI.v0.1.md",
    quote: "frontmatter MUST declare",
    what: "projection slots declare required frontmatter",
    verdict: "guarded",
    guard: "src/root_abi_test.ts",
  },

  // ── STYLE_TRANSITION.v0.draft ─────────────────────────────────────────────
  {
    contract: "contracts/STYLE_TRANSITION.v0.draft.md",
    quote: "A style transition MUST be an explicit chord",
    what: "the daemon does not decide style silently",
    verdict: "unguarded",
    note: "draft; no gate asserts the daemon cannot transition without a chord",
  },

  // ── X9_SUBSTRATE_NAMESPACE.v0.draft ───────────────────────────────────────
  {
    contract: "contracts/X9_SUBSTRATE_NAMESPACE.v0.draft.md",
    quote: "x9 organs MUST be adapters, projections, or receipts",
    what: "x9 carries no independent logic",
    verdict: "unguarded",
    note: "CI exercises x9 shadow commands but does not assert this property",
  },
  {
    contract: "contracts/X9_SUBSTRATE_NAMESPACE.v0.draft.md",
    quote: "MUST preserve a live reference to their source substrate path",
    what: "x9 organs point back at their source",
    verdict: "unguarded",
  },
  {
    contract: "contracts/X9_SUBSTRATE_NAMESPACE.v0.draft.md",
    quote: "MUST expose replayable evidence before any source movement",
    what: "evidence precedes migration",
    verdict: "unguarded",
  },

  // ── TOPOLOGICAL_GRINDING.v0.draft ─────────────────────────────────────────
  {
    contract: "contracts/TOPOLOGICAL_GRINDING.v0.draft.md",
    quote: "They MUST NOT be conflated",
    what: "two mappings stay distinct",
    verdict: "unguardable",
    note: "a rule about how authors read the spec",
  },
  {
    contract: "contracts/TOPOLOGICAL_GRINDING.v0.draft.md",
    quote: "This is semantic geometry and MUST",
    what: "octants are semantic, not paths",
    verdict: "unguardable",
  },
  {
    contract: "contracts/TOPOLOGICAL_GRINDING.v0.draft.md",
    quote: "### What MUST NOT be done",
    what: "section heading",
    verdict: "unguardable",
    note: "counted by the regex; kept visible",
  },
  {
    contract: "contracts/TOPOLOGICAL_GRINDING.v0.draft.md",
    quote: "MUST include a `nonce` field",
    what: "semantic-claim artifacts carry a grinding nonce",
    verdict: "unguarded",
    note:
      "chord.schema.json says of nonce: 'Not yet enforced; adoption pending' — the contract requires what the schema declines to check",
  },
  {
    contract: "contracts/TOPOLOGICAL_GRINDING.v0.draft.md",
    quote: "MUST NOT be applied to **LIVING** artifacts",
    what: "grinding is forbidden on living artifacts",
    verdict: "unguarded",
  },

  // ── SPORE_FUEL.v1.draft (status: active) ──────────────────────────────────
  {
    contract: "contracts/SPORE_FUEL.v1.draft.md",
    quote: "this bench MUST be rerun with regression rows",
    what: "the fuel bench is rerun on semantic change",
    verdict: "unguardable",
    note: "an obligation on a future author",
  },
  {
    contract: "contracts/SPORE_FUEL.v1.draft.md",
    quote: "MUST deduct exactly these",
    what: "ATP-compliant runtimes deduct the canonical costs",
    verdict: "guarded",
    guard: "probes/spore-runtime-adapter-v0/ts/adapter_test.ts",
    note: "in test:unit; WASM and TS reference agree on output_hash",
  },
  {
    contract: "contracts/SPORE_FUEL.v1.draft.md",
    quote: "MUST include an explicit `fuel_model_hash`",
    what: "published ATP names its fuel model",
    verdict: "unguarded",
  },

  // ── SPORE.v0.draft (11 clauses; contract is a draft) ──────────────────────
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "reserved, MUST be zero",
    what: "reserved bits are zero",
    verdict: "unguarded",
    note: "wire-level; no trinity-side parser test found",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "MUST reject unknown `algo_tag` values",
    what: "unknown algo tags are rejected, not guessed",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "ATP deducted MUST equal the canonical semantic cost",
    what: "no free energy from loop unrolling",
    verdict: "guarded",
    guard: "probes/spore-runtime-adapter-v0/ts/adapter_test.ts",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "after a runtime computes `output_hash`, it MUST",
    what: "runtime semantics after output_hash",
    verdict: "unguarded",
    note: "the contract itself marks this section [OPEN]",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "MUST be captured as a hashed artifact before entering apply",
    what: "environment is hashed before apply",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "it MUST be",
    what: "bootstrap is the only un-hash-addressed function",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "it MUST be tied to a concrete external root",
    what: "bootstrap ties to an external root",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "At least one pinning mechanism MUST be in force",
    what: "pinning precedes trust",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "it MUST also publish its pinning information",
    what: "a landing probe publishes its pin",
    verdict: "unguarded",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "Two runtimes implementing this contract MUST",
    what: "determinism is observable across runtimes",
    verdict: "guarded",
    guard: "probes/spore-runtime-adapter-v0/ts/adapter_test.ts",
    note: "WASM vs TS reference agreement is exactly this property",
  },
  {
    contract: "contracts/SPORE.v0.draft.md",
    quote: "v1.x parsers MUST reject wire_version `0x01` records",
    what: "the wire break is enforced by parsers",
    verdict: "unguarded",
  },
];

async function exists(rel: string): Promise<boolean> {
  try {
    await Deno.stat(ROOT + rel);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const json = Deno.args.includes("--json");
  const results = [];
  let quoteFailures = 0;
  let guardFailures = 0;

  const cache = new Map<string, string>();
  for (const c of CLAUSES) {
    let text = cache.get(c.contract);
    if (text === undefined) {
      text = await Deno.readTextFile(ROOT + c.contract).catch(() => "");
      cache.set(c.contract, text);
    }
    const idx = text.indexOf(c.quote);
    const quoteOk = idx >= 0;
    if (!quoteOk) quoteFailures++;
    const line = quoteOk ? text.slice(0, idx).split("\n").length : null;

    let guardOk: boolean | null = null;
    if (c.verdict === "guarded") {
      guardOk = c.guard ? await exists(c.guard) : false;
      if (!guardOk) guardFailures++;
    }

    results.push({
      contract: c.contract,
      line,
      what: c.what,
      verdict: c.verdict,
      quote_resolves: quoteOk,
      guard: c.guard ?? null,
      guard_exists: guardOk,
      note: c.note ?? null,
    });
  }

  const count = (v: Verdict) => results.filter((r) => r.verdict === v).length;
  const report = {
    probe: "normative-guard-survey-v0",
    population: "every MUST clause in contracts/ — the whole population",
    clauses: results.length,
    guarded: count("guarded"),
    unguarded: count("unguarded"),
    unguardable: count("unguardable"),
    guarded_ratio_of_checkable: `${count("guarded")}/${
      count("guarded") + count("unguarded")
    }`,
    quote_failures: quoteFailures,
    guard_failures: guardFailures,
    limits: [
      "a `guarded` verdict means a guard was FOUND and exists on disk; this probe does not verify the guard actually tests the clause",
      "`unguarded` means no guard was found by this survey — falsifiable by pointing at one",
      "`unguardable` covers judgements, naming rules, obligations on future authors, and two section headings the MUST regex caught",
    ],
    results,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`# normative guard survey\n`);
    console.log(
      `${report.clauses} MUST clauses across contracts/ — the whole population\n`,
    );
    console.log(`   guarded      ${report.guarded}`);
    console.log(`   unguarded    ${report.unguarded}`);
    console.log(`   unguardable  ${report.unguardable}`);
    console.log(
      `\n   of the mechanically checkable: ${report.guarded_ratio_of_checkable} guarded\n`,
    );
    for (const r of results) {
      const at = r.line ? `:${r.line}` : " (QUOTE NOT FOUND)";
      const g = r.verdict === "guarded"
        ? ` → ${r.guard}${r.guard_exists ? "" : " (GUARD MISSING)"}`
        : "";
      console.log(
        `   [${r.verdict.padEnd(11)}] ${
          r.contract.replace("contracts/", "")
        }${at}${g}`,
      );
      console.log(`                 ${r.what}`);
      if (r.note) console.log(`                 note: ${r.note}`);
    }
    console.log(`\n## limits\n`);
    for (const l of report.limits) console.log(`- ${l}`);
  }

  if (quoteFailures > 0 || guardFailures > 0) {
    console.error(
      `\n${quoteFailures} quote(s) no longer resolve, ${guardFailures} cited guard(s) missing — the survey is stale against the tree`,
    );
    Deno.exitCode = 1;
  }
}

if (import.meta.main) await main();
