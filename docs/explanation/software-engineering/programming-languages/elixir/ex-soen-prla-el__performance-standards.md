---
title: "Elixir Performance Standards"
description: Prescriptive performance requirements for BEAM VM-based financial systems in OSE Platform
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - performance
  - optimization
  - profiling
  - beam-vm
  - concurrency
  - memory-management
  - tail-call-optimization
  - ets
related:
  - ./ex-soen-prla-el__concurrency-standards.md
  - ./ex-soen-prla-el__memory-management-standards.md
  - ./ex-soen-prla-el__coding-standards.md
principles:
  - simplicity-over-complexity
  - automation-over-manual
updated: 2026-02-05
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Elixir fundamentals from [AyoKoding Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an Elixir tutorial. We define HOW to apply Elixir in THIS codebase, not WHAT Elixir is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for Elixir development in the OSE Platform. These standards ensure BEAM VM-based systems meet latency, throughput, and resource efficiency requirements for Shariah-compliant financial applications.

**Target Audience**: OSE Platform Elixir developers optimizing for production performance

**Scope**: Profiling, benchmarking, BEAM VM optimization, memory management, ETS caching, and concurrency patterns

**Compliance**: Code reviews MUST verify adherence to these standards for performance-critical paths.

---

### Understanding BEAM Strengths

**REQUIRED**: Production systems MUST leverage BEAM VM's core strengths:

1. **Massive Concurrency**: Handle millions of lightweight processes
2. **Predictable Latency**: Per-process garbage collection prevents system-wide pauses
3. **Fault Tolerance**: Process isolation enables hot code reloading
4. **Horizontal Scalability**: Native support for distributed systems

**Example**: BEAM handles 1 million processes using ~2.7KB per process (~2.7GB total).

```elixir
# PASS: Leveraging BEAM concurrency for I/O-bound operations
defmodule DonationProcessor do
  def process_concurrent(donation_ids) do
    donation_ids
    |> Task.async_stream(&process_donation/1,
      max_concurrency: 1000,
      timeout: 30_000
    )
    |> Enum.to_list()
  end

  defp process_donation(id) do
    # I/O-bound: database, HTTP, file operations
    {:ok, result}
  end
end

# FAIL: Using BEAM for CPU-intensive numerical computing
defmodule ComplexMath do
  # WRONG: BEAM not optimized for heavy numerical computation
  def compute_pi_to_million_digits do
    # This will be 10-100x slower than C/Rust/Go
  end
end
```

### Performance Trade-offs

**REQUIRED**: Understand BEAM VM trade-offs before architecture decisions:

| Characteristic     | BEAM Strength                         | Trade-off                                       |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| **Concurrency**    | Excellent (millions of processes)     | Single-process compute slower than C/Rust       |
| **Latency**        | Excellent (predictable, no global GC) | Lower throughput for CPU-bound tasks vs Go/Java |
| **I/O Operations** | Excellent (async, concurrent)         | CPU-intensive math operations slower            |
| **Memory**         | Good (per-process GC, isolated heaps) | Higher baseline memory usage vs Go              |

**Sweet Spot**: I/O-bound, concurrent, soft real-time applications (web APIs, messaging, real-time updates)

**Not Ideal**: CPU-intensive numerical computing, single-threaded batch processing, heavy data science workloads

## Service Level Objectives (SLOs)

**REQUIRED**: All OSE Platform Elixir services MUST meet the following latency targets (p95).

| Service Type          | p95 Latency | p99 Latency | Notes                                 |
| --------------------- | ----------- | ----------- | ------------------------------------- |
| Phoenix API endpoints | < 50ms      | < 100ms     | Account queries, balance checks       |
| LiveView updates      | < 20ms      | < 50ms      | Real-time UI updates                  |
| Background jobs       | < 1s        | < 2s        | Zakat calculations, report generation |
| GenServer calls       | < 10ms      | < 25ms      | Synchronous state access              |

**REQUIRED**: All services MUST instrument latency metrics using Telemetry.

```elixir
# REQUIRED: Instrument function latency
defmodule DonationService do
  require Logger

  def process_donation(donation_id) do
    :telemetry.span(
      [:donation, :process],
      %{donation_id: donation_id},
      fn ->
        result = do_process(donation_id)
        {result, %{status: :ok}}
      end
    )
  end

  defp do_process(_id), do: {:ok, %{}}
end
```

---

## Observer

**REQUIRED**: All developers MUST use Observer for real-time system monitoring.

```elixir
# Start Observer in IEx
:observer.start()

# 6. ETS: ETS table sizes and memory usage
```

**REQUIRED**: Production systems MUST enable remote Observer connection.

```elixir

# REQUIRED: Enable distributed Erlang for remote Observer
config :my_app, MyApp.Endpoint,
  http: [port: 4000],
  server: true

# :observer.start()
```

## fprof (Detailed Function Profiling)

**REQUIRED**: Use `:fprof` for detailed function-level profiling in development.

**PROHIBITED**: Using `:fprof` in production (high overhead, 10-100x slowdown).

```elixir
# REQUIRED: Profile specific function with :fprof
defmodule Profiling do
  def profile_donation_processing do
    # Start profiling
    :fprof.start()
    :fprof.trace([:start, {:procs, self()}])

    # Run code to profile
    DonationProcessor.process_batch(1..1000)

    # Analyze results
    :fprof.trace(:stop)
    :fprof.profile()
    :fprof.analyse([:totals, {:sort, :acc}, {:callers, true}])
  end
end

# - High CNT = call count (potential optimization target)
```

## eprof (Time-based Profiling)

**REQUIRED**: Use `:eprof` for production-safe profiling (lower overhead than `:fprof`).

```elixir
# REQUIRED: Production-safe profiling with :eprof
defmodule Profiling do
  def profile_zakat_calculation do
    :eprof.start()
    :eprof.start_profiling([self()])

    # Run production code
    for _ <- 1..10_000 do
      ZakatCalculator.calculate(
        Money.new(100_000_000, :IDR),
        Money.new(85_000_000, :IDR)
      )
    end

    :eprof.stop_profiling()
    :eprof.analyze(:total)
  end
end

# REQUIRED: Focus on functions consuming > 10% of total time
```

## Benchee (Microbenchmarking)

**REQUIRED**: All performance-critical functions MUST have Benchee benchmarks.

```elixir
# Add to mix.exs
{:benchee, "~> 1.3", only: [:dev, :test]}

# REQUIRED: Benchmark structure
defmodule MoneyBenchmarks do
  def run do
    Benchee.run(
      %{
        "Decimal multiplication" => fn ->
          Decimal.mult(Decimal.new("100.50"), Decimal.new("0.025"))
        end,
        "Money library" => fn ->
          Money.multiply(Money.new(10050, :IDR), Decimal.new("0.025"))
        end
      },
      time: 10,          # REQUIRED: 10 second benchmark time
      memory_time: 2,    # REQUIRED: 2 second memory measurement
      warmup: 2,         # REQUIRED: 2 second warmup
      formatters: [
        Benchee.Formatters.Console,
        {Benchee.Formatters.HTML, file: "benchmark_results.html"}
      ]
    )
  end
end

# mix run -e "MoneyBenchmarks.run()"
```

**REQUIRED**: Benchmark results MUST be saved and compared to detect regressions.

```bash
# REQUIRED: Save baseline
mix run -e "MoneyBenchmarks.run()" > baseline.txt

# After optimization, compare
mix run -e "MoneyBenchmarks.run()" > optimized.txt
diff baseline.txt optimized.txt
```

---

## Tail Call Optimization

**REQUIRED**: Recursive functions MUST use tail-call optimization to prevent stack overflow.

```elixir
# FAIL: Not tail-recursive - builds stack
defmodule DonationProcessor do
  def sum_donations([]), do: 0
  def sum_donations([donation | rest]) do
    donation.amount + sum_donations(rest)  # WRONG: Addition after recursive call
  end
end

# PASS: Tail-recursive - constant memory
defmodule DonationProcessor do
  def sum_donations(donations), do: sum_donations_acc(donations, 0)

  defp sum_donations_acc([], acc), do: acc
  defp sum_donations_acc([donation | rest], acc) do
    sum_donations_acc(rest, acc + donation.amount)  # CORRECT: Recursive call is last operation
  end
end

# BEST: Use Enum.reduce (optimized by BEAM)
defmodule DonationProcessor do
  def sum_donations(donations) do
    Enum.reduce(donations, 0, fn donation, acc ->
      acc + donation.amount
    end)
  end
end
```

**REQUIRED**: Verify tail-call optimization with `:dialyzer` or manual inspection.

## Binary Optimization

**REQUIRED**: Use iolists for binary building to avoid intermediate allocations.

```elixir
# FAIL: Creates N intermediate binaries
defmodule CsvExporter do
  def export_slow(donations) do
    Enum.reduce(donations, "", fn donation, acc ->
      acc <> "#{donation.id},#{donation.amount},#{donation.donor}\n"
      # WRONG: Each <> creates a new binary, copying all previous data
    end)
  end
  # Performance: O(n²) time, O(n²) memory allocations
end

# PASS: Uses iolist (no intermediate binaries)
defmodule CsvExporter do
  def export_fast(donations) do
    iolist = Enum.map(donations, fn donation ->
      [
        donation.id, ",",
        to_string(donation.amount), ",",
        donation.donor, "\n"
      ]
    end)

    IO.iodata_to_binary(iolist)
    # CORRECT: Single allocation at end
  end
  # Performance: O(n) time, O(n) memory allocations
end

# BEST: Use Enum.map_join (optimized by BEAM)
defmodule CsvExporter do
  def export_best(donations) do
    Enum.map_join(donations, "\n", fn donation ->
      "#{donation.id},#{donation.amount},#{donation.donor}"
    end)
  end
end
```

**REQUIRED**: Benchmark confirms ~3-5x performance improvement with iolists for large datasets (>1000 items).

## ETS for Fast Lookups

**REQUIRED**: Frequently accessed data (>1000 reads/write ratio) MUST use ETS tables.

```elixir
# REQUIRED: ETS configuration for production
defmodule CampaignCache do
  def start_link do
    :ets.new(:campaign_cache, [
      :named_table,
      :set,                    # REQUIRED: Set for unique keys
      :public,                 # REQUIRED: Allow concurrent access
      read_concurrency: true,  # REQUIRED: Optimize for concurrent reads
      write_concurrency: true  # REQUIRED: Reduce write lock contention
    ])
  end

  # O(1) lookup - constant time
  def get(campaign_id) do
    case :ets.lookup(:campaign_cache, campaign_id) do
      [{^campaign_id, campaign}] -> {:ok, campaign}
      [] -> {:error, :not_found}
    end
  end

  def put(campaign_id, campaign) do
    :ets.insert(:campaign_cache, {campaign_id, campaign})
  end
end

# Database query:  ~1 ms (1000 microseconds)
```

**REQUIRED**: ETS tables MUST be supervised to prevent memory leaks.

```elixir
# REQUIRED: Supervise ETS table
defmodule CampaignCache do
  use GenServer

  def start_link(_) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    table = :ets.new(:campaign_cache, [
      :set,
      :public,
      read_concurrency: true,
      write_concurrency: true
    ])

    {:ok, %{table: table}}
  end

  # REQUIRED: Cleanup on termination
  def terminate(_reason, %{table: table}) do
    :ets.delete(table)
    :ok
  end
end
```

**When to use ETS vs GenServer**:

| Scenario                  | Use ETS                       | Use GenServer                     |
| ------------------------- | ----------------------------- | --------------------------------- |
| Read-heavy (90%+ reads)   | ✅ Yes (1M ops/sec)           | ❌ No (50K ops/sec bottleneck)    |
| Write-heavy (90%+ writes) | ⚠️ Maybe (lock contention)    | ✅ Yes (serialization guarantees) |
| Complex state logic       | ❌ No (ETS is key-value only) | ✅ Yes (arbitrary state)          |
| Concurrent readers        | ✅ Yes (lock-free reads)      | ❌ No (single process bottleneck) |

## Process Pooling (Bounded Concurrency)

**REQUIRED**: Concurrent operations MUST use bounded concurrency to prevent resource exhaustion.

```elixir
# FAIL: Unbounded process spawning (memory leak)
defmodule DonationProcessor do
  def process_batch_unsafe(donation_ids) do
    donation_ids
    |> Enum.map(fn id ->
      # WRONG: Spawns N processes immediately
      Task.async(fn -> process_donation(id) end)
    end)
    |> Enum.map(&Task.await/1)
  end
  # WRONG: 1M donation IDs = 1M concurrent processes = OOM crash
end

# PASS: Bounded concurrency with Task.async_stream
defmodule DonationProcessor do
  def process_batch_safe(donation_ids) do
    donation_ids
    |> Task.async_stream(
      &process_donation/1,
      max_concurrency: 50,    # REQUIRED: Limit concurrent workers
      timeout: 30_000,         # REQUIRED: Set timeout
      on_timeout: :kill_task,  # REQUIRED: Kill hung tasks
      ordered: false           # OPTIONAL: Don't wait for slow tasks
    )
    |> Enum.reduce(%{success: 0, failed: 0}, fn
      {:ok, :verified}, acc -> %{acc | success: acc.success + 1}
      {:ok, {:error, _}}, acc -> %{acc | failed: acc.failed + 1}
      {:exit, _}, acc -> %{acc | failed: acc.failed + 1}
    end)
  end

  defp process_donation(_id), do: :verified
end
```

**REQUIRED**: Concurrency limit MUST be based on:

- **CPU-bound**: `max_concurrency: System.schedulers_online()` (match CPU cores)
- **I/O-bound**: `max_concurrency: 50-200` (balance throughput vs resource usage)
- **Database operations**: `max_concurrency: pool_size * 0.8` (respect connection pool)

---

## Query Optimization (N+1 Prevention)

**REQUIRED**: All Ecto queries MUST prevent N+1 query problems using `preload` or `join`.

```elixir
# FAIL: N+1 query problem
defmodule DonationQueries do
  def get_campaigns_with_donations_slow do
    campaigns = Repo.all(Campaign)

    Enum.map(campaigns, fn campaign ->
      # WRONG: Executes 1 query per campaign
      donations = Repo.all(from d in Donation, where: d.campaign_id == ^campaign.id)
      %{campaign | donations: donations}
    end)
    # Total: 1 + N queries
  end
end

# PASS: Use preload - 2 queries total
defmodule DonationQueries do
  def get_campaigns_with_donations_fast do
    Campaign
    |> preload(:donations)
    |> Repo.all()
    # CORRECT: Executes 2 queries (1 for campaigns, 1 for all donations)
  end
end

# BEST: Use join for filtering - 1 query
defmodule DonationQueries do
  def campaigns_with_large_donations(min_amount) do
    Campaign
    |> join(:inner, [c], d in assoc(c, :donations))
    |> where([c, d], d.amount >= ^min_amount)
    |> distinct(true)
    |> Repo.all()
    # CORRECT: Single query with JOIN
  end
end
```

**REQUIRED**: Enable query logging in development to detect N+1 queries:

```elixir
# config/dev.exs
config :my_app, MyApp.Repo,
  log: :info  # REQUIRED: Log all queries in development
```

## Caching Strategies

**REQUIRED**: Financial data MUST implement multi-level caching with explicit TTLs.

```elixir
defmodule CampaignService do
  @cache_ttl :timer.minutes(5)

  # REQUIRED: Multi-level cache (process → ETS → database)
  def get_campaign(campaign_id) do
    key = {:campaign, campaign_id}

    # Level 1: Process dictionary (fastest, process-local)
    case Process.get(key) do
      nil ->
        # Level 2: ETS (fast, shared)
        case get_from_ets(key) do
          {:ok, campaign} ->
            Process.put(key, campaign)
            campaign

          {:error, _} ->
            # Level 3: Database (slowest, source of truth)
            campaign = Repo.get(Campaign, campaign_id)
            put_in_ets(key, campaign)
            Process.put(key, campaign)
            campaign
        end

      campaign ->
        campaign
    end
  end

  # REQUIRED: Invalidate cache on write
  @doc "REQUIRED: Invalidate cache after update"
  def update_campaign(campaign_id, attrs) do
    with {:ok, campaign} <- do_update(campaign_id, attrs) do
      invalidate_cache({:campaign, campaign_id})
      {:ok, campaign}
    end
  end

  defp get_from_ets(key) do
    case :ets.lookup(:campaign_cache, key) do
      [{^key, value, expires_at}] ->
        if System.monotonic_time(:millisecond) < expires_at do
          {:ok, value}
        else
          :ets.delete(:campaign_cache, key)
          {:error, :expired}
        end

      [] ->
        {:error, :not_found}
    end
  end

  defp put_in_ets(key, value) do
    expires_at = System.monotonic_time(:millisecond) + @cache_ttl
    :ets.insert(:campaign_cache, {key, value, expires_at})
  end

  defp invalidate_cache(key) do
    Process.delete(key)
    :ets.delete(:campaign_cache, key)
  end

  defp do_update(campaign_id, attrs) do
    Campaign
    |> Repo.get(campaign_id)
    |> Campaign.changeset(attrs)
    |> Repo.update()
  end
end
```

**REQUIRED**: Cache TTLs MUST be:

- **Financial data**: 30-60 seconds (account balances, transaction status)
- **Reference data**: 5-10 minutes (campaign details, user profiles)
- **Constants**: 24 hours (Zakat rates, currency codes)

**PROHIBITED**: Infinite cache TTLs (risk of stale data).

---

## Task.async_stream (Bounded Concurrency)

**REQUIRED**: Batch processing MUST use `Task.async_stream` with explicit concurrency limits.

```elixir
# REQUIRED: Bounded concurrency pattern
defmodule DonationVerifier do
  def verify_batch(donation_ids) do
    donation_ids
    |> Task.async_stream(
      &verify_donation/1,
      max_concurrency: 50,    # REQUIRED: Prevent resource exhaustion
      timeout: 30_000,         # REQUIRED: 30 second timeout
      on_timeout: :kill_task,  # REQUIRED: Kill hung tasks
      ordered: false           # RECOMMENDED: Don't wait for slow tasks
    )
    |> Enum.reduce(%{success: 0, failed: 0}, fn
      {:ok, :verified}, acc -> %{acc | success: acc.success + 1}
      {:ok, {:error, _}}, acc -> %{acc | failed: acc.failed + 1}
      {:exit, _reason}, acc -> %{acc | failed: acc.failed + 1}
    end)
  end

  defp verify_donation(_donation_id) do
    :timer.sleep(:rand.uniform(1000))
    :verified
  end
end
```

## GenStage (Backpressure-Aware Pipelines)

**RECOMMENDED**: Use GenStage for producer-consumer pipelines with backpressure.

```elixir
# RECOMMENDED: GenStage for rate-limited processing
defmodule DonationProducer do
  use GenStage

  def start_link(initial) do
    GenStage.start_link(__MODULE__, initial, name: __MODULE__)
  end

  def init(initial) do
    {:producer, %{queue: initial, demand: 0}}
  end

  def handle_demand(demand, state) do
    {events, remaining} = Enum.split(state.queue, demand)
    {:noreply, events, %{state | queue: remaining, demand: demand}}
  end
end

defmodule DonationProcessor do
  use GenStage

  def start_link do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    {:producer_consumer, :ok}
  end

  def handle_events(donations, _from, state) do
    processed = Enum.map(donations, &process_donation/1)
    {:noreply, processed, state}
  end

  defp process_donation(donation), do: donation
end

# REQUIRED: Connect stages with max_demand
GenStage.sync_subscribe(processor, to: producer, max_demand: 100)
```

## Flow (Parallel Data Processing)

**RECOMMENDED**: Use Flow for parallel data processing with automatic partitioning.

```elixir
# RECOMMENDED: Flow for parallel processing
defmodule DonationAnalytics do
  def analyze_donations(donations) do
    donations
    |> Flow.from_enumerable()
    |> Flow.partition()
    |> Flow.map(&enrich_donation/1)
    |> Flow.filter(&(&1.amount > 10_000))
    |> Flow.group_by(&(&1.campaign_id))
    |> Flow.map(fn {campaign_id, donations} ->
      {campaign_id, calculate_stats(donations)}
    end)
    |> Enum.to_list()
  end

  defp enrich_donation(donation) do
    %{donation | zakat_eligible: donation.amount > nisab()}
  end

  defp calculate_stats(donations) do
    %{
      total: Enum.sum(Enum.map(donations, & &1.amount)),
      count: length(donations),
      average: Enum.sum(Enum.map(donations, & &1.amount)) / length(donations)
    }
  end

  defp nisab, do: 85_000_000
end
```

---

## LiveView Optimization

**REQUIRED**: LiveView MUST minimize data sent over websockets.

```elixir
# PASS: Only send diffs (not full page)
defmodule FinancialWeb.DonationLive do
  use Phoenix.LiveView

  def mount(_params, _session, socket) do
    {:ok, assign(socket, donations: load_donations())}
  end

  # CORRECT: Only updated fields sent over websocket
  def handle_event("approve", %{"id" => id}, socket) do
    approve_donation(id)
    {:noreply, update(socket, :donations, &reload_donations/1)}
  end

  defp load_donations, do: []
  defp reload_donations(_), do: []
  defp approve_donation(_id), do: :ok
end
```

## Response Caching

**REQUIRED**: Expensive Phoenix responses MUST use caching.

```elixir
# REQUIRED: Cache expensive responses
defmodule FinancialWeb.CampaignController do
  use FinancialWeb, :controller

  plug :cache_response when action in [:index, :show]

  def index(conn, _params) do
    campaigns = Campaigns.list_campaigns()
    json(conn, campaigns)
  end

  def show(conn, %{"id" => id}) do
    campaign = Campaigns.get_campaign(id)
    json(conn, campaign)
  end

  defp cache_response(conn, _opts) do
    cache_key = "#{conn.request_path}?#{conn.query_string}"

    case Cachex.get(:response_cache, cache_key) do
      {:ok, nil} ->
        conn
        |> register_before_send(fn conn ->
          if conn.status == 200 do
            Cachex.put(:response_cache, cache_key, conn.resp_body,
              ttl: :timer.minutes(5))
          end
          conn
        end)

      {:ok, cached_body} ->
        conn
        |> put_resp_header("x-cache", "HIT")
        |> send_resp(200, cached_body)
        |> halt()
    end
  end
end
```

---

## Anti-pattern 1: N+1 Queries

```elixir
# FAIL: N+1 queries
campaigns = Repo.all(Campaign)
Enum.map(campaigns, fn c ->
  Repo.all(from d in Donation, where: d.campaign_id == ^c.id)
end)

# PASS: Preload associations
Repo.all(from c in Campaign, preload: :donations)
```

## Anti-pattern 2: Unnecessary List Traversals

```elixir
# FAIL: 3 separate list traversals
list
|> Enum.map(&transform/1)
|> Enum.filter(&valid?/1)
|> Enum.map(&final/1)

# PASS: Single traversal with Stream
list
|> Stream.map(&transform/1)
|> Stream.filter(&valid?/1)
|> Stream.map(&final/1)
|> Enum.to_list()
```

## Anti-pattern 3: Process Leaks

```elixir
# FAIL: Unbounded process creation
Enum.each(donations, fn d ->
  spawn(fn -> process_donation(d) end)
end)

# PASS: Bounded concurrency
Task.async_stream(donations, &process_donation/1, max_concurrency: 50)
|> Stream.run()
```

---

## Load Testing

**REQUIRED**: Production deployments MUST pass load tests verifying SLO targets.

```elixir
# REQUIRED: Load test with Benchee
defmodule FinancialPlatform.LoadTest do
  use ExUnit.Case

  @tag :load_test
  test "batch processing performance" do
    donation_ids = Enum.to_list(1..10_000)

    {time_us, _result} = :timer.tc(fn ->
      BatchProcessor.process_donations(donation_ids)
    end)

    time_ms = time_us / 1_000

    # REQUIRED: 10k donations processed in < 30 seconds
    assert time_ms < 30_000, "Took #{time_ms}ms (> 30s SLO)"
  end

  @tag :load_test
  test "ETS cache performance" do
    campaign_id = "camp_123"
    CampaignService.get_campaign(campaign_id)  # Warm up cache

    {time_us, _} = :timer.tc(fn ->
      for _ <- 1..1000 do
        CampaignService.get_campaign(campaign_id)
      end
    end)

    time_ms = time_us / 1_000

    # REQUIRED: 1000 cached reads in < 10ms
    assert time_ms < 10, "Took #{time_ms}ms (> 10ms SLO)"
  end
end
```

---

## Telemetry Integration

**REQUIRED**: All production services MUST integrate Telemetry for observability.

```elixir
# REQUIRED: Telemetry configuration
defmodule MyApp.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      # REQUIRED: Request latency (p50, p95, p99)
      distribution("phoenix.router_dispatch.stop.duration",
        unit: {:native, :millisecond},
        tags: [:route],
        reporter_options: [buckets: [10, 50, 100, 200, 500, 1000]]
      ),

      # REQUIRED: Request throughput
      counter("phoenix.router_dispatch.stop.duration",
        tags: [:route]
      ),

      # REQUIRED: Error rate
      counter("phoenix.error_rendered.stop.duration"),

      # REQUIRED: VM metrics
      last_value("vm.memory.total", unit: {:byte, :megabyte}),
      last_value("vm.total_run_queue_lengths.total"),
      last_value("vm.total_run_queue_lengths.cpu")
    ]
  end

  defp periodic_measurements do
    []
  end
end
```

**REQUIRED**: Alerts MUST fire on:

- p95 latency > SLO (50ms for Phoenix APIs)
- Error rate > 1%
- Memory usage > 80% of allocated heap
- Process count > 100,000 (potential leak)
- ETS table size > 1GB (memory leak)

---

### OSE Platform Standards

- [Concurrency and Parallelism](./ex-soen-prla-el__concurrency-standards.md) - Concurrency patterns, OTP, supervision trees
- [Memory Management](./ex-soen-prla-el__memory-management-standards.md) - Memory optimization, garbage collection
- [Best Practices](./ex-soen-prla-el__coding-standards.md) - Code organization, naming conventions

### Learning Resources

For learning Elixir fundamentals and concepts referenced in these standards, see:

- **[Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md)** - Complete Elixir learning journey
- **[Elixir By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/by-example/_index.md)** - Annotated code examples
- **[Elixir In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/in-the-field/_index.md)** - Performance optimization patterns

**Note**: These standards assume you've learned Elixir basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce core software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Benchee automates performance measurement
   - Telemetry automates metrics collection
   - Observer provides automated system monitoring
   - GenStage automates backpressure handling

2. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Benchee provides reproducible measurements
   - ETS caching eliminates environmental variability
   - BEAM VM guarantees consistent concurrency behavior

## Compliance Checklist

Before deploying Elixir services to production:

- [ ] SLO targets defined (latency, throughput)
- [ ] Profiling performed with `:eprof` or `:fprof`
- [ ] Benchee benchmarks written for critical paths
- [ ] Tail-call optimization verified for recursive functions
- [ ] ETS caching used for high-read scenarios (>1000:1 read/write)
- [ ] Process pooling implemented (Task.async_stream with max_concurrency)
- [ ] N+1 queries prevented (preload or join used)
- [ ] Multi-level caching with explicit TTLs
- [ ] Telemetry integration complete
- [ ] Load tests passing SLO targets

---

**Last Updated**: 2026-02-05

**Status**: Active (mandatory for all OSE Platform Elixir services)
