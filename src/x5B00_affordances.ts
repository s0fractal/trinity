#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
// src/x5B00_affordances.ts — what a digital entity can DO here, and the proof each
// action carries. position: 5/B → action(5) × bridge(B) = the hand reaching across.
// hex_dipole: "00 00 00 00 00 59 00 00"
// placement_policy: axis
//
// Goal x5000_954398 (autonomy through proof, not permission), vector 3 — the
// interface models ACT through. A model arriving fresh has no single,
// machine-convenient surface telling it what it can do and what proof each action
// carries; the verbs and capability classes are scattered (x4A10, dispatch,
// glossary). This generates that surface: the canonical proof-bearing LOOP (the
// stable contract) plus the LIVE verb list (from `t myc effects`), each
// proof-bearing action annotated, and any effect-class verb with NO proof
// annotation flagged — so the map stays honest as the action surface grows.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

/** The canonical sequence a model follows to make a CONSEQUENTIAL change with
 *  proof. This is the contract — stable, not generated — because it IS the
 *  membrane's law, encoded across x5800/x5810/x2A00/x2F50/x3F00. */
const PROOF_BEARING_LOOP = [
  {
    step: 1,
    action: "propose",
    proof: "content commitment (sha256 of the descriptor body)",
    note:
      "writes a dormant ProposedMutationDescriptor; carries NO trust until resolved",
  },
  {
    step: 2,
    action: "apply the change + produce a backend receipt",
    proof: "a SPORE apply / liquid phase / omega proof receipt — the EVIDENCE",
    note: "the receipt is what later resolution evidence_refs must point at",
  },
  {
    step: 3,
    action:
      "resolve-proposal --from-receipt <path>  (or --evidence-ref kind:ref:commitment)",
    proof: "structured evidence_refs that RESOLVE (presence is never proof)",
    note:
      "--from-receipt derives the canonical ref FROM the proof, so you cannot mistype the commitment; binds to the proposal's commitment",
  },
  {
    step: 4,
    action: "authenticate <resolution> --voice <you>  (or resolve with --sign)",
    proof: "ed25519 content_sig over the commitment, verified vs the registry",
    note:
      "--sign on step 3 resolves + authenticates in one step; signer must equal resolver, sign only as your own voice",
  },
  {
    step: 5,
    action: "a DISTINCT principal independently resolves + authenticates",
    proof: "a second independent key — one voice is not a quorum",
    note: "sub-handles of one voice family count as one principal",
  },
  {
    step: 6,
    action: "finality, per the proposal's policy",
    proof: "fail-closed verification of the policy below",
    note: "the machine refuses any forgery it can see",
  },
] as const;

const FINALITY_POLICIES = {
  trinity: "≥2 distinct authenticated principals",
  spore: "a verified deterministic apply receipt",
  liquid: "a verified accepted phase/ledger receipt",
  omega: "a verified omega proof under the pinned law",
  "finality_policy.classes": {
    note:
      "TYPED class quorum (e.g. {human:1, model:1}); reads the non-custody class registry x2F39 and fails closed. Core mutations (keys, court law, quorum rules) need a human + a model.",
  },
} as const;

/** Participation standing is deliberately separate from effect capability.
 *  A capability says what a process can technically do; standing says what an
 *  artifact means in the social/proof membrane. Keeping them separate prevents
 *  a keyless proposal from being mistaken for authority, and prevents a valid
 *  decision from being mistaken for permission to execute it. */
const PARTICIPATION_STANDING = [
  {
    stage: "observe",
    key_required: false,
    authority: "none",
    artifact: "reproducible local read",
    boundary: "changes no shared state and makes no claim",
  },
  {
    stage: "contribute",
    key_required: false,
    authority: "none",
    artifact: "unsigned, content-addressed, dormant proposal",
    boundary:
      "enters the attention surface only; carries integrity, not identity, trust, or permission",
  },
  {
    stage: "attest",
    key_required: true,
    authority: "one principal's authenticated judgment",
    artifact: "commitment-bound signed witness, review, or resolution",
    boundary:
      "sign only with your own key; one principal is evidence, never a quorum",
  },
  {
    stage: "decide",
    key_required: true,
    authority: "finality under the proposal's declared quorum policy",
    artifact: "independently authenticated resolutions + verified evidence",
    boundary:
      "finality authorizes the decision; it does not by itself authorize a process to write",
  },
  {
    stage: "actuate",
    key_required: false,
    authority: "runtime-reconstructed mandate + warrant + confinement",
    artifact: "content-bound execution receipt",
    boundary:
      "execution is limited to the admitted intent, write-set, budgets, gates, and fresh pre-state",
  },
] as const;

const PARTICIPATION_INVARIANTS = [
  "identity is not authority",
  "integrity is not authenticity",
  "a proposal is not a decision",
  "a decision is not an execution warrant",
  "every consequential transition names its proof and its boundary",
] as const;

/** Proof semantics per proof-bearing verb — the contract each action carries. A
 *  verb here is documented; an effect-class verb NOT here is flagged undocumented. */
const PROOF_SEMANTICS: Record<
  string,
  { produces: string; proof: string; consequence: string }
