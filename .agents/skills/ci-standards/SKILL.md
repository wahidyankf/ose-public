---
name: ci-standards
description: CI/CD standards knowledge for project-role targets, static BDD coverage, runtime boundaries, hooks, and scheduled tests
context: inline
---

# CI Standards

Use the [BDD standard](../../../repo-governance/development/behaviour-driven-development.md),
[Nx targets](../../../repo-governance/development/infra/nx-targets.md), and
[CI conventions](../../../repo-governance/development/infra/ci-conventions.md) as canonical sources.

## Project-Role Target Contract

- Every behaviour owner has real `test:unit`, `test:coverage:unit`,
  `test:coverage:behaviour`, and `test:quick` targets.
- `test:unit` collects native line coverage and hard-fails below 99%; dedicated E2E projects do not
  own Unit and never waive their source owner's threshold.
- Add `test:integration` plus `test:coverage:integration` only for an owned real local-resource
  boundary.
- Add E2E runtime/static coverage only for a public boundary. A dedicated E2E project implements its
  owner's corpus and does not invent Unit/Integration targets.
- Omit inapplicable targets. Echo/no-op/sentinel targets and compatibility aliases are violations.
- `test:coverage` aggregates applicable static coverage validators. Every applicable validator is
  mandatory in `test:quick`.

## Boundary and Execution Contract

Unit replaces every OS-facing dependency through injection; a shell script or harness plugin
subject follows
[Script-Subject Unit Proof](../../../repo-governance/development/behaviour-driven-development/script-subject-unit-proof.md)
instead. Integration may use isolated local
resources/processes plus an allowlisted loopback socket it owns, never an external network. E2E observes a real
public browser, HTTP, or process boundary with synthetic isolated data.

Runtime `test:*` targets execute tests. Static `test:coverage:*` targets never execute or depend on
runtime tests. Pre-commit runs staged deterministic checks only. Pre-push runs affected quick
targets with `--parallel=1`; PR/main may use explicitly bounded shard parallelism. Neither runs
Integration/E2E runtime. Development/review runs impacted higher-layer scenarios manually;
scheduled or manually dispatched full-quality CI runs all static validators, complete Integration,
then complete unfiltered E2E.

An explicitly enumerated boundary adapter may leave the Unit denominator only when it is wholly a
resource, process, generated-code, or static-data boundary and named Integration or E2E runtime
proof exercises it. Keep exclusions to named files or narrow functions. Broad path globs, mixed
core-logic exclusions, and boundary code without higher-layer proof are coverage gaming.

## Gherkin Contract

All owners use one recursively discovered `behaviours/` corpus. Every active scenario has Unit
proof. Applicable Integration/E2E requires implementation or an independently valid
boundary-mismatch exemption. Both exemptions may coexist. Each tag has its own immediately
preceding `# Exemption(layer): <boundary mismatch>; alternative-proof: <Nx target> / <scenario>`
comment and names substantive proof in an unexempted layer; Unit remains mandatory. Difficulty,
runtime/speed, flakiness, cost/expense, `TODO`, missing implementation, and unfinished work are
invalid reasons. `@wip` and positive layer-selection tags are forbidden. Static coverage never replaces the
[semantic implementation review](../../../repo-governance/workflows/gherkin-implementation-review.md).

## Lifecycle Handoff

When a CI quality gate supplies `delegated-gate-ids` and evidence, omit only exact delegated
predicates. Preserve pending evidence and invalidate only entries whose registered scope intersects
fixer changes.
