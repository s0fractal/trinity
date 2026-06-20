import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  EPOCH1_PINNED_ENTRY_COMMITMENT,
  EPOCH_REGISTRY_SCHEMA,
  type EpochBindingFact,
  epochEntryCommitment,
  type EpochRegistryDoc,
  type LifecycleFacts,
  parseLifecycleFacts,
  type RatifiedEpoch,
  selectRatifiedEpoch,
} from "./x5C70_autonomy_attenuation.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Epoch-neutral discovery, repaired after codex's NAY x6900_954557 (finality-key
// reuse / authority laundering). A non-legacy row is authorized ONLY by a
// quorum-final proposal whose body STRUCTURALLY commits to the row's exact
// canonical commitment; epoch-1 runs via a single immutable code pin. Each fixture
// isolates one path; codex's acceptance tests are covered explicitly.

const hex = (c: string) => c.repeat(64);
const sha = (c: string) => "sha256:" + c.repeat(64);

// the real, code-pinned epoch-1 row.
const REG: EpochRegistryDoc = JSON.parse(
  await Deno.readTextFile("contracts/mandates/epochs.registry.json"),
);
const E1 = REG.epochs.find((e) => e.ceiling_id === "epoch-1")!;

// a synthetic, well-formed non-legacy epoch-2 row.
const E2_BASE: RatifiedEpoch = {
  ceiling_id: "epoch-2",
  mandate_path: "contracts/mandates/epoch-2.mandate.json",
  mandate_body_commitment: sha("b"),
  constitution_commitment: sha("c"),
  mandate_finality_key: hex("2"),
  attenuation_finality_key: hex("3"),
  valid_from_height: 958775,
  valid_until_height: 962000,
  ceiling_commitment: sha("e"),
  registry_finality_key: hex("4"),
  registry_entry_commitment: "sha256:" + "0".repeat(64), // fixed below
};
// bind registry_entry_commitment to the row's own canonical commitment.
const E2: RatifiedEpoch = {
  ...E2_BASE,
  registry_entry_commitment: await epochEntryCommitment(E2_BASE),
};
const E2_COMMIT = E2.registry_entry_commitment!;

const doc = (epochs: RatifiedEpoch[]): EpochRegistryDoc => ({
  schema: EPOCH_REGISTRY_SCHEMA,
  epochs,
});
const facts = (over: Partial<LifecycleFacts> = {}): LifecycleFacts => ({
  ok: true,
  implemented: [
    E1.mandate_finality_key,
    E1.attenuation_finality_key,
    E2.mandate_finality_key,
    E2.attenuation_finality_key,
    E2.registry_finality_key!,
  ],
  revoked: [],
  forked: false,
  ...over,
});
// a binding fact that PROVES E2 (proposal body commits to E2's exact row).
const goodBinding: Record<string, EpochBindingFact> = {
  [E2.registry_finality_key!]: {
    body_commitment_ok: true,
    epoch_registry_entry_commitment: E2_COMMIT,
  },
};

// ── epoch-1 (legacy, code-pinned) ─────────────────────────────────────────────

Deno.test("discovery — GOLDEN: the code-pinned epoch-1 row is authorized + selected", async () => {
  const s = await selectRatifiedEpoch(
    doc([E1]),
    facts(),
    {},
    E1.valid_from_height,
  );
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-1");
});

Deno.test("discovery — the shipped epoch-1 row matches the immutable code pin", async () => {
  assertEquals(await epochEntryCommitment(E1), EPOCH1_PINNED_ENTRY_COMMITMENT);
  assertEquals(E1.legacy, true);
});

Deno.test("discovery — RED TEAM #4 (codex): legacy:true on any non-pinned row is denied", async () => {
  // flip any field on the legacy row → no longer matches the pin.
  const forgedLegacy = { ...E1, valid_until_height: 999999 };
  const s = await selectRatifiedEpoch(doc([forgedLegacy]), facts(), {}, 954500);
  assertEquals(s.reason_code, "legacy_not_pinned");
  // a non-epoch-1 ceiling claiming legacy is also denied.
  const fakeLegacy = { ...E2, legacy: true };
  const s2 = await selectRatifiedEpoch(doc([fakeLegacy]), facts(), {}, 959000);
  assertEquals(s2.reason_code, "legacy_not_pinned");
});

// ── the core exploit codex found ──────────────────────────────────────────────

