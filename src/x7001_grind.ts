#!/usr/bin/env -S deno run -A
// src/x7001_grind.ts — grind (Completion + Void)
// position: 7/0 → completion(7) × void(0)
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "8E 00 00 00 00 00 00 59"
// placement_policy: composite
//
// grind.ts — topological hex-dipole nonce grinding
//
// Reads a chord file with YAML frontmatter declaring `primary: "oct:N..."`,
// grinds a `nonce` value until the BLAKE3-256 hash of the file's bytes
// begins with one of the two hex characters mapped to octant N. Outputs
// the modified file content, the resulting hash, and the target folder.
//
// Mapping per contracts/TOPOLOGICAL_GRINDING.v0.draft.md §2:
//   oct:0 ⇄ hex 0,1     oct:4 ⇄ hex 8,9
//   oct:1 ⇄ hex 2,3     oct:5 ⇄ hex A,B
//   oct:2 ⇄ hex 4,5     oct:6 ⇄ hex C,D
//   oct:3 ⇄ hex 6,7     oct:7 ⇄ hex E,F

import { blake3 } from "npm:@noble/hashes@1.4.0/blake3";

const OCTANT_HEX: Record<number, [string, string]> = {
  0: ["0", "1"],
  1: ["2", "3"],
  2: ["4", "5"],
  3: ["6", "7"],
  4: ["8", "9"],
  5: ["a", "b"],
  6: ["c", "d"],
  7: ["e", "f"],
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parsePrimaryOctant(content: string): number {
  // Match: primary: "oct:N..."  or  primary: "oct:N"
  const match = content.match(/^\s*primary:\s*["']?oct:(\d+)/m);
  if (!match) {
    throw new Error("could not find `primary: oct:N` in frontmatter");
  }
  const n = Number(match[1]);
  if (!Number.isInteger(n) || n < 0 || n > 7) {
    throw new Error(`octant must be in [0,7], got ${n}`);
  }
  return n;
}

function stripExistingNonce(content: string): string {
  // Remove any prior `nonce: <num>` line in the frontmatter so re-grinding
  // doesn't fight a stale value. Only touch the frontmatter (first `---...---`).
  const frontmatterEnd = content.indexOf("\n---", 4);
  if (!content.startsWith("---") || frontmatterEnd < 0) {
    throw new Error("file lacks YAML frontmatter delimited by `---`");
  }
  const frontmatter = content.slice(0, frontmatterEnd);
  const rest = content.slice(frontmatterEnd);
  const cleaned = frontmatter.replace(/^nonce:\s*\d+\s*$/gm, "").replace(
    /\n\n+/g,
    "\n",
  );
  return cleaned + rest;
}

function withNonce(content: string, nonce: number): string {
  // Insert `nonce: <n>` as the LAST key in the frontmatter (just before the
  // closing `---`).
  const closingIdx = content.indexOf("\n---", 4);
  if (closingIdx < 0) throw new Error("malformed frontmatter");
  const head = content.slice(0, closingIdx);
  const tail = content.slice(closingIdx);
  return `${head}\nnonce: ${nonce}${tail}`;
}

function grind(originalContent: string): {
  content: string;
  hash: string;
  nonce: number;
  octant: number;
  hexPrefix: string;
  attempts: number;
} {
  const octant = parsePrimaryOctant(originalContent);
  const targets = OCTANT_HEX[octant];
  const base = stripExistingNonce(originalContent);

  let nonce = 0;
  const encoder = new TextEncoder();
  while (true) {
    const candidate = withNonce(base, nonce);
    const hashBytes = blake3(encoder.encode(candidate), { dkLen: 32 });
    const hash = bytesToHex(hashBytes);
    const firstHex = hash[0];
    if (targets.includes(firstHex)) {
      return {
        content: candidate,
        hash,
        nonce,
        octant,
        hexPrefix: firstHex,
        attempts: nonce + 1,
      };
    }
    nonce++;
    if (nonce > 10_000_000) {
      throw new Error(
        `grinding failed after ${nonce} attempts (should not happen at Depth-1)`,
      );
    }
  }
}

function targetFolder(hexChar: string): string {
  return hexChar.toLowerCase();
}

function usage(): never {
  console.error(
    "Usage: deno run -A tools/grind.ts <chord-file.md> [--in-place]",
  );
  console.error("");
  console.error(
    "Reads the chord file, grinds a nonce so BLAKE3-256 prefix matches",
  );
  console.error(
    "the claimed `primary: oct:N`, and prints the resulting hash + target",
  );
  console.error(
    "folder. With --in-place, rewrites the file with the grinding nonce.",
  );
  Deno.exit(1);
}

if (import.meta.main) {
  const args = Deno.args;
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") usage();
  const inPlace = args.includes("--in-place");
  const path = args.find((a) => !a.startsWith("--"));
  if (!path) usage();

  const original = Deno.readTextFileSync(path);
  const start = performance.now();
  const result = grind(original);
  const elapsed = performance.now() - start;

  console.log(`octant:      oct:${result.octant}`);
  console.log(`hex_prefix:  ${result.hexPrefix}`);
  console.log(`hash:        ${result.hash}`);
  console.log(`nonce:       ${result.nonce}`);
  console.log(`attempts:    ${result.attempts}`);
  console.log(`elapsed_ms:  ${elapsed.toFixed(1)}`);
  console.log(`target_dir:  jazz/chords/${targetFolder(result.hexPrefix)}/`);

  if (inPlace) {
    Deno.writeTextFileSync(path, result.content);
    console.log(`written:     ${path}`);
  }
}

export { grind, OCTANT_HEX, parsePrimaryOctant, targetFolder };
