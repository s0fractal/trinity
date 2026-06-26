import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { build, liveClaimWarnings } from "./x8760_forge.ts";

Deno.test("forge — the three primitives derive live status from real evidence, no warnings", () => {
  const r = build();
  assertEquals(r.primitives.length, 3);
  for (const p of r.primitives) {
    assertEquals(p.published_claim, "live", `${p.name} should be live`);
    assert(
      p.publish_evidence.length > 0,
      `${p.name} is live without publish evidence`,
    );
    assert(p.package_version, `${p.name} has no resolvable version`);
  }
  assertEquals(r.ok, true);
  assertEquals(r.warnings, []);
  // P5: federation availability is reported, never silently claimed green.
  assert(["available", "unavailable"].includes(r.federation_status));
  assertEquals(r.federation_gate, "deno task check:federation");
});

Deno.test("forge — a live claim WITHOUT publish evidence warns (codex acceptance)", () => {
  assertEquals(
    liveClaimWarnings({
      name: "ghost",
      published_claim: "live",
      publish_evidence: [],
      package_version: "1.0.0",
    }),
    ['ghost: claims "live" with NO publish evidence'],
  );
  // live WITH evidence → no warning
  assertEquals(
    liveClaimWarnings({
      name: "ok",
      published_claim: "live",
      publish_evidence: [".github/workflows/x.yml"],
      package_version: "1.0.0",
    }),
    [],
  );
  // an unresolved version always warns
  assertEquals(
    liveClaimWarnings({
      name: "nover",
      published_claim: "candidate",
      publish_evidence: [],
      package_version: null,
    }).length,
    1,
  );
});

Deno.test("forge — kuramoto degrades honestly (parity green only with omega present, else skipped)", () => {
  const r = build();
  const k = r.primitives.find((p) => p.name === "kuramoto-coherence")!;
  assert(["green", "skipped"].includes(k.last_parity_status));
  // the honest contract: when the omega source cone is absent, it is skipped — never pretended green.
  if (k.last_parity_status === "skipped") {
    assert(k.next_action?.includes("omega"));
  }
});
