#!/usr/bin/env python3
"""Assemble the capsule pack and pin what the model is allowed to see.

The pack is the ONLY input the model receives. Everything about the experiment's
validity rests on that, so the pack is content-addressed: a digest over each
file and over their concatenation in a fixed order. If the pack digest recorded
in a transcript does not match the pack in the tree, the transcript describes a
different experiment.

Usage:
    python3 harness/pack.py            # print the pack manifest
    python3 harness/pack.py --write    # write provenance/pack.json
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Fixed order: the pack digest is a function of contents, not of directory
# listing order.
PACK_FILES = [
    "capsule/SPEC.md",
    "capsule/INTERFACE.md",
    "capsule/EXAMPLES.ndjson",
    "capsule/TASK.md",
]

# Everything the model must NOT see. Checked mechanically, because "we did not
# show it" is exactly the kind of claim that decays into "we do not think we
# showed it".
WITHHELD = [
    "probes/cnp-0-seed-v0/ts/cnp0.ts",
    "probes/cnp-0-seed-v0/ts/jcs.ts",
    "probes/cnp-0-seed-v0/ts/reject.ts",
    "probes/cnp-0-seed-v0/ts/transforms.ts",
    "probes/cnp-0-seed-v0/tools/jcs_py.py",
    "probes/cnp-0-seed-v0/tools/build_manifest.py",
    "probes/cnp-0-seed-v0/corpus/manifest.json",
    "contracts/CANONICAL_ENCODING.v0.1.md",
]


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def build() -> dict:
    files = {}
    joined = b""
    for rel in PACK_FILES:
        with open(os.path.join(HERE, rel), "rb") as fh:
            data = fh.read()
        files[rel] = {"bytes": len(data), "sha256": sha256_bytes(data)}
        joined += data
    return {
        "pack": "cnp-0-cleanroom-pack@v0",
        "files": files,
        "pack_sha256": sha256_bytes(joined),
        "withheld": WITHHELD,
    }


def leak_check() -> list[str]:
    """Fail loudly if the pack names anything it is meant to withhold.

    Matched on word boundaries: a substring test flagged "denote" as the Deno
    runtime, and a leak check that cries wolf is one nobody reads.
    """
    problems = []
    needles = [
        r"cnp-0-seed-v0", r"jcs\.ts", r"cnp0\.ts", r"reject\.ts", r"build_manifest",
        r"CANONICAL_ENCODING", r"\bwarrant\b", r"\bWarrant\b", r"\bTypeScript\b",
        r"\bDeno\b", r"\bdeno\b", r"\bPython\b", r"\bpython3?\b",
    ]
    for rel in PACK_FILES:
        text = open(os.path.join(HERE, rel), encoding="utf-8").read()
        for n in needles:
            hit = re.search(n, text)
            if hit:
                line = text[: hit.start()].count("\n") + 1
                problems.append(
                    f"{rel}:{line} matches {n!r} ({hit.group(0)!r}), "
                    "which the pack must not carry"
                )
    return problems


def main() -> int:
    problems = leak_check()
    if problems:
        for p in problems:
            print(f"LEAK {p}")
        return 1
    manifest = build()
    text = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    if "--write" in sys.argv:
        out = os.path.join(HERE, "provenance", "pack.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"wrote provenance/pack.json — pack_sha256 {manifest['pack_sha256']}")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
