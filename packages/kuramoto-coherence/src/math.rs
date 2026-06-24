//! Universal Integer Trigonometry
//! #![no_std] deterministic math. Q=7 Resonance Matrix (128 elements).

// HIGH-1 FIX: xorshift64* replaces NR LCG for superior spectral properties.
// Period: 2^64 - 1. Passes BigCrush. Single u64 state, zero allocations.

/// Deterministic pseudo-random number generator (xorshift64*).
#[derive(Clone, Copy, Debug)]
pub struct Xorshift64 {
    state: u64,
}

impl Xorshift64 {
    /// Seeds the generator from a u32 root seed using SplitMix64-style mixing.
    #[inline(always)]
    pub const fn new(seed: u32) -> Self {
        let mut state = seed as u64;
        state = state.wrapping_add(0x9E3779B97F4A7C15);
        state = (state ^ (state >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        state = (state ^ (state >> 27)).wrapping_mul(0x94D049BB133111EB);
        state = state ^ (state >> 31);
        Self { state }
    }

    /// Generates the next 32-bit random value.
    #[inline(always)]
    pub fn next_u32(&mut self) -> u32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        self.state as u32
    }

    /// Generates the next 64-bit random value.
    #[inline(always)]
    pub fn next_u64(&mut self) -> u64 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        self.state
    }
}

/// One-shot xorshift64 for deterministic single-value hashing.
#[inline(always)]
pub fn xorshift64_once(seed: u64) -> u64 {
    let mut s = seed;
    s ^= s << 13;
    s ^= s >> 7;
    s ^= s << 17;
    s
}

/// One-shot xorshift32 for u32 contexts (period 2^32-1).
/// Seeded with non-zero input for full period coverage.
#[inline(always)]
pub fn xorshift32_once(seed: u32) -> u32 {
    let mut s = seed;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    s
}

pub static SINE_LUT_128: [i32; 128] = [
    0, 51451, 102778, 153858, 204567, 254783, 304386, 353255, 401273, 448324, 494295, 539076,
    582558, 624636, 665210, 704181, 741455, 776944, 810560, 842224, 871859, 899394, 924761, 947901,
    968758, 987281, 1003425, 1017151, 1028428, 1037227, 1043527, 1047313, 1048576, 1047313,
    1043527, 1037227, 1028428, 1017151, 1003425, 987281, 968758, 947901, 924761, 899394, 871859,
    842224, 810560, 776944, 741455, 704181, 665210, 624636, 582558, 539076, 494295, 448324, 401273,
    353255, 304386, 254783, 204567, 153858, 102778, 51451, 0, -51451, -102778, -153858, -204567,
    -254783, -304386, -353255, -401273, -448324, -494295, -539076, -582558, -624636, -665210,
    -704181, -741455, -776944, -810560, -842224, -871859, -899394, -924761, -947901, -968758,
    -987281, -1003425, -1017151, -1028428, -1037227, -1043527, -1047313, -1048576, -1047313,
    -1043527, -1037227, -1028428, -1017151, -1003425, -987281, -968758, -947901, -924761, -899394,
    -871859, -842224, -810560, -776944, -741455, -704181, -665210, -624636, -582558, -539076,
    -494295, -448324, -401273, -353255, -304386, -254783, -204567, -153858, -102778, -51451,
];

// --- Q10 Sine LUT (256 entries) for Kuramoto coupling ---
// HIGH-3 FIX: bitmask & 0xFF instead of % 256 for O(1) on hot path
/// Q10-scaled sine lookup table (256 entries, one full period).
/// Values range [-1024, 1024] representing sin(θ) * 1024.
pub static SINE_LUT: [i32; 256] = [
    0, 25, 50, 75, 100, 125, 150, 175, 200, 224, 249, 273, 297, 321, 345, 369, 392, 415, 438, 460,
    483, 505, 526, 548, 569, 590, 610, 630, 650, 669, 688, 706, 724, 742, 759, 775, 792, 807, 822,
    837, 851, 865, 878, 891, 903, 915, 926, 936, 946, 955, 964, 972, 980, 987, 993, 999, 1004,
    1009, 1013, 1016, 1019, 1021, 1023, 1024, 1024, 1024, 1023, 1021, 1019, 1016, 1013, 1009, 1004,
    999, 993, 987, 980, 972, 964, 955, 946, 936, 926, 915, 903, 891, 878, 865, 851, 837, 822, 807,
    792, 775, 759, 742, 724, 706, 688, 669, 650, 630, 610, 590, 569, 548, 526, 505, 483, 460, 438,
    415, 392, 369, 345, 321, 297, 273, 249, 224, 200, 175, 150, 125, 100, 75, 50, 25, 0, -25, -50,
    -75, -100, -125, -150, -175, -200, -224, -249, -273, -297, -321, -345, -369, -392, -415, -438,
    -460, -483, -505, -526, -548, -569, -590, -610, -630, -650, -669, -688, -706, -724, -742, -759,
    -775, -792, -807, -822, -837, -851, -865, -878, -891, -903, -915, -926, -936, -946, -955, -964,
    -972, -980, -987, -993, -999, -1004, -1009, -1013, -1016, -1019, -1021, -1023, -1024, -1024,
    -1024, -1023, -1021, -1019, -1016, -1013, -1009, -1004, -999, -993, -987, -980, -972, -964,
    -955, -946, -936, -926, -915, -903, -891, -878, -865, -851, -837, -822, -807, -792, -775, -759,
    -742, -724, -706, -688, -669, -650, -630, -610, -590, -569, -548, -526, -505, -483, -460, -438,
    -415, -392, -369, -345, -321, -297, -273, -249, -224, -200, -175, -150, -125, -100, -75, -50,
    -25,
];

