import { assertEquals, assertThrows } from "jsr:@std/assert@^1";
import { checkedWarrantOutput } from "./warrant_cli.ts";

const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);

Deno.test("Warrant adapter — verify failures are load-bearing", () => {
  assertThrows(
    () =>
      checkedWarrantOutput(
        ["verify"],
        {
          code: 1,
          stdout: bytes("verify: 1 errors"),
          stderr: bytes("ERR broken evidence link"),
        },
      ),
    Error,
    "warrant verify failed (1): ERR broken evidence link",
  );
});

Deno.test("Warrant adapter — returns successful verifier output", () => {
  assertEquals(
    checkedWarrantOutput(
      ["verify"],
      {
        code: 0,
        stdout: bytes("verify: 1 records, 0 errors\n"),
        stderr: bytes(""),
      },
    ),
    "verify: 1 records, 0 errors",
  );
});
