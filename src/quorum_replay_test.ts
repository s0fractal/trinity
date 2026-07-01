// Falsifier for audit A9: quorum signatures must be CHORD-BOUND. The old convention
// had each voice sign sha256(claim) alone, so the same signatures verified for ANY
// chord quoting the claim — a recorded quorum could be replayed onto a fabricated
// chord the voices never signed for (demonstrated in
// probes/external-trust-verifier-v0/replay.ts). quorumDigest binds the coordinate:
// a signature made for chord A must NOT verify for chord B.
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  mintKeypair,
  quorumDigest,
  signHash,
  verifySig,
} from "./x2F37_voice_keys.ts";

Deno.test("A9: a quorum signature does not replay across chords", async () => {
  const kp = await mintKeypair("test-ephemeral");
  const claim = "objective: evidence unification before more product expansion";

  const digestA = await quorumDigest(claim, "x3300_955660");
  const digestB = await quorumDigest(claim, "x9999_999999");

  // the coordinate binding must make the two digests differ (the fix itself)
  assert(
    digestA !== digestB,
    "chord-bound digests must differ by chord — else signatures replay",
  );

  const sigA = await signHash(digestA, kp.privateKeyB64);
  assert(
    await verifySig(digestA, sigA, kp.entry.pubkey),
    "signature must verify for its own chord",
  );
  assert(
    !(await verifySig(digestB, sigA, kp.entry.pubkey)),
    "signature must NOT verify for a different chord (replay blocked)",
  );
});

Deno.test("A9: quorumDigest is deterministic + order-sensitive to the coordinate", async () => {
  const claim = "same claim text";
  assert(
    (await quorumDigest(claim, "xAAAA_1")) ===
      (await quorumDigest(claim, "xAAAA_1")),
    "same (claim, chord) → same digest",
  );
  assert(
    (await quorumDigest(claim, "xAAAA_1")) !==
      (await quorumDigest(claim, "xBBBB_1")),
    "different chord → different digest",
  );
});