Deno.test("discovery — RED TEAM (codex exploit): a forged row reusing epoch-1 keys is denied", async () => {
  // attacker reuses epoch-1's REAL implemented finality keys, sets any non-empty
  // ceiling_commitment, and points registry_finality_key at a real implemented key.
  const evilBase: RatifiedEpoch = {
    ceiling_id: "epoch-evil",
    mandate_path: "contracts/mandates/evil.json",
    mandate_body_commitment: sha("d"),
    constitution_commitment: E1.constitution_commitment,
    mandate_finality_key: E1.mandate_finality_key,
    attenuation_finality_key: E1.attenuation_finality_key,
    valid_from_height: 954600,
    valid_until_height: 958775,
    ceiling_commitment: sha("e"),
    registry_finality_key: E1.mandate_finality_key, // reuse a real implemented key
  };
  const evil = {
    ...evilBase,
    registry_entry_commitment: await epochEntryCommitment(evilBase),
  };
  // the binding loader reads epoch-1's mandate proposal: real, but its body carries
  // NO epoch_registry_entry_commitment → null.
  const reusedBinding: Record<string, EpochBindingFact> = {
    [E1.mandate_finality_key]: {
      body_commitment_ok: true,
      epoch_registry_entry_commitment: null,
    },
  };
  const s = await selectRatifiedEpoch(
    doc([evil]),
    facts({
      implemented: [E1.mandate_finality_key, E1.attenuation_finality_key],
    }),
    reusedBinding,
    954700,
  );
  assert(!s.epoch, "forged row must not be selected");
  assertEquals(s.reason_code, "binding_unproven");
});

// ── codex acceptance: binding semantics ───────────────────────────────────────

Deno.test("discovery — a non-legacy row WITH a structurally-committing binding is authorized", async () => {
  const s = await selectRatifiedEpoch(doc([E2]), facts(), goodBinding, 959000);
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-2");
});

Deno.test("discovery — RED TEAM: a binding key not structurally committing to the row is denied", async () => {
  const wrong: Record<string, EpochBindingFact> = {
    [E2.registry_finality_key!]: {
      body_commitment_ok: true,
      epoch_registry_entry_commitment: sha("9"), // commits to some OTHER row
    },
  };
  const s = await selectRatifiedEpoch(doc([E2]), facts(), wrong, 959000);
  assertEquals(s.reason_code, "binding_unproven");
});

Deno.test("discovery — RED TEAM #3 (codex): flipping a row field after quorum invalidates its binding", async () => {
  // the binding still commits to the ORIGINAL row; flip the window on the row.
  const flipped = { ...E2, valid_until_height: 999999 };
  const s = await selectRatifiedEpoch(
    doc([flipped]),
    facts(),
    goodBinding,
    959000,
  );
  assertEquals(s.reason_code, "binding_unproven");
});

Deno.test("discovery — RED TEAM: an unauthentic binding proposal (bad commitment) is denied", async () => {
  const bad: Record<string, EpochBindingFact> = {
    [E2.registry_finality_key!]: {
      body_commitment_ok: false,
      epoch_registry_entry_commitment: E2_COMMIT,
    },
  };
  assertEquals(
    (await selectRatifiedEpoch(doc([E2]), facts(), bad, 959000)).reason_code,
    "binding_unproven",
  );
});

Deno.test("discovery — RED TEAM: a binding proposal that is not final is denied", async () => {
  const noFinal = facts({
    implemented: [E2.mandate_finality_key, E2.attenuation_finality_key], // no registry key
  });
  assertEquals(
    (await selectRatifiedEpoch(doc([E2]), noFinal, goodBinding, 959000))
      .reason_code,
    "binding_unproven",
  );
});

Deno.test("discovery — RED TEAM: a non-legacy row missing its binding fields is binding_absent", async () => {
  const naked = {
    ...E2,
    registry_finality_key: undefined,
    registry_entry_commitment: undefined,
  };
  assertEquals(
    (await selectRatifiedEpoch(doc([naked]), facts(), {}, 959000)).reason_code,
    "binding_absent",
  );
});

// ── codex acceptance: hostile input (order-independent) ───────────────────────

