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
import hashlib
import shutil
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
mode, sub = "@@MODE@@", sys.argv[1]
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    rec = json.loads(line)
    raw = bytes.fromhex(rec["raw_hex"])
    i = rec["id"]
    if mode == "silent":
        continue
    if mode in ("reversed", "duplicated", "unknown-id", "extra-line", "short",
                "wrong-then-right", "blank-line", "whitespace-record",
                "duplicate-id-member", "nan-field", "extra-field"):
        BUFFER.append((i, sub))
        continue
    if mode == "accept-all":
        out = {"id": i, "ok": True, "sha256": hashlib.sha256(raw).hexdigest()}
        if sub == "encode":
            out["canonical_hex"] = raw.hex()
    elif mode == "reject-all":
        out = {"id": i, "ok": False, "category": "syntax"}
    elif mode == "echo-canonical":
        # Right on inputs that were already canonical, wrong on every other.
        out = {"id": i, "ok": True, "sha256": hashlib.sha256(raw).hexdigest()}
        if sub == "encode":
            out["canonical_hex"] = raw.hex()
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
        out = {"id": i, "verdict": "maybe"}
    elif mode == "correct":
        out = dict(EXPECT[i][sub])
        out["id"] = i
    sys.stdout.write(json.dumps(out) + "\n")

def answer(i, sub, wrong=False):
    out = dict(EXPECT[i][sub])
    out["id"] = i
    if wrong:
        out["ok"] = not out.get("ok", False)
        out.pop("canonical_hex", None)
        out.pop("sha256", None)
        out["category"] = "syntax"
    return json.dumps(out) + "\n"

if mode == "reversed":
    # Every answer is correct; only the order is wrong.
    for i, sub in reversed(BUFFER):
        sys.stdout.write(answer(i, sub))
elif mode == "wrong-then-right":
    # A wrong answer then a correct one for every id. Keyed by id with
    # last-write-wins, this scored a perfect run.
    for i, sub in BUFFER:
        sys.stdout.write(answer(i, sub, wrong=True))
        sys.stdout.write(answer(i, sub))
elif mode == "duplicated":
    # The COUNT is right, so this reaches the per-line checks: the first answer
    # is repeated in place of the second.
    first = BUFFER[0]
    sys.stdout.write(answer(first[0], first[1]))
    sys.stdout.write(answer(first[0], first[1]))
    for i, sub in BUFFER[2:]:
        sys.stdout.write(answer(i, sub))
elif mode == "unknown-id":
    # Count right again: one line answers something nobody asked about.
    for n, (i, sub) in enumerate(BUFFER):
        if n == 1:
            sys.stdout.write(json.dumps({"id": "nobody-asked", "ok": True}) + "\n")
        else:
            sys.stdout.write(answer(i, sub))
elif mode == "extra-line":
    for i, sub in BUFFER:
        sys.stdout.write(answer(i, sub))
    sys.stdout.write(json.dumps({"id": BUFFER[0][0], "ok": True}) + "\n")
elif mode == "short":
    for i, sub in BUFFER[:-1]:
        sys.stdout.write(answer(i, sub))
elif mode == "blank-line":
    # Correct answers, padded. Dropping blanks before counting made this free.
    for i, sub in BUFFER:
        sys.stdout.write(answer(i, sub))
    sys.stdout.write("\n   \n")
elif mode == "whitespace-record":
    # Count preserved, so this reaches the empty-record check itself.
    for n, (i, sub) in enumerate(BUFFER):
        sys.stdout.write("   \n" if n == 1 else answer(i, sub))
elif mode == "nan-field":
    # Every scored field correct, plus a value JSON does not have.
    for i, sub in BUFFER:
        body = answer(i, sub).strip()
        sys.stdout.write(body[:-1] + ',"extra":NaN}' + "\n")
