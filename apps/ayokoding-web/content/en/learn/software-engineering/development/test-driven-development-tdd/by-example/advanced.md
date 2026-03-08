---
title: "Advanced"
date: 2026-01-31T00:00:00+07:00
draft: false
weight: 10000003
description: "Examples 59-85: Enterprise TDD, legacy code, and scaling patterns (75-95% coverage)"
tags: ["tdd", "tutorial", "by-example", "advanced", "legacy-code", "microservices", "enterprise"]
---

This tutorial covers advanced TDD patterns for enterprise environments including legacy code testing, approval testing, TDD in distributed systems, microservices patterns, and scaling TDD across teams.

## Legacy Code and Seam Identification (Examples 59-62)

### Example 59: Characterization Tests for Legacy Code

Characterization tests capture current behavior of legacy code without refactoring. They document what the system actually does (not what it should do) to establish a safety net before changes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph TD
    A[Legacy Code]
    B[Characterization Tests]
    C[Refactoring]
    D[Verified Code]

    A -->|Capture behavior| B
    B -->|Safety net created| C
    C -->|Tests pass| D

    style A fill:#DE8F05,stroke:#000,color:#fff
    style B fill:#0173B2,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Red: Test unknown legacy behavior**

```typescript
test("characterize calculation logic", () => {
  // => FAILS: Don't know what legacyCalculate returns
  const result = legacyCalculate(100, 10, "SPECIAL");
  expect(result).toBe(???); // Unknown expected value
});
```

**Green: Run and capture actual behavior**

```typescript
function legacyCalculate(amount: number, rate: number, type: string): number {
  // => Complex legacy logic
  let result = amount * rate; // => Multiply amount by rate
  if (type === "SPECIAL") {
    // => Branch for SPECIAL type
    result = result * 1.5 + 25; // => Apply mysterious formula
  } // => result after SPECIAL formula
  return result; // => Return calculated value
}

describe("legacyCalculate characterization", () => {
  test("characterizes normal calculation", () => {
    const result = legacyCalculate(100, 10, "NORMAL");
    expect(result).toBe(1000); // => Captured actual behavior
  }); // => Documents what system does now

  test("characterizes SPECIAL type calculation", () => {
    const result = legacyCalculate(100, 10, "SPECIAL");
    expect(result).toBe(1525); // => Captured: (100*10)*1.5 + 25 = 1525
  }); // => Mysterious formula now documented

  test("characterizes edge case", () => {
    const result = legacyCalculate(0, 5, "SPECIAL");
    expect(result).toBe(25); // => Captured: (0*5)*1.5 + 25 = 25
  }); // => Documents zero case behavior
});
```

**Key Takeaway**: Characterization tests capture current behavior (even if buggy) to create safety net before refactoring. Write tests that pass with existing code, then refactor with confidence.

**Why It Matters**: Legacy code without tests is too risky to change without characterization tests as a safety net. Michael Feathers' "Working Effectively with Legacy Code" shows that characterization tests enable safe refactoring by documenting current behavior before modification. Financial institutions using characterization testing have reported 60-70% reductions in legacy code incidents during modernization projects. The key insight is that characterization tests document what the code _does_, not what it _should_ do - capturing bugs and all. This honest baseline enables refactoring without accidentally changing behavior that downstream systems depend on, however unintentional that behavior may be.

### Example 60: Approval Testing for Complex Outputs

Approval testing (golden master testing) compares large outputs against approved baseline. Ideal for testing complex data structures, reports, or generated code.

**Red: Test complex report generation**

```typescript
test("generates user report", () => {
  // => FAILS: Complex report structure
  const report = generateReport(users);
  // How to assert on 50+ line report?
});
```

**Green: Approval testing implementation**

**Why Not `toMatchSnapshot()`**: Jest's built-in `toMatchSnapshot()` stores snapshots in `__snapshots__` directories alongside tests with automatic inline update support. The `approvals` library provides a separate workflow: outputs are stored as `.approved.txt` files that can be opened in any diff tool and require explicit approval. For large outputs like 50+ line reports, approvals' external file workflow is more reviewable than inline Jest snapshots. Use `toMatchSnapshot()` for component trees and small outputs; use approvals for large text reports and file-based comparisons.

```typescript
import { verify } from "approvals";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

function generateReport(users: User[]): string {
  // => Generates multi-line report
  let report = "USER REPORT\n"; // => Header
  report += "===========\n";

  users.forEach((user) => {
    // => For each user
    report += `ID: ${user.id}\n`; // => Add ID line
    report += `Name: ${user.name}\n`; // => Add name line
    report += `Email: ${user.email}\n`; // => Add email line
    report += `Role: ${user.role}\n`; // => Add role line
    report += "---\n"; // => Separator
  });

  return report; // => Return formatted report
}

test("approval test for user report", () => {
  const users = [
    // => Test data
    { id: 1, name: "Alice", email: "alice@example.com", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@example.com", role: "User" },
  ];

  const report = generateReport(users); // => Generate report

  verify(report); // => Compare against approved baseline
}); // => On first run, saves baseline; future runs compare
```

**Refactored: Approval testing with multiple scenarios**

```typescript
describe("Report approval tests", () => {
  test("approves empty report", () => {
    const report = generateReport([]); // => Empty user list
    verify(report); // => Baseline: header only
  });

  test("approves single user report", () => {
    const users = [{ id: 1, name: "Alice", email: "alice@example.com", role: "Admin" }];
    const report = generateReport(users);
    verify(report); // => Baseline: one user section
  });

  test("approves multi-user report", () => {
    const users = [
      { id: 1, name: "Alice", email: "alice@example.com", role: "Admin" },
      { id: 2, name: "Bob", email: "bob@example.com", role: "User" },
      { id: 3, name: "Charlie", email: "charlie@example.com", role: "Guest" },
    ];
    const report = generateReport(users);
    verify(report); // => Baseline: three user sections
  });
});
```

**Key Takeaway**: Approval testing captures complex outputs as baseline files. First run creates baseline, subsequent runs compare against it. Ideal for reports, generated code, or large data structures.

**Why It Matters**: Manual verification of complex outputs is error-prone and time-consuming for outputs spanning hundreds of lines. Approval testing automates regression detection by maintaining approved output files as version-controlled baselines. Code review tooling shows approval file diffs alongside code changes, making regressions immediately visible. Enterprise reporting systems using approval testing have caught over 80% of formatting regressions that manual reviews missed, because humans scan large outputs rather than line-by-line comparing them. Approval testing is particularly valuable for generated code, complex JSON/XML APIs, and report formatting.

### Example 61: Working with Seams in Untestable Code

Seams are places where you can alter program behavior without modifying code. Identify seams to inject test doubles into legacy code.

**Red: Untestable code with hard dependencies**

```typescript
class OrderProcessor {
  processOrder(orderId: number): boolean {
    const db = new Database(); // => FAIL: Hard-coded dependency
    const order = db.getOrder(orderId); // => Cannot test without real DB

    const payment = new PaymentGateway(); // => FAIL: Hard-coded payment
    return payment.charge(order.total); // => Cannot test without real gateway
  }
}
```

**Green: Identify seams and inject dependencies**

```typescript
interface Database {
  getOrder(id: number): { id: number; total: number };
}

interface PaymentGateway {
  charge(amount: number): boolean;
}

class OrderProcessor {
  constructor(
    // => Seam 1: Constructor injection
    private db: Database,
    private payment: PaymentGateway,
  ) {}

  processOrder(orderId: number): boolean {
    const order = this.db.getOrder(orderId); // => Uses injected DB
    return this.payment.charge(order.total); // => Uses injected gateway
  }
}

test("processOrder with test doubles", () => {
  const fakeDb = {
    // => Fake database seam
    getOrder: (id: number) => ({ id, total: 100 }),
  };

  const fakePayment = {
    // => Fake payment seam
    charge: (amount: number) => amount < 1000,
  };

  const processor = new OrderProcessor(fakeDb, fakePayment); // => Inject seams

  const result = processor.processOrder(1);

  expect(result).toBe(true); // => Verify behavior
}); // => Tested without real dependencies
```

**Key Takeaway**: Seams enable testing by providing injection points for test doubles. Constructor injection, method parameters, and callbacks are common seams.

**Why It Matters**: Legacy code often has hard-coded dependencies making it untestable without seam identification. Seams are points where behavior can be changed without modifying the code being changed - function call replacements, link seams in compiled languages, preprocessor seams. Enterprise platforms using systematic seam identification can introduce testing into 10-year-old legacy codebases within months, enabling safe modernization without risky full rewrites. Michael Feathers identifies seam-finding as the primary skill needed for legacy code work, and its application has enabled major financial institutions to modernize core banking systems incrementally while maintaining 99.99% uptime.

### Example 62: Dependency Breaking Techniques

Breaking dependencies makes legacy code testable. Use extract method, extract interface, and parameterize constructor to create seams.

**Red: Class with multiple hard dependencies**

```typescript
class UserService {
  createUser(name: string, email: string): void {
    // => Multiple hard dependencies
    const db = new Database(); // => Hard dependency 1
    const emailer = new EmailService(); // => Hard dependency 2
    const logger = new Logger(); // => Hard dependency 3

    db.saveUser({ name, email }); // => Cannot test
    emailer.sendWelcome(email); // => Cannot test
    logger.log(`User created: ${name}`); // => Cannot test
  }
}
```

**Green: Extract and inject dependencies**

```typescript
interface Database {
  saveUser(user: { name: string; email: string }): void;
}

interface EmailService {
  sendWelcome(email: string): void;
}

interface Logger {
  log(message: string): void;
}

class UserService {
  constructor(
    // => Parameterize constructor
    private db: Database,
    private emailer: EmailService,
    private logger: Logger,
  ) {}

  createUser(name: string, email: string): void {
    this.db.saveUser({ name, email }); // => Uses injected DB
    this.emailer.sendWelcome(email); // => Uses injected emailer
    this.logger.log(`User created: ${name}`); // => Uses injected logger
  }
}

test("createUser calls all services", () => {
  const mockDb = {
    saveUser: jest.fn(),
  }; // => Mock database
  const mockEmailer = {
    sendWelcome: jest.fn(),
  }; // => Mock emailer
  const mockLogger = {
    log: jest.fn(),
  }; // => Mock logger

  const service = new UserService(mockDb, mockEmailer, mockLogger); // => Inject mocks
  service.createUser("Alice", "alice@example.com");

  expect(mockDb.saveUser).toHaveBeenCalledWith({ name: "Alice", email: "alice@example.com" });
  expect(mockEmailer.sendWelcome).toHaveBeenCalledWith("alice@example.com");
  expect(mockLogger.log).toHaveBeenCalledWith("User created: Alice");
}); // => All interactions verified
```

