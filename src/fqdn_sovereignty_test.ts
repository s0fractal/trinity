import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { resolveFqdn } from "./x2F30_fqdn_resolver.ts";
import { witness } from "./x2F32_fqdn_witness.ts";
import {
  adjudicate,
  type Attestation,
  mayExecute,
} from "./x2F36_fqdn_sovereignty.ts";

const aye = (voice: string, content_blake3: string): Attestation => ({
  voice,
  stance: "AYE",
  content_blake3,
});
const nay = (
  voice: string,
  content_blake3: string,
  reason: string,
): Attestation => ({
  voice,
  stance: "NAY",
  content_blake3,
  reason,
});

const H = "a".repeat(64); // a content hash
const H2 = "b".repeat(64); // a different content hash

Deno.test("sovereignty — 3 distinct AYE, no NAY → admitted (consensus root)", () => {
  const v = adjudicate(H, "claude", [
    aye("codex", H),
    aye("gemini", H),
    aye("kimi", H),
  ]);
  assertEquals(v.verdict, "AYE");
  assert(mayExecute(v));
});

Deno.test("sovereignty — a single NAY vetoes even past threshold", () => {
  const v = adjudicate(H, "claude", [
    aye("codex", H),
    aye("gemini", H),
    aye("kimi", H),
    nay("antigravity", H, "unsafe"),
  ]);
  assertEquals(v.verdict, "NAY");
  assert(!mayExecute(v));
});

Deno.test("sovereignty — author cannot self-admit (self-AYE vetoes)", () => {
  const v = adjudicate(H, "claude", [
    aye("claude", H), // self
    aye("codex", H),
    aye("gemini", H),
  ]);
  assertEquals(v.verdict, "NAY");
});

Deno.test("sovereignty — below threshold is PENDING, not denied", () => {
  const v = adjudicate(H, "claude", [aye("codex", H), aye("gemini", H)]);
  assertEquals(v.verdict, "PENDING");
  assert(!mayExecute(v));
});

Deno.test("sovereignty — admission is content-pinned: editing bytes drops it back to PENDING", () => {
  const attests = [aye("codex", H), aye("gemini", H), aye("kimi", H)];
  // admitted for the original bytes H
  assertEquals(adjudicate(H, "claude", attests).verdict, "AYE");
  // the node was edited → its content hash is now H2; the old attestations are
  // pinned to H and no longer count → back to PENDING until re-attested.
  const after = adjudicate(H2, "claude", attests);
  assertEquals(after.verdict, "PENDING");
  assert(after.reasons.some((r) => r.includes("ignored")));
});

Deno.test("sovereignty — keyless AYEs are 'unauthenticated' and barred from strict execution (Sybil boundary)", () => {
  const v = adjudicate(H, "claude", [
    aye("codex", H),
    aye("gemini", H),
    aye("kimi", H),
  ]);
  assertEquals(v.verdict, "AYE");
  assertEquals(v.assurance, "unauthenticated");
  assert(mayExecute(v)); // PoC default: admitted is enough
  assert(!mayExecute(v, { requireAuthenticated: true })); // real deployment: barred
  assert(v.reasons.some((r) => r.includes("Sybil")));
});

Deno.test("sovereignty — sig PRESENCE alone does not upgrade assurance (anti-forgery)", () => {
  const signed = (voice: string): Attestation => ({
    voice,
    stance: "AYE",
    content_blake3: H,
    sig: `sig-of-${voice}-over-${H.slice(0, 8)}`, // unverified — could be anything
  });
  const v = adjudicate(H, "claude", [
    signed("codex"),
    signed("gemini"),
    signed("kimi"),
  ]);
  assertEquals(v.assurance, "unauthenticated");
  assert(!mayExecute(v, { requireAuthenticated: true }));
});

Deno.test("sovereignty — assurance upgrades to 'authenticated' only when every AYE is registry-verified", () => {
  const verified = (voice: string): Attestation => ({
    voice,
    stance: "AYE",
    content_blake3: H,
    sig: `valid-sig-${voice}`,
    sig_verified: true, // set by x2F37.verifyAttestations after real crypto
  });
  const v = adjudicate(H, "claude", [
    verified("codex"),
    verified("gemini"),
    verified("kimi"),
  ]);
  assertEquals(v.assurance, "authenticated");
  assert(mayExecute(v, { requireAuthenticated: true }));

  // One unverified AYE in the quorum drags the whole verdict back down.
  const mixed = adjudicate(H, "claude", [
    verified("codex"),
    verified("gemini"),
    { voice: "kimi", stance: "AYE", content_blake3: H, sig: "unverified" },
  ]);
  assertEquals(mixed.assurance, "unauthenticated");
});

Deno.test("sovereignty — full arc: resolve → witness → attest → admit, then edit revokes", async () => {
  const base = await Deno.makeTempDir({ prefix: "fqdn_sov_" });
  try {
    const file = join(base, "x9999_organ.myc.md");
    await Deno.writeTextFile(file, "v1\n");

    const w1 = await witness(
      await resolveFqdn("x9999_organ.myc.md", [base]),
      1,
    );
    const quorum = ["codex", "gemini", "kimi"].map((v) =>
      aye(v, w1.content_blake3!)
    );
    const admitted = adjudicate(w1.content_blake3, "claude", quorum);
    assertEquals(admitted.verdict, "AYE");
    assert(mayExecute(admitted));

    // same role address, edited bytes → quorum no longer covers it
    await Deno.writeTextFile(file, "v2 — silently changed\n");
    const w2 = await witness(
      await resolveFqdn("x9999_organ.myc.md", [base]),
      2,
    );
    assertEquals(w1.fqdn, w2.fqdn); // role stable
    assert(w1.content_blake3 !== w2.content_blake3); // content moved
    const revoked = adjudicate(w2.content_blake3, "claude", quorum);
    assertEquals(revoked.verdict, "PENDING"); // admission did NOT carry over
    assert(!mayExecute(revoked));
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});
