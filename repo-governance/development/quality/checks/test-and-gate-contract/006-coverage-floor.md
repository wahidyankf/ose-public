---
description: >-
  Holds rule C15 of the test and gate contract: at least 99% unit-level coverage per project and runtime, read from the
  unit run with its BDD unit bindings only, never combined across levels, with no exclusion list beyond named
  categories.
when_to_use: >-
  Use when setting up or checking a coverage gate, deciding whether code may leave the measured set, choosing a coverage
  instrument, or when code is reachable only from integration or end-to-end tests.
---

# Coverage Floor

A coverage number is evidence about one run. Mixed with numbers from other runs, or measured over a hand-picked list, it
reads high while untested behaviour stays where it was. What a number may measure is owned by
[Meaningful Coverage](../../testing/meaningful-coverage.md); this module fixes the floor every project meets.

## C15 Coverage Floor

Unit-level coverage, with the BDD unit-level run counted, is at least 99% for every project and every runtime
separately, never averaged across runtimes. Four properties hold everywhere:

1. **The BDD unit run counts.** The gating unit run executes plain unit tests and BDD unit bindings together. That run
   produces one report, and the gate reads it.
2. **Higher floors stay.** A project that already holds a stronger floor, such as 100% with branch coverage, keeps it.
   No adoption lowers any floor.
3. **Levels are never combined.** The floor is read from the unit run only. Integration and end-to-end coverage are
   never added to it, because a combined number is misleading and those suites are not necessarily complete. Coverage
   numbers from different levels are never merged.
4. **No exclusion lists.** An exclusion is allowed only when it falls in a category: generated output, declarative
   configuration, vendored code, or non-production code such as tests, fixtures, and test-support doubles. It sits in
   the gating run's configuration and is named with its reason in the project README.

Empty, stale, or partial reports fail: a report that measured nothing is not a pass.

## Unreachable Code Moves Behind a Port

Code a hermetic unit test cannot reach is not excluded and not left to integration coverage. It is moved behind a port
until a unit test backed by a [test double](../../testing/test-doubles.md) reaches it, following [Hexagonal
Architecture](../../../pattern/hexagonal-architecture.md) and [Functional Core, Imperative
Shell](../../../pattern/best-practices/functional-core-imperative-shell.md). With adapters kept thin behind ports, 99%
is reachable at the unit level.

## Choosing an Instrument

The floor applies to everything a reliable instrument can measure. To choose an instrument:

1. List the stack's candidate instruments from its adopted stack standard, or from the tool the project already runs.
2. Run it over the existing unit suite, and record whether executed lines and branches are attributed correctly. A
   report that is empty, or that contradicts a line known to run, marks the instrument unreliable.
3. A reliable instrument makes the code measurable, and the code reaches 99%. With no reliable instrument the code sits
   outside numeric coverage, and the stack's native verification stands in its place, recorded in the repository.

Code that only a host application runs, with no way to load it in a test process, and declarative infrastructure follow
step 3's second branch. Code a repository declares out of scope as practice code is outside the standard by the scope
rule of [Conformance Record](007-conformance-record.md), not by a coverage exception.

## Coverage Inventory

Each repository keeps a coverage inventory with one row per project and runtime: its authored production paths, the
instrument, the gating run, the current figure, the floor, and the category of every excluded path. A row without a
category for an excluded path is a finding.