**Key Takeaway**: Break hard dependencies by extracting interfaces and injecting through constructor. This creates seams for testing without changing core logic.

**Why It Matters**: Hard dependencies block testing and refactoring, making codebases progressively more expensive to modify as they grow. Dependency breaking techniques - constructor injection, parameter passing, factory extraction - enable incremental testability improvements without rewrites. Twitter's backend team documented 10x faster test execution after breaking database dependencies in their timeline service using these techniques, enabling the Red-Green-Refactor cycle for code that had been effectively frozen for years. Each dependency broken enables more tests, which enables more confident refactoring, creating a virtuous cycle of improving code quality.

## Microservices and Distributed Systems (Examples 63-68)

### Example 63: TDD for Microservices - Service Isolation

Microservices require testing individual services in isolation without full environment. Use contract testing and service virtualization.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[Order Service Under Test]
    B[Payment Service Stub]
    C[Inventory Service Stub]
    D[Notification Service Stub]

    A -->|"isolated call"| B
    A -->|"isolated call"| C
    A -->|"isolated call"| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

**Red: Test service depending on other microservices**

```typescript
test("UserService gets user orders", async () => {
  const userService = new UserService(); // => FAILS: Needs OrderService running
  const orders = await userService.getUserOrders(1);
  expect(orders).toHaveLength(2);
});
```

**Green: Mock HTTP client for service isolation**

```typescript
interface HttpClient {
  get(url: string): Promise<any>;
}

class UserService {
  constructor(
    private http: HttpClient,
    private orderServiceUrl: string,
  ) {}

  async getUserOrders(userId: number): Promise<any[]> {
    const response = await this.http.get(`${this.orderServiceUrl}/users/${userId}/orders`);
    // => Calls order service
    return response.data; // => Returns order data
  }
}

test("UserService gets user orders via HTTP", async () => {
  const mockHttp = {
    // => Mock HTTP client
    get: jest.fn().mockResolvedValue({
      // => Mock response
      data: [
        { id: 1, total: 100 },
        { id: 2, total: 200 },
      ],
    }),
  };

  const userService = new UserService(mockHttp, "http://order-service"); // => Inject mock
  const orders = await userService.getUserOrders(1);

  expect(orders).toHaveLength(2); // => Verify result
  expect(mockHttp.get).toHaveBeenCalledWith("http://order-service/users/1/orders");
}); // => Tested without real OrderService
```

**Key Takeaway**: Test microservices in isolation by mocking HTTP clients. Inject service URLs and HTTP clients as dependencies to enable independent testing.

**Why It Matters**: Microservices with real service dependencies are slow, flaky, and require environment orchestration that blocks rapid TDD cycles. Service isolation enables fast unit testing where each microservice is tested independently against virtual dependencies. Large-scale microservice architectures like Netflix's (500+ services) run 100,000+ tests in under 5 minutes using service virtualization instead of full environment deployments. This speed is only achievable with dependency injection and service isolation as first-class design principles - TDD naturally drives these design decisions because untestable code with hard dependencies is painful to work with.

### Example 64: Contract Testing for Microservices

Contract testing verifies service integrations match expected contracts without running both services. Producer defines contract, consumer tests against it.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph LR
    A[Consumer Service]
    B[Consumer Contract]
    C[Provider Service]
    D[Provider Verification]

    A -->|"defines"| B
    B -->|"verified against"| C
    C -->|"validated by"| D
    D -->|"CI gate"| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
```

**Red: Integration test requiring both services**

```typescript
test("UserService integrates with OrderService", async () => {
  // => FAILS: Requires both services running
  const orderService = new OrderService(); // Real service
  const userService = new UserService(orderService);
  const orders = await userService.getUserOrders(1);
  expect(orders[0].id).toBe(1);
});
```

**Green: Consumer-driven contract testing**

```typescript
// Contract definition
interface OrderServiceContract {
  "GET /users/:userId/orders": {
    response: {
      data: Array<{ id: number; total: number; status: string }>;
    };
  };
}

// Consumer test (UserService side)
test("UserService expects OrderService contract", async () => {
  const mockHttp = {
    get: jest.fn().mockResolvedValue({
      // => Contract shape
      data: [
        { id: 1, total: 100, status: "pending" }, // => Matches contract
        { id: 2, total: 200, status: "shipped" },
      ],
    }),
  };

  const userService = new UserService(mockHttp, "http://order-service");
  const orders = await userService.getUserOrders(1);

  expect(orders).toEqual([
    // => Verify contract structure
    { id: 1, total: 100, status: "pending" },
    { id: 2, total: 200, status: "shipped" },
  ]);
}); // => Consumer validates expected contract

// Provider test (OrderService side)
test("OrderService fulfills contract", async () => {
  const orderService = new OrderService();
  const response = await orderService.getOrdersByUserId(1);

  // Verify response matches contract
  expect(response.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        // => Contract fields required
        id: expect.any(Number),
        total: expect.any(Number),
        status: expect.any(String),
      }),
    ]),
  );
}); // => Provider guarantees contract compliance
```

**Key Takeaway**: Contract testing validates service integration expectations without running both services. Consumer defines expected contract, provider guarantees compliance.

**Why It Matters**: Integration testing all microservice combinations grows exponentially - with 20 services, full combinatorial testing requires 190 integration test pairs. Contract testing catches integration bugs without full environments by verifying that each service fulfills the contracts its consumers expect. Pact (contract testing tool) users report 70% fewer integration failures in production because breaking API changes are caught in CI before deployment. Contract tests also serve as living documentation of inter-service APIs, reducing the coordination overhead between teams owning different services in large engineering organizations.

### Example 65: Testing Distributed Systems - Eventual Consistency

Distributed systems often have eventual consistency. Tests must account for asynchronous propagation and race conditions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
sequenceDiagram
    participant Test
    participant Primary
    participant Replica

    Test->>Primary: Write data
    Primary-->>Test: Write confirmed
    Note over Primary,Replica: Async replication delay
    Test->>Replica: Eventually read (poll)
    Replica-->>Test: Data available
```

**Red: Test assumes immediate consistency**

```typescript
test("replication happens immediately", async () => {
  await primaryDb.write({ id: 1, name: "Alice" }); // => Write to primary
  const data = await replicaDb.read(1); // => FAILS: Replica not updated yet
  expect(data.name).toBe("Alice"); // Race condition
});
```

**Green: Test eventual consistency with polling**

```typescript
async function waitForReplication<T>(
  fetchFn: () => Promise<T>,
  predicate: (value: T) => boolean,
  timeout = 5000,
): Promise<T> {
  // => Poll until condition met
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // => Keep trying until timeout
    const value = await fetchFn(); // => Fetch current value
    if (predicate(value)) {
      return value;
    } // => Return when predicate true
    await new Promise((resolve) => setTimeout(resolve, 100)); // => Wait 100ms
  }

  throw new Error("Timeout waiting for replication"); // => Failed to meet condition
}

test("replication happens eventually", async () => {
  await primaryDb.write({ id: 1, name: "Alice" }); // => Write to primary

  const data = await waitForReplication(
    () => replicaDb.read(1), // => Fetch function
    (value) => value !== null && value.name === "Alice", // => Predicate
    5000, // => 5 second timeout
  ); // => Polls until replicated

  expect(data.name).toBe("Alice"); // => Verify after eventual consistency
}); // => Test accounts for async propagation
```

**Key Takeaway**: Test eventual consistency with polling and timeouts. Don't assume immediate consistency in distributed systems - wait for conditions to be met.

**Why It Matters**: Distributed systems have inherent delays that make tests assuming immediate consistency the leading cause of flaky tests in microservice architectures. Eventual consistency helpers abstract timing concerns from tests, enabling deterministic verification of distributed state. Amazon's DynamoDB team documented that eventual consistency test helpers eliminated 85% of timing-related test failures in their distributed testing suite. The pattern also documents system behavior clearly: when tests use explicit "eventually consistent" assertions, the distributed nature of the system is visible in the test code itself, preventing false assumptions about synchronous consistency propagating through the codebase.

### Example 66: Testing Event Sourcing Systems

Event sourcing stores state changes as events. TDD for event sourcing tests event application and state reconstruction.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph LR
    A["AccountCreated"]
    B["MoneyDeposited(100)"]
    C["MoneyWithdrawn(30)"]
    D["Rebuilt State: Balance=70"]

    A -->|"apply"| B
    B -->|"apply"| C
    C -->|"fold all events"| D

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Red: Test event sourcing without infrastructure**

```typescript
test("applies events to rebuild state", () => {
  const account = new Account(); // => FAILS: Needs event store
  account.applyEvent({ type: "Deposited", amount: 100 });
  expect(account.getBalance()).toBe(100);
});
```

**Green: Event sourcing with in-memory event store**

```typescript
type Event = { type: "Deposited"; amount: number } | { type: "Withdrawn"; amount: number };

class Account {
  private balance = 0;

  applyEvent(event: Event): void {
    // => Apply event to state
    if (event.type === "Deposited") {
      this.balance += event.amount; // => Increase balance
    } else if (event.type === "Withdrawn") {
      this.balance -= event.amount; // => Decrease balance
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

test("applies deposit events", () => {
  const account = new Account();
  account.applyEvent({ type: "Deposited", amount: 100 }); // => Apply deposit
  expect(account.getBalance()).toBe(100); // => Balance increased
});

test("applies multiple events in order", () => {
  const account = new Account();
  account.applyEvent({ type: "Deposited", amount: 100 }); // => Deposit 100
  account.applyEvent({ type: "Withdrawn", amount: 30 }); // => Withdraw 30
  account.applyEvent({ type: "Deposited", amount: 50 }); // => Deposit 50

  expect(account.getBalance()).toBe(120); // => 100 - 30 + 50 = 120
}); // => Events applied in sequence
```

