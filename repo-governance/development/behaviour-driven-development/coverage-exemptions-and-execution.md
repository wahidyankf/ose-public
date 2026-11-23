---
description: "Static coverage targets, higher-layer exemptions, test:quick composition, and runtime execution surfaces"
when_to_use: "Use when defining BDD coverage targets, documenting an Integration/E2E exemption, or selecting a runtime execution surface."
---

# BDD Coverage, Exemptions, and Execution

This document extends the canonical
[BDD standard](../behaviour-driven-development.md) with its coverage and execution contract.

## Higher-Layer Exemptions

Implement Integration and E2E by default whenever their boundaries can express the scenario. A
scenario may carry `@integration-exempt`, `@e2e-exempt`, or both. Each tag requires its own comment
immediately above that tag:

```gherkin
# Exemption(integration): pure in-process calculation has no real local-resource boundary; alternative-proof: finance:test:unit / Calculates fee from amount
@integration-exempt
# Exemption(e2e): library exposes no public browser, HTTP, or process boundary; alternative-proof: finance:test:unit / Calculates fee from amount
@e2e-exempt
Scenario: Calculates fee from amount
  Given an amount of 100 USD
  When the fee is calculated at 2 percent
  Then the fee should be 2 USD
```

Review two exemptions independently. The reason must describe why the layer boundary fundamentally
cannot express the scenario. Difficulty, runtime, speed, flakiness, cost, expense, `TODO`, missing
implementation, and unfinished work are invalid reasons. The named unexempted target and scenario
must substantively prove the omitted concern, and Unit must still prove the behaviour. Never place
an exemption on Feature, Rule, or Background; never use `@unit-exempt`, `@no-*`, positive
layer-selection tags, or `@wip`; never exempt every available proof.

## Runtime and Static Coverage Targets

- `test:unit`, `test:integration`, and `test:e2e` execute only their named runtime layer.
- `test:behaviour:coverage` validates the corpus statically. It must not execute or depend directly or
  transitively on any runtime `test:*` target.
- `test:quick` runs `typecheck`, `lint`, `test:unit`, and `test:behaviour:coverage`. A dedicated E2E
  project omits `test:unit`. Integration and E2E runtime must never be reachable from `test:quick`.

Every behaviour-owning source project's `test:unit` collects native line coverage and hard-fails
below 99%. A dedicated E2E project does not own Unit and never waives its source owner's threshold.
Unit exclusions are allowed only for a named category: generated output, declarative configuration,
vendored code, or non-production code such as tests, fixtures, and test-support doubles. The exclusion
sits in the gating run's configuration and is named with its reason in the project README. Code a
hermetic unit test cannot reach moves behind a port instead of being excluded or left to a higher
layer. Broad path globs, mixed core-logic exclusions, and code without a port are forbidden.

Static coverage proves exact recursive corpus membership, complete applicable adapters,
exactly-one bindings, no unused bindings, valid exemption syntax, and mandatory Unit proof. It does
not prove semantic implementation or execute tests. Runtime code-coverage instrumentation and its
threshold belong to the corresponding runtime test target, never `test:behaviour:coverage`.
An exempt scenario's steps must have no bindings in the exempt adapter's files, and the files'
`describeFeature` must exclude that adapter's tag — otherwise the static unused-binding check
and the runtime uncalled-scenario check fail against each other.

## Execution Surfaces

Pre-commit runs staged formatting only, and pre-push runs only the leak scan. Affected `test:quick` and
`test:integration` targets run in the PR quality gate. The PR quality gate may use explicitly bounded
project parallelism suitable for their shard, while each project's quick target preserves its ordered
composition. Neither hook runs Integration or E2E runtime, and no pull request runs E2E runtime. During
development and review, run impacted Integration/E2E scenarios manually; widen uncertainty to the affected
project, not automatically to the whole workspace. Scheduled and manually dispatched full-quality CI runs
the static behaviour check, then complete Integration suites, then complete unfiltered E2E suites.
The full E2E suite belongs to that scheduled CI workflow
(`.github/workflows/non-product-full-quality.yml` CRON) by default in every repository that
has E2E; keep local E2E selective to the touched flow. Followed: the scheduled workflow runs
unfiltered E2E while local runs name a touched flow. Violated: a local unfiltered E2E run, or
no scheduled full-E2E run where E2E targets exist.
All paths fail closed.
