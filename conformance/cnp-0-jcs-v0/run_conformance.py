#!/usr/bin/env python3
"""Score an implementation of CNP-0-JCS against the conformance corpus.

Run this against YOUR program. It never runs ours: there is no reference
implementation in this kit, on purpose. A kit that scored you by agreement with
our encoder would be asking you to trust our encoder; this one scores you
against expected bytes and digests that are written down, each carrying the
clause it comes from, so a disagreement is a place in the specification you can
go and read rather than a verdict you have to accept.

    python3 run_conformance.py --cmd './my-impl'
    python3 run_conformance.py --cmd 'python3 impl.py' --report report.json

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
import shlex
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
MANIFEST = os.path.join(HERE, "MANIFEST.sha256")
REQUIRED = os.path.join(HERE, "corpus", "required.ndjson")


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def kit_inventory() -> list[str]:
    """Every file actually present in the kit, as relative paths."""
    found = []
    for root, dirs, names in os.walk(HERE):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for name in sorted(names):
            rel = os.path.relpath(os.path.join(root, name), HERE).replace(os.sep, "/")
            found.append(rel)
    return sorted(found)


def verify_kit(skip: bool = False) -> str | None:
    """Refuse to score unless the kit is exactly what its manifest says it is.

    Two properties, and an earlier version had only the first:

    * every pinned file is present and matches its digest;
    * **nothing else is present.** Verifying a list is an open surface — a file
      nobody pinned rides along untouched, and an implementation dropped into
      the kit is exactly the thing whose absence the no-trust claim rests on.
      The inventory is therefore closed: an unpinned file is a hard stop.

    What this proves and what it does not: the manifest shows the kit is
    internally consistent — it has not been edited since it was pinned. It does
    **not** prove the kit is authentic, because an attacker who changes a file
    can recompute the manifest. Authenticity needs the manifest's own digest to
    be known from somewhere other than the kit, which is what the ratification
    record will pin. It is printed for that purpose.
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
    manifest_raw = open(MANIFEST, "rb").read()
    pinned: dict[str, str] = {}
    for line in manifest_raw.decode("utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        want, rel = line.split("  ", 1)
        pinned[rel] = want

    bad = []
    for rel, want in sorted(pinned.items()):
        path = os.path.join(HERE, rel)
        if not os.path.exists(path):
            bad.append(f"{rel} is pinned but missing")
        elif sha(open(path, "rb").read()) != want:
            bad.append(f"{rel} does not match its pin")
    for rel in kit_inventory():
        if rel == "MANIFEST.sha256":
            continue
        if rel not in pinned:
            bad.append(
                f"{rel} is present but pinned by nothing. The inventory is closed: "
                "an unlisted file could be anything, including the implementation "
                "this kit is supposed not to contain."
            )
    if bad:
        raise SystemExit(
            "refusing: this kit is not what its manifest says it is:\n  "
            + "\n  ".join(bad)
            + "\nA kit that has been altered produces a score that means nothing."
        )
    digest = sha(manifest_raw)
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


def parse_replies(stdout: str, cases: list[dict], sub: str) -> list[dict]:
    lines = [ln for ln in stdout.splitlines() if ln.strip()]
    if len(lines) != len(cases):
        raise ProtocolError(
            f"`{sub}` wrote {len(lines)} lines for {len(cases)} inputs. The "
            "interface requires exactly one output line per input line."
        )
    replies, seen = [], set()
    expected = [c["id"] for c in cases]
    for n, (line, want_id) in enumerate(zip(lines, expected), 1):
        try:
            rec = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ProtocolError(f"`{sub}` line {n} is not JSON: {exc}")
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
        replies.append(rec)
    return replies


def run_subcommand(cmd: str, sub: str, cases: list[dict],
                   timeout: int) -> list[dict]:
    """Feed every case to `<cmd> <sub>` and return one reply per case, in order."""
    payload = "".join(
        json.dumps({"id": c["id"], "raw_hex": c["raw_hex"]}, sort_keys=True) + "\n"
        for c in cases
    )
    argv = shlex.split(cmd) + [sub]
    try:
        proc = subprocess.run(argv, input=payload, capture_output=True, text=True,
                              timeout=timeout)
    except FileNotFoundError:
        raise SystemExit(f"cannot run {argv[0]!r}")
    except subprocess.TimeoutExpired:
        raise SystemExit(f"`{cmd} {sub}` did not finish within {timeout}s")
    if proc.returncode != 0:
        raise ProtocolError(
            f"`{cmd} {sub}` exited {proc.returncode}. A non-zero exit is the program "
            "failing, which is not the same as rejecting an input.\n"
            + proc.stderr[-2000:]
        )
    return parse_replies(proc.stdout, cases, sub)


def score_one(sub: str, case: dict, got: dict | None) -> dict:
    """Compare one reply with what the corpus expects, and say precisely how it differs."""
    want = case[sub]
    r = {"id": case["id"], "clause": case["clause"], "title": case["title"],
         "op": sub, "expected": want}
    if got is None:
        return {**r, "pass": False, "failure": "no-output",
                "detail": "the program produced no line for this case"}
    r["got"] = {k: got.get(k) for k in ("ok", "category", "canonical_hex", "sha256")
                if k in got}
    if not isinstance(got.get("ok"), bool):
        return {**r, "pass": False, "failure": "malformed-output",
                "detail": "`ok` is missing or not a boolean"}
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
    ap.add_argument("--report", help="write the full result as JSON to this path")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--skip-kit-check", action="store_true",
                    help="score against an unpinned kit; the result is not a "
                         "conformance result and is labelled as such")
    args = ap.parse_args()

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
