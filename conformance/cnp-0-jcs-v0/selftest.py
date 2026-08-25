#!/usr/bin/env python3
"""Prove the runner actually fails a wrong implementation.

A runner that passes everything is indistinguishable from a runner that checks
nothing, and a conformance kit whose runner is never itself tested is a claim
resting on an untested claim.

So this runs deliberately wrong implementations past `run_conformance.py` and
asserts each is caught, **and caught as the right kind of failure** — a wrong
digest must be reported as a digest failure, not folded into a verdict failure,
because the kit's report distinguishes them and a reader will rely on that.

It also runs an implementation that is correct on the subset it covers, so
"fails everything" cannot pass for rigour: a runner that rejected every input
would satisfy every negative control here and be useless.

    python3 selftest.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
RUNNER = os.path.join(HERE, "run_conformance.py")
REQUIRED = os.path.join(HERE, "corpus", "required.ndjson")

RESULTS: list[tuple[str, bool, str]] = []


def record(name: str, ok: bool, detail: str) -> None:
    RESULTS.append((name, ok, detail))
    print(f"  {'ok  ' if ok else 'FAIL'} {name:<34} {detail}")


# Each fake is a complete program. `mode` decides how it answers.
FAKE = r'''
import hashlib, json, sys
mode, sub = {mode!r}, sys.argv[1]
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    rec = json.loads(line)
    raw = bytes.fromhex(rec["raw_hex"])
    i = rec["id"]
    if mode == "silent":
        continue
    if mode == "accept-all":
        out = {{"id": i, "ok": True, "sha256": hashlib.sha256(raw).hexdigest()}}
        if sub == "encode":
            out["canonical_hex"] = raw.hex()
    elif mode == "reject-all":
        out = {{"id": i, "ok": False, "category": "syntax"}}
    elif mode == "echo-canonical":
        # Right on inputs that were already canonical, wrong on every other.
        out = {{"id": i, "ok": True, "sha256": hashlib.sha256(raw).hexdigest(),
               "canonical_hex": raw.hex()}}
    elif mode == "wrong-digest":
        out = dict(EXPECT[i][sub])
        out["id"] = i
        if out.get("ok"):
            out["sha256"] = "0" * 64
    elif mode == "wrong-category":
        out = dict(EXPECT[i][sub])
        out["id"] = i
        if not out.get("ok"):
            out["category"] = "syntax" if out["category"] != "syntax" else "trailing-bytes"
    elif mode == "malformed":
        out = {{"id": i, "verdict": "maybe"}}
    elif mode == "correct":
        out = dict(EXPECT[i][sub])
        out["id"] = i
    sys.stdout.write(json.dumps(out) + "\n")
'''

PRELUDE = r'''
import json, os
EXPECT = {}
with open({corpus!r}, encoding="utf-8") as fh:
    for line in fh:
        if line.strip():
            c = json.loads(line)
            EXPECT[c["id"]] = {"encode": c["encode"], "verify": c["verify"]}
'''


def run_fake(mode: str, tmp: str) -> dict:
    path = os.path.join(tmp, f"fake_{mode.replace('-', '_')}.py")
    src = PRELUDE.replace("{corpus!r}", repr(REQUIRED)) + FAKE.format(mode=mode)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(src)
    report = os.path.join(tmp, f"{mode}.json")
    proc = subprocess.run(
        [sys.executable, RUNNER, "--cmd", f"{sys.executable} {path}",
         "--report", report],
        capture_output=True, text=True, timeout=600)
    data = json.load(open(report)) if os.path.exists(report) else {}
    return {"exit": proc.returncode, "stdout": proc.stdout + proc.stderr, **data}


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        # A correct implementation must pass. Without this, every control below
        # would also be satisfied by a runner that failed everything.
        r = run_fake("correct", tmp)
        record("correct-implementation-passes", r.get("failed") == 0 and r["exit"] == 0,
               f"{r.get('passed')}/{r.get('checks')} checks passed"
               if r.get("failed") == 0 else r["stdout"][-200:])

        r = run_fake("echo-canonical", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("verdict", 0) > 0 and kinds.get("canonical-bytes", 0) > 0
        record("echoing-input-as-canonical-fails", ok,
               f"caught: {kinds}" if ok else f"NOT caught: {kinds}")

        r = run_fake("accept-all", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("verdict", 0) >= 34
        record("accepting-everything-fails", ok,
               f"{kinds.get('verdict')} verdict failures" if ok else f"NOT caught: {kinds}")

        r = run_fake("reject-all", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("verdict", 0) >= 29
        record("rejecting-everything-fails", ok,
               f"{kinds.get('verdict')} verdict failures" if ok else f"NOT caught: {kinds}")

        r = run_fake("wrong-digest", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("digest", 0) > 0 and set(kinds) == {"digest"}
        record("right-bytes-wrong-digest-is-a-digest-failure", ok,
               f"{kinds.get('digest')} digest failures and nothing else" if ok
               else f"reported as {kinds}")

        r = run_fake("wrong-category", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and set(kinds) == {"category"}
        record("wrong-category-is-not-a-wrong-verdict", ok,
               f"{kinds.get('category')} category failures and nothing else" if ok
               else f"reported as {kinds}")

        r = run_fake("malformed", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("malformed-output", 0) > 0
        record("output-not-matching-the-interface-fails", ok,
               f"caught: {kinds}" if ok else f"NOT caught: {kinds}")

        r = run_fake("silent", tmp)
        kinds = r.get("failures_by_kind", {})
        ok = r["exit"] != 0 and kinds.get("no-output", 0) > 0
        record("producing-nothing-fails", ok,
               f"caught: {kinds}" if ok else f"NOT caught: {kinds}")

        # The kit refuses to score against a corpus that has been edited.
        edited = os.path.join(tmp, "kit")
        subprocess.run(["cp", "-R", HERE, edited], check=True)
        target = os.path.join(edited, "corpus", "required.ndjson")
        lines = open(target, encoding="utf-8").read().splitlines(True)
        open(target, "w", encoding="utf-8").writelines(lines[:-1])
        proc = subprocess.run(
            [sys.executable, os.path.join(edited, "run_conformance.py"),
             "--cmd", "true"], capture_output=True, text=True, timeout=120)
        blob = proc.stdout + proc.stderr
        ok = proc.returncode != 0 and "does not match its pin" in blob
        record("edited-corpus-is-refused", ok,
               "refused a corpus that no longer matches MANIFEST.sha256" if ok
               else blob[-200:])

    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)} passed, {len(failed)} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
