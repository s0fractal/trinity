// src/x6420_phi_roundtrip.ts — phi roundtrip fixture generator
// position: 6/42 → harmony(6) × foundation(4) = phi roundtrip verification
// placement_policy: axis
// intent: execute liquid/omega/myc integration pipeline and output fixture
// maturity: active
// skill_safe: yes-with-care

type Step = {
  name: string;
  cwd: string;
  command: string[];
};

const root = Deno.cwd();
const fixturesDir = `${root}/fixtures/phi`;
const intentPath = `${fixturesDir}/phi_intent_fixture.json`;
const receiptPath = `${fixturesDir}/phi_receipt_fixture.json`;
const ingestMyc = Deno.args.includes("--ingest-myc");

async function run(step: Step): Promise<void> {
  console.log(`\n==> ${step.name}`);
  const command = new Deno.Command(step.command[0], {
    args: step.command.slice(1),
    cwd: step.cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const output = await command.output();
  if (output.code !== 0) {
    throw new Error(`${step.name} failed with exit code ${output.code}`);
  }
}

async function sha256File(path: string): Promise<string> {
  const data = await Deno.readFile(path);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function main() {
  await Deno.mkdir(fixturesDir, { recursive: true });

  await run({
    name: "liquid exports PHI_INTENT",
    cwd: `${root}/liquid`,
    command: [
      "deno",
      "run",
      "-A",
      "tools/export_intent_fixture.ts",
      intentPath,
    ],
  });

  await run({
    name: "omega consumes PHI_INTENT and emits PHI_RECEIPT",
    cwd: `${root}/omega`,
    command: [
      "deno",
      "run",
      "-A",
      "tools/consume_intent_fixture.ts",
      intentPath,
      receiptPath,
    ],
  });

  if (ingestMyc) {
    await run({
      name: "myc ingests PHI_RECEIPT",
      cwd: `${root}/myc`,
      command: [
        "deno",
        "run",
        "-A",
        // myc migrated its organ layer to flat-src (myc@93b77f8); the old
        // tools/ path no longer exists.
        "src/x5F10_import_substrate_receipt.ts",
        receiptPath,
      ],
    });
  }

  // The substrate exporters emit JSON without a trailing newline; repo-wide
  // `deno fmt --check` (a daemon commit gate) requires one. Normalize here —
  // canonical form is owned by the trinity-side roundtrip, not the exporters.
  for (const p of [intentPath, receiptPath]) {
    const text = await Deno.readTextFile(p);
    if (!text.endsWith("\n")) await Deno.writeTextFile(p, text + "\n");
  }

  const intentSha = await sha256File(intentPath);
  const receiptSha = await sha256File(receiptPath);

  // Deterministic on purpose: no wall-clock timestamp. The summary is a
  // stable projection of substrate physics — identical physics must produce
  // byte-identical output, so the daemon's commit-if-drifted pulse only
  // fires on REAL change (and `git log fixtures/phi` becomes the heartbeat
  // history). Paths are repo-relative for the same reason.
  // Fenced block keeps the summary byte-stable under `deno fmt` (prose
  // outside fences gets reflowed, which would fight the --check gate).
  const summary = [
    "# Phi Roundtrip Fixture",
    "",
    "Deterministic projection of the liquid → omega → myc bridge. Regenerate with",
    "`deno task fixture:phi` (add `:ingest-myc` for the third leg).",
    "",
    "```text",
    "intent:          fixtures/phi/phi_intent_fixture.json",
    `intent_sha256:   ${intentSha}`,
    "receipt:         fixtures/phi/phi_receipt_fixture.json",
    `receipt_sha256:  ${receiptSha}`,
    "```",
    "",
  ].join("\n");

  await Deno.writeTextFile(`${fixturesDir}/ROUNDTRIP.md`, summary);
  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify({
      type: "phi_roundtrip",
      intent_sha256: intentSha,
      receipt_sha256: receiptSha,
      myc_ingest: ingestMyc,
    }));
  } else {
    console.log(`\nRoundtrip summary written: ${fixturesDir}/ROUNDTRIP.md`);
  }
}

await main();
