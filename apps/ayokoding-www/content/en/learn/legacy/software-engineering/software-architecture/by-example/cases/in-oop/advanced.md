---
title: "Advanced"
weight: 10000014
date: 2026-05-16T00:00:00+07:00
draft: false
description: "Advanced Cases guides (Guides 16–27) — Testcontainers database integration test, schema migration adapter with Flyway, banking port and Spring RestClient adapter, retry and circuit-breaker with Resilience4j, observability adapter with Micrometer Tracing, domain event flow end-to-end, hexagonal anti-patterns, Kubernetes deployment topology, Micrometer + OTLP + Prometheus observability stack, failure-mode HealthIndicator wiring, Flyway at deploy time, and configuration adapter"
tags:
  [
    "ddd",
    "hexagonal-architecture",
    "java",
    "spring-boot",
    "cases",
    "testcontainers",
    "flyway",
    "resilience4j",
    "micrometer",
    "opentelemetry",
    "anti-patterns",
    "advanced",
  ]
---

## Guide 16 — Database Integration Test via Testcontainers

### Why It Matters

Unit tests with an in-memory adapter (Guide 9) prove port correctness but cannot catch SQL schema mistakes, PostgreSQL-specific constraint behavior, or migration ordering bugs. A database integration test that spins up a real PostgreSQL instance inside Docker closes this gap without requiring a persistent database on developer machines. Container lifecycle management follows the same concept across all four stacks: JUnit 5 + Testcontainers `@Testcontainers` annotation in Java/Kotlin, `Testcontainers.net` with xUnit or NUnit fixtures in C#, and `@testcontainers/postgresql` with Jest or Vitest in TypeScript. The adapter under test receives a connection configured to point at the ephemeral container rather than any static URL.

### Standard Library First

`java.sql.DriverManager` can open a connection to any JDBC URL — but you manage container startup, health-check polling, and teardown manually outside the test:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: raw JDBC connection to a pre-running test database
// Demonstrates the manual approach that Testcontainers supersedes.

import java.sql.Connection;
// => Connection: JDBC connection — must be closed after use or connection pool leaks
import java.sql.DriverManager;
// => DriverManager: JDBC entry point — finds a driver matching the URL scheme
import java.sql.SQLException;
// => SQLException: checked exception on every JDBC operation — callers must handle or declare

