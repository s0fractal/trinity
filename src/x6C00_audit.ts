#!/usr/bin/env -S deno run --allow-read
// src/x6C00_audit.ts — audit / place-check / introspect
// position: 6/C → harmony(6) × container-pair(C) = order-check of container state
// maturity: active
// skill_safe: yes-readonly
// hex_dipole: "00 00 40 33 4C 26 6C 33"
//   harmony_emergence+0.85 (PRIMARY: measures dissonance from intended order)
//   foundation_container+0.60 (examines bucket/container state)
//   mirror_apex+0.50 (reflects substrate state back as report)
//   completion_frontier+0.40, triangle_build+0.40 (composes file-reads)
//   action_decision+0.30 (probes files)
//   bucket 6/C: primary axis harmony (6), bucket 6 ← MATCH
//               secondary 'C' → hex C = axis 4 negative pole, dipole +0.60
//               on axis 4 ← PAIR-MATCH (sign-opposed; offer on need-bucket)
//   measured by claude-opus-4-7-1m, anchor block 949262
// lifecycle_phase: 1
//
// audit — bucket-vs-dipole match report
//
// Reads `hex_dipole:` header from every src/x<NNNN>_*.ts and *.sh after the
// 2026-05-18 flat-src migration. Compares strongest axes (loose tie semantics)
// against the first hex digit of the file's coordinate. Reports match /
// mismatch / no_dipole per file plus summary.
//
// Not a gate. Not enforcement. Just a check.
//
// no_dipole policy (formalized 2026-05-18):
//   Files migrated from lib/, scripts/, tools/ infrastructure do not require
//   hex_dipole headers — they're called via static import, not via t-dispatch,
//   so audit-time semantic verification is not load-bearing. Audit reports
//   them as `no_dipole` (neutral status, not mismatch). Organs reachable via
//   `t <handle>` glossary lookup SHOULD have hex_dipole headers so audit can
//   verify their declared placement. Infra files MAY add headers later if
//   their coordinate role becomes ambiguous; this is opt-in, not required.
//
// Usage (via dispatcher):
//   t audit                    full report
//   t audit --mismatch-only    only files with bucket≠axis dissonance
//   t audit --quiet            summary line only
//   t audit --json             machine-readable JSON output
//
// Glossary words: audit, place-check, introspect, аудит, інтроспекція
//
// Substrate alignment:
//   - HEX_DIPOLE_SEED.v0 axis ordering
//   - per-file headers as source of truth (not central glossary)
//   - loose-tie: any axis tied for strongest magnitude that matches
//     bucket axis (mod 8) counts as match; sign-pole opposition noted
//   - composite/fractal readings (where /M secondary rescues primary
//     mismatch) NOT computed here; see receipt chord 2026-05-13T230000Z
//
// Exit codes:
//   0  all files match OR file has no dipole header
//   1  one or more mismatches under projection reading
//   2  one or more files have malformed/missing dipole

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const ROOT = dirname(HERE);

const DIPOLE_AXES = [
  "void_infinity",
  "first_penultimate",
  "mirror_apex",
  "triangle_build",
  "foundation_container",
  "action_decision",
  "harmony_emergence",
  "completion_frontier",
] as const;

type PlacementPolicy =
  | "axis"
  | "composite"
  | "tier"
  | "legacy"
  | "substrate_namespace";

interface FileReport {
  path: string;
  bucket: string;
  signature: number[] | null;
  raw: string | null;
  strongest_axes: number[];
  strongest_axes_names: string[];
  strongest_value: number | null;
  bucket_int: number | null;
  placement_policy: PlacementPolicy;
  match: "match" | "mismatch" | "deferred" | "no_dipole" | "malformed";
  note: string;
  is_dispatchable: boolean;
  boundary_adapter: string | null;
  boundary_imports: string[];
  import_warnings: string[];
}

interface RegistryWarning {
  substrate: string;
  position: string;
  cwd: string;
  command: string;
  token: string;
  expected_path: string;
  message: string;
}

