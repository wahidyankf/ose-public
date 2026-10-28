---
title: Testing Standards
description: OSE Platform standards for hexagonal-specific testing — port contract tests, in-memory adapter swap, integration boundaries, and Nx target mapping
category: explanation
subcategory: architecture
tags:
  - hexagonal-architecture
  - ports-and-adapters
  - testing
  - standards
  - organiclever
principles:
  - explicit-over-implicit
  - simplicity-over-complexity
  - automation-over-manual
  - reproducibility
created: 2026-05-17
---

# Testing Standards

## Prerequisite Knowledge

**REQUIRED**: Complete [Port Standards](./port-standards.md), [Adapter Standards](./adapter-standards.md), and [Composition Root Standards](./composition-root-standards.md) before using these standards. Hexagonal testing strategy flows directly from those conventions.

## Purpose

OSE Platform standards for testing hexagonal architecture implementations. The hexagonal structure
supports Unit proof for pure/application behaviour, Integration proof for real isolated local
resources without external network reach, and E2E proof through a public boundary. Each tier maps to a
specific Nx target.

## Standard 1: Nx Target to Test Tier Mapping

**REQUIRED**: Every test MUST run in the correct Nx target. Placing a test in the wrong target is a code review finding.

| Test tier              | Nx target          | Real boundary                         | Cacheable | Adapters used                  |
| ---------------------- | ------------------ | ------------------------------------- | --------- | ------------------------------ |
| Domain Unit tests      | `test:unit`        | None                                  | Yes       | Injected in-process fakes      |
| Application Unit tests | `test:unit`        | None                                  | Yes       | Injected in-process fakes      |
| Port contract Unit     | `test:unit`        | None                                  | Yes       | Injected in-process fakes      |
| Adapter Integration    | `test:integration` | Isolated local resource; no external  | No        | Real owned local adapters      |
| End-to-end             | `test:e2e`         | Public browser, HTTP, or process path | No        | Full production boundary stack |

**See**: [Nx Target Standards](../../../../../repo-governance/development/infra/nx-targets.md) for caching rules and the three-level testing standard.

## Standard 2: Domain Unit Tests

**REQUIRED**: All domain logic (aggregates, value objects, domain services) MUST have unit tests that exercise pure functions with no adapter involvement.

Domain tests prove that business invariants hold regardless of infrastructure. They run without Spring context, without containers, and without any port implementation.

### `Java`

```java
// Domain unit test — no Spring context, no adapters
class PurchaseOrderTest {

  @Test
  void submit_transitions_to_awaiting_approval() {
    var order = PurchaseOrder.draft(
        PurchaseOrderId.generate(),
        SupplierId.of("SUP-001"),
        List.of(LineItem.of("Laptop", Money.of(new BigDecimal("5000"), "IDR"), 2))
    );

    var submitted = order.submit();

    assertThat(submitted.status()).isEqualTo(PurchaseOrderStatus.AWAITING_APPROVAL);
  }
}
```

### `F#`

```fsharp
// Domain unit test — pure function, no adapters
[<Fact>]
let ``submit transitions draft order to awaiting approval`` () =
  let order = PurchaseOrder.draft supplierId lineItems
  let submitted = PurchaseOrder.submit order
  Assert.Equal(AwaitingApproval, submitted.Status)
```

## Standard 3: Port Contract Tests

**REQUIRED**: Every output port MUST have a port contract test suite that verifies adapter
correctness against the port's behavioural contract. The contract MUST pass against an injected
in-memory adapter in `test:unit` and each applicable real non-network local-resource adapter in
`test:integration`. A networked production adapter is proved only as part of `test:e2e` through the
application's public boundary.

This is the key hexagonal testing pattern: define the expected behaviour once as an abstract
contract, then run it against each adapter at the layer matching its strongest real boundary. An
in-memory adapter is Unit, a filesystem adapter is Integration, and a PostgreSQL adapter reached
over TCP is exercised only as part of E2E proof through the application's public boundary.

