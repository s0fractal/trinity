#!/usr/bin/env python3
"""proof_guard.py — the check that makes this artifact worth citing.

A Lean file that compiles proves nothing on its own: it can be `sorry`-ed,
axiom-ed, `native_decide`-ed, or quietly re-stated into something weaker than
what it claims. This guard checks the four things a reader would otherwise have
to take on trust:

  1. no escape hatches  — no `sorry`, `admit`, `axiom`, `unsafe`, `partial`,
                          `native_decide`, `opaque`, `@[implemented_by]`,
                          `@[extern]`, `#exit`, and no import outside `HSP.*`;
  2. axiom cone         — every pinned theorem's `#print axioms` output matches
                          the cone recorded in `theorems.lock.json`, and
                          `sorryAx` / `Classical.choice` are refused outright;
  3. pinned statements  — every pinned theorem's *statement text* hashes to the
                          value in the lock, so a proof cannot be rescued by
                          weakening what it says;
  4. spec pin           — the RFC-0003 Part 03 file still hashes to the digest
                          this artifact was written against.

Usage:
    python3 proof_guard.py            # verify
    python3 proof_guard.py --update   # regenerate theorems.lock.json
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
HSP = os.path.join(ROOT, "HSP")
LOCK_PATH = os.path.join(ROOT, "theorems.lock.json")

# Compile order: the first three are import-free, `Counterexamples` imports them.
MODULES = ["TransformKind", "LossProfile", "Suitability", "Counterexamples"]

SPEC_RELPATH = os.path.join(
    "docs", "rfc", "0003-heterogeneous-state-protocol",
    "03-translation-loss-and-suitability.md",
)
SPEC_SHA256 = "9462e6bfbbf3c6d24d41a80df6dffa30b42c41bf705cf657fb0874d25f098616"
SPEC_COMMIT = "e7f63f1ad9efa75ffb157f73bafc07a6336c31ff"

EXPECTED_TOOLCHAIN = "leanprover/lean4:v4.31.0"

# Axioms that may never appear, in the lock or out of it.
REFUSED_AXIOMS = {"sorryAx", "Classical.choice"}

FORBIDDEN = [
    (r"\bsorry\b", "`sorry`"),
    (r"\badmit\b", "`admit`"),
    (r"^\s*axiom\s", "an `axiom` declaration"),
    (r"\bunsafe\b", "`unsafe`"),
    (r"\bpartial\s+def\b", "`partial def`"),
    (r"\bnative_decide\b", "`native_decide`"),
    (r"^\s*opaque\s", "an `opaque` declaration"),
    (r"@\[implemented_by", "`@[implemented_by]`"),
    (r"@\[extern", "`@[extern]`"),
    (r"^\s*#exit\b", "`#exit`"),
    (r"set_option\s+maxHeartbeats\s+0", "an unbounded elaboration budget"),
    (r"set_option\s+debug\.skipKernelTC", "kernel typechecking disabled"),
]

THEOREM_RE = re.compile(r"^(?:private\s+|protected\s+)?theorem\s+([A-Za-z_][A-Za-z0-9_.'’]*)", re.M)
NAMESPACE_RE = re.compile(r"^namespace\s+([A-Za-z_][A-Za-z0-9_.]*)", re.M)
END_RE = re.compile(r"^end\s+([A-Za-z_][A-Za-z0-9_.]*)", re.M)
SECTION_RE = re.compile(r"§\d+(?:\.\d+)*")
AXIOM_LINE_RE = re.compile(r"^'([^']+)' (?:depends on axioms: \[(.*)\]|does not depend on any axioms)$")


class Failure(Exception):
    pass


def sha256_file(path: str) -> str:
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def strip_comments(text: str) -> str:
    """Remove Lean line comments and (nested) block comments, preserving offsets."""
    out = []
    i, n, depth = 0, len(text), 0
    while i < n:
        two = text[i:i + 2]
        if depth == 0 and two == "--":
            j = text.find("\n", i)
            j = n if j == -1 else j
            out.append(" " * (j - i))
            i = j
        elif two == "/-":
            depth += 1
            out.append("  ")
            i += 2
        elif two == "-/" and depth > 0:
            depth -= 1
            out.append("  ")
            i += 2
        elif depth > 0:
            out.append(" " if text[i] != "\n" else "\n")
            i += 1
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def check_forbidden(sources: dict[str, str]) -> list[str]:
    problems = []
    for name, text in sources.items():
        code = strip_comments(text)
        for pattern, label in FORBIDDEN:
            for m in re.finditer(pattern, code, re.M):
                line = code[: m.start()].count("\n") + 1
                problems.append(f"HSP/{name}.lean:{line}: forbidden construct: {label}")
        for m in re.finditer(r"^import\s+(\S+)", code, re.M):
            module = m.group(1)
            if not module.startswith("HSP."):
                line = code[: m.start()].count("\n") + 1
                problems.append(
                    f"HSP/{name}.lean:{line}: import outside the kernel: {module} "
                    "(this artifact is core-Lean only, no Mathlib)"
                )
    return problems


def enclosing_namespace(code: str, offset: int) -> str:
    """The namespace stack open at `offset`."""
    stack: list[str] = []
    events = []
    for m in NAMESPACE_RE.finditer(code):
        events.append((m.start(), "open", m.group(1)))
    for m in END_RE.finditer(code):
        events.append((m.start(), "close", m.group(1)))
    for pos, kind, name in sorted(events):
        if pos >= offset:
            break
        if kind == "open":
            stack.append(name)
        elif stack:
            stack.pop()
    return ".".join(stack)


def statement_text(code: str, start: int) -> str:
    """Text of a theorem from its name to the `:=` that begins its proof."""
    depth = 0
    i = start
    n = len(code)
    while i < n:
        ch = code[i]
        if ch in "([{⟨":
            depth += 1
        elif ch in ")]}⟩":
            depth -= 1
        elif depth == 0 and code[i:i + 2] == ":=":
            return code[start:i]
        i += 1
    return code[start:]


def nearest_clause(text: str, offset: int) -> str:
    """The RFC clause a declaration maps to.

    A theorem's own doc comment is authoritative: the first §N.M it names is the
    clause it mechanizes. Where a theorem has no doc comment, the clause is the
    nearest §N.M above it — in practice the section header it sits under.
    """
    head = text.rfind("/--", 0, offset)
    if head != -1:
        close = text.find("-/", head)
        if close != -1 and text[close + 2:offset].strip() == "":
            doc = SECTION_RE.search(text, head, close)
            if doc:
                return doc.group(0)
    hits = [m.group(0) for m in SECTION_RE.finditer(text, 0, offset)]
    return hits[-1] if hits else ""


def collect_theorems(sources: dict[str, str]) -> dict[str, dict]:
    found: dict[str, dict] = {}
    for name, text in sources.items():
        code = strip_comments(text)
        for m in THEOREM_RE.finditer(code):
            short = m.group(1)
            ns = enclosing_namespace(code, m.start())
            full = f"{ns}.{short}" if ns else short
            stmt = statement_text(code, m.start())
            normalized = " ".join(stmt.split())
            found[full] = {
                "module": name,
                "rfc": nearest_clause(text, m.start()),
                "statement_sha256": hashlib.sha256(normalized.encode()).hexdigest(),
            }
    return found


def run_lean(build: str) -> dict[str, list[str]]:
    """Elaborate every module and collect the reported axiom cones."""
    env = dict(os.environ)
    env["LEAN_PATH"] = build + (os.pathsep + env["LEAN_PATH"] if "LEAN_PATH" in env else "")
    os.makedirs(os.path.join(build, "HSP"), exist_ok=True)
    cones: dict[str, list[str]] = {}
    for mod in MODULES:
        src = os.path.join(HSP, f"{mod}.lean")
        olean = os.path.join(build, "HSP", f"{mod}.olean")
        proc = subprocess.run(
            ["lean", src, "-o", olean],
            capture_output=True, text=True, cwd=ROOT, env=env,
        )
        output = proc.stdout + proc.stderr
        for line in output.splitlines():
            m = AXIOM_LINE_RE.match(line.strip())
            if m:
                axioms = m.group(2)
                cones[m.group(1)] = sorted(a.strip() for a in axioms.split(",")) if axioms else []
        if proc.returncode != 0:
            raise Failure(f"lean failed on HSP/{mod}.lean:\n{output}")
        for line in output.splitlines():
            if "error" in line and not AXIOM_LINE_RE.match(line.strip()):
                raise Failure(f"lean reported an error in HSP/{mod}.lean:\n{output}")
    return cones


def check_spec_pin() -> list[str]:
    spec = os.path.normpath(os.path.join(ROOT, "..", "..", SPEC_RELPATH))
    if not os.path.exists(spec):
        return [f"specification not found at {SPEC_RELPATH}"]
    actual = sha256_file(spec)
    if actual != SPEC_SHA256:
        return [
            f"specification drift: {SPEC_RELPATH}",
            f"  formalized against sha256 {SPEC_SHA256} ({SPEC_COMMIT[:7]})",
            f"  working tree now has  sha256 {actual}",
            "  re-read the changed clauses before trusting any theorem here",
        ]
    return []


def check_toolchain() -> list[str]:
    path = os.path.join(ROOT, "lean-toolchain")
    pinned = open(path).read().strip() if os.path.exists(path) else ""
    problems = []
    if pinned != EXPECTED_TOOLCHAIN:
        problems.append(f"lean-toolchain is {pinned!r}, expected {EXPECTED_TOOLCHAIN!r}")
    if shutil.which("lean") is None:
        problems.append("`lean` is not on PATH")
        return problems
    version = subprocess.run(["lean", "--version"], capture_output=True, text=True).stdout
    if "4.31.0" not in version:
        problems.append(f"lean on PATH is not 4.31.0: {version.strip()}")
    return problems


def main() -> int:
    update = "--update" in sys.argv
    sources = {
        mod: open(os.path.join(HSP, f"{mod}.lean")).read() for mod in MODULES
    }

    problems: list[str] = []
    problems += check_toolchain()
    problems += check_spec_pin()
    problems += check_forbidden(sources)
    if problems and not update:
        for p in problems:
            print(f"FAIL {p}")
        return 1

    found = collect_theorems(sources)
    with tempfile.TemporaryDirectory() as build:
        try:
            cones = run_lean(build)
        except Failure as exc:
            print(f"FAIL {exc}")
            return 1

    for name, axioms in cones.items():
        bad = REFUSED_AXIOMS.intersection(axioms)
        if bad:
            problems.append(f"{name} depends on refused axioms: {sorted(bad)}")

    for name, info in found.items():
        info["axioms"] = cones.get(name)
        if info["axioms"] is None:
            problems.append(
                f"{name} is not audited: add `#print axioms {name}` to "
                f"HSP/{info['module']}.lean"
            )
        if not info["rfc"]:
            problems.append(f"{name} has no RFC clause mapping in its vicinity")

    if update:
        if problems:
            for p in problems:
                print(f"FAIL {p}")
            return 1
        payload = {
            "spec": {
                "path": SPEC_RELPATH,
                "sha256": SPEC_SHA256,
                "commit": SPEC_COMMIT,
            },
            "toolchain": EXPECTED_TOOLCHAIN,
            "theorems": {k: found[k] for k in sorted(found)},
        }
        with open(LOCK_PATH, "w") as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.write("\n")
        print(f"wrote {os.path.basename(LOCK_PATH)} with {len(found)} pinned theorems")
        return 0

    if not os.path.exists(LOCK_PATH):
        print("FAIL theorems.lock.json is missing; run `python3 proof_guard.py --update`")
        return 1
    lock = json.load(open(LOCK_PATH))
    pinned = lock["theorems"]

    for name in sorted(set(pinned) - set(found)):
        problems.append(f"{name} is pinned in the lock but no longer exists")
    for name in sorted(set(found) - set(pinned)):
        problems.append(f"{name} is not pinned; run `--update` and review the diff")
    for name in sorted(set(found) & set(pinned)):
        want, got = pinned[name], found[name]
        if want["statement_sha256"] != got["statement_sha256"]:
            problems.append(
                f"{name}: statement changed (pinned "
                f"{want['statement_sha256'][:12]}, now {got['statement_sha256'][:12]})"
            )
        if want.get("axioms") != got.get("axioms"):
            problems.append(
                f"{name}: axiom cone changed (pinned {want.get('axioms')}, "
                f"now {got.get('axioms')})"
            )
        if want.get("rfc") != got.get("rfc"):
            problems.append(
                f"{name}: RFC mapping changed ({want.get('rfc')} -> {got.get('rfc')})"
            )

    if problems:
        for p in problems:
            print(f"FAIL {p}")
        return 1

    print(f"ok  {len(found)} theorems pinned, axiom cones matched")
    print(f"ok  no sorry / axiom / unsafe / partial / native_decide / non-HSP import")
    print(f"ok  spec {SPEC_RELPATH} still sha256 {SPEC_SHA256[:12]}… ({SPEC_COMMIT[:7]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
