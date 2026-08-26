#!/usr/bin/env python3
"""Derive the conformance kit from the normative sources, and pin it.

The kit must be checkable by someone who does not have this repository and does
not trust it. That means every file it ships has to be derivable here and
verifiable there:

* the corpus is projected from `probes/cnp-0-seed-v0/corpus/manifest.json`,
  flattened into one self-describing line per case with no cross-references;
* the specification extract is quoted verbatim from Part 01 by byte range, with
  each region's own digest in its marker;
* `MANIFEST.sha256` pins every shipped file, and the runner refuses to score
  against a kit whose files do not match it, so a tampered corpus is a hard stop
  rather than a quietly different result.

`--check` re-derives everything and fails on a one-byte drift in either
direction.

Usage:
    python3 tools/build_kit.py            # write the kit
    python3 tools/build_kit.py --check    # verify it against the sources
"""

from __future__ import annotations

import hashlib
import json
import os
import stat
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
SEED = os.path.join(ROOT, "probes", "cnp-0-seed-v0", "corpus", "manifest.json")
SPEC = os.path.join(ROOT, "docs", "rfc", "0003-heterogeneous-state-protocol",
                    "01-canonical-identity-and-encoding.md")
SPEC_REL = "docs/rfc/0003-heterogeneous-state-protocol/01-canonical-identity-and-encoding.md"
CONTRACT_SRC = os.path.join(ROOT, "contracts", "CANONICAL_ENCODING.v0.1.md")
CONTRACT_REL = "contracts/CANONICAL_ENCODING.v0.1.md"
CONTRACT_DST = os.path.join(HERE, "CONTRACT.md")

REQUIRED = os.path.join(HERE, "corpus", "required.ndjson")
EXTENDED = os.path.join(HERE, "corpus", "extended.ndjson")
EXTRACT = os.path.join(HERE, "SPEC-EXTRACT.md")
MANIFEST = os.path.join(HERE, "MANIFEST.sha256")

# The closed inventory. `run_conformance.py` refuses a kit containing anything
# not on this list, so adding a file here is a deliberate act.
PINNED = ["CONTRACT.md", "INTERFACE.md", "README.md", "SPEC-EXTRACT.md",
          "corpus/extended.ndjson", "corpus/required.ndjson",
          "run_conformance.py", "selftest.py", "tools/build_kit.py",
          "ts/kit_test.ts"]

CONTRACT_HEAD = """<!-- Verbatim copy of {rel} at sha256:{digest}.
     §5.1.3 requires the contract inside the kit: a kit that cited a document it
     did not carry would not be usable by someone who has only the kit, which is
     the whole point. tools/build_kit.py --check fails on a one-byte drift.
     Where this copy and the original disagree, the original governs; where the
     original and Part 01 disagree, Part 01 governs. -->

"""

# (clause, heading, start anchor, end anchor, why it ends there)
#
# Anchors are structural — headings — wherever a subsection is wanted whole.
# §5.1.3's region used to start at the prose "**Design selected; conformance
# pending.**", which is exactly the sentence a ratification rewrites: the anchor
# moved with the status it described and the extraction broke. A boundary that
# changes when the content changes is not a boundary. The two regions that still
# stop mid-section stop at a following heading or at a named sentence that is
# there to be excluded, and each says which below.
REGIONS = [
    ("§5.1.1", "Canonical encoding is normative, not an implementation detail",
     "The encoding MUST satisfy:", "Rule 5 reverses",
     "stops before the pointer into the revision history"),
    ("§5.1.2", "Floating point",
     "In canonical form:", "##### Non-integer values",
     "the five rules; the subsection follows separately"),
    ("§5.1.2", "Non-integer values inside an integers-only domain",
     "Two patterns are admissible.", "A string form such as",
     "stops before the string form, which the profile does not admit"),
    ("§5.1.2.1", "CNP-0-JCS",
     "This draft selects", "CNP-0-JCS reuses the already implemented",
     "stops before the paragraph naming an existing implementation"),
    ("§5.1.2.2", "Fixed-point scale identity",
     "A fixed-point domain MUST bind", "##### 5.1.2.3", "the whole subsection"),
    ("§5.1.3", "Parity is proven, not assumed",
     "#### 5.1.3 Parity is proven, not assumed", "#### 5.1.4",
     "heading to heading — the whole subsection"),
]

