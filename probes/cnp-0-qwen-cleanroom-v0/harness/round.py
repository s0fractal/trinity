#!/usr/bin/env python3
"""One proctored round: prompt the model, write what it emitted, build in the sandbox.

The proctor carries text one way and machine output the other. This script is
written so it cannot quietly do more:

* the prompt is the pinned pack, plus — from round 2 — the previous round's
  cargo output and nothing else. There is no way to hand it an arbitrary file;
  an earlier version took `--feedback <path>` and a reviewer fed it a contract,
  which is exactly the leak the clean room exists to prevent;
* what it writes is what it extracted, byte for byte, digested before anything
  touches it. `cargo fmt` runs as `--check`, never as a rewrite;
* every command runs in the sandbox of `sandbox.py`: no network, no host
  filesystem, pinned image;
* a bounded number of rounds before the freeze — three by default, and any
  change to that a committed decision in `provenance/budget.json`.

Usage:
    python3 harness/round.py --workdir ~/cnp0-cleanroom
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

import pack as packmod
import sandbox
import tree

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRANSCRIPT = os.path.join(HERE, "provenance", "transcript")

PACK_FILES = ["capsule/SPEC.md", "capsule/INTERFACE.md", "capsule/EXAMPLES.ndjson",
              "capsule/TASK.md"]
# Explicit rather than sniffed: `ollama show` does not report thinking support,
# and a wrong guess either wastes an hour of hidden reasoning or errors out.
MODELS = {
    "qwen3.8:27b-mlx": {"id": "5642e97495e1", "think": True},
    "qwen3-coder:30b": {"id": "06c1097efce0", "think": False},
}
MAX_PRE_FREEZE_ROUNDS = 3
# A round is a conversation with itself, not a single shot. Requiring a whole
# strict parser, a JCS serializer, a numeric profile and a hand-written SHA-256
# in one uninterrupted generation was a property of my protocol, not of the
# clean room: what must stay closed is the INFORMATION the model gets, not the
# number of turns it takes to write the code.
MAX_TURNS_PER_ROUND = 8
TURN_TIMEOUT_S = 1200
# Everything else in this harness has a deadline; the model call did not, and a
# wedged ollama runner held one round open for two and a half hours without
# writing anything. A generation that does not finish is a failed generation.
MODEL_TIMEOUT_S = 3600
FILE_BLOCK = re.compile(
    r"^FILE:\s*(?P<path>[A-Za-z0-9_./-]+)\s*\n+```[a-zA-Z]*\n(?P<body>.*?)\n```",
    re.M | re.S,
)


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def live_model_id(model: str) -> str | None:
    """The id ollama will actually serve, read now rather than trusted from a note."""
    proc = subprocess.run(["ollama", "list"], capture_output=True, text=True)
    for line in proc.stdout.splitlines():
        parts = line.split()
        if parts and parts[0] == model:
            return parts[1] if len(parts) > 1 else None
    return None


API = "http://127.0.0.1:11434/api/generate"


def generate(model: str, prompt: str, think: bool, timeout: int) -> dict:
    """One turn, over ollama's HTTP API rather than `ollama run`.

    `ollama run` writes to a terminal even when its stdout is a pipe: round 3
    came back with 118 cursor-movement and erase-line sequences spliced into the
    model's Rust, so lines like `"ratio-non-positive-denominat\x1b[29D\x1b[K"`
    were recorded as the model's own bytes. They were not. Re-deriving the
    intended text means emulating a terminal, which is exactly the kind of quiet
    repair that makes a transcript worthless.

    The API returns the generated string with no display layer over it, and
    reports how many tokens the prompt and the response actually used — which is
    a better provenance record than scraping a column out of `ollama ps`.

    No `options` are sent, so the server's own defaults govern and the result
    stays attributable to the model as configured rather than to the proctor.
    """
    body = {"model": model, "prompt": prompt, "stream": False}
    if think:
        body["think"] = "high"
    req = urllib.request.Request(
        API, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def served_context(model: str) -> int | None:
    """The context window the server actually gave this model, not the card's.

    A model card advertises what the weights support; `ollama serve` loads a
    `num_ctx` that may be far smaller, and a prompt over that limit is silently
    truncated at the front — which in a multi-turn round is exactly where the
    specification sits. Read while the model is resident, recorded per round, so
    a truncated run is visible afterwards rather than inferred.
    """
    proc = subprocess.run(["ollama", "ps"], capture_output=True, text=True)
    if proc.returncode != 0:
        return None
    for line in proc.stdout.splitlines()[1:]:
        cols = line.split()
        if cols and cols[0] == model:
            for col in cols:
                if col.isdigit() and int(col) >= 1024:
                    return int(col)
    return None


def rounds_so_far() -> list[dict]:
    os.makedirs(TRANSCRIPT, exist_ok=True)
    out = []
    for name in sorted(os.listdir(TRANSCRIPT)):
        if re.fullmatch(r"round-\d+\.json", name):
            out.append(json.load(open(os.path.join(TRANSCRIPT, name))))
    return out


def previous_feedback(prior: list[dict]) -> tuple[str | None, str | None]:
    """The ONLY feedback channel before the freeze: the last round's cargo output.

    Absence is not evidence of a pre-cargo failure. Treating it that way was a
    bypass: a recorded `cargo.txt` could simply be deleted and the next round ran
    with no feedback and no complaint. So absence is legal only when the record
    itself says cargo never ran — no digest, no exits, and an error on the record.
    """
    if not prior:
        return None, None
    last = prior[-1]
    n = last["round"]
    path = os.path.join(TRANSCRIPT, f"round-{n:02d}", "cargo.txt")
    recorded = last.get("cargo_output_sha256")
    exits = last.get("cargo")
    reached_cargo = bool(recorded) or bool(exits)

    if not os.path.exists(path):
        if reached_cargo:
            raise SystemExit(
                f"round {n} recorded cargo output"
                + (f" (sha256 {recorded})" if recorded else f" (exits {exits})")
                + f" but {path} is gone.\n"
                "The pre-freeze feedback channel is the only thing carried between "
                "rounds; a missing record of it is a refusal, not an empty channel."
            )
        if not last.get("error"):
            raise SystemExit(
                f"round {n} has no cargo output and no recorded error explaining "
                "why cargo never ran. Refusing to proceed on an unexplained gap."
            )
        return None, None  # a genuine pre-cargo failure, recorded as one

    data = open(path, "rb").read()
    digest = sha(data)
    if not recorded:
        raise SystemExit(
            f"round {n} has a cargo.txt but recorded no digest for it. Feedback "
            "must be pinned when it is produced, or it cannot be checked later."
        )
    if recorded != digest:
        raise SystemExit(
            f"round {n} cargo output has been modified since it was produced\n"
            f"  recorded {recorded}\n  now      {digest}\n"
            "The pre-freeze feedback channel carries machine output only; refusing."
        )
    return data.decode("utf-8", "replace"), digest


def build_prompt(feedback: str | None, accumulated: dict[str, str],
                 cargo_now: str | None, turn: int,
                 refused: str | None = None) -> str:
    """The pack, the model's own work so far, and machine output. Nothing else.

    Everything added here is fixed scaffolding: no description of the task, no
    hint about the bytes, nothing that varies with what the model got wrong.
    """
    parts = [
        "You are implementing a specification from scratch. Everything you are "
        "given follows. There is no other source to consult.\n",
    ]
    for rel in PACK_FILES:
        body = open(os.path.join(HERE, rel), encoding="utf-8").read()
        parts.append(f"\n===== {os.path.basename(rel)} =====\n{body}\n")
    if feedback:
        parts.append(
            "\n===== BUILD OUTPUT FROM THE PREVIOUS ROUND =====\n"
            "This is compiler and test output, verbatim. No one has reviewed your "
            "design, and no one will.\n\n" + feedback + "\n"
        )
    if accumulated:
        parts.append("\n===== THE FILES YOU HAVE WRITTEN SO FAR =====\n")
        for rel in sorted(accumulated):
            parts.append(f"\nFILE: {rel}\n```\n{accumulated[rel]}\n```\n")
    if cargo_now:
        parts.append(
            "\n===== BUILD OUTPUT FOR THOSE FILES =====\n" + cargo_now + "\n"
        )
    if refused:
        parts.append(
            "\n===== YOUR LAST REPLY WAS NOT ACCEPTED =====\n"
            "This is about the format of the reply, not its content. Nothing in "
            "it was kept.\n\n" + refused + "\n"
        )
    if turn == 1 and not accumulated:
        parts.append(
            "\n===== NOW =====\nBegin. Emit files, each preceded by its "
            "`FILE: <path>` line and given whole inside a fenced block. You may "
            "work across several turns.\n"
        )
    else:
        parts.append(
            "\n===== NOW =====\nContinue. Emit any file you want to add or "
            "replace, each whole, preceded by its `FILE: <path>` line. Say DONE "
            "on a line of its own when the set is complete.\n"
        )
    return "".join(parts)


def extract_files(output: str) -> list[tuple[str, str]]:
    """A LIST, not a dict: two blocks for one path must be visible, not silently
    resolved in favour of the last one."""
    return [(m.group("path"), m.group("body")) for m in FILE_BLOCK.finditer(output)]


def assert_pack_is_current() -> str:
    """The prompt is built from the capsule files; the pin must describe them.

    An earlier version read the capsule live and the digest from pack.json
    without comparing them, so a future run could have recorded a pin that
    described a pack it never sent.
    """
    recorded = json.load(open(os.path.join(HERE, "provenance", "pack.json")))
    problems = packmod.leak_check()
    if problems:
        raise SystemExit("the capsule leaks:\n  " + "\n  ".join(problems))
    current = packmod.build()
    if current["pack_sha256"] != recorded["pack_sha256"]:
        raise SystemExit(
            "the capsule has changed since the pack was pinned:\n"
            f"  pinned  {recorded['pack_sha256']}\n"
            f"  current {current['pack_sha256']}\n"
            "Re-pin deliberately with `python3 harness/pack.py --write`; a prompt "
            "must not be recorded under a digest that does not describe it."
        )
    return current["pack_sha256"]


BUDGET = os.path.join(HERE, "provenance", "budget.json")
OUTCOME = os.path.join(HERE, "provenance", "outcome.json")


FREEZE = os.path.join(HERE, "provenance", "freeze.json")


def inconclusive(budget: int) -> str:
    return (
        f"INCONCLUSIVE: no freeze-ready candidate within the agreed {budget}-round "
        "model/capsule/tooling budget; not evidence of RFC failure"
    )


def effective_budget(prior: list[dict] | None = None) -> tuple[int, list[int], str]:
    """The round budget, and any recorded decision that changed it.

    The default lives in code. A change to it lives in `provenance/budget.json`
    as a committed artifact naming who decided and why — not as an edited
    constant, because a budget quietly raised by the party it benefits is not a
    budget.

    A discounted round is the sharper risk, so the file cannot simply assert one.
    A round may be excused only if the model **never produced anything and the
    invocation itself failed** — a non-zero exit with no output, which is what a
    proctor's bad flag looks like. A round the model actually ran, and a round it
    ran out of time on, cannot be excused however the file is written: a bad
    result is exactly what a budget is for.
    """
    if not os.path.exists(BUDGET):
        return MAX_PRE_FREEZE_ROUNDS, [], "the default"
    rec = json.load(open(BUDGET))
    rounds = int(rec["rounds"])
    excused = [int(x) for x in rec.get("not_counted", [])]
    if prior is not None:
        by_n = {r["round"]: r for r in prior}
        for n in excused:
            r = by_n.get(n)
            if r is None:
                continue
            exit_code, produced = r.get("model_exit"), r.get("output_bytes") or 0
            if exit_code == 0 or exit_code is None or produced:
                raise SystemExit(
                    f"refusing: provenance/budget.json discounts round {n}, but "
                    f"that round recorded model_exit {exit_code!r} and "
                    f"{produced} bytes of output. Only a failed invocation that "
                    "produced nothing may be excused; a round the model ran is a "
                    "round it spent."
                )
    return rounds, excused, rec.get("decided_by", "unrecorded") + ": " + rec.get("reason", "")


def compare_trees(emitted: dict, final: dict) -> tuple[list[str], list[str]]:
    """What the build changed, split into what cargo may change and what it may not.

    Cargo writes `Cargo.lock` itself, so that one is attributed rather than
    counted as tampering. Anything else appearing, changing, or vanishing means
    the tree that was measured is not the tree the model emitted.
    """
    changed, cargo_generated = [], []
    for rel, meta in final.items():
        before = emitted.get(rel)
        if before is None or before["sha256"] != meta["sha256"]:
            (cargo_generated if rel == "Cargo.lock" else changed).append(rel)
    for rel in emitted:
        if rel not in final:
            changed.append(rel)
    return sorted(set(changed)), sorted(set(cargo_generated))


def compute_freeze_ready(model_exit, exits: dict, modified: list, tree_error) -> bool:
    """Freeze-ready means all four cargo commands clean, the generation itself
    succeeded, and the build rewrote nothing of the model's."""
    return (
        model_exit == 0
        and all(exits.get(sub) == 0 for sub in ("fmt", "check", "build", "test"))
        and not modified
        and not tree_error
    )


