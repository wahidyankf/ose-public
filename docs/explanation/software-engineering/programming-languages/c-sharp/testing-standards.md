---
title: "C# Testing Standards"
description: Authoritative OSE Platform C# testing standards (xUnit, FluentAssertions, Moq, TestContainers.Net)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - testing-standards
  - xunit
  - moq
  - fluentassertions
  - testcontainers
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for C# development in the OSE Platform. These rules MUST be followed across all C# test projects to ensure reliable, readable, and maintainable tests.

**Target Audience**: OSE Platform C# developers writing or reviewing tests

**Scope**: xUnit patterns, assertion style, mocking, async tests, database integration, coverage requirements

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Zakat Test Suite):

```csharp
// ZakatCalculatorTests.cs - parametric automated testing
public class ZakatCalculatorTests
{
    [Theory]
    [InlineData(100_000, 5_000, 2_500)]
    [InlineData(4_999, 5_000, 0)]         // below nisab - no zakat
    [InlineData(5_000, 5_000, 125)]       // exactly at nisab
    public void Calculate_ReturnsCorrectZakat(
        decimal wealth, decimal nisab, decimal expected)
    {
        decimal result = ZakatCalculator.Calculate(wealth, nisab);

        result.Should().Be(expected);
    }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Arrange-Act-Assert):

```csharp
public async Task ProcessZakat_ValidPayer_PersistsTransaction()
{
    // Arrange - explicit setup, no magic
    var payerId = Guid.NewGuid();
    var wealth = 100_000m;
    var mockRepository = new Mock<IZakatRepository>();
    mockRepository
        .Setup(r => r.AddAsync(It.IsAny<ZakatTransaction>(), It.IsAny<CancellationToken>()))
        .Returns(Task.CompletedTask);
    var service = new ZakatService(mockRepository.Object);

    // Act - explicit invocation
    var transaction = await service.ProcessAsync(payerId, wealth, CancellationToken.None);

    // Assert - explicit expectations
    transaction.ZakatAmount.Should().Be(2_500m);
    mockRepository.Verify(
        r => r.AddAsync(It.Is<ZakatTransaction>(t => t.PayerId == payerId),
        It.IsAny<CancellationToken>()),
        Times.Once);
}
```

### 3. Reproducibility First

**PASS Example** (Deterministic test data with Bogus):

```csharp
// Seeded Bogus - same seed = same data across CI runs
public static class ZakatTestData
{
    private static readonly Faker<ZakatTransaction> _faker =
        new Faker<ZakatTransaction>()
            .UseSeed(42) // fixed seed for reproducibility
            .RuleFor(t => t.TransactionId, f => f.Random.Guid())
            .RuleFor(t => t.PayerId, f => f.Random.Guid())
            .RuleFor(t => t.Wealth, f => f.Finance.Amount(5_001, 1_000_000))
            .RuleFor(t => t.PaidAt, f => f.Date.RecentOffset());

    public static ZakatTransaction Generate() => _faker.Generate();
}
```

## xUnit Patterns

### Fact vs Theory

**MUST** use `[Fact]` for single test cases. **MUST** use `[Theory]` with `[InlineData]`, `[MemberData]`, or `[ClassData]` for parametric tests.

```csharp
// CORRECT: Fact for single scenario
[Fact]
public void Calculate_WealthBelowNisab_ReturnsZero()
{
    decimal result = ZakatCalculator.Calculate(wealth: 4_000m, nisab: 5_000m);

    result.Should().Be(0m);
}

// CORRECT: Theory for multiple scenarios
[Theory]
[InlineData(100_000, 5_000, 2_500)]
[InlineData(200_000, 5_000, 5_000)]
public void Calculate_WealthAboveNisab_Returns2Point5Percent(
    decimal wealth, decimal nisab, decimal expected)
{
    decimal result = ZakatCalculator.Calculate(wealth, nisab);

    result.Should().Be(expected);
}
```

### MemberData for Complex Test Cases

**SHOULD** use `[MemberData]` for complex test scenarios that do not fit inline.

```csharp
public class MurabahaContractTests
{
    public static IEnumerable<object[]> InvalidContractData =>
    [
        [0m, 1_000m, 12, "cost price must be positive"],
        [10_000m, -500m, 12, "profit margin cannot be negative"],
        [10_000m, 1_000m, 0, "installment count must be at least 1"]
    ];

