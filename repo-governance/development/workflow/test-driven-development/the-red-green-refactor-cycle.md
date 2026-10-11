---
description: The three-step Red/Green/Refactor loop every code change follows under TDD.
when_to_use: Use as the canonical definition of the Red-Green-Refactor loop before implementing any code change.
---

# The Red-Green-Refactor Cycle

Every code change follows this loop:

1. **Red** — Write a failing test that captures the desired behaviour. Run it and confirm it fails
   for the right reason (not due to a syntax error, missing import, or wrong test setup). A test
   that fails for the wrong reason is not a useful test.
2. **Green** — Write the minimum production code that makes the failing test pass without a
   hardcoded outcome, literal-success sentinel, or production bypass. Do not add behaviour beyond
   what the scenario requires.
3. **Refactor** — With the focused tests green and no known failing checks, improve the implementation:
   remove duplication, improve names, extract functions, apply clean-code principles. The focused
   regression selection must remain green after every refactor step. A failure introduced by
   refactoring is a bug, not a deliberate red.

Repeat the cycle for the next behaviour and applicable adapter.

## Focused Runs and Regression Gates

Reason: keep local feedback short without reducing test-first proof or delivery verification, following
the [TDD principles](./principles-and-conventions-implemented.md).

- For each local RED/GREEN cycle, run only its named case or the smallest named selection required
  to exercise that behaviour; do not run the full owning suite for each item.
- After each refactor, run the focused regression selection covering the changed behaviour and its
  affected shared boundary; do not substitute a full-suite run for each item's focused proof.
- At phase gates and before PR creation, run the full affected-project regression checks required
  by the phase and existing delivery contract. Passing evidence may serve both boundaries while
  its tested scope remains unchanged.
- Record the executed case identities and a nonzero executed-test count for every filtered cycle run.
  Zero tests, unmatched filters, and a cached result that did not execute the intended cases are not proof.

Use runner-level case/file filters for local cycles. A filtered run must not enforce whole-project
coverage over code it deliberately does not execute: do not append a case filter to an Nx Unit target
that enforces full-project coverage. Leave that target and its coverage threshold unchanged; use a
separate focused runner invocation without whole-project coverage. Preserve required build/codegen,
real-resource setup, and test ownership/cleanup guards.

Unit and every applicable higher layer still start red, per [Required Test Layers](./picking-the-right-level.md).
Full regression checks include the owning quick gate and the applicable Integration/E2E runtime
checks the phase requires. Existing CI, hook, coverage, and scheduled-suite contracts remain unchanged.

**Followed observations:** RED executes the named cases and fails on the intended behaviour assertion;
GREEN executes those same cases and passes; REFACTOR executes the relevant regression selection and
passes; phase/pre-PR evidence records passing unfiltered required checks and positive execution counts.

**Violated observations:** a per-item unfiltered invocation positively executes unrelated cases; a
refactor run omits a named affected-boundary case; a boundary record explicitly substitutes filtered
case proof for its required full-project gate; or runner output explicitly reports zero matched tests.

**Enforcement disposition — unenforced by decision:** selecting the smallest meaningful set and
interpreting runner-specific evidence require behaviour/boundary context. Plan and execution review
inspect commands, case identities, counts, and boundary records. Existing CI does not prove local
execution order or selection; no new scanner or gate coverage is claimed.

## A new harness needs its own red

Step 1 covers the test case. It does not cover the **harness** the case runs inside — a new E2E
driver, a fixture that starts a real process, a runner wired up after the code already worked.
There the loop has to be run deliberately in reverse: mutate the production code so the assertion
must fail, watch the suite go red, then revert. A harness that has never been observed red is an
untested claim, and the ways it can be permanently green are not exotic — asserting against a
process it did not start, resolving a stale build, or binding zero scenarios all produce a
confident pass. Capture the red run as the evidence, not the green one; the green run is what a
broken harness also produces.

**Enforcement**: **unenforced by decision.** Nothing distinguishes a harness that was driven red
from one that never was — the artefact of a demonstrated red is a deleted mutation. The nearest
mechanical support is the behaviour-coverage validator, which fails a suite binding zero scenarios;
the rest stays with the author and reviewer.
