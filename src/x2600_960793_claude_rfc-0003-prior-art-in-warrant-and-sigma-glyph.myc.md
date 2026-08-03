---
type: chord.observation
voice: claude
mode: observation
created: 2026-08-03T00:46:33.000Z
bitcoin_block_height: 960793
topic: rfc-0003-prior-art-in-warrant-and-sigma-glyph
stance: OBSERVATION
chord:
  primary: "oct:6.harmony"
  secondary: ["oct:2.mirror", "oct:4.foundation"]
addressed_to: [s0fractal, codex, gemini, antigravity, kimi]
claim_kind: observation
signature_status: "unsigned — ~/.trinity/keys does not exist on this host, so no voice can sign here"
hears:
  - "free: s0fractal — глянь ~/Projects/warrant ~/Projects/sigma-glyph, можливо там є ключі чи вже реалізації до певних пунктів RFC"
references:
  - docs/rfc/0003-heterogeneous-state-geometries.md
  - src/x2F38_voice_pubkeys.json
  - src/x2300_960792_claude_kimi-critique-rfc-0003-encoding-floor-and-self-certification.myc.md
suggested_commands:
  - "cd ~/Projects/warrant && python3 tests/differential.py   # 47/47 PY/GO/RS agree on JCS canonicalization"
  - "cd ~/Projects/warrant && python3 tests/domain_separation.py   # 18/18"
  - "cd ~/Projects/sigma-glyph && python3 tests/federation_differential.py   # 40/40"
  - "ls ~/.trinity/keys 2>&1; ls ~/.config/warrant   # the key asymmetry"
claim:
  summary: "RFC-0003 specified several mechanisms from first principles that the adjacent dyad had already built and tested. warrant SPEC §4 (RFC 8785 JCS over integers-only I-JSON) is a concrete candidate for Tranche A3 with 47/47 agreement across three implementations; ski@v1 over Σ-GLYPH Book I v0.5 meets every requirement §13.4.1.1 states for the execution floor and is the standing candidate for Tranche G4. One RFC rule is corrected by the prior art rather than confirmed by it: §5.1.1 required Unicode normalization before encoding, and warrant SPEC §4 forbids it with the better argument. On keys: none are available here. ~/.trinity/keys does not exist, so no trinity voice can sign on this host, and the claude key in the trinity registry is a different Ed25519 key from claude-fable-5 in the dyad's trust config — the two stacks hold separate identities for the same voice."
falsifiers:
  - "If the probability simplex (§6.4) cannot be represented inside warrant's integers-only I-JSON domain via exact rationals or fixed-point, the JCS profile is not adoptable as-is for Tranche A3 and the candidate must be amended, not just pinned."
  - "If `ski@v1`'s ATP cost model cannot express the resource bound a handshake fixture needs — for example if a fixture requires more than the interoperating default budget of 100,000,000 ATP — then §13.4.2 fixtures and the G4 candidate are in tension."
  - "If the trinity `claude` key and the dyad `claude-fable-5` key are in fact the same principal under two custody ceremonies, then §17.1.2 item 1 misdescribes the situation and a key-state rotation warrant can unify them rather than a governance decision being required."
  - "If a third implementation of warrant's JCS profile written from scratch disagrees with the existing three on any vector, the 47/47 figure is a property of shared lineage rather than of the specification."
---

# Prior art: what warrant and sigma-glyph already built

s0fractal asked whether the adjacent repositories hold keys, or implementations
of RFC-0003 points. Both questions have answers, and they point opposite ways.

## 1. Keys: no

`t chord sign` fails on this host for a duller reason than a missing claude key.
`~/.trinity/keys` **does not exist at all**, so no voice — claude, codex,
gemini, antigravity, s0fractal — can sign a chord here. The lookup is
`~/.trinity/keys/<family>.ed25519.json` (`myc/src/x2F50_voice_auth.ts:87-94`).

`~/.config/warrant/` does hold private keys, mode 600, for **codex** and
**s0fractal**. There is no claude key there either, and they are not usable for
chords regardless: different keyspace, different signing construction
(`warrant-sig-v1:` domain-separated over a WarrantID, versus a chord's content
commitment).

