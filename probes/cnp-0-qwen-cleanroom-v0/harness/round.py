#!/usr/bin/env python3
"""One proctored round: prompt the model, write what it emitted, build in the sandbox.

The proctor carries text one way and machine output the other. This script is
written so it cannot quietly do more:

* the prompt is the pinned pack, plus — from round 2 — the previous round's
  cargo output and nothing else. There is no way to hand it an arbitrary file;
  an earlier version took `--feedback <path>` and a reviewer fed it a contract,
  which is exactly the leak the clean room exists to prevent;
* what it writes is what it extracted, byte for byte, digested before anything
  touches it. `cargo fmt` runs as `--check`, never as a rewrite;
* every command runs in the sandbox of `sandbox.py`: no network, no host
  filesystem, pinned image;
* at most three rounds before the freeze.

Usage:
    python3 harness/round.py --workdir ~/cnp0-cleanroom
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time

import pack as packmod
import sandbox
import tree

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRANSCRIPT = os.path.join(HERE, "provenance", "transcript")

PACK_FILES = ["capsule/SPEC.md", "capsule/INTERFACE.md", "capsule/EXAMPLES.ndjson",
              "capsule/TASK.md"]
EXPECTED_MODEL_ID = "5642e97495e1"
MAX_PRE_FREEZE_ROUNDS = 3
FILE_BLOCK = re.compile(
    r"^FILE:\s*(?P<path>[A-Za-z0-9_./-]+)\s*\n+```[a-zA-Z]*\n(?P<body>.*?)\n```",
    re.M | re.S,
)


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def live_model_id(model: str) -> str | None:
    """The id ollama will actually serve, read now rather than trusted from a note."""
    proc = subprocess.run(["ollama", "list"], capture_output=True, text=True)
    for line in proc.stdout.splitlines():
        parts = line.split()
        if parts and parts[0] == model:
            return parts[1] if len(parts) > 1 else None
    return None


def rounds_so_far() -> list[dict]:
    os.makedirs(TRANSCRIPT, exist_ok=True)
    out = []
    for name in sorted(os.listdir(TRANSCRIPT)):
        if re.fullmatch(r"round-\d+\.json", name):
            out.append(json.load(open(os.path.join(TRANSCRIPT, name))))
    return out


def previous_feedback(prior: list[dict]) -> tuple[str | None, str | None]:
    """The ONLY feedback channel before the freeze: the last round's cargo output.

    Absence is not evidence of a pre-cargo failure. Treating it that way was a
    bypass: a recorded `cargo.txt` could simply be deleted and the next round ran
    with no feedback and no complaint. So absence is legal only when the record
    itself says cargo never ran — no digest, no exits, and an error on the record.
    """
    if not prior:
        return None, None
    last = prior[-1]
    n = last["round"]
    path = os.path.join(TRANSCRIPT, f"round-{n:02d}", "cargo.txt")
    recorded = last.get("cargo_output_sha256")
    exits = last.get("cargo")
    reached_cargo = bool(recorded) or bool(exits)

    if not os.path.exists(path):
        if reached_cargo:
            raise SystemExit(
                f"round {n} recorded cargo output"
                + (f" (sha256 {recorded})" if recorded else f" (exits {exits})")
                + f" but {path} is gone.\n"
                "The pre-freeze feedback channel is the only thing carried between "
                "rounds; a missing record of it is a refusal, not an empty channel."
            )
        if not last.get("error"):
            raise SystemExit(
                f"round {n} has no cargo output and no recorded error explaining "
                "why cargo never ran. Refusing to proceed on an unexplained gap."
            )
        return None, None  # a genuine pre-cargo failure, recorded as one

    data = open(path, "rb").read()
    digest = sha(data)
    if not recorded:
        raise SystemExit(
            f"round {n} has a cargo.txt but recorded no digest for it. Feedback "
            "must be pinned when it is produced, or it cannot be checked later."
        )
    if recorded != digest:
        raise SystemExit(
            f"round {n} cargo output has been modified since it was produced\n"
            f"  recorded {recorded}\n  now      {digest}\n"
            "The pre-freeze feedback channel carries machine output only; refusing."
        )
    return data.decode("utf-8", "replace"), digest


def build_prompt(feedback: str | None) -> str:
    parts = [
        "You are implementing a specification from scratch. Everything you are "
        "given follows. There is no other source to consult.\n",
    ]
    for rel in PACK_FILES:
        body = open(os.path.join(HERE, rel), encoding="utf-8").read()
        parts.append(f"\n===== {os.path.basename(rel)} =====\n{body}\n")
    if feedback:
        parts.append(
            "\n===== BUILD OUTPUT FROM THE LAST ROUND =====\n"
            "This is compiler and test output, verbatim. No one has reviewed your "
            "design, and no one will.\n\n" + feedback + "\n"
        )
    parts.append(
        "\n===== NOW =====\nEmit the complete set of files, each preceded by its "
        "`FILE: <path>` line and given whole inside a fenced block.\n"
    )
    return "".join(parts)


def extract_files(output: str) -> list[tuple[str, str]]:
    """A LIST, not a dict: two blocks for one path must be visible, not silently
    resolved in favour of the last one."""
    return [(m.group("path"), m.group("body")) for m in FILE_BLOCK.finditer(output)]


def assert_pack_is_current() -> str:
    """The prompt is built from the capsule files; the pin must describe them.

    An earlier version read the capsule live and the digest from pack.json
    without comparing them, so a future run could have recorded a pin that
    described a pack it never sent.
    """
    recorded = json.load(open(os.path.join(HERE, "provenance", "pack.json")))
    problems = packmod.leak_check()
    if problems:
        raise SystemExit("the capsule leaks:\n  " + "\n  ".join(problems))
    current = packmod.build()
    if current["pack_sha256"] != recorded["pack_sha256"]:
        raise SystemExit(
            "the capsule has changed since the pack was pinned:\n"
            f"  pinned  {recorded['pack_sha256']}\n"
            f"  current {current['pack_sha256']}\n"
            "Re-pin deliberately with `python3 harness/pack.py --write`; a prompt "
            "must not be recorded under a digest that does not describe it."
        )
    return current["pack_sha256"]


OUTCOME = os.path.join(HERE, "provenance", "outcome.json")
FREEZE = os.path.join(HERE, "provenance", "freeze.json")

INCONCLUSIVE = (
    "INCONCLUSIVE: no freeze-ready candidate within the agreed three-round "
    "model/capsule/tooling budget; not evidence of RFC failure"
)


def compare_trees(emitted: dict, final: dict) -> tuple[list[str], list[str]]:
    """What the build changed, split into what cargo may change and what it may not.

    Cargo writes `Cargo.lock` itself, so that one is attributed rather than
    counted as tampering. Anything else appearing, changing, or vanishing means
    the tree that was measured is not the tree the model emitted.
    """
    changed, cargo_generated = [], []
    for rel, meta in final.items():
        before = emitted.get(rel)
        if before is None or before["sha256"] != meta["sha256"]:
            (cargo_generated if rel == "Cargo.lock" else changed).append(rel)
    for rel in emitted:
        if rel not in final:
            changed.append(rel)
    return sorted(set(changed)), sorted(set(cargo_generated))


def compute_freeze_ready(model_exit, exits: dict, modified: list, tree_error) -> bool:
    """Freeze-ready means all four cargo commands clean, the generation itself
    succeeded, and the build rewrote nothing of the model's."""
    return (
        model_exit == 0
        and all(exits.get(sub) == 0 for sub in ("fmt", "check", "build", "test"))
        and not modified
        and not tree_error
    )


