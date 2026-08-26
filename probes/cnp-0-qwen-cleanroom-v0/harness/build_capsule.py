#!/usr/bin/env python3
"""Build `capsule/SPEC.md` from the specification, and prove it is verbatim.

The capsule claims to quote rather than paraphrase, because a paraphrase would
test whether the candidate agrees with the paraphraser. A claim like that is
worth nothing unless it is checkable, so:

* every quoted region is delimited in the output by markers naming its clause,
  its source file, and its byte range in that file;
* `provenance/verbatim.json` records the source digest, and for each region its
  offsets and its own digest;
* `--check` re-extracts from the source and fails if the committed capsule has
  drifted by one byte — in either direction.

Regions are chosen by explicit start/end anchors rather than by section
boundaries, because two of them deliberately stop short: the paragraph naming an
existing JCS implementation is excluded, as is the `i128` history. What is
excluded is as much a curation decision as what is included, and it is listed
here in code rather than described in prose.

Usage:
    python3 harness/build_capsule.py           # write capsule/SPEC.md
    python3 harness/build_capsule.py --check   # verify it against the source
"""

from __future__ import annotations

import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRINITY = os.path.normpath(os.path.join(HERE, "..", ".."))
SOURCE = os.path.join(
    TRINITY, "docs", "rfc", "0003-heterogeneous-state-protocol",
    "01-canonical-identity-and-encoding.md",
)
SOURCE_REL = "docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md"
SPEC = os.path.join(HERE, "capsule", "SPEC.md")
VERBATIM = os.path.join(HERE, "provenance", "verbatim.json")

# (clause, heading, start anchor, end anchor, why the region ends where it does)
REGIONS = [
    ("§5.1.1", "Canonical encoding is normative, not an implementation detail",
     "The encoding MUST satisfy:", "Rule 5 reverses",
     "stops before the pointer into the revision history"),
    ("§5.1.2", "Floating point",
     "In canonical form:", "##### Non-integer values",
     "the five rules; the subsection follows separately"),
    ("§5.1.2", "Non-integer values inside an integers-only domain",
     "Two patterns are admissible.", "A string form such as",
     "stops before the string-form alternative, which the profile does not admit"),
    ("§5.1.2.1", "CNP-0-JCS",
     "This draft selects", "CNP-0-JCS reuses the already implemented",
     "EXCLUDES the paragraph naming an existing JCS implementation, and the "
     "i128 history after it"),
    ("§5.1.2.2", "Fixed-point scale identity",
     "A fixed-point domain MUST bind", "##### 5.1.2.3",
     "the whole subsection"),
]

FRAME_HEAD = """# CNP-0-JCS — specification capsule

**This document is the whole of what you are given.** It is self-contained: it
does not refer to any existing implementation, and there is nothing else to
consult.

The quoted regions below are **verbatim** from the normative specification, and
that is machine-checked: each is delimited by a marker naming its clause and its
byte range in the source, and `harness/build_capsule.py --check` re-extracts them
and fails on a one-byte drift. The only text that is not quoted is this framing.
A paraphrase would test whether an implementation agrees with the paraphraser,
which is not the question.
"""

FRAME_TAIL = """
## What "canonical" means for each of the two operations

The specification defines one canonical byte sequence per value. The two
operations you implement differ in what they are asked about those bytes.

**encode** is given input bytes that may or may not already be canonical. It
either produces the canonical byte sequence for the value they denote, or
rejects them. It never repairs a value that the rules forbid.

**verify** is given input bytes and asked whether *those exact bytes* are the
canonical encoding. It never produces bytes. Input that denotes a legal value
but is not written canonically — different member order, insignificant
whitespace, an escape the canonical form does not use — is a rejection for
`verify` and ordinary input for `encode`.

Three consequences of §5.1.1 rule 4 and §5.1.2.1 that are easy to lose if the
input is decoded before it is examined: duplicate member names, ill-formed
UTF-8, and bytes after the end of the value cannot be detected once a permissive
parser has resolved them. Both operations receive the original bytes.

## What will be measured

A corpus of positive and negative cases drawn from the categories §5.1.3 of the
specification requires: the integer bounds; ratios and their rejections; one
fixed value under two scale descriptors; simplex sums; profile-identifier and
pinned-constant mutation; byte strings, normalization-distinct strings, member
order, and nested empty containers; and quantization boundaries.

Only the encode/verify behaviour described here is measured. You are not asked
to implement quantization, renormalization, or the optional discrete circle
family.

You will not be shown the corpus, the expected bytes, or the expected digests.
"""


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def extract(source: str) -> list[dict]:
    out = []
    for clause, heading, start, end, why in REGIONS:
        i = source.index(start)
        j = source.index(end, i)
        body = source[i:j].rstrip()
        out.append({
            "clause": clause, "heading": heading, "why_it_ends": why,
            "start": i, "end": i + len(body), "bytes": len(body.encode("utf-8")),
            "sha256": sha(body.encode("utf-8")), "body": body,
        })
    return out


