---
description: >-
  Holds rule C7 of the test and gate contract: a pull-request check is scoped to affected projects only when edits
  elsewhere cannot change its result, with a classification table of project-scoped, changed-file, and global checks.
when_to_use: >-
  Use when deciding whether a pull-request check may run only on affected projects or changed files, or when a check
  passed on a change that broke an unaffected project.
---

# Pull-Request Scope

Scoping a check to what a change touches saves runner time, and it is wrong exactly when an edit in one place breaks a
result somewhere else. The rule therefore asks what the result depends on, not what the change touched.

## C7 Scope by Dependence

A pull-request check may be scoped to affected projects only if its result cannot change because of edits outside those
projects; otherwise it runs globally. A per-file check that reads only the changed file may run on changed files. A
check with both a per-file part and a cross-file part counts as global.

Each repository records the scope of every check in its gate inventory, per
[Conformance Record](007-conformance-record.md).

## Classification

| Check                                        | Scope         | Why                                                |
| -------------------------------------------- | ------------- | -------------------------------------------------- |
| typecheck                                    | affected      | reads one project and the dependencies it declares |
| lint                                         | affected      | reads one project's sources                        |
| unit and BDD unit tests, with their coverage | affected      | hermetic; nothing outside the project reaches them |
| `test:integration`                           | affected      | runs one project's integration suite               |
| formatting, line length, single-file checks  | changed files | the result reads only the changed file             |
| internal-link and anchor checks              | global        | deleting a target breaks a link in another project |
| README-index and directory-map checks        | global        | a move in one directory orphans or ghosts an entry |
| registry and wiring validation               | global        | a surface's caller can sit anywhere in the tree    |
| harness-adapter parity                       | global        | one source regenerates adapters in many places     |
| `test:behaviour:coverage`                    | global        | a binding and its scenario can sit in any project  |
| the leak scan                                | global        | it screens the tree, the range, and the messages   |
| any check with a cross-file part             | global        | an edit outside the change can flip its result     |

"Affected" is derived from the repository's dependency graph or changed paths, so a change to a shared library also runs
the checks of every project that depends on it.

A slow global check is split into parallel jobs, per [Surface Placement](002-surface-placement.md), never narrowed: a
narrowed scope trades a slow pass for a wrong one.
