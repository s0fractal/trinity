import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractCodeBlocks } from "./x0150_literate_parser.ts";

Deno.test("extractCodeBlocks - extracts single ts execution block", () => {
  const md = `
# Title
Some description.

\`\`\`ts execution
export function test() {
  return "hello";
}
\`\`\`

Some intermediate text.
`;
  const code = extractCodeBlocks(md, "typescript");
  assertEquals(code.trim(), 'export function test() {\n  return "hello";\n}');
});

Deno.test("extractCodeBlocks - extracts multiple ts execution blocks and joins them", () => {
  const md = `
\`\`\`typescript execution
const a = 1;
\`\`\`

\`\`\`ts execution
const b = 2;
\`\`\`
`;
  const code = extractCodeBlocks(md, "ts");
  assertEquals(code.trim(), "const a = 1;\nconst b = 2;");
});

Deno.test("extractCodeBlocks - ignores non-execution blocks", () => {
  const md = `
\`\`\`ts
// descriptive only
const c = 3;
\`\`\`

\`\`\`ts execution
const d = 4;
\`\`\`
`;
  const code = extractCodeBlocks(md, "ts");
  assertEquals(code.trim(), "const d = 4;");
});

Deno.test("extractCodeBlocks - throws error if no block found", () => {
  const md = `
# Title
No blocks here.
`;
  assertThrows(
    () => extractCodeBlocks(md, "ts"),
    Error,
    "No execute-eligible code blocks found for language: ts",
  );
});
