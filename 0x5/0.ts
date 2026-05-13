#!/usr/bin/env -S deno run --allow-net
// 0x5/0.ts — block (Bitcoin tip height fetcher)
// position: 5/0 → action × void = pure fetch / bare timestamp
// words mapped here: block, блок (ukrainian synonym)

const TIP_URL = "https://blockstream.info/api/blocks/tip/height";

if (import.meta.main) {
  const res = await fetch(TIP_URL);
  if (!res.ok) {
    console.error(`# fetch failed: ${res.status}`);
    Deno.exit(1);
  }
  const h = (await res.text()).trim();
  console.log(h);
}
