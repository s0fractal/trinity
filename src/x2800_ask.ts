#!/usr/bin/env -S deno run -A
// src/x2800_ask.ts — ask the substrate a plain question; it routes to the right
// lens and answers (so you don't have to know ~80 verbs).
// position: 2/8 → mirror(2) × infinity(8) = reflect the whole substrate back in
//   answer to a question
// hex_dipole: "33 00 59 00 00 00 00 33"
//   mirror_apex+0.70 (PRIMARY: reflects substrate state back as an answer; bucket
//   2 MATCH on axis 2)
//   void_infinity+0.40 (reaches across the whole substrate), completion_frontier
//   +0.40 (returns a finished answer)
// placement_policy: axis
// maturity: active
// horizon: deterministic intent router; an LLM-backed `--smart` mode could parse
//   arbitrary questions, but that needs a model call (a voice) — out of scope here
// skill_tag: ask
// skill_safe: yes-readonly
//   routes to READ-ONLY lenses only (status/recent/atlas/lineage/self-portrait/
//   self/search) — never a generator or a write.
//
// intent: the architect said "I don't know how to use it." In a live session you
//   ask a voice; alone in the terminal you must know which verb. `t ask` closes
//   that gap for the substrate's strongest use — verifiable recall of its own
//   state — by mapping a plain question to the right existing lens, running it,
//   and SHOWING the verb it used (so it teaches the vocabulary as you go).
//
// Usage:
//   t ask "what changed recently?"
//   t ask "how was the effect court built?"
//   t ask "what is x6600?"
//   t ask            (no question → list the kinds of things you can ask)

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

const HERE = dirname(fromFileUrl(import.meta.url));
const DISPATCH = join(HERE, "x0100_dispatch.ts");

export interface Route {
  intent: string;
  cmd: string[]; // args passed to the dispatcher
  why: string; // human label: what this answers
}

const STOPWORDS = new Set([
  "what",
  "whats",
  "what's",
  "is",
  "are",
  "the",
  "a",
  "an",
  "show",
  "me",
  "find",
  "about",
  "explain",
  "tell",
  "of",
  "do",
  "does",
  "this",
  "that",
  "please",
  "give",
  "list",
  "see",
  "look",
  "up",
  "for",
  "on",
  "in",
]);

const has = (q: string, ...words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`, "i").test(q));

/** Map a plain question to a read-only lens. Pure; exported for the test. The
 *  order is priority — earlier intents win, so "what is the network" reads as the
 *  overview, not a search for the word "network". A `help` route is the fallback. */
export function routeQuestion(raw: string): Route {
  const q = raw.trim().toLowerCase();
  if (!q) return { intent: "help", cmd: [], why: "what you can ask" };

  // 1. health / state
  if (
    has(
      q,
      "health",
      "healthy",
      "ok\\b",
      "broken",
      "green",
      "working",
      "stable",
      "wrong",
      "alright",
      "status",
    )
  ) {
    return {
      intent: "health",
      cmd: ["self"],
      why: "the substrate's health + what needs attention",
    };
  }
  // 2. recent activity
  if (
    has(
      q,
      "recent",
      "chang",
      "latest",
      "lately",
      "new\\b",
      "today",
      "week",
      "happening",
      "happened",
    )
  ) {
    return {
      intent: "recent",
      cmd: ["resolve-fqdn", "recent", "--pretty"],
      why: "the most recent activity",
    };
  }
  // 3. shape / overview
  if (
    has(
      q,
      "overview",
      "shape",
      "map",
      "atlas",
      "big picture",
      "structure",
      "how many",
      "count",
      "stats",
      "network",
    )
  ) {
    return {
      intent: "overview",
      cmd: ["resolve-fqdn", "atlas"],
      why: "the network's shape (counts, substrates, hubs)",
    };
  }
  // 4. becoming / history
  if (
    has(
      q,
      "lineage",
      "history",
      "became",
      "built",
      "build",
      "evolv",
      "grew",
      "grow",
      "came to be",
      "arc",
      "how did",
    )
  ) {
    return {
      intent: "lineage",
      cmd: ["resolve-fqdn", "lineage"],
      why: "how the network was built (the development arcs)",
    };
  }
  // 5. who / voices
  if (
    has(
      q,
      "who",
      "voices",
      "voice",
      "authored",
      "active",
      "contributor",
      "models",
    )
  ) {
    return {
      intent: "voices",
      cmd: ["self-portrait"],
      why: "the voices and their standing",
    };
  }
  // 6. next / open / priorities
  if (
    has(
      q,
      "next",
      "should",
      "todo",
      "open\\b",
      "frontier",
      "priorit",
      "work on",
      "do now",
      "what now",
    )
  ) {
    return {
      intent: "next",
      cmd: ["self"],
      why:
        "current state + next actions (see `t roadmap` for the full frontier)",
    };
  }
  // 7. a specific subject → resolve/search
  const subject = q
    .replace(/[?!.]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim();
  const coord = subject.match(/x[0-9a-f]{2,4}\w*/i)?.[0];
  if (coord) {
    return {
      intent: "show",
      cmd: ["resolve-fqdn", coord],
      why: `resolve "${coord}"`,
    };
  }
  if (subject) {
    return {
      intent: "search",
      cmd: ["resolve-fqdn", "search", subject],
      why: `search for "${subject}"`,
    };
  }
  return { intent: "help", cmd: [], why: "what you can ask" };
}

const EXAMPLES = [
  ["is everything healthy?", "→ t self"],
  ["what changed recently?", "→ t resolve-fqdn recent"],
  ["what's the shape of the network?", "→ t resolve-fqdn atlas"],
  ["how was it built?", "→ t resolve-fqdn lineage"],
  ["who has been active?", "→ t self-portrait"],
  ["what should I do next?", "→ t self / t roadmap"],
  ["what is x6600?", "→ t resolve-fqdn x6600"],
  ['find "coherence"', "→ t resolve-fqdn search coherence"],
];

function renderHelp(): string {
  const L = [
    "# ask @ 2/8 — ask the substrate a plain question, it routes to the right lens",
    "#",
    "# try:",
  ];
  for (const [q, c] of EXAMPLES) L.push(`#   t ask "${q}"   ${c}`);
  return L.join("\n");
}

async function run(cmd: string[]): Promise<string> {
  const p = new Deno.Command("deno", {
    args: ["run", "-A", DISPATCH, ...cmd],
    stdout: "piped",
    stderr: "piped",
  });
  const o = await p.output();
  return new TextDecoder().decode(o.stdout) +
    new TextDecoder().decode(o.stderr);
}

if (import.meta.main) {
  const args = Deno.args.filter((a) => a !== "--json");
  const wantJson = Deno.args.includes("--json");
  const question = args.join(" ").trim();
  const route = routeQuestion(question);

  if (route.intent === "help") {
    if (wantJson) {
      console.log(JSON.stringify(
        { type: "ask", intent: "help", examples: EXAMPLES },
        null,
        2,
      ));
    } else {
      console.log(renderHelp());
    }
    Deno.exit(0);
  }

  const verb = `t ${route.cmd.join(" ")}`;
  if (wantJson) {
    const answer = await run(route.cmd);
    console.log(JSON.stringify(
      {
        type: "ask",
        question,
        intent: route.intent,
        ran: verb,
        why: route.why,
        answer,
      },
      null,
      2,
    ));
  } else {
    console.log(`# ask: "${question}"`);
    console.log(`# → ${route.why}  (using \`${verb}\`)`);
    console.log("# ─────────────────────────────────────────────");
    console.log((await run(route.cmd)).trimEnd());
  }
}
