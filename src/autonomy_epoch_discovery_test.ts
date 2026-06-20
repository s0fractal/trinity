import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type LifecycleFacts,
  parseLifecycleFacts,
  type RatifiedEpoch,
  selectRatifiedEpoch,
} from "./x5C70_autonomy_attenuation.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Epoch-neutral discovery (codex x5000_954550 P2). The executor no longer hardcodes
// which epoch is live; `selectRatifiedEpoch` picks the highest applicable FINAL epoch
// from a data registry against live lifecycle facts — deterministically, fail-closed,
// rejecting ambiguity. Each fixture isolates one denial path.

const E1: RatifiedEpoch = {
  ceiling_id: "epoch-1",
  mandate_path: "contracts/mandates/epoch-1.mandate.json",
  mandate_body_commitment: "sha256:body1",
  constitution_commitment: "sha256:c0",
  mandate_finality_key: "mk1",
  attenuation_finality_key: "ak1",
  valid_from_height: 954455,
  valid_until_height: 958775,
  legacy: true,
};
const E2: RatifiedEpoch = {
  ceiling_id: "epoch-2",
  mandate_path: "contracts/mandates/epoch-2.mandate.json",
  mandate_body_commitment: "sha256:body2",
  constitution_commitment: "sha256:c0",
  mandate_finality_key: "mk2",
  attenuation_finality_key: "ak2",
  valid_from_height: 958775,
  valid_until_height: 962000,
  ceiling_commitment: "sha256:ceiling2", // strengthened exact-parent binding
};

const facts = (over: Partial<LifecycleFacts> = {}): LifecycleFacts => ({
  implemented: ["mk1", "ak1"],
  revoked: [],
  forked: false,
  ...over,
});

Deno.test("discovery — GOLDEN: the live final epoch is selected", () => {
  const s = selectRatifiedEpoch([E1], facts(), 954500);
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-1");
});

Deno.test("discovery — empty registry is no_candidates", () => {
  assertEquals(
    selectRatifiedEpoch([], facts(), 954500).reason_code,
    "no_candidates",
  );
});

Deno.test("discovery — an epoch whose finalities are not implemented is none_final", () => {
  assertEquals(
    selectRatifiedEpoch([E1], facts({ implemented: ["mk1"] }), 954500)
      .reason_code,
    "none_final",
  );
});

Deno.test("discovery — an anchor outside every window is none_active", () => {
  assertEquals(
    selectRatifiedEpoch([E1], facts(), 999999).reason_code,
    "none_active",
  );
});

Deno.test("discovery — a revoked finality key denies (none_final)", () => {
  assertEquals(
    selectRatifiedEpoch([E1], facts({ revoked: ["mk1"] }), 954500).reason_code,
    "none_final",
  );
  // revoking the ceiling id itself also denies
  assertEquals(
    selectRatifiedEpoch([E1], facts({ revoked: ["epoch-1"] }), 954500)
      .reason_code,
    "none_final",
  );
});

Deno.test("discovery — a forked lifecycle denies everything", () => {
  assertEquals(
    selectRatifiedEpoch([E1], facts({ forked: true }), 954500).reason_code,
    "forked",
  );
});

Deno.test("discovery — a non-legacy epoch missing its exact-parent commitment denies", () => {
  const e2NoBinding = { ...E2, ceiling_commitment: undefined };
  assertEquals(
    selectRatifiedEpoch(
      [e2NoBinding],
      facts({ implemented: ["mk2", "ak2"] }),
      959000,
    )
      .reason_code,
    "binding_absent",
  );
});

Deno.test("discovery — the HIGHEST applicable final epoch wins over a lower one", () => {
  // both final and active at an overlapping height; epoch-2 has the higher valid_from.
  const overlap: RatifiedEpoch = { ...E2, valid_from_height: 954600 };
  const s = selectRatifiedEpoch(
    [E1, overlap],
    facts({ implemented: ["mk1", "ak1", "mk2", "ak2"] }),
    954700,
  );
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-2");
});

Deno.test("discovery — RED TEAM: two equally-applicable epochs are AMBIGUOUS, never ordered", () => {
  const twin: RatifiedEpoch = {
    ...E2,
    ceiling_id: "epoch-1b",
    valid_from_height: 954455, // identical to E1 — a genuine tie
  };
  const s = selectRatifiedEpoch(
    [E1, twin],
    facts({ implemented: ["mk1", "ak1", "mk2", "ak2"] }),
    954500,
  );
  assertEquals(s.reason_code, "ambiguous");
  assertEquals(s.epoch, null);
});

Deno.test("discovery — selection does not depend on registry order", () => {
  const f = facts({ implemented: ["mk1", "ak1", "mk2", "ak2"] });
  const a = selectRatifiedEpoch(
    [E1, { ...E2, valid_from_height: 954600 }],
    f,
    954700,
  );
  const b = selectRatifiedEpoch(
    [{ ...E2, valid_from_height: 954600 }, E1],
    f,
    954700,
  );
  assertEquals(a.epoch?.ceiling_id, b.epoch?.ceiling_id);
  assertEquals(a.epoch?.ceiling_id, "epoch-2");
});

Deno.test("discovery — parseLifecycleFacts extracts implemented and revoked keys", () => {
  const f = parseLifecycleFacts({
    mutations: [
      { key: "a", state: "implemented" },
      { key: "b", state: "proposed" },
      { key: "c", state: "revoked" },
      { key: "d", state: "superseded" },
    ],
  });
  assertEquals(f.implemented, ["a"]);
  assertEquals(new Set(f.revoked), new Set(["c", "d"]));
  assertEquals(f.forked, false);
});

// ── integration: the real registry resolves epoch-1 against the real lifecycle ──

Deno.test("discovery — INTEGRATION: the shipped registry resolves epoch-1 live", async () => {
  const reg = JSON.parse(
    await Deno.readTextFile("contracts/mandates/epochs.registry.json"),
  );
  const epochs = reg.epochs as RatifiedEpoch[];
  assert(epochs.length >= 1);
  const e1 = epochs.find((e) => e.ceiling_id === "epoch-1")!;
  assert(e1.legacy === true, "epoch-1 must be grandfathered legacy");

  // the live lifecycle must mark both of epoch-1's finalities implemented.
  const life = JSON.parse(
    await new Deno.Command("./t", { args: ["myc", "lifecycle"] }).output().then(
      (o) => new TextDecoder().decode(o.stdout),
    ),
  );
  const f = parseLifecycleFacts(life);
  const s = selectRatifiedEpoch(epochs, f, e1.valid_from_height);
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-1");
});
