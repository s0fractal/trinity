import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  buildIndex,
  type Candidate,
  isContentAddressed,
  isSkippedPath,
  kindOf,
  listNames,
  type Resolution,
  resolveFqdn,
  resolveFromIndex,
  showHeader,
} from "./x2F30_fqdn_resolver.ts";

// Build a throwaway federation of roots with known collisions.
async function fixture(): Promise<
  { roots: string[]; cleanup: () => Promise<void> }
> {
  const base = await Deno.makeTempDir({ prefix: "fqdn_resolver_" });
  const a = join(base, "rootA");
  const b = join(base, "rootB");
  await Deno.mkdir(join(a, "nested"), { recursive: true });
  await Deno.mkdir(b, { recursive: true });

  // mirrored: same name, identical bytes in both roots
  await Deno.writeTextFile(join(a, "mirror.myc.md"), "same bytes\n");
  await Deno.writeTextFile(join(b, "mirror.myc.md"), "same bytes\n");

  // conflict: same name, different bytes
  await Deno.writeTextFile(join(a, "conflict.myc.md"), "A version\n");
  await Deno.writeTextFile(join(b, "conflict.myc.md"), "B version\n");

  // unique: only in rootB, nested
  await Deno.writeTextFile(join(b, "only_here.ts"), "export const x = 1;\n");

  // handle: addressable WITH the coordinate prefix or WITHOUT it
  await Deno.writeTextFile(
    join(a, "x5510_myc_proxy.ts"),
    "export const p = 1;\n",
  );

  // exact-beats-handle: a bare `hash.ts` and a prefixed `x4010_hash.ts` both
  // answer the query "hash.ts" — the exact (bare) one must win.
  await Deno.writeTextFile(join(a, "hash.ts"), "bare\n");
  await Deno.writeTextFile(join(a, "x4010_hash.ts"), "prefixed\n");

  // chord slug: x<hex>_<block>_<voice>_<slug>.myc.md resolves by its slug
  await Deno.writeTextFile(
    join(a, "x4700_952699_claude-opus-4-8_my-proposal.myc.md"),
    "chord body\n",
  );

  return {
    roots: [a, b], // rootA has precedence
    cleanup: () => Deno.remove(base, { recursive: true }),
  };
}

Deno.test("resolveFqdn — mirrored: same name + same hash across roots = one identity", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("mirror.myc.md", roots);
    assertEquals(r.identity, "mirrored");
    assertEquals(r.candidates.length, 2);
    assertEquals(r.resolved?.rootIndex, 0); // precedence: rootA wins
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — conflict: same name + differing hash = real ambiguity, precedence resolves", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("conflict.myc.md", roots);
    assertEquals(r.identity, "conflict");
    assertEquals(r.candidates.length, 2);
    assertEquals(r.resolved?.rootIndex, 0);
    assert(
      r.candidates[0].hash !== r.candidates[1].hash,
      "conflict candidates must differ by hash",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — unique: single hit, found in a non-precedence nested root", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("only_here.ts", roots);
    assertEquals(r.identity, "unique");
    assertEquals(r.candidates.length, 1);
    assertEquals(r.resolved?.rootIndex, 1);
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — absent: nothing resolves, null winner", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("nowhere.myc.md", roots);
    assertEquals(r.identity, "absent");
    assertEquals(r.resolved, null);
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — handle: query without the xNNNN_ prefix resolves the prefixed file", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("myc_proxy.ts", roots);
    assertEquals(r.identity, "unique");
    assertEquals(r.resolved?.matchForm, "handle");
    assertEquals(r.resolved?.rel, "x5510_myc_proxy.ts");
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — handle: the exact full filename also resolves (with prefix)", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("x5510_myc_proxy.ts", roots);
    assertEquals(r.identity, "unique");
    assertEquals(r.resolved?.matchForm, "exact");
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — exact beats handle when both answer the same query", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("hash.ts", roots);
    // both `hash.ts` (exact) and `x4010_hash.ts` (handle) match in rootA
    assertEquals(r.candidates.length, 2);
    assertEquals(r.resolved?.matchForm, "exact");
    assertEquals(r.resolved?.rel, "hash.ts");
    assertEquals(r.identity, "conflict"); // different bytes
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — chord slug: resolve x<hex>_<block>_<voice>_<slug> by its slug", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("my-proposal.myc.md", roots);
    assertEquals(r.identity, "unique");
    assertEquals(r.resolved?.matchForm, "slug");
    assertEquals(
      r.resolved?.rel,
      "x4700_952699_claude-opus-4-8_my-proposal.myc.md",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — chord rule does not mis-fire on an organ handle", async () => {
  const { roots, cleanup } = await fixture();
  try {
    // "myc_proxy.ts" is an organ handle, not a chord slug — must stay matchForm=handle
    const r = await resolveFqdn("myc_proxy.ts", roots);
    assertEquals(r.resolved?.matchForm, "handle");
  } finally {
    await cleanup();
  }
});

Deno.test("resolveFqdn — missing root is skipped, not fatal (local-first)", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const r = await resolveFqdn("mirror.myc.md", [
      "/no/such/root",
      ...roots,
    ]);
    assertEquals(r.identity, "mirrored");
    assertEquals(r.candidates.length, 2);
  } finally {
    await cleanup();
  }
});

