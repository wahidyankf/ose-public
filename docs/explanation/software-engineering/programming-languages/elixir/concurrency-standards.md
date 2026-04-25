---
title: "Elixir Concurrency Standards"
description: Mandatory concurrency standards for Elixir applications using BEAM VM processes, message passing, and the Task module
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - concurrency
  - parallelism
  - processes
  - message-passing
  - task
  - genserver
  - actor-model
  - beam-vm
related:
  - ./error-handling-standards.md
  - ./otp-genserver.md
  - ./otp-supervisor.md
  - ./performance-standards.md
principles:
  - simplicity-over-complexity
  - explicit-over-implicit
---

# Elixir Concurrency Standards

## Overview

This document defines **mandatory concurrency standards** for Elixir applications. All concurrent code MUST follow these requirements to ensure correctness, maintainability, and performance.

**Enforcement**: Agents enforce these standards through code review and automated validation.

**Quick Reference**: [Process Requirements](#process-requirements) | [Message Passing Standards](#message-passing-standards) | [Task Module Requirements](#task-module-requirements) | [GenServer Standards](#genserver-standards) | [Concurrent Pattern Requirements](#concurrent-pattern-requirements)

## Core Requirements

### Process Isolation (CRITICAL)

**MUST** use isolated processes with message passing for concurrent operations.

**FAIL**: Sharing mutable state between processes.

```elixir
# FAIL - Shared mutable state via ETS without proper access control
:ets.new(:shared_state, [:set, :public, :named_table])
spawn(fn -> :ets.insert(:shared_state, {:key, value}) end)
spawn(fn -> :ets.insert(:shared_state, {:key, other_value}) end)
# Race condition - undefined behavior
```

**PASS**: Isolated processes communicating via messages.

```elixir
# PASS - Message passing ensures isolation
defmodule FinancialDomain.ZakatCalculator do
  def start_link do
    pid = spawn_link(fn -> loop(%{}) end)
    Process.register(pid, __MODULE__)
    {:ok, pid}
  end

  def calculate(wealth, nisab) do
    send(__MODULE__, {:calculate, self(), wealth, nisab})
    receive do
      {:result, amount} -> {:ok, amount}
    after
      5000 -> {:error, :timeout}
    end
  end

  defp loop(state) do
    receive do
      {:calculate, from, wealth, nisab} ->
        result = if wealth > nisab, do: wealth * 0.025, else: 0
        send(from, {:result, result})
        loop(state)
    end
  end
end
```

### Concurrency vs Parallelism

**MUST** understand the distinction:

- **Concurrency**: Multiple tasks making progress (may run on single core)
- **Parallelism**: Multiple tasks executing simultaneously (requires multiple cores)

**MUST** design for concurrency first, parallelism is a deployment decision.

## Process Requirements

### Spawning Processes

**MUST** use `spawn_link/1` for processes that should crash together.

```elixir
# PASS - Linked processes crash together
pid = spawn_link(fn ->
  result = calculate_zakat(10_000, 5_000)
  IO.puts("Zakat: #{result}")
end)
```

**MUST** use `spawn_monitor/1` when parent needs notification of child exit.

```elixir
# PASS - Parent receives DOWN message on child exit
{pid, ref} = spawn_monitor(fn ->
  process_donation(donation_id)
end)

receive do
  {:DOWN, ^ref, :process, ^pid, reason} ->
    handle_process_exit(reason)
after
  5000 -> {:error, :timeout}
end
```

**SHOULD** use `spawn/1` only for truly independent processes.

### Process Lifecycle

**MUST** implement cleanup logic in `after` blocks for processes managing resources.

```elixir
# PASS - Resource cleanup guaranteed
spawn_link(fn ->
  try do
    gateway = connect_to_payment_gateway()
    result = process_payment(donation, gateway)
    send(parent, {:result, result})
  rescue
    error -> send(parent, {:error, error})
  after
    disconnect_from_gateway()  # Always executed
    release_resources()
  end
end)
```

### Process Supervision

**MUST** supervise all long-lived processes.

**FAIL**: Creating processes without supervision.

```elixir
# FAIL - No supervision, crashes unhandled
spawn(fn -> long_running_worker() end)
```

**PASS**: Supervised processes.

```elixir
# PASS - Supervised by application supervisor tree
defmodule FinancialDomain.Application do
  use Application

  def start(_type, _args) do
    children = [
      {Task.Supervisor, name: FinancialDomain.TaskSupervisor},
      FinancialDomain.ZakatServer,
      FinancialDomain.DonationProcessor
    ]

    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
```

## Message Passing Standards

### Message Timeout

**MUST** specify timeout for all `receive` blocks.

**FAIL**: Infinite wait without timeout.

```elixir
# FAIL - Infinite wait, process hangs forever if message never arrives
receive do
  {:result, value} -> value
end
```

**PASS**: Explicit timeout with error handling.

```elixir
# PASS - Timeout prevents infinite blocking
receive do
  {:result, value} -> {:ok, value}
after
  5_000 -> {:error, :timeout}
end
```

### Request-Reply Pattern

**MUST** include sender PID in requests requiring replies.

```elixir
# PASS - Request includes sender PID
def calculate_zakat(wealth, nisab) do
  send(ZakatServer, {:calculate, self(), wealth, nisab})

  receive do
    {:result, amount} -> {:ok, amount}
  after
    5_000 -> {:error, :timeout}
  end
end

# Server implementation
def loop(state) do
  receive do
    {:calculate, from, wealth, nisab} ->
      result = perform_calculation(wealth, nisab)
      send(from, {:result, result})
      loop(state)
  end
end
```

### Pattern Matching in Receive

**SHOULD** use pattern matching for selective message handling.

```elixir
# PASS - Pattern matching filters messages
receive do
  {:donation, ^expected_id, amount} ->
    # Process only matching donations
    {:ok, amount}

  {:donation, _other_id, _amount} ->
    # Ignore non-matching donations
    wait_for_donation(expected_id)
after
  10_000 -> {:error, :timeout}
end
```

## Task Module Requirements

### One-off Concurrent Work

**MUST** use `Task.async/1` and `Task.await/2` for concurrent one-off operations.

```elixir
# PASS - Concurrent report generation
def generate_all_reports(year, month) do
  tasks = [
    Task.async(fn -> generate_zakat_report(year, month) end),
    Task.async(fn -> generate_donation_report(year, month) end),
    Task.async(fn -> generate_campaign_report(year, month) end)
  ]

  Task.await_many(tasks, :timer.minutes(5))
end
```

**MUST** specify explicit timeout for `Task.await/2`.

**FAIL**: Using default timeout without consideration.

```elixir
# FAIL - Default 5s timeout may be insufficient
result = Task.await(task)
```

**PASS**: Explicit timeout matching operation requirements.

```elixir
# PASS - Timeout matches expected operation duration
result = Task.await(task, :timer.minutes(5))
```

### Parallel Stream Processing

**MUST** use `Task.async_stream/3` for processing collections concurrently.

```elixir
# PASS - Controlled concurrency with async_stream
def verify_donations(donations) do
  donations
  |> Task.async_stream(
    &verify_single_donation/1,
    max_concurrency: 10,
    timeout: :timer.seconds(30),
    on_timeout: :kill_task
  )
  |> Enum.map(fn
    {:ok, result} -> result
    {:exit, reason} -> {:error, reason}
  end)
end
```

**MUST** specify `max_concurrency` to prevent resource exhaustion.

**FAIL**: Unbounded concurrency.

```elixir
# FAIL - No concurrency limit, may spawn millions of processes
donations
|> Task.async_stream(&process/1)
|> Enum.to_list()
```

**PASS**: Bounded concurrency.

```elixir
# PASS - Maximum 10 concurrent tasks
donations
|> Task.async_stream(&process/1, max_concurrency: 10)
|> Enum.to_list()
```

### Supervised Tasks

**MUST** use `Task.Supervisor` for long-running or critical tasks.

```elixir
# PASS - Supervised task with proper error handling
def process_donation_supervised(donation_id) do
  task = Task.Supervisor.async_nolink(
    FinancialDomain.TaskSupervisor,
    fn -> process_donation(donation_id) end
  )

  case Task.yield(task, :timer.seconds(30)) do
    {:ok, result} -> result
    nil ->
      Task.shutdown(task, :brutal_kill)
      {:error, :timeout}
  end
end
```

## GenServer Standards

### Synchronous vs Asynchronous Calls

**MUST** use `GenServer.cast/2` for fire-and-forget operations.

```elixir
# PASS - Asynchronous update, no waiting
def record_donation(campaign_id, amount) do
  GenServer.cast(StatsAggregator, {:donation, campaign_id, amount})
end

def handle_cast({:donation, campaign_id, amount}, state) do
  updated_state = update_stats(state, campaign_id, amount)
  {:noreply, updated_state}
end
```

**MUST** use `GenServer.call/3` for request-response operations.

```elixir
# PASS - Synchronous query, waits for response
def get_stats(campaign_id) do
  GenServer.call(StatsAggregator, {:get_stats, campaign_id})
end

def handle_call({:get_stats, campaign_id}, _from, state) do
  stats = Map.get(state, campaign_id, %{count: 0, total: 0})
  {:reply, stats, state}
end
```

**FAIL**: Using `call` for operations that don't need responses.

```elixir
# FAIL - Unnecessary blocking for fire-and-forget
def log_event(event) do
  GenServer.call(Logger, {:log, event})  # Blocks unnecessarily
end
```

### Blocking Operations

**FAIL**: Performing slow operations in GenServer callbacks.

```elixir
# FAIL - Blocking GenServer with external API call
def handle_call(:fetch_rates, _from, state) do
  rates = HTTPClient.get("https://api.example.com/rates")  # Blocks server!
  {:reply, rates, state}
end
```

**PASS**: Delegating slow operations to separate processes.

```elixir
# PASS - Spawn task for slow operation
def handle_call(:fetch_rates, from, state) do
  task = Task.Supervisor.async_nolink(TaskSupervisor, fn ->
    HTTPClient.get("https://api.example.com/rates")
  end)

  {:noreply, Map.put(state, :pending, {task, from})}
end

def handle_info({ref, result}, state) when is_reference(ref) do
  case Map.get(state, :pending) do
    {%Task{ref: ^ref}, from} ->
      GenServer.reply(from, result)
      {:noreply, Map.delete(state, :pending)}
    _ ->
      {:noreply, state}
  end
end
```

### State Management

**MUST** treat state as immutable, returning new state from callbacks.

```elixir
# PASS - Immutable state updates
def handle_cast({:donation, campaign_id, amount}, state) do
  updated_state = Map.update(
    state,
    campaign_id,
    %{count: 1, total: amount},
    fn stats -> %{count: stats.count + 1, total: stats.total + amount} end
  )

  {:noreply, updated_state}
end
```

## Concurrent Pattern Requirements

### Producer-Consumer Pattern

**MUST** implement backpressure to prevent queue overflow.

```elixir
# PASS - Producer with rate limiting
def producer(consumer_pid, items) do
  Enum.each(items, fn item ->
    send(consumer_pid, {:process, item})
    :timer.sleep(10)  # Rate limiting prevents queue overflow
  end)

  send(consumer_pid, :done)
end
```

**MUST** handle completion signals in consumer loops.

```elixir
# PASS - Consumer handles completion
defp consumer_loop(processed_count) do
  receive do
    {:process, item} ->
      process_item(item)
      consumer_loop(processed_count + 1)

    :done ->
      IO.puts("Processed #{processed_count} items")
      :ok  # Exit loop cleanly
  end
end
```

### Worker Pool Pattern

**SHOULD** use libraries like `Poolboy` or `NimblePool` for production worker pools.

**MUST** distribute work evenly across workers.

```elixir
# PASS - Round-robin distribution
def process_with_pool(items, workers) do
  items
  |> Enum.with_index()
  |> Enum.each(fn {item, index} ->
    worker = Enum.at(workers, rem(index, length(workers)))
    send(worker, {:process, self(), item})
  end)
end
```

## Software Engineering Principles

This standard implements the following governance principles:

- **[Simplicity Over Complexity](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: Use message passing instead of complex shared state mechanisms
- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**: Explicit timeouts, concurrency limits, and error handling

## Common Violations

### Violation: No Timeout

```elixir
# FAIL - Infinite wait
receive do
  {:result, value} -> value
end
```

**Consequence**: Process hangs forever if message never arrives.

**Fix**: Add timeout with error handling.

### Violation: Unbounded Concurrency

```elixir
# FAIL - May spawn millions of processes
Task.async_stream(huge_list, &process/1)
```

**Consequence**: Resource exhaustion, system crash.

**Fix**: Use `max_concurrency` option.

### Violation: Blocking GenServer

```elixir
# FAIL - Blocks all other requests
def handle_call(:slow_operation, _from, state) do
  result = expensive_external_call()
  {:reply, result, state}
end
```

**Consequence**: GenServer becomes unresponsive, requests time out.

**Fix**: Delegate slow operations to separate processes.

### Violation: Unsupervised Processes

```elixir
# FAIL - Crashes go unnoticed
spawn(fn -> critical_worker() end)
```

**Consequence**: Silent failures, no restart on crash.

**Fix**: Add to supervision tree.

## Testing Requirements

**MUST** test concurrent behavior with race conditions.

```elixir
# PASS - Tests concurrent access
test "concurrent donations update stats correctly" do
  {:ok, pid} = StatsAggregator.start_link([])

  # Spawn 100 concurrent donations
  tasks = Enum.map(1..100, fn _ ->
    Task.async(fn ->
      StatsAggregator.record_donation("CAMP-001", Decimal.new("10.00"))
    end)
  end)

  Task.await_many(tasks)

  stats = StatsAggregator.get_stats("CAMP-001")
  assert stats.count == 100
  assert Decimal.eq?(stats.total, Decimal.new("1000.00"))
end
```

**SHOULD** use `:observer.start()` to profile process behavior in development.

## Performance Requirements

**MUST** monitor process mailbox sizes in production.

```elixir
# Check mailbox size
{:message_queue_len, count} = Process.info(pid, :message_queue_len)

# Alert if mailbox exceeds threshold
if count > 1000 do
  Logger.warn("Process #{inspect(pid)} has #{count} queued messages")
end
```

**SHOULD** profile with `:observer` to identify bottlenecks.

**MUST** use `max_concurrency` to prevent resource exhaustion.

## Related Documentation

- **[Error Handling Standards](./error-handling-standards.md)**: "Let it crash" philosophy and supervision
- **[OTP GenServer Standards](./otp-genserver.md)**: Stateful concurrent process requirements
- **[OTP Supervisor Standards](./otp-supervisor.md)**: Process supervision requirements
- **[Performance Standards](./performance-standards.md)**: Optimizing concurrent systems
- **[Anti-Patterns](./coding-standards.md)**: Common concurrency mistakes to avoid

## References

- [Elixir Getting Started - Processes](https://elixir-lang.org/getting-started/processes.html) (Official documentation)
- [Task Module Documentation](https://hexdocs.pm/elixir/Task.html) (Official documentation)
- [Concurrent Data Processing in Elixir](https://pragprog.com/titles/sgdpelixir/concurrent-data-processing-in-elixir/) (Pragmatic Bookshelf, 2021)
- [The Little Elixir & OTP Guidebook](https://www.manning.com/books/the-little-elixir-and-otp-guidebook) (Manning, 2017)

---

**Enforcement**: Automated validation via `apps__ayokoding-web__general-checker` agent

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19.0 (latest)
**Maintainers**: Platform Documentation Team
