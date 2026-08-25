#!/usr/bin/env python3
"""Compare the live control set with the closed set `controls.lock.json` names.

A floor is a permissive seam. `harness_test.ts` asserted `tier1.length >= 41`,
so a control could be deleted and every test stayed green — the suite could
shrink silently, which is the exact failure it exists to prevent in the harness
it guards. Hand-counted totals drifted the same way: the README said 37,
VERDICT.md said 44, the runnable report said 45.

Exact set equality in both directions, so a control that vanishes is as loud as
one that appears unannounced.

    python3 harness/controls.lock.py --check
    python3 harness/controls.lock.py --check --report path/to/selftest.json
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOCK = os.path.join(HERE, "controls.lock.json")


def live_report() -> dict:
    proc = subprocess.run(
        [sys.executable, os.path.join(HERE, "selftest.py"), "--json"],
        capture_output=True, text=True)
    if proc.returncode != 0:
        raise SystemExit(f"selftest.py exited {proc.returncode} without a report:\n"
                         + proc.stderr[-2000:])
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"selftest.py produced no parseable report: {exc}\n"
                         + proc.stderr[-2000:])


def compare(report: dict, lock: dict) -> list[str]:
    problems = []
    for tier in (1, 2):
        got = [r["name"] for r in report["results"] if r["tier"] == tier]
        want = lock[f"tier{tier}"]
        if len(got) != len(set(got)):
            problems.append(
                f"tier {tier} reports "
                f"{sorted({n for n in got if got.count(n) > 1})} more than once"
            )
        gone = sorted(set(want) - set(got))
        added = sorted(set(got) - set(want))
        if gone:
            problems.append(
                f"tier {tier} is missing {gone}. A control that vanishes takes its "
                "guarantee with it. If it was removed on purpose, remove it from "
                "controls.lock.json in the same diff."
            )
        if added:
            problems.append(
                f"tier {tier} has gained {added}, which controls.lock.json does "
                "not name. A new control is welcome — add it there so the set "
                "stays closed."
            )
        if lock[f"tier{tier}_count"] != len(want):
            problems.append(
                f"controls.lock.json says tier{tier}_count is "
                f"{lock[f'tier{tier}_count']} but names {len(want)}"
            )
    if lock["total"] != lock["tier1_count"] + lock["tier2_count"]:
        problems.append("controls.lock.json's total does not match its own counts")
    return problems


def main() -> int:
    if "--check" not in sys.argv:
        print(open(LOCK, encoding="utf-8").read())
        return 0
    lock = json.load(open(LOCK, encoding="utf-8"))
    if "--report" in sys.argv:
        report = json.load(open(sys.argv[sys.argv.index("--report") + 1]))
    else:
        report = live_report()
    problems = compare(report, lock)
    if problems:
        for p in problems:
            print(f"FAIL {p}")
        return 1
    print(f"ok  the control set is exactly what controls.lock.json records: "
          f"{lock['tier1_count']} tier-1, {lock['tier2_count']} tier-2, "
          f"{lock['total']} total")
    return 0


if __name__ == "__main__":
    sys.exit(main())
