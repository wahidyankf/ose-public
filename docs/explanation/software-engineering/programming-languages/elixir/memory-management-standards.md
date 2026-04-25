---
title: "Elixir Memory Management Standards"
description: Mandatory memory management standards for Elixir applications using BEAM VM's per-process garbage collection
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - memory-management
  - garbage-collection
  - beam-vm
  - process-heap
  - binary-heap
  - ets-tables
  - profiling
related:
  - ./performance-standards.md
  - ./concurrency-standards.md
  - ./coding-standards.md
principles:
  - simplicity-over-complexity
---

# Elixir Memory Management Standards

## Overview

This document defines **mandatory memory management standards** for Elixir applications. All code MUST follow these requirements to ensure efficient memory usage and system scalability.

**Enforcement**: Agents enforce these standards through code review and automated validation.

**Quick Reference**: [Process Heap Management](#process-heap-management) | [Binary Handling Standards](#binary-handling-standards) | [ETS Table Requirements](#ets-table-requirements) | [Garbage Collection Requirements](#garbage-collection-requirements) | [Memory Monitoring Requirements](#memory-monitoring-requirements)

## Core Requirements

### Atom Management (CRITICAL)

**MUST NOT** create atoms dynamically from user input.

**FAIL**: Dynamic atom creation exhausts atom table.

```elixir
# FAIL - Atom table exhaustion attack vector
defmodule DangerousCode do
  def process_status(user_input) do
    String.to_atom(user_input)  # NEVER DO THIS
  end
end

# Attacker sends unique strings repeatedly
# Enum.each(1..1_000_000, fn i -> process_status("status_#{i}") end)
# Result: VM crashes when atom table fills (~1M atoms)
```

**PASS**: Fixed atom set with validation.

```elixir
# PASS - Safe atom handling
defmodule SafeCode do
  @valid_statuses [:pending, :completed, :failed, :cancelled]

  def process_status(user_input) do
    case user_input do
      "pending" -> {:ok, :pending}
      "completed" -> {:ok, :completed}
      "failed" -> {:ok, :failed}
      "cancelled" -> {:ok, :cancelled}
      _ -> {:error, :invalid_status}
    end
  end
end
```

**MUST** monitor atom table size in production.

```elixir
# PASS - Atom monitoring
def check_atom_usage do
  current = :erlang.system_info(:atom_count)
  limit = :erlang.system_info(:atom_limit)
  usage_percent = current / limit * 100

  if usage_percent > 80 do
    Logger.warning("High atom usage: #{current}/#{limit} (#{usage_percent}%)")
  end

  {current, limit}
end
```

### Process Memory Isolation

**MUST** understand process heap isolation.

- Each process has isolated private heap
- No shared memory between process heaps
- Process termination instantly frees entire heap
- No fragmentation within process heaps

**SHOULD** verify process memory usage for long-lived processes.

```elixir
# PASS - Monitor process memory
def check_process_memory(pid) do
  case Process.info(pid, :memory) do
    {:memory, words} ->
      bytes = words * 8
      mb = Float.round(bytes / 1024 / 1024, 2)
      {:ok, %{words: words, bytes: bytes, mb: mb}}

    nil ->
      {:error, :process_not_found}
  end
end
```

## Process Heap Management

### Heap Sizing

**MUST** allow BEAM to manage heap sizes automatically.

**SHOULD NOT** manually configure `min_heap_size` without profiling evidence.

```elixir
# FAIL - Manual heap sizing without evidence
spawn(fn ->
  Process.flag(:min_heap_size, 1000000)  # Arbitrary large value
  process_data()
end)

# PASS - Default heap sizing with monitoring
pid = spawn(fn -> process_data() end)

# Monitor and profile first
{:garbage_collection, gc_info} = Process.info(pid, :garbage_collection)
# Make sizing decisions based on actual data
```

### Process Lifecycle

**MUST** terminate processes when work is complete.

**FAIL**: Accumulating idle processes.

```elixir
# FAIL - Spawning without cleanup
def process_donations(donations) do
  Enum.each(donations, fn d ->
    spawn(fn ->
      result = process_donation(d)
      # Process never terminates, memory never freed
      :timer.sleep(:infinity)
    end)
  end)
end
```

**PASS**: Bounded process lifecycle.

```elixir
# PASS - Processes terminate after work
def process_donations(donations) do
  donations
  |> Task.async_stream(&process_donation/1, max_concurrency: 50)
  |> Enum.to_list()
end
```

### Hibernation Standards

**SHOULD** hibernate long-lived idle processes.

```elixir
# PASS - GenServer hibernation for idle workers
defmodule IdleWorker do
  use GenServer

  def init(state) do
    {:ok, state, :hibernate}
  end

  def handle_call(:work, _from, state) do
    result = perform_work()
    {:reply, result, state, :hibernate}
  end

  def handle_info(:timeout, state) do
    {:noreply, state, :hibernate}
  end
end
```

**MUST** understand hibernation trade-offs:

- **Benefit**: Full GC + heap compaction + reduced memory
- **Cost**: Small wake-up overhead
- **Use when**: Process idle >60 seconds

## Binary Handling Standards

### Size Threshold

**MUST** understand 64-byte binary threshold:

- **<64 bytes**: Stored in process heap (copied between processes)
- **≥64 bytes**: Stored in shared binary heap (reference-counted)

```elixir
# Small binary - copied
small = "Short text"  # 10 bytes, process heap

# Large binary - reference-counted
large = String.duplicate("Data", 20)  # 80 bytes, shared heap
```

### Binary Sharing

**SHOULD** leverage large binary sharing for multi-process operations.

```elixir
# PASS - Efficient binary sharing
def process_large_file(file_path) do
  # Read once (large binary in shared heap)
  data = File.read!(file_path)

  # Spawn workers with references only
  tasks = Enum.map(1..10, fn i ->
    Task.async(fn ->
      # Each process holds 8-byte reference, not copy
      process_chunk(data, i)
    end)
  end)

  Task.await_many(tasks)
end
```

### Binary Building

**MUST** use iolists for binary concatenation.

**FAIL**: Repeated binary concatenation.

```elixir
# FAIL - Creates many intermediate binaries
def build_csv_bad(donations) do
  Enum.reduce(donations, "ID,Amount,Donor\n", fn d, acc ->
    acc <> d.id <> "," <> to_string(d.amount) <> "," <> d.donor_id <> "\n"
  end)
end
```

**PASS**: Iolist building with single conversion.

```elixir
# PASS - Build iolist, convert once
def build_csv_good(donations) do
  iolist = [
    "ID,Amount,Donor\n",
    Enum.map(donations, fn d ->
      [d.id, ",", to_string(d.amount), ",", d.donor_id, "\n"]
    end)
  ]

  IO.iodata_to_binary(iolist)
end
```

### Binary Pattern Matching

**SHOULD** use binary pattern matching for parsing (zero-copy).

```elixir
# PASS - Efficient binary parsing (no copying)
defmodule CsvParser do
  def parse_line(<<id::binary-size(10), ",", amount::binary-size(15), ",", rest::binary>>) do
    %{
      id: String.trim(id),
      amount: String.trim(amount) |> String.to_integer(),
      rest: rest
    }
  end

  def parse_line(_), do: {:error, :invalid_format}
end
```

## ETS Table Requirements

### Table Creation

**MUST** specify appropriate table type for use case.

```elixir
# PASS - Explicit table type selection

# Key-value pairs (one value per key)
:ets.new(:donation_cache, [:set, :public, :named_table])

# Sorted keys (range queries)
:ets.new(:time_series, [:ordered_set, :public, :named_table])

# Multiple values per key (different values)
:ets.new(:donor_donations, [:bag, :public, :named_table])

# Multiple values per key (allows duplicates)
:ets.new(:event_log, [:duplicate_bag, :public, :named_table])
```

### Concurrency Configuration

**MUST** configure read/write concurrency for workload.

```elixir
# PASS - Read-heavy optimization
:ets.new(:read_heavy, [
  :set,
  :public,
  :named_table,
  read_concurrency: true,
  write_concurrency: false
])

# PASS - Write-heavy optimization
:ets.new(:write_heavy, [
  :set,
  :public,
  :named_table,
  read_concurrency: false,
  write_concurrency: true
])

# PASS - Balanced workload
:ets.new(:balanced, [
  :set,
  :public,
  :named_table,
  read_concurrency: true,
  write_concurrency: true,
  decentralized_counters: true
])
```

### Memory Management

**MUST** manually delete ETS tables when no longer needed.

```elixir
# FAIL - ETS table memory leak
def create_temp_cache do
  table = :ets.new(:temp, [:set])
  process_data(table)
  # Table never deleted, memory never freed
end

# PASS - Explicit cleanup
def create_temp_cache do
  table = :ets.new(:temp, [:set])

  try do
    process_data(table)
  after
    :ets.delete(table)  # Always cleanup
  end
end
```

**SHOULD** monitor ETS table memory usage.

```elixir
# PASS - ETS memory monitoring
def check_ets_memory(table) do
  case :ets.info(table, :memory) do
    :undefined -> {:error, :table_not_found}
    words ->
      bytes = words * 8
      mb = Float.round(bytes / 1024 / 1024, 2)
      size = :ets.info(table, :size)
      {:ok, %{words: words, bytes: bytes, mb: mb, entries: size}}
  end
end
```

## Garbage Collection Requirements

### Per-Process GC

**MUST** understand per-process GC characteristics:

- Each process GC'd independently
- No stop-the-world pauses
- Short GC pauses (microseconds for small heaps)
- Scales with CPU cores

**SHOULD NOT** manually trigger GC without profiling evidence.

```elixir
# FAIL - Manual GC without evidence
def process_batch(items) do
  Enum.each(items, fn item ->
    process_item(item)
    :erlang.garbage_collect()  # Unnecessary, harmful
  end)
end

# PASS - Let BEAM manage GC automatically
def process_batch(items) do
  Enum.each(items, &process_item/1)
end
```

### Generational GC

**MUST** understand generational GC model:

- **Young heap**: New allocations, frequent collection
- **Old heap**: Survived objects, infrequent collection
- Minor GC: Young heap only
- Major GC: Both heaps (triggered by old heap size)

### GC Monitoring

**SHOULD** monitor GC statistics for performance analysis.

```elixir
# PASS - GC statistics collection
def analyze_gc(pid) do
  case Process.info(pid, :garbage_collection) do
    nil ->
      {:error, :process_not_found}

    {:garbage_collection, stats} ->
      %{
        minor_gcs: Keyword.get(stats, :minor_gcs),
        fullsweep_after: Keyword.get(stats, :fullsweep_after),
        min_heap_size: Keyword.get(stats, :min_heap_size),
        max_heap_size: Keyword.get(stats, :max_heap_size)
      }
  end
end
```

## Memory Monitoring Requirements

### Production Monitoring (CRITICAL)

**MUST** implement memory monitoring in production systems.

```elixir
# PASS - Production memory monitoring
defmodule FinancialDomain.MemoryMonitor do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    schedule_check()
    {:ok, %{}}
  end

  def handle_info(:check_memory, state) do
    report_memory_stats()
    schedule_check()
    {:noreply, state}
  end

  defp schedule_check do
    Process.send_after(self(), :check_memory, :timer.minutes(5))
  end

  defp report_memory_stats do
    stats = %{
      total: :erlang.memory(:total),
      processes: :erlang.memory(:processes),
      binary: :erlang.memory(:binary),
      ets: :erlang.memory(:ets),
      atom: :erlang.memory(:atom),
      system: :erlang.memory(:system),
      process_count: length(Process.list()),
      ets_count: length(:ets.all()),
      atom_count: :erlang.system_info(:atom_count)
    }

    Logger.info("Memory stats: #{inspect(stats)}")

    # Alert on high memory
    if stats.total > 1_000_000_000 do
      Logger.warning("High memory usage: #{stats.total} bytes")
    end

    stats
  end
end
```

### Observer Usage

**MUST** use Observer for development profiling.

```elixir
# Start Observer
:observer.start()

# Navigate to:
# 1. System tab - Overall memory usage
# 2. Memory Allocators - Detailed allocation info
# 3. Applications - Per-app memory
# 4. Processes - Sort by memory usage
```

### Recon Library

**MUST** use Recon for production debugging.

```elixir
# Add to mix.exs
{:recon, "~> 2.5"}

# PASS - Find memory-hungry processes
:recon.proc_count(:memory, 10)

# PASS - Find large message queues
:recon.proc_count(:message_queue_len, 10)

# PASS - Memory allocation info
:recon_alloc.memory(:allocated)
:recon_alloc.memory(:used)

# PASS - Detailed process info
:recon.info(pid)
```

### Memory Metrics Collection

**MUST** collect memory metrics at system and process levels.

```elixir
# PASS - System-level metrics
def system_memory_stats do
  %{
    total: :erlang.memory(:total),
    processes: :erlang.memory(:processes),
    system: :erlang.memory(:system),
    atom: :erlang.memory(:atom),
    binary: :erlang.memory(:binary),
    ets: :erlang.memory(:ets)
  }
end

# PASS - Process-level metrics
def process_memory_stats do
  Process.list()
  |> Enum.map(fn pid ->
    {pid, Process.info(pid, :memory)}
  end)
  |> Enum.sort_by(fn {_pid, {:memory, bytes}} -> bytes end, :desc)
  |> Enum.take(10)
end
```

## Memory Optimization Requirements

### Process Pooling

**MUST** use bounded concurrency to control memory.

```elixir
# FAIL - Unbounded process creation
def process_all(items) do
  Enum.each(items, fn item ->
    spawn(fn -> process_item(item) end)
  end)
end

# PASS - Bounded concurrency with Task.async_stream
def process_all(items) do
  items
  |> Task.async_stream(&process_item/1, max_concurrency: 50)
  |> Enum.to_list()
end
```

### Streaming Large Datasets

**MUST** use streams for large data processing.

```elixir
# FAIL - Loading entire dataset into memory
def process_donations do
  donations = Repo.all(Donation)  # Loads all into memory
  Enum.map(donations, &process_donation/1)
end

# PASS - Streaming with constant memory
def process_donations do
  Donation
  |> Repo.stream()
  |> Stream.chunk_every(1000)
  |> Stream.flat_map(& &1)
  |> Stream.map(&process_donation/1)
  |> Stream.run()
end
```

### Message Queue Management

**MUST** prevent message queue buildup.

```elixir
# FAIL - Cast without backpressure
def send_notifications(user_ids) do
  Enum.each(user_ids, fn id ->
    GenServer.cast(NotificationWorker, {:send, id})
  end)
end
# Result: Message queue grows unbounded

# PASS - Call provides backpressure
def send_notifications(user_ids) do
  Enum.each(user_ids, fn id ->
    GenServer.call(NotificationWorker, {:send, id}, :timer.seconds(10))
  end)
end
# Result: Caller waits, natural backpressure
```

## Memory Anti-patterns

### Anti-pattern: Dynamic Atom Creation

**FAIL**: See [Atom Management](#atom-management-critical).

### Anti-pattern: Process Leaks

**FAIL**: Creating processes without supervision or bounded lifecycle.

```elixir
# FAIL - Process accumulation
Enum.each(1..10_000, fn i ->
  spawn(fn -> :timer.sleep(:infinity) end)
end)
# Result: 10,000 idle processes consuming memory
```

**PASS**: See [Process Lifecycle](#process-lifecycle).

### Anti-pattern: Large Message Queues

**FAIL**: See [Message Queue Management](#message-queue-management).

### Anti-pattern: ETS Table Leaks

**FAIL**: See [Memory Management](#memory-management).

### Anti-pattern: Inefficient Binary Concatenation

**FAIL**: See [Binary Building](#binary-building).

## Compliance Requirements

### Code Review Checklist

- [ ] No dynamic atom creation from user input
- [ ] Atom usage monitoring implemented
- [ ] Process lifecycle bounded and supervised
- [ ] Binary handling uses iolists for concatenation
- [ ] Large binaries shared via references
- [ ] ETS tables have explicit cleanup
- [ ] ETS concurrency configured for workload
- [ ] Production memory monitoring enabled
- [ ] Bounded concurrency (max_concurrency specified)
- [ ] Streams used for large dataset processing
- [ ] Message queue buildup prevented (backpressure)

### Monitoring Checklist

- [ ] System memory metrics collected every 5 minutes
- [ ] Atom count monitored with alerts at 80% capacity
- [ ] Top 10 memory-consuming processes tracked
- [ ] ETS table sizes monitored
- [ ] Process count tracked
- [ ] Message queue lengths monitored
- [ ] GC statistics collected for critical processes

## Related Topics

- [Concurrency Standards](concurrency-standards.md) - Process-based concurrency requirements
- [Performance](performance-standards.md) - Performance optimization techniques
- [Error Handling](error-handling-standards.md) - Supervision and fault tolerance
- [OTP: GenServer](otp-genserver.md) - Process memory patterns
- [Best Practices](./coding-standards.md) - Memory-efficient patterns

## Sources

- [BEAM Memory Architecture](http://erlang.org/doc/efficiency_guide/memory.html)
- [Erlang Garbage Collection](http://erlang.org/doc/efficiency_guide/gc.html)
- [Recon Library](https://github.com/ferd/recon)
- [ETS Documentation](https://www.erlang.org/doc/man/ets.html)
- [Efficiency Guide](http://erlang.org/doc/efficiency_guide/users_guide.html)
- [Garbage Collection in BEAM - Lukas Larsson](https://www.erlang-solutions.com/blog/erlang-garbage-collection.html)

---

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19.0 (latest)
**Maintainers**: Platform Documentation Team