    [Theory]
    [MemberData(nameof(InvalidContractData))]
    public async Task CreateContract_InvalidInput_ThrowsValidationException(
        decimal costPrice,
        decimal profitMargin,
        int installments,
        string expectedMessageFragment)
    {
        var service = CreateService();

        Func<Task> act = () => service.CreateContractAsync(
            Guid.NewGuid(), costPrice, profitMargin, installments);

        await act.Should()
            .ThrowAsync<ValidationException>()
            .WithMessage($"*{expectedMessageFragment}*");
    }
}
```

### Arrange-Act-Assert

**MUST** structure all tests with clearly separated Arrange, Act, and Assert sections using blank lines.

```csharp
[Fact]
public async Task ProcessZakat_ValidWealth_CreatesAuditEntry()
{
    // Arrange
    var payerId = Guid.NewGuid();
    var wealth = 100_000m;
    var service = CreateServiceWithInMemoryDb();

    // Act
    var transaction = await service.ProcessAsync(payerId, wealth, CancellationToken.None);

    // Assert
    transaction.Should().NotBeNull();
    transaction.ZakatAmount.Should().Be(2_500m);
    transaction.PayerId.Should().Be(payerId);
}
```

## FluentAssertions

### Basic Assertions

**MUST** use FluentAssertions for all assertions. **MUST NOT** use xUnit's `Assert.*` static methods.

```csharp
// CORRECT: FluentAssertions
result.Should().Be(2_500m);
result.Should().BeGreaterThan(0m);
result.Should().BeApproximately(2_500m, precision: 0.01m);
collection.Should().HaveCount(3);
collection.Should().ContainSingle(t => t.PayerId == payerId);
value.Should().BeNull();
value.Should().NotBeNull();
text.Should().StartWith("Zakat");
text.Should().Contain("nisab");

// WRONG: xUnit native assertions
Assert.Equal(2_500m, result);
Assert.NotNull(result);
```

### Exception Assertions

**MUST** use FluentAssertions for exception testing (never `try/catch` in tests).

```csharp
// CORRECT: synchronous exception
Action act = () => ZakatCalculator.Calculate(-100m, 5_000m);
act.Should().Throw<ArgumentOutOfRangeException>()
    .WithMessage("*wealth*");

// CORRECT: async exception
Func<Task> act = () => service.ProcessAsync(Guid.Empty, wealth, CancellationToken.None);
await act.Should()
    .ThrowAsync<ArgumentException>()
    .WithMessage("*payerId*");

// WRONG: try/catch pattern
try
{
    ZakatCalculator.Calculate(-100m, 5_000m);
    Assert.True(false, "Should have thrown");
}
catch (ArgumentOutOfRangeException) { }
```

### Collection Assertions

```csharp
// CORRECT: rich collection assertions
transactions.Should().NotBeEmpty();
transactions.Should().HaveCount(3);
transactions.Should().AllSatisfy(t => t.ZakatAmount.Should().BePositive());
transactions.Should().ContainEquivalentOf(expectedTransaction);
transactions.Should().BeInAscendingOrder(t => t.PaidAt);
```

## Moq Patterns

### Setup and Verify

**MUST** use Moq for mocking interfaces. **MUST** verify interactions that are required by the domain contract.

```csharp
public class ZakatServiceTests
{
    private readonly Mock<IZakatRepository> _mockRepository;
    private readonly Mock<ILogger<ZakatService>> _mockLogger;
    private readonly ZakatService _service;

