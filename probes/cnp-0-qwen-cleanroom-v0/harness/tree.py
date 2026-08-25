#!/usr/bin/env python3
"""The closed list of what may exist in the candidate tree, in one place.

`round.py` and `freeze.py` used to decide this separately, and they disagreed:
round.py accepted any relative path the model emitted, freeze.py silently
skipped `.cargo`. A model could therefore ship a `.cargo/config.toml` or a
`build.rs` that shaped the build, and the frozen tree — the thing the whole
experiment rests on — would not contain it.

So the list is closed, shared, and refuses rather than skips. Something outside
it is a hard stop, not a quiet omission: silence is how a build script goes
unrecorded.

Refused explicitly, because these change what a build DOES rather than what it
compiles:

    build.rs          runs arbitrary code at build time
    .cargo/**         redirects registries, linkers, runners
    */build.rs        the same, nested
"""

from __future__ import annotations

import hashlib
import os

ALLOWED_EXACT = {"Cargo.toml", "Cargo.lock", "NOTES.md", "README.md"}
ALLOWED_DIRS = ("src", "tests")
ALLOWED_SUFFIX = ".rs"

MAX_FILE_BYTES = 1_000_000
MAX_FILES = 64

# Artefacts cargo itself creates. Never emitted by the model, never frozen.
BUILD_ARTEFACTS = {"target", ".cargo", ".git"}


class TreeError(Exception):
    pass


def is_allowed(rel: str) -> bool:
    rel = rel.replace(os.sep, "/")
    if rel in ALLOWED_EXACT:
        return True
    parts = rel.split("/")
    return (
        len(parts) >= 2
        and parts[0] in ALLOWED_DIRS
        and parts[-1].endswith(ALLOWED_SUFFIX)
        and parts[-1] != "build.rs"
    )


def why_refused(rel: str) -> str:
    norm = rel.replace(os.sep, "/")
    if norm == "build.rs" or norm.endswith("/build.rs"):
        return (
            f"{rel} is a build script: it runs code at build time and is not part "
            "of what the candidate compiles. Refused."
        )
    if norm.startswith(".cargo/") or "/.cargo/" in norm:
        return (
            f"{rel} configures cargo itself — registries, linkers, runners — and "
            "would shape a build without appearing in the frozen sources. Refused."
        )
    return (
        f"{rel} is outside the closed tree list: "
        f"{', '.join(sorted(ALLOWED_EXACT))}, "
        f"{'/, '.join(ALLOWED_DIRS)}/**{ALLOWED_SUFFIX}. Refused rather than "
        "skipped, because a silently skipped file is one nobody records."
    )


def check_emitted(paths: list[str], require_complete: bool = True) -> None:
    """Validate the set of paths a model emitted, before anything is written.

    `require_complete` is False for a single turn inside a round: work arrives
    across turns, so a turn that adds one module is legal. The accumulated set is
    checked with it True before anything is built.
    """
    seen: set[str] = set()
    for rel in paths:
        norm = rel.replace(os.sep, "/")
        if norm.startswith("/") or ".." in norm.split("/"):
            raise TreeError(f"{rel} escapes the working directory. Refused.")
        if norm in seen:
            raise TreeError(
                f"{rel} was emitted more than once. Two blocks for one path means "
                "the last one silently wins, and which one was meant is unknowable. "
                "Refused."
            )
        seen.add(norm)
        if not is_allowed(norm):
            raise TreeError(why_refused(rel))
    if len(seen) > MAX_FILES:
        raise TreeError(f"{len(seen)} files, over the cap of {MAX_FILES}")
    if require_complete:
        if not seen:
            raise TreeError("no files were emitted")
        if "Cargo.toml" not in seen:
            raise TreeError("no Cargo.toml was emitted; there is nothing to build")


def collect(workdir: str) -> list[tuple[str, bytes]]:
    """Every source file in the tree, refusing anything outside the list."""
    out: list[tuple[str, bytes]] = []
    for root, dirs, names in os.walk(workdir):
        dirs[:] = [d for d in dirs if d not in BUILD_ARTEFACTS]
        for name in sorted(names):
            full = os.path.join(root, name)
            rel = os.path.relpath(full, workdir).replace(os.sep, "/")
            if os.path.islink(full):
                raise TreeError(f"{rel} is a symlink; a frozen tree must be its own bytes")
            if not is_allowed(rel):
                raise TreeError(why_refused(rel))
            size = os.path.getsize(full)
            if size > MAX_FILE_BYTES:
                raise TreeError(f"{rel} is {size} bytes, over the cap")
            out.append((rel, open(full, "rb").read()))
    if not out:
        raise TreeError(f"nothing admissible in {workdir}")
    return sorted(out, key=lambda kv: kv[0])


def assert_no_build_hooks(workdir: str) -> None:
    """Nothing that shapes a build may exist, whoever created it.

    The allowlist covers what the MODEL emits. This covers the tree as it stands,
    so a hook that arrived any other way is still caught before a build runs.
    """
    for root, dirs, names in os.walk(workdir):
        dirs[:] = [d for d in dirs if d in BUILD_ARTEFACTS or True]
        for name in names:
            rel = os.path.relpath(os.path.join(root, name), workdir).replace(os.sep, "/")
            if rel == "build.rs" or rel.endswith("/build.rs"):
                raise TreeError(f"a build script is present at {rel}")
            if rel.startswith(".cargo/") and rel.endswith(("config", "config.toml")):
                raise TreeError(f"cargo configuration is present at {rel}")


def digest(files: list[tuple[str, bytes]]) -> tuple[str, dict[str, dict]]:
    """`path\\n length\\n bytes` per file, sorted — a rename, a truncation and a
    byte change are all distinguishable."""
    joined = b""
    manifest: dict[str, dict] = {}
    for rel, data in files:
        joined += rel.encode("utf-8") + b"\n" + str(len(data)).encode() + b"\n" + data
        manifest[rel] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    return hashlib.sha256(joined).hexdigest(), manifest
