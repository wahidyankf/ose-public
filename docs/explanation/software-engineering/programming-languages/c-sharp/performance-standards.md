---
title: "C# Performance Standards"
description: Authoritative OSE Platform C# performance standards (Span<T>, ArrayPool, BenchmarkDotNet, dotnet-trace profiling, IAsyncEnumerable)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - performance
  - profiling
  - benchmarks
  - span
  - memory
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers optimizing memory usage or CPU-bound paths

**Scope**: Span<T>/Memory<T>, ArrayPool<T>, stackalloc, struct vs class, BenchmarkDotNet, dotnet-trace/dotnet-counters, IAsyncEnumerable, ValueTask<T>

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated benchmark tracking):

```csharp
// ZakatCalculatorBenchmarks.cs - automated performance regression detection
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net80)]
public class ZakatCalculatorBenchmarks
{
    private readonly decimal[] _wealthValues =
        Enumerable.Range(1, 10_000).Select(i => i * 1_000m).ToArray();

    [Benchmark(Baseline = true)]
    public decimal CalculateLinq() =>
        _wealthValues.Where(w => w >= 5_000).Sum(w => w * 0.025m);

    [Benchmark]
    public decimal CalculateLoop()
    {
        decimal total = 0;
        foreach (var w in _wealthValues.AsSpan())
            if (w >= 5_000) total += w * 0.025m;
        return total;
    }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit memory boundaries with Span):

```csharp
// CORRECT: Span<T> makes buffer ownership and bounds explicit
public static decimal ParseZakatAmount(ReadOnlySpan<char> input)
{
    // operates on slice of existing memory, no allocation
    if (decimal.TryParse(input, out var amount))
        return amount;
    throw new FormatException($"Invalid zakat amount: {input.ToString()}");
}
```

## Span<T> and Memory<T>

**SHOULD** use `Span<T>` and `Memory<T>` to reduce heap allocations in hot paths.

### Span<T> for Stack-Scoped Buffers

```csharp
// CORRECT: Span<T> to process string without allocation
public static int CountZakatablePayees(ReadOnlySpan<char> csvData)
{
    int count = 0;
    foreach (var line in csvData.EnumerateLines())
    {
        if (line.Contains("ZAKAT_OBLIGATORY"))
            count++;
    }
    return count;
}

// CORRECT: stackalloc with Span<T> for small temporary buffers
public static string FormatZakatId(int sequenceNumber)
{
    Span<char> buffer = stackalloc char[32]; // stack allocation, no GC pressure
    bool success = sequenceNumber.TryFormat(buffer, out int written);
    return success ? $"ZKT-{buffer[..written]}" : throw new OverflowException();
}
```

### Memory<T> for Heap-Owned Async Buffers

```csharp
// CORRECT: Memory<T> for async-compatible buffer (cannot use Span<T> across await)
public async Task ProcessZakatDataAsync(
    Memory<byte> buffer,
    CancellationToken cancellationToken)
{
    int bytesRead = await _stream.ReadAsync(buffer, cancellationToken);
    var data = buffer[..bytesRead];
    // process data...
}
```

## ArrayPool<T>

**SHOULD** use `ArrayPool<T>.Shared` to rent temporary arrays instead of allocating new ones.

```csharp
// CORRECT: rent and return array to avoid GC pressure
public decimal[] CalculateZakatBatch(IReadOnlyList<decimal> wealthValues, decimal nisab)
{
    // Rent from pool (may be larger than requested - check actual length)
    decimal[] rentedBuffer = ArrayPool<decimal>.Shared.Rent(wealthValues.Count);
    try
    {
        for (int i = 0; i < wealthValues.Count; i++)
        {
            rentedBuffer[i] = wealthValues[i] >= nisab
                ? wealthValues[i] * 0.025m
                : 0m;
        }
        // Return a copy of just the used portion
        return rentedBuffer[..wealthValues.Count];
    }
    finally
    {
        ArrayPool<decimal>.Shared.Return(rentedBuffer, clearArray: true);
    }
}

// WRONG: allocating new array every time
public decimal[] CalculateZakatBatch(IReadOnlyList<decimal> wealthValues, decimal nisab)
{
    return wealthValues.Select(w => w >= nisab ? w * 0.025m : 0m).ToArray(); // allocation each call
}
```

## Struct vs Class Decision Criteria

**SHOULD** use `struct` (or `record struct`) for:

- Small, immutable value types (≤16 bytes)
- Frequently created and discarded types in hot paths
- Types where value semantics (copy on assignment) are desired

```csharp
// CORRECT: record struct for small value types (2 decimals = 16 bytes)
public readonly record struct ZakatRate(decimal Rate, decimal Nisab)
{
    public static readonly ZakatRate Standard = new(0.025m, 5_000m);
}

// CORRECT: class for larger domain objects with identity
public sealed class ZakatTransaction
{
    public Guid TransactionId { get; init; }
    public Guid PayerId { get; init; }
    public decimal Wealth { get; init; }
    public decimal ZakatAmount { get; init; }
    public DateTimeOffset PaidAt { get; init; }
}

// WRONG: struct for large types (causes excessive copying)
public struct LargeZakatReport
{
    public decimal[] MonthlyAmounts; // 12 * 16 bytes = too large for struct
    public string[] PayerNames;
}
```

## BenchmarkDotNet

**MUST** use BenchmarkDotNet to measure and track performance for optimizations. **MUST NOT** optimize without measurement.

```csharp
// Benchmarks/ZakatCalculatorBenchmarks.cs
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

