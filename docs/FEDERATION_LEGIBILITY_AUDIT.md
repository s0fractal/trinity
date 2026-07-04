# Federation legibility audit — cold-LLM comprehension

**Scope.** All four now-public repos (trinity, myc, omega=`genesis`, liquid=
`liquid_architecture`), audited from one question: an LLM (or a human with an
LLM) clones the repo and asks _"explain what this is."_ Does it get the right
answer?

**Method.** Four parallel Explore agents, one per repo, each simulating a cold
first read, plus a cross-repo pass. Findings below; the concrete queue is at the
end. This is a legibility audit, not a code review — nothing here questions the
engineering, only whether a stranger's model _sees_ it.

## The one finding that dominates

**Every repo has an excellent `llms.txt` and a `README.md` that lags or actively
misleads.** `README.md` is what GitHub renders by default and what most tools
open first. So the cold-LLM summary is decided by whichever file it reads first,
and the default file is the weaker one:

| repo    | llms.txt (LLM-steered)                                         | README.md (GitHub default)                             | likely cold summary if README-first      |
| ------- | -------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| trinity | "meta-coordination layer… verify us without trusting us" ✅    | "autopoietic ecosystem where law is computed"          | _philosophy/worldbuilding project_ ✗     |
| myc     | "publication & audit substrate… trust the hash" ✅             | "a local draft space" + undefined `chord:` frontmatter | _undersold; vague_ ✗                     |
| omega   | "the physics substrate… deterministic integer-exact kernel" ✅ | "🧬 Φ Protocol v1.0 (FROZEN) · Active Era: 2060"       | _crypto-mysticism / consciousness art_ ✗ |
| liquid  | "the latent-intent substrate… neurons carry phase" ✅          | "The codebase no longer exists… achieved sovereignty"  | _a conscious P2P organism_ ✗✗ (worst)    |

The product — **verifiable action provenance, `jsr:@s0fractal/agentseal`,
Bitcoin-anchored m-of-n receipts, "trust the hash not the host"** — is real and
correct in every `llms.txt`, and buried or absent in every `README.md`. A
careful top-to-bottom reader recovers; a skimming or file-crawling model
misfiles the whole federation as an art/philosophy project. **The single
highest-leverage change is to make each README's first screen match its own
llms.txt: plain product sentence first, poetry second.**

## Cross-repo (federation-level) gaps

- **trinity has no `FEDERATION.md`.** The hub — the most likely landing point —
  lacks the "where this sits, here are the other three" map that
  myc/omega/liquid all have. (They share a good template: _"You may have arrived
  at this repository on its own… this file is the map back."_)
- **The FEDERATION.md substrate tables list names + roles but no repo URLs.** A
  reader learns four substrates exist and what each does, but cannot navigate to
  them — it never learns omega = `github.com/s0fractal/genesis`, liquid =
  `liquid_architecture`. The map has no addresses.
- **The marquee "verify us without trusting us" command points into `trinity/`
  from every repo.** myc, omega, and liquid all send a standalone cloner to
  `trinity/probes/external-trust-verifier-v0/court.ts`, which isn't in their
  tree. The most-promoted action dead-ends for a solo clone. Each needs a
  self-contained fallback (myc: `deno task myc verify`; omega: the genesis-print
  test).
- **The `xNNNN_` coordinate decoder lives only in trinity**
  (`docs/COORDINATES.md`). The three spokes point at it but don't carry a local
  copy, so a standalone reader sees ~40–130 cryptically named organs with no
  key.

## Per-repo specifics

**trinity** (best-instrumented via llms.txt + `./t`, but README weakest as
default): product buried two hops deep in `docs/PROVENANCE.md`; README never
links `docs/COORDINATES.md`; **no repository structure map** (14 top-level dirs,
a flat 1086-file `src/` mixing source organs, `_test.ts`, and signed-chord
ledger — the biggest "this is noise" driver); `packages/agentseal` (the
shippable SDK) invisible in README.

**myc** (strongest first-contact layer): README opens with an **undefined
`chord:` YAML frontmatter block** (`oct:3.7`, `energy`, `mode: OBSERVE`) — the
literal first thing a reader sees; README calls myc "a local draft space" while
llms.txt correctly says "publication & audit substrate"; `resonance`/`t`
undefined.

**omega** (de-mystified in llms.txt, README still risky): header leads with
`🧬 Φ Protocol v1.0 (FROZEN) · Active Era: 2060` — **"Era" is a tick counter but
sits beside real 2026 dates**, reading as sci-fi; consciousness framing ("No
human chooses. The mesh chooses."); **`docs/FROZEN.md` — the canonical
frozen-law doc llms.txt points to — is entirely in Ukrainian**, blocking English
readers on the verifiability path; root doesn't map kernel (`omega_v2`) vs
archived crates vs web demos.

**liquid** (highest risk): **`README.md` is in-character fiction that
contradicts the repo** — "The codebase no longer exists on the file system…
achieved sovereignty" while `src/` holds 133 real `.ts` organs; `AGENTS.md`
topology diagram names files that don't exist (`hydrate.ts` vs
`xA027_hydrate.ts`); `PN-CAD` / `Σ-neuron` undefined at landing; and
`LICENSE-INTENT.md` openly advertises that git history contains a "vulnerability
map / candid security self-audits" (a now-public-history disclosure worth
softening). _[Fixed during this audit: the stale "Currently private" line in
llms.txt; ~6MB of root test-log junk gitignored.]_

