---
title: "Living Documentation Standards"
description: OSE Platform standards for executable specifications and documentation dashboards
category: explanation
subcategory: development
tags:
  - bdd
  - living-documentation
  - automation
principles:
  - automation-over-manual
  - documentation-first
  - reproducibility
created: 2026-02-09
---

# Living Documentation Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding BDD By Example](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/development/behavior-driven-development-bdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for maintaining living documentation through executable scenarios.

This page applies the
[canonical OSE BDD contract](../../../../../repo-governance/development/behaviour-driven-development.md).
Every active scenario has mandatory Unit proof and must not use `@pending` or `@wip`.

## REQUIRED: Scenario Proof Runs on the Correct CI Surface

**REQUIRED**: Pull-request and main gates run affected `test:quick`: Unit runtime with its 99% line
gate plus every applicable static `test:coverage:*` validator. Complete Integration and E2E runtime
stay outside these fast gates and run only in scheduled or manually dispatched full-quality CI.

**REQUIRED**: A failing Unit scenario or static binding validator blocks merge to main. A failing
Integration or E2E scenario fails its scheduled/manual full-quality run and blocks any downstream
promotion owned by that workflow.

```yaml
# .github/workflows/bdd-tests.yml
name: BDD Scenarios

on:
  pull_request:
    branches: [main]

jobs:
  bdd-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit scenarios and static BDD coverage
        run: npm exec nx -- affected -t test:quick --parallel=1
```

Run the repository's
[Gherkin implementation review](../../../../../repo-governance/workflows/quality/gherkin-implementation-review.md)
after materially changing a feature, adapter, exemption, or coverage mechanism. It is a semantic
review workflow, not a package script.

## REQUIRED: Update Scenarios with Requirements

**REQUIRED**: When requirements change, scenarios MUST be updated first.

**Workflow:**

1. Requirements change → Update scenarios
2. Scenarios fail (Red)
3. Update implementation
4. Scenarios pass (Green)

**Example**: Nisab threshold changes from 85g to 87.48g

```text
# OLD (outdated)
Scenario: Wealth exceeds Nisab
  Given wealth of 100 grams of gold
  And Nisab threshold of 85 grams  # Wrong!

# NEW (updated first)
Scenario: Wealth exceeds Nisab
  Given wealth of 100 grams of gold
  And Nisab threshold of 87.48 grams  # Corrected
```

## REQUIRED: Documentation Dashboard

**REQUIRED**: Generate living documentation dashboard showing scenario status.

**Evidence sources:**

- Native Unit, Integration, and E2E reporters owned by each project's Nx runtime targets
- Static `test:coverage:*` validators and their aggregate `test:coverage` target
- The fail-closed Gherkin implementation-review matrix

**Dashboard MUST show:**

- Total scenarios (passed/failed/explicitly exempt by applicable higher layer)
- Feature implementation percentage, which must be 100% for active Unit proof
- Scenario execution trends

## Scenario Organization

**REQUIRED**: Group scenarios by bounded context.

```text
specs/apps/finance/zakat/behaviours/
  calculation/zakat-calculation.feature
  calculation/nisab-validation.feature

specs/apps/finance/donation/behaviours/
  campaign/campaign-management.feature
  donation/donation-processing.feature
```

## OSE Platform Examples

### Campaign Feature Status

```gherkin
Feature: Campaign Management

  Scenario: Create campaign
    Given an organizer has valid campaign details
    When the organizer creates the campaign
    Then the campaign should become active

  Scenario: Donate to campaign
    Given an active campaign
    When a donor contributes 100 USD
    Then the campaign total should increase by 100 USD

  Scenario: Close completed campaign
    Given a campaign has reached its goal
    When the organizer closes the campaign
    Then the campaign should stop accepting donations
```

**Dashboard Output:**

```
Campaign Management: 100% Implemented (3/3 Unit scenarios)
- ✅ Create campaign
- ✅ Donate to campaign
- ✅ Close completed campaign
```

### Shariah Compliance Audit

```gherkin
Feature: Murabaha Contract Validation

  As a Shariah auditor
  I need to verify all contracts meet compliance standards
  So that the platform maintains Islamic finance integrity

  @shariah-critical
  Scenario: Profit margin validation
    Given a Murabaha contract with a maximum profit margin of 10 percent
    When a profit margin of 11 percent is submitted
    Then the contract should be rejected

  @shariah-critical
  Scenario: Asset ownership verification
    Given a seller does not own the specified asset
    When the Murabaha contract is submitted
    Then the contract should be rejected
```

**Audit Report:**

```
Shariah-Critical Scenarios: 100% Passing (12/12)
Last validated: 2026-02-09
Shariah officer: Dr. Ahmad bin Abdullah
```
