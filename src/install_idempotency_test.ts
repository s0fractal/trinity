import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const ROOT = new URL("..", import.meta.url).pathname;

async function run(
  command: string,
  args: string[],
  cwd?: string,
  env?: Record<string, string>,
) {
  return await new Deno.Command(command, {
    args,
    cwd,
    env,
    stdout: "piped",
    stderr: "piped",
  }).output();
}

async function git(args: string[], cwd?: string): Promise<string> {
  const result = await run("git", args, cwd);
  if (!result.success) {
    throw new Error(new TextDecoder().decode(result.stderr));
  }
  return new TextDecoder().decode(result.stdout).trim();
}

Deno.test("install clones, fetches+fast-forwards, then preserves dirty local state", async () => {
  const tmp = await Deno.makeTempDir({ prefix: "trinity_install_" });
  const remote = join(tmp, "remote.git");
  const seed = join(tmp, "seed");
  const dest = join(tmp, "joined");
  try {
    await git(["init", "--bare", remote]);
    await git(["init", "-b", "main", seed]);
    await git(["config", "user.email", "test@example.invalid"], seed);
    await git(["config", "user.name", "install test"], seed);
    await Deno.writeTextFile(join(seed, "state.txt"), "v1\n");
    await git(["add", "state.txt"], seed);
    await git(["commit", "-m", "v1"], seed);
    await git(["remote", "add", "origin", remote], seed);
    await git(["push", "-u", "origin", "main"], seed);
    await git(["--git-dir", remote, "symbolic-ref", "HEAD", "refs/heads/main"]);

    const env = {
      TRINITY_HOME: dest,
      TRINITY_REPO: remote,
      HOME: tmp,
      PATH: Deno.env.get("PATH") ?? "",
    };
    const first = await run("sh", [join(ROOT, "install.sh")], undefined, env);
    assert(first.success, new TextDecoder().decode(first.stderr));
    assertStringIncludes(
      new TextDecoder().decode(first.stdout),
      "cloning trinity",
    );
    assertEquals(await Deno.readTextFile(join(dest, "state.txt")), "v1\n");

    await Deno.writeTextFile(join(seed, "state.txt"), "v2\n");
    await git(["commit", "-am", "v2"], seed);
    await git(["push"], seed);
    const second = await run("sh", [join(ROOT, "install.sh")], undefined, env);
    assert(second.success, new TextDecoder().decode(second.stderr));
    assertStringIncludes(
      new TextDecoder().decode(second.stdout),
      "fetching origin",
    );
    assertStringIncludes(
      new TextDecoder().decode(second.stdout),
      "fast-forwarded",
    );
    assertEquals(await Deno.readTextFile(join(dest, "state.txt")), "v2\n");

    await Deno.writeTextFile(join(dest, "local.txt"), "keep me\n");
    const before = await git(["rev-parse", "HEAD"], dest);
    await Deno.writeTextFile(join(seed, "state.txt"), "v3\n");
    await git(["commit", "-am", "v3"], seed);
    await git(["push"], seed);
    const third = await run("sh", [join(ROOT, "install.sh")], undefined, env);
    assert(third.success, new TextDecoder().decode(third.stderr));
    assertStringIncludes(
      new TextDecoder().decode(third.stdout),
      "fetched only",
    );
    assertEquals(await git(["rev-parse", "HEAD"], dest), before);
    assertEquals(await Deno.readTextFile(join(dest, "local.txt")), "keep me\n");
    assertEquals(
      await git(["rev-parse", "origin/main"], dest),
      await git([
        "rev-parse",
        "HEAD",
      ], seed),
    );
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});

Deno.test("install refuses an existing non-git destination", async () => {
  const tmp = await Deno.makeTempDir({ prefix: "trinity_install_refuse_" });
  const dest = join(tmp, "joined");
  try {
    await Deno.mkdir(dest);
    await Deno.writeTextFile(join(dest, "human.txt"), "preserve\n");
    const result = await run("sh", [join(ROOT, "install.sh")], undefined, {
      TRINITY_HOME: dest,
      TRINITY_REPO: join(tmp, "unused.git"),
      HOME: tmp,
      PATH: Deno.env.get("PATH") ?? "",
    });
    assertEquals(result.success, false);
    assertStringIncludes(
      new TextDecoder().decode(result.stderr),
      "refusing to overwrite",
    );
    assertEquals(
      await Deno.readTextFile(join(dest, "human.txt")),
      "preserve\n",
    );
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});

Deno.test("install refuses a git checkout with a different origin", async () => {
  const tmp = await Deno.makeTempDir({ prefix: "trinity_install_origin_" });
  const dest = join(tmp, "joined");
  try {
    await git(["init", "-b", "main", dest]);
    await git(["remote", "add", "origin", join(tmp, "other.git")], dest);
    const result = await run("sh", [join(ROOT, "install.sh")], undefined, {
      TRINITY_HOME: dest,
      TRINITY_REPO: join(tmp, "expected.git"),
      HOME: tmp,
      PATH: Deno.env.get("PATH") ?? "",
    });
    assertEquals(result.success, false);
    assertStringIncludes(
      new TextDecoder().decode(result.stderr),
      "different git checkout",
    );
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});

Deno.test("install preserves a clean public submodule that is locally ahead of the pin", async () => {
  const tmp = await Deno.makeTempDir({ prefix: "trinity_install_submodule_" });
  const organRemote = join(tmp, "myc.git");
  const organSeed = join(tmp, "myc-seed");
  const rootRemote = join(tmp, "trinity.git");
  const rootSeed = join(tmp, "trinity-seed");
  const dest = join(tmp, "joined");
  try {
    await git(["init", "--bare", organRemote]);
    await git(["init", "-b", "main", organSeed]);
    await git(["config", "user.email", "test@example.invalid"], organSeed);
    await git(["config", "user.name", "install test"], organSeed);
    await Deno.writeTextFile(join(organSeed, "myc.txt"), "pinned\n");
    await git(["add", "myc.txt"], organSeed);
    await git(["commit", "-m", "myc pin"], organSeed);
    await git(["remote", "add", "origin", organRemote], organSeed);
    await git(["push", "-u", "origin", "main"], organSeed);
    await git([
      "--git-dir",
      organRemote,
      "symbolic-ref",
      "HEAD",
      "refs/heads/main",
    ]);

    await git(["init", "--bare", rootRemote]);
    await git(["init", "-b", "main", rootSeed]);
    await git(["config", "user.email", "test@example.invalid"], rootSeed);
    await git(["config", "user.name", "install test"], rootSeed);
    await git([
      "-c",
      "protocol.file.allow=always",
      "submodule",
      "add",
      organRemote,
      "myc",
    ], rootSeed);
    await git(["commit", "-m", "root with myc"], rootSeed);
    await git(["remote", "add", "origin", rootRemote], rootSeed);
    await git(["push", "-u", "origin", "main"], rootSeed);
    await git([
      "--git-dir",
      rootRemote,
      "symbolic-ref",
      "HEAD",
      "refs/heads/main",
    ]);

    const env = {
      TRINITY_HOME: dest,
      TRINITY_REPO: rootRemote,
      GIT_ALLOW_PROTOCOL: "file",
      HOME: tmp,
      PATH: Deno.env.get("PATH") ?? "",
    };
    const first = await run("sh", [join(ROOT, "install.sh")], undefined, env);
    assert(first.success, new TextDecoder().decode(first.stderr));
    await git(
      ["config", "user.email", "test@example.invalid"],
      join(dest, "myc"),
    );
    await git(["config", "user.name", "install test"], join(dest, "myc"));
    await Deno.writeTextFile(join(dest, "myc", "local.txt"), "local commit\n");
    await git(["add", "local.txt"], join(dest, "myc"));
    await git(["commit", "-m", "local myc work"], join(dest, "myc"));
    const ahead = await git(["rev-parse", "HEAD"], join(dest, "myc"));

    const second = await run("sh", [join(ROOT, "install.sh")], undefined, env);
    assert(second.success, new TextDecoder().decode(second.stderr));
    assertStringIncludes(
      new TextDecoder().decode(second.stdout),
      "ahead or diverged from trinity's pin",
    );
    assertEquals(await git(["rev-parse", "HEAD"], join(dest, "myc")), ahead);
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }
});
