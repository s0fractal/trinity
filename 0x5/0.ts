#!/usr/bin/env -S deno run --allow-net
// 0x5/0.ts — block (Bitcoin tip height fetcher)
// position: 5/0 → action × void = pure fetch / bare timestamp
// hex_dipole: "8E 00 00 00 00 59 00 00"
//   void_infinity-0.90 (need ground / not foundation-content),
//   action_decision+0.70 (Kimi: the fetch act)
//   bucket 5/0: by-magnitude primary = axis 0 (void), bucket 5 ← MISMATCH
//               by-positive primary = axis 5 (action) → bucket 5 ← MATCH
//               secondary '0' → axis 0 void, dipole -0.90 ← sign-pole match
//   alt reading (claude): void should be +0.40 (returns scalar primitive),
//                         foundation+0.40 (BTC = ground reference); not re-measured
//   audit phase 1 annotation: claude-opus-4-7-1m, anchor block 949260
// lifecycle_phase: 1
// placement_policy: composite
// words mapped here: block, блок, height, висота, timestamp, мітка
//
// Returns structured JSON: {"type":"block","value":N}
// Dispatcher (0x0/01.ts) renders for TTY (just print number) or pipes raw.

const TIP_URL = "https://blockstream.info/api/blocks/tip/height";

if (import.meta.main) {
  const res = await fetch(TIP_URL);
  if (!res.ok) {
    console.log(JSON.stringify({
      type: "error",
      message: `BTC fetch failed: HTTP ${res.status}`,
    }));
    Deno.exit(1);
  }
  const h = (await res.text()).trim();
  console.log(JSON.stringify({
    type: "block",
    value: parseInt(h, 10),
    source: "blockstream.info",
  }));
}
