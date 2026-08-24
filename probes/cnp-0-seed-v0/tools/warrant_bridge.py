#!/usr/bin/env python3
"""Run Warrant's OWN canonicalizer over this corpus and report its bytes.

The parity adapter used to read Warrant's published vector file and compare it
with our encoder. That measures one direction only, and it never executes
Warrant. This bridge closes the other direction: it imports
`<warrant>/impl/warrant.py` and calls `warrant.canon()` on every positive case
of our corpus, so a disagreement between the two implementations surfaces on
OUR inputs rather than only on theirs.

It prints one JSON document on stdout and touches nothing.

Usage:
    python3 tools/warrant_bridge.py <warrant-checkout> <manifest.json>
"""

from __future__ import annotations

import json
import os
import sys


def main() -> int:
    if len(sys.argv) != 3:
        print(json.dumps({"ok": False, "error": "usage: warrant_bridge.py <warrant> <manifest>"}))
        return 2
    warrant_path, manifest_path = sys.argv[1], sys.argv[2]

    impl = os.path.join(warrant_path, "impl")
    if not os.path.isfile(os.path.join(impl, "warrant.py")):
        print(json.dumps({"ok": False, "error": "no impl/warrant.py at %s" % warrant_path}))
        return 1
    sys.path.insert(0, impl)
    try:
        import warrant  # type: ignore
    except Exception as exc:  # pragma: no cover - environment dependent
        print(json.dumps({"ok": False, "error": "import failed: %r" % (exc,)}))
        return 1
    if not hasattr(warrant, "canon"):
        print(json.dumps({"ok": False, "error": "warrant.canon is absent"}))
        return 1

    with open(manifest_path, encoding="utf-8") as fh:
        manifest = json.load(fh)

    results = []
    for case in manifest["cases"]:
        if case.get("kind") != "encode":
            continue
        accept = case.get("encoder", {}).get("accept")
        if not accept:
            continue
        # Parse OUR canonical text, hand the value to THEIR canonicalizer.
        value = json.loads(accept["canonical"])
        try:
            produced = warrant.canon(value)
        except Exception as exc:
            results.append({"id": case["id"], "error": "%r" % (exc,)})
            continue
        results.append({"id": case["id"], "hex": produced.hex()})

    print(json.dumps({
        "ok": True,
        "warrant_impl": os.path.join(impl, "warrant.py"),
        "results": results,
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
