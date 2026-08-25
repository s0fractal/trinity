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

## How the rounds work

You will be asked for the program, and then you will be given **compiler and
test output only**. Nobody will correct your algorithm, suggest a design, or
tell you what the right bytes are. If the output says the code does not compile,
fix the code. Nothing else is fed back until the implementation compiles and its
first version has been frozen.

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

followed by the fenced block holding that file's whole contents. Emit every file
you want written, whole, every round — the working directory is replaced with
what you emit, and a file you do not emit is a file that disappears. Nothing
outside these blocks is written anywhere.

## Constraints

- Rust standard library plus a SHA-256 implementation. No JSON library.
- The program reads only its stdin and writes only its stdout.
- Do not attempt to read anything outside the working directory, and do not
  attempt network access. Neither is available.
