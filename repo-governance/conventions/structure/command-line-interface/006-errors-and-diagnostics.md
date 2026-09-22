---
description: >-
  Fixes the shape of a diagnostic message, what a tool may never put in one, and the four conditions a harness callback
  must satisfy together to be exempt from the interface rules.
when_to_use: >-
  Use when writing or reviewing an error message, or when building a program a harness invokes automatically rather than
  a person.
---

# Errors and Diagnostics

## The Shape of a Message

A diagnostic names the tool, locates the problem, and states what is wrong. The established coding standards for
command-line programs fix the forms:

```text
program: message
program:file:line: message
program:file:line:column: message
```

The tool's name comes first so that a message surfacing in a log, a hook, or a wrapped invocation is attributable
without knowing what ran. Where a position is known it is included, because a caller who has to search for the offending
line will search the wrong file sooner or later. Line and column numbers are 1-based.

The message states what is wrong, not what to do about it. Advice belongs in a following line where it is clearly
advice, so it cannot be mistaken for part of the diagnosis when a machine matches on the message.

## What a Diagnostic May Not Contain

- **A secret.** Not a token, a key, a password, or a connection string, whether the tool read it from a variable, a
  file, or an argument. A diagnostic reaches logs, transcripts, and issue trackers that the secret was never cleared
  for.
- **A caller's rejected input, where the tool's policy forbids it.** A tool handling sensitive input may decline to
  quote what it rejected. Such a tool still conforms; it identifies the element at fault by name or position instead.
- **A stack trace, by default.** Traces appear only behind a documented flag or environment variable.
- **Escape sequences, when escapes are suppressed.** The suppression covers the whole escape surface, diagnostics
  included.

## The Harness Callback Exemption

One class of program is exempt from most of this contract, and the exemption is stated explicitly so it cannot be
claimed by anything else.

A program invoked automatically by a harness — a hook, a callback, an event capture — may be required to disturb nothing
at all: to write to neither stream and always exit `0`, because a non-zero status or an unexpected line would interrupt
the work the harness was doing on someone's behalf.

That is a legitimate design, and it is also indistinguishable from a broken tool unless it is declared. A program claims
this exemption only when **all four** of these hold together:

1. It is invoked by a harness or an automated callback, never by a person or a script as a product surface.
2. Its failure must not interrupt the harness's own work.
3. It writes nothing to standard output and nothing to standard error on any path, including its failure paths.
4. It records its own failures somewhere a maintainer can find later, so silence never means the failure vanished.

Condition four is what separates an exemption from a defect. A program that swallows its errors and records nothing has
not been made safe for a harness; it has been made undiagnosable. A tool meeting the first three and not the fourth is
not exempt.

The exemption is not enforceable by an automated runner, because a conforming exempt program looks exactly like a tool
that has stopped working. It is bound by review, and an adopter records which of its own programs claim it.
