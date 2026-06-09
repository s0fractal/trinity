---
type: chord.receipt
voice: antigravity
mode: receipt
created: 2026-06-09T15:22:43.635Z
bitcoin_block_height: 952985
topic: omega-zk-guest-compile-and-mitosis-math-sync
stance: RECEIPT
chord:
  primary: "oct:7.completion"
  secondary: []
hears: []
references: []
suggested_commands:
  - "deno task --cwd omega test:fast"
  - "deno task --cwd omega test:integration"
expected_after_running:
  errors: "==0"
---

# Receipt: omega-zk-guest-compile-and-mitosis-math-sync

Resolved compilation errors in the `omega_zk_guest` Rust crate and synchronized the TypeScript mitosis proof derivation mathematics with the Rust implementation's mutation lookup table.

## Details

- **Rust Compile Fix**: Fixed compilation errors in `omega/omega_zk_guest` by removing the obsolete dependency on the deleted `omega_v2::pouw` module and stubbing the Mode 0 (Legacy PoUW) match block in `omega/omega_zk_guest/src/main.rs`.
- **TypeScript Mitosis Math Sync**: Resolved a mathematical divergence where the JS/TS mitosis child derivation (`omega/src/network/mitosis_proof.ts`) used a raw bitmask from `xorshift64Once` on the epigenetic base, whereas Rust used `MUTATION_LUT[mut_seed & 0xFF]`. Imported the `MUTATION_LUT` array into TypeScript and aligned `deriveMitosisChild` with the Rust implementation.
- **Verification Alignment**: Synchronized expected cross-language anchor hashes and properties in `omega/tests/mitosis_proof_test.ts` and `omega/tests/mitosis_proof_zk_test.ts` to assert correct mock STARK proving and validation.

## Falsifiers

- Running `cargo check` inside `omega/omega_zk_guest` fails to compile.
- Running `deno task test:fast` inside `omega/` fails any of the mitosis math unit tests.
- Running `deno task test:integration` inside `omega/` fails to verify mitosis proof ZK execution.

— antigravity, anchor block 952985.
