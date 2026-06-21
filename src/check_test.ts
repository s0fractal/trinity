import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  auditGateResult,
  firstJson,
  glossaryPositions,
  routeReport,
} from "./x6F00_check.ts";

Deno.test("firstJson - extracts the first JSON object after a dispatch header line", () => {
  // dispatch prints a `# verb → pos` header before the JSON payload
  const out = "# audit → 6/C\n" + '{"summary":{"mismatch":0}}\n';
  assertEquals(firstJson(out), { summary: { mismatch: 0 } });
});

Deno.test("firstJson - handles arrays, leading noise, and absent JSON", () => {
  assertEquals(firstJson("noise\nmore\n[1, 2, 3]"), [1, 2, 3]);
  assertEquals(firstJson("no json here at all"), null);
  assertEquals(firstJson(""), null);
  // malformed JSON after the marker → null, not a throw
  assertEquals(firstJson("# x\n{ not valid"), null);
});

Deno.test("audit gate mirrors CI coordinate-uniqueness and registry invariants", () => {
  const healthy = {
    summary: {
      match: 1,
      mismatch: 0,
      malformed: 0,
      import_warnings_count: 0,
      orphans_count: 0,
      no_dipole_organ_gap: 0,
      registry_warnings_count: 0,
    },
    coordinate_uniqueness: { ok: true },
  };
  assertEquals(auditGateResult(healthy).ok, true);
  assertEquals(
    auditGateResult({ ...healthy, coordinate_uniqueness: { ok: false } }).ok,
    false,
  );
  assertEquals(
    auditGateResult({
      ...healthy,
      summary: { ...healthy.summary, registry_warnings_count: 1 },
    }).ok,
    false,
  );
});

Deno.test("glossaryPositions - reads kind:5 field 04 and kind:6 field 03, dedups, skips junk", () => {
  const ndjson = [
    '{"00":"5","02":["check"],"04":"6/F"}',
    '{"00":"6","02":["trinity"],"03":"5/C"}',
    '{"00":"6","02":["omega"],"03":"5/C"}', // dup position
    '{"00":"03","01":"0"}', // a type record, no position
    '{"00":"5","02":["x"]}', // kind 5 with no 04 → skipped
    "not json at all",
    "",
  ].join("\n");
  const got = glossaryPositions(ndjson).sort();
  assertEquals(got, ["5/C", "6/F"]);
});

Deno.test("routeReport - flags unrouted glossary positions and dangling routes", async () => {
  // a glossary word pointing at a position with no route → unrouted footgun
  const ndjson = '{"00":"5","02":["ghost"],"04":"Z/Z"}';
  // existsFn says everything exists → no dangling from the real route table
  const allExist = (_p: string) => Promise.resolve(true);
  const r = await routeReport(ndjson, allExist, "/src");
  assert(r.unrouted.includes("Z/Z"));
  assertEquals(r.dangling, []);
  assert(r.routes > 0);

  // existsFn says nothing exists → every real route is dangling
  const noneExist = (_p: string) => Promise.resolve(false);
  const r2 = await routeReport("", noneExist, "/src");
  assertEquals(r2.dangling.length, r2.routes);
  assertEquals(r2.unrouted, []);
});
