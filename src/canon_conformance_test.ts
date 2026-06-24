import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { sha256Hex as trinityHash } from "./x4010_hash.ts";
import { sha256Hex as capabilityHash } from "./x0013_capability.ts";
import { sha256Hex as mycHash } from "../myc/src/x0100_myc.ts";

// The minimal-essence map (x3300_955201) names ONE content-hash primitive. The
// substrate's own laws (coordinate-gravity forbids a low bucket importing a high
// one; submodule isolation walls off myc/liquid/omega) make a single PHYSICAL
// implementation impossible — so the hash is reimplemented across organs and
// substrates. fixtures/canon-vectors.json is the declared cross-substrate ORACLE:
// "Each substrate's hash impl MUST reproduce these vectors byte-exact." Until now
// only trinity's fqdn_resolver_test checked it. This makes the oracle binding on
// every sha256 implementation we can reach — turning "one hash primitive" from a
// claim into an enforced invariant. A drift (e.g. the double-escape corruption
// that once broke the PWA's commitments) reds here, not in code review.

const vectors: { vectors: { name: string; input: string; sha256: string }[] } =
  JSON.parse(
    await Deno.readTextFile(
      new URL("../fixtures/canon-vectors.json", import.meta.url),
    ),
  );

// Every sha256 wrapper that is the SAME primitive (crypto SHA-256 of UTF-8 bytes).
// NOT omega's FNV-1a — that is a different primitive (integer-deterministic identity,
// part of the determinism axis), deliberately not crypto, and correctly excluded.
const IMPLS: [string, (s: string) => Promise<string>][] = [
  ["trinity/x4010_hash", trinityHash],
  ["trinity/x0013_capability", capabilityHash],
  ["myc/x0100_myc", mycHash],
];

for (const [name, hash] of IMPLS) {
  Deno.test(`canon conformance — ${name} reproduces every golden vector`, async () => {
    for (const v of vectors.vectors) {
      assertEquals(
        await hash(v.input),
        v.sha256,
        `${name} drifts from the canonical oracle on vector "${v.name}"`,
      );
    }
  });
}
