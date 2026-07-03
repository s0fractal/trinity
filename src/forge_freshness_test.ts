import { assertEquals } from "jsr:@std/assert@^1";
import { build } from "./x8760_forge.ts";

// The committed packages/forge-receipt.json is the evidence `./t evidence` reads.
// A package version bump that forgets `t forge --stable` makes that evidence lie —
// it happened this session: agentseal shipped 0.2.0 on jsr while the receipt still
// recorded 0.1.0, and nothing caught it. This pins the receipt's recorded versions
// to the LIVE manifests, so the evidence mirror cannot silently lag the packages
// again. Submodule-independent: it only reads packages/*/deno.json | Cargo.toml.
Deno.test("forge receipt freshness — recorded package_version matches the live manifest", () => {
  const committed = JSON.parse(
    Deno.readTextFileSync("packages/forge-receipt.json"),
  ) as { primitives: { name: string; package_version: string | null }[] };
  const fresh = build();
  const liveByName = new Map(
    fresh.primitives.map((p) => [p.name, p.package_version]),
  );

  for (const c of committed.primitives) {
    assertEquals(
      c.package_version,
      liveByName.get(c.name) ?? null,
      `forge-receipt.json records ${c.name}@${c.package_version} but the live manifest says ${
        liveByName.get(c.name)
      } — run 't forge --stable' and commit the receipt`,
    );
  }
  // A package added/removed from SPECS without regenerating the receipt also lies.
  assertEquals(
    committed.primitives.length,
    fresh.primitives.length,
    "forge-receipt primitive count drifted from the live SPECS — run 't forge --stable'",
  );
});
