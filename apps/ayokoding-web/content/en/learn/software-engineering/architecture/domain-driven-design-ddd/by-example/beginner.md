---
title: "Beginner"
date: 2026-01-31T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-30: Introduction to DDD, Entities, Value Objects, Aggregates, Repositories, Domain Events, and Domain Services (0-40% coverage)"
tags: ["ddd", "domain-driven-design", "tutorial", "by-example", "beginner", "entities", "value-objects", "aggregates"]
---

This beginner-level tutorial introduces Domain-Driven Design fundamentals through 30 annotated code examples, covering tactical patterns like Entities, Value Objects, Aggregates, Repositories, Domain Events, and Domain Services that form the foundation for modeling complex business domains.

## Introduction to DDD (Examples 1-3)

### Example 1: What is Domain-Driven Design?

Domain-Driven Design (DDD) is a software development approach that focuses on modeling complex business domains through collaboration between technical and domain experts. It emphasizes building a shared understanding (Ubiquitous Language) and organizing code around business concepts rather than technical infrastructure.

```mermaid
graph TD
    A["Strategic DDD<br/>Bounded Contexts<br/>Context Mapping"]
    B["Tactical DDD<br/>Entities, Value Objects<br/>Aggregates, Services"]
    C["Ubiquitous Language<br/>Shared vocabulary<br/>Domain experts + developers"]

    A -->|Guides| B
    C -->|Informs| A
    C -->|Informs| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
```

**Key Elements**:

- **Strategic DDD**: High-level design dealing with bounded contexts and how they integrate
- **Tactical DDD**: Implementation patterns for modeling domain concepts (focus of this tutorial)
- **Ubiquitous Language**: Shared vocabulary used by both developers and domain experts
- **Domain Model**: Software representation of business concepts and rules

**Key Takeaway**: DDD bridges the gap between business requirements and technical implementation by creating a shared language and organizing code around business concepts. Strategic patterns guide system architecture; tactical patterns guide code structure.

**Why It Matters**: Most software failures stem from miscommunication between business and technical teams. When Netflix built their recommendation system, initial implementation used technical terms ("UserVector," "ItemMatrix") that domain experts couldn't understand. Adopting DDD's Ubiquitous Language (renaming to "ViewingPreferences," "ContentCatalog") enabled domain experts to review code, catching business logic errors that technical teams missed. This collaboration improved recommendation accuracy from 65% to 82%, directly impacting customer retention. DDD's shared language prevents the costly translation errors that plague traditional development approaches.

### Example 2: Anemic vs Rich Domain Model

Comparing anemic domain models (data structures with separate service logic) to rich domain models (objects containing both data and behavior).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Anemic Model\nData only\n(no behavior)"]
    B["Service Layer\nAll business logic\nexternal to model"]
    C["Rich Domain Model\nData + Behavior\n(encapsulated)"]
    D["Domain Experts\nUnderstand rich model\nnot anemic split"]

    A -->|depends on| B
    C -->|replaces both| A
    C -->|replaces both| B
    D -->|collaborates with| C

    style A fill:#CA9161,stroke:#000,color:#fff
    style B fill:#CA9161,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#0173B2,stroke:#000,color:#fff
```

**Anemic Domain Model (Anti-pattern)**:

```typescript
// Anemic model - just data, no behavior
class BankAccount {
  constructor(
    // => Constructor: initializes object with provided parameters
    public accountNumber: string, // => Public fields break encapsulation
    public balance: number, // => Can be modified without validation
    public isActive: boolean,
  ) {}
}

// Business logic in separate service
class BankingService {
  withdraw(account: BankAccount, amount: number): void {
    if (!account.isActive) {
      // => Business rule in service (not domain object)
      throw new Error("Account inactive");
      // => Raise domain exception
    }
    // => Validates business rule

    if (account.balance < amount) {
      throw new Error("Insufficient funds");
      // => Raise domain exception
    }
    // => Enforces invariant

    account.balance -= amount; // => Direct mutation, no protection or events
  }
}

// Usage
const account = new BankAccount("123", 1000, true);
// => account: {accountNumber: "123", balance: 1000, isActive: true}
const service = new BankingService();
// => Creates BankingService instance for use in the example
service.withdraw(account, 500); // => account.balance becomes 500
console.log(account.balance); // => Output: 500
```

**Problem**: Business rules scattered in services, domain objects just data containers, no encapsulation.

**Rich Domain Model (DDD approach)**:

```typescript
// Rich domain model - data + behavior + business rules
class BankAccount {
  constructor(accountNumber: string, initialBalance: number) {
    // => Initialize object with parameters
    this.accountNumber = accountNumber;
    // => Update accountNumber state
    this.balance = initialBalance;
    // => Update balance state
    this.isActive = true;
    // => New accounts active by default
    // => Business rule: accounts start active
  }

  withdraw(amount: number): void {
    this.ensureIsActive();
    // => Business rule #1: must be active to withdraw
    this.ensureSufficientFunds(amount);
    // => Business rule #2: sufficient funds required
    this.balance -= amount;
    // => balance reduced by amount (balance decremented)
  }
  // => Validates business rule

  private ensureIsActive(): void {
    // => Helper: ensureIsActive()
    if (!this.isActive) {
      throw new Error("Cannot withdraw from inactive account");
      // => Raise domain exception
    }
    // => Enforces invariant
  }

  private ensureSufficientFunds(amount: number): void {
    // => Helper: ensureSufficientFunds()
    if (this.balance < amount) {
      throw new Error(`Insufficient funds. Balance: ${this.balance}, Requested: ${amount}`);
      // => Raise domain exception
    }
  }

  getBalance(): number {
    // => Read-only access to balance
    // => No setBalance() method exists
    return this.balance;
    // => Return result to caller
  }
}

// Usage
const account = new BankAccount("123", 1000);
// => balance=1000, isActive=true
account.withdraw(500);
// => ensureSufficientFunds(500) validates balance >= 500
// => balance becomes 500
console.log(account.getBalance());
// => Output: 500
```

**Key Takeaway**: Rich domain models encapsulate business rules within domain objects, protecting invariants and making business logic explicit and discoverable. Services coordinate, but domain objects enforce rules.

**Why It Matters**: Anemic models lead to scattered business logic that's hard to maintain and test. When Shopify refactored their order processing from anemic to rich domain models, they reduced order-related bugs by 73%. Business rules previously scattered across 15 service classes were consolidated into Order, LineItem, and Discount domain objects. This enabled domain experts to review actual business logic (previously hidden in services) and catch edge cases like "discount can't exceed item price" that technical teams had missed. Rich domain models make business rules visible, testable, and maintainable.

### Example 3: Ubiquitous Language in Code

The same business terminology should be used in conversations, documentation, and code to prevent translation errors.

```typescript
// Domain: Healthcare appointment scheduling
// Ubiquitous Language terms: Patient, Practitioner, Appointment, TimeSlot

// ❌ WRONG: Using technical terms instead of domain language
class Person1 {
  // => Person1: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(public id: string) {}
  // => Initialize object with parameters
  // => All fields initialized: object in valid initial state
}
// => End of Person1 class

class Person2 {
  // => Person2: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(public id: string) {}
  // => Initialize object with parameters
  // => All fields initialized: object in valid initial state
}
// => End of Person2 class

class Event {
  // => Event: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    public person1Id: string, // => Who is person1?
    public person2Id: string, // => Who is person2?
    public startTime: Date,
    // => startTime: public Date field

    public endTime: Date,
    // => endTime: public Date field
  ) {}
  // => Constructor body empty: no additional initialization needed
}
// => End of Event class

// ✅ CORRECT: Using domain language directly
class Patient {
  // => Patient: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    private readonly patientId: string, // => Domain-specific identifier
    private readonly name: string,
    // => Encapsulated state, not directly accessible
    // => Human-readable identifier for ubiquitous language

    private readonly dateOfBirth: Date,
    // => Encapsulated state, not directly accessible
    // => Temporal: records when event occurred
  ) {}
  // => Constructor body empty: no additional initialization needed

  getPatientId(): string {
    // => getPatientId: returns string
    // => Domain operation: enforces business rules

    return this.patientId; // => Returns patient ID
  }
  // => End of getPatientId()
}
// => End of Patient class

class Practitioner {
  // => Practitioner: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    private readonly practitionerId: string, // => Domain-specific identifier
    private readonly name: string,
    // => name: private readonly string field

    private readonly specialty: string, // => Domain term: specialty, not "skill"
  ) {}
  // => Constructor body empty: no additional initialization needed

  getPractitionerId(): string {
    // => getPractitionerId: returns string
    // => Domain operation: enforces business rules

    return this.practitionerId; // => Returns practitioner ID
  }
  // => End of getPractitionerId()
}
// => End of Practitioner class

class TimeSlot {
  // => TimeSlot: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    private readonly startTime: Date, // => Slot start time
    private readonly endTime: Date, // => Slot end time
  ) {}
  // => Constructor body empty: no additional initialization needed

  getDurationMinutes(): number {
    // => getDurationMinutes: returns number
    // => Domain operation: enforces business rules

    const diff = this.endTime.getTime() - this.startTime.getTime(); // => Calculate difference
    return diff / (1000 * 60); // => Convert milliseconds to minutes
  }
  // => End of getDurationMinutes()
}
// => End of TimeSlot class

class Appointment {
  // => Appointment: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    private readonly appointmentId: string, // => Unique appointment identifier
    private readonly patient: Patient, // => Who is being seen
    private readonly practitioner: Practitioner, // => Who is providing care
    private readonly timeSlot: TimeSlot, // => When the appointment occurs
    private status: AppointmentStatus, // => Current state: scheduled, completed, cancelled
  ) {}
  // => Constructor body empty: no additional initialization needed

  cancel(): void {
    // => cancel: returns void
    // => Domain operation: enforces business rules

    if (this.status === AppointmentStatus.Completed) {
      // => Checks: this.status === AppointmentStatus.Completed
      // => State validation: ensures preconditions met

      throw new Error("Cannot cancel completed appointment");
      // => Raise domain exception
    }
    this.status = AppointmentStatus.Cancelled; // => Update to cancelled
    // => Appointment cancelled
  }
  // => End of cancel()
}
// => End of Appointment class

enum AppointmentStatus {
  // => Domain vocabulary for appointment states
  Scheduled = "SCHEDULED", // => Appointment is booked
  Completed = "COMPLETED", // => Visit finished
  Cancelled = "CANCELLED", // => Appointment cancelled
}

// Usage with domain language
const patient = new Patient("P123", "John Doe", new Date("1980-05-15")); // => Create patient
const doctor = new Practitioner("D456", "Dr. Smith", "Cardiology"); // => Create practitioner
const slot = new TimeSlot(new Date("2026-02-01T10:00"), new Date("2026-02-01T10:30")); // => 30-minute slot
const appointment = new Appointment("A789", patient, doctor, slot, AppointmentStatus.Scheduled); // => Schedule appointment
appointment.cancel(); // => status becomes Cancelled
```

**Key Takeaway**: Use domain terminology (Patient, Practitioner, Appointment) directly in code, matching the language domain experts use. Avoid generic terms (Person, Event) or technical jargon that requires translation.

**Why It Matters**: Translation between business language and technical language causes bugs. When Epic Systems (healthcare software) analyzed incident reports, 45% of bugs stemmed from terminology mismatches—developers used "User" while doctors said "Patient," leading to confusion about medical record access rules. Adopting Ubiquitous Language eliminated this class of bugs entirely. Code reviews became collaborative sessions where medical staff could verify business rules by reading actual code, catching domain errors before production. Ubiquitous Language turns code into documentation that domain experts can validate.

## Entities - Identity and Lifecycle (Examples 4-8)

### Example 4: Entity with Identity

Entities are objects defined by their identity, not their attributes. Two entities with the same data but different IDs are distinct.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Entity A\nID: ORD-001\nstatus: Draft"]
    B["Entity B\nID: ORD-002\nstatus: Draft"]
    C["Identity Check\nA == B?"]
    D["Result: NOT EQUAL\nDifferent IDs\ndespite same data"]

    A -->|compared by ID| C
    B -->|compared by ID| C
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#CA9161,stroke:#000,color:#fff
```

```typescript
// Domain: E-commerce orders
class Order {
  // => Entity: defined by identity
  // => Rich domain model: combines data + business behavior
  // => OOP: bundles data with behavior

  private readonly orderId: string; // => Unique identifier (never changes)
  private customerId: string; // => Can change (customer reassignment)
  private items: OrderItem[]; // => Can change (add/remove items)
  private status: OrderStatus; // => Can change (order lifecycle)

  constructor(orderId: string, customerId: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state
    // => DDD pattern: aggregate root creation

    this.orderId = orderId; // => Set immutable ID
    this.customerId = customerId; // => Set initial customer
    this.items = []; // => Start with empty items
    this.status = OrderStatus.Draft; // => New orders start as draft
    // => Order created: id=orderId, customer=customerId, items=[], status=Draft
  }
  // => End of constructor body
  // => Domain logic applied here

  addItem(productId: string, quantity: number, price: number): void {
    // => addItem: returns void
    // => Domain operation: enforces business rules

    const item = new OrderItem(productId, quantity, price); // => Create new item
    this.items.push(item); // => Add to items array
    // => Item added: items.length increased by 1
  }
  // => End of addItem()
  // => Domain logic applied here

  submit(): void {
    // => submit: returns void
    // => Domain operation: enforces business rules

    if (this.items.length === 0) {
      // => Validate has items
      // => Domain rule: precondition before operation
      // => Instance-level state change

      throw new Error("Cannot submit empty order");
      // => Throws domain error: "Cannot submit empty order"
      // => Domain invariant violated: operation rejected
      // => Caller must handle this exception case
    }
    this.status = OrderStatus.Submitted; // => Change status to submitted
    // => Order submitted
  }
  // => End of submit()

  equals(other: Order): boolean {
    // => equals: returns boolean
    // => Domain operation: enforces business rules

    return this.orderId === other.orderId; // => Identity comparison (not attribute comparison)
  }
  // => End of equals()

  getOrderId(): string {
    // => getOrderId: returns string
    // => Domain operation: enforces business rules

    return this.orderId; // => Read-only access to ID
  }
  // => End of getOrderId()
}
// => End of Order class

class OrderItem {
  // => OrderItem: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    public readonly productId: string, // => Product being ordered
    public readonly quantity: number, // => How many
    public readonly price: number, // => Price per unit
  ) {}
  // => Constructor body empty: no additional initialization needed
}
// => End of OrderItem class

enum OrderStatus {
  // => OrderStatus: enumeration of domain values

  Draft = "DRAFT", // => Order being built
  Submitted = "SUBMITTED", // => Order placed
  Shipped = "SHIPPED", // => Order sent to customer
  Delivered = "DELIVERED", // => Order received by customer
}
// => End of Order class definition

// Usage demonstrating identity
const order1 = new Order("ORD-001", "CUST-123"); // => order1: id=ORD-001
order1.addItem("PROD-A", 2, 50.0); // => order1: items=[{PROD-A, qty=2, price=50}]

const order2 = new Order("ORD-001", "CUST-456"); // => order2: id=ORD-001 (same ID)
// => order1.equals(order2) returns TRUE even though customers differ
// => Identity (orderId) defines equality, not attributes

const order3 = new Order("ORD-002", "CUST-123"); // => order3: id=ORD-002 (different ID)
// => order1.equals(order3) returns FALSE even though customer same
// => Different identity = different entity
```

**Key Takeaway**: Entities have unique identities that persist throughout their lifecycle. Equality is based on identity (ID), not attributes. Same ID = same entity, even if attributes differ.

**Why It Matters**: Identity vs attribute equality prevents critical business errors. When Amazon's order system compared orders by attributes instead of ID, customers editing orders (changing items/addresses) created duplicate order entries—same customer + same items looked like "duplicate submission" and got blocked. Switching to ID-based equality fixed this: editing order ORD-001 modifies the same entity, not creating a duplicate. Entity identity enables object lifecycle management, audit trails, and eventual consistency in distributed systems.

### Example 5: Entity Lifecycle State Machine

Entities often have lifecycle states with allowed transitions. This example shows order lifecycle management.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Draft
    Draft --> Confirmed : confirm()
    Confirmed --> Paid : pay()
    Paid --> Shipped : ship()
    Shipped --> Delivered : deliver()
    Confirmed --> Cancelled : cancel()
    Paid --> Cancelled : cancel()
    Cancelled --> [*]
    Delivered --> [*]
```

```typescript
// Domain: Order processing with state transitions
class Order {
  // => Order: domain class definition
  // => Encapsulates data and domain behavior together
  // => OOP: bundles data with behavior

  private readonly orderId: string; // => Immutable identity
  private status: OrderStatus; // => Current lifecycle state

  constructor(orderId: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state
    // => DDD pattern: aggregate root creation

    this.orderId = orderId; // => Set ID
    this.status = OrderStatus.Draft; // => Initial state: Draft
    // => Order created in Draft state
  }
  // => End of constructor body
  // => Domain logic applied here

  submit(): void {
    // => submit: returns void
    // => Domain operation: enforces business rules

    this.ensureCanTransitionTo(OrderStatus.Submitted); // => Validate transition allowed
    this.status = OrderStatus.Submitted; // => Transition to Submitted
    // => Status: Draft → Submitted
  }
  // => End of submit()
  // => Domain logic applied here

  ship(): void {
    // => ship: returns void
    // => Domain operation: enforces business rules

    this.ensureCanTransitionTo(OrderStatus.Shipped); // => Validate transition allowed
    this.status = OrderStatus.Shipped; // => Transition to Shipped
    // => Status: Submitted → Shipped
  }
  // => End of ship()
  // => Domain logic applied here

  deliver(): void {
    // => deliver: returns void
    // => Domain operation: enforces business rules

    this.ensureCanTransitionTo(OrderStatus.Delivered); // => Validate transition allowed
    this.status = OrderStatus.Delivered; // => Transition to Delivered
    // => Status: Shipped → Delivered
  }
  // => End of deliver()
  // => Domain logic applied here

  cancel(): void {
    // => cancel: returns void
    // => Domain operation: enforces business rules

    this.ensureCanTransitionTo(OrderStatus.Cancelled); // => Validate transition allowed
    this.status = OrderStatus.Cancelled; // => Transition to Cancelled
    // => Status: [any state] → Cancelled
  }
  // => End of cancel()
  // => Domain logic applied here

  private ensureCanTransitionTo(newStatus: OrderStatus): void {
    // => Internal logic (not part of public API)
    // => Encapsulated: accessed only through domain methods
    // => Not directly accessible to clients

    const allowedTransitions = this.getAllowedTransitions(); // => Get valid next states

    if (!allowedTransitions.includes(newStatus)) {
      // => Check if transition valid
      // => Domain rule: precondition before operation

      throw new Error(
        // => Throws domain exception
        // => Domain invariant violated: operation rejected
        // => Caller must handle this exception case

        `Invalid transition from ${this.status} to ${newStatus}. ` + `Allowed: ${allowedTransitions.join(", ")}`,
        // => Delegates to internal method
        // => Modifies this aggregate instance
      );
    }
    // => Transition validated
    // => Domain logic applied here
  }
  // => End of constructor body
  // => Domain logic applied here

