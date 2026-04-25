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
created: 2026-02-09
---

# Living Documentation Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding BDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/behavior-driven-development-bdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for maintaining living documentation through executable scenarios.

## REQUIRED: Scenarios Execute in CI/CD

**REQUIRED**: All scenarios MUST execute automatically in CI/CD pipeline.

**REQUIRED**: Failing scenarios MUST block merge to main branch.

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
      - name: Run BDD scenarios
        run: nx affected -t test:integration # BDD/integration tests use test:integration target

      - name: Generate Cucumber report
        run: npm run cucumber:report
```

## REQUIRED: Update Scenarios with Requirements

**REQUIRED**: When requirements change, scenarios MUST be updated first.

**Workflow:**

1. Requirements change → Update scenarios
2. Scenarios fail (Red)
3. Update implementation
4. Scenarios pass (Green)

**Example**: Nisab threshold changes from 85g to 87.48g

```gherkin
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

**Tools:**

- **Cucumber HTML Reporter** (TypeScript)
- **Serenity BDD** (Java)

**Dashboard MUST show:**

- Total scenarios (passed/failed/pending)
- Feature completion percentage
- Scenario execution trends

## Scenario Organization

**REQUIRED**: Group scenarios by bounded context.

```
features/
  zakat-context/
    zakat-calculation.feature
    nisab-validation.feature

  donation-context/
    campaign-management.feature
    donation-processing.feature
```

## OSE Platform Examples

### Campaign Feature Status

```gherkin
Feature: Campaign Management

  @implemented
  Scenario: Create campaign
    ...

  @implemented
  Scenario: Donate to campaign
    ...

  @pending
  Scenario: Close completed campaign
    ...
```

**Dashboard Output:**

```
Campaign Management: 66% Complete (2/3 scenarios)
- ✅ Create campaign
- ✅ Donate to campaign
- ⏳ Close completed campaign (pending)
```

### Shariah Compliance Audit

```gherkin
Feature: Murabaha Contract Validation

  As a Shariah auditor
  I need to verify all contracts meet compliance standards
  So that the platform maintains Islamic finance integrity

  @shariah-critical
  Scenario: Profit margin validation
    ...

  @shariah-critical
  Scenario: Asset ownership verification
    ...
```

**Audit Report:**

```
Shariah-Critical Scenarios: 100% Passing (12/12)
Last validated: 2026-02-09
Shariah officer: Dr. Ahmad bin Abdullah
```
