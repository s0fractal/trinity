// src/voice_keys_test.ts — x2F37 voice keys: mint → sign → verify → adjudicate.
// All keys here are EPHEMERAL (minted in-test, never persisted): the tests
// prove the cryptographic seam end-to-end without touching real custody.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  mintKeypair,
  type Registry,
  resignChordFile,
  signHash,
  verifyAttestations,
  verifyChordFile,
  verifySig,
} from "./x2F37_voice_keys.ts";
import { adjudicate, type Attestation } from "./x2F36_fqdn_sovereignty.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const H = "blake3:0123456789abcdef0123456789abcdef";

async function ephemeralVoices(
  names: string[],
): Promise<{ registry: Registry; privs: Map<string, string> }> {
  const registry: Registry = {
    schema: "trinity.voice-pubkeys.v0.1",
    custody_note: "ephemeral test registry",
    keys: {},
  };
  const privs = new Map<string, string>();
  for (const name of names) {
    const { entry, privateKeyB64 } = await mintKeypair("test");
    registry.keys[name] = entry;
    privs.set(name, privateKeyB64);
  }
  return { registry, privs };
}

Deno.test("voice-keys — sign/verify roundtrip and tamper rejection", async () => {
  const { registry, privs } = await ephemeralVoices(["codex"]);
  const sig = await signHash(H, privs.get("codex")!);
  assert(await verifySig(H, sig, registry.keys["codex"].pubkey));
  // Different hash, same sig → invalid.
  assert(
    !(await verifySig(
      H.replace("0123", "ffff"),
      sig,
      registry.keys["codex"].pubkey,
    )),
  );
  // Garbage sig → invalid, not a crash.
  assert(!(await verifySig(H, "bm90LWEtc2ln", registry.keys["codex"].pubkey)));
});

Deno.test("voice-keys — verified quorum reaches 'authenticated' end-to-end", async () => {
  const voices = ["codex", "gemini", "kimi"];
  const { registry, privs } = await ephemeralVoices(voices);
  const attestations = await Promise.all(voices.map(async (voice) => ({
    voice,
    stance: "AYE" as const,
    content_blake3: H,
    sig: await signHash(H, privs.get(voice)!),
  })));
  const { verified, dropped } = await verifyAttestations(
    attestations,
    registry,
  );
  assertEquals(dropped.length, 0);
  const v = adjudicate(H, "claude", verified);
  assertEquals(v.verdict, "AYE");
  assertEquals(v.assurance, "authenticated");
});

Deno.test("voice-keys — forged signature is DROPPED, quorum falls to PENDING", async () => {
  const voices = ["codex", "gemini", "kimi"];
  const { registry, privs } = await ephemeralVoices(voices);
  const good = async (voice: string) => ({
    voice,
    stance: "AYE" as const,
    content_blake3: H,
    sig: await signHash(H, privs.get(voice)!),
  });
  // kimi's attestation carries codex's signature — a forgery.
  const forged = {
    voice: "kimi",
    stance: "AYE" as const,
    content_blake3: H,
    sig: await signHash(H, privs.get("codex")!),
  };
  const { verified, dropped } = await verifyAttestations(
    [await good("codex"), await good("gemini"), forged],
    registry,
  );
  assertEquals(dropped.length, 1);
  assert(dropped[0].includes("kimi"));
  assert(dropped[0].includes("INVALID"));
  const v = adjudicate(H, "claude", verified);
  assertEquals(v.verdict, "PENDING"); // 2 AYE < threshold 3 — forgery removed
});

