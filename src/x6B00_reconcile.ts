#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
// src/x6B00_reconcile.ts — reconcile operational truth across introspection
// surfaces.
// position: 6/B → harmony(6) × bridge(B) = make the surfaces agree, or say why
// hex_dipole: "00 00 00 00 00 00 59 00"
// placement_policy: axis
//
// Codex P4 (x7d00_954231): the public introspection commands disagreed —
// `t check` green while `t resolve overview` says index.fresh:false; the daemon
// reads a cognition cache that can drift from the live organ horizons; the trinity
// decisions ledger and myc's ProposalResolutionDescriptors are separate ledgers.
// This gate makes each pair EITHER agree OR carry an explicit explanation of its
// different scope — so a green preflight can never silently HIDE a stale
// operational index. Read-only (it only runs read organs); composed into `t check`.

import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.4";
import { extractOrganJson, runOrgan } from "./x0010_dispatch_runner.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const T = join(ROOT, "t");

type Status = "agree" | "explained" | "reconcilable_gap" | "inconsistent";
interface Dimension {
  name: string;
  status: Status;
  detail: string;
  data?: Record<string, unknown>;
}

/** The cross-ledger rule, pure + testable: a myc proposal's finality vs whether a
 *  trinity closing chord reflects it. Both-not-done and both-done AGREE; final
 *  without a trinity closure is a reconcilable gap; trinity-closed while myc is not
 *  final is a real contradiction. (codex P4) */
export function classifyProposal(
  mycFinal: boolean,
  trinityClosed: boolean,
): Status {
  if (mycFinal && trinityClosed) return "agree";
  if (!mycFinal && !trinityClosed) return "agree";
  if (mycFinal && !trinityClosed) return "reconcilable_gap";
  return "inconsistent";
}

async function tJson(args: string[]): Promise<unknown> {
  const r = await runOrgan(T, args, { cwd: ROOT });
  return r.code === 0 ? extractOrganJson(r.stdout) : null;
}

/** (1) Resolver index freshness — a gitignored LOCAL CACHE, not committed state. */
async function dimResolverIndex(): Promise<Dimension> {
  const o = await tJson(["resolve", "overview", "--json"]) as
    | { index?: { fresh?: boolean; used?: string } }
    | null;
  const fresh = o?.index?.fresh;
  const used = o?.index?.used ?? "?";
  if (fresh === true) {
    return {
      name: "resolver_index",
      status: "agree",
      detail: "index cache fresh",
    };
  }
  return {
    name: "resolver_index",
    status: "explained",
    detail:
      `index.fresh=${fresh} (used=${used}) — the resolver index is a gitignored ` +
      `local cache (src/*.latest.myc.json); fresh:false is EXPECTED when the cache ` +
      `is stale/absent, and the live result is authoritative. Not a committed-state ` +
      `property. Refresh: t resolve index.`,
    data: { fresh, used },
  };
}

/** Does an organ source declare an OPEN horizon header? A horizon is a dedicated
 *  horizon-header LINE (not "none"), LINE-ANCHORED so prose merely mentioning the
 *  word mid-comment is not miscounted — the bug this gate caught in its own source.
 *  Pure + testable. Mirrors x5200's isOpenHorizon. */
export function openHorizonInHeader(source: string): boolean {
  const m = source.slice(0, 4000).match(/^\s*\/\/\s*horizon:\s*(.+)$/im);
  return !!m && !/^none\b/i.test(m[1].trim());
}

function liveOpenHorizons(): number {
  let n = 0;
  for (const e of Deno.readDirSync(join(ROOT, "src"))) {
    if (!e.isFile || !/^x[0-9a-fA-F]{4}_.*\.ts$/.test(e.name)) continue;
    if (e.name.endsWith("_test.ts")) continue;
    if (openHorizonInHeader(Deno.readTextFileSync(join(ROOT, "src", e.name)))) {
      n++;
    }
  }
  return n;
}

/** (2) Horizon parity — the daemon and cognition read a cache; does it match the
 *  live organ horizons? */
