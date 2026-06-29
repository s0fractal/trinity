# Keeping a node fresh (periodic validated sync)

A mesh node should serve current chords and run current code — but a `git pull`
that brings broken code is worse than a stale one. So syncing is fetch +
**validity gate**, not just fetch.

Two pieces, both already wired by `install.sh`:

- **`node-sync.sh`** — fetches + fast-forwards the canonical clone
  (`${TRINITY_HOME:-~/trinity}`) and its submodules. Never clobbers local work
  (skips a dirty tree), never force-updates (skips a diverged branch), safe to
  run on a timer.
- **`.githooks/post-merge`** — runs after any pull/merge (enabled via
  `git config core.hooksPath .githooks`). Type-checks the dispatcher; if the
  pulled code doesn't compile it warns loudly (and prints the one-line rollback:
  `git reset --hard HEAD@{1}`). It alerts, it never blocks.

## One-off

```sh
sh ~/trinity/node-sync.sh
```

## Periodic

cron (every 30 min):

```cron
*/30 * * * * /bin/sh $HOME/trinity/node-sync.sh >> $HOME/.trinity/node-sync.log 2>&1
```

launchd (macOS) —
`~/Library/LaunchAgents/com.s0fractal.trinity-node-sync.plist`, `StartInterval`
1800, `ProgramArguments` = `/bin/sh $HOME/trinity/node-sync.sh`, then
`launchctl load -w` it. (Same shape as the relay agents in
`omega/docs/MESH_RELAY.md`.)

## Notes

- Canonical clone location is `~/trinity` (override with `TRINITY_HOME`); the
  myc resolver and `install.sh` already agree on this — node-sync just keeps it
  current.
- For a richer check on a dev machine, run `t check` manually; the post-merge
  gate stays fast (type-check only) so it's cheap on every pull.
