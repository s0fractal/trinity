#!/usr/bin/env python3
"""probes/handle-collision-v0/collide.py

RFC-0004 §5.1 rule 4 says of trinity's `h.` handle:

    The 12-hex form is a handle, not a security binding. Forty-eight bits is
    adequate for human-readable addressing and accidental-collision avoidance,
    and inadequate against an adversary who can grind for a collision.

That is a textbook claim, and until now nobody in this repository had made it
fail. By this session's own standard — a claim that has never been given the
chance to be wrong is a claim, not a check — it was unearned.

This grinds an actual collision: two distinct byte strings whose
CANONICAL_HASH.v0.1 handles are identical.

Method. A full birthday search over 48 bits needs ~2^24 stored samples, which
is memory-heavy in pure Python. Instead this keeps only candidates whose
48-bit prefix ends in `TRAILING_ZERO_BITS` zero bits — a distinguished-point
filter. That searches a 48-k bit subspace with 1/2^k of the memory, at the
cost of generating 2^k times more candidates. Hashing is cheap; RAM is not.

The collision found is a genuine 48-bit prefix collision. It just happens to
live in the filtered subspace.

WHAT THIS DOES AND DOES NOT SHOW — the distinction matters for what §5.1.4
should require:

  * SHOWN: an adversary can produce TWO inputs sharing one handle. That is the
    attack the protocol cares about — author a benign object, get its handle
    approved, substitute the malicious twin later. Cost demonstrated below.

  * NOT SHOWN: an adversary cannot take an EXISTING handle and find a second
    input matching it. That is a second preimage, ~2^48 work, and this probe
    makes no claim about it.

Run:  python3 probes/handle-collision-v0/collide.py
      python3 probes/handle-collision-v0/collide.py --json
Exit: 0 if a collision was found (the §5.1.4 claim is demonstrated)
      1 if none was found within the budget (report says so; do not read
        that as evidence the handle is safe — read it as this probe being
        underpowered, and raise MAX_CANDIDATES)
"""

import hashlib
import json
import sys
import time

# CANONICAL_HASH.v0.1: fqdn_prefix(body) = "h." || first_12_hex(sha256(utf8(body)))
HANDLE_HEX = 12
HANDLE_BITS = HANDLE_HEX * 4  # 48

TRAILING_ZERO_BITS = 6  # distinguished-point filter; memory / work trade
MAX_CANDIDATES = 1 << 29  # generation budget (~3.5 min, ~0.8 GB, p>0.999)
REPORT_EVERY = 1 << 22


def handle(data: bytes) -> str:
    return "h." + hashlib.sha256(data).hexdigest()[:HANDLE_HEX]


def prefix48(data: bytes) -> int:
    return int.from_bytes(hashlib.sha256(data).digest()[:6], "big")


def main() -> int:
    want_json = "--json" in sys.argv
    mask = (1 << TRAILING_ZERO_BITS) - 1

    seen: dict[int, int] = {}
    started = time.time()
    generated = 0
    stored = 0
    found = None

    while generated < MAX_CANDIDATES:
        # Deterministic candidates, so a reader can regenerate either side of
        # the collision from its index alone — no blob needs to be committed
        # for the result to be checkable.
        body = b"trinity-handle-collision-probe-%d" % generated
        p = prefix48(body)
        generated += 1

        if p & mask:
            continue

        prior = seen.get(p)
        if prior is not None:
            found = (prior, generated - 1, p)
            break
        seen[p] = generated - 1
        stored += 1

        if not want_json and stored % REPORT_EVERY == 0:
            print(
                f"  generated {generated:>12,}  stored {stored:>10,}  "
                f"{time.time() - started:6.1f}s",
                file=sys.stderr,
            )

    elapsed = time.time() - started

    if found is None:
        report = {
            "probe": "handle-collision-v0",
            "found": False,
            "generated": generated,
            "stored": stored,
            "elapsed_seconds": round(elapsed, 2),
            "note": (
                "no collision within budget — this probe is underpowered, NOT "
                "evidence that a 48-bit handle is safe. Raise MAX_CANDIDATES."
            ),
        }
        print(json.dumps(report, indent=2) if want_json else report["note"])
        return 1

    i, j, p = found
    a = b"trinity-handle-collision-probe-%d" % i
    b = b"trinity-handle-collision-probe-%d" % j
    ha, hb = handle(a), handle(b)
    assert ha == hb, "internal error: reported collision does not collide"
    assert a != b, "internal error: same input reported twice"

    full_a = hashlib.sha256(a).hexdigest()
    full_b = hashlib.sha256(b).hexdigest()

    report = {
        "probe": "handle-collision-v0",
        "found": True,
        "claim_tested": "RFC-0004 §5.1 rule 4 — 48 bits is grindable",
        "input_a": a.decode(),
        "input_b": b.decode(),
        "shared_handle": ha,
        "full_digest_a": full_a,
        "full_digest_b": full_b,
        "full_digests_differ": full_a != full_b,
        "generated": generated,
        "stored": stored,
        "elapsed_seconds": round(elapsed, 2),
        "consequence": (
            "two distinct bodies resolve to one `h.` handle. A reference that "
            "names only the handle does not identify which body it meant. The "
            "full digest, which differs, does."
        ),
        "not_shown": (
            "second preimage against an EXISTING handle (~2^48) is not "
            "demonstrated and is not claimed"
        ),
    }

    if want_json:
        print(json.dumps(report, indent=2))
        return 0

    print("# handle collision — RFC-0004 §5.1 rule 4, demonstrated\n")
    print(f"  input A         {report['input_a']}")
    print(f"  input B         {report['input_b']}")
    print(f"  shared handle   {ha}")
    print()
    print(f"  full digest A   {full_a}")
    print(f"  full digest B   {full_b}")
    print(f"  digests differ  {report['full_digests_differ']}")
    print()
    print(f"  generated       {generated:,} candidates")
    print(f"  stored          {stored:,}")
    print(f"  elapsed         {elapsed:.1f}s on one core, stdlib only")
    print()
    print(f"  → {report['consequence']}")
    print(f"  → not shown: {report['not_shown']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
