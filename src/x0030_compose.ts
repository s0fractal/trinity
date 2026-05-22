// src/x0030_compose.ts — compose / pipe / flow / FP primitives (library)
// position: 0/03 → foundation(0) × triangle(3) = composition primitives
// hex_dipole: "6C 00 00 59 00 00 00 00"
//   void_infinity+0.85 (PRIMARY: foundation primitives; bucket 0 axis MATCH)
//   triangle_build+0.70 (SECONDARY: composition is triangle archetype; sub-position 3)
// placement_policy: axis
// intent: small FP toolkit — pipe / flow / tap / ifElse / tryOr / fromNullable / parallel
// maturity: active
// horizon: typed-overload count beyond 6 args if patterns demand it; Result<T,E> if error-handling becomes complex enough
// skill_tag: compose
// skill_safe: yes
//
// Library — no `import.meta.main`, no dispatcher entry. Imported by
// organs that benefit from code-level composition. Pairs with bucket
// 0 dispatch-level composition (all/each/pipe/try/cond/join/repeat/
// tap/until/any at coords 0/03..0/0C) — those compose t-commands;
// these compose TS functions.
//
// Per feedback_model_convenience_over_human_readability (2026-05-22):
// optimize for model parsing, not human prose-readability.
//
// All primitives are async-first (await internally) so they work with
// sync OR async fns transparently. Caller never thinks about which.

/** Value flows through fn chain. Each step await-ed.
 *  pipe(x, f, g, h) === await h(await g(await f(x))) */
export function pipe<A, B>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
): Promise<B>;
export function pipe<A, B, C>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
): Promise<C>;
export function pipe<A, B, C, D>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
): Promise<D>;
export function pipe<A, B, C, D, E>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
  de: (d: D) => E | Promise<E>,
): Promise<E>;
export function pipe<A, B, C, D, E, F>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
  de: (d: D) => E | Promise<E>,
  ef: (e: E) => F | Promise<F>,
): Promise<F>;
export function pipe<A, B, C, D, E, F, G>(
  value: A | Promise<A>,
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
  de: (d: D) => E | Promise<E>,
  ef: (e: E) => F | Promise<F>,
  fg: (f: F) => G | Promise<G>,
): Promise<G>;
// deno-lint-ignore no-explicit-any
export async function pipe(value: any, ...fns: Array<(v: any) => any>): Promise<any> {
  let acc = await value;
  for (const fn of fns) acc = await fn(acc);
  return acc;
}

/** Point-free composition: flow(f, g, h) returns fn equivalent to
 *  (x) => pipe(x, f, g, h). */
export function flow<A, B>(
  ab: (a: A) => B | Promise<B>,
): (a: A | Promise<A>) => Promise<B>;
export function flow<A, B, C>(
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
): (a: A | Promise<A>) => Promise<C>;
export function flow<A, B, C, D>(
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
): (a: A | Promise<A>) => Promise<D>;
export function flow<A, B, C, D, E>(
  ab: (a: A) => B | Promise<B>,
  bc: (b: B) => C | Promise<C>,
  cd: (c: C) => D | Promise<D>,
  de: (d: D) => E | Promise<E>,
): (a: A | Promise<A>) => Promise<E>;
// deno-lint-ignore no-explicit-any
export function flow(...fns: Array<(v: any) => any>): (v: any) => Promise<any> {
  return async (v) => {
    let acc = await v;
    for (const fn of fns) acc = await fn(acc);
    return acc;
  };
}

/** Side effect; passes value through unchanged. Useful inside pipe
 *  for logging, file writes, manifest emit, etc. */
export function tap<T>(
  fn: (v: T) => void | Promise<void>,
): (v: T) => Promise<T> {
  return async (v: T) => {
    await fn(v);
    return v;
  };
}

/** Branching with type inference; returns union of both arm types. */
export function ifElse<I, T, F>(
  pred: (v: I) => boolean,
  onTrue: (v: I) => T | Promise<T>,
  onFalse: (v: I) => F | Promise<F>,
): (v: I) => Promise<T | F> {
  return async (v: I) =>
    pred(v) ? await onTrue(v) : await onFalse(v);
}

/** Try fn; on throw return fallback. NOT a full Result monad —
 *  collapses errors to default value. Use when error info isn't
 *  needed downstream. */
export async function tryOr<T>(
  fn: () => T | Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Guard against null/undefined; if value is nullish, return fallback,
 *  else apply fn. */
export function fromNullable<T, U>(
  fn: (v: T) => U | Promise<U>,
  fallback: U,
): (v: T | null | undefined) => Promise<U> {
  return async (v) =>
    (v === null || v === undefined) ? fallback : await fn(v);
}

/** Named parallel-collect. Pass an object of () => Promise<X>;
 *  receive an object of resolved X values with same keys.
 *  parallel({a: loadA, b: loadB}) → {a: ResolvedA, b: ResolvedB} */
// deno-lint-ignore no-explicit-any
export async function parallel<T extends Record<string, () => any>>(
  obj: T,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = await Promise.all(
    Object.entries(obj).map(async ([k, fn]) => [k, await fn()] as const),
  );
  // deno-lint-ignore no-explicit-any
  return Object.fromEntries(entries) as any;
}
