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
import time

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(HERE, "candidate")
FREEZE_JSON = os.path.join(HERE, "provenance", "freeze.json")

ALLOWED_NAMES = {"Cargo.toml", "Cargo.lock", "NOTES.md", "README.md"}
ALLOWED_SUFFIX = ".rs"
MAX_FILE_BYTES = 1_000_000
MAX_FILES = 64


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def collect(workdir: str) -> list[tuple[str, bytes]]:
    """Every admissible source file, refusing anything surprising rather than skipping it."""
    out: list[tuple[str, bytes]] = []
    for root, dirs, names in os.walk(workdir):
        dirs[:] = [d for d in dirs if d not in ("target", ".cargo", ".git")]
        for name in sorted(names):
            full = os.path.join(root, name)
            rel = os.path.relpath(full, workdir)
            if os.path.islink(full):
                raise SystemExit(
                    f"refusing: {rel} is a symlink. A frozen tree must be its own bytes."
                )
            admissible = name in ALLOWED_NAMES or (
                name.endswith(ALLOWED_SUFFIX) and rel.split(os.sep)[0] in ("src", "tests")
            )
            if not admissible:
                raise SystemExit(
                    f"refusing: {rel} is outside the frozen source list "
                    f"({', '.join(sorted(ALLOWED_NAMES))}, src/**{ALLOWED_SUFFIX}, "
                    f"tests/**{ALLOWED_SUFFIX}). Nothing is silently skipped: decide "
                    "deliberately whether it belongs."
                )
            size = os.path.getsize(full)
            if size > MAX_FILE_BYTES:
                raise SystemExit(f"refusing: {rel} is {size} bytes, over the cap")
            out.append((rel, open(full, "rb").read()))
    if not out:
        raise SystemExit(f"refusing: nothing admissible to freeze in {workdir}")
    if len(out) > MAX_FILES:
        raise SystemExit(f"refusing: {len(out)} files, over the cap of {MAX_FILES}")
    return sorted(out, key=lambda kv: kv[0])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    args = ap.parse_args()
    workdir = os.path.realpath(os.path.expanduser(args.workdir))

    if os.path.exists(FREEZE_JSON) or os.path.exists(DEST):
        sys.exit(
            "refusing: a freeze already exists. It happens once, before the corpus "
            "is run, and overwriting it would erase the only checkpoint at which "
            "nothing corpus-shaped was true of the candidate. To record a second "
            "candidate, give it its own probe directory."
        )

    files = collect(workdir)

    joined = b""
    manifest: dict[str, dict] = {}
    for rel, data in files:
        joined += rel.encode("utf-8") + b"\n" + str(len(data)).encode() + b"\n" + data
        manifest[rel] = {"bytes": len(data), "sha256": sha(data)}
        dst = os.path.join(DEST, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as fh:
            fh.write(data)

    pack = json.load(open(os.path.join(HERE, "provenance", "pack.json")))
    record = {
        "frozen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "workdir": workdir,
        "pack_sha256": pack["pack_sha256"],
        "files": manifest,
        "tree_sha256": sha(joined),
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
