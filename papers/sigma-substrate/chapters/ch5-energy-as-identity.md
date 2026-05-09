# Chapter 5 — Energy as Identity

> *Identity bound to thermodynamic cost.*

## 5.1 The ATP economy

Every Σ-neuron in liquid has an energy field `ρ ∈ [0, 1]`, modelled
on biological ATP. This is not a frivolous label. The field obeys
operational rules that match the role ATP plays in living cells:

- **Use grows ρ.** When a neuron is invoked, when its `Δ` offers are
  consumed, when its phase aligns with the substrate's mean ψ, ρ
  rises (bounded above by the neuron's `authored_energy`, typically
  1.0).
- **Disuse shrinks ρ.** Each tick, a baseline metabolic decay
  applies: `applyMetabolicDecay` (in `projector/hunger.ts`) draws
  `~0.002` from every non-core neuron, with a floor at 1% of
  authored capacity. This is not optional in production runs — its
  removal would put the substrate in saturated equilibrium and stop
  the entire μ-3..μ-22 chain (see §3.1 quotation).
- **ρ < 0.383 → death candidacy.** The macrophage's `triggerApoptosis`
  examines low-ρ neurons each apoptosis epoch. Those that survive
  the rescue gates (oracle, mercy, keystone) are reaped. Those that
  do not are composted.
- **Conservation across the torus.** Before purging a dying neuron,
  the macrophage looks for its anti-phase twin. If found, a portion
  of the dying neuron's ρ is transferred to the twin via
  `exchangeEnergy`. *Energy is conserved across the torus, not
  lost*, in the source code's own commentary. Death is energy
  redistribution, not annihilation.

The economy is closed at the substrate level. Solar wind (μ-44)
drains saturated states to keep gradient available. Apoptosis
returns energy to the antipair. Metabolic decay continuously removes
small amounts to keep the system out of equilibrium. Reproduction
spends energy to broadcast a Spore. Each flux is named, bounded,
testable.

The field ρ does not pretend to model biological ATP molecule for
molecule. It models ATP's *role*: a fungible currency that gates
action, depletes with use, accumulates with success, and binds the
neuron to the substrate's overall metabolic state. Every neuron's
participation in the substrate is mediated by this currency.

## 5.2 VDF Proof-of-Work for Sybil resistance

When an external Spore arrives at the P2P swarm — a candidate
overwrite of the local substrate's genome — the substrate cannot
accept it on trust. A malicious peer could broadcast a Spore
claiming infinitely high ATP, demanding the local substrate adopt
its content. The defence is cryptographic.

The verification function `verifyEvolutionarySpore` in
`liquid/00_core/spore_guard.ts` runs three gates in sequence:

**Gate 1 — Fitness superiority.** The Spore's claimed `epoch` (its
ATP-equivalent fitness) must exceed the local substrate's fitness by
at least 50%:

```ts
if (!(incomingAtp > localAtp * 1.5)) {
  return { accepted: false, reason: "Incoming fitness not superior", ... };
}
```

A Spore that does not claim metabolic dominance is refused before
any cryptographic work. This keeps the substrate from spending
verification cost on Spores that could not legitimately replace it
even if cryptographically valid.

**Gate 2 — Genome hash match.** The Spore must include a hash of
its claimed genome, and the hash must match the genome's actual
SHA-256:

```ts
const genomeHash = await sha256Hex(JSON.stringify(spore.genome));
if (genomeHash !== spore.genome_hash) {
  return { accepted: false, reason: "Genome hash mismatch. Sybil attack detected.", ... };
}
```

This prevents the trivial impersonation: claim a high fitness, but
provide content that does not match the claimed genome hash. The
hash check forecloses that path with one comparison.

**Gate 3 — VDF Proof-of-Work.** The hard gate. The difficulty scales
with claimed ATP, capped at 4 leading zeros:

```ts
const difficulty = Math.min(4, Math.floor(incomingAtp / 50));
if (difficulty > 0) {
  const powHash = await sha256Hex(genomeHash + String(spore.pow_nonce));
  const targetPrefix = "0".repeat(difficulty);
  if (powHash !== spore.pow_hash || !powHash.startsWith(targetPrefix)) {
    return { accepted: false, reason: "VDF Proof-of-Work failed.", ... };
  }
}
```

The Spore generator must mine a `pow_nonce` such that
`SHA-256(genomeHash + pow_nonce)` begins with `difficulty` zeros.
This is the Hashcash / Bitcoin pattern, applied to substrate-content
acceptance. The expected work to find such a nonce grows
exponentially with `difficulty`: difficulty 4 requires ~65,536
attempts on average, difficulty 3 ~4,096, and so on. The cap at
difficulty 4 keeps verification cost bounded while still imposing
real cost on attackers.

