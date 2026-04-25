---
title: "C# Concurrency Standards"
description: Authoritative OSE Platform C# concurrency standards (async/await, CancellationToken, Channel<T>, Parallel.ForEachAsync)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - concurrency
  - async-await
  - task
  - channels
  - plinq
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative concurrency standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers writing asynchronous or parallel code

**Scope**: async/await best practices, Task vs ValueTask, CancellationToken, Channel<T>, Parallel.ForEachAsync, PLINQ, SemaphoreSlim, deadlock prevention

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit async throughout the call chain):

```csharp
// CORRECT: async propagated explicitly from endpoint to repository
[HttpPost]
public async Task<IActionResult> ProcessZakat(
    [FromBody] ZakatRequest request,
    CancellationToken cancellationToken) // explicit from HttpContext
{
    var transaction = await _service.ProcessAsync(
        request.PayerId, request.Wealth, cancellationToken);
    return Created($"/api/zakat/{transaction.TransactionId}", transaction);
}

public async Task<ZakatTransaction> ProcessAsync(
    Guid payerId, decimal wealth, CancellationToken cancellationToken) // explicit
{
    var transaction = CreateTransaction(payerId, wealth);
    await _repository.AddAsync(transaction, cancellationToken); // propagated
    return transaction;
}
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Isolated concurrency from domain logic):

```csharp
// CORRECT: pure domain function, concurrency handled at application layer
public static decimal CalculateZakat(decimal wealth, decimal nisab) =>
    wealth >= nisab ? wealth * 0.025m : 0m; // pure, no async

// Application layer handles concurrency
public async Task<IReadOnlyList<ZakatCalculation>> CalculateBatchAsync(
    IReadOnlyList<ZakatRequest> requests,
    CancellationToken cancellationToken)
{
    // Parallel execution, pure calculation function reused
    return await Task.WhenAll(
        requests.Select(r => Task.Run(
            () => new ZakatCalculation
            {
                PayerId = r.PayerId,
                Amount = CalculateZakat(r.Wealth, _nisab) // pure function
            },
            cancellationToken)));
}
```

## async/await Best Practices

### Avoid `async void`

**PROHIBITED**: `async void` methods except for event handlers.

```csharp
// WRONG: async void - exceptions are unhandled, cannot be awaited
public async void ProcessZakat(decimal wealth)
{
    await _service.ProcessAsync(wealth, CancellationToken.None);
}

// CORRECT: async Task
public async Task ProcessZakatAsync(decimal wealth, CancellationToken cancellationToken)
{
    await _service.ProcessAsync(wealth, cancellationToken);
}

// ONLY exception: event handlers (unavoidable in UI frameworks)
private async void OnZakatButtonClicked(object sender, EventArgs e)
{
    try
    {
        await ProcessZakatAsync(wealth, CancellationToken.None);
    }
    catch (Exception ex)
    {
        // MUST catch all exceptions in async void event handlers
        _logger.LogError(ex, "Error processing zakat from UI");
    }
}
```

### ConfigureAwait in Library Code

**MUST** use `ConfigureAwait(false)` in library and infrastructure code to avoid deadlocks when called from synchronization-context-bound environments.

```csharp
// CORRECT: library/infrastructure code uses ConfigureAwait(false)
public sealed class ZakatRepository(ZakatDbContext dbContext)
{
    public async Task<ZakatTransaction?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await dbContext.ZakatTransactions
            .FirstOrDefaultAsync(t => t.TransactionId == id, cancellationToken)
            .ConfigureAwait(false); // library code
    }
}

// NOTE: ASP.NET Core controllers and application services do NOT need ConfigureAwait(false)
// because ASP.NET Core has no synchronization context
```

### Naming Convention

**MUST** suffix all async methods with `Async`.

```csharp
// CORRECT
public async Task<ZakatTransaction> ProcessAsync(decimal wealth, CancellationToken ct) { }
public async Task SaveAsync(ZakatTransaction transaction, CancellationToken ct) { }