def finish(record: dict, n: int, prior: list[dict]) -> int:
    """Write the round record, and the outcome if the budget is now spent.

    Every way a round can end goes through here. An earlier version wrote
    INCONCLUSIVE only when the third round failed to COMPILE, so a third round
    that compiled but failed `test` — or that never reached cargo at all —
    left the experiment with no outcome and no legal next step. A state machine
    with a state nobody can leave is worse than one that ends badly.
    """
    json.dump(record, open(os.path.join(TRANSCRIPT, f"round-{n:02d}.json"), "w"),
              indent=2, sort_keys=True)
    if record.get("freeze_ready"):
        return 0
    budget, not_counted, _ = effective_budget(prior)
    counted = [r for r in prior if r["round"] not in not_counted] + [record]
    if len(counted) >= budget:
        digests = [r.get("output_sha256") for r in counted]
        write_outcome("INCONCLUSIVE", inconclusive(budget), len(counted), digests)
        print(f"  budget spent after {len(counted)} counted round(s) with no "
              "freeze-ready candidate.")
        print(f"  recorded: {inconclusive(budget)}")
        print("  There is no fourth round, and this is not a claim about the "
              "specification.")
    return 0


def write_outcome(status: str, detail: str, rounds: int,
                  round_output_digests: list | None = None) -> None:
    if os.path.exists(OUTCOME):
        return  # an outcome is written once
    json.dump(
        {"status": status, "detail": detail, "rounds": rounds,
         "round_output_sha256": round_output_digests or [],
         "recorded": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
        open(OUTCOME, "w"), indent=2, sort_keys=True,
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", required=True)
    ap.add_argument("--model", default="qwen3.8:27b-mlx")
    ap.add_argument("--dry-run", action="store_true",
                    help="build and digest the prompt without calling the model")
    args = ap.parse_args()

    workdir = os.path.realpath(os.path.expanduser(args.workdir))

    # The protocol refusals come FIRST, deliberately. They are the ones that
    # decide whether a round may happen at all, and they must not depend on
    # Docker being installed: a budget check that only works where the sandbox
    # works is a budget check that silently stops being enforced.
    pack_sha = assert_pack_is_current()

    if os.path.exists(FREEZE):
        raise SystemExit(
            "a freeze exists: the candidate is fixed and rounds are over. Anything "
            "after the freeze is informed by the corpus and is not clean-room in "
            "the same sense."
        )
    if os.path.exists(OUTCOME):
        rec = json.load(open(OUTCOME))
        raise SystemExit(f"an outcome is already recorded: {rec['status']}")

    prior = rounds_so_far()
    budget, not_counted, budget_source = effective_budget(prior)
    counted = [r for r in prior if r["round"] not in not_counted]
    if any(r.get("freeze_ready") for r in prior):
        raise SystemExit(
            "a previous round is freeze-ready. The only next step is the freeze — "
            "a further prompt round would be tuning the candidate before it is "
            "pinned, which is the thing the freeze exists to prevent:\n"
            f"    python3 harness/freeze.py --workdir {workdir}"
        )
    n = len(prior) + 1
    if len(counted) >= budget:
        # The budget is spent. If the process died between recording the last
        # round and writing the outcome, reconstruct it here: the outcome is a
        # function of the rounds, so it is deterministic, and leaving it unwritten
        # would let a crash erase the experiment's conclusion.
        if not os.path.exists(OUTCOME):
            write_outcome("INCONCLUSIVE", inconclusive(budget), len(counted),
                          [r.get("output_sha256") for r in counted])
            print("recovered the outcome that was never written: "
                  f"{inconclusive(budget)}")
        raise SystemExit(
            f"the budget is {budget} counted round(s) ({budget_source}) and they "
            "are spent. The recorded outcome is INCONCLUSIVE; there is no fourth "
            "round."
        )

    feedback, feedback_sha = previous_feedback(prior)

    record = {
        "round": n,
        "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model": args.model,
        "pack_sha256": pack_sha,
        "feedback_sha256": feedback_sha,
        "workdir": workdir,
        "image": sandbox.IMAGE,
        "max_turns": MAX_TURNS_PER_ROUND,
        "turn_timeout_s": TURN_TIMEOUT_S,
    }

    if args.dry_run:
        first = build_prompt(feedback, {}, None, 1)
        print(f"dry run: round {n}, first-turn prompt {len(first.encode())} bytes, "
              f"sha256 {sha(first.encode('utf-8'))}")
        print(f"feedback carried: {'the previous cargo output' if feedback else 'none'}")
        print(f"model {args.model}, up to {MAX_TURNS_PER_ROUND} turns of "
              f"{TURN_TIMEOUT_S}s")
        print(f"budget: {len(counted)}/{budget} counted round(s) spent — "
              f"{budget_source}")
        return 0

    # Only now does the sandbox matter: from here on something actually runs.
    workdir = sandbox.preflight(workdir)
    record["workdir"] = workdir

    spec = MODELS.get(args.model)
    if spec is None:
        raise SystemExit(
            f"{args.model} is not a recorded model. Add it to MODELS with its id "
            "and whether it supports thinking, so a result can be attributed."
        )
    live = live_model_id(args.model)
    record["model_id_live"] = live
    record["model_id_expected"] = spec["id"]
    record["thinking"] = spec["think"]
    if live != spec["id"]:
        raise SystemExit(
            f"model id mismatch: {args.model} is {live}, expected {spec['id']}. "
            "A tag can be repointed; refusing to attribute a result to a model "
            "that is not the one recorded."
        )

    record["api"] = API

    raw_dir = os.path.join(TRANSCRIPT, f"round-{n:02d}")
    os.makedirs(raw_dir, exist_ok=True)

    accumulated: dict[str, str] = {}
    refused: str | None = None
    turns: list[dict] = []
    cargo_now: str | None = None
    exits: dict = {}
    emitted_manifest: dict = {}
    started_round = time.time()

    for turn in range(1, MAX_TURNS_PER_ROUND + 1):
        prompt = build_prompt(feedback if turn == 1 else None, accumulated,
                              cargo_now, turn, refused)
        t0 = time.time()
        meta: dict = {}
        try:
            reply = generate(args.model, prompt, spec["think"], TURN_TIMEOUT_S)
            output, model_exit, timed_out = reply.get("response", ""), 0, False
            meta = {k: reply.get(k) for k in
                    ("done_reason", "prompt_eval_count", "eval_count")}
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            output, model_exit, timed_out = "", None, isinstance(exc, TimeoutError)
            meta = {"transport_error": str(exc)}

        entry = {
            "turn": turn,
            "elapsed_s": round(time.time() - t0, 1),
            "prompt_sha256": sha(prompt.encode("utf-8")),
            "prompt_bytes": len(prompt.encode("utf-8")),
            "output_sha256": sha(output.encode("utf-8")),
            "output_bytes": len(output.encode("utf-8")),
            "model_exit": model_exit,
            "timed_out": timed_out,
            **meta,
        }
        if "transport_error" in entry:
            # The server, not the model. Ending here keeps a dead ollama from
            # burning eight turns against nothing and being recorded as eight
            # empty replies.
            record["turns"] = turns + [entry]
            record["error"] = (
                f"turn {turn} never reached the model: {entry['transport_error']}"
            )
            record["freeze_ready"] = False
            return finish(record, n, prior)

        if turn == 1:
            record["served_context"] = served_context(args.model)
            print(f"    served context: {record['served_context']}")

        if "\x1b" in output:
            # `ollama run` did this; the API should not. If it ever does, the
            # recorded bytes are not the model's and no repair is attempted.
            entry["control_sequences"] = output.count("\x1b")
            record["turns"] = turns + [entry]
            record["error"] = (
                f"turn {turn} came back with {entry['control_sequences']} terminal "
                "control sequences spliced into it; those bytes are the "
                "transport's, not the model's"
            )
            record["freeze_ready"] = False
            return finish(record, n, prior)

        if entry.get("done_reason") == "length":
            # The reply hit the context ceiling and stops mid-token. Recording it
            # as the model's answer would score a truncated file as a wrong one.
            entry["truncated"] = True
            record["turns"] = turns + [entry]
            record["error"] = (
                f"turn {turn} was cut off at the context limit after "
                f"{entry.get('eval_count')} tokens (prompt used "
                f"{entry.get('prompt_eval_count')} of {record.get('served_context')})"
            )
            record["freeze_ready"] = False
            return finish(record, n, prior)

        served, used = record.get("served_context"), entry.get("prompt_eval_count")
        if served and used and used >= served:
            # ollama truncates an over-long prompt at the FRONT, which is where
            # the specification sits. A round built on a prompt the model was
            # only shown the tail of measures nothing.
            record["turns"] = turns + [entry]
            record["error"] = (
                f"turn {turn} sent a prompt of {used} tokens into a served "
                f"context of {served}; the front of it — the specification — "
                "would have been truncated away"
            )
            record["freeze_ready"] = False
            return finish(record, n, prior)
        open(os.path.join(raw_dir, f"turn-{turn:02d}-prompt.txt"), "w",
             encoding="utf-8").write(prompt)
        open(os.path.join(raw_dir, f"turn-{turn:02d}-output.txt"), "w",
             encoding="utf-8").write(output)

        emitted = extract_files(output)
        entry["files"] = [rel for rel, _ in emitted]
        # Every block, including the ones a later block in the same reply
        # supersedes. Last wins — as it already does across turns — but nothing
        # is discarded from the record, so the transcript shows how many blocks
        # a path got and which one was taken.
        last_at = {rel: i for i, (rel, _) in enumerate(emitted)}
        entry["blocks"] = [
            {"path": rel, "bytes": len(body.encode("utf-8")),
             "sha256": sha(body.encode("utf-8")),
             "superseded": i != last_at[rel]}
            for i, (rel, body) in enumerate(emitted)
        ]
        try:
            tree.check_emitted([rel for rel, _ in emitted], require_complete=False)
            refused = None
        except tree.TreeError as exc:
            # A malformed reply costs a turn, not the round. The refusal is about
            # the FILE: transport — how a reply is packaged — and saying so back
            # tells the model nothing about the specification, the corpus, or its
            # design. An earlier version ended the round here, which spent a
            # budget round on a packaging slip and left the model no way to
            # correct something it was never told it had done.
            refused = str(exc)
            entry["refused"] = refused
            turns.append(entry)
            record["turns"] = turns
            print(f"  turn {turn}: refused — {exc}")
            if turn == MAX_TURNS_PER_ROUND:
                record["error"] = f"turn {turn}: {exc}"
                record["freeze_ready"] = False
                return finish(record, n, prior)
            continue

        for rel, body in emitted:
            accumulated[rel] = body
        said_done = bool(re.search(r"^\s*DONE\s*$", output, re.M))
        entry["said_done"] = said_done
        turns.append(entry)
        print(f"  turn {turn}: {len(emitted)} file(s), {entry['elapsed_s']}s"
              + (", DONE" if said_done else "")
              + (", TIMED OUT" if timed_out else ""))

        if timed_out and not emitted:
            record["turns"] = turns
            record["error"] = f"turn {turn} produced nothing within {TURN_TIMEOUT_S}s"
            record["freeze_ready"] = False
            return finish(record, n, prior)

        try:
            tree.check_emitted(sorted(accumulated), require_complete=False)
        except tree.TreeError as exc:
            # The per-turn check bounds one reply; this bounds the tree the turns
            # have built up. Eight turns of sixty-four files each is not sixty-
            # four files, and only this call can see that.
            record["turns"] = turns
            record["error"] = f"the accumulated tree is not admissible: {exc}"
            record["freeze_ready"] = False
            print(f"  turn {turn}: {exc}")
            return finish(record, n, prior)

        buildable = "Cargo.toml" in accumulated and any(
            r.startswith("src/") and r.endswith(".rs") for r in accumulated)
        if not buildable:
            if not emitted and said_done:
                record["turns"] = turns
                record["error"] = "the model stopped before emitting a buildable set"
                record["freeze_ready"] = False
                return finish(record, n, prior)
            continue

        # Write exactly what the model has written, and build it in the sandbox.
        for entry_name in os.listdir(workdir):
            if entry_name == "target":
                continue
            pth = os.path.join(workdir, entry_name)
            shutil.rmtree(pth) if os.path.isdir(pth) else os.remove(pth)
        written = {}
        for rel, body in accumulated.items():
            dest = os.path.join(workdir, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            data = (body + "\n").encode("utf-8")
            with open(dest, "wb") as fh:
                fh.write(data)
            written[rel] = {"bytes": len(data), "sha256": sha(data)}
        record["written"] = written
        tree.assert_no_build_hooks(workdir)
        _, emitted_manifest = tree.digest(
            [(rel, open(os.path.join(workdir, rel), "rb").read())
             for rel in sorted(written)])

        if not sandbox.mount_is_visible(workdir):
            record["turns"] = turns
            record["error"] = "the workdir is not visible inside the sandbox"
            record["freeze_ready"] = False
            raise SystemExit(
                "the sandbox mounted an empty directory, so any build failure "
                "would be the harness's fault and not the model's."
            )

        cargo_out, exits = [], {}
        for sub in ("fmt", "check", "build", "test"):
            code, out = sandbox.cargo(workdir, sub)
            exits[sub] = code
            cargo_out.append(f"$ cargo {sub}  (exit {code})\n{out}\n")
            if sub == "check" and code != 0:
                break
        cargo_now = "\n".join(cargo_out)
        entry["cargo"] = exits
        clean = all(exits.get(x) == 0 for x in ("fmt", "check", "build", "test"))
        print(f"    cargo {exits}" + ("  → clean" if clean else ""))
        if clean:
            break
        if said_done and not emitted:
            break

    record["turns"] = turns
    record["elapsed_s"] = round(time.time() - started_round, 1)
    record["model_exit"] = 0 if turns and turns[-1]["model_exit"] == 0 else (
        turns[-1]["model_exit"] if turns else None)
    record["output_sha256"] = turns[-1]["output_sha256"] if turns else None
    record["cargo"] = exits
    record["compiles"] = exits.get("check") == 0

    try:
        after = tree.collect(workdir)
        record.pop("tree_error", None)
    except tree.TreeError as exc:
        record["tree_error"] = f"the tree is not admissible after the build: {exc}"
        after = []
    final_sha, final_manifest = tree.digest(after)
    record["final_tree_sha256"] = final_sha
    record["final_tree"] = final_manifest
    record["emitted_tree_sha256"] = tree.digest(
        [(rel, (body + "\n").encode("utf-8")) for rel, body in sorted(accumulated.items())]
    )[0] if accumulated else None

    changed, cargo_generated = compare_trees(emitted_manifest, final_manifest)
    record["cargo_generated"] = cargo_generated
    record["modified_by_build"] = changed
    record["freeze_ready"] = compute_freeze_ready(
        record.get("model_exit"), exits, changed, record.get("tree_error"))

    budget_now, not_counted_now, _ = effective_budget(prior)
    counted_now = [r for r in prior if r["round"] not in not_counted_now] + [record]
    cargo_text = cargo_now or ""
    cargo_path = os.path.join(raw_dir, "cargo.txt")
    open(cargo_path, "w", encoding="utf-8").write(cargo_text)
    record["cargo_output_sha256"] = sha(cargo_text.encode("utf-8"))

    print(f"round {n} (counted {len(counted_now)}/{budget_now}): {len(written)} file(s), "
          f"compiles={record['compiles']}, freeze_ready={record['freeze_ready']}, "
          f"{record['elapsed_s']}s")
    print(f"  transcript {os.path.relpath(raw_dir, HERE)}")
    if record["modified_by_build"]:
        print(f"  the build modified {record['modified_by_build']}, so the tree "
              "measured is not the tree emitted; not freeze-ready")
    if record["freeze_ready"]:
        print("  FREEZE-READY — fmt, check, build and test all clean:")
        print(f"    python3 harness/freeze.py --workdir {workdir}")
    elif len(counted_now) < budget_now:
        print("  not freeze-ready; the next round carries this cargo output "
              "automatically. No flag, no other file can be fed in.")
    return finish(record, n, prior)


if __name__ == "__main__":
    sys.exit(main())