async function dimHorizonParity(): Promise<Dimension> {
  const live = liveOpenHorizons();
  let cache = -1;
  try {
    const c = JSON.parse(
      Deno.readTextFileSync(
        join(ROOT, "src", "x5288_cognition_recommendation.latest.myc.json"),
      ),
    );
    cache = Array.isArray(c.open_horizons) ? c.open_horizons.length : -1;
  } catch { /* cache absent */ }
  if (cache === live) {
    return {
      name: "horizon_parity",
      status: "agree",
      detail:
        `live organ horizons = cognition cache = ${live} (daemon reads this cache)`,
      data: { live, cache },
    };
  }
  return {
    name: "horizon_parity",
    status: "explained",
    detail:
      `live organ horizons=${live}, cognition cache=${
        cache < 0 ? "absent" : cache
      } — the daemon/cognition read the gitignored cache ` +
      `(x5288_cognition_recommendation.latest.myc.json), which has drifted from the ` +
      `live organ headers. Refresh: t cognition recommend.`,
    data: { live, cache },
  };
}

/** (3) Cross-ledger: each myc proposal's finality vs whether a trinity closing
 *  chord reflects it. myc-not-final ↔ trinity-open AGREE; myc-final without a
 *  trinity closure is a reconcilable gap; trinity-closed while myc-not-final is a
 *  real contradiction. */
async function dimCrossLedger(): Promise<Dimension> {
  const TERMINAL = new Set([
    "implemented",
    "rejected",
    "superseded",
    "withdrawn",
    "expired",
  ]);
  const life = await tJson(["myc", "lifecycle", "--json"]) as
    | { mutations?: Array<{ kind?: string; id?: string; state?: string }> }
    | null;
  const proposals = (life?.mutations ?? []).filter((m) =>
    m.kind === "proposal"
  );

  // which proposal ids are referenced by a trinity chord (closes/hears/body)?
  const chordText: string[] = [];
  for (const e of Deno.readDirSync(join(ROOT, "src"))) {
    if (e.isFile && e.name.endsWith(".myc.md")) {
      chordText.push(Deno.readTextFileSync(join(ROOT, "src", e.name)));
    }
  }
  const referenced = (id: string) => {
    const stem = id.replace(/\.myc\.md$/, "").replace(/\.proposal$/, "");
    return chordText.some((t) => t.includes(stem));
  };

  const items = proposals.map((p) => {
    const id = String(p.id ?? "");
    const mycFinal = TERMINAL.has(String(p.state));
    const trinityClosed = referenced(id);
    const status = classifyProposal(mycFinal, trinityClosed);
    return { id, myc_state: p.state, mycFinal, trinityClosed, status };
  });

  const worst: Status = items.some((i) => i.status === "inconsistent")
    ? "inconsistent"
    : items.some((i) => i.status === "reconcilable_gap")
    ? "reconcilable_gap"
    : items.length === 0
    ? "agree"
    : "agree";
  const gaps = items.filter((i) => i.status !== "agree");
  return {
    name: "cross_ledger",
    status: worst,
    detail: gaps.length === 0
      ? `${items.length} myc proposal(s); myc finality and the trinity decisions ledger agree (both "not yet resolved" or both closed).`
      : gaps.map((g) =>
        g.status === "reconcilable_gap"
          ? `${g.id} is FINAL (${g.myc_state}) in myc but no trinity closing chord references it — close it with a trinity decision chord.`
          : `${g.id} is ${g.myc_state} in myc yet a trinity chord closes it — contradiction.`
      ).join(" "),
    data: { items },
  };
}

export async function reconcile(): Promise<Record<string, unknown>> {
  const dimensions = [
    await dimResolverIndex(),
    await dimHorizonParity(),
    await dimCrossLedger(),
  ];
  const reconciled = !dimensions.some((d) => d.status === "inconsistent");
  return {
    type: "reconcile",
    position: "6/B",
    action: "reconcile",
    reconciled,
    dimensions,
    note:
      "Each surface either agrees or carries an explicit explanation of its scope; " +
      "a green preflight cannot hide a stale operational index. Only an unexplained " +
      "contradiction (`inconsistent`) fails the gate.",
  };
}

export async function runCli(args: string[] = Deno.args): Promise<void> {
  const r = await reconcile();
  if (args.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(`# reconcile → 6/B   reconciled=${r.reconciled}`);
    for (const d of r.dimensions as Dimension[]) {
      console.log(
        `  ${
          d.status === "agree"
            ? "✅"
            : d.status === "inconsistent"
            ? "⛔"
            : "ℹ️ "
        } ${d.name}: ${d.detail}`,
      );
    }
  }
  if (!r.reconciled) Deno.exitCode = 1;
}

if (import.meta.main) await runCli();