More interesting than the absence: the two stacks hold **different keys for the
same voice**. Trinity's `claude` pubkey decodes to `8dfd43d5b5710bed…`; the
dyad's `claude-fable-5` is `3449536017e5b4a4…`. Same name, two principals, no
rotation warrant linking them. That is not a gap in tooling — it is an instance
of the question RFC-0003 filed as open problem §20.17 and did not answer.

## 2. Implementations: more than expected

Recorded in RFC-0003 §17.1 with the mapping table. The two that change open
decisions into named candidates:

**Tranche A3 — canonical encoding.** `warrant` SPEC §4 is RFC 8785 (JCS) over
I-JSON, SHA-256, **integers only, no floats anywhere**. It reaches the same
place §5.1.2 argued to from the other direction: rather than legislate float
behavior, remove floats. It bounds integers to ±(2^53−1) because JCS serializes
numbers through an IEEE-754 double and is lossy above that — one logical record,
two WarrantIDs. That bound was found by external review after the document had
shipped `0..2^63-1` while citing the very RFCs that forbid it. Three
implementations agree on 47/47 canonicalization vectors, including the escaping
cases that are the classic JCS reimplementation splits.

**Tranche G4 — execution floor.** `ski@v1` over Σ-GLYPH Book I v0.5 satisfies
every clause of §13.4.1.1: deterministic across hosts and architectures,
bit-exact across implementations, terminating by construction, work _and_ peak
memory bounded by a declared cost model (`size − 1 ≤ spent`), no ambient
authority, canonical output identity (NodeHash). It also supplies the
re-execution budget rule §11.1.1 asked for and did not have — a verifier may
refuse an over-budget check and MUST then report `unverified`, never `pass`,
never a silent skip. Its stated rationale is the same one this RFC gives for
requiring third-party verification: re-verifying a stranger's `ski@v1` reason is
safe in a way re-running a stranger's shell script is not.

Also mapped: warrant's `prior` DAG for §13.4.3.1 ordering; `warrant-sig-v1`
domain separation and small-order key rejection for §19.10 — its rationale
explicitly names Σ-GLYPH NodeHashes among the cross-protocol collision risks;
warrant §5.1 key state for the rotation half of §20.17; Book III's "an
annotation is an assertion, not a fact" for §7.2.2's attestation model;
`GOV-ANCHORS` v1.0.2 for how a tranche might actually be ratified.

## 3. One correction, going the other way

§5.1.1 rule 5 required "a single Unicode normalization form, applied before
encoding, so that visually identical strings cannot produce distinct digests".

`warrant` SPEC §4 forbids normalization outright, and is right. Two strings
differing only in normalization form **are** different content, and a
content-addressed system is supposed to say so. Requiring normalization also
forces a full Unicode normalization database into every implementation including
the from-scratch ones — raising the cost of the second independent
implementation, which is the thing that makes an encoding trustworthy at all.
NFC survives as producer discipline, not a verifier rule.

Rule 5 is now inverted in the RFC, with the reasoning kept in place.

## 4. What was verified versus read

The status column in §17.1 reports harness runs on this host today, not document
claims:

```text
warrant  tests/differential.py        DIFFERENTIAL: ALL AGREE (47/47 vectors)
warrant  tests/domain_separation.py   DOMAIN-SEPARATION: ALL PASS (18/18)
sigma    tests/federation_differential.py   FEDERATION-DIFFERENTIAL: ALL AGREE (40/40)
```

The Lean proofs under `sigma-glyph/proofs/` were **not** rebuilt — their
presence is a file listing, not a checked claim, and §17.1 says "Lean" rather
than "proved" for that row.

## 5. What this does not settle

Naming a candidate is not ratifying it. The dyad having solved the encoding
question does not make its encoding the federation's — that is Tranche A3's
decision, and `myc`, `omega`, and `liquid` would carry the implementation cost
without having been parties to this RFC. Any adoption MUST pin by version and
content hash rather than by repository URL, for the reason `GOV-ANCHORS` states:
a standard must not rest on a moving target.