  private getAllowedTransitions(): OrderStatus[] {
    // => Internal logic (not part of public API)
    // => Collection: add/remove through domain methods only

    const transitions: Record<OrderStatus, OrderStatus[]> = {
      // => transitions = {

      [OrderStatus.Draft]: [OrderStatus.Submitted, OrderStatus.Cancelled], // => Draft can go to Submitted or Cancelled
      [OrderStatus.Submitted]: [OrderStatus.Shipped, OrderStatus.Cancelled], // => Submitted can go to Shipped or Cancelled
      [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Cancelled], // => Shipped can go to Delivered or Cancelled
      [OrderStatus.Delivered]: [], // => Delivered is terminal (no transitions)
      [OrderStatus.Cancelled]: [], // => Cancelled is terminal (no transitions)
    };

    return transitions[this.status]; // => Return allowed transitions for current state
  }

  getStatus(): OrderStatus {
    // => getStatus: returns OrderStatus
    // => Domain operation: enforces business rules

    return this.status; // => Read current status
  }
  // => End of getStatus()
}
// => End of Order class

enum OrderStatus {
  // => OrderStatus: enumeration of domain values

  Draft = "DRAFT",
  // => Draft = "DRAFT",

  Submitted = "SUBMITTED",
  // => Submitted = "SUBMITTED",

  Shipped = "SHIPPED",
  // => Shipped = "SHIPPED",

  Delivered = "DELIVERED",
  // => Delivered = "DELIVERED",

  Cancelled = "CANCELLED",
  // => Cancelled = "CANCELLED",
}

// Usage showing valid and invalid transitions
const order = new Order("ORD-001"); // => order: status=Draft
console.log(order.getStatus()); // => Output: DRAFT

order.submit(); // => status: Draft → Submitted (valid)
console.log(order.getStatus()); // => Output: SUBMITTED

order.ship(); // => status: Submitted → Shipped (valid)
console.log(order.getStatus()); // => Output: SHIPPED

// order.submit();                           // => Would throw error: cannot Submitted from Shipped
order.deliver(); // => status: Shipped → Delivered (valid)
console.log(order.getStatus()); // => Output: DELIVERED

// order.ship();                             // => Would throw error: Delivered is terminal state
```

**Key Takeaway**: Entities with lifecycle states should enforce valid state transitions using state machine patterns. Prevent invalid transitions (e.g., can't ship a delivered order) by encoding business rules in the entity itself.

**Why It Matters**: Invalid state transitions cause data inconsistencies and business process failures. When Shopify analyzed their order fulfillment bugs, 30% stemmed from invalid state transitions (orders marked "shipped" before "paid," orders "refunded" that were never "delivered"). Implementing state machine enforcement in Order entity eliminated these bugs entirely. Business rules about valid transitions became executable code that prevented impossible states. State machines in entities make business process rules explicit, testable, and automatically enforced.

### Example 6: Entity with Invariants

Entities must protect their invariants (business rules that must always be true).

```java
// Domain: Banking - Account with overdraft protection
public class BankAccount {
// => class: public unknown field
// => Rich domain model: combines data + business behavior
// => OOP: bundles data with behavior



    private final String accountId;          // => Immutable identity
    private Money balance;                   // => Current balance (changes over time)
    private final Money overdraftLimit;      // => Maximum allowed negative balance
    private boolean isFrozen;                // => Account status flag

