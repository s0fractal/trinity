import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classifySecretHit,
  licenseCheck,
  type SecretHit,
  secretsCheck,
  treeReadiness,
  type TreeScan,
} from "./x6700_public_readiness.ts";

Deno.test("public-readiness classifySecretHit — the ledger quoting the scan battery is NOT a secret", () => {
  // the exact lines that made a naive scan flag trinity (3 false positives)
  assertEquals(
    classifySecretHit(
      `git ls-files | xargs grep -lE 'jsrp_|cfut_|ghp_|BEGIN (RSA|OPENSSH)? ?PRIVATE KEY'`,
    ),
    "pattern_quote",
  );
  assertEquals(
    classifySecretHit(
      "Verified by pattern battery (`sk-`, `ghp_`, `jsrp_`, `cfut_`,",
    ),
    "pattern_quote", // ≥2 distinct battery tokens on the line
  );
  // a real, lone token is NOT self-referential — fail closed to review
  assertEquals(
    classifySecretHit("const token = 'ghp_aaaaaaaaaaaaaaaaaaaa'"),
    "review",
  );
  assertEquals(
    classifySecretHit("-----BEGIN OPENSSH PRIVATE KEY-----"),
    "review",
  );
});

Deno.test("public-readiness secretsCheck — pattern-quotes pass, a review hit blocks", () => {
  const quotes: SecretHit[] = [
    {
      file: "src/x2B88_decisions.myc.md",
      line: 3079,
      text: "grep -lE 'jsrp_|cfut_'",
    },
  ];
  assertEquals(secretsCheck(quotes).status, "ready");
  const real: SecretHit[] = [
    { file: "config.ts", line: 4, text: "key = 'ghp_bbbbbbbbbbbbbbbbbbbb'" },
  ];
  assertEquals(secretsCheck(real).status, "block");
});

Deno.test("public-readiness licenseCheck — missing LICENSE blocks a publish-intent tree", () => {
  const mk = (tree: string, licenseFiles: string[]): TreeScan => ({
    tree: tree as TreeScan["tree"],
    secretHits: [],
    licenseFiles,
    localPathFiles: [],
    staleIntentLines: [],
  });
  assertEquals(licenseCheck(mk("trinity", [])).status, "block");
  assertEquals(
    licenseCheck(mk("myc", ["LICENSE", "LICENSE-INTENT.md"])).status,
    "ready",
  );
});

Deno.test("public-readiness treeReadiness — block dominates warn dominates ready", () => {
  const scan: TreeScan = {
    tree: "trinity",
    secretHits: [],
    licenseFiles: [], // → block
    localPathFiles: ["a.ts"], // → warn
    staleIntentLines: [],
  };
  const r = treeReadiness(scan);
  assertEquals(r.verdict, "block");
  // the warn is still surfaced, not swallowed
  assert(r.checks.some((c) => c.name === "local_paths" && c.status === "warn"));

  const clean: TreeScan = {
    tree: "myc",
    secretHits: [],
    licenseFiles: ["LICENSE"],
    localPathFiles: [],
    staleIntentLines: [],
  };
  assertEquals(treeReadiness(clean).verdict, "ready");
});