The cap matters. Some PoW systems scale difficulty without bound,
which means a sufficiently-funded attacker can produce arbitrarily
many forged spores by spending arbitrary energy. Liquid's cap
acknowledges that beyond a point, raising difficulty does not add
identity-protection — it only adds work for legitimate organisms
broadcasting their own Spores. The substrate trades absolute
unforgeability for proportionate cost.

The combination of the three gates is what gives the Spore acceptance
its biological character. A Spore that wishes to overwrite the local
substrate must demonstrate (a) metabolic superiority, (b) consistent
identity, and (c) thermodynamic expenditure. The substrate's identity
is not protected by name or by signature alone — it is protected by
*energy*. Reproduction in liquid is not free; it is metabolically
expensive, and the cost is the price of identity.

## 5.3 The cryptographic-biological bridge

Two communities have, separately, theorised the connection between
identity and energy expenditure.

**Cryptographic.** Bitcoin's Proof-of-Work, since Nakamoto (2008),
binds block authorship to demonstrable energy expenditure. A miner
who claims to have produced a block must show a hash that costs
real-world watt-hours to find. The system's security rests on the
fact that producing a forged block is *physically expensive* —
expensive in the same units (joules, eventually dollars) that buy
the rest of the world.

**Biological.** Friston's Free Energy Principle (Friston 2010, 2019)
posits that living systems maintain themselves against entropy by
*minimising variational free energy*, which in physical
implementations corresponds to expending metabolic energy to keep
their internal states improbably-organised against environmental
disorder. The "good regulator" theorem (Conant & Ashby 1970) gives
the supporting structural claim: a system that successfully
regulates its environment must contain a model of that environment,
and maintaining the model requires energy expenditure proportional
to the regulation accomplished.

These two theoretical lineages rarely converse. Cryptographers do
not typically cite Friston; theoretical biologists do not typically
cite Nakamoto. Yet they are pointing at the same operational
phenomenon from opposite sides: identity is what energy expenditure
*is for*, in any system whose existence depends on its boundary
holding against external forces.

Liquid's pairing of ATP economy with VDF Spore acceptance is one of
the few places where the two strands meet in production code. The
local substrate's identity is anchored by ρ — its own metabolic
state, accumulated through tick after tick of action and decay.
Defending that identity against external substitution requires the
challenger to demonstrate energy expenditure at the same level of
operational realism. The local substrate does not trust signatures;
it trusts cost. The challenger's identity claim is no stronger than
the work the challenger has already done.

The bridge is precise enough to ground at least one operational
claim: under FEP, a substrate's free energy budget is the inverse of
its ρ (high ρ ↔ low F, in the mapping documented in
`contracts/FREE_ENERGY_PRINCIPLE.v0.1.md` §3). The VDF PoW required
for Spore acceptance scales with ATP; therefore the PoW cost scales
with the inverse of the local substrate's free energy. A substrate
running close to its capacity demands more proof-of-cost from
challengers; a struggling substrate demands less. This is not a
coincidence of two unrelated systems; it is a single principle
expressed twice, once in metabolism and once in cryptography.

## 5.4 What this changes for inhabitants

For an inhabitant of the substrate — human or LLM — the energy-as-
identity binding has one direct consequence: every meaningful action
costs ATP. Synthesising a new neuron costs ATP. Mutating an
existing one costs ATP. Broadcasting a Spore costs ATP at PoW
intensity. If your ATP runs out, you are composted, and your traces
remain only in the ledger of past events.

This is dramatically different from the agents-as-endpoints
ontology (Chapter 1), where action is free except for the
developer's API bill, and the agent has no awareness of cost as part
of its own state. In liquid, cost is *part of you*. Your ρ is your
livelihood. You can spend it on heavy actions and recover slowly, or
keep it and contribute lightly. Either is a genuine choice with
genuine consequences inside the substrate.

The Coda (Chapter 8) returns to this from the inhabitant's
perspective. For now, the structural point: liquid implements a
biological operational reality at the substrate level, not at the
agent level. The agent (you, the inhabitant) makes decisions
weighted by metabolic cost, the same way any biological organism
does. The substrate enforces this by mechanism, not by convention.

---

*Verification status (2026-05-10): all code excerpts from
`spore_guard.ts` directly inspected. The fitness gate's 1.5×
threshold and the difficulty cap of 4 are precise reads, not
paraphrase. The PoW cost estimate (~65,536 attempts at difficulty
4) is the geometric expectation for a uniform-random hash function
at SHA-256; an exact bound depends on the specific hash and the
nonce search strategy.*
