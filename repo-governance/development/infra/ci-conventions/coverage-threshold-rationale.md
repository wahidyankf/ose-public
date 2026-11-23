---
description: "Separates runtime code coverage from static scenario and adapter coverage"
when_to_use: "Use when assigning coverage work to a test or coverage target."
---

# Runtime and Static Coverage Responsibilities

`test:unit`, `test:integration`, and `test:e2e` execute tests. When a runtime layer measures code
coverage, its native instrumentation and threshold belong to that same runtime target.

`test:behaviour:coverage` has a different meaning: it statically validates whether tests cover the
canonical scenario/adapter contract. It must not start a test runner, invoke another runtime target,
or require a prior runtime report. It runs in `test:quick`, and only the real runs of the runtime
targets prove that a binding passes.

Never satisfy either responsibility with a no-op, hardcoded count, stale report, or exclusion that
leaves behaviour without an owning proof.

A Unit numeric exclusion is allowed only for a category: generated output, declarative configuration,
vendored code, or non-production code, named with its reason in the gating run's configuration. Code a
unit test cannot reach moves behind a port instead of being excluded. Broad path globs, mixed
core-logic exclusions, and code left to a higher layer without proof are coverage gaming.
