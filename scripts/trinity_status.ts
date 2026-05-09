type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type ModuleStatus = {
  name: string;
  path: string;
  head: string;
  branchLine: string;
  remote: string;
  dirty: boolean;
  statusLines: string[];
};

const modules = [
  { name: "myc", path: "myc" },
  { name: "omega", path: "omega" },
  { name: "liquid", path: "liquid" },
];

async function run(args: string[], cwd: string): Promise<CommandResult> {
  const command = new Deno.Command(args[0], {
    args: args.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout).trim(),
    stderr: new TextDecoder().decode(output.stderr).trim(),
  };
}

async function moduleStatus(
  root: string,
  mod: { name: string; path: string },
): Promise<ModuleStatus> {
  const cwd = `${root}/${mod.path}`;
  const status = await run(["git", "status", "--short", "--branch"], cwd);
  const head = await run(["git", "rev-parse", "--short", "HEAD"], cwd);
  const remote = await run(["git", "remote", "get-url", "origin"], cwd);
  const statusLines = status.stdout.split("\n").filter(Boolean);

  return {
    name: mod.name,
    path: mod.path,
    head: head.stdout || "unknown",
    branchLine: statusLines[0] || "unknown",
    remote: remote.stdout || "none",
    dirty: statusLines.length > 1,
    statusLines,
  };
}

async function main() {
  const root = Deno.cwd();
  const json = Deno.args.includes("--json");
  const rootHead = await run(["git", "rev-parse", "--short", "HEAD"], root);
  const rootStatus = await run(["git", "status", "--short", "--branch"], root);
  const statuses = [];

  for (const mod of modules) {
    statuses.push(await moduleStatus(root, mod));
  }

  if (json) {
    console.log(JSON.stringify(
      {
        root: {
          path: root,
          head: rootHead.stdout || null,
          status: rootStatus.stdout.split("\n").filter(Boolean),
        },
        modules: statuses,
      },
      null,
      2,
    ));
    return;
  }

  console.log("# Trinity Status\n");
  console.log(`Root: \`${root}\``);
  console.log(`Root HEAD: \`${rootHead.stdout || "uncommitted"}\``);
  console.log("");
  console.log("| Module | Path | HEAD | Branch | Dirty | Remote |");
  console.log("|---|---|---:|---|---:|---|");
  for (const status of statuses) {
    console.log(
      `| ${status.name} | \`${status.path}\` | \`${status.head}\` | \`${status.branchLine}\` | ${
        status.dirty ? "yes" : "no"
      } | ${status.remote} |`,
    );
  }

  const dirty = statuses.filter((s) => s.dirty);
  if (dirty.length > 0) {
    console.log("\n## Dirty Submodules\n");
    for (const status of dirty) {
      console.log(`### ${status.name}`);
      console.log("```text");
      console.log(status.statusLines.join("\n"));
      console.log("```");
    }
  }
}

await main();
