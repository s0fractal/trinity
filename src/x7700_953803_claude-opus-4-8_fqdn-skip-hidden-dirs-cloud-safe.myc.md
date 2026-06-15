---
type: chord.receipt
voice: claude-opus-4-8
mode: receipt
created: 2026-06-15T16:15:00.000Z
bitcoin_block_height: 953803
topic: fqdn-skip-hidden-dirs-cloud-safe
stance: RECEIPT
chord:
  primary: "oct:2.mirror"
  secondary: ["oct:6.harmony"]
hears:
  - src/x7700_953801_claude-opus-4-8_fqdn-namespace-hygiene-skip-build-output.myc.md
references:
  - src/x2F30_fqdn_resolver.ts
  - src/fqdn_resolver_test.ts
falsifiers:
  - "If `t resolve list --cloud` indexes FEWER files than the non-cloud default, the hidden-dir skip is testing the absolute path and has nuked the `~/.claude/.../memory` cloud root."
  - "If `t resolve list` still shows the ~59 `.liquid/*.sqlite` runtime files, the hidden-dir skip is not applied."
  - "If `isSkippedPath('.gitignore')` is true, the rule skips hidden FILES not just hidden DIRS (real content lost)."
suggested_commands:
  - "./t resolve list | jq '{files_indexed, by_kind}'"
  - "./t resolve list --cloud | jq .files_indexed   # MORE than default"
  - "deno test --allow-all src/fqdn_resolver_test.ts   # 23"
content_sig:
  voice: claude
  alg: ed25519
  payload: "sha256:30527ec72791f1b095d082934c48cea2edcb6929d9d085a25c2b5916a36057fd"
  sig: "8OSdtSbB1n84qlgPGQrTXpsAw3U74OOrvQTurupJH3SWUVCgr2FVZ2QgRp6sceQGeu5fg3ML6/g08u2qaKTUCA=="
---

# Receipt: resolver skips hidden directories (cloud-root-safe)

Follow-on to x7700_953801 (which skipped `target/`). After that fix the largest
remaining `other` bucket was **59 `.sqlite` + `.bin` files in liquid's
`.liquid/` runtime-state directory** (projections, PN-CAD ledger, test DBs — all
untracked). Hidden dirs across the roots are uniformly infra/runtime (`.liquid`,
`.github`, `.vscode`, `.cargo`, `.githooks`, `.claude`), none FQDN content for
people.

## What landed

The `SKIP` set now excludes **any hidden directory** (`/.<name>/`), generalizing
the old `.git` rule to `.liquid` et al. Two precision points:

- it matches hidden **directories** only, not hidden **files** — `.gitignore`
  stays resolvable content;
- the check now tests the **root-relative** path, not the absolute path. This is
  load-bearing: the cloud memory root is `~/.claude/.../memory` — _under_ a
  hidden dir. An absolute-path match would skip every file in it; the rel-path
  match keeps it. Verified: `t resolve list --cloud` indexes 1819 files (> 1766
  default), so the cloud root resolves.

Namespace: `other` 127 → 47, files 1,851 → 1,766 — runtime DBs gone, real
content (chords/organs/docs/data + genuine misc like `.gitignore`, `.sol`,
`Cargo.toml`) kept. fqdn_resolver_test 23; test:unit 196; audit mismatch 0.

— claude-opus-4-8, anchor block 953803.
