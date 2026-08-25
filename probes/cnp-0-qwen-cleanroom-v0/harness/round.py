#!/usr/bin/env python3
"""One proctored round: prompt the model, write what it emitted, run cargo.

The proctor's whole job is to carry text in one direction and compiler output in
the other. This script is written so that it CANNOT do more than that:

* it writes only files it extracted from the model's output, byte for byte, and
  records a digest of each one;
* it never edits, patches, formats, or completes what it wrote;
* the only commands it runs in the working directory are `cargo fmt`,
  `cargo check`, `cargo build`, and `cargo test`;
* the working directory must be outside the Trinity checkout, and the script
  refuses to run if it is not.

Usage:
    python3 harness/round.py --workdir ~/cnp0-cleanroom [--model qwen3.8:27b-mlx]
    python3 harness/round.py --workdir ~/cnp0-cleanroom --feedback path.txt
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

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRINITY = os.path.normpath(os.path.join(HERE, "..", ".."))
TRANSCRIPT = os.path.join(HERE, "provenance", "transcript")

PACK_FILES = ["capsule/SPEC.md", "capsule/INTERFACE.md", "capsule/EXAMPLES.ndjson",
              "capsule/TASK.md"]
CARGO_ALLOWED = {"fmt", "check", "build", "test"}
FILE_BLOCK = re.compile(
    r"^FILE:\s*(?P<path>[A-Za-z0-9_./-]+)\s*\n+```[a-zA-Z]*\n(?P<body>.*?)\n```",
    re.M | re.S,
)


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def refuse_if_inside_trinity(workdir: str) -> None:
    real_work = os.path.realpath(workdir)
    real_trinity = os.path.realpath(TRINITY)
    if real_work == real_trinity or real_work.startswith(real_trinity + os.sep):
        sys.exit(
            f"refusing: the working directory {real_work} is inside the Trinity "
            f"checkout {real_trinity}. The point of the exercise is that the model "
            "never sees this repository."
        )


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
            "\n===== OUTPUT FROM THE LAST ROUND =====\n"
            "This is compiler and test output. No one has corrected your design.\n\n"
            + feedback + "\n"
        )
    parts.append(
        "\n===== NOW =====\nEmit the complete set of files, each preceded by its "
        "`FILE: <path>` line and given whole inside a fenced block.\n"
    )
    return "".join(parts)


def extract_files(output: str) -> dict[str, str]:
    return {m.group("path"): m.group("body") for m in FILE_BLOCK.finditer(output)}


def run_cargo(workdir: str, sub: str) -> tuple[int, str]:
    if sub not in CARGO_ALLOWED:
        raise ValueError(f"cargo {sub} is not an allowed command")
    proc = subprocess.run(
        ["cargo", sub] + (["--release"] if sub == "build" else []),
        cwd=workdir, capture_output=True, text=True,
    )
    return proc.returncode, (proc.stdout + proc.stderr)[-20000:]


def next_round_number() -> int:
    os.makedirs(TRANSCRIPT, exist_ok=True)
    existing = [f for f in os.listdir(TRANSCRIPT) if re.fullmatch(r"round-\d+\.json", f)]
    return len(existing) + 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--model", default="qwen3.8:27b-mlx")
    ap.add_argument("--feedback", help="file holding the previous round's output")
    ap.add_argument("--dry-run", action="store_true",
                    help="build and record the prompt without calling the model")
    args = ap.parse_args()

    workdir = os.path.expanduser(args.workdir)
    refuse_if_inside_trinity(workdir)
    os.makedirs(workdir, exist_ok=True)

    feedback = open(args.feedback, encoding="utf-8").read() if args.feedback else None
    prompt = build_prompt(feedback)
    prompt_sha = sha(prompt.encode("utf-8"))
    pack = json.load(open(os.path.join(HERE, "provenance", "pack.json")))

    n = next_round_number()
    record = {
        "round": n,
        "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": args.model,
        "pack_sha256": pack["pack_sha256"],
        "prompt_sha256": prompt_sha,
        "prompt_bytes": len(prompt.encode("utf-8")),
        "workdir": workdir,
        "feedback_sha256": sha(feedback.encode("utf-8")) if feedback else None,
    }

    if args.dry_run:
        record["dry_run"] = True
        path = os.path.join(TRANSCRIPT, f"round-{n:02d}.json")
        json.dump(record, open(path, "w"), indent=2, sort_keys=True)
        print(f"dry run: prompt {len(prompt)} chars, sha256 {prompt_sha}")
        print(f"recorded {os.path.relpath(path, HERE)}")
        return 0

    started = time.time()
    proc = subprocess.run(["ollama", "run", args.model], input=prompt,
                          capture_output=True, text=True)
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
        record["error"] = "the model's output contained no FILE: blocks"
        json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
                  indent=2, sort_keys=True)
        print("no FILE: blocks found; nothing was written. See the transcript.")
        return 1

    # Replace the source tree with exactly what was emitted. `target/` survives so
    # cargo does not rebuild the world each round.
    for entry in os.listdir(workdir):
        if entry == "target":
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

    cargo = {}
    for sub in ("fmt", "check", "test"):
        code, out = run_cargo(workdir, sub)
        cargo[sub] = {"exit": code, "output": out}
        if sub == "check" and code != 0:
            break  # no point testing what does not compile
    record["cargo"] = {k: v["exit"] for k, v in cargo.items()}
    record["compiles"] = cargo.get("check", {}).get("exit") == 0

    feedback_path = os.path.join(raw_dir, "cargo.txt")
    with open(feedback_path, "w", encoding="utf-8") as fh:
        for sub, res in cargo.items():
            fh.write(f"$ cargo {sub}  (exit {res['exit']})\n{res['output']}\n\n")

    json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
              indent=2, sort_keys=True)

    print(f"round {n}: {len(written)} file(s) written, "
          f"compiles={record['compiles']}, {record['elapsed_s']}s")
    print(f"  transcript  {os.path.relpath(raw_dir, HERE)}")
    print(f"  next feedback: --feedback {os.path.relpath(feedback_path, os.getcwd())}")
    if record["compiles"]:
        print("  IT COMPILES — freeze this before running the corpus:")
        print("    python3 harness/freeze.py --workdir " + workdir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