    public ZakatServiceTests()
    {
        _mockRepository = new Mock<IZakatRepository>();
        _mockLogger = new Mock<ILogger<ZakatService>>();
        _service = new ZakatService(_mockRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ProcessZakat_ValidWealth_SavesTransaction()
    {
        // Arrange
        var payerId = Guid.NewGuid();
        _mockRepository
            .Setup(r => r.AddAsync(It.IsAny<ZakatTransaction>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.ProcessAsync(payerId, 100_000m, CancellationToken.None);

        // Assert
        _mockRepository.Verify(
            r => r.AddAsync(
                It.Is<ZakatTransaction>(t => t.PayerId == payerId && t.ZakatAmount == 2_500m),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
```

### Returning Values from Mocks

```csharp
// CORRECT: return domain objects from mocks
_mockRepository
    .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync(new ZakatTransaction
    {
        TransactionId = Guid.NewGuid(),
        PayerId = Guid.NewGuid(),
        Wealth = 100_000m,
        ZakatAmount = 2_500m,
        PaidAt = DateTimeOffset.UtcNow
    });

// CORRECT: simulate null (not found)
_mockRepository
    .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync((ZakatTransaction?)null);
```

## Async Test Patterns

### Async Test Methods

**MUST** use `async Task` (not `async void`) for all async test methods.

```csharp
// CORRECT: async Task test method
[Fact]
public async Task GetTransaction_ExistingId_ReturnsTransaction()
{
    var transactionId = Guid.NewGuid();
    _mockRepository
        .Setup(r => r.GetByIdAsync(transactionId, It.IsAny<CancellationToken>()))
        .ReturnsAsync(ZakatTestData.Generate());

    var result = await _service.GetTransactionAsync(transactionId, CancellationToken.None);

    result.Should().NotBeNull();
}

// WRONG: async void (unhandled exceptions not propagated to test runner)
[Fact]
public async void GetTransaction_ExistingId_ReturnsTransaction() { } // WRONG
```

### CancellationToken in Tests

**MUST** pass `CancellationToken.None` explicitly in test invocations (not `default`).

```csharp
// CORRECT: explicit CancellationToken.None
var result = await _service.ProcessAsync(payerId, wealth, CancellationToken.None);

// WRONG: omitting CancellationToken when it is required
var result = await _service.ProcessAsync(payerId, wealth); // loses explicitness
```

## TestContainers.Net for Database Tests

**MUST** use TestContainers.Net for repository-level integration tests. **MUST NOT** mock `DbContext` or `IZakatRepository` in repository tests.

```csharp
// ZakatRepositoryIntegrationTests.cs
public class ZakatRepositoryIntegrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private ZakatDbContext _dbContext = null!;
    private ZakatRepository _repository = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var options = new DbContextOptionsBuilder<ZakatDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        _dbContext = new ZakatDbContext(options);
        await _dbContext.Database.MigrateAsync();
        _repository = new ZakatRepository(_dbContext);
    }

    public async Task DisposeAsync()
    {
        await _dbContext.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task AddAsync_ValidTransaction_PersistsToDatabase()
    {
        // Arrange
        var transaction = new ZakatTransaction
        {
            TransactionId = Guid.NewGuid(),
            PayerId = Guid.NewGuid(),
            Wealth = 100_000m,
            ZakatAmount = 2_500m,
            PaidAt = DateTimeOffset.UtcNow
        };

        // Act
        await _repository.AddAsync(transaction, CancellationToken.None);
        await _dbContext.SaveChangesAsync();

        // Assert
        var persisted = await _repository.GetByIdAsync(transaction.TransactionId, CancellationToken.None);
        persisted.Should().NotBeNull();
        persisted!.ZakatAmount.Should().Be(2_500m);
    }
}
```

## WebApplicationFactory for API Integration Tests

**MUST** use WebApplicationFactory for ASP.NET Core endpoint integration tests.

```csharp
// ZakatApiIntegrationTests.cs
public class ZakatApiIntegrationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task PostZakat_ValidRequest_Returns201Created()
    {
        // Arrange
        var request = new
        {
            PayerId = Guid.NewGuid(),
            Wealth = 100_000m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/zakat", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ZakatTransactionDto>();
        body.Should().NotBeNull();
        body!.ZakatAmount.Should().Be(2_500m);
    }
}
```

## Code Coverage Requirements

**MUST** achieve >=95% line coverage measured with Coverlet and enforced by `rhino-cli test-coverage validate`.

```xml
<!-- OsePlatform.Zakat.Tests.csproj -->
<ItemGroup>
  <PackageReference Include="coverlet.collector" Version="6.0.2">
    <PrivateAssets>all</PrivateAssets>
  </PackageReference>
</ItemGroup>
```

```bash
# Collect coverage
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# Enforce threshold
rhino-cli test-coverage validate ./coverage/*/coverage.cobertura.xml 95
```

## Enforcement

- **xUnit** - Test discovery and execution
- **FluentAssertions** - Readable, maintainable assertions (mandatory)
- **Coverlet** - Coverage measurement in CI/CD
- **rhino-cli test-coverage validate** - Enforces >=95% threshold

**Pre-commit checklist**:

- [ ] All tests use `async Task` (not `async void`)
- [ ] FluentAssertions used for all assertions
- [ ] Arrange-Act-Assert structure with blank line separators
- [ ] Repository tests use TestContainers.Net (not mocked DbContext)
- [ ] API integration tests use WebApplicationFactory
- [ ] `CancellationToken.None` passed explicitly in test calls

## Related Standards

- [Coding Standards](coding-standards.md) - Naming, idioms for production code
- [Code Quality Standards](code-quality-standards.md) - Coverage enforcement
- [Framework Integration](framework-integration.md) - EF Core, ASP.NET Core setup

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
