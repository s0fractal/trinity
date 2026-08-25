#!/usr/bin/env python3
"""Negative controls for the harness itself.

The harness is the only thing standing between "the model wrote this from the
prose" and "the model was shown the answers". Green rounds prove nothing about
it; what proves something is watching each guard refuse.

Two tiers, because one of them needs Docker:

  tier 1  protocol validation, the closed feedback channel, freeze-once,
          capsule verbatim, pack staleness — pure, runs anywhere
  tier 2  the isolation itself: no host filesystem, no network

Tier 2 is SKIPPED, loudly, where Docker or the pinned image is absent. A skipped
control is reported as skipped and never counted as a pass.

Usage:
    python3 harness/selftest.py [--json]
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(HERE, "harness"))

import sandbox  # noqa: E402
import evaluate  # noqa: E402

RESULTS: list[dict] = []


def record(name: str, tier: int, ok: bool, detail: str, skipped: bool = False) -> None:
    RESULTS.append({"name": name, "tier": tier, "ok": ok, "skipped": skipped,
                    "detail": detail})


def expect_raises(name, tier, fn, needle):
    try:
        fn()
    except BaseException as exc:  # SystemExit included, deliberately
        text = str(exc)
        ok = needle.lower() in text.lower()
        record(name, tier, ok,
               f"refused: {text[:160]}" if ok else f"refused for the wrong reason: {text[:160]}")
        return
    record(name, tier, False, "NOT refused — the guard did not fire")


# ---------------------------------------------------------------- tier 1

def t_wrong_verify_digest():
    """`verify` accepting with a digest that is not of the input must be caught."""
    raw = b'{"a":1}'.hex()
    expect_raises(
        "wrong-verify-digest", 1,
        lambda: evaluate.validate_line(
            {"id": "x", "ok": True, "sha256": "0" * 64}, "x", "verify", raw),
        "digest of the input",
    )


def t_encode_digest_inconsistent():
    """`encode` accepting with a digest that is not of its own canonical bytes."""
    expect_raises(
        "encode-digest-mismatch", 1,
        lambda: evaluate.validate_line(
            {"id": "x", "ok": True, "canonical_hex": "7b7d", "sha256": "1" * 64},
            "x", "encode", "7b7d"),
        "not the digest of `canonical_hex`",
    )


def t_out_of_order():
    expect_raises(
        "out-of-order-id", 1,
        lambda: evaluate.validate_line({"id": "b", "ok": False, "category": "syntax"},
                                       "a", "encode", "7b7d"),
        "out of order",
    )


def t_rejection_without_category():
    expect_raises(
        "rejection-without-category", 1,
        lambda: evaluate.validate_line({"id": "a", "ok": False}, "a", "encode", "7b7d"),
        "without a `category`",
    )


def t_empty_scope():
    """Zero cases must be a refusal, not a perfect score."""
    expect_raises("empty-scope", 1,
                  lambda: evaluate.load_cases_empty_probe(), "zero cases")


def t_arbitrary_feedback():
    """The pre-freeze channel takes machine output only; there is no flag for a file."""
    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, "harness", "round.py"),
         "--workdir", "/tmp/nonexistent-cleanroom", "--feedback", "/etc/hosts",
         "--dry-run"],
        capture_output=True, text=True,
    )
    ok = proc.returncode != 0 and "unrecognized arguments" in (proc.stderr + proc.stdout)
    record("arbitrary-feedback", 1, ok,
           "refused: --feedback is not a flag" if ok
           else f"accepted an arbitrary feedback file: {proc.stdout[-200:]}")


def t_freeze_once():
    """A second freeze must refuse rather than overwrite the one checkpoint."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = os.path.join(tmp, "probe")
        os.makedirs(os.path.join(probe, "provenance"))
        shutil.copytree(os.path.join(HERE, "harness"), os.path.join(probe, "harness"))
        shutil.copy2(os.path.join(HERE, "provenance", "pack.json"),
                     os.path.join(probe, "provenance", "pack.json"))
        work = os.path.join(tmp, "work", "src")
        os.makedirs(work)
        open(os.path.join(tmp, "work", "Cargo.toml"), "w").write("[package]\n")
        open(os.path.join(work, "main.rs"), "w").write("fn main(){}\n")
        args = [sys.executable, os.path.join(probe, "harness", "freeze.py"),
                "--workdir", os.path.join(tmp, "work")]
        first = subprocess.run(args, capture_output=True, text=True)
        second = subprocess.run(args, capture_output=True, text=True)
        ok = first.returncode == 0 and second.returncode != 0 and \
            "already exists" in (second.stdout + second.stderr)
        record("freeze-once", 1, ok,
               "second freeze refused" if ok
               else f"first={first.returncode} second={second.returncode}: "
                    f"{(second.stdout + second.stderr)[-200:]}")


