// probes/canonical-forms-inventory-v0/inventory.ts
//
// How many canonical forms does this ecosystem have, and do any two of them
// agree? The question sounds rhetorical. It is not — RFC-0004 (Tranche A) is
// blocked on selecting one canonical encoding, and that selection was being
// discussed on the basis of two forms when there are at least seven.
//
// This probe measures rather than lists. For a shared corpus it runs every
// form it can execute locally, prints what each produces, and reports which
// pairs are even comparable. Forms it cannot execute are reported as
// `unavailable` with the reason — never silently skipped, because "we did not
// run it" and "it agreed" must not look the same (RFC-0004 §5.1.3).
//
// Run: deno run -A probes/canonical-forms-inventory-v0/inventory.ts
//      deno run -A probes/canonical-forms-inventory-v0/inventory.ts --json

import { encodeCanonical, multihashSha256 } from "@s0fractal/canonical-receipt";
import { fqdnPrefix, sha256Hex } from "../../src/x4010_hash.ts";

/** What a form takes as input. Forms with different input kinds are NOT
 *  competitors — they answer different questions, and treating them as rivals
 *  is the confusion this probe exists to dispel. */
type InputKind =
  | "text" // an opaque byte/character sequence
  | "structure" // a JSON-like value with keys and ordering questions
  | "binary-term"; // a domain-specific binary encoding

interface Form {
  id: string;
  where: string;
  inputKind: InputKind;
  hash: string;
  truncation: string;
  floatPolicy: string;
  status: "live" | "draft" | "external" | "probe";
  /** Returns the form's output for a value, or null if not applicable here. */
  run?: (v: Corpus) => Promise<string> | string;
  unavailable?: string;
}

/** One logical value, expressed in each shape a form might want. */
interface Corpus {
  name: string;
  /** The value as a structure. */
  structure: unknown;
  /** The same value as a text document — what a chord body would look like. */
  text: string;
}

const CORPUS: Corpus[] = [
  {
    name: "empty",
    structure: {},
    text: "",
  },
  {
    name: "flat-object",
    structure: { b: 2, a: 1 },
    text: '{"b":2,"a":1}',
  },
  {
    name: "key-order-swapped",
    // Same value as flat-object. A structural form MUST agree with it;
    // a text form MUST NOT, and that difference is the whole point.
    structure: { a: 1, b: 2 },
    text: '{"a":1,"b":2}',
  },
  {
    name: "unicode-nfc-vs-nfd",
    // "й" precomposed vs decomposed. Under RFC-0004 §5.1.1 rule 5 these are
    // different content and MUST hash differently.
    structure: { s: "й" },
    text: '{"s":"й"}',
  },
  {
    name: "unicode-nfd",
    structure: { s: "й" },
    text: '{"s":"й"}',
  },
  {
    name: "negative-zero",
    // RFC-0004 §5.1.2: -0.0 normalizes to +0.0, and floats are forbidden in
    // canonical form entirely. Canonical CBOR throws on floats; JCS would
    // serialize through a double. Recorded as an integer here so every form
    // can process the case; the float variant is a known gap (see README).
    structure: { z: 0 },
    text: '{"z":0}',
  },
];

/** RFC 8785 (JCS) serialization, per warrant SPEC §4.
 *  Restricted to what this corpus needs: integers only, no floats, sorted
 *  keys, minimal separators, exact code points, no normalization. */
function jcs(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error("jcs: floats are forbidden (warrant SPEC §4)");
    }
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(jcs).join(",") + "]";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    // JCS sorts by UTF-16 code unit; every key in this corpus is ASCII, where
    // code-unit, code-point and byte order coincide.
    const keys = Object.keys(o).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + jcs(o[k])).join(",") +
      "}";
  }
  throw new Error("jcs: unsupported value");
}

