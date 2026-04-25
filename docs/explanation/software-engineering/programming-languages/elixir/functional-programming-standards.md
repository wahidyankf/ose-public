---
title: "Elixir Functional Programming Standards"
description: Mandatory functional programming patterns for Elixir domain logic - pure functions, immutability, recursion, and Enum/Stream
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - functional-programming
  - immutability
  - pure-functions
  - recursion
  - higher-order-functions
  - enum
  - stream
  - pipe-operator
  - standards
related:
  - ./coding-standards.md
  - ./coding-standards.md
  - ./performance-standards.md
principles:
  - immutability
  - pure-functions
---

# Elixir Functional Programming Standards

**Quick Reference**: [Overview](#overview) | [Immutability](#immutability-standards) | [Pure Functions](#pure-function-standards) | [Recursion](#recursion-standards) | [Higher-Order Functions](#higher-order-function-standards) | [Enum & Stream](#enum-and-stream-standards) | [Pipe Operator](#pipe-operator-standards)

## Overview

This document defines **mandatory functional programming standards** for Elixir domain logic in the Open Sharia Enterprise platform. These standards enforce immutability, pure functions, and functional composition patterns.

**Compliance Status**: All Elixir domain logic MUST comply with these standards.

**Verification**: Use automated linting (Credo functional purity rules) and code review.

**Scope**:

- **Applies to**: Domain logic, business rules, calculations, data transformations
- **Does NOT apply to**: Phoenix controllers/views, GenServer implementations, database interactions, external API calls (impure by nature)

## Immutability Standards

### IM-01: All Data Structures MUST Be Treated as Immutable

**REQUIRED**: Never mutate existing data structures. All transformations MUST create new values.

**Rationale**: Immutability enables safe concurrent access, simplifies reasoning, and prevents bugs from shared mutable state.

#### ✅ PASS Examples

```elixir
# PASS - Creates new list
donations = [100, 200, 300]
updated_donations = [50 | donations]  # New list: [50, 100, 200, 300]

# PASS - Creates new map
account = %{balance: 1000, currency: :USD}
updated_account = Map.put(account, :balance, 1500)

# PASS - Creates new struct
money = %Money{amount: Decimal.new(100), currency: :USD}
updated_money = %{money | amount: Decimal.new(150)}

# PASS - Structural sharing (memory efficient)
large_list = Enum.to_list(1..1_000_000)
modified_list = [0 | large_list]  # Only allocates one new node
```

#### ❌ FAIL Examples

```elixir
# FAIL - Attempting in-place mutation (not possible in Elixir, but shows intent)
# Elixir doesn't have mutable collections, but avoid patterns that suggest mutation

# FAIL - Reassigning variable suggests mutation intent
balance = 1000
balance = balance + 500  # Rebinding, not mutation, but avoid in loops

# BETTER - Use accumulator pattern
balance = transactions
  |> Enum.reduce(1000, fn txn, acc -> acc + txn.amount end)
```

### IM-02: Recursive Functions MUST Use Accumulators for State

**REQUIRED**: When building results recursively, MUST use accumulator parameters.

**Rationale**: Enables tail call optimization and makes state flow explicit.

#### ✅ PASS Examples

```elixir
# PASS - Accumulator-based recursion
def sum_donations(donations), do: sum_donations(donations, 0)

defp sum_donations([], acc), do: acc
defp sum_donations([head | tail], acc) do
 sum_donations(tail, acc + head)  # Tail call with accumulator
end

# PASS - Building list with accumulator
def process_all(items), do: process_all(items, [])

defp process_all([], acc), do: Enum.reverse(acc)
defp process_all([item | rest], acc) do
 processed = process_item(item)
 process_all(rest, [processed | acc])
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - No accumulator, builds result after recursion
def sum_donations([]), do: 0
def sum_donations([head | tail]) do
 head + sum_donations(tail)  # Not tail-recursive, builds stack
end

# FAIL - Reassigning variable in loop-like pattern
def sum_list(list) do
 total = 0  # Attempting to track state
 for item <- list do
  total = total + item  # This doesn't work as expected
 end
 total
end
```

### IM-03: Concurrent Access MUST NOT Use Locks

**REQUIRED**: When sharing data across processes, MUST rely on immutability instead of locks.

**Rationale**: Immutability eliminates need for locks, preventing deadlocks and race conditions.

#### ✅ PASS Examples

```elixir
# PASS - Multiple processes read immutably
history = fetch_transaction_history()

tasks = for i <- 1..5 do
 Task.async(fn -> analyze_history(history) end)  # Safe to share
end

Task.await_many(tasks)

# PASS - Each process creates its own version
def record_transaction(history, transaction) do
 [transaction | history]  # New version, original unchanged
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Using Agent for mutable state in domain logic
defmodule TransactionHistory do
 use Agent

 def start_link(_) do
  Agent.start_link(fn -> [] end, name: __MODULE__)
 end

 def add_transaction(txn) do
  Agent.update(__MODULE__, fn history -> [txn | history] end)
 end
end

# NOTE: Agent is acceptable for infrastructure, NOT domain logic
```

## Pure Function Standards

### PF-01: Domain Logic MUST Use Pure Functions

**REQUIRED**: All domain calculations, validations, and transformations MUST be pure functions.

**Definition**: Pure function characteristics:

- Same input always produces same output (deterministic)
- No side effects (no I/O, no state mutation, no current time)
- No dependence on external state

**Rationale**: Pure functions are testable, composable, and enable parallel testing.

#### ✅ PASS Examples

```elixir
# PASS - Pure calculation
def calculate_zakat(wealth, nisab) when wealth > nisab do
 wealth * Decimal.new("0.025")
end

def calculate_zakat(_wealth, _nisab), do: Decimal.new(0)

# PASS - Pure validation
def valid_donation?(%{amount: amount, currency: currency}) do
 Decimal.positive?(amount) and currency in [:USD, :EUR, :SAR]
end

# PASS - Pure transformation
def apply_fee(amount, rate) do
 fee = Decimal.mult(amount, rate)
 net = Decimal.sub(amount, fee)
 %{gross: amount, fee: fee, net: net}
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Depends on current time (impure)
def calculate_zakat(wealth, nisab) do
 if DateTime.utc_now().hour >= 12 do
  wealth * 0.025
 else
  0
 end
end

# FAIL - Has side effect (I/O)
def validate_donation(donation) do
 if donation.amount > 0 do
  Logger.info("Valid donation: #{donation.amount}")  # Side effect
  true
 else
  Logger.warn("Invalid donation")  # Side effect
  false
 end
end

# FAIL - Reads external state
def calculate_with_tax(amount) do
 tax_rate = System.get_env("TAX_RATE")  # External dependency
 amount * (1 + tax_rate)
end
```

### PF-02: Side Effects MUST Be Isolated at Boundaries

**REQUIRED**: Side effects (I/O, state mutation, external calls) MUST be isolated to application boundaries (controllers, GenServers, external service modules).

**Rationale**: Separates pure domain logic from impure infrastructure, improving testability.

#### ✅ PASS Examples

```elixir
# PASS - Pure domain function
defmodule Zakat.Calculator do
 def calculate(wealth, nisab) do
  if Decimal.gt?(wealth, nisab) do
   {:ok, Decimal.mult(wealth, Decimal.new("0.025"))}
  else
   {:ok, Decimal.new(0)}
  end
 end
end

# PASS - Side effects at boundary
defmodule Zakat.Service do
 alias Zakat.Calculator

 def calculate_and_log(wealth, nisab) do
  case Calculator.calculate(wealth, nisab) do
   {:ok, zakat} ->
    Logger.info("Calculated zakat: #{zakat}")  # Side effect isolated
    {:ok, zakat}

   error ->
    Logger.error("Zakat calculation failed: #{inspect(error)}")
    error
  end
 end
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Side effect mixed with domain logic
defmodule Zakat.Calculator do
 def calculate(wealth, nisab) do
  Logger.info("Calculating zakat for wealth: #{wealth}")  # WRONG

  if Decimal.gt?(wealth, nisab) do
   zakat = Decimal.mult(wealth, Decimal.new("0.025"))
   Logger.info("Zakat calculated: #{zakat}")  # WRONG
   {:ok, zakat}
  else
   {:ok, Decimal.new(0)}
  end
 end
end
```

### PF-03: Pure Functions MUST Be Testable Without Mocks

**REQUIRED**: Pure functions MUST be testable using direct input/output verification, without mocks or stubs.

**Rationale**: If a function requires mocks, it's not pure.

#### ✅ PASS Examples

```elixir
defmodule Zakat.CalculatorTest do
 use ExUnit.Case, async: true  # Can run in parallel

 alias Zakat.Calculator

 test "calculates 2.5% for wealth above nisab" do
  wealth = Decimal.new(10000)
  nisab = Decimal.new(5000)

  assert {:ok, result} = Calculator.calculate(wealth, nisab)
  assert Decimal.equal?(result, Decimal.new(250))
 end

 test "returns 0 for wealth below nisab" do
  wealth = Decimal.new(3000)
  nisab = Decimal.new(5000)

  assert {:ok, result} = Calculator.calculate(wealth, nisab)
  assert Decimal.equal?(result, Decimal.new(0))
 end
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Requires mocking (indicates impurity)
test "calculates zakat with current time" do
 DateTime.Mock.set_time(~U[2026-06-15 12:00:00Z])  # RED FLAG

 assert Calculator.calculate_time_based(1000, 500) == 25
end
```

## Recursion Standards

### RC-01: Iterative Operations MUST Use Tail Recursion

**REQUIRED**: All recursive functions MUST use tail call optimization (last operation is recursive call).

**Rationale**: Prevents stack overflow for large datasets, enables constant stack space.

#### ✅ PASS Examples

```elixir
# PASS - Tail recursive
def sum_list(list), do: sum_list(list, 0)

defp sum_list([], acc), do: acc
defp sum_list([head | tail], acc) do
 sum_list(tail, acc + head)  # Tail call - last operation
end

# PASS - Tail recursive with multiple clauses
def factorial(n), do: factorial(n, 1)

defp factorial(0, acc), do: acc
defp factorial(n, acc) when n > 0 do
 factorial(n - 1, n * acc)  # Tail call
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Not tail recursive (operation after recursion)
def sum_list([]), do: 0
def sum_list([head | tail]) do
 head + sum_list(tail)  # Addition happens AFTER recursive call
end

# FAIL - Not tail recursive (list construction after recursion)
def process_all([]), do: []
def process_all([item | rest]) do
 processed = process_item(item)
 [processed | process_all(rest)]  # List cons happens AFTER call
end
```

### RC-02: Prefer Enum/Stream Over Explicit Recursion

**REQUIRED**: MUST use `Enum` or `Stream` modules for standard operations instead of manual recursion.

**Rationale**: Higher-level abstractions are more readable, tested, and optimized.

#### ✅ PASS Examples

```elixir
# PASS - Use Enum for standard operations
def sum_donations(donations), do: Enum.sum(donations)

def filter_large(donations), do: Enum.filter(donations, &(&1 > 1000))

def process_all(items), do: Enum.map(items, &process_item/1)

# PASS - Use Stream for lazy evaluation
def process_large_file(path) do
 path
 |> File.stream!()
 |> Stream.map(&parse_line/1)
 |> Stream.filter(&valid?/1)
 |> Enum.to_list()
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Manual recursion for standard sum
def sum_donations(donations), do: sum_donations(donations, 0)

defp sum_donations([], acc), do: acc
defp sum_donations([h | t], acc), do: sum_donations(t, acc + h)

# BETTER: Enum.sum(donations)

# FAIL - Manual recursion for filter
def filter_large(donations), do: filter_large(donations, [])

defp filter_large([], acc), do: Enum.reverse(acc)
defp filter_large([h | t], acc) do
 if h > 1000 do
  filter_large(t, [h | acc])
 else
  filter_large(t, acc)
 end
end

# BETTER: Enum.filter(donations, &(&1 > 1000))
```

### RC-03: Custom Recursion MUST Document Termination Condition

**REQUIRED**: When explicit recursion is necessary, MUST document base case and termination guarantee.

#### ✅ PASS Examples

```elixir
@doc """
Calculates compound return over periods recursively.

## Termination
Base case: periods = 0 (guaranteed to terminate for non-negative periods)
"""
def compound_return(principal, _rate, 0), do: principal
def compound_return(principal, rate, periods) when periods > 0 do
 compound_return(principal * (1 + rate), rate, periods - 1)
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - No documentation, unclear termination
def compound_return(principal, rate, periods) do
 if periods > 0 do
  compound_return(principal * (1 + rate), rate, periods - 1)
 else
  principal
 end
end
```

## Higher-Order Function Standards

### HO-01: MUST Accept Functions as Parameters for Flexible Operations

**REQUIRED**: When operations need flexibility, MUST use function parameters instead of hardcoding logic.

**Rationale**: Enables reusability, testability, and composition.

#### ✅ PASS Examples

```elixir
# PASS - Accepts function for filtering
def filter_donations(donations, predicate_fn) do
 Enum.filter(donations, predicate_fn)
end

# Usage
large_donations = filter_donations(all, &(&1.amount > 1000))
usd_donations = filter_donations(all, &(&1.currency == :USD))

# PASS - Accepts function for transformation
def transform(data, transformer_fn) do
 Enum.map(data, transformer_fn)
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Hardcoded filtering logic
def filter_large_donations(donations) do
 Enum.filter(donations, fn d -> d.amount > 1000 end)
end

def filter_usd_donations(donations) do
 Enum.filter(donations, fn d -> d.currency == :USD end)
end

# BETTER: Single function accepting predicate
def filter_donations(donations, predicate_fn) do
 Enum.filter(donations, predicate_fn)
end
```

### HO-02: Factory Functions MUST Return Closures for Specialized Behavior

**REQUIRED**: When creating specialized functions, MUST return closures capturing configuration.

**Rationale**: Enables creating reusable, configured functions.

#### ✅ PASS Examples

```elixir
# PASS - Returns configured function
def fee_calculator(rate) do
 fn amount -> Decimal.mult(amount, rate) end
end

# Usage
small_fee = fee_calculator(Decimal.new("0.02"))  # 2% calculator
large_fee = fee_calculator(Decimal.new("0.05"))  # 5% calculator

small_amount = small_fee.(Decimal.new(100))  # 2.00
large_amount = large_fee.(Decimal.new(100))  # 5.00

# PASS - Composing calculators
def compose(f, g) do
 fn x -> f.(g.(x)) end
end

discount = discount_calculator(Decimal.new("0.10"))
fee = fee_calculator(Decimal.new("0.02"))
discount_then_fee = compose(fee, discount)
```

#### ❌ FAIL Examples

```elixir
# FAIL - Hardcoded rates
def calculate_small_fee(amount), do: Decimal.mult(amount, Decimal.new("0.02"))
def calculate_large_fee(amount), do: Decimal.mult(amount, Decimal.new("0.05"))

# BETTER: fee_calculator(rate) factory
```

### HO-03: MUST Use Higher-Order Functions for Pipeline Transformations

**REQUIRED**: Data transformation pipelines MUST use higher-order functions (`Enum.map`, `Enum.filter`, `Enum.reduce`).

#### ✅ PASS Examples

```elixir
def process_donations(donations) do
 donations
 |> Enum.filter(&valid?/1)
 |> Enum.map(&convert_currency/1)
 |> Enum.map(&calculate_fee/1)
 |> Enum.reduce(Decimal.new(0), &Decimal.add/2)
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Manual recursion for standard transformations
def process_donations(donations) do
 donations
 |> filter_valid()
 |> map_convert()
 |> map_calculate()
 |> reduce_sum()
end

defp filter_valid(list), do: filter_valid(list, [])
defp filter_valid([], acc), do: Enum.reverse(acc)
# ... manual implementation of Enum.filter
```

## Enum and Stream Standards

### ES-01: MUST Use Enum for Finite Collections

**REQUIRED**: For finite, in-memory collections, MUST use `Enum` module functions.

**Rationale**: Enum is optimized for eager evaluation of bounded datasets.

#### ✅ PASS Examples

```elixir
# PASS - Enum for in-memory collections
def analyze_donations(donations) do
 %{
  total: Enum.sum(donations),
  count: Enum.count(donations),
  max: Enum.max(donations),
  large: Enum.filter(donations, &(&1 > 1000))
 }
end

# PASS - Enum for grouping
def group_by_range(donations) do
 Enum.group_by(donations, fn amount ->
  cond do
   amount >= 10000 -> :major
   amount >= 1000 -> :significant
   amount >= 100 -> :regular
   true -> :small
  end
 end)
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Stream for small, bounded collection (unnecessary)
def analyze_donations(donations) do
 %{
  total: donations |> Stream.map(&(&1)) |> Enum.sum(),  # Wasteful
  count: Enum.count(donations)
 }
end
```

### ES-02: MUST Use Stream for Large or Infinite Collections

**REQUIRED**: For large files, infinite sequences, or potentially unbounded data, MUST use `Stream` module.

**Rationale**: Stream enables lazy evaluation, processing only what's needed without loading entire dataset into memory.

#### ✅ PASS Examples

```elixir
# PASS - Stream for large file
def process_transaction_file(path) do
 path
 |> File.stream!()                        # Lazy file reading
 |> Stream.map(&String.trim/1)            # Lazy transformation
 |> Stream.map(&parse_transaction/1)      # Lazy parsing
 |> Stream.filter(&valid_transaction?/1)  # Lazy filtering
 |> Enum.to_list()                        # Evaluate at end
end

# PASS - Infinite stream
def transaction_id_generator do
 Stream.iterate(1, &(&1 + 1))
 |> Stream.map(fn n -> "TXN-#{String.pad_leading(to_string(n), 8, "0")}" end)
end

# Usage
first_100 = transaction_id_generator() |> Enum.take(100)

# PASS - Stream for early termination
def find_first_large_donation(donations) do
 donations
 |> Stream.filter(&(&1 > 10000))
 |> Enum.take(1)  # Stops processing after first match
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Enum for large file (loads entire file into memory)
def process_transaction_file(path) do
 path
 |> File.read!()                    # Reads entire file
 |> String.split("\n")              # Splits into list
 |> Enum.map(&parse_transaction/1)  # Processes all
 |> Enum.filter(&valid_transaction?/1)
end

# FAIL - Enum for potentially infinite sequence
def generate_ids(count) do
 Enum.to_list(1..count)  # What if count is 1_000_000_000?
 |> Enum.map(fn n -> "ID-#{n}" end)
end
```

### ES-03: Stream Operations MUST Be Evaluated Explicitly

**REQUIRED**: Stream pipelines MUST be explicitly evaluated using `Enum` functions or `Stream.run/1`.

**Rationale**: Streams are lazy; evaluation must be triggered intentionally.

#### ✅ PASS Examples

```elixir
# PASS - Explicit evaluation with Enum.to_list
result = data
 |> Stream.map(&process/1)
 |> Stream.filter(&valid?/1)
 |> Enum.to_list()  # Explicitly evaluate

# PASS - Explicit evaluation with Enum.take
first_10 = data
 |> Stream.map(&process/1)
 |> Enum.take(10)  # Evaluates until 10 found

# PASS - Side effects with Stream.run
data
 |> Stream.each(&log_item/1)
 |> Stream.run()  # Explicitly evaluate for side effects
```

#### ❌ FAIL Examples

```elixir
# FAIL - Stream not evaluated (does nothing)
result = data
 |> Stream.map(&process/1)
 |> Stream.filter(&valid?/1)
# result is a Stream struct, not processed data
```

## Pipe Operator Standards

### PO-01: MUST Use Pipe Operator for Sequential Transformations

**REQUIRED**: When applying sequential transformations, MUST use pipe operator (`|>`) instead of nested function calls.

**Rationale**: Pipes improve readability by showing data flow linearly.

#### ✅ PASS Examples

```elixir
# PASS - Pipe operator for readability
def process_donation(donation) do
 donation
 |> validate()
 |> convert_currency()
 |> calculate_fee()
 |> generate_receipt()
end

# PASS - Pipeline with conditional branching
def calculate_zakat(wealth, nisab) do
 with :ok <- validate_positive(wealth),
    :ok <- validate_positive(nisab),
    {:ok, net} <- apply_debts(wealth) do
  compute_zakat(net, nisab)
 end
end
```

#### ❌ FAIL Examples

```elixir
# FAIL - Nested function calls (hard to read)
def process_donation(donation) do
 generate_receipt(
  calculate_fee(
   convert_currency(
    validate(donation)
   )
  )
 )
end

# FAIL - Intermediate variables (verbose)
def process_donation(donation) do
 validated = validate(donation)
 converted = convert_currency(validated)
 with_fee = calculate_fee(converted)
 generate_receipt(with_fee)
end
```

### PO-02: Pipe MUST Pass Result to First Parameter

**REQUIRED**: Piped value MUST be passed as first parameter to next function.

**Rationale**: Elixir pipe operator passes result as first argument by convention.

#### ✅ PASS Examples

```elixir
# PASS - Functions designed for piping
def validate(donation), do: donation
def convert_currency(donation), do: donation
def calculate_fee(donation), do: donation

donations
|> Enum.filter(&valid?/1)
|> Enum.map(&convert/1)
|> Enum.reduce(0, &sum/2)

# PASS - Anonymous function for non-first parameter
amount
|> Decimal.new()
|> Decimal.mult(Decimal.new("0.025"))  # Result goes to first param
```

#### ❌ FAIL Examples

```elixir
# FAIL - Function expects piped value as second parameter
def calculate_fee(rate, amount), do: amount * rate  # amount should be first

# Awkward usage
amount |> calculate_fee(0.02)  # Works but misleading

# BETTER
def calculate_fee(amount, rate), do: amount * rate

amount |> calculate_fee(0.02)  # Clear data flow
```

### PO-03: Each Pipeline Stage MUST Return Compatible Type

**REQUIRED**: Each function in pipeline MUST return type expected by next function.

#### ✅ PASS Examples

```elixir
# PASS - Type-compatible pipeline
donations  # List
|> Enum.filter(&valid?/1)     # Returns List
|> Enum.map(&convert/1)       # Returns List
|> Enum.sum()                 # Returns number
```

#### ❌ FAIL Examples

```elixir
# FAIL - Type mismatch in pipeline
result = donations  # List
|> Enum.filter(&valid?/1)     # Returns List
|> Enum.sum()                 # Returns number
|> Enum.map(&format/1)        # ERROR: number is not enumerable
```

## Compliance Verification

### Automated Checks

**REQUIRED**: Projects MUST use Credo with functional programming checks:

```elixir
# .credo.exs
%{
 configs: [
  %{
   name: "default",
   checks: [
    {Credo.Check.Warning.ApplicationConfigInModuleAttribute, []},
    {Credo.Check.Warning.BoolOperationOnSameValues, []},
    {Credo.Check.Warning.IExPry, []},
    {Credo.Check.Warning.IoInspect, []},
    {Credo.Check.Refactor.ABCSize, max_size: 30},
    {Credo.Check.Refactor.FunctionComplexity, max_complexity: 10},
    {Credo.Check.Refactor.Nesting, max_nesting: 3}
   ]
  }
 ]
}
```

### Manual Review Checklist

- [ ] All domain functions are pure (no side effects)
- [ ] Recursive functions use tail call optimization
- [ ] Enum/Stream used instead of manual recursion
- [ ] Higher-order functions used for flexible operations
- [ ] Pipe operator used for sequential transformations
- [ ] Tests run with `async: true` (indicates purity)
- [ ] No mocks required for domain logic tests

## Exceptions and Waivers

### Acceptable Impure Functions

**Exception**: These operations are inherently impure and do NOT require waivers:

- Phoenix controllers (HTTP I/O)
- GenServer callbacks (state management)
- Ecto queries (database I/O)
- External API calls (network I/O)
- Logging at application boundaries

**Requirement**: Impure operations MUST be isolated to infrastructure layer, separate from domain logic.

### Waiver Process

**When**: If domain logic requires impurity (rare):

1. Document rationale in module `@moduledoc`
2. Tag functions with `@doc "IMPURE: <reason>"`
3. Get approval from technical lead
4. Document in architecture decision record (ADR)

## Related Documents

- [Best Practices](./coding-standards.md) - General Elixir conventions
- [Idioms](./coding-standards.md) - Pattern matching, pipe operator usage
- [Performance](./performance-standards.md) - Optimization techniques
- [Type Safety](./type-safety-standards.md) - Dialyzer and typespecs

## References

- [Elixir Getting Started - Recursion](https://elixir-lang.org/getting-started/recursion.html)
- [Enum Module Documentation](https://hexdocs.pm/elixir/Enum.html)
- [Stream Module Documentation](https://hexdocs.pm/elixir/Stream.html)
- [Programming Elixir by Dave Thomas](https://pragprog.com/titles/elixir16/programming-elixir-1-6/)

---

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19.0 (latest)
**Compliance**: Mandatory for all domain logic
**Verification**: Credo + Code Review
