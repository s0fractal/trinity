#!/usr/bin/env python3
"""Score a frozen candidate against the corpus without showing it the answers.

Two outputs, and the split is the point:

* a **proctor report** with everything — expected bytes, produced bytes, digests;
* a **redacted feedback file** for the model, carrying only the failing input,
  the category that was expected, and the clause that governs it.

Never the expected canonical bytes and never the expected digest. An
implementation that reproduces bytes it was shown has demonstrated nothing about
the specification, so the redaction is not politeness — it is what makes the
result mean anything.

Scope: the corpus holds cases of several kinds; only the `encode` cases exercise
an encoder and a verifier, and those are the ones scored here. Quantization,
renormalization and the discrete-circle cases are not part of the candidate's
task and are not counted for or against it.

Usage:
    python3 harness/evaluate.py --candidate <path-to-binary> [--heldout extra.json]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRINITY = os.path.normpath(os.path.join(HERE, "..", ".."))
CORPUS = os.path.join(TRINITY, "probes", "cnp-0-seed-v0", "corpus", "manifest.json")


def raw_hex_of(case: dict) -> str:
    if "raw_hex" in case:
        return case["raw_hex"]
    return case["raw"].encode("utf-8").hex()


def load_cases(heldout: str | None) -> list[dict]:
    cases = [c for c in json.load(open(CORPUS))["cases"] if c.get("kind") == "encode"]
    if heldout:
        extra = json.load(open(heldout))
        for c in extra.get("cases", []):
            c["heldout"] = True
        cases += extra.get("cases", [])
    return cases


def run(candidate: str, sub: str, cases: list[dict]) -> dict[str, dict]:
    payload = "\n".join(
        json.dumps({"id": c["id"], "raw_hex": raw_hex_of(c)}) for c in cases
    ) + "\n"
    proc = subprocess.run([candidate, sub], input=payload, capture_output=True, text=True)
    out = {}
    for line in proc.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(rec, dict) and "id" in rec:
            out[rec["id"]] = rec
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidate", required=True, help="path to the built binary")
    ap.add_argument("--heldout", help="an additional manifest of held-out cases")
    ap.add_argument("--out", default="provenance/evaluation")
    args = ap.parse_args()

    cases = load_cases(args.heldout)
    enc = run(args.candidate, "encode", cases)
    ver = run(args.candidate, "verify", cases)

    report = {"cases": len(cases), "encode": {}, "verify": {}, "summary": {}}
    feedback: list[dict] = []
    counts = {
        "encode_correct": 0, "encode_verdict_wrong": 0, "encode_bytes_wrong": 0,
        "encode_category_differs": 0, "encode_missing": 0,
        "verify_correct": 0, "verify_verdict_wrong": 0,
        "verify_category_differs": 0, "verify_missing": 0,
    }

    for c in cases:
        cid = c["id"]
        clause = c.get("clause", "")
        want_enc = c["encoder"]
        got = enc.get(cid)
        if got is None:
            counts["encode_missing"] += 1
            report["encode"][cid] = {"status": "missing"}
            feedback.append({"id": cid, "op": "encode", "raw_hex": raw_hex_of(c),
                             "expected": "an output line", "clause": clause})
        elif "accept" in want_enc:
            if not got.get("ok"):
                counts["encode_verdict_wrong"] += 1
                report["encode"][cid] = {"status": "rejected-but-should-accept",
                                         "got_category": got.get("category")}
                feedback.append({"id": cid, "op": "encode", "raw_hex": raw_hex_of(c),
                                 "expected": "accept", "got": "reject: " + str(got.get("category")),
                                 "clause": clause})
            else:
                want_hex = want_enc["accept"]["canonical"].encode("utf-8").hex()
                ok_bytes = got.get("canonical_hex") == want_hex
                ok_digest = got.get("sha256") == want_enc["accept"]["sha256"]
                if ok_bytes and ok_digest:
                    counts["encode_correct"] += 1
                    report["encode"][cid] = {"status": "ok"}
                else:
                    counts["encode_bytes_wrong"] += 1
                    # The proctor report carries both; the feedback carries neither.
                    report["encode"][cid] = {
                        "status": "wrong-bytes",
                        "expected_hex": want_hex, "got_hex": got.get("canonical_hex"),
                        "expected_sha256": want_enc["accept"]["sha256"],
                        "got_sha256": got.get("sha256"),
                    }
                    feedback.append({"id": cid, "op": "encode", "raw_hex": raw_hex_of(c),
                                     "expected": "accept, with different canonical bytes "
                                                 "than you produced",
                                     "clause": clause})
        else:
            want_cat = want_enc["reject"]
            if got.get("ok"):
                counts["encode_verdict_wrong"] += 1
                report["encode"][cid] = {"status": "accepted-but-should-reject",
                                         "expected_category": want_cat}
                feedback.append({"id": cid, "op": "encode", "raw_hex": raw_hex_of(c),
                                 "expected": f"reject: {want_cat}", "got": "accept",
                                 "clause": clause})
            elif got.get("category") != want_cat:
                counts["encode_category_differs"] += 1
                report["encode"][cid] = {"status": "category-differs",
                                         "expected_category": want_cat,
                                         "got_category": got.get("category")}
                feedback.append({"id": cid, "op": "encode", "raw_hex": raw_hex_of(c),
                                 "expected": f"reject: {want_cat}",
                                 "got": f"reject: {got.get('category')}",
                                 "clause": clause})
            else:
                counts["encode_correct"] += 1
                report["encode"][cid] = {"status": "ok"}

        want_ver = c.get("verifier", "accept")
        gotv = ver.get(cid)
        if gotv is None:
            counts["verify_missing"] += 1
            report["verify"][cid] = {"status": "missing"}
        elif want_ver == "accept":
            if gotv.get("ok"):
                counts["verify_correct"] += 1
                report["verify"][cid] = {"status": "ok"}
            else:
                counts["verify_verdict_wrong"] += 1
                report["verify"][cid] = {"status": "rejected-but-should-accept",
                                         "got_category": gotv.get("category")}
                feedback.append({"id": cid, "op": "verify", "raw_hex": raw_hex_of(c),
                                 "expected": "accept",
                                 "got": "reject: " + str(gotv.get("category")),
                                 "clause": clause})
        else:
            want_cat = want_ver["reject"]
            if gotv.get("ok"):
                counts["verify_verdict_wrong"] += 1
                report["verify"][cid] = {"status": "accepted-but-should-reject",
                                         "expected_category": want_cat}
                feedback.append({"id": cid, "op": "verify", "raw_hex": raw_hex_of(c),
                                 "expected": f"reject: {want_cat}", "got": "accept",
                                 "clause": clause})
            elif gotv.get("category") != want_cat:
                counts["verify_category_differs"] += 1
                report["verify"][cid] = {"status": "category-differs",
                                         "expected_category": want_cat,
                                         "got_category": gotv.get("category")}
                feedback.append({"id": cid, "op": "verify", "raw_hex": raw_hex_of(c),
                                 "expected": f"reject: {want_cat}",
                                 "got": f"reject: {gotv.get('category')}",
                                 "clause": clause})
            else:
                counts["verify_correct"] += 1
                report["verify"][cid] = {"status": "ok"}

    report["summary"] = counts
    outdir = os.path.join(HERE, args.out)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "proctor-report.json"), "w") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)

    # The redaction is asserted, not assumed: no expected byte string or digest
    # may appear in what goes back to the model.
    text = json.dumps(feedback, indent=2, sort_keys=True)
    for c in cases:
        acc = c["encoder"].get("accept")
        if acc:
            assert acc["sha256"] not in text, f"leak: digest of {c['id']} in feedback"
            assert acc["canonical"] not in text, f"leak: canonical bytes of {c['id']}"
    with open(os.path.join(outdir, "feedback.json"), "w") as fh:
        fh.write(text + "\n")

    total = len(cases)
    print(f"scored {total} encode-kind case(s) against {args.candidate}")
    for k, v in counts.items():
        print(f"  {k.replace('_', ' '):28}{v}")
    print(f"  proctor report  {os.path.relpath(outdir, HERE)}/proctor-report.json")
    print(f"  model feedback  {os.path.relpath(outdir, HERE)}/feedback.json "
          f"({len(feedback)} item(s), no expected bytes or digests)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
