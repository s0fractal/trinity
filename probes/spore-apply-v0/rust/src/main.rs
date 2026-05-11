// spore-apply-v0 probe — Rust implementation.
// Iterates the 9-case test matrix from ../SPEC.md.

const MAGIC: [u8; 4] = *b"SPOR";
const VERSION: u8 = 0x00;
const KIND_APPLY: u8 = 0x01;
const ALGO_BLAKE3_256: u8 = 0x1e;
const ALGO_SHA256: u8 = 0x12;
const DIGEST_LEN: u8 = 0x20;
const DOMAIN: &str = "spore.apply.v0";

const FLAG_HAS_EXPECT: u16 = 0x0001;
const FLAG_HAS_CAPS: u16 = 0x0002;
const FLAG_HAS_DEPENDS: u16 = 0x0008;
const FLAG_RESERVED_MASK: u16 = 0xfff0;

#[derive(Clone)]
struct Multihash {
    algo_tag: u8,
    digest: [u8; 32],
}

fn mh(byte: u8, algo_tag: u8) -> Multihash {
    Multihash {
        algo_tag,
        digest: [byte; 32],
    }
}

fn mh_b3(byte: u8) -> Multihash {
    mh(byte, ALGO_BLAKE3_256)
}

fn encode_multihash(m: &Multihash, out: &mut Vec<u8>) {
    out.push(m.algo_tag);
    out.push(DIGEST_LEN);
    out.extend_from_slice(&m.digest);
}

#[derive(Debug)]
enum BuildError {
    ReservedFlagSet,
    ArgcTooLarge,
    MissingExpect,
    MissingCaps,
    MissingDepends,
}

impl BuildError {
    fn as_str(&self) -> &'static str {
        match self {
            BuildError::ReservedFlagSet => "reserved_flag_set",
            BuildError::ArgcTooLarge => "argc_too_large",
            BuildError::MissingExpect => "missing_expect",
            BuildError::MissingCaps => "missing_caps",
            BuildError::MissingDepends => "missing_depends",
        }
    }
}

fn build_apply_record(
    f_hash: &Multihash,
    arg_hashes: &[Multihash],
    flags: u16,
    expect_hash: Option<&Multihash>,
    caps_hash: Option<&Multihash>,
    depends_hash: Option<&Multihash>,
) -> Result<Vec<u8>, BuildError> {
    if flags & FLAG_RESERVED_MASK != 0 {
        return Err(BuildError::ReservedFlagSet);
    }
    if arg_hashes.len() > 0xff {
        return Err(BuildError::ArgcTooLarge);
    }
    if flags & FLAG_HAS_EXPECT != 0 && expect_hash.is_none() {
        return Err(BuildError::MissingExpect);
    }
    if flags & FLAG_HAS_CAPS != 0 && caps_hash.is_none() {
        return Err(BuildError::MissingCaps);
    }
    if flags & FLAG_HAS_DEPENDS != 0 && depends_hash.is_none() {
        return Err(BuildError::MissingDepends);
    }

    let argc = arg_hashes.len() as u8;
    let mut out = Vec::new();

    out.extend_from_slice(&MAGIC);
    out.push(VERSION);
    out.push(KIND_APPLY);
    out.push((flags >> 8) as u8);
    out.push((flags & 0xff) as u8);
    out.push(argc);

    encode_multihash(f_hash, &mut out);
    for a in arg_hashes {
        encode_multihash(a, &mut out);
    }
    if flags & FLAG_HAS_EXPECT != 0 {
        encode_multihash(expect_hash.unwrap(), &mut out);
    }
    if flags & FLAG_HAS_CAPS != 0 {
        encode_multihash(caps_hash.unwrap(), &mut out);
    }
    if flags & FLAG_HAS_DEPENDS != 0 {
        encode_multihash(depends_hash.unwrap(), &mut out);
    }

    Ok(out)
}

fn spore_id(record: &[u8]) -> [u8; 32] {
    blake3::derive_key(DOMAIN, record)
}

fn to_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

fn print_case(n: u32, record: &[u8]) {
    println!(
        "case={} record_hex={} spore_id={}",
        n,
        to_hex(record),
        to_hex(&spore_id(record))
    );
}

fn try_case(
    n: u32,
    build: impl FnOnce() -> Result<Vec<u8>, BuildError>,
) {
    match build() {
        Ok(record) => print_case(n, &record),
        Err(e) => println!("case={} reject={}", n, e.as_str()),
    }
}

fn main() {
    // Case 1: argc=0
    try_case(1, || build_apply_record(&mh_b3(0x01), &[], 0x0000, None, None, None));

    // Case 2: argc=1
    try_case(2, || {
        build_apply_record(&mh_b3(0x01), &[mh_b3(0x02)], 0x0000, None, None, None)
    });

    // Case 3: argc=2 (original)
    try_case(3, || {
        build_apply_record(
            &mh_b3(0x01),
            &[mh_b3(0x02), mh_b3(0x03)],
            0x0000,
            None, None, None,
        )
    });

    // Case 4: argc=3
    try_case(4, || {
        build_apply_record(
            &mh_b3(0x01),
            &[mh_b3(0x02), mh_b3(0x03), mh_b3(0x04)],
            0x0000,
            None, None, None,
        )
    });

    // Case 5: HAS_EXPECT
    try_case(5, || {
        let expect = mh_b3(0x05);
        build_apply_record(
            &mh_b3(0x01),
            &[mh_b3(0x02)],
            FLAG_HAS_EXPECT,
            Some(&expect),
            None, None,
        )
    });

    // Case 6: HAS_DEPENDS
    try_case(6, || {
        let depends = mh_b3(0x06);
        build_apply_record(
            &mh_b3(0x01),
            &[mh_b3(0x02)],
            FLAG_HAS_DEPENDS,
            None, None,
            Some(&depends),
        )
    });

    // Case 7: mixed algo tags
    try_case(7, || {
        build_apply_record(
            &mh(0x01, ALGO_BLAKE3_256),
            &[mh(0x07, ALGO_SHA256)],
            0x0000,
            None, None, None,
        )
    });

    // Case 8: HAS_EXPECT | HAS_DEPENDS
    try_case(8, || {
        let expect = mh_b3(0x05);
        let depends = mh_b3(0x06);
        build_apply_record(
            &mh_b3(0x01),
            &[mh_b3(0x02)],
            FLAG_HAS_EXPECT | FLAG_HAS_DEPENDS,
            Some(&expect),
            None,
            Some(&depends),
        )
    });

    // Case 9: reserved flag → reject
    try_case(9, || {
        build_apply_record(&mh_b3(0x01), &[mh_b3(0x02)], 0x0010, None, None, None)
    });
}
