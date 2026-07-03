// paper/repro/lib_chords.ts — shared chord-ledger loader for the paper's repro scripts.
// Deliberately independent of trinity's own tooling (src/x*): a second, small
// implementation a reviewer can read in one sitting. Deterministic: same tree ⇒ same output.

export interface Chord {
  stem: string; // filename without .myc.md
  file: string; // path relative to repo root
  voice: string; // frontmatter voice/author/speaker, else filename slug
  voiceSlug: string; // third underscore field of the filename (generation string)
  type: string;
  mode: string;
  blockKey: string; // second underscore field: bitcoin block height or t<timestamp>
  hears: string[];
  signed: boolean; // content_sig block present
  hasFalsifier: boolean; // "## Falsifier"/"## Falsifiers" heading or falsifiers: frontmatter
  isCorrection: boolean; // CORRECTION marker in title/body or correction in stem
}

const CHORD_FILE = /^x[0-9a-fA-F]{4}_.+_.+\.myc\.md$/;

function parseFrontmatter(text: string): Record<string, string | string[]> {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out: Record<string, string | string[]> = {};
  if (!m) return out;
  const lines = m[1].split("\n");
  let listKey: string | null = null;
  for (const raw of lines) {
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    if (listKey && line.startsWith("- ")) {
      (out[listKey] as string[]).push(
        line.slice(2).replace(/^["']|["']$/g, ""),
      );
      continue;
    }
    if (indent > 0) continue; // nested blocks (chord:, content_sig:) handled by presence keys below
    listKey = null;
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest === "" || rest === "[]") {
      if (rest === "[]") out[key] = [];
      else {
        out[key] = [];
        listKey = key;
      }
    } else if (rest.startsWith("[")) {
      out[key] = rest
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      out[key] = rest.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

/** Schema-aligned identification (contracts/schema/chord.schema.json anyOf):
 *  chord octant claim | type chord.* + voice/author | mode + voice/author | legacy id + speaker. */
function isChord(fm: Record<string, string | string[]>, text: string): boolean {
  const has = (k: string) => fm[k] !== undefined && fm[k] !== "";
  const voiceish = has("voice") || has("author") || has("speaker");
  if (/^\s*chord:\s*$/m.test(text.split("\n---")[0])) return voiceish || true;
  if (typeof fm.type === "string" && fm.type.startsWith("chord.") && voiceish) {
    return true;
  }
  if (has("mode") && voiceish) return true;
  if (has("id") && has("speaker")) return true;
  return false;
}

export async function loadLedger(repoRoot: string): Promise<Chord[]> {
  const chords: Chord[] = [];
  const srcDir = `${repoRoot}/src`;
  const names: string[] = [];
  for await (const e of Deno.readDir(srcDir)) {
    if (e.isFile && CHORD_FILE.test(e.name)) names.push(e.name);
  }
  names.sort();
  for (const name of names) {
    const file = `src/${name}`;
    const text = await Deno.readTextFile(`${repoRoot}/${file}`);
    const fm = parseFrontmatter(text);
    if (!isChord(fm, text)) continue;
    const stem = name.replace(/\.myc\.md$/, "");
    const parts = stem.split("_");
    const voiceSlug = parts.length >= 3 ? parts[2] : "unknown";
    const fmBlock = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    chords.push({
      stem,
      file,
      voice: String(fm.voice ?? fm.author ?? fm.speaker ?? voiceSlug),
      voiceSlug,
      type: String(fm.type ?? ""),
      mode: String(fm.mode ?? ""),
      blockKey: parts[1] ?? "",
      hears: Array.isArray(fm.hears) ? fm.hears.map(normStem) : [],
      signed: /^\s*content_sig:\s*$/m.test(fmBlock),
      hasFalsifier: /^##\s*Falsifiers?\b/m.test(text) ||
        fm.falsifiers !== undefined,
      isCorrection: /correction/i.test(stem) || /\bCORRECTION\b/.test(text),
    });
  }
  return chords;
}

export function normStem(ref: string): string {
  return ref
    .split("/")
    .pop()!
    .replace(/\.myc\.md$/, "")
    .trim();
}

export async function gitHead(repoRoot: string): Promise<string> {
  const cmd = new Deno.Command("git", {
    args: ["-C", repoRoot, "rev-parse", "HEAD"],
  });
  const out = await cmd.output();
  return new TextDecoder().decode(out.stdout).trim();
}
