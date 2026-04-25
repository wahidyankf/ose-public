---
title: Elixir Error Handling Standards for OSE Platform
description: Prescriptive error handling requirements for Elixir services in Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - ose-platform
  - error-handling
  - let-it-crash
  - supervision-trees
  - financial-systems
  - standards
related:
  - ./concurrency-standards.md
  - ./otp-supervisor.md
  - ./coding-standards.md
principles:
  - simplicity-over-complexity
  - explicit-over-implicit
  - reproducibility
created: 2026-01-23
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Elixir fundamentals from [AyoKoding Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an Elixir tutorial. We define HOW to apply Elixir in THIS codebase, not WHAT Elixir is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Elixir Error Handling Standards for OSE Platform

**OSE-specific prescriptive standards** for error handling in Elixir-based Shariah-compliant financial services. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Elixir error handling fundamentals from [AyoKoding Elixir Error Handling](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md).

## Purpose

Error handling in OSE Platform Elixir services serves critical functions:

- **Financial Integrity**: Preventing partial transactions that violate Islamic finance principles
- **Audit Compliance**: Complete error trails for regulatory review
- **Shariah Compliance**: Ensuring Zakat calculations, Murabaha contracts, and donation processing are atomic and correct
- **System Reliability**: Automatic recovery from failures through supervision

### Core Requirements

**REQUIRED**: All Elixir services MUST implement the "let it crash" philosophy:

- Business logic errors (validation failures, invalid amounts) MUST return tagged tuples `{:ok, result}` or `{:error, reason}`
- Infrastructure errors (database failures, network timeouts) MUST crash and let supervisors restart
- Processes MUST be supervised with appropriate restart strategies
- State corruption MUST be prevented by process restart (clean slate)

**PROHIBITED**: Defensive programming with try/rescue for infrastructure failures.

### When to Crash vs Return Errors

**REQUIRED**: Use tagged tuple returns for:

- Business validation errors (negative amounts, invalid email)
- Expected domain errors (campaign closed, duplicate donation)
- User input errors (missing required fields)
- Authorization failures (insufficient permissions)

**REQUIRED**: Let process crash for:

- Database connection failures
- External API timeouts
- Memory exhaustion
- Unexpected nil values in critical paths
- Malformed data from external sources

```elixir
# PASS: Business errors return tagged tuples
defmodule FinancialDomain.Donations.Validator do
  def validate_donation(params) do
    with {:ok, amount} <- validate_amount(params),
         {:ok, campaign} <- validate_campaign(params),
         {:ok, donor} <- validate_donor(params) do
      {:ok, %{amount: amount, campaign: campaign, donor: donor}}
    end
  end

  defp validate_amount(%{amount: amount}) when amount > 0 do
    {:ok, amount}
  end

  defp validate_amount(_) do
    {:error, :invalid_amount}  # Business error - return tuple
  end
end

# FAIL: Defensive try/rescue for infrastructure errors
defmodule FinancialDomain.Donations.Processor do
  def process_donation(donation) do
    try do
      # Check if database is available
      if database_available?() do
        save_donation(donation)
      else
        {:error, :database_unavailable}
      end
    rescue
      error ->
        Logger.error("Database error: #{inspect(error)}")
        {:error, :unexpected}
    end
  end
end

# PASS: Let infrastructure errors crash
defmodule FinancialDomain.Donations.Processor do
  def process_donation(donation) do
    # If database connection fails, process crashes
    # Supervisor restarts it in clean state
    # No need to handle infrastructure failures explicitly
    Repo.insert(donation)
  end
end
```

### Mandatory Supervision

**REQUIRED**: All processes that can crash MUST be supervised.

**REQUIRED**: Supervisor configuration MUST specify:

- Restart strategy (`:one_for_one`, `:one_for_all`, `:rest_for_one`)
- Maximum restart frequency (default: 3 restarts in 5 seconds)
- Child specifications with explicit `restart`, `shutdown`, and `type` values

```elixir
# PASS: Proper supervisor with restart strategy
defmodule FinancialDomain.Donations.Supervisor do
  use Supervisor

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children = [
      # Worker processes with explicit restart policy
      {FinancialDomain.Donations.Validator, restart: :permanent},
      {FinancialDomain.Donations.PaymentProcessor, restart: :permanent},
      {FinancialDomain.Donations.NotificationService, restart: :transient},

      # Cache can be temporary (don't restart on normal exit)
      {FinancialDomain.Donations.CampaignCache, restart: :temporary},

      # Worker pool with dynamic supervision
      {DynamicSupervisor,
       name: FinancialDomain.Donations.WorkerSupervisor,
       strategy: :one_for_one,
       max_restarts: 3,
       max_seconds: 5}
    ]

    # If any child crashes, only that child restarts
    Supervisor.init(children, strategy: :one_for_one)
  end
end

# FAIL: Unsupervised GenServer
defmodule FinancialDomain.Donations.PaymentProcessor do
  use GenServer

  # Started directly without supervisor
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  # If this process crashes, it's gone forever
end
```

**REQUIRED**: Restart strategies MUST match failure domain:

- **`:one_for_one`**: Default for independent workers (payment processor crash doesn't affect validator)
- **`:one_for_all`**: Use when all children must be consistent (cache invalidation on any worker restart)
- **`:rest_for_one`**: Use for dependent startup order (database pool → query workers)

### Supervision Tree Structure

**REQUIRED**: Financial domain supervisors MUST be organized hierarchically:

```
FinancialDomain.Application.Supervisor (Root)
├── FinancialDomain.Donations.Supervisor
│   ├── Donations.Validator (Worker)
│   ├── Donations.Processor (Worker)
│   └── Donations.WorkerSupervisor (DynamicSupervisor)
├── FinancialDomain.Zakat.Supervisor
│   ├── Zakat.Calculator (Worker)
│   └── Zakat.DistributionService (Worker)
└── FinancialDomain.Payments.Supervisor
    ├── Payments.Gateway (Worker)
    └── Payments.CircuitBreaker (Worker)
```

**REQUIRED**: Supervision tree MUST:

- Isolate domain concerns (Donations, Zakat, Payments in separate supervisors)
- Prevent cascading failures (one domain crashing doesn't affect others)
- Enable targeted restarts (restart only affected subsystem)

### Return Value Standards

**REQUIRED**: All public functions that can fail MUST return tagged tuples:

- Success: `{:ok, result}`
- Single error: `{:error, reason}`
- Multiple errors: `{:error, [reason1, reason2, ...]}`

**REQUIRED**: Error reasons MUST be atoms or structured data, not strings:

```elixir
# PASS: Atomic error reasons
def validate_zakat(wealth, nisab) do
  cond do
    wealth.amount < 0 ->
      {:error, :negative_wealth}

    wealth.currency != nisab.currency ->
      {:error, :currency_mismatch}

    Money.greater_than?(wealth, nisab) ->
      zakat = Money.multiply(wealth, Decimal.new("0.025"))
      {:ok, zakat}

    true ->
      {:ok, Money.new(0, wealth.currency)}
  end
end

# FAIL: String error reasons (not pattern-matchable)
def validate_zakat(wealth, nisab) do
  if wealth.amount < 0 do
    {:error, "Wealth cannot be negative"}  # BAD: string reason
  else
    calculate_zakat(wealth, nisab)
  end
end
```

### Bang Function Convention

**REQUIRED**: Provide bang variants (`!`) for functions that should raise on error:

```elixir
# PASS: Paired functions with safe and unsafe variants
def calculate_zakat(wealth, nisab) do
  # Safe version - returns tagged tuple
  cond do
    wealth.amount < 0 ->
      {:error, :negative_wealth}

    wealth.currency != nisab.currency ->
      {:error, :currency_mismatch}

    true ->
      zakat = Money.multiply(wealth, Decimal.new("0.025"))
      {:ok, zakat}
  end
end

def calculate_zakat!(wealth, nisab) do
  # Unsafe version - raises on error
  case calculate_zakat(wealth, nisab) do
    {:ok, amount} -> amount
    {:error, reason} -> raise "Zakat calculation failed: #{reason}"
  end
end
```

**REQUIRED**: Bang functions MUST:

- Always have a safe equivalent without `!`
- Raise on ANY error (not return errors)
- Be used sparingly (only when caller expects success)

### Pipeline Error Handling

**REQUIRED**: Use `with` construct for operations with multiple failure points:

```elixir
# PASS: with construct for validation pipeline
def create_donation(params) do
  with {:ok, validated_params} <- validate_params(params),
       {:ok, donor} <- get_or_create_donor(validated_params),
       {:ok, campaign} <- fetch_active_campaign(validated_params),
       {:ok, donation} <- insert_donation(validated_params, donor, campaign),
       {:ok, payment_result} <- process_payment(donation),
       :ok <- send_confirmation(donor, donation) do
    {:ok, donation}
  else
    {:error, :invalid_amount} ->
      {:error, "Donation amount must be positive"}

    {:error, :campaign_closed} ->
      {:error, "This campaign is no longer accepting donations"}

    {:error, reason} ->
      {:error, "Donation creation failed: #{inspect(reason)}"}
  end
end

# FAIL: Nested case statements (hard to read and maintain)
def create_donation(params) do
  case validate_params(params) do
    {:ok, validated} ->
      case get_or_create_donor(validated) do
        {:ok, donor} ->
          case fetch_active_campaign(validated) do
            {:ok, campaign} ->
              # More nesting...
              :ok

            {:error, reason} ->
              {:error, reason}
          end

        {:error, reason} ->
          {:error, reason}
      end

    {:error, reason} ->
      {:error, reason}
  end
end
```

**REQUIRED**: `with` constructs MUST:

- Include `else` clause for error handling
- Pattern match on specific error types
- Provide helpful error messages for business errors
- Short-circuit on first error (no partial execution)

### When to Use try/rescue

**PROHIBITED**: Using try/rescue for business logic errors.

**ALLOWED**: Using try/rescue ONLY for:

- Interacting with external libraries that raise exceptions
- Cleanup with `after` clause (file handles, database connections)
- Selective recovery of non-critical failures

```elixir
# PASS: try/rescue for external API with fallback
defmodule FinancialDomain.Reports.Generator do
  def generate_comprehensive_report(year, month) do
    # Critical data - let it crash if unavailable
    donations = fetch_donations(year, month)
    zakat_payments = fetch_zakat_payments(year, month)

    # Optional data - recover gracefully
    exchange_rates = fetch_exchange_rates_safely()
    campaign_stats = fetch_campaign_stats_safely()

    compile_report(donations, zakat_payments, exchange_rates, campaign_stats)
  end

  defp fetch_exchange_rates_safely do
    try do
      ExternalAPI.get_exchange_rates()
    rescue
      _error ->
        Logger.warn("Failed to fetch live exchange rates, using cached rates")
        get_cached_exchange_rates()
    end
  end
end

# PASS: try/after for guaranteed cleanup
defmodule FinancialDomain.Exports.FileGenerator do
  def generate_csv_export(data) do
    file_path = "/tmp/export_#{System.system_time()}.csv"

    try do
      {:ok, file} = File.open(file_path, [:write])
      write_csv_data(file, data)
      File.close(file)
      {:ok, file_path}
    rescue
      error ->
        {:error, error}
    after
      cleanup_temp_files()
    end
  end
end

# FAIL: try/rescue for business logic
def process_donation(donation) do
  try do
    validate_amount(donation.amount)
    save_donation(donation)
  rescue
    ArgumentError ->
      {:error, :invalid_amount}  # BAD: Use pattern matching instead
  end
end
```

### Financial Transaction Error Handling

**CRITICAL**: All financial transactions MUST be atomic with proper rollback.

**REQUIRED**: Use Ecto transactions for multi-step database operations:

```elixir
# PASS: Atomic transaction with rollback
defmodule FinancialDomain.Transfers.AtomicTransfer do
  def transfer(from_account_id, to_account_id, amount) do
    Repo.transaction(fn ->
      with {:ok, from_account} <- fetch_and_lock_account(from_account_id),
           {:ok, to_account} <- fetch_and_lock_account(to_account_id),
           :ok <- validate_sufficient_balance(from_account, amount),
           {:ok, _} <- debit_account(from_account, amount),
           {:ok, _} <- credit_account(to_account, amount),
           {:ok, transfer_record} <- record_transfer(from_account_id, to_account_id, amount) do
        transfer_record
      else
        {:error, :insufficient_balance} ->
          Repo.rollback(:insufficient_balance)

        {:error, reason} ->
          Repo.rollback(reason)
      end
    end)
  end
end

# FAIL: Non-atomic operations (partial state possible)
defmodule FinancialDomain.Transfers.NonAtomicTransfer do
  def transfer(from_account_id, to_account_id, amount) do
    case debit_account(from_account_id, amount) do
      {:ok, _} ->
        # If this fails, money is lost!
        credit_account(to_account_id, amount)

      error ->
        error
    end
  end
end
```

**REQUIRED**: Transaction rollback MUST:

- Revert all database changes atomically
- Clear in-memory state (GenServer state, ETS caches)
- Trigger compensating actions for external services
- Log rollback event with complete context for audit trail

### Idempotency Requirements

**REQUIRED**: Financial operations MUST be idempotent (safe to retry):

```elixir
# PASS: Idempotent donation creation
defmodule FinancialDomain.Donations.IdempotentCreator do
  def create_donation(idempotency_key, params) do
    with {:ok, :new} <- check_idempotency(idempotency_key),
         {:ok, donation} <- do_create_donation(params),
         :ok <- store_idempotency_result(idempotency_key, donation) do
      {:ok, donation}
    else
      {:ok, :duplicate, existing_donation} ->
        # Already processed - return existing
        {:ok, existing_donation}

      {:error, reason} ->
        # Creation failed - client can retry with same key
        {:error, reason}
    end
  end

  defp check_idempotency(key) do
    case Repo.get_by(IdempotencyKey, key: key) do
      nil -> {:ok, :new}
      %{donation_id: donation_id} ->
        donation = Repo.get!(Donation, donation_id)
        {:ok, :duplicate, donation}
    end
  end
end
```

**REQUIRED**: Idempotency keys MUST:

- Be client-provided (UUID or similar)
- Prevent duplicate processing of retried requests
- Be stored with transaction results
- Have reasonable TTL (7-30 days)

### External Service Protection

**REQUIRED**: All external service integrations (payment gateways, regulatory APIs) MUST implement circuit breaker pattern.

```elixir
# PASS: Circuit breaker for payment gateway
defmodule FinancialDomain.ExternalServices.CircuitBreaker do
  use GenServer

  defstruct [
    :service_name,
    :state,
    :failure_count,
    :failure_threshold,
    :timeout,
    :last_failure_time
  ]

  def call(service_name, function) do
    GenServer.call(via_tuple(service_name), {:call, function})
  end

  @impl true
  def handle_call({:call, function}, _from, %{state: :open} = state) do
    if should_attempt_reset?(state) do
      attempt_call(function, %{state | state: :half_open})
    else
      {:reply, {:error, :circuit_open}, state}
    end
  end

  @impl true
  def handle_call({:call, function}, _from, state) do
    attempt_call(function, state)
  end

  defp attempt_call(function, state) do
    try do
      result = function.()
      updated_state = %{state | state: :closed, failure_count: 0}
      {:reply, {:ok, result}, updated_state}
    catch
      _kind, _reason ->
        updated_failure_count = state.failure_count + 1

        if updated_failure_count >= state.failure_threshold do
          {:reply, {:error, :circuit_opened},
           %{state | state: :open, failure_count: updated_failure_count}}
        else
          {:reply, {:error, :call_failed},
           %{state | failure_count: updated_failure_count}}
        end
    end
  end
end
```

**REQUIRED**: Circuit breaker MUST:

- Fail fast when circuit is OPEN (don't wait for timeouts)
- Return appropriate error code (`:circuit_open`)
- Log circuit state transitions (CLOSED → OPEN → HALF_OPEN)
- Alert operations team when circuit opens

**REQUIRED**: Circuit breaker configuration MUST specify:

- Failure threshold (default: 5 failures)
- Reset timeout (default: 60 seconds)
- Half-open test behavior (allow one request to test recovery)

### Retry Requirements

**REQUIRED**: Idempotent operations (queries, reads) MUST implement retry with exponential backoff:

```elixir
# PASS: Exponential backoff with configurable retries
defmodule FinancialDomain.Payments.RobustProcessor do
  def process_payment(donation, opts \\ []) do
    max_retries = Keyword.get(opts, :max_retries, 3)
    process_with_retries(donation, max_retries)
  end

  defp process_with_retries(donation, retries_left) do
    with {:ok, validated} <- validate_payment(donation),
         {:ok, auth_result} <- authorize_payment(validated),
         {:ok, capture_result} <- capture_payment(auth_result),
         {:ok, receipt} <- generate_receipt(capture_result),
         :ok <- save_transaction(receipt) do
      {:ok, receipt}
    else
      {:error, :validation_failed} = error ->
        # Don't retry validation errors
        error

      {:error, :insufficient_funds} = error ->
        # Don't retry insufficient funds
        error

      {:error, :gateway_timeout} when retries_left > 0 ->
        Logger.warn("Payment gateway timeout, retrying (#{retries_left} attempts left)")
        :timer.sleep(calculate_backoff(max_retries - retries_left))
        process_with_retries(donation, retries_left - 1)

      {:error, reason} = error ->
        Logger.error("Payment failed: #{inspect(reason)}")
        error
    end
  end

  defp calculate_backoff(attempt) do
    # Exponential backoff: 1s, 2s, 4s
    :timer.seconds(2 ** attempt)
  end
end
```

**REQUIRED**: Retry policies MUST:

- Define explicit retry-able error types (transient failures only)
- Exclude non-retryable errors (validation failures, authorization failures)
- Use exponential backoff with jitter (prevent thundering herd)
- Have maximum retry limit (default: 3 attempts)

**PROHIBITED**: Retrying non-idempotent operations (debits, credits) without idempotency keys.

### Error Logging Standards

**REQUIRED**: All financial operation errors MUST be logged with:

- Timestamp (ISO 8601 format with timezone)
- User ID or session ID
- Operation type (`:zakat_payment`, `:murabaha_contract`, `:donation`)
- Error type and reason
- Affected entities (account IDs, transaction IDs)
- Correlation ID (for distributed tracing)

```elixir
# PASS: Structured error logging
defmodule FinancialDomain.AuditLog do
  require Logger

  def log_financial_error(operation, error) do
    Logger.error(
      "Financial operation failed",
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
      user_id: operation.user_id,
      operation_type: operation.type,
      error_type: extract_error_type(error),
      error_reason: sanitize_error_reason(error),
      affected_entities: operation.entity_ids,
      correlation_id: operation.correlation_id
    )
  end

  defp sanitize_error_reason(error) do
    # Remove PII from error messages
    error
    |> inspect()
    |> String.replace(~r/account_id: \d+/, "account_id: [REDACTED]")
    |> String.replace(~r/email: [^\s,}]+/, "email: [REDACTED]")
  end
end
```

**REQUIRED**: Audit logs MUST:

- Be written synchronously (not deferred)
- Be stored in append-only audit database
- Retain for minimum 7 years (regulatory compliance)
- Exclude PII in error messages (account numbers, emails, names)

### Error Message Sanitization

**CRITICAL**: Error messages returned to clients MUST NOT contain:

- PII (personal identifiable information)
- Financial data (account numbers, balances, amounts)
- System internals (database queries, process PIDs, node names)
- Security tokens (API keys, session IDs)

```elixir
# PASS: Sanitized error responses
defmodule FinancialDomain.ErrorResponse do
  defstruct [:error_code, :message, :correlation_id]

  def from_error({:error, :insufficient_balance}) do
    %__MODULE__{
      error_code: "TXN_INSUFFICIENT_FUNDS",
      message: "Insufficient funds for this transaction",
      correlation_id: generate_correlation_id()
    }
  end

  def from_error({:error, :account_not_found}) do
    %__MODULE__{
      error_code: "ACC_NOT_FOUND",
      message: "Account not found",
      correlation_id: generate_correlation_id()
    }
  end
end

# FAIL: Exposing sensitive data
defmodule FinancialDomain.ErrorResponse do
  def from_error({:error, {:insufficient_balance, account, amount}}) do
    # BAD: Exposes account details and amounts
    %{
      error: "Account #{account.id} has balance #{account.balance}, cannot debit #{amount}"
    }
  end
end
```

**REQUIRED**: Separate client-facing messages from internal logs:

- **Client**: Error code + generic message + correlation ID
- **Internal logs**: Full details (account IDs, amounts, stack traces)

### Error Scenario Coverage

**REQUIRED**: Unit tests MUST cover:

- Happy path (successful execution)
- Expected error cases (validation failures, business rule violations)
- Edge cases (zero amounts, boundary values, empty lists)
- Concurrent access scenarios
- Infrastructure failures (mock database/API errors)

**REQUIRED**: Integration tests MUST verify:

- Transaction rollback on errors
- Audit trail completeness
- Circuit breaker state transitions
- Retry policy correctness
- Supervisor restart behavior

```elixir
# PASS: Comprehensive error scenario tests
defmodule FinancialDomain.Donations.ProcessorTest do
  use ExUnit.Case, async: true

  describe "process_donation/1" do
    test "returns {:ok, donation} on success" do
      params = valid_donation_params()
      assert {:ok, %Donation{}} = Processor.process_donation(params)
    end

    test "returns {:error, :invalid_amount} for negative amount" do
      params = %{valid_donation_params() | amount: -100}
      assert {:error, :invalid_amount} = Processor.process_donation(params)
    end

    test "returns {:error, :campaign_closed} when campaign is inactive" do
      params = valid_donation_params()
      create_closed_campaign(params.campaign_id)
      assert {:error, :campaign_closed} = Processor.process_donation(params)
    end

    test "rolls back transaction on payment failure" do
      params = valid_donation_params()
      mock_payment_failure()

      assert {:error, :payment_failed} = Processor.process_donation(params)
      refute Repo.get_by(Donation, campaign_id: params.campaign_id)
    end

    test "logs audit trail on error" do
      params = valid_donation_params()
      mock_payment_failure()

      assert capture_log(fn ->
        Processor.process_donation(params)
      end) =~ "Financial operation failed"
    end
  end
end
```

### Property-Based Testing

**RECOMMENDED**: Use property-based testing for financial calculations:

```elixir
# PASS: Property-based test for Zakat calculation
defmodule FinancialDomain.Zakat.CalculatorTest do
  use ExUnit.Case
  use PropCheck

  property "zakat calculation is idempotent" do
    forall wealth <- positive_decimal() do
      result1 = Calculator.calculate_zakat(wealth)
      result2 = Calculator.calculate_zakat(wealth)
      result1 == result2
    end
  end

  property "zakat is always 2.5% of wealth above nisab" do
    forall {wealth, nisab} <- {positive_decimal(), positive_decimal()} do
      implies wealth > nisab do
        {:ok, zakat} = Calculator.calculate_zakat(wealth, nisab)
        expected = Decimal.mult(wealth, Decimal.new("0.025"))
        Decimal.equal?(zakat, expected)
      end
    end
  end
end
```

### OSE Platform Standards

- [Concurrency Standards](./concurrency-standards.md) - Process-based concurrency and message passing
- [OTP Supervisor](./otp-supervisor.md) - Supervision strategies and restart policies
- [Best Practices](./coding-standards.md) - Elixir coding conventions

### Learning Resources

For learning Elixir fundamentals and concepts referenced in these standards, see:

- **[Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md)** - Complete Elixir learning journey
- **[Elixir By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/by-example/_index.md)** - Annotated code examples
  - **[Intermediate Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/by-example/intermediate.md)** - Error handling, pattern matching, with construct
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/by-example/advanced.md)** - Supervision trees, GenServer, OTP patterns
- **[Elixir In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/in-the-field/_index.md)** - Error handling patterns and best practices

**Note**: These standards assume you've learned Elixir basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce repository core principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Tagged tuples make errors explicit (`:ok` or `:error` in return values)
   - Supervision trees make failure handling explicit (restart strategies defined upfront)
   - with construct makes error paths explicit (else clause shows all failure modes)

2. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Supervisors automatically restart crashed processes
   - Circuit breakers automatically fail-fast when services are down
   - Retry policies with exponential backoff automatically retry transient failures

3. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - "Let it crash" philosophy ensures clean state on restart (no state corruption)
   - Idempotency keys prevent duplicate transactions
   - Atomic transactions guarantee consistent state (all-or-nothing)

4. **[Simplicity Over Complexity](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - "Let it crash" eliminates defensive programming
   - Pattern matching on tagged tuples is simpler than exception hierarchies
   - Supervision handles failure recovery (no manual error propagation)

## Compliance Checklist

Before deploying Elixir financial services, verify:

- [ ] All processes are supervised with appropriate restart strategies
- [ ] Business errors return tagged tuples (`{:ok, result}` or `{:error, reason}`)
- [ ] Infrastructure errors crash and let supervisors restart
- [ ] Financial transactions are atomic with rollback
- [ ] Audit trails logged for all financial operation errors
- [ ] Circuit breakers implemented for external services
- [ ] Retry policies configured for idempotent operations
- [ ] Error messages sanitized (no PII, no system internals)
- [ ] Idempotency keys used for financial operations
- [ ] Integration tests verify supervision and rollback behavior

---

**Status**: Active (mandatory for all OSE Platform Elixir services)
