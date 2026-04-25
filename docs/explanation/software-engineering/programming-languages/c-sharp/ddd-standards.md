---
title: "C# DDD Standards"
description: Authoritative OSE Platform C# Domain-Driven Design standards (Value Objects with records, Aggregate roots, Domain Events, Clean Architecture)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - ddd
  - domain-driven-design
  - aggregates
  - value-objects
  - records
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative Domain-Driven Design standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers modeling Sharia-compliant financial domain

**Scope**: Value Objects with records, Entity<TId> base class, Aggregate roots with invariants, Repository pattern, Domain Events with MediatR, Specification pattern, strongly-typed IDs, Clean Architecture layers

## Software Engineering Principles

### 1. Immutability Over Mutability

**PASS Example** (Immutable Value Object):

```csharp
// CORRECT: record-based value object - immutable by default, structural equality
public sealed record Money(decimal Amount, string Currency)
{
    public static Money Zero(string currency) => new(0m, currency);

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException(
                $"Cannot add {Currency} and {other.Currency} money.");
        return this with { Amount = Amount + other.Amount };
    }

    public Money MultiplyBy(decimal factor) => this with { Amount = Amount * factor };
}
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Pure domain invariant enforcement):

```csharp
// CORRECT: pure domain logic in aggregate - no DB, no HTTP
public sealed class ZakatAggregate
{
    private readonly List<DomainEvent> _domainEvents = [];

    public Guid Id { get; private init; }
    public Money Wealth { get; private set; }
    public Money NisabThreshold { get; private init; }

    // Pure invariant check - no side effects
    public bool IsZakatObligatory() => Wealth.Amount >= NisabThreshold.Amount;

    // Business operation - raises domain event, no external calls
    public Money CalculateZakat()
    {
        if (!IsZakatObligatory())
            throw ZakatDomainException.BelowNisab(Wealth.Amount, NisabThreshold.Amount);

        var zakatAmount = Wealth.MultiplyBy(0.025m);
        _domainEvents.Add(new ZakatCalculatedEvent(Id, zakatAmount));
        return zakatAmount;
    }
}
```

## Value Objects

**MUST** implement Value Objects as `sealed record` types (or `readonly record struct` for small stack-friendly types).

```csharp
// ZakatId.cs - strongly-typed ID (record struct for small value)
public readonly record struct ZakatId(Guid Value)
{
    public static ZakatId New() => new(Guid.NewGuid());
    public static ZakatId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}

// Money.cs - Value Object with business rules
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount cannot be negative.");
        if (string.IsNullOrWhiteSpace(currency) || currency.Length != 3)
            throw new ArgumentException("Currency must be a 3-letter ISO code.", nameof(currency));

        Amount = amount;
        Currency = currency.ToUpperInvariant();
    }

    public static Money Zero(string currency) => new(0m, currency);

    public Money Add(Money other)
    {
        GuardSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        GuardSameCurrency(other);
        return new Money(Amount - other.Amount, Currency);
    }

    public Money MultiplyBy(decimal factor) => new(Amount * factor, Currency);

    private void GuardSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Currency mismatch: {Currency} vs {other.Currency}.");
    }
}

// NisabThreshold.cs - domain concept as record
public sealed record NisabThreshold(Money GoldEquivalent, DateTimeOffset ValidFrom)
{
    public static NisabThreshold Standard =>
        new(new Money(5_000m, "MYR"), DateTimeOffset.UtcNow);
}
```

## Entity Base Class

**MUST** use a common `Entity<TId>` base class for all entities with identity.

```csharp
// Entity.cs - base class for entities with identity
public abstract class Entity<TId> where TId : notnull
{
    public TId Id { get; protected init; } = default!;

    protected Entity() { } // for EF Core

    protected Entity(TId id)
    {
        ArgumentNullException.ThrowIfNull(id);
        Id = id;
    }

    public override bool Equals(object? obj)
    {
        if (obj is not Entity<TId> other) return false;
        if (ReferenceEquals(this, other)) return true;
        return Id.Equals(other.Id);
    }

    public override int GetHashCode() => Id.GetHashCode();
}
```

## Aggregate Roots

**MUST** define a clear Aggregate Root that owns all invariant enforcement. **MUST NOT** access entities inside an aggregate from outside — only through the root.

```csharp
// ZakatAggregate.cs - Aggregate Root
public sealed class ZakatAggregate : Entity<ZakatId>
{
    private readonly List<ZakatPayment> _payments = [];
    private readonly List<DomainEvent> _domainEvents = [];

    public Guid PayerId { get; private init; }
    public Money Wealth { get; private set; }
    public Money NisabThreshold { get; private init; }
    public bool IsCompleted { get; private set; }