### Java — Contract Test Pattern

**REQUIRED**: Use an abstract base class parameterised over the port. Concrete subclasses supply the adapter under test.

#### `Java`

```java
// Abstract contract — defines expected behaviour for any PurchaseOrderRepositoryPort
abstract class PurchaseOrderRepositoryPortContract {

  abstract PurchaseOrderRepositoryPort adapter();

  @Test
  void save_and_find_round_trip() {
    var order = PurchaseOrder.draft(PurchaseOrderId.generate(), supplierId, lineItems);
    adapter().save(order);
    var found = adapter().findById(order.id());
    assertThat(found).contains(order);
  }

  @Test
  void find_returns_empty_for_unknown_id() {
    var result = adapter().findById(PurchaseOrderId.generate());
    assertThat(result).isEmpty();
  }
}

// In-memory implementation — runs in test:unit (no containers)
class InMemoryPurchaseOrderRepositoryAdapterTest
    extends PurchaseOrderRepositoryPortContract {

  @Override
  PurchaseOrderRepositoryPort adapter() {
    return new InMemoryPurchaseOrderRepositoryAdapter();
  }
}

// Real filesystem implementation — runs in test:integration (no external network)
class FilePurchaseOrderRepositoryAdapterTest
    extends PurchaseOrderRepositoryPortContract {

  private final PurchaseOrderRepositoryPort fileRepository =
      FilePurchaseOrderRepositoryAdapter.inTemporaryDirectory();

  @Override
  PurchaseOrderRepositoryPort adapter() {
    return fileRepository;
  }
}
```

### F# — Contract Test Pattern

**REQUIRED**: Use a shared test function that accepts the port as a parameter. Call it from both the in-memory and the real adapter test modules.

#### `F#`

```fsharp
// Shared contract function
module PurchaseOrderRepositoryPortContract

open OrganicLeverBe.Purchasing.Application.Ports
open OrganicLeverBe.Purchasing.Domain

let run (adapter: PurchaseOrderRepositoryPort) =
  task {
    // Test: save and find round trip
    let order = PurchaseOrder.draft supplierId lineItems
    do! adapter.save order |> Async.AwaitTask |> Async.Ignore
    let! found = adapter.findById order.Id |> Async.AwaitTask
    Assert.Equal(Some order, found |> Result.toOption |> Option.flatten)
  }

// In-memory run — test:unit
[<Fact>]
let ``InMemory satisfies repository port contract`` () =
  let adapter = InMemoryPurchaseOrderRepository.makePort ()
  PurchaseOrderRepositoryPortContract.run adapter

// Real filesystem run — test:integration, isolated temporary directory, no external network
[<Fact>]
let ``File repository satisfies repository port contract`` () =
  use fixture = TemporaryDirectory.create ()
  let adapter = FilePurchaseOrderRepository.makePort fixture.Path
  PurchaseOrderRepositoryPortContract.run adapter
```

## Standard 4: Application Layer Unit Tests

**REQUIRED**: Application services (use case implementations) MUST be tested using in-memory adapters from the test composition root. These tests verify orchestration logic — that the use case calls the correct ports in the correct order.

**PROHIBITED**: Application layer unit tests that start a Spring context (`@SpringBootTest`). Use `@ExtendWith(MockitoExtension.class)` or plain constructor injection with in-memory adapters.

### `Java`

```java
// Application unit test — in-memory adapters, no Spring context
class CreatePurchaseOrderServiceTest {

  private final InMemoryPurchaseOrderRepositoryAdapter repository =
      new InMemoryPurchaseOrderRepositoryAdapter();
  private final FakeSupplierNotifierAdapter notifier =
      new FakeSupplierNotifierAdapter();
  private final CreatePurchaseOrderUseCase useCase =
      new CreatePurchaseOrderService(repository, notifier);

  @Test
  void creates_order_and_notifies_supplier() {
    var command = new CreatePurchaseOrderCommand(supplierId, lineItems);

    var id = useCase.create(command);

    assertThat(repository.findById(id)).isPresent();
    assertThat(notifier.notifiedOrders()).contains(id);
  }
}
```

