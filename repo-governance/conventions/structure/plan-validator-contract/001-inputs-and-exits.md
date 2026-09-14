---
description: >-
  Fixes what a plan-structure validator reads, the diagnostic line format, the sort order, and the four exit classes it
  may return.
when_to_use: >-
  Use when implementing a validator's entry point, output, or exit behaviour.
---

# Inputs and Exit Classes

## Input

One repository root. The validator reads the `plans/` tree beneath it and nothing else.

It never reaches outside the repository, never consults the network, and never depends on which directory it was invoked
from. Two runs from different working directories against the same root produce identical output.

## Diagnostic Format

```text
<repository-relative-path>:<line>:<column> <rule-id> <field> <message>
```

- the path is relative to the repository root, never absolute;
- `line` and `column` are 1-based, and are `1:1` where a finding is about a path rather than a position in a file;
- `field` names the element at fault — a document name, an ordinal, an identifier — or `-` when none applies;
- the message is fixed per rule and states what is wrong, not what to do about it.

## Sort Order

Diagnostics sort by path, then line, then column, then rule identifier, then field. Never by discovery order, which
depends on directory traversal and therefore on the filesystem.

## Determinism

Repeated runs over unchanged input produce byte-identical stdout, byte-identical stderr, and the same exit class. Two
implementations run over the same input produce the same diagnostics in the same order.

A validator that is only usually deterministic cannot be used as a gate: the first spurious difference teaches everyone
to re-run it until it agrees.

## Exit Classes

| Exit | Means                           |
| ---: | ------------------------------- |
|    0 | no findings                     |
|    1 | one or more findings            |
|    2 | invalid configuration or usage  |
|    3 | dependency or execution failure |

`2` and `3` are not findings and must never be reported as a clean run. A validator that could not run has not validated
anything, and collapsing that into `0` is the failure mode this table exists to prevent.

`1` means the validator worked correctly. Findings are its output, not its error.
