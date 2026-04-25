---
title: "C# Framework Integration Standards"
description: Authoritative OSE Platform C# framework integration standards (ASP.NET Core DI, EF Core, SignalR, middleware pipeline)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - aspnet-core
  - ef-core
  - signalr
  - framework-integration
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Framework Integration Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative framework integration standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers configuring ASP.NET Core, EF Core, and related frameworks

**Scope**: ASP.NET Core DI container, lifetime management, EF Core configuration, migrations, owned entities, Repository with EF Core, SignalR Hub, Minimal API with groups, middleware pipeline order

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit DI registration with extension methods):

```csharp
// CORRECT: explicit DI registration grouped by concern in extension methods
builder.Services.AddZakatDomain();
builder.Services.AddZakatApplication();
builder.Services.AddZakatInfrastructure(builder.Configuration);

// Extension method definitions make dependencies explicit
public static class ZakatInfrastructureExtensions
{
    public static IServiceCollection AddZakatInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ZakatDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("ZakatDb")
                ?? throw new InvalidOperationException("Connection string 'ZakatDb' not found.")));

        services.AddScoped<IZakatRepository, ZakatRepository>();
        return services;
    }
}
```

### 2. Reproducibility First

**PASS Example** (Deterministic EF Core migration application):

```csharp
// CORRECT: apply migrations at startup with explicit connection verification
public static async Task ApplyMigrationsAsync(this WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ZakatDbContext>();
    await dbContext.Database.MigrateAsync();
}

// Program.cs
await app.ApplyMigrationsAsync(); // always up-to-date before serving traffic
```

## ASP.NET Core DI Container

### Lifetime Management

**MUST** understand and explicitly choose DI lifetimes:

| Lifetime    | Use Case                                                      | Example                              |
| ----------- | ------------------------------------------------------------- | ------------------------------------ |
| `Singleton` | Stateless services, caches, HttpClient via IHttpClientFactory | `FrozenDictionary` rates             |
| `Scoped`    | Per-request services, DbContext, Unit of Work                 | `ZakatDbContext`, `IZakatRepository` |
| `Transient` | Lightweight stateless factories                               | `IValidator<T>` implementations      |

```csharp
// CORRECT: explicit lifetime registration
services.AddSingleton<IZakatRateProvider, CachedZakatRateProvider>();
services.AddScoped<IZakatRepository, ZakatRepository>();
services.AddScoped<IZakatService, ZakatService>();
services.AddTransient<IValidator<CreateZakatCommand>, CreateZakatCommandValidator>();

// WRONG: DbContext as Singleton (shared across requests - EF Core is not thread-safe)
services.AddSingleton<ZakatDbContext>(); // WRONG

// CORRECT: DbContext as Scoped (one per request)
services.AddDbContext<ZakatDbContext>(options =>
    options.UseNpgsql(connectionString)); // default is Scoped
```

### IServiceCollection Extension Methods

**MUST** organize DI registration into extension methods grouped by domain/layer.

```csharp
// ZakatApplicationExtensions.cs
public static class ZakatApplicationExtensions
{
    public static IServiceCollection AddZakatApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(CreateZakatCommand).Assembly));

        services.AddValidatorsFromAssemblyContaining<CreateZakatCommandValidator>();
        services.AddFluentValidationAutoValidation();

        return services;
    }
}

// ZakatDomainExtensions.cs
public static class ZakatDomainExtensions
{
    public static IServiceCollection AddZakatDomain(this IServiceCollection services)
    {
        // Domain services (pure logic, no I/O)
        services.AddSingleton<ZakatCalculator>();
        return services;
    }
}
```

### Keyed DI Services (.NET 8+)

**SHOULD** use Keyed DI for multiple implementations of the same interface.

```csharp
// CORRECT: Keyed services for multiple Zakat calculators
services.AddKeyedSingleton<IZakatCalculator, StandardZakatCalculator>("standard");
services.AddKeyedSingleton<IZakatCalculator, AgriculturalZakatCalculator>("agricultural");

// Resolve by key
public sealed class ZakatService(
    [FromKeyedServices("standard")] IZakatCalculator standardCalculator,
    [FromKeyedServices("agricultural")] IZakatCalculator agriculturalCalculator)
{
    // ...
}
```

