#!/usr/bin/env python3
"""Score an implementation of CNP-0-JCS against the conformance corpus.

Run this against YOUR program. It never runs ours: there is no reference
implementation in this kit, on purpose. A kit that scored you by agreement with
our encoder would be asking you to trust our encoder; this one scores you
against expected bytes and digests that are written down, each carrying the
clause it comes from, so a disagreement is a place in the specification you can
go and read rather than a verdict you have to accept.

    python3 run_conformance.py --cmd ~/my-impl/target/release/my-impl
    python3 run_conformance.py --cmd 'python3 ~/my-impl/impl.py' \
        --report ~/my-impl/report.json

Keep your implementation and your report outside this directory. The kit's
inventory is closed, so a file written into it — a report, a build artefact —
makes the next run refuse the kit.

Your program is invoked twice: `<cmd> encode` and `<cmd> verify`, each reading
NDJSON on stdin and writing one NDJSON line per input line, in order. See
INTERFACE.md.

The kit checks itself first. Every shipped file is pinned in MANIFEST.sha256 and
verified before a single case is run, because a corpus that has been edited —
by anyone, including us — produces a score that means nothing, and a runner that
carried on regardless would report that meaningless score as a result.

Exit status is 0 only if every required case passed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import posixpath
import re
import shlex
import stat
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(HERE, "MANIFEST.sha256")
REQUIRED = os.path.join(HERE, "corpus", "required.ndjson")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


HEX64 = re.compile(r"^[0-9a-f]{64}$")


def scan_tree() -> tuple[set[str], set[str], list[str]]:
    """lstat the whole kit before anything is opened.

    Order matters and did not used to: the manifest was read and its paths
    opened first, so a symlink was followed before the scan that was supposed to
    refuse it, and an entry for `../outside.txt` was read from outside the kit
    entirely. Nothing here opens a file. It returns what exists, as three sets,
    and every later step works from those.
    """
    files: set[str] = set()
    dirs: set[str] = set()
    refusals: list[str] = []
    stack = [HERE]
    while stack:
        current = stack.pop()
        for name in sorted(os.listdir(current)):
            full = os.path.join(current, name)
            rel = os.path.relpath(full, HERE).replace(os.sep, "/")
            st = os.lstat(full)
            if stat.S_ISLNK(st.st_mode):
                refusals.append(
                    f"{rel} is a symlink; a pinned file must be its own bytes, and "
                    "a digest taken through a link describes whatever it pointed at"
                )
            elif stat.S_ISDIR(st.st_mode):
                dirs.add(rel)
                stack.append(full)
            elif stat.S_ISREG(st.st_mode):
                files.add(rel)
            else:
                refusals.append(f"{rel} is not a regular file")
    return files, dirs, refusals


def read_manifest(present: set[str]) -> tuple[dict[str, str], list[str]]:
    """Parse MANIFEST.sha256 without trusting a single path in it.

    Every entry must be a relative, normalized path that the scan already found
    inside the kit. An earlier version joined each entry to the kit directory and
    opened it: an entry for `../outside.txt` with a correct digest was read from
    outside the kit and scored 126/126. A manifest is a claim about the kit, so a
    path that leaves it is not a manifest entry at all.
    """
    pinned: dict[str, str] = {}
    problems: list[str] = []
    raw = open(MANIFEST, "rb").read()
    for n, line in enumerate(raw.decode("utf-8", "replace").splitlines(), 1):
        if not line.strip():
            continue
        if "  " not in line:
            problems.append(f"MANIFEST line {n} is not `<digest>  <path>`")
            continue
        digest, rel = line.split("  ", 1)
        if not HEX64.match(digest):
            problems.append(f"MANIFEST line {n} has a malformed digest")
            continue
        if rel != rel.strip():
            problems.append(f"MANIFEST line {n} pads its path with whitespace")
            continue
        if os.path.isabs(rel) or rel.startswith("/") or ":" in rel.split("/")[0][1:2]:
            problems.append(f"MANIFEST line {n} pins an absolute path {rel!r}")
            continue
        if rel != posixpath.normpath(rel) or rel.startswith("..") or "/../" in rel:
            problems.append(
                f"MANIFEST line {n} pins {rel!r}, which is not a normalized path "
                "inside the kit"
            )
            continue
        if rel in pinned:
            problems.append(f"MANIFEST pins {rel!r} twice")
            continue
        if rel not in present:
            problems.append(f"MANIFEST pins {rel!r}, which the kit does not contain")
            continue
        pinned[rel] = digest
    return pinned, problems


def verify_kit(skip: bool = False) -> str | None:
    """Refuse to score unless the kit is exactly what its manifest says it is.

    Exact equality in both directions, over a tree scanned before anything was
    opened: every regular file is pinned, every pin names a file, every digest
    matches, and every directory is the parent of something pinned. No path is
    exempt — `__pycache__` was, and a file hidden there scored a perfect run. An
    exclusion is a hole whoever knows about it walks through.

    What this proves and what it does not: the manifest shows the kit is
    internally consistent — unchanged since it was pinned. It does **not** prove
    the kit is authentic, because whoever edits a file can recompute the
    manifest. Authenticity needs the manifest's own digest known from somewhere
    other than the kit, which is what a ratification record must pin. It is
    printed for that purpose.
    """
    if skip:
        print("!!  kit integrity check SKIPPED; this score is not a conformance "
              "result", file=sys.stderr)
        return None
    if not os.path.exists(MANIFEST):
        raise SystemExit(
            "refusing: MANIFEST.sha256 is missing, so nothing pins the corpus this "
            "score would be computed against."
        )

    present, dirs, bad = scan_tree()
    pinned, problems = read_manifest(present)
    bad = list(bad) + problems

    scoreable = present - {"MANIFEST.sha256"}
    for rel in sorted(scoreable - set(pinned)):
        bad.append(
            f"{rel} is present but pinned by nothing. The inventory is closed: an "
            "unlisted file could be anything, including the implementation this "
            "kit is supposed not to contain."
            + (" (Generated bytecode counts: delete it and re-run.)"
               if "__pycache__" in rel else "")
        )
    for rel in sorted(set(pinned) - scoreable):
        bad.append(f"{rel} is pinned but missing")
    for rel in sorted(dirs):
        if not any(p.startswith(rel + "/") for p in pinned):
            bad.append(
                f"{rel}/ holds nothing pinned. An empty directory is a place to "
                "put something later without anyone noticing."
            )
    # Only now is anything opened, and only paths the scan itself found.
    for rel in sorted(set(pinned) & scoreable):
        if sha(open(os.path.join(HERE, rel), "rb").read()) != pinned[rel]:
            bad.append(f"{rel} does not match its pin")

    if bad:
        raise SystemExit(
            "refusing: this kit is not what its manifest says it is:\n  "
            + "\n  ".join(bad)
            + "\nA kit that has been altered produces a score that means nothing."
        )
    digest = sha(open(MANIFEST, "rb").read())
    print(f"kit integrity ok: {len(pinned)} files pinned, none unlisted")
    print(f"  MANIFEST.sha256 itself hashes to {digest}")
    print("  That shows the kit is internally consistent, not that it is "
          "authentic:\n  anyone who edits a file can recompute the manifest. "
          "Compare this digest\n  with the one in the ratification record, which "
          "does not live in the kit.\n")
    return digest


def load_cases(path: str) -> list[dict]:
    cases = [json.loads(line) for line in open(path, encoding="utf-8") if line.strip()]
    seen = set()
    for c in cases:
        if c["id"] in seen:
            raise SystemExit(f"the corpus contains {c['id']} twice")
        seen.add(c["id"])
    return cases


class ProtocolError(RuntimeError):
    """The program did not answer in the shape INTERFACE.md defines.

    This is separated from a wrong answer because it is a different finding, and
    because collapsing it into one made the runner unsound. An earlier version
    built a dict keyed by id and read the expected ids out of it: replies in
    reverse order scored the same as replies in order, a duplicate id let a
    later correct line overwrite an earlier wrong one, and an id nobody asked
    about was never noticed. All three passed 126/126.

    So the reply stream is checked positionally, before a single verdict is
    compared: exactly one line per input, in input order, each carrying the id
    it was asked about and no other.
    """


class NotJson(ValueError):
    pass


class DuplicateMember(ValueError):
    pass


def reject_constant(token: str):
    """`json.loads` accepts NaN, Infinity and -Infinity. JSON has none of them.

    Python's parser treats them as an extension, so a reply that was correct in
    every scored field but carried an extra `"extra": NaN` parsed cleanly and
    scored 126/126. The interface says JSON; this makes that true rather than
    approximately true.
    """
    raise NotJson(f"{token} is not JSON; it is a Python extension that some "
                  "parsers accept and the interface does not")


def no_duplicate_members(pairs: list[tuple[str, object]]) -> dict:
    """`json.loads` resolves a repeated member in favour of the last one.

    That is not a parser bug, it is a parser choice, and it made the id check
    bypassable: `{"id":"unasked","id":"c1-int-zero"}` reads as the expected id
    while the reply is about something else. The same silent resolution is what
    §5.1.1 rule 4 forbids on the wire, so refusing it here is the interface
    holding itself to the rule it tests.
    """
    seen = set()
    for key, _ in pairs:
        if key in seen:
            raise DuplicateMember(f"member {key!r} appears more than once")
        seen.add(key)
    return dict(pairs)


def split_records(stdout: str, sub: str) -> list[str]:
    """NDJSON: one record per line, no empty ones.

    An earlier version dropped blank lines before counting, so padding the
    output with them was free. A trailing newline after the last record is
    allowed — that is how a line-oriented stream ends — and nothing else is.
    """
    # LF or CRLF terminate a record — both, chosen explicitly so the transport
    # works on either platform. Nothing else does. An earlier version captured
    # with text=True, whose universal-newline translation silently turned every
    # CR into an LF before this check could see one, so the check did nothing.
    stdout = stdout.replace("\r\n", "\n")
    if "\r" in stdout:
        raise ProtocolError(
            f"`{sub}` output contains a carriage return that does not terminate a "
            "record. Records end with LF or CRLF; a bare CR makes what counts as "
            "a line ambiguous."
        )
    if stdout.endswith("\n"):
        stdout = stdout[:-1]
    if stdout == "":
        return []
    records = stdout.split("\n")
    for n, rec in enumerate(records, 1):
        if rec.strip() == "":
            raise ProtocolError(
                f"`{sub}` record {n} is blank. NDJSON carries one JSON value per "
                "line; an empty line is not a record, and skipping it would let "
                "output be padded for free."
            )
    return records


def parse_replies(stdout: str, cases: list[dict], sub: str) -> list[dict]:
    lines = split_records(stdout, sub)
    if len(lines) != len(cases):
        raise ProtocolError(
            f"`{sub}` wrote {len(lines)} lines for {len(cases)} inputs. The "
            "interface requires exactly one output line per input line."
        )
    replies, seen = [], set()
    expected = [c["id"] for c in cases]
    for n, (line, want_id) in enumerate(zip(lines, expected), 1):
        try:
            rec = json.loads(line, object_pairs_hook=no_duplicate_members,
                             parse_constant=reject_constant)
        except json.JSONDecodeError as exc:
            raise ProtocolError(f"`{sub}` line {n} is not JSON: {exc}")
        except DuplicateMember as exc:
            raise ProtocolError(
                f"`{sub}` line {n}: {exc}. A repeated member means the reply says "
                "two things and which one is read is the parser's choice."
            )
        except NotJson as exc:
            raise ProtocolError(f"`{sub}` line {n}: {exc}.")
        if not isinstance(rec, dict):
            raise ProtocolError(f"`{sub}` line {n} is not a JSON object")
        got_id = rec.get("id")
        if not isinstance(got_id, str):
            raise ProtocolError(f"`{sub}` line {n} has no string `id`")
        if got_id in seen:
            raise ProtocolError(
                f"`{sub}` line {n} repeats id {got_id!r}. Two answers for one "
                "input means the score depends on which one is read."
            )
        seen.add(got_id)
        if got_id != want_id:
            if got_id not in expected:
                raise ProtocolError(
                    f"`{sub}` line {n} answers {got_id!r}, which was not asked "
                    "about."
                )
            raise ProtocolError(
                f"`{sub}` line {n} answers {got_id!r} where {want_id!r} was "
                "expected. Output must be in input order."
            )
        check_fields(rec, sub, n)
        replies.append(rec)
    return replies


# Exactly what INTERFACE.md defines, and nothing else. An open schema lets a
# reply carry anything alongside the answer — which is how an extra `NaN` field
# came to be scored 126/126 — and diagnostics belong on stderr, not in the
# record.
FIELDS = {
    ("encode", True): {"id", "ok", "canonical_hex", "sha256"},
    ("encode", False): {"id", "ok", "category"},
    ("verify", True): {"id", "ok", "sha256"},
    ("verify", False): {"id", "ok", "category"},
}


def check_fields(rec: dict, sub: str, n: int) -> None:
    ok = rec.get("ok")
    if not isinstance(ok, bool):
        raise ProtocolError(f"`{sub}` line {n} has no boolean `ok`")
    allowed = FIELDS[(sub, ok)]
    extra = sorted(set(rec) - allowed)
    if extra:
        raise ProtocolError(
            f"`{sub}` line {n} carries {extra}, which INTERFACE.md does not "
            f"define for an {'accepted' if ok else 'rejected'} {sub}. The reply "
            "schema is closed; diagnostics go to stderr."
        )
    missing = sorted(allowed - set(rec))
    if missing:
        raise ProtocolError(f"`{sub}` line {n} is missing {missing}")


def run_subcommand(cmd: str, sub: str, cases: list[dict],
                   timeout: int) -> list[dict]:
    """Feed every case to `<cmd> <sub>` and return one reply per case, in order."""
    payload = "".join(
        json.dumps({"id": c["id"], "raw_hex": c["raw_hex"]}, sort_keys=True) + "\n"
        for c in cases
    )
    argv = shlex.split(cmd) + [sub]
    try:
        # Bytes, not text: universal-newline translation would rewrite the very
        # bytes the newline policy is meant to check.
        proc = subprocess.run(argv, input=payload.encode("utf-8"),
                              capture_output=True, timeout=timeout)
    except FileNotFoundError:
        raise SystemExit(f"cannot run {argv[0]!r}")
    except subprocess.TimeoutExpired:
        raise SystemExit(f"`{cmd} {sub}` did not finish within {timeout}s")
    if proc.returncode != 0:
        raise ProtocolError(
            f"`{cmd} {sub}` exited {proc.returncode}. A non-zero exit is the program "
            "failing, which is not the same as rejecting an input.\n"
            + proc.stderr.decode("utf-8", "replace")[-2000:]
        )
    try:
        stdout = proc.stdout.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ProtocolError(f"`{sub}` wrote output that is not UTF-8: {exc}")
    return parse_replies(stdout, cases, sub)


def score_one(sub: str, case: dict, got: dict) -> dict:
    """Compare one reply with what the corpus expects, and say precisely how it differs."""
    want = case[sub]
    r = {"id": case["id"], "clause": case["clause"], "title": case["title"],
         "op": sub, "expected": want}
    # `got` has already passed the protocol checks: it exists, it is in the right
    # place, and it carries exactly the fields the interface defines. Only
    # answers are compared here.
    r["got"] = {k: got.get(k) for k in ("ok", "category", "canonical_hex", "sha256")
                if k in got}
    if got["ok"] != want["ok"]:
        return {**r, "pass": False, "failure": "verdict",
                "detail": f"expected ok={want['ok']}, got ok={got['ok']}"}
    if not want["ok"]:
        if got.get("category") != want["category"]:
            # A different defensible ordering of checks shows up here rather than
            # as a wrong verdict, because it is a different thing.
            return {**r, "pass": False, "failure": "category",
                    "detail": f"rejected as expected, but as "
                              f"{got.get('category')!r} rather than "
                              f"{want['category']!r}"}
        return {**r, "pass": True}
    if sub == "encode" and got.get("canonical_hex") != want["canonical_hex"]:
        return {**r, "pass": False, "failure": "canonical-bytes",
                "detail": "accepted, but produced different canonical bytes"}
    if got.get("sha256") != want["sha256"]:
        return {**r, "pass": False, "failure": "digest",
                "detail": f"expected sha256 {want['sha256']}, got {got.get('sha256')}"}
    return {**r, "pass": True}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cmd", required=True,
                    help="how to invoke your implementation, e.g. './my-impl'")
    ap.add_argument("--report",
                    help="write the full result as JSON to this path, which must "
                         "be OUTSIDE the kit")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--skip-kit-check", action="store_true",
                    help="score against an unpinned kit; the result is not a "
                         "conformance result and is labelled as such")
    args = ap.parse_args()

    if args.report:
        # Writing the report into the kit adds an unpinned file, so the run after
        # it refuses the kit — and the example in this docstring used to do
        # exactly that. Checked before verification, so the failure names the
        # cause rather than appearing one run later as a mysterious integrity
        # error.
        dest = os.path.realpath(args.report)
        if dest == os.path.realpath(HERE) or dest.startswith(
                os.path.realpath(HERE) + os.sep):
            raise SystemExit(
                f"refusing: --report {args.report} would write inside the kit, "
                "whose inventory is closed. The next run would refuse the kit "
                "because of a file this run created. Write the report somewhere "
                "else."
            )

    kit_digest = verify_kit(args.skip_kit_check)
    cases = load_cases(REQUIRED)

    results, notes = [], {}
    try:
        for sub in ("encode", "verify"):
            replies = run_subcommand(args.cmd, sub, cases, args.timeout)
            for case, got in zip(cases, replies):
                results.append(score_one(sub, case, got))
    except ProtocolError as exc:
        print(f"PROTOCOL VIOLATION\n  {exc}\n")
        print("Not scored. A program that does not answer in the shape "
              "INTERFACE.md defines\ncannot be measured against the corpus, and "
              "reporting a number anyway would be\nreporting a number that means "
              "nothing.")
        if args.report:
            json.dump({"kit": "cnp-0-jcs-conformance@v0",
                       "kit_sha256": kit_digest,
                       "kit_verified": not args.skip_kit_check,
                       "cmd": args.cmd, "scored": False,
                       "protocol_violation": str(exc)},
                      open(args.report, "w"), indent=2, sort_keys=True)
            print(f"  report written to {args.report}")
        return 1

    passed = [r for r in results if r["pass"]]
    failed = [r for r in results if not r["pass"]]
    by_failure: dict[str, int] = {}
    for r in failed:
        by_failure[r["failure"]] = by_failure.get(r["failure"], 0) + 1

    print(f"{len(passed)}/{len(results)} checks passed "
          f"({len(cases)} cases × encode and verify)")
    for kind in sorted(by_failure):
        print(f"  {by_failure[kind]:>4} {kind}")
    for r in failed[:20]:
        print(f"  FAIL {r['op']:<6} {r['id']:<28} {r['clause']:<12} {r['detail']}")
    if len(failed) > 20:
        print(f"  … and {len(failed) - 20} more; use --report for all of them")

    if args.report:
        json.dump({
            "kit": "cnp-0-jcs-conformance@v0",
            "kit_sha256": kit_digest,
            "kit_verified": not args.skip_kit_check,
            "cmd": args.cmd, "scored": True,
            "cases": len(cases), "checks": len(results),
            "passed": len(passed), "failed": len(failed),
            "failures_by_kind": by_failure,
            "results": results,
            "note": ("Passing every check means this implementation reproduces the "
                     "corpus. It is not a proof of the implementation: the corpus is "
                     "finite. It is also not ratification, adoption, or independent "
                     "interoperability."),
        }, open(args.report, "w"), indent=2, sort_keys=True)
        print(f"  report written to {args.report}")

    if not failed:
        print("\nEvery required check passed. That means this implementation "
              "reproduces the corpus —\nnot that it is correct: the corpus is "
              "finite, and passing it is not ratification,\nadoption, or "
              "independent interoperability. See README.md.")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