public class ManualJdbcSmokeTest {
    public static void main(String[] args) throws SQLException {
        // => Assumes the database is already running on localhost:5432 — manual setup required
        // => If the database is not ready, DriverManager throws immediately — no health-check polling
        String url = System.getenv("TEST_DATABASE_URL");
        // => Reads the JDBC URL from an environment variable — CI must set this before the test runs
        // => No automatic container provisioning — the database must be started in a separate step
        try (Connection conn = DriverManager.getConnection(url, "test_user", "test_pass")) {
            // => try-with-resources: Connection implements AutoCloseable — conn.close() is guaranteed
            var stmt = conn.createStatement();
            // => createStatement: plain statement, no parameters — suitable for smoke queries only
            var rs = stmt.executeQuery("SELECT 1");
            // => SELECT 1: minimal smoke query — verifies the connection is live
            // => No schema migration here: the developer must run migrations manually before this test
            if (rs.next()) {
                System.out.println("Connected: " + rs.getInt(1));
                // => Diagnostic output only — this is not an assertion in a test framework
            }
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: raw JDBC connection to a pre-running test database
// Demonstrates the manual approach that Testcontainers supersedes.

import java.sql.DriverManager
// => DriverManager: JDBC entry point — finds a driver matching the URL scheme

fun main() {
    // => Assumes the database is already running on localhost:5432 — manual setup required
    // => If the database is not ready, DriverManager throws immediately — no health-check polling
    val url = System.getenv("TEST_DATABASE_URL")
    // => Reads the JDBC URL from an environment variable — CI must set this before the test runs
    // => No automatic container provisioning — the database must be started in a separate step
    DriverManager.getConnection(url, "test_user", "test_pass").use { conn ->
        // => use{}: Kotlin AutoCloseable extension — conn.close() is guaranteed even on exception
        val stmt = conn.createStatement()
        // => createStatement: plain statement, no parameters — suitable for smoke queries only
        val rs = stmt.executeQuery("SELECT 1")
        // => SELECT 1: minimal smoke query — verifies the connection is live
        // => No schema migration here: the developer must run migrations manually before this test
        if (rs.next()) {
            println("Connected: ${rs.getInt(1)}")
            // => Diagnostic output only — this is not an assertion in a test framework
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: raw ADO.NET connection to a pre-running test database
// Demonstrates the manual approach that Testcontainers supersedes.

using System;
// => System: BCL root namespace — no NuGet dependency required
using Npgsql;
// => Npgsql: PostgreSQL ADO.NET driver — the .NET equivalent of the PostgreSQL JDBC driver

public class ManualAdoNetSmokeTest
{
    public static void Main(string[] args)
    {
        // => Assumes the database is already running on localhost:5432 — manual setup required
        // => If the database is not ready, NpgsqlConnection throws immediately — no health-check polling
        var connStr = Environment.GetEnvironmentVariable("TEST_DATABASE_URL");
        // => Reads the connection string from an environment variable — CI must set this before the test
        // => No automatic container provisioning — the database must be started in a separate step
        using var conn = new NpgsqlConnection(connStr);
        // => using var: IDisposable pattern — conn.Dispose() is guaranteed even on exception
        conn.Open();
        // => Open(): establishes the TCP connection and authenticates — throws on failure
        using var cmd = new NpgsqlCommand("SELECT 1", conn);
        // => NpgsqlCommand: ADO.NET command — SELECT 1 is the minimal smoke query
        var result = cmd.ExecuteScalar();
        // => ExecuteScalar: returns the first column of the first row — verifies the connection is live
        // => No schema migration here: the developer must run migrations manually before this test
        Console.WriteLine($"Connected: {result}");
        // => Diagnostic output only — this is not an assertion in a test framework
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: raw pg connection to a pre-running test database
// Demonstrates the manual approach that Testcontainers supersedes.

import { Client } from "pg";
// => pg: Node.js PostgreSQL driver — the ecosystem equivalent of the PostgreSQL JDBC driver
// => No automatic container provisioning — the database must be started in a separate step

async function main(): Promise {
  // => Assumes the database is already running on localhost:5432 — manual setup required
  // => If the database is not ready, client.connect() throws immediately — no health-check polling
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
    // => Reads the connection URL from an environment variable — CI must set this before the test
    // => Returns undefined if absent — client.connect() will throw on missing credentials
  });
  try {
    await client.connect();
    // => connect(): establishes the TCP connection and authenticates — throws on failure
    const res = await client.query("SELECT 1 AS val");
    // => SELECT 1: minimal smoke query — verifies the connection is live
    // => No schema migration here: the developer must run migrations manually before this test
    console.log("Connected:", res.rows[0].val);
    // => Diagnostic output only — this is not an assertion in a test framework
  } finally {
    await client.end();
    // => end(): closes the connection — called in finally to guarantee cleanup even on error
  }
}

main();
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: raw JDBC requires a running database before the test starts, manual health-check polling, and manual teardown. Container startup is not coordinated with JUnit lifecycle hooks — if the JVM exits unexpectedly, the container is orphaned.

### Production Framework

The Testcontainers framework integrates with the test runner via lifecycle annotations (JUnit 5 `@Testcontainers`/`@Container` in Java and Kotlin, `IAsyncLifetime` in C#, `beforeAll`/`afterAll` hooks in TypeScript). The container wrapper manages the full lifecycle — start, wait for the PostgreSQL health probe, expose a random host port, and stop after the test suite finishes:

```mermaid
flowchart TD
    jvm["JUnit 5\ntest runner"]:::blue
    tc["@Testcontainers\nextension"]:::orange
    pg["PostgreSQLContainer\n(postgres:17-alpine)"]:::teal
    probe["waitingFor:\nlog message\n'ready to accept'"]:::purple
    adapter["JdbcPurchaseOrderRepository\n(adapter under test)"]:::brown
    jvm -->|"@BeforeAll\nstarts"| tc
    tc -->|"container.start()"| pg
    pg -->|"health-check"| probe
    probe -->|"ready → exposes\nJDBC URL"| adapter
    adapter -->|"SQL via JDBC URL"| pg

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
```

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Testcontainers integration test for the JDBC adapter
package com.procurement.platform.purchasing.infrastructure;
// => infrastructure package: integration tests live here — they test the adapter, not the domain

import com.procurement.platform.purchasing.application.PurchaseOrderRepository;
// => Application-layer port — the test exercises the adapter through the interface
import com.procurement.platform.purchasing.domain.PurchaseOrder;
import com.procurement.platform.purchasing.domain.PurchaseOrderId;
import com.procurement.platform.purchasing.domain.SupplierId;
import com.procurement.platform.purchasing.domain.Money;
import com.procurement.platform.purchasing.domain.ApprovalLevel;
import com.procurement.platform.purchasing.domain.PurchaseOrderStatus;
// => Domain types only — the test speaks in domain terms, not JDBC terms
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
// => JUnit 5: @Test marks test methods; @BeforeEach runs before each test method
import org.springframework.jdbc.datasource.DriverManagerDataSource;
// => DriverManagerDataSource: Spring's simple DataSource — wires the container JDBC URL
import org.testcontainers.containers.PostgreSQLContainer;
// => PostgreSQLContainer: the Testcontainers wrapper for postgres Docker images
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
// => @Testcontainers: JUnit 5 extension — manages @Container lifecycle automatically

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
// => @Testcontainers: registers the JUnit 5 extension that starts @Container fields
// => The extension calls container.start() before any test in this class and container.stop() after all
public class JdbcPurchaseOrderRepositoryIntegrationTest {

    @Container
    // => @Container: Testcontainers manages lifecycle — container starts before @BeforeEach, stops after @AfterAll
    // => static field: container is shared across all test methods in this class — one start, one stop
    static final PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:17-alpine");
        // => postgres:17-alpine: matches the production target — Alpine keeps the image small
        // => waitingFor defaults to waiting for the "ready to accept connections" log message

    private PurchaseOrderRepository repository;
    // => Port interface declared — the test never imports JdbcPurchaseOrderRepository directly
    // => Swapping the adapter requires no change to the test body

    @BeforeEach
    // => @BeforeEach: runs before each @Test method — creates a fresh adapter backed by the container
    void setUp() {
        DataSource dataSource = new DriverManagerDataSource(
            postgres.getJdbcUrl(),
            // => getJdbcUrl(): returns "jdbc:postgresql://<host>:<random-port>/test"
            // => Random port assigned by Docker — no port conflicts on CI runners
            postgres.getUsername(),
            postgres.getPassword()
            // => Default credentials: "test" / "test" — the default PostgreSQLContainer credentials
        );
        repository = new JdbcPurchaseOrderRepository(
            org.springframework.jdbc.core.simple.JdbcClient.create(dataSource));
        // => JdbcPurchaseOrderRepository: the infrastructure adapter under test
        // => Constructed fresh before each test — no state carries between tests
    }

    @Test
    // => @Test: JUnit 5 test method — discovered by the JUnit Platform and executed by the engine
    void save_thenFindById_roundTripsSuccessfully() {
        // => Test name describes the observable contract — save then find returns the same aggregate
        var id = new PurchaseOrderId(UUID.randomUUID());
        // => PurchaseOrderId: strongly-typed identity — wraps a random UUID for this test run
        var supplierId = new SupplierId(UUID.randomUUID());
        // => SupplierId: strongly-typed supplier identity — wraps a random UUID
        var po = new PurchaseOrder(id, supplierId, List.of(),
            new Money(new java.math.BigDecimal("500.00"), "USD"),
            ApprovalLevel.L1, PurchaseOrderStatus.Draft);
        // => Domain aggregate: built with the smart constructor — invariants validated at construction

        repository.save(po);
        // => Write path: persists the aggregate via JdbcPurchaseOrderRepository to the real PostgreSQL container

        Optional<PurchaseOrder> found = repository.findById(id);
        // => Read path: queries the real database — finds the row committed by save()

        assertTrue(found.isPresent(), "PurchaseOrder must be found after save");
        // => isPresent(): the row must exist — if the INSERT failed silently, this assertion fails
        assertEquals(po.supplierId(), found.get().supplierId());
        // => supplierId round-trip: the persisted supplier identity must match the domain record's value
        assertEquals(PurchaseOrderStatus.Draft, found.get().status());
        // => Status round-trip: verifies the enum column is mapped and retrieved correctly
    }

    @Test
    // => Second test: exercises the not-found path — no setup, no prior save
    void findById_returnsEmpty_whenNotFound() {
        var missingId = new PurchaseOrderId(UUID.randomUUID());
        // => A UUID that was never saved — the database has no row for this identity

        Optional<PurchaseOrder> result = repository.findById(missingId);
        // => Port contract: absence must be returned as Optional.empty(), never null

        assertTrue(result.isEmpty(), "Unknown PurchaseOrderId must return Optional.empty()");
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Testcontainers integration test for the JDBC adapter — Kotlin
package com.procurement.platform.purchasing.infrastructure
// => infrastructure package: integration tests live here — they test the adapter, not the domain

import com.procurement.platform.purchasing.application.PurchaseOrderRepository
// => Application-layer port — the test exercises the adapter through the interface
import com.procurement.platform.purchasing.domain.PurchaseOrder
import com.procurement.platform.purchasing.domain.PurchaseOrderId
import com.procurement.platform.purchasing.domain.SupplierId
import com.procurement.platform.purchasing.domain.Money
import com.procurement.platform.purchasing.domain.ApprovalLevel
import com.procurement.platform.purchasing.domain.PurchaseOrderStatus
// => Domain types only — the test speaks in domain terms, not JDBC terms
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
// => JUnit 5: @Test marks test methods; @BeforeEach runs before each test method
import org.springframework.jdbc.datasource.DriverManagerDataSource
// => DriverManagerDataSource: Spring's simple DataSource — wires the container JDBC URL
import org.testcontainers.containers.PostgreSQLContainer
// => PostgreSQLContainer: the Testcontainers wrapper for postgres Docker images
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
// => @Testcontainers: JUnit 5 extension — manages @Container lifecycle automatically
import java.math.BigDecimal
import java.util.UUID
import org.junit.jupiter.api.Assertions.*

@Testcontainers
// => @Testcontainers: registers the JUnit 5 extension that starts @Container fields
// => The extension calls container.start() before any test in this class and container.stop() after all
class JdbcPurchaseOrderRepositoryIntegrationTest {

    companion object {
        @Container
        // => companion object @Container: shared across all test instances — one start, one stop
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:17-alpine")
        // => postgres:17-alpine: matches the production target — Alpine keeps the image small
        // => waitingFor defaults to waiting for the "ready to accept connections" log message
    }

    private lateinit var repository: PurchaseOrderRepository
    // => Port interface declared — the test never imports JdbcPurchaseOrderRepository directly
    // => lateinit var: Kotlin deferred init — assigned in setUp(), not at declaration

    @BeforeEach
    // => @BeforeEach: runs before each @Test method — creates a fresh adapter backed by the container
    fun setUp() {
        val dataSource = DriverManagerDataSource(
            postgres.jdbcUrl,
            // => jdbcUrl: returns "jdbc:postgresql://<host>:<random-port>/test"
            // => Random port assigned by Docker — no port conflicts on CI runners
            postgres.username,
            postgres.password
            // => Default credentials: "test" / "test" — the default PostgreSQLContainer credentials
        )
        repository = JdbcPurchaseOrderRepository(
            org.springframework.jdbc.core.simple.JdbcClient.create(dataSource))
        // => JdbcPurchaseOrderRepository: the infrastructure adapter under test
        // => Constructed fresh before each test — no state carries between tests
    }

    @Test
    // => @Test: JUnit 5 test method — discovered by the JUnit Platform and executed by the engine
    fun `save then findById round-trips successfully`() {
        // => Test name describes the observable contract — save then find returns the same aggregate
        val id = PurchaseOrderId(UUID.randomUUID())
        // => PurchaseOrderId: strongly-typed identity — wraps a random UUID for this test run
        val supplierId = SupplierId(UUID.randomUUID())
        // => SupplierId: strongly-typed supplier identity — wraps a random UUID
        val po = PurchaseOrder(id, supplierId, emptyList(),
            Money(BigDecimal("500.00"), "USD"), ApprovalLevel.L1, PurchaseOrderStatus.Draft)
        // => Domain aggregate: built with the smart constructor — invariants validated at construction

        repository.save(po)
        // => Write path: persists the aggregate via JdbcPurchaseOrderRepository to the real PostgreSQL container

        val found = repository.findById(id)
        // => Read path: queries the real database — finds the row committed by save()

        assertNotNull(found, "PurchaseOrder must be found after save")
        // => assertNotNull: the row must exist — if the INSERT failed silently, this assertion fails
        assertEquals(po.supplierId(), found!!.supplierId())
        // => supplierId round-trip: the persisted supplier identity must match the domain record's value
        assertEquals(PurchaseOrderStatus.Draft, found.status())
        // => Status round-trip: verifies the enum column is mapped and retrieved correctly
    }

    @Test
    // => Second test: exercises the not-found path — no setup, no prior save
    fun `findById returns null when not found`() {
        val missingId = PurchaseOrderId(UUID.randomUUID())
        // => A UUID that was never saved — the database has no row for this identity

        val result = repository.findById(missingId)
        // => Port contract: absence must be returned as null in Kotlin — never throw

        assertNull(result, "Unknown PurchaseOrderId must return null")
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Testcontainers integration test for the ADO.NET adapter — C# 12 / xUnit
using Testcontainers.PostgreSql;
// => Testcontainers.PostgreSql: .NET Testcontainers module — IAsyncLifetime manages container lifecycle
using Xunit;
// => xUnit: .NET test framework — [Fact] replaces @Test; IAsyncLifetime replaces @Container
using Procurement.Platform.Purchasing.Application;
// => Application-layer port — the test exercises the adapter through the interface
using Procurement.Platform.Purchasing.Domain;
// => Domain types only — the test speaks in domain terms, not ADO.NET terms

namespace Procurement.Platform.Purchasing.Infrastructure.Tests;

public class AdoNetPurchaseOrderRepositoryIntegrationTest : IAsyncLifetime
{
    // => IAsyncLifetime: xUnit lifecycle hook — InitializeAsync runs before all tests in this class
    // => Equivalent to @Testcontainers + static @Container in JUnit 5

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:17-alpine")
        // => postgres:17-alpine: matches the production target — Alpine keeps the image small
        // => PostgreSqlBuilder: fluent builder — WaitStrategy defaults to TCP port probe
        .Build();

    private IPurchaseOrderRepository _repository = null!;
    // => Port interface: the test never imports AdoNetPurchaseOrderRepository directly
    // => null!: null-forgiving — initialized in InitializeAsync before any test method runs

    public async Task InitializeAsync()
    {
        // => InitializeAsync: runs once before all [Fact] methods in this class
        await _postgres.StartAsync();
        // => StartAsync: pulls the image, starts the container, waits for the health probe
        _repository = new AdoNetPurchaseOrderRepository(_postgres.GetConnectionString());
        // => GetConnectionString(): "Host=localhost;Port=<random>;Database=<database>;Username=<username>;Password=<password>"
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        // => DisposeAsync: stops and removes the container after all tests in the class complete
    }

    [Fact]
    // => [Fact]: xUnit test method — discovered and executed by the xUnit test runner
    public async Task SaveThenFindById_RoundTripsSuccessfully()
    {
        // => Test name describes the observable contract — save then find returns the same aggregate
        var id = new PurchaseOrderId(Guid.NewGuid());
        // => PurchaseOrderId: strongly-typed identity — wraps a random Guid for this test run
        var supplierId = new SupplierId(Guid.NewGuid());
        // => SupplierId: strongly-typed supplier identity — wraps a random Guid
        var po = new PurchaseOrder(id, supplierId, Array.Empty<PurchaseOrderLine>(),
            new Money(500.00m, "USD"), ApprovalLevel.L1, PurchaseOrderStatus.Draft);
        // => Domain aggregate: built with the smart constructor — invariants validated at construction

        await _repository.SaveAsync(po);
        // => Write path: persists the aggregate via AdoNetPurchaseOrderRepository to the real container

        var found = await _repository.FindByIdAsync(id);
        // => Read path: queries the real database — finds the row committed by SaveAsync

        Assert.NotNull(found);
        // => NotNull: the row must exist — if the INSERT failed silently, this assertion fails
        Assert.Equal(po.SupplierId, found!.SupplierId);
        // => SupplierId round-trip: the persisted supplier identity must match the domain record's value
        Assert.Equal(PurchaseOrderStatus.Draft, found.Status);
        // => Status round-trip: verifies the enum column is mapped and retrieved correctly
    }

    [Fact]
    // => Second test: exercises the not-found path — no setup, no prior save
    public async Task FindById_ReturnsNull_WhenNotFound()
    {
        var missingId = new PurchaseOrderId(Guid.NewGuid());
        // => A Guid that was never saved — the database has no row for this identity

        var result = await _repository.FindByIdAsync(missingId);
        // => Port contract: absence must be returned as null — never throw

        Assert.Null(result);
        // => Null: unknown PurchaseOrderId must return null — port contract preserved
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Testcontainers integration test for the pg adapter — TypeScript / Jest
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
// => @testcontainers/postgresql: Node.js Testcontainers module — manages PostgreSQL container lifecycle
// => Equivalent to PostgreSQLContainer in JUnit 5 Testcontainers
import type { PurchaseOrderRepository } from "../application/purchase-order-repository";
// => Application-layer port — the test exercises the adapter through the interface
import { PgPurchaseOrderRepository } from "./pg-purchase-order-repository";
// => PgPurchaseOrderRepository: the infrastructure adapter under test
import { PurchaseOrderId } from "../domain/purchase-order-id";
import { SupplierId } from "../domain/supplier-id";
import { PurchaseOrder } from "../domain/purchase-order";
import { Money } from "../domain/money";
// => Domain types only — the test speaks in domain terms, not SQL terms

describe("PgPurchaseOrderRepository integration", () => {
  // => Jest describe block: groups related tests — equivalent to the test class

  let container: StartedPostgreSqlContainer;
  // => StartedPostgreSqlContainer: running container handle — exposes connection URI
  let repository: PurchaseOrderRepository;
  // => Port interface: the test never imports PgPurchaseOrderRepository directly

  beforeAll(async () => {
    // => beforeAll: runs once before all tests in this describe — equivalent to @BeforeAll
    container = await new PostgreSqlContainer("postgres:17-alpine").start();
    // => start(): pulls the image, starts the container, waits for the health probe
    // => postgres:17-alpine: matches the production target — Alpine keeps the image small
    repository = new PgPurchaseOrderRepository(container.getConnectionUri());
    // => getConnectionUri(): "postgresql://test:test@localhost:<random-port>/test"
    // => Random port assigned by Docker — no port conflicts on CI runners
  });

  afterAll(async () => {
    await container.stop();
    // => stop(): stops and removes the container after all tests in the describe complete
  });

  it("save then findById round-trips successfully", async () => {
    // => Test name describes the observable contract — save then find returns the same aggregate
    const id = new PurchaseOrderId(crypto.randomUUID());
    // => PurchaseOrderId: strongly-typed identity — wraps a random UUID for this test run
    const supplierId = new SupplierId(crypto.randomUUID());
    // => SupplierId: strongly-typed supplier identity — wraps a random UUID
    const po = new PurchaseOrder(id, supplierId, [], new Money("500.00", "USD"), "L1", "Draft");
    // => Domain aggregate: built with the smart constructor — invariants validated at construction

    await repository.save(po);
    // => Write path: persists the aggregate via PgPurchaseOrderRepository to the real container

    const found = await repository.findById(id);
    // => Read path: queries the real database — finds the row committed by save()

    expect(found).not.toBeNull();
    // => not.toBeNull: the row must exist — if the INSERT failed silently, this assertion fails
    expect(found!.supplierId).toEqual(po.supplierId);
    // => supplierId round-trip: the persisted supplier identity must match the domain record's value
    expect(found!.status).toBe("Draft");
    // => Status round-trip: verifies the enum column is mapped and retrieved correctly
  });

  it("findById returns null when not found", async () => {
    // => Second test: exercises the not-found path — no setup, no prior save
    const missingId = new PurchaseOrderId(crypto.randomUUID());
    // => A UUID that was never saved — the database has no row for this identity

    const result = await repository.findById(missingId);
    // => Port contract: absence must be returned as null — never throw

    expect(result).toBeNull();
    // => toBeNull: unknown PurchaseOrderId must return null — port contract preserved
  });
});
```

{{< /tab >}}

{{< /tabs >}}

Add the Testcontainers dependency to the `pom.xml` for `procurement-platform-be`:

```xml
<!-- Testcontainers BOM import — manage all testcontainers module versions consistently -->
<dependency>
    <!-- => <dependency> in <dependencyManagement>: pins the version for all transitive consumers -->
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-bom</artifactId>
    <!-- => Spring Boot 4.0.6 BOM does NOT manage org.testcontainers core modules — explicit BOM import required -->
    <version>1.21.3</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Then in <dependencies>: -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <!-- => postgresql module: wraps postgres Docker image, exposes JDBC URL -->
    <artifactId>postgresql</artifactId>
    <!-- => Version managed by org.testcontainers:testcontainers-bom — no explicit version needed here -->
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <!-- => junit-jupiter: provides @Testcontainers and @Container annotations -->
    <artifactId>junit-jupiter</artifactId>
    <!-- => Without this module, the JUnit 5 lifecycle extension is not registered automatically -->
    <scope>test</scope>
</dependency>
```

**Trade-offs**: Testcontainers tests are slower than in-memory tests — PostgreSQL startup typically adds 5–15 seconds. They require Docker on the developer machine and CI runner. They are not cacheable by Nx because the external container is non-deterministic. Run them on the `test:integration` Nx target, not `test:quick`. The payoff is that they catch schema drift, PostgreSQL-specific constraint behavior, and migration bugs that no in-memory stub can surface.

---

## Guide 17 — Schema Migration Adapter with Flyway

### Why It Matters

Every database integration test and every production deployment depends on the schema matching the application's expectations. Without a migration tool, schema changes require manual SQL execution coordinated across every developer machine, CI runner, and production server. The migration adapter is a first-class hexagonal concern: it runs before any domain port is called, and the Testcontainers integration test (Guide 16) can invoke it against the fresh container database before running assertions. The idiomatic migration library differs per stack — Flyway embedded in a Java/Kotlin Spring Boot application, EF Core `dotnet ef database update` or a hosted `MigrationService` in C# ASP.NET Core, and `node-pg-migrate` or `drizzle-kit push` in TypeScript — but the structural role is the same in each: a versioned, ordered execution of SQL scripts before any domain port is exercised.

### Standard Library First

Each stack's standard I/O utilities can execute SQL files in order — but you manage ordering, idempotency, and error recovery manually:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: manual SQL file execution without a migration library
// Demonstrates the raw JDBC migration approach that the Flyway adapter supersedes.

import java.io.IOException;
// => IOException: thrown by Files.readString if the file does not exist or cannot be read
import java.nio.file.Files;
// => Files: NIO utility class — readString reads a file's entire content in one call
import java.nio.file.Path;
// => Files.readString: reads a .sql file from the filesystem — no classpath scanning
import java.sql.Connection;
// => Connection: JDBC connection — must be provided by the caller; not managed here
import java.sql.SQLException;
// => SQLException: thrown by createStatement().execute() on any SQL error

public class ManualMigrationRunner {
    public static void runMigration(Connection conn, Path sqlFile)
            throws IOException, SQLException {
        // => Two checked exceptions declared: I/O for file reading, SQL for execution
        // => No ordering enforcement — the caller must sort files by name manually
        // => No version tracking: impossible to determine which migrations have already run
        String sql = Files.readString(sqlFile);
        // => Reads the entire SQL file as a string — no templating, no parameter binding
        // => Large migration files are read entirely into memory — no streaming
        try (var stmt = conn.createStatement()) {
            // => try-with-resources: Statement implements AutoCloseable — closed after execute
            stmt.execute(sql);
            // => execute: runs the entire file as one batch — DDL errors mid-file leave partial schema
            // => No journal table: if the script runs twice, CREATE TABLE throws a duplicate-object error
            // => No transaction wrapping: if stmt.execute throws partway through, schema is partially applied
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: manual SQL file execution without a migration library
// Demonstrates the raw JDBC migration approach that the Flyway adapter supersedes.

import java.io.IOException
// => IOException: thrown by Files.readString if the file does not exist or cannot be read
import java.nio.file.Files
// => Files: NIO utility class — readString reads a file's entire content in one call
import java.nio.file.Path
// => Path: filesystem path to the .sql file — no classpath scanning
import java.sql.Connection
// => Connection: JDBC connection — must be provided by the caller; not managed here
import java.sql.SQLException
// => SQLException: thrown by createStatement().execute() on any SQL error

object ManualMigrationRunner {
    @Throws(IOException::class, SQLException::class)
    fun runMigration(conn: Connection, sqlFile: Path) {
        // => Two checked exceptions: I/O for file reading, SQL for execution
        // => No ordering enforcement — the caller must sort files by name manually
        // => No version tracking: impossible to determine which migrations have already run
        val sql = Files.readString(sqlFile)
        // => Reads the entire SQL file as a string — no templating, no parameter binding
        // => Large migration files are read entirely into memory — no streaming
        conn.createStatement().use { stmt ->
            // => use{}: Kotlin AutoCloseable extension — stmt.close() is guaranteed
            stmt.execute(sql)
            // => execute: runs the entire file as one batch — DDL errors mid-file leave partial schema
            // => No journal table: if the script runs twice, CREATE TABLE throws a duplicate-object error
            // => No transaction wrapping: if execute throws partway through, schema is partially applied
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: manual SQL file execution without a migration library
// Demonstrates the raw ADO.NET migration approach that EF Core migrations supersedes.

using System.IO;
// => File.ReadAllText: reads a .sql file from the filesystem — no classpath scanning
using Npgsql;
// => NpgsqlConnection: PostgreSQL ADO.NET connection — must be provided by the caller

public static class ManualMigrationRunner
{
    public static void RunMigration(NpgsqlConnection conn, string sqlFilePath)
    {
        // => No ordering enforcement — the caller must sort files by name manually
        // => No version tracking: impossible to determine which migrations have already run
        var sql = File.ReadAllText(sqlFilePath);
        // => ReadAllText: reads the entire SQL file as a string — no templating, no parameter binding
        // => Large migration files are read entirely into memory — no streaming
        using var cmd = new NpgsqlCommand(sql, conn);
        // => using var: IDisposable pattern — cmd.Dispose() is guaranteed even on exception
        cmd.ExecuteNonQuery();
        // => ExecuteNonQuery: runs the entire file as one batch — DDL errors mid-file leave partial schema
        // => No journal table: if the script runs twice, CREATE TABLE throws a duplicate-object error
        // => No transaction wrapping: if ExecuteNonQuery throws partway, schema is partially applied
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: manual SQL file execution without a migration library
// Demonstrates the raw pg migration approach that node-pg-migrate supersedes.

import { readFileSync } from "fs";
// => readFileSync: reads a .sql file from the filesystem — no classpath scanning
import type { Client } from "pg";
// => Client: Node.js PostgreSQL connection — must be provided by the caller; not managed here

async function runMigration(client: Client, sqlFilePath: string): Promise {
  // => No ordering enforcement — the caller must sort files by name manually
  // => No version tracking: impossible to determine which migrations have already run
  const sql = readFileSync(sqlFilePath, "utf8");
  // => readFileSync: reads the entire SQL file as a string — no templating, no parameter binding
  // => Large migration files are read entirely into memory — no streaming
  await client.query(sql);
  // => query: runs the entire file as one batch — DDL errors mid-file leave partial schema
  // => No journal table: if the script runs twice, CREATE TABLE throws a duplicate-object error
  // => No transaction wrapping: if query throws partway through, schema is partially applied
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no journal table means migrations run again on every restart. No ordering enforcement means naming conventions must be manually enforced. No embedded-resource support means SQL files must be on the filesystem at a known path.

### Production Framework

Flyway reads versioned SQL scripts from the classpath (`db/migration/V1__*.sql`, `V2__*.sql`, …), maintains an applied-scripts journal table (`flyway_schema_history`) in the database, and applies only unapplied scripts in order. Spring Boot 4 auto-configures Flyway when `spring-boot-starter-flyway` is on the classpath:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// ApplicationRunner invoking Flyway migration at startup
package com.procurement.platform.shared.config;

import org.flywaydb.core.Flyway;
// => Flyway: the migration engine — configured with dataSource and migration locations
import org.flywaydb.core.api.output.MigrateResult;
// => MigrateResult: result record — carries migrationsExecuted count and success flag
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
// => ApplicationRunner: Spring Boot hook — runs after ApplicationContext is ready
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class MigrationConfiguration {

    private static final Logger log = LoggerFactory.getLogger(MigrationConfiguration.class);

    @Bean
    public ApplicationRunner migrationRunner(DataSource dataSource) {
        // => DataSource: injected from the Spring context — backed by HikariCP in production
        return args -> {
            // => ApplicationRunner lambda — runs once at startup, before any HTTP request is served
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                // => dataSource: Flyway uses the same pool as the application — no second connection pool
                .locations("classpath:db/migration")
                // => locations: Flyway scans src/main/resources/db/migration for V*.sql files
                // => Scripts named V1__create_purchasing_schema.sql, V2__create_supplier_schema.sql, etc.
                .load();
            MigrateResult result = flyway.migrate();
            // => migrate(): applies all unapplied scripts in version order within individual transactions
            // => Flyway wraps each script in a transaction — a failed script leaves no partial schema
            log.info("Flyway applied {} migration(s)", result.migrationsExecuted);
            if (!result.success) {
                throw new IllegalStateException("Flyway migration failed — aborting startup");
                // => Throwing here causes Spring Boot to exit with a non-zero code
                // => Kubernetes readiness probe fails — pod does not receive traffic before schema is ready
            }
        };
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// ApplicationRunner invoking Flyway migration at startup — Kotlin
package com.procurement.platform.shared.config

import org.flywaydb.core.Flyway
// => Flyway: the migration engine — configured with dataSource and migration locations
import org.flywaydb.core.api.output.MigrateResult
// => MigrateResult: result record — carries migrationsExecuted count and success flag
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationRunner
// => ApplicationRunner: Spring Boot hook — runs after ApplicationContext is ready
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

@Configuration
class MigrationConfiguration {

    private val log = LoggerFactory.getLogger(MigrationConfiguration::class.java)

    @Bean
    fun migrationRunner(dataSource: DataSource): ApplicationRunner {
        // => DataSource: injected from the Spring context — backed by HikariCP in production
        return ApplicationRunner {
            // => ApplicationRunner lambda — runs once at startup, before any HTTP request is served
            val flyway = Flyway.configure()
                .dataSource(dataSource)
                // => dataSource: Flyway uses the same pool as the application — no second connection pool
                .locations("classpath:db/migration")
                // => locations: Flyway scans src/main/resources/db/migration for V*.sql files
                .load()
            val result: MigrateResult = flyway.migrate()
            // => migrate(): applies all unapplied scripts in version order within individual transactions
            // => Flyway wraps each script in a transaction — a failed script leaves no partial schema
            log.info("Flyway applied {} migration(s)", result.migrationsExecuted)
            if (!result.success) {
                throw IllegalStateException("Flyway migration failed — aborting startup")
                // => Throwing here causes Spring Boot to exit with a non-zero code
                // => Kubernetes readiness probe fails — pod does not receive traffic before schema is ready
            }
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// EF Core migration runner at startup — ASP.NET Core 8 / C# 12
// Applies EF Core database migrations equivalent to Flyway's ApplicationRunner approach.

using Microsoft.EntityFrameworkCore;
// => DbContext.Database.MigrateAsync(): applies pending migrations — equivalent to flyway.migrate()
using Microsoft.Extensions.DependencyInjection;
// => IServiceProvider: resolves scoped DbContext from the DI container
using Microsoft.Extensions.Hosting;
// => IHost: the application host — MigrateAsync() is called before app.Run()
using Microsoft.Extensions.Logging;
// => ILogger: structured logging — decoupled from the logging backend (Serilog, NLog)

public static class MigrationExtensions
{
    public static async Task MigrateAsync(this IHost host)
    {
        // => Extension method on IHost: called from Program.cs before app.Run()
        // => Equivalent to ApplicationRunner — runs after DI container is built, before HTTP traffic
        using var scope = host.Services.CreateScope();
        // => CreateScope: resolves scoped services safely — DbContext is scoped by convention
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        // => ProcurementDbContext: EF Core DbContext — MigrateAsync() applies __EFMigrationsHistory
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ProcurementDbContext>>();
        await db.Database.MigrateAsync();
        // => MigrateAsync(): applies all pending migrations in order within individual transactions
        // => EF Core wraps each migration in a transaction — a failed migration leaves no partial schema
        if (await db.Database.CanConnectAsync())
        {
            logger.LogInformation("EF Core migrations applied successfully");
            // => Structured log: equivalent to log.info in SLF4J — queryable in log aggregation
        }
        else
        {
            throw new InvalidOperationException("Database unreachable after migration — aborting startup");
            // => Throwing here causes the host to exit — Kubernetes readiness probe fails
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// node-pg-migrate runner at startup — TypeScript / Express
// Applies versioned SQL migrations equivalent to Flyway's ApplicationRunner approach.

import { migrate } from "node-pg-migrate";
// => node-pg-migrate: versioned SQL migration library — equivalent to Flyway for Node.js
// => migrate(): scans the migrations directory, applies pending scripts in version order
import type { Pool } from "pg";
// => Pool: pg connection pool — passed to node-pg-migrate as the database connection
import { logger } from "./shared/logger";
// => logger: structured logger (pino or winston) — decoupled from the logging backend

export async function runMigrations(pool: Pool): Promise {
  // => Called from the application bootstrap before the HTTP server starts accepting requests
  // => Equivalent to ApplicationRunner — runs once at startup, before any HTTP request is served
  const result = await migrate({
    dbClient: pool,
    // => dbClient: the pg Pool — node-pg-migrate acquires a connection from the pool
    dir: "src/db/migrations",
    // => dir: directory of versioned SQL files — 001_create_purchasing_schema.sql, 002_...
    direction: "up",
    // => direction: "up" applies pending migrations — equivalent to flyway.migrate()
    migrationsTable: "pgmigrations",
    // => migrationsTable: the journal table — equivalent to Flyway's flyway_schema_history
    verbose: false,
    // => verbose: false suppresses per-statement DDL output — set true for debugging
  });
  logger.info({ migrationsRun: result }, "node-pg-migrate applied migrations");
  // => Structured log: migration count is a queryable field in log aggregation
  // => If migrate() throws, the calling bootstrap rejects — the HTTP server never starts
}
```

{{< /tab >}}

{{< /tabs >}}

The migration SQL script follows Flyway's naming scheme and uses one schema per bounded context:

```sql
-- src/main/resources/db/migration/V1__create_purchasing_schema.sql
-- Creates the purchasing bounded context schema
CREATE SCHEMA IF NOT EXISTS purchasing;

-- => purchasing schema: isolates purchasing context tables from supplier and receiving schemas
-- => One schema per bounded context: prevents accidental cross-context table joins in raw SQL
CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
  -- => purchasing.purchase_orders: one table per aggregate in the purchasing context
  id UUID PRIMARY KEY,
  -- => UUID primary key: matches PurchaseOrderId.value() — no auto-increment sequences needed
  supplier_id UUID NOT NULL,
  -- => supplier_id: foreign reference to the supplier — UUID only, no FK to a suppliers table
  total_amount NUMERIC(19, 4) NOT NULL,
  -- => NUMERIC(19,4): sufficient precision for monetary amounts — 4 decimal places
  currency CHAR(3) NOT NULL,
  -- => CHAR(3): ISO 4217 currency code — "USD", "EUR", "IDR"
  approval_level TEXT NOT NULL,
  -- => approval_level: stores the ApprovalLevel enum name: "L1", "L2", "L3"
  status TEXT NOT NULL DEFAULT 'Draft'
  -- => DEFAULT 'Draft': new rows start as Draft — matches the domain aggregate's initial state
);

CREATE INDEX IF NOT EXISTS po_supplier_id_idx ON purchasing.purchase_orders (supplier_id);

-- => Index by supplier_id: findBySupplierId() is a hot read path — makes it O(log n)
CREATE TABLE IF NOT EXISTS purchasing.outbox_events (
  -- => outbox_events: one outbox table per bounded context schema
  id TEXT PRIMARY KEY,
  -- => id: idempotency key generated by OutboxEventPublisher — UUID string form
  event_type TEXT NOT NULL,
  -- => event_type: string name of the domain event class — used by the relay worker for routing
  payload JSONB NOT NULL,
  -- => JSONB: binary JSON format — enables GIN index on payload fields for relay filtering
  created_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
  -- => NULL until relayed: the relay worker sets this when the event has been delivered
);
```

Add the Flyway dependency to `pom.xml`:

```xml
<!-- Flyway starter — triggers FlywayAutoConfiguration in Spring Boot 4 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <!-- => required in Spring Boot 4: standalone flyway-core no longer triggers FlywayAutoConfiguration -->
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <!-- => PostgreSQL dialect module: required for PG-specific DDL and schema support -->
    <artifactId>flyway-database-postgresql</artifactId>
    <!-- => Without this, Flyway falls back to a generic JDBC dialect -->
</dependency>
```

**Trade-offs**: Flyway's versioned migration model requires naming discipline (`V1__`, `V2__`) — a mislabeled script that should run after `V10__` but is named `V2__` runs second and breaks. For `procurement-platform-be`, Flyway's embedded SQL approach keeps the migration language as plain SQL, which is more portable and easier to review in pull requests.

---

## Guide 18 — Banking Port + Spring `RestClient` Adapter

### Why It Matters

External bank API calls are an I/O boundary: the payments context sends a disbursement instruction and receives a confirmation from the bank's REST API. Like the database boundary, this I/O must sit behind a port so the application service is testable without a live banking API, and so the provider can be swapped without touching business logic. In `procurement-platform-be`, the `payments` bounded context introduces a `BankingPort` interface in its `application` package. The HTTP client adapter is expressed differently per stack — Spring Boot 4 `RestClient` in Java/Kotlin, `HttpClient` + `IHttpClientFactory` in C# ASP.NET Core, or `fetch`/`axios` wrapped in a typed adapter class in TypeScript — but in every case it is wired at the composition root and hidden behind the port.

### Standard Library First

Each stack's built-in HTTP client can call any HTTP endpoint without any framework dependency. You manage timeout configuration, error discrimination, and JSON mapping manually:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: java.net.http.HttpClient calling a bank disbursement endpoint
// Demonstrates the stdlib HttpClient approach that the Spring RestClient adapter supersedes.

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
// => java.net.http: JDK 11+ — no external dependency, full HTTP/2 support
import java.time.Duration;
// => Duration: used for connect and request timeouts — no third-party type needed

public class RawBankHttpClient {
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        // => connectTimeout: how long to wait for the TCP handshake — no retry on timeout
        .build();

    public String initiateDisbursement(String apiKey, String iban, String amount, String currency)
            throws Exception {
        // => checked Exception: no typed error discrimination between insufficient-funds, auth failure, or timeout
        String body = """
            {"iban":"%s","amount":"%s","currency":"%s"}
            """.formatted(iban, amount, currency);
        // => JSON string built manually — no type safety on field names
        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://bank-api.example.com/v1/disbursements"))
            // => Hardcoded URL: the base URL is not externalized — changing providers requires a code change
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .timeout(Duration.ofSeconds(30))
            .build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new Exception("Bank API call failed: " + response.statusCode());
            // => Undifferentiated exception: insufficient-funds (422) and auth failure (401) both throw the same type
        }
        return response.body();
        // => Returns the raw JSON body string — caller must parse it manually with Jackson
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: Ktor HttpClient calling a bank disbursement endpoint
// Demonstrates the stdlib approach that the Spring RestClient adapter supersedes.

import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
// => ktor-client: Kotlin-idiomatic HTTP client — no Spring dependency required
import io.ktor.http.*
// => HttpStatusCode: typed status codes — used for basic error discrimination

class RawBankHttpClient {
    private val client = HttpClient(CIO) {
        engine {
            connectTimeout = 5_000
            // => connectTimeout: how long to wait for TCP handshake — no retry on timeout
            requestTimeout = 30_000
            // => requestTimeout: 30 s total request timeout — no retry logic
        }
    }

    suspend fun initiateDisbursement(apiKey: String, iban: String, amount: String, currency: String): String {
        // => suspend: Kotlin coroutine — non-blocking, no thread-per-request overhead
        // => checked Exception equivalent: no typed error discrimination between failure modes
        val body = buildString { append("{\"iban\":\"$iban\",\"amount\":\"$amount\",\"currency\":\"$currency\"}") }
        // => JSON string built manually — no type safety on field names
        val response: HttpResponse = client.post("https://bank-api.example.com/v1/disbursements") {
            // => Hardcoded URL: the base URL is not externalized — changing providers requires a code change
            header(HttpHeaders.Authorization, "Bearer $apiKey")
            header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            setBody(body)
        }
        if (response.status != HttpStatusCode.OK) {
            throw Exception("Bank API call failed: ${response.status.value}")
            // => Undifferentiated exception: insufficient-funds (422) and auth failure (401) throw same type
        }
        return response.bodyAsText()
        // => Returns the raw JSON body string — caller must parse it manually with kotlinx.serialization
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: HttpClient calling a bank disbursement endpoint — C# 12
// Demonstrates the stdlib approach that the typed IBankingPort adapter supersedes.

using System;
// => System: BCL root namespace — no NuGet dependency required for HttpClient
using System.Net.Http;
// => HttpClient: .NET standard HTTP client — thread-safe, reuse across requests
using System.Text;
// => Encoding.UTF8: used to encode the JSON request body
using System.Text.Json;
// => JsonSerializer: .NET built-in JSON — no external library required

public class RawBankHttpClient
{
    private readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(30),
        // => Timeout: 30 s total request timeout — no retry on timeout
        BaseAddress = new Uri("https://bank-api.example.com")
        // => Hardcoded URL: not externalized — changing providers requires a code change
    };

    public async Task<string> InitiateDisbursementAsync(string apiKey, string iban, string amount, string currency)
    {
        // => No typed error discrimination between insufficient-funds, auth failure, and timeout
        var body = JsonSerializer.Serialize(new { iban, amount, currency });
        // => JsonSerializer.Serialize: .NET built-in — anonymous object maps to JSON fields
        using var request = new HttpRequestMessage(HttpMethod.Post, "/v1/disbursements");
        // => using var: IDisposable — request.Dispose() guaranteed
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        // => Authorization header: set per-request — not a default header on the shared client
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        // => StringContent: wraps the JSON body — sets Content-Type: application/json
        using var response = await _httpClient.SendAsync(request);
        // => SendAsync: non-blocking HTTP call — frees the thread while awaiting the response
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Bank API call failed: {(int)response.StatusCode}");
            // => Undifferentiated exception: insufficient-funds (422) and auth failure (401) throw same type
        }
        return await response.Content.ReadAsStringAsync();
        // => Returns the raw JSON body string — caller must parse it manually
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: axios calling a bank disbursement endpoint — TypeScript
// Demonstrates the stdlib approach that the typed BankingPort adapter supersedes.

import axios from "axios";
// => axios: the de-facto Node.js HTTP client — equivalent to java.net.http.HttpClient

const httpClient = axios.create({
  baseURL: "https://bank-api.example.com",
  // => Hardcoded URL: not externalized — changing providers requires a code change
  timeout: 30_000,
  // => timeout: 30 s total request timeout — axios throws AxiosError on timeout
});

async function initiateDisbursement(apiKey: string, iban: string, amount: string, currency: string): Promise {
  // => No typed error discrimination between insufficient-funds, auth failure, and timeout
  const body = { iban, amount, currency };
  // => Plain object: no type safety on field names — a typo compiles silently
  const response = await httpClient.post("/v1/disbursements", body, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      // => Authorization header: set per-request — not a default header on the shared client
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) {
    throw new Error(`Bank API call failed: ${response.status}`);
    // => Undifferentiated Error: insufficient-funds (422) and auth failure (401) throw same type
  }
  return JSON.stringify(response.data);
  // => Returns the raw JSON body string — caller must parse it manually
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no typed error discrimination between insufficient-funds errors, authentication failures, and server errors. No retry logic. The application layer must import the HTTP client directly — the banking boundary is not behind a port.

### Production Framework

The hexagonal approach declares a `BankingPort` interface in the `payments` application package and implements the HTTP adapter in infrastructure using the stack's idiomatic HTTP client (Spring `RestClient` in Java/Kotlin, `IHttpClientFactory`-injected `HttpClient` in C#, `axios` in TypeScript):

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// BankingPort.java — output port interface in the payments application package
package com.procurement.platform.payments.application;
// => application/ package: port interfaces live here — no Spring, no HTTP imports

import com.procurement.platform.payments.domain.Payment;
// => Payment: the domain aggregate — passed to initiateDisbursement for bank instructions
import com.procurement.platform.payments.domain.DisbursementConfirmation;
// => DisbursementConfirmation: value object wrapping the bank confirmation reference

public interface BankingPort {
    // => Output port: declares what the application needs from a bank API
    // => No mention of RestClient or HTTP — those are adapter concerns

    DisbursementConfirmation initiateDisbursement(Payment payment) throws BankingException;
    // => initiateDisbursement: called during a payment run — submits disbursement to the bank
    // => BankingException: typed checked exception — the caller can distinguish bank API failure

    boolean confirmDisbursement(String bankReference) throws BankingException;
    // => confirmDisbursement: polls for settlement status — returns true when bank confirms settlement
    // => Throws BankingException on connection failure, not on "pending" status
}

// BankingException.java — typed exception in the application package
class BankingException extends Exception {
    // => Checked exception: callers must handle or declare it — no silent swallowing
    public BankingException(String message, Throwable cause) {
        super(message, cause);
        // => Wraps the underlying RestClient exception with a typed domain-layer exception
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// BankingPort.kt — output port interface in the payments application package
package com.procurement.platform.payments.application
// => application/ package: port interfaces live here — no Spring, no HTTP imports

import com.procurement.platform.payments.domain.Payment
// => Payment: the domain aggregate — passed to initiateDisbursement for bank instructions
import com.procurement.platform.payments.domain.DisbursementConfirmation
// => DisbursementConfirmation: value object wrapping the bank confirmation reference

interface BankingPort {
    // => Output port: declares what the application needs from a bank API
    // => No mention of RestClient or HTTP — those are adapter concerns

    @Throws(BankingException::class)
    fun initiateDisbursement(payment: Payment): DisbursementConfirmation
    // => initiateDisbursement: called during a payment run — submits disbursement to the bank
    // => BankingException: typed checked exception — the caller can distinguish bank API failure

    @Throws(BankingException::class)
    fun confirmDisbursement(bankReference: String): Boolean
    // => confirmDisbursement: polls for settlement status — returns true when bank confirms settlement
    // => Throws BankingException on connection failure, not on "pending" status
}

// BankingException.kt — typed exception in the application package
class BankingException(message: String, cause: Throwable?) : Exception(message, cause)
// => Kotlin exception: @Throws annotation enables Java interop for checked-exception callers
// => Wraps the underlying RestClient exception with a typed domain-layer exception
```

{{< /tab >}}

{{< tab >}}

```csharp
// IBankingPort.cs — output port interface in the payments application package
namespace Procurement.Platform.Payments.Application;
// => Application namespace: port interfaces live here — no ASP.NET, no HttpClient imports

using Procurement.Platform.Payments.Domain;
// => Payment: the domain aggregate — passed to InitiateDisbursementAsync for bank instructions
// => DisbursementConfirmation: value object wrapping the bank confirmation reference

public interface IBankingPort
{
    // => Output port: declares what the application needs from a bank API
    // => No mention of HttpClient or HTTP — those are adapter concerns

    Task<DisbursementConfirmation> InitiateDisbursementAsync(Payment payment);
    // => InitiateDisbursementAsync: called during a payment run — submits disbursement to the bank
    // => Throws BankingException on failure — the caller can distinguish bank API failure

    Task<bool> ConfirmDisbursementAsync(string bankReference);
    // => ConfirmDisbursementAsync: polls for settlement status — returns true when bank confirms
    // => Throws BankingException on connection failure, not on "pending" status
}

// BankingException.cs — typed exception in the application package
public class BankingException : Exception
{
    // => Typed exception: callers catch BankingException to handle bank API failures explicitly
    public BankingException(string message, Exception? inner) : base(message, inner) { }
    // => Wraps the underlying HttpClient exception with a typed domain-layer exception
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// banking-port.ts — output port interface in the payments application package
// => application/ directory: port interfaces live here — no NestJS, no axios imports

import type { Payment } from "../domain/payment";
// => Payment: the domain aggregate — passed to initiateDisbursement for bank instructions
import type { DisbursementConfirmation } from "../domain/disbursement-confirmation";
// => DisbursementConfirmation: value object wrapping the bank confirmation reference

export interface BankingPort {
  // => Output port: declares what the application needs from a bank API
  // => No mention of axios or HTTP — those are adapter concerns

  initiateDisbursement(payment: Payment): Promise;
  // => initiateDisbursement: called during a payment run — submits disbursement to the bank
  // => Rejects with BankingError on failure — the caller can distinguish bank API failure

  confirmDisbursement(bankReference: string): Promise;
  // => confirmDisbursement: polls for settlement status — resolves true when bank confirms
  // => Rejects with BankingError on connection failure, not on "pending" status
}

// banking-error.ts — typed error in the application package
export class BankingError extends Error {
  // => TypeScript custom error: callers catch BankingError to handle bank API failures
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    // => Sets this.message — standard Error constructor pattern
    this.name = "BankingError";
    // => name: used for error type discrimination in catch blocks
  }
}
```

{{< /tab >}}

{{< /tabs >}}

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// RestClientBankingAdapter.java — RestClient adapter implementing BankingPort
package com.procurement.platform.payments.infrastructure;
// => payments/infrastructure/ package: the RestClient adapter lives here

import com.procurement.platform.payments.application.BankingPort;
import com.procurement.platform.payments.application.BankingException;
import com.procurement.platform.payments.domain.Payment;
import com.procurement.platform.payments.domain.DisbursementConfirmation;
// => Domain value objects: Payment carries the input, DisbursementConfirmation carries the output
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
// => RestClient: Spring Boot 4 fluent HTTP client — replaces RestTemplate for new code
import org.springframework.stereotype.Component;
import java.time.Duration;

@Component
public class RestClientBankingAdapter implements BankingPort {
    // => implements BankingPort: the adapter satisfies the output port contract

    private final RestClient restClient;
    // => RestClient: Spring Boot 4's modern HTTP client — builder-configured at construction
    private final String bankApiKey;
    // => apiKey: externalized in application.properties — never hardcoded

    public RestClientBankingAdapter(
            RestClient.Builder restClientBuilder,
            // => RestClient.Builder: Spring Boot 4 auto-configures one per application context
            @org.springframework.beans.factory.annotation.Value("${banking.api.base-url}")
            // => @Value: injects the property value at construction time — reads from application.properties
            String baseUrl,
            @org.springframework.beans.factory.annotation.Value("${banking.api.key}")
            // => @Value: injected from the Kubernetes Secret via BANKING_API_KEY environment variable
            String bankApiKey
    ) {
        this.restClient = restClientBuilder
            .baseUrl(baseUrl)
            // => baseUrl: all requests from this client use this prefix
            // => Externalised via BANKING_API_BASE_URL env var in ConfigMap — no hardcoded URLs
            .defaultHeader("Authorization", "Bearer " + bankApiKey)
            // => defaultHeader: the Authorization header is set once — not repeated per request
            // => Bearer token: the bank API uses OAuth2 bearer token authentication
            .requestFactory(factory -> factory.setConnectTimeout(Duration.ofSeconds(5)))
            // => connectTimeout: TCP handshake must complete within 5 seconds
            // => No read timeout configured here — Guide 19 Resilience4j adds the overall deadline
            .build();
        this.bankApiKey = bankApiKey;
        // => bankApiKey stored: used for logging or re-authentication if needed in future extensions
    }

    @Override
    public DisbursementConfirmation initiateDisbursement(Payment payment) throws BankingException {
        // => Implements BankingPort.initiateDisbursement — called by the payments application service
        try {
            var requestBody = new DisbursementRequest(
                payment.bankAccount().iban(),
                // => iban: extracted from the BankAccount value object — format-validated in the domain
                payment.amount().amount().toPlainString(),
                // => toPlainString(): avoids scientific notation — "1234.56" not "1.23456E3"
                payment.amount().currency()
                // => currency: ISO 4217 code from the Money value object — "USD", "EUR", "IDR"
            );
            var response = restClient.post()
                // => post(): opens an HTTP POST request builder
                .uri("/v1/disbursements")
                // => uri: relative path — resolved against the base URL configured at construction
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                // => contentType: sets Content-Type: application/json — required by the bank API
                .body(requestBody)
                // => body: Jackson serialises DisbursementRequest to JSON automatically
                .retrieve()
                // => retrieve(): executes the request and checks the HTTP status code
                .body(DisbursementResponse.class);
            // => body(Class): deserializes the response JSON into DisbursementResponse — Jackson mapping
            return new DisbursementConfirmation(response.reference(), response.status());
            // => DisbursementConfirmation: immutable value object returned to the application service
        } catch (RestClientException ex) {
            throw new BankingException("Bank disbursement API call failed: " + ex.getMessage(), ex);
            // => Wrap in BankingException to keep the application layer free of Spring imports
            // => RestClientException hierarchy: non-2xx responses throw HttpStatusCodeException
        }
    }

    @Override
    public boolean confirmDisbursement(String bankReference) throws BankingException {
        try {
            var response = restClient.get()
                // => get(): opens an HTTP GET request builder
                .uri("/v1/disbursements/{reference}", bankReference)
                // => URI template: bankReference is URL-encoded by RestClient automatically
                .retrieve()
                // => retrieve(): executes the GET and asserts 2xx — 404 throws RestClientException
                .body(DisbursementStatusResponse.class);
            // => body(Class): Jackson deserialises the bank's status response JSON
            return "SETTLED".equalsIgnoreCase(response.status());
            // => Returns true only when status is SETTLED — "PENDING" and "PROCESSING" return false
        } catch (RestClientException ex) {
            throw new BankingException("Bank confirmation API call failed: " + ex.getMessage(), ex);
            // => BankingException: the application layer catches this typed exception — no Spring leakage
        }
    }

    // Response records — private to the adapter, not exposed to the application layer
    private record DisbursementRequest(String iban, String amount, String currency) {}
    // => Jackson serializes this to {"iban":"...","amount":"...","currency":"..."}
    private record DisbursementResponse(String reference, String status) {}
    // => Jackson deserializes the bank API response — reference is the idempotency key
    private record DisbursementStatusResponse(String status) {}
    // => Status string: "PENDING", "PROCESSING", "SETTLED", "FAILED"
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// RestClientBankingAdapter.kt — RestClient adapter implementing BankingPort
package com.procurement.platform.payments.infrastructure
// => payments/infrastructure/ package: the RestClient adapter lives here

import com.procurement.platform.payments.application.BankingPort
import com.procurement.platform.payments.application.BankingException
import com.procurement.platform.payments.domain.Payment
import com.procurement.platform.payments.domain.DisbursementConfirmation
// => Domain value objects: Payment carries the input, DisbursementConfirmation carries the output
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
// => RestClient: Spring Boot 4 fluent HTTP client — Kotlin extension functions available
import org.springframework.stereotype.Component
import org.springframework.beans.factory.annotation.Value
import java.time.Duration

@Component
class RestClientBankingAdapter(
    restClientBuilder: RestClient.Builder,
    // => RestClient.Builder: Spring Boot 4 auto-configures one per application context
    @Value("\${banking.api.base-url}") baseUrl: String,
    // => @Value: injects the property value at construction time — reads from application.properties
    @Value("\${banking.api.key}") private val bankApiKey: String
    // => @Value: injected from the Kubernetes Secret via BANKING_API_KEY environment variable
) : BankingPort {
    // => implements BankingPort: the adapter satisfies the output port contract

    private val restClient: RestClient = restClientBuilder
        .baseUrl(baseUrl)
        // => baseUrl: all requests from this client use this prefix — externalized via ConfigMap
        .defaultHeader("Authorization", "Bearer $bankApiKey")
        // => defaultHeader: the Authorization header is set once — not repeated per request
        .requestFactory { factory -> factory.setConnectTimeout(Duration.ofSeconds(5)) }
        // => connectTimeout: TCP handshake must complete within 5 seconds
        .build()

    override fun initiateDisbursement(payment: Payment): DisbursementConfirmation {
        // => Implements BankingPort.initiateDisbursement — called by the payments application service
        return try {
            val requestBody = DisbursementRequest(
                payment.bankAccount().iban(),
                // => iban: extracted from the BankAccount value object — format-validated in the domain
                payment.amount().amount().toPlainString(),
                // => toPlainString(): avoids scientific notation — "1234.56" not "1.23456E3"
                payment.amount().currency()
                // => currency: ISO 4217 code from the Money value object — "USD", "EUR", "IDR"
            )
            val response = restClient.post()
                // => post(): opens an HTTP POST request builder
                .uri("/v1/disbursements")
                // => uri: relative path — resolved against the base URL configured at construction
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                // => contentType: sets Content-Type: application/json — required by the bank API
                .body(requestBody)
                // => body: Jackson serialises DisbursementRequest to JSON automatically
                .retrieve()
                // => retrieve(): executes the request and checks the HTTP status code
                .body(DisbursementResponse::class.java)!!
            // => body(Class): deserializes the response JSON into DisbursementResponse
            DisbursementConfirmation(response.reference, response.status)
            // => DisbursementConfirmation: immutable value object returned to the application service
        } catch (ex: RestClientException) {
            throw BankingException("Bank disbursement API call failed: ${ex.message}", ex)
            // => Wrap in BankingException to keep the application layer free of Spring imports
        }
    }

    override fun confirmDisbursement(bankReference: String): Boolean {
        return try {
            val response = restClient.get()
                // => get(): opens an HTTP GET request builder
                .uri("/v1/disbursements/{reference}", bankReference)
                // => URI template: bankReference is URL-encoded by RestClient automatically
                .retrieve()
                .body(DisbursementStatusResponse::class.java)!!
            // => body(Class): Jackson deserialises the bank's status response JSON
            "SETTLED".equals(response.status, ignoreCase = true)
            // => Returns true only when status is SETTLED — "PENDING" and "PROCESSING" return false
        } catch (ex: RestClientException) {
            throw BankingException("Bank confirmation API call failed: ${ex.message}", ex)
            // => BankingException: the application layer catches this typed exception — no Spring leakage
        }
    }

    // Response data classes — private to the adapter, not exposed to the application layer
    private data class DisbursementRequest(val iban: String, val amount: String, val currency: String)
    // => Jackson serializes this to {"iban":"...","amount":"...","currency":"..."}
    private data class DisbursementResponse(val reference: String, val status: String)
    // => Jackson deserializes the bank API response — reference is the idempotency key
    private data class DisbursementStatusResponse(val status: String)
    // => Status string: "PENDING", "PROCESSING", "SETTLED", "FAILED"
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// HttpClientBankingAdapter.cs — HttpClient adapter implementing IBankingPort
namespace Procurement.Platform.Payments.Infrastructure;
// => payments/Infrastructure/ namespace: the HttpClient adapter lives here

using System.Net.Http.Json;
// => PostAsJsonAsync / GetFromJsonAsync: extension methods for typed JSON I/O
using Microsoft.Extensions.Options;
// => IOptions<T>: injects strongly-typed configuration — no hardcoded URLs
using Procurement.Platform.Payments.Application;
using Procurement.Platform.Payments.Domain;
// => Domain value objects: Payment carries the input, DisbursementConfirmation carries the output

public class HttpClientBankingAdapter : IBankingPort
{
    // => Implements IBankingPort: the adapter satisfies the output port contract

    private readonly HttpClient _httpClient;
    // => HttpClient: typed client injected via IHttpClientFactory — connection-pool lifecycle managed

    public HttpClientBankingAdapter(HttpClient httpClient)
    {
        _httpClient = httpClient;
        // => IHttpClientFactory wires BaseAddress and Authorization header in Program.cs registration
        // => No hardcoded URLs or credentials here — all configuration is externalized
    }

    public async Task<DisbursementConfirmation> InitiateDisbursementAsync(Payment payment)
    {
        // => Implements IBankingPort.InitiateDisbursementAsync — called by the payments application service
        try
        {
            var requestBody = new DisbursementRequest(
                payment.BankAccount.Iban,
                // => Iban: extracted from the BankAccount value object — format-validated in the domain
                payment.Amount.Amount.ToString("F2"),
                // => ToString("F2"): avoids scientific notation — "1234.56" not "1.23456E+3"
                payment.Amount.Currency
                // => currency: ISO 4217 code from the Money value object — "USD", "EUR", "IDR"
            );
            var response = await _httpClient.PostAsJsonAsync("/v1/disbursements", requestBody);
            // => PostAsJsonAsync: serializes requestBody to JSON and sends the POST request
            response.EnsureSuccessStatusCode();
            // => EnsureSuccessStatusCode: throws HttpRequestException for non-2xx — typed error path
            var result = await response.Content.ReadFromJsonAsync<DisbursementResponse>();
            // => ReadFromJsonAsync: deserializes the response JSON into DisbursementResponse
            return new DisbursementConfirmation(result!.Reference, result.Status);
            // => DisbursementConfirmation: immutable value object returned to the application service
        }
        catch (HttpRequestException ex)
        {
            throw new BankingException($"Bank disbursement API call failed: {ex.Message}", ex);
            // => Wrap in BankingException to keep the application layer free of HttpClient imports
        }
    }

    public async Task<bool> ConfirmDisbursementAsync(string bankReference)
    {
        try
        {
            var result = await _httpClient.GetFromJsonAsync<DisbursementStatusResponse>(
                $"/v1/disbursements/{Uri.EscapeDataString(bankReference)}");
            // => GetFromJsonAsync: GET + JSON deserialization in one call
            // => Uri.EscapeDataString: URL-encodes bankReference — equivalent to RestClient URI template
            return string.Equals(result?.Status, "SETTLED", StringComparison.OrdinalIgnoreCase);
            // => Returns true only when status is SETTLED — "PENDING" and "PROCESSING" return false
        }
        catch (HttpRequestException ex)
        {
            throw new BankingException($"Bank confirmation API call failed: {ex.Message}", ex);
            // => BankingException: the application layer catches this typed exception — no HttpClient leakage
        }
    }

    // Response records — private to the adapter, not exposed to the application layer
    private record DisbursementRequest(string Iban, string Amount, string Currency);
    // => System.Text.Json serializes this to {"iban":"...","amount":"...","currency":"..."}
    private record DisbursementResponse(string Reference, string Status);
    // => Deserializes the bank API response — Reference is the idempotency key
    private record DisbursementStatusResponse(string Status);
    // => Status string: "PENDING", "PROCESSING", "SETTLED", "FAILED"
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// axios-banking-adapter.ts — axios adapter implementing BankingPort
// => payments/infrastructure/ directory: the axios adapter lives here

import axios, { AxiosInstance } from "axios";
// => axios: the typed HTTP client — equivalent to Spring RestClient for Node.js
import { BankingPort, BankingError } from "../application/banking-port";
// => BankingPort: the output port interface — the adapter satisfies its contract
import type { Payment } from "../domain/payment";
import type { DisbursementConfirmation } from "../domain/disbursement-confirmation";
// => Domain value objects: Payment carries the input, DisbursementConfirmation carries the output

interface DisbursementRequest {
  iban: string;
  amount: string;
  currency: string;
}
// => Private to the adapter — not exported to the application layer
interface DisbursementResponse {
  reference: string;
  status: string;
}
// => Deserializes the bank API response — reference is the idempotency key
interface DisbursementStatusResponse {
  status: string;
}
// => Status string: "PENDING", "PROCESSING", "SETTLED", "FAILED"

export class AxiosBankingAdapter implements BankingPort {
  // => implements BankingPort: the adapter satisfies the output port contract

  private readonly client: AxiosInstance;
  // => AxiosInstance: configured at construction — baseURL and Authorization header set once

  constructor(baseUrl: string, apiKey: string) {
    // => baseUrl: externalized via environment variable — never hardcoded
    // => apiKey: injected from the Kubernetes Secret — never hardcoded
    this.client = axios.create({
      baseURL: baseUrl,
      // => baseURL: all requests from this client use this prefix — externalized via ConfigMap
      headers: { Authorization: `Bearer ${apiKey}` },
      // => Authorization header set once at construction — not repeated per request
      timeout: 30_000,
      // => timeout: 30 s total request timeout — axios throws AxiosError on timeout
    });
  }

  async initiateDisbursement(payment: Payment): Promise {
    // => Implements BankingPort.initiateDisbursement — called by the payments application service
    try {
      const body: DisbursementRequest = {
        iban: payment.bankAccount.iban,
        // => iban: extracted from the BankAccount value object — format-validated in the domain
        amount: payment.amount.amount.toFixed(2),
        // => toFixed(2): avoids scientific notation — "1234.56" not "1.23456e+3"
        currency: payment.amount.currency,
        // => currency: ISO 4217 code from the Money value object — "USD", "EUR", "IDR"
      };
      const { data } = await this.client.post<DisbursementResponse>("/v1/disbursements", body, {
        headers: { "Content-Type": "application/json" },
        // => contentType: required by the bank API — explicit to avoid implicit defaults
      });
      // => retrieve() equivalent: axios throws AxiosError on non-2xx status codes
      return { reference: data.reference, status: data.status };
      // => DisbursementConfirmation: plain object returned to the application service
    } catch (err) {
      throw new BankingError(`Bank disbursement API call failed: ${String(err)}`, err);
      // => Wrap in BankingError to keep the application layer free of axios imports
    }
  }

  async confirmDisbursement(bankReference: string): Promise {
    try {
      const { data } = await this.client.get<DisbursementStatusResponse>(
        `/v1/disbursements/${encodeURIComponent(bankReference)}`,
        // => encodeURIComponent: URL-encodes bankReference — equivalent to RestClient URI template
      );
      return data.status.toUpperCase() === "SETTLED";
      // => Returns true only when status is SETTLED — "PENDING" and "PROCESSING" return false
    } catch (err) {
      throw new BankingError(`Bank confirmation API call failed: ${String(err)}`, err);
      // => BankingError: the application layer catches this typed error — no axios leakage
    }
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Trade-offs**: `RestClient` requires Spring MVC on the classpath — which is always present for `spring-boot-starter-web`. The typed response records (private to the adapter) couple the adapter to the bank API's JSON schema — if the bank changes its response shape, only the adapter changes; the application service and port are untouched.

---

## Guide 19 — Retry + Circuit-Breaker via Resilience4j

### Why It Matters

External ports — the banking adapter from Guide 18, the persistence adapter from Guide 8 — fail transiently. A timeout does not mean the downstream service is permanently unavailable; a retry after a brief pause often succeeds. Conversely, an adapter that retries indefinitely against a service that is genuinely down floods the downstream with traffic and keeps threads occupied. A resilience decorator wraps port adapters with configurable retry and circuit-breaker policies — expressed as Resilience4j annotations in Java/Kotlin Spring Boot, `Polly` pipeline policies in C# ASP.NET Core, or `opossum` circuit-breaker wrappers in TypeScript. The application service code is unchanged — the decorator is wired transparently in the composition root.

### Standard Library First

Each stack's standard concurrency primitives can implement a retry loop — but you write the retry logic, backoff calculation, and open-circuit state yourself:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: manual retry loop with exponential backoff
// Demonstrates the manual retry approach that Resilience4j supersedes.

import java.util.function.Supplier;
// => Supplier<T>: functional interface — wraps the call that may throw

public class ManualRetry {
    public static <T> T withRetry(Supplier<T> supplier, int maxAttempts, long initialDelayMs)
            throws Exception {
        Exception lastException = null;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            // => Linear retry loop: no built-in jitter, no backoff cap, no circuit-breaker state
            try {
                return supplier.get();
            } catch (Exception ex) {
                lastException = ex;
                if (attempt < maxAttempts - 1) {
                    long delay = initialDelayMs * (long) Math.pow(2, attempt);
                    // => Exponential backoff: 100ms, 200ms, 400ms — no jitter
                    Thread.sleep(delay);
                    // => Thread.sleep: blocks the calling thread — no async option without CompletableFuture
                }
            }
        }
        throw lastException;
        // => All attempts exhausted — rethrow the last exception
        // => No circuit-breaker: the retry loop always tries, even if the last 100 calls failed
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: manual retry loop with exponential backoff — Kotlin
// Demonstrates the manual retry approach that Resilience4j supersedes.

object ManualRetry {
    @Throws(Exception::class)
    fun <T> withRetry(supplier: () -> T, maxAttempts: Int, initialDelayMs: Long): T {
        // => Kotlin lambda: idiomatic replacement for Java Supplier — no extra type import needed
        var lastException: Exception? = null
        for (attempt in 0 until maxAttempts) {
            // => Linear retry loop: no built-in jitter, no backoff cap, no circuit-breaker state
            try {
                return supplier()
            } catch (ex: Exception) {
                lastException = ex
                if (attempt < maxAttempts - 1) {
                    val delay = (initialDelayMs * Math.pow(2.0, attempt.toDouble())).toLong()
                    // => Exponential backoff: 100ms, 200ms, 400ms — no jitter
                    Thread.sleep(delay)
                    // => Thread.sleep: blocks the calling thread — use delay() in suspend context
                }
            }
        }
        throw lastException!!
        // => All attempts exhausted — rethrow the last exception
        // => No circuit-breaker: the retry loop always tries, even if the last 100 calls failed
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: manual retry loop with exponential backoff — C# 12
// Demonstrates the manual retry approach that Polly supersedes.

public static class ManualRetry
{
    public static async Task<T> WithRetryAsync<T>(
        Func<Task<T>> operation,
        // => Func<Task<T>>: async delegate — wraps the call that may throw
        int maxAttempts,
        TimeSpan initialDelay)
    {
        Exception? lastException = null;
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            // => Linear retry loop: no built-in jitter, no backoff cap, no circuit-breaker state
            try
            {
                return await operation();
            }
            catch (Exception ex)
            {
                lastException = ex;
                if (attempt < maxAttempts - 1)
                {
                    var delay = TimeSpan.FromMilliseconds(
                        initialDelay.TotalMilliseconds * Math.Pow(2, attempt));
                    // => Exponential backoff: 100ms, 200ms, 400ms — no jitter
                    await Task.Delay(delay);
                    // => Task.Delay: async sleep — does not block the thread (unlike Thread.Sleep)
                }
            }
        }
        throw lastException!;
        // => All attempts exhausted — rethrow the last exception
        // => No circuit-breaker: the retry loop always tries, even if the last 100 calls failed
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: manual retry loop with exponential backoff — TypeScript
// Demonstrates the manual retry approach that p-retry + opossum supersedes.

const sleep = (ms: number): Promise => new Promise((resolve) => setTimeout(resolve, ms));
// => setTimeout-based sleep: non-blocking — does not occupy a thread like Thread.sleep

export async function withRetry<T>(
  operation: () => Promise,
  // => () => Promise<T>: async lambda — wraps the call that may throw
  maxAttempts: number,
  initialDelayMs: number,
): Promise {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // => Linear retry loop: no built-in jitter, no backoff cap, no circuit-breaker state
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        // => Exponential backoff: 100ms, 200ms, 400ms — no jitter
        await sleep(delay);
        // => Non-blocking sleep: event loop continues processing other callbacks
      }
    }
  }
  throw lastError;
  // => All attempts exhausted — rethrow the last error
  // => No circuit-breaker: the retry loop always tries, even if the last 100 calls failed
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no circuit-breaker state — the retry loop hammers a down service on every call. No jitter — simultaneous callers retry in lock-step. No metrics integration — failures are not counted for observability.

### Production Framework

The resilience library for each stack provides `Retry` and `CircuitBreaker` decorators that wrap any callable unit of work (Resilience4j in Java/Kotlin, Polly's `ResiliencePipeline` in C#, `p-retry` + `opossum` in TypeScript). The decorator is applied in the composition root — the application service constructor receives a `PurchaseOrderRepository` that already has retry and circuit-breaker wiring applied:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// ResilientPurchaseOrderRepository.java — Resilience4j decorator wrapping the output port
package com.procurement.platform.purchasing.infrastructure;

import com.procurement.platform.purchasing.application.PurchaseOrderRepository;
// => Port interface: the decorator implements the same interface as the underlying adapter
import com.procurement.platform.purchasing.domain.PurchaseOrder;
import com.procurement.platform.purchasing.domain.PurchaseOrderId;
// => Domain types only — the decorator speaks in domain terms, delegates to the real adapter
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
// => CircuitBreaker: state machine — CLOSED, OPEN, HALF_OPEN — stops calls when open
import io.github.resilience4j.retry.Retry;
// => Retry: configures max attempts, wait duration, and which exceptions trigger a retry
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import java.time.Duration;
import java.util.Optional;

public class ResilientPurchaseOrderRepository implements PurchaseOrderRepository {
    // => Implements PurchaseOrderRepository: the decorator is a drop-in replacement for the adapter
    // => The application service cannot tell whether it has the raw adapter or the decorator

    private final PurchaseOrderRepository delegate;
    // => delegate: the real adapter (JdbcPurchaseOrderRepository) — receives calls after retry/CB evaluation
    private final Retry retry;
    private final CircuitBreaker circuitBreaker;

    public ResilientPurchaseOrderRepository(PurchaseOrderRepository delegate) {
        this.delegate = delegate;
        this.retry = Retry.of(
            "purchase-order-repository",
            RetryConfig.custom()
                .maxAttempts(3)
                // => maxAttempts: 3 — the initial call plus two retries
                .waitDuration(Duration.ofMillis(200))
                // => waitDuration: 200ms between attempts — avoid hammering a recovering database
                .retryOnException(ex -> ex instanceof java.sql.SQLException)
                // => retryOnException: only retry on SQLExceptions — not on domain exceptions
                .build()
        );
        this.circuitBreaker = CircuitBreaker.of(
            "purchase-order-repository",
            CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                // => failureRateThreshold: 50% failure rate in the sliding window opens the circuit
                .slidingWindowSize(10)
                // => slidingWindowSize: 10 calls — the CB evaluates the last 10 attempts
                .waitDurationInOpenState(Duration.ofSeconds(30))
                // => waitDurationInOpenState: CB stays open for 30 seconds before transitioning to HALF_OPEN
                .build()
        );
    }

    @Override
    public PurchaseOrder save(PurchaseOrder po) {
        // => Wraps save() with retry + circuit-breaker: transient DB failures are retried
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker,
                () -> delegate.save(po)
                // => Lambda delegates to the real adapter — retry fires if the lambda throws
            )
        ).get();
    }

    @Override
    public Optional<PurchaseOrder> findById(PurchaseOrderId id) {
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker,
                () -> delegate.findById(id)
                // => findById is also retried: transient DB timeouts on reads benefit from retry
                // => CircuitBreaker counts read failures too — opens circuit if DB is fully down
            )
        ).get();
        // => .get(): executes the decorated supplier — Retry and CircuitBreaker apply transparently
    }

    @Override
    public boolean existsById(PurchaseOrderId id) {
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker,
                () -> delegate.existsById(id)
                // => existsById retried: the existence check uses a lightweight COUNT query — worth retrying
            )
        ).get();
        // => .get(): returns the boolean result from delegate.existsById() after retry + CB evaluation
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// ResilientPurchaseOrderRepository.kt — Resilience4j decorator wrapping the output port
package com.procurement.platform.purchasing.infrastructure

import com.procurement.platform.purchasing.application.PurchaseOrderRepository
// => Port interface: the decorator implements the same interface as the underlying adapter
import com.procurement.platform.purchasing.domain.PurchaseOrder
import com.procurement.platform.purchasing.domain.PurchaseOrderId
// => Domain types only — the decorator speaks in domain terms, delegates to the real adapter
import io.github.resilience4j.circuitbreaker.CircuitBreaker
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig
// => CircuitBreaker: state machine — CLOSED, OPEN, HALF_OPEN — stops calls when open
import io.github.resilience4j.retry.Retry
import io.github.resilience4j.retry.RetryConfig
// => Retry: configures max attempts, wait duration, and which exceptions trigger a retry
import java.sql.SQLException
import java.time.Duration
import java.util.Optional

class ResilientPurchaseOrderRepository(
    private val delegate: PurchaseOrderRepository
    // => delegate: the real adapter (JdbcPurchaseOrderRepository) — receives calls after retry/CB evaluation
) : PurchaseOrderRepository {
    // => implements PurchaseOrderRepository: the decorator is a drop-in replacement for the adapter
    // => The application service cannot tell whether it has the raw adapter or the decorator

    private val retry: Retry = Retry.of(
        "purchase-order-repository",
        RetryConfig.custom<Any>()
            .maxAttempts(3)
            // => maxAttempts: 3 — the initial call plus two retries
            .waitDuration(Duration.ofMillis(200))
            // => waitDuration: 200ms between attempts — avoid hammering a recovering database
            .retryOnException { ex -> ex is SQLException }
            // => retryOnException: only retry on SQLExceptions — not on domain exceptions
            .build()
    )

    private val circuitBreaker: CircuitBreaker = CircuitBreaker.of(
        "purchase-order-repository",
        CircuitBreakerConfig.custom()
            .failureRateThreshold(50f)
            // => failureRateThreshold: 50% failure rate in the sliding window opens the circuit
            .slidingWindowSize(10)
            // => slidingWindowSize: 10 calls — the CB evaluates the last 10 attempts
            .waitDurationInOpenState(Duration.ofSeconds(30))
            // => waitDurationInOpenState: CB stays open for 30 seconds before transitioning to HALF_OPEN
            .build()
    )

    override fun save(po: PurchaseOrder): PurchaseOrder {
        // => Wraps save() with retry + circuit-breaker: transient DB failures are retried
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker) { delegate.save(po) }
            // => Lambda delegates to the real adapter — retry fires if the lambda throws
        ).get()
    }

    override fun findById(id: PurchaseOrderId): Optional<PurchaseOrder> {
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker) { delegate.findById(id) }
            // => findById is also retried: transient DB timeouts on reads benefit from retry
            // => CircuitBreaker counts read failures too — opens circuit if DB is fully down
        ).get()
        // => .get(): executes the decorated supplier — Retry and CircuitBreaker apply transparently
    }

    override fun existsById(id: PurchaseOrderId): Boolean {
        return Retry.decorateSupplier(retry,
            CircuitBreaker.decorateSupplier(circuitBreaker) { delegate.existsById(id) }
            // => existsById retried: the existence check uses a lightweight COUNT query — worth retrying
        ).get()
        // => .get(): returns the boolean result from delegate.existsById() after retry + CB evaluation
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// ResilientPurchaseOrderRepository.cs — Polly decorator wrapping the output port
namespace Procurement.Platform.Purchasing.Infrastructure;

using Polly;
using Polly.Retry;
using Polly.CircuitBreaker;
// => Polly: .NET resilience library — the C# equivalent of Resilience4j
using Procurement.Platform.Purchasing.Application;
using Procurement.Platform.Purchasing.Domain;
// => Domain types only — the decorator speaks in domain terms, delegates to the real adapter

public class ResilientPurchaseOrderRepository : IPurchaseOrderRepository
{
    // => Implements IPurchaseOrderRepository: the decorator is a drop-in replacement for the adapter
    // => The application service cannot tell whether it has the raw adapter or the decorator

    private readonly IPurchaseOrderRepository _delegate;
    // => _delegate: the real adapter (AdoNetPurchaseOrderRepository) — receives calls after Polly evaluation
    private readonly ResiliencePipeline _pipeline;

    public ResilientPurchaseOrderRepository(IPurchaseOrderRepository delegate_)
    {
        _delegate = delegate_;
        _pipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 2,
                // => MaxRetryAttempts: 2 retries — the initial call plus two retries (total 3 attempts)
                Delay = TimeSpan.FromMilliseconds(200),
                // => Delay: 200ms between attempts — avoid hammering a recovering database
                BackoffType = DelayBackoffType.Exponential,
                // => Exponential: delay doubles per attempt — equivalent to Resilience4j waitDuration
                ShouldHandle = new PredicateBuilder().Handle<Npgsql.NpgsqlException>()
                // => ShouldHandle: only retry on NpgsqlException — not on domain exceptions
            })
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions
            {
                FailureRatio = 0.5,
                // => FailureRatio: 50% failure rate in the sampling window opens the circuit
                SamplingDuration = TimeSpan.FromSeconds(10),
                // => SamplingDuration: 10-call window — equivalent to slidingWindowSize = 10
                BreakDuration = TimeSpan.FromSeconds(30)
                // => BreakDuration: circuit stays open for 30 seconds before HALF_OPEN transition
            })
            .Build();
    }

    public async Task<PurchaseOrder> SaveAsync(PurchaseOrder po)
    {
        // => Wraps SaveAsync with retry + circuit-breaker: transient DB failures are retried
        return await _pipeline.ExecuteAsync(async _ => await _delegate.SaveAsync(po));
        // => ExecuteAsync: applies retry and circuit-breaker transparently — delegate receives the call
    }

    public async Task<PurchaseOrder?> FindByIdAsync(PurchaseOrderId id)
    {
        return await _pipeline.ExecuteAsync(async _ => await _delegate.FindByIdAsync(id));
        // => FindByIdAsync is also retried: transient DB timeouts on reads benefit from retry
        // => CircuitBreaker counts read failures too — opens circuit if DB is fully down
    }

    public async Task<bool> ExistsByIdAsync(PurchaseOrderId id)
    {
        return await _pipeline.ExecuteAsync(async _ => await _delegate.ExistsByIdAsync(id));
        // => existsById retried: the existence check uses a lightweight COUNT query — worth retrying
        // => .ExecuteAsync returns the boolean result from _delegate.ExistsByIdAsync() after retry + CB
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// resilient-purchase-order-repository.ts — p-retry + opossum decorator wrapping the output port
import pRetry from "p-retry";
// => p-retry: promise-based retry library — the Node.js equivalent of Resilience4j Retry
import CircuitBreaker from "opossum";
// => opossum: circuit-breaker library — CLOSED, OPEN, HALF_OPEN state machine for Node.js
import type { PurchaseOrderRepository } from "../application/purchase-order-repository";
// => Port interface: the decorator implements the same interface as the underlying adapter
import type { PurchaseOrder } from "../domain/purchase-order";
import type { PurchaseOrderId } from "../domain/purchase-order-id";
// => Domain types only — the decorator speaks in domain terms, delegates to the real adapter

export class ResilientPurchaseOrderRepository implements PurchaseOrderRepository {
  // => implements PurchaseOrderRepository: the decorator is a drop-in replacement for the adapter
  // => The application service cannot tell whether it has the raw adapter or the decorator

  private readonly saveBreaker: CircuitBreaker;
  // => saveBreaker: circuit-breaker scoped to save — opens on sustained save failures
  private readonly findBreaker: CircuitBreaker;
  // => findBreaker: circuit-breaker scoped to findById — opens on sustained read failures

  constructor(private readonly delegate: PurchaseOrderRepository) {
    // => delegate: the real adapter (PgPurchaseOrderRepository) — receives calls after retry/CB evaluation
    const breakerOptions: CircuitBreaker.Options = {
      errorThresholdPercentage: 50,
      // => errorThresholdPercentage: 50% failure rate opens the circuit — equivalent to failureRateThreshold
      resetTimeout: 30_000,
      // => resetTimeout: circuit stays open for 30 seconds before transitioning to HALF_OPEN
    };
    this.saveBreaker = new CircuitBreaker((po: PurchaseOrder) => delegate.save(po), breakerOptions);
    // => Wraps save in a circuit-breaker: opossum tracks failures and opens the circuit
    this.findBreaker = new CircuitBreaker((id: PurchaseOrderId) => delegate.findById(id), breakerOptions);
    // => Wraps findById in a circuit-breaker: read failures counted separately from write failures
  }

  async save(po: PurchaseOrder): Promise {
    // => Wraps save() with retry + circuit-breaker: transient DB failures are retried
    return pRetry(() => this.saveBreaker.fire(po) as Promise, {
      retries: 2,
      // => retries: 2 — the initial call plus two retries (total 3 attempts)
      minTimeout: 200,
      // => minTimeout: 200ms base delay — p-retry applies exponential backoff by default
      factor: 2,
      // => factor: 2 — delay doubles per attempt: 200ms, 400ms — equivalent to waitDuration
    });
  }

  async findById(id: PurchaseOrderId): Promise {
    return pRetry(() => this.findBreaker.fire(id) as Promise, {
      retries: 2,
      // => findById is also retried: transient DB timeouts on reads benefit from retry
      minTimeout: 200,
      // => CircuitBreaker counts read failures too — opens circuit if DB is fully down
    });
  }

  async existsById(id: PurchaseOrderId): Promise {
    return pRetry(() => this.delegate.existsById(id), {
      retries: 2,
      // => existsById retried: the existence check uses a lightweight COUNT query — worth retrying
      minTimeout: 200,
      // => p-retry applies exponential backoff — base 200ms doubles per attempt
    });
  }
}
```

{{< /tab >}}

{{< /tabs >}}

The composition root wires the decorator transparently:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// PurchasingContextConfiguration.java — composition root wiring with resilience decorator

@Bean
public PurchaseOrderRepository purchaseOrderRepository(JdbcClient jdbc) {
    var jdbcAdapter = new JdbcPurchaseOrderRepository(jdbc);
    // => JdbcPurchaseOrderRepository: the real database adapter — receives SQL calls
    return new ResilientPurchaseOrderRepository(jdbcAdapter);
    // => ResilientPurchaseOrderRepository: decorator wrapping the adapter with retry + circuit-breaker
    // => The application service injects PurchaseOrderRepository — it never sees either concrete class
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// PurchasingContextConfiguration.kt — composition root wiring with resilience decorator

@Bean
fun purchaseOrderRepository(jdbc: JdbcClient): PurchaseOrderRepository {
    val jdbcAdapter = JdbcPurchaseOrderRepository(jdbc)
    // => JdbcPurchaseOrderRepository: the real database adapter — receives SQL calls
    return ResilientPurchaseOrderRepository(jdbcAdapter)
    // => ResilientPurchaseOrderRepository: decorator wrapping the adapter with retry + circuit-breaker
    // => The application service injects PurchaseOrderRepository — it never sees either concrete class
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Program.cs / DI registration — composition root wiring with resilience decorator

builder.Services.AddScoped<IPurchaseOrderRepository>(sp =>
{
    var dataSource = sp.GetRequiredService<NpgsqlDataSource>();
    // => NpgsqlDataSource: the Npgsql connection source — receives SQL calls from the adapter
    var jdbcAdapter = new AdoNetPurchaseOrderRepository(dataSource);
    // => AdoNetPurchaseOrderRepository: the real database adapter — receives SQL calls
    return new ResilientPurchaseOrderRepository(jdbcAdapter);
    // => ResilientPurchaseOrderRepository: Polly decorator wrapping the adapter with retry + circuit-breaker
    // => The application service injects IPurchaseOrderRepository — it never sees either concrete class
});
```

{{< /tab >}}

{{< tab >}}

```typescript
// purchasing-context-wiring.ts — composition root wiring with resilience decorator

export function buildPurchaseOrderRepository(pool: Pool): PurchaseOrderRepository {
  const pgAdapter = new PgPurchaseOrderRepository(pool);
  // => PgPurchaseOrderRepository: the real database adapter — receives SQL calls
  return new ResilientPurchaseOrderRepository(pgAdapter);
  // => ResilientPurchaseOrderRepository: p-retry + opossum decorator wrapping the adapter
  // => The application service injects PurchaseOrderRepository — it never sees either concrete class
}
```

{{< /tab >}}

{{< /tabs >}}

Add the Resilience4j Spring Boot starter to `pom.xml`:

```xml
<!-- Resilience4j Spring Boot 4 starter -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot4</artifactId>
    <!-- => resilience4j-spring-boot4: dedicated Spring Boot 4 starter — published to Maven Central as of v2.4.0 -->
    <version>2.4.0</version>
    <!-- => 2.4.0: explicit pin — Spring Boot 4 BOM does not manage Resilience4j transitively -->
</dependency>
```

**Trade-offs**: the decorator pattern adds two layers of wrapping over every port method call. For high-frequency read operations, the decorator overhead is measurable — profile before adding circuit-breakers to read paths. The payoff is that every port adapter automatically participates in the resilience policy without modifying the application service.

---

## Guide 20 — Observability Adapter via Micrometer Tracing

### Why It Matters

A hexagonal application whose port calls are not traced is a black box in production. When a purchasing manager reports that the PO issuance endpoint is slow, the only way to diagnose it without tracing is to reproduce the slowness in development — expensive and error-prone. An observability decorator wraps port calls with OpenTelemetry-compatible spans — implemented via Micrometer Tracing in Java/Kotlin Spring Boot, the `ActivitySource` API and OpenTelemetry SDK in C# ASP.NET Core, or the `@opentelemetry/api` tracer in TypeScript. The observability adapter follows the same decorator pattern as the resilience decorator in Guide 19: it implements the port interface, wraps each method with a span, delegates to the real adapter, and is wired transparently in the composition root.

### Standard Library First

Each stack provides a built-in high-resolution timer (e.g., `System.nanoTime()`, `Stopwatch`, `performance.now()`) that can measure elapsed duration — but it gives you no distributed trace context, no parent-child span relationship, and no integration with any observability backend:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: manual timing with System.nanoTime()
// Demonstrates the manual timing approach that Micrometer Tracing supersedes.

public class ManualTimingExample {
    // => Illustrative class: wraps a PurchaseOrderRepository with manual nanoTime-based timing
    public void save(PurchaseOrder po) {
        long start = System.nanoTime();
        // => nanoTime(): monotonic clock — suitable for elapsed time, not wall-clock time
        // => No trace context: this duration cannot be correlated with upstream HTTP spans
        try {
            delegate.save(po);
        } finally {
            long elapsed = System.nanoTime() - start;
            System.out.printf("save() took %.2f ms%n", elapsed / 1_000_000.0);
            // => Console output: no structured format, no trace ID, no span ID
            // => No backend integration — the duration is not exported to Jaeger or Grafana Tempo
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: manual timing with System.nanoTime() — Kotlin
// Demonstrates the manual timing approach that Micrometer Tracing supersedes.

class ManualTimingExample(private val delegate: PurchaseOrderRepository) {
    // => Illustrative class: wraps a PurchaseOrderRepository with manual nanoTime-based timing
    fun save(po: PurchaseOrder) {
        val start = System.nanoTime()
        // => nanoTime(): monotonic clock — suitable for elapsed time, not wall-clock time
        // => No trace context: this duration cannot be correlated with upstream HTTP spans
        try {
            delegate.save(po)
        } finally {
            val elapsed = System.nanoTime() - start
            println("save() took %.2f ms".format(elapsed / 1_000_000.0))
            // => Console output: no structured format, no trace ID, no span ID
            // => No backend integration — the duration is not exported to Jaeger or Grafana Tempo
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: manual timing with Stopwatch — C# 12
// Demonstrates the manual timing approach that OpenTelemetry .NET supersedes.

using System.Diagnostics;
// => Stopwatch: BCL high-resolution timer — equivalent to System.nanoTime() in Java

public class ManualTimingExample
{
    // => Illustrative class: wraps a PurchaseOrderRepository with manual Stopwatch-based timing
    public void Save(PurchaseOrder po)
    {
        var sw = Stopwatch.StartNew();
        // => Stopwatch.StartNew(): starts a high-resolution timer — no trace context
        // => No trace context: this duration cannot be correlated with upstream HTTP spans
        try
        {
            _delegate.Save(po);
        }
        finally
        {
            sw.Stop();
            Console.WriteLine($"Save() took {sw.Elapsed.TotalMilliseconds:F2} ms");
            // => Console output: no structured format, no trace ID, no span ID
            // => No backend integration — the duration is not exported to Jaeger or OTLP
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: manual timing with performance.now() — TypeScript
// Demonstrates the manual timing approach that @opentelemetry/sdk-node supersedes.

// performance.now(): high-resolution monotonic clock — no trace context
// No trace context: this duration cannot be correlated with upstream HTTP spans

async function saveWithTiming(delegate: PurchaseOrderRepository, po: PurchaseOrder): Promise {
  // => Illustrative function: wraps save() with manual performance.now()-based timing
  const start = performance.now();
  // => performance.now(): monotonic clock — suitable for elapsed time, not wall-clock time
  try {
    await delegate.save(po);
  } finally {
    const elapsed = performance.now() - start;
    console.log(`save() took ${elapsed.toFixed(2)} ms`);
    // => Console output: no structured format, no trace ID, no span ID
    // => No backend integration — the duration is not exported to Jaeger or Grafana Tempo
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no distributed trace context — spans from different services cannot be stitched into a single trace. No parent-child relationship. No backend integration.

### Production Framework

Micrometer Tracing with the OpenTelemetry bridge wraps port calls with spans that carry a trace ID and are exported to the configured backend. The decorator pattern keeps the tracing concern entirely in the infrastructure layer:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// TracedPurchaseOrderRepository.java — Micrometer Tracing decorator wrapping the output port
package com.procurement.platform.purchasing.infrastructure;

import com.procurement.platform.purchasing.application.PurchaseOrderRepository;
// => Port interface: the decorator implements the same interface — application service is unaware of tracing
import com.procurement.platform.purchasing.domain.PurchaseOrder;
import com.procurement.platform.purchasing.domain.PurchaseOrderId;
import io.micrometer.tracing.Tracer;
// => Tracer: Micrometer Tracing API — creates spans and manages the trace context
import io.micrometer.tracing.Span;
// => Span: represents a single unit of work — carries trace ID, span ID, and tags
import java.util.Optional;

public class TracedPurchaseOrderRepository implements PurchaseOrderRepository {
    // => Implements PurchaseOrderRepository: transparent decorator
    // => Stacks with ResilientPurchaseOrderRepository: wire as Traced(Resilient(Jdbc(...)))

    private final PurchaseOrderRepository delegate;
    private final Tracer tracer;

    public TracedPurchaseOrderRepository(PurchaseOrderRepository delegate, Tracer tracer) {
        this.delegate = delegate;
        this.tracer = tracer;
        // => Both fields are final: immutable after construction — thread-safe for concurrent requests
    }

    @Override
    public PurchaseOrder save(PurchaseOrder po) {
        Span span = tracer.nextSpan().name("purchase-order-repository.save").start();
        // => nextSpan(): creates a child span if a parent trace context is active
        // => name: span name visible in Jaeger / Zipkin — describes the operation
        try (var ignored = tracer.withSpan(span)) {
            span.tag("purchase_order.id", po.id().value().toString());
            // => tag: adds a key-value attribute to the span — visible in trace viewers
            return delegate.save(po);
        } catch (Exception ex) {
            span.error(ex);
            // => error: marks the span as failed and records the exception
            throw ex;
        } finally {
            span.end();
            // => end(): closes the span and reports it to the OpenTelemetry exporter
        }
    }

    @Override
    public Optional<PurchaseOrder> findById(PurchaseOrderId id) {
        Span span = tracer.nextSpan().name("purchase-order-repository.findById").start();
        // => nextSpan(): creates a child span under the current trace if one is active
        try (var ignored = tracer.withSpan(span)) {
            // => withSpan: sets the active span on the current thread for the duration of the try block
            span.tag("purchase_order.id", id.value().toString());
            // => Tag the queried ID: lets operators filter traces for a specific PO
            return delegate.findById(id);
            // => Delegates to the resilient adapter: retry + circuit-breaker apply before the JDBC call
        } catch (Exception ex) {
            span.error(ex);
            // => error(): marks the span as failed and records the exception — visible in Jaeger
            throw ex;
        } finally {
            span.end();
            // => end(): closes the span and flushes it to the OTLP exporter — always called via finally
        }
    }

    @Override
    public boolean existsById(PurchaseOrderId id) {
        Span span = tracer.nextSpan().name("purchase-order-repository.existsById").start();
        // => Span name: "purchase-order-repository.existsById" — distinguishes it from save and findById
        try (var ignored = tracer.withSpan(span)) {
            span.tag("purchase_order.id", id.value().toString());
            // => Tag the checked ID: trace viewers can filter all existsById calls for a given PO
            return delegate.existsById(id);
            // => Delegates to the resilient adapter — the existence check benefits from retry too
        } catch (Exception ex) {
            span.error(ex);
            // => error(): marks the span as errored — the circuit-breaker counts this failure
            throw ex;
        } finally {
            span.end();
            // => end(): span always closed — no leak even when the delegate throws
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// TracedPurchaseOrderRepository.kt — Micrometer Tracing decorator wrapping the output port
package com.procurement.platform.purchasing.infrastructure

import com.procurement.platform.purchasing.application.PurchaseOrderRepository
// => Port interface: the decorator implements the same interface — application service is unaware of tracing
import com.procurement.platform.purchasing.domain.PurchaseOrder
import com.procurement.platform.purchasing.domain.PurchaseOrderId
import io.micrometer.tracing.Tracer
// => Tracer: Micrometer Tracing API — creates spans and manages the trace context
import io.micrometer.tracing.Span
// => Span: represents a single unit of work — carries trace ID, span ID, and tags
import java.util.Optional

class TracedPurchaseOrderRepository(
    private val delegate: PurchaseOrderRepository,
    private val tracer: Tracer
    // => Both fields are immutable after construction — thread-safe for concurrent requests
) : PurchaseOrderRepository {
    // => implements PurchaseOrderRepository: transparent decorator
    // => Stacks with ResilientPurchaseOrderRepository: wire as Traced(Resilient(Jdbc(...)))

    override fun save(po: PurchaseOrder): PurchaseOrder {
        val span: Span = tracer.nextSpan().name("purchase-order-repository.save").start()
        // => nextSpan(): creates a child span if a parent trace context is active
        // => name: span name visible in Jaeger / Zipkin — describes the operation
        tracer.withSpan(span).use {
            span.tag("purchase_order.id", po.id().value().toString())
            // => tag: adds a key-value attribute to the span — visible in trace viewers
            return try {
                delegate.save(po)
            } catch (ex: Exception) {
                span.error(ex)
                // => error: marks the span as failed and records the exception
                throw ex
            } finally {
                span.end()
                // => end(): closes the span and reports it to the OpenTelemetry exporter
            }
        }
    }

    override fun findById(id: PurchaseOrderId): Optional<PurchaseOrder> {
        val span: Span = tracer.nextSpan().name("purchase-order-repository.findById").start()
        // => nextSpan(): creates a child span under the current trace if one is active
        tracer.withSpan(span).use {
            // => withSpan: sets the active span on the current thread for the duration of the use block
            span.tag("purchase_order.id", id.value().toString())
            // => Tag the queried ID: lets operators filter traces for a specific PO
            return try {
                delegate.findById(id)
                // => Delegates to the resilient adapter: retry + circuit-breaker apply before the JDBC call
            } catch (ex: Exception) {
                span.error(ex)
                // => error(): marks the span as failed and records the exception — visible in Jaeger
                throw ex
            } finally {
                span.end()
                // => end(): closes the span and flushes it to the OTLP exporter — always called via finally
            }
        }
    }

    override fun existsById(id: PurchaseOrderId): Boolean {
        val span: Span = tracer.nextSpan().name("purchase-order-repository.existsById").start()
        // => Span name: "purchase-order-repository.existsById" — distinguishes it from save and findById
        tracer.withSpan(span).use {
            span.tag("purchase_order.id", id.value().toString())
            // => Tag the checked ID: trace viewers can filter all existsById calls for a given PO
            return try {
                delegate.existsById(id)
                // => Delegates to the resilient adapter — the existence check benefits from retry too
            } catch (ex: Exception) {
                span.error(ex)
                // => error(): marks the span as errored — the circuit-breaker counts this failure
                throw ex
            } finally {
                span.end()
                // => end(): span always closed — no leak even when the delegate throws
            }
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// TracedPurchaseOrderRepository.cs — OpenTelemetry .NET decorator wrapping the output port
namespace Procurement.Platform.Purchasing.Infrastructure;

using System.Diagnostics;
// => ActivitySource: .NET OpenTelemetry API — creates Activity (span) objects
using Procurement.Platform.Purchasing.Application;
using Procurement.Platform.Purchasing.Domain;
// => Domain types only — the decorator speaks in domain terms, delegates to the real adapter

public class TracedPurchaseOrderRepository : IPurchaseOrderRepository
{
    // => Implements IPurchaseOrderRepository: transparent decorator
    // => Stacks with ResilientPurchaseOrderRepository: wire as Traced(Resilient(AdoNet(...)))

    private static readonly ActivitySource ActivitySource =
        new("procurement.purchasing.repository");
    // => ActivitySource: named after the component — visible in trace UIs as the instrumentation scope
    // => Singleton: one ActivitySource per class — not one per method call

    private readonly IPurchaseOrderRepository _delegate;

    public TracedPurchaseOrderRepository(IPurchaseOrderRepository delegate_)
    {
        _delegate = delegate_;
        // => Immutable after construction — thread-safe for concurrent requests
    }

    public async Task<PurchaseOrder> SaveAsync(PurchaseOrder po)
    {
        using var activity = ActivitySource.StartActivity("purchase-order-repository.save");
        // => StartActivity: creates a child Activity if a parent trace context is active
        // => using var: Activity implements IDisposable — activity.Stop() called on dispose
        activity?.SetTag("purchase_order.id", po.Id.Value.ToString());
        // => SetTag: adds a key-value attribute to the span — visible in Jaeger / OTLP
        try
        {
            return await _delegate.SaveAsync(po);
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            // => SetStatus(Error): marks the Activity as failed — visible in trace viewers
            throw;
        }
        // => activity disposed here by using var — end() equivalent
    }

    public async Task<PurchaseOrder?> FindByIdAsync(PurchaseOrderId id)
    {
        using var activity = ActivitySource.StartActivity("purchase-order-repository.findById");
        // => StartActivity: creates a child Activity under the current trace if one is active
        activity?.SetTag("purchase_order.id", id.Value.ToString());
        // => Tag the queried ID: lets operators filter traces for a specific PO
        try
        {
            return await _delegate.FindByIdAsync(id);
            // => Delegates to the resilient adapter: retry + circuit-breaker apply before the ADO call
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            // => SetStatus: marks the Activity as failed and records the error message
            throw;
        }
    }

    public async Task<bool> ExistsByIdAsync(PurchaseOrderId id)
    {
        using var activity = ActivitySource.StartActivity("purchase-order-repository.existsById");
        // => Activity name distinguishes it from save and findById — queryable in trace UIs
        activity?.SetTag("purchase_order.id", id.Value.ToString());
        // => Tag the checked ID: trace viewers can filter all existsById calls for a given PO
        try
        {
            return await _delegate.ExistsByIdAsync(id);
            // => Delegates to the resilient adapter — the existence check benefits from retry too
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            // => SetStatus: marks the Activity as errored — the circuit-breaker counts this failure
            throw;
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// traced-purchase-order-repository.ts — OpenTelemetry SDK decorator wrapping the output port
import { trace, SpanStatusCode } from "@opentelemetry/api";
// => @opentelemetry/api: OpenTelemetry TS API — creates spans and manages the trace context
// => Equivalent to io.micrometer.tracing.Tracer in the Java version
import type { PurchaseOrderRepository } from "../application/purchase-order-repository";
// => Port interface: the decorator implements the same interface — application service is unaware of tracing
import type { PurchaseOrder } from "../domain/purchase-order";
import type { PurchaseOrderId } from "../domain/purchase-order-id";

const tracer = trace.getTracer("procurement.purchasing.repository");
// => getTracer: returns a Tracer scoped to this instrumentation library
// => Singleton: one Tracer per module — not one per method call

export class TracedPurchaseOrderRepository implements PurchaseOrderRepository {
  // => implements PurchaseOrderRepository: transparent decorator
  // => Stacks with ResilientPurchaseOrderRepository: wire as Traced(Resilient(Pg(...)))

  constructor(private readonly delegate: PurchaseOrderRepository) {}
  // => Both fields are readonly — immutable after construction, thread-safe for concurrent requests

  async save(po: PurchaseOrder): Promise {
    return tracer.startActiveSpan("purchase-order-repository.save", async (span) => {
      // => startActiveSpan: creates a child span if a parent trace context is active
      // => name: span name visible in Jaeger / OTLP backends — describes the operation
      span.setAttribute("purchase_order.id", po.id.value);
      // => setAttribute: adds a key-value attribute to the span — visible in trace viewers
      try {
        return await this.delegate.save(po);
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        // => setStatus(ERROR): marks the span as failed and records the error message
        throw err;
      } finally {
        span.end();
        // => end(): closes the span and reports it to the OTLP exporter — always called via finally
      }
    });
  }

  async findById(id: PurchaseOrderId): Promise {
    return tracer.startActiveSpan("purchase-order-repository.findById", async (span) => {
      // => startActiveSpan: creates a child span under the current trace if one is active
      span.setAttribute("purchase_order.id", id.value);
      // => Tag the queried ID: lets operators filter traces for a specific PO
      try {
        return await this.delegate.findById(id);
        // => Delegates to the resilient adapter: retry + circuit-breaker apply before the pg call
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        // => setStatus(ERROR): marks the span as failed — visible in Jaeger / Grafana Tempo
        throw err;
      } finally {
        span.end();
        // => end(): closes the span and flushes it to the OTLP exporter — always called via finally
      }
    });
  }

  async existsById(id: PurchaseOrderId): Promise {
    return tracer.startActiveSpan("purchase-order-repository.existsById", async (span) => {
      // => Span name distinguishes it from save and findById — queryable in trace UIs
      span.setAttribute("purchase_order.id", id.value);
      // => Tag the checked ID: trace viewers can filter all existsById calls for a given PO
      try {
        return await this.delegate.existsById(id);
        // => Delegates to the resilient adapter — the existence check benefits from retry too
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        // => setStatus: marks the span as errored — the circuit-breaker counts this failure
        throw err;
      } finally {
        span.end();
        // => end(): span always closed — no leak even when the delegate rejects
      }
    });
  }
}
```

{{< /tab >}}

{{< /tabs >}}

The composition root stacks all three decorators in order:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// PurchasingContextConfiguration.java — stacked decorators in the composition root

@Bean
public PurchaseOrderRepository purchaseOrderRepository(JdbcClient jdbc, Tracer tracer) {
    // => Parameters injected by Spring: JdbcClient from auto-config, Tracer from Micrometer auto-config
    var jdbcAdapter = new JdbcPurchaseOrderRepository(jdbc);
    // => Layer 1: the real adapter — performs SQL operations against the PostgreSQL DataSource
    var resilientAdapter = new ResilientPurchaseOrderRepository(jdbcAdapter);
    // => Layer 2: retry + circuit-breaker — retries transient failures, opens circuit on sustained failure
    return new TracedPurchaseOrderRepository(resilientAdapter, tracer);
    // => Layer 3: tracing — wraps the full resilience + adapter stack with a span
    // => Span duration includes retry wait time — visible in trace timelines
    // => Application service injects PurchaseOrderRepository — sees none of the concrete layers
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// PurchasingContextConfiguration.kt — stacked decorators in the composition root

@Bean
fun purchaseOrderRepository(jdbc: JdbcClient, tracer: Tracer): PurchaseOrderRepository {
    // => Parameters injected by Spring: JdbcClient from auto-config, Tracer from Micrometer auto-config
    val jdbcAdapter = JdbcPurchaseOrderRepository(jdbc)
    // => Layer 1: the real adapter — performs SQL operations against the PostgreSQL DataSource
    val resilientAdapter = ResilientPurchaseOrderRepository(jdbcAdapter)
    // => Layer 2: retry + circuit-breaker — retries transient failures, opens circuit on sustained failure
    return TracedPurchaseOrderRepository(resilientAdapter, tracer)
    // => Layer 3: tracing — wraps the full resilience + adapter stack with a span
    // => Span duration includes retry wait time — visible in trace timelines
    // => Application service injects PurchaseOrderRepository — sees none of the concrete layers
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Program.cs — stacked decorators in the composition root

builder.Services.AddScoped<IPurchaseOrderRepository>(sp =>
{
    // => Parameters resolved from DI: NpgsqlDataSource auto-registered, TracerProvider from OTel setup
    var dataSource = sp.GetRequiredService<NpgsqlDataSource>();
    var jdbcAdapter = new AdoNetPurchaseOrderRepository(dataSource);
    // => Layer 1: the real adapter — performs SQL operations against the PostgreSQL DataSource
    var resilientAdapter = new ResilientPurchaseOrderRepository(jdbcAdapter);
    // => Layer 2: retry + circuit-breaker — Polly retries transient failures, opens circuit on sustained
    return new TracedPurchaseOrderRepository(resilientAdapter);
    // => Layer 3: tracing — wraps the full resilience + adapter stack with an OTel Activity
    // => Activity duration includes retry wait time — visible in trace timelines
    // => Application service injects IPurchaseOrderRepository — sees none of the concrete layers
});
```

{{< /tab >}}

{{< tab >}}

```typescript
// purchasing-context-wiring.ts — stacked decorators in the composition root

export function buildPurchaseOrderRepository(pool: Pool): PurchaseOrderRepository {
  // => pool: the pg Pool — injected at application startup from environment configuration
  const pgAdapter = new PgPurchaseOrderRepository(pool);
  // => Layer 1: the real adapter — performs SQL operations against the PostgreSQL connection pool
  const resilientAdapter = new ResilientPurchaseOrderRepository(pgAdapter);
  // => Layer 2: retry + circuit-breaker — p-retry + opossum retries transient failures
  return new TracedPurchaseOrderRepository(resilientAdapter);
  // => Layer 3: tracing — wraps the full resilience + adapter stack with an OTel span
  // => Span duration includes retry wait time — visible in trace timelines
  // => Application service injects PurchaseOrderRepository — sees none of the concrete layers
}
```

{{< /tab >}}

{{< /tabs >}}

Add Micrometer Tracing to `pom.xml`:

```xml
<!-- Micrometer Tracing + OpenTelemetry bridge -->
<dependency>
    <groupId>io.micrometer</groupId>
    <!-- => OTel bridge: translates Micrometer Tracing to OTel spans -->
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
    <!-- => Version managed by spring-boot-starter-parent 4.0.6 BOM -->
</dependency>
<dependency>
    <groupId>io.opentelemetry</groupId>
    <!-- => OTLP exporter: sends spans to Collector, Jaeger, or Tempo -->
    <artifactId>opentelemetry-exporter-otlp</artifactId>
    <!-- => Configure the endpoint in application.properties: management.otlp.tracing.endpoint -->
</dependency>
```

**Trade-offs**: the decorator stack — trace → resilience → JDBC adapter — adds method-call overhead for every port operation. For high-frequency read paths under strict latency constraints, consider sampling via `management.tracing.sampling.probability=0.01` in `application.properties`. The payoff is full distributed trace visibility across services with no changes to the application service or domain layer.

---

## Guide 21 — Domain Event Flow End-to-End

### Why It Matters

Guides 10 and 11 introduced the domain event publisher port and its adapters. This guide traces the complete flow in a single context: the aggregate state change occurs during a command, the application service captures and publishes the event through the publisher port, and a second downstream handler consumes the event and triggers a side-effect. The in-process handler is expressed as a Spring `@EventListener` method in Java/Kotlin, an `INotificationHandler<T>` in C# MediatR, or an `@OnEvent` listener in TypeScript NestJS. Understanding this flow end-to-end is a prerequisite for cross-context event routing (Guide 14) and for deciding when to upgrade from the in-memory adapter to the outbox adapter.

### Standard Library First

A plain callback registry using each stack's functional interface (e.g., `Consumer<T>`, `Action<T>`, or a typed function) requires manual registration and synchronous dispatch with no lifecycle management:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: java.util.function for an in-process event handler
// Demonstrates the stdlib Consumer pattern that the Spring @EventListener supersedes.

import java.util.ArrayList;
// => ArrayList: mutable, unsynchronised — concurrent subscribe() calls corrupt the internal array
import java.util.List;
// => List: the handler registry type — parameterised on Consumer<T>
import java.util.function.Consumer;
// => Consumer<T>: functional interface with accept(T) — the callback invoked on each publish

public class InMemoryBus<T> {
    private final List<Consumer<T>> handlers = new ArrayList<>();
    // => handlers: mutable list — not thread-safe if handlers are registered after startup
    // => No synchronisation: concurrent subscribe() from multiple threads corrupts the list

    public void subscribe(Consumer<T> handler) {
        handlers.add(handler);
        // => Registration is synchronous — all subscribers must register before the first publish
        // => No deduplication: subscribing the same handler twice causes it to run twice per event
    }

    public void publish(T event) {
        for (var handler : handlers) {
            handler.accept(event);
            // => Synchronous dispatch — slow handlers block the event publisher
            // => If a handler throws, remaining handlers are skipped silently
            // => No retry, no dead-letter queue — failed handlers lose the event permanently
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: kotlin.collections for an in-process event handler
// Demonstrates the stdlib handler-registry pattern that the Spring @EventListener supersedes.

import java.util.function.Consumer
// => Consumer<T>: functional interface with accept(T) — the callback invoked on each publish

class InMemoryBus<T> {
    private val handlers = mutableListOf<Consumer<T>>()
    // => handlers: mutable list — not thread-safe if handlers are registered after startup
    // => No synchronisation: concurrent subscribe() from multiple threads corrupts the list

    fun subscribe(handler: Consumer<T>) {
        handlers.add(handler)
        // => Registration is synchronous — all subscribers must register before the first publish
        // => No deduplication: subscribing the same handler twice causes it to run twice per event
    }

    fun publish(event: T) {
        for (handler in handlers) {
            handler.accept(event)
            // => Synchronous dispatch — slow handlers block the event publisher
            // => If a handler throws, remaining handlers are skipped silently
            // => No retry, no dead-letter queue — failed handlers lose the event permanently
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: System.Collections.Generic for an in-process event handler
// Demonstrates the stdlib handler-registry pattern that MediatR / IEventBus supersedes.

using System.Collections.Generic;
// => List<T>: the handler registry type — parameterised on Action<T>

public class InMemoryBus<T>
{
    private readonly List<Action<T>> _handlers = new();
    // => handlers: mutable list — not thread-safe if handlers are registered after startup
    // => No synchronisation: concurrent Subscribe() from multiple threads corrupts the list

    public void Subscribe(Action<T> handler)
    {
        _handlers.Add(handler);
        // => Registration is synchronous — all subscribers must register before the first publish
        // => No deduplication: subscribing the same handler twice causes it to run twice per event
    }

    public void Publish(T eventObj)
    {
        foreach (var handler in _handlers)
        {
            handler(eventObj);
            // => Synchronous dispatch — slow handlers block the event publisher
            // => If a handler throws, remaining handlers are skipped silently
            // => No retry, no dead-letter queue — failed handlers lose the event permanently
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: Array for an in-process event handler
// Demonstrates the stdlib handler-registry pattern that NestJS EventEmitter2 supersedes.

type Handler<T> = (event: T) => void;
// => Handler<T>: callback type — invoked synchronously on each publish

export class InMemoryBus<T> {
  private readonly handlers: Array = [];
  // => handlers: mutable array — not safe if handlers are registered concurrently
  // => No synchronisation: Node.js is single-threaded, but async interleaving can corrupt the list

  subscribe(handler: Handler): void {
    this.handlers.push(handler);
    // => Registration is synchronous — all subscribers must register before the first publish
    // => No deduplication: subscribing the same handler twice causes it to run twice per event
  }

  publish(event: T): void {
    for (const handler of this.handlers) {
      handler(event);
      // => Synchronous dispatch — slow handlers block the event publisher
      // => If a handler throws, remaining handlers are skipped silently
      // => No retry, no dead-letter queue — failed handlers lose the event permanently
    }
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no transaction coordination — the event is published before the aggregate is saved, which means the handler acts on uncommitted data. No retry on handler failure.

### Production Framework

Each stack provides a framework-managed in-process event bus (Spring `ApplicationEventPublisher` with `@EventListener` in Java/Kotlin, MediatR `INotificationHandler<T>` in C#, NestJS `EventEmitter2` with `@OnEvent` in TypeScript). The application service publishes after saving the aggregate — inside the same transaction boundary when the framework supports transactional event dispatch:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// IssuePurchaseOrderServiceImpl.java — publishes event after saving the aggregate
package com.procurement.platform.purchasing.infrastructure;
// => infrastructure/ package: @Service beans live here — they import ports, not vice versa

import com.procurement.platform.purchasing.application.IssuePurchaseOrderService;
// => IssuePurchaseOrderService: application port interface — the @Service must implement it
import com.procurement.platform.purchasing.application.PurchaseOrderIssued;
// => Domain event record: constructed here after the aggregate is saved and the transaction commits
import com.procurement.platform.purchasing.application.PurchaseOrderRepository;
// => Repository output port: the service never imports JdbcPurchaseOrderRepository directly
import com.procurement.platform.purchasing.application.EventPublisher;
// => EventPublisher output port: wired to the outbox or in-process adapter at the composition root
import com.procurement.platform.purchasing.domain.PurchaseOrder;
// => Domain aggregate: all state lives here — the service constructs and passes it to the repository
import com.procurement.platform.purchasing.domain.PurchaseOrderId;
// => Strongly-typed identity: wraps a UUID — prevents passing SupplierId where PurchaseOrderId is expected
import com.procurement.platform.purchasing.domain.PurchaseOrderLine;
// => Line value object: one ordered item — quantity, unit price, product reference
import com.procurement.platform.purchasing.domain.SupplierId;
// => Supplier identity: passed in from the controller — never constructed here from a raw String
import com.procurement.platform.purchasing.domain.PurchaseOrderStatus;
// => Status enum: Draft → AwaitingApproval → Approved → … → Closed — drives all state transitions
import com.procurement.platform.purchasing.domain.ApprovalLevel;
// => ApprovalLevel enum: derived from totalAmount — determines the approver tier for this PO
import org.springframework.stereotype.Service;
// => @Service: Spring registers this bean during component scan; synonym of @Component with semantics
import org.springframework.transaction.annotation.Transactional;
// => @Transactional: Spring wraps the annotated method in a database transaction boundary
import java.math.BigDecimal;
// => BigDecimal: arbitrary-precision arithmetic for currency totals — avoids floating-point rounding
import java.time.Instant;
// => Instant.now(): UTC timestamp attached to domain events — monotonically increasing across replicas
import java.util.List;
// => List<PurchaseOrderLine>: ordered line items passed in from the controller DTO
import java.util.Optional;
// => Optional: return type for findById — absence is a valid outcome, not an error
import java.util.UUID;
// => UUID.randomUUID(): identity generation strategy — client-generated, not database-generated

@Service
// => @Service: Spring discovers this bean via the root-package component scan
public class IssuePurchaseOrderServiceImpl implements IssuePurchaseOrderService {
    // => implements IssuePurchaseOrderService: the compiler verifies all port methods are present

    private final PurchaseOrderRepository repository;
    // => Port interface: wired to the decorated adapter stack (traced → resilient → JDBC)
    private final EventPublisher eventPublisher;
    // => EventPublisher port: wired to the outbox adapter in production

    public IssuePurchaseOrderServiceImpl(PurchaseOrderRepository repository,
            EventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        // => Constructor injection: Spring injects both beans automatically — no @Autowired needed
        // => Both fields are final: immutable after construction — thread-safe for concurrent requests
    }

    @Override
    @Transactional
    // => @Transactional: Spring wraps this method in a database transaction
    // => save() and publish() execute within the same commit boundary when using OutboxEventPublisher
    public PurchaseOrder issue(SupplierId supplierId, List<PurchaseOrderLine> lines)
            throws com.procurement.platform.purchasing.application.DuplicatePurchaseOrderException {
        var id = new PurchaseOrderId(UUID.randomUUID());
        // => PurchaseOrderId: new random UUID — generated in the application service, not in the database
        var totalAmount = new com.procurement.platform.purchasing.domain.Money(
            lines.stream()
                .map(l -> l.unitPrice().amount().multiply(new BigDecimal(l.quantity().value())))
                .reduce(BigDecimal.ZERO, BigDecimal::add),
            lines.isEmpty() ? "USD" : lines.get(0).unitPrice().currency());
        // => totalAmount: sum of all line totals — derived from line items at issuance time
        // => Currency: carried from the first line; if no lines, defaults to "USD"
        var approvalLevel = ApprovalLevel.fromAmount(totalAmount);
        // => approvalLevel: derived from totalAmount — L1 (≤ $1k), L2 (≤ $10k), L3 (> $10k)
        var po = new PurchaseOrder(id, supplierId, lines, totalAmount, approvalLevel, PurchaseOrderStatus.Draft);
        // => Draft status: all new POs begin in Draft — the approval workflow transitions the status
        repository.save(po);
        // => Persist the aggregate first — the event carries the committed state
        // => If save() throws, the transaction rolls back and publish() is never reached
        eventPublisher.publish(new PurchaseOrderIssued(po.id(), po.supplierId(), Instant.now()));
        // => Publish after save: the event payload reflects the committed aggregate
        // => With OutboxEventPublisher: the outbox row and the aggregate row commit atomically
        return po;
        // => Returns the created aggregate: the controller maps it to the response DTO
    }

    @Override
    public Optional<PurchaseOrder> findById(PurchaseOrderId id) {
        return repository.findById(id);
        // => Delegate to the repository port — no event needed for a read operation
        // => Optional.empty() returned when the PO does not exist — the controller maps this to 404
    }

    @Override
    @Transactional
    // => @Transactional: cancel() modifies state — must run within a transaction boundary
    public PurchaseOrder cancel(PurchaseOrderId id)
            throws com.procurement.platform.purchasing.application.PurchaseOrderNotFoundException,
                   com.procurement.platform.purchasing.application.InvalidPurchaseOrderStateException {
        var po = repository.findById(id)
            .orElseThrow(() -> new com.procurement.platform.purchasing.application.PurchaseOrderNotFoundException(id));
        // => orElseThrow: absence maps to a typed domain exception — the controller maps to HTTP 404
        if (po.status() == PurchaseOrderStatus.Paid || po.status() == PurchaseOrderStatus.Closed) {
            throw new com.procurement.platform.purchasing.application.InvalidPurchaseOrderStateException(
                "PurchaseOrder " + id + " cannot be cancelled in status " + po.status());
            // => InvalidPurchaseOrderStateException: typed domain exception — mapped to HTTP 422 globally
        }
        // => Business rule: POs in Paid or Closed state cannot be cancelled
        var cancelled = new PurchaseOrder(po.id(), po.supplierId(), po.lines(),
            po.totalAmount(), po.approvalLevel(), PurchaseOrderStatus.Cancelled);
        // => Immutable update: create a new record with updated status — the original is not mutated
        repository.save(cancelled);
        // => Persist the cancelled aggregate — the save() upserts on conflict
        eventPublisher.publish(new PurchaseOrderCancelled(id, Instant.now()));
        // => PurchaseOrderCancelled: event signals downstream contexts (e.g., receiving) to void GRN expectations
        return cancelled;
        // => Returns the cancelled aggregate: the controller maps it to the response DTO
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// IssuePurchaseOrderServiceImpl.kt — publishes event after saving the aggregate
package com.procurement.platform.purchasing.infrastructure
// => infrastructure/ package: @Service beans live here — they import ports, not vice versa

import com.procurement.platform.purchasing.application.IssuePurchaseOrderService
// => IssuePurchaseOrderService: application port interface — the @Service must implement it
import com.procurement.platform.purchasing.application.PurchaseOrderIssued
// => Domain event record: constructed here after the aggregate is saved and the transaction commits
import com.procurement.platform.purchasing.application.PurchaseOrderRepository
// => Repository output port: the service never imports JdbcPurchaseOrderRepository directly
import com.procurement.platform.purchasing.application.EventPublisher
// => EventPublisher output port: wired to the outbox or in-process adapter at the composition root
import com.procurement.platform.purchasing.domain.PurchaseOrder
// => Domain aggregate: all state lives here — the service constructs and passes it to the repository
import com.procurement.platform.purchasing.domain.PurchaseOrderId
// => Strongly-typed identity: wraps a UUID — prevents passing SupplierId where PurchaseOrderId is expected
import com.procurement.platform.purchasing.domain.PurchaseOrderLine
// => Line value object: one ordered item — quantity, unit price, product reference
import com.procurement.platform.purchasing.domain.SupplierId
// => Supplier identity: passed in from the controller — never constructed here from a raw String
import com.procurement.platform.purchasing.domain.PurchaseOrderStatus
// => Status enum: Draft → AwaitingApproval → Approved → … → Closed — drives all state transitions
import com.procurement.platform.purchasing.domain.ApprovalLevel
// => ApprovalLevel enum: derived from totalAmount — determines the approver tier for this PO
import org.springframework.stereotype.Service
// => @Service: Spring registers this bean during component scan; synonym of @Component with semantics
import org.springframework.transaction.annotation.Transactional
// => @Transactional: Spring wraps the annotated method in a database transaction boundary
import java.math.BigDecimal
// => BigDecimal: arbitrary-precision arithmetic for currency totals — avoids floating-point rounding
import java.time.Instant
// => Instant.now(): UTC timestamp attached to domain events — monotonically increasing across replicas
import java.util.UUID
// => UUID.randomUUID(): identity generation strategy — client-generated, not database-generated

@Service
// => @Service: Spring discovers this bean via the root-package component scan
class IssuePurchaseOrderServiceImpl(
    private val repository: PurchaseOrderRepository,
    // => Port interface: wired to the decorated adapter stack (traced → resilient → JDBC)
    private val eventPublisher: EventPublisher
    // => EventPublisher port: wired to the outbox adapter in production
) : IssuePurchaseOrderService {
    // => implements IssuePurchaseOrderService: the compiler verifies all port methods are present

    @Transactional
    // => @Transactional: Spring wraps this method in a database transaction
    // => save() and publish() execute within the same commit boundary when using OutboxEventPublisher
    override fun issue(supplierId: SupplierId, lines: List<PurchaseOrderLine>): PurchaseOrder {
        val id = PurchaseOrderId(UUID.randomUUID())
        // => PurchaseOrderId: new random UUID — generated in the application service, not in the database
        val totalAmount = com.procurement.platform.purchasing.domain.Money(
            lines.stream()
                .map { l -> l.unitPrice().amount().multiply(BigDecimal(l.quantity().value())) }
                .reduce(BigDecimal.ZERO, BigDecimal::add),
            if (lines.isEmpty()) "USD" else lines[0].unitPrice().currency())
        // => totalAmount: sum of all line totals — derived from line items at issuance time
        val approvalLevel = ApprovalLevel.fromAmount(totalAmount)
        // => approvalLevel: derived from totalAmount — L1 (≤ $1k), L2 (≤ $10k), L3 (> $10k)
        val po = PurchaseOrder(id, supplierId, lines, totalAmount, approvalLevel, PurchaseOrderStatus.Draft)
        // => Draft status: all new POs begin in Draft — the approval workflow transitions the status
        repository.save(po)
        // => Persist the aggregate first — the event carries the committed state
        // => If save() throws, the transaction rolls back and publish() is never reached
        eventPublisher.publish(PurchaseOrderIssued(po.id(), po.supplierId(), Instant.now()))
        // => Publish after save: the event payload reflects the committed aggregate
        // => With OutboxEventPublisher: the outbox row and the aggregate row commit atomically
        return po
        // => Returns the created aggregate: the controller maps it to the response DTO
    }

    override fun findById(id: PurchaseOrderId) = repository.findById(id)
    // => Delegate to the repository port — no event needed for a read operation
    // => Optional.empty() returned when the PO does not exist — the controller maps this to 404

    @Transactional
    // => @Transactional: cancel() modifies state — must run within a transaction boundary
    override fun cancel(id: PurchaseOrderId): PurchaseOrder {
        val po = repository.findById(id)
            .orElseThrow { com.procurement.platform.purchasing.application.PurchaseOrderNotFoundException(id) }
        // => orElseThrow: absence maps to a typed domain exception — the controller maps to HTTP 404
        if (po.status() == PurchaseOrderStatus.Paid || po.status() == PurchaseOrderStatus.Closed) {
            throw com.procurement.platform.purchasing.application.InvalidPurchaseOrderStateException(
                "PurchaseOrder $id cannot be cancelled in status ${po.status()}")
            // => InvalidPurchaseOrderStateException: typed domain exception — mapped to HTTP 422 globally
        }
        // => Business rule: POs in Paid or Closed state cannot be cancelled
        val cancelled = PurchaseOrder(po.id(), po.supplierId(), po.lines(),
            po.totalAmount(), po.approvalLevel(), PurchaseOrderStatus.Cancelled)
        // => Immutable update: create a new record with updated status — the original is not mutated
        repository.save(cancelled)
        // => Persist the cancelled aggregate — the save() upserts on conflict
        eventPublisher.publish(PurchaseOrderCancelled(id, Instant.now()))
        // => PurchaseOrderCancelled: event signals downstream contexts (e.g., receiving) to void GRN expectations
        return cancelled
        // => Returns the cancelled aggregate: the controller maps it to the response DTO
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// IssuePurchaseOrderServiceImpl.cs — publishes event after saving the aggregate
namespace Procurement.Platform.Purchasing.Infrastructure;
// => Infrastructure namespace: service implementations live here — they import ports, not vice versa

using Procurement.Platform.Purchasing.Application;
// => IssuePurchaseOrderService: application port interface — the service must implement it
// => PurchaseOrderIssued: domain event record — constructed after the aggregate is saved
// => IPurchaseOrderRepository: repository output port — service never imports AdoNetPurchaseOrderRepository
// => IEventPublisher: event publisher port — wired to the outbox or in-process adapter
using Procurement.Platform.Purchasing.Domain;
// => Domain aggregate: all state lives here — the service constructs and passes it to the repository
using System;
// => Guid.NewGuid(): identity generation — client-generated, not database-generated
using System.Linq;
// => Linq: .Select and .Sum for computing total amount from line items

public class IssuePurchaseOrderServiceImpl : IIssuePurchaseOrderService
{
    // => Implements IIssuePurchaseOrderService: the compiler verifies all port methods are present

    private readonly IPurchaseOrderRepository _repository;
    // => Port interface: wired to the decorated adapter stack (traced → resilient → ADO.NET)
    private readonly IEventPublisher _eventPublisher;
    // => IEventPublisher port: wired to the outbox adapter in production

    public IssuePurchaseOrderServiceImpl(
        IPurchaseOrderRepository repository, IEventPublisher eventPublisher)
    {
        _repository = repository;
        _eventPublisher = eventPublisher;
        // => Constructor injection: ASP.NET Core DI injects both — no [Inject] attribute needed
        // => Both fields are readonly: immutable after construction — thread-safe for concurrent requests
    }

    public async Task<PurchaseOrder> IssueAsync(SupplierId supplierId, IReadOnlyList<PurchaseOrderLine> lines)
    {
        // => async Task<PurchaseOrder>: non-blocking — does not block a thread during DB I/O
        var id = new PurchaseOrderId(Guid.NewGuid());
        // => PurchaseOrderId: new random Guid — generated in the application service, not the database
        var totalAmount = new Money(
            lines.Sum(l => l.UnitPrice.Amount * l.Quantity.Value), "USD");
        // => totalAmount: sum of all line totals — derived from line items at issuance time
        var approvalLevel = ApprovalLevel.FromAmount(totalAmount);
        // => approvalLevel: derived from totalAmount — L1 (≤ $1k), L2 (≤ $10k), L3 (> $10k)
        var po = new PurchaseOrder(id, supplierId, lines, totalAmount, approvalLevel, PurchaseOrderStatus.Draft);
        // => Draft status: all new POs begin in Draft — the approval workflow transitions the status
        await _repository.SaveAsync(po);
        // => Persist the aggregate first — the event carries the committed state
        // => If SaveAsync throws, the transaction rolls back and PublishAsync is never reached
        await _eventPublisher.PublishAsync(new PurchaseOrderIssued(po.Id, po.SupplierId, DateTimeOffset.UtcNow));
        // => Publish after save: the event payload reflects the committed aggregate
        // => With OutboxEventPublisher: the outbox row and the aggregate row commit atomically
        return po;
        // => Returns the created aggregate: the controller maps it to the response DTO
    }

    public async Task<PurchaseOrder?> FindByIdAsync(PurchaseOrderId id) =>
        await _repository.FindByIdAsync(id);
    // => Delegate to the repository port — no event needed for a read operation
    // => null returned when the PO does not exist — the controller maps this to HTTP 404

    public async Task<PurchaseOrder> CancelAsync(PurchaseOrderId id)
    {
        // => CancelAsync: modifies state — ASP.NET Core uses ambient transactions via DbContext
        var po = await _repository.FindByIdAsync(id)
            ?? throw new PurchaseOrderNotFoundException(id);
        // => Null-coalescing throw: absence maps to a typed domain exception — controller maps to 404
        if (po.Status is PurchaseOrderStatus.Paid or PurchaseOrderStatus.Closed)
            throw new InvalidPurchaseOrderStateException(
                $"PurchaseOrder {id} cannot be cancelled in status {po.Status}");
        // => InvalidPurchaseOrderStateException: typed domain exception — mapped to HTTP 422 globally
        // => Business rule: POs in Paid or Closed state cannot be cancelled
        var cancelled = po with { Status = PurchaseOrderStatus.Cancelled };
        // => Record with-expression: creates a new record with updated status — the original is not mutated
        await _repository.SaveAsync(cancelled);
        // => Persist the cancelled aggregate — SaveAsync upserts on conflict
        await _eventPublisher.PublishAsync(new PurchaseOrderCancelled(id, DateTimeOffset.UtcNow));
        // => PurchaseOrderCancelled: event signals downstream contexts to void GRN expectations
        return cancelled;
        // => Returns the cancelled aggregate: the controller maps it to the response DTO
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// issue-purchase-order-service-impl.ts — publishes event after saving the aggregate
// => infrastructure/ directory: service implementations live here — they import ports, not vice versa

import type { IssuePurchaseOrderService } from "../application/issue-purchase-order-service";
// => Application port interface — the service must implement it
import type { PurchaseOrderRepository } from "../application/purchase-order-repository";
// => Repository output port: the service never imports PgPurchaseOrderRepository directly
import type { EventPublisher } from "../application/event-publisher";
// => EventPublisher output port: wired to the outbox or in-process adapter at the composition root
import { PurchaseOrderIssued } from "../application/purchase-order-issued";
// => Domain event record: constructed after the aggregate is saved
import { PurchaseOrder } from "../domain/purchase-order";
// => Domain aggregate: all state lives here — the service constructs and passes it to the repository
import { PurchaseOrderId } from "../domain/purchase-order-id";
// => Strongly-typed identity: wraps a UUID — prevents passing SupplierId where PurchaseOrderId is expected
import type { PurchaseOrderLine } from "../domain/purchase-order-line";
// => Line value object: one ordered item — quantity, unit price, product reference
import type { SupplierId } from "../domain/supplier-id";
// => Supplier identity: passed in from the controller — never constructed here from a raw string
import { PurchaseOrderStatus } from "../domain/purchase-order-status";
// => Status enum: Draft → AwaitingApproval → Approved → … → Closed
import { ApprovalLevel } from "../domain/approval-level";
// => ApprovalLevel: derived from totalAmount — L1, L2, L3
import { Money } from "../domain/money";
// => Money: value object for monetary amounts — prevents adding USD to EUR

export class IssuePurchaseOrderServiceImpl implements IssuePurchaseOrderService {
  // => implements IssuePurchaseOrderService: TypeScript verifies all port methods are present

  constructor(
    private readonly repository: PurchaseOrderRepository,
    // => Port interface: wired to the decorated adapter stack (traced → resilient → pg)
    private readonly eventPublisher: EventPublisher,
    // => EventPublisher port: wired to the outbox adapter in production
  ) {}

  async issue(supplierId: SupplierId, lines: PurchaseOrderLine[]): Promise {
    const id = new PurchaseOrderId(crypto.randomUUID());
    // => PurchaseOrderId: new random UUID — generated in the application service, not the database
    const totalAmount = new Money(
      lines.reduce((sum, l) => sum + Number(l.unitPrice.amount) * l.quantity.value, 0).toFixed(2),
      lines.length === 0 ? "USD" : lines[0].unitPrice.currency,
    );
    // => totalAmount: sum of all line totals — derived from line items at issuance time
    const approvalLevel = ApprovalLevel.fromAmount(totalAmount);
    // => approvalLevel: derived from totalAmount — L1 (≤ $1k), L2 (≤ $10k), L3 (> $10k)
    const po = new PurchaseOrder(id, supplierId, lines, totalAmount, approvalLevel, PurchaseOrderStatus.Draft);
    // => Draft status: all new POs begin in Draft — the approval workflow transitions the status
    await this.repository.save(po);
    // => Persist the aggregate first — the event carries the committed state
    // => If save() rejects, the transaction rolls back and publish() is never reached
    await this.eventPublisher.publish(new PurchaseOrderIssued(po.id, po.supplierId, new Date()));
    // => Publish after save: the event payload reflects the committed aggregate
    // => With OutboxEventPublisher: the outbox row and the aggregate row commit atomically
    return po;
    // => Returns the created aggregate: the controller maps it to the response DTO
  }

  async findById(id: PurchaseOrderId): Promise {
    return this.repository.findById(id);
    // => Delegate to the repository port — no event needed for a read operation
    // => null returned when the PO does not exist — the controller maps this to HTTP 404
  }

  async cancel(id: PurchaseOrderId): Promise {
    // => cancel: modifies state — must participate in a transaction boundary
    const po = await this.repository.findById(id);
    if (!po) throw new PurchaseOrderNotFoundException(id);
    // => null check: absence maps to a typed domain error — the controller maps to HTTP 404
    if (po.status === PurchaseOrderStatus.Paid || po.status === PurchaseOrderStatus.Closed) {
      throw new InvalidPurchaseOrderStateError(`PurchaseOrder ${id.value} cannot be cancelled in status ${po.status}`);
      // => InvalidPurchaseOrderStateError: typed domain error — mapped to HTTP 422 globally
    }
    // => Business rule: POs in Paid or Closed state cannot be cancelled
    const cancelled = po.withStatus(PurchaseOrderStatus.Cancelled);
    // => withStatus: creates a new PurchaseOrder instance with updated status — immutable update
    await this.repository.save(cancelled);
    // => Persist the cancelled aggregate — save() upserts on conflict
    await this.eventPublisher.publish(new PurchaseOrderCancelled(id, new Date()));
    // => PurchaseOrderCancelled: event signals downstream contexts to void GRN expectations
    return cancelled;
    // => Returns the cancelled aggregate: the controller maps it to the response DTO
  }
}
```

{{< /tab >}}

{{< /tabs >}}

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// PurchaseOrderIssuedEventHandler.java — consumer in the receiving context
package com.procurement.platform.receiving.infrastructure;
// => receiving infrastructure/: the handler lives here — it accesses purchasing via the event record only

import com.procurement.platform.purchasing.application.PurchaseOrderIssued;
// => Import from the purchasing application package only — the handler accesses domain via the event
// => No import from purchasing.domain: the event record carries the data the handler needs
import org.slf4j.Logger;
// => Logger: SLF4J API — decoupled from the underlying implementation (Logback, Log4j2)
import org.slf4j.LoggerFactory;
// => LoggerFactory.getLogger: creates a logger named after this class — appears in log output
import org.springframework.context.event.EventListener;
// => @EventListener: Spring registers this method as a synchronous in-process event consumer
import org.springframework.stereotype.Component;
// => @Component: Spring registers this bean during the receiving context component scan

@Component
// => @Component: Spring discovers this handler — no explicit registration in @Configuration needed
public class PurchaseOrderIssuedEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderIssuedEventHandler.class);
    // => static final: one logger per class — not one per method call

    @EventListener
    // => @EventListener: Spring calls this method when PurchaseOrderIssued is published
    // => The method parameter type determines which event type triggers this handler
    public void onPurchaseOrderIssued(PurchaseOrderIssued event) {
        log.info("Processing PurchaseOrderIssued: poId={} supplierId={}",
            event.purchaseOrderId().value(), event.supplierId().value());
        // => Structured log: PO ID and supplier ID are queryable fields in log aggregation
        // => This handler opens a GRN expectation in the receiving context
        // => A slow handler here blocks the purchasing service HTTP request
        // => Use @Async or upgrade to outbox + relay for async dispatch
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// PurchaseOrderIssuedEventHandler.kt — consumer in the receiving context
package com.procurement.platform.receiving.infrastructure
// => receiving infrastructure/: the handler lives here — it accesses purchasing via the event record only

import com.procurement.platform.purchasing.application.PurchaseOrderIssued
// => Import from the purchasing application package only — the handler accesses domain via the event
// => No import from purchasing.domain: the event record carries the data the handler needs
import org.slf4j.LoggerFactory
// => LoggerFactory.getLogger: creates a logger named after this class — appears in log output
import org.springframework.context.event.EventListener
// => @EventListener: Spring registers this method as a synchronous in-process event consumer
import org.springframework.stereotype.Component
// => @Component: Spring registers this bean during the receiving context component scan

@Component
// => @Component: Spring discovers this handler — no explicit registration in @Configuration needed
class PurchaseOrderIssuedEventHandler {

    private val log = LoggerFactory.getLogger(PurchaseOrderIssuedEventHandler::class.java)
    // => val: one logger per class — not one per method invocation

    @EventListener
    // => @EventListener: Spring calls this method when PurchaseOrderIssued is published
    // => The method parameter type determines which event type triggers this handler
    fun onPurchaseOrderIssued(event: PurchaseOrderIssued) {
        log.info("Processing PurchaseOrderIssued: poId={} supplierId={}",
            event.purchaseOrderId().value(), event.supplierId().value())
        // => Structured log: PO ID and supplier ID are queryable fields in log aggregation
        // => This handler opens a GRN expectation in the receiving context
        // => A slow handler here blocks the purchasing service HTTP request
        // => Use @Async or upgrade to outbox + relay for async dispatch
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// PurchaseOrderIssuedEventHandler.cs — consumer in the receiving context
namespace Procurement.Platform.Receiving.Infrastructure;
// => Receiving.Infrastructure namespace: the handler lives here — accesses purchasing via event record only

using MediatR;
// => INotificationHandler<T>: MediatR in-process event handler — equivalent to Spring @EventListener
using Microsoft.Extensions.Logging;
// => ILogger: structured logging — decoupled from the logging backend (Serilog, NLog)
using Procurement.Platform.Purchasing.Application;
// => Import from the purchasing application package only — the handler accesses domain via the event
// => No import from Purchasing.Domain: the event record carries the data the handler needs

public class PurchaseOrderIssuedEventHandler : INotificationHandler<PurchaseOrderIssued>
{
    // => INotificationHandler<PurchaseOrderIssued>: MediatR dispatches to this handler on Publish
    // => Equivalent to @EventListener on a method with PurchaseOrderIssued parameter

    private readonly ILogger<PurchaseOrderIssuedEventHandler> _logger;
    // => ILogger: one logger per class — not one per method invocation

    public PurchaseOrderIssuedEventHandler(ILogger<PurchaseOrderIssuedEventHandler> logger)
    {
        _logger = logger;
        // => Constructor injection: ASP.NET Core DI wires the logger automatically
    }

    public async Task Handle(PurchaseOrderIssued notification, CancellationToken cancellationToken)
    {
        // => Handle: MediatR calls this method when PurchaseOrderIssued is published
        // => CancellationToken: cancellation propagated from the HTTP request — respects graceful shutdown
        _logger.LogInformation(
            "Processing PurchaseOrderIssued: poId={PoId} supplierId={SupplierId}",
            notification.PurchaseOrderId.Value, notification.SupplierId.Value);
        // => Structured log: PO ID and supplier ID are queryable fields in log aggregation
        // => This handler opens a GRN expectation in the receiving context
        // => A slow handler here blocks the purchasing service HTTP request
        // => Use background service or outbox + relay for async dispatch
        await Task.CompletedTask;
        // => Placeholder: real implementation opens a GRN expectation record
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// purchase-order-issued-event-handler.ts — consumer in the receiving context
// => receiving/infrastructure/ directory: the handler lives here — accesses purchasing via event record only

import { Injectable } from "@nestjs/common";
// => @Injectable: NestJS DI — equivalent to Spring @Component
import { OnEvent } from "@nestjs/event-emitter";
// => @OnEvent: NestJS EventEmitter2 decorator — equivalent to Spring @EventListener
import type { PurchaseOrderIssued } from "../../purchasing/application/purchase-order-issued";
// => Import from the purchasing application package only — the handler accesses domain via the event
// => No import from purchasing/domain: the event record carries the data the handler needs
import { Logger } from "@nestjs/common";
// => Logger: NestJS structured logger — equivalent to SLF4J LoggerFactory

@Injectable()
// => @Injectable: NestJS registers this class as a provider — no explicit registration in a module needed
export class PurchaseOrderIssuedEventHandler {
  private readonly logger = new Logger(PurchaseOrderIssuedEventHandler.name);
  // => Logger: one logger per class — not one per method invocation

  @OnEvent("purchasing.purchase-order-issued")
  // => @OnEvent: NestJS EventEmitter2 calls this method when the event is emitted
  // => The string key determines which event triggers this handler
  handlePurchaseOrderIssued(event: PurchaseOrderIssued): void {
    this.logger.log(
      `Processing PurchaseOrderIssued: poId=${event.purchaseOrderId.value} supplierId=${event.supplierId.value}`,
    );
    // => Structured log: PO ID and supplier ID are queryable fields in log aggregation
    // => This handler opens a GRN expectation in the receiving context
    // => A slow synchronous handler blocks the emitter — use async handler for I/O
    // => Use outbox + relay for cross-process reliable delivery
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Trade-offs**: synchronous in-process dispatch is simple but blocks the application service until all handlers complete. Slow handlers block the HTTP request. Each stack provides an async dispatch mechanism (Spring `@Async`, NestJS async event handlers, C# `IHostedService` background processing) to offload handler work to a separate execution context. For cross-process reliability, replace the in-process publisher with the outbox adapter from Guide 11.

### Domain Event Flow — End-to-End Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Controller as Primary Adapter<br/>(@RestController)
    participant AppService as Application Service<br/>(IssuePurchaseOrderServiceImpl)
    participant Repository as Repository Port<br/>(PurchaseOrderRepository)
    participant Publisher as Event Publisher Port<br/>(EventPublisher)
    participant Handler as Event Handler<br/>(PurchaseOrderIssuedEventHandler)

    Controller->>AppService: issue(supplierId, lines)
    note over AppService: @Transactional — DB transaction opens

    AppService->>AppService: new PurchaseOrder(id, supplierId, lines, ...)
    note over AppService: Aggregate constructed in application layer

    AppService->>Repository: save(purchaseOrder)
    note over Repository: Decorated adapter stack:<br/>traced → resilient → JDBC

    Repository-->>AppService: (PurchaseOrder — saved aggregate)

    AppService->>Publisher: publish(PurchaseOrderIssued)
    note over Publisher: OutboxEventPublisher writes outbox row<br/>in same JDBC transaction

    Publisher->>Handler: onPurchaseOrderIssued(event)
    Handler-->>Publisher: (side-effect complete — GRN expectation opened)

    Publisher-->>AppService: (all handlers finished)
    note over AppService: @Transactional commits — aggregate + outbox row atomically

    AppService-->>Controller: PurchaseOrder (created aggregate)
    Controller-->>Controller: map PurchaseOrder → PurchaseOrderResponse DTO

    note over Controller,Handler: Replace @EventListener with @TransactionalEventListener(AFTER_COMMIT)<br/>to defer handler dispatch until after the DB commit
```

---

## Guide 22 — Hexagonal Anti-Patterns

> **Note on structure**: This guide intentionally omits the Standard Library First → Limitation → Production Framework progression used in all other guides. An anti-patterns catalogue has no meaningful "standard library first" path — the patterns themselves are the subject. The guide uses ANTI-PATTERN → Correction pairs instead, which is the pedagogically appropriate structure for this topic.

### Why It Matters

Anti-patterns accumulate silently in OOP codebases because the compiler does not enforce hexagonal boundaries. An ORM annotation on a domain type — `@Entity` in Java/Kotlin JPA, `[Table]` in C# EF Core, or an entity decorator in TypeScript — a service class that handles HTTP requests and database writes in one method, and an aggregate that holds no behavior: each of these feels harmless in isolation and becomes a migration nightmare at scale. Recognizing these three anti-patterns in `procurement-platform-be` before they take root saves significant refactoring cost later.

### The Leaky Hexagon

The leaky hexagon places framework annotations on domain types. The moment a domain record carries `@Entity`, `@Column`, or `@Table`, the domain layer depends on the ORM framework. Domain unit tests require the ORM on the classpath; switching ORMs touches domain files:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// ANTI-PATTERN: JPA @Entity on a domain record — do not do this
// Demonstrates the leaky-hexagon pattern that the domain records in Guide 3 avoid.

import jakarta.persistence.*;
// => ANTI-PATTERN: ORM import in the domain package
// => jakarta.persistence is a framework dependency — domain tests now require JPA on classpath

@Entity
// => ANTI-PATTERN: @Entity couples the domain aggregate to JPA's entity lifecycle
@Table(name = "purchase_orders", schema = "purchasing")
// => ANTI-PATTERN: the table name is now hardcoded in the domain — changing the schema requires touching domain code
public class PurchaseOrder {
    // => ANTI-PATTERN: class not record — JPA requires a no-arg constructor, preventing record immutability

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    // => ANTI-PATTERN: UUID generation moved to the database — the domain aggregate cannot construct itself
    // => Domain-first design: the aggregate creates its own identity (new PurchaseOrderId(UUID.randomUUID()))
    private java.util.UUID id;

    @Column(nullable = false, precision = 19, scale = 4)
    // => ANTI-PATTERN: column constraint duplicated in the domain — it already lives in V1__create_purchasing_schema.sql
    private java.math.BigDecimal totalAmount;
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// ANTI-PATTERN: JPA @Entity on a domain data class — do not do this
// Demonstrates the leaky-hexagon pattern that the domain records in Guide 3 avoid.

import jakarta.persistence.*
// => ANTI-PATTERN: ORM import in the domain package
// => jakarta.persistence is a framework dependency — domain tests now require JPA on classpath

@Entity
// => ANTI-PATTERN: @Entity couples the domain aggregate to JPA's entity lifecycle
@Table(name = "purchase_orders", schema = "purchasing")
// => ANTI-PATTERN: the table name is now hardcoded in the domain — changing the schema requires touching domain code
data class PurchaseOrder(
    // => ANTI-PATTERN: data class not sealed value type — JPA requires a no-arg constructor

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    // => ANTI-PATTERN: UUID generation moved to the database — the domain aggregate cannot construct itself
    var id: java.util.UUID? = null,

    @Column(nullable = false, precision = 19, scale = 4)
    // => ANTI-PATTERN: column constraint duplicated in the domain — it already lives in V1__create_purchasing_schema.sql
    var totalAmount: java.math.BigDecimal? = null
)
```

{{< /tab >}}

{{< tab >}}

```csharp
// ANTI-PATTERN: EF Core [Table] on a domain entity — do not do this
// Demonstrates the leaky-hexagon pattern that the domain records in Guide 3 avoid.

using System.ComponentModel.DataAnnotations.Schema;
// => ANTI-PATTERN: ORM annotation import in the domain class
// => System.ComponentModel.DataAnnotations is a framework dependency — domain tests now require EF on classpath

[Table("purchase_orders", Schema = "purchasing")]
// => ANTI-PATTERN: [Table] couples the domain entity to EF Core's table mapping
// => The table name is now hardcoded in the domain — changing the schema requires touching domain code
public class PurchaseOrder
{
    // => ANTI-PATTERN: class not record — EF Core requires a public parameterless constructor, breaking immutability

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    // => ANTI-PATTERN: key generation moved to the database — the domain aggregate cannot construct itself
    public Guid? Id { get; set; }

    [Column(TypeName = "numeric(19,4)")]
    // => ANTI-PATTERN: column type duplicated in the domain — it already lives in the EF Core migration
    public decimal? TotalAmount { get; set; }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ANTI-PATTERN: TypeORM @Entity on a domain class — do not do this
// Demonstrates the leaky-hexagon pattern that the domain records in Guide 3 avoid.

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
// => ANTI-PATTERN: ORM import in the domain class
// => typeorm is a framework dependency — domain tests now require TypeORM on the module path

@Entity({ name: "purchase_orders", schema: "purchasing" })
// => ANTI-PATTERN: @Entity couples the domain aggregate to TypeORM's entity lifecycle
// => The table name is now hardcoded in the domain — changing the schema requires touching domain code
export class PurchaseOrder {
  // => ANTI-PATTERN: class not a plain value object — TypeORM requires a no-arg constructor, breaking immutability

  @PrimaryGeneratedColumn("uuid")
  // => ANTI-PATTERN: UUID generation moved to the database — the domain aggregate cannot construct itself
  id?: string;

  @Column({ type: "numeric", precision: 19, scale: 4 })
  // => ANTI-PATTERN: column constraint duplicated in the domain — it already lives in the migration file
  // => Domain-first design: constraints belong in the migration, not on the domain class
  totalAmount?: string;
}
```

{{< /tab >}}

{{< /tabs >}}

**Correction**: the domain layer contains pure Java records with no ORM annotations. The JDBC mapping lives in the adapter in `infrastructure/` with explicit SQL. The domain record can be constructed, validated, and tested with zero ORM dependency.

### The God Adapter

The god adapter is a single Spring `@Service` that performs HTTP request parsing, database operations, domain event publishing, and supplier notification — all in one class:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// ANTI-PATTERN: god adapter — one class doing everything
// Demonstrates the god-adapter pattern that the layered composition root avoids.

import jakarta.servlet.http.HttpServletRequest;
// => ANTI-PATTERN: HTTP concern (presentation layer) imported into a @Service (application layer)
import org.springframework.jdbc.core.simple.JdbcClient;
// => ANTI-PATTERN: infrastructure interface imported directly into the @Service

@org.springframework.stereotype.Service
public class GodPurchaseOrderService {

    private final JdbcClient jdbc;
    // => ANTI-PATTERN: infrastructure adapter (JdbcClient) injected directly into the service
    // => The service now depends on a concrete adapter, not a port interface

    public void issuePurchaseOrder(HttpServletRequest req) {
        // => ANTI-PATTERN: HttpServletRequest in the application layer — HTTP is a presentation concern
        String supplierId = req.getParameter("supplierId");
        // => Parsing HTTP parameters in the application service: the service is now untestable without Servlet API
        jdbc.sql("INSERT INTO purchasing.purchase_orders (id, supplier_id, status) VALUES (:id, :supplierId, 'Draft')")
            .param("id", java.util.UUID.randomUUID())
            .param("supplierId", java.util.UUID.fromString(supplierId))
            .update();
        // => ANTI-PATTERN: the service calls JdbcClient directly — no port interface between them
        // => Direct JDBC access: the application service cannot be tested without a database
        notifySupplier(supplierId);
        // => ANTI-PATTERN: supplier notification in the application service — belongs in an event handler
    }

    private void notifySupplier(String supplierId) { /* ... */ }
    // => ANTI-PATTERN: notification logic inline — no SupplierNotifierPort, no stub, no test coverage
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// ANTI-PATTERN: god adapter — one class doing everything
// Demonstrates the god-adapter pattern that the layered composition root avoids.

import jakarta.servlet.http.HttpServletRequest
// => ANTI-PATTERN: HTTP concern (presentation layer) imported into a @Service (application layer)
import org.springframework.jdbc.core.simple.JdbcClient
// => ANTI-PATTERN: infrastructure interface imported directly into the @Service

@org.springframework.stereotype.Service
class GodPurchaseOrderService(
    private val jdbc: JdbcClient
    // => ANTI-PATTERN: infrastructure adapter (JdbcClient) injected directly into the service
    // => The service now depends on a concrete adapter, not a port interface
) {
    fun issuePurchaseOrder(req: HttpServletRequest) {
        // => ANTI-PATTERN: HttpServletRequest in the application layer — HTTP is a presentation concern
        val supplierId = req.getParameter("supplierId")
        // => Parsing HTTP parameters in the application service: untestable without Servlet API
        jdbc.sql("INSERT INTO purchasing.purchase_orders (id, supplier_id, status) VALUES (:id, :supplierId, 'Draft')")
            .param("id", java.util.UUID.randomUUID())
            .param("supplierId", java.util.UUID.fromString(supplierId))
            .update()
        // => ANTI-PATTERN: the service calls JdbcClient directly — no port interface between them
        // => Direct JDBC access: the application service cannot be tested without a database
        notifySupplier(supplierId)
        // => ANTI-PATTERN: supplier notification in the application service — belongs in an event handler
    }

    private fun notifySupplier(supplierId: String) { /* ... */ }
    // => ANTI-PATTERN: notification logic inline — no SupplierNotifierPort, no stub, no test coverage
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// ANTI-PATTERN: god adapter — one class doing everything
// Demonstrates the god-adapter pattern that the layered composition root avoids.

using Microsoft.AspNetCore.Http;
// => ANTI-PATTERN: HTTP concern (presentation layer) imported into a service (application layer)
using Npgsql;
// => ANTI-PATTERN: infrastructure interface imported directly into the service

public class GodPurchaseOrderService
{
    private readonly NpgsqlDataSource _dataSource;
    // => ANTI-PATTERN: infrastructure adapter (NpgsqlDataSource) injected directly into the service
    // => The service now depends on a concrete adapter, not a port interface

    public GodPurchaseOrderService(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public async Task IssuePurchaseOrder(HttpRequest req)
    {
        // => ANTI-PATTERN: HttpRequest in the application layer — HTTP is a presentation concern
        var supplierId = req.Query["supplierId"].ToString();
        // => Parsing HTTP query parameters in the application service: untestable without HTTP mocks
        await using var conn = await _dataSource.OpenConnectionAsync();
        // => ANTI-PATTERN: the service calls NpgsqlDataSource directly — no port interface between them
        // => Direct ADO.NET access: the application service cannot be tested without a database
        await using var cmd = new NpgsqlCommand(
            "INSERT INTO purchasing.purchase_orders (id, supplier_id, status) VALUES (@id, @sid, 'Draft')", conn);
        cmd.Parameters.AddWithValue("id", Guid.NewGuid());
        cmd.Parameters.AddWithValue("sid", Guid.Parse(supplierId));
        await cmd.ExecuteNonQueryAsync();
        await NotifySupplierAsync(supplierId);
        // => ANTI-PATTERN: supplier notification in the application service — belongs in an event handler
    }

    private Task NotifySupplierAsync(string supplierId) => Task.CompletedTask;
    // => ANTI-PATTERN: notification logic inline — no ISupplierNotifierPort, no stub, no test coverage
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ANTI-PATTERN: god adapter — one class doing everything
// Demonstrates the god-adapter pattern that the layered composition root avoids.

import { Request } from "express";
// => ANTI-PATTERN: HTTP concern (presentation layer) imported into a service (application layer)
import { Pool } from "pg";
// => ANTI-PATTERN: infrastructure dependency imported directly into the service

export class GodPurchaseOrderService {
  private readonly pool: Pool;
  // => ANTI-PATTERN: infrastructure adapter (pg Pool) injected directly into the service
  // => The service now depends on a concrete adapter, not a port interface

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async issuePurchaseOrder(req: Request): Promise {
    // => ANTI-PATTERN: Express Request in the application layer — HTTP is a presentation concern
    const supplierId = req.query["supplierId"] as string;
    // => Parsing HTTP query parameters in the application service: untestable without HTTP mocks
    await this.pool.query(
      "INSERT INTO purchasing.purchase_orders (id, supplier_id, status) VALUES ($1, $2, 'Draft')",
      [crypto.randomUUID(), supplierId],
      // => ANTI-PATTERN: the service calls pg Pool directly — no port interface between them
      // => Direct SQL access: the application service cannot be tested without a database
    );
    await this.notifySupplier(supplierId);
    // => ANTI-PATTERN: supplier notification in the application service — belongs in an event handler
  }

  private async notifySupplier(_supplierId: string): Promise {}
  // => ANTI-PATTERN: notification logic inline — no SupplierNotifierPort, no stub, no test coverage
}
```

{{< /tab >}}

{{< /tabs >}}

**Correction**: the controller handles HTTP request parsing and delegates a command record to the application service. The application service calls the repository through a port interface. Supplier notification is a side-effect triggered by a `PurchaseOrderIssued` event handler (Guide 21). The god adapter becomes three lean classes: one controller, one application service, one event handler.

### The Anemic Domain

The anemic domain places all business logic in application services while domain classes carry only data fields. The domain object becomes a DTO with a class name, and the application service duplicates invariant checks that should live in the aggregate:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// ANTI-PATTERN: anemic domain — data class with zero behavior
// Demonstrates the anemic pattern that the invariant-enforcing PurchaseOrder record in Guide 3 avoids.

public class AnemicPurchaseOrder {
    // => ANTI-PATTERN: plain data class — no validation, no behavior, no invariants
    public java.util.UUID id;
    // => public field: any code can set id to null — no constructor guard
    public java.util.UUID supplierId;
    // => No null guard: supplierId can be null — the PO becomes an orphan with no supplier
    public java.math.BigDecimal totalAmount;
    // => Nullable totalAmount: no domain invariant that total must be non-negative
    public String status;
    // => Plain String status: any value is legal — "PENDING", "pending", "" all compile
    // => AnemicPurchaseOrder can be constructed with all nulls — invalid domain state
}

// The application service carries all logic that the aggregate should own:
public class AnemicPurchaseOrderService {
    // => ANTI-PATTERN: service holds all invariant checks — each check must be repeated in every service method
    public AnemicPurchaseOrder issue(java.util.UUID supplierId, java.math.BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(java.math.BigDecimal.ZERO) < 0) {
            // => ANTI-PATTERN: domain invariant check duplicated in every service method that creates a PO
            // => If a second service method also creates POs, it must repeat this check
            throw new IllegalArgumentException("totalAmount must not be negative");
        }
        var po = new AnemicPurchaseOrder();
        po.id = java.util.UUID.randomUUID();
        // => Manual field assignment: no constructor enforces invariants at object creation
        po.supplierId = supplierId;
        // => supplierId not validated — if null, the PO is silently saved as an orphan
        po.totalAmount = totalAmount;
        po.status = "Draft";
        // => Initial state: not validated by the aggregate — any caller could set "INVALID" before save
        return po;
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// ANTI-PATTERN: anemic domain — data class with zero behavior
// Demonstrates the anemic pattern that the invariant-enforcing PurchaseOrder record in Guide 3 avoids.

data class AnemicPurchaseOrder(
    // => ANTI-PATTERN: plain data class — no validation, no behavior, no invariants
    var id: java.util.UUID? = null,
    // => var field: any code can set id to null — no constructor guard
    var supplierId: java.util.UUID? = null,
    // => No null guard: supplierId can be null — the PO becomes an orphan with no supplier
    var totalAmount: java.math.BigDecimal? = null,
    // => Nullable totalAmount: no domain invariant that total must be non-negative
    var status: String? = null
    // => Plain String status: any value is legal — "PENDING", "pending", "" all compile
    // => AnemicPurchaseOrder can be constructed with all nulls — invalid domain state
)

// The application service carries all logic that the aggregate should own:
class AnemicPurchaseOrderService {
    // => ANTI-PATTERN: service holds all invariant checks — each check must be repeated in every service method
    fun issue(supplierId: java.util.UUID?, totalAmount: java.math.BigDecimal?): AnemicPurchaseOrder {
        if (totalAmount == null || totalAmount < java.math.BigDecimal.ZERO) {
            // => ANTI-PATTERN: domain invariant check duplicated in every service method that creates a PO
            // => If a second service method also creates POs, it must repeat this check
            throw IllegalArgumentException("totalAmount must not be negative")
        }
        return AnemicPurchaseOrder(
            id = java.util.UUID.randomUUID(),
            // => Manual field assignment: no constructor enforces invariants at object creation
            supplierId = supplierId,
            // => supplierId not validated — if null, the PO is silently saved as an orphan
            totalAmount = totalAmount,
            status = "Draft"
            // => Initial state: not validated by the aggregate — any caller could set "INVALID" before save
        )
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// ANTI-PATTERN: anemic domain — mutable class with zero behavior
// Demonstrates the anemic pattern that the invariant-enforcing PurchaseOrder record in Guide 3 avoids.

public class AnemicPurchaseOrder
{
    // => ANTI-PATTERN: plain mutable class — no validation, no behavior, no invariants
    public Guid? Id { get; set; }
    // => Nullable setter: any code can set Id to null — no constructor guard
    public Guid? SupplierId { get; set; }
    // => No null guard: SupplierId can be null — the PO becomes an orphan with no supplier
    public decimal? TotalAmount { get; set; }
    // => Nullable TotalAmount: no domain invariant that total must be non-negative
    public string? Status { get; set; }
    // => Plain string Status: any value is legal — "PENDING", "pending", "" all compile
    // => AnemicPurchaseOrder can be constructed with all nulls — invalid domain state
}

// The application service carries all logic that the aggregate should own:
public class AnemicPurchaseOrderService
{
    // => ANTI-PATTERN: service holds all invariant checks — each check must be repeated in every service method
    public AnemicPurchaseOrder Issue(Guid? supplierId, decimal? totalAmount)
    {
        if (totalAmount == null || totalAmount < 0)
        {
            // => ANTI-PATTERN: domain invariant check duplicated in every service method that creates a PO
            // => If a second service method also creates POs, it must repeat this check
            throw new ArgumentException("totalAmount must not be negative");
        }
        return new AnemicPurchaseOrder
        {
            Id = Guid.NewGuid(),
            // => Manual property assignment: no constructor enforces invariants at object creation
            SupplierId = supplierId,
            // => SupplierId not validated — if null, the PO is silently saved as an orphan
            TotalAmount = totalAmount,
            Status = "Draft"
            // => Initial state: not validated by the aggregate — any caller could set "INVALID" before save
        };
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// ANTI-PATTERN: anemic domain — mutable class with zero behavior
// Demonstrates the anemic pattern that the invariant-enforcing PurchaseOrder record in Guide 3 avoids.

export class AnemicPurchaseOrder {
  // => ANTI-PATTERN: plain mutable class — no validation, no behavior, no invariants
  id?: string;
  // => Optional field: any code can leave id undefined — no constructor guard
  supplierId?: string;
  // => No null guard: supplierId can be undefined — the PO becomes an orphan with no supplier
  totalAmount?: string;
  // => Optional totalAmount: no domain invariant that total must be non-negative
  status?: string;
  // => Plain string status: any value is legal — "PENDING", "pending", "" all compile
  // => AnemicPurchaseOrder can be constructed with all fields undefined — invalid domain state
}

// The application service carries all logic that the aggregate should own:
export class AnemicPurchaseOrderService {
  // => ANTI-PATTERN: service holds all invariant checks — each check must be repeated in every service method
  issue(supplierId: string | undefined, totalAmount: string | undefined): AnemicPurchaseOrder {
    if (!totalAmount || Number(totalAmount) < 0) {
      // => ANTI-PATTERN: domain invariant check duplicated in every service method that creates a PO
      // => If a second service method also creates POs, it must repeat this check
      throw new Error("totalAmount must not be negative");
    }
    const po = new AnemicPurchaseOrder();
    po.id = crypto.randomUUID();
    // => Manual field assignment: no constructor enforces invariants at object creation
    po.supplierId = supplierId;
    // => supplierId not validated — if undefined, the PO is silently saved as an orphan
    po.totalAmount = totalAmount;
    po.status = "Draft";
    // => Initial state: not validated by the aggregate — any caller could set "INVALID" before save
    return po;
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Correction**: domain records declare invariant-enforcing compact constructors (Guide 3). The application service constructs the aggregate by passing raw values; the aggregate validates them. No service method repeats the invariant check — the compiler guarantees that a `PurchaseOrder` record in scope is always valid.

**Trade-offs**: all three anti-patterns feel pragmatic under time pressure. The leaky hexagon saves writing a mapper. The god adapter saves defining port interfaces. The anemic domain saves writing a compact constructor. Each shortcut defers a refactoring cost that compounds with every feature added on top of it. In `procurement-platform-be`, catching these patterns before any bounded context feature is fully implemented is the cheapest moment to correct them.

## Guide 23 — Kubernetes Deployment Topology for `procurement-platform-be`

### Why It Matters

A Kubernetes manifest is not a deployment detail you bolt on after the code works — it is the composition root for the entire hexagonal stack at runtime. The `Deployment` object determines how many adapter instances run concurrently; the `ConfigMap` holds the non-secret wiring that tells the persistence adapter which PostgreSQL host to connect to; the `Secret` holds the credentials that make the adapter authenticate. If these three resources are misaligned, the adapter throws at startup rather than at test time — you find out at 3 AM during a rolling restart rather than during the pre-merge integration test. Writing the manifest before the first production deploy makes the configuration contract explicit, reviewable, and portable across environments — regardless of whether the application reads that configuration via Spring Boot's `application.yml` auto-binding, C# `appsettings.json` with `IOptions<T>`, or NestJS `ConfigModule` in TypeScript.

Health probe endpoints integrate naturally with Kubernetes liveness and readiness probes. The health endpoint path and framework differ per stack — Spring Boot Actuator `/actuator/health` in Java/Kotlin, ASP.NET Core health checks at `/health` in C#, or a Terminus health check controller in TypeScript NestJS — but the Kubernetes probe configuration concept is identical in all cases. A misconfigured probe means Kubernetes either never routes traffic to a healthy pod or restarts a pod that is actually busy finishing a long-running database migration — both outcomes land the on-call engineer in a painful rollback.

### Standard Library First

Environment variables are the lowest-level mechanism for runtime configuration across all stacks. You can start `procurement-platform-be` on any machine by exporting variables manually before launching the process:

```bash
# Standard library: running procurement-platform-be with environment variables only
# Demonstrates the manual environment variable approach that Kubernetes supersedes.

export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST:-localhost}:5432/procurement_dev"
# => SPRING_DATASOURCE_URL: Spring Boot auto-configuration reads this key for the DataSource bean
# => Hardcoding the host/port/database in a script works locally but cannot be committed to version control

export SPRING_DATASOURCE_USERNAME="procurement"
# => SPRING_DATASOURCE_USERNAME: credential read by HikariCP at DataSource construction time
# => Each developer sets this individually — no central secret store, no rotation

export SPRING_DATASOURCE_PASSWORD="procurement"
# => SPRING_DATASOURCE_PASSWORD: plaintext in the shell environment — visible to every child process

java -jar apps/procurement-platform-be/target/procurement-platform-be.jar
# => Starts the Spring Boot application on the default port (8080)
# => No orchestration: one process, one database, no health checks, no pod restart on failure
```

**Limitation for production**: manual environment variables must be set on every machine, are not versioned with the application, and offer no secret rotation. A single missing variable causes the adapter to fail at connection time — `HikariPool-1 - Exception during pool initialization`. No liveness or readiness probe means Kubernetes cannot detect a crashed or overloaded JVM.

### Production Framework

A Kubernetes manifest for `procurement-platform-be` wires the Deployment, Service, ConfigMap, and Secret into a self-documenting topology:

```yaml
# apps/procurement-platform-be/deploy/k8s/configmap.yaml
apiVersion: v1
# => apiVersion: v1 is the stable core API group — ConfigMap is a v1 resource since Kubernetes 1.0
kind: ConfigMap
# => ConfigMap: holds non-secret key-value pairs injected into pods as environment variables
metadata:
  name: procurement-platform-be-config
  # => name: referenced by envFrom.configMapRef.name in the Deployment spec
  namespace: procurement-platform
  # => namespace: isolates procurement-platform-be resources from other services in the cluster
data:
  SPRING_DATASOURCE_URL: "jdbc:postgresql://${DB_HOST:postgres-svc.procurement-platform}:5432/procurement"
  # => Spring Boot reads this key and wires it into the DataSource auto-configuration
  # => postgres-svc.procurement-platform: cluster-internal DNS — <service>.<namespace>.svc.cluster.local
  SERVER_PORT: "8080"
  # => SERVER_PORT: Spring Boot listens on this port inside the container
  MANAGEMENT_SERVER_PORT: "8081"
  # => Separate Actuator port: isolates health and metrics endpoints from application traffic
  # => Access policy: internal load balancer routes 8081 only within the cluster
  SPRING_APPLICATION_NAME: "procurement-platform-be"
  # => service.name: attached to every span in Micrometer Tracing — visible in Jaeger / Tempo
```

```yaml
# apps/procurement-platform-be/deploy/k8s/secret.yaml
# IMPORTANT: Never commit real secret values. Use Sealed Secrets or External Secrets Operator.
apiVersion: v1
# => apiVersion: v1 — Secret is a core resource; same API group as ConfigMap
kind: Secret
metadata:
  name: procurement-platform-be-secrets
  # => name: referenced by envFrom.secretRef.name in the Deployment — must match exactly
  namespace: procurement-platform
type: Opaque
# => Opaque: generic secret type — no schema validation; all values treated as arbitrary bytes
stringData:
  # => stringData: plain-text input; Kubernetes base64-encodes and stores under .data automatically
  SPRING_DATASOURCE_USERNAME: "REPLACE_ME"
  # => REPLACE_ME is a placeholder — a CI linter catches literal "REPLACE_ME" before deployment
  # => In production, populate via Sealed Secrets: kubeseal --raw --from-file=...
  SPRING_DATASOURCE_PASSWORD: "REPLACE_ME"
  # => DataSource password: HikariCP reads this at pool initialization time
  # => Rotate by updating the Secret and performing a rolling restart — no code change required
  BANKING_API_KEY: "REPLACE_ME"
  # => Bank API key: read by the RestClientBankingAdapter at construction time (Guide 18)
  # => Never hardcode API keys — always inject from a Secret at the deployment seam
```

```yaml
# apps/procurement-platform-be/deploy/k8s/deployment.yaml
apiVersion: apps/v1
# => apps/v1: the stable Deployment API group — required for Deployments since Kubernetes 1.9
kind: Deployment
metadata:
  name: procurement-platform-be
  namespace: procurement-platform
spec:
  replicas: 2
  # => 2 replicas: zero-downtime rolling update — one pod serves traffic while the other restarts
  selector:
    matchLabels:
      app: procurement-platform-be
  template:
    metadata:
      labels:
        app: procurement-platform-be
      annotations:
        prometheus.io/scrape: "true"
        # => Prometheus scrape annotation: the Prometheus operator discovers this pod for metric scraping
        prometheus.io/port: "8081"
        # => Actuator port: Prometheus scrapes /actuator/prometheus on the management port
        prometheus.io/path: "/actuator/prometheus"
    spec:
      containers:
        - name: procurement-platform-be
          image: ghcr.io/wahidyankf/procurement-platform-be:latest
          # => OCI image: built by the CI workflow and pushed to GitHub Container Registry
          # => In production, pin to an immutable SHA digest: image: ghcr.io/...@sha256:<digest>
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 8081
              name: management
          envFrom:
            # => envFrom: injects all keys from a ConfigMap or Secret as environment variables
            - configMapRef:
                name: procurement-platform-be-config
            - secretRef:
                name: procurement-platform-be-secrets
          livenessProbe:
            # => livenessProbe: kubelet restarts the container if this probe fails
            httpGet:
              path: /actuator/liveness
              port: 8081
            initialDelaySeconds: 30
            # => 30 s delay: allows Flyway migrations (Guide 26) and Spring context to fully start
            periodSeconds: 15
            failureThreshold: 3
            # => 3 failures × 15 s = 45 s of grace before restart — prevents flapping during GC pauses
          readinessProbe:
            # => readinessProbe: kubelet removes the pod from Service endpoints if this probe fails
            httpGet:
              path: /actuator/readiness
              port: 8081
            initialDelaySeconds: 10
            periodSeconds: 10
          resources:
            requests:
              memory: "256Mi"
              # => 256Mi: conservative heap floor for a Spring Boot JVM at idle
              cpu: "250m"
            limits:
              memory: "512Mi"
              # => Kubernetes OOM-kills the pod if it exceeds 512Mi
              cpu: "1000m"
```

```yaml
# apps/procurement-platform-be/deploy/k8s/service.yaml
apiVersion: v1
# => apiVersion: v1 — Service is a core Kubernetes resource
kind: Service
# => Service: stable network endpoint for the pod replicas — DNS-resolvable cluster-internal address
metadata:
  name: procurement-platform-be-svc
  # => name: DNS name for in-cluster callers — procurement-platform-be-svc.procurement-platform.svc.cluster.local.
  namespace: procurement-platform
  # => namespace: same as the Deployment — Service routes to pods in the same namespace
spec:
  selector:
    app: procurement-platform-be
    # => selector: matches pods with label app=procurement-platform-be from the Deployment template
  ports:
    - name: http
      port: 80
      # => port 80: the cluster-internal port — callers use port 80, pods receive on 8080
      targetPort: 8080
      # => targetPort 8080: routes cluster port 80 to container port 8080
    - name: management
      port: 8081
      targetPort: 8081
      # => management port exposed separately — Prometheus scrapes 8081, not 80
  type: ClusterIP
  # => ClusterIP: reachable within the cluster only — the Ingress resource handles external traffic
```

```mermaid
flowchart LR
    ci["CI workflow\n(build + push OCI image)"]:::orange
    secret["Kubernetes Secret\n(DB password, bank API key)"]:::purple
    cm["Kubernetes ConfigMap\n(DATASOURCE_URL, ports)"]:::teal
    dep["Deployment\n(2 replicas)"]:::blue
    svc["Service\nClusterIP :80 → :8080"]:::brown
    pg["PostgreSQL\n(postgres-svc)"]:::teal
    prom["Prometheus\n(/actuator/prometheus :8081)"]:::orange

    ci -->|"OCI image pull"| dep
    secret -->|"envFrom secretRef"| dep
    cm -->|"envFrom configMapRef"| dep
    dep -->|"HikariCP adapter\nDATASOURCE_URL"| pg
    dep -->|"Prometheus scrape\n:8081"| prom
    svc -->|"routes :80 → pod :8080"| dep

    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
```

**Trade-offs**: `envFrom` with `secretRef` exposes all Secret keys as environment variables — any process inside the container can read them. For stricter isolation, mount the Secret as a volume and read files from `/run/secrets/`; Spring Boot supports file-based property sources via `spring.config.import=optional:file:/run/secrets/`. Kubernetes Secrets are base64-encoded, not encrypted at rest by default; enable etcd encryption at rest and use Sealed Secrets or External Secrets Operator before moving to production.

---

## Guide 24 — Observability Stack at the Deploy Seam: Micrometer Tracing + OTLP + Prometheus

### Why It Matters

Guide 20 showed how an observability decorator wraps individual port calls with spans. At the deployment seam, the concern shifts: where does the collected telemetry go, and which sources does the SDK export? A misconfigured OTLP exporter means you pay the span creation overhead on every request but see nothing in Jaeger or Grafana Tempo. A missing Prometheus scrape configuration means P95 latency regressions on the PO issuance path are invisible until a procurement manager files a support ticket. Getting observability wired correctly before the first production deploy makes the difference between reacting to incidents in seconds and debugging in the dark — and the OTLP export configuration is expressed the same way across all four stacks: environment variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`) injected by the Kubernetes `Deployment` manifest.

The deployment seam also determines the resource attributes attached to every span — `service.name`, `service.version`, and `service.instance.id`. Without them, traces from two pod replicas collide in the trace UI, making it impossible to diagnose which replica produced a slow span. These attributes are set identically via the OpenTelemetry environment-variable protocol regardless of whether the application is a Spring Boot JAR, an ASP.NET Core binary, or a Node.js process.

### Standard Library First

Each runtime ships with built-in process instrumentation APIs (`ManagementFactory` MXBeans on the JVM, `GC`/`Process` on .NET, `process.memoryUsage()` in Node.js). You can print heap usage and thread counts to stdout without any observability framework:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: JVM instrumentation via ManagementFactory
// Demonstrates the JDK management API that Micrometer supersedes for production observability.

import java.lang.management.ManagementFactory;
// => ManagementFactory: JDK entry point for platform MXBeans — no Maven dependency required
import java.lang.management.MemoryMXBean;
// => MemoryMXBean: heap and non-heap usage in bytes — useful but not a trace
import java.lang.management.ThreadMXBean;
// => ThreadMXBean: thread count, peak thread count, daemon threads

public class JvmMetricsDump {
    public static void printMetrics() {
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        long heapUsedMb = memory.getHeapMemoryUsage().getUsed() / (1024 * 1024);
        // => getUsed(): bytes of heap currently used — divided by 1M for readability

        ThreadMXBean threads = ManagementFactory.getThreadMXBean();
        int threadCount = threads.getThreadCount();

        System.out.printf("heap=%dMB threads=%d%n", heapUsedMb, threadCount);
        // => stdout: visible in kubectl logs — no aggregation, no trace correlation
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: JVM instrumentation via ManagementFactory — Kotlin
// Demonstrates the JDK management API that Micrometer supersedes for production observability.

import java.lang.management.ManagementFactory
// => ManagementFactory: JDK entry point for platform MXBeans — no Maven dependency required
import java.lang.management.MemoryMXBean
// => MemoryMXBean: heap and non-heap usage in bytes — useful but not a trace
import java.lang.management.ThreadMXBean
// => ThreadMXBean: thread count, peak thread count, daemon threads

object JvmMetricsDump {
    fun printMetrics() {
        val memory: MemoryMXBean = ManagementFactory.getMemoryMXBean()
        val heapUsedMb = memory.heapMemoryUsage.used / (1024 * 1024)
        // => used: bytes of heap currently used — divided by 1M for readability

        val threads: ThreadMXBean = ManagementFactory.getThreadMXBean()
        val threadCount = threads.threadCount

        println("heap=${heapUsedMb}MB threads=$threadCount")
        // => stdout: visible in kubectl logs — no aggregation, no trace correlation
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: process instrumentation via GC and Environment — C# 12
// Demonstrates the BCL management API that OpenTelemetry .NET Metrics supersedes.

using System;
// => System: BCL root namespace — GC and Environment available without NuGet
using System.Diagnostics;
// => Process: provides working set and thread count — equivalent to ManagementFactory MXBeans

public static class ProcessMetricsDump
{
    public static void PrintMetrics()
    {
        var process = Process.GetCurrentProcess();
        // => GetCurrentProcess: returns metrics for the current .NET process
        long heapUsedMb = GC.GetTotalMemory(forceFullCollection: false) / (1024 * 1024);
        // => GetTotalMemory(false): bytes of managed heap currently used — divided by 1M for readability
        // => forceFullCollection: false — snapshot without triggering GC, unlike forced collection
        int threadCount = process.Threads.Count;
        // => Threads.Count: OS thread count — includes threadpool, GC, and finalizer threads
        Console.WriteLine($"heap={heapUsedMb}MB threads={threadCount}");
        // => stdout: visible in kubectl logs — no aggregation, no trace correlation
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: process instrumentation via Node.js built-ins
// Demonstrates the Node.js built-in API that @opentelemetry/sdk-node supersedes.

// process.memoryUsage(): Node.js built-in — no npm dependency required
// process.env: environment metadata — no OTel SDK required

export function printMetrics(): void {
  const mem = process.memoryUsage();
  // => memoryUsage(): returns heapUsed, heapTotal, rss, external in bytes
  const heapUsedMb = Math.round(mem.heapUsed / (1024 * 1024));
  // => heapUsed: bytes of V8 heap currently used — divided by 1M for readability

  const { cpuUsage } = process;
  // => cpuUsage(): user and system CPU time in microseconds — no trace context
  console.log(`heap=${heapUsedMb}MB`);
  // => stdout: visible in kubectl logs — no aggregation, no trace correlation
  // => No backend integration — the metrics are not exported to Prometheus or OTLP
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: built-in platform metrics are snapshots, not time-series — you cannot compute rate, P95, or trend. No spans means you cannot correlate a slow database query with the HTTP request that triggered it.

### Production Framework

`procurement-platform-be` wires the OpenTelemetry-compatible tracing SDK and the Prometheus metrics registry through the stack's configuration mechanism (Spring Boot auto-configuration in Java/Kotlin, `AddOpenTelemetry` builder in C#, `NodeSDK` in TypeScript):

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// TracingConfig.java — enables Micrometer Tracing sources for procurement-platform-be contexts
package com.procurement.platform.shared.observability;
// => shared/observability/ package: cross-cutting tracing configuration lives here
// => One @Configuration for all bounded contexts — tracing is a shared infrastructure concern

import io.micrometer.tracing.Tracer;
// => Tracer: Micrometer abstraction over the underlying tracing backend (Brave or OTel)
// => Application code imports Tracer — never imports Brave or OpenTelemetry directly
import org.springframework.context.annotation.Bean;
// => @Bean: Spring calls this method and registers the returned object as a singleton bean
import org.springframework.context.annotation.Configuration;
// => @Configuration: Spring registers this class as a bean factory — all @Bean methods are called at startup
import io.micrometer.observation.ObservationRegistry;
// => ObservationRegistry: Micrometer 1.11+ unified observation API — spans and metrics share one entry point

@Configuration
// => @Configuration: Spring discovers this class during the root package component scan
public class TracingConfig {

    @Bean
    public io.micrometer.tracing.brave.bridge.BraveBaggageManager braveBaggageManager() {
        // => BraveBaggageManager: bridges Micrometer baggage API to Brave — required for W3C baggage propagation
        // => W3C baggage: carries trace context across HTTP calls to downstream adapters (bank API)
        // => Without this bean, baggage headers are not propagated through RestClient calls
        return new io.micrometer.tracing.brave.bridge.BraveBaggageManager();
        // => Returns a singleton: Spring Boot injects this into Micrometer's baggage propagator
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// TracingConfig.kt — enables Micrometer Tracing sources for procurement-platform-be contexts
package com.procurement.platform.shared.observability
// => shared/observability/ package: cross-cutting tracing configuration lives here

import io.micrometer.tracing.Tracer
// => Tracer: Micrometer abstraction over the underlying tracing backend (Brave or OTel)
// => Application code imports Tracer — never imports Brave or OpenTelemetry directly
import org.springframework.context.annotation.Bean
// => @Bean: Spring calls this method and registers the returned object as a singleton bean
import org.springframework.context.annotation.Configuration
// => @Configuration: Spring registers this class as a bean factory — all @Bean methods are called at startup
import io.micrometer.observation.ObservationRegistry
// => ObservationRegistry: Micrometer 1.11+ unified observation API — spans and metrics share one entry point

@Configuration
// => @Configuration: Spring discovers this class during the root package component scan
class TracingConfig {

    @Bean
    fun braveBaggageManager(): io.micrometer.tracing.brave.bridge.BraveBaggageManager {
        // => BraveBaggageManager: bridges Micrometer baggage API to Brave — required for W3C baggage propagation
        // => W3C baggage: carries trace context across HTTP calls to downstream adapters (bank API)
        // => Without this bean, baggage headers are not propagated through RestClient calls
        return io.micrometer.tracing.brave.bridge.BraveBaggageManager()
        // => Returns a singleton: Spring Boot injects this into Micrometer's baggage propagator
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// TracingConfig.cs — enables OpenTelemetry .NET tracing for procurement-platform-be
// In Program.cs — configures the OpenTelemetry SDK at application startup

using OpenTelemetry.Resources;
// => ResourceBuilder: sets service.name, service.version, and deployment.environment on every span
using OpenTelemetry.Trace;
// => TracerProvider: the root OTel object — must be disposed at application shutdown
using OpenTelemetry.Exporter;
// => OtlpExportProtocol: HTTP or gRPC OTLP export — configured via environment variables

// Add OpenTelemetry tracing to the DI container
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService(
                serviceName: builder.Configuration["SPRING_APPLICATION_NAME"] ?? "procurement-platform-be",
                // => serviceName: the resource attribute attached to every span — visible in Jaeger / Tempo
                serviceVersion: "1.0.0"
                // => serviceVersion: attached to every span — visible in trace UIs for canary comparisons
            ))
        // => SetResourceBuilder: equivalent to management.otlp.tracing.endpoint in Spring Boot
        .AddAspNetCoreInstrumentation()
        // => AddAspNetCoreInstrumentation: auto-instruments HTTP request/response spans — no manual tracing
        .AddNpgsql()
        // => AddNpgsql: auto-instruments Npgsql database calls — equivalent to Spring's JDBC auto-tracing
        .AddOtlpExporter(otlp =>
        {
            otlp.Endpoint = new Uri(builder.Configuration["MANAGEMENT_OTLP_TRACING_ENDPOINT"]
                ?? "http://localhost:4318/v1/traces");
            // => Endpoint: OTLP/HTTP receiver — overridden by ConfigMap in Kubernetes
            otlp.Protocol = OtlpExportProtocol.HttpProtobuf;
            // => HttpProtobuf: HTTP/protobuf OTLP — use Grpc when TLS is configured
        }));
// => Equivalent to micrometer-tracing-bridge-otel + opentelemetry-exporter-otlp in Spring Boot
```

{{< /tab >}}

{{< tab >}}

```typescript
// tracing-config.ts — enables OpenTelemetry SDK tracing for procurement-platform-be
// Called at application entry point before any other module is imported

import { NodeSDK } from "@opentelemetry/sdk-node";
// => NodeSDK: OpenTelemetry Node.js SDK — equivalent to Spring Boot Micrometer Tracing auto-config
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
// => OTLPTraceExporter: sends spans to the OTLP collector via HTTP — port 4318
import { Resource } from "@opentelemetry/resources";
// => Resource: sets service.name and deployment.environment attributes on every span
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
// => ATTR_SERVICE_NAME: standard semantic convention attribute — "service.name"

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.SPRING_APPLICATION_NAME ?? "procurement-platform-be",
    // => serviceName: the resource attribute attached to every span — visible in Jaeger / Grafana Tempo
    "deployment.environment": process.env.OTEL_RESOURCE_ATTRIBUTES?.split("=")[1] ?? "development",
    // => deployment.environment: filter production vs staging traces in the trace UI
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.MANAGEMENT_OTLP_TRACING_ENDPOINT ?? "http://localhost:4318/v1/traces",
    // => url: OTLP/HTTP receiver — overridden by ConfigMap MANAGEMENT_OTLP_TRACING_ENDPOINT in Kubernetes
    // => Port 4318: OTLP/HTTP — use 4317 for OTLP/gRPC
  }),
});

sdk.start();
// => start(): initializes the SDK and registers the global TracerProvider
// => Must be called before any @opentelemetry/api trace.getTracer() calls
// => Equivalent to micrometer-tracing-bridge-otel auto-configuration in Spring Boot
```

{{< /tab >}}

{{< /tabs >}}

```yaml
# apps/procurement-platform-be/src/main/resources/application.yml (observability section)
management:
  # => management: Spring Boot Actuator configuration section
  endpoints:
    web:
      exposure:
        include: "health,info,prometheus,liveness,readiness"
        # => include: restricts which Actuator endpoints are exposed — principle of least privilege
        # => prometheus: exposes /actuator/prometheus in Prometheus text format
        # => liveness,readiness: the named probe groups consumed by the Kubernetes probes in Guide 23
  metrics:
    export:
      prometheus:
        enabled: true
        # => enabled: activates the Prometheus registry — metrics available at /actuator/prometheus
  tracing:
    sampling:
      probability: 1.0
      # => 1.0 in development: all traces recorded — reduce to 0.1 in production for high-traffic services
      # => Override via MANAGEMENT_TRACING_SAMPLING_PROBABILITY environment variable in ConfigMap

spring:
  application:
    name: "procurement-platform-be"
    # => name: the resource attribute attached to every span — visible in Jaeger and Grafana Tempo

management:
  otlp:
    tracing:
      endpoint: "http://localhost:4318/v1/traces"
      # => localhost fallback: overridden by MANAGEMENT_OTLP_TRACING_ENDPOINT in the Kubernetes ConfigMap
      # => Port 4318: OTLP/HTTP — use 4317 for OTLP/gRPC; HTTP is preferred when TLS is not configured
```

```yaml
# Extend apps/procurement-platform-be/deploy/k8s/configmap.yaml with observability keys
data:
  MANAGEMENT_OTLP_TRACING_ENDPOINT: "http://otel-collector-svc.observability:4318/v1/traces"
  # => otel-collector-svc.observability: service in the "observability" namespace
  MANAGEMENT_TRACING_SAMPLING_PROBABILITY: "0.1"
  # => 0.1: sample 10% of traces in production — reduces storage and CPU overhead under load
  OTEL_RESOURCE_ATTRIBUTES: "deployment.environment=production"
  # => Additional resource attribute: filter production vs staging traces in the trace UI
```

```mermaid
flowchart LR
    req["HTTP request\n(Spring @RestController)"]:::blue
    obs["ObservationRegistry\n(Micrometer)"]:::orange
    trace["Micrometer Tracing\n(Brave bridge)"]:::teal
    metrics["Micrometer Metrics\n(Prometheus registry)"]:::purple
    otlp["OTLP Collector\n(otel-collector-svc :4318)"]:::brown
    prom["Prometheus\n(/actuator/prometheus)"]:::orange

    req -->|"observation.start()"| obs
    obs -->|"span emitted"| trace
    obs -->|"timer recorded"| metrics
    trace -->|"OTLP/HTTP export"| otlp
    metrics -->|"scrape"| prom

    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
```

**Trade-offs**: `management.tracing.sampling.probability: 1.0` captures every span during development but adds measurable overhead above 1000 req/s in production. Reduce to 0.1 and use tail-based sampling in the collector for high-traffic services.

---

## Guide 25 — Failure-Mode Wiring: Degraded Adapters and `HealthIndicator`

### Why It Matters

When the PostgreSQL pod is unhealthy during a rolling restart, you have two choices: fail every request immediately with a 500, or serve degraded responses from a fallback adapter. The hexagonal architecture makes the second choice tractable — because the application service depends on a port interface, not a concrete adapter, you can swap in a degraded adapter at the composition root without touching the domain or application layers. The cached read-model adapter returns the last known state; the null event publisher silently drops events when the broker is unavailable. A health indicator drives the liveness and readiness probes from Guide 23 so Kubernetes removes a degraded pod from rotation — expressed as a Spring `HealthIndicator` in Java/Kotlin, an `IHealthCheck` implementation in C# ASP.NET Core, or a Terminus `HealthIndicator` in TypeScript NestJS.

### Standard Library First

A plain `try-catch` at the controller layer is the minimal fallback available in any stack without a dedicated health framework:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: try-catch fallback at the @RestController level
// Demonstrates the handler-level catch approach that HealthIndicator and degraded adapters supersede.

import org.springframework.http.ResponseEntity;
// => ResponseEntity: wraps HTTP status code + body — used here to return 503 on DB failure
import org.springframework.web.bind.annotation.GetMapping;
// => @GetMapping: maps HTTP GET to listPurchaseOrders()
import org.springframework.web.bind.annotation.RestController;
// => @RestController: Spring bean that serialises return values to JSON

@RestController
// => @RestController: Spring discovers this bean and maps @GetMapping to the URL
public class PurchaseOrderControllerFallback {

    private final com.procurement.platform.purchasing.application.IssuePurchaseOrderService service;
    // => Application service interface — the controller never sees the @Service implementation

    public PurchaseOrderControllerFallback(com.procurement.platform.purchasing.application.IssuePurchaseOrderService service) {
        this.service = service;
        // => Constructor injection: Spring wires the service bean at context startup
    }

    @GetMapping("/api/v1/purchase-orders")
    // => @GetMapping: maps HTTP GET /api/v1/purchase-orders to this method
    public ResponseEntity<?> listPurchaseOrders() {
        try {
            var po = service.findById(null);
            // => findById(null): illustrative only — null ID causes a NullPointerException in production
            return ResponseEntity.ok(po);
        } catch (org.springframework.dao.DataAccessException ex) {
            // => DataAccessException: Spring's DB exception hierarchy — catches all SQL/JDBC failures
            // => Problem: every @RestController method must duplicate this catch block
            return ResponseEntity.status(503).body("Service temporarily unavailable");
            // => No health signal: Kubernetes keeps routing traffic to this pod even when every request fails
            // => No cached response: the caller receives an error, not stale data
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: try-catch fallback at the @RestController level — Kotlin
// Demonstrates the handler-level catch approach that HealthIndicator and degraded adapters supersede.

import org.springframework.http.ResponseEntity
// => ResponseEntity: wraps HTTP status code + body — used here to return 503 on DB failure
import org.springframework.web.bind.annotation.GetMapping
// => @GetMapping: maps HTTP GET to listPurchaseOrders()
import org.springframework.web.bind.annotation.RestController
// => @RestController: Spring bean that serialises return values to JSON

@RestController
// => @RestController: Spring discovers this bean and maps @GetMapping to the URL
class PurchaseOrderControllerFallback(
    private val service: com.procurement.platform.purchasing.application.IssuePurchaseOrderService
    // => Application service interface — the controller never sees the @Service implementation
) {
    @GetMapping("/api/v1/purchase-orders")
    // => @GetMapping: maps HTTP GET /api/v1/purchase-orders to this method
    fun listPurchaseOrders(): ResponseEntity<*> {
        return try {
            val po = service.findById(null)
            // => findById(null): illustrative only — null ID causes a NullPointerException in production
            ResponseEntity.ok(po)
        } catch (ex: org.springframework.dao.DataAccessException) {
            // => DataAccessException: Spring's DB exception hierarchy — catches all SQL/JDBC failures
            // => Problem: every @RestController method must duplicate this catch block
            ResponseEntity.status(503).body("Service temporarily unavailable")
            // => No health signal: Kubernetes keeps routing traffic to this pod even when every request fails
            // => No cached response: the caller receives an error, not stale data
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: try-catch fallback at the controller level — C# 12 / ASP.NET Core 8
// Demonstrates the handler-level catch approach that IHealthCheck and degraded adapters supersede.

using Microsoft.AspNetCore.Mvc;
// => [ApiController]: ASP.NET Core attribute — equivalent to Spring @RestController
// => [HttpGet]: maps HTTP GET to ListPurchaseOrders()

[ApiController]
[Route("api/v1/purchase-orders")]
// => [Route]: sets the route prefix — equivalent to @RequestMapping in Spring
public class PurchaseOrderControllerFallback : ControllerBase
{
    private readonly IIssuePurchaseOrderService _service;
    // => Application service interface — the controller never sees the service implementation

    public PurchaseOrderControllerFallback(IIssuePurchaseOrderService service)
    {
        _service = service;
        // => Constructor injection: ASP.NET Core DI wires the service bean at context startup
    }

    [HttpGet]
    // => [HttpGet]: maps HTTP GET /api/v1/purchase-orders to this method
    public async Task<IActionResult> ListPurchaseOrders()
    {
        try
        {
            var po = await _service.FindByIdAsync(null!);
            // => FindByIdAsync(null): illustrative only — null ID causes NullReferenceException in production
            return Ok(po);
        }
        catch (Npgsql.NpgsqlException ex)
        {
            // => NpgsqlException: ADO.NET DB exception — catches all SQL/connection failures
            // => Problem: every controller action must duplicate this catch block
            return StatusCode(503, "Service temporarily unavailable");
            // => No health signal: Kubernetes keeps routing traffic to this pod even when all requests fail
            // => No cached response: the caller receives an error, not stale data
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: try-catch fallback at the controller level — TypeScript / Express
// Demonstrates the handler-level catch approach that health checks and degraded adapters supersede.

import { Router, Request, Response } from "express";
// => Router: Express routing — equivalent to Spring @RestController with @RequestMapping
import type { IssuePurchaseOrderService } from "../application/issue-purchase-order-service";
// => Application service interface — the controller never sees the service implementation

export function createPurchaseOrderController(service: IssuePurchaseOrderService): Router {
  const router = Router();
  // => Router: Express router — maps HTTP methods to handler functions

  router.get("/api/v1/purchase-orders", async (req: Request, res: Response) => {
    // => router.get: maps HTTP GET /api/v1/purchase-orders to this handler
    try {
      const po = await service.findById(null as any);
      // => findById(null): illustrative only — null ID causes a runtime error in production
      res.json(po);
    } catch (err) {
      // => Generic catch: all errors — DB failures, auth failures, domain errors — handled identically
      // => Problem: every route handler must duplicate this catch block
      res.status(503).json({ message: "Service temporarily unavailable" });
      // => No health signal: the load balancer keeps routing traffic even when all requests fail
      // => No cached response: the caller receives an error, not stale data
    }
  });

  return router;
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: the fallback logic lives in the controller — every controller method must duplicate the catch block. No caching: the fallback returns an error, not stale data. No health signal: Kubernetes keeps routing traffic to the pod even when all requests fail.

### Production Framework

The degraded-mode pattern introduces a `CachedPurchaseOrderReadAdapter` that returns the last-known PO list when the real repository port fails, and a `NullEventPublisher` that silently drops events when the broker is unavailable. A health indicator component exposes the degraded flag to the framework's readiness probe mechanism (Spring Actuator `HealthIndicator` in Java/Kotlin, ASP.NET Core `IHealthCheck` in C#, Terminus health check in TypeScript):

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// CachedPurchaseOrderReadAdapter.java — returns cached PO list when the DB port fails
package com.procurement.platform.purchasing.infrastructure;
// => infrastructure/ package: adapters with framework dependencies live here

import com.procurement.platform.purchasing.application.PurchaseOrderRepository;
// => PurchaseOrderRepository: output port interface — CachedPurchaseOrderReadAdapter satisfies the same interface
import com.procurement.platform.purchasing.domain.PurchaseOrder;
// => PurchaseOrder domain aggregate: stored in the cache snapshot, returned on degraded reads
import com.procurement.platform.purchasing.domain.PurchaseOrderId;
// => PurchaseOrderId: used to filter the cache on findById and existsById calls
import org.springframework.stereotype.Component;
// => @Component: Spring registers this bean — wired at the composition root only in degraded mode
import java.util.List;
// => List<PurchaseOrder>: the full snapshot passed to populateCache by the health-check thread
import java.util.Optional;
// => Optional: return type for findById — absence communicated without null
import java.util.concurrent.CopyOnWriteArrayList;
// => CopyOnWriteArrayList: thread-safe list — cache written by health-check thread, read by request threads
import java.util.concurrent.atomic.AtomicBoolean;
// => AtomicBoolean: lock-free degraded flag — updated by the circuit-breaker callback, read per request

@Component
// => @Component: Spring discovers this bean; the composition root wires it behind the port in degraded mode
public class CachedPurchaseOrderReadAdapter implements PurchaseOrderRepository {
    // => implements PurchaseOrderRepository: satisfies the output port contract

    private final List<PurchaseOrder> cache = new CopyOnWriteArrayList<>();
    // => CopyOnWriteArrayList: snapshot semantics — reads never block writes from the health-check thread

    private final AtomicBoolean degraded = new AtomicBoolean(false);
    // => AtomicBoolean: lock-free — the circuit-breaker callback sets this to true

    public void populateCache(List<PurchaseOrder> snapshot) {
        cache.clear();
        // => clear() first: replaces stale entries atomically before addAll
        cache.addAll(snapshot);
        // => Replaces all entries with the latest snapshot from PostgreSQL
        // => CopyOnWriteArrayList: concurrent readers see the new snapshot after addAll completes
    }

    public void setDegraded(boolean value) {
        degraded.set(value);
        // => AtomicBoolean.set: visible to all threads immediately — no synchronisation block needed
    }

    public boolean isDegraded() {
        return degraded.get();
        // => isDegraded(): read by PurchasingHealthIndicator to determine the Actuator readiness state
    }

    @Override
    public PurchaseOrder save(PurchaseOrder po) {
        if (degraded.get()) {
            throw new com.procurement.platform.purchasing.application.RepositoryException(
                "Writes unavailable in degraded mode", null);
            // => Write operations are not supported in degraded mode — callers receive RepositoryException
            // => The application service propagates this exception to the controller → HTTP 503
        }
        throw new UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active write path");
        // => Normal operation: the JDBC adapter handles writes; this adapter is only active in degraded mode
    }

    @Override
    public Optional<PurchaseOrder> findById(PurchaseOrderId id) {
        if (degraded.get()) {
            return cache.stream().filter(p -> p.id().equals(id)).findFirst();
            // => Degraded mode: return from the cached snapshot without touching the database
            // => findFirst(): returns Optional.empty() when no match — port contract preserved
        }
        throw new UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active read path");
        // => Normal operation: the JDBC adapter handles reads; this adapter is only active in degraded mode
    }

    @Override
    public boolean existsById(PurchaseOrderId id) {
        if (degraded.get()) {
            return cache.stream().anyMatch(p -> p.id().equals(id));
            // => anyMatch: returns false for unknown IDs — callers can still perform existence checks
        }
        throw new UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active read path");
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// CachedPurchaseOrderReadAdapter.kt — returns cached PO list when the DB port fails
package com.procurement.platform.purchasing.infrastructure
// => infrastructure/ package: adapters with framework dependencies live here

import com.procurement.platform.purchasing.application.PurchaseOrderRepository
// => PurchaseOrderRepository: output port interface — CachedPurchaseOrderReadAdapter satisfies the same interface
import com.procurement.platform.purchasing.domain.PurchaseOrder
// => PurchaseOrder domain aggregate: stored in the cache snapshot, returned on degraded reads
import com.procurement.platform.purchasing.domain.PurchaseOrderId
// => PurchaseOrderId: used to filter the cache on findById and existsById calls
import org.springframework.stereotype.Component
// => @Component: Spring registers this bean — wired at the composition root only in degraded mode
import java.util.Optional
// => Optional: return type for findById — absence communicated without null
import java.util.concurrent.CopyOnWriteArrayList
// => CopyOnWriteArrayList: thread-safe list — cache written by health-check thread, read by request threads
import java.util.concurrent.atomic.AtomicBoolean
// => AtomicBoolean: lock-free degraded flag — updated by the circuit-breaker callback, read per request

@Component
// => @Component: Spring discovers this bean; the composition root wires it behind the port in degraded mode
class CachedPurchaseOrderReadAdapter : PurchaseOrderRepository {
    // => implements PurchaseOrderRepository: satisfies the output port contract

    private val cache = CopyOnWriteArrayList<PurchaseOrder>()
    // => CopyOnWriteArrayList: snapshot semantics — reads never block writes from the health-check thread

    private val degraded = AtomicBoolean(false)
    // => AtomicBoolean: lock-free — the circuit-breaker callback sets this to true

    fun populateCache(snapshot: List<PurchaseOrder>) {
        cache.clear()
        // => clear() first: replaces stale entries atomically before addAll
        cache.addAll(snapshot)
        // => Replaces all entries with the latest snapshot from PostgreSQL
        // => CopyOnWriteArrayList: concurrent readers see the new snapshot after addAll completes
    }

    fun setDegraded(value: Boolean) {
        degraded.set(value)
        // => AtomicBoolean.set: visible to all threads immediately — no synchronisation block needed
    }

    fun isDegraded(): Boolean = degraded.get()
    // => isDegraded(): read by PurchasingHealthIndicator to determine the Actuator readiness state

    override fun save(po: PurchaseOrder): PurchaseOrder {
        if (degraded.get()) {
            throw com.procurement.platform.purchasing.application.RepositoryException(
                "Writes unavailable in degraded mode", null)
            // => Write operations are not supported in degraded mode — callers receive RepositoryException
            // => The application service propagates this exception to the controller → HTTP 503
        }
        throw UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active write path")
        // => Normal operation: the JDBC adapter handles writes; this adapter is only active in degraded mode
    }

    override fun findById(id: PurchaseOrderId): Optional<PurchaseOrder> {
        if (degraded.get()) {
            return Optional.ofNullable(cache.firstOrNull { p -> p.id() == id })
            // => Degraded mode: return from the cached snapshot without touching the database
            // => firstOrNull: returns null when no match — wrapped in Optional for port contract
        }
        throw UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active read path")
        // => Normal operation: the JDBC adapter handles reads; this adapter is only active in degraded mode
    }

    override fun existsById(id: PurchaseOrderId): Boolean {
        if (degraded.get()) {
            return cache.any { p -> p.id() == id }
            // => any: returns false for unknown IDs — callers can still perform existence checks
        }
        throw UnsupportedOperationException("CachedPurchaseOrderReadAdapter is not the active read path")
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// CachedPurchaseOrderReadAdapter.cs — returns cached PO list when the DB port fails
namespace Procurement.Platform.Purchasing.Infrastructure;

using System.Collections.Concurrent;
// => ConcurrentBag: thread-safe collection — cache written by health-check thread, read by request threads
using Procurement.Platform.Purchasing.Application;
// => IPurchaseOrderRepository: output port interface — CachedPurchaseOrderReadAdapter satisfies the same interface
using Procurement.Platform.Purchasing.Domain;
// => PurchaseOrder: stored in the cache snapshot, returned on degraded reads

public class CachedPurchaseOrderReadAdapter : IPurchaseOrderRepository
{
    // => Implements IPurchaseOrderRepository: satisfies the output port contract

    private volatile List<PurchaseOrder> _cache = new();
    // => volatile List: snapshot semantics — replaced atomically by PopulateCache; reads see latest snapshot

    private volatile bool _degraded;
    // => volatile bool: lock-free degraded flag — updated by the circuit-breaker callback, read per request

    public void PopulateCache(IReadOnlyList<PurchaseOrder> snapshot)
    {
        _cache = new List<PurchaseOrder>(snapshot);
        // => Atomic replacement: creates a new list and assigns to the volatile field
        // => Concurrent readers see the new snapshot after the assignment completes
    }

    public void SetDegraded(bool value)
    {
        _degraded = value;
        // => volatile write: visible to all threads immediately — no lock needed
    }

    public bool IsDegraded() => _degraded;
    // => IsDegraded(): read by PurchasingHealthCheck to determine the ASP.NET Core health status

    public Task<PurchaseOrder> SaveAsync(PurchaseOrder po)
    {
        if (_degraded)
            throw new RepositoryException("Writes unavailable in degraded mode", null);
        // => Write operations are not supported in degraded mode — callers receive RepositoryException
        // => The application service propagates this exception to the controller → HTTP 503
        throw new InvalidOperationException("CachedPurchaseOrderReadAdapter is not the active write path");
        // => Normal operation: the ADO.NET adapter handles writes; this adapter only active in degraded mode
    }

    public Task<PurchaseOrder?> FindByIdAsync(PurchaseOrderId id)
    {
        if (_degraded)
        {
            var found = _cache.FirstOrDefault(p => p.Id == id);
            // => Degraded mode: return from the cached snapshot without touching the database
            // => FirstOrDefault: returns null when no match — port contract preserved
            return Task.FromResult(found);
        }
        throw new InvalidOperationException("CachedPurchaseOrderReadAdapter is not the active read path");
        // => Normal operation: the ADO.NET adapter handles reads; this adapter only active in degraded mode
    }

    public Task<bool> ExistsByIdAsync(PurchaseOrderId id)
    {
        if (_degraded)
            return Task.FromResult(_cache.Any(p => p.Id == id));
        // => Any: returns false for unknown IDs — callers can still perform existence checks
        throw new InvalidOperationException("CachedPurchaseOrderReadAdapter is not the active read path");
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// cached-purchase-order-read-adapter.ts — returns cached PO list when the DB port fails
// => infrastructure/ directory: adapters with framework dependencies live here

import type { PurchaseOrderRepository } from "../application/purchase-order-repository";
// => Port interface: CachedPurchaseOrderReadAdapter satisfies the same interface as PgPurchaseOrderRepository
import type { PurchaseOrder } from "../domain/purchase-order";
import type { PurchaseOrderId } from "../domain/purchase-order-id";
// => PurchaseOrderId: used to filter the cache on findById and existsById calls

export class CachedPurchaseOrderReadAdapter implements PurchaseOrderRepository {
  // => implements PurchaseOrderRepository: satisfies the output port contract

  private cache: ReadonlyArray = [];
  // => ReadonlyArray: immutable snapshot — replaced atomically by populateCache
  // => Node.js is single-threaded: no CopyOnWriteArrayList needed, but atomicity still matters for async interleaving

  private degraded = false;
  // => degraded flag: set by the circuit-breaker callback, read per request

  populateCache(snapshot: ReadonlyArray): void {
    this.cache = snapshot;
    // => Atomic assignment: replaces the entire snapshot — concurrent readers see the new array
  }

  setDegraded(value: boolean): void {
    this.degraded = value;
    // => Synchronous assignment: visible immediately — no lock needed in single-threaded Node.js
  }

  isDegraded(): boolean {
    return this.degraded;
    // => isDegraded(): read by the health-check middleware to determine the readiness probe state
  }

  async save(_po: PurchaseOrder): Promise {
    if (this.degraded) {
      throw new RepositoryError("Writes unavailable in degraded mode");
      // => Write operations are not supported in degraded mode — callers receive RepositoryError
      // => The application service propagates this to the controller → HTTP 503
    }
    throw new Error("CachedPurchaseOrderReadAdapter is not the active write path");
    // => Normal operation: the pg adapter handles writes; this adapter is only active in degraded mode
  }

  async findById(id: PurchaseOrderId): Promise {
    if (this.degraded) {
      return this.cache.find((p) => p.id.value === id.value) ?? null;
      // => Degraded mode: return from the cached snapshot without touching the database
      // => find + null coalescing: returns null when no match — port contract preserved
    }
    throw new Error("CachedPurchaseOrderReadAdapter is not the active read path");
    // => Normal operation: the pg adapter handles reads; this adapter is only active in degraded mode
  }

  async existsById(id: PurchaseOrderId): Promise {
    if (this.degraded) {
      return this.cache.some((p) => p.id.value === id.value);
      // => some: returns false for unknown IDs — callers can still perform existence checks
    }
    throw new Error("CachedPurchaseOrderReadAdapter is not the active read path");
  }
}
```

{{< /tab >}}

{{< /tabs >}}

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// NullEventPublisher.java — silently drops events when the broker port is unavailable
package com.procurement.platform.purchasing.infrastructure;
// => infrastructure/ package: the null adapter lives here — same package as OutboxEventPublisher

import com.procurement.platform.purchasing.application.EventPublisher;
// => EventPublisher: the output port interface — NullEventPublisher satisfies it with a no-op body
import com.procurement.platform.purchasing.application.PurchaseOrderIssued;
// => Domain event record: the publisher receives it but does not relay it to the broker
import com.procurement.platform.purchasing.application.PurchaseOrderCancelled;
// => Second event type: also dropped silently — the null adapter handles all EventPublisher overloads
import org.slf4j.Logger;
// => SLF4J Logger API — decoupled from the logging backend (Logback, Log4j2)
import org.slf4j.LoggerFactory;
// => LoggerFactory.getLogger: creates a logger bound to this class name
import org.springframework.stereotype.Component;
// => @Component: Spring registers this bean — wired at the composition root only in degraded mode

@Component
// => @Component: Spring discovers this bean; the composition root wires it instead of OutboxEventPublisher
public class NullEventPublisher implements EventPublisher {
    // => Null object pattern: replaces the real adapter without changing the application service

    private static final Logger log = LoggerFactory.getLogger(NullEventPublisher.class);
    // => static final: one logger per class — not one per method invocation

    @Override
    public void publish(PurchaseOrderIssued event) {
        log.warn("Null event publisher: dropping PurchaseOrderIssued {} — outbox unavailable",
            event.purchaseOrderId().value());
        // => WARN level: not an error (the system degrades gracefully), but not silent — visible in the trace
        // => Silent drop: the application service proceeds as if the event was published
        // => At-least-once guarantee is lost — switch to an outbox adapter to preserve delivery
        // => Downstream contexts (receiving) will not receive the PurchaseOrderIssued signal during outage
    }

    @Override
    public void publish(PurchaseOrderCancelled event) {
        log.warn("Null event publisher: dropping PurchaseOrderCancelled {} — outbox unavailable",
            event.purchaseOrderId().value());
        // => Same null-object behaviour for the cancellation event — both overloads must be implemented
        // => WARN logged for observability: log aggregation shows the volume of dropped events during outage
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// NullEventPublisher.kt — silently drops events when the broker port is unavailable
package com.procurement.platform.purchasing.infrastructure
// => infrastructure/ package: the null adapter lives here — same package as OutboxEventPublisher

import com.procurement.platform.purchasing.application.EventPublisher
// => EventPublisher: the output port interface — NullEventPublisher satisfies it with a no-op body
import com.procurement.platform.purchasing.application.PurchaseOrderIssued
// => Domain event record: the publisher receives it but does not relay it to the broker
import com.procurement.platform.purchasing.application.PurchaseOrderCancelled
// => Second event type: also dropped silently — the null adapter handles all EventPublisher overloads
import org.slf4j.LoggerFactory
// => SLF4J Logger API — decoupled from the logging backend (Logback, Log4j2)
import org.springframework.stereotype.Component
// => @Component: Spring registers this bean — wired at the composition root only in degraded mode

@Component
// => @Component: Spring discovers this bean; the composition root wires it instead of OutboxEventPublisher
class NullEventPublisher : EventPublisher {
    // => Null object pattern: replaces the real adapter without changing the application service

    private val log = LoggerFactory.getLogger(NullEventPublisher::class.java)
    // => val: one logger per class — not one per method invocation

    override fun publish(event: PurchaseOrderIssued) {
        log.warn("Null event publisher: dropping PurchaseOrderIssued {} — outbox unavailable",
            event.purchaseOrderId().value())
        // => WARN level: not an error (the system degrades gracefully), but not silent — visible in the trace
        // => Silent drop: the application service proceeds as if the event was published
        // => At-least-once guarantee is lost — switch to an outbox adapter to preserve delivery
        // => Downstream contexts (receiving) will not receive the PurchaseOrderIssued signal during outage
    }

    override fun publish(event: PurchaseOrderCancelled) {
        log.warn("Null event publisher: dropping PurchaseOrderCancelled {} — outbox unavailable",
            event.purchaseOrderId().value())
        // => Same null-object behaviour for the cancellation event — both overloads must be implemented
        // => WARN logged for observability: log aggregation shows the volume of dropped events during outage
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// NullEventPublisher.cs — silently drops events when the broker port is unavailable
namespace Procurement.Platform.Purchasing.Infrastructure;

using Microsoft.Extensions.Logging;
// => ILogger: structured logging — decoupled from the logging backend (Serilog, NLog)
using Procurement.Platform.Purchasing.Application;
// => IEventPublisher: the output port interface — NullEventPublisher satisfies it with no-op implementations
// => PurchaseOrderIssued, PurchaseOrderCancelled: domain events — received but not relayed

public class NullEventPublisher : IEventPublisher
{
    // => Null object pattern: replaces the real adapter without changing the application service

    private readonly ILogger<NullEventPublisher> _logger;
    // => ILogger: one logger per class — not one per method invocation

    public NullEventPublisher(ILogger<NullEventPublisher> logger)
    {
        _logger = logger;
        // => Constructor injection: ASP.NET Core DI wires the logger automatically
    }

    public Task PublishAsync(PurchaseOrderIssued @event)
    {
        _logger.LogWarning(
            "Null event publisher: dropping PurchaseOrderIssued {PoId} — outbox unavailable",
            @event.PurchaseOrderId.Value);
        // => LogWarning: not an error (the system degrades gracefully), but not silent — visible in traces
        // => Silent drop: the application service proceeds as if the event was published
        // => At-least-once guarantee is lost — switch to an outbox adapter to preserve delivery
        return Task.CompletedTask;
        // => No-op: the event is acknowledged but not relayed — equivalent to the Java no-op body
    }

    public Task PublishAsync(PurchaseOrderCancelled @event)
    {
        _logger.LogWarning(
            "Null event publisher: dropping PurchaseOrderCancelled {PoId} — outbox unavailable",
            @event.PurchaseOrderId.Value);
        // => Same null-object behaviour for the cancellation event — both overloads must be implemented
        // => LogWarning: log aggregation shows the volume of dropped events during outage
        return Task.CompletedTask;
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// null-event-publisher.ts — silently drops events when the broker port is unavailable
// => infrastructure/ directory: the null adapter lives here — same directory as outbox-event-publisher.ts

import type { EventPublisher } from "../application/event-publisher";
// => EventPublisher: the output port interface — NullEventPublisher satisfies it with no-op implementations
import type { PurchaseOrderIssued } from "../application/purchase-order-issued";
// => Domain event record: the publisher receives it but does not relay it to the broker
import type { PurchaseOrderCancelled } from "../application/purchase-order-cancelled";
// => Second event type: also dropped silently — the null adapter handles all EventPublisher overloads
import { logger } from "../shared/logger";
// => logger: structured logger (pino or winston) — decoupled from the logging backend

export class NullEventPublisher implements EventPublisher {
  // => Null object pattern: replaces the real adapter without changing the application service

  async publish(event: PurchaseOrderIssued | PurchaseOrderCancelled): Promise {
    // => Single overload: TypeScript union type handles both event types in one method
    if ("purchaseOrderId" in event) {
      logger.warn(
        { purchaseOrderId: event.purchaseOrderId.value },
        "Null event publisher: dropping event — outbox unavailable",
      );
      // => WARN level: not an error (the system degrades gracefully), but not silent — visible in traces
      // => Silent drop: the application service proceeds as if the event was published
      // => At-least-once guarantee is lost — switch to an outbox adapter to preserve delivery
      // => Downstream contexts (receiving) will not receive the event signal during outage
    }
    // => No-op: the event is acknowledged but not relayed — log aggregation tracks the volume of drops
  }
}
```

{{< /tab >}}

{{< /tabs >}}

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// PurchasingHealthIndicator.java — drives liveness/readiness probes via the degraded flag
package com.procurement.platform.purchasing.infrastructure;

import org.springframework.boot.actuate.health.Health;
// => Health: Spring Actuator result object — UP/DOWN with optional detail map
import org.springframework.boot.actuate.health.HealthIndicator;
// => HealthIndicator: Spring Actuator interface — implementations appear in /actuator/health response
import org.springframework.stereotype.Component;

@Component("purchasingHealth")
// => "purchasingHealth": the bean name determines the key under "components" in /actuator/health JSON
public class PurchasingHealthIndicator implements HealthIndicator {

    private final CachedPurchaseOrderReadAdapter cachedAdapter;
    // => CachedPurchaseOrderReadAdapter: the degraded flag lives here — the indicator reads it

    public PurchasingHealthIndicator(CachedPurchaseOrderReadAdapter cachedAdapter) {
        this.cachedAdapter = cachedAdapter;
        // => Same bean: both PurchasingHealthIndicator and the composition root share the AtomicBoolean state
    }

    @Override
    public Health health() {
        // => Called by Actuator for /actuator/health, /actuator/readiness, and /actuator/liveness
        if (cachedAdapter.isDegraded()) {
            return Health.down()
                // => Health.down(): Actuator returns HTTP 503 for the readiness group — Kubernetes removes pod
                .withDetail("reason", "DataSource health check failed — serving from cache")
                .build();
        }
        return Health.up().build();
        // => Health.up(): Actuator returns HTTP 200 — Kubernetes routes traffic to pod
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// PurchasingHealthIndicator.kt — drives liveness/readiness probes via the degraded flag
package com.procurement.platform.purchasing.infrastructure

import org.springframework.boot.actuate.health.Health
// => Health: Spring Actuator result object — UP/DOWN with optional detail map
import org.springframework.boot.actuate.health.HealthIndicator
// => HealthIndicator: Spring Actuator interface — implementations appear in /actuator/health response
import org.springframework.stereotype.Component

@Component("purchasingHealth")
// => "purchasingHealth": the bean name determines the key under "components" in /actuator/health JSON
class PurchasingHealthIndicator(
    private val cachedAdapter: CachedPurchaseOrderReadAdapter
    // => CachedPurchaseOrderReadAdapter: the degraded flag lives here — the indicator reads it
) : HealthIndicator {

    override fun health(): Health {
        // => Called by Actuator for /actuator/health, /actuator/readiness, and /actuator/liveness
        if (cachedAdapter.isDegraded()) {
            return Health.down()
                // => Health.down(): Actuator returns HTTP 503 for the readiness group — Kubernetes removes pod
                .withDetail("reason", "DataSource health check failed — serving from cache")
                .build()
        }
        return Health.up().build()
        // => Health.up(): Actuator returns HTTP 200 — Kubernetes routes traffic to pod
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// PurchasingHealthCheck.cs — drives liveness/readiness probes via the degraded flag
namespace Procurement.Platform.Purchasing.Infrastructure;

using Microsoft.Extensions.Diagnostics.HealthChecks;
// => IHealthCheck: ASP.NET Core health check interface — equivalent to Spring HealthIndicator
using System.Threading;
using System.Threading.Tasks;

public class PurchasingHealthCheck : IHealthCheck
{
    // => Implements IHealthCheck: registered with AddCheck<T>() in Program.cs
    // => Appears in /health/ready and /health/live probe responses

    private readonly CachedPurchaseOrderReadAdapter _cachedAdapter;
    // => CachedPurchaseOrderReadAdapter: the degraded flag lives here — the check reads it

    public PurchasingHealthCheck(CachedPurchaseOrderReadAdapter cachedAdapter)
    {
        _cachedAdapter = cachedAdapter;
        // => Same bean: both PurchasingHealthCheck and the composition root share the volatile bool
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        // => Called by ASP.NET Core for /health, /health/ready, and /health/live probes
        if (_cachedAdapter.IsDegraded())
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "DataSource health check failed — serving from cache"));
            // => Unhealthy: ASP.NET Core returns HTTP 503 for the readiness group — Kubernetes removes pod
        }
        return Task.FromResult(HealthCheckResult.Healthy());
        // => Healthy: ASP.NET Core returns HTTP 200 — Kubernetes routes traffic to pod
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// purchasing-health-check.ts — drives liveness/readiness probes via the degraded flag
// => infrastructure/ directory: health checks live here — framework-aware probe implementations

import type { CachedPurchaseOrderReadAdapter } from "./cached-purchase-order-read-adapter";
// => CachedPurchaseOrderReadAdapter: the degraded flag lives here — the health check reads it

export interface HealthCheckResult {
  status: "up" | "down";
  // => status: "up" returns HTTP 200; "down" returns HTTP 503 from the health middleware
  details?: Record;
  // => details: optional detail map — visible in the /health response body for debugging
}

export class PurchasingHealthCheck {
  // => Registered with the health check middleware — called for /health/live and /health/ready routes

  constructor(private readonly cachedAdapter: CachedPurchaseOrderReadAdapter) {}
  // => CachedPurchaseOrderReadAdapter: shared between this check and the composition root

  check(): HealthCheckResult {
    // => Called by the health check middleware for /health, /health/live, and /health/ready probes
    if (this.cachedAdapter.isDegraded()) {
      return {
        status: "down",
        // => "down": health middleware returns HTTP 503 for the readiness probe — Kubernetes removes pod
        details: { reason: "DataSource health check failed — serving from cache" },
        // => details: visible in the /health response body — aids debugging during outage
      };
    }
    return { status: "up" };
    // => "up": health middleware returns HTTP 200 — Kubernetes routes traffic to pod
  }
}
```

{{< /tab >}}

{{< /tabs >}}

**Trade-offs**: the cached read adapter serves stale data — clients receive a response that may be minutes old during a PostgreSQL outage. For a PO listing, staleness is acceptable; for a financial payment ledger it is not. The null event publisher silently drops domain events — if at-least-once delivery is a hard requirement, replace it with an in-memory buffer that replays to the outbox when the broker recovers.

---

## Guide 26 — Flyway Migration at Deploy Time: Kubernetes Job vs `ApplicationRunner`

### Why It Matters

Guide 17 introduced schema migration as a hexagonal concern. At the deployment seam, the wiring question is: when does the migration run relative to pod startup, and which mechanism owns the migration lifecycle? Running the migration library inside the application bootstrap (Flyway in Java/Kotlin Spring Boot, EF Core `MigrateAsync` in C#, or `node-pg-migrate` in TypeScript) means every replica races to apply migrations during a rolling restart — a potential for migration conflicts on `ALTER TABLE` statements. Running the migration as a Kubernetes `Job` before the `Deployment` rolls means the schema is stable before any pod starts, but a failed job blocks the entire rollout. Choosing the wrong strategy causes a database-level lock that holds the deployment in progress for ten minutes while the on-call engineer investigates.

### Standard Library First

`java.sql.Connection` can execute DDL directly without a migration framework — the raw JDBC approach:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: DDL execution via JDBC Connection
// Demonstrates the manual DDL approach that Flyway supersedes.

import java.sql.Connection;
// => Connection: JDBC connection to the database — must be closed after use or the pool leaks
import java.sql.DriverManager;
// => DriverManager: JDBC entry point — finds a registered driver matching the URL scheme
import java.sql.SQLException;
// => SQLException: checked exception on every JDBC operation — callers must handle or declare throws

public class ManualSchemaMigration {
    public static void main(String[] args) throws SQLException {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        // => Reads the JDBC URL from an environment variable — must be set before this runs
        // => Returns null if the variable is absent — DriverManager.getConnection throws NullPointerException
        try (Connection conn = DriverManager.getConnection(url, "procurement", "procurement")) {
            // => try-with-resources: Connection implements AutoCloseable — conn.close() is guaranteed
            conn.createStatement().execute(
                // => createStatement: plain statement, no parameters — suitable for DDL only
                "CREATE SCHEMA IF NOT EXISTS purchasing;" +
                "CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (" +
                "  id UUID PRIMARY KEY," +
                "  supplier_id UUID NOT NULL," +
                "  total_amount NUMERIC(19,4) NOT NULL," +
                "  currency CHAR(3) NOT NULL," +
                "  status TEXT NOT NULL DEFAULT 'Draft'" +
                ")"
                // => No version number: impossible to determine which state the schema is in
                // => No rollback: if a second migration fails after the first succeeds, schema is partially upgraded
                // => Running this twice: CREATE TABLE IF NOT EXISTS is idempotent, but ALTER TABLE is not
            );
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: DDL execution via JDBC Connection — Kotlin
// Demonstrates the manual DDL approach that Flyway supersedes.

import java.sql.Connection
// => Connection: JDBC connection to the database — must be closed after use or the pool leaks
import java.sql.DriverManager
// => DriverManager: JDBC entry point — finds a registered driver matching the URL scheme
import java.sql.SQLException
// => SQLException: checked exception on every JDBC operation — callers must handle or declare throws

fun main() {
    val url = System.getenv("SPRING_DATASOURCE_URL")
    // => Reads the JDBC URL from an environment variable — must be set before this runs
    // => Returns null if the variable is absent — DriverManager.getConnection throws NullPointerException
    DriverManager.getConnection(url, "procurement", "procurement").use { conn ->
        // => use{}: Kotlin AutoCloseable extension — conn.close() is guaranteed
        conn.createStatement().use { stmt ->
            // => createStatement: plain statement, no parameters — suitable for DDL only
            stmt.execute(
                "CREATE SCHEMA IF NOT EXISTS purchasing;" +
                "CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (" +
                "  id UUID PRIMARY KEY," +
                "  supplier_id UUID NOT NULL," +
                "  total_amount NUMERIC(19,4) NOT NULL," +
                "  currency CHAR(3) NOT NULL," +
                "  status TEXT NOT NULL DEFAULT 'Draft'" +
                ")"
                // => No version number: impossible to determine which state the schema is in
                // => No rollback: if a second migration fails after the first succeeds, schema is partially upgraded
                // => Running this twice: CREATE TABLE IF NOT EXISTS is idempotent, but ALTER TABLE is not
            )
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: DDL execution via ADO.NET — C# 12
// Demonstrates the manual DDL approach that EF Core migrations supersedes.

using Npgsql;
// => Npgsql: PostgreSQL ADO.NET driver — equivalent to JDBC DriverManager + Connection

public class ManualSchemaMigration
{
    public static async Task Main(string[] args)
    {
        var connStr = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_URL");
        // => Reads the connection string from an environment variable — must be set before this runs
        // => Returns null if the variable is absent — NpgsqlConnection throws on null connection string
        await using var conn = new NpgsqlConnection(connStr);
        // => await using: async IAsyncDisposable — conn.DisposeAsync() is guaranteed
        await conn.OpenAsync();
        // => OpenAsync: establishes the TCP connection — throws on failure
        await using var cmd = new NpgsqlCommand(
            "CREATE SCHEMA IF NOT EXISTS purchasing;" +
            "CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (" +
            "  id UUID PRIMARY KEY," +
            "  supplier_id UUID NOT NULL," +
            "  total_amount NUMERIC(19,4) NOT NULL," +
            "  currency CHAR(3) NOT NULL," +
            "  status TEXT NOT NULL DEFAULT 'Draft'" +
            ")", conn);
        // => No version number: impossible to determine which state the schema is in
        // => No rollback: if a second migration fails after the first succeeds, schema is partially upgraded
        await cmd.ExecuteNonQueryAsync();
        // => ExecuteNonQueryAsync: runs the DDL — not idempotent for ALTER TABLE or DROP COLUMN
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: DDL execution via pg — TypeScript
// Demonstrates the manual DDL approach that node-pg-migrate supersedes.

import { Client } from "pg";
// => pg: Node.js PostgreSQL driver — equivalent to JDBC DriverManager + Connection

async function main(): Promise {
  const client = new Client({
    connectionString: process.env.SPRING_DATASOURCE_URL,
    // => Reads the connection URL from an environment variable — must be set before this runs
    // => Returns undefined if absent — client.connect() throws on undefined connection string
  });
  try {
    await client.connect();
    // => connect(): establishes the TCP connection — throws on failure
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS purchasing;
      CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
        id UUID PRIMARY KEY,
        supplier_id UUID NOT NULL,
        total_amount NUMERIC(19,4) NOT NULL,
        currency CHAR(3) NOT NULL,
        status TEXT NOT NULL DEFAULT 'Draft'
      )
    `);
    // => No version number: impossible to determine which state the schema is in
    // => No rollback: if a second migration fails after the first succeeds, schema is partially upgraded
    // => Running this twice: CREATE TABLE IF NOT EXISTS is idempotent, but ALTER TABLE is not
  } finally {
    await client.end();
    // => end(): closes the connection — called in finally to guarantee cleanup even on error
  }
}

main();
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: no version tracking means running the migration twice executes the DDL twice — dangerous for `ALTER TABLE` or `DROP COLUMN` statements that are not idempotent. No rollback mechanism.

### Production Framework

`procurement-platform-be` includes Flyway via `spring-boot-starter-flyway` (Guide 17). This guide makes the deploy-time migration strategy explicit: a dedicated `Job` runs `flyway migrate` before the application containers start. Spring Boot's `spring.flyway.enabled=false` disables the in-process Flyway so only one path owns the migration:

```yaml
# apps/procurement-platform-be/deploy/k8s/migration-job.yaml
apiVersion: batch/v1
# => batch/v1: the stable Jobs API group — Kubernetes guarantees at-least-once execution semantics
kind: Job
metadata:
  name: procurement-platform-be-migrate
  namespace: procurement-platform
  annotations:
    helm.sh/hook: pre-upgrade,pre-install
    # => Helm hook: runs this Job before the Deployment rolls — schema is ready before pods start
    helm.sh/hook-delete-policy: hook-succeeded
    # => Deletes the Job after it succeeds — prevents accumulation of completed migration Jobs
spec:
  backoffLimit: 3
  # => backoffLimit: Kubernetes retries the pod up to 3 times on failure before marking the Job failed
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: flyway-migrate
          image: flyway/flyway:10-alpine
          # => Official Flyway CLI image: applies migrations without starting the Spring Boot application
          args: ["migrate"]
          # => migrate: the Flyway command — scans /flyway/sql and applies pending versioned scripts
          env:
            - name: FLYWAY_URL
              valueFrom:
                configMapKeyRef:
                  name: procurement-platform-be-config
                  key: SPRING_DATASOURCE_URL
            - name: FLYWAY_USER
              valueFrom:
                secretKeyRef:
                  name: procurement-platform-be-secrets
                  key: SPRING_DATASOURCE_USERNAME
            - name: FLYWAY_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: procurement-platform-be-secrets
                  key: SPRING_DATASOURCE_PASSWORD
          volumeMounts:
            - name: migrations
              mountPath: /flyway/sql
      volumes:
        - name: migrations
          configMap:
            name: procurement-platform-be-migrations
            # => ConfigMap holding SQL migration files (V1__create_purchasing_schema.sql, etc.)
```

```yaml
# Disable in-process Flyway so the Kubernetes Job is the only migration path
spring:
  flyway:
    enabled: false
    # => disabled: prevents Spring Boot from running Flyway at ApplicationContext startup
    # => The Kubernetes Job above owns the migration lifecycle — two migration paths would race
```

The `ApplicationRunner` strategy — running Flyway inside `SpringApplication.run` — is the simpler alternative for teams not using Helm or Kubernetes Jobs:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// FlywayMigrationRunner.java — ApplicationRunner strategy (alternative to Kubernetes Job)
package com.procurement.platform.shared.config;
// => shared/config/: cross-cutting configuration lives here — not in a single context package

import org.flywaydb.core.Flyway;
// => Flyway: the migration engine — scans classpath:db/migration for versioned SQL scripts
import org.springframework.boot.ApplicationArguments;
// => ApplicationArguments: command-line arguments passed to run() — unused here but required by the interface
import org.springframework.boot.ApplicationRunner;
// => ApplicationRunner: Spring lifecycle hook — run() is called after the ApplicationContext starts
import org.springframework.context.annotation.Profile;
// => @Profile: activates this runner only in specified profiles — suppressed in the k8s profile
import org.springframework.stereotype.Component;
// => @Component: Spring discovers this bean during component scan — active only in non-k8s profiles

import javax.sql.DataSource;
// => DataSource: the HikariCP connection pool — Flyway uses it to acquire a migration-lock connection

@Component
// => @Component: Spring registers this bean — run() is called once at startup
@Profile("!k8s")
// => @Profile("!k8s"): disabled in the k8s Spring profile — the Kubernetes Job owns migration in that profile
// => Activate the k8s profile in application.yml: spring.profiles.active: k8s
public class FlywayMigrationRunner implements ApplicationRunner {

    private final DataSource dataSource;
    // => DataSource: HikariCP pool configured from SPRING_DATASOURCE_* environment variables

    public FlywayMigrationRunner(DataSource dataSource) {
        this.dataSource = dataSource;
        // => Constructor injection: Spring wires the DataSource bean — no @Autowired annotation needed
    }

    @Override
    public void run(ApplicationArguments args) {
        // => run(): called by Spring Boot once the ApplicationContext is fully started
        // => Runs synchronously before HTTP server accepts traffic — no race with request handlers
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            // => dataSource: the same HikariCP pool — Flyway acquires a connection for the migration lock
            // => One migration runs at a time: Flyway uses a database-level advisory lock
            .locations("classpath:db/migration")
            // => classpath:db/migration: directory of versioned SQL files — V1__create_schema.sql, V2__...
            .validateOnMigrate(true)
            // => validateOnMigrate: Flyway checksums applied migrations — detects edits to already-run scripts
            // => Fails fast if a past migration file is modified — prevents silent schema drift
            .load();
        flyway.migrate();
        // => migrate(): applies all pending versioned migrations in order
        // => Acquires a database-level advisory lock — only one JVM migrates at a time
        // => Returns MigrateResult with counts of applied, pending, and failed migrations
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// FlywayMigrationRunner.kt — ApplicationRunner strategy (alternative to Kubernetes Job)
package com.procurement.platform.shared.config
// => shared/config/: cross-cutting configuration lives here — not in a single context package

import org.flywaydb.core.Flyway
// => Flyway: the migration engine — scans classpath:db/migration for versioned SQL scripts
import org.springframework.boot.ApplicationArguments
// => ApplicationArguments: command-line arguments passed to run() — unused here but required by the interface
import org.springframework.boot.ApplicationRunner
// => ApplicationRunner: Spring lifecycle hook — run() is called after the ApplicationContext starts
import org.springframework.context.annotation.Profile
// => @Profile: activates this runner only in specified profiles — suppressed in the k8s profile
import org.springframework.stereotype.Component
// => @Component: Spring discovers this bean during component scan — active only in non-k8s profiles
import javax.sql.DataSource
// => DataSource: the HikariCP connection pool — Flyway uses it to acquire a migration-lock connection

@Component
// => @Component: Spring registers this bean — run() is called once at startup
@Profile("!k8s")
// => @Profile("!k8s"): disabled in the k8s Spring profile — the Kubernetes Job owns migration in that profile
// => Activate the k8s profile in application.yml: spring.profiles.active: k8s
class FlywayMigrationRunner(
    private val dataSource: DataSource
    // => DataSource: HikariCP pool configured from SPRING_DATASOURCE_* environment variables
) : ApplicationRunner {

    override fun run(args: ApplicationArguments) {
        // => run(): called by Spring Boot once the ApplicationContext is fully started
        // => Runs synchronously before HTTP server accepts traffic — no race with request handlers
        val flyway = Flyway.configure()
            .dataSource(dataSource)
            // => dataSource: the same HikariCP pool — Flyway acquires a connection for the migration lock
            // => One migration runs at a time: Flyway uses a database-level advisory lock
            .locations("classpath:db/migration")
            // => classpath:db/migration: directory of versioned SQL files — V1__create_schema.sql, V2__...
            .validateOnMigrate(true)
            // => validateOnMigrate: Flyway checksums applied migrations — detects edits to already-run scripts
            // => Fails fast if a past migration file is modified — prevents silent schema drift
            .load()
        flyway.migrate()
        // => migrate(): applies all pending versioned migrations in order
        // => Acquires a database-level advisory lock — only one JVM migrates at a time
        // => Returns MigrateResult with counts of applied, pending, and failed migrations
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// FlywayMigrationRunner.cs — IHostedService strategy (alternative to Kubernetes Job) — C# 12
// Applies EF Core database migrations at startup, equivalent to the Flyway ApplicationRunner strategy.
// => shared/config/: cross-cutting configuration lives here — not in a single context namespace

using Microsoft.EntityFrameworkCore;
// => Database.MigrateAsync(): applies pending EF Core migrations — equivalent to flyway.migrate()
using Microsoft.Extensions.DependencyInjection;
// => IServiceProvider: resolves scoped DbContext from the DI container
using Microsoft.Extensions.Hosting;
// => IHostedService: ASP.NET Core background service — StartAsync called after the host starts
using Microsoft.Extensions.Logging;
// => ILogger: structured logging — decoupled from the logging backend (Serilog, NLog)

public class EfCoreMigrationRunner : IHostedService
{
    // => Implements IHostedService: StartAsync runs after the application host starts
    // => Equivalent to @Profile("!k8s") + ApplicationRunner in Spring Boot

    private readonly IServiceProvider _serviceProvider;
    // => IServiceProvider: used to create a scoped lifetime for the DbContext
    private readonly ILogger<EfCoreMigrationRunner> _logger;

    public EfCoreMigrationRunner(
        IServiceProvider serviceProvider, ILogger<EfCoreMigrationRunner> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        // => Constructor injection: ASP.NET Core DI wires both dependencies
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // => StartAsync: called by ASP.NET Core once the host is fully started
        // => Runs before HTTP server accepts traffic — no race with request handlers
        using var scope = _serviceProvider.CreateScope();
        // => CreateScope: resolves scoped services safely — DbContext is scoped by convention
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        // => ProcurementDbContext: EF Core DbContext — MigrateAsync() applies __EFMigrationsHistory
        await db.Database.MigrateAsync(cancellationToken);
        // => MigrateAsync(): applies all pending migrations in order — uses database-level advisory lock
        // => Only one service instance migrates at a time — equivalent to Flyway's advisory lock
        _logger.LogInformation("EF Core migrations applied successfully");
        // => Structured log: queryable in log aggregation — confirms migrations ran at startup
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    // => StopAsync: no cleanup needed — migration is a one-shot operation
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// flyway-migration-runner.ts — bootstrap strategy (alternative to Kubernetes Job) — TypeScript
// Applies node-pg-migrate migrations at startup, equivalent to the Flyway ApplicationRunner strategy.
// => shared/config/: cross-cutting configuration lives here — not in a single context directory

import { migrate } from "node-pg-migrate";
// => node-pg-migrate: versioned SQL migration library — equivalent to Flyway for Node.js
import { Pool } from "pg";
// => Pool: the pg connection pool — Flyway uses it to acquire a migration-lock connection
import { logger } from "../shared/logger";
// => logger: structured logger (pino or winston) — decoupled from the logging backend

const K8S_PROFILE = process.env.SPRING_PROFILES_ACTIVE === "k8s";
// => K8S_PROFILE: equivalent to @Profile("!k8s") — disabled in the k8s profile
// => In k8s profile, the Kubernetes Job owns the migration lifecycle — see Guide 26

export async function runFlywayEquivalent(pool: Pool): Promise {
  // => Called from the application bootstrap after the pool is created, before the HTTP server starts
  // => Equivalent to ApplicationRunner — runs once at startup, before any HTTP request is served
  if (K8S_PROFILE) {
    logger.info("k8s profile active — skipping in-process migration (Kubernetes Job owns it)");
    return;
    // => Equivalent to @Profile("!k8s"): disabled in the Kubernetes deployment profile
  }
  await migrate({
    dbClient: pool,
    // => dbClient: the pg Pool — node-pg-migrate acquires a connection for the migration lock
    // => One migration runs at a time: node-pg-migrate uses a database-level advisory lock
    dir: "src/db/migrations",
    // => dir: directory of versioned SQL files — V1__create_schema.sql, V2__...
    direction: "up",
    // => direction: "up" applies pending migrations — equivalent to flyway.migrate()
    migrationsTable: "pgmigrations",
    // => pgmigrations: the journal table — equivalent to Flyway's flyway_schema_history
    checkOrder: true,
    // => checkOrder: validates migration file ordering — equivalent to Flyway's validateOnMigrate
    // => Fails fast if a past migration file is modified — prevents silent schema drift
  });
  logger.info("node-pg-migrate: all pending migrations applied successfully");
  // => Structured log: queryable in log aggregation — confirms migrations ran at startup
}
```

{{< /tab >}}

{{< /tabs >}}

**Trade-offs**: the Kubernetes Job strategy decouples migration from pod startup — a failed migration blocks the rollout before any pod is replaced, which is the correct failure mode. The ApplicationRunner strategy is simpler but requires tuning `initialDelaySeconds` to cover the migration time. For small schemas (< 50 migrations, < 5 s total), the ApplicationRunner is acceptable; for large schemas or additive migrations running concurrently across 10+ replicas, the Kubernetes Job is required.

---

## Guide 27 — Configuration Adapter at the Deploy Seam: Secret to Typed `@ConfigurationProperties` Record

### Why It Matters

`procurement-platform-be` reads database credentials and the banking API key from environment variables that Kubernetes injects from a `Secret`. The journey of a credential from a Kubernetes Secret object to a strongly-typed configuration type crosses four boundaries: Kubernetes decodes the base64-encoded Secret value and injects it as an environment variable; the application's configuration layer reads the environment variable; a typed binding maps it to a record or options object; the composition root reads the record and passes it to the adapter constructor. The typed binding mechanism differs per stack — Spring Boot `@ConfigurationProperties` with `@Validated` in Java/Kotlin, `IOptions<T>` with `DataAnnotations` validation in C# ASP.NET Core, or `joi`/`zod`-validated `ConfigService` in TypeScript NestJS — but all three detect misconfiguration at startup rather than at the first database call, turning a 3 AM `NullPointerException` into a clear startup failure message during the Kubernetes pod `Init` phase.

### Standard Library First

Reading each environment variable individually from the process environment is the manual approach before typed configuration binding:

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// Standard library: reading DataSource credentials manually from environment variables
// Demonstrates the manual approach that @ConfigurationProperties supersedes.

import org.springframework.jdbc.datasource.DriverManagerDataSource;

public class ManualDataSourceFactory {

    public static DriverManagerDataSource create() {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        // => Reads the JDBC URL from the environment — returns null if the variable is not set
        // => getenv returns null, not empty string: callers must null-check every variable individually
        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        // => Reads the username — may be null if the Secret key name has a typo
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (url == null || username == null || password == null) {
            throw new IllegalStateException("DataSource environment variables not fully set");
            // => Fail-fast: better than NullPointerException deep in HikariCP initialization
            // => But: the error fires at the point of first use, not at startup — after health probes pass
        }
        // => No validation: an empty string passes the null check — "username=" is not caught here
        var ds = new DriverManagerDataSource();
        ds.setUrl(url);
        ds.setUsername(username);
        // => empty string is silently accepted — causes auth failure at connect time
        ds.setPassword(password);
        return ds;
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// Standard library: reading DataSource credentials manually from environment variables — Kotlin
// Demonstrates the manual approach that @ConfigurationProperties supersedes.

import org.springframework.jdbc.datasource.DriverManagerDataSource

object ManualDataSourceFactory {

    fun create(): DriverManagerDataSource {
        val url = System.getenv("SPRING_DATASOURCE_URL")
        // => Reads the JDBC URL from the environment — returns null if the variable is not set
        // => getenv returns null, not empty string: callers must null-check every variable individually
        val username = System.getenv("SPRING_DATASOURCE_USERNAME")
        // => Reads the username — may be null if the Secret key name has a typo
        val password = System.getenv("SPRING_DATASOURCE_PASSWORD")

        if (url == null || username == null || password == null) {
            throw IllegalStateException("DataSource environment variables not fully set")
            // => Fail-fast: better than NullPointerException deep in HikariCP initialization
            // => But: the error fires at the point of first use, not at startup — after health probes pass
        }
        // => No validation: an empty string passes the null check — "username=" is not caught here
        return DriverManagerDataSource().also { ds ->
            ds.setUrl(url)
            ds.setUsername(username)
            // => empty string is silently accepted — causes auth failure at connect time
            ds.setPassword(password)
        }
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// Standard library: reading DataSource credentials manually from environment variables — C# 12
// Demonstrates the manual approach that IOptions<T> + DataAnnotations validation supersedes.

using System;
// => System: BCL root namespace — Environment.GetEnvironmentVariable returns null for missing vars
using Npgsql;
// => NpgsqlDataSourceBuilder: Npgsql builder — equivalent to DriverManagerDataSource

public static class ManualDataSourceFactory
{
    public static NpgsqlDataSource Create()
    {
        var url = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_URL");
        // => Reads the JDBC URL from the environment — returns null if the variable is not set
        // => GetEnvironmentVariable returns null, not empty string: callers must null-check each variable
        var username = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_USERNAME");
        // => Reads the username — may be null if the Secret key name has a typo
        var password = Environment.GetEnvironmentVariable("SPRING_DATASOURCE_PASSWORD");

        if (url is null || username is null || password is null)
        {
            throw new InvalidOperationException("DataSource environment variables not fully set");
            // => Fail-fast: better than NullReferenceException deep in Npgsql pool initialization
            // => But: the error fires at the point of first use, not at startup — after health probes pass
        }
        // => No validation: an empty string passes the null check — "" username is not caught here
        var builder = new NpgsqlDataSourceBuilder(url);
        builder.ConnectionStringBuilder.Username = username;
        builder.ConnectionStringBuilder.Password = password;
        // => empty string is silently accepted — causes auth failure at connect time
        return builder.Build();
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// Standard library: reading DataSource credentials manually from environment variables — TypeScript
// Demonstrates the manual approach that Zod / class-validator config validation supersedes.

import { Pool } from "pg";
// => Pool: pg connection pool — equivalent to HikariCP DataSource

export function createDataSourceManually(): Pool {
  const url = process.env.SPRING_DATASOURCE_URL;
  // => Reads the JDBC URL from the environment — returns undefined if the variable is not set
  // => process.env always returns string | undefined: callers must check every variable individually
  const username = process.env.SPRING_DATASOURCE_USERNAME;
  // => Reads the username — may be undefined if the Secret key name has a typo
  const password = process.env.SPRING_DATASOURCE_PASSWORD;

  if (!url || !username || !password) {
    throw new Error("DataSource environment variables not fully set");
    // => Fail-fast: better than "cannot read properties of undefined" deep in Pool initialization
    // => But: the error fires at the point of first use, not at startup — after health probes pass
  }
  // => No validation: a whitespace-only string passes the truthy check — "  " is not caught here
  return new Pool({
    connectionString: url,
    user: username,
    // => empty string is silently accepted — causes auth failure at connect time
    password,
  });
}
```

{{< /tab >}}

{{< /tabs >}}

**Limitation for production**: the environment access API returns `null` or `undefined` for a missing variable and an empty string for a variable set to `""` — both cases pass a naive presence check but cause the connection pool to fail at connection time. Changes to key names in the Kubernetes Secret must be manually mirrored in every read call.

### Production Framework

The typed configuration binding mechanism for each stack maps environment variables to a validated record at startup — before any request is handled and before the liveness probe first fires (Spring Boot `@ConfigurationProperties` with `@Validated` in Java/Kotlin, `IOptions<T>` with `DataAnnotations` validation in C#, Zod schema parsing in TypeScript):

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// DataSourceProperties.java — typed record bound to SPRING_DATASOURCE_* environment variables
package com.procurement.platform.shared.config;
// => shared/config/ package: @ConfigurationProperties records live here — bound at startup

import jakarta.validation.constraints.NotBlank;
// => @NotBlank: fails validation if the bound value is null, empty, or whitespace-only
// => Catches env vars set to "" — the silent failure mode that @NotNull misses
import jakarta.validation.constraints.Pattern;
// => @Pattern: validates the format of the JDBC URL at startup — detects transposed host names
import org.springframework.boot.context.properties.ConfigurationProperties;
// => @ConfigurationProperties: Spring Boot binds properties with the given prefix to this record's fields
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "spring.datasource")
// => prefix = "spring.datasource": binds SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME,
//    SPRING_DATASOURCE_PASSWORD — Spring converts underscore-separated env vars to dotted property names
@Validated
// => @Validated: activates constraint checking at ApplicationContext startup — before pods report ready
public record DataSourceProperties(

    @NotBlank(message = "spring.datasource.url must not be blank")
    // => @NotBlank: catches null and empty-string SPRING_DATASOURCE_URL from the Kubernetes ConfigMap
    @Pattern(regexp = "^jdbc:postgresql://.*",
             message = "spring.datasource.url must be a PostgreSQL JDBC URL")
    // => @Pattern: ensures the URL starts with jdbc:postgresql:// — catches MySQL URL typos in the ConfigMap
    String url,

    @NotBlank(message = "spring.datasource.username must not be blank")
    // => @NotBlank: catches a Secret key named SPRING_DATASOURCE_USER instead of SPRING_DATASOURCE_USERNAME
    String username,

    @NotBlank(message = "spring.datasource.password must not be blank")
    // => @NotBlank: catches an empty Sealed Secret placeholder that was not replaced before deployment
    String password

) {}
// => record: immutable — values are set once by Spring Boot binding; no mutability risk after startup
```

{{< /tab >}}

{{< tab >}}

```kotlin
// DataSourceProperties.kt — typed data class bound to SPRING_DATASOURCE_* environment variables
package com.procurement.platform.shared.config
// => shared/config/ package: @ConfigurationProperties records live here — bound at startup

import jakarta.validation.constraints.NotBlank
// => @NotBlank: fails validation if the bound value is null, empty, or whitespace-only
// => Catches env vars set to "" — the silent failure mode that @NotNull misses
import jakarta.validation.constraints.Pattern
// => @Pattern: validates the format of the JDBC URL at startup — detects transposed host names
import org.springframework.boot.context.properties.ConfigurationProperties
// => @ConfigurationProperties: Spring Boot binds properties with the given prefix to this data class
import org.springframework.validation.annotation.Validated

@ConfigurationProperties(prefix = "spring.datasource")
// => prefix = "spring.datasource": binds SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME,
//    SPRING_DATASOURCE_PASSWORD — Spring converts underscore-separated env vars to dotted property names
@Validated
// => @Validated: activates constraint checking at ApplicationContext startup — before pods report ready
data class DataSourceProperties(

    @field:NotBlank(message = "spring.datasource.url must not be blank")
    // => @NotBlank: catches null and empty-string SPRING_DATASOURCE_URL from the Kubernetes ConfigMap
    @field:Pattern(regexp = "^jdbc:postgresql://.*",
             message = "spring.datasource.url must be a PostgreSQL JDBC URL")
    // => @Pattern: ensures the URL starts with jdbc:postgresql:// — catches MySQL URL typos in the ConfigMap
    val url: String,

    @field:NotBlank(message = "spring.datasource.username must not be blank")
    // => @NotBlank: catches a Secret key named SPRING_DATASOURCE_USER instead of SPRING_DATASOURCE_USERNAME
    val username: String,

    @field:NotBlank(message = "spring.datasource.password must not be blank")
    // => @NotBlank: catches an empty Sealed Secret placeholder that was not replaced before deployment
    val password: String

)
// => data class: immutable — values are set once by Spring Boot binding; no mutability risk after startup
```

{{< /tab >}}

{{< tab >}}

```csharp
// DataSourceOptions.cs — typed record bound to SPRING_DATASOURCE_* environment variables
namespace Procurement.Platform.Shared.Config;
// => Shared.Config namespace: IOptions<T> records live here — bound at startup

using System.ComponentModel.DataAnnotations;
// => [Required], [RegularExpression]: DataAnnotations constraints — validated by Options validation
using Microsoft.Extensions.Options;
// => [ValidateOnStart]: triggers constraint checking at application startup — before pods report ready

[OptionsValidator]
// => [OptionsValidator]: generates a compile-time validator for this record — equivalent to @Validated
public partial class DataSourceOptionsValidator : IValidateOptions<DataSourceOptions> {}

public record DataSourceOptions
{
    [Required(ErrorMessage = "spring.datasource.url must not be blank")]
    // => [Required]: catches null and empty-string SPRING_DATASOURCE_URL from the Kubernetes ConfigMap
    [RegularExpression(@"^Host=.*;.*", ErrorMessage = "spring.datasource.url must be a PostgreSQL connection string")]
    // => [RegularExpression]: ensures the connection string starts with "Host=" — catches MySQL connection strings
    public required string Url { get; init; }

    [Required(ErrorMessage = "spring.datasource.username must not be blank")]
    // => [Required]: catches a Secret key named DATASOURCE_USER instead of DATASOURCE_USERNAME
    public required string Username { get; init; }

    [Required(ErrorMessage = "spring.datasource.password must not be blank")]
    // => [Required]: catches an empty Sealed Secret placeholder that was not replaced before deployment
    public required string Password { get; init; }
}
// => record: immutable — values are set once by IOptions binding; no mutability risk after startup
```

{{< /tab >}}

{{< tab >}}

```typescript
// data-source-config.ts — typed record validated with Zod bound to SPRING_DATASOURCE_* env vars
// => shared/config/ directory: Zod schemas and config records live here — bound at startup

import { z } from "zod";
// => zod: TypeScript-first schema validation library — equivalent to Jakarta Bean Validation
// => z.string().min(1): fails validation if the bound value is empty — equivalent to @NotBlank

const dataSourceSchema = z.object({
  url: z
    .string()
    .min(1, "spring.datasource.url must not be blank")
    // => .min(1): catches empty-string SPRING_DATASOURCE_URL from the Kubernetes ConfigMap
    .regex(/^postgresql:\/\//, "spring.datasource.url must be a PostgreSQL connection URL"),
  // => .regex: ensures the URL starts with postgresql:// — catches MySQL URL typos in the ConfigMap
  username: z.string().min(1, "spring.datasource.username must not be blank"),
  // => .min(1): catches a Secret key named DATASOURCE_USER instead of DATASOURCE_USERNAME
  password: z.string().min(1, "spring.datasource.password must not be blank"),
  // => .min(1): catches an empty Sealed Secret placeholder that was not replaced before deployment
});

export type DataSourceConfig = z.infer;
// => z.infer: derives the TypeScript type from the Zod schema — no duplicate type declaration

export function loadDataSourceConfig(): DataSourceConfig {
  // => Called at application bootstrap — throws ZodError if validation fails, before HTTP server starts
  const result = dataSourceSchema.safeParse({
    url: process.env.SPRING_DATASOURCE_URL,
    // => Reads SPRING_DATASOURCE_URL — undefined if not set, caught by .min(1)
    username: process.env.SPRING_DATASOURCE_USERNAME,
    // => Reads SPRING_DATASOURCE_USERNAME — undefined if not set
    password: process.env.SPRING_DATASOURCE_PASSWORD,
    // => Reads SPRING_DATASOURCE_PASSWORD — undefined if not set
  });
  if (!result.success) {
    throw new Error(`DataSource config validation failed at startup:\n${result.error.message}`);
    // => Fail-fast: equivalent to BindValidationException before any @Bean runs in Spring Boot
    // => Kubernetes readiness probe fails — pod does not receive traffic until config is valid
  }
  return result.data;
  // => Immutable config: returned value is frozen by Zod — no mutability risk after startup
}
```

{{< /tab >}}

{{< /tabs >}}

{{< tabs items="Java,Kotlin,C#,TypeScript" >}}

{{< tab >}}

```java
// AppConfig.java — registers @ConfigurationProperties beans and wires them to the DataSource
package com.procurement.platform.shared.config;

import com.zaxxer.hikari.HikariDataSource;
// => HikariCP: the production-grade JDBC connection pool — auto-configured by Spring Boot
import org.springframework.boot.context.properties.EnableConfigurationProperties;
// => @EnableConfigurationProperties: registers the DataSourceProperties bean and triggers binding + validation
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
@EnableConfigurationProperties(DataSourceProperties.class)
// => @EnableConfigurationProperties: triggers binding and @Validated constraint checking at startup
// => If SPRING_DATASOURCE_URL is blank, Spring throws BindValidationException before any @Bean runs
public class AppConfig {

    @Bean
    public DataSource dataSource(DataSourceProperties props) {
        // => DataSourceProperties: bound and validated before this method is called — url is guaranteed non-blank
        var config = new com.zaxxer.hikari.HikariConfig();
        config.setJdbcUrl(props.url());
        // => url(): non-blank JDBC URL from the ConfigMap — validated by @Pattern at startup
        config.setUsername(props.username());
        // => username(): non-blank username from the Secret — validated by @NotBlank at startup
        config.setPassword(props.password());
        // => password(): non-blank password from the Secret — validated by @NotBlank at startup
        config.setMaximumPoolSize(10);
        // => Maximum pool size: 10 connections — sized for 2 replicas × 5 connections each
        config.setConnectionTimeout(3000);
        // => 3000 ms: connection acquisition timeout — bounded wait avoids thread starvation
        return new HikariDataSource(config);
        // => HikariDataSource: starts the connection pool and validates connectivity at construction time
        // => If the PostgreSQL pod is not reachable, HikariDataSource throws here — the Actuator readiness
        //    probe from Guide 25 returns DOWN and Kubernetes does not route traffic until the pool is healthy
    }
}
```

{{< /tab >}}

{{< tab >}}

```kotlin
// AppConfig.kt — registers @ConfigurationProperties beans and wires them to the DataSource
package com.procurement.platform.shared.config

import com.zaxxer.hikari.HikariDataSource
// => HikariCP: the production-grade JDBC connection pool — auto-configured by Spring Boot
import org.springframework.boot.context.properties.EnableConfigurationProperties
// => @EnableConfigurationProperties: registers the DataSourceProperties bean and triggers binding + validation
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

@Configuration
@EnableConfigurationProperties(DataSourceProperties::class)
// => @EnableConfigurationProperties: triggers binding and @Validated constraint checking at startup
// => If SPRING_DATASOURCE_URL is blank, Spring throws BindValidationException before any @Bean runs
class AppConfig {

    @Bean
    fun dataSource(props: DataSourceProperties): DataSource {
        // => DataSourceProperties: bound and validated before this method is called — url is guaranteed non-blank
        val config = com.zaxxer.hikari.HikariConfig()
        config.jdbcUrl = props.url
        // => url: non-blank JDBC URL from the ConfigMap — validated by @Pattern at startup
        config.username = props.username
        // => username: non-blank username from the Secret — validated by @NotBlank at startup
        config.password = props.password
        // => password: non-blank password from the Secret — validated by @NotBlank at startup
        config.maximumPoolSize = 10
        // => Maximum pool size: 10 connections — sized for 2 replicas × 5 connections each
        config.connectionTimeout = 3000
        // => 3000 ms: connection acquisition timeout — bounded wait avoids thread starvation
        return HikariDataSource(config)
        // => HikariDataSource: starts the connection pool and validates connectivity at construction time
        // => If the PostgreSQL pod is not reachable, HikariDataSource throws here — the Actuator readiness
        //    probe from Guide 25 returns DOWN and Kubernetes does not route traffic until the pool is healthy
    }
}
```

{{< /tab >}}

{{< tab >}}

```csharp
// AppConfig.cs — registers IOptions<DataSourceOptions> and wires them to the NpgsqlDataSource
namespace Procurement.Platform.Shared.Config;

using Microsoft.Extensions.DependencyInjection;
// => AddOptions: registers IOptions<T> in the DI container
using Microsoft.Extensions.Options;
// => IOptions<DataSourceOptions>: injects the validated config record into the factory
using Npgsql;
// => NpgsqlDataSource: Npgsql connection pool — equivalent to HikariDataSource

public static class AppConfigExtensions
{
    public static IServiceCollection AddProcurementDataSource(
        this IServiceCollection services, IConfiguration configuration)
    {
        // => Extension method: called from Program.cs — equivalent to @Configuration @Bean in Spring Boot
        services
            .AddOptions<DataSourceOptions>()
            // => AddOptions<T>: registers the options type for binding and validation
            .Bind(configuration.GetSection("spring.datasource"))
            // => Bind: maps SPRING_DATASOURCE_* env vars to DataSourceOptions properties
            // => Spring converts underscore-separated env vars to dotted paths — same convention here
            .ValidateDataAnnotations()
            // => ValidateDataAnnotations: runs [Required] and [RegularExpression] at startup
            // => If SPRING_DATASOURCE_URL is blank, IOptions throws OptionsValidationException before any request
            .ValidateOnStart();
            // => ValidateOnStart: equivalent to @Validated — fails fast before the HTTP server accepts traffic

        services.AddSingleton<NpgsqlDataSource>(sp =>
        {
            var opts = sp.GetRequiredService<IOptions<DataSourceOptions>>().Value;
            // => IOptions<DataSourceOptions>: bound and validated before this factory runs
            var builder = new NpgsqlDataSourceBuilder(opts.Url);
            builder.ConnectionStringBuilder.Username = opts.Username;
            // => Username: non-blank from the Secret — validated by [Required] at startup
            builder.ConnectionStringBuilder.Password = opts.Password;
            // => Password: non-blank from the Secret — validated by [Required] at startup
            builder.ConnectionStringBuilder.MaxPoolSize = 10;
            // => MaxPoolSize: 10 connections — sized for 2 replicas × 5 connections each
            builder.ConnectionStringBuilder.Timeout = 3;
            // => Timeout: 3 seconds connection acquisition timeout — bounded wait avoids thread starvation
            return builder.Build();
            // => Build(): creates the Npgsql connection pool — validates connectivity on first use
            // => If the PostgreSQL pod is not reachable, the health check from Guide 25 returns Unhealthy
        });

        return services;
    }
}
```

{{< /tab >}}

{{< tab >}}

```typescript
// app-config.ts — loads and validates DataSourceConfig and wires it to the pg Pool
// => shared/config/ directory: Zod-validated config wiring lives here

import { Pool } from "pg";
// => Pool: pg connection pool — equivalent to HikariDataSource
import { loadDataSourceConfig } from "./data-source-config";
// => loadDataSourceConfig: throws at startup if any SPRING_DATASOURCE_* var is missing or invalid
// => Equivalent to @EnableConfigurationProperties + @Validated in Spring Boot

export function buildDataSource(): Pool {
  // => Called from the application bootstrap — runs before the HTTP server accepts traffic
  const config = loadDataSourceConfig();
  // => loadDataSourceConfig(): bound and validated — url is guaranteed non-blank by Zod before here
  // => If SPRING_DATASOURCE_URL is blank, throws at startup — Kubernetes readiness probe fails

  const pool = new Pool({
    connectionString: config.url,
    // => url: non-blank PostgreSQL connection URL from the ConfigMap — validated by .regex() at startup
    user: config.username,
    // => username: non-blank username from the Secret — validated by .min(1) at startup
    password: config.password,
    // => password: non-blank password from the Secret — validated by .min(1) at startup
    max: 10,
    // => max: 10 connections — sized for 2 replicas × 5 connections each
    connectionTimeoutMillis: 3000,
    // => 3000 ms: connection acquisition timeout — bounded wait avoids event-loop starvation
  });
  // => Pool: creates the pg connection pool — validates connectivity on first query
  // => If the PostgreSQL pod is not reachable, the health check from Guide 25 returns "down"
  // => and the health middleware returns HTTP 503 — Kubernetes does not route traffic until pool is healthy
  return pool;
}
```

{{< /tab >}}

{{< /tabs >}}

```mermaid
flowchart TD
    k8s["Kubernetes Secret\n(base64-encoded)"]:::purple
    env["JVM environment\n(SPRING_DATASOURCE_*)"]:::orange
    props["DataSourceProperties\n(@ConfigurationProperties)"]:::teal
    valid["@Validated\n(Jakarta Bean Validation)"]:::brown
    ds["HikariDataSource\n(AppConfig @Bean)"]:::blue
    port["JdbcPurchaseOrderRepository\n(repository port)"]:::teal

    k8s -->|"envFrom secretRef\n(Kubernetes decodes base64)"| env
    env -->|"Spring Environment\nbinds prefix"| props
    props -->|"@NotBlank + @Pattern\nchecked at startup"| valid
    valid -->|"passes at startup"| ds
    ds -->|"DataSource injected"| port

    classDef purple fill:#CC78BC,color:#fff,stroke:#CC78BC
    classDef orange fill:#DE8F05,color:#fff,stroke:#DE8F05
    classDef teal fill:#029E73,color:#fff,stroke:#029E73
    classDef brown fill:#CA9161,color:#fff,stroke:#CA9161
    classDef blue fill:#0173B2,color:#fff,stroke:#0173B2
```

**Trade-offs**: `@ConfigurationProperties` with `@Validated` adds one extra class per configuration group. The startup validation overhead is measured in milliseconds — negligible compared to HikariCP pool initialization. The `@Pattern` constraint on the JDBC URL is a double-edged sword: it catches URL typos early, but it also rejects valid non-PostgreSQL JDBC URLs if `procurement-platform-be` ever migrates to a different database — update the pattern when changing the database vendor. For `spring.config.import` with SSM or Vault, add the dependency and set `spring.config.import=optional:aws-ssm:/procurement/` in `application.yml`; the `@ConfigurationProperties` binding is identical — no code change, only a new property source.
