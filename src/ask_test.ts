import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { routeQuestion } from "./x2800_ask.ts";

Deno.test("routeQuestion - maps plain questions to the right read-only lens", () => {
  assertEquals(routeQuestion("is everything healthy?").intent, "health");
  assertEquals(routeQuestion("what changed recently?").intent, "recent");
  assertEquals(routeQuestion("what's happening lately").intent, "recent");
  assertEquals(
    routeQuestion("show me the shape of the network").intent,
    "overview",
  );
  assertEquals(
    routeQuestion("how was the effect court built?").intent,
    "lineage",
  );
  assertEquals(routeQuestion("who has been active?").intent, "voices");
  assertEquals(routeQuestion("what should I do next?").intent, "next");
});

Deno.test("routeQuestion - extracts a coordinate subject → resolve", () => {
  const r = routeQuestion("what is x6600?");
  assertEquals(r.intent, "show");
  assertEquals(r.cmd, ["resolve-fqdn", "x6600"]);
});

Deno.test("routeQuestion - free-text subject → search (stopwords stripped)", () => {
  const r = routeQuestion("tell me about coherence");
  assertEquals(r.intent, "search");
  assertEquals(r.cmd, ["resolve-fqdn", "search", "coherence"]);
});

Deno.test("routeQuestion - priority: 'network' reads as overview, not a search", () => {
  // "network" is an overview keyword and must win over generic subject search
  assertEquals(routeQuestion("what is the network").intent, "overview");
});

Deno.test("routeQuestion - empty / content-free question → help", () => {
  assertEquals(routeQuestion("").intent, "help");
  assertEquals(routeQuestion("what is this?").intent, "help"); // only stopwords
});
