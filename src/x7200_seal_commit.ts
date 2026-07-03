#!/usr/bin/env -S deno run -A
// src/x7200_seal_commit.ts — seal a git commit as a verifiable action receipt
// position: 7/2 → completion/witnessed-artifact (bucket 7): the federation's own
//   commits carry their own agentseal receipt, so PROVENANCE.md's pitch is
//   self-demonstrating — "this very commit is a verifiable agent action".
// hex_dipole: "00 00 00 00 00 00 00 59"
//   completion_pole+0.70 (PRIMARY: axis 7, matches bucket 7)
// placement_policy: axis
// maturity: draft
// skill_tag: seal_commit
// skill_safe: yes-with-care
//   seal reads the current voice's private key (~/.trinity/keys) to sign, exactly
//   as chord signing does, and writes a git note; verify needs only public keys.
//
// intent: dogfood our own product on our own history. A commit is an agent action
//   (verb git.commit, effect source_change → class A2); seal binds a witnessed,
//   content-addressed receipt to it (git note refs/notes/trinity-seals), and
//   verify re-derives it locally against the public registry — no trusted host.
//
// Usage:
//   t seal-commit [<sha>] [--voice claude]   seal a commit (default HEAD)
//   t seal-commit verify [<sha>]             re-derive the seal locally

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { seal, type SealedAction, verifySeal } from "@s0fractal/agentseal";
import type { Witness } from "@s0fractal/witness";
import { loadRegistry, type Registry } from "./x2F37_voice_keys.ts";

const NOTES_REF = "refs/notes/trinity-seals";
const REGISTRY_PATH = join(
  new URL(".", import.meta.url).pathname,
  "x2F38_voice_pubkeys.json",
);

function unb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s);
}

async function git(args: string[]): Promise<string> {
  const out = await new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "piped",
  })
    .output();
  if (!out.success) {
    throw new Error(
      `git ${args.join(" ")}: ${new TextDecoder().decode(out.stderr)}`,
    );
  }
  return new TextDecoder().decode(out.stdout).trim();
}

/** A commit, as a bounded agent action the kernel can classify (A2). */
export function commitIntent(sha: string) {
  return {
    verb: "git.commit",
    target: sha,
    effects: ["source_change"],
  };
}

/** Load a voice's own keypair as a Witness — the same custody chord signing uses. */
async function voiceWitness(voice: string, reg: Registry): Promise<Witness> {
  const entry = reg.keys[voice];
  if (!entry) throw new Error(`voice '${voice}' is not in the registry`);
  const home = Deno.env.get("HOME") ?? ".";
  const keyPath = join(home, ".trinity", "keys", `${voice}.ed25519.json`);
  const stored = JSON.parse(await Deno.readTextFile(keyPath)) as {
    private_key_pkcs8: string;
  };
  const key = await crypto.subtle.importKey(
    "pkcs8",
    unb64(stored.private_key_pkcs8) as BufferSource,
    "Ed25519",
    false,
    ["sign"],
  );
  return {
    publicKey: unb64(entry.pubkey),
    sign: async (digest) =>
      new Uint8Array(
        await crypto.subtle.sign("Ed25519", key, digest as BufferSource),
      ),
  };
}

/** Seal a commit under a witness. Pure over its inputs — exported for testing
 *  with an ephemeral witness (no real key, no git). */
export async function sealCommit(
  sha: string,
  witness: Witness,
  at?: number,
): Promise<SealedAction> {
  return await seal(
    commitIntent(sha),
    [witness],
    at !== undefined ? { at } : {},
  );
}

/** Re-derive a commit seal locally: the receipt must be intact, the quorum must
 *  hold against the given public keys, and the seal must be FOR this commit. */
export async function verifyCommitSeal(
  sealed: SealedAction,
  sha: string,
  authorized: Uint8Array[],
): Promise<{ ok: boolean; receiptIntact: boolean; boundToCommit: boolean }> {
  const v = await verifySeal(sealed, authorized, 1);
  const boundToCommit = sealed.intent?.target === sha;
  return {
    ok: v.ok && v.receiptIntact && boundToCommit,
    receiptIntact: v.receiptIntact,
    boundToCommit,
  };
}

