#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Falsifier v0 Honesty Check
 *
 * Tests whether voices-routing-falsifier-v0's 1D and 8D channels read
 * the same signal (oct tags) through different aggregators.
 *
 * Reads:
 *   probes/voices-routing-falsifier-v0/result.latest.json
 *
 * Writes:
 *   probes/falsifier-v0-honesty-check-v0/result.latest.json
 *   probes/falsifier-v0-honesty-check-v0/result.latest.md
 *
 * Usage:
 *   cd /Users/s0fractal/trinity
 *   deno run --allow-read --allow-write probes/falsifier-v0-honesty-check-v0/run.ts
 */

interface BaselineResult {
  predicted: string[];
  score: number;
}

interface Sample {
  sourceId: string;
  sourceSpeaker: string;
  targetSpeaker: string;
  sourceTime: number;
  targetTime: number;
  oneD: BaselineResult;
  eightD: BaselineResult;
}

interface FalsifierResult {
  candidateSamples: number;
  totalValidChords: number;
  labeledSamples: number;
  samples: Sample[];
  voices: Record<string, unknown>;
  oneD: {
    top1HitRate: number;
    top2HitRate: number;
    meanReciprocalRank: number;
  };
  eightD: {
    top1HitRate: number;
    top2HitRate: number;
    meanReciprocalRank: number;
  };
  deltaPp: number;
  verdict: string;
}

interface PerSampleAgreement {
  sourceId: string;
  targetSpeaker: string;
  oneDTop1: string;
  eightDTop1: string;
  top1Agree: boolean;
  oneDTop2: string[];
  eightDTop2: string[];
  top2SetOverlap: boolean;
  rankPairs: Array<{ voice: string; oneDRank: number; eightDRank: number }>;
}

interface HonestyResult {
  source_falsifier_run: string;
  source_samples: number;
  source_verdict: string;
  source_deltaPp: number;
  top1_agreement_rate: number;
  top1_agreement_count: number;
  top2_set_overlap_rate: number;
  top2_set_overlap_count: number;
  random_baseline_top1_agreement: number;
  score_position_correlation: number;
  score_position_correlation_n: number;
  per_sample: PerSampleAgreement[];
  verdict:
    | "channels_independent"
    | "channels_correlated_but_distinct"
    | "channels_redundant";
  verdict_reason: string;
  interpretation: string;
}

function localPath(url: string): string {
  return decodeURIComponent(new URL(url).pathname);
}