def t_freeze_rejects_symlink():
    with tempfile.TemporaryDirectory() as tmp:
        probe = os.path.join(tmp, "probe")
        os.makedirs(os.path.join(probe, "provenance"))
        shutil.copytree(os.path.join(HERE, "harness"), os.path.join(probe, "harness"))
        shutil.copy2(os.path.join(HERE, "provenance", "pack.json"),
                     os.path.join(probe, "provenance", "pack.json"))
        work = os.path.join(tmp, "work")
        os.makedirs(os.path.join(work, "src"))
        open(os.path.join(work, "Cargo.toml"), "w").write("[package]\n")
        os.symlink("/etc/hosts", os.path.join(work, "src", "sneaky.rs"))
        proc = subprocess.run(
            [sys.executable, os.path.join(probe, "harness", "freeze.py"),
             "--workdir", work], capture_output=True, text=True)
        ok = proc.returncode != 0 and "symlink" in (proc.stdout + proc.stderr)
        record("freeze-rejects-symlink", 1, ok,
               "refused a symlink" if ok else (proc.stdout + proc.stderr)[-200:])


def t_capsule_verbatim():
    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, "harness", "build_capsule.py"), "--check"],
        capture_output=True, text=True)
    record("capsule-verbatim", 1, proc.returncode == 0,
           proc.stdout.strip().replace("\n", "; ") or proc.stderr[-200:])


def t_stale_capsule_detected():
    """One edited byte in a quoted region must fail the verbatim check."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = os.path.join(tmp, "probe")
        shutil.copytree(os.path.join(HERE, "harness"), os.path.join(probe, "harness"))
        shutil.copytree(os.path.join(HERE, "capsule"), os.path.join(probe, "capsule"))
        shutil.copytree(os.path.join(HERE, "provenance"), os.path.join(probe, "provenance"))
        spec = os.path.join(probe, "capsule", "SPEC.md")
        text = open(spec, encoding="utf-8").read().replace("MUST", "SHOULD", 1)
        open(spec, "w", encoding="utf-8").write(text)
        proc = subprocess.run(
            [sys.executable, os.path.join(probe, "harness", "build_capsule.py"), "--check"],
            capture_output=True, text=True)
        ok = proc.returncode != 0
        record("stale-capsule-detected", 1, ok,
               "an edited quotation was caught" if ok else "an edited quotation passed")


def t_pack_leak_check():
    """A pack that names an implementation must not build."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = os.path.join(tmp, "probe")
        shutil.copytree(os.path.join(HERE, "harness"), os.path.join(probe, "harness"))
        shutil.copytree(os.path.join(HERE, "capsule"), os.path.join(probe, "capsule"))
        task = os.path.join(probe, "capsule", "TASK.md")
        open(task, "a", encoding="utf-8").write("\nSee the TypeScript reference.\n")
        proc = subprocess.run(
            [sys.executable, os.path.join(probe, "harness", "pack.py")],
            capture_output=True, text=True)
        ok = proc.returncode != 0 and "LEAK" in proc.stdout
        record("pack-leak-check", 1, ok,
               proc.stdout.strip().splitlines()[0] if ok else "a leaking pack built")


def t_workdir_inside_trinity():
    expect_raises("workdir-inside-trinity", 1,
                  lambda: sandbox.refuse_if_inside_trinity(
                      os.path.join(sandbox.TRINITY, "anywhere")),
                  "inside the Trinity checkout")


# ---------------------------------------------------------------- tier 2

def docker_available() -> tuple[bool, str]:
    if shutil.which("docker") is None:
        return False, "docker is not on PATH"
    probe = subprocess.run(["docker", "image", "inspect", sandbox.IMAGE],
                           capture_output=True, text=True)
    if probe.returncode != 0:
        return False, "the pinned image is not present locally"
    return True, ""


def t_sandbox_isolation():
    ok, why = docker_available()
    if not ok:
        record("sandbox-no-host-filesystem", 2, False, why, skipped=True)
        record("sandbox-no-network", 2, False, why, skipped=True)
        return
    with tempfile.TemporaryDirectory(dir=os.path.expanduser("~")) as work:
        code, out = sandbox.run(work, ["sh", "-c", "ls /Users 2>&1 | head -1"])
        hidden = "No such file" in out or "cannot access" in out
        record("sandbox-no-host-filesystem", 2, hidden,
               "the host filesystem is not reachable" if hidden else out[:160])

        code, out = sandbox.run(
            work, ["sh", "-c", "cargo search serde 2>&1 | head -3"], timeout_s=120)
        denied = "Could not resolve host" in out or "network" in out.lower()
        record("sandbox-no-network", 2, denied,
               "the network is not reachable" if denied else out[:160])


def main() -> int:
    for fn in (t_wrong_verify_digest, t_encode_digest_inconsistent, t_out_of_order,
               t_rejection_without_category, t_empty_scope, t_arbitrary_feedback,
               t_freeze_once, t_freeze_rejects_symlink, t_capsule_verbatim,
               t_stale_capsule_detected, t_pack_leak_check, t_workdir_inside_trinity,
               t_sandbox_isolation):
        fn()

    failed = [r for r in RESULTS if not r["ok"] and not r["skipped"]]
    skipped = [r for r in RESULTS if r["skipped"]]
    if "--json" in sys.argv:
        print(json.dumps({"results": RESULTS, "failed": len(failed),
                          "skipped": len(skipped)}, indent=2))
    else:
        print("harness negative controls")
        for r in RESULTS:
            mark = "SKIP" if r["skipped"] else ("ok  " if r["ok"] else "FAIL")
            print(f"  {mark} [t{r['tier']}] {r['name']:28} {r['detail'][:96]}")
        print(f"  {len(RESULTS) - len(failed) - len(skipped)} passed, "
              f"{len(failed)} failed, {len(skipped)} skipped")
        if skipped:
            print("  a skipped control is not a passed control")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
