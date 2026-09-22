---
description: >-
  Fixes how a tool adapts to a terminal and how the environment suppresses colour, pagers, and progress, including the
  presence-and-content rule for the colour variable.
when_to_use: >-
  Use when adding colour, a pager, a progress indicator, hyperlinks, or any behaviour that differs between a terminal
  and a pipe.
---

# Terminal and Environment

## Adapt the Presentation, Never the Content

A tool may present itself differently in a terminal than in a pipe. It may not say something different.

Colour, alignment, a pager, a progress indicator, and terminal hyperlinks are presentation and may vary. The data, the
record count, the field order, and the exit status are content and may not. A caller who pipes a command must receive
the same answer, in a form a program can read.

## What Suppresses Escapes

| Condition                           | Required behaviour                                      |
| ----------------------------------- | ------------------------------------------------------- |
| Standard output is not a terminal   | No escapes, no progress indicator, no pager             |
| `NO_COLOR` is set and non-empty     | No escapes, even on a terminal                          |
| `TERM` is unset or `dumb`           | No escapes, even on a terminal                          |
| `--color never`                     | No escapes                                              |
| A machine-readable mode is selected | No escapes, unconditionally, even with `--color always` |

`--color` accepts exactly `auto`, `always`, and `never`, and defaults to `auto`. A single boolean negation such as
`--no-colour` is not sufficient, because it gives a caller no way to **force** colour through a pipe — needed whenever
output is captured and rendered later.

## Presence and Content Are Different Tests

The colour variable's specification suppresses colour when the variable is _present and not an empty string_, regardless
of its value. Two consequences follow, and the second is the one tools get wrong:

- A value of `0` **does** suppress colour. The variable is not a boolean; it is a flag whose presence is the signal.
- An empty value does **not** suppress colour. A variable set to the empty string is not a request for monochrome, and a
  shell produces that state easily.

The same distinction governs the base directory variables, whose defaults apply when a variable is either unset or
empty. One fixture covering both surfaces tests the whole rule.

At least one widely used tool documents its colour variable as taking effect when "set to any value", which reads as
presence alone and diverges from the specification on the empty case. The specification governs; an exemplar is evidence
of practice, not authority over the source that defines the variable it uses.

## One Switch for the Whole Escape Surface

Colour suppression covers every escape the tool emits, not only colour: hyperlinks, cursor movement, alternate screen
use, and bold or underline included. A tool with one switch per decoration guarantees that some path eventually emits an
escape into a context that cannot render it, and the caller has no single thing to turn off.

## Forcing and Piping

A tool may honour a variable that forces terminal-style output when the stream is redirected, for callers that capture
and render output later. It is optional. What is not optional is that forcing is explicit: no tool colours a pipe unless
something asked it to.