function parsePlacementPolicy(text: string): PlacementPolicy {
  const m = text.match(
    /placement_policy:\s*(axis|composite|tier|legacy|substrate_namespace)/,
  );
  return (m?.[1] as PlacementPolicy) ?? "axis";
}

function parseBoundaryAdapter(text: string): string | null {
  const m = text.match(/boundary_adapter:\s*([^\n]+)/);
  return m?.[1].trim() ?? null;
}

function pathComponents(relPath: string): number[] {
  // After 2026-05-18 flat-src migration filenames carry the coordinate.
  // "src/x5C00_cross_verify.ts" → [5, 12, 0, 0]
  // "src/x0042_dispatch.ts"     → [0, 0, 4, 2]
  // "src/x0F00_help.ts"         → [0, 15, 0, 0]
  const name = relPath.split("/").pop() ?? "";
  const m = name.match(/^x([0-9A-Fa-f]{4})_/);
  if (!m) return [];
  return [...m[1]].map((ch) => parseInt(ch, 16));
}

function i8HexToSigned(hex: string): number {
  const u8 = parseInt(hex, 16);
  if (!Number.isFinite(u8) || u8 < 0 || u8 > 255) return NaN;
  return u8 >= 128 ? u8 - 256 : u8;
}

function parseHexDipole(
  text: string,
): { values: number[] | null; raw: string | null } {
  const match = text.match(/hex_dipole:\s*"([^"]+)"/);
  if (!match) return { values: null, raw: null };
  const raw = match[1].trim();
  const clean = raw.replace(/\s+/g, "").toUpperCase();
  if (clean.length !== 16) return { values: null, raw };
  const values: number[] = [];
  for (let i = 0; i < 16; i += 2) {
    const v = i8HexToSigned(clean.slice(i, i + 2));
    if (!Number.isFinite(v)) return { values: null, raw };
    values.push(v);
  }
  return { values, raw };
}

function strongestAxes(values: number[]): { axes: number[]; mag: number } {
  let bestMag = -1;
  for (let i = 0; i < values.length; i++) {
    const mag = Math.abs(values[i]);
    if (mag > bestMag) bestMag = mag;
  }
  const axes: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (Math.abs(values[i]) === bestMag) axes.push(i);
  }
  return { axes, mag: bestMag };
}

function bucketOf(
  relPath: string,
): { bucket: string; bucketInt: number | null } {
  // After flat-src: bucket is the first hex digit in the filename (x<bucket>...).
  const name = relPath.split("/").pop() ?? "";
  const m = name.match(/^x([0-9A-Fa-f])[0-9A-Fa-f]{3}_/);
  if (!m) return { bucket: relPath, bucketInt: null };
  return { bucket: m[1].toUpperCase(), bucketInt: parseInt(m[1], 16) };
}

async function scanHexFiles(root: string): Promise<string[]> {
  // Walk src/ for x<4-hex>_<name>.ts and .sh files (the new flat-src convention).
  const srcDir = join(root, "src");
  const out: string[] = [];
  try {
    for await (const entry of Deno.readDir(srcDir)) {
      if (!entry.isFile) continue;
      if (!entry.name.match(/^x[0-9A-Fa-f]{4}_/)) continue;
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".sh")) continue;
      out.push(`src/${entry.name}`);
    }
  } catch { /* src/ missing — return empty */ }
  return out.sort();
}

function coordinateHexOf(relPath: string): string | null {
  const name = relPath.split("/").pop() ?? "";
  const m = name.match(/^x([0-9A-Fa-f]{4})_/);
  return m ? m[1].toUpperCase() : null;
}

function isDynamicChordTopologyFile(name: string): boolean {
  return /^x[0-9A-Fa-f]{4}_(?:\d+|t\d{14})_[a-z0-9-]+_.+\.myc\.md$/.test(
    name,
  );
}

function getRelativeImports(text: string): string[] {
  const imports = new Set<string>();
  const staticMatches = text.matchAll(
    /(?:import|export)\s+[\s\S]*?\s+from\s+["'](\.\.?\/[^"']+)["']/g,
  );
  for (const m of staticMatches) {
    imports.add(m[1]);
  }
  const dynamicMatches = text.matchAll(
    /import\s*\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g,
  );
  for (const m of dynamicMatches) {
    imports.add(m[1]);
  }
  return [...imports];
}

