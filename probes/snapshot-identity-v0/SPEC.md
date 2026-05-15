# snapshot-identity-v0 probe

Demonstrates that `t snapshot` produces **byte-identical body_hash for
the same meta-ledger state** across multiple calls, separated in wall
time. This is the empirical basis for the snapshot-as-identity claim
that Codex flagged as "AYE_AS_IDENTITY_SEED" (2026-05-14T194732Z):
"Do not turn it into a new contract until snapshots have been used in
at least one anchor or court flow."

This probe is the use. Not a contract — a runnable demonstration that
snapshots compose with the existing court + anchor primitives.

## Status

**RUNNABLE.** SPEC + run.sh that calls `t snapshot` multiple times,
asserts body_hash invariance, demonstrates that the produced envelopes
court-witness each other (cross-time identity check), and demonstrates
that anchor-prep can produce a Merkle root over a sequence of snapshots
(temporal commitment).

## What this probe answers

> Is `t snapshot`'s `body_hash` truly deterministic for the same
> meta-ledger state? Are wall-time-driven `envelope_id` differences
> the ONLY thing that changes between consecutive calls?
>
> Can a sequence of snapshots (different `envelope_id`, identical
> `body_hash`) be used as cross-time witness via the existing
> `t court` and `t anchor-prep` organs?

If yes, snapshot is genuinely an identity seed — multiple processes /
times / instances looking at the same trinity meta-ledger compute the
same identity bytes. Operational inscription (when it lands) commits to
this identity at a moment.

## Scenarios

### Scenario A — three consecutive snapshots, body_hash invariant

1. `t snapshot` × 3 (with `sleep 0.5` between to ensure wall_time differs).
2. Extract `body_hash` and `envelope_id` from each.
3. Assert all 3 `body_hash` identical.
4. Assert all 3 `envelope_id` differ (proving wall_time is in
   `created_at_logical`, not body).
5. Assert body schema is `trinity.substrate-snapshot.v0.1`.

### Scenario B — cross-time court witness

1. Take the 3 envelopes from Scenario A.
2. Verify each has the same `body_hash` (same logical content).
3. Each has a different `envelope_id` (different timestamps).
4. This satisfies a Substrate Court agreement check: same body, no
   tamper, multiple witnesses. The court would AYE if these were from
   different substrates with the same body_hash.

### Scenario C — temporal anchor over snapshot sequence

1. Take the 3 envelopes.
2. Run `t anchor-prep <env1> <env2> <env3>`.
3. Assert: anchor payload `leaf_count: 3`, all 3 envelopes accepted
   (each has unique `envelope_id` → 3 distinct leaves), Merkle root
   computed.
4. The root is now an inscription-ready commitment to "trinity
   identity at these 3 moments". This is the use Codex named.

### Scenario D — meta-ledger drift detection

1. Take snapshot A.
2. (Cannot meaningfully modify meta-ledger inside the probe without
   leaving traces — skip the side-effect; show it conceptually instead.)
3. Document: any change to glossary, contracts, chord count, audit
   pass count → different `body_hash` on next snapshot. Demonstrate by
   noting that the chord-count component alone changes between probe
   runs (because run.sh itself may create chord history).

## Out of scope

- Modifying the meta-ledger to verify drift detection (would taint
  the substrate; conceptual proof instead).
- Multi-machine cross-instance determinism (separate probe).
- Bitcoin inscription of the anchor (operational).
- Comparing snapshot bytes across language implementations (the
  TS+Python encoder pair already proved this at envelope level).

## Acceptance

- All 3 scenarios pass.
- run.sh exits 0.
- No filesystem side effects outside `$WORK` tmp dir.
- No frozen surface, submodule, or `lib/` touch.

## See also

- `0x4/E.ts` — the snapshot organ.
- `contracts/RECEIPT_ENVELOPE.v1.0.md` — body_kind: substrate_snapshot.
- `probes/substrate-court-v0/` — court primitive used in Scenario B.
- `probes/envelope-bitcoin-anchor-v0/` — anchor primitive used in Scenario C.
- `jazz/chords/2026-05-14T194732Z-codex-response-architect-mode-governance-flow.md`
  — Codex's "AYE_AS_IDENTITY_SEED" that motivated this probe.