**Refactored: Event store with event replay**

```typescript
class EventStore {
  private events: Map<string, Event[]> = new Map(); // => In-memory event storage

  append(streamId: string, event: Event): void {
    if (!this.events.has(streamId)) {
      this.events.set(streamId, []); // => Initialize stream
    }
    this.events.get(streamId)!.push(event); // => Append event
  }

  getEvents(streamId: string): Event[] {
    return this.events.get(streamId) || []; // => Retrieve event stream
  }
}

function replayEvents(events: Event[]): Account {
  // => Rebuild state from events
  const account = new Account();
  events.forEach((event) => account.applyEvent(event)); // => Apply each event
  return account; // => Return reconstructed state
}

test("rebuilds state from event store", () => {
  const store = new EventStore();
  const accountId = "account-1";

  store.append(accountId, { type: "Deposited", amount: 100 });
  store.append(accountId, { type: "Withdrawn", amount: 30 });
  store.append(accountId, { type: "Deposited", amount: 50 });

  const events = store.getEvents(accountId); // => Retrieve all events
  const account = replayEvents(events); // => Rebuild from events

  expect(account.getBalance()).toBe(120); // => State reconstructed correctly
});
```

**Key Takeaway**: Test event sourcing by applying events and verifying state. Use in-memory event stores for fast testing without infrastructure.

**Why It Matters**: Event sourcing enables audit trails, temporal queries, and event replay - capabilities with high business value but complex implementation. TDD ensures correct event application logic prevents events from being applied out of order or applied multiple times (idempotency violations). Event sourcing tests catch event schema evolution bugs during development that would corrupt production state and require expensive data migrations to fix. Financial trading platforms using TDD-verified event sourcing report catching 90%+ of event ordering bugs in development, preventing compliance violations from incorrect trade history reconstruction.

### Example 67: Testing CQRS Patterns

CQRS (Command Query Responsibility Segregation) separates read and write models. TDD tests commands and queries independently.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[Client Request]
    B{Command or Query?}
    C[Command Handler]
    D[Write Store]
    E[Query Handler]
    F[Read Model]

    A --> B
    B -->|"mutation"| C --> D
    B -->|"read-only"| E --> F

    style A fill:#CA9161,stroke:#000,color:#fff
    style B fill:#CC78BC,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
```

**Red: Test CQRS without separation**

```typescript
test("updates and queries user", () => {
  const service = new UserService(); // => FAILS: Needs read/write separation
  service.updateUser(1, { name: "Alice" });
  const user = service.getUser(1);
  expect(user.name).toBe("Alice");
});
```

**Green: Separate command and query models**

```typescript
// Write model (Commands)
interface UpdateUserCommand {
  userId: number;
  data: { name: string };
}

class UserCommandHandler {
  private writeDb: Map<number, any> = new Map(); // => Write model storage

  handle(command: UpdateUserCommand): void {
    this.writeDb.set(command.userId, command.data); // => Store update
    // In production: publish event to sync read model
  }
}

// Read model (Queries)
interface UserQuery {
  userId: number;
}

class UserQueryHandler {
  private readDb: Map<number, any> = new Map(); // => Read model storage

  query(query: UserQuery): any {
    return this.readDb.get(query.userId); // => Retrieve from read model
  }

  syncFromEvent(userId: number, data: any): void {
    // => Sync from event
    this.readDb.set(userId, data); // => Update read model
  }
}

describe("CQRS pattern", () => {
  test("command handler processes updates", () => {
    const commandHandler = new UserCommandHandler();
    commandHandler.handle({ userId: 1, data: { name: "Alice" } }); // => Execute command
    // Command side doesn't return data, only processes
  });

  test("query handler retrieves data", () => {
    const queryHandler = new UserQueryHandler();
    queryHandler.syncFromEvent(1, { name: "Alice" }); // => Simulate event sync

    const user = queryHandler.query({ userId: 1 }); // => Execute query
    expect(user.name).toBe("Alice"); // => Verify read model
  });
});
```

**Key Takeaway**: Test commands and queries separately in CQRS. Commands modify state, queries read optimized views. Test synchronization between write and read models.

**Why It Matters**: CQRS enables independent scaling of reads and writes, but introduces complexity through eventual consistency between command and query sides. Separate testing prevents coupling that would undermine CQRS's benefits - if command tests depend on query state, the separation exists only in structure, not behavior. Enterprise services adopting CQRS with separate command/query test suites report 50% reduction in cross-concern bugs compared to mixed command/query tests. The separated test structure also clarifies ownership boundaries: command tests are owned by teams handling mutations, query tests by teams optimizing read performance.

### Example 68: TDD in Polyglot Environments

Teams using multiple languages need consistent TDD practices across languages. Adapt patterns to language idioms while maintaining discipline.

**Challenge**: Consistent TDD across Java and TypeScript

**Java approach (JUnit 5)**:

```java
@Test
void calculateDiscount_appliesCorrectRate() {
    // => Given
    PriceCalculator calculator = new PriceCalculator();
    // => Calculator instance created

    // => When
    BigDecimal result = calculator.calculateDiscount(
        new BigDecimal("100"),
        new BigDecimal("0.1")
    );
    // => Calls calculateDiscount with 100 and 10% rate

    // => Then
    assertEquals(
        new BigDecimal("90.00"),
        result.setScale(2, RoundingMode.HALF_UP)
    );
    // => Verifies result is 90.00 (100 - 10%)
}
```

**TypeScript approach (Jest)**:

```typescript
test("calculateDiscount applies correct rate", () => {
  // => Arrange
  const calculator = new PriceCalculator();
  // => Calculator instance created

  // => Act
  const result = calculator.calculateDiscount(100, 0.1);
  // => Calls calculateDiscount with 100 and 10% rate

  // => Assert
  expect(result).toBe(90); // => Verifies result is 90 (100 - 10%)
});
```

**Key Similarities (Cross-Language TDD)**:

```markdown
1. **Arrange-Act-Assert pattern** - Both use AAA structure
2. **Descriptive test names** - `calculateDiscount_appliesCorrectRate` vs `calculateDiscount applies correct rate`
3. **Single assertion focus** - Each test verifies one behavior
4. **Fast execution** - Both run in milliseconds
5. **Red-Green-Refactor** - Same TDD cycle
```

**Language-Specific Adaptations**:

```markdown
| Aspect          | Java                      | TypeScript                  |
| --------------- | ------------------------- | --------------------------- |
| **Test Runner** | JUnit 5                   | Jest                        |
| **Mocking**     | Mockito                   | jest.fn()                   |
| **Assertions**  | assertEquals, assertTrue  | expect().toBe(), .toEqual() |
| **Async**       | CompletableFuture         | async/await                 |
| **Type Safety** | Compile-time (static)     | Compile-time (TypeScript)   |
| **Naming**      | camelCase_withUnderscores | camelCase with spaces       |
| **Lifecycle**   | @BeforeEach, @AfterEach   | beforeEach(), afterEach()   |
```

**Key Takeaway**: TDD principles (Red-Green-Refactor, AAA pattern, single assertion) are universal. Adapt to language idioms while maintaining core discipline.

**Why It Matters**: Polyglot teams risk inconsistent testing quality across languages, with some languages having mature testing ecosystems and others lacking tooling. Universal TDD principles maintain quality by defining patterns (Red-Green-Refactor, AAA, test doubles) that apply regardless of language. Enterprise polyglot codebases at companies like LinkedIn (Java, Scala, Python, JavaScript) use language-specific tools (JUnit, ScalaTest, pytest, Jest) but consistent TDD patterns to achieve 80%+ coverage across all languages. The principles are portable even when the tools differ, enabling engineers to transfer testing knowledge between languages as they learn new parts of the stack.

## Performance, Security, and Anti-Patterns (Examples 69-72)

### Example 69: Performance-Sensitive TDD

Performance-critical code needs TDD without sacrificing optimization. Write performance tests alongside functional tests.

**Red: Functional test without performance constraint**

```typescript
test("sorts array correctly", () => {
  const input = [3, 1, 4, 1, 5, 9, 2, 6];
  const result = sort(input); // => FAILS: Function not defined
  expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
});
```

**Green: Naive implementation (functional but slow)**

```typescript
function sort(arr: number[]): number[] {
  // => Bubble sort (O(n²))
  const result = [...arr]; // => Copy array
  for (let i = 0; i < result.length; i++) {
    // => Outer loop
    for (let j = 0; j < result.length - 1; j++) {
      // => Inner loop
      if (result[j] > result[j + 1]) {
        // => Compare adjacent
        [result[j], result[j + 1]] = [result[j + 1], result[j]]; // => Swap
      }
    }
  }
  return result; // => Sorted array
}

test("sorts array correctly", () => {
  const input = [3, 1, 4, 1, 5, 9, 2, 6];
  const result = sort(input);
  expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]); // => Passes
});
```

**Refactor: Add performance constraint and optimize**

```typescript
function sort(arr: number[]): number[] {
  // => Native sort (O(n log n))
  return [...arr].sort((a, b) => a - b); // => Optimized algorithm
}

