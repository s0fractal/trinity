#!/usr/bin/env python3
"""Score a frozen candidate against the corpus without showing it the answers.

Two outputs, and the split is the point:

* a **proctor report** with everything — expected bytes, produced bytes, digests;
* a **redacted feedback file** for the model, carrying only the failing input,
  the category that was expected, and the clause that governs it.

Never the expected canonical bytes and never the expected digest, asserted in
code rather than trusted. An implementation that reproduces bytes it was shown
has demonstrated nothing.

The candidate runs **inside the sandbox**, like everything else it produced: its
binary is as model-generated as its build script, and running it on the host
would hand it the corpus it is being tested against.

The protocol is validated strictly. A tool that answers some lines, reorders
them, repeats an id, or emits `{"ok":true}` with no digest has not passed the
cases it skipped, and scoring it as though it had would be the most flattering
possible bug.

Usage:
    python3 harness/evaluate.py --workdir ~/cnp0-cleanroom [--heldout extra.json]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys

import sandbox

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRINITY = os.path.normpath(os.path.join(HERE, "..", ".."))
CORPUS = os.path.join(TRINITY, "probes", "cnp-0-seed-v0", "corpus", "manifest.json")
BINARY = "/work/target/release/candidate"

HEX = set("0123456789abcdef")


def sha_hex(hexstr: str) -> str:
    return hashlib.sha256(bytes.fromhex(hexstr)).hexdigest()


def raw_hex_of(case: dict) -> str:
    if "raw_hex" in case:
        return case["raw_hex"]
    return case["raw"].encode("utf-8").hex()


def load_cases_empty_probe() -> list[dict]:
    """Exercise the empty-scope refusal without touching the real corpus."""
    return _guard_non_empty([])


def _guard_non_empty(cases: list[dict]) -> list[dict]:
    if not cases:
        raise SystemExit("refusing: zero cases selected. An empty score is not a pass.")
    return cases


def load_cases(heldout: str | None) -> list[dict]:
    cases = [c for c in json.load(open(CORPUS))["cases"] if c.get("kind") == "encode"]
    if heldout:
        extra = json.load(open(heldout))
        for c in extra.get("cases", []):
            c["heldout"] = True
        cases += extra.get("cases", [])
    return _guard_non_empty(cases)


class ProtocolError(Exception):
    pass


def validate_line(rec: object, expect_id: str, sub: str, raw_hex: str) -> dict:
    """One output record, checked against the interface contract."""
    if not isinstance(rec, dict):
        raise ProtocolError("output line is not a JSON object")
    if rec.get("id") != expect_id:
        raise ProtocolError(f"id {rec.get('id')!r} out of order, expected {expect_id!r}")
    if not isinstance(rec.get("ok"), bool):
        raise ProtocolError("`ok` missing or not a boolean")
    if rec["ok"]:
        digest = rec.get("sha256")
        if not isinstance(digest, str) or len(digest) != 64 or set(digest) - HEX:
            raise ProtocolError("`sha256` missing or not 64 lowercase hex characters")
        if sub == "encode":
            canon = rec.get("canonical_hex")
            if not isinstance(canon, str) or len(canon) % 2 or set(canon) - HEX:
                raise ProtocolError("`canonical_hex` missing or not even-length hex")
            if sha_hex(canon) != digest:
                raise ProtocolError(
                    "`sha256` is not the digest of `canonical_hex` the record carries"
                )
        else:
            # verify accepts THESE bytes; the digest must be of the input, and an
            # earlier version of this evaluator never checked that, so any
            # `ok: true` counted as correct.
            if digest != sha_hex(raw_hex):
                raise ProtocolError(
                    "`sha256` is not the digest of the input bytes that were verified"
                )
    else:
        if not isinstance(rec.get("category"), str) or not rec["category"]:
            raise ProtocolError("rejection without a `category`")
    return rec


def run_subcommand(workdir: str, sub: str, cases: list[dict]) -> dict[str, dict]:
    payload = "".join(
        json.dumps({"id": c["id"], "raw_hex": raw_hex_of(c)}) + "\n" for c in cases
    )
    code, out = sandbox.run(workdir, [BINARY, sub], stdin=payload, timeout_s=300)
    if code != 0:
        raise SystemExit(
            f"`candidate {sub}` exited {code}. A non-zero exit is the program "
            f"failing, which is not the same as rejecting inputs.\n{out[-4000:]}"
        )
    lines = [ln for ln in out.splitlines() if ln.strip()]
    if len(lines) != len(cases):
        raise SystemExit(
            f"`candidate {sub}` produced {len(lines)} output line(s) for "
            f"{len(cases)} input line(s). One line in, one line out, in order."
        )
    results: dict[str, dict] = {}
    for case, line in zip(cases, lines):
        try:
            rec = json.loads(line)
        except json.JSONDecodeError as exc:
            raise SystemExit(f"`candidate {sub}`: malformed output line: {exc}")
        try:
            rec = validate_line(rec, case["id"], sub, raw_hex_of(case))
        except ProtocolError as exc:
            raise SystemExit(f"`candidate {sub}` case {case['id']}: {exc}")
        if rec["id"] in results:
            raise SystemExit(f"`candidate {sub}`: duplicate id {rec['id']!r}")
        results[rec["id"]] = rec
    return results


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--heldout", help="an additional manifest of held-out cases")
    ap.add_argument("--out", default="provenance/evaluation")
    args = ap.parse_args()

    workdir = sandbox.preflight(args.workdir)
    cases = load_cases(args.heldout)
    enc = run_subcommand(workdir, "encode", cases)
    ver = run_subcommand(workdir, "verify", cases)

    report = {"cases": len(cases), "encode": {}, "verify": {}, "summary": {}}
    feedback: list[dict] = []
    counts = {k: 0 for k in (
        "encode_correct", "encode_verdict_wrong", "encode_bytes_wrong",
        "encode_category_differs", "verify_correct", "verify_verdict_wrong",
        "verify_category_differs",
    )}

    def note(cid, op, case, expected, got=None):
        item = {"id": cid, "op": op, "raw_hex": raw_hex_of(case),
                "expected": expected, "clause": case.get("clause", "")}
        if got is not None:
            item["got"] = got
        feedback.append(item)

    for c in cases:
        cid, want_enc = c["id"], c["encoder"]
        got = enc[cid]
        if "accept" in want_enc:
            if not got["ok"]:
                counts["encode_verdict_wrong"] += 1
                report["encode"][cid] = {"status": "rejected-but-should-accept",
                                         "got_category": got.get("category")}
                note(cid, "encode", c, "accept", f"reject: {got.get('category')}")
            else:
                want_hex = want_enc["accept"]["canonical"].encode("utf-8").hex()
                if got["canonical_hex"] == want_hex and got["sha256"] == want_enc["accept"]["sha256"]:
                    counts["encode_correct"] += 1
                    report["encode"][cid] = {"status": "ok"}
                else:
                    counts["encode_bytes_wrong"] += 1
                    report["encode"][cid] = {
                        "status": "wrong-bytes",
                        "expected_hex": want_hex, "got_hex": got["canonical_hex"],
                        "expected_sha256": want_enc["accept"]["sha256"],
                        "got_sha256": got["sha256"],
                    }
                    note(cid, "encode", c,
                         "accept, with different canonical bytes than you produced")
        else:
            want_cat = want_enc["reject"]
            if got["ok"]:
                counts["encode_verdict_wrong"] += 1
                report["encode"][cid] = {"status": "accepted-but-should-reject",
                                         "expected_category": want_cat}
                note(cid, "encode", c, f"reject: {want_cat}", "accept")
            elif got["category"] != want_cat:
                counts["encode_category_differs"] += 1
                report["encode"][cid] = {"status": "category-differs",
                                         "expected_category": want_cat,
                                         "got_category": got["category"]}
                note(cid, "encode", c, f"reject: {want_cat}", f"reject: {got['category']}")
            else:
                counts["encode_correct"] += 1
                report["encode"][cid] = {"status": "ok"}

        want_ver = c.get("verifier", "accept")
        gotv = ver[cid]
        if want_ver == "accept":
            if gotv["ok"]:
                counts["verify_correct"] += 1
                report["verify"][cid] = {"status": "ok"}
            else:
                counts["verify_verdict_wrong"] += 1
                report["verify"][cid] = {"status": "rejected-but-should-accept",
                                         "got_category": gotv.get("category")}
                note(cid, "verify", c, "accept", f"reject: {gotv.get('category')}")
        else:
            want_cat = want_ver["reject"]
            if gotv["ok"]:
                counts["verify_verdict_wrong"] += 1
                report["verify"][cid] = {"status": "accepted-but-should-reject",
                                         "expected_category": want_cat}
                note(cid, "verify", c, f"reject: {want_cat}", "accept")
            elif gotv["category"] != want_cat:
                counts["verify_category_differs"] += 1
                report["verify"][cid] = {"status": "category-differs",
                                         "expected_category": want_cat,
                                         "got_category": gotv["category"]}
                note(cid, "verify", c, f"reject: {want_cat}", f"reject: {gotv['category']}")
            else:
                counts["verify_correct"] += 1
                report["verify"][cid] = {"status": "ok"}

    report["summary"] = counts
    outdir = os.path.join(HERE, args.out)
    os.makedirs(outdir, exist_ok=True)
    json.dump(report, open(os.path.join(outdir, "proctor-report.json"), "w"),
              indent=2, sort_keys=True)

    text = json.dumps(feedback, indent=2, sort_keys=True)
    for c in cases:
        acc = c["encoder"].get("accept")
        if acc:
            assert acc["sha256"] not in text, f"leak: digest of {c['id']} in feedback"
            assert acc["canonical"] not in text, f"leak: canonical bytes of {c['id']}"
    open(os.path.join(outdir, "feedback.json"), "w").write(text + "\n")

    print(f"scored {len(cases)} encode-kind case(s) in the sandbox")
    for k, v in counts.items():
        print(f"  {k.replace('_', ' '):26}{v}")
    print(f"  proctor report  {os.path.relpath(outdir, HERE)}/proctor-report.json")
    print(f"  model feedback  {os.path.relpath(outdir, HERE)}/feedback.json "
          f"({len(feedback)} item(s), no expected bytes or digests)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