## EF Core Configuration

### DbContext Configuration

**MUST** configure `DbContext` using the model builder `OnModelCreating` pattern. **MUST** separate entity configuration into `IEntityTypeConfiguration<T>` classes.

```csharp
// ZakatDbContext.cs
public sealed class ZakatDbContext(DbContextOptions<ZakatDbContext> options)
    : DbContext(options)
{
    public DbSet<ZakatAggregate> ZakatAggregates => Set<ZakatAggregate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Auto-discover all IEntityTypeConfiguration<T> in the assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ZakatDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}

// ZakatAggregateConfiguration.cs
public sealed class ZakatAggregateConfiguration : IEntityTypeConfiguration<ZakatAggregate>
{
    public void Configure(EntityTypeBuilder<ZakatAggregate> builder)
    {
        builder.ToTable("zakat_aggregates");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasConversion(
                id => id.Value,          // ZakatId -> Guid
                value => new ZakatId(value)) // Guid -> ZakatId
            .HasColumnName("id");

        builder.Property(a => a.PayerId)
            .HasColumnName("payer_id")
            .IsRequired();

        builder.Property(a => a.IsCompleted)
            .HasColumnName("is_completed")
            .IsRequired();

        // Owned entity: Money is a Value Object stored in same table
        builder.OwnsOne(a => a.Wealth, wealth =>
        {
            wealth.Property(m => m.Amount).HasColumnName("wealth_amount").HasPrecision(18, 4);
            wealth.Property(m => m.Currency).HasColumnName("wealth_currency").HasMaxLength(3);
        });

        builder.OwnsOne(a => a.NisabThreshold, nisab =>
        {
            nisab.Property(m => m.Amount).HasColumnName("nisab_amount").HasPrecision(18, 4);
            nisab.Property(m => m.Currency).HasColumnName("nisab_currency").HasMaxLength(3);
        });

        // Navigation to payments
        builder.HasMany<ZakatPayment>("_payments")
            .WithOne()
            .HasForeignKey("zakat_id")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### EF Core Migrations

**MUST** use Code-First migrations. **MUST** review generated migration SQL before applying to production.

```bash
# Create new migration
dotnet ef migrations add AddZakatPaymentsTable \
    --project src/OsePlatform.Zakat.Infrastructure \
    --startup-project src/OsePlatform.Zakat.Api

# Review generated SQL before applying
dotnet ef migrations script \
    --project src/OsePlatform.Zakat.Infrastructure \
    --startup-project src/OsePlatform.Zakat.Api \
    --output migrations.sql

# Apply migrations (development)
dotnet ef database update \
    --project src/OsePlatform.Zakat.Infrastructure \
    --startup-project src/OsePlatform.Zakat.Api
```

## SignalR Hub Setup

**SHOULD** use SignalR for real-time notifications when domain events require immediate client updates.

```csharp
// ZakatNotificationHub.cs
[Authorize]
public sealed class ZakatNotificationHub : Hub
{
    public async Task JoinPayerGroup(string payerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"payer:{payerId}");
    }

    public async Task LeavePayerGroup(string payerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payer:{payerId}");
    }
}

// ZakatFulfilledEventHandler.cs - domain event triggers SignalR push
public sealed class ZakatFulfilledEventHandler(IHubContext<ZakatNotificationHub> hubContext)
    : INotificationHandler<ZakatFulfilledEvent>
{
    public async Task Handle(ZakatFulfilledEvent notification, CancellationToken ct)
    {
        await hubContext.Clients
            .Group($"payer:{notification.PayerId}")
            .SendAsync("ZakatFulfilled", new
            {
                ZakatId = notification.ZakatId,
                TotalPaid = notification.TotalPaid.Amount
            }, ct);
    }
}

// Program.cs - SignalR registration
builder.Services.AddSignalR();
app.MapHub<ZakatNotificationHub>("/hubs/zakat");
```

## Middleware Pipeline Order

**MUST** configure middleware in this order (order is significant in ASP.NET Core):

```csharp
// Program.cs - correct middleware order
var app = builder.Build();