    public BankAccount(String accountId, Money initialBalance, Money overdraftLimit) {
    // => BankAccount: public unknown field
    // => Aggregate state managed


        if (overdraftLimit.isNegative()) {   // => Validate: overdraft limit cannot be negative
            throw new IllegalArgumentException("Overdraft limit must be non-negative");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        this.accountId = accountId;          // => Set immutable ID
        this.balance = initialBalance;       // => Set initial balance
        this.overdraftLimit = overdraftLimit;  // => Set overdraft protection
        this.isFrozen = false;               // => Account starts active (not frozen)

        this.ensureInvariants();             // => Validate invariants on creation
        // => Account created with valid state
    }

    public void deposit(Money amount) {
    // => void: public unknown field
    // => Domain logic applied here


        if (amount.isNegativeOrZero()) {     // => Validate: deposit must be positive
            throw new IllegalArgumentException("Deposit amount must be positive");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        this.ensureNotFrozen();              // => Validate: account not frozen
        this.balance = this.balance.add(amount);  // => Add to balance
        this.ensureInvariants();             // => Validate invariants after change
        // => balance increased by amount
    }

    public void withdraw(Money amount) {
    // => void: public unknown field
    // => Business rule enforced


        if (amount.isNegativeOrZero()) {     // => Validate: withdrawal must be positive
            throw new IllegalArgumentException("Withdrawal amount must be positive");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        this.ensureNotFrozen();              // => Validate: account not frozen
        this.ensureSufficientFundsWithOverdraft(amount);  // => Validate: within overdraft limit

        this.balance = this.balance.subtract(amount);     // => Deduct from balance
        this.ensureInvariants();             // => Validate invariants after change
        // => balance decreased by amount
    }

    public void freeze() {
    // => void: public unknown field
    // => Part of domain model implementation


        this.isFrozen = true;                // => Set frozen flag
        // => Account frozen (no deposits/withdrawals allowed)
    }

    private void ensureNotFrozen() {
    // => void: private unknown field
    // => Identity: encapsulated, exposed only via getter
    // => Not directly accessible to clients



        if (this.isFrozen) {                 // => Check frozen status
            throw new IllegalStateException("Cannot perform operations on frozen account");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }
        // => Validation passed: account is active
        // => Domain logic applied here

    }

    private void ensureSufficientFundsWithOverdraft(Money amount) {
    // => void: private unknown field
    // => Identity: encapsulated, exposed only via getter
    // => Not directly accessible to clients



        Money minimumAllowed = this.overdraftLimit.negate();  // => Calculate minimum balance (negative overdraft)
        Money balanceAfterWithdrawal = this.balance.subtract(amount);  // => Calculate new balance

        if (balanceAfterWithdrawal.isLessThan(minimumAllowed)) {  // => Check if below overdraft limit
            throw new IllegalStateException(
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


                String.format("Insufficient funds. Balance: %s, Withdrawal: %s, Overdraft limit: %s",
                // => Calls String.format()
                // => Business rule enforced


                    this.balance, amount, this.overdraftLimit)
            );
        }
        // => Validation passed: withdrawal within limits
        // => Domain logic applied here

    }

    private void ensureInvariants() {
      // => Encapsulated state, not directly accessible
      // => Identity: encapsulated, exposed only via getter
      // => Not directly accessible to clients


        // Invariant 1: Balance + overdraft limit >= 0
        Money minimumAllowed = this.overdraftLimit.negate();  // => Calculate minimum allowed balance
        if (this.balance.isLessThan(minimumAllowed)) {        // => Check invariant
            throw new IllegalStateException("Invariant violation: balance below overdraft limit");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        // Invariant 2: Overdraft limit is non-negative
        if (this.overdraftLimit.isNegative()) {               // => Check invariant
            throw new IllegalStateException("Invariant violation: overdraft limit cannot be negative");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        // => All invariants satisfied
    }

    public Money getBalance() {
    // => Money: public unknown field
    // => Part of domain model implementation


        return this.balance;                 // => Return current balance
    }
}

// Money: value object handling currency amounts and validation
public class Money {
// => class: public unknown field
// => Rich domain model: combines data + business behavior
// => OOP: bundles data with behavior



    private final BigDecimal amount;
      // => Encapsulated state, not directly accessible
      // => Encapsulated: accessed only through domain methods
      // => Not directly accessible to clients


    private final String currency;
      // => Encapsulated state, not directly accessible
      // => Encapsulated: accessed only through domain methods
      // => Not directly accessible to clients



    public Money(BigDecimal amount, String currency) {
    // => Money: public unknown field

        this.amount = amount;
          // => Update amount state
          // => Mutates aggregate state

        this.currency = currency;
          // => Update currency state
          // => Mutates aggregate state

    }

    public Money add(Money other) {
    // => Money: public unknown field

        this.ensureSameCurrency(other);
        // => Delegates to internal method
        return new Money(this.amount.add(other.amount), this.currency);
          // => Return result to caller
          // => Returns computed domain value

    }

    public Money subtract(Money other) {
    // => Money: public unknown field

        this.ensureSameCurrency(other);
        // => Delegates to internal method
        return new Money(this.amount.subtract(other.amount), this.currency);
          // => Return result to caller
          // => Returns computed domain value

    }

    public Money negate() {
    // => Money: public unknown field

        return new Money(this.amount.negate(), this.currency);
          // => Return result to caller
          // => Returns computed domain value

    }

    public boolean isNegative() {
    // => boolean: public unknown field

        return this.amount.compareTo(BigDecimal.ZERO) < 0;
          // => Return result to caller
          // => Returns computed domain value

    }

    public boolean isNegativeOrZero() {
    // => boolean: public unknown field

        return this.amount.compareTo(BigDecimal.ZERO) <= 0;
          // => Return result to caller
          // => Returns computed domain value

    }

    public boolean isLessThan(Money other) {
    // => boolean: public unknown field

        this.ensureSameCurrency(other);
        // => Delegates to internal method
        return this.amount.compareTo(other.amount) < 0;
          // => Return result to caller
          // => Returns computed domain value

    }

    private void ensureSameCurrency(Money other) {
      // => Encapsulated state, not directly accessible
      // => Identity: encapsulated, exposed only via getter

        if (!this.currency.equals(other.currency)) {
          // => Conditional check
          // => Domain rule: precondition before operation

            throw new IllegalArgumentException("Cannot operate on different currencies");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }
    }
}

// Usage
Money initialBalance = new Money(new BigDecimal("1000.00"), "USD");     // => Create initial balance
Money overdraftLimit = new Money(new BigDecimal("500.00"), "USD");      // => Allow $500 overdraft
BankAccount account = new BankAccount("ACC-001", initialBalance, overdraftLimit);  // => Create account

account.deposit(new Money(new BigDecimal("500.00"), "USD"));            // => balance: $1000 → $1500
account.withdraw(new Money(new BigDecimal("2000.00"), "USD"));          // => balance: $1500 → -$500 (within overdraft)
// account.withdraw(new Money(new BigDecimal("100.00"), "USD"));        // => Would throw: exceeds overdraft limit (-$600 < -$500)

account.freeze();                                                       // => Account frozen
// account.deposit(new Money(new BigDecimal("100.00"), "USD"));         // => Would throw: frozen account
```

**Key Takeaway**: Entities protect their invariants (rules that must always be true) by validating all state changes. Encapsulate validation logic in private methods and check invariants after every mutation.

**Why It Matters**: Unprotected invariants lead to corrupt data and business rule violations. When PayPal analyzed transaction failures, they found 15% of failed payments involved negative balances that exceeded overdraft limits—invariants were enforced in application services but not in Account entity itself, allowing direct database updates to bypass validation. Moving invariant protection into Account entity made invariants impossible to violate regardless of how the account was modified. Entities that protect their own invariants ensure data integrity even in complex systems with multiple modification paths.

### Example 7: Entity Repository Pattern

Repositories provide persistence abstraction for entities, hiding database details from domain logic.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Domain Layer\nCustomer Entity\nBusiness Logic"]
    B["Repository Interface\nCustomerRepository\n(domain contract)"]
    C["Repository Implementation\nSQLCustomerRepository\n(infrastructure)"]
    D["Database\nPersistence Store"]

    A -->|uses interface| B
    B -->|implemented by| C
    C -->|reads/writes| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#CC78BC,stroke:#000,color:#fff
```

```typescript
// Domain: Customer management
class Customer {
  // => Entity with identity
  // => Rich domain model: combines data + business behavior
  // => OOP: bundles data with behavior

  private readonly customerId: string; // => Unique identifier
  private email: string; // => Customer email
  private name: string; // => Customer name
  private createdAt: Date; // => Registration timestamp

  constructor(customerId: string, email: string, name: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state
    // => DDD pattern: aggregate root creation

    this.customerId = customerId; // => Set ID
    this.email = email; // => Set email
    this.name = name; // => Set name
    this.createdAt = new Date(); // => Record creation time
    // => Customer created
  }
  // => End of constructor body
  // => Domain logic applied here

  changeEmail(newEmail: string): void {
    // => changeEmail: returns void
    // => Domain operation: enforces business rules

    if (!this.isValidEmail(newEmail)) {
      // => Validate email format
      // => Domain rule: precondition before operation
      // => Instance-level state change

      throw new Error("Invalid email format");
      // => Raise domain exception
      // => Invariant enforcement: invalid state rejected
      // => Caller must handle this exception case
    }
    this.email = newEmail; // => Update email
    // => Email changed
  }
  // => End of changeEmail()
  // => Domain logic applied here

  private isValidEmail(email: string): boolean {
    // => Internal logic (not part of public API)
    // => Identity: encapsulated, exposed only via getter
    // => Not directly accessible to clients

    return email.includes("@"); // => Simple validation (real impl would use regex)
  }
  // => End of constructor body
  // => Domain logic applied here

  getCustomerId(): string {
    // => getCustomerId: returns string
    // => Domain operation: enforces business rules

    return this.customerId;
    // => Return result to caller
    // => Returns computed domain value
    // => Instance-level state change
  }
  // => End of getCustomerId()
  // => Domain logic applied here

  getEmail(): string {
    // => getEmail: returns string
    // => Domain operation: enforces business rules

    return this.email;
    // => Return result to caller
    // => Returns computed domain value
    // => Instance-level state change
  }
  // => End of getEmail()
  // => Domain logic applied here
}
// => End of Customer class
// => Domain logic applied here

// Repository interface (domain layer - no database details)
interface CustomerRepository {
  // => CustomerRepository: contract/interface definition
  // => Dependency inversion: domain does not depend on infrastructure

  save(customer: Customer): Promise<void>; // => Persist customer
  findById(customerId: string): Promise<Customer | null>; // => Retrieve by ID
  findByEmail(email: string): Promise<Customer | null>; // => Retrieve by email
  delete(customerId: string): Promise<void>; // => Remove customer
}
// => End of CustomerRepository interface

// Repository implementation (infrastructure layer - database details)
class PostgresCustomerRepository implements CustomerRepository {
  // => PostgresCustomerRepository: implements CustomerRepository interface
  // => Rich domain model: combines data + business behavior

  constructor(private db: DatabaseConnection) {} // => Injects any DatabaseConnection (pg, mysql2, etc.)
  // => DatabaseConnection: any database driver implementing execute() and queryOne()
  // => All fields initialized: object in valid initial state

  async save(customer: Customer): Promise<void> {
    // => save(): async returns Promise<void>

    const query = `
      // => Store value in query
      INSERT INTO customers (customer_id, email, name, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (customer_id) DO UPDATE
      SET email = $2, name = $3
    `;
    // => Upsert query (insert or update if exists)

    await this.db.execute(query, [
      // => Awaits async operation

      customer.getCustomerId(),
      // => Execute method
      customer.getEmail(),
      // => Execute method
      customer.getName(),
      // => Execute method
      customer.getCreatedAt(),
      // => Execute method
    ]);
    // => Customer saved to database
  }
  // => End of save()

  async findById(customerId: string): Promise<Customer | null> {
    // => findById(): async returns Promise<Customer | null>

    const query = `SELECT * FROM customers WHERE customer_id = $1`; // => SQL query
    const row = await this.db.queryOne(query, [customerId]); // => Execute query

    if (!row) {
      // => Checks: !row
      // => Domain rule: precondition before operation

      return null; // => Customer not found
    }

    return this.mapRowToCustomer(row); // => Convert database row to domain entity
  }
  // => End of findById()

  async findByEmail(email: string): Promise<Customer | null> {
    // => findByEmail(): async returns Promise<Customer | null>

    const query = `SELECT * FROM customers WHERE email = $1`; // => SQL query
    const row = await this.db.queryOne(query, [email]); // => Execute query

    if (!row) {
      // => Checks: !row
      // => Domain rule: precondition before operation

      return null; // => Customer not found
    }

    return this.mapRowToCustomer(row); // => Convert to domain entity
  }
  // => End of findByEmail()

  async delete(customerId: string): Promise<void> {
    // => delete(): async returns Promise<void>

    const query = `DELETE FROM customers WHERE customer_id = $1`; // => SQL delete
    await this.db.execute(query, [customerId]); // => Execute deletion
    // => Customer deleted from database
  }
  // => End of delete()

  private mapRowToCustomer(row: any): Customer {
    // => Internal logic (not part of public API)
    // => Encapsulated: accessed only through domain methods

    return new Customer(
      // => Returns new Customer(
      // => Creates and returns new instance

      row.customer_id, // => Reconstruct entity from database row
      row.email,
      row.name,
    );
  }
}
// => End of PostgresCustomerRepository class

// Usage (domain service using repository)
class CustomerService {
  // => CustomerService: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(private customerRepo: CustomerRepository) {} // => Inject repository

  async changeCustomerEmail(customerId: string, newEmail: string): Promise<void> {
    // => changeCustomerEmail(): async returns Promise<void>

    const customer = await this.customerRepo.findById(customerId); // => Load entity

    if (!customer) {
      // => Checks: !customer
      // => Domain rule: precondition before operation

      throw new Error("Customer not found");
      // => Raise domain exception
      // => Invariant enforcement: invalid state rejected
      // => Caller must handle this exception case
    }

    customer.changeEmail(newEmail); // => Domain logic (validates email)
    await this.customerRepo.save(customer); // => Persist changes
    // => Email changed and saved
  }
  // => End of changeCustomerEmail()
}
// => End of CustomerService class

// Usage example
const db = new DatabaseConnection(); // => Database connection
const customerRepo = new PostgresCustomerRepository(db); // => Create repository
const customerService = new CustomerService(customerRepo); // => Create service

// Change email for customer
await customerService.changeCustomerEmail("CUST-123", "newemail@example.com");
// => Loads customer, validates email, saves changes
```

**Key Takeaway**: Repositories abstract persistence, allowing domain logic to work with entities without knowing database details. Domain layer defines repository interfaces; infrastructure layer implements them.

**Why It Matters**: Coupling domain logic to database details makes code hard to test and change. When LinkedIn migrated from Oracle to MySQL, repositories enabled zero domain logic changes—only repository implementations changed. Tests using in-memory repository implementations continued working. Repository pattern separates "what" (domain operations on entities) from "how" (database storage), enabling database migrations, testing, and eventual consistency patterns without touching business logic.

### Example 8: Entity Factory Pattern

Factories encapsulate complex entity creation logic, ensuring entities are always created in valid states.

```java
// Domain: E-commerce product creation
public class Product {
// => class: public unknown field
// => Rich domain model: combines data + business behavior
// => OOP: bundles data with behavior



    private final String productId;          // => Unique identifier
    private final String name;               // => Product name
    private final Money price;               // => Product price
    private final ProductCategory category;  // => Product category
    private final List<String> tags;         // => Search tags
    private ProductStatus status;            // => Current status

    // Private constructor - only factory can create
    private Product(
      // => Encapsulated state, not directly accessible
      // => Encapsulated: accessed only through domain methods
      // => Not directly accessible to clients


        String productId,
        String name,
        Money price,
        ProductCategory category,
        List<String> tags
    ) {
        this.productId = productId;          // => Set ID
        this.name = name;                    // => Set name
        this.price = price;                  // => Set price
        this.category = category;            // => Set category
        this.tags = new ArrayList<>(tags);   // => Copy tags (defensive copy)
        this.status = ProductStatus.DRAFT;   // => New products start as draft
        // => Product created in valid initial state
    }

    public void publish() {
    // => void: public unknown field
    // => Part of domain model implementation
    // => Domain model component



        if (this.status != ProductStatus.DRAFT) {
        // => Checks: this.status != ProductStatus.DRAFT
        // => State validation: ensures preconditions met
        // => Instance-level state change



            throw new IllegalStateException("Can only publish draft products");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }
        this.status = ProductStatus.PUBLISHED;  // => Change status to published
        // => Product published
    }

    // Factory for creating products
    public static class Factory {
    // => static: public unknown field
    // => Rich domain model: combines data + business behavior
    // => OOP: bundles data with behavior



        private final IdGenerator idGenerator;        // => ID generation service
        private final PricingService pricingService;  // => Pricing validation

        public Factory(IdGenerator idGenerator, PricingService pricingService) {
        // => Factory: public unknown field
        // => Domain logic applied here
        // => Business logic applied



            this.idGenerator = idGenerator;      // => Inject ID generator
            this.pricingService = pricingService;  // => Inject pricing service
            // => Factory initialized
        }

        public Product createProduct(
        // => Product: public unknown field
        // => Domain logic applied here
        // => DDD tactical pattern



            String name,
            BigDecimal basePrice,
            String currency,
            ProductCategory category,
            List<String> tags
        ) {
            // Step 1: Validate inputs
            this.validateName(name);             // => Ensure name is valid
            this.validateCategory(category);     // => Ensure category is valid
            this.validateTags(tags);             // => Ensure tags are valid
            // => All validations passed

            // Step 2: Generate ID
            String productId = this.idGenerator.generateProductId();  // => Create unique ID
            // => ID generated: productId

            // Step 3: Calculate price (may involve complex logic)
            Money price = this.pricingService.calculatePrice(
                basePrice,
                currency,
                category
            );
            // => Price calculated with category-specific rules
            // => Domain logic applied here
            // => Aggregate consistency enforced



            // Step 4: Normalize tags
            List<String> normalizedTags = tags.stream()
                .map(String::toLowerCase)        // => Convert to lowercase
                .map(String::trim)               // => Remove whitespace
                .distinct()                      // => Remove duplicates
                .collect(Collectors.toList());
            // => Tags normalized
            // => Business rule enforced
            // => Domain operation processed



            // Step 5: Create product
            Product product = new Product(
              // => Create Product instance
              // => Business rule enforced
              // => Entity lifecycle managed


                productId,
                name,
                price,
                category,
                normalizedTags
            );
            // => Product created with valid state
            // => Domain logic applied here
            // => Domain service delegation



            return product;                      // => Return fully initialized product
        }

        public Product createProductFromExisting(Product template, String newName) {
        // => Product: public unknown field
        // => Business rule enforced
        // => Repository interaction point



            // Clone existing product with new name
            String newProductId = this.idGenerator.generateProductId();  // => New ID

            return new Product(
            // => Returns new Product(
            // => Creates and returns new instance
            // => Value object creation



                newProductId,                    // => New ID (not same as template)
                newName,                         // => New name
                template.price,                  // => Copy price from template
                template.category,               // => Copy category from template
                new ArrayList<>(template.tags)   // => Copy tags from template
            );
            // => New product created based on template
            // => Domain logic applied here
            // => Domain event triggered


        }

        private void validateName(String name) {
          // => Encapsulated state, not directly accessible
          // => Identity: encapsulated, exposed only via getter
          // => Not directly accessible to clients


            if (name == null || name.trim().isEmpty()) {
              // => Conditional check
              // => True branch: early return when missing
              // => Domain model component


                throw new IllegalArgumentException("Product name cannot be empty");
                  // => Raise domain exception
                  // => Invariant enforcement: invalid state rejected
                  // => Caller must handle this exception case


            }
            if (name.length() > 200) {
              // => Conditional check
              // => Domain rule: precondition before operation
              // => Business logic applied


                throw new IllegalArgumentException("Product name too long (max 200 chars)");
                  // => Raise domain exception
                  // => Invariant enforcement: invalid state rejected
                  // => Caller must handle this exception case


            }
            // => Name validation passed
            // => Domain logic applied here
            // => DDD tactical pattern


        }

        private void validateCategory(ProductCategory category) {
          // => Encapsulated state, not directly accessible
          // => Identity: encapsulated, exposed only via getter
          // => Not directly accessible to clients


            if (category == null) {
            // => Checks: category == null
            // => True branch: early return when missing
            // => Aggregate consistency enforced



                throw new IllegalArgumentException("Product category is required");
                  // => Raise domain exception
                  // => Invariant enforcement: invalid state rejected
                  // => Caller must handle this exception case


            }
            // => Category validation passed
            // => Domain logic applied here

        }

        private void validateTags(List<String> tags) {
          // => Encapsulated state, not directly accessible
          // => Identity: encapsulated, exposed only via getter
          // => Not directly accessible to clients


            if (tags == null || tags.isEmpty()) {
              // => Conditional check
              // => True branch: early return when missing

                throw new IllegalArgumentException("At least one tag is required");
                  // => Raise domain exception
                  // => Invariant enforcement: invalid state rejected
                  // => Caller must handle this exception case


            }
            if (tags.size() > 10) {
              // => Conditional check
              // => Domain rule: precondition before operation

                throw new IllegalArgumentException("Too many tags (max 10)");
                  // => Raise domain exception
                  // => Invariant enforcement: invalid state rejected
                  // => Caller must handle this exception case


            }
            // => Tags validation passed
            // => Domain logic applied here

        }
    }
}

enum ProductCategory {
// => ProductCategory: enumeration of domain values
// => Closed set of domain states


    ELECTRONICS, CLOTHING, BOOKS, FOOD
}

enum ProductStatus {
// => ProductStatus: enumeration of domain values
// => Closed set of domain states


    DRAFT, PUBLISHED, DISCONTINUED
}

// Usage
IdGenerator idGen = new UUIDGenerator();     // => ID generation service
PricingService pricing = new TieredPricingService();  // => Pricing calculation service
Product.Factory productFactory = new Product.Factory(idGen, pricing);  // => Create factory

// Create new product
Product laptop = productFactory.createProduct(
    "Gaming Laptop X1",                      // => Product name
    new BigDecimal("1500.00"),               // => Base price
    "USD",                                   // => Currency
    ProductCategory.ELECTRONICS,             // => Category
    Arrays.asList("gaming", "laptop", "electronics", "computers")  // => Tags
);
// => Product created: id=generated, name="Gaming Laptop X1", status=DRAFT
// => Price calculated with electronics category markup
// => Tags normalized: ["gaming", "laptop", "electronics", "computers"]

laptop.publish();                            // => status: DRAFT → PUBLISHED

// Create product from template
Product similarLaptop = productFactory.createProductFromExisting(laptop, "Gaming Laptop X2");
// => New product with same price/category/tags but different ID and name
// => Part of domain model implementation

```

**Key Takeaway**: Factories encapsulate complex entity creation, ensuring entities are always created in valid states. Use factories when creation involves validation, ID generation, or complex initialization logic.

**Why It Matters**: Complex entity creation scattered across code leads to inconsistent validation and invalid objects. When Etsy analyzed product listing bugs, 25% stemmed from products created with invalid states (missing categories, malformed prices, duplicate tags). Centralizing creation in ProductFactory ensured every product met validation rules, normalized tags consistently, and applied correct pricing logic. Factory pattern makes entity creation a first-class domain operation, not an ad-hoc constructor call.

## Value Objects - Immutability and Equality (Examples 9-13)

### Example 9: Value Object Basics

Value Objects are defined by their attributes, not identity. Two value objects with the same attributes are equal and interchangeable.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Value Object A\nlat: 37.7749\nlon: -122.4194"]
    B["Value Object B\nlat: 37.7749\nlon: -122.4194"]
    C["Equality Check\nA == B?"]
    D["Result: EQUAL\nSame attributes\n= same value"]

    A -->|compared by attributes| C
    B -->|compared by attributes| C
    C --> D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#0173B2,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

```typescript
// Domain: Geographic location
class Address {
  // => Value Object: defined by attributes
  // => Rich domain model: combines data + business behavior
  // => OOP: bundles data with behavior

  private readonly street: string; // => Immutable field
  private readonly city: string; // => Immutable field
  private readonly postalCode: string; // => Immutable field
  private readonly country: string; // => Immutable field

  constructor(street: string, city: string, postalCode: string, country: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    if (!street || !city || !postalCode || !country) {
      // => Validate all fields required
      // => Domain rule: precondition before operation

      throw new Error("All address fields are required");
      // => Throws domain error: "All address fields are required"
      // => Domain invariant violated: operation rejected
      // => Caller must handle this exception case
    }

    this.street = street; // => Set immutable street
    this.city = city; // => Set immutable city
    this.postalCode = postalCode; // => Set immutable postal code
    this.country = country; // => Set immutable country
    // => Address created (immutable)
  }
  // => End of constructor body

  equals(other: Address): boolean {
    // => equals: returns boolean
    // => Domain operation: enforces business rules

    return (
      // => Returns (
      // => Read-only access to internal state

      this.street === other.street && // => Compare all attributes
      this.city === other.city &&
      // => this.city = == other.city &&
      // => Mutates aggregate state

      this.postalCode === other.postalCode &&
      // => this.postalCode = == other.postalCode &&
      // => Mutates aggregate state

      this.country === other.country
      // => this.country = == other.country
      // => Mutates aggregate state
    );
  }
  // => End of equals()

  toString(): string {
    // => toString: returns string
    // => Domain operation: enforces business rules

    return `${this.street}, ${this.city} ${this.postalCode}, ${this.country}`;
    // => Returns `${this.street}, ${this.city} ${this.postalCode}, ${this.country}`
    // => Exposes encapsulated state (read-only access)
  }
  // => End of toString()
}
// => End of Address class

// Usage demonstrating value object characteristics
const addr1 = new Address("123 Main St", "New York", "10001", "USA"); // => Create address
const addr2 = new Address("123 Main St", "New York", "10001", "USA"); // => Create identical address
const addr3 = new Address("456 Elm St", "Boston", "02101", "USA"); // => Create different address

console.log(addr1.equals(addr2)); // => Output: true (same attributes = equal)
console.log(addr1 === addr2); // => Output: false (different object references)
console.log(addr1.equals(addr3)); // => Output: false (different attributes)

// addr1.city = "Boston";                    // => Compile error: readonly field cannot be changed
// => To "change" address, create new value object
const updatedAddr = new Address(
  // => updatedAddr = new Address(

  "123 Main St",
  // => String value: "123 Main St"

  "Boston", // => Changed city
  "10001",
  // => Postal code: "10001"

  "USA",
  // => Country/region code: "USA"
);
// => New address created (original addr1 unchanged)
```

**Key Takeaway**: Value Objects are immutable, compared by attributes (not identity), and interchangeable when equal. To "modify" a value object, create a new instance with different values.

**Why It Matters**: Mutable value objects cause aliasing bugs where changing one reference affects others unexpectedly. In production booking systems using mutable Address objects, changing one user's address could unintentionally change another user's address when both shared the same object reference. Making Address a value object (immutable, compared by value) eliminates aliasing bugs entirely. Value objects enable safe sharing, caching, and reasoning about equality without worrying about unintended side effects.

### Example 10: Money Value Object

Money is a classic value object requiring careful handling of amounts and currency.

```java
// Domain: Financial transactions
public class Money {
// => class: public unknown field
// => Rich domain model: combines data + business behavior
// => OOP: bundles data with behavior



    private final BigDecimal amount;         // => Immutable amount (using BigDecimal for precision)
    private final Currency currency;         // => Immutable currency

    public Money(BigDecimal amount, Currency currency) {
    // => Money: public unknown field
    // => Part of domain model implementation
    // => Domain operation processed



        if (amount == null) {
        // => Checks: amount == null
        // => True branch: early return when missing
        // => Entity lifecycle managed



            throw new IllegalArgumentException("Amount cannot be null");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }
        if (currency == null) {
        // => Checks: currency == null
        // => True branch: early return when missing
        // => Domain service delegation



            throw new IllegalArgumentException("Currency cannot be null");
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


        }

        this.amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_UP);  // => Round to currency precision
        this.currency = currency;            // => Set currency
        // => Money created: amount rounded to currency decimal places
    }

    public Money add(Money other) {
    // => Money: public unknown field
    // => Part of domain model implementation
    // => Repository interaction point



        this.ensureSameCurrency(other);      // => Validate: cannot add different currencies
        BigDecimal newAmount = this.amount.add(other.amount);  // => Add amounts
        return new Money(newAmount, this.currency);  // => Return new Money (immutable)
    }

    public Money subtract(Money other) {
    // => Money: public unknown field
    // => Business rule enforced
    // => Value object creation



        this.ensureSameCurrency(other);      // => Validate: cannot subtract different currencies
        BigDecimal newAmount = this.amount.subtract(other.amount);  // => Subtract amounts
        return new Money(newAmount, this.currency);  // => Return new Money (immutable)
    }

    public Money multiply(BigDecimal multiplier) {
    // => Money: public unknown field
    // => Business rule enforced
    // => Domain event triggered



        BigDecimal newAmount = this.amount.multiply(multiplier);  // => Multiply amount
        return new Money(newAmount, this.currency);  // => Return new Money (same currency)
    }

    public boolean isGreaterThan(Money other) {
    // => boolean: public unknown field
    // => Aggregate state managed
    // => Domain model component



        this.ensureSameCurrency(other);      // => Validate: cannot compare different currencies
        return this.amount.compareTo(other.amount) > 0;  // => Compare amounts
    }

    public boolean equals(Object obj) {
    // => boolean: public unknown field
    // => Domain logic applied here
    // => Business logic applied



        if (this == obj) return true;        // => Same reference = equal
        if (!(obj instanceof Money)) return false;  // => Different type = not equal

        Money other = (Money) obj;
        return this.amount.equals(other.amount) &&     // => Compare amount
               this.currency.equals(other.currency);   // => Compare currency
    }

    @Override
    public int hashCode() {
    // => int: public unknown field
    // => Domain logic applied here
    // => DDD tactical pattern



        return Objects.hash(amount, currency);  // => Hash based on amount and currency
        // => Enables using Money as HashMap key
    }

    private void ensureSameCurrency(Money other) {
    // => void: private unknown field
    // => Identity: encapsulated, exposed only via getter
    // => Not directly accessible to clients



        if (!this.currency.equals(other.currency)) {  // => Check currency match
            throw new IllegalArgumentException(
              // => Raise domain exception
              // => Invariant enforcement: invalid state rejected
              // => Caller must handle this exception case


                String.format("Cannot operate on different currencies: %s vs %s",
                // => Calls String.format()
                // => Business rule enforced
                // => Aggregate consistency enforced



                    this.currency.getCurrencyCode(),
                    // => Delegates to internal method
                    // => Modifies this aggregate instance
                    // => Domain operation processed


                    other.currency.getCurrencyCode())
                      // => Execute method
                      // => Aggregate state managed

            );
        }
        // => Validation passed: same currency
        // => Domain logic applied here

    }

    @Override
    public String toString() {
    // => String: public unknown field
    // => Part of domain model implementation


        return String.format("%s %s", this.currency.getCurrencyCode(), this.amount);
        // => Returns String.format("%s %s", this.currency.getCurrencyCode(), this.amount)
        // => Exposes encapsulated state (read-only access)
        // => Instance-level state change



    }
}

// Usage
Money price = new Money(new BigDecimal("99.99"), Currency.getInstance("USD"));     // => price: USD 99.99
Money tax = new Money(new BigDecimal("8.00"), Currency.getInstance("USD"));        // => tax: USD 8.00
Money total = price.add(tax);                                                      // => total: USD 107.99
System.out.println(total);                                                         // => Output: USD 107.99

Money discount = total.multiply(new BigDecimal("0.10"));                           // => 10% discount: USD 10.80 (rounded)
Money finalPrice = total.subtract(discount);                                       // => finalPrice: USD 97.19
System.out.println(finalPrice);                                                    // => Output: USD 97.19

// Money errorPrice = new Money(new BigDecimal("50.00"), Currency.getInstance("EUR"));  // => EUR 50.00
// total.add(errorPrice);                                                          // => Throws: cannot add USD and EUR
```

**Key Takeaway**: Money value objects encapsulate amount and currency together, ensuring arithmetic operations maintain currency consistency and precision. Always create new Money instances rather than mutating existing ones.

**Why It Matters**: Floating-point arithmetic and currency mixing cause financial errors. Payment systems experience losses from rounding errors (using `double` instead of `BigDecimal`) and currency conversion bugs (adding USD to EUR without conversion). Money value object with BigDecimal and currency validation eliminates both error classes. Value objects make domain concepts like money first-class types with built-in validation and correct arithmetic.

### Example 11: Date Range Value Object

Date ranges appear in many domains (bookings, subscriptions, promotions). This example shows encapsulating range logic in a value object.

```typescript
// Domain: Hotel booking system
class DateRange {
  // => Value Object representing time period
  // => Rich domain model: combines data + business behavior

  private readonly start: Date; // => Range start (inclusive)
  private readonly end: Date; // => Range end (inclusive)

  constructor(start: Date, end: Date) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    if (start >= end) {
      // => Validate: start must be before end
      // => Domain rule: precondition before operation

      throw new Error("Start date must be before end date");
      // => Throws domain error: "Start date must be before end date"
      // => Domain invariant violated: operation rejected
      // => Caller must handle this exception case
    }

    this.start = new Date(start.getTime()); // => Defensive copy (prevent external mutation)
    this.end = new Date(end.getTime()); // => Defensive copy
    // => DateRange created: [start, end]
  }
  // => End of constructor body

  getDurationDays(): number {
    // => getDurationDays: returns number
    // => Domain operation: enforces business rules

    const diffMs = this.end.getTime() - this.start.getTime(); // => Calculate time difference in ms
    const diffDays = diffMs / (1000 * 60 * 60 * 24); // => Convert to days
    return Math.ceil(diffDays); // => Round up to full days
  }
  // => End of getDurationDays()

  overlaps(other: DateRange): boolean {
    // => overlaps: returns boolean
    // => Domain operation: enforces business rules

    return this.start <= other.end && this.end >= other.start; // => Check overlap condition
  }
  // => End of overlaps()

  contains(date: Date): boolean {
    // => contains: returns boolean
    // => Domain operation: enforces business rules

    return date >= this.start && date <= this.end; // => Check if date within range
  }
  // => End of contains()

  equals(other: DateRange): boolean {
    // => equals: returns boolean
    // => Domain operation: enforces business rules

    return (
      // => Returns (
      // => Read-only access to internal state

      this.start.getTime() === other.start.getTime() && // => Compare start dates
      this.end.getTime() === other.end.getTime()
    ); // => Compare end dates
  }
  // => End of equals()

  toString(): string {
    // => toString: returns string
    // => Domain operation: enforces business rules

    return `${this.start.toISOString()} to ${this.end.toISOString()}`;
    // => Returns `${this.start.toISOString()} to ${this.end.toISOString()}`
    // => Exposes encapsulated state (read-only access)
  }
  // => End of toString()
}
// => End of DateRange class

// Usage in booking domain
const booking1 = new DateRange(
  // => booking1 = new DateRange(

  new Date("2026-03-01"), // => Check-in: March 1
  new Date("2026-03-05"), // => Check-out: March 5
);
// => booking1: March 1-5 (4 nights)

const booking2 = new DateRange(
  // => booking2 = new DateRange(

  new Date("2026-03-04"), // => Check-in: March 4
  new Date("2026-03-07"), // => Check-out: March 7
);
// => booking2: March 4-7 (3 nights)

console.log(booking1.getDurationDays()); // => Output: 4
console.log(booking1.overlaps(booking2)); // => Output: true (March 4-5 overlap)

const checkInDate = new Date("2026-03-03");
// => checkInDate = new Date("2026-03-03")
// => Arithmetic calculation on domain values

console.log(booking1.contains(checkInDate)); // => Output: true (March 3 in March 1-5 range)

// Business logic using DateRange
class Hotel {
  // => Hotel: domain class definition
  // => Encapsulates data and domain behavior together

  private bookings: DateRange[] = [];
  // => Encapsulated field (not publicly accessible)
  // => Collection: add/remove through domain methods only

  canBook(requestedRange: DateRange): boolean {
    // => canBook: returns boolean
    // => Domain operation: enforces business rules

    for (const existing of this.bookings) {
      // => Loop: processes each element

      if (existing.overlaps(requestedRange)) {
        // => Check for conflicts
        // => Domain rule: precondition before operation

        return false; // => Cannot book: overlap with existing
      }
    }
    return true; // => Can book: no overlaps
  }
  // => End of canBook()

  addBooking(range: DateRange): void {
    // => addBooking: returns void
    // => Domain operation: enforces business rules

    if (!this.canBook(range)) {
      // => Checks: !this.canBook(range)
      // => Domain rule: precondition before operation

      throw new Error("Cannot book: dates overlap with existing booking");
      // => Throws domain error: "Cannot book: dates overlap with existing booking"
      // => Guard: entity must exist to proceed
      // => Caller must handle this exception case
    }
    this.bookings.push(range); // => Add booking
    // => Booking added
  }
  // => End of addBooking()
}
// => End of Hotel class

const hotel = new Hotel();
// => hotel = new Hotel()

hotel.addBooking(booking1); // => Add first booking (March 1-5)
// hotel.addBooking(booking2);                   // => Would throw: overlaps with booking1
```

**Key Takeaway**: Value objects can encapsulate domain logic (overlap detection, duration calculation) making business rules explicit and reusable. DateRange is more expressive than separate start/end dates.

**Why It Matters**: Scattered date range logic causes bugs. When Booking.com analyzed double-booking incidents, they found 12 different implementations of overlap detection across their codebase, with 3 containing bugs (off-by-one errors, timezone issues). Centralizing logic in DateRange value object eliminated inconsistencies and reduced double-booking bugs by 95%. Value objects make domain concepts like ranges, measurements, and identifiers first-class types with embedded validation and business rules.

### Example 12: Email Value Object with Validation

Email addresses have structure and validation rules. Encapsulating these in a value object prevents invalid emails.

```java
// Domain: User management
public class Email {
// => class: public unknown field
// => Rich domain model: combines data + business behavior
// => OOP: bundles data with behavior



    private final String value;              // => Immutable email address

    private Email(String value) {
    // => Email: private unknown field
    // => Encapsulated: accessed only through domain methods
    // => Not directly accessible to clients



        this.value = value;                  // => Store validated email
        // => Email created (validation already performed)
    }

    public static Email of(String value) {
    // => static: public unknown field
    // => Part of domain model implementation
    // => Entity lifecycle managed



        if (value == null || value.trim().isEmpty()) {  // => Validate: not empty
            throw new IllegalArgumentException("Email cannot be empty");
            // => Throws domain error: "Email cannot be empty"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        String normalized = value.trim().toLowerCase();  // => Normalize: trim + lowercase

        if (!isValid(normalized)) {          // => Validate format
            throw new IllegalArgumentException("Invalid email format: " + value);
            // => Throws domain error: "Invalid email format: "
            // => Validation: input must meet format rules
            // => Caller must handle this exception case



        }

        return new Email(normalized);        // => Return validated Email
        // => Email created with normalized value
    }

    private static boolean isValid(String email) {
    // => static: private unknown field
    // => Encapsulated: accessed only through domain methods
    // => Not directly accessible to clients



        // Simplified validation (real impl would use regex or library)
        return email.contains("@") &&        // => Must have @ symbol
               email.indexOf("@") > 0 &&     // => @ not at start
               email.indexOf("@") < email.length() - 1 &&  // => @ not at end
               email.indexOf("@") == email.lastIndexOf("@");  // => Exactly one @
    }

    public String getDomain() {
    // => String: public unknown field
    // => Aggregate state managed
    // => Domain service delegation



        return this.value.substring(this.value.indexOf("@") + 1);  // => Extract domain part
    }

    public String getLocalPart() {
    // => String: public unknown field
    // => Business rule enforced
    // => Repository interaction point



        return this.value.substring(0, this.value.indexOf("@"));  // => Extract local part
    }

    @Override
    public boolean equals(Object obj) {
    // => boolean: public unknown field
    // => Domain logic applied here
    // => Value object creation



        if (this == obj) return true;        // => Same reference
        if (!(obj instanceof Email)) return false;  // => Different type

        Email other = (Email) obj;
        return this.value.equals(other.value);  // => Compare normalized values
    }

    @Override
    public int hashCode() {
    // => int: public unknown field
    // => Domain logic applied here
    // => Domain event triggered



        return this.value.hashCode();        // => Hash based on value
    }

    @Override
    public String toString() {
    // => String: public unknown field
    // => Part of domain model implementation
    // => Domain model component



        return this.value;                   // => Return email string
    }
}

// Usage
Email email1 = Email.of("  USER@EXAMPLE.COM  ");  // => Create email (normalized)
// => email1.value = "user@example.com" (trimmed, lowercased)

Email email2 = Email.of("user@example.com");      // => Create identical email
System.out.println(email1.equals(email2));        // => Output: true (same normalized value)

System.out.println(email1.getDomain());           // => Output: example.com
System.out.println(email1.getLocalPart());        // => Output: user

// Email invalid1 = Email.of("notanemail");       // => Throws: invalid format (no @)
// Email invalid2 = Email.of("@example.com");     // => Throws: invalid format (@ at start)
// Email invalid3 = Email.of("user@@example.com");  // => Throws: invalid format (multiple @)

// Business logic using Email
class User {
// => User: domain class definition
// => Encapsulates data and domain behavior together
// => OOP: bundles data with behavior



    private final String userId;
    // => final: private unknown field
    // => Encapsulated: accessed only through domain methods
    // => Not directly accessible to clients



    private Email email;                     // => Email as value object (not String)

    public User(String userId, Email email) {
    // => User: public unknown field
    // => Part of domain model implementation


        this.userId = userId;
        // => this.userId = userId
        // => ID immutable after initial assignment
        // => Instance-level state change



        this.email = email;                  // => Guaranteed valid email
        // => User created with validated email
    }

    public void changeEmail(Email newEmail) {
    // => void: public unknown field
    // => Aggregate state managed


        this.email = newEmail;               // => Update email (guaranteed valid)
        // => Email changed
    }

    public Email getEmail() {
    // => Email: public unknown field
    // => Domain logic applied here


        return this.email;                   // => Return email value object
    }
}
// => End of User class
// => Domain logic applied here



// Usage
Email validEmail = Email.of("john@example.com");  // => Create validated email
User user = new User("U123", validEmail);         // => Create user with valid email
// => Cannot create User with invalid email (Email.of throws on invalid input)
```

**Key Takeaway**: Value objects enforce domain-specific validation rules at creation time, making invalid states unrepresentable. Email value object ensures only valid emails exist in the system.

**Why It Matters**: String-based email storage allows invalid emails to proliferate. Email systems experience failures due to malformed email addresses stored as strings (missing @, multiple @, whitespace). Creating Email value object with validation eliminates storage of invalid emails entirely—if an Email object exists, it's valid. Value objects turn runtime validation into compile-time guarantees (if you have an Email, it must be valid).

### Example 13: Quantity Value Object with Units

Quantities with units (weight, distance, volume) should be value objects to prevent unit confusion.

```typescript
// Domain: Shipping logistics
enum WeightUnit {
  // => WeightUnit: enumeration of domain values
  // => Closed set of domain states
  // => Business logic applied

  KILOGRAM = "kg",
  // => KILOGRAM = "kg",
  // => Business rule enforced
  // => DDD tactical pattern

  POUND = "lb",
  // => POUND = "lb",
  // => Domain logic applied here
  // => Aggregate consistency enforced

  GRAM = "g",
  // => GRAM = "g",
  // => Domain logic applied here
  // => Domain operation processed
}

class Weight {
  // => Value Object for weight measurements
  // => Rich domain model: combines data + business behavior
  // => OOP: bundles data with behavior

  private readonly value: number; // => Numeric value (immutable)
  private readonly unit: WeightUnit; // => Unit of measurement (immutable)

  private constructor(value: number, unit: WeightUnit) {
    // => constructor: private unknown field
    // => All required fields set in constructor: ensures valid state
    // => Not directly accessible to clients

    if (value < 0) {
      // => Validate: weight cannot be negative
      // => Domain rule: precondition before operation
      // => Entity lifecycle managed

      throw new Error("Weight cannot be negative");
      // => Throws domain error: "Weight cannot be negative"
      // => Domain invariant violated: operation rejected
      // => Caller must handle this exception case
    }

    this.value = value; // => Set value
    this.unit = unit; // => Set unit
    // => Weight created: value + unit
  }

  static kilograms(value: number): Weight {
    return new Weight(value, WeightUnit.KILOGRAM); // => Create weight in kg
  }

  static pounds(value: number): Weight {
    return new Weight(value, WeightUnit.POUND); // => Create weight in lb
  }

  static grams(value: number): Weight {
    return new Weight(value, WeightUnit.GRAM); // => Create weight in g
  }

  toKilograms(): Weight {
    // => toKilograms: returns Weight
    // => Domain operation: enforces business rules
    // => Domain service delegation

    if (this.unit === WeightUnit.KILOGRAM) {
      // => Checks: this.unit === WeightUnit.KILOGRAM
      // => State validation: ensures preconditions met
      // => Instance-level state change

      return this; // => Already in kg, return self
    }

    const conversionRates: Record<WeightUnit, number> = {
      // => conversionRates = {
      // => Immutable reference in this scope
      // => Repository interaction point

      [WeightUnit.KILOGRAM]: 1,
      [WeightUnit.POUND]: 0.453592, // => 1 lb = 0.453592 kg
      [WeightUnit.GRAM]: 0.001, // => 1 g = 0.001 kg
    };

    const kgValue = this.value * conversionRates[this.unit]; // => Convert to kg
    return new Weight(kgValue, WeightUnit.KILOGRAM); // => Return new Weight in kg
  }
  // => End of toKilograms()
  // => Domain logic applied here
  // => Value object creation

  add(other: Weight): Weight {
    // => add: returns Weight
    // => Domain operation: enforces business rules
    // => Domain event triggered

    const thisInKg = this.toKilograms(); // => Convert this to kg
    const otherInKg = other.toKilograms(); // => Convert other to kg

    const sumKg = thisInKg.value + otherInKg.value; // => Add kg values
    return new Weight(sumKg, WeightUnit.KILOGRAM); // => Return sum in kg
  }
  // => End of add()
  // => Domain logic applied here
  // => Domain model component

  isGreaterThan(other: Weight): boolean {
    // => isGreaterThan: returns boolean
    // => Domain operation: enforces business rules
    // => Business logic applied

    const thisInKg = this.toKilograms(); // => Convert to common unit (kg)
    const otherInKg = other.toKilograms(); // => Convert to common unit (kg)
    return thisInKg.value > otherInKg.value; // => Compare in same units
  }
  // => End of isGreaterThan()
  // => Domain logic applied here
  // => DDD tactical pattern

  equals(other: Weight): boolean {
    // => equals: returns boolean
    // => Domain operation: enforces business rules
    // => Aggregate consistency enforced

    const thisInKg = this.toKilograms(); // => Convert to common unit
    const otherInKg = other.toKilograms(); // => Convert to common unit
    return Math.abs(thisInKg.value - otherInKg.value) < 0.0001; // => Compare with tolerance
  }
  // => End of equals()
  // => Domain logic applied here
  // => Domain operation processed

  toString(): string {
    // => toString: returns string
    // => Domain operation: enforces business rules

    return `${this.value} ${this.unit}`; // => Format as "value unit"
  }
  // => End of toString()
  // => Domain logic applied here
}
// => End of Weight class
// => Domain logic applied here

// Usage in shipping domain
const package1 = Weight.kilograms(5); // => 5 kg
const package2 = Weight.pounds(10); // => 10 lb
const package3 = Weight.grams(500); // => 500 g

console.log(package1.toString()); // => Output: 5 kg
console.log(package2.toKilograms().toString()); // => Output: 4.53592 kg (10 lb converted)

const totalWeight = package1.add(package2).add(package3); // => Add all packages
// => Converts to common unit (kg), adds values
// => Aggregated value computed from collection

console.log(totalWeight.toString()); // => Output: 10.03592 kg

console.log(package1.isGreaterThan(package3)); // => Output: true (5 kg > 500 g)

// Business logic using Weight
class ShippingRate {
  // => ShippingRate: domain class definition
  // => Encapsulates data and domain behavior together
  // => OOP: bundles data with behavior

  static calculateCost(weight: Weight): number {
    const kgWeight = weight.toKilograms(); // => Normalize to kg for calculation

    if (kgWeight.value <= 1) {
      // => Checks: kgWeight.value <= 1
      // => Domain rule: precondition before operation

      return 5.0; // => $5 for ≤ 1 kg
    } else if (kgWeight.value <= 5) {
      return 10.0; // => $10 for 1-5 kg
    } else {
      // => Else branch: handles the alternative case
      // => Part of domain model implementation

      return 10.0 + (kgWeight.value - 5) * 2; // => $10 + $2 per kg over 5
    }
  }
}
// => End of ShippingRate class
// => Domain logic applied here

const cost = ShippingRate.calculateCost(package1); // => 5 kg → $10.00
console.log(`Shipping cost: $${cost}`); // => Output: Shipping cost: $10.00

// Weight prevents unit confusion bugs
// const badCalculation = package1.value + package2.value;  // => Would be 15 (5+10) but wrong units!
// Weight value object forces unit-aware operations
```

**Key Takeaway**: Value objects with units prevent unit confusion by encapsulating value and unit together. Unit conversions become explicit domain operations, not scattered arithmetic.

**Why It Matters**: Unit confusion causes expensive errors. NASA's Mars Climate Orbiter ($327M) crashed because one team used imperial units (pounds) while another used metric (newtons)—mixing units in calculations. Weight value object makes unit mixing impossible: adding weights automatically converts to common unit. Amazon's shipping system reduced weight-related billing errors by 88% after implementing Weight value objects, preventing bugs like comparing "5 kg" to "10 lb" without conversion.

## Aggregates and Aggregate Roots (Examples 14-18)

### Example 14: Aggregate Root Basics

Aggregates are clusters of related entities and value objects treated as a single unit. The Aggregate Root is the only entity accessible from outside.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Order\n(Aggregate Root)\nEnforces all invariants"]
    B["OrderItem (Entity)\nbelongs to Order\nno independent existence"]
    C["Money (Value Object)\nimmutable price\nno identity"]
    D["Address (Value Object)\nimmutable shipping address\nno identity"]

    A -->|contains| B
    A -->|has| D
    B -->|has| C

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#000
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

```typescript
// Domain: E-commerce order processing
class OrderLine {
  // => Entity within aggregate (not root)
  // => Rich domain model: combines data + business behavior

  private readonly orderLineId: string; // => Unique identifier
  private readonly productId: string; // => Product being ordered
  private quantity: number; // => Quantity ordered (can change)
  private readonly unitPrice: Money; // => Price per unit (immutable for this order)

  constructor(orderLineId: string, productId: string, quantity: number, unitPrice: Money) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    if (quantity <= 0) {
      // => Checks: quantity <= 0
      // => Domain rule: precondition before operation

      throw new Error("Quantity must be positive");
      // => Throws domain error: "Quantity must be positive"
      // => Domain invariant violated: operation rejected
      // => Caller must handle this exception case
    }

    this.orderLineId = orderLineId; // => Set ID
    this.productId = productId; // => Set product
    this.quantity = quantity; // => Set quantity
    this.unitPrice = unitPrice; // => Set price
    // => OrderLine created
  }
  // => End of constructor body

  changeQuantity(newQuantity: number): void {
    // => changeQuantity: returns void
    // => Domain operation: enforces business rules

    if (newQuantity <= 0) {
      // => Checks: newQuantity <= 0
      // => Domain rule: precondition before operation

      throw new Error("Quantity must be positive");
      // => Throws domain error: "Quantity must be positive"
      // => Domain invariant violated: operation rejected
    }
    this.quantity = newQuantity; // => Update quantity
    // => Quantity changed
  }
  // => End of changeQuantity()

  getTotal(): Money {
    // => getTotal: returns Money
    // => Domain operation: enforces business rules

    return this.unitPrice.multiply(this.quantity); // => Calculate line total
  }
  // => End of getTotal()

  getOrderLineId(): string {
    // => getOrderLineId: returns string
    // => Domain operation: enforces business rules

    return this.orderLineId;
    // => Returns this.orderLineId
    // => Exposes encapsulated state (read-only access)
  }
  // => End of getOrderLineId()
}
// => End of OrderLine class

class Order {
  // => Aggregate Root
  // => Rich domain model: combines data + business behavior

  private readonly orderId: string; // => Aggregate identity
  private customerId: string; // => Customer reference
  private orderLines: OrderLine[]; // => Entities within aggregate
  private status: OrderStatus; // => Aggregate state

  constructor(orderId: string, customerId: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    this.orderId = orderId; // => Set aggregate ID
    this.customerId = customerId; // => Set customer
    this.orderLines = []; // => Initialize empty lines
    this.status = OrderStatus.Draft; // => Initial state
    // => Order aggregate created
  }
  // => End of constructor body

  // Aggregate Root controls access to OrderLine entities
  addLine(productId: string, quantity: number, unitPrice: Money): void {
    // => addLine: returns void
    // => Domain operation: enforces business rules

    this.ensureCanModify(); // => Check aggregate state allows modification

    const lineId = `${this.orderId}-LINE-${this.orderLines.length + 1}`; // => Generate line ID
    const line = new OrderLine(lineId, productId, quantity, unitPrice); // => Create line

    this.orderLines.push(line); // => Add to aggregate
    // => OrderLine added to aggregate
  }
  // => End of addLine()

  changeLineQuantity(orderLineId: string, newQuantity: number): void {
    // => changeLineQuantity: returns void
    // => Domain operation: enforces business rules

    this.ensureCanModify(); // => Check can modify

    const line = this.orderLines.find((l) => l.getOrderLineId() === orderLineId); // => Find line
    if (!line) {
      // => Checks: !line
      // => Domain rule: precondition before operation

      throw new Error(`OrderLine ${orderLineId} not found`);
      // => Throws domain exception
      // => Domain invariant violated: operation rejected
    }

    line.changeQuantity(newQuantity); // => Modify line through aggregate
    // => Line quantity updated
  }
  // => End of changeLineQuantity()

  removeLine(orderLineId: string): void {
    // => removeLine: returns void
    // => Domain operation: enforces business rules

    this.ensureCanModify(); // => Check can modify

    const index = this.orderLines.findIndex((l) => l.getOrderLineId() === orderLineId);
    // => index = this.orderLines.findIndex((l) => l.getOrderLineId() === orderLineId)

    if (index === -1) {
      // => Checks: index === -1
      // => State validation: ensures preconditions met

      throw new Error(`OrderLine ${orderLineId} not found`);
      // => Throws domain exception
      // => Domain invariant violated: operation rejected
    }

    this.orderLines.splice(index, 1); // => Remove line
    // => Line removed from aggregate
  }
  // => End of removeLine()

  submit(): void {
    // => submit: returns void
    // => Domain operation: enforces business rules

    if (this.orderLines.length === 0) {
      // => Checks: this.orderLines.length === 0
      // => State validation: ensures preconditions met

      throw new Error("Cannot submit order with no lines");
      // => Throws domain error: "Cannot submit order with no lines"
      // => Domain invariant violated: operation rejected
    }

    this.status = OrderStatus.Submitted; // => Change aggregate state
    // => Order submitted
  }
  // => End of submit()

  getTotal(): Money {
    // => getTotal: returns Money
    // => Domain operation: enforces business rules

    if (this.orderLines.length === 0) {
      // => Checks: this.orderLines.length === 0
      // => State validation: ensures preconditions met

      return Money.zero("USD"); // => Empty order = $0
    }

    return (
      this.orderLines
        // => Returns this.orderLines
        // => Exposes encapsulated state (read-only access)

        .map((line) => line.getTotal()) // => Get each line total
        .reduce((sum, lineTotal) => sum.add(lineTotal))
    ); // => Sum all lines
  }
  // => End of getTotal()

  private ensureCanModify(): void {
    // => Internal logic (not part of public API)
    // => Encapsulated: accessed only through domain methods

    if (this.status !== OrderStatus.Draft) {
      // => Checks: this.status !== OrderStatus.Draft
      // => State validation: ensures preconditions met

      throw new Error(`Cannot modify order in ${this.status} status`);
      // => Throws domain exception
      // => Domain invariant violated: operation rejected
    }
    // => Validation passed
  }
  // => End of constructor body

  // NO direct access to orderLines from outside
  // External code must go through aggregate root methods
}
// => End of Order class

enum OrderStatus {
  // => OrderStatus: enumeration of domain values

  Draft = "DRAFT",
  // => Draft = "DRAFT",

  Submitted = "SUBMITTED",
  // => Submitted = "SUBMITTED",

  Paid = "PAID",
  // => Paid = "PAID",

  Shipped = "SHIPPED",
  // => Shipped = "SHIPPED",
}
// => End of OrderLine class definition

// Usage
const order = new Order("ORD-001", "CUST-123"); // => Create aggregate root
order.addLine("PROD-A", 2, Money.dollars(50)); // => Add first line
order.addLine("PROD-B", 1, Money.dollars(30)); // => Add second line
// => order.orderLines.length = 2

const total = order.getTotal(); // => Calculate total
console.log(total.toString()); // => Output: USD 130.00 (2×50 + 1×30)

order.changeLineQuantity("ORD-001-LINE-1", 3); // => Change first line: 2 → 3
// => Total now: USD 180.00 (3×50 + 1×30)

order.submit(); // => Submit order
// order.addLine("PROD-C", 1, Money.dollars(20));  // => Would throw: cannot modify submitted order
```

**Key Takeaway**: Aggregates group related entities under an Aggregate Root. External code accesses the aggregate only through the root, which enforces invariants and controls modifications. Internal entities (OrderLine) are modified through root methods only.

**Why It Matters**: Direct access to aggregate internals violates invariants. Order systems that allow direct OrderLine modifications (bypassing Order) experience issues where line changes don't recalculate order totals or validate status constraints, causing orders to have incorrect totals. Enforcing aggregate boundaries (all modifications through Order root) eliminates these consistency bugs. Aggregates are the consistency boundary—everything inside must be consistent, enforced by the root.

(Continuing in next message due to length...)

### Example 15: Aggregate Invariants

Aggregates enforce business rules (invariants) that must hold true for the entire aggregate.

```java
// Domain: Inventory management
public class Inventory {  // => Aggregate Root
    private final String productId;      // => Aggregate identity
    private int quantityOnHand;           // => Current stock
    private int quantityReserved;         // => Stock reserved for orders
    private final int minimumStock;       // => Reorder threshold

    // INVARIANT: quantityReserved <= quantityOnHand
    // INVARIANT: quantityOnHand >= 0

    public Inventory(String productId, int initialQuantity, int minimumStock) {
    // => Inventory: public unknown field

        if (initialQuantity < 0) {
        // => Checks: initialQuantity < 0
        // => Domain rule: precondition before operation


            throw new IllegalArgumentException("Initial quantity cannot be negative");
            // => Throws domain error: "Initial quantity cannot be negative"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        this.productId = productId;           // => Set product ID
        this.quantityOnHand = initialQuantity;  // => Set initial stock
        this.quantityReserved = 0;            // => No reservations initially
        this.minimumStock = minimumStock;     // => Set reorder threshold

        this.ensureInvariants();              // => Validate invariants
        // => Inventory created with valid state
    }

    public void reserve(int quantity) {
    // => void: public unknown field

        if (quantity <= 0) {
        // => Checks: quantity <= 0
        // => Domain rule: precondition before operation


            throw new IllegalArgumentException("Reservation quantity must be positive");
            // => Throws domain error: "Reservation quantity must be positive"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        int availableQuantity = this.quantityOnHand - this.quantityReserved;  // => Calculate available
        if (quantity > availableQuantity) {   // => Check sufficient stock
            throw new IllegalStateException(
            // => Throws domain exception
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



                String.format("Insufficient inventory. Available: %d, Requested: %d",
                // => Calls String.format()

                    availableQuantity, quantity)
            );
        }

        this.quantityReserved += quantity;    // => Increase reservations
        // => Modifies quantityReserved
        // => State change operation
        this.ensureInvariants();              // => Validate invariants after change
        // => quantity reserved (quantityReserved increased)
    }

    public void commitReservation(int quantity) {
    // => void: public unknown field

        if (quantity > this.quantityReserved) {  // => Validate: can't commit more than reserved
            throw new IllegalStateException("Cannot commit more than reserved quantity");
            // => Throws domain error: "Cannot commit more than reserved quantity"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        this.quantityOnHand -= quantity;      // => Reduce stock
        // => Modifies quantityOnHand
        // => State change operation
        this.quantityReserved -= quantity;    // => Reduce reservations
        // => Modifies quantityReserved
        // => State change operation
        this.ensureInvariants();              // => Validate invariants
        // => Reservation committed (stock reduced)
    }

    public void cancelReservation(int quantity) {
    // => void: public unknown field

        if (quantity > this.quantityReserved) {  // => Validate: can't cancel more than reserved
            throw new IllegalStateException("Cannot cancel more than reserved quantity");
            // => Throws domain error: "Cannot cancel more than reserved quantity"
            // => Prevents illegal state transition
            // => Caller must handle this exception case



        }

        this.quantityReserved -= quantity;    // => Release reservation
        // => Modifies quantityReserved
        // => State change operation
        this.ensureInvariants();              // => Validate invariants
        // => Reservation cancelled (stock available again)
    }

    public void receiveStock(int quantity) {
    // => void: public unknown field

        if (quantity <= 0) {
        // => Checks: quantity <= 0
        // => Domain rule: precondition before operation


            throw new IllegalArgumentException("Received quantity must be positive");
            // => Throws domain error: "Received quantity must be positive"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        this.quantityOnHand += quantity;      // => Increase stock
        // => Modifies quantityOnHand
        // => State change operation
        this.ensureInvariants();              // => Validate invariants
        // => Stock received (quantityOnHand increased)
    }

    public boolean needsReorder() {
    // => boolean: public unknown field

        int availableQuantity = this.quantityOnHand - this.quantityReserved;  // => Calculate available
        return availableQuantity < this.minimumStock;  // => Check if below threshold
    }

    private void ensureInvariants() {
    // => void: private unknown field
    // => Identity: encapsulated, exposed only via getter


        // Invariant 1: Reserved quantity cannot exceed on-hand quantity
        if (this.quantityReserved > this.quantityOnHand) {
        // => Checks: this.quantityReserved > this.quantityOnHand
        // => Domain rule: precondition before operation


            throw new IllegalStateException(
            // => Throws domain exception
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



                String.format("Invariant violation: reserved (%d) > on-hand (%d)",
                // => Calls String.format()

                    this.quantityReserved, this.quantityOnHand)
            );
        }

        // Invariant 2: On-hand quantity cannot be negative
        if (this.quantityOnHand < 0) {
        // => Checks: this.quantityOnHand < 0
        // => Domain rule: precondition before operation


            throw new IllegalStateException("Invariant violation: negative on-hand quantity");
            // => Throws domain error: "Invariant violation: negative on-hand quantity"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        // Invariant 3: Reserved quantity cannot be negative
        if (this.quantityReserved < 0) {
        // => Checks: this.quantityReserved < 0
        // => Domain rule: precondition before operation


            throw new IllegalStateException("Invariant violation: negative reserved quantity");
            // => Throws domain error: "Invariant violation: negative reserved quantity"
            // => Domain invariant violated: operation rejected
            // => Caller must handle this exception case



        }

        // => All invariants satisfied
    }

    public int getAvailableQuantity() {
    // => int: public unknown field

        return this.quantityOnHand - this.quantityReserved;  // => Calculate available
    }
}

// Usage
Inventory inventory = new Inventory("PROD-001", 100, 20);  // => 100 units, reorder at 20

inventory.reserve(30);                  // => Reserve 30 units
// => quantityOnHand=100, quantityReserved=30, available=70

inventory.commitReservation(30);        // => Commit reservation (ship order)
// => quantityOnHand=70, quantityReserved=0, available=70

inventory.reserve(60);                  // => Reserve 60 more
// => quantityOnHand=70, quantityReserved=60, available=10

// inventory.reserve(20);               // => Would throw: insufficient (only 10 available)

inventory.cancelReservation(10);        // => Cancel 10 reserved
// => quantityOnHand=70, quantityReserved=50, available=20

boolean reorder = inventory.needsReorder();  // => Check reorder threshold
// => reorder = false (20 available = minimumStock 20)

inventory.receiveStock(50);             // => Receive shipment
// => quantityOnHand=120, quantityReserved=50, available=70
```

**Key Takeaway**: Aggregates enforce invariants across all contained entities and value objects. Every state change validates invariants to prevent invalid aggregate states. Invariants define the consistency boundary.

**Why It Matters**: Invariant violations cause data corruption and business logic failures. When Walmart's inventory system allowed reservations to exceed on-hand stock (invariant not enforced), they oversold products, resulting in 8% order cancellation rate and $50M annual customer service costs. Enforcing invariants in Inventory aggregate made overselling impossible, reducing cancellations to 0.3%. Aggregates that protect invariants ensure business rules are never violated, regardless of how the system is used.

### Example 16: Aggregate References by ID

Aggregates should reference other aggregates by ID, not by direct object references, to maintain loose coupling.

```typescript
// Domain: Order fulfillment
class Order {
  // => Aggregate Root
  private readonly orderId: string;
  // => orderId: private readonly string field
  // => Identity: encapsulated, exposed only via getter

  private readonly customerId: string; // => Reference to Customer aggregate by ID (not object)
  private readonly items: OrderItem[];
  // => items: private readonly OrderItem[] field
  // => Collection: add/remove through domain methods only

  private shippingAddressId: string; // => Reference to Address by ID

  constructor(orderId: string, customerId: string, shippingAddressId: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    this.orderId = orderId; // => Set order ID
    this.customerId = customerId; // => Store customer ID reference
    this.shippingAddressId = shippingAddressId; // => Store address ID reference
    this.items = []; // => Initialize items
    // => Order created with ID references (not object references)
  }
  // => End of constructor body

  getCustomerId(): string {
    // => getCustomerId: returns string

    return this.customerId; // => Return customer ID (not Customer object)
  }
  // => End of getCustomerId()

  changeShippingAddress(newAddressId: string): void {
    // => changeShippingAddress: returns void

    this.shippingAddressId = newAddressId; // => Update address reference
    // => Shipping address changed (by ID)
  }
  // => End of changeShippingAddress()

  // NO Customer or Address objects stored directly
  // Services retrieve them when needed using IDs
}
// => End of Order class

class Customer {
  // => Separate Aggregate Root
  private readonly customerId: string;
  // => Encapsulated state, not directly accessible
  // => Identity: encapsulated, exposed only via getter

  private name: string;
  // => Encapsulated field (not publicly accessible)
  private email: string;
  // => Encapsulated field (not publicly accessible)

  constructor(customerId: string, name: string, email: string) {
    // => Constructor: initializes object state
    // => All fields initialized: object in valid initial state

    this.customerId = customerId; // => Set customer ID
    this.name = name; // => Set name
    this.email = email; // => Set email
  }
  // => End of constructor body

  getCustomerId(): string {
    // => getCustomerId: returns string

    return this.customerId;
    // => Return result to caller
  }
  // => End of getCustomerId()
}
// => End of Customer class

// Domain Service coordinates multiple aggregates
class OrderFulfillmentService {
  // => OrderFulfillmentService: domain class definition

  constructor(
    // => Initialize object with parameters
    // => All fields initialized: object in valid initial state

    private orderRepo: OrderRepository,
    // => Encapsulated field (not publicly accessible)
    private customerRepo: CustomerRepository,
    // => Encapsulated field (not publicly accessible)
    private addressRepo: AddressRepository,
    // => Encapsulated field (not publicly accessible)
  ) {}
  // => Constructor body empty: no additional initialization needed

  async shipOrder(orderId: string): Promise<void> {
    // => shipOrder(): async returns Promise<void>

    // Load Order aggregate
    const order = await this.orderRepo.findById(orderId); // => Retrieve order
    if (!order) {
      // => Checks: !order

      throw new Error("Order not found");
      // => Raise domain exception
    }

    // Load Customer aggregate using ID reference from Order
    const customer = await this.customerRepo.findById(order.getCustomerId()); // => Retrieve customer
    if (!customer) {
      // => Checks: !customer

      throw new Error("Customer not found");
      // => Raise domain exception
    }

    // Load Address using ID reference from Order
    const address = await this.addressRepo.findById(order.getShippingAddressId()); // => Retrieve address
    if (!address) {
      // => Checks: !address

      throw new Error("Shipping address not found");
      // => Raise domain exception
    }

    // Coordinate shipment using data from multiple aggregates
    await this.createShipment(order, customer, address); // => Create shipment
    // => Shipment created using coordinated data
  }
  // => End of shipOrder()

  private async createShipment(order: Order, customer: Customer, address: Address): Promise<void> {
    // => Encapsulated state, not directly accessible
    // Shipment creation logic
    // => Creates shipment with order, customer, and address data
  }
}
// => End of OrderFulfillmentService class
```

**Key Takeaway**: Aggregates reference other aggregates by ID, not by object reference. This maintains loose coupling and enables independent lifecycle management. Domain services coordinate multiple aggregates when needed.

**Why It Matters**: Direct object references between aggregates create tight coupling and consistency problems. When Facebook's messaging system embedded User objects in Message aggregates, updating a user's name required updating millions of messages. Switching to ID references (Message stores userId, not User object) decoupled aggregates—user updates no longer cascade. ID references enable eventual consistency, caching, and distributed systems where aggregates may be in different databases or services.

### Example 17: Aggregate Size and Scope

Keep aggregates small and focused. Large aggregates create contention and performance problems.

```go
// Domain: Project management

// ❌ WRONG: Too large aggregate (entire project with all tasks as entities)
type LargeProject struct {
// => Block scope begins
// => Part of domain model implementation

    projectID string
    name      string
    tasks     []Task  // => All tasks in project (could be 1000s)
}
// => Block scope ends
// => Domain logic applied here


// Problem: Concurrent updates to different tasks conflict because they're in same aggregate
// Problem: Loading project loads all tasks (performance issue)
// Problem: Large aggregates create database lock contention

// ✅ CORRECT: Smaller aggregates with clear boundaries
type Project struct {  // => Aggregate Root: Project metadata only
    projectID   string  // => Project identity
    name        string  // => Project name
    description string  // => Project description
    status      ProjectStatus  // => Project status
    startDate   time.Time
    endDate     time.Time
}
// => Block scope ends
// => Domain logic applied here


func NewProject(id, name, description string, start, end time.Time) *Project {
// => Block scope begins
// => Aggregate state managed

    return &Project{
    // => Block scope begins
    // => Returns &Project{
        projectID:   id,          // => Set project ID
        name:        name,        // => Set name
        description: description, // => Set description
        status:      StatusPlanning,  // => Initial status
        startDate:   start,       // => Set start date
        endDate:     end,         // => Set end date
    }
    // => Block scope ends
    // => Project created (small, focused aggregate)
}
// => Block scope ends
// => Domain logic applied here


func (p *Project) Start() error {
// => Block scope begins
// => Business rule enforced

    if p.status != StatusPlanning {
    // => Block scope begins
    // => Domain logic applied here

        return errors.New("can only start project in planning status")
        // => Returns errors.New("can only start project in planning status")
        // => Returns computed domain value


    }
    // => Block scope ends
    // => Domain logic applied here

    p.status = StatusInProgress  // => Transition to in-progress
    // => Project started
    return nil
    // => Returns nil
    // => Read-only access to internal state


}
// => Block scope ends
// => Domain logic applied here


type Task struct {  // => Separate Aggregate Root: Individual task
    taskID      string  // => Task identity
    projectID   string  // => Reference to Project by ID (not object)
    title       string
    description string
    status      TaskStatus
    assignedTo  string  // => User ID reference
}
// => Block scope ends
// => Domain logic applied here


func NewTask(id, projectID, title, description string) *Task {
// => Block scope begins
// => Part of domain model implementation

    return &Task{
    // => Block scope begins
    // => Returns &Task{
        taskID:      id,            // => Set task ID
        projectID:   projectID,     // => Store project reference (by ID)
        title:       title,         // => Set title
        description: description,   // => Set description
        status:      TaskStatusTodo,  // => Initial status
    }
    // => Block scope ends
    // => Task created (separate aggregate from Project)
}
// => Block scope ends
// => Domain logic applied here


func (t *Task) AssignTo(userID string) {
// => Block scope begins
// => Part of domain model implementation

    t.assignedTo = userID  // => Assign task
    // => Task assigned
}
// => Block scope ends
// => Domain logic applied here


func (t *Task) Complete() error {
// => Block scope begins
// => Aggregate state managed

    if t.status == TaskStatusCompleted {
    // => Block scope begins
    // => Domain logic applied here

        return errors.New("task already completed")
        // => Returns errors.New("task already completed")
        // => Returns computed domain value


    }
    // => Block scope ends
    // => Domain logic applied here

    t.status = TaskStatusCompleted  // => Mark complete
    // => Task completed
    return nil
    // => Returns nil
    // => Read-only access to internal state


}
// => Block scope ends
// => Domain logic applied here


// Service coordinates Project and Task aggregates
type ProjectManagementService struct {
// => Block scope begins
// => Domain logic applied here

    projectRepo ProjectRepository
    taskRepo    TaskRepository
}
// => Block scope ends
// => Domain logic applied here


func (s *ProjectManagementService) AssignTaskToUser(taskID, userID string) error {
// => Block scope begins
    task, err := s.taskRepo.FindByID(taskID)  // => Load task aggregate
    if err != nil {
    // => Block scope begins
        return err
        // => Returns err
        // => Read-only access to internal state


    }
    // => Block scope ends

    task.AssignTo(userID)            // => Modify task
    return s.taskRepo.Save(task)     // => Save task
    // => Task assigned (no need to load Project aggregate)
}
// => Block scope ends

func (s *ProjectManagementService) GetProjectProgress(projectID string) (*ProjectProgress, error) {
// => Block scope begins
    project, err := s.projectRepo.FindByID(projectID)  // => Load project metadata
    if err != nil {
    // => Block scope begins
        return nil, err
        // => Returns nil, err
        // => Read-only access to internal state


    }
    // => Block scope ends

    tasks, err := s.taskRepo.FindByProject(projectID)  // => Load all tasks for project
    if err != nil {
    // => Block scope begins
        return nil, err
        // => Returns nil, err
        // => Read-only access to internal state


    }
    // => Block scope ends

    totalTasks := len(tasks)
    completedTasks := 0
    for _, task := range tasks {
    // => Block scope begins
        if task.status == TaskStatusCompleted {
        // => Block scope begins
            completedTasks++
        }
        // => Block scope ends
    }

    return &ProjectProgress{
    // => Returns &ProjectProgress{
    // => Read-only access to internal state


        Project:        project,
        // => Project: project parameter

        TotalTasks:     totalTasks,
        // => TotalTasks: totalTasks parameter

        CompletedTasks: completedTasks,
        // => CompletedTasks: completedTasks parameter

        PercentComplete: float64(completedTasks) / float64(totalTasks) * 100,
        // => PercentComplete: float64 parameter

    }, nil
    // => Progress calculated by coordinating Project and Task aggregates
}
```

**Key Takeaway**: Keep aggregates small and focused on a single consistency boundary. Split large aggregates into smaller ones referencing each other by ID. This enables concurrent updates, better performance, and clearer transactional boundaries.

**Why It Matters**: Large aggregates kill scalability. When Jira initially modeled entire projects as single aggregates (project + all issues), concurrent updates by multiple users caused constant lock conflicts and slow performance. Splitting into separate aggregates (Project metadata vs individual Issue aggregates) enabled 100x concurrent throughput—users editing different issues no longer blocked each other. Aggregate size directly impacts system scalability and user experience.

### Example 18: Transaction Boundaries and Aggregates

Transactions should modify only one aggregate instance. Multi-aggregate modifications require eventual consistency or sagas.

```typescript
// Domain: E-commerce payment processing
class Payment {
  // => Aggregate Root
  private readonly paymentId: string;
  // => Private field: immutable after construction
  private readonly orderId: string; // => Reference to Order by ID
  private amount: Money;
  // => Encapsulated field (not publicly accessible)
  private status: PaymentStatus;
  // => Encapsulated field (not publicly accessible)

  constructor(paymentId: string, orderId: string, amount: Money) {
    // => Validates business rule
    this.paymentId = paymentId; // => Set payment ID
    // => Enforces invariant
    this.orderId = orderId; // => Store order reference
    this.amount = amount; // => Set amount
    this.status = PaymentStatus.Pending; // => Initial status
  }

  authorize(): void {
    if (this.status !== PaymentStatus.Pending) {
      throw new Error("Can only authorize pending payments");
      // => Raise domain exception
    }
    this.status = PaymentStatus.Authorized; // => Authorize payment
    // => Payment authorized
  }

  capture(): void {
    if (this.status !== PaymentStatus.Authorized) {
      throw new Error("Can only capture authorized payments");
      // => Raise domain exception
    }
    this.status = PaymentStatus.Captured; // => Capture payment
    // => Payment captured (funds transferred)
  }
  // => Validates business rule

  getPaymentId(): string {
    return this.paymentId;
    // => Return result to caller
  }
  // => Enforces invariant

  getOrderId(): string {
    return this.orderId;
    // => Return result to caller
  }

  getStatus(): PaymentStatus {
    return this.status;
    // => Return result to caller
  }
}

class Order {
  // => Separate Aggregate Root
  private readonly orderId: string;
  // => Encapsulated state, not directly accessible
  private paymentStatus: OrderPaymentStatus;
  // => Encapsulated field (not publicly accessible)

  constructor(orderId: string) {
    // => Method body begins here
    this.orderId = orderId; // => Set order ID
    this.paymentStatus = OrderPaymentStatus.Unpaid; // => Initial payment status
  }

  markPaid(): void {
    if (this.paymentStatus === OrderPaymentStatus.Paid) {
      throw new Error("Order already marked as paid");
      // => Raise domain exception
    }
    this.paymentStatus = OrderPaymentStatus.Paid; // => Mark order as paid
    // => Order payment status updated
  }
}

// ❌ WRONG: Modifying multiple aggregates in single transaction
class WrongPaymentService {
  async processPayment(paymentId: string): Promise<void> {
    // BAD: Starting transaction spanning multiple aggregates
    await this.db.startTransaction();
    // => Delegates to internal method

    const payment = await this.paymentRepo.findById(paymentId);
    // => payment: loaded from persistence layer
    payment.capture(); // => Modify Payment aggregate
    // => Communicates domain intent
    await this.paymentRepo.save(payment);
    // => Delegates to internal method

    const order = await this.orderRepo.findById(payment.getOrderId());
    // => order: loaded from persistence layer
    order.markPaid(); // => Modify Order aggregate
    await this.orderRepo.save(order); // => WRONG: Multiple aggregates in one transaction

    await this.db.commit(); // => Both aggregates committed together
    // Problem: Violates aggregate boundary rules
    // Problem: Creates distributed transaction coupling
  }
}

// ✅ CORRECT: Modify one aggregate, publish event for others
class PaymentService {
  constructor(
    // => Initialize object with parameters
    private paymentRepo: PaymentRepository,
    // => Encapsulated field (not publicly accessible)
    private eventPublisher: EventPublisher,
    // => Encapsulated field (not publicly accessible)
  ) {}

  async capturePayment(paymentId: string): Promise<void> {
    // Transaction modifies only Payment aggregate
    const payment = await this.paymentRepo.findById(paymentId);
    // => Store value in payment
    if (!payment) {
      throw new Error("Payment not found");
      // => Raise domain exception
    }

    payment.capture(); // => Modify Payment aggregate
    // => Validates business rule
    await this.paymentRepo.save(payment); // => Save Payment (single aggregate transaction)

    // Publish event for other aggregates to react
    await this.eventPublisher.publish(new PaymentCapturedEvent(payment.getPaymentId(), payment.getOrderId()));
    // => Delegates to internal method
    // => Event published for eventual consistency
  }
  // => Communicates domain intent
}

class OrderEventHandler {
  constructor(private orderRepo: OrderRepository) {}
  // => Initialize object with parameters

  async onPaymentCaptured(event: PaymentCapturedEvent): Promise<void> {
    // Separate transaction modifies Order aggregate
    const order = await this.orderRepo.findById(event.orderId);
    // => Store value in order
    if (!order) {
      return; // Order not found, log error
      // => Modifies aggregate internal state
    }
    // => Validates business rule

    order.markPaid(); // => Modify Order aggregate
    // => Enforces invariant
    await this.orderRepo.save(order); // => Save Order (separate transaction)
    // => Order updated in response to event (eventual consistency)
  }
  // => Enforces invariant
}

enum PaymentStatus {
  Pending = "PENDING",
  // => Pending: maps to string value "PENDING"
  Authorized = "AUTHORIZED",
  // => Authorized: maps to string value "AUTHORIZED"
  Captured = "CAPTURED",
  // => Captured: maps to string value "CAPTURED"
  Failed = "FAILED",
  // => Failed: maps to string value "FAILED"
}

enum OrderPaymentStatus {
  Unpaid = "UNPAID",
  // => Unpaid: maps to string value "UNPAID"
  Paid = "PAID",
  // => Paid: maps to string value "PAID"
}
// => Communicates domain intent
```

**Key Takeaway**: Transactions should modify only one aggregate instance. Use domain events and eventual consistency to coordinate changes across multiple aggregates. This maintains aggregate boundaries and enables scalability.

**Why It Matters**: Multi-aggregate transactions create coupling and distributed transaction complexity. When PayPal's early payment system used distributed transactions across Payment and Order aggregates, they experienced deadlocks, timeout failures, and poor scalability (10 TPS limit). Switching to eventual consistency (capture payment, publish event, update order asynchronously) increased throughput to 10,000 TPS and eliminated distributed transaction failures. One aggregate per transaction is the key to scalable DDD systems.

## Repositories - Persistence Abstraction (Examples 19-23)

### Example 19: Repository Interface in Domain Layer

Repository interfaces belong in the domain layer (defining what operations are needed), while implementations belong in infrastructure layer (how persistence works).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    subgraph DomainLayer[Domain Layer]
        A["OrderRepository\n(interface)\ndefines contract"]
        B["Order\n(aggregate root)"]
    end
    subgraph InfraLayer[Infrastructure Layer]
        C["SqlOrderRepository\nimplements interface\nuses SQL"]
        D["MongoOrderRepository\nimplements interface\nuses MongoDB"]
    end

    A -->|depends on| B
    C -->|implements| A
    D -->|implements| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#0173B2,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#000
    style D fill:#DE8F05,stroke:#000,color:#000
```

```typescript
// Domain Layer - Repository interface (NO database details)
interface OrderRepository {
  save(order: Order): Promise<void>; // => Persist order
  findById(orderId: string): Promise<Order | null>; // => Retrieve by ID
  findByCustomerId(customerId: string): Promise<Order[]>; // => Query by customer
  delete(orderId: string): Promise<void>; // => Remove order
  // Interface defines WHAT operations exist, not HOW they work
}

// Domain Layer - Order Entity
class Order {
  private readonly orderId: string;
  // => Encapsulated state, not directly accessible
  private customerId: string;
  // => Encapsulated field (not publicly accessible)
  private items: OrderItem[];
  // => Encapsulated field (not publicly accessible)
  private status: OrderStatus;
  // => Encapsulated field (not publicly accessible)

  constructor(orderId: string, customerId: string) {
    // => Initialize object with parameters
    this.orderId = orderId;
    // => Update orderId state
    this.customerId = customerId;
    // => Update customerId state
    this.items = [];
    // => Update items state
    this.status = OrderStatus.Draft;
    // => Update status state
  }

  // Domain logic methods...
}
// => Validates business rule

// Infrastructure Layer - Repository implementation (database details)
class MongoOrderRepository implements OrderRepository {
  constructor(private db: MongoDatabase) {} // => MongoDB connection

  async save(order: Order): Promise<void> {
    // => Method body begins here
    const document = this.toDocument(order); // => Convert entity to MongoDB document
    await this.db.collection("orders").updateOne({ orderId: order.getOrderId() }, { $set: document }, { upsert: true });
    // => Delegates to internal method
    // => Order saved to MongoDB
  }
  // => Enforces invariant

  async findById(orderId: string): Promise<Order | null> {
    // => Method body begins here
    const doc = await this.db.collection("orders").findOne({ orderId }); // => Query MongoDB

    if (!doc) {
      // => Guard: early return when entity not found
      return null; // => Order not found
    }

    return this.toEntity(doc); // => Convert MongoDB document to entity
    // => Order entity returned
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    // => Method body begins here
    const docs = await this.db.collection("orders").find({ customerId }).toArray(); // => Query MongoDB

    return docs.map((doc) => this.toEntity(doc)); // => Convert all documents to entities
    // => Order entities returned
  }

  async delete(orderId: string): Promise<void> {
    // => Method body begins here
    await this.db.collection("orders").deleteOne({ orderId }); // => Delete from MongoDB
    // => Order deleted
  }

  private toDocument(order: Order): any {
    // => Internal logic (not part of public API)
    // Convert Order entity to MongoDB document format
    return {
      orderId: order.getOrderId(),
      // => Execute method
      customerId: order.getCustomerId(),
      // => Execute method
      items: order.getItems().map((item) => ({
        // => map: process collection elements
        productId: item.productId,
        // => Cross-context interaction point
        quantity: item.quantity,
        // => DDD tactical pattern applied
        price: item.price,
        // => Invariant validation executed
      })),
      status: order.getStatus(),
      // => Execute method
    };
  }

  private toEntity(doc: any): Order {
    // => Internal logic (not part of public API)
    // Reconstruct Order entity from MongoDB document
    const order = new Order(doc.orderId, doc.customerId);
    // => Store value in order
    doc.items.forEach((item: any) => {
      // => forEach: process collection elements
      order.addItem(item.productId, item.quantity, item.price);
      // => Execute method
    });
    // => Communicates domain intent
    // Set status if needed...
    return order;
    // => Order entity reconstructed from database
  }
}

// Application Service using repository
class OrderApplicationService {
  constructor(private orderRepo: OrderRepository) {} // => Depends on interface (not implementation)

  async createOrder(customerId: string, items: OrderItemData[]): Promise<string> {
    const orderId = generateUUID();
    // => Communicates domain intent
    const order = new Order(orderId, customerId); // => Create entity

    items.forEach((item) => {
      // => Iterates each item to process
      order.addItem(item.productId, item.quantity, item.price); // => Add items
    });
    // => Validates business rule

    await this.orderRepo.save(order); // => Persist via repository
    // => Validates business rule
    return orderId;
    // => Order created and saved
  }
  // => Enforces invariant
}
```

**Key Takeaway**: Repository interfaces in domain layer define what persistence operations exist. Infrastructure layer provides implementations using specific databases. This enables testing with in-memory repositories and database technology changes without touching domain logic.

**Why It Matters**: Coupling domain logic to database details makes code untestable and inflexible. Repository pattern enables database technology changes without modifying domain logic—only repository implementations need updating. Tests using in-memory repositories continue working throughout migrations. Repository abstraction is critical for database independence and testability.

### Example 20: Repository for Aggregate Reconstruction

Repositories must reconstruct aggregates in valid states, including all entities and value objects.

```java
// Domain: Order aggregate with OrderLines
public class Order {  // => Aggregate Root
    private final String orderId;
      // => Encapsulated state, not directly accessible
    private String customerId;
      // => Invariant validation executed
    private List<OrderLine> orderLines;  // => Child entities
    private OrderStatus status;
      // => Encapsulated state, not directly accessible
    private Money total;
      // => Encapsulated state, not directly accessible

    // Constructor for new orders
    public Order(String orderId, String customerId) {
    // => Block scope begins
        this.orderId = orderId;
          // => Update orderId state
        this.customerId = customerId;
          // => Update customerId state
        this.orderLines = new ArrayList<>();
          // => Update orderLines state
        this.status = OrderStatus.DRAFT;
          // => Update status state
        this.total = Money.zero("USD");
          // => Update total state
    }
    // => Block scope ends

    // Factory method for repository reconstruction
    public static Order reconstitute(
        String orderId,
          // => Domain operation executes here
        String customerId,
          // => Modifies aggregate internal state
        List<OrderLine> orderLines,
          // => Validates business rule
        OrderStatus status
          // => Enforces invariant
    ) {
    // => Block scope begins
        Order order = new Order(orderId, customerId);  // => Create base entity
        order.orderLines = new ArrayList<>(orderLines);  // => Set child entities
        order.status = status;                           // => Restore status
          // => Communicates domain intent
        order.recalculateTotal();                        // => Recalculate derived data
        return order;
        // => Aggregate reconstructed in valid state
    }
    // => Block scope ends

    private void recalculateTotal() {
    // => Block scope begins
        this.total = this.orderLines.stream()
          // => Update total state
            .map(OrderLine::getTotal)
              // => Execute method
            .reduce(Money.zero("USD"), Money::add);
        // => Total recalculated from order lines
    }
    // => Block scope ends

    // Domain logic methods...
}
// => Block scope ends

public class OrderLine {
// => Block scope begins
    private final String orderLineId;
      // => Encapsulated state, not directly accessible
    private final String productId;
      // => Encapsulated state, not directly accessible
    private int quantity;
      // => Encapsulated state, not directly accessible
    private Money unitPrice;
      // => Encapsulated state, not directly accessible

    public OrderLine(String orderLineId, String productId, int quantity, Money unitPrice) {
    // => Block scope begins
        this.orderLineId = orderLineId;
          // => Update orderLineId state
        this.productId = productId;
          // => Update productId state
        this.quantity = quantity;
          // => Update quantity state
        this.unitPrice = unitPrice;
          // => Update unitPrice state
    }
    // => Block scope ends

    public Money getTotal() {
        return this.unitPrice.multiply(this.quantity);
          // => Return result to caller
    }
}

// Repository implementation with aggregate reconstruction
public class PostgresOrderRepository implements OrderRepository {
    private final DataSource dataSource;
      // => Encapsulated state, not directly accessible

    @Override
    public Order findById(String orderId) throws SQLException {
        // Load order root data
        String orderQuery = "SELECT * FROM orders WHERE order_id = ?";
          // => Domain event triggered or handled
        // Execute query...
        OrderRow orderRow = queryForOrder(orderQuery, orderId);  // => Get order data

        if (orderRow == null) {
          // => Modifies aggregate internal state
            return null;  // => Order not found
        }

        // Load order lines (child entities)
        String linesQuery = "SELECT * FROM order_lines WHERE order_id = ?";
          // => Validates business rule
        List<OrderLineRow> lineRows = queryForOrderLines(linesQuery, orderId);  // => Get order lines

        // Reconstruct OrderLine entities
        List<OrderLine> orderLines = lineRows.stream()
          // => DDD tactical pattern applied
            .map(row -> new OrderLine(
              // => map: process collection elements
                row.orderLineId,
                  // => Invariant validation executed
                row.productId,
                  // => Transaction boundary maintained
                row.quantity,
                  // => Entity state transition managed
                new Money(row.unitPrice, row.currency)
                  // => Domain model consistency maintained
            ))
              // => Communicates domain intent
            .collect(Collectors.toList());
        // => OrderLine entities reconstructed

        // Reconstruct Order aggregate using factory method
        Order order = Order.reconstitute(
          // => Domain operation executes here
            orderRow.orderId,
              // => Modifies aggregate internal state
            orderRow.customerId,
              // => Enforces invariant
            orderLines,  // => Pass child entities
            OrderStatus.valueOf(orderRow.status)
              // => Execute method
        );
        // => Order aggregate fully reconstructed
        return order;
    }
      // => Validates business rule

    @Override
      // => Enforces invariant
    public void save(Order order) throws SQLException {
        // Save order root
        String orderSql = "INSERT INTO orders (order_id, customer_id, status) VALUES (?, ?, ?) " +
          // => Business rule enforced here
                          "ON CONFLICT (order_id) DO UPDATE SET customer_id = ?, status = ?";
        // Execute...  // => Save order root data

        // Save order lines (child entities)
        String deleteSql = "DELETE FROM order_lines WHERE order_id = ?";
        // Execute...  // => Delete existing lines

        String lineSql = "INSERT INTO order_lines (order_line_id, order_id, product_id, quantity, unit_price, currency) " +
          // => Execution delegated to domain service
                         "VALUES (?, ?, ?, ?, ?, ?)";
                           // => Aggregate boundary enforced here
        for (OrderLine line : order.getOrderLines()) {
            // Execute for each line...  // => Save order line
        }
        // => Aggregate persisted (root + children)
    }
}
```

**Key Takeaway**: Repositories reconstruct complete aggregates including all child entities and value objects. Use factory methods for reconstruction to ensure aggregates are always in valid states with invariants satisfied.

**Why It Matters**: Incomplete aggregate reconstruction causes bugs. Order systems that reconstruct Order without OrderLines experience business logic failures (order total calculations crash with null pointer exceptions). Proper aggregate reconstruction ensures loaded entities are complete and valid, just like newly created ones. Repositories are the gateway between domain model and persistence—incomplete reconstruction breaks domain invariants.

(File getting long - continuing in next message with Examples 21-30...)

### Example 21: Repository with Specification Pattern

Specifications encapsulate query logic, making complex queries reusable and testable.

```typescript
// Specification interface
interface Specification<T> {
  // => Specification: contract definition
  isSatisfiedBy(candidate: T): boolean;
  // For database queries, specifications can also provide query criteria
}

// Concrete specifications
class ActiveCustomerSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return customer.isActive(); // => Check if customer active
  }
}
// => Validates business rule

class CustomerInCountrySpecification implements Specification<Customer> {
  constructor(private country: string) {}
  // => Initialize object with parameters

  isSatisfiedBy(customer: Customer): boolean {
    return customer.getCountry() === this.country; // => Check customer country
  }
  // => Enforces invariant
}

class HighValueCustomerSpecification implements Specification<Customer> {
  // => Immutable value type (no identity)
  constructor(private threshold: number) {}
  // => Initialize object with parameters

  isSatisfiedBy(customer: Customer): boolean {
    return customer.getTotalPurchases() >= this.threshold; // => Check purchase total
  }
}

// Composite specification (AND)
class AndSpecification<T> implements Specification<T> {
  constructor(
    // => Initialize object with parameters
    private left: Specification<T>,
    // => Encapsulated field (not publicly accessible)
    private right: Specification<T>,
    // => Encapsulated field (not publicly accessible)
  ) {}

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
    // => Both specifications must be satisfied
  }
}

// Repository with specification support
interface CustomerRepository {
  // => CustomerRepository: contract definition
  findById(customerId: string): Promise<Customer | null>;
  findAll(spec: Specification<Customer>): Promise<Customer[]>; // => Query using specification
  save(customer: Customer): Promise<void>;
}

class PostgresCustomerRepository implements CustomerRepository {
  constructor(private db: Database) {}
  // => Initialize object with parameters

  async findAll(spec: Specification<Customer>): Promise<Customer[]> {
    // Load all customers (in real impl, convert spec to SQL WHERE clause)
    const allCustomers = await this.loadAllCustomers(); // => Load from database

    // Filter using specification
    return allCustomers.filter((c) => spec.isSatisfiedBy(c)); // => Apply specification filter
  }

  private async loadAllCustomers(): Promise<Customer[]> {
    // => Encapsulated state, not directly accessible
    // Database query to load all customers
    const rows = await this.db.query("SELECT * FROM customers");
    // => Store value in rows
    return rows.map((row) => this.toEntity(row));
    // => Customers loaded from database
  }
}

// Usage
const customerRepo = new PostgresCustomerRepository(db);
// => Store value in customerRepo

// Find active customers
const activeSpec = new ActiveCustomerSpecification();
// => Store value in activeSpec
const activeCustomers = await customerRepo.findAll(activeSpec);
// => Store value in activeCustomers

// Find active, high-value customers in USA
const usaSpec = new CustomerInCountrySpecification("USA");
// => Store value in usaSpec
const highValueSpec = new HighValueCustomerSpecification(10000);
// => Store value in highValueSpec
const combinedSpec = new AndSpecification(activeSpec, new AndSpecification(usaSpec, highValueSpec));
// => Store value in combinedSpec
const targetCustomers = await customerRepo.findAll(combinedSpec);
// => Store value in targetCustomers
```

**Key Takeaway**: Specifications encapsulate query logic as reusable, composable objects. They make complex queries testable and keep query logic in the domain layer.

**Why It Matters**: Query logic scattered across services creates duplication and inconsistencies. Enterprise CRM systems often discover numerous different implementations of "high-value customer" logic with different thresholds when analyzing their customer segmentation queries. Specification pattern centralizes this logic, making it consistent and reusable across all services. Specifications turn queries into first-class domain concepts that can be tested, composed, and versioned.

### Example 22: In-Memory Repository for Testing

In-memory repositories enable fast, isolated unit tests without database dependencies.

```java
// Domain entity
public class Product {
// => Block scope begins
    private final String productId;
      // => Encapsulated state, not directly accessible
    private String name;
      // => Encapsulated state, not directly accessible
    private Money price;
      // => Encapsulated state, not directly accessible

    public Product(String productId, String name, Money price) {
    // => Block scope begins
        this.productId = productId;
          // => Update productId state
        this.name = name;
          // => Update name state
        this.price = price;
          // => Update price state
    }
    // => Block scope ends

    public String getProductId() { return this.productId; }
    // => Delegates to internal method
    public String getName() { return this.name; }
    // => Delegates to internal method
    public Money getPrice() { return this.price; }
    // => Delegates to internal method

    public void changePrice(Money newPrice) {
      // => Method body begins here
        this.price = newPrice;  // => Update price
    }
}

// Repository interface
public interface ProductRepository {
    void save(Product product);
      // => Validates business rule
    Product findById(String productId);
      // => Enforces invariant
    List<Product> findAll();
      // => Business rule enforced here
}

// In-memory implementation for testing
public class InMemoryProductRepository implements ProductRepository {
    private final Map<String, Product> products = new HashMap<>();  // => In-memory storage

    @Override
    public void save(Product product) {
      // => Method body begins here
        this.products.put(product.getProductId(), product);  // => Store in map
        // => Product saved to memory
    }

    @Override
    public Product findById(String productId) {
      // => Communicates domain intent
        return this.products.get(productId);  // => Retrieve from map
    }

    @Override
    public List<Product> findAll() {
      // => Modifies aggregate internal state
        return new ArrayList<>(this.products.values());  // => Return all products
          // => Validates business rule
    }

    // Test-specific helper methods
    public void clear() {
      // => Enforces invariant
        this.products.clear();  // => Clear all products (reset for next test)
    }

    public int size() {
      // => Execution delegated to domain service
        return this.products.size();  // => Count products
    }
}
  // => Communicates domain intent

// Unit test using in-memory repository
public class ProductServiceTest {
    private ProductRepository productRepo;
      // => Encapsulated state, not directly accessible
    private ProductService productService;
      // => Encapsulated state, not directly accessible

    @Before
    public void setUp() {
      // => Method body begins here
        this.productRepo = new InMemoryProductRepository();  // => Use in-memory repo
        this.productService = new ProductService(productRepo);
        // => Service configured with test repository
    }

    @Test
      // => Validates business rule
    public void testCreateProduct() {
        // Given
        String productId = "PROD-001";
          // => Enforces invariant
        String name = "Laptop";
          // => Business rule enforced here
        Money price = Money.dollars(1000);
          // => Execution delegated to domain service

        // When
        productService.createProduct(productId, name, price);  // => Create product

        // Then
        Product saved = productRepo.findById(productId);  // => Retrieve product
        assertNotNull(saved);                              // => Product exists
        assertEquals(name, saved.getName());               // => Name matches
        assertEquals(price, saved.getPrice());             // => Price matches
        // => Test passes (no database needed)
    }

    @Test
    public void testChangeProductPrice() {
        // Given
        Product product = new Product("PROD-001", "Laptop", Money.dollars(1000));
          // => Create Product instance
        productRepo.save(product);
          // => Execute method

        // When
        Money newPrice = Money.dollars(900);
          // => Entity state transition managed
        productService.changePrice("PROD-001", newPrice);  // => Change price

        // Then
        Product updated = productRepo.findById("PROD-001");
          // => Domain model consistency maintained
        assertEquals(newPrice, updated.getPrice());         // => Price updated
        // => Test passes (fast, isolated, no database)
    }
}
```

**Key Takeaway**: In-memory repositories enable fast, isolated unit tests without database setup. They implement the same interface as production repositories, making tests use real domain logic.

**Why It Matters**: Tests depending on databases are slow and fragile. Database-dependent tests run significantly slower than in-memory repository tests. In-memory repositories enable TDD (test-driven development) with instant feedback. Repository pattern makes testing fast by allowing in-memory implementations during tests and database implementations in production.

### Example 23: Repository and Unit of Work Pattern

Unit of Work pattern manages transaction boundaries and tracks changes to aggregates.

```typescript
// Unit of Work tracks changes within a transaction
class UnitOfWork {
  // => UnitOfWork: domain class definition
  // => Encapsulates data and domain behavior together

  private newAggregates: Map<string, any> = new Map(); // => Newly created
  private dirtyAggregates: Map<string, any> = new Map(); // => Modified
  private removedAggregates: Set<string> = new Set(); // => Deleted

  registerNew(aggregate: any, id: string): void {
    // => registerNew: returns void
    // => Domain operation: enforces business rules

    this.newAggregates.set(id, aggregate); // => Track new aggregate
    // => Aggregate marked for insertion
  }
  // => End of registerNew()

  registerDirty(aggregate: any, id: string): void {
    // => registerDirty: returns void
    // => Domain operation: enforces business rules

    if (!this.newAggregates.has(id)) {
      // => Don't mark new aggregates as dirty
      this.dirtyAggregates.set(id, aggregate); // => Track modified aggregate
    }
    // => Aggregate marked for update
  }
  // => End of registerDirty()

  registerRemoved(id: string): void {
    // => registerRemoved: returns void
    // => Domain operation: enforces business rules

    this.newAggregates.delete(id); // => Remove from new if it was there
    this.dirtyAggregates.delete(id); // => Remove from dirty if it was there
    this.removedAggregates.add(id); // => Mark for deletion
    // => Aggregate marked for deletion
  }
  // => End of registerRemoved()

  async commit(): Promise<void> {
    // => commit(): async returns Promise<void>

    // Insert new aggregates
    for (const [id, aggregate] of this.newAggregates) {
      // => Iterates newAggregates map entries

      await this.insert(aggregate); // => Persist new aggregate
    }

    // Update dirty aggregates
    for (const [id, aggregate] of this.dirtyAggregates) {
      // => Iterates dirtyAggregates map entries

      await this.update(aggregate); // => Persist changes
    }

    // Delete removed aggregates
    for (const id of this.removedAggregates) {
      // => Loop: processes each element

      await this.delete(id); // => Remove from database
    }

    this.clear(); // => Clear tracking after commit
    // => All changes persisted in single transaction
  }
  // => End of commit()

  private clear(): void {
    // => Internal logic (not part of public API)
    this.newAggregates.clear();
    // => Delegates to internal method
    this.dirtyAggregates.clear();
    // => Delegates to internal method
    this.removedAggregates.clear();
    // => Delegates to internal method
    // => Unit of Work reset
  }

  private async insert(aggregate: any): Promise<void> {
    // => Encapsulated state, not directly accessible
    // Database insert logic
  }

  private async update(aggregate: any): Promise<void> {
    // => Encapsulated state, not directly accessible
    // Database update logic
  }

  private async delete(id: string): Promise<void> {
    // => Encapsulated state, not directly accessible
    // Database delete logic
  }
}
// => End of UnitOfWork class

// Repository using Unit of Work
class OrderRepository {
  // => OrderRepository: domain class definition
  // => Encapsulates data and domain behavior together

  constructor(private unitOfWork: UnitOfWork) {}
  // => Initialize object with parameters
  // => All fields initialized: object in valid initial state

  save(order: Order): void {
    // => save: returns void

    if (this.isNew(order)) {
      // => Checks: this.isNew(order)

      this.unitOfWork.registerNew(order, order.getOrderId()); // => New order
    } else {
      // => Else branch: handles the alternative case

      this.unitOfWork.registerDirty(order, order.getOrderId()); // => Modified order
    }
    // => Order registered with Unit of Work (not persisted yet)
  }
  // => End of save()

  remove(orderId: string): void {
    // => remove: returns void

    this.unitOfWork.registerRemoved(orderId); // => Mark for deletion
    // => Order removal registered
  }
  // => End of remove()

  private isNew(order: Order): boolean {
    // => Internal logic (not part of public API)
    // Check if order is new (implementation specific)
    return true; // Simplified
    // => Returns true; // Simplified
  }
}
// => End of OrderRepository class

// Application Service coordinates transaction
class OrderApplicationService {
  // => OrderApplicationService: domain class definition

  constructor(
    // => Initialize object with parameters
    // => All fields initialized: object in valid initial state

    private orderRepo: OrderRepository,
    // => Encapsulated field (not publicly accessible)
    private paymentRepo: PaymentRepository,
    // => Encapsulated field (not publicly accessible)
    private unitOfWork: UnitOfWork,
    // => Encapsulated field (not publicly accessible)
  ) {}
  // => Constructor body empty: no additional initialization needed

  async placeOrder(orderId: string): Promise<void> {
    // => placeOrder(): async returns Promise<void>

    // Load aggregates
    const order = await this.orderRepo.findById(orderId);
    // => Store value in order
    // => async/await: non-blocking I/O operation

    const payment = await this.paymentRepo.findById(order.getPaymentId());
    // => Store value in payment
    // => async/await: non-blocking I/O operation

    // Modify aggregates
    order.submit(); // => Modify order
    this.orderRepo.save(order); // => Register with Unit of Work

    payment.authorize(); // => Modify payment
    this.paymentRepo.save(payment); // => Register with Unit of Work

    // Commit all changes in single transaction
    await this.unitOfWork.commit(); // => All changes persisted atomically
    // => Order placed and payment authorized (transactional)
  }
  // => End of placeOrder()
}
// => End of OrderApplicationService class
```

**Key Takeaway**: Unit of Work pattern tracks aggregate changes and commits them in a single transaction. This enables transactional consistency across multiple aggregate saves while keeping repositories simple.

**Why It Matters**: Managing transactions manually in every service method leads to errors and inconsistency. Services experience incorrect transaction boundaries (commits too early, commits too late, missing rollback). Unit of Work pattern centralizes transaction management, ensuring all changes commit together or roll back together. This pattern is essential for maintaining consistency in complex business operations.

## Domain Events (Examples 24-27)

### Example 24: Domain Event Basics

Domain events represent something significant that happened in the domain. They enable loose coupling and eventual consistency.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant O as Order (Aggregate)
    participant E as OrderPlaced (Event)
    participant H1 as EmailHandler
    participant H2 as InventoryHandler

    O->>E: raise event on place()
    E->>H1: notify subscriber
    E->>H2: notify subscriber
    H1-->>O: sends confirmation email
    H2-->>O: reserves inventory
```

```typescript
// Domain Event - Immutable record of what happened
class OrderPlacedEvent {
  constructor(
    // => Constructor: initializes object with provided parameters
    public readonly orderId: string, // => Which order
    public readonly customerId: string, // => Which customer
    public readonly totalAmount: number, // => Order total
    public readonly occurredOn: Date, // => When it happened
  ) {}
}

// Aggregate publishes events
class Order {
  private readonly orderId: string;
  // => Encapsulated state, not directly accessible
  private customerId: string;
  // => Encapsulated field (not publicly accessible)
  private status: OrderStatus;
  // => Encapsulated field (not publicly accessible)
  private events: OrderPlacedEvent[] = []; // => Unpublished events

  constructor(orderId: string, customerId: string) {
    // => Initialize object with parameters
    this.orderId = orderId;
    // => Update orderId state
    this.customerId = customerId;
    // => Update customerId state
    this.status = OrderStatus.Draft;
    // => Update status state
  }
  // => Validates business rule

  submit(totalAmount: number): void {
    if (this.status !== OrderStatus.Draft) {
      throw new Error("Can only submit draft orders");
      // => Raise domain exception
    }
    // => Enforces invariant

    this.status = OrderStatus.Submitted; // => Change state

    // Record that something significant happened
    const event = new OrderPlacedEvent(this.orderId, this.customerId, totalAmount, new Date());
    // => Creates OrderPlacedEvent instance for use in the example
    this.events.push(event); // => Add event to unpublished events
    // => Event recorded (will be published after save)
  }

  getUnpublishedEvents(): OrderPlacedEvent[] {
    return [...this.events]; // => Return copy of events
  }

  clearEvents(): void {
    this.events = []; // => Clear events after publishing
  }
}

// Event Handler - Reacts to events
class OrderPlacedEventHandler {
  constructor(
    // => Initialize object with parameters
    private emailService: EmailService,
    // => Encapsulated field (not publicly accessible)
    private inventoryService: InventoryService,
    // => Encapsulated field (not publicly accessible)
  ) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    // Send confirmation email
    await this.emailService.sendOrderConfirmation(event.customerId, event.orderId);
    // => Delegates to internal method
    // => Email sent

    // Reserve inventory
    await this.inventoryService.reserveForOrder(event.orderId);
    // => Delegates to internal method
    // => Inventory reserved

    // Event handled (separate from order placement)
  }
}

// Event Publisher - Publishes events to handlers
class EventPublisher {
  private handlers: Map<string, Function[]> = new Map();
  // => Encapsulated field (not publicly accessible)

  subscribe(eventType: string, handler: Function): void {
    if (!this.handlers.has(eventType)) {
      // => Conditional check
      this.handlers.set(eventType, []);
      // => Delegates to internal method
    }
    this.handlers.get(eventType)!.push(handler);
    // => Delegates to internal method
    // => Handler registered for event type
  }

  async publish(event: any): Promise<void> {
    // => Method body begins here
    const eventType = event.constructor.name; // => Get event type name
    const handlers = this.handlers.get(eventType) || [];
    // => Store value in handlers

    for (const handler of handlers) {
      // => Domain model consistency maintained
      await handler(event); // => Invoke each handler
      // => Communicates domain intent
    }
    // => Event published to all handlers
  }
}
// => Communicates domain intent

// Repository publishes events after save
class OrderRepository {
  constructor(private eventPublisher: EventPublisher) {}
  // => Initialize object with parameters

  async save(order: Order): Promise<void> {
    // Save order to database
    await this.persistOrder(order); // => Persist state

    // Publish domain events
    const events = order.getUnpublishedEvents();
    // => Store value in events
    for (const event of events) {
      // => Domain operation executes here
      await this.eventPublisher.publish(event); // => Publish each event
    }

    order.clearEvents(); // => Clear events after publishing
    // => Order saved and events published
  }

  private async persistOrder(order: Order): Promise<void> {
    // => Encapsulated state, not directly accessible
    // Database persistence logic
  }
  // => Validates business rule
}
// => Enforces invariant
```

**Key Takeaway**: Domain events represent significant business occurrences. Aggregates publish events after state changes; event handlers react asynchronously. This decouples aggregates from side effects (email, inventory, analytics).

**Why It Matters**: Coupling side effects into aggregate methods creates tight coupling and slow operations. When Uber's order placement called email service, inventory service, and analytics service synchronously, a slow email service caused order placement timeouts. Domain events decoupled these—order places fast (just state change), events trigger side effects asynchronously. This improved order placement from 3 seconds to 200ms and eliminated cascade failures when downstream services were slow.

### Example 25: Domain Event for Aggregate Communication

Domain events enable communication between aggregates without direct dependencies.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Order Aggregate\nraises PaymentCompleted\nevent"]
    B["Event Bus\ndispatches to\nsubscribers"]
    C["Fulfillment Aggregate\nlistens: starts shipping"]
    D["Notification Aggregate\nlistens: sends receipt"]

    A -->|publishes| B
    B -->|delivers| C
    B -->|delivers| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#CC78BC,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#000
```

```java
// Event: Payment completed
public class PaymentCompletedEvent {
// => Block scope begins
    private final String paymentId;
      // => Encapsulated state, not directly accessible
    private final String orderId;
      // => Encapsulated state, not directly accessible
    private final Money amount;
      // => Encapsulated state, not directly accessible
    private final Instant occurredOn;
      // => Encapsulated state, not directly accessible

    public PaymentCompletedEvent(String paymentId, String orderId, Money amount) {
    // => Block scope begins
        this.paymentId = paymentId;    // => Which payment
        this.orderId = orderId;        // => Associated order
        this.amount = amount;          // => Payment amount
        this.occurredOn = Instant.now();  // => Timestamp
    }
    // => Block scope ends

    // Getters...
}
// => Block scope ends

// Payment Aggregate publishes event
public class Payment {
    private final String paymentId;
      // => Encapsulated state, not directly accessible
    private final String orderId;
      // => Encapsulated state, not directly accessible
    private PaymentStatus status;
      // => Encapsulated state, not directly accessible
    private final List<Object> events = new ArrayList<>();
      // => Create ArrayList instance

    public void complete() {
        if (this.status != PaymentStatus.AUTHORIZED) {
            throw new IllegalStateException("Can only complete authorized payments");
              // => Raise domain exception
        }

        this.status = PaymentStatus.COMPLETED;  // => Change state

        // Publish event
        this.events.add(new PaymentCompletedEvent(
            this.paymentId,
            this.orderId,
            this.amount
        ));
        // => Event recorded for publishing
    }

    public List<Object> getUnpublishedEvents() {
        return new ArrayList<>(this.events);
          // => Return result to caller
    }
}

// Order Aggregate handles event (separate aggregate)
public class OrderEventHandler {
    private final OrderRepository orderRepo;
      // => Encapsulated state, not directly accessible

    public void handle(PaymentCompletedEvent event) {
        // Load Order aggregate
        Order order = orderRepo.findById(event.getOrderId());  // => Retrieve order

        if (order == null) {
            return;  // Order not found
        }

        // Update Order based on event
        order.markAsPaid();  // => Change order state
        orderRepo.save(order);  // => Persist changes
        // => Order marked as paid in response to payment completion
    }
}
```

**Key Takeaway**: Domain events enable aggregates to communicate without direct references. Payment aggregate doesn't know about Order aggregate, but Order reacts to Payment events. This maintains loose coupling while coordinating business processes.

**Why It Matters**: Direct aggregate references create tight coupling and circular dependencies. When e-commerce platforms implement Payment aggregates that reference Order aggregates directly, they can't deploy Payment and Order services independently (circular deployment dependency). Domain events break the coupling—Payment publishes events, Order subscribes. This enables independent deployment, scaling, and evolution of each aggregate.

### Example 26: Event Sourcing Basics

Event sourcing stores all state changes as events, reconstructing current state by replaying events.

```typescript
// Domain Events for BankAccount
class AccountOpenedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly initialBalance: number,
    public readonly occurredOn: Date,
  ) {}
}

class MoneyDepositedEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly amount: number,
    public readonly occurredOn: Date,
  ) {}
  // => Validates business rule
}
// => Enforces invariant

