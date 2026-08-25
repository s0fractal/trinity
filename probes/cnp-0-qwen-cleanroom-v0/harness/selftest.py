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
import tree  # noqa: E402
import round as roundmod  # noqa: E402

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

def _fake_probe(tmp: str, with_capsule: bool = False) -> str:
    """A probe directory with the harness and its pins, for exercising refusals."""
    probe = os.path.join(tmp, "probe")
    os.makedirs(os.path.join(probe, "provenance"), exist_ok=True)
    shutil.copytree(os.path.join(HERE, "harness"), os.path.join(probe, "harness"))
    shutil.copytree(os.path.join(HERE, "capsule"), os.path.join(probe, "capsule"))
    shutil.copy2(os.path.join(HERE, "provenance", "pack.json"),
                 os.path.join(probe, "provenance", "pack.json"))
    return probe


def _tiny_project(path: str) -> str:
    work = os.path.expanduser(path)
    shutil.rmtree(work, ignore_errors=True)
    os.makedirs(os.path.join(work, "src"))
    open(os.path.join(work, "Cargo.toml"), "w").write(
        '[package]\nname="candidate"\nversion="0.1.0"\nedition="2021"\n')
    open(os.path.join(work, "src", "main.rs"), "w").write("fn main(){}\n")
    return work


def _freeze_ready_round(probe: str, workdir: str, **overrides) -> None:
    """Write a transcript that looks like a proctored round which passed."""
    tdir = os.path.join(probe, "provenance", "transcript")
    os.makedirs(tdir, exist_ok=True)
    files = tree.collect(workdir) if os.path.isdir(workdir) else []
    final_sha, manifest = tree.digest(files)
    pack = json.load(open(os.path.join(probe, "provenance", "pack.json")))
    rec = {
        "round": 1, "model_exit": 0, "compiles": True, "freeze_ready": True,
        "cargo": {"fmt": 0, "check": 0, "build": 0, "test": 0},
        "modified_by_build": [], "cargo_generated": [],
        "final_tree_sha256": final_sha, "final_tree": manifest,
        "workdir": os.path.realpath(workdir), "pack_sha256": pack["pack_sha256"],
        "prompt_sha256": "p" * 64, "output_sha256": "o" * 64,
    }
    rec.update(overrides)
    json.dump(rec, open(os.path.join(tdir, "round-01.json"), "w"))


def _run(probe: str, script: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, os.path.join(probe, "harness", script), *args],
        capture_output=True, text=True,
    )


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


def t_freeze_requires_transcript():
    """A freeze records a proctored round, not the contents of a directory."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        r = _run(probe, "freeze.py", "--workdir", os.path.expanduser("~/cnp0-selftest-none"))
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "no transcript" in blob
        record("freeze-requires-transcript", 1, ok,
               "refused a freeze with no transcript" if ok else blob[-200:])


def t_freeze_refuses_not_ready():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        work = _tiny_project("~/cnp0-selftest-notready")
        try:
            _freeze_ready_round(probe, work, freeze_ready=False,
                                cargo={"fmt": 0, "check": 1})
            r = _run(probe, "freeze.py", "--workdir", work)
            blob = r.stdout + r.stderr
            ok = r.returncode != 0 and "not freeze-ready" in blob
            record("freeze-refuses-not-ready", 1, ok,
                   "refused a round that did not build cleanly" if ok else blob[-200:])
        finally:
            shutil.rmtree(work, ignore_errors=True)


def t_freeze_refuses_failed_generation():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        work = _tiny_project("~/cnp0-selftest-modelexit")
        try:
            _freeze_ready_round(probe, work, model_exit=1)
            r = _run(probe, "freeze.py", "--workdir", work)
            blob = r.stdout + r.stderr
            ok = r.returncode != 0 and "model_exit" in blob
            record("freeze-refuses-failed-generation", 1, ok,
                   "refused a round whose generation failed" if ok else blob[-200:])
        finally:
            shutil.rmtree(work, ignore_errors=True)


def t_freeze_detects_edit_after_round():
    """A file changed between the round and the freeze must stop the freeze."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        work = _tiny_project("~/cnp0-selftest-edited")
        try:
            _freeze_ready_round(probe, work)
            with open(os.path.join(work, "src", "main.rs"), "a") as fh:
                fh.write("// edited after the round\n")
            r = _run(probe, "freeze.py", "--workdir", work)
            blob = r.stdout + r.stderr
            ok = r.returncode != 0 and "changed since the round" in blob
            record("freeze-detects-edit-after-round", 1, ok,
                   "refused a tree edited after its round" if ok else blob[-200:])
        finally:
            shutil.rmtree(work, ignore_errors=True)