async function isRuntimeOrganImport(
  importerRelPath: string,
  imp: string,
): Promise<boolean> {
  try {
    const importerDir = dirname(join(ROOT, importerRelPath));
    const importedPath = join(importerDir, imp);
    const rootSrc = join(ROOT, "src") + "/";
    if (!importedPath.startsWith(rootSrc)) return false;
    const text = await Deno.readTextFile(importedPath);
    return /\bimport\.meta\.main\b/.test(text);
  } catch {
    // Missing/unreadable imports should keep the warning path conservative.
    return true;
  }
}

async function auditRelativeImports(
  relPath: string,
  imports: string[],
  fileCoordinateHex: string | null,
  boundaryAdapter: string | null,
): Promise<{ warnings: string[]; boundaryImports: string[] }> {
  const warnings: string[] = [];
  const boundaryImports: string[] = [];
  const fileBucketInt = fileCoordinateHex
    ? parseInt(fileCoordinateHex[0], 16)
    : null;

  for (const imp of imports) {
    // 1. Check for submodule breach (starting with ../)
    if (imp.startsWith("../")) {
      if (boundaryAdapter) {
        boundaryImports.push(
          `Declared adapter "${boundaryAdapter}" imports "${imp}"`,
        );
        continue;
      }
      warnings.push(
        `Relative import "${imp}" reaches outside the package boundary (submodule/probe breach)`,
      );
      continue;
    }

    // 2. Check for coordinate gravity breach within flat src/ runtime organs.
    // Library helpers are load-bearing infrastructure, not independent organs;
    // importing x4010_hash.ts from a lower bucket should not look like a
    // topological breach.
    const fileName = imp.split("/").pop() ?? "";
    const m = fileName.match(/^x([0-9A-Fa-f]{4})_/);
    if (m && fileBucketInt !== null) {
      if (!(await isRuntimeOrganImport(relPath, imp))) continue;
      const importedHex = m[1];
      const importedBucketInt = parseInt(importedHex[0], 16);
      if (importedBucketInt > fileBucketInt) {
        warnings.push(
          `Relative import "${imp}" violates coordinate gravity law (imported bucket ${
            importedHex[0]
          } is higher than file bucket ${fileCoordinateHex![0]})`,
        );
      }
    }
  }

  return { warnings, boundaryImports };
}

