---
description: >-
  Holds rule C13 of the test and gate contract: one observable-behaviour corpus per owner with runtime code, the
  scenario binding convention, exemption semantics with no unit exemption, and the spec review with its inventory.
when_to_use: >-
  Use when writing or binding a scenario, proposing an exemption, adding a behaviour corpus to a project, or reviewing
  an existing corpus before binding work.
---

# Behaviour Corpus

## C13 Behaviour Corpus and Bindings

Every owner with runtime code, library projects included, keeps one `.feature` corpus under `specs/`, in a form of the
[Specification Tree](../../../../conventions/structure/specs-directory-structure.md): `specs/behaviours/` for a single
product, `specs/apps/<area>/<app>/behaviours/` for several apps, and `specs/libs/<lib>/behaviours/` for a library inside
such a repository. A feature file outside the corpus and outside a declared fixtures directory is a defect.

Scenarios state what a user, or a library's caller through its public API, can observe. Every scenario is covered at the
unit, integration, and end-to-end level unless validly exempt; the unit level is never exempt. A test covers a scenario
by carrying one binding line, written only after the spec review.

## Binding Convention

One convention for every stack: a reference line inside a comment, in the host language's comment syntax:

```text
@scenario <feature-path>: <scenario name>
```

- `<feature-path>` is the repository-relative path, ending `.feature` or `.feature.md`. The parser takes the path up to
  the first such extension, then a colon, then the rest of the line, trimmed, as the scenario name verbatim.
- A scenario outline is one scenario; the stack's runner proves each row.
- The level comes from the test file's location, through declared level globs, never from the line.
- Renaming a scenario updates its references in the same change.
- `<feature-path>: *` covers every scenario of that file. It is allowed only for a runner that executes whole feature
  files and fails on an undefined or ambiguous step itself, and only in a test file a declared whole-file glob matches;
  that list is empty by default. Hand-written per-scenario tests reference each scenario by name.

## Exemptions

An exemption sits on one scenario, with this comment directly above its tag, per
[Bindings and Exemptions](../../../behaviour-driven-development/coverage-exemptions-and-execution.md):

```text
# Exemption(<level>): <reason>; alternative-proof: <target>
```

- `@integration-exempt` and `@e2e-exempt` mean the scenario needs no binding at that level, given a valid comment.
- A tag without a valid reason, with an empty reason or target, or on a `Feature`, `Rule`, or `Background` fails.
  Difficulty, runtime, flakiness, cost, and unfinished work are never reasons.
- There is no `@unit-exempt`; a tag of that name is unknown and fails. Every scenario has a unit binding, and that run
  counts toward the coverage floor.
- A stale exemption fails with "stale exemption — remove the tag" when a binding exists at the exempted level.
- A reason concerns reach: no boundary exists at that level. "Not user-visible" and "internal" are never reasons.

## The Static Check

`test:behaviour:coverage` reads text and runs no test. The recommended adapter is RHINO's `behaviour coverage validate`,
whose rules B01 to B09 enforce this module; `--rules <id,...>` runs only the named rules.

## Spec Review

Before binding work, each existing scenario takes the first class that fits:

| Class   | When                                                   | Action                                    |
| ------- | ------------------------------------------------------ | ----------------------------------------- |
| REMOVE  | an internal step with no observable effect             | delete, with a passing unit test as proof |
| REWRITE | observable behaviour in internal terms                 | rewrite in user or caller language        |
| MERGE   | several scenarios describe one observable behaviour    | merge into one                            |
| SPLIT   | one scenario asserts independent observable behaviours | split so each stands alone                |
| KEEP    | one observable behaviour in user or caller terms       | leave unchanged                           |

An observable behaviour with no scenario is ADD, and every one is added. REMOVE follows
`Deletion With Proof`. The review ends with rules B04 to B08 passing; all rules run once
bindings exist.

### Visible-Behaviour Inventory

Each project lists every behaviour a user or caller can observe, from every source: user documentation; command-line
help and subcommands; HTTP routes and API contracts; public library exports; interface routes and pages; editor
commands, keymaps, and options; user-set configuration and environment variables; and user-facing errors and exit
statuses. Each source is recorded as read or not applicable, with the reason. Each row's ID appears in a scenario as
`# Behaviour: <id>`, and a check listing IDs without one lists none.
