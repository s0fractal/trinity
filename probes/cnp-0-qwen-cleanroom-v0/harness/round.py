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

import sandbox

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

    Its digest was recorded when that round ran, and it is re-checked here, so a
    file edited between rounds cannot enter the prompt unnoticed.
    """
    if not prior:
        return None, None
    last = prior[-1]
    n = last["round"]
    path = os.path.join(TRANSCRIPT, f"round-{n:02d}", "cargo.txt")
    if not os.path.exists(path):
        raise SystemExit(f"round {n} recorded no cargo output at {path}")
    data = open(path, "rb").read()
    digest = sha(data)
    recorded = last.get("cargo_output_sha256")
    if recorded and recorded != digest:
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


def extract_files(output: str) -> dict[str, str]:
    return {m.group("path"): m.group("body") for m in FILE_BLOCK.finditer(output)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--model", default="qwen3.8:27b-mlx")
    ap.add_argument("--dry-run", action="store_true",
                    help="build and digest the prompt without calling the model")
    args = ap.parse_args()

    workdir = sandbox.preflight(args.workdir)

    prior = rounds_so_far()
    n = len(prior) + 1
    if n > MAX_PRE_FREEZE_ROUNDS and not os.path.exists(
        os.path.join(HERE, "provenance", "freeze.json")
    ):
        raise SystemExit(
            f"round {n} would exceed the agreed limit of {MAX_PRE_FREEZE_ROUNDS} "
            "rounds before the freeze. Freeze what exists, or record a new agreement."
        )

    feedback, feedback_sha = previous_feedback(prior)
    prompt = build_prompt(feedback)
    pack = json.load(open(os.path.join(HERE, "provenance", "pack.json")))

    record = {
        "round": n,
        "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": args.model,
        "model_id_expected": EXPECTED_MODEL_ID,
        "pack_sha256": pack["pack_sha256"],
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

    files = extract_files(output)
    if not files:
        record["error"] = "no FILE: blocks in the model output"
        json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
                  indent=2, sort_keys=True)
        print("no FILE: blocks found; nothing written. See the transcript.")
        return 1

    for entry in os.listdir(workdir):
        if entry in ("target", ".cargo"):
            continue
        p = os.path.join(workdir, entry)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

    written = {}
    for rel, body in files.items():
        if rel.startswith("/") or ".." in rel.split("/"):
            record.setdefault("refused_paths", []).append(rel)
            continue
        dest = os.path.join(workdir, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        data = (body + "\n").encode("utf-8")
        with open(dest, "wb") as fh:
            fh.write(data)
        written[rel] = {"bytes": len(data), "sha256": sha(data)}
    record["written"] = written

    if not sandbox.mount_is_visible(workdir):
        record["error"] = "the workdir is not visible inside the sandbox"
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
            break
    record["cargo"] = exits
    record["compiles"] = exits.get("check") == 0

    cargo_text = "\n".join(cargo_out)
    cargo_path = os.path.join(raw_dir, "cargo.txt")
    open(cargo_path, "w", encoding="utf-8").write(cargo_text)
    record["cargo_output_sha256"] = sha(cargo_text.encode("utf-8"))

    json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
              indent=2, sort_keys=True)

    print(f"round {n}/{MAX_PRE_FREEZE_ROUNDS}: {len(written)} file(s), "
          f"compiles={record['compiles']}, {record['elapsed_s']}s")
    print(f"  transcript {os.path.relpath(raw_dir, HERE)}")
    if record["compiles"]:
        print("  IT COMPILES — freeze before the corpus is run:")
        print(f"    python3 harness/freeze.py --workdir {workdir}")
    else:
        print("  next round carries this cargo output automatically; no flag, "
              "no other file can be fed in")
    return 0


if __name__ == "__main__":
    sys.exit(main())