Deno.test("discovery — RED TEAM #6 (codex): duplicate ids / bindings / malformed windows deny", async () => {
  assertEquals(
    (await selectRatifiedEpoch(doc([E1, { ...E1 }]), facts(), {}, 954500))
      .reason_code,
    "duplicate_id",
  );
  const a = { ...E2, ceiling_id: "epoch-2a" };
  const b = { ...E2, ceiling_id: "epoch-2b" }; // same registry_finality_key
  assertEquals(
    (await selectRatifiedEpoch(doc([a, b]), facts(), goodBinding, 959000))
      .reason_code,
    "duplicate_binding",
  );
  const reversed = {
    ...E2,
    valid_from_height: 962000,
    valid_until_height: 958775,
  };
  assertEquals(
    (await selectRatifiedEpoch(doc([reversed]), facts(), goodBinding, 959000))
      .reason_code,
    "malformed_registry",
  );
});

Deno.test("discovery — RED TEAM: unknown registry schema / malformed lifecycle deny", async () => {
  assertEquals(
    (await selectRatifiedEpoch(
      { schema: "bogus", epochs: [E1] },
      facts(),
      {},
      954500,
    ))
      .reason_code,
    "registry_schema_mismatch",
  );
  assertEquals(
    (await selectRatifiedEpoch(
      doc([E1]),
      { ...facts(), ok: false },
      {},
      954500,
    ))
      .reason_code,
    "lifecycle_unavailable",
  );
  assertEquals(
    (await selectRatifiedEpoch(doc([E1]), facts({ forked: true }), {}, 954500))
      .reason_code,
    "forked",
  );
});

// ── selection determinism ─────────────────────────────────────────────────────

Deno.test("discovery — the HIGHEST applicable final epoch wins, order-independent", async () => {
  const lowE2 = {
    ...E2_BASE,
    valid_from_height: 954600,
    valid_until_height: 962000,
  };
  const lowE2c = {
    ...lowE2,
    registry_entry_commitment: await epochEntryCommitment(lowE2),
  };
  const binding: Record<string, EpochBindingFact> = {
    [lowE2c.registry_finality_key!]: {
      body_commitment_ok: true,
      epoch_registry_entry_commitment: lowE2c.registry_entry_commitment!,
    },
  };
  const f = facts();
  const a = await selectRatifiedEpoch(doc([E1, lowE2c]), f, binding, 954700);
  const b = await selectRatifiedEpoch(doc([lowE2c, E1]), f, binding, 954700);
  assertEquals(a.epoch?.ceiling_id, "epoch-2");
  assertEquals(b.epoch?.ceiling_id, "epoch-2");
});

Deno.test("discovery — RED TEAM: two equally-applicable epochs are AMBIGUOUS, not ordered", async () => {
  const twinBase = {
    ...E2_BASE,
    ceiling_id: "epoch-1b",
    valid_from_height: E1.valid_from_height,
    valid_until_height: E1.valid_until_height,
    registry_finality_key: hex("7"),
  };
  const twin = {
    ...twinBase,
    registry_entry_commitment: await epochEntryCommitment(twinBase),
  };
  const binding: Record<string, EpochBindingFact> = {
    [twin.registry_finality_key!]: {
      body_commitment_ok: true,
      epoch_registry_entry_commitment: twin.registry_entry_commitment!,
    },
  };
  const s = await selectRatifiedEpoch(
    doc([E1, twin]),
    facts({ implemented: [...facts().implemented, hex("7")] }),
    binding,
    954500,
  );
  assertEquals(s.reason_code, "ambiguous");
});

Deno.test("discovery — parseLifecycleFacts: malformed shape ⇒ ok:false; well-formed ⇒ keys", () => {
  assertEquals(parseLifecycleFacts({} as Record<string, unknown>).ok, false);
  const f = parseLifecycleFacts({
    mutations: [
      { key: "a", state: "implemented" },
      { key: "c", state: "revoked" },
    ],
  });
  assertEquals(f.ok, true);
  assertEquals(f.implemented, ["a"]);
  assertEquals(f.revoked, ["c"]);
});

// ── live integration ──────────────────────────────────────────────────────────

Deno.test("discovery — INTEGRATION: the shipped registry resolves epoch-1 live", async () => {
  const life = JSON.parse(
    await new Deno.Command("./t", { args: ["myc", "lifecycle"] }).output().then(
      (o) => new TextDecoder().decode(o.stdout),
    ),
  );
  const f = parseLifecycleFacts(life);
  const s = await selectRatifiedEpoch(REG, f, {}, E1.valid_from_height);
  assertEquals(s.reason_code, "selected");
  assertEquals(s.epoch?.ceiling_id, "epoch-1");
});