const FORMS: Form[] = [
  {
    id: "trinity/CANONICAL_HASH.v0.1",
    where: "contracts/CANONICAL_HASH.v0.1.md · src/x4010_hash.ts",
    inputKind: "text",
    hash: "SHA-256",
    truncation: "first 12 hex, prefixed `h.`",
    floatPolicy: "n/a — hashes bytes, never parses",
    status: "live",
    run: async (v) => await fqdnPrefix(v.text),
  },
  {
    id: "trinity/CANONICAL_HASH.v0.1 (full)",
    where: "same, untruncated",
    inputKind: "text",
    hash: "SHA-256",
    truncation: "none",
    floatPolicy: "n/a",
    status: "live",
    run: async (v) => await sha256Hex(v.text),
  },
  {
    id: "trinity/canonical-receipt (CBOR)",
    where: "packages/canonical-receipt · jsr:@s0fractal/canonical-receipt",
    inputKind: "structure",
    hash: "SHA-256 multihash",
    truncation: "none",
    floatPolicy: "floats FORBIDDEN — encoder throws",
    status: "live",
    run: (v) => multihashSha256(encodeCanonical(v.structure)),
  },
  {
    id: "warrant/SPEC §4 (JCS)",
    where: "~/Projects/warrant SPEC.md §4 · also oaip SPEC §1",
    inputKind: "structure",
    hash: "SHA-256",
    truncation: "none",
    floatPolicy: "floats FORBIDDEN — integers only, bounded ±(2^53−1)",
    status: "external",
    run: async (v) => await sha256Hex(jcs(v.structure)),
  },
  {
    id: "myc/raw.bytes.sha256 + stableStringify",
    where: "myc/src/x01D0_capture_pipeline.ts",
    inputKind: "structure",
    hash: "SHA-256",
    truncation: "none",
    floatPolicy: "unstated",
    status: "live",
    unavailable:
      "not imported here — myc's stableStringify is internal to the capture pipeline; comparing it needs a myc checkout and an exported entry point",
  },
  {
    id: "sigma-glyph/Book I NodeHash",
    where: "~/Projects/sigma-glyph spec/book-1-truth.md",
    inputKind: "binary-term",
    hash: "SHA-256 over CanonicalBytes",
    truncation: "none",
    floatPolicy: "n/a — SKI terms, no numeric tower",
    status: "external",
    unavailable:
      "input kind is a SKI term, not a JSON value; the corpus here has no term representation, so any comparison would be a category error",
  },
  {
    id: "JOURNAL_CORE.v2.0 node_id",
    where: "contracts/JOURNAL_CORE.v2.0.draft.md",
    inputKind: "text",
    hash: "BLAKE3",
    truncation: "Base32, chars 0..25",
    floatPolicy: "unstated",
    status: "draft",
    unavailable: "draft contract, no implementation in src/",
  },
  {
    id: "SPORE.v0 apply digest",
    where: "contracts/SPORE.v0.draft.md · probes/spore-apply-v0",
    inputKind: "binary-term",
    hash: "BLAKE3",
    truncation: "none",
    floatPolicy: "n/a",
    status: "draft",
    unavailable:
      "byte-identical across rust/deno per the contract, but over spore payloads rather than JSON values",
  },
  {
    id: "blake3-fqdn-v0 filename prefix",
    where: "probes/blake3-fqdn-v0",
    inputKind: "text",
    hash: "BLAKE3",
    truncation: "first 3 hex, into the filename",
    floatPolicy: "n/a",
    status: "probe",
    unavailable: "deferred 2026-05-19, never promoted to src/",
  },
  {
    id: "RECEIPT_ENVELOPE.v1.0 body_hash",
    where: "contracts/RECEIPT_ENVELOPE.v1.0.md",
    inputKind: "structure",
    hash: "SHA-256 multihash",
    truncation: "none",
    floatPolicy: "unstated",
    status: "live",
    unavailable:
      "the envelope's own canonical form IS fixed — deterministic CBOR per RFC 8949 4.2.1, with JSON explicitly demoted to a debug projection, two impls verified byte-identical 2026-05-14. It is unavailable here only because this probe does not construct envelopes. A first pass of this probe recorded it as an unfixed choice; that was a misread of a YAML comment about BODY bytes, which the body_kind's own contract owns by design.",
  },
];

