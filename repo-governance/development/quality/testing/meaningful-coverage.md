---
description: >-
  Limits numeric coverage to authored executable production code a reliable instrument measures, keeps generated,
  declarative, and vendored code outside it, and gives end-to-end and infrastructure code no line target.
when_to_use: >-
  Use when configuring coverage measurement, deciding what a coverage report may include, or deciding whether a layer or
  stack carries a numeric coverage target at all.
---

# Meaningful Coverage

A coverage number is evidence only about the code it measured, and only when the instrument measured it correctly.
Counted over generated files or configuration, or by a tool that misreports, it moves while the untested behaviour stays
exactly where it was.

This standard implements Evidence Over Assertion and
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md). It decides what coverage may measure. Whether a
floor exists is recorded under [Layers and Adapters](../../behaviour-driven-development.md). Which run
gates coverage, and how each exclusion is named, belong to [Test Boundaries and Gates](../../behaviour-driven-development.md). A
measured figure is read as [Trustworthy Measurement](../../practice/trustworthy-measurement.md) requires.

## What a Number May Measure

Numeric coverage applies only where both hold:

- a reliable instrument measures the code, attributing executed lines and branches correctly for that language and
  runtime; and
- the code is authored, executable, production code.

When either fails, a number is not evidence, and no number is reported.

## Outside Numeric Coverage

| Code                       | Why it is outside                                                        |
| -------------------------- | ------------------------------------------------------------------------ |
| generated output           | the generator's own tests cover it; its lines inflate or dilute a figure |
| declarative configuration  | nothing executes line by line; native validation checks it               |
| external and vendored code | its owner tests it, and this repository cannot change it                 |

Each exclusion sits in the gating run's configuration and is named, with its reason, in the project's README.

## Layers

- **Unit.** The primary measurement for instrumentable production code.
- **Integration.** Measured separately only when it exercises distinct integration-specific executable code, such as an
  adapter a unit test cannot reach. Otherwise a second figure counts the same lines twice.
- **End-to-end.** Proves public journeys and their failure paths. It carries no line-coverage target.

## No Surrogate Metric

Where no reliable instrument exists, such as declarative infrastructure or a shell dialect whose coverage tool
misreports, the stack's native verification stands in its place: validation, lint, native tests, plan review, and
idempotence runs where they apply. Never invent a surrogate number, such as resources touched or scripts with a test, to
fill a coverage slot, and never define a coverage target that measures nothing, as
[Task Runner Target Standards](../../infra/nx-targets.md) forbids. The stack standard names its
native verification.

## Adoption Never Lowers a Floor

A repository that already holds a floor keeps it. Adopting this standard narrows what a number may count, never how high
it must be, and reclassifying code as outside coverage to clear a floor is widening an exclusion, which
Software Quality Enforcement treats as a change to a gate.

## Enforcement

Unenforced by decision: whether an instrument is reliable and whether code is authored production code are review
judgements that no validator makes well. The adopter's coverage configuration carries the exclusions, and review checks
each one against this scope.
