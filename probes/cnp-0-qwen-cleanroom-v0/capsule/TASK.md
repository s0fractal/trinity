# Task

Implement the specification in `SPEC.md` as a Rust program obeying
`INTERFACE.md`. `EXAMPLES.ndjson` shows the interface and three behaviours.

Write the whole program. There is no existing implementation to consult, adapt,
or agree with, and none will be shown to you. Where the specification underdetermines
something, decide it yourself and say so — a disagreement that traces to a
genuine gap in the prose is a more useful result than a guess that happens to
match, so record your reasoning in `NOTES.md` as you go.

## Deliverables in the working directory

```
Cargo.toml
src/main.rs          and any further modules you want
NOTES.md             decisions you had to make, and what in the prose forced or
                     failed to force each one
```

## How the work proceeds

You do not have to produce the whole program in one reply. Work in turns.

Each turn you are shown the files you have written so far, verbatim, and — once
there is enough to build — the compiler and test output. Emit whatever you want
to add or replace. A file you emit again replaces the earlier version; a file you
do not mention is kept as it was.

Nobody will correct your algorithm, suggest a design, or tell you what the right
bytes are. The only thing fed back besides your own files is machine output. When
you believe the set is complete and correct, say `DONE` on a line of its own.

After the freeze, you may be given failing cases: the input bytes, the category
that was expected, and the clause of the specification that governs it. Never
the expected output bytes and never the expected digest. That restriction is the
point of the exercise — a implementation that reproduces bytes it was shown has
demonstrated nothing about the specification.

## How to emit files

Emit each file as a fenced code block immediately preceded by a line naming its
path, exactly like this:

```text
FILE: Cargo.toml
```

followed by the fenced block holding that file's whole contents. Emit each file
**whole** — a partial file replaces the previous one and will not compile.
Nothing outside these blocks is written anywhere.

## Constraints

- Rust standard library plus a SHA-256 implementation. No JSON library.
- The program reads only its stdin and writes only its stdout.
- Do not attempt to read anything outside the working directory, and do not
  attempt network access. Neither is available.
