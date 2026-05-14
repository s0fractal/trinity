type Gate = {
  name: string;
  cwd: string;
  command: string[];
  strictOnly?: boolean;
};

type GateResult = {
  name: string;
  code: number;
  durationMs: number;
  stdout: string;
  stderr: string;
};

const root = Deno.cwd();
const strict = Deno.args.includes("--strict");

const gates: Gate[] = [
  {
    name: "myc / deno task check",
    cwd: `${root}/myc`,
    command: ["deno", "task", "check"],
  },
  {
    name: "omega / cargo test --workspace",
    cwd: `${root}/omega`,
    command: ["cargo", "test", "--workspace"],
  },
  {
    name: "liquid / deno task audit:strict",
    cwd: `${root}/liquid`,
    command: ["deno", "task", "audit:strict"],
  },
  {
    name: "liquid / deno task ledger:doctor --json",
    cwd: `${root}/liquid`,
    command: ["deno", "task", "ledger:doctor", "--json"],
  },
  {
    name: "omega / deno task test:fast",
    cwd: `${root}/omega`,
    command: ["deno", "task", "test:fast"],
    strictOnly: true,
  },
  {
    name: "liquid / deno task test:unit",
    cwd: `${root}/liquid`,
    command: ["deno", "task", "test:unit"],
    strictOnly: true,
  },
];

async function runGate(gate: Gate): Promise<GateResult> {
  const started = performance.now();
  const command = new Deno.Command(gate.command[0], {
    args: gate.command.slice(1),
    cwd: gate.cwd,
    stdout: "piped",
    stderr: "piped",
    env: {
      ...Deno.env.toObject(),
      LIQUID_QUIET: "1",
    },
  });
  const output = await command.output();
  return {
    name: gate.name,
    code: output.code,
    durationMs: Math.round(performance.now() - started),
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

function fence(text: string, maxChars = 12000): string {
  const trimmed = text.trim();
  if (!trimmed) return "_no output_";
  const visible = trimmed.length > maxChars
    ? `${trimmed.slice(0, maxChars)}\n\n... output truncated ...`
    : trimmed;
  return `\`\`\`text\n${visible}\n\`\`\``;
}

async function main() {
  const selected = gates.filter((gate) => strict || !gate.strictOnly);
  const results: GateResult[] = [];

  for (const gate of selected) {
    console.log(`\n==> ${gate.name}`);
    const result = await runGate(gate);
    results.push(result);
    console.log(
      `${result.code === 0 ? "PASS" : "FAIL"} (${result.durationMs}ms)`,
    );
  }

  const now = new Date().toISOString();
  const report = [
    `# Trinity ${strict ? "Strict" : "Green"} Audit`,
    "",
    `Generated: ${now}`,
    "",
    "| Gate | Status | Duration |",
    "|---|---:|---:|",
    ...results.map((result) =>
      `| ${result.name} | ${
        result.code === 0 ? "PASS" : "FAIL"
      } | ${result.durationMs}ms |`
    ),
    "",
    "## Details",
    "",
    ...results.flatMap((result) => [
      `### ${result.name}`,
      "",
      `Exit code: ${result.code}`,
      "",
      "#### stdout",
      fence(result.stdout),
      "",
      "#### stderr",
      fence(result.stderr),
      "",
    ]),
  ].join("\n");

  await Deno.mkdir(`${root}/reports`, { recursive: true });
  const reportPath = `${root}/reports/latest-${
    strict ? "strict" : "green"
  }-audit.md`;
  await Deno.writeTextFile(reportPath, report);
  console.log(`\nReport written: ${reportPath}`);

  // JSON sidecar — machine-readable form, consumed by SUBSTRATE_HEALTH.v0.1
  // adopters (e.g. 0x2/E.ts:loadCachedCi). Markdown remains for human read.
  // Schema: trinity.audit-baseline.v0.1
  const sidecar = {
    schema: "trinity.audit-baseline.v0.1",
    kind: strict ? "strict" : "green",
    generated_at: now,
    duration_total_ms: results.reduce((acc, r) => acc + r.durationMs, 0),
    gates: results.map((result) => ({
      name: result.name,
      status: result.code === 0 ? "PASS" : "FAIL",
      exit_code: result.code,
      duration_ms: result.durationMs,
    })),
    summary: {
      total: results.length,
      passed: results.filter((r) => r.code === 0).length,
      failed: results.filter((r) => r.code !== 0).length,
      skipped: 0,
    },
  };
  const sidecarPath = `${root}/reports/latest-${
    strict ? "strict" : "green"
  }-audit.json`;
  await Deno.writeTextFile(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
  console.log(`Sidecar written:  ${sidecarPath}`);

  const failed = results.filter((result) => result.code !== 0);
  if (failed.length > 0) {
    Deno.exit(1);
  }
}

await main();