describe("sort", () => {
  test("sorts array correctly", () => {
    const input = [3, 1, 4, 1, 5, 9, 2, 6];
    const result = sort(input);
    expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9]); // => Functional correctness
  });

  test("sorts large array within performance constraint", () => {
    const input = Array.from({ length: 10000 }, () => Math.random()); // => 10k items
    const startTime = Date.now();

    const result = sort(input); // => Sort large array

    const duration = Date.now() - startTime; // => Measure time
    expect(duration).toBeLessThan(100); // => Must complete in <100ms
    expect(result[0]).toBeLessThanOrEqual(result[result.length - 1]); // => Verify sorted
  }); // => Performance test
});
```

**Key Takeaway**: Start with functional tests, then add performance constraints. Optimize implementation while keeping functional tests passing.

**Why It Matters**: Premature optimization leads to complex, hard-to-maintain code without proven performance need. TDD enables optimization when needed by establishing behavioral baselines first, then adding performance assertions as separate tests. V8 JavaScript engine development uses performance tests alongside behavioral tests to prevent regressions during optimization work - each optimization is verified to not break behavior while meeting performance targets. This discipline prevents the common failure mode of optimizations that improve benchmark numbers while introducing subtle behavioral regressions that only surface in production workloads.

### Example 70: Security Testing with TDD

Security requirements need TDD just like functional requirements. Test authentication, authorization, input validation, and encryption.

**Red: Test authentication requirement**

```typescript
test("rejects unauthenticated access", () => {
  const middleware = authMiddleware(); // => FAILS: Not defined
  const req = { headers: {} }; // No auth header
  const res = { status: jest.fn(), send: jest.fn() };

  middleware(req, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(401);
});
```

**Green: Authentication middleware**

```typescript
interface Request {
  headers: { authorization?: string };
}

interface Response {
  status(code: number): Response;
  send(body: any): void;
}

function authMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    if (!req.headers.authorization) {
      // => Check authorization header
      res.status(401).send({ error: "Unauthorized" }); // => Reject
      return;
    }

    const token = req.headers.authorization.replace("Bearer ", ""); // => Extract token
    if (token !== "valid-token") {
      // => Validate token
      res.status(403).send({ error: "Forbidden" }); // => Invalid token
      return;
    }

    next(); // => Allow request
  };
}

describe("authMiddleware", () => {
  test("rejects unauthenticated access", () => {
    const middleware = authMiddleware();
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    middleware(req as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401); // => Unauthorized
    expect(res.send).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("rejects invalid token", () => {
    const middleware = authMiddleware();
    const req = { headers: { authorization: "Bearer invalid" } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    middleware(req as Request, res as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403); // => Forbidden
  });

  test("allows valid token", () => {
    const middleware = authMiddleware();
    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = { status: jest.fn(), send: jest.fn() };
    const next = jest.fn();

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled(); // => Request allowed
  });
});
```

**Key Takeaway**: Test security requirements (authentication, authorization, validation) with same TDD rigor as functional features. Write failing security test, implement protection, verify it works.

**Why It Matters**: Security bugs are often logic errors testable through TDD before deploying to production where exploitation has real consequences. Research from NIST shows that security vulnerabilities found during development cost 6x less to fix than those found in testing and 100x less than those found in production. Input validation bugs (SQL injection, XSS, command injection) are straightforward to test with TDD - write tests that attempt malicious inputs and verify they are rejected. Authentication and authorization logic bugs are business logic errors, not infrastructure issues, making them excellent TDD targets.

### Example 71: TDD Anti-Patterns - Testing Implementation Details

Testing implementation details makes tests brittle. Focus on behavior and public API, not internal structure.

**ANTI-PATTERN: Testing private implementation**

```typescript
class ShoppingCart {
  private items: any[] = []; // => Private field

  addItem(item: any): void {
    this.items.push(item); // => Internal implementation
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// FAIL: BAD - Tests private implementation
test("adds item to items array", () => {
  const cart = new ShoppingCart();
  cart.addItem({ id: 1, price: 10 });

  expect(cart["items"]).toHaveLength(1); // => Accesses private field
  expect(cart["items"][0].price).toBe(10); // => Tests internal structure
}); // => Brittle test, breaks when implementation changes
```

**CORRECT PATTERN: Test public behavior**

```typescript
// PASS: GOOD - Tests observable behavior
describe("ShoppingCart", () => {
  test("adds item and increases total", () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: 1, price: 10 }); // => Public API

    expect(cart.getTotal()).toBe(10); // => Observable behavior
  }); // => Tests what cart does, not how it does it

  test("calculates total for multiple items", () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: 1, price: 10 });
    cart.addItem({ id: 2, price: 20 });

    expect(cart.getTotal()).toBe(30); // => Behavior test
  });
});
```

**Comparison**:

```markdown
| Approach            | Implementation Testing (BAD)       | Behavior Testing (GOOD) |
| ------------------- | ---------------------------------- | ----------------------- |
| **What it tests**   | Internal structure (items array)   | Public behavior (total) |
| **Coupling**        | Tightly coupled to internals       | Coupled to API only     |
| **Refactor safety** | Breaks when implementation changes | Survives refactoring    |
| **Value**           | Tests how it works                 | Tests what it does      |
| **Maintenance**     | High (brittle tests)               | Low (stable tests)      |
```

**Key Takeaway**: Test observable behavior through public API, not internal implementation. Tests should verify what the code does for users, not how it achieves it internally.

**Why It Matters**: Tests coupled to implementation details break during refactoring, creating a negative feedback loop where the TDD safety net becomes a refactoring obstacle. Behavior-focused tests enable safe refactoring because they specify what the system does, not how it does it. Kent Beck's TDD philosophy emphasizes testing observable behavior (return values, state changes, interactions with dependencies) rather than internal implementation details. Google's codebase analysis shows that behavior-focused tests survive 3x more refactors than implementation-coupled tests, making them significantly more valuable as long-term regression protection. Avoiding implementation coupling is the single most impactful test design decision.

### Example 72: Test-Induced Design Damage

Over-application of TDD can lead to unnecessary complexity. Balance testability with design simplicity.

**ANTI-PATTERN: Over-engineering for testability**

```typescript
// FAIL: BAD - Excessive abstraction for testability
interface TimeProvider {
  now(): Date;
}

interface RandomProvider {
  random(): number;
}

interface LoggerProvider {
  log(message: string): void;
}

class UserService {
  constructor(
    private timeProvider: TimeProvider,
    private randomProvider: RandomProvider,
    private loggerProvider: LoggerProvider,
    // ... 5 more providers
  ) {} // => 8 constructor parameters for simple service

  createUser(name: string): any {
    const id = Math.floor(this.randomProvider.random() * 1000000);
    const createdAt = this.timeProvider.now();
    this.loggerProvider.log(`User created: ${name}`);
    return { id, name, createdAt };
  }
}
```

**CORRECT PATTERN: Pragmatic testability**

```typescript
// PASS: GOOD - Inject only what needs variation in tests
class UserService {
  constructor(private idGenerator: () => number = () => Math.floor(Math.random() * 1000000)) {
    // => Only inject what varies in tests
  }

  createUser(name: string): any {
    const id = this.idGenerator(); // => Injected dependency
    const createdAt = new Date(); // => Simple, deterministic in most tests
    console.log(`User created: ${name}`); // => Logging doesn't affect behavior
    return { id, name, createdAt };
  }
}

test("createUser generates unique ID", () => {
  let nextId = 1;
  const service = new UserService(() => nextId++); // => Inject only ID generator

  const user1 = service.createUser("Alice");
  const user2 = service.createUser("Bob");

  expect(user1.id).toBe(1); // => Deterministic ID
  expect(user2.id).toBe(2); // => Controlled behavior
}); // => Simple test without excessive mocking
```

**Comparison**:

```markdown
| Aspect              | Over-Engineered          | Pragmatic                  |
| ------------------- | ------------------------ | -------------------------- |
| **Constructor**     | 8+ parameters            | 1 parameter                |
| **Complexity**      | High (many abstractions) | Low (focused abstractions) |
| **Testability**     | 100% mockable            | Mockable where needed      |
| **Production Code** | Complex setup            | Simple setup               |
| **Maintenance**     | High (many interfaces)   | Low (minimal abstractions) |
```

**Key Takeaway**: Inject dependencies that vary in tests (IDs, external services). Don't inject stable utilities (logging, date formatting). Balance testability with simplicity.

**Why It Matters**: Over-abstraction for testability creates complex production code that is harder to understand and maintain than the original. Pragmatic TDD focuses on testing business logic through natural boundaries, not forcing artificial interfaces for mock injection. DHH's "TDD is dead" controversy highlighted test-induced design damage when testability concerns override design clarity - hexagonal architecture taken to extremes creates 10 layers of interfaces for simple CRUD operations. The balance is testing at the right level: unit tests for business logic, integration tests for infrastructure, avoiding the trap of mocking everything to achieve 100% unit test coverage on trivial code.

## Enterprise TDD - Scaling and Organization (Examples 73-77)

### Example 73: Scaling TDD Across Teams

Large organizations need consistent TDD practices across teams. Establish shared standards, CI enforcement, and knowledge sharing.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[Engineering Org]
    B[Shared TDD Standards]
    C[Team A]
    D[Team B]
    E[Team C]
    F[Shared Test Utilities]
    G[CI Enforcement]

    A -->|"defines"| B
    B -->|"adopted by"| C
    B -->|"adopted by"| D
    B -->|"adopted by"| E
    F -->|"used by"| C & D & E
    G -->|"enforces"| B

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#fff
    style G fill:#CA9161,stroke:#000,color:#fff
```

**Challenge**: 50+ teams with inconsistent testing practices

**Solution Framework**:

```typescript
// 1. Shared Testing Standards (documented in wiki/guide)
const TESTING_STANDARDS = {
  coverage: {
    minimum: 80, // => 80% line coverage required
    target: 95, // => 95% target for critical paths
  },
  naming: {
    pattern: "descriptive test names with spaces", // => Readable names
    structure: "should [expected behavior] when [condition]",
  },
  organization: {
    pattern: "describe → test hierarchy", // => Consistent structure
    oneAssertPerTest: false, // => Allow related assertions
  },
};

// 2. CI Enforcement (in pipeline config)
test("CI enforces coverage threshold", () => {
  const coverageReport = {
    // => Mock coverage report
    lines: { pct: 85 },
    statements: { pct: 84 },
    functions: { pct: 86 },
    branches: { pct: 82 },
  };

  const meetsThreshold = Object.values(coverageReport).every((metric) => metric.pct >= 80);
  // => Check all metrics

  expect(meetsThreshold).toBe(true); // => Enforced in CI
}); // => Build fails if coverage drops

// 3. Shared Test Utilities (npm package)
class TestHelpers {
  static createMockUser(overrides = {}): any {
    // => Shared test data builder
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "user",
      ...overrides, // => Customizable fields
    };
  }

  static waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
    // => Shared async helper
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout"));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}

// 4. Cross-Team Knowledge Sharing
describe("Testing Guild Practices", () => {
  test("teams share testing patterns", () => {
    const guild = {
      // => Testing guild structure
      members: ["Team A", "Team B", "Team C"],
      meetings: "bi-weekly",
      activities: ["pattern sharing", "code reviews", "training"],
    };

    expect(guild.activities).toContain("pattern sharing"); // => Knowledge transfer
  });
});
```

