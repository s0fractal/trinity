// Portable smoke test. The kernel is pure standard JS (no platform APIs), so it
// must behave identically in every runtime. CI runs this exact file in Deno, Node
// (via tsx), and Bun; if a future change drags a platform API into the core, the
// Node/Bun jobs go red. Run it yourself:
//   deno run examples/portability_check.ts
//   npx tsx examples/portability_check.ts
//   bun run examples/portability_check.ts
import { admit, classifyIntent } from "../mod.ts";

let failures = 0;
function check(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(
      `  ✗ ${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`,
    );
  }
}

check(
  "read → A0",
  classifyIntent({ verb: "r", target: "t", effects: ["read"] }).cls,
  "A0",
);
check(
  "source_change → A2",
  classifyIntent({ verb: "w", target: "t", effects: ["source_change"] }).cls,
  "A2",
);
check(
  "deploy → A4",
  classifyIntent({ verb: "d", target: "t", effects: ["deploy"] }).cls,
  "A4",
);
check(
  "unknown → A4 (fail-closed)",
  classifyIntent({ verb: "x", target: "t", effects: ["wormhole"] }).cls,
  "A4",
);
check(
  "admit deny-by-default",
  admit({ verb: "r", target: "t", effects: ["read"] }, null, {
    kind: "bitcoin_block",
    height: 1,
  }).admitted,
  false,
);

// Identify the runtime without assuming any of them exists.
const g = globalThis as { Deno?: unknown; Bun?: unknown };
const runtime = g.Deno ? "Deno" : g.Bun ? "Bun" : "Node";

if (failures > 0) {
  throw new Error(`${runtime}: ${failures} portability check(s) FAILED`);
}
console.log(`\n${runtime}: the kernel is portable ✓`);