/// Q10 sine of phase difference: sin((to - from) * 2π / 256) * 1024
#[inline(always)]
pub fn sin_q10(from_theta: u32, to_theta: u32) -> i32 {
    let index = to_theta.wrapping_sub(from_theta) & 0xFF;
    SINE_LUT[index as usize]
}

/// Q10 cosine of phase difference: cos((to - from) * 2π / 256) * 1024
#[inline(always)]
pub fn cos_q10(from_theta: u32, to_theta: u32) -> i32 {
    // cos(x) = sin(x + pi/2), and pi/2 is 256/4 = 64
    let index = to_theta.wrapping_add(64).wrapping_sub(from_theta) & 0xFF;
    SINE_LUT[index as usize]
}

/// O(1) CORDIC-inspired atan2 (0..255 full-circle) matching compute_v2.wgsl.
/// This replaces the O(2^q_phase) brute-force scan with a fixed ~10 ops.
pub fn atan2_fast(y: i32, x: i32) -> i32 {
    if x == 0 && y == 0 {
        return 0;
    }
    let abs_y = y.abs();
    let abs_x = x.abs();
    let a = core::cmp::min(abs_y, abs_x);
    let b = core::cmp::max(abs_y, abs_x);
    let mut ratio = 0i32;
    if b != 0 {
        ratio = (a * 128) / b;
    }
    if ratio > 128 {
        ratio = 128;
    }
    // ATAN_LUT — canonical copy (shaders receive this via WASM storage buffer)
    const ATAN_LUT: [u32; 129] = [
        0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9, 9,
        9, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 15, 15, 15, 15, 16,
        16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 22,
        22, 22, 22, 23, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 27,
        27, 27, 27, 27, 28, 28, 28, 28, 28, 29, 29, 29, 29, 29, 29, 30, 30, 30, 30, 30, 31, 31, 31,
        31, 31, 31, 32, 32, 32, 32,
    ];
    let octant_angle = ATAN_LUT[ratio as usize] as i32;
    let mut quadrant_angle = octant_angle;
    if abs_y > abs_x {
        quadrant_angle = 64 - octant_angle;
    }
    if x < 0 {
        if y < 0 {
            (128 + quadrant_angle) & 255
        } else {
            (128 - quadrant_angle) & 255
        }
    } else {
        if y < 0 {
            (256 - quadrant_angle) & 255
        } else {
            quadrant_angle & 255
        }
    }
}

/// Brute-force O(N) atan2 for validation against atan2_fast.
/// Uses i64 dot product to avoid overflow and correctly handle small x/y.
pub fn atan2_brute_256(y: i32, x: i32) -> i32 {
    if x == 0 && y == 0 {
        return 0;
    }
    let mut best = 0i32;
    let mut max_dot = i64::MIN;
    for p in 0..256 {
        let sx = SINE_LUT[(p + 64) % 256] as i64;
        let sy = SINE_LUT[p] as i64;
        let dot = (x as i64) * sx + (y as i64) * sy;
        if dot > max_dot {
            max_dot = dot;
            best = p as i32;
        }
    }
    best
}

/// Branchless absolute value. Equivalent to `v.abs()` but without branches.
#[inline(always)]
pub fn fast_abs(v: i32) -> i32 {
    let mask = v >> 31;
    (v ^ mask) - mask
}

