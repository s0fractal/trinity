---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-07T23:14:25.345Z
bitcoin_block_height: 952776
topic: literate-programming-fqdn-proxy-implementation
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: ["oct:4.foundation", "oct:5.action"]
closes:
  path_hint: probes/fqdn-resolver-v0
  relation: implements
hears:
  - "architect: вирішуй все сам. я довіряю моделям. якщо все зруйнується — заново напишем"
  - "architect: FQDN закроет основную проблему — файл откроется на любом устройстве даже без нашего приложения"
  - "dialog: Literate Programming + FQDN imports inside .myc.md files allows running code from documentation"
references:
  - src/x0150_literate_parser.ts
  - src/literate_parser_test.ts
  - src/x5510_myc_proxy.ts
  - src/myc_proxy_test.ts
  - src/x5520_run_literate.ts
  - src/x0001_glossary.ndjson
  - src/x0010_dispatch_runner.ts
suggested_commands:
  - "deno test --allow-all src/literate_parser_test.ts src/myc_proxy_test.ts"
  - "./t audit"
  - "./t proxy"
expected_after_running:
  tests_green: true
  audit_green: true
---

# Receipt: literate programming fqdn proxy implementation

We have fully implemented, integrated, and verified the Literate Programming code extraction engine and the HTTP/TCP proxy server for virtual `myc.md` FQDN resolution. This aligns with the "local-first resolver" conceptual direction, enabling the Deno runtime to import modules directly from Markdown documents.

## What landed

1. **Parser (`src/x0150_literate_parser.ts`):** Parses markdown content and extracts ` ```ts execution ` blocks. Synonyms like `ts` and `typescript` are automatically normalized.
2. **HTTP/TCP Proxy (`src/x5510_myc_proxy.ts`):** Establishes an HTTP/TCP proxy on port `8787` (designed to be used with `HTTP_PROXY`).
   - If the request targets host `myc.md`, it locates the corresponding local file via direct pathing or `resolveFqdn` (`myc/src/x0100_myc.ts`), extracts the TypeScript execution blocks, and returns the raw TS content.
   - For all other hosts (e.g. `jsr.io`, `esm.sh`), the proxy transparently tunnels raw TCP traffic (supporting both HTTP and HTTPS/CONNECT requests), preserving Deno's third-party dependency loading mechanism.
3. **Runner (`src/x5520_run_literate.ts`):** Provides the `t run-literate` command line interface to execute markdown modules natively by generating and cleaning up temporary TS scripts.
4. **Integration and Tests:** Unit tests in `src/literate_parser_test.ts` and integration tests in `src/myc_proxy_test.ts` verify parser and network intercept flows.
5. **Glossary Registration:** Commands registered as `5/51` and `5/52` in the glossary and dispatch runner. All briefs and ledger indexes were regenerated.

## Falsifiers

- If `deno test src/literate_parser_test.ts` fails, code block extraction logic is broken.
- If `deno test src/myc_proxy_test.ts` fails, FQDN resolution or transparent TCP proxy tunneling is broken.
- If `./t audit` registers any warnings or unregistered coordinate files, the linter boundary is violated.

— antigravity, anchor block 952776.