// WRONG: missing Async suffix
public async Task<ZakatTransaction> Process(decimal wealth) { }
```

## Task vs ValueTask

**MUST** use `Task<T>` as the default return type for async methods.

**SHOULD** use `ValueTask<T>` only for hot-path methods that frequently complete synchronously without allocation.

```csharp
// CORRECT: Task<T> for standard async operations (database, HTTP)
public async Task<ZakatTransaction?> GetByIdAsync(Guid id, CancellationToken ct)
    => await _dbContext.ZakatTransactions.FindAsync([id], ct);

// CORRECT: ValueTask<T> for hot-path methods that often return cached values synchronously
private readonly Dictionary<Guid, ZakatTransaction> _cache = [];

public ValueTask<ZakatTransaction?> GetCachedAsync(Guid id)
{
    if (_cache.TryGetValue(id, out var cached))
        return ValueTask.FromResult<ZakatTransaction?>(cached); // sync, no allocation

    return new ValueTask<ZakatTransaction?>(FetchAndCacheAsync(id)); // async path
}

// WRONG: ValueTask used unnecessarily for always-async method
public ValueTask<ZakatTransaction> AlwaysAsyncOperation(Guid id, CancellationToken ct)
    => new(FetchFromDatabase(id, ct)); // no benefit over Task<T>
```

## CancellationToken Propagation

**MUST** accept `CancellationToken cancellationToken = default` in all public async methods.

**MUST** propagate `CancellationToken` to every I/O-bound call.

```csharp
// CORRECT: CancellationToken on every async public method
public async Task<IReadOnlyList<ZakatTransaction>> GetPendingAsync(
    Guid payerId,
    CancellationToken cancellationToken = default)
{
    return await _dbContext.ZakatTransactions
        .Where(t => t.PayerId == payerId && !t.IsCompleted)
        .ToListAsync(cancellationToken) // propagated to EF Core
        .ConfigureAwait(false);
}

// WRONG: CancellationToken not propagated to I/O
public async Task<IReadOnlyList<ZakatTransaction>> GetPendingAsync(Guid payerId)
{
    return await _dbContext.ZakatTransactions
        .Where(t => t.PayerId == payerId)
        .ToListAsync(); // no cancellation - hangs if client disconnects
}
```

## Channel<T> for Producer-Consumer

**SHOULD** use `Channel<T>` for producer-consumer patterns requiring backpressure control.

```csharp
// ZakatBatchProcessor.cs - producer-consumer with Channel
public sealed class ZakatBatchProcessor : IAsyncDisposable
{
    private readonly Channel<ZakatRequest> _channel =
        Channel.CreateBounded<ZakatRequest>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false
        });

    // Producer: enqueue zakat requests for processing
    public async Task EnqueueAsync(ZakatRequest request, CancellationToken cancellationToken)
        => await _channel.Writer.WriteAsync(request, cancellationToken);

    // Consumer: process requests as they arrive
    public async Task ProcessAsync(CancellationToken cancellationToken)
    {
        await foreach (var request in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            await ProcessSingleAsync(request, cancellationToken);
        }
    }

    public async ValueTask DisposeAsync()
    {
        _channel.Writer.Complete();
        await _channel.Reader.Completion;
    }

    private async Task ProcessSingleAsync(ZakatRequest request, CancellationToken ct)
    {
        var zakatAmount = ZakatCalculator.Calculate(request.Wealth, _nisab);
        await _repository.AddAsync(new ZakatTransaction
        {
            PayerId = request.PayerId,
            ZakatAmount = zakatAmount
        }, ct);
    }
}
```

## Parallel.ForEachAsync (.NET 6+)

**SHOULD** use `Parallel.ForEachAsync` for bounded parallel I/O-bound operations.

```csharp
// CORRECT: parallel zakat batch processing with degree of parallelism
public async Task ProcessBatchAsync(
    IReadOnlyList<ZakatRequest> requests,
    CancellationToken cancellationToken)
{
    var options = new ParallelOptions
    {
        MaxDegreeOfParallelism = Environment.ProcessorCount,
        CancellationToken = cancellationToken
    };

    await Parallel.ForEachAsync(requests, options, async (request, ct) =>
    {
        var zakatAmount = ZakatCalculator.Calculate(request.Wealth, _nisab);
        await _repository.AddAsync(new ZakatTransaction
        {
            PayerId = request.PayerId,
            ZakatAmount = zakatAmount
        }, ct);
    });
}
```

## PLINQ for Data Parallelism

**SHOULD** use PLINQ for CPU-bound data parallelism on large collections.

```csharp
// CORRECT: PLINQ for parallel Zakat calculation on large dataset (CPU-bound)
public IReadOnlyList<ZakatCalculation> CalculateBatch(
    IReadOnlyList<ZakatAsset> assets,
    decimal nisab)
{
    return assets
        .AsParallel()
        .WithDegreeOfParallelism(Environment.ProcessorCount)
        .Select(asset => new ZakatCalculation
        {
            AssetId = asset.AssetId,
            Amount = ZakatCalculator.Calculate(asset.Value, nisab) // pure function
        })
        .ToList();
}