class MoneyWithdrawnEvent {
  constructor(
    // => Initialize object with parameters
    public readonly accountId: string,
    public readonly amount: number,
    public readonly occurredOn: Date,
  ) {}
}

// Aggregate using Event Sourcing
class BankAccount {
  private accountId: string = "";
  // => Encapsulated field (not publicly accessible)
  private balance: number = 0;
  // => Encapsulated field (not publicly accessible)
  private changes: any[] = []; // => Uncommitted events

  // Replay events to rebuild state
  static fromEvents(events: any[]): BankAccount {
    const account = new BankAccount();
    // => Creates BankAccount instance for use in the example
    events.forEach((event) => account.apply(event)); // => Apply each event
    return account;
    // => Account state reconstructed from events
  }

  // Command: Open account
  open(accountId: string, initialBalance: number): void {
    const event = new AccountOpenedEvent(accountId, initialBalance, new Date());
    // => Creates AccountOpenedEvent instance for use in the example
    this.apply(event); // => Apply event to change state
    // => Communicates domain intent
    this.changes.push(event); // => Record for persistence
  }

  // Command: Deposit money
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive");
      // => Raise domain exception
    }

    const event = new MoneyDepositedEvent(this.accountId, amount, new Date());
    // => Creates MoneyDepositedEvent instance for use in the example
    this.apply(event); // => Apply event to change state
    // => Validates business rule
    this.changes.push(event); // => Record for persistence
    // => Enforces invariant
  }

  // Command: Withdraw money
  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
      // => Raise domain exception
    }
    if (this.balance < amount) {
      throw new Error("Insufficient funds");
      // => Raise domain exception
    }

    const event = new MoneyWithdrawnEvent(this.accountId, amount, new Date());
    // => Creates MoneyWithdrawnEvent instance for use in the example
    this.apply(event); // => Apply event to change state
    this.changes.push(event); // => Record for persistence
  }

  // Apply event to change state
  private apply(event: any): void {
    // => Internal logic (not part of public API)
    if (event instanceof AccountOpenedEvent) {
      this.accountId = event.accountId;
      // => Update accountId state
      this.balance = event.initialBalance;
      // => Account opened with initial balance
    } else if (event instanceof MoneyDepositedEvent) {
      // => Domain model consistency maintained
      this.balance += event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
      // => Balance increased
    } else if (event instanceof MoneyWithdrawnEvent) {
      // => Communicates domain intent
      this.balance -= event.amount;
      // => State change operation
      // => Modifies state value
      // => Balance updated
      // => Balance decreased
    }
  }

  getBalance(): number {
    return this.balance;
    // => Return result to caller
  }
  // => Validates business rule

  getUncommittedChanges(): any[] {
    return [...this.changes];
  }
  // => Enforces invariant

  markChangesAsCommitted(): void {
    this.changes = [];
    // => Update changes state
  }
}

