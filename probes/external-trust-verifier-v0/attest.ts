#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env --allow-write
// PRODUCER side (this is US — it uses trinity's tooling and a private voice key).
// It captures the live Substrate Court verdict + each substrate's signed health
// envelope (with inline body), and signs the exact bundle bytes with a registered
// voice key. The output artifact `court-attestation.json` is PUBLIC and is all an
// outsider needs — see court.ts, which verifies it using ONLY jsr:@s0fractal/witness
// + the public registry + a public reference encoder, never this file or t2F37.
//
// Run:  deno run -A attest.ts [voice=claude]
import { encodeCanonical, multihashSha256 } from "../receipt-envelope-encoder-v0/ts/canonical_cbor.ts";

const HERE = new URL(".", import.meta.url).pathname;
const ROOT = new URL("../../", import.meta.url).pathname;
const T = `${ROOT}t`;
const voice = Deno.args[0] ?? "claude";

async function run(args: string[]): Promise<unknown> {
  const p = new Deno.Command(T, { args, stdout: "piped", stderr: "null" });
  const out = await p.output();
  const text = new TextDecoder().decode(out.stdout).trim();
  // t prints a leading "# ..." banner line before JSON on some commands
  const jsonStart = text.indexOf("{");
  return JSON.parse(jsonStart >= 0 ? text.slice(jsonStart) : text);
}

// 1. the live court verdict — the real claim
const verdict = await run(["court", "--live"]);

// 2. each substrate's signed health envelope (with inline body)
const subs = ["trinity", "omega", "liquid", "myc"];
const envelopes: Record<string, unknown>[] = [];
for (const tag of subs) {
  try {
    const statusPath = tag === "trinity"
      ? `${ROOT}src/x2E00_status.ts`
      : `${ROOT}${tag}/src/x2E00_status.ts`;
    const s = await run([
      tag === "trinity" ? "status" : `${tag}`,
      "--envelope",
    ]).catch(() => null) as Record<string, unknown> | null;
    // trinity via `t status`; submodules expose their own status organ — fall back
    // to running it directly so this works regardless of the dispatcher's surface.
    let env = s?.substrate_health_envelope as Record<string, unknown> | undefined;
    if (!env) {
      const p = new Deno.Command("deno", {
        args: ["run", "--allow-read", "--allow-env", statusPath, "--envelope"],
        stdout: "piped",
        stderr: "null",
      });
      const o = await p.output();
      const txt = new TextDecoder().decode(o.stdout).trim();
      const j = JSON.parse(txt.slice(txt.indexOf("{")));
      env = j.substrate_health_envelope;
    }
    if (env) envelopes.push(env);
  } catch {
    // substrate absent — the court is N-ary, it records who showed up
  }
}

// Sanity: our own recompute must match each envelope's declared body_hash before we
// publish — never attest a bundle we can't stand behind.
for (const env of envelopes) {
  const recomputed = await multihashSha256(encodeCanonical(env.body as Parameters<typeof encodeCanonical>[0]));
  if (recomputed !== env.body_hash) {
    console.error(
      `refusing to attest: ${env.substrate_tag}'s body_hash does not recompute (${recomputed} != ${env.body_hash})`,
    );
    Deno.exit(1);
  }
}

// 3. sign the EXACT bundle bytes with the voice's registered key
const bundleStr = JSON.stringify({ verdict, envelopes });
const enc = new TextEncoder();
const digest = "sha256:" +
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(bundleStr)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
const signOut = await new Deno.Command(T, {
  args: ["voice-keys", "sign", `--voice=${voice}`, `--hash=${digest}`],
  stdout: "piped",
  stderr: "null",
}).output();
const signText = new TextDecoder().decode(signOut.stdout);
const sig = JSON.parse(signText.slice(signText.indexOf("{"))).sig as string;

const artifact = {
  note:
    "PUBLIC attestation of the live Substrate Court. Verify with court.ts using " +
    "only jsr:@s0fractal/witness + src/x2F38_voice_pubkeys.json + a public encoder.",
  signed_payload: bundleStr,
  attestation: { voice, alg: "ed25519", payload: digest, sig },
};
await Deno.writeTextFile(
  `${HERE}court-attestation.json`,
  JSON.stringify(artifact, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    ok: true,
    witnesses: envelopes.map((e) => e.substrate_tag),
    voice,
    digest,
    wrote: "court-attestation.json",
  }, null, 2),
);
