---
type: "ContractDescriptor"
version: "0.1"
title: "Substrate Self ABI: minimum self-description surface for federation"
status: "active"
hears:
  - "./SUBSTRATE_HEALTH.v0.1.md"
  - "../src/x2E00_status.ts"
  - "../src/x8D00_roadmap_gen.ts"
  - "../src/x8E00_probes_gen.ts"
  - "../omega/src/x8D00_roadmap_projection.myc.md"
  - "../liquid/src/x8D00_roadmap_projection.myc.md"
  - "../myc/src/x8D00_roadmap_projection.myc.md"
related:
  - "../jazz/chords/x8D00_950594_codex_omega-vision-roadmap-projection-receipt.md"
---

# Substrate Self ABI v0.1

## Status

**ACTIVE 2026-05-23.** Seeded as draft same day per architect's audit
recommendation; pilot in `myc` validated immediately; liquid + omega adopted the
adapter pattern within same session. All 3 substrates at 5/5 ABI coverage;
contract graduates draft → active per its own threshold (≥2 substrates).

Graduation evidence:

- `myc` 5/5 (commit `49c1ce8`) — pilot, content-addressed substrate
- `liquid` 5/5 (commit at adoption time) — adapter approach over xA<NNN>
- `omega` 5/5 (commit at adoption time) — adapter approach over Rust+TS+ZK

---

## Motivation

Trinity reads multiple substrates (currently `omega`, `liquid`, `myc`). Without
a shared self-description ABI, trinity must understand each substrate's internal
layout — anti-pattern that grows fragile per substrate.

The federated roadmap pattern (commit `30a73b6`) demonstrated that a shared
coordinate (`x8D00_*projection*.myc.md`) lets substrates own their slow signals
while trinity aggregates uniformly. This contract generalizes the pattern to
**five coordinate slots**.

---

## The Five Slots

Every federation-participating substrate SHOULD emit at these coordinates within
its own `src/`:

| coord   | role                          | shape                                                  | who owns  |
| ------- | ----------------------------- | ------------------------------------------------------ | --------- |
| **2/E** | `status`                      | executable organ emitting `SUBSTRATE_HEALTH.v0.1` JSON | substrate |
| **6/C** | `audit` (or `protocol_audit`) | executable organ emitting placement/conformance report | substrate |
| **4/A** | `capabilities`                | executable organ emitting capability surface           | substrate |
| **8/D** | `roadmap_projection`          | markdown projection of far-horizon signals             | substrate |
| **8/E** | `probes_projection`           | markdown projection of experimental frontier           | substrate |

Slot file naming follows the substrate's own convention; trinity discovers by
coord pattern, not by exact filename:

- Executable: `<substrate>/src/x<COORD>_<handle>.ts` (e.g.
  `myc/src/x2E00_status.ts`)
- Projection: `<substrate>/src/x<COORD>_*projection*.myc.md` (e.g.
  `omega/src/x8D00_roadmap_projection.myc.md`)

If a substrate has no analog for a slot (e.g., a substrate without experimental
probes), it MAY emit an empty/explicit-null projection at the slot rather than
omit it. Explicit absence > silent gap.

---

## Projection Contract Pattern (shared by all slots)

Established by codex 2026-05-22 in `omega/src/x8D00_roadmap_projection.myc.md`:

1. **Substrate owns the projection.** Substrate emits the file, decides its
   content, owns its falsifiers.
2. **Trinity reads ONLY the projection.** Trinity must not traverse into raw
   substrate sources (e.g., omega's vision file, myc's ROADMAP.md, liquid's
   PN-CAD ledger) to extract data the substrate already exposes via projection.
3. **Boundary leak = projection failed.** If trinity bypasses the projection to
   read raw substrate state, the layer boundary is broken and the projection is
   over-promoted to source-of-truth.
4. **Projection mirrors, not duplicates.** Projection is a slow-signal bridge;
   substrate's canonical sources remain authoritative.

---

## Minimum JSON envelope shapes

For executable slots (2/E, 6/C, 4/A):

```typescript
interface SubstrateSlotResponse {
  type: string;              // e.g., "status", "audit", "capabilities"
  position: string;          // e.g., "2/E"
  action: string;            // matches type usually
  substrate: string;         // the substrate's identity (e.g., "myc")
  summary: { overall: "healthy" | "degraded" | "unknown" | ...; ... };
  // Slot-specific fields beyond summary
}
```

For markdown projection slots (8/D, 8/E), frontmatter MUST declare:

```yaml
type: <substrate>.<slot-name>-projection
status: draft | active
coordinate: x<COORD>
source_layer: <substrate-name>
sources: [list of authoritative substrate files this projects]
projects_to: [list of consumers, typically "trinity.federated_roadmap"]
falsifiers: [list of conditions that would invalidate the projection]
```

---

## Trinity-side responsibilities

Trinity:

1. Discovers slot files by scanning `<substrate>/src/x<COORD>_*` for each
   substrate in `["omega", "liquid", "myc"]` (or future-listed).
2. Aggregates declared content; does NOT enrich from substrate-internal sources
   beyond what the projection exposes.
3. Emits unified projections (e.g., `x8D00_roadmap.myc.md` with per-substrate
   sections) without claiming ownership of substrate content.
4. If a substrate's slot file is missing, trinity reports that substrate as
   "slot-N missing" — substrate-honest, not crash.

---

## Falsifiers

- A substrate adds a slot but omits the required JSON shape → federation
  downstream breaks → contract failed.
- Trinity starts reading substrate-internal sources beyond declared projections
  (e.g., parses `myc/ROADMAP.md` directly when
  `myc/src/x8D00_roadmap_projection.myc.md` exists) → boundary leaked → contract
  failed.
- Two substrates implement the same slot with incompatible JSON shapes →
  contract didn't constrain enough → revisit JSON envelope spec.
- After myc pilot, ≥2 substrates don't have all 5 slots within 30 days → pilot
  didn't generalize; either ABI is wrong or substrates aren't ready → revisit
  scope.

---

## Pilot validation criteria (for graduation to `active`)

Myc must demonstrate:

- [x] 2/E status emits valid SUBSTRATE_HEALTH JSON (already present)
- [x] 6/C audit (protocol_audit) emits placement/conformance report
- [ ] 4/A capabilities emits capability surface
- [x] 8/D roadmap_projection markdown with required frontmatter
- [ ] 8/E probes_projection markdown with required frontmatter

After 4/A + 8/E land in myc, trinity should be able to issue a single
`t ecosystem` query that returns unified self-description across all 3
substrates without any substrate-specific code paths.

---

## Migration policy

Per `feedback_liquid_not_trinity` and `feedback_substrates_are_mature`: DO NOT
batch-migrate substrates. Each substrate adopts slots at its own pace via
"rename when touched" or substrate-internal decisions. Trinity must work with
partial-adoption: if omega has 3/5 slots and liquid has 2/5, trinity aggregates
whatever exists.

This contract sets the TARGET shape, not a deadline.
