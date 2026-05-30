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
        "tools/import_substrate_receipt.ts",
        receiptPath,
      ],
    });
  }

  const summary = [
    "# Phi Roundtrip Fixture",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Intent: \`${intentPath}\``,
    `Intent SHA-256: \`${await sha256File(intentPath)}\``,
    "",
    `Receipt: \`${receiptPath}\``,
    `Receipt SHA-256: \`${await sha256File(receiptPath)}\``,
    "",
    `MYC ingest: ${ingestMyc ? "yes" : "no"}`,
    "",
  ].join("\n");

  await Deno.writeTextFile(`${fixturesDir}/ROUNDTRIP.md`, summary);
  console.log(`\nRoundtrip summary written: ${fixturesDir}/ROUNDTRIP.md`);
}

await main();
