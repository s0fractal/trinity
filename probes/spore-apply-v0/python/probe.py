import blake3
import sys

MAGIC = b'\x53\x50\x4f\x52' # 'SPOR'
VERSION = 0x00
KIND_APPLY = 0x01
ALGO_BLAKE3_256 = 0x1e
ALGO_SHA256 = 0x12
DIGEST_LEN = 0x20
DOMAIN = "spore.apply.v0"

FLAG_HAS_EXPECT = 0x0001
FLAG_HAS_CAPS = 0x0002
FLAG_HAS_SIG = 0x0004
FLAG_HAS_DEPENDS = 0x0008
FLAG_RESERVED_MASK = 0xfff0

def fixed32(byte: int) -> bytes:
    return bytes([byte] * 32)

def mh(digest: bytes, algo_tag: int = ALGO_BLAKE3_256) -> tuple[int, bytes]:
    if len(digest) != DIGEST_LEN:
        raise ValueError("digest must be 32 bytes")
    return (algo_tag, digest)

def encode_multihash(m: tuple[int, bytes]) -> bytes:
    algo_tag, digest = m
    return bytes([algo_tag, len(digest)]) + digest

def build_apply_record(
    f_hash: tuple[int, bytes],
    arg_hashes: list[tuple[int, bytes]],
    flags: int,
    expect_hash: tuple[int, bytes] = None,
    caps_hash: tuple[int, bytes] = None,
    depends_hash: tuple[int, bytes] = None
) -> bytes:
    if (flags & FLAG_RESERVED_MASK) != 0:
        raise Exception("reserved_flag_set")
    
    argc = len(arg_hashes)
    if argc > 0xff:
        raise Exception("argc must fit in one byte")
    
    header = bytearray(9)
    header[0:4] = MAGIC
    header[4] = VERSION
    header[5] = KIND_APPLY
    header[6] = (flags >> 8) & 0xff
    header[7] = flags & 0xff
    header[8] = argc
    
    fields = [encode_multihash(f_hash)]
    for a in arg_hashes:
        fields.append(encode_multihash(a))
    
    if flags & FLAG_HAS_EXPECT:
        if expect_hash is None:
            raise Exception("HAS_EXPECT set but no expectHash")
        fields.append(encode_multihash(expect_hash))
    
    if flags & FLAG_HAS_CAPS:
        if caps_hash is None:
            raise Exception("HAS_CAPS set but no capsHash")
        fields.append(encode_multihash(caps_hash))
        
    if flags & FLAG_HAS_DEPENDS:
        if depends_hash is None:
            raise Exception("HAS_DEPENDS set but no dependsHash")
        fields.append(encode_multihash(depends_hash))
        
    out = header
    for f in fields:
        out += f
    return bytes(out)

def spore_id(record: bytes) -> bytes:
    return blake3.blake3(record, derive_key_context=DOMAIN).digest()

def to_hex(b: bytes) -> str:
    return b.hex()

def print_case(n: int, record: bytes):
    print(f"case={n} record_hex={to_hex(record)} spore_id={to_hex(spore_id(record))}")

def try_case(n: int, fn):
    try:
        record = fn()
        print_case(n, record)
    except Exception as e:
        print(f"case={n} reject={e}")

# Case 1: argc=0
try_case(1, lambda: build_apply_record(mh(fixed32(0x01)), [], 0x0000))

# Case 2: argc=1
try_case(2, lambda: build_apply_record(mh(fixed32(0x01)), [mh(fixed32(0x02))], 0x0000))

# Case 3: argc=2
try_case(3, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02)), mh(fixed32(0x03))], 
    0x0000))

# Case 4: argc=3
try_case(4, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02)), mh(fixed32(0x03)), mh(fixed32(0x04))], 
    0x0000))

# Case 5: HAS_EXPECT
try_case(5, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02))], 
    FLAG_HAS_EXPECT, 
    expect_hash=mh(fixed32(0x05))))

# Case 6: HAS_DEPENDS
try_case(6, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02))], 
    FLAG_HAS_DEPENDS, 
    depends_hash=mh(fixed32(0x06))))

# Case 7: mixed algo tags
try_case(7, lambda: build_apply_record(
    mh(fixed32(0x01), ALGO_BLAKE3_256), 
    [mh(fixed32(0x07), ALGO_SHA256)], 
    0x0000))

# Case 8: HAS_EXPECT | HAS_DEPENDS
try_case(8, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02))], 
    FLAG_HAS_EXPECT | FLAG_HAS_DEPENDS, 
    expect_hash=mh(fixed32(0x05)), 
    depends_hash=mh(fixed32(0x06))))

# Case 9: reserved flag -> reject
try_case(9, lambda: build_apply_record(
    mh(fixed32(0x01)), 
    [mh(fixed32(0x02))], 
    0x0010))

