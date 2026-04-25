---
title: "Elixir Type Safety Standards"
description: Authoritative OSE Platform Elixir type safety standards (typespecs, Dialyzer, pattern matching)
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - type-safety
  - typespecs
  - dialyzer
  - pattern-matching
  - guards
  - dynamic-typing
  - static-analysis
related:
  - ./coding-standards.md
  - ./testing-standards.md
  - ./code-quality-standards.md
principles:
  - explicit-over-implicit
  - documentation-first
created: 2026-01-23
---

# Elixir Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Elixir fundamentals from [AyoKoding Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an Elixir tutorial. We define HOW to apply type safety in THIS codebase, not WHAT typespecs are.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for Elixir development in the OSE Platform. These are prescriptive rules that MUST be followed to ensure type correctness, runtime reliability, and alignment with platform type safety requirements.

**Target Audience**: OSE Platform Elixir developers, technical reviewers, automated code quality tools

**Scope**: Typespecs, Dialyzer configuration, pattern matching type guards, compile-time checks

## Quick Reference

### Type Safety Mechanisms (Part 1)

- [Public API Typespecs](#public-api-typespecs-required)
- [Custom Type Definitions](#custom-type-definitions)
- [Dialyzer Configuration](#dialyzer-configuration-required)
- [Pattern Matching Guards](#pattern-matching-as-type-guard)
- [Compile-Time Checks](#compile-time-type-checking)

### Domain Patterns (Part 2)

- [Money Type Safety](#money-type-safety-pattern)
- [Financial Domain Types](#financial-domain-types)
- [Opaque Types](#opaque-types)

### Anti-Patterns (Part 3)

- [Type Safety Violations](#type-safety-violations)
- [Common Mistakes](#common-type-safety-mistakes)

## Type Safety Philosophy

**Elixir Type Safety Approach**:

- **Dynamic Runtime**: Primary type checking via pattern matching and guards
- **Static Analysis**: Optional Dialyzer analysis for success typing
- **Documentation**: Typespecs serve as both docs and analysis hints
- **Not Compiler-Enforced**: Types are analysis tools, not runtime constraints

**REQUIRED FOR**:

- All public API functions MUST have `@spec`
- All domain types MUST have `@type` definitions
- Dialyzer MUST run in CI/CD (no warnings)
- Pattern matching MUST validate runtime types

## Public API Typespecs (REQUIRED)

### Rule: All Public Functions MUST Have @spec

**REQUIRED**: Every public function MUST include `@spec` annotation.

**PASS Example** (Public API with specs):

```elixir
defmodule FinancialDomain.Money do
 @moduledoc """
 Money type with required typespecs on all public functions.
 """

 defstruct [:amount, :currency]

 @type t :: %__MODULE__{
  amount: Decimal.t(),
  currency: currency()
 }

 @type currency :: :USD | :EUR | :GBP | :SAR | :AED | :MYR | :IDR

 # ✅ Public function with @spec
 @doc "Creates a new Money struct."
 @spec new(number() | Decimal.t(), currency()) :: t()
 def new(amount, currency) when is_number(amount) do
  %__MODULE__{
   amount: Decimal.new(amount),
   currency: currency
  }
 end

 def new(%Decimal{} = amount, currency) do
  %__MODULE__{
   amount: amount,
   currency: currency
  }
 end

 # ✅ Public function with @spec (multiple return types)
 @doc "Adds two Money values (same currency only)."
 @spec add(t(), t()) :: t() | {:error, :currency_mismatch}
 def add(%__MODULE__{currency: curr} = m1, %__MODULE__{currency: curr} = m2) do
  %__MODULE__{
   amount: Decimal.add(m1.amount, m2.amount),
   currency: curr
  }
 end

 def add(%__MODULE__{}, %__MODULE__{}) do
  {:error, :currency_mismatch}
 end

 # ✅ Private function (no @spec required, but allowed)
 defp validate_currency(currency) when is_atom(currency), do: :ok
 defp validate_currency(_), do: {:error, :invalid_currency}
end
```

**FAIL Example** (Missing @spec):

```elixir
# ❌ VIOLATION: Public function without @spec
defmodule FinancialDomain.Money do
 defstruct [:amount, :currency]

 # ❌ Missing @spec
 def new(amount, currency) do
  %__MODULE__{
   amount: Decimal.new(amount),
   currency: currency
  }
 end

 # ❌ Missing @spec
 def add(m1, m2) do
  # Implementation...
 end
end
```

**Why**: Public API specs serve as contracts for Dialyzer analysis and documentation.

## Custom Type Definitions

### Rule: Domain Concepts MUST Have @type Definitions

**REQUIRED**: Domain-specific types MUST be defined with `@type` or `@typep`.

**PASS Example** (Comprehensive financial types):

```elixir
defmodule FinancialDomain.Zakat.Types do
 @moduledoc """
 Type definitions for Zakat domain - REQUIRED for domain clarity.
 """

 # ✅ Custom types for business domain
 @type wealth :: FinancialDomain.Money.t()
 @type nisab :: FinancialDomain.Money.t()
 @type zakat_rate :: Decimal.t()

 # ✅ Union type for result
 @type calculation_result :: {:ok, FinancialDomain.Money.t()} | {:error, reason()}

 # ✅ Enum-style union for errors
 @type reason :: :negative_wealth | :currency_mismatch | :below_nisab

 # ✅ Complex record type
 @type zakat_record :: %{
  wealth: wealth(),
  nisab: nisab(),
  zakat_due: FinancialDomain.Money.t(),
  rate: zakat_rate(),
  calculated_at: DateTime.t()
 }
end
```

**FAIL Example** (Primitive types only):

```elixir
# ❌ VIOLATION: No domain type definitions
defmodule FinancialDomain.Zakat.Calculator do
 # ❌ Using primitive types instead of domain types
 @spec calculate(number(), number()) :: {:ok, number()} | {:error, atom()}
 def calculate(wealth, nisab) do
  # Which is wealth? Which is nisab?
  # What currency? What precision?
 end
end
```

**Why**: Custom types document domain concepts and enable Dialyzer to catch type mismatches.

## Dialyzer Configuration (REQUIRED)

### Rule: Dialyzer MUST Run in CI/CD with Zero Warnings

**REQUIRED**: All projects MUST have Dialyzer configured with strict flags.

**PASS Example** (Strict Dialyzer setup):

```elixir
# mix.exs
defmodule FinancialDomain.MixProject do
 use Mix.Project

 def project do
  [
   app: :financial_domain,
   version: "1.0.0",
   elixir: "~> 1.19",
   deps: deps(),
   dialyzer: dialyzer()  # ✅ Required configuration
  ]
 end

 # ✅ Strict Dialyzer configuration (REQUIRED)
 defp dialyzer do
  [
   plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
   plt_add_apps: [:ex_unit, :mix, :ecto],
   flags: [
    :error_handling,      # ✅ Catch unhandled errors
    :underspecs,          # ✅ Detect underspecified functions
    :unknown,             # ✅ Detect unknown functions
    :unmatched_returns    # ✅ Detect ignored return values
   ],
   ignore_warnings: ".dialyzer_ignore.exs"
  ]
 end

 defp deps do
  [
   {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
   {:decimal, "~> 2.1"}
  ]
 end
end
```

**CI/CD Integration** (GitHub Actions):

```yaml
# .github/workflows/elixir-ci.yml
name: Elixir CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: erlef/setup-beam@v1
        with:
          elixir-version: "1.19.0"
          otp-version: "27.2"

      - name: Cache PLT
        uses: actions/cache@v4
        with:
          path: priv/plts
          key: ${{ runner.os }}-plt-${{ hashFiles('mix.lock') }}

      - name: Install dependencies
        run: mix deps.get

      # ✅ REQUIRED: Dialyzer in CI
      - name: Run Dialyzer
        run: mix dialyzer --halt-exit-status
```

**FAIL Example** (No Dialyzer):

```elixir
# ❌ VIOLATION: No Dialyzer configuration
defmodule FinancialDomain.MixProject do
 use Mix.Project

 def project do
  [
   app: :financial_domain,
   version: "1.0.0",
   deps: deps()
   # ❌ Missing dialyzer configuration
  ]
 end

 defp deps do
  [
   # ❌ Missing dialyxir dependency
   {:decimal, "~> 2.1"}
  ]
 end
end
```

**Why**: Dialyzer catches type inconsistencies at build time, preventing runtime type errors.

## Pattern Matching as Type Guard

### Rule: Runtime Type Validation MUST Use Pattern Matching

**REQUIRED**: Use pattern matching and guards for runtime type safety.

**PASS Example** (Pattern matching validation):

```elixir
defmodule FinancialDomain.Donations.Validator do
 @moduledoc """
 Validates donations using pattern matching (REQUIRED for runtime safety).
 """

 alias FinancialDomain.Money

 # ✅ Pattern matching validates structure and types
 @spec validate_donation(map()) :: {:ok, map()} | {:error, atom()}
 def validate_donation(params) when is_map(params) do
  with {:ok, amount} <- extract_amount(params),
     {:ok, donor_id} <- extract_donor_id(params),
     {:ok, campaign_id} <- extract_campaign_id(params) do
   {:ok, %{
    amount: amount,
    donor_id: donor_id,
    campaign_id: campaign_id
   }}
  end
 end

 # ✅ Pattern match with guards validates types
 defp extract_amount(%{"amount" => amount, "currency" => currency})
   when is_number(amount) and amount > 0 and is_atom(currency) do
  {:ok, Money.new(amount, currency)}
 end

 defp extract_amount(%{amount: amount, currency: currency})
   when is_number(amount) and amount > 0 and is_atom(currency) do
  {:ok, Money.new(amount, currency)}
 end

 defp extract_amount(_), do: {:error, :invalid_amount}

 # ✅ Custom guard for business rules
 defguard is_valid_uuid(id) when is_binary(id) and byte_size(id) == 36

 defp extract_campaign_id(%{"campaign_id" => id}) when is_valid_uuid(id) do
  {:ok, id}
 end

 defp extract_campaign_id(%{campaign_id: id}) when is_valid_uuid(id) do
  {:ok, id}
 end

 defp extract_campaign_id(_), do: {:error, :invalid_campaign_id}
end
```

**FAIL Example** (Runtime type checking with conditionals):

```elixir
# ❌ VIOLATION: No pattern matching, no type safety
defmodule FinancialDomain.Donations.Validator do
 # ❌ Accepts any input, checks types inside function
 def validate_donation(params) do
  if is_map(params) do
   amount = params["amount"]
   if is_number(amount) and amount > 0 do
    # ❌ No structural validation
    # ❌ Multiple conditional branches instead of pattern matching
    currency = params["currency"]
    if is_atom(currency) do
     {:ok, Money.new(amount, currency)}
    else
     {:error, :invalid_currency}
    end
   else
    {:error, :invalid_amount}
   end
  else
   {:error, :invalid_params}
  end
 end
end
```

**Why**: Pattern matching fails fast on type mismatches and documents expected structure.

## Compile-Time Type Checking

### Rule: Use @enforce_keys for Required Struct Fields

**REQUIRED**: Structs with required fields MUST use `@enforce_keys`.

**PASS Example** (Enforced struct keys):

```elixir
defmodule FinancialDomain.Transaction do
 @moduledoc """
 Transaction with compile-time field enforcement (REQUIRED).
 """

 # ✅ Enforce required keys at compile time
 @enforce_keys [:id, :amount, :type, :timestamp]
 defstruct [:id, :amount, :type, :timestamp, :metadata]

 @type t :: %__MODULE__{
  id: String.t(),
  amount: FinancialDomain.Money.t(),
  type: :debit | :credit,
  timestamp: DateTime.t(),
  metadata: map() | nil
 }

 # ✅ Constructor ensures all required fields present
 @spec new(keyword()) :: t()
 def new(attrs) when is_list(attrs) do
  struct!(__MODULE__, attrs)  # Raises if missing required keys
 end
end

# Usage:
# Transaction.new(id: "123", amount: Money.new(100, :USD), type: :debit, timestamp: DateTime.utc_now())
# ✅ PASS

# Transaction.new(id: "123")
# ❌ FAIL: ArgumentError (missing required keys)
```

**FAIL Example** (No field enforcement):

```elixir
# ❌ VIOLATION: Missing @enforce_keys
defmodule FinancialDomain.Transaction do
 # ❌ No enforcement - can create incomplete transactions
 defstruct [:id, :amount, :type, :timestamp, :metadata]

 @type t :: %__MODULE__{
  id: String.t(),
  amount: FinancialDomain.Money.t(),
  type: :debit | :credit,
  timestamp: DateTime.t(),
  metadata: map() | nil
 }

 def new(attrs) do
  struct(__MODULE__, attrs)  # ❌ Allows missing fields!
 end
end

# Usage:
# Transaction.new(id: "123")
# ❌ Creates invalid transaction with nil fields
```

**Why**: `@enforce_keys` catches missing required fields at compile/runtime, preventing invalid state.

## Money Type Safety Pattern

### Rule: Financial Amounts MUST Use Money Type

**REQUIRED**: All financial amounts MUST use `Money` type, never raw numbers.

**PASS Example** (Type-safe Money operations):

```elixir
defmodule FinancialDomain.Money do
 @moduledoc """
 Type-safe Money implementation (REQUIRED for financial accuracy).
 """

 defstruct [:amount, :currency]

 @type t :: %__MODULE__{
  amount: Decimal.t(),
  currency: currency()
 }

 @type currency :: :USD | :EUR | :GBP | :SAR | :AED | :MYR | :IDR
 @type operation_result :: t() | {:error, error_reason()}
 @type error_reason :: :currency_mismatch | :division_by_zero | :negative_amount

 # ✅ Type-safe constructor
 @spec new(number() | Decimal.t(), currency()) :: t()
 def new(amount, currency) when is_number(amount) and amount >= 0 do
  %__MODULE__{amount: Decimal.new(amount), currency: currency}
 end

 def new(%Decimal{} = amount, currency) do
  %__MODULE__{amount: amount, currency: currency}
 end

 # ✅ Type-safe operations (currency validation)
 @spec add(t(), t()) :: operation_result()
 def add(%__MODULE__{currency: c} = m1, %__MODULE__{currency: c} = m2) do
  %__MODULE__{
   amount: Decimal.add(m1.amount, m2.amount),
   currency: c
  }
 end

 def add(%__MODULE__{}, %__MODULE__{}) do
  {:error, :currency_mismatch}
 end

 # ✅ Type-safe comparison
 @spec compare(t(), t()) :: :gt | :eq | :lt | {:error, error_reason()}
 def compare(%__MODULE__{currency: c} = m1, %__MODULE__{currency: c} = m2) do
  Decimal.compare(m1.amount, m2.amount)
 end

 def compare(%__MODULE__{}, %__MODULE__{}) do
  {:error, :currency_mismatch}
 end
end

# ✅ Usage with Zakat calculation
defmodule FinancialDomain.Zakat.Calculator do
 alias FinancialDomain.Money

 @spec calculate(Money.t(), Money.t()) :: {:ok, Money.t()} | {:error, atom()}
 def calculate(%Money{} = wealth, %Money{} = nisab) do
  case Money.compare(wealth, nisab) do
   :gt -> {:ok, Money.multiply(wealth, Decimal.new("0.025"))}
   _ -> {:ok, Money.new(0, wealth.currency)}
  end
 end
end
```

**FAIL Example** (Raw numbers):

```elixir
# ❌ VIOLATION: Using raw numbers for money
defmodule FinancialDomain.Zakat.Calculator do
 # ❌ No type safety, no currency, no precision control
 @spec calculate(number(), number()) :: number()
 def calculate(wealth, nisab) do
  if wealth > nisab do
   wealth * 0.025  # ❌ Floating point arithmetic!
  else
   0
  end
 end
end

# Usage:
# calculate(100000.50, 5000)
# ❌ What currency? What precision? What if negative?
```

**Why**: Money type prevents currency mismatch, floating-point errors, and precision loss.

## Opaque Types

### Rule: Internal Implementation SHOULD Use @opaque

**RECOMMENDED**: Use `@opaque` for types where internal structure should be hidden.

**PASS Example** (Opaque account number):

```elixir
defmodule FinancialDomain.AccountNumber do
 @moduledoc """
 Opaque account number type (internal structure hidden).
 """

 # ✅ Internal structure hidden from external modules
 @opaque t :: %__MODULE__{
  country_code: String.t(),
  bank_code: String.t(),
  account_number: String.t(),
  check_digit: String.t()
 }

 defstruct [:country_code, :bank_code, :account_number, :check_digit]

 # ✅ Only way to create account number (validated)
 @spec from_iban(String.t()) :: {:ok, t()} | {:error, :invalid_iban}
 def from_iban(iban) when is_binary(iban) do
  case parse_and_validate_iban(iban) do
   {:ok, parts} -> {:ok, struct(__MODULE__, parts)}
   :error -> {:error, :invalid_iban}
  end
 end

 # ✅ Only way to access data (controlled)
 @spec to_iban(t()) :: String.t()
 def to_iban(%__MODULE__{} = account) do
  "#{account.country_code}#{account.check_digit}#{account.bank_code}#{account.account_number}"
 end

 defp parse_and_validate_iban(_iban) do
  # Validation logic...
  {:ok, %{country_code: "US", bank_code: "123456", account_number: "789012", check_digit: "34"}}
 end
end

# Usage:
# ✅ Must use API
# {:ok, account} = AccountNumber.from_iban("US34123456789012")
# iban = AccountNumber.to_iban(account)

# ❌ Cannot access internal structure directly
# account.bank_code  # Dialyzer warning: accessing opaque type internals
```

**FAIL Example** (Exposed internal structure):

```elixir
# ❌ VIOLATION: Internal structure exposed
defmodule FinancialDomain.AccountNumber do
 # ❌ Using @type instead of @opaque (structure visible)
 @type t :: %__MODULE__{
  country_code: String.t(),
  bank_code: String.t(),
  account_number: String.t(),
  check_digit: String.t()
 }

 defstruct [:country_code, :bank_code, :account_number, :check_digit]
end

# Usage:
# ❌ External code can bypass validation
# account = %AccountNumber{
#   country_code: "XX",  # Invalid country code!
#   bank_code: "invalid",
#   account_number: "123",
#   check_digit: "00"
# }
```

**Why**: Opaque types enforce encapsulation and prevent external code from bypassing validation.

## Financial Domain Types

### Rule: Complex Domain Concepts MUST Have Type Definitions

**REQUIRED**: Financial domain concepts MUST have comprehensive type definitions.

**PASS Example** (Complete donation types):

```elixir
defmodule FinancialDomain.Donations.Types do
 @moduledoc """
 Comprehensive type definitions for donation domain (REQUIRED).
 """

 # ✅ Status enum with all possible states
 @type status :: :pending | :processing | :completed | :failed | :refunded

 # ✅ Complete donation record type
 @type donation :: %{
  id: String.t(),
  amount: FinancialDomain.Money.t(),
  donor_id: String.t(),
  campaign_id: String.t(),
  status: status(),
  created_at: DateTime.t(),
  metadata: map()
 }

 # ✅ Validation error types (explicit)
 @type validation_result :: {:ok, donation()} | {:error, validation_error()}
 @type validation_error ::
  {:invalid_amount, String.t()}
  | {:invalid_campaign, String.t()}
  | {:invalid_donor, String.t()}
  | {:campaign_closed, Date.t()}

 # ✅ Processing result types
 @type processing_result :: {:ok, receipt()} | {:error, processing_error()}
 @type processing_error ::
  :payment_failed
  | :gateway_timeout
  | {:insufficient_funds, FinancialDomain.Money.t()}

 # ✅ Receipt type
 @type receipt :: %{
  donation_id: String.t(),
  receipt_number: String.t(),
  amount: FinancialDomain.Money.t(),
  issued_at: DateTime.t()
 }
end

# ✅ Usage with full type safety
defmodule FinancialDomain.Donations.Processor do
 alias FinancialDomain.Donations.Types

 @spec process(Types.donation()) :: Types.processing_result()
 def process(%{status: :pending} = donation) do
  # Processing logic with type-safe results
  {:ok, generate_receipt(donation)}
 end

 defp generate_receipt(donation) do
  %{
   donation_id: donation.id,
   receipt_number: generate_receipt_number(),
   amount: donation.amount,
   issued_at: DateTime.utc_now()
  }
 end

 defp generate_receipt_number, do: "RCP-#{:crypto.strong_rand_bytes(8) |> Base.encode16()}"
end
```

**FAIL Example** (Generic types only):

```elixir
# ❌ VIOLATION: No domain type definitions
defmodule FinancialDomain.Donations.Processor do
 # ❌ Generic types provide no domain context
 @spec process(map()) :: {:ok, map()} | {:error, atom()}
 def process(donation) do
  # What fields does donation have?
  # What statuses are valid?
  # What errors are possible?
  {:ok, %{}}
 end
end
```

**Why**: Domain types document business concepts and enable Dialyzer to catch domain-specific type errors.

## Type Safety Violations

### Common Anti-Patterns to Avoid

**VIOLATION 1: Missing @spec on public functions**

```elixir
# ❌ FAIL
defmodule MyModule do
 def public_function(arg) do  # Missing @spec
  arg + 1
 end
end

# ✅ PASS
defmodule MyModule do
 @spec public_function(integer()) :: integer()
 def public_function(arg) do
  arg + 1
 end
end
```

**VIOLATION 2: Wrong @spec (doesn't match implementation)**

```elixir
# ❌ FAIL: Spec says String.t(), returns number
@spec calculate() :: String.t()
def calculate do
 123  # Returns number!
end

# ✅ PASS: Spec matches return
@spec calculate() :: number()
def calculate do
 123
end
```

**VIOLATION 3: Ignoring Dialyzer warnings**

```elixir
# ❌ FAIL: Dialyzer warns, developer ignores
@spec always_fails(number()) :: {:ok, number()}
def always_fails(amount) do
 {:error, :always_fails}  # Never returns {:ok, _}!
end

# ✅ PASS: Fix spec to match reality
@spec always_fails(number()) :: {:error, atom()}
def always_fails(_amount) do
 {:error, :always_fails}
end
```

**VIOLATION 4: Pattern will never match**

```elixir
# ❌ FAIL: Unreachable pattern
@spec check(number()) :: :ok
def check(n) when n > 0, do: :ok
def check(n) when n > 0, do: :also_ok  # Never reached!
def check(_), do: :ok

# ✅ PASS: Remove duplicate guard
@spec check(number()) :: :ok
def check(n) when n > 0, do: :ok
def check(_), do: :ok
```

**VIOLATION 5: Using raw numbers for money**

```elixir
# ❌ FAIL
@spec calculate_zakat(number()) :: number()
def calculate_zakat(wealth) do
 wealth * 0.025  # Floating point error!
end

# ✅ PASS
@spec calculate_zakat(Money.t()) :: Money.t()
def calculate_zakat(%Money{} = wealth) do
 Money.multiply(wealth, Decimal.new("0.025"))
end
```

## Common Type Safety Mistakes

### Mistake 1: Overly Complex Type Specs

**Problem**: Unreadable type specifications.

**Solution**: Extract complex types to `@type` definitions.

```elixir
# ❌ Complex inline spec (hard to read)
@spec process(
 %{id: String.t(), amount: Decimal.t(), status: :pending | :processing},
 %{enabled: boolean(), threshold: Decimal.t()}
) :: {:ok, %{id: String.t(), result: atom()}} | {:error, atom()}
def process(donation, config) do
 # ...
end

# ✅ Extracted types (readable)
@type donation :: %{id: String.t(), amount: Decimal.t(), status: :pending | :processing}
@type config :: %{enabled: boolean(), threshold: Decimal.t()}
@type result :: {:ok, %{id: String.t(), result: atom()}} | {:error, atom()}

@spec process(donation(), config()) :: result()
def process(donation, config) do
 # ...
end
```

### Mistake 2: Not Running Dialyzer

**Problem**: Type errors accumulate without detection.

**Solution**: Run Dialyzer in CI/CD (REQUIRED).

### Mistake 3: Mixing String/Atom Keys

**Problem**: Inconsistent map key types break pattern matching.

**Solution**: Use consistent key types (atoms for internal, strings for external).

```elixir
# ❌ Inconsistent keys
def process(%{"amount" => amount, currency: currency}) do  # Mixed!
 # ...
end

# ✅ Consistent string keys (external data)
def process(%{"amount" => amount, "currency" => currency}) do
 # ...
end

# ✅ Consistent atom keys (internal data)
def process(%{amount: amount, currency: currency}) do
 # ...
end
```

### Mistake 4: Specs as Runtime Validation

**Problem**: Typespecs are NOT runtime checks.

**Solution**: Use pattern matching and guards for runtime validation.

```elixir
# ❌ Spec alone doesn't validate
@spec calculate(pos_integer()) :: number()
def calculate(n) do
 n * 2  # No runtime check if n is positive!
end

# ✅ Guard validates at runtime
@spec calculate(pos_integer()) :: number()
def calculate(n) when is_integer(n) and n > 0 do
 n * 2
end
```

## Enforcement

### Required Tools

**CI/CD Integration** (REQUIRED):

- `mix dialyzer --halt-exit-status` in CI pipeline
- `mix format --check-formatted` for code formatting
- `mix credo --strict` for code quality
- PLT caching to speed up builds

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running Dialyzer..."
mix dialyzer --halt-exit-status || exit 1

echo "Checking typespecs..."
mix credo --strict --format flycheck | grep "@spec" && exit 1

echo "All checks passed!"
```

### Code Review Checklist

- [ ] All public functions have `@spec`
- [ ] Domain types defined with `@type`
- [ ] Dialyzer runs with zero warnings
- [ ] Pattern matching validates runtime types
- [ ] `@enforce_keys` used for required struct fields
- [ ] Money type used for financial amounts
- [ ] No raw numbers for currency values
- [ ] Specs match implementation (not aspirational)

## Related Standards

- [Elixir Coding Standards](./coding-standards.md) - General coding conventions
- [Elixir Testing Standards](./testing-standards.md) - Testing type contracts
- [Elixir Code Quality Standards](./code-quality-standards.md) - Quality enforcement

## References

- [Elixir Typespecs](https://hexdocs.pm/elixir/typespecs.html)
- [Dialyzer Documentation](https://www.erlang.org/doc/apps/dialyzer/dialyzer_chapter.html)
- [Dialyxir](https://github.com/jeremyjh/dialyxir)
- [Set-Theoretic Types (Elixir 1.17+)](https://elixir-lang.org/blog/2024/06/12/elixir-v1-17-0-released/)

---

**Version**: 1.0.0
**Elixir Version**: 1.19.0 (minimum 1.12+)

**Maintainers**: OSE Platform Engineering Team