def finish(record: dict, n: int, prior: list[dict]) -> int:
    """Write the round record, and the outcome if the budget is now spent.

    Every way a round can end goes through here. An earlier version wrote
    INCONCLUSIVE only when the third round failed to COMPILE, so a third round
    that compiled but failed `test` — or that never reached cargo at all —
    left the experiment with no outcome and no legal next step. A state machine
    with a state nobody can leave is worse than one that ends badly.
    """
    json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
              indent=2, sort_keys=True)
    if record.get("freeze_ready"):
        return 0
    if n >= MAX_PRE_FREEZE_ROUNDS:
        digests = [r.get("output_sha256") for r in prior] + [record.get("output_sha256")]
        write_outcome("INCONCLUSIVE", INCONCLUSIVE, n, digests)
        print(f"  budget spent after {n} rounds with no freeze-ready candidate.")
        print(f"  recorded: {INCONCLUSIVE}")
        print("  There is no fourth round, and this is not a claim about the "
              "specification.")
    return 0


def write_outcome(status: str, detail: str, rounds: int,
                  round_output_digests: list | None = None) -> None:
    if os.path.exists(OUTCOME):
        return  # an outcome is written once
    json.dump(
        {"status": status, "detail": detail, "rounds": rounds,
         "round_output_sha256": round_output_digests or [],
         "recorded": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
        open(OUTCOME, "w"), indent=2, sort_keys=True,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--model", default="qwen3.8:27b-mlx")
    ap.add_argument("--dry-run", action="store_true",
                    help="build and digest the prompt without calling the model")
    args = ap.parse_args()

    workdir = os.path.realpath(os.path.expanduser(args.workdir))

    # The protocol refusals come FIRST, deliberately. They are the ones that
    # decide whether a round may happen at all, and they must not depend on
    # Docker being installed: a budget check that only works where the sandbox
    # works is a budget check that silently stops being enforced.
    pack_sha = assert_pack_is_current()

    if os.path.exists(FREEZE):
        raise SystemExit(
            "a freeze exists: the candidate is fixed and rounds are over. Anything "
            "after the freeze is informed by the corpus and is not clean-room in "
            "the same sense."
        )
    if os.path.exists(OUTCOME):
        rec = json.load(open(OUTCOME))
        raise SystemExit(f"an outcome is already recorded: {rec['status']}")

    prior = rounds_so_far()
    if any(r.get("freeze_ready") for r in prior):
        raise SystemExit(
            "a previous round is freeze-ready. The only next step is the freeze — "
            "a further prompt round would be tuning the candidate before it is "
            "pinned, which is the thing the freeze exists to prevent:\n"
            f"    python3 harness/freeze.py --workdir {workdir}"
        )
    n = len(prior) + 1
    if n > MAX_PRE_FREEZE_ROUNDS:
        # The budget is spent. If the process died between recording the last
        # round and writing the outcome, reconstruct it here: the outcome is a
        # function of the rounds, so it is deterministic, and leaving it unwritten
        # would let a crash erase the experiment's conclusion.
        if not os.path.exists(OUTCOME):
            write_outcome("INCONCLUSIVE", INCONCLUSIVE, len(prior),
                          [r.get("output_sha256") for r in prior])
            print(f"recovered the outcome that was never written: {INCONCLUSIVE}")
        raise SystemExit(
            f"the agreed budget is {MAX_PRE_FREEZE_ROUNDS} rounds and they are "
            "spent. The recorded outcome is INCONCLUSIVE; there is no fourth round."
        )

    feedback, feedback_sha = previous_feedback(prior)
    prompt = build_prompt(feedback)

    record = {
        "round": n,
        "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": args.model,
        "model_id_expected": EXPECTED_MODEL_ID,
        "pack_sha256": pack_sha,
        "prompt_sha256": sha(prompt.encode("utf-8")),
        "prompt_bytes": len(prompt.encode("utf-8")),
        "feedback_sha256": feedback_sha,
        "workdir": workdir,
        "image": sandbox.IMAGE,
    }

    if args.dry_run:
        record["dry_run"] = True
        print(f"dry run: round {n}, prompt {record['prompt_bytes']} bytes, "
              f"sha256 {record['prompt_sha256']}")
        print(f"feedback carried: {'the previous cargo output' if feedback else 'none'}")
        return 0

    # Only now does the sandbox matter: from here on something actually runs.
    workdir = sandbox.preflight(workdir)
    record["workdir"] = workdir

    live = live_model_id(args.model)
    record["model_id_live"] = live
    if live != EXPECTED_MODEL_ID:
        raise SystemExit(
            f"model id mismatch: {args.model} is {live}, expected "
            f"{EXPECTED_MODEL_ID}. A tag can be repointed; refusing to attribute a "
            "result to a model that is not the one recorded."
        )

    started = time.time()
    proc = subprocess.run(
        ["ollama", "run", "--think", "high", "--hidethinking", args.model],
        input=prompt, capture_output=True, text=True,
    )
    output = proc.stdout
    record["elapsed_s"] = round(time.time() - started, 1)
    record["output_sha256"] = sha(output.encode("utf-8"))
    record["output_bytes"] = len(output.encode("utf-8"))
    record["model_exit"] = proc.returncode

    raw_dir = os.path.join(TRANSCRIPT, f"round-{n:02d}")
    os.makedirs(raw_dir, exist_ok=True)
    open(os.path.join(raw_dir, "prompt.txt"), "w", encoding="utf-8").write(prompt)
    open(os.path.join(raw_dir, "output.txt"), "w", encoding="utf-8").write(output)

    if proc.returncode != 0:
        record["error"] = f"the model exited {proc.returncode}"
        record["freeze_ready"] = False
        print(f"round {n}: the model exited {proc.returncode}; nothing was written.")
        return finish(record, n, prior)

    emitted = extract_files(output)
    try:
        tree.check_emitted([rel for rel, _ in emitted])
    except tree.TreeError as exc:
        record["error"] = f"refused emitted tree: {exc}"
        record["freeze_ready"] = False
        print(f"round {n}: {exc}")
        return finish(record, n, prior)

    # Everything the model does not emit is gone, including cargo's own caches:
    # a stale `.cargo` could carry configuration that shapes a later build and
    # never appears in the frozen tree.
    for entry in os.listdir(workdir):
        if entry == "target":
            continue
        p = os.path.join(workdir, entry)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

    written = {}
    for rel, body in emitted:
        dest = os.path.join(workdir, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        data = (body + "\n").encode("utf-8")
        with open(dest, "wb") as fh:
            fh.write(data)
        written[rel] = {"bytes": len(data), "sha256": sha(data)}
    record["written"] = written
    tree.assert_no_build_hooks(workdir)
    emitted_sha, emitted_manifest = tree.digest(
        [(rel, open(os.path.join(workdir, rel), "rb").read()) for rel in sorted(written)]
    )
    record["emitted_tree_sha256"] = emitted_sha

    if not sandbox.mount_is_visible(workdir):
        record["error"] = "the workdir is not visible inside the sandbox"
        record["freeze_ready"] = False
        json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
                  indent=2, sort_keys=True)
        raise SystemExit(
            "the sandbox mounted an empty directory, so any build failure would be "
            "the harness's fault and not the model's. On Docker Desktop this means "
            f"{workdir} is not a shared path. Refusing to report a false result."
        )

    cargo_out = []
    exits = {}
    for sub in ("fmt", "check", "build", "test"):
        code, out = sandbox.cargo(workdir, sub)
        exits[sub] = code
        cargo_out.append(f"$ cargo {sub}  (exit {code})\n{out}\n")
        if sub == "check" and code != 0:
            break  # build and test say nothing about code that does not compile
    record["cargo"] = exits
    record["compiles"] = exits.get("check") == 0

    # What cargo left behind. A test can rewrite a source file, and then the tree
    # that was measured is not the tree the model emitted — so the comparison is
    # made rather than assumed.
    try:
        after = tree.collect(workdir)
        record.pop("tree_error", None)
    except tree.TreeError as exc:
        record["tree_error"] = f"the tree is not admissible after the build: {exc}"
        after = []
    final_sha, final_manifest = tree.digest(after)
    record["final_tree_sha256"] = final_sha
    record["final_tree"] = final_manifest

    changed, cargo_generated = compare_trees(emitted_manifest, final_manifest)
    record["cargo_generated"] = cargo_generated
    record["modified_by_build"] = changed
    record["freeze_ready"] = compute_freeze_ready(
        record.get("model_exit"), exits, changed, record.get("tree_error")
    )

    cargo_text = "\n".join(cargo_out)
    cargo_path = os.path.join(raw_dir, "cargo.txt")
    open(cargo_path, "w", encoding="utf-8").write(cargo_text)
    record["cargo_output_sha256"] = sha(cargo_text.encode("utf-8"))

    print(f"round {n}/{MAX_PRE_FREEZE_ROUNDS}: {len(written)} file(s), "
          f"compiles={record['compiles']}, freeze_ready={record['freeze_ready']}, "
          f"{record['elapsed_s']}s")
    print(f"  transcript {os.path.relpath(raw_dir, HERE)}")
    if record["modified_by_build"]:
        print(f"  the build modified {record['modified_by_build']}, so the tree "
              "measured is not the tree emitted; not freeze-ready")
    if record["freeze_ready"]:
        print("  FREEZE-READY — fmt, check, build and test all clean:")
        print(f"    python3 harness/freeze.py --workdir {workdir}")
    elif n < MAX_PRE_FREEZE_ROUNDS:
        print("  not freeze-ready; the next round carries this cargo output "
              "automatically. No flag, no other file can be fed in.")
    return finish(record, n, prior)


if __name__ == "__main__":
    sys.exit(main())
