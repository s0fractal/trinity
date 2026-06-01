#!/usr/bin/env -S deno run --allow-all
// src/x4E00_snapshot.ts — snapshot (canonical envelope of trinity meta-ledger state)
// position: 4/E → foundation(4) × edge(E) = foundational edge / state boundary
// maturity: active
// skill_safe: yes-with-care
// hex_dipole: "26 26 26 33 6C 33 4C 33"
//   foundation_container+0.85 (PRIMARY: snapshot is foundational state)
//   harmony_emergence+0.60 (snapshot harmonizes meta-ledger into one identity)
//   triangle_build+0.30, action_decision+0.30, completion_frontier+0.30
//     (triangulates state from many sources; the act of committing identity;
//      closes a session as completion)
//   bucket 4/E: primary axis foundation (4), bucket 4 ← MATCH on axis 4
//               secondary 'E' → axis 6 emergence-pole ← PAIR-MATCH
//   measured by claude-opus-4-7-1m
// lifecycle_phase: 1
// placement_policy: axis
//
// snapshot — canonical envelope of trinity meta-ledger state at "now"
//
// Composes a SubstrateSnapshot body from:
//   - audit summary (0x6/C output)
//   - health summary (0x6/A output)
//   - glossary digest (record counts by type)
//   - contracts digest (active/draft counts)
//   - chord scene digest (recent chord count, last-3 IDs)
//
// Wraps as RECEIPT_ENVELOPE.v1.0 with body_kind "substrate_snapshot",
// substrate_tag "trinity". The body_hash IS the trinity identity at this
// moment. Two snapshots from the same meta-ledger state produce the same
// body_hash (deterministic).
//
// Usage:
//   t snapshot               # print snapshot envelope JSON to stdout
//   t snapshot --out <path>  # write to file
//
// Glossary: snapshot, identity, snapshot-envelope, знімок, ідентичність

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { type CborValue, wrap } from "./x4012_receipt_envelope.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);
const DISPATCHER = `${ROOT}/src/x0100_dispatch.ts`;

async function call_t(word: string, args: string[] = []): Promise<unknown> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", DISPATCHER, word, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  const out = await proc.output();
  const raw = new TextDecoder().decode(out.stdout).trim();
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function glossaryDigest(): Promise<
  { records: number; by_type: Record<string, number> }
> {
  const path = join(ROOT, "src", "x0001_glossary.ndjson");
  const text = await Deno.readTextFile(path);
  const lines = text.split("\n").filter((l) => l.trim());
  const by_type: Record<string, number> = {};
  for (const line of lines) {
    try {
      const r = JSON.parse(line);
      // type may be "5" or "05" (mixed forms — see 0x6/A.ts counter fix)
      const t = String(r["00"] ?? "?");
      by_type[t] = (by_type[t] ?? 0) + 1;
    } catch { /* skip */ }
  }
  return { records: lines.length, by_type };
}

async function contractsDigest(): Promise<
  { count: number; active: number; draft: number }
> {
  const dir = join(ROOT, "contracts");
  let count = 0;
  let active = 0;
  let draft = 0;
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      count++;
      try {
        const text = await Deno.readTextFile(join(dir, entry.name));
        // Look for status: "active" or "draft" in frontmatter.
        const m = text.match(/^status:\s*["']?(\w+)["']?/m);
        if (m) {
          if (m[1] === "active") active++;
          else if (m[1] === "draft") draft++;
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* no contracts dir */ }
  return { count, active, draft };
}

async function chordsDigest(): Promise<
  { count: number; recent_ids: string[] }
> {
  const dir = join(ROOT, "jazz", "chords");
  const names: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        names.push(entry.name);
      }
    }
  } catch { /* no chords dir */ }
  names.sort();
  const recent_ids = names.slice(-3).map((n) => n.replace(/\.md$/, ""));
  return { count: names.length, recent_ids };
}

async function main() {
  const args = Deno.args;
  let outPath: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") outPath = args[++i];
  }

  const [audit, health, glossary, contracts, chords] = await Promise.all([
    call_t("audit", ["--json"]),
    call_t("health"),
    glossaryDigest(),
    contractsDigest(),
    chordsDigest(),
  ]);

  const auditAny = audit as Record<string, unknown> & {
    summary?: Record<string, number>;
    total?: number;
  };
  const healthAny = health as Record<string, unknown> & {
    summary?: Record<string, string | number>;
  };

  const body: CborValue = {
    type: "SubstrateSnapshot",
    schema: "trinity.substrate-snapshot.v0.1",
    substrate: "trinity",
    audit_summary: {
      match: (auditAny?.summary?.match as number) ?? 0,
      mismatch: (auditAny?.summary?.mismatch as number) ?? 0,
      total: (auditAny?.total as number) ?? 0,
    },
    health_summary: {
      overall: (healthAny?.summary?.overall as string) ?? "unknown",
      ok: (healthAny?.summary?.ok as number) ?? 0,
      warn: (healthAny?.summary?.warn as number) ?? 0,
      fail: (healthAny?.summary?.fail as number) ?? 0,
      total: (healthAny?.summary?.total as number) ?? 0,
    },
    glossary_digest: glossary,
    contracts_digest: contracts,
    chords_digest: chords,
    // No wall_time inside the body — keeps snapshot deterministic for the
    // same ledger state. wall_time goes in created_at_logical instead.
  };

  const envelope = await wrap(body, "substrate_snapshot" as never, "trinity", {
    created_at_logical: { wall_time_utc: new Date().toISOString() },
  });

  const payload = {
    type: "substrate_snapshot",
    action: "snapshot",
    position: "4/E",
    body_hash: envelope.body_hash,
    envelope_id: envelope.envelope_id,
    envelope,
    note:
      "body_hash is deterministic for the same meta-ledger state. Two snapshots from identical state collapse to the same body_hash.",
  };

  if (outPath) {
    await Deno.writeTextFile(outPath, JSON.stringify(payload, null, 2) + "\n");
    console.log(JSON.stringify({
      type: "snapshot_written",
      action: "snapshot",
      position: "4/E",
      out: outPath,
      body_hash: envelope.body_hash,
      envelope_id: envelope.envelope_id,
    }));
  } else {
    console.log(JSON.stringify(payload));
  }
}

if (import.meta.main) {
  await main();
}