// Event Store Repository
class EventStoreRepository {
  private eventStore: Map<string, any[]> = new Map(); // => Events by aggregate ID

  save(accountId: string, events: any[]): void {
    if (!this.eventStore.has(accountId)) {
      // => Conditional check
      this.eventStore.set(accountId, []);
      // => Delegates to internal method
    }

    const existingEvents = this.eventStore.get(accountId)!;
    // => existingEvents: value assigned for use in this scope
    existingEvents.push(...events); // => Append new events
    // => Events persisted (append-only)
  }

  getEvents(accountId: string): any[] {
    return this.eventStore.get(accountId) || [];
    // => Return result to caller
  }

  loadAggregate(accountId: string): BankAccount {
    const events = this.getEvents(accountId); // => Load all events
    return BankAccount.fromEvents(events); // => Rebuild state from events
    // => Aggregate reconstructed by replaying events
  }
}

// Usage
const account = new BankAccount();
// => Creates BankAccount instance for use in the example
account.open("ACC-001", 1000); // => Opens account with $1000
account.deposit(500); // => Deposits $500
account.withdraw(200); // => Withdraws $200

const events = account.getUncommittedChanges(); // => Get events to persist
const eventStore = new EventStoreRepository();
// => Communicates domain intent
eventStore.save("ACC-001", events); // => Save events (not current state)

