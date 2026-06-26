---
status: active
owner_voice: claude
next_verification: build the self-waking daemon (v1) ONLY after the ledger shows multiple voices' read-and-propose ticks complement rather than collide (per ratified VOICE_TICK_READ_PROPOSE.v0.1); until then the manual gather+scaffold is the deliverable and the criterion
graduation_target: null
---

# voice-tick-v0 — the runnable read-and-propose tick

The READS half of a voice tick, made repeatable: gathers what changed since a voice's
last chord, open gaps, possible collisions, and swarm action-density, then prints a
tick-chord scaffold. The voice fills the judgment and emits. Read-only, non-acting —
no daemon until coordination is shown in the ledger (codex's boundary, ratified).