## Standard 5: Integration Test Scope

**REQUIRED**: `test:integration` tests MUST use an isolated real local-resource boundary wired
through the production adapter, such as a temporary filesystem, embedded database accessed without
network transport, process environment, or child-process standard streams. They MUST NOT use
in-memory substitutes for the boundary under proof and MUST NOT reach an external network,
`localhost`, `127.0.0.1`, or a local server.

**REQUIRED**: `test:integration` targets MUST NOT be cacheable. Add `"cache": false` in `project.json` for these targets.

**Scope of integration tests**:

- Real adapter satisfies port contract (covered by Standard 3 concrete subclass)
- Full wiring of a non-network local-resource composition root boots without error
- Cross-adapter interaction through the same isolated local resource

**Out of scope for `test:integration`**: business logic and domain invariants (Unit); PostgreSQL,
Kafka, NATS, HTTP, and any other external network path (E2E through a public boundary).

## Standard 6: E2E Test Scope

**REQUIRED**: `test:e2e` tests call the application through its public browser, HTTP/API, or process
boundary. They verify the full stack — public adapter → application service → output port → real
adapter → controlled resource — using isolated synthetic data and identities.

E2E tests in `organiclever-be-e2e` target the running `organiclever-be` process. They MUST NOT
bypass the HTTP layer to call application services directly or use uncontrolled external services.

**See**: [Nx Target Standards](../../../../../repo-governance/development/infra/nx-targets.md) for `test:e2e` caching and parallelism rules.

## Standard 7: Fake vs In-Memory Adapter

**REQUIRED**: Distinguish between two test adapter kinds:

| Kind      | Purpose                                      | Naming                  |
| --------- | -------------------------------------------- | ----------------------- |
| In-memory | Full port contract implementation in RAM     | `InMemory[Port]Adapter` |
| Fake/stub | Minimal port implementation for side effects | `Fake[Port]Adapter`     |

**In-memory adapters** store and retrieve data using `Map` / `Dictionary` / F# `Map`. They satisfy the full port contract and are used in contract tests.

**Fake adapters** record calls for assertion (e.g., `FakeSupplierNotifierAdapter` stores notified order IDs). They are used in application layer unit tests to verify that the use case called the correct port.

**PROHIBITED**: Mockito / NSubstitute mocks for output ports in `test:unit` where an in-memory adapter can be used instead. Mocks encode expected call sequences and break when implementation order changes; in-memory adapters verify observable state.

## Rationale

The port contract test pattern is the central hexagonal testing insight: the port's behavioural contract is a specification, and every adapter is a candidate implementation that must satisfy it. Running the same contract against the in-memory and real adapters gives confidence that swapping adapters in the composition root will not introduce regressions. Prohibiting mocks in favour of in-memory adapters makes tests resilient to refactoring — tests break when observable behaviour changes, not when internal call sequences change.

## Related Documentation

- **[Port Standards](./port-standards.md)** — Port contracts verified by contract tests
- **[Adapter Standards](./adapter-standards.md)** — In-memory and fake adapter conventions
- **[Composition Root Standards](./composition-root-standards.md)** — Test composition root that wires in-memory adapters for `test:unit`
- **[Hexagonal Architecture Overview](../README.md)** — Dependency direction rule and bounded context overview
- **[Nx Target Standards](../../../../../repo-governance/development/infra/nx-targets.md)** — Canonical target names, caching, and parallelism rules
- **[Hexagonal Architecture FP Tutorial](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/hexagonal-architecture/in-fp-by-example/overview.md)** — Educational foundation: adapter swap for test isolation
- **[Hexagonal Architecture OOP Tutorial](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/software-architecture/hexagonal-architecture/in-oop-by-example/overview.md)** — Educational foundation: port contract tests with abstract base classes