def t_freeze_once():
    """A second freeze must refuse rather than overwrite the one checkpoint."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        work = _tiny_project("~/cnp0-selftest-freeze")
        try:
            _freeze_ready_round(probe, work)
            json.dump({"tree_sha256": "x"},
                      open(os.path.join(probe, "provenance", "freeze.json"), "w"))
            r = _run(probe, "freeze.py", "--workdir", work)
            blob = r.stdout + r.stderr
            ok = r.returncode != 0 and "already exists" in blob
            record("freeze-once", 1, ok,
                   "refused a second freeze" if ok else blob[-200:])
        finally:
            shutil.rmtree(work, ignore_errors=True)


def t_freeze_rejects_symlink():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        work = _tiny_project("~/cnp0-selftest-symlink")
        try:
            _freeze_ready_round(probe, work)
            os.symlink("/etc/hosts", os.path.join(work, "src", "sneaky.rs"))
            r = _run(probe, "freeze.py", "--workdir", work)
            blob = r.stdout + r.stderr
            ok = r.returncode != 0 and "symlink" in blob
            record("freeze-rejects-symlink", 1, ok,
                   "refused a symlink" if ok else blob[-200:])
        finally:
            shutil.rmtree(work, ignore_errors=True)


def t_build_rewriting_a_source_is_caught():
    """A test that rewrites src/main.rs must be visible, and not freeze-ready."""
    emitted = {"src/main.rs": {"sha256": "a"}, "Cargo.toml": {"sha256": "b"}}
    final = {"src/main.rs": {"sha256": "REWRITTEN"}, "Cargo.toml": {"sha256": "b"},
             "Cargo.lock": {"sha256": "c"}}
    changed, generated = roundmod.compare_trees(emitted, final)
    ok = changed == ["src/main.rs"] and generated == ["Cargo.lock"] and \
        roundmod.compute_freeze_ready(0, {"fmt": 0, "check": 0, "build": 0, "test": 0},
                                      changed, None) is False
    record("build-rewriting-a-source-is-caught", 1, ok,
           "a rewritten source is attributed to the build, Cargo.lock is not" if ok
           else f"changed={changed} generated={generated}")


def t_failed_generation_is_never_freeze_ready():
    ok = roundmod.compute_freeze_ready(
        1, {"fmt": 0, "check": 0, "build": 0, "test": 0}, [], None) is False
    record("failed-generation-not-freeze-ready", 1, ok,
           "a non-zero model exit can never be freeze-ready" if ok
           else "a failed generation was treated as freeze-ready")


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


def t_tree_refuses_build_script():
    expect_raises("tree-refuses-build-script", 1,
                  lambda: tree.check_emitted(["Cargo.toml", "build.rs"]),
                  "build script")


def t_tree_refuses_cargo_config():
    expect_raises("tree-refuses-cargo-config", 1,
                  lambda: tree.check_emitted(["Cargo.toml", ".cargo/config.toml"]),
                  "configures cargo")


def t_tree_refuses_duplicate_block():
    expect_raises("tree-refuses-duplicate-file", 1,
                  lambda: tree.check_emitted(["Cargo.toml", "src/main.rs", "src/main.rs"]),
                  "more than once")


def t_tree_refuses_escape():
    expect_raises("tree-refuses-path-escape", 1,
                  lambda: tree.check_emitted(["Cargo.toml", "../outside.rs"]),
                  "escapes the working directory")


def t_stale_pack_refused():
    """A capsule edited after pinning must stop both round and freeze."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        with open(os.path.join(probe, "capsule", "TASK.md"), "a", encoding="utf-8") as fh:
            fh.write("\nan edit made after the pin\n")
        r = _run(probe, "round.py", "--workdir", os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        f = _run(probe, "freeze.py", "--workdir", os.path.expanduser("~/cnp0-selftest-workdir"))
        blob = r.stdout + r.stderr + f.stdout + f.stderr
        ok = r.returncode != 0 and f.returncode != 0 and "since the pack was pinned" in blob
        record("stale-pack-refused", 1, ok,
               "both refused a stale pack" if ok else blob[-200:])


def _round_record(probe: str, n: int, **fields) -> None:
    tdir = os.path.join(probe, "provenance", "transcript")
    os.makedirs(os.path.join(tdir, f"round-{n:02d}"), exist_ok=True)
    rec = {"round": n, "model_exit": 0, "compiles": False, "freeze_ready": False}
    rec.update(fields)
    json.dump(rec, open(os.path.join(tdir, f"round-{n:02d}.json"), "w"))
    if fields.get("with_cargo", True):
        open(os.path.join(tdir, f"round-{n:02d}", "cargo.txt"), "w").write("output\n")


def t_no_round_after_freeze_ready():
    """Rounds end when a candidate is freeze-ready, not when one merely compiles."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        _round_record(probe, 1, compiles=True, freeze_ready=True)
        r = _run(probe, "round.py", "--workdir",
                 os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "freeze-ready" in blob
        record("no-round-after-freeze-ready", 1, ok,
               "refused a round once a candidate was freeze-ready" if ok else blob[-200:])


def t_check_passed_test_failed_allows_next_round():
    """cargo check green but test red must leave a way forward, not a deadlock.

    This was a real deadlock: the next round was blocked on `compiles`, and the
    freeze required `freeze_ready`, so a candidate that compiled and failed its
    tests could do neither.
    """
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        _round_record(probe, 1, compiles=True, freeze_ready=False,
                      cargo={"fmt": 0, "check": 0, "build": 0, "test": 101})
        r = _run(probe, "round.py", "--workdir",
                 os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob = r.stdout + r.stderr
        ok = r.returncode == 0 and "round 2" in blob
        record("check-passed-test-failed-allows-next-round", 1, ok,
               "a compiling but failing round leaves round 2 available" if ok
               else blob[-200:])


def t_third_not_ready_records_inconclusive():
    """A third round that compiles but is not freeze-ready must end the experiment."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        for i in (1, 2):
            _round_record(probe, i, compiles=True, freeze_ready=False)
        r = _run(probe, "round.py", "--workdir",
                 os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        # The third round is permitted; the outcome is written when it ends.
        permitted = r.returncode == 0 and "round 3" in (r.stdout + r.stderr)
        _round_record(probe, 3, compiles=True, freeze_ready=False)
        r4 = _run(probe, "round.py", "--workdir",
                  os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob4 = r4.stdout + r4.stderr
        no_fourth = r4.returncode != 0 and "no fourth round" in blob4
        ok = permitted and no_fourth
        record("third-not-ready-records-inconclusive", 1, ok,
               "a third non-ready round is the last one" if ok
               else f"permitted={permitted} no_fourth={no_fourth}: {blob4[-160:]}")


def t_failed_generation_does_not_deadlock_budget():
    """A round that never reached cargo must still allow the next one."""
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        _round_record(probe, 1, model_exit=1, freeze_ready=False,
                      error="the model exited 1", with_cargo=False)
        r = _run(probe, "round.py", "--workdir",
                 os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob = r.stdout + r.stderr
        ok = r.returncode == 0 and "round 2" in blob and "feedback carried: none" in blob
        record("failed-generation-does-not-deadlock-budget", 1, ok,
               "a failed generation leaves round 2 available, with no feedback to carry"
               if ok else blob[-200:])


def t_no_round_after_freeze():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        json.dump({"tree_sha256": "x"},
                  open(os.path.join(probe, "provenance", "freeze.json"), "w"))
        r = _run(probe, "round.py", "--workdir", os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "a freeze exists" in blob
        record("no-round-after-freeze", 1, ok,
               "refused a round after the freeze" if ok else blob[-200:])


def t_no_fourth_round():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        tdir = os.path.join(probe, "provenance", "transcript")
        os.makedirs(tdir)
        for i in (1, 2, 3):
            json.dump({"round": i, "compiles": False},
                      open(os.path.join(tdir, f"round-{i:02d}.json"), "w"))
            os.makedirs(os.path.join(tdir, f"round-{i:02d}"), exist_ok=True)
            open(os.path.join(tdir, f"round-{i:02d}", "cargo.txt"), "w").write("err\n")
        r = _run(probe, "round.py", "--workdir", os.path.expanduser("~/cnp0-selftest-workdir"), "--dry-run")
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "no fourth round" in blob
        record("no-fourth-round", 1, ok,
               "refused a fourth round" if ok else blob[-200:])


def t_evaluate_requires_freeze():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        r = _run(probe, "evaluate.py")
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "there is no freeze" in blob
        record("evaluate-requires-freeze", 1, ok,
               "refused to score without a freeze" if ok else blob[-200:])


def t_evaluate_detects_tampered_tree():
    with tempfile.TemporaryDirectory() as tmp:
        probe = _fake_probe(tmp)
        cand = os.path.join(probe, "candidate", "src")
        os.makedirs(cand)
        open(os.path.join(probe, "candidate", "Cargo.toml"), "w").write("[package]\n")
        open(os.path.join(cand, "main.rs"), "w").write("fn main(){}\n")
        pack = json.load(open(os.path.join(probe, "provenance", "pack.json")))
        json.dump({"tree_sha256": "0" * 64, "pack_sha256": pack["pack_sha256"]},
                  open(os.path.join(probe, "provenance", "freeze.json"), "w"))
        r = _run(probe, "evaluate.py")
        blob = r.stdout + r.stderr
        ok = r.returncode != 0 and "has changed since it was frozen" in blob
        record("evaluate-detects-tampered-tree", 1, ok,
               "refused a tree that no longer matches the freeze" if ok else blob[-200:])


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
               t_freeze_requires_transcript, t_freeze_refuses_not_ready,
               t_freeze_refuses_failed_generation, t_freeze_detects_edit_after_round,
               t_freeze_once, t_freeze_rejects_symlink,
               t_build_rewriting_a_source_is_caught,
               t_failed_generation_is_never_freeze_ready, t_capsule_verbatim,
               t_stale_capsule_detected, t_pack_leak_check, t_workdir_inside_trinity,
               t_tree_refuses_build_script, t_tree_refuses_cargo_config,
               t_tree_refuses_duplicate_block, t_tree_refuses_escape,
               t_stale_pack_refused, t_no_round_after_freeze_ready,
               t_check_passed_test_failed_allows_next_round,
               t_third_not_ready_records_inconclusive,
               t_failed_generation_does_not_deadlock_budget, t_no_round_after_freeze,
               t_no_fourth_round, t_evaluate_requires_freeze,
               t_evaluate_detects_tampered_tree, t_sandbox_isolation):
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