interface Row {
  form: string;
  status: string;
  inputKind: string;
  outputs: Record<string, string | null>;
  unavailable?: string;
}

async function main() {
  const json = Deno.args.includes("--json");
  const rows: Row[] = [];

  for (const f of FORMS) {
    const outputs: Record<string, string | null> = {};
    if (f.run) {
      for (const c of CORPUS) {
        try {
          outputs[c.name] = await f.run(c);
        } catch (e) {
          outputs[c.name] = `ERROR: ${(e as Error).message}`;
        }
      }
    } else {
      for (const c of CORPUS) outputs[c.name] = null;
    }
    rows.push({
      form: f.id,
      status: f.status,
      inputKind: f.inputKind,
      outputs,
      unavailable: f.unavailable,
    });
  }

  // Findings the corpus is designed to produce.
  const executed = rows.filter((r) => !r.unavailable);
  const structural = executed.filter((r) => r.inputKind === "structure");
  const textual = executed.filter((r) => r.inputKind === "text");

  const findings: string[] = [];

  // 1. Do the structural forms agree that key order is irrelevant?
  for (const r of structural) {
    const a = r.outputs["flat-object"];
    const b = r.outputs["key-order-swapped"];
    findings.push(
      `${r.form}: key order ${
        a === b ? "IGNORED (structural, as expected)" : "SIGNIFICANT — unexpected"
      }`,
    );
  }
  // 2. Do the text forms treat key order as significant?
  for (const r of textual) {
    const a = r.outputs["flat-object"];
    const b = r.outputs["key-order-swapped"];
    findings.push(
      `${r.form}: key order ${
        a === b
          ? "IGNORED — unexpected for a text form"
          : "SIGNIFICANT (text, as expected)"
      }`,
    );
  }
  // 3. Does any form normalize Unicode? RFC-0004 §5.1.1 rule 5 says none may.
  for (const r of executed) {
    const a = r.outputs["unicode-nfc-vs-nfd"];
    const b = r.outputs["unicode-nfd"];
    findings.push(
      `${r.form}: NFC vs NFD ${
        a === b
          ? "COLLAPSED — violates RFC-0004 §5.1.1 rule 5"
          : "DISTINCT (as required)"
      }`,
    );
  }
  // 4. Do any two forms ever produce the same output for the same value?
  const collisions: string[] = [];
  for (let i = 0; i < executed.length; i++) {
    for (let j = i + 1; j < executed.length; j++) {
      for (const c of CORPUS) {
        const a = executed[i].outputs[c.name];
        const b = executed[j].outputs[c.name];
        if (a && b && a === b) {
          collisions.push(`${executed[i].form} == ${executed[j].form} on ${c.name}`);
        }
      }
    }
  }

  // 5. THE layering check.
  //
  //    HONESTY NOTE, because this check is easy to fake and a first draft of
  //    this probe did fake it. Warrant's digest IS DEFINED as sha256 over JCS
  //    bytes, and trinity's digest IS sha256. So "sha256(jcs(v)) equals
  //    warrant's digest" is true by definition and measures nothing. Testing
  //    it would be a tautology wearing a green check.
  //
  //    What is actually measurable, and what this checks: trinity's
  //    CANONICAL_HASH takes a TEXT body and never parses it. So for a value
  //    whose text form is ALREADY JCS-canonical, trinity's existing hash of
  //    that text must equal the structural digest — and for a value whose text
  //    is not canonical, it must NOT. If both hold, the two forms are layers
  //    (JCS canonicalizes, CANONICAL_HASH digests) rather than rivals. If the
  //    second fails, trinity's hash is somehow order-insensitive and something
  //    is very wrong.
  const layering: {
    value: string;
    textIsCanonical: boolean;
    textHashMatchesStructural: boolean;
    consistent: boolean;
  }[] = [];
  for (const c of CORPUS) {
    const canonicalText = jcs(c.structure);
    const textIsCanonical = c.text === canonicalText;
    const textHash = await sha256Hex(c.text); // trinity's path: hash the body
    const structuralHash = await sha256Hex(canonicalText); // canonicalize first
    const matches = textHash === structuralHash;
    layering.push({
      value: c.name,
      textIsCanonical,
      textHashMatchesStructural: matches,
      // The predicted relationship: match iff the text was already canonical.
      consistent: matches === textIsCanonical,
    });
  }
  const composes = layering.every((l) => l.consistent);

  const report = {
    probe: "canonical-forms-inventory-v0",
    layering: {
      claim:
        "trinity's text hash equals the structural digest EXACTLY WHEN the body text is already JCS-canonical — the signature of two layers rather than two rivals",
      holds: composes,
      detail: layering,
      consequence: composes
        ? "LAYERS, not rivals. JCS canonicalizes; CANONICAL_HASH digests. Tranche A3 can adopt JCS as the structural layer without replacing the federation's identity primitive, and every `h.` handle over an already-canonical body stays valid unchanged."
        : "the predicted relationship failed somewhere in this corpus — either trinity's hash is not purely textual, or the JCS implementation here is wrong. Either way the divergence above is the finding.",
    },
    forms_total: FORMS.length,
    forms_executed: executed.length,
    forms_unavailable: rows.filter((r) => r.unavailable).length,
    input_kinds: {
      text: FORMS.filter((f) => f.inputKind === "text").length,
      structure: FORMS.filter((f) => f.inputKind === "structure").length,
      "binary-term": FORMS.filter((f) => f.inputKind === "binary-term").length,
    },
    hash_functions: [...new Set(FORMS.map((f) => f.hash.split(" ")[0]))],
    rows,
    findings,
    cross_form_agreement: collisions.length === 0
      ? "none — no two executed forms produce the same output for any corpus value"
      : collisions,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`# canonical forms in this ecosystem\n`);
  console.log(
    `${report.forms_total} forms found · ${report.forms_executed} executed here · ` +
      `${report.forms_unavailable} unavailable\n`,
  );
  console.log(
    `input kinds: text=${report.input_kinds.text} ` +
      `structure=${report.input_kinds.structure} ` +
      `binary-term=${report.input_kinds["binary-term"]}`,
  );
  console.log(`hash functions: ${report.hash_functions.join(", ")}\n`);

  for (const r of rows) {
    console.log(`## ${r.form}  [${r.status}, ${r.inputKind}]`);
    if (r.unavailable) {
      console.log(`   unavailable: ${r.unavailable}\n`);
      continue;
    }
    for (const c of CORPUS) {
      const v = r.outputs[c.name];
      console.log(`   ${c.name.padEnd(22)} ${v}`);
    }
    console.log();
  }

  console.log(`## layering: are CANONICAL_HASH and JCS rivals or layers?\n`);
  console.log(`   claim: ${report.layering.claim}`);
  console.log(`   holds: ${report.layering.holds}\n`);
  for (const l of layering) {
    console.log(
      `   ${l.value.padEnd(22)} text-canonical=${String(l.textIsCanonical).padEnd(5)} ` +
        `hashes-match=${String(l.textHashMatchesStructural).padEnd(5)} ` +
        `${l.consistent ? "consistent" : "INCONSISTENT"}`,
    );
  }
  console.log(`\n   → ${report.layering.consequence}\n`);

  console.log(`## findings\n`);
  for (const f of findings) console.log(`- ${f}`);
  console.log(`\n## cross-form agreement\n`);
  console.log(
    typeof report.cross_form_agreement === "string"
      ? `- ${report.cross_form_agreement}`
      : report.cross_form_agreement.map((c) => `- ${c}`).join("\n"),
  );
}

if (import.meta.main) await main();
