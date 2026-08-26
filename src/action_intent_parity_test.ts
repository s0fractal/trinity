// LIVE cross-substrate parity for the ActionIntent commitment.
//
// Trinity vendors MYC's contract byte-for-byte because it cannot static-import
// the submodule under CI decoupling. Until now the only thing holding the two
// copies together was a known-answer constant written into each suite - which
// proves the two CONSTANTS match and says nothing about whether the two
// implementations do. A vendored copy that drifted while both files kept the
// same expected string would pass.
//
// So when the submodule is present, this executes BOTH implementations over the
// same inputs and compares their canonical BYTES first, then their digests.
// Bytes first on purpose: two implementations agreeing on a wrong encoding
// produce one matching digest and no evidence about either.
//
// When the submodule is absent - Trinity's core CI runs without it - the live
// cases report SKIPPED with a reason and nothing is asserted about MYC. A
// skipped parity check is never counted as a passing one.

import { assert, assertEquals } from "@std/assert";
import {
  canonicalIntentBytes as trinityBytes,
  canonicalIntentText as trinityText,
  intentCommitment as trinityCommitment,
  validateIntent as trinityValidate,
} from "./x5E10_warrant.ts";

const MYC_CONTRACT = new URL(
  "../myc/src/x5820_action_intent.ts",
  import.meta.url,
);

type MycModule = {
  canonicalIntentText: (i: unknown) => string;
  canonicalIntentBytes: (i: unknown) => Uint8Array;
  intentCommitment: (i: unknown) => Promise<string>;
  validateIntent: (v: unknown) => { ok: boolean; error?: string };
};

async function loadMyc(): Promise<MycModule | null> {
  try {
    await Deno.stat(MYC_CONTRACT);
  } catch {
    return null; // submodule not checked out: core CI stays self-sufficient
  }
  return await import(MYC_CONTRACT.href) as MycModule;
}

const VECTOR = {
  verb: "apply",
  target_substrate: "myc" as const,
  args_commitment: "c1",
  input_commitments: ["a", "b"],
  requested_effects: ["receipt", "write"],
};
const EXPECTED_CANONICAL =
  '{"args_commitment":"c1","canonical_encoding":"hsp-jcs@v0",' +
  '"input_commitments":["a","b"],"numeric_profile":"cnp-0",' +
  '"requested_effects":["receipt","write"],"target_substrate":"myc",' +
  '"verb":"apply"}';
const EXPECTED =
  "ccc26b8b460fe2debf0ad069d55ec170a78b7b70861f1f54c03e401e4576c3be";
const SUPERSEDED =
  "d02d75adca7e0dbbd10244c7ea1e9aeafa7b6d019a0f570bcad471a38d997552";

// Inputs chosen for where two implementations could plausibly diverge, not to
// re-assert the happy path: astral scalars (UTF-16 vs code-point ordering),
// duplicate effects (set semantics), permutations, empty arrays, escapes.
const ASTRAL = "\u{1D11E}-clef-\u{1F600}";
const CASES: [string, typeof VECTOR][] = [
  ["the shared vector", VECTOR],
  ["effects permuted", { ...VECTOR, requested_effects: ["write", "receipt"] }],
  ["effects duplicated", {
    ...VECTOR,
    requested_effects: ["write", "write", "receipt"],
  }],
  ["inputs permuted", { ...VECTOR, input_commitments: ["b", "a"] }],
  ["empty arrays", { ...VECTOR, input_commitments: [], requested_effects: [] }],
  ["astral scalars", { ...VECTOR, args_commitment: ASTRAL }],
  ["BMP non-ascii", {
    ...VECTOR,
    verb: "\u0437\u0430\u0441\u0442\u043e\u0441\u0443\u0432\u0430\u0442\u0438",
  }],
  ["escapes", { ...VECTOR, args_commitment: 'a"b\\cd' }],
];

Deno.test("action_intent parity - LIVE: both implementations, same canonical bytes", async () => {
  const myc = await loadMyc();
  if (!myc) {
    console.log(
      "  SKIPPED: myc submodule is not checked out; no parity claim is made",
    );
    return;
  }
  for (const [name, intent] of CASES) {
    assertEquals(
      myc.canonicalIntentText(intent),
      trinityText(intent),
      name + ": canonical TEXT differs across substrates",
    );
    assertEquals(
      Array.from(myc.canonicalIntentBytes(intent)),
      Array.from(trinityBytes(intent)),
      name + ": canonical BYTES differ across substrates",
    );
    assertEquals(
      await myc.intentCommitment(intent),
      await trinityCommitment(intent),
      name + ": digest differs across substrates",
    );
  }
});

Deno.test("action_intent parity - LIVE: both refuse the same out-of-domain values", async () => {
  const myc = await loadMyc();
  if (!myc) {
    console.log("  SKIPPED: myc submodule is not checked out");
    return;
  }
  const bad: [string, unknown][] = [
    ["number in effects", { ...VECTOR, requested_effects: [1] }],
    ["invalid substrate", { ...VECTOR, target_substrate: "mars" }],
    ["empty verb", { ...VECTOR, verb: "" }],
    ["extra member", { ...VECTOR, escalate: true }],
    ["lone surrogate", { ...VECTOR, verb: "x\uD834y" }],
  ];
  for (const [name, v] of bad) {
    assertEquals(
      myc.validateIntent(v).ok,
      trinityValidate(v).ok,
      name + ": the two boundaries disagree",
    );
    assert(!trinityValidate(v).ok, name + ": trinity admitted it");
    for (
      const [who, fn] of [
        ["myc", myc.intentCommitment],
        ["trinity", trinityCommitment],
      ] as const
    ) {
      let threw = false;
      try {
        await (fn as (i: unknown) => Promise<string>)(v);
      } catch {
        threw = true;
      }
      assert(threw, name + ": " + who + " produced a digest");
    }
  }
});

Deno.test("action_intent parity - the pinned vector, without the submodule", async () => {
  // Trinity's own half, so the vector is guarded even in core CI where the live
  // comparison above is skipped.
  assertEquals(trinityText(VECTOR), EXPECTED_CANONICAL);
  assertEquals(await trinityCommitment(VECTOR), EXPECTED);
  assert(await trinityCommitment(VECTOR) !== SUPERSEDED);
});

Deno.test("action_intent parity - a missing profile identifier moves the commitment", async () => {
  // Both identifiers live INSIDE the hashed root (RFC-0003 5.1.2.1). If either
  // can be dropped without moving the digest, they are decoration.
  const text = trinityText(VECTOR);
  for (
    const id of [
      '"canonical_encoding":"hsp-jcs@v0"',
      '"numeric_profile":"cnp-0"',
    ]
  ) {
    assert(text.includes(id), id + " is not in the hashed root");
    const without = text.replace(id + ",", "");
    assert(without !== text, "the replacement did not apply");
    const d = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(without),
    );
    const hex = Array.from(new Uint8Array(d)).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    assert(hex !== EXPECTED, "removing " + id + " left the digest unchanged");
  }
});
