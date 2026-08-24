#!/usr/bin/env python3
"""proof_guard.py — the check that makes this artifact worth citing.

A Lean file that compiles proves nothing on its own: it can be `sorry`-ed,
axiom-ed, `native_decide`-ed, or quietly re-stated into something weaker than
what it claims. This guard checks the four things a reader would otherwise have
to take on trust:

  1. no escape hatches  — no `sorry`, `admit`, `axiom`, `constant`, `unsafe`,
                          `partial`, `native_decide`, `opaque`,
                          `@[implemented_by]`, `@[extern]`, `#exit`, and no
                          import outside `HSP.*`;
  2. axiom cone         — every pinned theorem's `#print axioms` output matches
                          the cone recorded in the lock, AND every axiom named
                          anywhere is on a closed allowlist: {propext,
                          Quot.sound}. A cone the lock happens to record is not
                          thereby permitted.
  3. pinned statements  — every theorem's *statement text* hashes to the value in
                          the lock, so a proof cannot be rescued by weakening
                          what it says;
  4. pinned definitions — every `def`/`abbrev`/`structure`/`inductive` span
                          hashes to the value in the lock, so a theorem cannot be
                          rescued by redefining what it is about (`compose`,
                          `Marks`, `statedLe`, …);
  5. pinned modules     — each module's whole-file digest is pinned. This is the
                          completeness backstop: (3) and (4) name *what* changed,
                          (5) guarantees nothing changed unnamed — anonymous
                          instances, `deriving` clauses, `set_option`s.
  6. spec pin           — the **normative body** of RFC-0003 Part 03 (everything
                          from `## 7. Translation protocol` onward) still hashes
                          to the digest this artifact depends on. The file's own
                          digest is reported, not gated: a front-matter or
                          provenance edit changes the file without changing any
                          clause a theorem here rests on, and a guard that goes
                          red for that teaches people to ignore it.

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
# The clause the normative body starts at. Everything above it is front matter:
# status, stewardship, provenance, home, parent, dependency list.
SPEC_BODY_MARKER = "\n## 7. Translation protocol\n"
SPEC_BODY_SHA256 = "148c50d1a560f5b4845a69657caea285caa1def169de725a1be66c06ea9505da"
SPEC_FILE_SHA256 = "794d9b3591397cd033843890fdee06a09c98103be45324cc7e00b858fa9d6b65"
SPEC_COMMIT = "b7fb1cecf3d284d831692dfbdf5acfa4ab424321"

EXPECTED_TOOLCHAIN = "leanprover/lean4:v4.31.0"

# The closed allowlist. Anything outside it fails, whether or not the lock
# records it — a lock entry documents a cone, it does not authorize one.
ALLOWED_AXIOMS = {"propext", "Quot.sound"}

FORBIDDEN = [
    (r"\bsorry\b", "`sorry`"),
    (r"\badmit\b", "`admit`"),
    (r"^\s*axiom\s", "an `axiom` declaration"),
    (r"^\s*constant\s", "a `constant` declaration"),
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
DECL_RE = re.compile(
    r"^(?:private\s+|protected\s+|noncomputable\s+)?"
    r"(theorem|def|abbrev|structure|inductive|instance)\s+"
    r"([A-Za-z_][A-Za-z0-9_.'’]*)", re.M)
DEFN_KINDS = ("def", "abbrev", "structure", "inductive", "instance")
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


def decl_span(code: str, start: int) -> str:
    """A declaration's full text: from its keyword to the next top-level one."""
    nxt = DECL_RE.search(code, start + 1)
    stop = nxt.start() if nxt else len(code)
    end_m = re.compile(r"^end\s", re.M).search(code, start + 1)
    if end_m and end_m.start() < stop:
        stop = end_m.start()
    return code[start:stop]


def collect_definitions(sources: dict[str, str]) -> dict[str, dict]:
    """Every `def`/`abbrev`/`structure`/`inductive`/named `instance`, by span."""
    found: dict[str, dict] = {}
    for name, text in sources.items():
        code = strip_comments(text)
        for m in DECL_RE.finditer(code):
            kind, short = m.group(1), m.group(2)
            if kind not in DEFN_KINDS:
                continue
            ns = enclosing_namespace(code, m.start())
            full = f"{ns}.{short}" if ns else short
            normalized = " ".join(decl_span(code, m.start()).split())
            found[full] = {
                "module": name,
                "kind": kind,
                "rfc": nearest_clause(text, m.start()),
                "sha256": hashlib.sha256(normalized.encode()).hexdigest(),
            }
    return found


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


def check_spec_pin() -> tuple[list[str], list[str]]:
    """Gate on the normative body; report a front-matter change as a notice."""
    spec = os.path.normpath(os.path.join(ROOT, "..", "..", SPEC_RELPATH))
    if not os.path.exists(spec):
        return ([f"specification not found at {SPEC_RELPATH}"], [])
    text = open(spec, encoding="utf-8").read()
    file_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
    if SPEC_BODY_MARKER not in text:
        return ([
            f"specification body marker not found in {SPEC_RELPATH}",
            f"  expected a line {SPEC_BODY_MARKER.strip()!r}",
            "  the document has been restructured; re-read it before trusting"
            " any theorem here",
        ], [])
    body = text[text.index(SPEC_BODY_MARKER) + 1:]
    body_sha = hashlib.sha256(body.encode("utf-8")).hexdigest()
    problems, notices = [], []
    if body_sha != SPEC_BODY_SHA256:
        problems += [
            f"normative drift in {SPEC_RELPATH}",
            f"  formalized against §7 body sha256 {SPEC_BODY_SHA256}",
            f"  working tree now has          sha256 {body_sha}",
            "  a clause these theorems rest on has changed; re-read it",
        ]
    if file_sha != SPEC_FILE_SHA256:
        notices.append(
            f"note: {os.path.basename(SPEC_RELPATH)} front matter changed "
            f"(file sha256 {file_sha[:12]}…, pinned {SPEC_FILE_SHA256[:12]}…); "
            "the §7 body is unchanged, so no theorem is affected"
        )
    return (problems, notices)


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