EXTRACT_HEAD = """# CNP-0-JCS — normative extract

Everything below between the `quoted` markers is **verbatim** from RFC-0003
Part 01, and that is machine-checked: each region carries the clause it comes
from, its byte range in the source, and its own digest, and
`tools/build_kit.py --check` re-extracts and fails on a one-byte drift.

This extract is a convenience, not an authority. Where it and Part 01 disagree,
**Part 01 governs**. It is included so the kit can be read without fetching the
RFC, not so it can replace it.
"""


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def raw_bytes(case: dict) -> bytes:
    if "raw_hex" in case:
        return bytes.fromhex(case["raw_hex"])
    return case["raw"].encode("utf-8")


def project(case: dict) -> dict:
    """One corpus case, flattened so a line carries everything needed to score it."""
    data = raw_bytes(case)
    out = {
        "id": case["id"], "category": case["category"], "clause": case["clause"],
        "title": case["title"], "raw_hex": data.hex(),
    }
    enc = case["encoder"]
    if "accept" in enc:
        canonical = enc["accept"]["canonical"].encode("utf-8")
        out["encode"] = {"ok": True, "canonical_hex": canonical.hex(),
                         "sha256": enc["accept"]["sha256"]}
        if enc["accept"]["sha256"] != sha(canonical):
            raise SystemExit(f"{case['id']}: the seed manifest's own digest does not "
                             "match its canonical bytes")
    else:
        out["encode"] = {"ok": False, "category": enc["reject"]}
    ver = case["verifier"]
    if ver == "accept":
        out["verify"] = {"ok": True, "sha256": sha(data)}
    else:
        out["verify"] = {"ok": False, "category": ver["reject"]}
    if "digest_group" in case:
        out["digest_group"] = case["digest_group"]
    return out


def build_corpus() -> tuple[str, str, dict]:
    seed = json.load(open(SEED))
    required, extended = [], []
    for case in seed["cases"]:
        if case["kind"] == "encode":
            required.append(json.dumps(project(case), sort_keys=True,
                                       ensure_ascii=False, separators=(",", ":")))
        else:
            extended.append(json.dumps(case, sort_keys=True, ensure_ascii=False,
                                       separators=(",", ":")))
    return "\n".join(required) + "\n", "\n".join(extended) + "\n", seed


def build_contract() -> tuple[str, str]:
    raw = open(CONTRACT_SRC, "rb").read()
    digest = sha(raw)
    head = CONTRACT_HEAD.format(rel=CONTRACT_REL, digest=digest)
    return head + raw.decode("utf-8"), digest


def build_extract() -> tuple[str, list[dict], str]:
    raw = open(SPEC, "rb").read()
    source = raw.decode("utf-8")
    digest = sha(raw)
    parts, regions = [EXTRACT_HEAD], []
    for clause, heading, start, end, why in REGIONS:
        i = source.index(start)
        j = source.index(end, i)
        body = source[i:j].rstrip()
        rec = {"clause": clause, "heading": heading, "why_it_ends": why,
               "start": i, "end": i + len(body),
               "bytes": len(body.encode("utf-8")), "sha256": sha(body.encode("utf-8"))}
        regions.append(rec)
        parts.append(
            f"\n---\n\n## {clause} — {heading}\n\n"
            f"<!-- quoted {clause} from {SPEC_REL} sha256:{digest[:16]}…"
            f" bytes {rec['start']}..{rec['end']}"
            f" region-sha256:{rec['sha256'][:16]}… -->\n\n"
            f"{body}\n\n<!-- end quoted {clause} -->\n"
        )
    parts.append("\n---\n")
    return "".join(parts), regions, digest


def manifest_text() -> str:
    lines = []
    for rel in PINNED:
        path = os.path.join(HERE, rel)
        if not os.path.exists(path):
            raise SystemExit(f"{rel} is missing; the kit cannot be pinned incomplete")
        lines.append(f"{sha(open(path, 'rb').read())}  {rel}")
    return "\n".join(lines) + "\n"


