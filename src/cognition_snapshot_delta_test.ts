import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { FileProfile } from "./x0020_scanner_core.ts";
import { buildCognitionSnapshot } from "./x2400_cognition_snapshot.ts";
import { compareCognitionSnapshots } from "./x2600_cognition_delta.ts";

const profile = (phase: FileProfile["thoughtPhase"]): FileProfile => ({
  path: "x.myc.md",
  repo: "trinity",
  isEntrypoint: false,
  L1_fqdn: true,
  L2_parseable: true,
  L3_schema_valid: false,
  L4a_hash_claimed: false,
  L4b_hash_verified: false,
  L5_graph_linked: false,
  L6_recipe: false,
  L7_receipt_backed: false,
  L8_published: false,
  thoughtPhase: phase,
});

Deno.test("cognition snapshot identity is deterministic and content-bound", async () => {
  const a = await buildCognitionSnapshot([profile("hypothesis")]);
  const b = await buildCognitionSnapshot([profile("hypothesis")]);
  const changed = await buildCognitionSnapshot([profile("receipt")]);
  assertEquals(a, b);
  assertNotEquals(a.snapshot_id, changed.snapshot_id);
  assertEquals(a.scan_scope.actuation_eligible, false);
});

Deno.test("cognition delta refuses classifier/scope mismatch", async () => {
  const a = await buildCognitionSnapshot([profile("hypothesis")]);
  const b = await buildCognitionSnapshot([profile("receipt")]);
  const delta = compareCognitionSnapshots(a, b);
  assertEquals(delta.comparable, true);
  assertEquals(delta.phase_delta.receipt, 1);
  assertEquals(delta.phase_delta.hypothesis, -1);
  assertEquals(delta.actuation_eligible, false);

  const incompatible = structuredClone(b);
  incompatible.comparable_key = "sha256:different-classifier";
  const denied = compareCognitionSnapshots(a, incompatible);
  assertEquals(denied.comparable, false);
  assertEquals(denied.phase_delta, {});
});
