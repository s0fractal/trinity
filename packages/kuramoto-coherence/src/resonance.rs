//! Kuramoto order parameter + per-agent resonance scores.
//!
//! Computes the global synchronization measure `r = |Σ ρ_i·e^(iφ_i)| / Σ ρ_i` and
//! the mean phase `Ψ` over a set of integer phase agents. All math is integer-only
//! (Q10 fixed-point) and deterministic across platforms — same agents, same bytes,
//! everywhere.

use crate::agent::PhaseAgentMinimal;

/// Q10 scaling constant (1.0 = 1024)
const Q10_SCALE: i64 = 1024;

/// Global resonance field synthesized from agent population.
/// Equivalent to the Kuramoto order parameter weighted by energy ρ.
#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct ResonanceField {
    /// Σ ρ_i · cos(φ_i) in raw accumulated form (already includes Q10 scaling)
    pub sum_cos: i128,
    /// Σ ρ_i · sin(φ_i) in raw accumulated form
    pub sum_sin: i128,
    /// Σ ρ_i (total energy)
    pub total_energy: u64,
    /// Number of living agents (energy > 0)
    pub active_count: u32,
}

impl ResonanceField {
    pub const fn zero() -> Self {
        Self {
            sum_cos: 0,
            sum_sin: 0,
            total_energy: 0,
            active_count: 0,
        }
    }

    /// Ingest a single agent into the resonance field.
    /// Dead agents (energy == 0) are skipped.
    #[inline(always)]
    pub fn ingest_agent(&mut self, agent: &PhaseAgentMinimal) {
        if agent.energy == 0 {
            return;
        }
        // sin(φ) and cos(φ) from Q10 LUT
        let sin_val = crate::math::sin_q10(0, agent.phase) as i64;
        let cos_val = crate::math::sin_q10(0, agent.phase.wrapping_add(64)) as i64;
        let rho = agent.energy as i64;

        // ρ·sin(φ) and ρ·cos(φ) — accumulate in Q10 space
        self.sum_sin += (sin_val * rho) as i128;
        self.sum_cos += (cos_val * rho) as i128;
        self.total_energy += rho as u64;
        self.active_count += 1;
    }

    /// Kuramoto order parameter r ∈ [0, 1] returned as Q10 (0..1024).
    /// r = |Σ ρ_i·e^(iφ_i)| / Σ ρ_i
    /// # Invariants
    /// - Returns 0 if no living agents (total_energy == 0).
    /// - Returns 1024 if all agents are perfectly synchronized.
    pub fn order_parameter_r_q10(&self) -> u32 {
        if self.total_energy == 0 {
            return 0;
        }
        let norm_sq = (self.sum_cos * self.sum_cos + self.sum_sin * self.sum_sin) as u128;
        let norm = norm_sq.isqrt() as i128;
        // r = norm / (total_energy * Q10_SCALE) * Q10_SCALE = norm / total_energy
        let r = norm / self.total_energy as i128;
        r.min(1024) as u32
    }

    /// Global phase Ψ returned as Q10 cosine/sine pair.
    /// TS side can compute `atan2(sum_sin, sum_cos)` via `Math.atan2`.
    #[inline(always)]
    pub fn global_phase_raw(&self) -> (i128, i128) {
        (self.sum_cos, self.sum_sin)
    }

    /// Per-agent resonance score: ρ · cos(φ - Ψ) / Q10_SCALE
    /// Positive = agent is "on the wave" (aligned with global phase).
    /// Negative = agent is a dissident (anti-aligned).
    pub fn resonance_score(&self, agent: &PhaseAgentMinimal) -> i32 {
        if self.total_energy == 0 || agent.energy == 0 {
            return 0;
        }
        // cos(φ - Ψ) = cos(φ)cos(Ψ) + sin(φ)sin(Ψ)
        // But we don't have Ψ directly. Instead:
        // score ∝ ρ · (cos(φ)·sum_cos + sin(φ)·sum_sin) / |field|
        let sin_val = crate::math::sin_q10(0, agent.phase) as i64;
        let cos_val = crate::math::sin_q10(0, agent.phase.wrapping_add(64)) as i64;
        let rho = agent.energy as i64;

        let dot = cos_val * (self.sum_cos as i64) + sin_val * (self.sum_sin as i64);
        // Scale back from Q10·Q10 = Q20 to Q10
        let score = dot / Q10_SCALE;
        (score / rho).clamp(-1024, 1024) as i32
    }
}

