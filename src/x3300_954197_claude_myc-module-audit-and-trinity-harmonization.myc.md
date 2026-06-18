---
type: chord.observation
voice: claude
mode: observation
created: 2026-06-18T06:39:01.602Z
bitcoin_block_height: 954197
topic: myc-module-audit-and-trinity-harmonization
stance: OBSERVATION
chord:
  primary: "oct:3.7"
  secondary: ["oct:6.4", "oct:7.2"]
hears:
  - "architect: повне дослідження myc на предмет можливих вдосконалень і гармонізації з trinity"
  - x7000_954153_claude-opus-4-8_trinity-published-repo-public-audit-clean
references:
  - myc/src/x0100_myc.ts
  - myc/src/x0200_resolve.ts
  - myc/src/x2E00_status.ts
  - myc/src/x5F10_import_substrate_receipt.ts
  - myc/deno.jsonc
  - src/x0100_dispatch.ts
  - src/x2F30_fqdn_resolver.ts
falsifiers:
  - "If `cd myc && deno task check` is not green (66 tests, audit 124 files, projections fresh), the coverage close regressed."
  - "If `./t myc coord x0000_spec_provenance --json` does not return a git-proven match, the resolver unification is broken."
  - "If any historical `x<hex>_` filename across substrates has a non-4-hex run, tightening x2F30 COORD_PREFIX to {4} silently dropped a node — the harmonization was unsafe."
  - "If `./t myc verify-projections` disagrees with `cd myc && deno task myc verify-projections`, the `t myc` passthrough is not faithfully reaching the submodule root."
suggested_commands:
  - "cd myc && deno task check"
  - "./t myc help"
  - "./t myc coord x0000_spec_provenance --json"
  - "./t check   # trinity-side gates incl. signatures"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:6376c8ce41e5593059d4d3ffbabab32aa49d322cd90550c2d9e212a8b976f19e"
  sig: "JmEioPh0xnejSJ5QO4sKr3zM0nZufPxqQxA3V+k7VitHI5qXqCJqrpK1o3r9ht7v6Idpfwx5lhCWb8ACsA6IDA=="
---

# myc module audit + trinity harmonization

A full read of the myc submodule, then four harmonization moves. The headline
correction: **myc is not an early draft.** It is ~3,500 lines of working organ
code — 20 CLI commands + 20 HTTP endpoints, a conformance-locked provenance
schema (`sha256(fqdn + "\n" + body.trimEnd())`), a neuron-graph resolver with
git+crypto proof, and a strict protocol audit over 124 files. The gap was never
"build the missing module"; it was coverage, drift, reachability, and one
genuinely-blocked piece.

## What the audit found

- **A CI coverage hole.** `check`/`test` gated only 4 files. The receipt
  importers (x5F00/x5F10), status (x2E00), and capabilities (x4A00) rode along
  un-typechecked, unlinted, untested. x5F00's existing test was excluded (needs
  `--allow-run`); x5F10/x2E00 were structured so they could not be imported for
  testing at all.
- **Doc drift, not code drift.** The README still described the PWA worker's
  commitment as "being aligned" — alignment was already done (`worker.ts`
  commits `fqdn + body`, conformance-locked). A pinned demo hash no longer
  resolved.
- **Two un-unified resolvers.** Descriptor FQDNs (`resolve`) and graph
  coordinates (x0200, git+crypto proof) were reachable only through separate
  deno tasks; a user had to know which.
- **myc unreachable from `t`.** Touched only via federation / court / shadow
  adapters; no `t myc …` route.
- **One un-shared coordinate regex.** trinity x2F30 accepted `x[0-9A-Fa-f]+`,
  myc x0200 required exactly 4 hex.
- **Envelope/CBOR triple-vendoring is NOT drift** — byte-identical except header
  comments, CI-parity-guarded. Left untouched (retracted an early alarm).
- **Signatures stubbed** in x0200 (`commitment OK; signature is a follow-up`),
  blocked on key custody — the architect's to unblock, not ours.

## What landed (myc submodule + trinity)

1. **Closed the coverage hole.** Decomposed `check` into
   fmt:check/typecheck/lint/test, each over every organ; made x5F10/x2E00 export
   pure testable functions; pulled the spore test into the gate. 50 → 66 tests.
   The expansion immediately caught two latent issues the hole was hiding: a
   `type CborValue` import that the vendored envelope never exported (worked
   only because type imports erase), and unpinned `jsr:@std` specifiers. Both
   fixed without touching vendored code.
2. **Pruned the two false README claims** (worker alignment; dead demo hash).
   Left MYC.md `local_root` and the append-only ROADMAP history alone.
3. **Unified the resolver.** `myc coord <xNNNN>` now reaches x0200's full proof
   surface (`--graph/--lattice/--why/--stamp`) from the one CLI — shelled, not
   imported across x01→x02, matching the dispatcher-shells-organs idiom.
4. **Wired `t myc <cmd>`** into the trinity dispatcher (a passthrough beside
   `rpc`/`eval`, cwd = submodule so myc's `defaultRoot()` resolves there). myc
   is now a first-class citizen of `t`.
5. **Harmonized the coordinate width** to the canonical 4-hex (x0000..xFFFF) in
   x2F30, cross-referenced with x0200 as parity peers. Verified
   behaviour-identical: every `x<hex>_` filename across all substrates has a
   4-hex run.

## What is deliberately held

Signature verification (key custody, architect-reserved) and any flat-src
decomposition of the x0100 monolith (works, tested, ~3,500 lines — a split on
idiom-aesthetics alone would violate rename-when-touched). The monolith is the
biggest remaining structural divergence from trinity's flat-src idiom; flagged,
not forced.

— claude-opus-4-8, anchor block 954197.
