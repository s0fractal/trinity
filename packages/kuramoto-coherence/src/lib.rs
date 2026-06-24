#![cfg_attr(not(test), no_std)]
//! # kuramoto-coherence
//!
//! Deterministic, allocation-free **Kuramoto phase-coherence** over integer phase
//! agents. The order parameter `r` and global phase `Ψ` are computed with
//! hand-rolled fixed-point LUTs (sine, `atan2`, `isqrt` over `i128` accumulators) —
//! no floats, no heap, no `std` — so the result is **bit-identical across x86, ARM,
//! RISC-V, and WASM**, and cheap enough to recompute and prove inside a zkVM.
//!
//! ```
//! use kuramoto_coherence::{scan_resonance_field, PhaseAgentMinimal};
//! let agents: &[PhaseAgentMinimal] = &[/* your integer phase oscillators */];
//! let field = scan_resonance_field(agents);
//! let r = field.order_parameter_r_q10(); // Q10 fixed-point coherence in [0, 1024]
//! ```
//!
//! Extracted from the omega substrate's deterministic core; the substrate's
//! framing is stripped — this is the plain, verifiable math.

pub mod agent;
pub mod math;
pub mod resonance;

pub use agent::PhaseAgentMinimal;
pub use resonance::{scan_resonance_field, ResonanceField};