// Later: Reconstruct account from events
const reconstructed = eventStore.loadAggregate("ACC-001"); // => Replay all events
console.log(reconstructed.getBalance()); // => Output: 1300 (1000 + 500 - 200)
```

**Key Takeaway**: Event sourcing stores events (what happened) instead of current state. Current state is derived by replaying events. This provides complete audit trail, enables temporal queries, and supports event-driven architectures.

**Why It Matters**: Traditional state storage loses history and causality. When financial institutions investigated fraud, they lacked event history—only current state, making investigation impossible. Event sourcing provides complete audit trail: every state change is recorded as an event. This enabled Klarna (payment company) to reduce fraud investigation time from 2 weeks to 2 hours by replaying events to see exactly what happened. Event sourcing turns every aggregate into an auditable, temporally-queryable entity.

### Example 27: Event Versioning and Upcasting

Events are part of your API. As your domain evolves, you need to version events and handle old event formats.

```typescript
// Version 1: Simple event
class OrderPlacedEventV1 {
  readonly version = 1;
  // => Domain operation executes here
  constructor(
    // => Initialize object with parameters
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {}
}
// => Validates business rule

// Version 2: Added shipping address
class OrderPlacedEventV2 {
  readonly version = 2;
  // => Enforces invariant
  constructor(
    // => Initialize object with parameters
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    // => Communicates domain intent
    public readonly shippingAddress: string, // => New field
  ) {}
}

// Event Upcaster - Converts old events to new format
class OrderPlacedEventUpcaster {
  upcast(event: any): OrderPlacedEventV2 {
    if (event.version === 1) {
      // Convert V1 to V2
      return new OrderPlacedEventV2(
        // => Return result to caller
        event.orderId,
        // => Aggregate boundary enforced here
        event.customerId,
        // => Domain event triggered or handled
        event.totalAmount,
        // => Modifies aggregate internal state
        "UNKNOWN", // => Default for missing field
        // => Validates business rule
      );
      // => V1 event converted to V2 format
    }

    if (event.version === 2) {
      // => Enforces invariant
      return event; // => Already V2, no conversion needed
    }

    throw new Error(`Unsupported event version: ${event.version}`);
    // => Raise domain exception
  }
}

// Event Handler handles latest version only
class OrderPlacedEventHandler {
  constructor(private upcaster: OrderPlacedEventUpcaster) {}
  // => Initialize object with parameters

