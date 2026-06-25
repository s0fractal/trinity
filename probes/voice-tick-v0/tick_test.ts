import { assert, assertEquals } from "jsr:@std/assert@^1";
import { brief } from "./tick.ts";

Deno.test("tick brief — read-only, returns the inputs a voice needs to propose", async () => {
  const b = await brief("claude");
  assertEquals(b.voice, "claude");
  assert(typeof b.last_tick_block === "number");
  assert(Array.isArray(b.observed_recent), "observed_recent is a list");
  assert(Array.isArray(b.open_gaps), "open_gaps is a list");
  assert(typeof b.swarm_action_density === "string");
});
