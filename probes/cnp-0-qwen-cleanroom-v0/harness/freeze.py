#!/usr/bin/env python3
"""Freeze the first compiling candidate before it meets the corpus.

The freeze is what makes "written from the specification alone" checkable. Once
the corpus has spoken, every later revision is informed by it; the frozen tree
is the only version of which nothing corpus-shaped is true.

So the freeze happens **once**. There is no `--force`: an earlier version had
one, and it overwrote the previous freeze without recording that it had, which
turns the one irreversible checkpoint in the experiment into a mutable file.

What is copied is a closed list — a Cargo manifest, Rust sources, and the
candidate's own notes. Not `target/`, not a `.cargo/config.toml` that could
redirect a later build, not symlinks, and nothing outside the working directory.

The tree digest is over `path\\n length \\n bytes` for each file in sorted path
order, so a rename, a truncation, and a byte change are all distinguishable.

Usage:
    python3 harness/freeze.py --workdir ~/cnp0-cleanroom
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import tempfile
import time

import pack as packmod
import sandbox
import tree

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(HERE, "candidate")
FREEZE_JSON = os.path.join(HERE, "provenance", "freeze.json")

def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


TRANSCRIPT = os.path.join(HERE, "provenance", "transcript")


def last_round() -> dict:
    """The round this freeze claims to be freezing.

    freeze.py used to look at no transcript at all, so it would happily freeze a
    tree no model had written — the harness's own `freeze-once` test proved it,
    by freezing an invalid Cargo.toml nobody had generated.
    """
    if not os.path.isdir(TRANSCRIPT):
        raise SystemExit(
            "refusing: there is no transcript. A freeze records the outcome of a "
            "proctored round, not the contents of a directory."
        )
    records = []
    for name in sorted(os.listdir(TRANSCRIPT)):
        if name.startswith("round-") and name.endswith(".json"):
            records.append(json.load(open(os.path.join(TRANSCRIPT, name))))
    if not records:
        raise SystemExit("refusing: the transcript holds no rounds")
    return records[-1]


def assert_pack_is_current() -> str:
    recorded = json.load(open(os.path.join(HERE, "provenance", "pack.json")))
    current = packmod.build()
    if current["pack_sha256"] != recorded["pack_sha256"]:
        raise SystemExit(
            "the capsule has changed since the pack was pinned; a freeze must "
            "record the candidate against the capsule it was actually given:\n"
            f"  pinned  {recorded['pack_sha256']}\n"
            f"  current {current['pack_sha256']}"
        )
    return current["pack_sha256"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    args = ap.parse_args()
    workdir = os.path.realpath(os.path.expanduser(args.workdir))

    round_record = last_round()
    if round_record["model_exit"] != 0:
        raise SystemExit(
            f"refusing: round {round_record['round']} recorded model_exit "
            f"{round_record['model_exit']}. A candidate whose generation failed is "
            "not a candidate."
        )
    if not round_record.get("freeze_ready"):
        raise SystemExit(
            f"refusing: round {round_record['round']} is not freeze-ready.\n"
            f"  cargo exits          {round_record.get('cargo')}\n"
            f"  modified by build    {round_record.get('modified_by_build')}\n"
            "A freeze records a candidate that formats, compiles, builds and tests "
            "cleanly, and whose sources the build did not rewrite."
        )
    if os.path.realpath(round_record["workdir"]) != workdir:
        raise SystemExit(
            f"refusing: round {round_record['round']} ran in "
            f"{round_record['workdir']}, not {workdir}"
        )

    if os.path.exists(FREEZE_JSON) or os.path.exists(DEST):
        sys.exit(
            "refusing: a freeze already exists. It happens once, before the corpus "
            "is run, and overwriting it would erase the only checkpoint at which "
            "nothing corpus-shaped was true of the candidate. To record a second "
            "candidate, give it its own probe directory."
        )

    pack_sha = assert_pack_is_current()
    if round_record["pack_sha256"] != pack_sha:
        raise SystemExit(
            "refusing: the round ran under a different pack than the one pinned now"
        )
    tree.assert_no_build_hooks(workdir)
    try:
        files = tree.collect(workdir)
    except tree.TreeError as exc:
        raise SystemExit(f"refusing: {exc}")
    tree_sha, manifest = tree.digest(files)

    if tree_sha != round_record["final_tree_sha256"]:
        raise SystemExit(
            "refusing: the tree has changed since the round that produced it\n"
            f"  after the round {round_record['final_tree_sha256']}\n"
            f"  now             {tree_sha}\n"
            "What would be frozen is not what was built and tested."
        )

    # Rebuild from nothing, without the round's target/: a tree that only builds
    # against an existing cache is not a tree that builds.
    rebuild = tempfile.mkdtemp(prefix="cnp0-freeze-", dir=os.path.expanduser("~"))
    try:
        for rel, data in files:
            dst = os.path.join(rebuild, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "wb") as fh:
                fh.write(data)
        if not sandbox.mount_is_visible(rebuild):
            raise SystemExit(f"refusing: {rebuild} is not visible inside the sandbox")
        code, out = sandbox.cargo(rebuild, "build")
        if code != 0:
            raise SystemExit(
                f"refusing: the tree does not build from a clean directory:\n{out[-3000:]}"
            )
    finally:
        shutil.rmtree(rebuild, ignore_errors=True)

    for rel, data in files:
        dst = os.path.join(DEST, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as fh:
            fh.write(data)

    record = {
        "frozen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "workdir": workdir,
        "pack_sha256": pack_sha,
        "round": round_record["round"],
        "round_prompt_sha256": round_record.get("prompt_sha256"),
        "round_output_sha256": round_record.get("output_sha256"),
        "cargo_generated": round_record.get("cargo_generated", []),
        "files": manifest,
        "tree_sha256": tree_sha,
        "tree_digest_construction": "sha256 over `path\\n length\\n bytes` per file, sorted by path",
        "corpus_seen": False,
        "note": "Frozen before the corpus was run. Later revisions are informed by "
                "corpus feedback and are not clean-room in the same sense.",
    }
    os.makedirs(os.path.dirname(FREEZE_JSON), exist_ok=True)
    json.dump(record, open(FREEZE_JSON, "w"), indent=2, sort_keys=True)

    print(f"froze {len(files)} file(s) into {os.path.relpath(DEST, HERE)}")
    print(f"  tree_sha256 {record['tree_sha256']}")
    print("  commit this now, as its own commit, before running the corpus")
    return 0


if __name__ == "__main__":
    sys.exit(main())
