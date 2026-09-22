---
description: >-
  Describes the command-line interface assertion manifest, how an adopting repository owns its copy, and why this
  corpus carries no digest, pin check, or drift ledger.
when_to_use: >-
  Use before building a conformance runner against this corpus, or before changing an assertion in it.
---

# Command-Line Interface Conformance Corpus

`assertions.json` is the machine-readable form of the `command-line-interface` structure convention published in the
governance catalog. One assertion per obligation, each with the invocation that exercises it, the observation that
satisfies it, the source it rests on, and its verification status.

This copy deliberately names the convention rather than linking it: the convention is not adopted into this repository
yet, and a link to a document that is not here would be a broken link rather than a reference. When it is adopted, the
link replaces this paragraph.

## The Copy Is Owned Locally

A repository adopting this corpus **owns its copy**. It may add assertions for its own tools, remove ones that do not
apply, and change what it measures, without asking and without reporting back.

That is a deliberate choice and it has a cost worth naming. There is **no digest, no pin check, and no drift ledger**
for this corpus. Nothing detects that a copy has diverged from the catalog's, and nothing can, because no mechanism
here records where the copies are.

The reason is that the alternative was worse. A synchronized corpus needs an owner who resolves every conflict between
a local need and the shared text, and needs that owner on the day a repository's tool has a legitimate reason to
measure something differently. Without one, the pin check becomes a thing people route around; with one, adopting a
single assertion becomes a negotiation. Local ownership makes each repository responsible for its own conformance,
which is where the knowledge of its tools actually is.

The consequence to plan for: a correction to an assertion in this catalog reaches an existing copy only if someone
carries it there. Verify a source **before** publishing an assertion that rests on it, not after.

## Status Is Part of Each Assertion

| Status       | Means                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `verified`   | The source was read directly; the assertion may gate a tool             |
| `unverified` | The source could not be reached; guidance only, and it gates nothing    |
| `dropped`    | Verification contradicted the assertion; it is removed rather than kept |

A runner **refuses to gate on anything not marked `verified`**. This is the corpus's one hard rule, and it exists
because an assertion that cannot be traced to a source is a preference being enforced as a standard.

## Exemption Is a Condition, Not an Override

Every assertion carries `applies_to`. A program is skipped by an assertion when its declared capabilities or classes
do not match — not because a repository listed it somewhere as excused.

The difference matters. A condition is stated once, applies everywhere, and is visible in the assertion itself. An
override list grows quietly, is invisible from the assertion it defeats, and eventually explains why nothing fails.
There is no override mechanism in this corpus and none is to be added.

A program declares its capabilities from the `capabilities` list and its class from `classes`. The
`harness-callback` class is the exemption the convention names: a program invoked automatically that must disturb
nothing. Two assertions apply to it and to nothing else — that it stays silent on every path, and that it records its
own failures somewhere a maintainer can find them.

## Not Formatted, Not Linted

This tree is excluded from the repository's format and lint gates. Nothing rewrites these bytes, so they are kept
correct by hand and by the runner that reads them.
