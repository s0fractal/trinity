// src/daemon_test.ts — the daemon's safety-critical law gate, which authorizes
// (or refuses) autonomous `--act`. PURE classification of a
// SubstrateCourtLiveVerdict into verified|drift|insufficient|invalid|unavailable;
// the live orchestration is integration-exercised by `t daemon tick --act`.
// Gated by `deno task test:unit` so the autonomy guard cannot silently regress.
// Codex R1: mutation requires VERIFIED evidence, never merely absence of drift.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { interpretCourtVerdict, lawPermitsMutation } from "./x7F00_daemon.ts";

function verdict(
  court: unknown,
  law_bridge?: unknown,
  witnesses: string[] = [],
) {
  return { witnesses, law_bridge, court };
}

Deno.test("law gate - two agreeing witnesses, no drift → verified → mutation allowed", () => {
  const w = interpretCourtVerdict(verdict(
    { law_agreement: true, law_witness_count: 2, conflicts: [] },
    { consistent: true },
    ["trinity", "omega", "liquid", "myc"],
  ));
  assertEquals(w.state, "verified");
  assertEquals(lawPermitsMutation(w), true);
});

Deno.test("law gate - law_hash_drift → drift → refused", () => {
  const w = interpretCourtVerdict(verdict({
    law_agreement: false,
    law_witness_count: 2,
    conflicts: [{ kind: "law_hash_drift", between: ["omega", "liquid"] }],
  }));
  assertEquals(w.state, "drift");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - bridge inconsistent → drift → refused", () => {
  const w = interpretCourtVerdict(verdict(
    { law_witness_count: 2, conflicts: [] },
    { consistent: false },
  ));
  assertEquals(w.state, "drift");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - one declared witness (< min 2) → insufficient → refused", () => {
  const w = interpretCourtVerdict(verdict(
    { law_agreement: null, law_witness_count: 1, conflicts: [] },
    { consistent: null },
  ));
  assertEquals(w.state, "insufficient");
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - court unavailable (no output) → unavailable → refused (fail-CLOSED)", () => {
  const w = interpretCourtVerdict(undefined);
  assertEquals(w.state, "unavailable");
  assertEquals(w.ran, false);
  assertEquals(lawPermitsMutation(w), false);
});

Deno.test("law gate - malformed verdict / court:null → invalid → refused", () => {
  assertEquals(interpretCourtVerdict("garbage").state, "invalid");
  assertEquals(interpretCourtVerdict(null).state, "invalid");
  assertEquals(
    interpretCourtVerdict(verdict(null, { consistent: true })).state,
    "invalid",
  );
  assertEquals(lawPermitsMutation(interpretCourtVerdict("garbage")), false);
});

Deno.test("law gate - body divergence alone (law agrees) → verified (only LAW gates)", () => {
  const w = interpretCourtVerdict(verdict(
    {
      law_agreement: true,
      law_witness_count: 2,
      conflicts: [{
        kind: "body_hash_divergence",
        between: ["trinity", "omega"],
      }],
    },
    { consistent: true },
  ));
  assertEquals(w.state, "verified");
  assertEquals(w.drift, false);
  assertEquals(lawPermitsMutation(w), true);
});

// --- daemon write-set admission (codex R4 / Phase D) ---

import {
  driftedPathOf,
  generatorOutputOverlaps,
  pathsOutsideWriteSet,
  STABLE_GENERATORS,
  untrackedDriftPaths,
} from "./x7F00_daemon.ts";

Deno.test("driftedPathOf - parses trimmed git status --short lines", () => {
  assertEquals(
    driftedPathOf("M src/x2B88_decisions.myc.md"),
    "src/x2B88_decisions.myc.md",
  );
  assertEquals(driftedPathOf("?? src/new.ts"), "src/new.ts");
  assertEquals(driftedPathOf("R old.ts -> new.ts"), "new.ts");
});

Deno.test("pathsOutsideWriteSet - admits projections/fixtures/log, rejects foreign", () => {
  const ws = {
    exact: new Set([
      "src/x2B88_decisions.myc.md",
      "src/x7F01_daemon_invocations.ndjson",
    ]),
    prefixes: ["fixtures/phi/"],
  };
  // all admitted
  assertEquals(
    pathsOutsideWriteSet([
      "src/x2B88_decisions.myc.md",
      "fixtures/phi/intent.json",
      "src/x7F01_daemon_invocations.ndjson",
    ], ws),
    [],
  );
  // a foreign path is rejected
  assertEquals(
    pathsOutsideWriteSet([
      "src/x2B88_decisions.myc.md",
      "src/x0100_dispatch.ts",
    ], ws),
    ["src/x0100_dispatch.ts"],
  );
});

Deno.test("pathsOutsideWriteSet - default write-set covers the daemon's own outputs", () => {
  assertEquals(
    pathsOutsideWriteSet([
      "src/x2B88_decisions.myc.md",
      "src/x88F0_agents_bootstrap.myc.md",
      "src/x8F88_external_surfaces.myc.md",
    ]),
    [],
  );
});

