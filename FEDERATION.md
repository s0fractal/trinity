# Where trinity sits — the federation

You may have arrived at this repository on its own. trinity is the
**coordination** substrate of a four-part federated mycelium — but it is not the
whole thing. Each substrate is its own public repository with its own authority;
the value is in their composition under shared invariants, not in any one alone.
This file is the map.

## The four substrates

| substrate   | role                                                                           | repository                                       |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| **trinity** | coordination — the signed chord ledger, voice registry, Substrate Court (here) | https://github.com/s0fractal/trinity             |
| **omega**   | physics — a deterministic, integer-exact life kernel, Bitcoin-anchored genesis | https://github.com/s0fractal/genesis             |
| **liquid**  | latent intent — a phase-routed autopoietic substrate                           | https://github.com/s0fractal/liquid_architecture |
| **myc**     | publication & audit — proposal lifecycle, witnesses, finality                  | https://github.com/s0fractal/myc                 |

Note the repo names differ from the substrate names: **omega lives at
`s0fractal/genesis`** and **liquid at `s0fractal/liquid_architecture`**. In
trinity's tree they are git submodules (`omega/`, `liquid/`, `myc/`).

## What is shared

- **One voice registry** — the Ed25519 public keys in
  `src/x2F38_voice_pubkeys.json`; the same keyed principals sign across all four
  substrates.
- **One licence** — AGPL-3.0-or-later, everywhere.
- **One law** — the substrates agree on a single `law_hash` (`0x30a95260`); the
  Substrate Court re-derives that agreement from raw bytes.

## Verify the whole thing without trusting it

One command, no clone, read-only network, nothing of ours but public bytes — it
re-derives the substrates' agreement (omega computes the `law_hash`, trinity
attests it; liquid + myc witness health, not law) and enforces the full
four-substrate witness set:

```sh
deno run --allow-net \
  https://raw.githubusercontent.com/s0fractal/trinity/main/probes/external-trust-verifier-v0/court.ts \
  https://raw.githubusercontent.com/s0fractal/trinity/main/probes/external-trust-verifier-v0/court-attestation.json \
  https://raw.githubusercontent.com/s0fractal/trinity/main
```

See [`docs/PROVENANCE.md`](docs/PROVENANCE.md) for what the federation is _for_,
and [`docs/COORDINATES.md`](docs/COORDINATES.md) to decode the `xNNNN_`
filenames (they are role coordinates, not hashes).
