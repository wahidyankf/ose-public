---
title: "Three Amigos Collaboration Standards"
description: OSE Platform standards for Business-Development-QA collaboration sessions
category: explanation
subcategory: development
tags:
  - bdd
  - collaboration
  - three-amigos
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
created: 2026-02-09
---

# Three Amigos Collaboration Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding BDD By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/development/behavior-driven-development-bdd/by-example/) before using these standards.

## Purpose

OSE Platform standards for Three Amigos collaborative specification sessions.

## REQUIRED: Three Roles

**REQUIRED**: All Three Amigos sessions MUST include these three perspectives.

- **Business**: Product Owner or Domain Expert
  - For Islamic finance: **Shariah scholar** REQUIRED
- **Development**: Lead developer or architect
- **QA**: Test engineer

## Session Frequency

**REQUIRED**: Weekly sessions for active features.

**Duration**: 45-60 minutes maximum.

## Session Structure

**REQUIRED Phases:**

1. **Discovery** (15-20 min): Explore feature through examples
2. **Example Mapping** (20-30 min): Color-coded card organizing
3. **Scenario Writing** (10-15 min): Draft Gherkin scenarios
4. **Review** (5 min): Confirm acceptance criteria

## Example Mapping

**REQUIRED Cards** (Matt Wynne's technique):

- **Yellow** = Story (the feature/user story being discussed)
- **Blue** = Rules (acceptance criteria, business rules)
- **Green** = Examples (concrete scenarios illustrating rules)
- **Red** = Questions (open questions nobody can answer)

## OSE Platform Examples

### Zakat Calculation Session

**Participants:**

- **Business**: Shariah scholar (validates religious rules)
- **Development**: Backend lead
- **QA**: Test engineer

**Example Mapping Output:**

**Blue Card** (Rule):

```
Zakat obligatory when wealth >= Nisab for full lunar year
```

**Yellow Cards** (Examples):

```
Example 1: 100g gold, Nisab 87.48g, 1 year → 2.5g Zakat
Example 2: 50g gold, Nisab 87.48g → No Zakat
Example 3: 100g gold, 6 months → No Zakat
```

**Green Card** (Question):

```
How to handle wealth that fluctuates above/below Nisab during year?
```

**Scenarios Written:**

```gherkin
Scenario: Wealth exceeds Nisab for full year
  Given wealth of 100 grams of gold
  And Nisab threshold of 87.48 grams
  And one full lunar year has passed
  When Zakat calculation is performed
  Then Zakat should be 2.5 grams
```

### Contract Approval Session

**Participants:**

- **Business**: Shariah compliance officer
- **Development**: Contract service lead
- **QA**: Integration test engineer

**Blue Card** (Rule):

```
Murabaha contract requires profit margin <= 10%
```

**Yellow Cards** (Examples):

```
Example 1: $10,000 asset, $500 profit (5%) → Approved
Example 2: $10,000 asset, $1,100 profit (11%) → Rejected
```

**Scenarios Written:**

```gherkin
Scenario: Contract approved with valid profit margin
  Given a Murabaha contract for $10,000 asset
  And profit margin of 5%
  When Shariah officer reviews contract
  Then contract should be approved
```

## REQUIRED: Shariah Scholar for Islamic Finance

**REQUIRED**: Islamic finance features MUST include Shariah scholar in Three Amigos.

**Reason**: Ensures religious compliance requirements are correctly captured.

**Examples requiring scholar participation:**

- Zakat calculation rules
- Murabaha contract validation
- Sadaqah donation categories
- Waqf endowment management
- Takaful insurance models