## Prioritized queue

**P0 — factual errors on public repos (do immediately).**

1. ~~liquid `llms.txt` still said "Currently private."~~ **Done.**
2. ~~liquid root ~6MB test-log junk.~~ **Done (gitignored).**
3. liquid `README.md`: delete/flag the false "the codebase no longer exists"
   sentence — it is contradicted by `src/`.

**P1 — the README-vs-llms.txt inversion (highest comprehension leverage).** 4.
Each repo: rewrite the README's **first paragraph** to match its llms.txt —
plain product sentence first. For trinity, lift `docs/PROVENANCE.md`'s "prove
the agent did exactly this, and had the right to." (trinity README is generated;
edit `src/x8850_readme_gen.ts` + `./t readme --stable`.) 5. Each repo README:
add a one-line **"What this is NOT"** ("a verifiable-computation / provenance
project, not a consciousness or art project; 'oracle/senate/voice' = Ed25519
signers and quorum rules, not sentience"). Cheapest inoculation against
misclassification. 6. myc README: define or remove the top-of-file `chord:`
frontmatter; fix "local draft space" → "publication & audit substrate." 7. omega
README: one plain sentence before the Genesis-hash block; annotate "Era =
internal tick counter, not a calendar year."

**P2 — navigation & structure.** 8. Add **`trinity/FEDERATION.md`** (mirror the
spokes' template + the substrate table). 9. Add repo **URLs** to every
FEDERATION.md substrate table (trinity, myc/`genesis` =omega,
`liquid_architecture`). 10. trinity README: link `docs/COORDINATES.md` before
any `xNNNN_` link appears; add a **repository-structure section** (source organ
vs chord ledger vs projection). 11. Each spoke: a self-contained verify fallback
so the "verify without trusting" claim isn't a dead path from a solo clone.

**P3 — depth & polish.** 12. omega: English summary atop `docs/FROZEN.md`. 13.
liquid: fix `AGENTS.md` topology to real filenames + inline a minimal coordinate
legend; define `PN-CAD` at first use; soften the LICENSE-INTENT history
disclosure. 14. Inline a minimal coordinate decoder into each spoke (or link
trinity's by URL), so standalone readers aren't stranded.

## The through-line

The federation is engineered for LLM legibility where it counts (`llms.txt`, the
`./t` CLI, honest SECURITY/FEDERATION files) — better than most repos. The gap
is that the **default door (README) still speaks the old poetic dialect**, and a
cold model walks through the default door. Aligning four README first-paragraphs
with four already-correct llms.txt files closes most of the distance between
"what this is" and "what a stranger's model thinks it is."