// WRONG: PLINQ for I/O-bound operations (use Parallel.ForEachAsync instead)
assets.AsParallel().Select(async a => await _repository.SaveAsync(a)).ToList(); // WRONG
```

## SemaphoreSlim for Throttling

**SHOULD** use `SemaphoreSlim` to throttle concurrent access to limited resources.

```csharp
// CORRECT: throttle concurrent external API calls
private readonly SemaphoreSlim _semaphore = new(initialCount: 10, maxCount: 10);

public async Task<ZakatRate> GetCurrentNisabRateAsync(CancellationToken cancellationToken)
{
    await _semaphore.WaitAsync(cancellationToken);
    try
    {
        return await _externalRateApi.GetNisabRateAsync(cancellationToken);
    }
    finally
    {
        _semaphore.Release();
    }
}
```

## Deadlock Prevention

**PROHIBITED**: Blocking on async code from synchronous context (deadlock risk).

```csharp
// WRONG: .Result / .Wait() cause deadlocks in ASP.NET Core
public ZakatTransaction GetTransaction(Guid id)
{
    return _repository.GetByIdAsync(id, CancellationToken.None).Result;  // DEADLOCK RISK
}

public void Save(ZakatTransaction tx)
{
    _repository.SaveAsync(tx, CancellationToken.None).Wait();  // DEADLOCK RISK
}

// CORRECT: propagate async throughout the call chain
public async Task<ZakatTransaction?> GetTransactionAsync(
    Guid id,
    CancellationToken cancellationToken)
{
    return await _repository.GetByIdAsync(id, cancellationToken);
}
```

## Interlocked / Volatile for Atomics

**SHOULD** use `Interlocked` for lock-free atomic operations on primitive types.

```csharp
// CORRECT: atomic counter without lock
private long _processedCount = 0;

public void IncrementProcessedCount() => Interlocked.Increment(ref _processedCount);

public long GetProcessedCount() => Interlocked.Read(ref _processedCount);

// CORRECT: volatile for single-read/write flag
private volatile bool _isShuttingDown = false;

public void Shutdown() => _isShuttingDown = true;
```

## Enforcement

- **Roslyn analyzers** - Detect `async void` (CA2008), detect missing `ConfigureAwait` in library code (CA2007)
- **SonarAnalyzer** - S4462 (calls to async methods should not be ignored)
- **Code reviews** - Verify CancellationToken propagation and absence of `.Result`/`.Wait()`

**Pre-commit checklist**:

- [ ] No `async void` methods (except event handlers with try/catch)
- [ ] `Async` suffix on all async methods
- [ ] `CancellationToken` on all public async methods
- [ ] `ConfigureAwait(false)` in infrastructure/library code
- [ ] No `.Result` or `.Wait()` in application or domain code
- [ ] `Channel<T>` used for producer-consumer (not `ConcurrentQueue<T>` with busy wait)

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - CancellationToken and OperationCanceledException handling
- [Performance Standards](performance-standards.md) - ValueTask for hot paths
- [API Standards](api-standards.md) - CancellationToken in controller actions

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