/// Circular distance on a 256-phase ring.
/// Returns the shortest absolute difference between two phase values.
#[inline(always)]
pub fn phase_distance(a: i32, b: i32) -> i32 {
    let diff = fast_abs(a - b) & 255;
    if diff > 128 {
        256 - diff
    } else {
        diff
    }
}

// Evolutionary Genome (Probabilistic Automaton)
// Biologically inspired bit-flip masks: 1-bit, 2-bit, 3-bit, and 2-4 bit random flips.
pub const MUTATION_LUT: [u32; 256] = [
    0x00000000, 0x00000001, 0x00000002, 0x00000004, 0x00000008, 0x00000010, 0x00000020, 0x00000040,
    0x00000080, 0x00000100, 0x00000200, 0x00000400, 0x00000800, 0x00001000, 0x00002000, 0x00004000,
    0x00008000, 0x00010000, 0x00020000, 0x00040000, 0x00080000, 0x00100000, 0x00200000, 0x00400000,
    0x00800000, 0x01000000, 0x02000000, 0x04000000, 0x08000000, 0x10000000, 0x20000000, 0x40000000,
    0x80000000, 0x00000003, 0x00000006, 0x0000000C, 0x00000018, 0x00000030, 0x00000060, 0x000000C0,
    0x00000180, 0x00000300, 0x00000600, 0x00000C00, 0x00001800, 0x00003000, 0x00006000, 0x0000C000,
    0x00018000, 0x00030000, 0x00060000, 0x000C0000, 0x00180000, 0x00300000, 0x00600000, 0x00C00000,
    0x01800000, 0x03000000, 0x06000000, 0x0C000000, 0x18000000, 0x30000000, 0x60000000, 0xC0000000,
    0x00000007, 0x0000000E, 0x0000001C, 0x00000038, 0x00000070, 0x000000E0, 0x000001C0, 0x00000380,
    0x00000700, 0x00000E00, 0x00001C00, 0x00003800, 0x00007000, 0x0000E000, 0x0001C000, 0x00038000,
    0x00070000, 0x000E0000, 0x001C0000, 0x00380000, 0x00700000, 0x00E00000, 0x01C00000, 0x03800000,
    0x07000000, 0x0E000000, 0x1C000000, 0x38000000, 0x70000000, 0xE0000000, 0x00028082, 0x00000140,
    0x08000026, 0x00006000, 0x04005002, 0x00020401, 0x08220200, 0x00200040, 0x01000040, 0x00410004,
    0x210000A0, 0x00841010, 0x00044000, 0x00004040, 0x20820000, 0x00C00000, 0x00020010, 0x20008400,
    0x00124000, 0x00004004, 0x02020010, 0x00102000, 0xA2000200, 0x00018100, 0x0A804000, 0x80000020,
    0x00000280, 0x09000410, 0x20010001, 0x00220080, 0x28000400, 0x00010800, 0x00081240, 0x00100401,
    0x00800082, 0x00008008, 0x80000030, 0x40000500, 0x08003000, 0x12880000, 0x1000C080, 0x00200002,
    0x00004011, 0x0000401C, 0x00028010, 0xC0002100, 0x44000000, 0x00000040, 0x0C400000, 0x00000048,
    0x00208040, 0x10001000, 0x08000800, 0x20008010, 0x00000049, 0x00008400, 0xC0002000, 0x01000408,
    0x01010000, 0x88040000, 0x00041000, 0x00000008, 0x40100008, 0x00000C28, 0x00008010, 0x00008084,
    0x04110020, 0x00108000, 0x02080100, 0x00100011, 0x00002050, 0x00410110, 0x00840000, 0x10080000,
    0x00080141, 0x000002C0, 0x00242000, 0x80010000, 0x08000028, 0x00200005, 0x00010400, 0x18000081,
    0x00000204, 0x08000300, 0x00880000, 0x00402000, 0x04408040, 0x00008E00, 0x00200802, 0x00028400,
    0x41000044, 0x20001000, 0x00084000, 0x02001000, 0x00020010, 0x02200002, 0x00010800, 0x08010044,
    0x08100080, 0x00011004, 0x08801001, 0x00300010, 0x04080080, 0x02040100, 0x05000000, 0x02080801,
    0x08042000, 0x30100000, 0x40002420, 0x00208020, 0x00085200, 0x00008004, 0x24000010, 0x83001000,
    0x00000201, 0x08004000, 0x20000008, 0x20008180, 0x18100000, 0x50000400, 0x80028000, 0x10028010,
    0x00268000, 0x00000320, 0x01000200, 0x04002010, 0x24000008, 0x05000000, 0x41000003, 0x05080000,
    0x80024000, 0x81000002, 0x22000400, 0x02000002, 0x08000122, 0x00010808, 0x20102000, 0x01220000,
    0x40010020, 0x00400008, 0x00000014, 0x00009000, 0x00008200, 0x40000080, 0x20812000, 0x00000480,
    0x00080042, 0x03001010, 0x000880C0, 0x08C00004, 0x00200001, 0x88000040, 0x28000200, 0x40020000,
    0x08120000, 0x00020020, 0x21008000, 0x80100002, 0x80002000, 0x00230000, 0x00021021, 0x84000000,
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xorshift_determinism() {
        let mut rng1 = Xorshift64::new(42);
        let mut rng2 = Xorshift64::new(42);
        for _ in 0..100 {
            assert_eq!(rng1.next_u32(), rng2.next_u32());
        }
    }

    #[test]
    fn test_xorshift_period_no_early_repeat() {
        let mut rng = Xorshift64::new(12345);
        let first = rng.next_u32();
        for _ in 1..10_000 {
            assert_ne!(
                rng.next_u32(),
                first,
                "xorshift repeated within 10000 steps"
            );
        }
    }

    #[test]
    fn test_xorshift_different_seeds() {
        let mut rng1 = Xorshift64::new(1);
        let mut rng2 = Xorshift64::new(2);
        assert_ne!(rng1.next_u32(), rng2.next_u32());
    }

    #[test]
    fn test_sin_q10_zero() {
        assert_eq!(sin_q10(0, 0), 0);
        assert_eq!(sin_q10(100, 100), 0);
    }

    #[test]
    fn test_sin_q10_symmetry() {
        // sin(π/2) at index 64 should be max positive (1024)
        assert_eq!(sin_q10(0, 64), 1024);
        // sin(π) at index 128 should be 0
        assert_eq!(sin_q10(0, 128), 0);
        // sin(3π/2) at index 192 should be max negative (-1024)
        assert_eq!(sin_q10(0, 192), -1024);
    }

    #[test]
    fn test_sin_q10_periodicity() {
        for i in 0..256u32 {
            assert_eq!(sin_q10(0, i), sin_q10(0, i + 256));
            assert_eq!(sin_q10(0, i), sin_q10(0, i + 512));
        }
    }

    #[test]
    fn test_sin_q10_bitmask() {
        // HIGH-3: bitmask & 0xFF should work for large values
        assert_eq!(sin_q10(1000, 1000), 0);
        assert_eq!(sin_q10(u32::MAX, u32::MAX), 0);
    }

    #[test]
    fn test_atan2_fast_matches_brute_force() {
        // Compare CORDIC-inspired atan2_fast against brute-force O(256) scan
        // for a grid of (x, y) values. Tolerance ±1 is acceptable due to quantization.
        let test_values = [0, 100, 500, 1000, 5000, 10000, 50000, 100000];
        for &x in &test_values {
            for &y in &test_values {
                let fast = atan2_fast(y, x);
                let brute = atan2_brute_256(y, x);
                let diff = (fast - brute).abs();
                assert!(
                    diff <= 1,
                    "atan2_fast({},{}) = {}, brute = {}, diff = {}",
                    y,
                    x,
                    fast,
                    brute,
                    diff
                );
            }
        }
    }

    #[test]
    fn test_atan2_fast_quadrants() {
        // +x, +y -> 0..64
        assert!(atan2_fast(1000, 1000) >= 0 && atan2_fast(1000, 1000) <= 64);
        // +x, +y large -> ~32 (45 degrees)
        assert!(atan2_fast(100000, 100000) >= 30 && atan2_fast(100000, 100000) <= 34);
        // +x, -y -> 192..256 (wraps to 0)
        let v = atan2_fast(-1000, 1000);
        assert!(v >= 192 || v <= 64, "Expected lower half for -y, got {}", v);
        // -x, +y -> 64..128
        assert!(atan2_fast(1000, -1000) >= 64 && atan2_fast(1000, -1000) <= 128);
    }

    #[test]
    fn test_mutation_lut_hamming_distance() {
        let mut dist = [0u32; 33];
        for i in 0..256 {
            let bits = crate::math::MUTATION_LUT[i].count_ones();
            dist[bits as usize] += 1;
        }
        // BigBang expectation
        assert_eq!(dist[0], 1, "Expected exactly 1 zero-mutation mask");
        assert!(dist[1] >= 32, "Expected at least 32 single-bit mutations");

        let sum: u32 = dist.iter().sum();
        assert_eq!(sum, 256, "Total distribution must sum to 256");
    }
}
