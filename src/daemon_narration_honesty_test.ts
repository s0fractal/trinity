// Falsifier for audit A8 (part 2): the daemon's safe-mode narration must not
// falsely claim the --act capability "is not yet enabled". It IS enabled — granted
// 2026-06-14 and run hourly by cron (`t daemon tick --act --push`). The read-only
// tick simply wasn't passed --act; the reason must say that, not deny the capability.
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("A8: daemon narration does not deny the granted --act capability", () => {
  const src = Deno.readTextFileSync(
    new URL("./x7F00_daemon.ts", import.meta.url),
  );
  assert(
    !src.includes("not yet enabled"),
    "daemon --act is granted + run hourly by cron; narration must not claim it is 'not yet enabled'",
  );
});
