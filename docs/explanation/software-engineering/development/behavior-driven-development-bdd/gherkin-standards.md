---
title: "Gherkin Syntax Standards"
description: OSE Platform standards for feature files, scenarios, and Given-When-Then structure
category: explanation
subcategory: development
tags:
  - bdd
  - gherkin
  - scenarios
principles:
  - explicit-over-implicit
  - documentation-first
created: 2026-02-09
---

# Gherkin Syntax Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding BDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/behavior-driven-development-bdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for Gherkin feature files and scenario structure.

## REQUIRED: Feature File Structure

**REQUIRED**: All feature files MUST follow this structure.

```gherkin
Feature: [One-line description]

  [Optional business narrative explaining value]

  Scenario: [Descriptive scenario name]
    Given [initial context]
    When [action occurs]
    Then [expected outcome]
```

## REQUIRED: Given-When-Then Pattern

**REQUIRED**: All scenarios MUST use Given-When-Then structure.

- **Given**: Set up initial state (preconditions, test data)
- **When**: Describe action or event being tested
- **Then**: Specify expected outcome

**Example (Zakat Calculation)**:

```gherkin
Scenario: Wealth exceeds Nisab threshold
  Given a Muslim individual owns 100 grams of gold
  And the Nisab threshold for gold is 87.48 grams
  And one lunar year (Hawl) has passed since acquisition
  When Zakat calculation is performed
  Then Zakat should be obligatory
  And Zakat amount should be 2.5 grams of gold
```

## REQUIRED: Use Ubiquitous Language

**REQUIRED**: Scenarios MUST use terms from DDD glossary.

**Good** (ubiquitous language):

```gherkin
Scenario: Contract activation
  Given a Murabaha contract with 5% profit margin
  When the contract is activated
  Then the contract status should be "ACTIVE"
```

**Bad** (generic terms):

```gherkin
Scenario: Contract activation
  Given a loan with 5% interest  # Wrong: not ubiquitous language
  When the loan is enabled       # Wrong: generic term
  Then the status should be "ON" # Wrong: not domain term
```

## File Naming

**REQUIRED**: Feature files MUST use kebab-case.

**Format**: `[domain-capability].feature`

**Examples**:

- `zakat-calculation.feature`
- `murabaha-contract-approval.feature`
- `donation-campaign-management.feature`

## OSE Platform Examples

### Nisab Threshold Validation

```gherkin
Feature: Nisab Threshold Validation

  As a Zakat calculator
  I want to validate wealth against Nisab threshold
  So that only obligatory Zakat is calculated

  Scenario: Wealth meets Nisab for gold
    Given a Muslim individual owns 87.48 grams of gold
    When Nisab validation is performed
    Then Zakat should be obligatory

  Scenario: Wealth below Nisab for gold
    Given a Muslim individual owns 50 grams of gold
    When Nisab validation is performed
    Then Zakat should not be obligatory
```

### Contract Lifecycle

```gherkin
Feature: Murabaha Contract Lifecycle

  As a contract manager
  I want contracts to follow proper lifecycle states
  So that all transitions are Shariah-compliant

  Scenario: Contract transitions from DRAFT to PENDING_REVIEW
    Given a contract in DRAFT status
    And all required fields are completed
    When the contract is submitted for review
    Then the contract status should be "PENDING_REVIEW"
    And a "ContractSubmitted" event should be published
```