Deno.test("voice-keys — signature from an unregistered voice is dropped", async () => {
  const { registry, privs } = await ephemeralVoices(["codex"]);
  const { entry: _unused, privateKeyB64 } = await mintKeypair("attacker");
  const { verified, dropped } = await verifyAttestations(
    [
      {
        voice: "ghost", // not in registry — claims identity it cannot prove
        stance: "AYE",
        content_blake3: H,
        sig: await signHash(H, privateKeyB64),
      },
      {
        voice: "codex",
        stance: "AYE",
        content_blake3: H,
        sig: await signHash(H, privs.get("codex")!),
      },
    ],
    registry,
  );
  assertEquals(verified.length, 1);
  assertEquals(verified[0].voice, "codex");
  assertEquals(dropped.length, 1);
  assert(dropped[0].includes("ghost"));
});

Deno.test("voice-keys — unsigned attestations pass through as unverified (keyless mode intact)", async () => {
  const { registry } = await ephemeralVoices(["codex"]);
  const unsigned: Attestation[] = [
    { voice: "gemini", stance: "AYE", content_blake3: H },
  ];
  const { verified, dropped } = await verifyAttestations(unsigned, registry);
  assertEquals(dropped.length, 0);
  assertEquals(verified[0].sig_verified, false);
  const rest: Attestation[] = [
    { voice: "kimi", stance: "AYE", content_blake3: H },
    { voice: "codex", stance: "AYE", content_blake3: H },
  ];
  const v = adjudicate(H, "claude", [...verified, ...rest]);
  assertEquals(v.verdict, "AYE"); // keyless PoC still admits…
  assertEquals(v.assurance, "unauthenticated"); // …but never claims identity
});

Deno.test("chord-sig — sign-chord → verify roundtrip; edit after signing is detected", async () => {
  const dir = await Deno.makeTempDir({ prefix: "chordsig_" });
  const home = Deno.env.get("HOME");
  try {
    // Ephemeral custody: fake HOME so the test never touches real keys.
    Deno.env.set("HOME", dir);
    const { entry, privateKeyB64 } = await mintKeypair("test");
    await Deno.mkdir(join(dir, ".trinity", "keys"), { recursive: true });
    await Deno.writeTextFile(
      join(dir, ".trinity", "keys", "testvoice.ed25519.json"),
      JSON.stringify({
        voice: "testvoice",
        alg: "ed25519",
        private_key_pkcs8: privateKeyB64,
      }),
    );
    const registry: Registry = {
      schema: "trinity.voice-pubkeys.v0.1",
      custody_note: "ephemeral",
      keys: { testvoice: entry },
    };

    const chordPath = join(dir, "x7700_999999_testvoice_sample.myc.md");
    await Deno.writeTextFile(
      chordPath,
      "---\ntype: chord.receipt\nvoice: testvoice-model-1\nmode: receipt\n---\n\n# Sample\n\nbody text\n",
    );

    // Sign the edited chord in place.
    const signed = await resignChordFile(chordPath);
    assert(signed.ok, signed.reason);

    // Verifies green against the ephemeral registry.
    const v1 = await verifyChordFile(chordPath, registry);
    assert(v1.signed);
    assert(v1.valid, v1.reasons.join("; "));
    assertEquals(v1.voice, "testvoice");

    // Tamper with the body AFTER signing → detected, with the exact reason.
    const tampered = (await Deno.readTextFile(chordPath)).replace(
      "body text",
      "body text (edited)",
    );
    await Deno.writeTextFile(chordPath, tampered);
    const v2 = await verifyChordFile(chordPath, registry);
    assert(v2.signed);
    assert(!v2.valid);
    assert(v2.reasons.some((r) => r.includes("hash mismatch")));

    // Re-sign after the edit → green again (old sig replaced, not stacked).
    const resigned = await resignChordFile(chordPath);
    assert(resigned.ok);
    const v3 = await verifyChordFile(chordPath, registry);
    assert(v3.valid, v3.reasons.join("; "));
    const sigBlocks =
      (await Deno.readTextFile(chordPath)).match(/content_sig:/g) ?? [];
    assertEquals(sigBlocks.length, 1);
  } finally {
    if (home !== undefined) Deno.env.set("HOME", home);
    await Deno.remove(dir, { recursive: true });
  }
});