def render(regions: list[dict], source_digest: str) -> str:
    parts = [FRAME_HEAD]
    for r in regions:
        parts.append(
            f"\n---\n\n## {r['clause']} — {r['heading']}\n\n"
            f"<!-- quoted {r['clause']} from {SOURCE_REL}"
            f" sha256:{source_digest[:16]}… bytes {r['start']}..{r['end']}"
            f" region-sha256:{r['sha256'][:16]}… -->\n\n"
            f"{r['body']}\n\n<!-- end quoted {r['clause']} -->\n"
        )
    parts.append("\n---\n")
    parts.append(FRAME_TAIL)
    return "".join(parts)


def check_sealed(rec: dict, source_digest: str) -> int:
    """A sealed capsule is checked against its pin, not against today's source."""
    if not os.path.exists(SPEC):
        print("FAIL capsule/SPEC.md is missing")
        return 1
    raw = open(SPEC, "rb").read()
    problems = []
    if sha(raw) != rec.get("capsule_sha256"):
        problems.append(
            "capsule/SPEC.md has been edited since it was sealed: "
            f"recorded {rec.get('capsule_sha256')}, now {sha(raw)}"
        )
    current = raw.decode("utf-8")
    for r in rec.get("regions", []):
        start = current.find(f"region-sha256:{r['sha256'][:16]}")
        if start < 0:
            problems.append(f"{r['clause']}: its pinned region marker is gone")
    if problems:
        for p_ in problems:
            print(f"FAIL {p_}")
        return 1
    print(f"ok  capsule sealed at {rec['sealed']}: {len(rec.get('regions', []))} "
          f"regions, sha256 {rec['capsule_sha256'][:12]}… unchanged")
    moved = rec.get("source_sha256") != source_digest
    print(f"ok  quoted {SOURCE_REL} at sha256 {rec.get('source_sha256', '')[:12]}…"
          + (f"; the source has since moved to {source_digest[:12]}… — expected, "
             "the capsule records what the model was shown, not what the "
             "specification says today" if moved else "; source unchanged"))
    return 0


def main() -> int:
    raw = open(SOURCE, "rb").read()
    source = raw.decode("utf-8")
    source_digest = sha(raw)
    regions = extract(source)
    text = render(regions, source_digest)

    check = "--check" in sys.argv
    if check:
        rec = json.load(open(VERBATIM)) if os.path.exists(VERBATIM) else {}
        if rec.get("sealed"):
            # The probe is closed. The capsule quoted the specification as it
            # stood at the digest recorded here; the specification has since
            # moved on, and re-deriving the capsule from today's source would
            # rewrite the record of what the model was actually shown. So the
            # question changes: not "does the capsule match the source now",
            # which it must not be forced to, but "is the committed capsule
            # still byte-for-byte what was pinned" — which still catches a
            # later hand-edit, and is the only property a sealed capsule can
            # honestly claim.
            return check_sealed(rec, source_digest)
        problems = []
        if not os.path.exists(SPEC):
            problems.append("capsule/SPEC.md is missing")
        else:
            current = open(SPEC, encoding="utf-8").read()
            if current != text:
                problems.append(
                    "capsule/SPEC.md differs from what the source produces; it has "
                    "drifted from the specification or been edited by hand"
                )
            for r in regions:
                if r["body"] not in current:
                    problems.append(f"{r['clause']} is not present verbatim in the capsule")
                if r["body"] not in source:
                    problems.append(f"{r['clause']} is no longer present in the source")
        if not rec:
            problems.append("provenance/verbatim.json is missing")
        elif rec.get("source_sha256") != source_digest:
            problems.append(
                "the specification has changed since the capsule was pinned: "
                f"recorded {rec.get('source_sha256')}, now {source_digest}"
            )
        if problems:
            for p_ in problems:
                print(f"FAIL {p_}")
            return 1
        quoted = sum(r["bytes"] for r in regions)
        total = len(text.encode("utf-8"))
        print(f"ok  capsule is verbatim: {len(regions)} regions, "
              f"{quoted}/{total} bytes quoted ({quoted * 100 // total}%)")
        print(f"ok  source {SOURCE_REL} still sha256 {source_digest[:12]}…")
        return 0

    open(SPEC, "w", encoding="utf-8").write(text)
    record = {
        "capsule": "cnp-0-cleanroom-spec@v0",
        "source": SOURCE_REL,
        "source_sha256": source_digest,
        "regions": [{k: v for k, v in r.items() if k != "body"} for r in regions],
        "capsule_sha256": sha(text.encode("utf-8")),
        "quoted_bytes": sum(r["bytes"] for r in regions),
        "capsule_bytes": len(text.encode("utf-8")),
    }
    os.makedirs(os.path.dirname(VERBATIM), exist_ok=True)
    json.dump(record, open(VERBATIM, "w"), indent=2, sort_keys=True)
    print(f"wrote capsule/SPEC.md ({record['capsule_bytes']} bytes, "
          f"{record['quoted_bytes']} quoted) and provenance/verbatim.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
