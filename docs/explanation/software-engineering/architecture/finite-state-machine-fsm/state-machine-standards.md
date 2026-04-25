---
title: "FSM State Machine Standards"
description: When to use FSM, state design rules, OSE Platform Islamic finance state machines
category: explanation
subcategory: architecture
tags:
  - fsm
  - state-machines
  - standards
principles:
  - explicit-over-implicit
created: 2026-02-09
---

# FSM State Machine Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding FSM](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/) before using these standards.

## When to Use FSM

**REQUIRED**: Use FSM when entity has 3+ distinct lifecycle stages AND transitions have business meaning.

**Examples**: Zakat Assessment (`DRAFT` → `CALCULATED` → `PAID`), Campaign (`PLANNING` → `ACTIVE` → `FUNDED`), Contract Approval (multi-stage review).

**PROHIBITED**: Boolean toggles, pure validation, UI-only state.

## State Naming

**Format**: `UPPER_SNAKE_CASE`

**Examples**: `DRAFT`, `CALCULATED`, `PAID`, `LEGAL_REVIEW`, `SHARIAH_REVIEW`

## OSE Platform State Machines

### Zakat Assessment

States: `DRAFT`, `CALCULATED`, `BELOW_NISAB`, `PAID`, `EXPIRED`

Business Rules:

- MUST enforce Nisab threshold before `CALCULATED`
- Cannot transition to `PAID` if amount doesn't match
- Cannot recalculate after `PAID`

### Campaign

States: `PLANNING`, `ACTIVE`, `FUNDED`, `COMPLETED`, `CANCELLED`

Business Rules:

- Cannot cancel after `FUNDED`
- MUST verify Shariah compliance before `ACTIVE`
- MUST track progress for `FUNDED` transition

### Contract Approval

States: `NEGOTIATION`, `LEGAL_REVIEW`, `SHARIAH_REVIEW`, `MANAGEMENT_APPROVAL`, `APPROVED`, `ACTIVE`, `SETTLED`

Business Rules:

- Shariah review is MANDATORY
- Cannot skip approval stages
- MUST log reviewer and timestamp