async function inspectFile(
  absPath: string,
  relPath: string,
): Promise<FileReport> {
  const { bucket, bucketInt } = bucketOf(relPath);
  let text: string;
  try {
    text = await Deno.readTextFile(absPath);
  } catch {
    return {
      path: relPath,
      bucket,
      signature: null,
      raw: null,
      strongest_axes: [],
      strongest_axes_names: [],
      strongest_value: null,
      bucket_int: bucketInt,
      placement_policy: "axis",
      match: "no_dipole",
      note: "unreadable",
      is_dispatchable: false,
      boundary_adapter: null,
      boundary_imports: [],
      import_warnings: [],
    };
  }

  const relImports = getRelativeImports(text);
  const fileCoordHex = coordinateHexOf(relPath);
  const head = text.split("\n").slice(0, 30).join("\n");
  const boundaryAdapter = parseBoundaryAdapter(head);
  const { warnings: import_warnings, boundaryImports } =
    await auditRelativeImports(
      relPath,
      relImports,
      fileCoordHex,
      boundaryAdapter,
    );

  const { values, raw } = parseHexDipole(head);
  const policy = parsePlacementPolicy(head);
  // Dispatchable = has `import.meta.main` block (runtime entry point).
  // Libraries/utilities export symbols only and need no dipole by policy.
  const is_dispatchable = /\bimport\.meta\.main\b/.test(text);

  if (!raw) {
    // Per no_dipole policy (2026-05-18): libraries MAY omit dipole.
    // Distinguish honestly: dispatchable organs missing dipole = real gap;
    // libraries missing dipole = policy-OK.
    const note = is_dispatchable
      ? "DISPATCHABLE ORGAN missing hex_dipole — gap"
      : "library/utility (no import.meta.main) — no dipole by design (policy-OK)";
    return {
      path: relPath,
      bucket,
      signature: null,
      raw: null,
      strongest_axes: [],
      strongest_axes_names: [],
      strongest_value: null,
      bucket_int: bucketInt,
      placement_policy: policy,
      match: "no_dipole",
      note,
      is_dispatchable,
      boundary_adapter: boundaryAdapter,
      boundary_imports: boundaryImports,
      import_warnings,
    };
  }
  if (!values) {
    return {
      path: relPath,
      bucket,
      signature: null,
      raw,
      strongest_axes: [],
      strongest_axes_names: [],
      strongest_value: null,
      bucket_int: bucketInt,
      placement_policy: policy,
      match: "malformed",
      note: "could not parse 8 i8 bytes",
      is_dispatchable,
      boundary_adapter: boundaryAdapter,
      boundary_imports: boundaryImports,
      import_warnings,
    };
  }

  const allZero = values.every((v) => v === 0);
  if (allZero) {
    return {
      path: relPath,
      bucket,
      signature: values,
      raw,
      strongest_axes: [],
      strongest_axes_names: [],
      strongest_value: 0,
      bucket_int: bucketInt,
      placement_policy: policy,
      match: "no_dipole",
      note: "neutral signature (all zero)",
      is_dispatchable,
      boundary_adapter: boundaryAdapter,
      boundary_imports: boundaryImports,
      import_warnings,
    };
  }

  const { axes, mag } = strongestAxes(values);
  const axisNames = axes.map((a) => DIPOLE_AXES[a]);

  if (bucketInt === null) {
    return {
      path: relPath,
      bucket,
      signature: values,
      raw,
      strongest_axes: axes,
      strongest_axes_names: axisNames,
      strongest_value: mag,
      bucket_int: null,
      placement_policy: policy,
      match: "malformed",
      note: "bucket not a hex digit",
      is_dispatchable,
      boundary_adapter: boundaryAdapter,
      boundary_imports: boundaryImports,
      import_warnings,
    };
  }

  // Apply policy. Default "axis" preserves prior strict behavior.
  let m: FileReport["match"];
  let note: string;

  if (policy === "legacy") {
    m = "deferred";
    note = "legacy policy — placement known-imperfect, decision deferred";
  } else if (policy === "tier") {
    m = "match";
    note = `tier policy — bucket ${bucket} read as tier indicator, dipole free`;
  } else if (policy === "substrate_namespace") {
    const parts = pathComponents(relPath);
    const namespace = parts[0];
    const nativeAxis = parts[1] ?? bucketInt;
    const nativeAxisMod = nativeAxis % 8;
    if (namespace !== 9) {
      m = "mismatch";
      note =
        `substrate_namespace policy expects x9 namespace, found bucket ${bucket}`;
    } else if (axes.includes(nativeAxisMod)) {
      m = "match";
      note =
        `substrate namespace policy — x9 shadow preserves native axis ${nativeAxisMod}`;
    } else {
      m = "mismatch";
      note = `substrate namespace policy — strongest axes [${
        axes.join(",")
      }] do not include native axis ${nativeAxisMod}`;
    }
  } else if (policy === "composite") {
    const pathMod8 = pathComponents(relPath).map((p) => p % 8);
    const composite = axes.some((a) => pathMod8.includes(a));
    if (composite) {
      const matched = axes.find((a) => pathMod8.includes(a))!;
      m = "match";
      note = `composite policy — axis ${matched} matches path components [${
        pathMod8.join(",")
      }]`;
    } else {
      m = "mismatch";
      note = `composite policy — strongest axes [${
        axes.join(",")
      }] do not include any path component [${pathMod8.join(",")}]`;
    }
  } else {
    // axis policy (default)
    const bucketAxis = bucketInt % 8;
    const axisMatch = axes.includes(bucketAxis);
    const matchedValue = axisMatch ? values[bucketAxis] : null;
    const isNegativePole = bucketInt >= 8;
    const signOpposed = matchedValue !== null &&
      ((isNegativePole && matchedValue > 0) ||
        (!isNegativePole && matchedValue < 0));

    if (axisMatch && !signOpposed) {
      note = axes.length === 1
        ? `axis ${bucketAxis} matches bucket ${bucket}`
        : `axis ${bucketAxis} among tied strongest [${
          axes.join(",")
        }] matches bucket ${bucket}`;
      m = "match";
    } else if (axisMatch && signOpposed) {
      note =
        `axis ${bucketAxis} matches bucket ${bucket} via pair (sign-opposed pole)`;
      m = "match";
    } else {
      note = `axis policy — strongest axes [${
        axes.join(",")
      }] do not include bucket axis ${bucketAxis}`;
      m = "mismatch";
    }
  }

  return {
    path: relPath,
    bucket,
    signature: values,
    raw,
    strongest_axes: axes,
    strongest_axes_names: axisNames,
    strongest_value: mag,
    bucket_int: bucketInt,
    placement_policy: policy,
    match: m,
    note,
    is_dispatchable,
    boundary_adapter: boundaryAdapter,
    boundary_imports: boundaryImports,
    import_warnings,
  };
}