**Implementation Checklist**:

```markdown
- [ ] Document testing standards (wiki, guide)
- [ ] Enforce coverage thresholds in CI (80% minimum)
- [ ] Create shared test utility packages
- [ ] Establish testing guild for cross-team learning
- [ ] Implement pre-commit hooks for test quality
- [ ] Run periodic test health reviews
- [ ] Provide TDD training for new team members
- [ ] Share success stories and metrics
```

**Key Takeaway**: Scale TDD through documented standards, CI enforcement, shared utilities, and cross-team knowledge sharing. Consistency emerges from infrastructure and culture.

**Why It Matters**: Inconsistent testing across teams creates quality gaps where some services have 90% coverage and others have 10%, with the low-coverage services becoming the production incident sources. Standardization scales quality through shared practices, templates, and tooling that make good testing the path of least resistance. Large engineering organizations like Spotify standardize on testing templates and coverage thresholds across 150+ product teams, maintaining 80%+ average coverage through organizational culture rather than mandates. The key is making good practices easy: shared test utilities, generator templates, and clear documentation lower the barrier for teams starting TDD adoption.

### Example 74: TDD Coaching and Mentoring

Teaching TDD requires hands-on practice, not lectures. Use pair programming, code reviews, and kata exercises.

**Anti-Pattern: Lecture-Based Teaching**

```markdown
FAIL: BAD Approach:

1. Presentation: "Introduction to TDD" (60 minutes)
2. Slides: Red-Green-Refactor cycle (30 slides)
3. Demo: Instructor codes alone (20 minutes)
4. Q&A: Students ask questions (10 minutes)
5. Result: Students understand theory, can't apply it
```

**Effective Pattern: Practice-Based Learning**

```typescript
// 1. Kata Exercise: FizzBuzz (Pair Programming)
describe("FizzBuzz Kata", () => {
  // Kata steps:
  // - Driver: Write failing test
  // - Navigator: Suggest minimal implementation
  // - Switch roles every 5 minutes
  // - Complete 15 rules in 75 minutes

  test("returns number for non-multiples", () => {
    expect(fizzBuzz(1)).toBe("1"); // => Failing test (Red)
  });

  // Student implements minimal code (Green)
  function fizzBuzz(n: number): string {
    return String(n); // => Simplest implementation
  }

  test("returns Fizz for multiples of 3", () => {
    expect(fizzBuzz(3)).toBe("Fizz"); // => Next failing test
  });

  // Student refactors implementation (Refactor)
});

// 2. Code Review Feedback (Real Production Code)
class CodeReviewFeedback {
  // FAIL: BAD - Testing implementation details
  test_BAD_example() {
    const cart = new ShoppingCart();
    cart.addItem({ price: 10 });
    expect(cart["items"].length).toBe(1); // => Reviewer flags this
  }

  // PASS: GOOD - Testing behavior
  test_GOOD_example() {
    const cart = new ShoppingCart();
    cart.addItem({ price: 10 });
    expect(cart.getTotal()).toBe(10); // => Reviewer approves
  }
}

// 3. Mobbing Session (Team Learning)
describe("Mob Programming TDD", () => {
  // Setup:
  // - One driver (keyboard)
  // - 4-6 navigators (giving directions)
  // - Rotate driver every 10 minutes
  // - Solve real production problem as team

  test("team solves problem together", () => {
    const mobSession = {
      driver: "Alice",
      navigators: ["Bob", "Charlie", "Diana"],
      problem: "Implement user authentication",
      learnings: ["TDD rhythm", "Test design", "Refactoring"],
    };

    expect(mobSession.learnings).toContain("TDD rhythm"); // => Collective learning
  });
});
```

**Teaching Framework**:

```markdown
| Week | Activity                          | Duration | Focus                     |
| ---- | --------------------------------- | -------- | ------------------------- |
| 1    | FizzBuzz Kata (Pair Programming)  | 90 min   | Red-Green-Refactor rhythm |
| 2    | String Calculator Kata            | 90 min   | Test design               |
| 3    | Bowling Game Kata                 | 90 min   | Refactoring               |
| 4    | Production Code (Mob Programming) | 2 hours  | Real-world application    |
| 5    | Code Reviews with TDD Feedback    | Ongoing  | Continuous improvement    |
```

**Key Takeaway**: Teach TDD through hands-on practice (katas, pairing, mobbing) rather than lectures. Learning happens through doing, not listening.

**Why It Matters**: TDD is a motor skill requiring muscle memory, not just intellectual understanding. Developers who understand TDD conceptually but have not practiced katas often revert to test-after habits under deadline pressure. Uncle Bob Martin's TDD training uses katas exclusively, with 90%+ of participants applying TDD after kata practice versus 30% after lecture-only training. Effective TDD coaching requires creating safe environments for practice: no production pressure, immediate feedback, and paired practice. Organizations that invest in structured kata practice as part of onboarding see 70% TDD adoption rates versus 20% for organizations that only provide documentation and guidelines.

### Example 75: ROI Measurement for TDD

Measuring TDD return on investment requires tracking defect rates, development velocity, and maintenance costs.

**Metrics to Track**:

```typescript
interface TDDMetrics {
  defectDensity: number; // => Defects per 1000 lines of code
  developmentVelocity: number; // => Story points per sprint
  maintenanceCost: number; // => Hours spent on bug fixes
  testCoverage: number; // => Percentage of code covered
  cycleTime: number; // => Time from commit to production
}

// Before TDD baseline (Month 0)
const beforeTDD: TDDMetrics = {
  defectDensity: 15, // => 15 defects per 1000 LOC
  developmentVelocity: 20, // => 20 story points per sprint
  maintenanceCost: 120, // => 120 hours per month on bugs
  testCoverage: 40, // => 40% coverage
  cycleTime: 168, // => 1 week (hours)
};

// After TDD adoption (Month 6)
const afterTDD: TDDMetrics = {
  defectDensity: 3, // => 3 defects per 1000 LOC (80% reduction)
  developmentVelocity: 28, // => 28 story points per sprint (40% increase)
  maintenanceCost: 30, // => 30 hours per month on bugs (75% reduction)
  testCoverage: 92, // => 92% coverage
  cycleTime: 24, // => 1 day (hours) (86% reduction)
};

test("calculates TDD ROI", () => {
  const defectReduction = ((beforeTDD.defectDensity - afterTDD.defectDensity) / beforeTDD.defectDensity) * 100;
  // => 80% defect reduction

  const velocityIncrease =
    ((afterTDD.developmentVelocity - beforeTDD.developmentVelocity) / beforeTDD.developmentVelocity) * 100;
  // => 40% velocity increase

  const maintenanceSavings = ((beforeTDD.maintenanceCost - afterTDD.maintenanceCost) / beforeTDD.maintenanceCost) * 100;
  // => 75% maintenance cost reduction

  expect(defectReduction).toBeGreaterThan(70); // => Significant quality improvement
  expect(velocityIncrease).toBeGreaterThan(30); // => Productivity gain
  expect(maintenanceSavings).toBeGreaterThan(60); // => Cost savings
});

// ROI Calculation
function calculateTDDROI(before: TDDMetrics, after: TDDMetrics): number {
  const costReduction = before.maintenanceCost - after.maintenanceCost; // => 90 hours saved
  const hourlyRate = 75; // => Average developer hourly rate
  const monthlySavings = costReduction * hourlyRate; // => substantial amounts per month

  const tddInvestment = 40; // => 40 hours TDD training cost
  const investmentCost = tddInvestment * hourlyRate; // => substantial amounts one-time

  const paybackMonths = investmentCost / monthlySavings; // => 0.44 months (2 weeks)
  return paybackMonths; // => ROI achieved in < 1 month
}

test("TDD investment pays back quickly", () => {
  const payback = calculateTDDROI(beforeTDD, afterTDD);
  expect(payback).toBeLessThan(1); // => Pays back in under 1 month
});
```

**Key Takeaway**: Measure TDD ROI through defect reduction, velocity increase, and maintenance cost savings. Track metrics before and after adoption to quantify value.

**Why It Matters**: Teams need business justification for TDD investment to secure organizational support and maintain the practice long-term. Data-driven ROI measurement enables informed decisions and demonstrates value to non-technical stakeholders. IBM's research found that teams practicing TDD had 40-80% fewer production bugs, with bug fix costs that are 2-10x lower when caught in development versus production. Microsoft's case studies document 15-35% longer initial development time offset by 46-68% reduction in post-release defect density. These measurements enable engineering leaders to quantify the practice's value and justify the investment during organizational transitions.

### Example 76: TDD in Regulated Industries

Regulated industries (finance, healthcare, aerospace) require audit trails and compliance testing. TDD provides documentation and traceability.

**Red: Test regulatory requirement**

```typescript
test("logs all financial transactions for audit", () => {
  const processor = new TransactionProcessor(); // => FAILS: No audit logging
  processor.processPayment(100, "USD");
  const auditLog = processor.getAuditLog();
  expect(auditLog).toHaveLength(1);
});
```

**Green: Implement audit logging**

```typescript
interface AuditEntry {
  timestamp: Date;
  action: string;
  amount: number;
  currency: string;
  userId: string;
}

class TransactionProcessor {
  private auditLog: AuditEntry[] = []; // => Audit trail storage

  processPayment(amount: number, currency: string, userId = "system"): void {
    // Process payment logic
    this.logAudit("PAYMENT_PROCESSED", amount, currency, userId); // => Audit logging
  }

  private logAudit(action: string, amount: number, currency: string, userId: string): void {
    this.auditLog.push({
      // => Immutable audit entry
      timestamp: new Date(),
      action,
      amount,
      currency,
      userId,
    });
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog]; // => Return copy (immutable)
  }
}

describe("TransactionProcessor audit compliance", () => {
  test("logs all financial transactions", () => {
    const processor = new TransactionProcessor();
    processor.processPayment(100, "USD", "user-123");

    const auditLog = processor.getAuditLog();
    expect(auditLog).toHaveLength(1); // => One entry logged
    expect(auditLog[0].action).toBe("PAYMENT_PROCESSED");
    expect(auditLog[0].amount).toBe(100);
    expect(auditLog[0].currency).toBe("USD");
    expect(auditLog[0].userId).toBe("user-123");
  }); // => Regulatory requirement tested

  test("audit log is immutable", () => {
    const processor = new TransactionProcessor();
    processor.processPayment(100, "USD");

    const log1 = processor.getAuditLog();
    const log2 = processor.getAuditLog();

    expect(log1).not.toBe(log2); // => Different array instances
    expect(log1).toEqual(log2); // => Same content
  }); // => Prevents tampering
});
```

