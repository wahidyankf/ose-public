---
description: >-
  Fixes the interface a command-line tool presents to its callers — one closed exit vocabulary, stream discipline,
  machine-readable output, argument syntax, and terminal behaviour — with precision carried in the body rather than in
  the exit number.
when_to_use: >-
  Use when building, reviewing, or changing any command-line entry point, and before adding a new exit status, output
  mode, or environment variable to one.
---

# Command-Line Interface

A command-line tool has two audiences that cannot both be served by the same channel. A person reads what it prints; a
script branches on what it returns. The interface is what makes the second audience possible, and it is a contract: once
a caller branches on a status, changing what that status means breaks the caller silently, at a distance, and usually in
production rather than in review.

## The Two Layers

The contract has exactly two layers, and the split is the whole design.

| Layer                   | Carries                               | Size                      |
| ----------------------- | ------------------------------------- | ------------------------- |
| The process exit status | What class of thing happened          | Small, closed, universal  |
| A machine-readable body | Exactly what happened, and about what | Open, namespaced, growing |

An integer is a poor place to put a taxonomy. It has no room for context, no way to name the thing at fault, and no way
to grow without either colliding with an existing meaning or drifting past the range anyone checks. So the number
answers one question — may the caller trust the result? — and everything else moves into a body the caller can parse.

This is the arrangement network protocols settled on long ago: a small status class, then a structured payload. The
alternative, a wide numeric vocabulary where each number names a specific failure, has been tried. A legacy Unix header
reserved a block of such codes in the 1980s; its upstream now marks the interface deprecated and records in its own
defect list that "the choice of an appropriate exit value is often ambiguous". That ambiguity is not a flaw in the
reader. It is what happens when one integer is asked to do two jobs.

## Tiers

Not every tool owes every rule, so the convention binds at two tiers, and an adopter records which of its own tools sits
at which.

- **The floor tier** binds anything invoked from a shell, including wrappers, hooks, and shipped scripts. It owes the
  exit vocabulary, stream discipline, and the closed-pipe and signal rules.
- **The full bar** binds a tool a person or a script calls directly as a product surface. It owes the floor plus
  machine-readable output, argument syntax, diagnostics, and terminal behaviour.

A tool that starts other programs additionally owes the supervisor statuses. One that starts none never returns them.

## Modules

1. [The Exit Status Contract](command-line-interface/001-exit-status-contract.md)
2. [Stream Discipline](command-line-interface/002-stream-discipline.md)
3. [Standard Input](command-line-interface/003-standard-input.md)
4. [Machine-Readable Output](command-line-interface/004-machine-readable-output.md)
5. [Arguments and Flags](command-line-interface/005-arguments-and-flags.md)
6. [Errors and Diagnostics](command-line-interface/006-errors-and-diagnostics.md)
7. [Terminal and Environment](command-line-interface/007-terminal-and-environment.md)
8. [Help and Discovery](command-line-interface/008-help-and-discovery.md)
9. [Tiers Here](command-line-interface/009-tiers-here.md)

## What This Convention Does Not Decide

It does not choose a subcommand tree, a flag vocabulary beyond the reserved names, an output schema, or a configuration
format. Those belong to the tool. The convention fixes only the surface a caller must be able to rely on without reading
the tool's source.

It also does not promise that conformance is free. Every runtime breaks some part of this contract by default, in a
different place and for a different reason, so a conforming tool overrides its runtime rather than inheriting from it.
Each module names the defaults it has to correct.

## Tiers Here

This repository's own tier record, and how FERRET capture reaches it, is in
[Tiers Here](command-line-interface/009-tiers-here.md).