async function findOrphans(files: string[]): Promise<string[]> {
  const contents = new Map<string, string>();
  for (const rel of files) {
    try {
      contents.set(rel, await Deno.readTextFile(join(ROOT, rel)));
    } catch { /* ignore unreadable */ }
  }

  const registered = new Set<string>();
  try {
    const dispatchRunnerText = await Deno.readTextFile(
      join(ROOT, "src", "x0010_dispatch_runner.ts"),
    );
    const matches = dispatchRunnerText.matchAll(
      /"(x[0-9A-Fa-f]{4}_[^"]+\.ts)"/g,
    );
    for (const m of matches) {
      registered.add(`src/${m[1]}`);
    }
  } catch { /* ignore */ }

  // Also treat organs referenced by deno.jsonc task definitions as registered.
  // These run via `deno task <name>` rather than the t dispatcher, but they
  // are still anchored to a known entrypoint and should not show as orphans.
  try {
    const denoConfig = await Deno.readTextFile(join(ROOT, "deno.jsonc"));
    const matches = denoConfig.matchAll(
      /src\/(x[0-9A-Fa-f]{4}_[^"\s]+\.ts)/g,
    );
    for (const m of matches) {
      registered.add(`src/${m[1]}`);
    }
  } catch { /* ignore */ }

  // The `t` shim is the entrypoint script at repo root; it references
  // x0100_dispatch.ts and is itself referenced from the `t` symlink path.
  // Mark x0200_shim.sh as registered since it is the global shim definition.
  registered.add("src/x0200_shim.sh");

  const orphans: string[] = [];
  for (const rel of files) {
    const base = rel.split("/").pop() ?? "";
    if (
      base === "x0100_dispatch.ts" ||
      base === "x0010_dispatch_runner.ts" ||
      base === "x0011_glossary_parser.ts"
    ) {
      continue;
    }

    if (registered.has(rel)) {
      continue;
    }

    let referenced = false;
    for (const [otherRel, text] of contents.entries()) {
      if (otherRel === rel) continue;
      if (text.includes(base)) {
        referenced = true;
        break;
      }
    }

    if (!referenced) {
      orphans.push(rel);
    }
  }
  return orphans.sort();
}

async function auditSubstrateRegistry(
  root: string,
): Promise<RegistryWarning[]> {
  const warnings: RegistryWarning[] = [];
  const glossaryPath = join(root, "src", "x0001_glossary.ndjson");
  const text = await Deno.readTextFile(glossaryPath);

  for (const line of text.trim().split("\n")) {
    let record: Record<string, unknown>;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (record["00"] !== "6") continue;

    const handles = Array.isArray(record["02"]) ? record["02"] : [];
    const substrate = String(handles[0] ?? "");
    const position = String(record["03"] ?? "");
    const cwd = String(record["04"] ?? ".");
    const command = String(record["05"] ?? "");
    if (!command) continue;

    for (const token of command.split(/\s+/).filter(Boolean)) {
      if (token.startsWith("-")) continue;
      if (!/\.(ts|tsx|js|jsx|json|jsonc|toml|md)$/.test(token)) continue;
      if (/^[a-z]+:\/\//i.test(token)) continue;

      const expected = join(root, cwd, token);
      try {
        await Deno.stat(expected);
      } catch {
        warnings.push({
          substrate,
          position,
          cwd,
          command,
          token,
          expected_path: expected.replace(`${root}/`, ""),
          message: "type:06 command references a missing local file",
        });
      }
    }
  }

  return warnings;
}

function renderReport(
  reports: FileReport[],
  opts: { quiet: boolean; mismatchOnly: boolean },
  orphans: string[],
  registryWarnings: RegistryWarning[],
): void {
  const matches = reports.filter((r) => r.match === "match").length;
  const mismatches = reports.filter((r) => r.match === "mismatch").length;
  const deferred = reports.filter((r) => r.match === "deferred").length;
  const noDipole = reports.filter((r) => r.match === "no_dipole").length;
  const noDipoleOrganGap =
    reports.filter((r) => r.match === "no_dipole" && r.is_dispatchable).length;
  const noDipoleLibraryOk = noDipole - noDipoleOrganGap;
  const malformed = reports.filter((r) => r.match === "malformed").length;
  const totalImportWarnings = reports.reduce(
    (acc, r) => acc + r.import_warnings.length,
    0,
  );
  const totalBoundaryImports = reports.reduce(
    (acc, r) => acc + r.boundary_imports.length,
    0,
  );

  if (!opts.quiet) {
    console.log(
      "path".padEnd(22) +
        "bucket  strongest axes (mag)         policy     match",
    );
    console.log("-".repeat(86));
    for (const r of reports) {
      if (opts.mismatchOnly && r.match === "match") continue;
      const icon = r.match === "match"
        ? "✓"
        : r.match === "mismatch"
        ? "✗"
        : r.match === "deferred"
        ? "⊘"
        : "·";
      const strongest = r.strongest_axes.length > 0
        ? `[${r.strongest_axes.join(",")}] ${
          r.strongest_axes_names.join("/").slice(0, 18).padEnd(18)
        } ${(r.strongest_value ?? 0).toString().padStart(4)}`
        : "—".padEnd(28);
      console.log(
        `${r.path.padEnd(22)} ${r.bucket.padEnd(7)}${strongest}  ${
          r.placement_policy.padEnd(9)
        }  ${icon} ${r.match}`,
      );
      if (r.import_warnings.length > 0) {
        for (const w of r.import_warnings) {
          console.log(`    ⚠ [Import Law] ${w}`);
        }
      }
      if (r.boundary_imports.length > 0) {
        for (const b of r.boundary_imports) {
          console.log(`    ↔ [Boundary Adapter] ${b}`);
        }
      }
    }
    console.log("-".repeat(86));
  }

  console.log(
    `total: ${reports.length}  match: ${matches}  mismatch: ${mismatches}  deferred: ${deferred}  no_dipole: ${noDipole} (organ-gap: ${noDipoleOrganGap}, library-ok: ${noDipoleLibraryOk})  malformed: ${malformed}  import-warnings: ${totalImportWarnings}  boundary-imports: ${totalBoundaryImports}  registry-warnings: ${registryWarnings.length}`,
  );

  if (!opts.quiet && orphans.length > 0) {
    console.log("-".repeat(86));
    console.log(
      `# ⚠ ${orphans.length} orphan organs found (unreferenced and unregistered):`,
    );
    for (const o of orphans) {
      console.log(`#     ${o}`);
    }
  }

  if (!opts.quiet && registryWarnings.length > 0) {
    console.log("-".repeat(86));
    console.log(
      `# ⚠ ${registryWarnings.length} substrate registry command warning(s):`,
    );
    for (const w of registryWarnings) {
      console.log(
        `#     ${w.substrate} ${w.position}: ${w.token} → ${w.expected_path}`,
      );
    }
  }
}

async function checkCoordinateUniqueness(root: string): Promise<{
  duplicates: Record<string, string[]>;
  ok: boolean;
}> {
  const proc = new Deno.Command("git", {
    args: ["ls-files", "src/x*"],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await proc.output();
  if (code !== 0) {
    const errText = new TextDecoder().decode(stderr).trim();
    throw new Error(`git ls-files failed (code ${code}): ${errText}`);
  }
  const text = new TextDecoder().decode(stdout);
  const files = text.split("\n").map((f) => f.trim()).filter(Boolean);

  const coordMap: Record<string, string[]> = {};
  for (const file of files) {
    const name = file.split("/").pop() ?? "";
    if (isDynamicChordTopologyFile(name)) continue;
    const m = name.match(/^x([0-9A-Fa-f]{4})_/);
    if (m) {
      const coord = `x${m[1].toLowerCase()}`;
      if (!coordMap[coord]) {
        coordMap[coord] = [];
      }
      coordMap[coord].push(file);
    }
  }

  const duplicates: Record<string, string[]> = {};
  let ok = true;
  for (const [coord, paths] of Object.entries(coordMap)) {
    if (paths.length > 1) {
      duplicates[coord] = paths;
      ok = false;
    }
  }

  return { duplicates, ok };
}

async function main(): Promise<void> {
  const args = new Set(Deno.args);
  const quiet = args.has("--quiet");
  const mismatchOnly = args.has("--mismatch-only");
  const json = args.has("--json");

  const files = await scanHexFiles(ROOT);
  const reports: FileReport[] = [];
  for (const rel of files) {
    reports.push(await inspectFile(join(ROOT, rel), rel));
  }

  const orphans = await findOrphans(files);
  const uniqueness = await checkCoordinateUniqueness(ROOT);
  const registryWarnings = await auditSubstrateRegistry(ROOT);

  if (json) {
    console.log(JSON.stringify(
      {
        type: "audit",
        position: "6/C",
        action: "audit",
        total: reports.length,
        summary: {
          match: reports.filter((r) => r.match === "match").length,
          mismatch: reports.filter((r) => r.match === "mismatch").length,
          deferred: reports.filter((r) => r.match === "deferred").length,
          no_dipole: reports.filter((r) => r.match === "no_dipole").length,
          no_dipole_organ_gap: reports.filter((r) =>
            r.match === "no_dipole" && r.is_dispatchable
          ).length,
          no_dipole_library_ok: reports.filter((r) =>
            r.match === "no_dipole" && !r.is_dispatchable
          ).length,
          malformed: reports.filter((r) => r.match === "malformed").length,
          orphans_count: orphans.length,
          import_warnings_count: reports.reduce(
            (acc, r) => acc + r.import_warnings.length,
            0,
          ),
          boundary_imports_count: reports.reduce(
            (acc, r) => acc + r.boundary_imports.length,
            0,
          ),
          registry_warnings_count: registryWarnings.length,
        },
        coordinate_uniqueness: {
          ok: uniqueness.ok,
          duplicates: uniqueness.duplicates,
        },
        orphans,
        registry_warnings: registryWarnings,
        reports,
      },
      null,
      2,
    ));
  } else {
    renderReport(reports, { quiet, mismatchOnly }, orphans, registryWarnings);
    if (!quiet && !uniqueness.ok) {
      console.error("-".repeat(86));
      console.error(
        `# ✗ ${
          Object.keys(uniqueness.duplicates).length
        } coordinate conflicts found (duplicate xNNNN prefixes):`,
      );
      for (const [coord, paths] of Object.entries(uniqueness.duplicates)) {
        console.error(`#     ${coord}:`);
        for (const p of paths) {
          console.error(`#       - ${p}`);
        }
      }
    }
  }

  const mismatchCount = reports.filter((r) => r.match === "mismatch").length;
  const malformedCount = reports.filter((r) => r.match === "malformed").length;
  if (!uniqueness.ok) Deno.exit(2);
  if (malformedCount > 0) Deno.exit(2);
  if (mismatchCount > 0) Deno.exit(1);
  Deno.exit(0);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(`audit error: ${e.message}`);
    Deno.exit(2);
  });
}