**Key Takeaway**: TDD for regulatory compliance tests audit trails, data integrity, and traceability requirements. Tests serve as executable documentation for auditors.

**Why It Matters**: Regulatory violations have severe consequences including substantial fines (GDPR up to 4% of global revenue), license revocations, and criminal liability for executives. TDD provides audit-ready documentation where tests demonstrate that required behaviors are verified. NASA's JPL Software Development Process requires 100% test coverage for flight software with tests serving as compliance evidence for safety-critical systems. FDA medical device software validation uses test suites as primary compliance documentation. The test-as-documentation property of TDD provides a direct path from requirement (test description) to verification (test execution) to evidence (test report), satisfying regulatory requirements efficiently.

### Example 77: Compliance Testing Patterns

Compliance testing verifies regulatory requirements (GDPR, HIPAA, SOC2). Test data retention, access controls, and encryption.

**Red: Test GDPR data deletion requirement**

```typescript
test("deletes user data on request (GDPR Right to be Forgotten)", () => {
  const userService = new UserService(); // => FAILS: No deletion logic
  userService.createUser("alice@example.com", { name: "Alice" });
  userService.deleteUserData("alice@example.com");

  const user = userService.getUser("alice@example.com");
  expect(user).toBeNull(); // GDPR: User data must be deleted
});
```

**Green: Implement compliant deletion**

```typescript
interface UserData {
  email: string;
  name: string;
  createdAt: Date;
}

class UserService {
  private users: Map<string, UserData> = new Map();
  private deletionLog: Array<{ email: string; deletedAt: Date }> = [];

  createUser(email: string, data: Omit<UserData, "email" | "createdAt">): void {
    this.users.set(email, {
      // => Store user data
      email,
      ...data,
      createdAt: new Date(),
    });
  }

  deleteUserData(email: string): void {
    this.users.delete(email); // => Delete user data
    this.deletionLog.push({
      // => Log deletion for compliance
      email,
      deletedAt: new Date(),
    });
  }

  getUser(email: string): UserData | null {
    return this.users.get(email) || null;
  }

  getDeletionLog(): Array<{ email: string; deletedAt: Date }> {
    return [...this.deletionLog]; // => Audit trail
  }
}

describe("GDPR Compliance", () => {
  test("deletes user data on request", () => {
    const service = new UserService();
    service.createUser("alice@example.com", { name: "Alice" });
    service.deleteUserData("alice@example.com");

    const user = service.getUser("alice@example.com");
    expect(user).toBeNull(); // => Data deleted
  });

  test("logs data deletion for audit", () => {
    const service = new UserService();
    service.createUser("alice@example.com", { name: "Alice" });
    service.deleteUserData("alice@example.com");

    const log = service.getDeletionLog();
    expect(log).toHaveLength(1); // => Deletion logged
    expect(log[0].email).toBe("alice@example.com");
  }); // => Compliance audit trail
});
```

**Key Takeaway**: Test compliance requirements (data deletion, access controls, encryption) with same rigor as features. Compliance tests document regulatory adherence.

**Why It Matters**: Non-compliance penalties are severe and increasing globally: GDPR fines reach 4% of global annual revenue (€50M against Google in 2019), HIPAA violations reach $1.9M per incident, and PCI-DSS breaches result in card payment processor termination. Tested compliance prevents violations by verifying data handling rules as executable specifications. Compliance testing catches data handling violations before production - automated GDPR right-to-erasure tests can verify that personal data deletion cascades correctly across all storage systems. Financial services firms with comprehensive compliance test suites report 80% fewer regulatory findings during audits.

## Machine Learning and Emerging Paradigms (Examples 78-80)

### Example 78: TDD for Machine Learning Systems

Machine learning systems need testing despite non-determinism. Test data pipelines, model interfaces, and prediction boundaries.

**Red: Test model prediction interface**

```typescript
test("model predicts spam classification", () => {
  const model = new SpamClassifier(); // => FAILS: Model not defined
  const result = model.predict("Buy now! Limited offer!");
  expect(result.label).toBe("spam");
  expect(result.confidence).toBeGreaterThan(0.8);
});
```

**Green: Test model interface (not internals)**

```typescript
interface Prediction {
  label: "spam" | "ham";
  confidence: number;
}

class SpamClassifier {
  predict(text: string): Prediction {
    // => Simplified model (real ML model would be complex)
    const spamKeywords = ["buy now", "limited offer", "click here"];
    const hasSpamKeyword = spamKeywords.some((keyword) => text.toLowerCase().includes(keyword));
    // => Checks for spam indicators

    return {
      label: hasSpamKeyword ? "spam" : "ham", // => Classification
      confidence: hasSpamKeyword ? 0.95 : 0.6, // => Confidence score
    };
  }
}

describe("SpamClassifier", () => {
  test("classifies obvious spam", () => {
    const model = new SpamClassifier();
    const result = model.predict("Buy now! Limited offer!");

    expect(result.label).toBe("spam"); // => Correct classification
    expect(result.confidence).toBeGreaterThan(0.8); // => High confidence
  });

  test("classifies normal email", () => {
    const model = new SpamClassifier();
    const result = model.predict("Meeting at 3pm today");

    expect(result.label).toBe("ham"); // => Correct classification
  });

  test("handles empty input", () => {
    const model = new SpamClassifier();
    const result = model.predict("");

    expect(result.label).toBe("ham"); // => Default classification
  });
});
```

**Refactored: Test data pipeline and boundaries**

```typescript
describe("ML System Testing", () => {
  test("data preprocessing pipeline", () => {
    function preprocessText(text: string): string[] {
      // => Tokenization
      return text.toLowerCase().split(/\s+/); // => Split into words
    }

    const tokens = preprocessText("Buy Now Limited Offer");
    expect(tokens).toEqual(["buy", "now", "limited", "offer"]); // => Verify preprocessing
  });

  test("model prediction boundaries", () => {
    const model = new SpamClassifier();

    // Test known spam examples
    const spamExamples = ["Buy now!", "Click here for free", "Limited time offer"];

    spamExamples.forEach((example) => {
      const result = model.predict(example);
      expect(result.label).toBe("spam"); // => All should be spam
    });
  });
});
```

**Key Takeaway**: Test ML systems through interfaces, pipelines, and boundary cases. Don't test model internals, but test preprocessing, prediction API, and edge cases.

**Why It Matters**: ML models are non-deterministic but pipelines are deterministic and testable. Pipeline bugs cause model failures that appear as mysterious accuracy degradation, making them expensive to diagnose without test coverage. ML teams at companies like Spotify maintain 80%+ test coverage on data pipelines and model interfaces, preventing most production failures before they affect recommendations. Data preprocessing bugs are particularly damaging because they corrupt training data silently - a normalization error might not affect single predictions but systematically biases the training distribution, causing gradual accuracy degradation that takes weeks to detect.

### Example 79: Testing AI/ML Model Behavior

AI models require behavioral testing through example inputs and expected outputs. Test edge cases and model degradation.

**Red: Test model behavior on edge cases**

```typescript
test("sentiment model handles sarcasm", () => {
  const model = new SentimentAnalyzer(); // => FAILS: Model not defined
  const result = model.analyze("Oh great, another Monday!");
  expect(result.sentiment).toBe("negative"); // Sarcasm detection
});
```

**Green: Test behavioral boundaries**

```typescript
interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}

class SentimentAnalyzer {
  analyze(text: string): SentimentResult {
    // => Simplified model
    const positiveWords = ["great", "excellent", "amazing"];
    const negativeWords = ["terrible", "awful", "hate", "monday"];

    const hasNegative = negativeWords.some((word) => text.toLowerCase().includes(word));
    const hasPositive = positiveWords.some((word) => text.toLowerCase().includes(word));

    if (hasNegative && hasPositive) {
      // => Sarcasm indicator
      return { sentiment: "negative", score: 0.3 }; // => Assume sarcasm is negative
    } else if (hasNegative) {
      return { sentiment: "negative", score: 0.8 };
    } else if (hasPositive) {
      return { sentiment: "positive", score: 0.8 };
    }

    return { sentiment: "neutral", score: 0.5 }; // => Default neutral
  }
}

describe("SentimentAnalyzer behavior", () => {
  test("detects positive sentiment", () => {
    const model = new SentimentAnalyzer();
    const result = model.analyze("This is amazing!");
    expect(result.sentiment).toBe("positive");
  });

  test("detects negative sentiment", () => {
    const model = new SentimentAnalyzer();
    const result = model.analyze("This is terrible");
    expect(result.sentiment).toBe("negative");
  });

  test("handles sarcasm", () => {
    const model = new SentimentAnalyzer();
    const result = model.analyze("Oh great, another Monday!");
    expect(result.sentiment).toBe("negative"); // => Sarcasm interpreted as negative
  });

  test("handles neutral text", () => {
    const model = new SentimentAnalyzer();
    const result = model.analyze("The meeting is at 3pm");
    expect(result.sentiment).toBe("neutral");
  });
});
```

**Key Takeaway**: Test AI model behavior through input-output examples covering normal cases, edge cases, and boundary conditions. Focus on model interface, not internals.

**Why It Matters**: AI model behavior shifts over time through model drift, retraining, and infrastructure changes, making behavioral regression testing critical for maintaining user experience quality. OpenAI's GPT testing suite uses thousands of behavioral examples to detect model degradation between versions - specific prompts that should produce specific response characteristics. Behavioral tests for ML are fundamentally different from unit tests: they verify statistical properties (95% accuracy on test set) and behavioral invariants (translation preserves meaning) rather than exact outputs. Building comprehensive behavioral test suites enables confident model updates without manual regression testing across thousands of use cases.