[MemoryDiagnoser]          // Track allocations (Gen0, Gen1, Allocated)
[SimpleJob(RuntimeMoniker.Net80)]
public class ZakatCalculatorBenchmarks
{
    private const decimal Nisab = 5_000m;
    private decimal[] _wealthArray = null!;

    [Params(100, 1_000, 10_000)]
    public int Count;

    [GlobalSetup]
    public void Setup()
    {
        _wealthArray = Enumerable.Range(1, Count)
            .Select(i => i * 1_000m)
            .ToArray();
    }

    [Benchmark(Baseline = true)]
    public decimal LinqApproach() =>
        _wealthArray.Where(w => w >= Nisab).Sum(w => w * 0.025m);

    [Benchmark]
    public decimal SpanApproach()
    {
        decimal total = 0;
        foreach (var w in _wealthArray.AsSpan())
            if (w >= Nisab) total += w * 0.025m;
        return total;
    }
}

// Run benchmarks: dotnet run -c Release --project Benchmarks
```

## dotnet-trace and dotnet-counters

**MUST** use production profiling tools before optimizing live services.

```bash
# Install profiling tools
dotnet tool install --global dotnet-trace
dotnet tool install --global dotnet-counters

# Monitor real-time metrics for a running process
dotnet-counters monitor --process-id <PID> \
    --counters System.Runtime,Microsoft.AspNetCore.Hosting

# Collect a performance trace (CPU + GC sampling)
dotnet-trace collect --process-id <PID> \
    --output ./zakat-service-trace.nettrace \
    --profile gc-verbose

# Analyze in PerfView or Speedscope
# speedscope.app supports .nettrace files
```

## IAsyncEnumerable for Streaming

**SHOULD** use `IAsyncEnumerable<T>` for streaming large result sets from databases or external services.

```csharp
// CORRECT: stream Zakat transactions without loading all into memory
public async IAsyncEnumerable<ZakatTransaction> StreamTransactionsAsync(
    Guid payerId,
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var transaction in _dbContext.ZakatTransactions
        .Where(t => t.PayerId == payerId)
        .AsAsyncEnumerable()
        .WithCancellation(cancellationToken))
    {
        yield return transaction;
    }
}

// CORRECT: consume the stream in controller
[HttpGet("{payerId}/stream")]
public async IAsyncEnumerable<ZakatTransactionDto> StreamTransactions(
    Guid payerId,
    [EnumeratorCancellation] CancellationToken cancellationToken)
{
    await foreach (var tx in _service.StreamTransactionsAsync(payerId, cancellationToken))
    {
        yield return tx.ToDto();
    }
}

// WRONG: loading all into memory for large datasets
public async Task<List<ZakatTransaction>> GetAllTransactionsAsync(Guid payerId, CancellationToken ct)
    => await _dbContext.ZakatTransactions
        .Where(t => t.PayerId == payerId)
        .ToListAsync(ct); // loads all records at once - dangerous for large tables
```

## Avoiding Large Object Heap (LOH) Allocations

**SHOULD** avoid single allocations of 85,000+ bytes, which go to the LOH and cause GC pressure.

```csharp
// WRONG: potentially LOH allocation
byte[] largeBuffer = new byte[100_000]; // goes to LOH

// CORRECT: use ArrayPool for large temporary buffers
byte[] rentedBuffer = ArrayPool<byte>.Shared.Rent(100_000);
try
{
    // use rentedBuffer
}
finally
{
    ArrayPool<byte>.Shared.Return(rentedBuffer);
}
```

## FrozenDictionary for Immutable Lookups (.NET 8+)

**SHOULD** use `FrozenDictionary<TKey,TValue>` for read-only lookup tables that are initialized once and never modified.

```csharp
// CORRECT: FrozenDictionary for high-performance, read-only Zakat rate table
using System.Collections.Frozen;

public static class ZakatRates
{
    public static readonly FrozenDictionary<ZakatAssetType, decimal> Rates =
        new Dictionary<ZakatAssetType, decimal>
        {
            [ZakatAssetType.Gold] = 0.025m,
            [ZakatAssetType.Silver] = 0.025m,
            [ZakatAssetType.Cash] = 0.025m,
            [ZakatAssetType.LivestockCattle] = 0.01m
        }.ToFrozenDictionary();
}
```

## Enforcement

- **BenchmarkDotNet** - Performance measurements required before optimization claims
- **Memory Diagnoser** - Allocation tracking in benchmarks
- **dotnet-trace** - Production profiling for memory and CPU
- **Code reviews** - Verify Span/ArrayPool usage in hot paths

**Pre-commit checklist**:

- [ ] No optimization without BenchmarkDotNet measurement
- [ ] `ArrayPool<T>.Shared` used for large temporary arrays (>1KB)
- [ ] `Span<T>` used for synchronous, stack-scoped operations
- [ ] `Memory<T>` used for async buffer operations
- [ ] `IAsyncEnumerable<T>` for streaming large datasets
- [ ] `FrozenDictionary` for read-only lookup tables

## Related Standards

- [Concurrency Standards](concurrency-standards.md) - ValueTask<T> for hot paths, Parallel.ForEachAsync
- [Coding Standards](coding-standards.md) - Struct vs record struct decisions

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
