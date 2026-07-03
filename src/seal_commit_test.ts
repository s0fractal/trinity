import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { generateWitness } from "@s0fractal/witness";
import { sealCommit, verifyCommitSeal } from "./x7200_seal_commit.ts";

// Dogfood proof: a commit sealed under a key verifies locally against that key's
// public half, is bound to the exact commit, and any tamper (wrong commit, wrong
// key) fails — no host, ephemeral keys only.
Deno.test("seal-commit — a sealed commit verifies, and tamper is caught", async () => {
  const seat = await generateWitness();
  const sha = "a".repeat(40);
  const sealed = await sealCommit(sha, seat, 956420);

  const good = await verifyCommitSeal(sealed, sha, [seat.publicKey]);
  assert(
    good.ok && good.receiptIntact && good.boundToCommit,
    "a real seal verifies",
  );

  // wrong commit → not bound
  const wrongCommit = await verifyCommitSeal(sealed, "b".repeat(40), [
    seat.publicKey,
  ]);
  assert(
    !wrongCommit.ok && !wrongCommit.boundToCommit,
    "a seal for another commit is rejected",
  );

  // wrong key → quorum fails
  const other = await generateWitness();
  const wrongKey = await verifyCommitSeal(sealed, sha, [other.publicKey]);
  assert(!wrongKey.ok, "a seal not signed by the claimed key is rejected");
});