    // Read-only access to domain events for dispatch
    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    private ZakatAggregate() { } // for EF Core

    // Factory method - single entry point for creation
    public static ZakatAggregate Create(
        Guid payerId,
        Money wealth,
        Money nisabThreshold)
    {
        ArgumentOutOfRangeException.ThrowIfEqual(payerId, Guid.Empty);
        ArgumentNullException.ThrowIfNull(wealth);
        ArgumentNullException.ThrowIfNull(nisabThreshold);

        var aggregate = new ZakatAggregate
        {
            Id = ZakatId.New(),
            PayerId = payerId,
            Wealth = wealth,
            NisabThreshold = nisabThreshold,
            IsCompleted = false
        };

        aggregate._domainEvents.Add(new ZakatInitiatedEvent(aggregate.Id, payerId, wealth));
        return aggregate;
    }

    // Domain operation with invariant enforcement
    public ZakatPayment RecordPayment(Money amount, DateTimeOffset paidAt)
    {
        if (IsCompleted)
            throw new ZakatDomainException("ZAKAT_ALREADY_COMPLETED",
                "Cannot record payment for a completed Zakat obligation.");

        if (amount.Amount <= 0)
            throw new ZakatDomainException("ZAKAT_INVALID_PAYMENT",
                "Payment amount must be positive.");

        if (amount.Currency != Wealth.Currency)
            throw new ZakatDomainException("ZAKAT_CURRENCY_MISMATCH",
                $"Payment currency {amount.Currency} does not match Zakat currency {Wealth.Currency}.");

        var payment = new ZakatPayment(ZakatPaymentId.New(), Id, amount, paidAt);
        _payments.Add(payment);

        var totalPaid = _payments.Aggregate(Money.Zero(Wealth.Currency),
            (sum, p) => sum.Add(p.Amount));

        var obligatoryAmount = CalculateObligatoryAmount();
        if (totalPaid.Amount >= obligatoryAmount.Amount)
        {
            IsCompleted = true;
            _domainEvents.Add(new ZakatFulfilledEvent(Id, PayerId, totalPaid));
        }

        return payment;
    }