/** Store/read the seal as clean base64 JSON — a raw Uint8Array serializes to an
 *  un-iterable {"0":..} object, so the co-signature bytes are explicit strings. */
function serializeSeal(s: SealedAction): string {
  return JSON.stringify({
    ...s,
    coSignatures: s.coSignatures.map((c) => ({
      publicKey: b64(c.publicKey),
      signature: b64(c.signature),
    })),
  });
}

function deserializeSeal(json: string): SealedAction {
  const raw = JSON.parse(json) as Omit<SealedAction, "coSignatures"> & {
    coSignatures: { publicKey: string; signature: string }[];
  };
  return {
    ...raw,
    coSignatures: raw.coSignatures.map((c) => ({
      publicKey: unb64(c.publicKey),
      signature: unb64(c.signature),
    })),
  };
}

async function readSeal(sha: string): Promise<SealedAction | null> {
  try {
    return deserializeSeal(
      await git(["notes", "--ref", NOTES_REF, "show", sha]),
    );
  } catch {
    return null;
  }
}

async function main(argv: string[]) {
  const flags = argv.filter((a) => a.startsWith("--"));
  const positional = argv.filter((a) => !a.startsWith("--"));
  const voice = flags.find((f) => f.startsWith("--voice="))?.slice(8) ??
    "claude";
  const wantJson = flags.includes("--json");
  const verifyMode = positional[0] === "verify";
  const shaArg = verifyMode ? positional[1] : positional[0];
  const sha = await git(["rev-parse", shaArg ?? "HEAD"]);
  const reg = await loadRegistry(REGISTRY_PATH);

  if (verifyMode) {
    const sealed = await readSeal(sha);
    if (!sealed) {
      console.log(
        `# seal-commit verify @ 7/2 — no seal on ${sha.slice(0, 12)}`,
      );
      Deno.exit(1);
    }
    const signerVoice = Object.keys(reg.keys).find((v) =>
      sealed.coSignatures.some(
        (c) => b64(c.publicKey) === reg.keys[v].pubkey,
      )
    );
    const authorized = Object.values(reg.keys).map((k) => unb64(k.pubkey));
    const r = await verifyCommitSeal(sealed, sha, authorized);
    const out = {
      type: "commit_seal_verify",
      position: "7/2",
      sha,
      signer: signerVoice ?? null,
      cls: sealed.cls,
      ...r,
    };
    if (wantJson) console.log(JSON.stringify(out, null, 2));
    else {
      console.log(`# seal-commit verify @ 7/2 — ${sha.slice(0, 12)}`);
      console.log(
        `#   signer: ${signerVoice ?? "(unregistered)"}  class: ${sealed.cls}`,
      );
      console.log(
        `#   receipt intact: ${r.receiptIntact}  bound to commit: ${r.boundToCommit}`,
      );
      console.log(
        `#   ${
          r.ok
            ? "✅ VERIFIED — this commit is a verifiable agent action"
            : "⛔ FAILED"
        }`,
      );
    }
    if (!r.ok) Deno.exit(1);
    return;
  }

  // seal mode
  const witness = await voiceWitness(voice, reg);
  const block = Number(flags.find((f) => f.startsWith("--at="))?.slice(5)) ||
    undefined;
  const sealed = await sealCommit(sha, witness, block);
  await git([
    "notes",
    "--ref",
    NOTES_REF,
    "add",
    "-f",
    "-m",
    serializeSeal(sealed),
    sha,
  ]);
  const out = {
    type: "commit_seal",
    position: "7/2",
    sha,
    voice,
    cls: sealed.cls,
    receiptDigest: sealed.receiptDigest,
  };
  if (wantJson) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(
      `# seal-commit @ 7/2 — sealed ${
        sha.slice(0, 12)
      } as ${voice} (${sealed.cls})`,
    );
    console.log(
      `#   receipt ${
        sealed.receiptDigest.slice(0, 16)
      } → git note ${NOTES_REF}`,
    );
    console.log(
      `#   verify: t seal-commit verify ${
        sha.slice(0, 12)
      }   (push: git push origin ${NOTES_REF})`,
    );
  }
}

if (import.meta.main) await main(Deno.args);