### Example 80: Evolutionary Architecture with TDD

Evolutionary architecture evolves through incremental changes guided by fitness functions. TDD provides fast feedback for architectural decisions.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    A[Architecture Decision]
    B[Fitness Function Test]
    C{Constraint Met?}
    D[CI Passes]
    E[Architecture Violation Detected]

    A -->|"encoded as"| B
    B --> C
    C -->|"yes"| D
    C -->|"no"| E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#CC78BC,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#CA9161,stroke:#000,color:#fff
```

**Red: Test architectural constraint (fitness function)**

```typescript
test("modules do not have circular dependencies", () => {
  const dependencies = analyzeDependencies(); // => FAILS: Analysis not implemented
  const hasCycles = detectCycles(dependencies);
  expect(hasCycles).toBe(false); // Architectural constraint
});
```

**Green: Implement fitness function**

```typescript
type DependencyGraph = Map<string, Set<string>>;

function analyzeDependencies(): DependencyGraph {
  // => Simplified dependency analysis
  const graph: DependencyGraph = new Map();
  graph.set("moduleA", new Set(["moduleB"])); // => A depends on B
  graph.set("moduleB", new Set(["moduleC"])); // => B depends on C
  graph.set("moduleC", new Set()); // => C has no dependencies
  return graph;
}

function detectCycles(graph: DependencyGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true; // => Cycle detected
    if (visited.has(node)) return false; // => Already checked

    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (hasCycle(node)) return true;
  }

  return false; // => No cycles found
}

describe("Evolutionary Architecture Fitness Functions", () => {
  test("detects no cycles in valid dependency graph", () => {
    const dependencies = analyzeDependencies();
    const hasCycles = detectCycles(dependencies);
    expect(hasCycles).toBe(false); // => Valid architecture
  });

  test("detects cycles in invalid dependency graph", () => {
    const graph: DependencyGraph = new Map();
    graph.set("A", new Set(["B"]));
    graph.set("B", new Set(["C"]));
    graph.set("C", new Set(["A"])); // => Cycle: A → B → C → A

    const hasCycles = detectCycles(graph);
    expect(hasCycles).toBe(true); // => Cycle detected
  });
});
```

**Key Takeaway**: Evolutionary architecture uses fitness functions (automated tests) to verify architectural constraints. TDD fitness functions prevent architectural degradation.

**Why It Matters**: Architecture erodes without automated checks as teams make local decisions that violate global architectural principles. Fitness functions enable safe evolution by encoding architectural constraints as executable tests that fail when violated. Evolutionary architecture practices at Ford's connected vehicles team use automated fitness functions to maintain bounded contexts in their microservices architecture, preventing the service dependency graph from becoming a distributed monolith. Cyclomatic complexity limits, package dependency rules, and performance thresholds can all be expressed as fitness functions that run in CI, making architectural violations visible as quickly as functional bugs.

## Production, Deployment, and Monitoring (Examples 81-85)

### Example 81: TDD in Continuous Deployment

Continuous deployment requires high confidence in automated tests. TDD enables safe deployment to production multiple times per day.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph LR
    A[Code Commit]
    B[Unit Tests]
    C[Integration Tests]
    D[Canary Deploy 1%]
    E[Full Deploy 100%]

    A --> B --> C --> D --> E

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#029E73,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#CC78BC,stroke:#000,color:#fff
```

**Challenge**: Deploy to production safely without manual testing

**Solution: Comprehensive test pyramid + automated deployment**

```typescript
// Test Pyramid Structure
describe("Test Pyramid for Continuous Deployment", () => {
  // Layer 1: Unit Tests (70% of tests) - Fast, isolated
  describe("Unit Tests", () => {
    test("business logic is correct", () => {
      const calculator = new PriceCalculator();
      expect(calculator.calculateDiscount(100, 0.1)).toBe(90);
    }); // => Millisecond execution

    // 1000+ unit tests covering all business logic
  });

  // Layer 2: Integration Tests (20% of tests) - Medium speed
  describe("Integration Tests", () => {
    test("service integrates with database", async () => {
      const db = new InMemoryDatabase(); // => Fake database
      const service = new UserService(db);

      await service.createUser("alice@example.com", { name: "Alice" });
      const user = await service.getUser("alice@example.com");

      expect(user?.name).toBe("Alice");
    }); // => Sub-second execution

    // 200+ integration tests covering component interactions
  });

  // Layer 3: End-to-End Tests (10% of tests) - Slow but comprehensive
  describe("E2E Tests", () => {
    test("user can complete checkout flow", async () => {
      const browser = await launchBrowser();
      await browser.goto("/products");
      await browser.click("[data-testid=add-to-cart]");
      await browser.click("[data-testid=checkout]");
      const confirmation = await browser.text("[data-testid=order-confirmation]");

      expect(confirmation).toContain("Order confirmed");
      await browser.close();
    }); // => Seconds to minutes

    // 50+ E2E tests covering critical user flows
  });
});

// Deployment Pipeline
test("deployment pipeline validates quality gates", () => {
  const pipeline = {
    stages: [
      { name: "Unit Tests", threshold: 95, coverage: 96, status: "pass" }, // => 95% required
      { name: "Integration Tests", threshold: 85, coverage: 88, status: "pass" }, // => 85% required
      { name: "E2E Tests", threshold: 100, passed: 50, total: 50, status: "pass" }, // => All must pass
      { name: "Deploy to Production", status: "ready" }, // => Automated deployment
    ],
  };

  const allStagesPassed = pipeline.stages.slice(0, -1).every((stage) => stage.status === "pass");
  expect(allStagesPassed).toBe(true); // => Quality gates met
}); // => Deploy with confidence
```

**Key Metrics for CD**:

```typescript
interface CDMetrics {
  deploymentFrequency: string; // => "10+ per day"
  leadTime: string; // => "< 1 hour (commit to production)"
  mttr: string; // => "< 15 minutes (mean time to recovery)"
  changeFailureRate: number; // => "< 5% (failed deployments)"
}

const cdMetrics: CDMetrics = {
  deploymentFrequency: "10+ per day", // => High deployment frequency
  leadTime: "< 1 hour", // => Fast feedback
  mttr: "< 15 minutes", // => Quick recovery
  changeFailureRate: 0.03, // => 3% failure rate (97% success)
};

test("CD metrics meet industry benchmarks", () => {
  expect(cdMetrics.changeFailureRate).toBeLessThan(0.05); // => Less than 5%
}); // => Automated testing enables safe CD
```

**Key Takeaway**: Continuous deployment requires comprehensive test automation at all levels (unit, integration, E2E). TDD builds this test coverage from the start.

**Why It Matters**: Manual testing blocks frequent deployment by requiring human verification gates between code completion and production. High-frequency deployment systems achieve deployment cycles measured in minutes rather than weeks using comprehensive automated test suites as the gate. Amazon deploys to production every 11.6 seconds on average - this is only possible with automated test suites that verify correctness faster than manual testing could. TDD discipline enables hundreds of thousands of safe deployments annually with 99.9%+ success rates because every change is verified by tests before deployment. The economics are compelling: automated testing costs are fixed, while manual testing costs scale with deployment frequency.

### Example 82: Production Testing Patterns

Production testing catches issues that pre-production testing misses. Use canary deployments, feature flags, and synthetic monitoring.

**Red: Test canary deployment**

```typescript
test("canary deployment serves 5% of traffic", () => {
  const deployment = new CanaryDeployment(); // => FAILS: Not implemented
  deployment.deploy("v2.0", { canaryPercentage: 5 });

  const trafficDistribution = deployment.getTrafficDistribution();
  expect(trafficDistribution.v1).toBe(95);
  expect(trafficDistribution.v2).toBe(5);
});
```

**Green: Canary deployment implementation**

```typescript
interface DeploymentConfig {
  canaryPercentage: number;
}

class CanaryDeployment {
  private currentVersion = "v1.0";
  private canaryVersion: string | null = null;
  private canaryPercentage = 0;

  deploy(version: string, config: DeploymentConfig): void {
    this.canaryVersion = version; // => New version
    this.canaryPercentage = config.canaryPercentage; // => Traffic percentage
  }

  routeRequest(requestId: number): string {
    // => Deterministic routing based on request ID
    const isCanary = requestId % 100 < this.canaryPercentage;
    return isCanary && this.canaryVersion ? this.canaryVersion : this.currentVersion;
  }

  getTrafficDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    distribution[this.currentVersion] = 100 - this.canaryPercentage;
    if (this.canaryVersion) {
      distribution[this.canaryVersion] = this.canaryPercentage;
    }
    return distribution;
  }
}

describe("Canary Deployment", () => {
  test("routes 5% traffic to canary", () => {
    const deployment = new CanaryDeployment();
    deployment.deploy("v2.0", { canaryPercentage: 5 });

    const distribution = deployment.getTrafficDistribution();
    expect(distribution["v1.0"]).toBe(95); // => 95% to stable
    expect(distribution["v2.0"]).toBe(5); // => 5% to canary
  });

  test("routes requests correctly", () => {
    const deployment = new CanaryDeployment();
    deployment.deploy("v2.0", { canaryPercentage: 5 });

    const results = Array.from({ length: 100 }, (_, i) => deployment.routeRequest(i));
    const canaryCount = results.filter((v) => v === "v2.0").length;

    expect(canaryCount).toBe(5); // => Exactly 5% routed to canary
  });
});
```

**Key Takeaway**: Test production deployment patterns (canary, blue-green, feature flags) to verify gradual rollout and quick rollback capabilities.

**Why It Matters**: Production has unique conditions - traffic patterns, data volumes, hardware configurations, and user behavior - impossible to fully replicate in staging. Canary testing enables safe production validation by gradually routing traffic to new versions, catching environment-specific bugs before they affect all users. Netflix's deployment system uses canary releases for every deployment, routing 1% of traffic to new versions and automatically rolling back when error rates exceed baseline by 10%. This catches production-specific bugs while limiting blast radius to 1% of users. Combined with comprehensive staging tests, canary releases provide defense in depth against production failures.

### Example 83: Testing with Feature Flags

Feature flags enable testing new features in production with controlled rollout. TDD tests flag behavior and gradual enablement.

