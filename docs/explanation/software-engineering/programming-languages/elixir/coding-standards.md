---
title: "Elixir Coding Standards"
description: Authoritative OSE Platform Elixir coding standards (idioms, best practices, anti-patterns to avoid)
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - coding-standards
  - idioms
  - best-practices
  - anti-patterns
  - otp
  - pattern-matching
  - functional-programming
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-02-05
---

# Elixir Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Elixir fundamentals from [AyoKoding Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an Elixir tutorial. We define HOW to apply Elixir in THIS codebase, not WHAT Elixir is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Elixir development in the OSE Platform. These are prescriptive rules that MUST be followed across all Elixir projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Elixir developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform idioms, naming conventions, OTP patterns, best practices, and anti-patterns to avoid

## Quick Reference

### Standards Sections

**Core Idioms** (Part 1):

- [Pattern Matching](#pattern-matching)
- [Pipe Operator](#pipe-operator)
- [Anonymous Functions](#anonymous-functions)
- [Guards](#guards)
- [Protocols](#protocols)
- [with Construct](#with-construct)

**Naming & Organization Best Practices** (Part 2):

- [Naming Conventions](#naming-conventions)
- [OTP Patterns](#otp-patterns)
- [Supervision Tree Design](#supervision-tree-design)
- [Context Modules](#context-modules)
- [Ecto Changeset Patterns](#ecto-changeset-patterns)
- [Testing Standards](#testing-best-practices)

**Anti-Patterns to Avoid** (Part 3):

- [Process Anti-Patterns](#process-anti-patterns)
- [GenServer Misuse](#genserver-misuse)
- [Supervision Errors](#supervision-errors)
- [Performance Pitfalls](#performance-pitfalls)
- [Ecto Common Mistakes](#ecto-common-mistakes)
- [Testing Anti-Patterns](#testing-anti-patterns)

## Software Engineering Principles

These standards enforce the the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Elixir Implements**:

- `mix format` for automated code formatting
- `mix compile --warnings-as-errors` for strict compilation
- `mix test` for automated testing with ExUnit
- `mix credo` for code quality analysis
- `mix dialyzer` for static type checking
- GitHub Actions CI/CD pipelines

**PASS Example** (Automated Zakat Calculation Validation):

```elixir
# mix.exs - Automated build and quality configuration
defmodule FinancialDomain.MixProject do
  use Mix.Project

  def project do
    [
      app: :financial_domain,
      version: "1.0.0",
      elixir: "~> 1.19",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      test_coverage: [tool: ExCoveralls, minimum_coverage: 85]
    ]
  end

  defp deps do
    [
      {:decimal, "~> 2.3"},
      {:ecto, "~> 3.12"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:excoveralls, "~> 0.18", only: :test}
    ]
  end
end

# test/zakat/calculator_test.exs - Automated Zakat validation
defmodule FinancialDomain.Zakat.CalculatorTest do
  use ExUnit.Case, async: true
  doctest FinancialDomain.Zakat.Calculator

  alias FinancialDomain.Zakat.Calculator
  alias FinancialDomain.Money

  describe "calculate/2" do
    test "returns 2.5% zakat for wealth above nisab" do
      wealth = Money.new(100_000, :USD)
      nisab = Money.new(5_000, :USD)
      expected_zakat = Money.new(2_500, :USD)

      assert {:ok, zakat} = Calculator.calculate(wealth, nisab)
      assert Money.equal?(zakat, expected_zakat)
    end

    test "returns zero for wealth below nisab" do
      wealth = Money.new(1_000, :USD)
      nisab = Money.new(5_000, :USD)

      assert {:ok, zakat} = Calculator.calculate(wealth, nisab)
      assert Money.equal?(zakat, Money.new(0, :USD))
    end
  end
end
```

**FAIL Example** (Manual Testing):

```elixir
# No automated tests - manual verification only
defmodule FinancialDomain.Zakat.Calculator do
  def calculate(wealth, nisab) do
    if Decimal.gt?(wealth, nisab) do
      Decimal.mult(wealth, Decimal.new("0.025"))
    else
      Decimal.new(0)
    end
  end
end

# Manual testing process:
# 1. Developer runs: iex -S mix
# 2. Manually enters: Calculator.calculate(100000, 5000)
# 3. Visually checks result
# 4. No regression detection
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Elixir Implements**:

- Explicit pattern matching in function heads (no hidden control flow)
- No default function arguments (all parameters visible at call site)
- Function clause guards make conditions explicit (`when is_integer(x)`)
- Ecto changeset validations are explicit (no hidden validation rules)
- Explicit `:ok`/`:error` tuples instead of exceptions for business logic
- Named processes via `name:` option (explicit registration)
- Pipe operator makes data flow visible

**PASS Example** (Explicit Murabaha Contract):

```elixir
# Explicit Murabaha contract with visible validation and business rules
defmodule FinancialDomain.Islamic.MurabahaContract do
  @moduledoc """
  Murabaha (cost-plus financing) contract with explicit terms.

  All terms are explicit - no hidden defaults or implicit calculations.
  Islamic scholars can verify Shariah compliance by reading the code.
  """

  use Ecto.Schema
  import Ecto.Changeset
  alias FinancialDomain.Money

  schema "murabaha_contracts" do
    field :contract_id, :string
    field :customer_id, :string
    field :cost_price, :decimal
    field :profit_margin, :decimal
    field :total_price, :decimal
    field :installment_count, :integer
    field :installment_amount, :decimal
    field :contract_date, :date

    timestamps()
  end

  @doc """
  Creates a Murabaha contract with explicit validation.

  All parameters required - no defaults that could hide Shariah violations.
  """
  def create_contract(
        customer_id,
        cost_price,
        profit_margin,
        installment_count,
        contract_date
      ) when is_binary(customer_id) and
             is_integer(installment_count) and installment_count > 0 do
    # Explicit calculation - no hidden formulas
    total_price = Money.add(cost_price, profit_margin)
    installment_amount = Money.divide(total_price, installment_count)

    attrs = %{
      contract_id: generate_contract_id(),
      customer_id: customer_id,
      cost_price: Money.to_decimal(cost_price),
      profit_margin: Money.to_decimal(profit_margin),
      total_price: Money.to_decimal(total_price),
      installment_count: installment_count,
      installment_amount: Money.to_decimal(installment_amount),
      contract_date: contract_date
    }

    %__MODULE__{}
    |> changeset(attrs)
    |> case do
      %Ecto.Changeset{valid?: true} = changeset ->
        {:ok, changeset}

      %Ecto.Changeset{valid?: false} = changeset ->
        {:error, changeset}
    end
  end

  # Pattern match makes requirements explicit
  def changeset(contract, attrs) do
    contract
    |> cast(attrs, [
      :contract_id,
      :customer_id,
      :cost_price,
      :profit_margin,
      :total_price,
      :installment_count,
      :installment_amount,
      :contract_date
    ])
    # Explicit validation - all rules visible
    |> validate_required([
      :contract_id,
      :customer_id,
      :cost_price,
      :profit_margin,
      :total_price,
      :installment_count,
      :installment_amount,
      :contract_date
    ])
    |> validate_number(:cost_price, greater_than: 0)
    |> validate_number(:profit_margin, greater_than_or_equal_to: 0)
    |> validate_number(:total_price, greater_than: 0)
    |> validate_number(:installment_count, greater_than: 0)
    |> validate_number(:installment_amount, greater_than: 0)
    |> validate_total_price_calculation()
    |> validate_installment_calculation()
    |> unique_constraint(:contract_id)
  end

  defp generate_contract_id do
    "MUR-#{:crypto.strong_rand_bytes(8) |> Base.encode16()}"
  end
end
```

**FAIL Example** (Implicit Configuration):

```elixir
# Anti-pattern: Hidden defaults and implicit behavior
defmodule FinancialDomain.Islamic.MurabahaContract.Bad do
  use Ecto.Schema
  import Ecto.Changeset

  schema "murabaha_contracts" do
    field :customer_id, :string
    field :cost_price, :decimal
    field :profit_margin, :decimal
    # Missing explicit fields - calculated implicitly!

    timestamps()
  end

  # BAD: Default argument hides business rule
  def create_contract(customer_id, cost_price, profit_margin, installment_count \\ 12) do
    # Magic number 12 - where did it come from? Shariah compliant?

    # BAD: Implicit calculation - not visible in function signature
    total = calculate_total(cost_price, profit_margin)

    # BAD: Uses Process dictionary for configuration (mutable global state)
    markup_rate = Process.get(:default_markup_rate, Decimal.new("0.15"))

    attrs = %{
      customer_id: customer_id,
      cost_price: cost_price,
      profit_margin: profit_margin
      # Where's the total_price field? Hidden!
      # Where's installment_amount? Hidden!
    }

    %__MODULE__{}
    |> changeset(attrs)
  end

  # BAD: No explicit validation
  def changeset(contract, attrs) do
    # Just casts without validation - accepts anything!
    cast(contract, attrs, [:customer_id, :cost_price, :profit_margin])
  end
end
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures over mutable state for safer, more predictable code.

**How Elixir Implements**:

- Everything immutable by default (no variable reassignment in Elixir)
- Data transformations return new copies (original untouched)
- Pattern matching creates new bindings, doesn't mutate
- ETS tables for shared state (explicit concurrency primitive, not mutation)
- Processes hold state via recursion or GenServer (explicit state changes)
- No object-oriented mutation (no `user.balance = new_value`)
- Pipe operator encourages functional transformations

**PASS Example** (Immutable Zakat Transaction):

```elixir
# Immutable transaction record - tamper-proof audit trail
defmodule FinancialDomain.Zakat.Transaction do
  @moduledoc """
  Immutable Zakat transaction for audit trail.

  Once created, transaction cannot be modified. Corrections create
  new transactions, preserving complete audit history.
  """

  @enforce_keys [:transaction_id, :payer_id, :wealth, :zakat_amount, :paid_at, :audit_hash]
  defstruct [:transaction_id, :payer_id, :wealth, :zakat_amount, :paid_at, :audit_hash]

  alias FinancialDomain.Money

  @type t :: %__MODULE__{
    transaction_id: String.t(),
    payer_id: String.t(),
    wealth: Money.t(),
    zakat_amount: Money.t(),
    paid_at: DateTime.t(),
    audit_hash: String.t()
  }

  @doc """
  Creates immutable transaction with audit hash.

  Returns new struct - cannot be modified after creation.
  """
  def create(payer_id, wealth, zakat_amount) do
    transaction_id = generate_transaction_id()
    paid_at = DateTime.utc_now()

    # Build transaction data
    transaction_data = %{
      transaction_id: transaction_id,
      payer_id: payer_id,
      wealth: wealth,
      zakat_amount: zakat_amount,
      paid_at: paid_at
    }

    # Calculate audit hash from immutable data
    audit_hash = calculate_audit_hash(transaction_data)

    # Return immutable struct
    %__MODULE__{
      transaction_id: transaction_id,
      payer_id: payer_id,
      wealth: wealth,
      zakat_amount: zakat_amount,
      paid_at: paid_at,
      audit_hash: audit_hash
    }
  end

  @doc """
  Creates correction transaction - original remains unchanged.

  Does NOT modify existing transaction. Returns new transaction
  with corrected amount, preserving audit trail.
  """
  def correct(original, corrected_amount) do
    # Original transaction remains unchanged (immutability)
    create(original.payer_id, original.wealth, corrected_amount)
  end

  defp generate_transaction_id do
    "ZKT-#{:crypto.strong_rand_bytes(8) |> Base.encode16()}"
  end

  defp calculate_audit_hash(data) do
    data
    |> :erlang.term_to_binary()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16()
  end
end
```

**FAIL Example** (Mutable State with Agent):

```elixir
# Anti-pattern: Using Agent for mutable state (wrong approach)
defmodule FinancialDomain.Zakat.Transaction.Bad do
  @moduledoc """
  BAD: Mutable transaction using Agent - violates audit trail.
  """

  use Agent

  # BAD: Transaction can be mutated after creation
  def start_link(payer_id, wealth, zakat_amount) do
    transaction = %{
      transaction_id: generate_id(),
      payer_id: payer_id,
      wealth: wealth,
      zakat_amount: zakat_amount,
      paid_at: DateTime.utc_now()
    }

    Agent.start_link(fn -> transaction end, name: via_tuple(transaction.transaction_id))
  end

  # BAD: Allows mutation - violates immutability and audit trail
  def update_amount(transaction_id, new_amount) do
    Agent.update(via_tuple(transaction_id), fn transaction ->
      # DANGER: Mutates transaction, loses audit trail
      # Can't verify if this was the original amount
      %{transaction | zakat_amount: new_amount}
    end)
  end

  defp generate_id do
    "ZKT-#{:crypto.strong_rand_bytes(8) |> Base.encode16()}"
  end
end
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free for predictable, testable code.

**How Elixir Implements**:

- Pure functions in modules (no side effects in calculations)
- Side effects isolated in GenServers, Tasks, and OTP processes
- Functional core, imperative shell pattern (pure logic, I/O at edges)
- Pipe operator encourages pure transformations
- Pattern matching enables pure control flow
- ExUnit makes testing pure functions trivial
- with statements compose pure operations

**PASS Example** (Pure Zakat Calculator):

```elixir
# Pure Zakat calculation module - no side effects
defmodule FinancialDomain.Zakat.Calculator do
  @moduledoc """
  Pure Zakat calculation functions.

  All functions deterministic - same inputs always produce same output.
  No database queries, no logging, no network calls.
  Islamic scholars can verify calculations by inspection.
  """

  alias FinancialDomain.Money

  @zakat_rate Decimal.new("0.025")  # 2.5% - Shariah mandated rate

  @type calculation_result ::
    {:ok, Money.t()} | {:error, :wealth_below_nisab} | {:error, :invalid_amount}

  @doc """
  Calculates Zakat (2.5%) on wealth above nisab threshold.

  Pure function - deterministic, no side effects, easily testable.

  ## Examples

      iex> wealth = Money.new(100_000, :SAR)
      iex> nisab = Money.new(5_000, :SAR)
      iex> Calculator.calculate(wealth, nisab)
      {:ok, %Money{amount: Decimal.new("2500.00"), currency: :SAR}}

      iex> wealth = Money.new(3_000, :SAR)
      iex> nisab = Money.new(5_000, :SAR)
      iex> Calculator.calculate(wealth, nisab)
      {:error, :wealth_below_nisab}
  """
  @spec calculate(Money.t(), Money.t()) :: calculation_result()
  def calculate(wealth, nisab) do
    # Pure validation - no side effects
    with :ok <- validate_positive_amount(wealth),
         :ok <- validate_positive_amount(nisab),
         :ok <- validate_same_currency(wealth, nisab),
         :ok <- validate_wealth_above_nisab(wealth, nisab) do
      # Pure calculation - deterministic
      zakat_amount = Money.multiply(wealth, @zakat_rate)
      {:ok, zakat_amount}
    end
  end

  @doc """
  Determines if wealth qualifies for Zakat (must exceed nisab).

  Pure boolean function - no side effects.
  """
  @spec eligible?(Money.t(), Money.t()) :: boolean()
  def eligible?(wealth, nisab) do
    Money.greater_than?(wealth, nisab)
  end

  # Private pure helper functions

  defp validate_positive_amount(%Money{amount: amount}) do
    if Decimal.positive?(amount) or Decimal.eq?(amount, Decimal.new(0)) do
      :ok
    else
      {:error, :invalid_amount}
    end
  end

  defp validate_same_currency(%Money{currency: c1}, %Money{currency: c2}) do
    if c1 == c2 do
      :ok
    else
      {:error, :currency_mismatch}
    end
  end

  defp validate_wealth_above_nisab(wealth, nisab) do
    if Money.greater_than?(wealth, nisab) do
      :ok
    else
      {:error, :wealth_below_nisab}
    end
  end
end
```

**FAIL Example** (Impure with Side Effects):

```elixir
# Anti-pattern: Business logic mixed with side effects
defmodule FinancialDomain.Zakat.BadCalculator do
  @moduledoc """
  BAD: Calculation mixed with database queries and logging.
  Hard to test, non-deterministic, violates single responsibility.
  """

  alias FinancialDomain.Repo
  alias FinancialDomain.Money

  require Logger

  # BAD: Impure function - side effects everywhere
  def calculate(payer_id, wealth) do
    # Side effect: Logging in calculation
    Logger.info("Calculating Zakat for payer #{payer_id}, wealth #{inspect(wealth)}")

    # Side effect: Database query during calculation
    nisab_record = Repo.get_by(NisabThreshold, currency: wealth.currency, is_current: true)

    # Side effect: External API call
    nisab = fetch_nisab_from_api(wealth.currency)

    # Non-deterministic result
    zakat_adjusted = Money.multiply(zakat_base, Decimal.new(1 + :rand.uniform() * 0.001))

    # Side effect: Audit log during calculation
    log_calculation(payer_id, wealth, zakat_adjusted)

    zakat_adjusted
  end
end
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Development environments and builds should be reproducible from the start.

**How Elixir Implements**:

- `mix.lock` for exact dependency versions (committed to git)
- Exact version specifications in `mix.exs` (no loose ranges)
- `.tool-versions` file for asdf version manager (Elixir + Erlang/OTP)
- Docker with pinned Elixir and OTP versions
- Hex package manager with deterministic resolution
- `MIX_ENV` for consistent build environments
- Release configuration for reproducible deployments

**PASS Example** (Reproducible Elixir Environment):

```elixir
# mix.exs - Exact dependency versions for reproducibility
defmodule FinancialDomain.MixProject do
  use Mix.Project

  def project do
    [
      app: :financial_domain,
      version: "1.0.0",
      # Exact Elixir version requirement
      elixir: "~> 1.19.1",
      # Exact OTP version requirement
      erlang: "~> 27.0",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      releases: releases()
    ]
  end

  # Exact dependency versions - reproducible builds
  defp deps do
    [
      # Database
      {:ecto, "~> 3.12.5"},
      {:ecto_sql, "~> 3.12.1"},
      {:postgrex, "~> 0.19.3"},

      # Financial calculations
      {:decimal, "~> 2.3.1"},
      {:money, "~> 1.13.0"},

      # Code quality
      {:credo, "~> 1.7.11", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4.5", only: [:dev, :test], runtime: false},

      # Testing
      {:excoveralls, "~> 0.18.3", only: :test}
    ]
  end
end
```

**FAIL Example** (Non-Reproducible):

```elixir
# mix.exs - BAD: Loose version ranges
defmodule FinancialDomain.BadMixProject do
  use Mix.Project

  def project do
    [
      app: :financial_domain,
      version: "1.0.0",
      # BAD: Wide Elixir range - could be 1.14, 1.15, 1.16, 1.17, 1.19
      elixir: "~> 1.14",
      # BAD: No OTP version specified
      deps: deps()
    ]
  end

  # BAD: Loose dependency versions
  defp deps do
    [
      # BAD: Any 3.x version - could be 3.10, 3.11, 3.12, etc.
      {:ecto, "~> 3.0"},

      # BAD: Major version range - breaking changes possible
      {:decimal, ">= 2.0.0"},

      # BAD: No upper bound - could install ANY future version
      {:phoenix, ">= 1.7.0"}
    ]
  end
end
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Part 1: Core Idioms

### Pattern Matching

Pattern matching is Elixir's fundamental mechanism for destructuring data and controlling program flow. Unlike assignment in imperative languages, the `=` operator performs pattern matching.

**MUST** use pattern matching in function heads for different cases.

```elixir
# PASS: Pattern matching in function definitions
defmodule FinancialDomain.Zakat.Calculator do
  @spec calculate(Money.t(), Money.t()) :: result()

  # Negative wealth - no Zakat
  def calculate(%Money{amount: amount}, _nisab) when amount < 0 do
    {:error, "Wealth cannot be negative"}
  end

  # Wealth below nisab - no Zakat obligation
  def calculate(%Money{amount: wealth_amount} = wealth, %Money{amount: nisab_amount})
      when wealth_amount <= nisab_amount do
    {:ok, Money.new(0, wealth.currency)}
  end

  # Wealth above nisab - calculate 2.5% Zakat
  def calculate(%Money{} = wealth, %Money{amount: nisab_amount})
      when wealth.amount > nisab_amount do
    zakat_amount = Money.multiply(wealth, Decimal.new("0.025"))
    {:ok, zakat_amount}
  end

  # Currency mismatch
  def calculate(%Money{currency: c1}, %Money{currency: c2}) when c1 != c2 do
    {:error, "Currency mismatch: wealth and nisab must use same currency"}
  end
end
```

**FAIL: No pattern matching**:

```elixir
# WRONG: Using conditionals instead of pattern matching
def calculate(wealth, nisab) do
  if wealth.amount < 0 do
    {:error, "Wealth cannot be negative"}
  else
    if wealth.currency != nisab.currency do
      {:error, "Currency mismatch"}
    else
      if wealth.amount <= nisab.amount do
        {:ok, Money.new(0, wealth.currency)}
      else
        zakat_amount = Money.multiply(wealth, Decimal.new("0.025"))
        {:ok, zakat_amount}
      end
    end
  end
end
```

### Pipe Operator

The pipe operator `|>` takes the result of an expression and passes it as the first argument to the next function.

**MUST** use pipe operator for sequential transformations.

```elixir
# PASS: Pipe operator for readable flow
def generate_annual_summary(year, currency \\ :USD) do
  year
  |> fetch_zakat_payments()
  |> filter_by_currency(currency)
  |> group_by_month()
  |> calculate_monthly_totals()
  |> calculate_running_totals()
  |> add_statistics()
  |> format_as_report()
end
```

**FAIL: Nested function calls**:

```elixir
# WRONG: Nested calls (hard to read)
result = format_report(
  calculate_totals(
    filter_donations(
      fetch_donations(start_date, end_date)
    )
  )
)
```

### Anonymous Functions

**SHOULD** use capture operator `&` for concise transformations.

```elixir
# PASS: Capture operator
donations
|> Enum.map(&(&1.amount))
|> Enum.filter(&(&1.status == :paid))

# PASS: Anonymous function when logic is complex
Enum.filter(donations, fn d ->
  Money.greater_than?(d.amount, threshold) and d.verified
end)
```

**FAIL: Verbose when capture would work**:

```elixir
# WRONG: Verbose lambda when capture would work
Enum.map(donations, fn d -> d.amount end)

# Use: Enum.map(donations, &(&1.amount))
```

### Guards

Guards provide additional constraints on function clauses.

**MUST** use guards to make business rules explicit.

```elixir
# PASS: Guards for business rules
defguard is_valid_currency(currency)
  when currency in [:USD, :EUR, :GBP, :SAR, :AED, :MYR, :IDR]

defguard is_positive_amount(amount)
  when is_number(amount) and amount > 0

def calculate(wealth, nisab, currency)
    when is_positive_amount(wealth) and
         is_nisab_threshold(nisab) and
         is_valid_currency(currency) do
  # Implementation
end
```

**FAIL: No guards**:

```elixir
# WRONG: Manual validation in function body
def calculate(wealth, nisab, currency) do
  if wealth > 0 and nisab >= 0 and currency in [:USD, :EUR] do
    # Implementation
  else
    {:error, :invalid_parameters}
  end
end
```

### Protocols

Protocols enable polymorphism without inheritance.

**SHOULD** use protocols for polymorphic behavior across types.

```elixir
# PASS: Protocol definition
defprotocol FinancialDomain.Calculable do
  @doc "Calculates the monetary value"
  @spec calculate_value(t()) :: FinancialDomain.Money.t()
  def calculate_value(calculable)
end

defimpl FinancialDomain.Calculable, for: FinancialDomain.Invoice do
  def calculate_value(invoice) do
    subtotal = Enum.reduce(invoice.items, Decimal.new(0), fn item, acc ->
      Decimal.add(acc, Decimal.mult(item.price, item.quantity))
    end)

    tax = Decimal.mult(subtotal, Decimal.from_float(invoice.tax_rate))
    total = Decimal.add(subtotal, tax)

    Money.new(total, invoice.currency)
  end
end
```

**FAIL: Type checking instead of protocols**:

```elixir
# WRONG: Manual type checking
def calculate_value(item) do
  cond do
    is_map(item) and Map.has_key?(item, :invoice_type) ->
      calculate_invoice(item)
    is_map(item) and Map.has_key?(item, :payment_type) ->
      calculate_payment(item)
    true ->
      {:error, :unknown_type}
  end
end
```

### with Construct

The `with` construct combines pattern matching with early returns.

**MUST** use `with` for complex pipelines with error handling.

```elixir
# PASS: with construct for complex operations
def process_application(application_id) do
  with {:ok, application} <- fetch_application(application_id),
       {:ok, applicant} <- fetch_applicant(application.applicant_id),
       {:ok, credit_score} <- check_credit_score(applicant),
       {:ok, approved_amount} <- calculate_approval(application, credit_score),
       {:ok, terms} <- generate_terms(approved_amount, application.duration),
       {:ok, contract} <- create_contract(application, terms) do
    {:ok, contract}
  else
    {:error, :application_not_found} ->
      {:error, "Application not found"}

    {:error, :low_credit_score} ->
      {:error, "Credit score below minimum threshold"}

    {:error, reason} ->
      {:error, "Processing failed: #{inspect(reason)}"}
  end
end
```

**FAIL: Nested case statements**:

```elixir
# WRONG: Nested case statements
case fetch_application(application_id) do
  {:ok, application} ->
    case fetch_applicant(application.applicant_id) do
      {:ok, applicant} ->
        case check_credit_score(applicant) do
          {:ok, credit_score} ->
            # More nesting...
          {:error, reason} -> {:error, reason}
        end
      {:error, reason} -> {:error, reason}
    end
  {:error, reason} -> {:error, reason}
end
```

## Part 2: Naming & Organization Best Practices

### Naming Conventions

#### Module Names

**MUST** use PascalCase for module names with hierarchical structure.

```elixir
# PASS: Clear hierarchy
defmodule FinancialDomain.Zakat.Calculator do
end

defmodule FinancialDomain.Donations.Campaign do
end

# FAIL: Flat structure
defmodule ZakatCalculator do  # Lose domain context
end
```

#### Function Names

**MUST** use snake_case for function names with descriptive verbs.

**MUST** use `?` suffix for boolean functions, `!` suffix for raising functions.

```elixir
# PASS: Descriptive function names
def calculate_zakat(wealth, nisab)
def determine_eligibility(applicant)
def valid_amount?(amount)  # Boolean
def fetch_donation!(id)    # Raises on error

# FAIL: Unclear or inconsistent
def calc(w, n)             # Too short
def checkEligibility(a)    # camelCase
def Payment(t)             # PascalCase
```

#### Variable Names

**MUST** use snake_case for variables with descriptive names.

```elixir
# PASS: Descriptive variables
zakat_payments = fetch_zakat_payments(year, month)
donation_totals = calculate_donation_totals(zakat_payments)

# FAIL: Unclear abbreviations
zp = fetch_zakat_payments(year, month)
dt = calculate_donation_totals(zp)
```

### OTP Patterns

#### When to Use GenServer

**MUST** use GenServer for stateful processes.

```elixir
# PASS: GenServer for state management
defmodule FinancialDomain.Zakat.RateCache do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def get_rate(currency) do
    GenServer.call(__MODULE__, {:get_rate, currency})
  end

  @impl true
  def init(_opts) do
    schedule_rate_refresh()
    {:ok, %{rates: load_initial_rates(), last_updated: DateTime.utc_now()}}
  end

  @impl true
  def handle_call({:get_rate, currency}, _from, state) do
    rate = Map.get(state.rates, currency)
    {:reply, {:ok, rate}, state}
  end
end
```

**FAIL: GenServer for stateless operations**:

```elixir
# WRONG: GenServer for stateless calculations
defmodule FinancialDomain.Zakat.CalculatorServer do
  use GenServer

  def calculate(wealth, nisab) do
    GenServer.call(__MODULE__, {:calculate, wealth, nisab})
  end

  def handle_call({:calculate, wealth, nisab}, _from, state) do
    result = do_calculation(wealth, nisab)
    {:reply, result, state}  # State never used!
  end
end

# Use plain module instead:
defmodule FinancialDomain.Zakat.Calculator do
  def calculate(wealth, nisab) do
    if Money.greater_than?(wealth, nisab) do
      Money.multiply(wealth, Decimal.new("0.025"))
    else
      Money.new(0, wealth.currency)
    end
  end
end
```

### Supervision Tree Design

**MUST** choose supervision strategy based on child dependencies.

```elixir
# PASS: :one_for_one for independent children
defmodule FinancialDomain.Application do
  use Application

  def start(_type, _args) do
    children = [
      FinancialDomain.Repo,           # Independent
      {Phoenix.PubSub, name: FinancialDomain.PubSub},
      FinancialDomain.Zakat.RateCache,
      FinancialDomain.Metrics.Counter,
      FinancialDomainWeb.Endpoint
    ]

    # If one crashes, only restart that one
    opts = [strategy: :one_for_one, name: FinancialDomain.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

**FAIL: Wrong strategy for dependencies**:

```elixir
# WRONG: :one_for_one when children are dependent
defmodule FinancialDomain.Payment.BadProcessor do
  use Supervisor

  def init(_init_arg) do
    children = [
      PaymentValidator,    # Validates payments
      PaymentExecutor,     # Depends on validator
      PaymentRecorder      # Depends on executor
    ]

    # BAD: If Validator crashes, Executor has invalid data
    Supervisor.init(children, strategy: :one_for_one)
  end
end

# CORRECT: Use :one_for_all for dependent children
Supervisor.init(children, strategy: :one_for_all)
```

### Context Modules

**MUST** organize related functionality into context modules.

```elixir
# PASS: Context module boundary
defmodule FinancialDomain.Donations do
  @moduledoc """
  Donations context - boundary for donation-related operations.
  """

  import Ecto.Query
  alias FinancialDomain.Repo
  alias FinancialDomain.Donations.{Donation, Campaign, Donor}

  def list_donations(filters \\ %{}) do
    Donation
    |> apply_filters(filters)
    |> preload([:donor, :campaign])
    |> Repo.all()
  end

  def create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, donation} = result ->
        broadcast_donation_created(donation)
        result

      error ->
        error
    end
  end
end
```

**FAIL: Direct access across contexts**:

```elixir
# WRONG: Direct database access from other context
defmodule FinancialDomain.Zakat.Bad do
  alias FinancialDomain.Accounts.User  # Accessing internal schema
  alias FinancialDomain.Repo

  def calculate_and_record(wealth_data, user_id) do
    user = Repo.get(User, user_id)  # Breaks boundary!
    # ...
  end
end

# CORRECT: Use context public API
defmodule FinancialDomain.Zakat do
  def calculate_and_record(wealth_data, user_id) do
    with {:ok, user} <- FinancialDomain.Accounts.get_user(user_id),
         {:ok, calculation} <- calculate_zakat(wealth_data),
         {:ok, payment} <- record_payment(calculation, user) do
      {:ok, payment}
    end
  end
end
```

### Ecto Changeset Patterns

**MUST** use changesets for all data validation.

```elixir
# PASS: Changeset with validation
defmodule FinancialDomain.Donations.Donation do
  use Ecto.Schema
  import Ecto.Changeset

  schema "donations" do
    field :amount, :decimal
    field :currency, :string
    field :status, Ecto.Enum, values: [:pending, :processing, :completed, :failed]
    field :donor_email, :string
    field :campaign_id, :id

    timestamps()
  end

  def changeset(donation, attrs) do
    donation
    |> cast(attrs, [:amount, :currency, :status, :donor_email, :campaign_id])
    |> validate_required([:amount, :currency, :donor_email, :campaign_id])
    |> validate_number(:amount, greater_than: 0)
    |> validate_inclusion(:currency, ["USD", "EUR", "GBP", "SAR"])
    |> validate_format(:donor_email, ~r/@/)
    |> foreign_key_constraint(:campaign_id)
    |> unique_constraint([:donor_email, :campaign_id, :amount])
  end
end
```

**FAIL: Bypassing changesets**:

```elixir
# WRONG: No validation
def create_donation(params) do
  donation = %Donation{
    amount: params["amount"],
    currency: params["currency"],
    donor_email: params["donor_email"]
  }

  Repo.insert(donation)  # No validation - accepts invalid data!
end
```

### Testing Best Practices

**MUST** use table-driven tests with ExUnit.

```elixir
# PASS: Table-driven tests
defmodule FinancialDomain.Zakat.CalculatorTest do
  use ExUnit.Case, async: true

  describe "calculate/2" do
    test "calculates 2.5% zakat for wealth above nisab" do
      wealth = Money.new(10000, :USD)
      nisab = Money.new(5000, :USD)

      assert {:ok, zakat} = Calculator.calculate(wealth, nisab)
      assert Money.equal?(zakat, Money.new(250, :USD))
    end

    test "returns zero for wealth below nisab" do
      wealth = Money.new(3000, :USD)
      nisab = Money.new(5000, :USD)

      assert {:ok, zakat} = Calculator.calculate(wealth, nisab)
      assert Money.equal?(zakat, Money.new(0, :USD))
    end

    test "returns error for negative wealth" do
      wealth = Money.new(-1000, :USD)
      nisab = Money.new(5000, :USD)

      assert {:error, message} = Calculator.calculate(wealth, nisab)
      assert message =~ "cannot be negative"
    end
  end
end
```

**FAIL: Only testing happy path**:

```elixir
# WRONG: Only happy path tested
defmodule FinancialDomain.Donations.ProcessorTest do
  test "processes donation" do
    donation = %{amount: 100, currency: "USD"}
    assert {:ok, _result} = Processor.process(donation)
  end
  # Missing error cases, edge cases, boundary conditions
end
```

## Part 3: Anti-Patterns to Avoid

### Process Anti-Patterns

#### Process Leaks

**PROHIBITED**: Creating unsupervised processes.

```elixir
# FAIL: Process leak
defmodule FinancialDomain.Donations.BadProcessor do
  def process_donation_async(donation_id) do
    # Spawns unsupervised process
    spawn(fn ->
      donation = fetch_donation(donation_id)
      process_payment(donation)
    end)

    :ok
  end
  # If process crashes, no one knows
end

# PASS: Use Task with supervisor
defmodule FinancialDomain.Donations.Processor do
  def process_donation_async(donation_id) do
    Task.Supervisor.async_nolink(
      FinancialDomain.TaskSupervisor,
      fn ->
        donation = fetch_donation(donation_id)
        process_payment(donation)
      end
    )

    :ok
  end
end
```

#### Blocking GenServer Calls

**PROHIBITED**: Synchronous GenServer calls that block for long periods.

```elixir
# FAIL: Blocking call for slow operation
defmodule FinancialDomain.Zakat.BadCalculatorServer do
  use GenServer

  def calculate_annual_zakat(user_id) do
    GenServer.call(__MODULE__, {:calculate_annual, user_id}, :timer.minutes(5))
  end

  @impl true
  def handle_call({:calculate_annual, user_id}, _from, state) do
    # Slow operation blocks GenServer
    wealth_data = fetch_all_wealth_data(user_id)
    calculations = perform_complex_calculations(wealth_data)
    report = generate_detailed_report(calculations)

    {:reply, {:ok, report}, state}
  end
end

# PASS: Async processing with Task
defmodule FinancialDomain.Zakat.CalculatorServer do
  use GenServer

  def calculate_annual_zakat_async(user_id) do
    GenServer.cast(__MODULE__, {:calculate_annual, user_id, self()})
    :ok
  end

  @impl true
  def handle_cast({:calculate_annual, user_id, caller}, state) do
    Task.Supervisor.start_child(FinancialDomain.TaskSupervisor, fn ->
      wealth_data = fetch_all_wealth_data(user_id)
      calculations = perform_complex_calculations(wealth_data)
      report = generate_detailed_report(calculations)

      send(caller, {:zakat_calculation_complete, report})
    end)

    {:noreply, state}
  end
end
```

### GenServer Misuse

#### Stateless GenServer

**PROHIBITED**: Using GenServer when state isn't needed.

```elixir
# FAIL: GenServer for stateless operations
defmodule FinancialDomain.Zakat.BadCalculator do
  use GenServer

  def calculate(wealth, nisab) do
    GenServer.call(__MODULE__, {:calculate, wealth, nisab})
  end

  @impl true
  def handle_call({:calculate, wealth, nisab}, _from, state) do
    result = if wealth > nisab, do: wealth * 0.025, else: 0
    {:reply, result, state}  # State never used!
  end
end

# PASS: Plain module for stateless calculations
defmodule FinancialDomain.Zakat.Calculator do
  def calculate(wealth, nisab) when wealth > nisab do
    wealth * 0.025
  end

  def calculate(_wealth, _nisab), do: 0
end
```

#### God GenServer

**PROHIBITED**: Single GenServer handling too many responsibilities.

```elixir
# FAIL: God GenServer doing everything
defmodule FinancialDomain.BadDonationServer do
  use GenServer

  def handle_call({:validate_donation, donation}, _from, state)
  def handle_call({:process_payment, donation}, _from, state)
  def handle_call({:send_receipt, donation}, _from, state)
  def handle_call({:update_campaign_stats, campaign_id}, _from, state)
  def handle_call({:check_fraud, donation}, _from, state)
  # Too many responsibilities!
end

# PASS: Separate GenServers for different concerns
defmodule FinancialDomain.Donations.ValidationServer do
  use GenServer
  # Handles only validation state
end

defmodule FinancialDomain.Donations.PaymentProcessor do
  use GenServer
  # Handles payment processing state
end

defmodule FinancialDomain.Campaigns.StatsAggregator do
  use GenServer
  # Handles campaign statistics
end
```

### Supervision Errors

#### No Supervision

**PROHIBITED**: Critical processes running without supervision.

```elixir
# FAIL: No supervision
defmodule FinancialDomain.Application do
  use Application

  def start(_type, _args) do
    {:ok, _pid} = FinancialDomain.Zakat.RateCache.start_link([])
    {:ok, self()}  # Returns non-supervisor pid
  end
  # If RateCache crashes, it's gone forever
end

# PASS: Proper supervision
defmodule FinancialDomain.Application do
  use Application

  def start(_type, _args) do
    children = [
      FinancialDomain.Repo,
      {Phoenix.PubSub, name: FinancialDomain.PubSub},
      FinancialDomain.Zakat.RateCache,
      FinancialDomainWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: FinancialDomain.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

### Performance Pitfalls

#### N+1 Query Problem

**PROHIBITED**: Loading associations in a loop instead of preloading.

```elixir
# FAIL: N+1 queries
def generate_campaign_report do
  campaigns = Repo.all(Campaign)  # 1 query

  Enum.map(campaigns, fn campaign ->
    # N queries (one per campaign)
    donations = Repo.all(
      from d in Donation,
      where: d.campaign_id == ^campaign.id
    )

    %{campaign: campaign, donations: donations}
  end)
  # If 100 campaigns: 101 queries total!
end

# PASS: Single query with preload
def generate_campaign_report do
  campaigns =
    Campaign
    |> preload(:donations)
    |> Repo.all()

  Enum.map(campaigns, fn campaign ->
    %{campaign: campaign, donations: campaign.donations}
  end)
  # 1 or 2 queries total
end
```

#### String Concatenation in Loops

**PROHIBITED**: Using `<>` for string building in loops.

```elixir
# FAIL: String concatenation in reduce
def format_donations(donations) do
  Enum.reduce(donations, "", fn donation, acc ->
    acc <> "Donation: #{donation.id}, Amount: #{donation.amount}\n"
  end)
  # Creates new string each iteration - O(n²) complexity
end

# PASS: IOList for efficient string building
def format_donations(donations) do
  donations
  |> Enum.map(fn donation ->
    ["Donation: ", to_string(donation.id), ", Amount: ", to_string(donation.amount), "\n"]
  end)
  |> IO.iodata_to_binary()
end
```

### Ecto Common Mistakes

#### Forgetting Transactions

**PROHIBITED**: Multiple database operations without atomicity.

```elixir
# FAIL: No transaction
def distribute_zakat(pool_id, recipients) do
  pool = Repo.get!(ZakatPool, pool_id)

  Enum.each(recipients, fn recipient ->
    transfer = %Transfer{
      from_pool_id: pool.id,
      to_recipient_id: recipient.id,
      amount: recipient.allocation
    }
    Repo.insert!(transfer)  # Might succeed

    updated_pool = Ecto.Changeset.change(pool,
      balance: pool.balance - recipient.allocation
    )
    Repo.update!(updated_pool)  # Might fail - inconsistent state!
  end)
end

# PASS: Use transaction
def distribute_zakat(pool_id, recipients) do
  Repo.transaction(fn ->
    pool = Repo.get!(ZakatPool, pool_id)

    Enum.each(recipients, fn recipient ->
      transfer = %Transfer{
        from_pool_id: pool.id,
        to_recipient_id: recipient.id,
        amount: recipient.allocation
      }
      Repo.insert!(transfer)

      updated_pool = Ecto.Changeset.change(pool,
        balance: pool.balance - recipient.allocation
      )
      Repo.update!(updated_pool)
    end)

    :ok
  end)
  # All or nothing - consistent state guaranteed
end
```

#### Loading Entire Tables

**PROHIBITED**: Using `Repo.all` without limits or pagination.

```elixir
# FAIL: Load all donations
def analyze_donations do
  donations = Repo.all(Donation)  # Loads ALL donations into memory
  Enum.map(donations, &analyze_single_donation/1)
  # With 1 million donations = OOM crash
end

# PASS: Stream or paginate
def analyze_donations do
  Repo.transaction(fn ->
    Donation
    |> Repo.stream()
    |> Stream.chunk_every(1000)
    |> Enum.each(fn batch ->
      Enum.each(batch, &analyze_single_donation/1)
    end)
  end)
end
```

### Testing Anti-Patterns

#### Testing Implementation Details

**PROHIBITED**: Tests coupled to implementation rather than behavior.

```elixir
# FAIL: Tests internal implementation
test "calls calculate_internal with correct params" do
  assert Calculator.calculate_internal(10000, 5000) == 250
end

# PASS: Tests public behavior
test "calculates 2.5% zakat for wealth above nisab" do
  wealth = Money.new(10000, :USD)
  nisab = Money.new(5000, :USD)

  assert {:ok, zakat} = Calculator.calculate(wealth, nisab)
  assert Money.equal?(zakat, Money.new(250, :USD))
end
```

#### Shared State Between Tests

**PROHIBITED**: Tests that depend on shared mutable state.

```elixir
# FAIL: Shared module attribute
defmodule FinancialDomain.Donations.BadServiceTest do
  use ExUnit.Case

  @shared_campaign %{id: 1, name: "Test Campaign"}

  test "creates donation" do
    donation = Service.create_donation(%{campaign_id: @shared_campaign.id})
    assert donation.campaign_id == 1
  end

  test "updates campaign stats" do
    Service.update_campaign_stats(@shared_campaign)
    # Modifies shared state - affects other tests!
  end
end

# PASS: Setup with isolated state
defmodule FinancialDomain.Donations.ServiceTest do
  use ExUnit.Case, async: true

  setup do
    campaign = %{id: Enum.random(1..10000), name: "Test Campaign"}
    {:ok, campaign: campaign}
  end

  test "creates donation", %{campaign: campaign} do
    donation = Service.create_donation(%{campaign_id: campaign.id})
    assert donation.campaign_id == campaign.id
  end

  test "updates campaign stats", %{campaign: campaign} do
    Service.update_campaign_stats(campaign)
    # Isolated - doesn't affect other tests
  end
end
```

## Enforcement

These standards are enforced through:

- **mix format** - Auto-formats code on compilation
- **Credo** - Code quality analysis
- **Dialyzer** - Static type checking
- **ExUnit** - Automated testing
- **ExCoveralls** - Test coverage enforcement (85% minimum)
- **Code reviews** - Human verification

**Pre-commit checklist**:

- [ ] Code formatted with `mix format`
- [ ] Passes `mix credo --strict`
- [ ] All tests pass (`mix test`)
- [ ] Test coverage ≥85%
- [ ] Pattern matching used over conditionals
- [ ] GenServer only for stateful processes
- [ ] All errors handled explicitly
- [ ] Proper supervision strategy chosen
- [ ] Context boundaries respected
- [ ] Changesets used for all validation

## Related Documentation

**Core Elixir Concepts**:

- [Idioms](./coding-standards.md) - Comprehensive idiom reference
- [Best Practices](./coding-standards.md) - Complete best practices guide
- [Anti-Patterns](./coding-standards.md) - Detailed anti-patterns to avoid

**Specialized Topics**:

- [OTP GenServer](./otp-genserver.md) - Deep dive into GenServer
- [OTP Supervisor](./otp-supervisor.md) - Supervision tree patterns
- [Functional Programming](./functional-programming-standards.md) - Pure functions and immutability
- [Testing Standards](./testing-standards.md) - Comprehensive testing guide

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Elixir Version**: 1.19+ (supports 1.12-1.19)
