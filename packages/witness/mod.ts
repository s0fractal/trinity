// @s0fractal/witness — keyed multi-party co-signing.
//
// The keystone that turns a federation's quorums from *simulated* into *real*.
// An identity is an ed25519 public key; a co-signature requires the matching
// private key; an m-of-n quorum requires m distinct key-holders — so a single
// actor cannot forge it (the Sybil hole this fixes).
//
// Keyless by design: the caller supplies keys from their own custody; this
// package never mints or persists a private key it holds.

export * from "./witness.ts";
