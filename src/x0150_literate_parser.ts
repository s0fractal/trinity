// src/x0150_literate_parser.ts — Literate Programming parser
// position: 0/15 → foundation(0) — shared library for the 5/5x literate family
// maturity: active
// skill_safe: yes-readonly

/**
 * Extracts and concatenates all execution code blocks of a given language from a markdown string.
 * Supports typescript/ts synonyms.
 * Throws an error if no execution blocks are found.
 */
export function extractCodeBlocks(
  markdownText: string,
  language: string,
): string {
  const normalizedLang = language.toLowerCase();
  const langs = normalizedLang === "ts" || normalizedLang === "typescript"
    ? ["ts", "typescript"]
    : [normalizedLang];

  const blocks: string[] = [];
  const lines = markdownText.split(/\r?\n/);
  let insideBlock = false;
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match opening block, e.g. ```ts execution
    const match = line.match(/^```(\w+)\s+execution\s*$/);
    if (!insideBlock && match) {
      const lang = match[1].toLowerCase();
      if (langs.includes(lang)) {
        insideBlock = true;
        currentBlock = [];
      }
    } else if (insideBlock && line.trim() === "```") {
      insideBlock = false;
      blocks.push(currentBlock.join("\n"));
    } else if (insideBlock) {
      currentBlock.push(line);
    }
  }

  if (blocks.length === 0) {
    throw new Error(
      `No execute-eligible code blocks found for language: ${language}`,
    );
  }

  return blocks.join("\n");
}