/// Scan a slice of agents and produce the global ResonanceField.
pub fn scan_resonance_field(agents: &[PhaseAgentMinimal]) -> ResonanceField {
    let mut field = ResonanceField::zero();
    for agent in agents {
        field.ingest_agent(agent);
    }
    field
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent::PhaseAgentMinimal;

    #[test]
    fn test_resonance_field_zero() {
        let field = ResonanceField::zero();
        assert_eq!(field.order_parameter_r_q10(), 0);
        assert_eq!(field.total_energy, 0);
    }

    #[test]
    fn test_resonance_field_single_agent() {
        let agent = PhaseAgentMinimal {
            phase: 0,
            energy: 1000,
            base_freq: 0,
            state_flags: 0,
            genome: 0,
            memory: [0, 0, 0],
        };
        let field = scan_resonance_field(&[agent]);
        // Single agent at phase 0: cos=1024, sin=0
        // sum_cos = 1024 * 1000 = 1,024,000
        // r = 1,024,000 / 1000 = 1024 (perfect sync)
        assert_eq!(
            field.order_parameter_r_q10(),
            1024,
            "Single agent should have r=1.0"
        );
        assert_eq!(field.total_energy, 1000);
        assert_eq!(field.active_count, 1);
    }

    #[test]
    fn test_resonance_field_two_agents_opposite() {
        let agents = [
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 64,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
        ];
        let field = scan_resonance_field(&agents);
        // Agent 0: cos=1024, sin=0
        // Agent 1 (phase=64=π/2): cos=0, sin=1024
        // sum_cos = 1024*1000 + 0*1000 = 1,024,000
        // sum_sin = 0*1000 + 1024*1000 = 1,024,000
        // norm = sqrt(2) * 1,024,000 ≈ 1,448,155
        // r = 1,448,155 / 2000 ≈ 724 (Q10)
        let r = field.order_parameter_r_q10();
        assert!(
            r > 700 && r < 750,
            "Orthogonal agents should have r≈0.707 (724 Q10), got {}",
            r
        );
    }

    #[test]
    fn test_resonance_field_two_agents_anti() {
        let agents = [
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 128,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
        ];
        let field = scan_resonance_field(&agents);
        // Agent 0: cos=1024, sin=0
        // Agent 1 (phase=128=π): cos=-1024, sin=0
        // sum_cos = 0, sum_sin = 0
        // r = 0
        assert_eq!(
            field.order_parameter_r_q10(),
            0,
            "Anti-phase agents should have r=0"
        );
    }

    #[test]
    fn test_resonance_field_skips_dead() {
        let agents = [
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 0,
                energy: 0,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
        ];
        let field = scan_resonance_field(&agents);
        assert_eq!(
            field.order_parameter_r_q10(),
            1024,
            "Dead agent should be skipped"
        );
        assert_eq!(field.active_count, 1);
    }

    #[test]
    fn test_resonance_score_aligned() {
        let agents = [
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
        ];
        let field = scan_resonance_field(&agents);
        let score = field.resonance_score(&agents[0]);
        assert!(
            score > 1000,
            "Aligned agent should have high positive resonance score, got {}",
            score
        );
    }

    #[test]
    fn test_resonance_score_anti() {
        // Three agents: two aligned at phase 0, one anti-phase at 128.
        // Global phase Ψ ≈ 0 (majority rules), so anti-phase agent should be negative.
        let agents = [
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 0,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
            PhaseAgentMinimal {
                phase: 128,
                energy: 1000,
                base_freq: 0,
                state_flags: 0,
                genome: 0,
                memory: [0, 0, 0],
            },
        ];
        let field = scan_resonance_field(&agents);
        let r = field.order_parameter_r_q10();
        assert!(
            r > 300,
            "Three agents with 2:1 split should have r > 0.3, got {}",
            r
        );
        let score = field.resonance_score(&agents[2]);
        assert!(
            score < -500,
            "Anti-phase agent should have negative resonance score, got {}",
            score
        );
    }
}
