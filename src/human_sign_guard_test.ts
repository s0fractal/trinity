import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isHumanVoice, signChordContent } from "./x2F37_voice_keys.ts";

// A key on disk is not permission to act as the human. An agent (or `init`) must
// never auto-sign as a HUMAN principal (x2F39 class=human); only a deliberate
// `chord sign --human` may. Closes the footgun where init auto-signed any voice
// whose key happened to be present.
Deno.test("human-sign guard — the architect's voice is classified human, models are not", () => {
  assertEquals(isHumanVoice("s0fractal"), true);
  assertEquals(isHumanVoice("claude"), false);
  assertEquals(isHumanVoice("codex"), false);
});

Deno.test("human-sign guard — auto-signing as a human principal is refused (returns null)", async () => {
  // refused BEFORE any key read, so this holds even with no key on disk (CI).
  const refused = await signChordContent(
    "s0fractal",
    "x.myc.md",
    "body",
    false,
  );
  assert(
    refused === null,
    "signing as the human principal without --human must be refused",
  );
});
