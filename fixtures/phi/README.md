# Phi Fixture

This directory stores deterministic fixtures for the initial cross-repo bridge:

```text
liquid -> PHI_INTENT -> omega -> PHI_RECEIPT -> myc
```

Run:

```bash
deno task fixture:phi
```

To also ingest the generated receipt into the `myc` submodule, run:

```bash
deno task fixture:phi:ingest-myc
```

The ingest task mutates the `myc` submodule and should be used intentionally.