Deno.test("pathsOutsideWriteSet - admits the F5-missing memory/roadmap/probes outputs", () => {
  // The F5 bug: regen produced these but the write-set omitted them, so a
  // legitimate regen tripped a write_set_violation. Now derived from the
  // registry, they are admitted.
  assertEquals(
    pathsOutsideWriteSet([
      "src/x2888_voices_state.myc.md",
      "src/x8888_claude_memory.myc.md",
      "src/x8888_s0fractal_memory.myc.md",
      "src/x8D00_roadmap.myc.md",
      "src/x8D00_codex_roadmap.myc.md",
      "src/x8E00_probes.myc.md",
    ]),
    [],
  );
});

Deno.test("STABLE_GENERATORS - no overlapping output ownership (codex Phase F)", () => {
  assertEquals(generatorOutputOverlaps(), []);
});

Deno.test("STABLE_GENERATORS - every generator output is in the daemon write-set", () => {
  // The action list (regen) and the permitted-output list cannot drift: every
  // declared generator output must be admissible.
  const all = STABLE_GENERATORS.flatMap((g) => g.outputs);
  assertEquals(pathsOutsideWriteSet(all), []);
});

Deno.test("untrackedDriftPaths - selects only `??` lines (codex criterion 11)", () => {
  assertEquals(
    untrackedDriftPaths([
      "M src/x2B88_decisions.myc.md",
      "?? src/foreign.ts",
      "?? newdir/leaked.json",
      "R old.ts -> new.ts",
    ]),
    ["src/foreign.ts", "newdir/leaked.json"],
  );
  // tracked-only drift ⇒ nothing to remove on rollback
  assertEquals(
    untrackedDriftPaths([
      "M src/x2B88_decisions.myc.md",
      " M src/x8F88.myc.md",
    ]),
    [],
  );
});

// --- routing logic (codex 1D keyword baseline; dormant in single-voice phase
// but the daemon's voice-selection intelligence — pure, untested until now) ---
import {
  axisFromOct,
  type ChordFm,
  route1D,
  scoreVoice,
  type VoiceProfile,
} from "./x7F00_daemon.ts";

const voice = (over: Partial<VoiceProfile> = {}): VoiceProfile => ({
  identity: "claude",
  top_primary_oct: "oct:2",
  top_topic: "resolver",
  // bytes: only axis 2 (0x6C=108) exceeds the 0x40 comfort threshold
  comfort_field_synthetic: "26 26 6C 26 26 26 26 26",
  ...over,
});

Deno.test("axisFromOct - extracts a 0..7 axis from oct:N or N, else null", () => {
  assertEquals(axisFromOct("oct:3"), 3);
  assertEquals(axisFromOct("5"), 5);
  assertEquals(axisFromOct("oct:0"), 0);
  assertEquals(axisFromOct("oct:8"), null); // out of 0..7
  assertEquals(axisFromOct("frontier"), null);
});

Deno.test("scoreVoice - topic +3, primary-oct +2, comfort-axis +1 (composable)", () => {
  // topic only: oct mismatch, comfort axis 0 below threshold
  assertEquals(
    scoreVoice({ topic: "resolver", oct: "oct:0" } as ChordFm, voice()),
    3,
  );
  // primary-oct match only (no topic; axis 7 below threshold)
  assertEquals(
    scoreVoice({ oct: "oct:2" } as ChordFm, voice({ top_topic: "unknown" })),
    2 + 1, // oct:2 matches top_primary_oct (+2) AND axis 2 is a comfort hit (+1)
  );
  // comfort-axis only: oct:2 hits the high byte, but primary mismatch + no topic
  assertEquals(
    scoreVoice(
      { oct: "oct:2" } as ChordFm,
      voice({ top_primary_oct: "oct:7", top_topic: "unknown" }),
    ),
    1,
  );
  // all three stack
  assertEquals(
    scoreVoice({ topic: "resolver", oct: "oct:2" } as ChordFm, voice()),
    3 + 2 + 1,
  );
});

Deno.test("scoreVoice - reads primary oct from chord.chord object form", () => {
  assertEquals(
    scoreVoice(
      { chord: { primary: "oct:2" } } as ChordFm,
      voice({ top_topic: "unknown" }),
    ),
    2 + 1, // oct:2 → primary match + comfort axis
  );
});

Deno.test("route1D - picks the highest-scoring voice; first wins ties; empty → null", () => {
  const a = voice({ identity: "claude", top_topic: "resolver" }); // will score high
  const b = voice({
    identity: "codex",
    top_topic: "unknown",
    top_primary_oct: "oct:7",
  });
  const chord = { topic: "resolver", oct: "oct:2" } as ChordFm;
  assertEquals(route1D(chord, [a, b])?.voice, "claude");
  // tie → first listed wins (strict >, so order-stable)
  const t1 = voice({
    identity: "v1",
    top_topic: "unknown",
    top_primary_oct: "oct:7",
  });
  const t2 = voice({
    identity: "v2",
    top_topic: "unknown",
    top_primary_oct: "oct:7",
  });
  assertEquals(route1D({ oct: "oct:0" } as ChordFm, [t1, t2])?.voice, "v1");
  assertEquals(route1D(chord, []), null);
});
