---
description: >-
  Fixes when a tool may read standard input, how a lone dash selects it, and the rule that a tool never blocks or
  prompts when nothing can answer.
when_to_use: >-
  Use when a command accepts input from a file or a pipe, or when adding a confirmation prompt.
---

# Standard Input

## Never Read What Was Not Asked For

A tool reads standard input only when an argument or flag selected it. Invoked with no such selection, it does its work
and exits without touching the stream.

The failure this prevents is specific and unpleasant to diagnose: a tool that reads standard input unconditionally
appears to hang when run interactively with no arguments. Nothing is wrong, nothing is printed, and the caller has no
way to know whether the tool is working or waiting. In a script or a hook, the same tool consumes input another command
was meant to receive.

## A Lone Dash Names Standard Input

Where a command accepts a file argument, `-` selects standard input in its place. This is the conventional spelling and
a tool that invents another one makes itself harder to compose for no gain.

A tool reading standard input reports a read failure rather than absorbing it. Treating a failed read as an empty
document is the same class of mistake as reporting a crash as a clean run: the caller is told there was nothing to find,
when the truth is that nobody looked.

## Prompting Requires a Terminal

A tool prompts only when standard input is a terminal. When it is not, a prompt cannot be answered, and a tool that
prompts anyway either hangs until something kills it or consumes a byte of piped data as an answer nobody gave.

So a command that would prompt, run without a terminal and without an explicit confirming flag, **refuses**: it exits
non-zero, names the flag that would have let it proceed, and performs no mutation. Refusing is the safe direction. The
caller learns exactly what to add, and nothing irreversible happens on the strength of a default.

A tool that offers a way to suppress all prompting honours it as a promise never to ask, not as a promise to assume yes.
Suppressed prompting and assumed consent are different requests, and a flag that conflates them turns a caution into a
hazard.

## The Rules Together

| Condition                                               | Required behaviour                           |
| ------------------------------------------------------- | -------------------------------------------- |
| No argument selected standard input                     | Do not read it; do not wait on it            |
| The argument `-` was given for a file                   | Read standard input in place of that file    |
| A read from standard input failed                       | Report the failure; never report empty input |
| A prompt is needed and standard input is not a terminal | Refuse, naming the flag that would proceed   |
| Prompting is suppressed by flag                         | Never ask; do not assume the affirmative     |