Deno.test("buildIndex — walk once, resolve many queries against the same index", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const index = await buildIndex(roots);
    assert(index.files > 0, "index should have walked files");
    const a = await resolveFromIndex(index, "only_here.ts");
    const b = await resolveFromIndex(index, "my-proposal.myc.md");
    const c = await resolveFromIndex(index, "nowhere.myc.md");
    assertEquals(a.identity, "unique");
    assertEquals(b.resolved?.matchForm, "slug");
    assertEquals(c.identity, "absent");
  } finally {
    await cleanup();
  }
});

Deno.test("buildIndex — a depth-bounded (cloud) root at lower precedence still resolves, and the bound excludes too-deep files", async () => {
  const { roots, cleanup } = await fixture();
  const cloud = await Deno.makeTempDir({ prefix: "fqdn_cloud_" });
  try {
    // a node living "outside the repo", shallow → resolvable
    await Deno.writeTextFile(join(cloud, "memory_note.md"), "lives in ~\n");
    // a too-deep node under the same root → excluded by maxDepth: 1
    await Deno.mkdir(join(cloud, "a", "b"), { recursive: true });
    await Deno.writeTextFile(join(cloud, "a", "b", "buried.md"), "too deep\n");

    const index = await buildIndex([...roots, { path: cloud, maxDepth: 1 }]);
    const found = await resolveFromIndex(index, "memory_note.md");
    assertEquals(found.identity, "unique");
    assert(
      found.resolved!.path.startsWith(cloud),
      "should resolve from cloud root",
    );

    const buried = await resolveFromIndex(index, "buried.md");
    assertEquals(buried.identity, "absent"); // beyond the depth bound
  } finally {
    await cleanup();
    await Deno.remove(cloud, { recursive: true });
  }
});

Deno.test("listNames — discovery: canonical names only, with roots and candidate counts", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const index = await buildIndex(roots);
    const { total, shown } = listNames(index);
    const byName = new Map(shown.map((e) => [e.name, e]));

    // mirrored + conflict each appear in BOTH roots → candidates 2.
    assertEquals(byName.get("mirror.myc.md")?.candidates, 2);
    assertEquals(byName.get("mirror.myc.md")?.roots.length, 2);
    assertEquals(byName.get("conflict.myc.md")?.candidates, 2);
    // unique appears once.
    assertEquals(byName.get("only_here.ts")?.candidates, 1);
    // The prefixed organ is a canonical name; its bare handle "myc_proxy.ts"
    // is an ALIAS, not a canonical name, so it must NOT appear in the list.
    assert(byName.has("x5510_myc_proxy.ts"));
    assert(!byName.has("myc_proxy.ts"));
    // The chord slug "my-proposal" is an alias too — not listed; the full
    // filename is.
    assert(!byName.has("my-proposal"));
    assert(byName.has("x4700_952699_claude-opus-4-8_my-proposal.myc.md"));
    // total counts canonical names, not alias keys.
    assert(total >= 6);
  } finally {
    await cleanup();
  }
});

Deno.test("listNames — substring filter and bounded truncation are honest", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const index = await buildIndex(roots);
    const filtered = listNames(index, { substring: "mirror" });
    assertEquals(filtered.shown.every((e) => e.name.includes("mirror")), true);
    assertEquals(filtered.shown.length, 1);
    assertEquals(filtered.truncated, 0);

    // A tight limit must report the dropped remainder, never silently cap.
    const capped = listNames(index, { limit: 2 });
    assertEquals(capped.shown.length, 2);
    assert(capped.truncated > 0);
    assertEquals(capped.total, capped.shown.length + capped.truncated);
  } finally {
    await cleanup();
  }
});

Deno.test("kindOf — names classify into function / knowledge / record by name alone", () => {
  assertEquals(kindOf("x2F30_fqdn_resolver.ts"), "organ");
  assertEquals(kindOf("fqdn_resolver_test.ts"), "test");
  assertEquals(
    kindOf("x7700_953515_claude-opus-4-8_my-receipt.myc.md"),
    "chord",
  );
  assertEquals(kindOf("x8D00_roadmap.myc.md"), "doc"); // generated doc, not a chord
  assertEquals(kindOf("README.md"), "doc");
  assertEquals(kindOf("canon-vectors.json"), "data");
  assertEquals(kindOf("x0200_shim.sh"), "script");
  assertEquals(kindOf("lib.rs"), "rust");
  assertEquals(kindOf("image.png"), "other");
});

