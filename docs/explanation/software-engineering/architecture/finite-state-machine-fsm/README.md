---
title: Finite State Machine (FSM)
description: OSE Platform Authoritative FSM Standards for Entity Lifecycle Management
category: explanation
subcategory: architecture
tags:
  - fsm
  - finite-state-machine
  - state-management
  - standards
principles:
  - explicit-over-implicit
  - immutability
  - automation-over-manual
created: 2026-01-21
---

# Finite State Machine (FSM)

**This is THE authoritative reference** for Finite State Machine standards in OSE Platform.

All FSM implementations in OSE Platform MUST comply with the standards documented here. These standards are mandatory, not optional. Non-compliance blocks code review and merge approval.

## Framework and Tool Requirements

OSE Platform FSM implementations MUST use the following frameworks:

**Java (Spring Boot)**:

- **REQUIRED**: Spring State Machine 4.0+
- MUST use configuration DSL, NOT XML
- MUST persist state to database for long-running workflows

**TypeScript/JavaScript**:

- **REQUIRED**: XState 5+
- MUST use typed state machines
- MUST visualize with XState Viz for documentation

**Go**:

- **OPTIONAL**: looplab/fsm OR hand-rolled implementation
- MUST use explicit state type (not strings)

**Integration Requirements**:

- MUST integrate with DDD aggregates for entity lifecycles
- MUST emit domain events on state transitions
- MUST log all state changes for audit trails

## Prerequisite Knowledge

**REQUIRED**: This documentation assumes you have completed the AyoKoding Finite State Machine learning path. These are **OSE Platform-specific FSM standards**, not educational tutorials.

**You MUST understand FSM fundamentals before using these standards:**

- **[Finite State Machine Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/)** - Educational foundation for FSM concepts
- **[Finite State Machine Overview](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/overview.md)** - Core FSM concepts (States, Transitions, Events, Guards, Actions)
- **[Finite State Machine By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/by-example/)** - Practical FSM implementation examples

**What this documentation covers**: OSE Platform-specific FSM patterns, Islamic finance state machines (Zakat lifecycle, contract approval, donation campaigns), framework choices (Spring State Machine, XState), integration with DDD aggregates, repository-specific FSM conventions.

**What this documentation does NOT cover**: FSM fundamentals, basic state/transition concepts, generic FSM theory (those are in ayokoding-web).

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Software Engineering Principles

FSM in OSE Platform enforces foundational software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - MUST make entity state explicit (not inferred from boolean flags), transition rules must be explicit in state machine configuration, guards must explicitly define allowed transitions

2. **[Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)** - MUST use immutable events for state transitions, state context must be immutable in functional approaches, state machine definitions must be immutable after initialization

3. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)** - MUST automate state validation through FSM, audit trail logging must be automated, state transition permissions must be enforced by FSM not manual checks

## OSE Platform FSM Standards (Authoritative)

**MUST follow these mandatory standards for all FSM implementations in OSE Platform:**

1. **[State Machine Standards](./state-machine-standards.md)** - When to use FSM, state design, Islamic finance state machines
2. **[Framework Standards](./framework-standards.md)** - Spring State Machine (Java), XState (TypeScript), framework selection
3. **[Integration Standards](./integration-standards.md)** - DDD aggregate integration, domain event publishing

## When to Use FSM

### REQUIRED: Use FSM When Entity Has Distinct Lifecycle States

**REQUIRED**: Use FSM when:

- Entity has 3+ distinct lifecycle stages
- Transitions between states have business meaning
- State-dependent validation rules exist
- Audit trail of state changes is required

**Examples in OSE Platform**:

- **Zakat Assessment**: `DRAFT` → `CALCULATED` → `PAID`
- **Donation Campaign**: `PLANNING` → `ACTIVE` → `FUNDED` → `COMPLETED`
- **Contract Approval**: `NEGOTIATION` → `LEGAL_REVIEW` → `SHARIAH_REVIEW` → `APPROVED` → `ACTIVE`
- **Beneficiary Status**: `APPLICATION` → `VERIFICATION` → `APPROVED` → `ACTIVE`

**PROHIBITED**: Using FSM for:

- Simple boolean toggles (use boolean field instead)
- Pure data validation (use value objects)
- UI state management only (use component state)

**See**: [State Machine Standards](./state-machine-standards.md)

## OSE Platform State Machines

### Zakat Assessment FSM

**States**: `DRAFT`, `CALCULATED`, `BELOW_NISAB`, `PAID`, `EXPIRED`

**Transitions**:

- `DRAFT` → `CALCULATED` (calculate event)
- `CALCULATED` → `PAID` (payment confirmation)
- `CALCULATED` → `EXPIRED` (lunar year passes without payment)

**Business Rules**:

- Cannot transition to `PAID` if amount doesn't match calculation
- Cannot recalculate after `PAID`
- Must enforce Nisab threshold before `CALCULATED`