def compare(kind: str, pinned: dict, found: dict, fields: tuple[str, ...]) -> list[str]:
    problems = []
    for name in sorted(set(pinned) - set(found)):
        problems.append(f"{kind} {name} is pinned in the lock but no longer exists")
    for name in sorted(set(found) - set(pinned)):
        problems.append(f"{kind} {name} is not pinned; run `--update` and review the diff")
    for name in sorted(set(found) & set(pinned)):
        for field in fields:
            want, got = pinned[name].get(field), found[name].get(field)
            if want != got:
                problems.append(f"{kind} {name}: {field} changed ({want!r} -> {got!r})")
    return problems


def main() -> int:
    update = "--update" in sys.argv
    sources = {
        mod: open(os.path.join(HSP, f"{mod}.lean"), encoding="utf-8").read()
        for mod in MODULES
    }

    spec_problems, notices = check_spec_pin()
    problems: list[str] = []
    problems += check_toolchain()
    problems += spec_problems
    problems += check_forbidden(sources)
    if problems and not update:
        for p in problems:
            print(f"FAIL {p}")
        return 1

    theorems = collect_theorems(sources)
    definitions = collect_definitions(sources)
    modules = {
        mod: {"sha256": hashlib.sha256(text.encode("utf-8")).hexdigest()}
        for mod, text in sources.items()
    }

    with tempfile.TemporaryDirectory() as build:
        try:
            cones = run_lean(build)
        except Failure as exc:
            print(f"FAIL {exc}")
            return 1

    # The allowlist is closed: an axiom is refused even if the lock records it.
    for name, axioms in cones.items():
        outside = set(axioms) - ALLOWED_AXIOMS
        if outside:
            problems.append(
                f"{name} depends on axioms outside the allowlist: "
                f"{sorted(outside)} (allowed: {sorted(ALLOWED_AXIOMS)})"
            )

    for name, info in theorems.items():
        info["axioms"] = cones.get(name)
        if info["axioms"] is None:
            problems.append(
                f"{name} is not audited: add `#print axioms {name}` to "
                f"HSP/{info['module']}.lean"
            )
        if not info["rfc"]:
            problems.append(f"{name} has no RFC clause mapping in its vicinity")
    for name, info in definitions.items():
        if not info["rfc"]:
            problems.append(f"definition {name} has no RFC clause mapping in its vicinity")

    if update:
        if problems:
            for p in problems:
                print(f"FAIL {p}")
            return 1
        payload = {
            "spec": {
                "path": SPEC_RELPATH,
                "commit": SPEC_COMMIT,
                "body_marker": SPEC_BODY_MARKER.strip(),
                "body_sha256": SPEC_BODY_SHA256,
                "file_sha256": SPEC_FILE_SHA256,
            },
            "toolchain": EXPECTED_TOOLCHAIN,
            "axiom_allowlist": sorted(ALLOWED_AXIOMS),
            "modules": {k: modules[k] for k in sorted(modules)},
            "definitions": {k: definitions[k] for k in sorted(definitions)},
            "theorems": {k: theorems[k] for k in sorted(theorems)},
        }
        with open(LOCK_PATH, "w") as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.write("\n")
        print(
            f"wrote {os.path.basename(LOCK_PATH)}: {len(theorems)} theorems, "
            f"{len(definitions)} definitions, {len(modules)} modules"
        )
        return 0

    if not os.path.exists(LOCK_PATH):
        print("FAIL theorems.lock.json is missing; run `python3 proof_guard.py --update`")
        return 1
    lock = json.load(open(LOCK_PATH))

    for field, want in (
        ("body_sha256", SPEC_BODY_SHA256),
        ("commit", SPEC_COMMIT),
        ("body_marker", SPEC_BODY_MARKER.strip()),
    ):
        if lock.get("spec", {}).get(field) != want:
            problems.append(
                f"lock and guard disagree on spec.{field}: "
                f"{lock.get('spec', {}).get(field)!r} vs {want!r}"
            )
    if lock.get("axiom_allowlist") != sorted(ALLOWED_AXIOMS):
        problems.append("lock and guard disagree on the axiom allowlist")
    if lock.get("toolchain") != EXPECTED_TOOLCHAIN:
        problems.append("lock and guard disagree on the toolchain")

    problems += compare("module", lock.get("modules", {}), modules, ("sha256",))
    problems += compare(
        "definition", lock.get("definitions", {}), definitions, ("sha256", "kind", "rfc"))
    problems += compare(
        "theorem", lock.get("theorems", {}), theorems,
        ("statement_sha256", "axioms", "rfc"))

    if problems:
        for p in problems:
            print(f"FAIL {p}")
        return 1

    for n in notices:
        print(n)
    print(f"ok  {len(theorems)} theorems and {len(definitions)} definitions pinned")
    print(f"ok  axiom cones within the closed allowlist {sorted(ALLOWED_AXIOMS)}")
    print(f"ok  {len(modules)} module digests unchanged")
    print("ok  no sorry / axiom / constant / unsafe / partial / native_decide /"
          " non-HSP import")
    print(f"ok  spec §7 body sha256 {SPEC_BODY_SHA256[:12]}… ({SPEC_COMMIT[:7]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
