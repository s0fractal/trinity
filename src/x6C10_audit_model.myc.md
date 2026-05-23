# Audit Model

The Trinity audit model separates stable verification from exploratory
verification.

## Green Gates

These are expected to pass before updating submodule pointers:

```bash
deno task audit:green
```

Current green gates:

- `myc`: `deno task check`
- `omega`: `cargo test --workspace`
- `liquid`: `deno task audit:strict`
- `liquid`: `deno task ledger:doctor --json`

## Strict Gates

These include unstable or high-signal tests:

```bash
deno task audit:strict
```

Current strict additions:

- `omega`: `deno task test:fast`
- `liquid`: `deno task test:unit`

Strict failures should be treated as prioritized work, not noise.

## Report Convention

Generated reports belong in `reports/latest-*.md` and are ignored by git by
default. Curated reports can be committed under `reports/` with a dated name.