function pearson(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

async function main() {
  const outDir = localPath(new URL(".", import.meta.url).href).replace(
    /\/$/,
    "",
  );
  const root = localPath(new URL("../..", import.meta.url).href).replace(
    /\/$/,
    "",
  );
  const sourcePath =
    `${root}/probes/voices-routing-falsifier-v0/result.latest.json`;

  console.log(`Reading falsifier v0 result from: ${sourcePath}`);
  const sourceText = await Deno.readTextFile(sourcePath);
  const src = JSON.parse(sourceText) as FalsifierResult;
  console.log(`  Source verdict: ${src.verdict}`);
  console.log(`  Source labeled samples: ${src.labeledSamples}`);
  console.log(`  Source delta: ${src.deltaPp.toFixed(1)}pp`);

  const perSample: PerSampleAgreement[] = [];
  const xs: number[] = [];
  const ys: number[] = [];

  let top1AgreeCount = 0;
  let top2OverlapCount = 0;

  for (const s of src.samples) {
    const oneDTop1 = s.oneD.predicted[0] ?? "";
    const eightDTop1 = s.eightD.predicted[0] ?? "";
    const oneDTop2 = s.oneD.predicted.slice(0, 2);
    const eightDTop2 = s.eightD.predicted.slice(0, 2);
    const top1Agree = oneDTop1 === eightDTop1;
    const top2SetOverlap = oneDTop2.some((v) => eightDTop2.includes(v));
    if (top1Agree) top1AgreeCount++;
    if (top2SetOverlap) top2OverlapCount++;

    // Build rank-position vectors per voice for correlation
    const voices = Array.from(
      new Set([...s.oneD.predicted, ...s.eightD.predicted]),
    );
    const rankPairs = voices.map((v) => {
      const oneDRank = s.oneD.predicted.indexOf(v);
      const eightDRank = s.eightD.predicted.indexOf(v);
      return {
        voice: v,
        oneDRank: oneDRank === -1 ? s.oneD.predicted.length : oneDRank,
        eightDRank: eightDRank === -1 ? s.eightD.predicted.length : eightDRank,
      };
    });
    for (const rp of rankPairs) {
      xs.push(rp.oneDRank);
      ys.push(rp.eightDRank);
    }

    perSample.push({
      sourceId: s.sourceId,
      targetSpeaker: s.targetSpeaker,
      oneDTop1,
      eightDTop1,
      top1Agree,
      oneDTop2,
      eightDTop2,
      top2SetOverlap,
      rankPairs,
    });
  }

  const n = src.samples.length;
  const top1Rate = n > 0 ? top1AgreeCount / n : 0;
  const top2Rate = n > 0 ? top2OverlapCount / n : 0;

  // Random baseline: if 1D and 8D were independent uniform random rankings
  // over V voices, P(top1 agree) = 1/V (since 1D's top1 is fixed, 8D picks
  // each voice with prob 1/V independently in expectation).
  // V here is the number of voice candidates per sample. Use the maximum
  // observed voice count across samples as V (conservative).
  let maxVoices = 0;
  for (const s of src.samples) {
    const v = new Set([...s.oneD.predicted, ...s.eightD.predicted]).size;
    if (v > maxVoices) maxVoices = v;
  }
  const randomBaseline = maxVoices > 0 ? 1 / maxVoices : 0;

  const corr = pearson(xs, ys);

  let verdict: HonestyResult["verdict"];
  let verdictReason: string;
  if (top1Rate >= 0.70) {
    verdict = "channels_redundant";
    verdictReason = `Top-1 agreement ${
      (top1Rate * 100).toFixed(0)
    }% (≥70% gate). 1D and 8D channels produce the same prediction on the strong majority of samples. They are reading the same input signal (oct tags) through different aggregators.`;
  } else if (top1Rate >= 0.50) {
    verdict = "channels_correlated_but_distinct";
    verdictReason = `Top-1 agreement ${
      (top1Rate * 100).toFixed(0)
    }% (between 50% and 70%). Channels share signal but diverge enough that the 5.6pp delta likely reflects genuine difference, not pure noise.`;
  } else {
    verdict = "channels_independent";
    verdictReason = `Top-1 agreement ${
      (top1Rate * 100).toFixed(0)
    }% (below 50%). Channels are largely independent. Falsifier v0's verdict on 1D vs 8D as competing signals is structurally fair.`;
  }

  let interpretation = "";
  if (verdict === "channels_redundant") {
    interpretation = [
      "Falsifier v0 did not measure what its name implies. It measured two aggregators of the same input (chord.primary + chord.secondary oct tags):",
      "  - 1D channel: frequency-match the source's oct tags against each voice's historical oct-tag frequencies.",
      "  - 8D channel: one-hot encode the source's oct tags into an 8D vector; aggregate voice history into 8D vectors; cosine-similarity.",
      "Both aggregators read the same bytes. The observed +5.6pp 8D advantage is within-the-same-channel variation, not 8D-as-distinct-signal beating 1D.",
      "",
      "The 8D-as-scheduler question is therefore epistemically open, not closed. A fair test would require input that is independent of oct tags — for example: voices emitting an explicit `dipole:` field per chord, or a body-text→dipole extraction probe whose output is computed from chord prose without reading frame tags.",
    ].join("\n");
  } else if (verdict === "channels_correlated_but_distinct") {
    interpretation =
      "Channels share oct-tag signal but diverge enough to make falsifier v0's delta meaningful. Verdict `keep_metadata` stands; the 5.6pp gap is real but under the +10pp adoption gate.";
  } else {
    interpretation =
      "Channels appear independent. Falsifier v0's verdict is structurally fair.";
  }

  const result: HonestyResult = {
    source_falsifier_run: sourcePath,
    source_samples: n,
    source_verdict: src.verdict,
    source_deltaPp: src.deltaPp,
    top1_agreement_rate: top1Rate,
    top1_agreement_count: top1AgreeCount,
    top2_set_overlap_rate: top2Rate,
    top2_set_overlap_count: top2OverlapCount,
    random_baseline_top1_agreement: randomBaseline,
    score_position_correlation: corr,
    score_position_correlation_n: xs.length,
    per_sample: perSample,
    verdict,
    verdict_reason: verdictReason,
    interpretation,
  };

  await Deno.writeTextFile(
    `${outDir}/result.latest.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(`\nWrote ${outDir}/result.latest.json`);

  const md = `# Falsifier v0 Honesty Check — Result

**Date:** ${new Date().toISOString()}
**Source:** \`probes/voices-routing-falsifier-v0/result.latest.json\`
**Source verdict:** \`${src.verdict}\`
**Source delta:** ${src.deltaPp.toFixed(1)}pp (8D − 1D)
**Source samples:** ${n}

## Channel Agreement Metrics

| Metric | Value |
|---|---:|
| Top-1 prediction agreement (1D == 8D) | ${
    (top1Rate * 100).toFixed(1)
  }% (${top1AgreeCount}/${n}) |
| Top-2 set overlap | ${
    (top2Rate * 100).toFixed(1)
  }% (${top2OverlapCount}/${n}) |
| Random baseline (1/V) | ${
    (randomBaseline * 100).toFixed(1)
  }% (V=${maxVoices}) |
| Rank-position Pearson correlation | ${corr.toFixed(3)} (n=${xs.length}) |

## Verdict

\`\`\`json
${JSON.stringify({ verdict, reason: verdictReason }, null, 2)}
\`\`\`

## Interpretation

${interpretation}

## Per-Sample Agreement

| Source | Target | 1D top-1 | 8D top-1 | top-1 agree | top-2 overlap |
|---|---|---|---|:---:|:---:|
${
    perSample.map((s) =>
      `| ${s.sourceId} | ${s.targetSpeaker} | ${s.oneDTop1} | ${s.eightDTop1} | ${
        s.top1Agree ? "✓" : "✗"
      } | ${s.top2SetOverlap ? "✓" : "✗"} |`
    ).join("\n")
  }

## What This Probe Does Not Claim

- It does **not** propose to reverse falsifier v0's verdict.
- It does **not** propose to elevate 8D to scheduler authority.
- It claims only: the input space tested was \`{chord.primary, chord.secondary}\` for both channels. If those channels are highly correlated, the test name "1D vs 8D" overstates what was compared.

A genuinely independent 8D test requires input that does not flow through oct tags. Out of scope here.
`;

  await Deno.writeTextFile(`${outDir}/result.latest.md`, md);
  console.log(`Wrote ${outDir}/result.latest.md`);

  console.log("\n=== SUMMARY ===");
  console.log(`Verdict: ${verdict}`);
  console.log(
    `Top-1 agreement: ${(top1Rate * 100).toFixed(1)}% (${top1AgreeCount}/${n})`,
  );
  console.log(
    `Top-2 overlap:   ${
      (top2Rate * 100).toFixed(1)
    }% (${top2OverlapCount}/${n})`,
  );
  console.log(
    `Random baseline: ${(randomBaseline * 100).toFixed(1)}% (V=${maxVoices})`,
  );
  console.log(`Rank correlation: ${corr.toFixed(3)}`);
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});
