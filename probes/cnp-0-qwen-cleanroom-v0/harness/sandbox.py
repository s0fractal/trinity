#!/usr/bin/env python3
"""The one place the isolation is defined, so there is one place to audit it.

Everything the candidate produces — its build, its tests, its binary — runs
here. Running a model-generated Cargo project on the host was the first version
of this harness and it was not a clean room at all: `build.rs`, a test, or
`.cargo/config.toml` can read anything the proctor can read, including the
Trinity checkout and the corpus this experiment exists to keep hidden.

What is enforced:

  --network none              no crates.io, no exfiltration, no fetching a
                              reference implementation mid-build
  --read-only                 the image is immutable; only the mount and a
                              noexec tmpfs are writable
  --cap-drop ALL              no capabilities
  --security-opt no-new-privileges
  --memory / --pids-limit     a runaway build cannot take the host down
  one mount, the workdir      Trinity and the corpus are not mounted, so they
                              cannot be read even by accident
  pinned image digest         not a tag; a tag can move under you

The image digest is pinned rather than named. `rust:1.88-slim` today is not
necessarily `rust:1.88-slim` next month, and an experiment whose toolchain can
change silently is not reproducible.
"""

from __future__ import annotations

import os
import secrets
import shutil
import subprocess

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRINITY = os.path.normpath(os.path.join(HERE, "..", ".."))

IMAGE = (
    "rust:1.88-slim@sha256:"
    "38bc5a86d998772d4aec2348656ed21438d20fcdce2795b56ca434cf21430d89"
)

DEFAULT_TIMEOUT_S = 900
MAX_OUTPUT_BYTES = 200_000


class SandboxError(RuntimeError):
    pass


def refuse_if_inside_trinity(workdir: str) -> str:
    real = os.path.realpath(os.path.expanduser(workdir))
    root = os.path.realpath(TRINITY)
    if real == root or real.startswith(root + os.sep):
        raise SandboxError(
            f"the working directory {real} is inside the Trinity checkout {root}. "
            "The model must never see this repository."
        )
    return real


def preflight(workdir: str) -> str:
    """Refuse to run at all unless the isolation can actually be established."""
    if shutil.which("docker") is None:
        raise SandboxError("docker is not on PATH; the clean room cannot be isolated")
    real = refuse_if_inside_trinity(workdir)
    os.makedirs(real, exist_ok=True)

    have = subprocess.run(["docker", "image", "inspect", IMAGE],
                          capture_output=True, text=True)
    if have.returncode != 0:
        raise SandboxError(
            f"the pinned image is not present locally:\n  {IMAGE}\n"
            "Pull it once, deliberately, before running an isolated round:\n"
            "  docker pull rust:1.88-slim   # then verify the digest matches"
        )
    return real


def docker_argv(workdir: str, argv: list[str], read_only_mount: bool = False) -> list[str]:
    mount = f"{workdir}:/work" + (":ro" if read_only_mount else "")
    return [
        "docker", "run", "--rm",
        "--network", "none",
        "--read-only",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=256m",
        "--memory", "2g",
        "--pids-limit", "256",
        "-v", mount,
        "-w", "/work",
        "-e", "CARGO_HOME=/work/.cargo",
        "-e", "CARGO_TARGET_DIR=/work/target",
        "-i",
        IMAGE,
    ] + argv


def run(
    workdir: str,
    argv: list[str],
    stdin: str | None = None,
    timeout_s: int = DEFAULT_TIMEOUT_S,
    read_only_mount: bool = False,
) -> tuple[int, str]:
    """Run argv inside the sandbox. Returns (exit code, combined output)."""
    real = preflight(workdir)
    cmd = docker_argv(real, argv, read_only_mount=read_only_mount)
    try:
        proc = subprocess.run(
            cmd, input=stdin or "", capture_output=True, text=True, timeout=timeout_s,
        )
    except subprocess.TimeoutExpired:
        return 124, f"TIMEOUT after {timeout_s}s: {' '.join(argv)}"
    out = (proc.stdout or "") + (proc.stderr or "")
    if len(out.encode("utf-8", "replace")) > MAX_OUTPUT_BYTES:
        out = out[:MAX_OUTPUT_BYTES] + "\n[output truncated]\n"
    return proc.returncode, out


CARGO_ALLOWED = {
    "fmt": ["cargo", "fmt", "--", "--check"],
    "check": ["cargo", "check", "--offline"],
    "build": ["cargo", "build", "--release", "--offline"],
    "test": ["cargo", "test", "--offline"],
}


def cargo(workdir: str, sub: str, timeout_s: int = DEFAULT_TIMEOUT_S) -> tuple[int, str]:
    """Run one allowed cargo subcommand.

    `fmt` is `--check` on purpose. The earlier harness ran a rewriting
    `cargo fmt` after digesting the model's files, so the digest recorded what
    the model wrote and the tree held what the proctor's formatter produced.
    A proctor that reformats is a proctor that edits.
    """
    if sub not in CARGO_ALLOWED:
        raise SandboxError(f"cargo {sub} is not an allowed command")
    return run(workdir, CARGO_ALLOWED[sub], timeout_s=timeout_s)


def mount_is_visible(workdir: str) -> bool:
    """Is THIS host directory the one the container sees?

    The first version compared a directory listing, which answers a weaker
    question: any mount whose names happened to overlap would satisfy it, and it
    could not tell a stale mount from the live one. This writes a fresh random
    nonce on the host and reads it back inside the container, so the only way to
    pass is for the bytes just written here to be visible there.

    Docker Desktop shares only configured paths and mounts an unshared one as an
    EMPTY directory rather than failing, which produced "could not find
    Cargo.toml" — a harness fault a careless proctor would report as the model's
    compile error.
    """
    real = os.path.realpath(os.path.expanduser(workdir))
    nonce = secrets.token_hex(16)
    name = f".mount-probe-{secrets.token_hex(4)}"
    path = os.path.join(real, name)
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(nonce)
        code, out = run(real, ["sh", "-c", f"cat /work/{name} 2>/dev/null"], timeout_s=60)
        return code == 0 and nonce in out
    finally:
        # The probe must not survive into a build or a freeze.
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


if __name__ == "__main__":
    import sys
    wd = sys.argv[1] if len(sys.argv) > 1 else "~/cnp0-cleanroom"
    real = preflight(wd)
    print(f"image    {IMAGE}")
    print(f"workdir  {real}")
    code, out = run(real, ["sh", "-c", "cargo --version; ls /Users 2>&1 | head -1"])
    print(f"exit {code}\n{out.strip()}")
