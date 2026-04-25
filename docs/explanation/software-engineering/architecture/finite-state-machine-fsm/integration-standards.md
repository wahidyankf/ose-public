---
title: "FSM Integration Standards"
description: Integrating FSM with DDD aggregates and domain events
category: explanation
subcategory: architecture
tags:
  - fsm
  - ddd
  - integration
principles:
  - explicit-over-implicit
created: 2026-02-09
---

# FSM Integration Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding FSM](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/) and [AyoKoding DDD](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/) before using these standards.

## REQUIRED: FSM Within Aggregate Root

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

## Domain Event Publishing

**REQUIRED**: State transitions MUST publish domain events.

**Event Naming**: `[Entity][StateReached]` (e.g., `ZakatCalculated`, `CampaignFunded`)

## Audit Trail

**REQUIRED**: Log all state changes with timestamp and user.