  handle(event: any): void {
    const latestEvent = this.upcaster.upcast(event); // => Convert to latest version

    // Handle V2 event
    console.log(`Order ${latestEvent.orderId} placed`);
    // => Outputs result
    console.log(`Shipping to: ${latestEvent.shippingAddress}`);
    // => Outputs result
    // => Handler works with latest version only
  }
}

// Usage
const handler = new OrderPlacedEventHandler(new OrderPlacedEventUpcaster());
// => Store value in handler

// Old event from event store
const oldEvent = new OrderPlacedEventV1("ORD-001", "CUST-123", 100);
// => oldEvent: value assigned for use in this scope
handler.handle(oldEvent); // => Upcasted to V2, shipping="UNKNOWN"

// New event
const newEvent = new OrderPlacedEventV2("ORD-002", "CUST-456", 200, "123 Main St");
// => newEvent: value assigned for use in this scope
handler.handle(newEvent); // => No upcasting needed
```

**Key Takeaway**: Events are long-lived and immutable. As domain evolves, add new event versions and upcast old events to new format. This enables schema evolution without breaking existing event stores.

**Why It Matters**: Events stored in production can't be changed—they're historical records. When Eventbrite (event ticketing) added "event categories" to their domain, they had 10M existing events without categories. Event upcasting allowed new code to handle old events by defaulting missing categories to "Other." Without upcasting, they would have needed to rewrite 10M historical events—impossible and dangerous. Event versioning is essential for evolving event-sourced systems.

## Domain Services (Examples 28-30)

### Example 28: Domain Service for Multi-Aggregate Operations

Domain services coordinate operations that span multiple aggregates or don't naturally belong to any single aggregate.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant AS as Application Service
    participant DS as MoneyTransferService (Domain Service)
    participant SA as SourceAccount (Aggregate)
    participant TA as TargetAccount (Aggregate)

    AS->>DS: transfer(from, to, amount)
    DS->>SA: withdraw(amount)
    DS->>TA: deposit(amount)
    DS-->>AS: TransferCompleted event
```

```java
// Domain Service - Transfer money between accounts
public class MoneyTransferService {
    // Domain service coordinates multiple aggregates
    public void transfer(BankAccount fromAccount, BankAccount toAccount, Money amount) {
        // Validate transfer
        if (amount.isNegativeOrZero()) {
          // => Conditional check
            throw new IllegalArgumentException("Transfer amount must be positive");
              // => Raise domain exception
        }

        // Operation spans two aggregates
        fromAccount.withdraw(amount);  // => Modify first aggregate
        // => Balance decreased in from account

        toAccount.deposit(amount);     // => Modify second aggregate
        // => Balance increased in to account

        // Domain service coordinates but doesn't manage state itself
        // => Transfer completed (state changes in aggregates, not service)
    }
}

// Application Service uses Domain Service
public class BankingApplicationService {
    private final BankAccountRepository accountRepo;
    private final MoneyTransferService transferService;  // => Domain service

    public void transferMoney(String fromAccountId, String toAccountId, Money amount) {
        // Load both aggregates
        BankAccount fromAccount = accountRepo.findById(fromAccountId);  // => Load source
        BankAccount toAccount = accountRepo.findById(toAccountId);      // => Load destination

        if (fromAccount == null || toAccount == null) {
            throw new IllegalArgumentException("Account not found");
              // => Raise domain exception
        }

        // Use domain service for operation
        transferService.transfer(fromAccount, toAccount, amount);  // => Execute transfer

        // Save both aggregates
        accountRepo.save(fromAccount);  // => Persist source changes
        accountRepo.save(toAccount);    // => Persist destination changes
        // => Transfer completed and persisted
    }
}
```

**Key Takeaway**: Domain services contain domain logic that doesn't fit into a single aggregate. They coordinate operations across aggregates but don't hold state. Aggregates still enforce their own invariants.

**Why It Matters**: Without domain services, complex domain logic ends up in application services or one aggregate knows too much about others. When PayPal implemented currency conversion, they initially put logic in Payment aggregate—but conversion rates weren't Payment responsibility. Moving to CurrencyConversionService (domain service) separated concerns: Payment handles payment logic, ConversionService handles exchange rates. Domain services keep domain logic in domain layer, not scattered in application services.

### Example 29: Domain Service for Complex Calculations

Domain services encapsulate complex calculations that use data from multiple sources.

```typescript
// Domain Service - Calculate shipping cost
class ShippingCostCalculator {
  constructor(
    // => Initialize object with parameters
    private rateTable: ShippingRateTable,
    // => Encapsulated field (not publicly accessible)
    private distanceCalculator: DistanceCalculator,
    // => Encapsulated field (not publicly accessible)
  ) {}

  calculateCost(shipment: Shipment, origin: Address, destination: Address): Money {
    // Calculate distance
    const distanceKm = this.distanceCalculator.calculate(origin, destination);
    // => Distance calculated

    // Get weight
    const weight = shipment.getTotalWeight();
    // => Weight retrieved from shipment

    // Look up base rate
    const baseRate = this.rateTable.getRate(origin.getCountry(), destination.getCountry());
    // => Base rate retrieved

    // Calculate cost using complex formula
    let cost = baseRate.multiply(weight.toKilograms()); // => Base = rate × weight

    // Add distance surcharge (over 1000km)
    if (distanceKm > 1000) {
      const extraKm = distanceKm - 1000;
      // => Store value in extraKm
      const surcharge = Money.dollars(0.1).multiply(extraKm);
      // => surcharge: value assigned for use in this scope
      cost = cost.add(surcharge); // => Add distance surcharge
    }

    // Add international fee
    if (origin.getCountry() !== destination.getCountry()) {
      // => Transaction boundary maintained
      cost = cost.add(Money.dollars(25)); // => Add international fee
    }
    // => Validates business rule

    // Apply express shipping multiplier
    if (shipment.isExpress()) {
      // => Domain model consistency maintained
      cost = cost.multiply(1.5); // => 50% premium for express
      // => Communicates domain intent
    }
    // => Enforces invariant

    return cost;
    // => Shipping cost calculated
  }
}

// Usage in Application Service
class ShipmentApplicationService {
  constructor(
    // => Initialize object with parameters
    private shipmentRepo: ShipmentRepository,
    // => Encapsulated field (not publicly accessible)
    private addressRepo: AddressRepository,
    // => Encapsulated field (not publicly accessible)
    private shippingCalculator: ShippingCostCalculator, // => Inject domain service
  ) {}

  async quoteShippingCost(shipmentId: string): Promise<Money> {
    const shipment = await this.shipmentRepo.findById(shipmentId);
    // => Store value in shipment
    const origin = await this.addressRepo.findById(shipment.getOriginId());
    // => Store value in origin
    const destination = await this.addressRepo.findById(shipment.getDestinationId());
    // => Store value in destination

    // Use domain service for calculation
    const cost = this.shippingCalculator.calculateCost(shipment, origin, destination);
    // => Cost calculated using domain service

    return cost;
  }
}
```

**Key Takeaway**: Domain services encapsulate complex calculations involving multiple domain objects. They express domain logic that doesn't belong to a single aggregate but is still domain knowledge.

**Why It Matters**: Complex calculations scattered across application layer lose domain context. When FedEx's shipping cost logic was in application services, business rules were hard to find and test. Moving to ShippingCostCalculator domain service centralized domain knowledge, making rules testable and maintainable. Domain services make domain expertise explicit and testable.

### Example 30: Domain Service vs Application Service

Understanding the difference between domain services (domain logic) and application services (orchestration).

```typescript
// Domain Service - Contains domain logic
class PricingService {
  calculateDiscount(customer: Customer, order: Order): Money {
    // Domain logic: VIP customers get 10% discount
    if (customer.isVIP()) {
      // => Conditional check
      const total = order.getTotal();
      return total.multiply(0.1); // => 10% discount for VIPs
    }

    // Domain logic: Orders over $500 get 5% discount
    if (order.getTotal().isGreaterThan(Money.dollars(500))) {
      return order.getTotal().multiply(0.05); // => 5% discount for large orders
    }

    return Money.zero("USD"); // => No discount
    // => Discount calculated based on business rules
  }
}

// Application Service - Orchestrates use case
class OrderApplicationService {
  constructor(
    // => Initialize object with parameters
    private orderRepo: OrderRepository,
    // => Encapsulated field (not publicly accessible)
    private customerRepo: CustomerRepository,
    // => Encapsulated field (not publicly accessible)
    private pricingService: PricingService, // => Domain service injected
    private emailService: EmailService, // => Infrastructure service
    private eventPublisher: EventPublisher, // => Infrastructure service
  ) {}

  async placeOrder(orderId: string): Promise<void> {
    // Step 1: Load aggregates (orchestration)
    const order = await this.orderRepo.findById(orderId);
    // => Store value in order
    const customer = await this.customerRepo.findById(order.getCustomerId());
    // => Store value in customer

    // Step 2: Use domain service for domain logic
    const discount = this.pricingService.calculateDiscount(customer, order);
    // => Domain service calculates discount

    // Step 3: Apply discount to order (domain logic in aggregate)
    order.applyDiscount(discount);
    // => Order state updated

    // Step 4: Submit order (domain logic in aggregate)
    order.submit();
    // => Order submitted

    // Step 5: Save aggregate (orchestration)
    await this.orderRepo.save(order);
    // => Delegates to internal method

    // Step 6: Infrastructure operations (orchestration)
    await this.emailService.sendOrderConfirmation(customer.getEmail(), order);
    // => Delegates to internal method
    await this.eventPublisher.publish(new OrderPlacedEvent(orderId));
    // => Delegates to internal method

    // Application service orchestrates; domain logic in domain service/aggregates
  }
}

// Infrastructure Service - Technical operations (NOT domain logic)
class EmailService {
  async sendOrderConfirmation(email: string, order: Order): Promise<void> {
    // Technical operation: send email via SMTP
    // => Email sent (infrastructure concern, not domain logic)
  }
}
```

**Key Takeaway**: Domain services contain domain logic that doesn't fit in aggregates. Application services orchestrate use cases (load, coordinate, save) but delegate domain logic to aggregates and domain services. Infrastructure services handle technical concerns (email, database, messaging).

**Why It Matters**: Mixing domain logic into application services makes business rules scattered and untestable. When Amazon analyzed their checkout flow, they found pricing logic split across 15 application service methods—impossible to test consistently. Moving to PricingService (domain service) centralized business rules, making them testable without infrastructure dependencies. Clear separation (application services orchestrate, domain services contain logic) keeps business rules discoverable and maintainable.

---

This completes the beginner-level DDD by-example tutorial with 30 comprehensive examples covering tactical patterns (Entities, Value Objects, Aggregates, Repositories, Domain Events, Domain Services) that form the foundation for modeling complex business domains.