def main() -> int:
    check = "--check" in sys.argv
    if check:
        # Same order as the runner: look at the tree before opening anything in
        # it. A symlink or a special file is refused here rather than followed.
        refusals = []
        stack = [HERE]
        while stack:
            current = stack.pop()
            for name in sorted(os.listdir(current)):
                full = os.path.join(current, name)
                rel = os.path.relpath(full, HERE).replace(os.sep, "/")
                st = os.lstat(full)
                if stat.S_ISLNK(st.st_mode):
                    refusals.append(f"{rel} is a symlink")
                elif stat.S_ISDIR(st.st_mode):
                    stack.append(full)
                elif not stat.S_ISREG(st.st_mode):
                    refusals.append(f"{rel} is not a regular file")
        if refusals:
            for r in refusals:
                print(f"FAIL {r}")
            print("\nNothing was opened. The kit must be plain files.")
            return 1

    required, extended, seed = build_corpus()
    extract, regions, spec_digest = build_extract()
    contract, contract_digest = build_contract()

    if check:
        problems = []
        for path, want, what in ((REQUIRED, required, "corpus/required.ndjson"),
                                 (EXTENDED, extended, "corpus/extended.ndjson"),
                                 (EXTRACT, extract, "SPEC-EXTRACT.md"),
                                 (CONTRACT_DST, contract, "CONTRACT.md")):
            if not os.path.exists(path):
                problems.append(f"{what} is missing")
            elif open(path, encoding="utf-8").read() != want:
                problems.append(f"{what} differs from what the sources produce")
        # No exemption, not even for generated bytecode: an ignored directory is
        # a hole, and `__pycache__/unlisted_reference_impl.py` walked straight
        # through the previous one.
        listed = set(PINNED)
        for root, dirs, names in os.walk(HERE, followlinks=False):
            for name in sorted(dirs) + sorted(names):
                full = os.path.join(root, name)
                rel = os.path.relpath(full, HERE).replace(os.sep, "/")
                if os.path.islink(full):
                    problems.append(f"{rel} is a symlink; the kit must be its own bytes")
                    continue
                if os.path.isdir(full):
                    if not any(p.startswith(rel + "/") for p in listed):
                        problems.append(
                            f"{rel}/ holds nothing pinned; the runner will refuse "
                            "the kit"
                        )
                    continue
                if rel != "MANIFEST.sha256" and rel not in listed:
                    problems.append(
                        f"{rel} is in the kit but not in PINNED; the inventory is "
                        "closed and the runner will refuse the kit"
                    )
        if os.path.exists(MANIFEST):
            current = manifest_text()
            if open(MANIFEST, encoding="utf-8").read() != current:
                problems.append("MANIFEST.sha256 does not pin the kit as it stands")
        else:
            problems.append("MANIFEST.sha256 is missing")
        if problems:
            for p in problems:
                print(f"FAIL {p}")
            print("\nThe kit has drifted from the specification it claims to carry. "
                  "That is the check\nworking: re-derive it deliberately with "
                  "`python3 tools/build_kit.py`, read what changed,\nand commit "
                  "the new pins with the edit that caused them.")
            return 1
        n_req = len(required.strip().split("\n"))
        n_ext = len(extended.strip().split("\n"))
        print(f"ok  corpus: {n_req} required, {n_ext} extended, projected from "
              "the seed manifest")
        print(f"ok  extract: {len(regions)} regions verbatim from {SPEC_REL} "
              f"sha256 {spec_digest[:12]}…")
        print(f"ok  contract carried verbatim, {CONTRACT_REL} sha256 "
              f"{contract_digest[:12]}…")
        print(f"ok  MANIFEST.sha256 pins {len(PINNED)} files, and nothing in the "
              "kit is unpinned")
        print(f"ok  MANIFEST.sha256 itself: {sha(open(MANIFEST, 'rb').read())}")
        return 0

    open(REQUIRED, "w", encoding="utf-8").write(required)
    open(EXTENDED, "w", encoding="utf-8").write(extended)
    open(EXTRACT, "w", encoding="utf-8").write(extract)
    open(CONTRACT_DST, "w", encoding="utf-8").write(contract)
    open(MANIFEST, "w", encoding="utf-8").write(manifest_text())
    print(f"wrote corpus ({len(required.strip().splitlines())} required, "
          f"{len(extended.strip().splitlines())} extended), SPEC-EXTRACT.md, "
          f"CONTRACT.md, MANIFEST.sha256")
    print(f"MANIFEST.sha256 itself: {sha(open(MANIFEST, 'rb').read())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
