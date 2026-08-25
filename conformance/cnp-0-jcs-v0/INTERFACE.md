# Interface contract

Any language, any toolchain. This is the shape the runner speaks to; nothing
here constrains how you build the thing behind it.

Your program is a command-line tool with two subcommands. It reads NDJSON on
stdin and writes NDJSON on stdout, one output line per input line, in the same
order. It writes nothing else to stdout. Diagnostics, if any, go to stderr.

```sh
<your-impl> encode < in.ndjson > out.ndjson
<your-impl> verify < in.ndjson > out.ndjson
```

## Input, both subcommands

```json
{ "id": "<opaque string>", "raw_hex": "<lowercase hex of the input bytes>" }
```

The input is given as hex, not as a JSON string, because part of what is tested
is behaviour on byte sequences that are not valid UTF-8 and therefore cannot
survive being written inside a JSON string. Decode `raw_hex` to bytes and work
from those bytes.

## Output — `encode`

Accepted:

```json
{
  "id": "…",
  "ok": true,
  "canonical_hex": "<lowercase hex>",
  "sha256": "<64 lowercase hex>"
}
```

`canonical_hex` is the canonical byte sequence. `sha256` is the SHA-256 of those
canonical bytes, lowercase hex.

Rejected:

```json
{ "id": "…", "ok": false, "category": "<one of the categories below>" }
```

## Output — `verify`

Accepted — the input bytes _are_ the canonical encoding:

```json
{ "id": "…", "ok": true, "sha256": "<64 lowercase hex of the INPUT bytes>" }
```

Rejected:

```json
{ "id": "…", "ok": false, "category": "<one of the categories below>" }
```

## Rejection categories

A rejection reports one category from this closed set. The specification
requires a _stable rejection class_ per rejected input; this list is that
vocabulary, and it is part of the interface rather than of any implementation.

| category                         | meaning                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| `invalid-utf8`                   | the input is not well-formed UTF-8                                         |
| `syntax`                         | not well-formed JSON under the profile's grammar                           |
| `trailing-bytes`                 | content after the end of the top-level value                               |
| `duplicate-member-name`          | a member name repeats within one map                                       |
| `malformed-escape`               | a string escape is not one the grammar allows                              |
| `unpaired-surrogate`             | a surrogate escape without its pair                                        |
| `number-not-cnp0-integer`        | a number with a fraction or an exponent                                    |
| `integer-out-of-range`           | an integer outside the profile's inclusive range                           |
| `signed-zero`                    | the literal `-0`                                                           |
| `non-canonical-form`             | legal input that is not written in canonical form (`verify` only)          |
| `profile-identifier-invalid`     | the root does not carry the two required members with their exact values   |
| `bytes-hex-invalid`              | a byte projection's `hex` is not even-length lowercase hexadecimal         |
| `ratio-not-reduced`              | a ratio not in lowest terms                                                |
| `ratio-non-positive-denominator` | a ratio denominator that is not greater than zero                          |
| `ratio-zero-not-canonical`       | zero written other than as the specification requires                      |
| `fixed-scale-in-value`           | a fixed-point value carrying its own scale                                 |
| `tagged-form-invalid`            | a tagged form whose tag or member set is not one the specification defines |
| `scale-descriptor-invalid`       | a scale descriptor that violates its own rules                             |

When more than one category could apply to an input, report the one your
implementation detects; the evaluation reports a category mismatch separately
from an accept/reject mismatch, so a defensible different ordering of checks is
visible as such rather than counted as a wrong verdict.

## Exit status

`0` when every input line produced an output line, whatever the verdicts. A
non-zero exit means the program itself failed, which is not the same as
rejecting an input.

## Language and toolchain

**Unconstrained.** Implement in whatever language you like, with whatever
libraries you like. `run_conformance.py` invokes `<cmd> encode` and
`<cmd> verify` as given, so a script, a compiled binary and an interpreter
invocation are all equally acceptable:

```sh
python3 run_conformance.py --cmd './my-impl'
python3 run_conformance.py --cmd 'python3 impl.py'
python3 run_conformance.py --cmd 'node impl.js'
```

One caution that is about the specification rather than the interface: three of
the rejection categories above — `duplicate-member-name`, `invalid-utf8` and
`trailing-bytes` — describe properties of the input **bytes** that a permissive
JSON parser resolves before you can see them. A library that hands you a map has
already chosen which duplicate won. Both operations receive the original bytes
for this reason.
