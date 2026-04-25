---
title: "BDD Scenario Standards"
description: OSE Platform standards for scenario independence, naming, and organization
category: explanation
subcategory: development
tags:
  - bdd
  - scenarios
  - testing
principles:
  - explicit-over-implicit
  - reproducibility
created: 2026-02-09
---

# BDD Scenario Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding BDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/behavior-driven-development-bdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for scenario structure and independence.

## REQUIRED: Scenario Independence

**REQUIRED**: Each scenario MUST be independently runnable in any order.

**PROHIBITED**: Scenarios depending on execution order.

**Good** (independent scenarios):

```gherkin
Scenario: Create campaign
  Given no campaigns exist
  When I create campaign "Build School" with goal $50,000
  Then the campaign should exist

Scenario: Donate to campaign
  Given a campaign "Build School" with goal $50,000
  When I donate $1,000 to "Build School"
  Then the campaign total should be $1,000
```

**Bad** (dependent scenarios):

```gherkin
Scenario: Create campaign
  When I create campaign "Build School" with goal $50,000
  Then the campaign should exist

Scenario: Donate to campaign (DEPENDS on previous!)
  When I donate $1,000 to "Build School"
  Then the campaign total should be $1,000
```

## Scenario Naming

**REQUIRED**: Scenario names MUST describe specific behavior.

**Format**: `[Action] [Context/Condition]`

**Good** (descriptive):

- `Wealth exceeds Nisab threshold`
- `Contract approval requires Shariah review`
- `Donation exceeds campaign goal`

**Bad** (vague):

- `Test Zakat` (vague)
- `Scenario 1` (meaningless)
- `Happy path` (not specific)

## One Logical Assertion Per Scenario

**REQUIRED**: Each scenario MUST verify one logical assertion.

**Good** (focused):

```gherkin
Scenario: Zakat calculated correctly for gold
  Given wealth of 100 grams of gold
  When Zakat is calculated
  Then Zakat amount should be 2.5 grams

Scenario: Zakat exempt below Nisab
  Given wealth of 50 grams of gold
  When Zakat is calculated
  Then Zakat should not be obligatory
```

**Bad** (testing too much):

```gherkin
Scenario: Zakat calculation (testing too many things)
  Given wealth of 100 grams of gold
  When Zakat is calculated
  Then Zakat amount should be 2.5 grams
  And notification should be sent
  And audit log should be created
  And database should be updated
```

## Background for Shared Setup

**OPTIONAL**: Use Background for common setup across scenarios.

```gherkin
Feature: Donation Processing

  Background:
    Given the system is in production mode
    And the current Islamic date is 1 Ramadan 1445

  Scenario: Process Sadaqah donation
    Given a donor with sufficient funds
    When they donate $100 as Sadaqah
    Then the donation should be processed
```

## OSE Platform Examples

### Campaign Management Scenarios

```gherkin
Feature: Campaign Progress Tracking

  Scenario: First donation initializes progress
    Given a campaign "Build Mosque" with goal $100,000
    And the campaign has no donations yet
    When a donor contributes $5,000
    Then the campaign total should be $5,000
    And the progress percentage should be 5%

  Scenario: Multiple donations accumulate correctly
    Given a campaign "Build Mosque" with goal $100,000
    And the campaign has raised $20,000
    When a donor contributes $10,000
    Then the campaign total should be $30,000
    And the progress percentage should be 30%
```
