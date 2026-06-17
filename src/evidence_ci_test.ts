import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ciState, renderCi, repoFromRemote } from "./x7B00_evidence.ts";

const ADM = "a".repeat(40);
const OTHER = "b".repeat(40);

Deno.test("ciState - green only when the admitted commit is the one that ran successfully", () => {
  assertEquals(
    ciState(ADM, { conclusion: "success", status: "completed", head_sha: ADM }),
    "green",
  );
  // success but on a DIFFERENT commit → stale, not green (admitted unverified)
  assertEquals(
    ciState(ADM, {
      conclusion: "success",
      status: "completed",
      head_sha: OTHER,
    }),
    "stale",
  );
  // failure on the admitted commit → red
  assertEquals(
    ciState(ADM, { conclusion: "failure", status: "completed", head_sha: ADM }),
    "red",
  );
  // in-progress on the admitted commit → pending
  assertEquals(
    ciState(ADM, {
      conclusion: null,
      status: "in_progress",
      head_sha: ADM,
    }),
    "pending",
  );
  // no run / no admitted commit → unknown
  assertEquals(ciState(ADM, null), "unknown");
  assertEquals(
    ciState(null, {
      conclusion: "success",
      status: "completed",
      head_sha: ADM,
    }),
    "unknown",
  );
  // a failure on a different commit is stale (admitted commit is what we judge)
  assertEquals(
    ciState(ADM, {
      conclusion: "failure",
      status: "completed",
      head_sha: OTHER,
    }),
    "stale",
  );
});

Deno.test("repoFromRemote - parses ssh and https git remotes", () => {
  assertEquals(
    repoFromRemote("git@github.com:s0fractal/trinity.git"),
    "s0fractal/trinity",
  );
  assertEquals(
    repoFromRemote("https://github.com/s0fractal/liquid_architecture.git"),
    "s0fractal/liquid_architecture",
  );
  assertEquals(
    repoFromRemote("https://github.com/s0fractal/genesis"),
    "s0fractal/genesis",
  );
});

Deno.test("renderCi - labels overall state and flags stale admitted-commit mismatch", () => {
  const out = renderCi({
    source: "live",
    generated_at: "2026-06-17T13:20:03.000Z",
    substrates: [
      {
        substrate: "omega",
        repo: "s0fractal/genesis",
        admitted_commit: ADM,
        run: {
          id: 1,
          conclusion: "success",
          status: "completed",
          head_sha: OTHER,
          created_at: "2026-06-17T12:00:00.000Z",
          url: "x",
        },
        age_seconds: 600,
        state: "stale",
      },
    ],
    summary: {
      total: 1,
      by_state: { green: 0, red: 0, stale: 1, pending: 0, unknown: 0 },
      overall: "stale",
    },
  }).join("\n");
  assert(out.includes("stale"));
  // the stale line names both the run sha and the admitted sha
  assert(out.includes(OTHER.slice(0, 7)) && out.includes(ADM.slice(0, 7)));
});
