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
import { actionBoundAuthority } from "./x5E10_warrant.ts";
import {
  canonicalIntentBytes as trinityBytes,
  canonicalIntentText as trinityText,
  intentCommitment as trinityCommitment,
  parseActionIntentBytes as trinityParse,
  validateIntent as trinityValidate,
} from "./x5E10_warrant.ts";

const MYC_CONTRACT = new URL(
  "../myc/src/x5820_action_intent.ts",
  import.meta.url,
);

type MycModule = {
  canonicalIntentText: (i: unknown) => string;
  canonicalIntentBytes: (i: unknown) => Uint8Array;
  parseActionIntentBytes: (b: Uint8Array) => { ok: boolean; error?: string };
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

Deno.test("action_intent parity - LIVE E2E: Trinity authorizes the proposal MYC actually wrote", async () => {
  // The gap this closes: MYC's own E2E proved storage, and Trinity's authority
  // tests used a descriptor built in the test. Nothing fed the STORED proposal
  // into the authority comparison, so the two halves could agree separately
  // about different things.
  const myc = await loadMyc();
  if (!myc) {
    console.log("  SKIPPED: myc submodule is not checked out");
    return;
  }
  const { runCli } = await import(
    new URL("../myc/src/x5800_propose.ts", import.meta.url).href
  ) as { runCli: (a: string[]) => Promise<void> };

  const root = await Deno.makeTempDir({ prefix: "e2e_intent_" });
  try {
    const intentPath = `${root}/intent.json`;
    await Deno.writeTextFile(intentPath, JSON.stringify(VECTOR));

    await runCli([
      "--root",
      root,
      "--proposal",
      "cross-substrate adoption e2e",
      "--requires",
      "trinity",
      "--proposer",
      "claude",
      "--action-intent",
      intentPath,
      "--json",
    ]);

    // 2. Read what was actually written, not what a helper returned.
    const dir = `${root}/public/proposals`;
    const names: string[] = [];
    for await (const e of Deno.readDir(dir)) if (e.isFile) names.push(e.name);
    assertEquals(names.length, 1, `expected one proposal, got ${names}`);
    const written = await Deno.readTextFile(`${dir}/${names[0]}`);
    const body = JSON.parse(
      written.match(/```json myc\s*\n([\s\S]*?)\n```/)![1],
    );
    // Read it exactly where readProposal reads it: the grant lives inside the
    // descriptor's BODY, and the commitment is `commitment.value`. Mirroring the
    // production reader matters — a test that invented its own shape would pass
    // while the real path found nothing.
    const storedGrant = body.body?.action_grant?.intent_commitment as string;
    assert(
      storedGrant,
      `the stored proposal carries no action_grant: ${written.slice(0, 200)}`,
    );

    // 3. Compute the intent through TRINITY, independently of what MYC stored.
    const trinityIC = await trinityCommitment(VECTOR);
    assertEquals(
      storedGrant,
      trinityIC,
      "the stored grant is not what Trinity computes for the same intent",
    );

    // 4. Pass the STORED descriptor to Trinity's authority gate.
    const descriptor = {
      fqdn: String(body.fqdn),
      commitment: String(body.commitment?.value ?? body.commitment),
      action_grant: { intent_commitment: storedGrant },
    };
    const ok = actionBoundAuthority(trinityIC, descriptor, "implemented");
    assertEquals(ok.authorized, true, `denied: ${ok.reason_code} ${ok.reason}`);

    // 5. And the superseded commitment does not authorize the same proposal.
    const denied = actionBoundAuthority(SUPERSEDED, descriptor, "implemented");
    assertEquals(denied.authorized, false);
    assertEquals(denied.reason_code, "intent_mismatch");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("action_intent parity - LIVE: both boundaries refuse duplicate names and invalid UTF-8 from raw bytes", async () => {
  const myc = await loadMyc();
  if (!myc) {
    console.log("  SKIPPED: myc submodule is not checked out");
    return;
  }
  const enc = (s: string) => new TextEncoder().encode(s);
  const attacks: [string, Uint8Array, string][] = [
    [
      "duplicate member name",
      enc(
        '{"verb":"deny","verb":"apply","target_substrate":"myc",' +
          '"args_commitment":"c1","input_commitments":["a"],' +
          '"requested_effects":["write"]}',
      ),
      "duplicate-member-name",
    ],
    [
      "escaped duplicate name",
      enc(
        '{"verb":"deny","ve\\u0072b":"apply","target_substrate":"myc",' +
          '"args_commitment":"c1","input_commitments":["a"],' +
          '"requested_effects":["write"]}',
      ),
      "duplicate-member-name",
    ],
    [
      "invalid UTF-8",
      new Uint8Array([
        ...enc('{"verb":"ap'),
        0xff,
        ...enc(
          'ly","target_substrate":"myc","args_commitment":"c1",' +
            '"input_commitments":["a"],"requested_effects":["write"]}',
        ),
      ]),
      "invalid-utf8",
    ],
  ];
  for (const [name, bytes, expect] of attacks) {
    const t = trinityParse(bytes);
    const m = myc.parseActionIntentBytes(bytes);
    assertEquals(t.ok, false, `${name}: trinity admitted it`);
    assertEquals(m.ok, false, `${name}: myc admitted it`);
    if (!t.ok) assert(t.error.includes(expect), `${name}: trinity: ${t.error}`);
    if (!m.ok) {
      assert(String(m.error).includes(expect), `${name}: myc: ${m.error}`);
    }
  }
});

Deno.test("action_intent parity - LIVE: a changing getter cannot reach canonical bytes on either side", async () => {
  const myc = await loadMyc();
  if (!myc) {
    console.log("  SKIPPED: myc submodule is not checked out");
    return;
  }
  const mk = (badFrom: number) => {
    let reads = 0;
    const evil: Record<string, unknown> = {
      verb: "apply",
      target_substrate: "myc",
      args_commitment: "c1",
      input_commitments: ["a"],
    };
    Object.defineProperty(evil, "requested_effects", {
      enumerable: true,
      get() {
        reads++;
        return reads >= badFrom ? [1] : ["write"];
      },
    });
    return evil;
  };
  for (const from of [1, 2, 3]) {
    for (
      const [who, text] of [
        ["trinity", trinityText],
        ["myc", myc.canonicalIntentText],
      ] as const
    ) {
      let out = "";
      try {
        out = (text as (i: unknown) => string)(mk(from));
      } catch { /* refusing is the other correct answer */ }
      assert(
        !out.includes("[1]"),
        `${who}: canonical text carried a number: ${out}`,
      );
    }
  }
});