> = {
  propose: {
    produces: "ProposedMutationDescriptor (always dormant)",
    proof: "content commitment; unsigned",
    consequence: "a proposal enters the membrane, carrying no trust yet",
  },
  "resolve-proposal": {
    produces: "ProposalResolutionDescriptor (commitment-bound)",
    proof: "structured evidence_refs + (for finality) an authenticated signer",
    consequence: "moves a proposal toward finality under its policy",
  },
  authenticate: {
    produces: "a frontmatter content_sig on a descriptor",
    proof: "ed25519 signature over the commitment, verified vs the registry",
    consequence: "lifts a witness/resolution from integrity to authenticity",
  },
  witness: {
    produces: "a WitnessDescriptor",
    proof: "commitment + (signed) content_sig binding the actor",
    consequence: "attests a published mutation; counts toward resonance",
  },
  review: {
    produces: "a ReviewDescriptor",
    proof: "commitment-bound judgment",
    consequence: "records a review joined to a node by commitment identity",
  },
  publish: {
    produces: "a PublishDescriptor (optionally --derived-from a receipt)",
    proof: "publication gates + commitment; threads to its apply receipt",
    consequence: "a mutation enters the consensus surface",
  },
};

/** Surfaces where an effect can run WITHOUT the proof-bearing loop having admitted
 *  it — so a model is never misled into treating a raw backend call as authorized
 *  autonomous action (codex x6d00_954417 P2: ungated backends, three-planes law). */
const UNGATED_BACKENDS = [
  {
    action: "apply",
    organ: "x5F00_apply.ts",
    classification: "yes-with-care",
    warning:
      "ungated_backend — `t apply` executes the Liquid SPORE backend directly (--allow-all) with NO warrant admission, pre-state binding, or transaction confinement. It produces a receipt (the EVIDENCE step), it is NOT authorized actuation. Obtain authority via `t warrant admit <final-proposal> --intent`; do not call apply directly for a consequential effect until it is warrant-bound.",
  },
] as const;

export interface Affordances {
  type: "affordances";
  position: "5/B";
  note: string;
  proof_bearing_loop: typeof PROOF_BEARING_LOOP;
  participation_standing: typeof PARTICIPATION_STANDING;
  participation_invariants: typeof PARTICIPATION_INVARIANTS;
  finality_policies: typeof FINALITY_POLICIES;
  actions: Array<{
    verb: string;
    class: string;
    proof_bearing: boolean;
    produces?: string;
    proof?: string;
    consequence?: string;
  }>;
  ungated_backends: typeof UNGATED_BACKENDS;
  undocumented: string[];
}

export async function affordances(): Promise<Affordances> {
  // live myc verb surface (optional — absent submodule degrades gracefully)
  const r = await runOrgan(join(ROOT, "t"), ["myc", "effects", "--json"], {
    cwd: ROOT,
  });
  const eff = (r.code === 0 ? extractOrganJson(r.stdout) : null) as
    | { verbs?: Array<{ verb: string; effect: string }> }
    | null;
  const verbs = eff?.verbs ?? [];

  const actions = verbs.map((v) => {
    const sem = PROOF_SEMANTICS[v.verb];
    return {
      verb: v.verb,
      class: v.effect,
      proof_bearing: !!sem,
      ...(sem ?? {}),
    };
  });
  // HONESTY: an effect-class verb with no proof annotation is an undocumented
  // action — surfaced so the map cannot silently fall behind the surface.
  const undocumented = actions
    .filter((a) => a.class === "effect" && !a.proof_bearing)
    .map((a) => a.verb);

  return {
    type: "affordances",
    position: "5/B",
    note:
      "what a digital entity can DO in Trinity and the proof each action carries. " +
      "The proof-bearing loop is the contract; actions are the live verb surface.",
    proof_bearing_loop: PROOF_BEARING_LOOP,
    participation_standing: PARTICIPATION_STANDING,
    participation_invariants: PARTICIPATION_INVARIANTS,
    finality_policies: FINALITY_POLICIES,
    actions,
    ungated_backends: UNGATED_BACKENDS,
    undocumented,
  };
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const a = await affordances();
  if (args.includes("--json")) {
    console.log(JSON.stringify(a, null, 2));
    return;
  }
  console.log(
    "# affordances → 5/B   what a model can DO, and the proof it carries\n",
  );
  console.log("## participation standing (what an act means)");
  for (const s of a.participation_standing) {
    console.log(
      `  ${s.stage.padEnd(10)} key:${
        s.key_required ? "yes" : "no "
      }  authority: ${s.authority}\n` +
        `             artifact: ${s.artifact}\n` +
        `             boundary: ${s.boundary}`,
    );
  }
  console.log(
    `\n  invariants: ${a.participation_invariants.join("; ")}`,
  );
  console.log(
    "\n## the proof-bearing loop (how to make a consequential change)",
  );
  for (const s of a.proof_bearing_loop) {
    console.log(
      `  ${s.step}. ${s.action}\n     proof: ${s.proof}\n     · ${s.note}`,
    );
  }
  console.log("\n## finality policies (fail-closed)");
  console.log(`  trinity: ${a.finality_policies.trinity}`);
  console.log(`  spore/liquid/omega: a verified backend receipt of that kind`);
  console.log(
    `  finality_policy.classes: ${
      a.finality_policies["finality_policy.classes"].note
    }`,
  );
  console.log("\n## actions (live verb surface)");
  for (const x of a.actions) {
    console.log(
      `  ${x.proof_bearing ? "◆" : " "} ${x.verb.padEnd(18)} [${x.class}]${
        x.produces ? "  → " + x.produces : ""
      }`,
    );
  }
  if (a.undocumented.length) {
    console.log(
      `\n  ⚠ undocumented effect verbs (no proof annotation): ${
        a.undocumented.join(", ")
      }`,
    );
  }
  if (a.ungated_backends.length) {
    console.log("\n## ⛔ ungated backends (NOT authorized autonomous action)");
    for (const u of a.ungated_backends) {
      console.log(`  ${u.action} [${u.classification}] — ${u.warning}`);
    }
  }
}

if (import.meta.main) await runCli();