### Campaign FSM

**States**: `PLANNING`, `ACTIVE`, `FUNDED`, `COMPLETED`, `CANCELLED`

**Transitions**:

- `PLANNING` → `ACTIVE` (launch campaign)
- `ACTIVE` → `FUNDED` (funding goal reached)
- `FUNDED` → `COMPLETED` (funds disbursed)
- `ACTIVE` → `CANCELLED` (campaign cancelled)

**Business Rules**:

- Cannot cancel after `FUNDED`
- Cannot launch without Shariah compliance verification
- Must track donation progress for `FUNDED` transition

### Contract Approval FSM

**States**: `NEGOTIATION`, `LEGAL_REVIEW`, `SHARIAH_REVIEW`, `MANAGEMENT_APPROVAL`, `APPROVED`, `ACTIVE`, `SETTLED`

**Transitions**:

- Multi-stage approval workflow
- Each review stage can reject (back to `NEGOTIATION`)
- Only `APPROVED` contracts can transition to `ACTIVE`

**Business Rules**:

- Shariah review is mandatory for all contracts
- Cannot skip approval stages
- Must log reviewer identity and timestamps

**See**: [State Machine Standards](./state-machine-standards.md#ose-platform-state-machines)

## Framework Selection

### Spring State Machine (Java/Spring Boot)

**REQUIRED for Java applications**.

**Configuration**:

```java
@Configuration
@EnableStateMachine
public class ZakatStateMachineConfig extends StateMachineConfigurerAdapter<
    ZakatState, ZakatEvent> {

    @Override
    public void configure(StateMachineStateConfigurer<ZakatState, ZakatEvent> states)
            throws Exception {
        states
            .withStates()
                .initial(ZakatState.DRAFT)
                .state(ZakatState.CALCULATED)
                .end(ZakatState.PAID);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<ZakatState, ZakatEvent> transitions)
            throws Exception {
        transitions
            .withExternal()
                .source(ZakatState.DRAFT)
                .target(ZakatState.CALCULATED)
                .event(ZakatEvent.CALCULATE)
                .guard(nisabThresholdGuard())
                .action(publishZakatCalculatedEvent());
    }
}
```

**See**: [Framework Standards](./framework-standards.md#spring-state-machine)

### XState (TypeScript/JavaScript)

**REQUIRED for TypeScript applications**.

**Configuration**:

```typescript
import { createMachine } from "xstate";

const campaignMachine = createMachine({
  id: "campaign",
  initial: "planning",
  states: {
    planning: {
      on: { LAUNCH: "active" },
    },
    active: {
      on: {
        FUND: {
          target: "funded",
          guard: "goalReached",
        },
        CANCEL: "cancelled",
      },
    },
    funded: {
      on: { COMPLETE: "completed" },
    },
    completed: { type: "final" },
    cancelled: { type: "final" },
  },
});
```

**See**: [Framework Standards](./framework-standards.md#xstate)

## Integration with DDD Aggregates

### REQUIRED: FSM Within Aggregate Root

**REQUIRED**: FSM state MUST be part of aggregate root.

```java
public class ZakatAssessment {
    private AssessmentId id;
    private ZakatState currentState;  // FSM state
    private StateMachine<ZakatState, ZakatEvent> stateMachine;

    public void calculate() {
        stateMachine.sendEvent(ZakatEvent.CALCULATE);
        this.currentState = stateMachine.getState().getId();
        // Publish domain event
        domainEvents.add(new ZakatCalculated(id, calculatedAmount));
    }
}
```

**See**: [Integration Standards](./integration-standards.md)

## Documentation Structure

### Quick Reference

**Mandatory Standards (All developers MUST follow)**:

1. [State Machine Standards](./state-machine-standards.md) - When to use FSM, state design
2. [Framework Standards](./framework-standards.md) - Spring SSM, XState configuration
3. [Integration Standards](./integration-standards.md) - DDD aggregate integration

## Validation and Compliance

FSM implementations MUST pass the following validation checks:

1. **State Validation**: All entity states defined in FSM
2. **Transition Validation**: All allowed transitions explicitly configured
3. **Guard Validation**: Business rules enforced via guards
4. **Event Publishing**: Domain events published on state transitions
5. **Audit Trail**: All state changes logged with timestamp and user

## Related Documentation

- **[DDD Standards](../domain-driven-design-ddd/README.md)** - Aggregate integration
- **[C4 Architecture Model](../c4-architecture-model/README.md)** - Visualizing state machines in component diagrams

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: By making entity state explicit in FSM rather than inferred from boolean flags, state becomes visible and verifiable.

- **[Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)**: By using immutable events for transitions and immutable state context, race conditions and unexpected state mutations are eliminated.

- **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**: By automating state validation, transition guards, and audit trail logging through FSM framework, manual error-prone checks are eliminated.
