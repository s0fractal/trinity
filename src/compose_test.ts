import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { flow, pipe } from "./x0030_compose.ts";

Deno.test("pipe typed-overload beyond 6 args up to 9 fns", async () => {
  const f1 = (x: number) => x + 1;
  const f2 = (x: number) => x * 2;
  const f3 = (x: number) => x - 3;
  const f4 = (x: number) => x + 4;
  const f5 = (x: number) => x * 5;
  const f6 = (x: number) => x - 6;
  const f7 = (x: number) => x + 7;
  const f8 = (x: number) => x * 2;
  const f9 = (x: number) => x - 1;

  const result = await pipe(1, f1, f2, f3, f4, f5, f6, f7, f8, f9);
  // ((((1 + 1) * 2 - 3 + 4) * 5 - 6 + 7) * 2) - 1
  // 1+1=2; 2*2=4; 4-3=1; 1+4=5; 5*5=25; 25-6=19; 19+7=26; 26*2=52; 52-1=51
  assertEquals(result, 51);
});

Deno.test("flow typed-overload beyond 4 args up to 9 fns", async () => {
  const f1 = (x: number) => x + 1;
  const f2 = (x: number) => x * 2;
  const f3 = (x: number) => x - 3;
  const f4 = (x: number) => x + 4;
  const f5 = (x: number) => x * 5;
  const f6 = (x: number) => x - 6;
  const f7 = (x: number) => x + 7;
  const f8 = (x: number) => x * 2;
  const f9 = (x: number) => x - 1;

  const composed = flow(f1, f2, f3, f4, f5, f6, f7, f8, f9);
  const result = await composed(1);
  assertEquals(result, 51);
});