Deno.test("listNames — kind filter and by_kind breakdown", async () => {
  const { roots, cleanup } = await fixture();
  try {
    const index = await buildIndex(roots);
    const all = listNames(index);
    // by_kind sums to total.
    const sum = Object.values(all.by_kind).reduce((a, b) => a + b, 0);
    assertEquals(sum, all.total);

    // --kind=organ returns only .ts organs (only_here.ts, x5510_myc_proxy.ts,
    // hash.ts, x4010_hash.ts) — the chord and doc names are excluded.
    const organs = listNames(index, { kind: "organ" });
    assertEquals(organs.shown.every((e) => e.kind === "organ"), true);
    assertEquals(organs.shown.some((e) => e.name === "only_here.ts"), true);
    assertEquals(
      organs.shown.some((e) =>
        e.name === "x4700_952699_claude-opus-4-8_my-proposal.myc.md"
      ),
      false,
    );

    // --kind=chord returns the chord-named .myc.md only.
    const chords = listNames(index, { kind: "chord" });
    assertEquals(chords.shown.length, 1);
    assertEquals(
      chords.shown[0].name,
      "x4700_952699_claude-opus-4-8_my-proposal.myc.md",
    );
  } finally {
    await cleanup();
  }
});

// --- showHeader: the provenance header for `resolve --show` ---

function cand(rel: string, root: string, hash: string): Candidate {
  return {
    root,
    rootIndex: 0,
    path: `${root}/${rel}`,
    rel,
    depth: 1,
    size: 42,
    hash,
    matchForm: "exact",
  };
}

Deno.test("showHeader - absent resolution yields no header", () => {
  const res: Resolution = {
    fqdn: "ghost",
    resolved: null,
    identity: "absent",
    candidates: [],
  };
  assertEquals(showHeader(res), []);
});

Deno.test("showHeader - unique surfaces path, hash, identity; no conflict noise", () => {
  const c = cand("x.ts", "/r/src", "abc123");
  const res: Resolution = {
    fqdn: "x.ts",
    resolved: c,
    identity: "unique",
    candidates: [c],
  };
  const h = showHeader(res).join("\n");
  assertStringIncludes(h, "identity=unique");
  assertStringIncludes(h, "blake3:abc123");
  assertEquals(h.includes("CONFLICT"), false);
  assertEquals(h.includes("mirrored:"), false);
});

Deno.test("showHeader - conflict warns and lists the other differing candidates", () => {
  const winner = cand("README.md", "/r/a", "aaaa1111bbbb");
  const other = cand("README.md", "/r/b", "cccc2222dddd");
  const res: Resolution = {
    fqdn: "README.md",
    resolved: winner,
    identity: "conflict",
    candidates: [winner, other],
  };
  const h = showHeader(res).join("\n");
  assertStringIncludes(h, "CONFLICT: 2 files");
  // the OTHER candidate is listed (winner is shown as content, not re-listed)
  assertStringIncludes(h, "@ /r/b  blake3:cccc2222dddd");
  assertEquals(h.includes("blake3:aaaa1111bbbb\n#   -"), false);
});

Deno.test("showHeader - mirrored notes identical copies, no conflict warning", () => {
  const a = cand("d.myc.md", "/r/a", "same");
  const b = cand("d.myc.md", "/r/b", "same");
  const res: Resolution = {
    fqdn: "d.myc.md",
    resolved: a,
    identity: "mirrored",
    candidates: [a, b],
  };
  const h = showHeader(res).join("\n");
  assertStringIncludes(h, "mirrored: 2 identical copies");
  assertEquals(h.includes("CONFLICT"), false);
});

Deno.test("isContentAddressed - h.<hex>. names are content-addressed; others are not", () => {
  assert(
    isContentAddressed("h.849874aa8a18.myc-fqdn-naming-policy.function.myc.md"),
  );
  assert(isContentAddressed("public/functions/h.abc123.foo.myc.md"));
  assertEquals(isContentAddressed("x2F30_fqdn_resolver.ts"), false);
  assertEquals(isContentAddressed("README.md"), false);
  assertEquals(isContentAddressed("h.ts"), false); // no hex segment after h.
});

Deno.test("showHeader - content-addressed name carries the federation-hash caveat", () => {
  const c = cand("h.abc123.foo.myc.md", "/r/myc", "blakehex");
  const res: Resolution = {
    fqdn: "h.abc123.foo.myc.md",
    resolved: c,
    identity: "unique",
    candidates: [c],
  };
  const h = showHeader(res).join("\n");
  assertStringIncludes(h, "content-addressed");
  assertStringIncludes(h, "federation-identity hash");
});

Deno.test("isSkippedPath - excludes build/dep dirs, keeps content (FQDN namespace hygiene)", () => {
  // Build/dependency output that pollutes the namespace is skipped.
  assert(isSkippedPath("omega/omega_zk_host/target/release/foo.o"));
  assert(isSkippedPath("target/x.rlib"));
  assert(isSkippedPath("x/node_modules/pkg/index.js"));
  assert(isSkippedPath("a/.git/config"));
  // Real content is kept — `target` only matches as a path component.
  assert(!isSkippedPath("src/x2F30_fqdn_resolver.ts"));
  assert(!isSkippedPath("docs/target.md"));
  assert(!isSkippedPath("src/targeting.ts"));
});
