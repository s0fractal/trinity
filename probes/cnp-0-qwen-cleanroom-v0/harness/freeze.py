#!/usr/bin/env python3
"""Freeze the first compiling candidate before it meets the corpus.

The freeze exists so that "it was written from the specification alone" stays
checkable. Once the corpus has spoken, every later revision is informed by it;
the frozen tree is the only version of which nothing corpus-shaped is true.

Copies the candidate's source out of the working directory into `candidate/`,
records a digest per file and one over the set, and refuses to overwrite an
existing freeze.

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
import time

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(HERE, "candidate")

SKIP_DIRS = {"target", ".git"}


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--force", action="store_true",
                    help="replace an existing freeze (records that it happened)")
    args = ap.parse_args()
    workdir = os.path.expanduser(args.workdir)

    if os.path.exists(DEST) and not args.force:
        sys.exit(
            f"refusing: {os.path.relpath(DEST, HERE)} already exists. A freeze is "
            "meant to happen once, before the corpus is run. Pass --force only if "
            "you mean to record a re-freeze."
        )

    files: dict[str, dict] = {}
    joined = b""
    for root, dirs, names in os.walk(workdir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in sorted(names):
            src = os.path.join(root, name)
            rel = os.path.relpath(src, workdir)
            data = open(src, "rb").read()
            dst = os.path.join(DEST, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            files[rel] = {"bytes": len(data), "sha256": sha(data)}
            joined += data

    if not files:
        sys.exit(f"refusing: nothing to freeze in {workdir}")

    pack = json.load(open(os.path.join(HERE, "provenance", "pack.json")))
    record = {
        "frozen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "workdir": workdir,
        "pack_sha256": pack["pack_sha256"],
        "files": files,
        "tree_sha256": sha(joined),
        "corpus_seen": False,
        "note": "Frozen before the corpus was run. Later revisions are informed by "
                "corpus feedback and are not clean-room in the same sense.",
    }
    with open(os.path.join(HERE, "provenance", "freeze.json"), "w") as fh:
        json.dump(record, fh, indent=2, sort_keys=True)

    print(f"froze {len(files)} file(s) into {os.path.relpath(DEST, HERE)}")
    print(f"  tree_sha256 {record['tree_sha256']}")
    print("  commit this now, as its own commit, before running the corpus:")
    print("    git add probes/cnp-0-qwen-cleanroom-v0/candidate "
          "probes/cnp-0-qwen-cleanroom-v0/provenance")
    return 0


if __name__ == "__main__":
    sys.exit(main())