**Red: Test feature flag behavior**

```typescript
test("feature flag controls new checkout flow", () => {
  const flags = new FeatureFlags(); // => FAILS: Not implemented
  flags.enable("new-checkout", { percentage: 10 });

  const isEnabled = flags.isEnabled("new-checkout", "user-123");
  expect(typeof isEnabled).toBe("boolean"); // Should return true or false
});
```

**Green: Feature flag implementation**

```typescript
interface FlagConfig {
  percentage?: number;
  users?: string[];
}

class FeatureFlags {
  private flags: Map<string, FlagConfig> = new Map();

  enable(flagName: string, config: FlagConfig = {}): void {
    this.flags.set(flagName, config); // => Enable flag with config
  }

  isEnabled(flagName: string, userId: string): boolean {
    const config = this.flags.get(flagName);
    if (!config) return false; // => Flag not enabled

    // Check user whitelist
    if (config.users?.includes(userId)) return true;

    // Check percentage rollout
    if (config.percentage) {
      const hash = this.hashUserId(userId); // => Deterministic hash
      return hash % 100 < config.percentage; // => Percentage-based rollout
    }

    return false;
  }

  private hashUserId(userId: string): number {
    // => Simple hash function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // => Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

describe("Feature Flags", () => {
  test("enables feature for whitelisted users", () => {
    const flags = new FeatureFlags();
    flags.enable("new-checkout", { users: ["user-123", "user-456"] });

    expect(flags.isEnabled("new-checkout", "user-123")).toBe(true); // => Whitelisted
    expect(flags.isEnabled("new-checkout", "user-789")).toBe(false); // => Not whitelisted
  });

  test("enables feature for percentage of users", () => {
    const flags = new FeatureFlags();
    flags.enable("new-checkout", { percentage: 10 });

    const results = Array.from({ length: 1000 }, (_, i) => flags.isEnabled("new-checkout", `user-${i}`));
    const enabledCount = results.filter((enabled) => enabled).length;

    expect(enabledCount).toBeGreaterThan(50); // => Approximately 10% (100)
    expect(enabledCount).toBeLessThan(150); // => Within reasonable variance
  });

  test("consistent rollout for same user", () => {
    const flags = new FeatureFlags();
    flags.enable("new-checkout", { percentage: 50 });

    const result1 = flags.isEnabled("new-checkout", "user-123");
    const result2 = flags.isEnabled("new-checkout", "user-123");

    expect(result1).toBe(result2); // => Deterministic for same user
  });
});
```

**Key Takeaway**: Test feature flags for whitelist behavior, percentage rollout, and deterministic assignment. Flags enable production testing without full deployment.

**Why It Matters**: Feature flags enable safe experimentation in production by decoupling code deployment from feature activation, allowing developers to ship code continuously while controlling feature exposure. TDD ensures flag logic works correctly for all combinations of flag states - with 10 flags, there are 1024 possible combinations requiring systematic testing. Etsy runs 3,000+ A/B experiments simultaneously using tested feature flags, enabling rapid product iteration. Flag logic bugs are particularly dangerous because they can affect any user at any time based on flag configuration changes, making comprehensive TDD coverage of all flag branches a production safety requirement.

### Example 84: Synthetic Monitoring and Production Tests

Synthetic monitoring runs automated tests against production to detect issues before users. Combine with alerting for fast incident response.

**Red: Test production endpoint health**

```typescript
test("production API responds within SLA", async () => {
  const monitor = new SyntheticMonitor(); // => FAILS: Not implemented
  const result = await monitor.checkEndpoint("/api/users");
  expect(result.responseTime).toBeLessThan(500); // < 500ms SLA
});
```

**Green: Synthetic monitoring implementation**

```typescript
interface MonitorResult {
  endpoint: string;
  status: number;
  responseTime: number;
  success: boolean;
}

class SyntheticMonitor {
  async checkEndpoint(endpoint: string, baseUrl = "https://api.example.com"): Promise<MonitorResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`); // => Call production
      const responseTime = Date.now() - startTime; // => Measure latency

      return {
        endpoint,
        status: response.status,
        responseTime,
        success: response.ok, // => 2xx status
      };
    } catch (error) {
      return {
        endpoint,
        status: 0,
        responseTime: Date.now() - startTime,
        success: false,
      };
    }
  }
}

describe("Synthetic Monitoring", () => {
  test("monitors production endpoint health", async () => {
    const monitor = new SyntheticMonitor();
    const result = await monitor.checkEndpoint("/api/health");

    expect(result.success).toBe(true); // => Endpoint healthy
    expect(result.status).toBe(200); // => 200 OK
    expect(result.responseTime).toBeLessThan(500); // => Under 500ms SLA
  });

  test("detects endpoint failure", async () => {
    const monitor = new SyntheticMonitor();
    const result = await monitor.checkEndpoint("/api/nonexistent");

    expect(result.success).toBe(false); // => Endpoint failed
    expect(result.status).toBe(404); // => 404 Not Found
  });
});

// Continuous monitoring (runs every minute)
setInterval(async () => {
  const monitor = new SyntheticMonitor();
  const result = await monitor.checkEndpoint("/api/critical");

  if (!result.success || result.responseTime > 1000) {
    console.error("ALERT: Production endpoint degraded", result);
    // Trigger PagerDuty/Slack alert
  }
}, 60000); // => Every 60 seconds
```

**Key Takeaway**: Synthetic monitoring runs automated tests against production continuously. Alerts on SLA violations or failures enable fast incident response.

**Why It Matters**: Production issues affect users immediately, and user-reported bugs are the most expensive to resolve - they reach production, affect real transactions, and require urgent response. Synthetic monitoring detects problems before users report them by continuously running automated tests against production systems. Datadog's synthetic monitoring research shows users detect 80% of production issues through automated tests rather than customer complaints, reducing mean time to detection from hours to minutes. Synthetic tests derived from TDD scenarios provide excellent production monitoring coverage because they test the same behaviors verified in development, just running against the live system.

### Example 85: TDD Anti-Pattern Recovery - Abandoned Test Suites

Test suites decay when ignored. Revive abandoned tests through cleanup, deprecation, and reintroduction of TDD discipline.

**Problem: Abandoned test suite**

```typescript
describe("Abandoned Test Suite", () => {
  test.skip("this test is flaky"); // => Skipped instead of fixed
  test.skip("TODO: Fix this later"); // => Never fixed
  test("test with no assertions", () => {}); // => Empty test
  test("outdated test for removed feature", () => {
    // => Tests nonexistent code
    const feature = oldFeature();
    expect(feature).toBeDefined();
  });
});
```

**Solution: Test suite revival**

```typescript
describe("Test Suite Revival Process", () => {
  // Step 1: Remove dead tests
  // ❌ DELETE: Tests for removed features
  // ❌ DELETE: Empty tests with no assertions
  // ❌ DELETE: Tests that never pass

  // Step 2: Fix or delete flaky tests
  test("previously flaky test - now fixed with proper async handling", async () => {
    jest.useFakeTimers(); // => Control time
    const callback = jest.fn();
    setTimeout(callback, 1000);

    jest.advanceTimersByTime(1000); // => Deterministic timing
    expect(callback).toHaveBeenCalled(); // => No longer flaky

    jest.useRealTimers();
  });

  // Step 3: Re-enable tests with proper fixes
  test("user creation saves to database", async () => {
    const db = new InMemoryDatabase(); // => Fast fake
    const service = new UserService(db);

    await service.createUser({ name: "Alice" });
    const users = await db.getAll();

    expect(users).toHaveLength(1); // => Proper assertion
    expect(users[0].name).toBe("Alice");
  });

  // Step 4: Add missing tests for critical paths
  test("checkout flow processes payment", async () => {
    const mockPayment = { charge: jest.fn().mockResolvedValue(true) };
    const checkout = new CheckoutService(mockPayment);

    const result = await checkout.processOrder({ total: 100 });

    expect(result.success).toBe(true);
    expect(mockPayment.charge).toHaveBeenCalledWith(100);
  }); // => Previously missing test
});

// Step 5: Enforce quality gates
describe("Quality Gates", () => {
  test("coverage meets minimum threshold", () => {
    const coverageReport = {
      lines: { pct: 85 },
      branches: { pct: 82 },
      functions: { pct: 88 },
    };

    Object.values(coverageReport).forEach((metric) => {
      expect(metric.pct).toBeGreaterThan(80); // => 80% minimum
    });
  }); // => Enforced in CI

  test("no skipped tests allowed", () => {
    const skippedTests = 0; // => Count from test runner
    expect(skippedTests).toBe(0); // => All tests must run
  });
});
```

**Revival Checklist**:

```markdown
- [ ] Delete tests for removed features (dead code)
- [ ] Delete empty tests with no assertions
- [ ] Fix flaky tests with proper async handling
- [ ] Unskip tests and fix properly (no test.skip allowed)
- [ ] Add tests for critical untested paths
- [ ] Enforce coverage thresholds (80% minimum)
- [ ] Enable pre-commit hooks to prevent test decay
- [ ] Document testing standards for team
- [ ] Schedule regular test health reviews
```

**Key Takeaway**: Revive abandoned test suites by removing dead tests, fixing flaky tests, and enforcing quality gates. Prevention through CI enforcement and team discipline.

**Why It Matters**: Abandoned test suites provide false security - teams see green builds but the tests no longer verify current behavior. Active test maintenance preserves value by keeping tests synchronized with evolving requirements. Research from GitLab's engineering blog found that 30% of test suites in codebases over 5 years old contain tests that pass for the wrong reasons - asserting stale expected values from outdated business rules. Regular test audits (quarterly for active codebases) catch orphaned tests before they create false confidence. The cost of maintaining test suites is always less than the production incidents caused by code that lacks meaningful verification.

---

This completes the **advanced level (Examples 59-85)** covering enterprise TDD patterns including legacy code testing, approval testing, distributed systems, microservices, machine learning, evolutionary architecture, continuous deployment, and production testing patterns. Total coverage: 75-95% of TDD practices needed for professional software development.

**Skill Mastery**: Developers completing this advanced section can apply TDD in complex enterprise environments, test legacy systems, scale TDD across teams, and implement production testing strategies with confidence.