// 1. Exception handling (outermost - catches errors from all middleware)
app.UseExceptionHandler();

// 2. HTTPS redirection
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();

// 3. Static files (served before routing)
app.UseStaticFiles();

// 4. Routing (must come before authentication/authorization)
app.UseRouting();

// 5. CORS (after routing, before authentication)
app.UseCors("ZakatPortalCors");

// 6. Authentication (must come before authorization)
app.UseAuthentication();

// 7. Authorization
app.UseAuthorization();

// 8. Response caching (after authentication)
app.UseResponseCaching();

// 9. Endpoint mapping
app.MapControllers();
app.MapHub<ZakatNotificationHub>("/hubs/zakat");
app.MapGroup("api/v1/zakat").MapZakatEndpoints();

await app.RunAsync();
```

## Minimal API with Groups and Filters

**SHOULD** use endpoint groups and filters for cross-cutting concerns in Minimal API.

```csharp
// ZakatEndpoints.cs
public static class ZakatEndpoints
{
    public static RouteGroupBuilder MapZakatEndpoints(this RouteGroupBuilder group)
    {
        // Apply filters to all endpoints in group
        group
            .AddEndpointFilter<ValidationFilter>()
            .RequireAuthorization("ZakatAdministrator")
            .WithTags("Zakat");

        group.MapGet("/{id:guid}", GetZakatTransaction);
        group.MapPost("/", CreateZakatTransaction);
        group.MapDelete("/{id:guid}", DeleteZakatTransaction);

        return group;
    }
}

// ValidationFilter.cs - reusable validation filter
public sealed class ValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        foreach (var arg in context.Arguments)
        {
            if (arg is null) continue;
            var validatorType = typeof(IValidator<>).MakeGenericType(arg.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType)
                is IValidator validator)
            {
                var result = await validator.ValidateAsync(
                    new ValidationContext<object>(arg),
                    context.HttpContext.RequestAborted);
                if (!result.IsValid)
                    return Results.ValidationProblem(result.ToDictionary());
            }
        }
        return await next(context);
    }
}
```

## TimeProvider for Testable Time (.NET 8+)

**MUST** inject `TimeProvider` instead of calling `DateTime.UtcNow` or `DateTimeOffset.UtcNow` directly in services.

```csharp
// CORRECT: inject TimeProvider for testable time
public sealed class ZakatService(
    IZakatRepository repository,
    TimeProvider timeProvider)
{
    public async Task<ZakatTransaction> ProcessAsync(
        Guid payerId, decimal wealth, CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow(); // testable!
        var transaction = new ZakatTransaction
        {
            PayerId = payerId,
            Wealth = wealth,
            PaidAt = now
        };
        await repository.AddAsync(transaction, ct);
        return transaction;
    }
}

// Program.cs registration
builder.Services.AddSingleton(TimeProvider.System);

// Test: inject FakeTimeProvider from Microsoft.Extensions.TimeProvider.Testing
var fakeTime = new FakeTimeProvider(new DateTimeOffset(2026, 3, 9, 12, 0, 0, TimeSpan.Zero));
var service = new ZakatService(mockRepository.Object, fakeTime);
```

## Enforcement

- **Code reviews** - Verify middleware order and DI lifetime correctness
- **Architecture tests (ArchUnitNET)** - Enforce Clean Architecture layer dependencies
- **Startup verification** - Integration test hits all endpoints to detect DI misconfiguration

**Pre-commit checklist**:

- [ ] DI registrations organized into extension methods by domain/layer
- [ ] DbContext lifetime is Scoped (not Singleton or Transient)
- [ ] Entity configurations in separate `IEntityTypeConfiguration<T>` classes
- [ ] Value Objects configured as EF Core Owned Entities
- [ ] Middleware pipeline follows the required order
- [ ] `TimeProvider` injected instead of `DateTime.UtcNow` used directly

## Related Standards

- [DDD Standards](ddd-standards.md) - Aggregate and Value Object design for EF Core mapping
- [API Standards](api-standards.md) - Minimal API endpoint groups
- [Security Standards](security-standards.md) - Authentication middleware placement

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