    public Money CalculateObligatoryAmount()
    {
        if (Wealth.Amount < NisabThreshold.Amount)
            return Money.Zero(Wealth.Currency);

        return Wealth.MultiplyBy(0.025m);
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

## Strongly-Typed IDs

**MUST** use strongly-typed IDs (record struct) to prevent primitive obsession and ID confusion across aggregates.

```csharp
// ZakatId.cs
public readonly record struct ZakatId(Guid Value)
{
    public static ZakatId New() => new(Guid.NewGuid());
    public static implicit operator Guid(ZakatId id) => id.Value;
}

// ZakatPaymentId.cs
public readonly record struct ZakatPaymentId(Guid Value)
{
    public static ZakatPaymentId New() => new(Guid.NewGuid());
    public static implicit operator Guid(ZakatPaymentId id) => id.Value;
}

// CORRECT: compiler prevents mixing ZakatId with ZakatPaymentId
ZakatId zakatId = ZakatId.New();
ZakatPaymentId paymentId = ZakatPaymentId.New();

// This would be a compile error:
// ZakatId wrongId = paymentId; // type mismatch
```

## Repository Pattern

**MUST** define repository interfaces in the Domain layer. **MUST** implement repositories in the Infrastructure layer.

```csharp
// Domain layer: interface
public interface IZakatRepository
{
    Task<ZakatAggregate?> GetByIdAsync(ZakatId id, CancellationToken cancellationToken);
    Task<IReadOnlyList<ZakatAggregate>> GetByPayerIdAsync(
        Guid payerId, CancellationToken cancellationToken);
    Task AddAsync(ZakatAggregate aggregate, CancellationToken cancellationToken);
    Task UpdateAsync(ZakatAggregate aggregate, CancellationToken cancellationToken);
}

// Infrastructure layer: EF Core implementation
public sealed class ZakatRepository(ZakatDbContext dbContext) : IZakatRepository
{
    public async Task<ZakatAggregate?> GetByIdAsync(ZakatId id, CancellationToken ct)
        => await dbContext.ZakatAggregates
            .Include(a => a.Payments)
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(ZakatAggregate aggregate, CancellationToken ct)
    {
        await dbContext.ZakatAggregates.AddAsync(aggregate, ct);
        await dbContext.SaveChangesAsync(ct);
        await DispatchDomainEventsAsync(aggregate, ct);
    }

    private async Task DispatchDomainEventsAsync(ZakatAggregate aggregate, CancellationToken ct)
    {
        foreach (var domainEvent in aggregate.DomainEvents)
        {
            await _mediator.Publish(domainEvent, ct);
        }
        aggregate.ClearDomainEvents();
    }
}
```

## Domain Events

**MUST** raise Domain Events for significant state changes. **MUST** publish via MediatR `INotification`.

```csharp
// Domain Events (in Domain layer)
public abstract record DomainEvent(Guid EventId, DateTimeOffset OccurredAt)
{
    protected DomainEvent() : this(Guid.NewGuid(), DateTimeOffset.UtcNow) { }
}

public sealed record ZakatInitiatedEvent(
    ZakatId ZakatId,
    Guid PayerId,
    Money Wealth) : DomainEvent, INotification;

public sealed record ZakatFulfilledEvent(
    ZakatId ZakatId,
    Guid PayerId,
    Money TotalPaid) : DomainEvent, INotification;

// Domain Event Handler (in Application layer)
public sealed class ZakatFulfilledEventHandler(
    IEmailService emailService,
    ILogger<ZakatFulfilledEventHandler> logger)
    : INotificationHandler<ZakatFulfilledEvent>
{
    public async Task Handle(
        ZakatFulfilledEvent notification,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Zakat fulfilled for payer {PayerId}. Total: {Amount}",
            notification.PayerId, notification.TotalPaid.Amount);

        await emailService.SendZakatReceiptAsync(
            notification.PayerId, notification.TotalPaid, cancellationToken);
    }
}
```

## Specification Pattern

**SHOULD** use Specification pattern for reusable domain query logic.

```csharp
// Specification.cs - base specification
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public bool IsSatisfiedBy(T entity) => ToExpression().Compile()(entity);

    public Specification<T> And(Specification<T> other)
        => new AndSpecification<T>(this, other);
}

// ZakatObligatorySpecification.cs
public sealed class ZakatObligatorySpecification(decimal nisab)
    : Specification<ZakatAggregate>
{
    public override Expression<Func<ZakatAggregate, bool>> ToExpression() =>
        zakat => zakat.Wealth.Amount >= nisab && !zakat.IsCompleted;
}

// Usage in repository
public async Task<IReadOnlyList<ZakatAggregate>> GetObligatoryAsync(
    decimal nisab, CancellationToken ct)
{
    var spec = new ZakatObligatorySpecification(nisab);
    return await dbContext.ZakatAggregates
        .Where(spec.ToExpression())
        .ToListAsync(ct);
}
```

## Clean Architecture Layers

**MUST** organize C# projects following Clean Architecture:

```
OsePlatform.Zakat/
├── src/
│   ├── OsePlatform.Zakat.Domain/        # Entities, Value Objects, Domain Events, Interfaces
│   │   ├── Aggregates/ZakatAggregate.cs
│   │   ├── ValueObjects/Money.cs
│   │   ├── Events/ZakatFulfilledEvent.cs
│   │   └── Repositories/IZakatRepository.cs
│   ├── OsePlatform.Zakat.Application/   # Commands, Queries, Handlers, DTOs
│   │   ├── Commands/CreateZakatCommand.cs
│   │   ├── Queries/GetZakatTransactionQuery.cs
│   │   └── Validators/CreateZakatCommandValidator.cs
│   ├── OsePlatform.Zakat.Infrastructure/ # EF Core, external services, repositories
│   │   ├── Persistence/ZakatDbContext.cs
│   │   └── Repositories/ZakatRepository.cs
│   └── OsePlatform.Zakat.Api/           # ASP.NET Core, controllers/endpoints
│       └── Controllers/ZakatController.cs
```

**Dependency rule**: Domain ← Application ← Infrastructure → (Application, Domain)
Domain ← Application ← Api → (Application, Domain)

## Enforcement

- **Clean Architecture enforcer** - Enforce layer boundaries via ArchUnitNET tests
- **Code reviews** - Verify domain logic has no infrastructure dependencies
- **Domain Events** - All significant state changes MUST raise domain events

**Pre-commit checklist**:

- [ ] Value Objects implemented as `sealed record` or `readonly record struct`
- [ ] Aggregate Root enforces all invariants before state change
- [ ] Repository interface in Domain layer, implementation in Infrastructure layer
- [ ] Domain Events published via MediatR INotification
- [ ] Strongly-typed IDs prevent ID confusion across aggregates
- [ ] Domain layer has zero references to ASP.NET Core, EF Core, or infrastructure

## Related Standards

- [Coding Standards](coding-standards.md) - Record types, immutability patterns
- [Framework Integration](framework-integration.md) - EF Core owned entities for value objects
- [API Standards](api-standards.md) - CQRS with MediatR

## Related Documentation

- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