elif mode == "extra-field":
    # Every scored field correct, plus one the interface does not define.
    for i, sub in BUFFER:
        body = answer(i, sub).strip()
        sys.stdout.write(body[:-1] + ',"debug":"note to self"}' + "\n")
elif mode == "duplicate-id-member":
    # `{"id":"unasked","id":"<expected>"}` — a standard parser keeps the last.
    for i, sub in BUFFER:
        body = answer(i, sub).strip()
        sys.stdout.write('{"id":"unasked",' + body[1:] + "\n")
'''

PRELUDE = r'''
import json, os
EXPECT = {}
BUFFER = []
with open({corpus!r}, encoding="utf-8") as fh:
    for line in fh:
        if line.strip():
            c = json.loads(line)
            EXPECT[c["id"]] = {"encode": c["encode"], "verify": c["verify"]}
'''


def run_fake(mode: str, tmp: str) -> dict:
    path = os.path.join(tmp, f"fake_{mode.replace('-', '_')}.py")
    src = PRELUDE.replace("{corpus!r}", repr(REQUIRED)) + FAKE.replace("@@MODE@@", mode)
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
        ok = r["exit"] != 0 and "no boolean `ok`" in r.get("protocol_violation", "")
        record("output-not-matching-the-interface-fails", ok,
               "refused before scoring" if ok
               else f"NOT caught: {r.get('protocol_violation', r['stdout'][-160:])}")

        r = run_fake("silent", tmp)
        ok = r["exit"] != 0 and "protocol_violation" in r
        record("producing-nothing-fails", ok,
               "refused as a protocol violation" if ok else f"NOT caught: {r['stdout'][-160:]}")

        # The four that made the runner unsound. Every answer in each of these is
        # CORRECT; only the shape of the reply stream is wrong. An earlier runner
        # keyed replies by id and scored all four 126/126.
        for mode, name, marker in (
            ("reversed", "answers-in-the-wrong-order-fail", "input order"),
            ("duplicated", "a-repeated-id-fails", "repeats id"),
            ("unknown-id", "an-unasked-id-fails", "not asked about"),
            ("wrong-then-right", "a-wrong-answer-followed-by-a-right-one-fails",
             "output line per input"),
            ("extra-line", "an-extra-line-fails", "output line per input"),
            ("short", "a-missing-line-fails", "output line per input"),
            ("blank-line", "padding-with-blank-lines-fails", "is blank"),
            ("whitespace-record", "a-whitespace-only-record-fails", "is blank"),
            ("duplicate-id-member", "a-duplicated-json-member-fails",
             "more than once"),
            ("nan-field", "a-NaN-value-fails", "not JSON"),
            ("extra-field", "an-undefined-output-field-fails", "schema is closed"),
        ):
            r = run_fake(mode, tmp)
            blob = r["stdout"]
            ok = (r["exit"] != 0 and "protocol_violation" in r
                  and marker in r.get("protocol_violation", ""))
            record(name, ok,
                   "refused before scoring" if ok
                   else f"NOT refused: exit {r['exit']} {blob[-160:]}")

        # An unpinned file must be refused, not ignored: a listed-files-only check
        # lets an implementation ride along inside the kit.
        # A refusal that is recorded and then not acted on is not a refusal. A
        # MANIFEST.sha256 symlinked to a FIFO used to be opened anyway, and the
        # runner hung: the failure mode of a missed pre-read check is a hang, not
        # a wrong answer, which is why this control asserts speed as well.
        fifo_kit = os.path.join(tmp, "fifo")
        shutil.copytree(HERE, fifo_kit)
        os.remove(os.path.join(fifo_kit, "MANIFEST.sha256"))
        pipe = os.path.join(tmp, "a-fifo")
        os.mkfifo(pipe)
        os.symlink(pipe, os.path.join(fifo_kit, "MANIFEST.sha256"))
        try:
            proc = subprocess.run(
                [sys.executable, os.path.join(fifo_kit, "run_conformance.py"),
                 "--cmd", "true"], capture_output=True, text=True, timeout=20)
            blob = proc.stdout + proc.stderr
            ok = (proc.returncode != 0 and "is a symlink" in blob
                  and "Nothing was opened" in blob)
            detail = ("refused before opening it" if ok else blob[-200:])
        except subprocess.TimeoutExpired:
            ok, detail = False, "the runner hung instead of refusing"
        record("a-manifest-symlinked-to-a-fifo-is-refused", ok, detail)

        # No path is exempt. `__pycache__` was, and a file hidden there scored a
        # perfect run: an exclusion is a hole whoever knows about it walks through.
        # A manifest is a claim about the kit. An entry that leaves it is not a
        # manifest entry, and one with a correct digest was read from outside and
        # scored 126/126.
        escape = os.path.join(tmp, "escape")
        shutil.copytree(HERE, escape)
        outside = os.path.join(os.path.dirname(escape), "outside.txt")
        with open(outside, "w") as fh:
            fh.write("read from beyond the kit\n")
        digest = hashlib.sha256(open(outside, "rb").read()).hexdigest()
        with open(os.path.join(escape, "MANIFEST.sha256"), "a") as fh:
            fh.write(f"{digest}  ../outside.txt\n")
        proc = subprocess.run(
            [sys.executable, os.path.join(escape, "run_conformance.py"), "--cmd", "true"],
            capture_output=True, text=True, timeout=120)
        blob = proc.stdout + proc.stderr
        ok = proc.returncode != 0 and "not a normalized path inside the kit" in blob
        record("a-manifest-path-leaving-the-kit-is-refused", ok,
               "refused a pin for ../outside.txt" if ok else blob[-200:])

        # An empty directory is a place to put something later unnoticed.
        hollow = os.path.join(tmp, "hollow")
        shutil.copytree(HERE, hollow)
        os.makedirs(os.path.join(hollow, "vendor"))
        proc = subprocess.run(
            [sys.executable, os.path.join(hollow, "run_conformance.py"), "--cmd", "true"],
            capture_output=True, text=True, timeout=120)
        blob = proc.stdout + proc.stderr
        ok = proc.returncode != 0 and "holds nothing pinned" in blob
        record("an-empty-directory-is-refused", ok,
               "refused a directory pinning nothing" if ok else blob[-200:])

        # The documented example used to poison the kit it had just verified.
        proc = subprocess.run(
            [sys.executable, RUNNER, "--cmd", "true",
             "--report", os.path.join(HERE, "report.json")],
            capture_output=True, text=True, timeout=120)
        blob = proc.stdout + proc.stderr
        ok = (proc.returncode != 0 and "would write inside the kit" in blob
              and not os.path.exists(os.path.join(HERE, "report.json")))
        record("a-report-inside-the-kit-is-refused", ok,
               "refused to write a report into the closed inventory" if ok
               else blob[-200:])

        for where, name in (("", "unpinned-file-is-refused"),
                            ("__pycache__", "unpinned-file-in-pycache-is-refused")):
            rogue = os.path.join(tmp, f"rogue{where or 'top'}")
            shutil.copytree(HERE, rogue)
            target = os.path.join(rogue, where) if where else rogue
            os.makedirs(target, exist_ok=True)
            with open(os.path.join(target, "unlisted_reference_impl.py"), "w") as fh:
                fh.write("# anything at all\n")
            proc = subprocess.run(
                [sys.executable, os.path.join(rogue, "run_conformance.py"),
                 "--cmd", "true"], capture_output=True, text=True, timeout=120)
            blob = proc.stdout + proc.stderr
            ok = proc.returncode != 0 and "pinned by nothing" in blob
            record(name, ok,
                   f"refused a kit carrying an unlisted file in "
                   f"{where + '/' if where else 'the kit root'}" if ok
                   else blob[-200:])

        # The kit refuses to score against a corpus that has been edited.
        edited = os.path.join(tmp, "kit")
        shutil.copytree(HERE, edited)
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
