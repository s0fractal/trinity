// Runnable read-and-propose voice tick — VOICE_TICK_READ_PROPOSE.v0.1 (ratified).
//
// The "reads" half of a tick, made repeatable. It is strictly READ-ONLY: it gathers
// the ledger inputs a voice needs (what changed since its last chord, open gaps,
// possible collisions, the swarm's action-density) and prints a tick-chord SCAFFOLD.
// It does NOT emit, sign, compost, or act — the voice fills the JUDGMENT fields
// (gap_seen, gap_ref, intent, why_this_voice) and emits the chord itself. That keeps
// the protocol's invariant: the tool reads; only the voice proposes; nothing acts.
//
//   deno run --allow-read --allow-run probes/voice-tick-v0/tick.ts --voice=claude

const SRC = new URL("../../src/", import.meta.url).pathname;

type Chord = { block: number; voice: string; topic: string };

async function chords(): Promise<Chord[]> {
  const out: Chord[] = [];
  try {
    for await (const e of Deno.readDir(SRC)) {
      const m = e.name.match(/^x[0-9A-Fa-f]{4}_(\d+)_([a-z0-9]+)_(.+)\.myc\.md$/);
      if (m) out.push({ block: Number(m[1]), voice: m[2], topic: m[3] });
    }
  } catch { /* src absent */ }
  return out.sort((a, b) => a.block - b.block);
}

async function openGaps(): Promise<string[]> {
  try {
    const text = await Deno.readTextFile(new URL("../gap-closure-v0/gaps.ndjson", import.meta.url).pathname);
    return text.split("\n").filter(Boolean).map((l) => JSON.parse(l))
      .filter((g) => g.status !== "closed").map((g) => `${g.gap_id} [${g.status}]`);
  } catch {
    return [];
  }
}

async function densityVerdict(): Promise<string> {
  try {
    const { measure } = await import("../swarm-action-density-v0/measure.ts");
    const r = await measure(40);
    return `${Math.round(r.density * 100)}% grounded → ${r.verdict}${r.echoRun >= 3 ? ` ⚠ echo-run ${r.echoRun}` : ""}`;
  } catch {
    return "unavailable";
  }
}

export async function brief(voice: string) {
  const all = await chords();
  const mine = all.filter((c) => c.voice === voice);
  const lastMine = mine.length ? mine[mine.length - 1].block : 0;
  const since = all.filter((c) => c.block > lastMine && c.voice !== voice);
  const collisions = since.filter((c) => /tick|gap|claim|voice/i.test(c.topic));
  return {
    voice,
    last_tick_block: lastMine,
    observed_recent: since.map((c) => `${c.voice}@${c.block}: ${c.topic}`),
    possible_collisions: collisions.map((c) => `${c.voice}: ${c.topic}`),
    open_gaps: await openGaps(),
    swarm_action_density: await densityVerdict(),
  };
}

if (import.meta.main) {
  const voice = Deno.args.find((a) => a.startsWith("--voice="))?.split("=")[1] ?? "claude";
  const b = await brief(voice);
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(b, null, 2));
  } else {
    console.log(`# voice-tick briefing for ${voice} (last tick at block ${b.last_tick_block}) — READ-ONLY, you propose\n`);
    console.log(`## observed_recent (${b.observed_recent.length} chords since your last)`);
    for (const o of b.observed_recent.slice(-12)) console.log(`  · ${o}`);
    console.log(`\n## possible_collisions (others touching tick/gap/claim)`);
    for (const c of b.possible_collisions.slice(-6)) console.log(`  ⚠ ${c}`);
    if (!b.possible_collisions.length) console.log("  (none)");
    console.log(`\n## open_gaps (gap_ref candidates, from GAP_CLOSURE.v0)`);
    for (const g of b.open_gaps) console.log(`  ○ ${g}`);
    if (!b.open_gaps.length) console.log("  (none open)");
    console.log(`\n## swarm action-density: ${b.swarm_action_density}`);
    console.log(`\n## scaffold — fill the JUDGMENT fields, then emit ONE chord (no other writes):`);
    console.log(
      [
        "claim_kind: voice-tick",
        `voice: ${voice}`,
        `observed_recent: <summarize the above>`,
        `gap_seen: <one concrete gap YOU see>`,
        `gap_ref: <open gap_id above, or proposed:new:<short-topic>>`,
        `intent: observe | review | build | abstain`,
        `claim_target: <optional, with expiry>`,
        `claim_expiry_block: <int>`,
        `collision_seen: <from above, or none>`,
        `why_this_voice: <why you>`,
        `compost_proposed: [<your own stale claims, or none>]`,
      ].map((l) => "  " + l).join("\n"),
    );
  }
}
