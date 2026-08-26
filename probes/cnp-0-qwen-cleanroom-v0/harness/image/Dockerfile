# The build sandbox, built here rather than pulled, because no official rust
# image ships rustfmt.
#
# `rust:1.88-slim` and `rust:1.88` both install the minimal rustup profile:
# cargo, rustc, rust-std. `cargo fmt` in either resolves to a rustup shim that
# reports the component is not installed and exits 1. The protocol requires
# `cargo fmt -- --check` to pass before a candidate can be frozen, so with those
# images no candidate could ever be freeze-ready — a criterion nothing could
# satisfy, which is a harness fault and not a result.
#
# Adding the component needs the network, so it happens once, here, at image
# build time. The sandbox that runs a candidate still gets --network none.
FROM rust:1.88@sha256:af306cfa71d987911a781c37b59d7d67d934f49684058f96cf72079c3626bfe0
RUN rustup component add rustfmt \
 && cargo fmt --version \
 && rustc --version
