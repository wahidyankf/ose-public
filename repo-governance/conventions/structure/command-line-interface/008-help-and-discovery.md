---
description: >-
  Fixes how a caller discovers what a tool can do — the help spellings a subcommand tree owes, and why invoking a tool
  with no arguments is a usage mistake rather than a success.
when_to_use: >-
  Use when adding a subcommand, wiring help, or deciding what a tool does when invoked with no arguments at all.
---

# Help and Discovery

The rest of this contract is about what a tool tells a caller who already knows what to ask for. This module is about
the caller who does not.

## Bare Invocation Is a Usage Mistake

A tool whose work requires a subcommand, invoked with none, has not done the work. It exits `2`.

Showing the help text there is friendly and permitted, but it goes to **standard error**, because nobody asked for it.
Requested help is a payload; unrequested help is a diagnostic, and the stream follows from which of the two it is.

The status is the part that matters, and `0` is the tempting wrong answer. A tool that prints its help and exits `0` has
told every caller that the work completed affirmatively. `tool && next-step` then runs `next-step` on the strength of a
tool that did nothing at all.

That is not a hypothetical. Bare invocation is the most likely way a command ends up with no arguments — an unset
variable, an expansion that produced nothing, a wrapper that dropped what it was passed. In each case the caller
believes it asked for work. A `0` confirms the belief.

A tool that needs no subcommand is not covered by this rule: invoked bare, it does its work, and its status says how
that went.

## A Subcommand Tree Carries a `help` Subcommand

Where a tool has a subcommand tree, `help` is accepted as a subcommand as well as a flag: `tool help`, and
`tool help <subcommand>` where the tree is deeper.

This is required only of a tool that has such a tree. A single-command tool has nothing to route, and `-h` and `--help`
already reach everything it can do.

Both spellings are required rather than one because callers reach for whichever their previous tool used. A tool that
recognizes only the flag answers `help` with an unrecognized-command error — a usage mistake reported to someone who was
in the middle of asking how to avoid one. The cost of accepting both is one alias; the cost of accepting one is paid by
every caller who guesses wrong.

## What Discovery Owes

| Invocation                                      | Status | Stream for the text |
| ----------------------------------------------- | ------ | ------------------- |
| `tool --help`, `tool -h`                        | `0`    | standard output     |
| `tool help`                                     | `0`    | standard output     |
| `tool <subcommand> -h`                          | `0`    | standard output     |
| `tool` with no arguments, where one is required | `2`    | standard error      |
| `tool --no-such-flag`                           | `2`    | standard error      |

The pattern across the table is one rule seen from five angles: **help the caller asked for is a result; help the caller
needed is a diagnostic.** Where a request is explicit, the text is the payload and the run succeeded. Where the tool is
supplying help because the invocation was wrong, the text is a diagnostic and the run did not do the work.
