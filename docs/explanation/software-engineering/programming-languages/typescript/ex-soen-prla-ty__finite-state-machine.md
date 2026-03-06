---
title: "TypeScript Finite State Machines"
description: Implementing finite state machines in TypeScript
category: explanation
subcategory: prog-lang
tags:
  - typescript
  - state-machine
  - fsm
  - xstate
  - state-management
related:
  - ./ex-soen-prla-ty__best-practices.md
  - ./ex-soen-prla-ty__type-safety.md
principles:
  - explicit-over-implicit
updated: 2025-01-23
---

# TypeScript Finite State Machines

**Quick Reference**: [Overview](#overview) | [Basic Implementation](#basic-fsm-implementation) | [Type-Safe FSM](#type-safe-state-machine) | [XState](#xstate-library) | [Payment Flow](#complete-example-payment-flow) | [Related Documentation](#related-documentation)

## Overview

Finite State Machines (FSMs) model systems with distinct states and transitions. They're ideal for donation workflows, payment processing, and campaign lifecycles in financial applications.

### FSM Principles

- **Finite States**: Limited, well-defined set of states
- **Transitions**: Explicit state changes via events
- **Deterministic**: Same input always produces same output
- **Single State**: System is in exactly one state at a time

### State Transition Rules

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Start["Current State"]:::blue
    Event["Event Received"]:::orange
    Valid{"Valid<br/>Transition?"}:::purple
    Execute["Execute Transition<br/>Update State"]:::teal
    Reject["Reject Invalid<br/>Transition"]:::brown
    End["New State"]:::blue

    Start --> Event
    Event --> Valid
    Valid -->|Yes| Execute
    Valid -->|No| Reject
    Execute --> End
    Reject --> Start

    Note1["Transition Table:<br/>State + Event -> Next State"]
    Note2["Guards:<br/>Additional conditions<br/>for transitions"]
    Note3["Actions:<br/>Side effects during<br/>transition"]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Basic FSM Implementation

### Payment State Machine Visualization

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Pending: Create payment
    Pending --> Processing: submit
    Processing --> Completed: approve
    Processing --> Failed: reject
    Failed --> Pending: retry
    Completed --> [*]
    Failed --> [*]: max retries

    Pending: Pending<br/>Awaiting submission
    Processing: Processing<br/>Payment being processed
    Completed: Completed<br/>Success
    Failed: Failed<br/>Error occurred

    note right of Pending
      Initial state<br/>
      Payment created
    end note

    note right of Processing
      Payment gateway<br/>
      processing transaction
    end note

    note right of Completed
      Terminal state<br/>
      Transaction successful
    end note

    note right of Failed
      Can retry up to<br/>
      max retry limit
    end note
```

### Simple State Machine

```typescript
type DonationState = "pending" | "processing" | "completed" | "failed";
type DonationEvent = "submit" | "approve" | "reject" | "retry";

interface DonationContext {
  donationId: string;
  amount: number;
  retryCount: number;
}

class DonationStateMachine {
  private state: DonationState = "pending";
  private context: DonationContext;

  constructor(context: DonationContext) {
    this.context = context;
  }

  transition(event: DonationEvent): void {
    const nextState = this.getNextState(this.state, event);
    if (nextState) {
      console.log(`${this.state} -> ${nextState} (${event})`);
      this.state = nextState;
    } else {
      console.log(`Invalid transition: ${event} in ${this.state}`);
    }
  }

  private getNextState(currentState: DonationState, event: DonationEvent): DonationState | null {
    const transitions: Record<DonationState, Partial<Record<DonationEvent, DonationState>>> = {
      pending: {
        submit: "processing",
      },
      processing: {
        approve: "completed",
        reject: "failed",
      },
      completed: {},
      failed: {
        retry: "pending",
      },
    };

    return transitions[currentState][event] || null;
  }

  getState(): DonationState {
    return this.state;
  }
}

// Usage
const fsm = new DonationStateMachine({
  donationId: "DON-123",
  amount: 1000,
  retryCount: 0,
});

fsm.transition("submit"); // pending -> processing
fsm.transition("approve"); // processing -> completed
```

## Type-Safe State Machine

### Discriminated Union Pattern

```typescript
type PendingState = {
  status: "pending";
  submittedAt: Date;
};

type ProcessingState = {
  status: "processing";
  processedBy: string;
  startedAt: Date;
};

type CompletedState = {
  status: "completed";
  completedAt: Date;
  transactionId: string;
};

type FailedState = {
  status: "failed";
  failedAt: Date;
  error: string;
  retryCount: number;
};

type DonationState = PendingState | ProcessingState | CompletedState | FailedState;

// Type-safe state checks
function isDonationCompleted(state: DonationState): state is CompletedState {
  return state.status === "completed";
}

// Exhaustive pattern matching
function processDonation(state: DonationState): string {
  switch (state.status) {
    case "pending":
      return `Submitted at ${state.submittedAt.toISOString()}`;
    case "processing":
      return `Processing by ${state.processedBy}`;
    case "completed":
      return `Completed: ${state.transactionId}`;
    case "failed":
      return `Failed: ${state.error}`;
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

### Donation Campaign State Machine

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Draft: Create campaign
    Draft --> Active: activate
    Active --> Paused: pause
    Paused --> Active: resume
    Active --> Completed: complete
    Draft --> Cancelled: cancel
    Active --> Cancelled: cancel
    Paused --> Cancelled: cancel
    Completed --> [*]
    Cancelled --> [*]

    Draft: Draft<br/>Being configured
    Active: Active<br/>Accepting donations
    Paused: Paused<br/>Temporarily stopped
    Completed: Completed<br/>Goal reached
    Cancelled: Cancelled<br/>Terminated

    note right of Active
      Nested states:<br/>
      - Running<br/>
      - Paused
    end note

    note right of Completed
      Final state<br/>
      Goal reached or<br/>
      end date passed
    end note
```

### Builder Pattern FSM

```typescript
class StateMachine<S extends string, E extends string> {
  private states = new Map<S, Map<E, S>>();
  private currentState: S;

  constructor(initialState: S) {
    this.currentState = initialState;
  }

  addTransition(from: S, event: E, to: S): this {
    if (!this.states.has(from)) {
      this.states.set(from, new Map());
    }
    this.states.get(from)!.set(event, to);
    return this;
  }

  transition(event: E): boolean {
    const transitions = this.states.get(this.currentState);
    if (!transitions) return false;

    const nextState = transitions.get(event);
    if (!nextState) return false;

    this.currentState = nextState;
    return true;
  }

  getState(): S {
    return this.currentState;
  }
}

// Usage
type CampaignState = "draft" | "active" | "paused" | "completed" | "cancelled";
type CampaignEvent = "activate" | "pause" | "resume" | "complete" | "cancel";

const campaign = new StateMachine<CampaignState, CampaignEvent>("draft");

campaign
  .addTransition("draft", "activate", "active")
  .addTransition("active", "pause", "paused")
  .addTransition("paused", "resume", "active")
  .addTransition("active", "complete", "completed")
  .addTransition("draft", "cancel", "cancelled")
  .addTransition("active", "cancel", "cancelled")
  .addTransition("paused", "cancel", "cancelled");

campaign.transition("activate"); // draft -> active
campaign.transition("pause"); // active -> paused
```

## XState Library

### XState Machine Configuration

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    Config["Machine Config"]:::blue --> States["States"]:::orange
    Config --> Initial["Initial State"]:::orange
    Config --> Context["Context Data"]:::orange

    States --> S1["State 1<br/>(entry, exit)"]:::teal
    States --> S2["State 2<br/>(entry, exit)"]:::teal

    S1 --> T1["Transitions"]:::purple
    T1 --> Guards["Guards"]
    T1 --> Actions["Actions"]

    classDef blue fill:#0173B2,stroke:#000,color:#fff
    classDef orange fill:#DE8F05,stroke:#000,color:#000
    classDef teal fill:#029E73,stroke:#000,color:#fff
    classDef purple fill:#CC78BC,stroke:#000,color:#000
```

### Basic XState Machine

```typescript
import { createMachine, interpret } from "xstate";

const donationMachine = createMachine({
  id: "donation",
  initial: "pending",
  context: {
    donationId: "",
    amount: 0,
    retryCount: 0,
  },
  states: {
    pending: {
      on: {
        SUBMIT: "processing",
      },
    },
    processing: {
      on: {
        APPROVE: "completed",
        REJECT: "failed",
      },
    },
    completed: {
      type: "final",
    },
    failed: {
      on: {
        RETRY: {
          target: "pending",
          actions: "incrementRetryCount",
        },
      },
    },
  },
});

// Create service
const service = interpret(donationMachine)
  .onTransition((state) => {
    console.log(`State: ${state.value}`);
  })
  .start();

// Send events
service.send({ type: "SUBMIT" });
service.send({ type: "APPROVE" });
```

### Guard and Action Execution Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
sequenceDiagram
    participant Event
    participant Guard
    participant Transition
    participant Action

    Event->>Guard: Evaluate guard condition
    alt Guard passes
        Guard->>Transition: Allow transition
        Transition->>Action: Execute entry actions
        Action->>Transition: Complete
    else Guard fails
        Guard-->>Event: Block transition
    end
```

### XState with Guards and Actions

```typescript
import { createMachine, assign } from "xstate";

interface DonationContext {
  donationId: string;
  amount: number;
  retryCount: number;
  maxRetries: number;
}

type DonationEvent =
  | { type: "SUBMIT"; donationId: string; amount: number }
  | { type: "APPROVE"; transactionId: string }
  | { type: "REJECT"; error: string }
  | { type: "RETRY" };

const donationMachine = createMachine<DonationContext, DonationEvent>({
  id: "donation",
  initial: "pending",
  context: {
    donationId: "",
    amount: 0,
    retryCount: 0,
    maxRetries: 3,
  },
  states: {
    pending: {
      on: {
        SUBMIT: {
          target: "processing",
          actions: assign({
            donationId: (_, event) => event.donationId,
            amount: (_, event) => event.amount,
          }),
        },
      },
    },
    processing: {
      on: {
        APPROVE: "completed",
        REJECT: {
          target: "failed",
          actions: assign({
            retryCount: (context) => context.retryCount + 1,
          }),
        },
      },
    },
    completed: {
      type: "final",
    },
    failed: {
      on: {
        RETRY: [
          {
            target: "pending",
            cond: (context) => context.retryCount < context.maxRetries,
          },
          {
            target: "permanentlyFailed",
          },
        ],
      },
    },
    permanentlyFailed: {
      type: "final",
    },
  },
});
```

### Nested State Hierarchy

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
stateDiagram-v2
    [*] --> processing

    state processing {
        [*] --> validating
        validating --> approved
        approved --> disbursing
    }

    processing --> completed
    processing --> failed

    note right of processing
        Nested states share
        parent state context
    end note
```

### Nested States

```typescript
const campaignMachine = createMachine({
  id: "campaign",
  initial: "draft",
  states: {
    draft: {
      on: {
        ACTIVATE: "active",
      },
    },
    active: {
      initial: "running",
      states: {
        running: {
          on: {
            PAUSE: "paused",
          },
        },
        paused: {
          on: {
            RESUME: "running",
          },
        },
      },
      on: {
        COMPLETE: "completed",
        CANCEL: "cancelled",
      },
    },
    completed: {
      type: "final",
    },
    cancelled: {
      type: "final",
    },
  },
});
```

### Parallel State Regions

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
stateDiagram-v2
    [*] --> parallel_processing

    state parallel_processing {
        [*] --> validation
        [*] --> fraud_check

        state validation {
            [*] --> validating
            validating --> validated
        }

        state fraud_check {
            [*] --> checking
            checking --> cleared
        }
    }

    parallel_processing --> completed: both complete
```

### Parallel States

```typescript
const donationProcessMachine = createMachine({
  id: "donationProcess",
  type: "parallel",
  states: {
    payment: {
      initial: "idle",
      states: {
        idle: {
          on: { PROCESS_PAYMENT: "processing" },
        },
        processing: {
          on: {
            PAYMENT_SUCCESS: "success",
            PAYMENT_FAILED: "failed",
          },
        },
        success: { type: "final" },
        failed: { type: "final" },
      },
    },
    notification: {
      initial: "idle",
      states: {
        idle: {
          on: { SEND_EMAIL: "sending" },
        },
        sending: {
          on: {
            EMAIL_SENT: "sent",
            EMAIL_FAILED: "failed",
          },
        },
        sent: { type: "final" },
        failed: { type: "final" },
      },
    },
  },
});
```

## Complete Example: Payment Flow

### Payment State Machine

```typescript
type PaymentStatus = "initiated" | "processing" | "verifying" | "completed" | "failed" | "refunded";

type PaymentEvent =
  | { type: "PROCESS" }
  | { type: "VERIFY" }
  | { type: "COMPLETE" }
  | { type: "FAIL"; reason: string }
  | { type: "REFUND" };

interface PaymentContext {
  paymentId: string;
  amount: number;
  currency: string;
  donorId: string;
  transactionId?: string;
  failureReason?: string;
}

class PaymentFSM {
  private state: PaymentStatus = "initiated";
  private context: PaymentContext;
  private listeners: Array<(state: PaymentStatus) => void> = [];

  constructor(context: PaymentContext) {
    this.context = context;
  }

  on(listener: (state: PaymentStatus) => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  transition(event: PaymentEvent): void {
    const prevState = this.state;

    switch (this.state) {
      case "initiated":
        if (event.type === "PROCESS") {
          this.state = "processing";
          this.processPayment();
        }
        break;

      case "processing":
        if (event.type === "VERIFY") {
          this.state = "verifying";
          this.verifyPayment();
        } else if (event.type === "FAIL") {
          this.state = "failed";
          this.context.failureReason = event.reason;
        }
        break;

      case "verifying":
        if (event.type === "COMPLETE") {
          this.state = "completed";
        } else if (event.type === "FAIL") {
          this.state = "failed";
          this.context.failureReason = event.reason;
        }
        break;

      case "completed":
        if (event.type === "REFUND") {
          this.state = "refunded";
          this.processRefund();
        }
        break;

      case "failed":
        // Terminal state
        break;

      case "refunded":
        // Terminal state
        break;
    }

    if (prevState !== this.state) {
      console.log(`Payment ${this.context.paymentId}: ${prevState} -> ${this.state}`);
      this.notify();
    }
  }

  private async processPayment(): Promise<void> {
    // Simulate payment processing
    setTimeout(() => {
      this.transition({ type: "VERIFY" });
    }, 1000);
  }

  private async verifyPayment(): Promise<void> {
    // Simulate verification
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        this.context.transactionId = `TXN-${Date.now()}`;
        this.transition({ type: "COMPLETE" });
      } else {
        this.transition({ type: "FAIL", reason: "Verification failed" });
      }
    }, 1000);
  }

  private async processRefund(): Promise<void> {
    // Process refund
    console.log(`Refunding payment ${this.context.paymentId}`);
  }

  getState(): PaymentStatus {
    return this.state;
  }

  getContext(): PaymentContext {
    return { ...this.context };
  }
}

// Usage
const payment = new PaymentFSM({
  paymentId: "PAY-123",
  amount: 1000,
  currency: "USD",
  donorId: "DNR-456",
});

payment.on((state) => {
  console.log(`Payment state changed to: ${state}`);
});

payment.transition({ type: "PROCESS" });
// Automatically transitions through processing -> verifying -> completed

// Later...
payment.transition({ type: "REFUND" });
```

### Campaign State Transitions

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
stateDiagram-v2
    [*] --> draft
    draft --> active: publish
    active --> paused: pause
    paused --> active: resume
    active --> completed: reach_goal
    active --> cancelled: cancel
    paused --> cancelled: cancel
    completed --> [*]
    cancelled --> [*]
```

### Campaign Lifecycle FSM

```typescript
type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";

interface CampaignContext {
  campaignId: string;
  goal: number;
  raised: number;
  startDate: Date;
  endDate: Date;
}

const campaignFSM = createMachine<CampaignContext>({
  id: "campaign",
  initial: "draft",
  context: {
    campaignId: "",
    goal: 0,
    raised: 0,
    startDate: new Date(),
    endDate: new Date(),
  },
  states: {
    draft: {
      on: {
        SCHEDULE: {
          target: "scheduled",
          cond: (context) => context.startDate > new Date(),
        },
        ACTIVATE: {
          target: "active",
          cond: (context) => context.startDate <= new Date(),
        },
      },
    },
    scheduled: {
      on: {
        ACTIVATE: "active",
        CANCEL: "cancelled",
      },
    },
    active: {
      on: {
        PAUSE: "paused",
        COMPLETE: {
          target: "completed",
          cond: (context) => context.raised >= context.goal || context.endDate <= new Date(),
        },
        CANCEL: "cancelled",
      },
    },
    paused: {
      on: {
        RESUME: "active",
        CANCEL: "cancelled",
      },
    },
    completed: {
      type: "final",
    },
    cancelled: {
      type: "final",
    },
  },
});
```

## Related Documentation

- **[TypeScript Best Practices](ex-soen-prla-ty__best-practices.md)** - Coding standards
- **[TypeScript Type Safety](ex-soen-prla-ty__type-safety.md)** - Type patterns

---

**Last Updated**: 2025-01-23
**TypeScript Version**: 5.0+ (baseline), 5.4+ (milestone), 5.6+ (stable), 5.9.3+ (latest stable)
**Maintainers**: OSE Documentation Team
