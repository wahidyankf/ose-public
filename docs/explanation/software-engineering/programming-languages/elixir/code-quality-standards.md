---
title: Elixir Code Quality Standards
description: Authoritative OSE Platform code quality standards (mix format, Credo, Dialyzer, module organization, code metrics)
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - code-quality
  - mix-format
  - credo
  - dialyzer
  - static-analysis
  - module-organization
  - code-metrics
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-05
---

# Elixir Code Quality Standards

## Purpose

This document defines **authoritative code quality standards** for Elixir development in the OSE Platform. These prescriptive rules govern automated code formatting, static analysis, type checking, module organization, and code metrics enforcement.

**Target Audience**: OSE Platform Elixir developers, build engineers, technical reviewers

**Scope**: mix format auto-formatting, Credo linting, Dialyzer type checking, module organization quality, code metrics

## Code Formatting

### mix format - MUST Use for All Elixir Code

**MUST** use `mix format` for all Elixir code. No manual formatting.

**Configuration** (.formatter.exs):

```elixir
# .formatter.exs
[
  inputs: [
    "{mix,.formatter}.exs",
    "{config,lib,test}/**/*.{ex,exs}"
  ],
  # Line length
  line_length: 120,
  # Import order
  import_deps: [:ecto, :phoenix, :ecto_sql],
  # Subdirectory configuration
  subdirectories: ["priv/*/migrations"]
]
```

### Line Length Limits - MUST NOT Exceed 120 Characters

**MUST** configure maximum line length of 120 characters:

```elixir
# .formatter.exs
[
  line_length: 120
]
```

**Why 120**: Balance between readability and modern wide screens.

### Pre-commit Hooks - MUST Enforce Formatting

**MUST** run `mix format` in pre-commit hooks for automatic enforcement.

**Setup** (.husky/pre-commit):

```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Running pre-commit checks..."

# 1. Format check
echo "📝 Checking code formatting..."
mix format --check-formatted || {
  echo "❌ Code is not formatted. Run 'mix format' to fix."
  exit 1
}

# 2. Credo checks (fast tests only)
echo "🔎 Running Credo..."
mix credo --strict || {
  echo "❌ Credo found issues. Fix them before committing."
  exit 1
}

echo "✅ All pre-commit checks passed!"
```

## Static Analysis

### Credo - MUST Achieve Minimum Score 90%

**MUST** enable Credo for linting and achieve minimum score of 90%.

**Installation**:

```elixir
# mix.exs
defp deps do
  [
    {:credo, "~> 1.7", only: [:dev, :test], runtime: false}
  ]
end
```

### Credo Configuration - Required Checks

**MUST** configure Credo with OSE Platform standards (.credo.exs):

```elixir
# .credo.exs
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: [
          "lib/",
          "src/",
          "test/",
          "web/",
          "apps/*/lib/",
          "apps/*/test/"
        ],
        excluded: [~r"/_build/", ~r"/deps/", ~r"/node_modules/"]
      },
      strict: true,
      parse_timeout: 10000,
      color: true,
      checks: %{
        enabled: [
          # Consistency checks (MUST pass all)
          {Credo.Check.Consistency.ExceptionNames, []},
          {Credo.Check.Consistency.LineEndings, []},
          {Credo.Check.Consistency.ParameterPatternMatching, []},
          {Credo.Check.Consistency.SpaceAroundOperators, []},
          {Credo.Check.Consistency.SpaceInParentheses, []},
          {Credo.Check.Consistency.TabsOrSpaces, []},

          # Design checks
          {Credo.Check.Design.AliasUsage, [priority: :low, if_nested_deeper_than: 2]},
          {Credo.Check.Design.TagTODO, [exit_status: 0]},
          {Credo.Check.Design.TagFIXME, []},

          # Readability checks (MUST pass all)
          {Credo.Check.Readability.AliasOrder, []},
          {Credo.Check.Readability.FunctionNames, []},
          {Credo.Check.Readability.LargeNumbers, []},
          {Credo.Check.Readability.MaxLineLength, [priority: :low, max_length: 120]},
          {Credo.Check.Readability.ModuleAttributeNames, []},
          {Credo.Check.Readability.ModuleDoc, []},
          {Credo.Check.Readability.ModuleNames, []},
          {Credo.Check.Readability.ParenthesesInCondition, []},
          {Credo.Check.Readability.ParenthesesOnZeroArityDefs, []},
          {Credo.Check.Readability.PipeIntoAnonymousFunctions, []},
          {Credo.Check.Readability.PredicateFunctionNames, []},
          {Credo.Check.Readability.PreferImplicitTry, []},
          {Credo.Check.Readability.RedundantBlankLines, []},
          {Credo.Check.Readability.Semicolons, []},
          {Credo.Check.Readability.SpaceAfterCommas, []},
          {Credo.Check.Readability.StringSigils, []},
          {Credo.Check.Readability.TrailingBlankLine, []},
          {Credo.Check.Readability.TrailingWhiteSpace, []},
          {Credo.Check.Readability.UnnecessaryAliasExpansion, []},
          {Credo.Check.Readability.VariableNames, []},
          {Credo.Check.Readability.WithSingleClause, []},

          # Refactor checks (with OSE thresholds)
          {Credo.Check.Refactor.ABCSize, [max_size: 100]},
          {Credo.Check.Refactor.AppendSingleItem, []},
          {Credo.Check.Refactor.CondStatements, []},
          {Credo.Check.Refactor.CyclomaticComplexity, [max_complexity: 15]},
          {Credo.Check.Refactor.FunctionArity, [max_arity: 8]},
          {Credo.Check.Refactor.LongQuoteBlocks, []},
          {Credo.Check.Refactor.MatchInCondition, []},
          {Credo.Check.Refactor.MapInto, []},
          {Credo.Check.Refactor.NegatedConditionsInUnless, []},
          {Credo.Check.Refactor.NegatedConditionsWithElse, []},
          {Credo.Check.Refactor.Nesting, [max_nesting: 3]},
          {Credo.Check.Refactor.UnlessWithElse, []},
          {Credo.Check.Refactor.WithClauses, []},

          # Warning checks (MUST fix all)
          {Credo.Check.Warning.ApplicationConfigInModuleAttribute, []},
          {Credo.Check.Warning.BoolOperationOnSameValues, []},
          {Credo.Check.Warning.Dbg, []},
          {Credo.Check.Warning.ExpensiveEmptyEnumCheck, []},
          {Credo.Check.Warning.IExPry, []},
          {Credo.Check.Warning.IoInspect, []},
          {Credo.Check.Warning.OperationOnSameValues, []},
          {Credo.Check.Warning.OperationWithConstantResult, []},
          {Credo.Check.Warning.RaiseInsideRescue, []},
          {Credo.Check.Warning.SpecWithStruct, []},
          {Credo.Check.Warning.UnsafeExec, []},
          {Credo.Check.Warning.UnusedEnumOperation, []},
          {Credo.Check.Warning.UnusedFileOperation, []},
          {Credo.Check.Warning.UnusedKeywordOperation, []},
          {Credo.Check.Warning.UnusedListOperation, []},
          {Credo.Check.Warning.UnusedPathOperation, []},
          {Credo.Check.Warning.UnusedRegexOperation, []},
          {Credo.Check.Warning.UnusedStringOperation, []}
        ]
      }
    }
  ]
}
```

### Custom Credo Checks - When to Add Project-Specific Rules

**SHOULD** add custom Credo checks for domain-specific validation.

**Example: Unsafe Money Operations** (financial platform):

```elixir
# lib/credo/check/warning/unsafe_money_operation.ex
defmodule FinancialPlatform.Credo.Check.Warning.UnsafeMoneyOperation do
  @moduledoc """
  Warns when using float operations on money amounts.

  ## Example

      # Bad - float arithmetic loses precision
      amount = 100.50 * 0.025

      # Good - use Decimal or Money library
      amount = Decimal.mult(Decimal.new("100.50"), Decimal.new("0.025"))
  """

  @explanation [check: @moduledoc]

  use Credo.Check,
    base_priority: :high,
    category: :warning,
    exit_status: 2

  def run(source_file, params) do
    issue_meta = IssueMeta.for(source_file, params)
    Credo.Code.prewalk(source_file, &traverse(&1, &2, issue_meta))
  end

  defp traverse({:*, meta, [left, right]} = ast, issues, issue_meta) do
    if float_operation?(left, right) do
      {ast, [issue_for(issue_meta, meta[:line], "*") | issues]}
    else
      {ast, issues}
    end
  end

  defp traverse(ast, issues, _issue_meta) do
    {ast, issues}
  end

  defp float_operation?({:., _, _}, _), do: false
  defp float_operation?(_, {:., _, _}), do: false

  defp float_operation?(left, right) do
    is_float_literal?(left) or is_float_literal?(right)
  end

  defp is_float_literal?({value, _, _}) when is_float(value), do: true
  defp is_float_literal?(_), do: false

  defp issue_for(issue_meta, line_no, trigger) do
    format_issue(
      issue_meta,
      message: "Avoid float operations on money amounts. Use Decimal or Money library.",
      trigger: trigger,
      line_no: line_no
    )
  end
end
```

**Register in .credo.exs**:

```elixir
%{
  configs: [
    %{
      name: "default",
      checks: %{
        extra: [
          {FinancialPlatform.Credo.Check.Warning.UnsafeMoneyOperation, []}
        ]
      }
    }
  ]
}
```

## Type Analysis

### Dialyzer - MUST Use for Type Checking

**MUST** enable Dialyzer for compile-time type checking.

**Installation**:

```elixir
# mix.exs
defp deps do
  [
    {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false}
  ]
end
```

### Typespecs - MUST Add to Public Functions

**MUST** add `@spec` annotations to all public functions.

**Configuration** (mix.exs):

```elixir
def project do
  [
    dialyzer: [
      plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
      plt_add_apps: [:ex_unit, :mix],
      flags: [
        :error_handling,
        :underspecs,
        :unknown,
        :unmatched_returns
      ],
      ignore_warnings: ".dialyzer_ignore.exs",
      plt_core_path: "priv/plts",
      plt_local_path: "priv/plts"
    ]
  ]
end
```

### dialyxir Configuration - Recommended Settings

**Example: Complete Typespec Coverage**:

```elixir
defmodule FinancialPlatform.Donations do
  @moduledoc """
  Context for managing donations.
  """

  alias FinancialPlatform.Donations.Donation

  @type donation_attrs :: %{
          optional(:campaign_id) => String.t(),
          optional(:amount) => Decimal.t(),
          optional(:currency) => String.t(),
          optional(:donor_name) => String.t(),
          optional(:donor_email) => String.t()
        }

  @type donation_result :: {:ok, Donation.t()} | {:error, Ecto.Changeset.t()}

  @doc """
  Creates a new donation.
  """
  @spec create_donation(donation_attrs()) :: donation_result()
  def create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Gets a single donation by ID.
  """
  @spec get_donation(String.t()) :: {:ok, Donation.t()} | {:error, :not_found}
  def get_donation(id) do
    case Repo.get(Donation, id) do
      nil -> {:error, :not_found}
      donation -> {:ok, donation}
    end
  end

  @doc """
  Lists all donations with optional filters.
  """
  @spec list_donations(keyword()) :: [Donation.t()]
  def list_donations(opts \\ []) do
    Donation
    |> apply_filters(opts)
    |> Repo.all()
  end

  @spec apply_filters(Ecto.Queryable.t(), keyword()) :: Ecto.Query.t()
  defp apply_filters(query, []), do: query

  defp apply_filters(query, [{:campaign_id, campaign_id} | rest]) do
    query
    |> where([d], d.campaign_id == ^campaign_id)
    |> apply_filters(rest)
  end

  defp apply_filters(query, [{:status, status} | rest]) do
    query
    |> where([d], d.status == ^status)
    |> apply_filters(rest)
  end

  defp apply_filters(query, [_ | rest]), do: apply_filters(query, rest)
end
```

### Gradual Typing Approach - How to Adopt Incrementally

**SHOULD** adopt typespecs incrementally:

**Phase 1**: Add typespecs to public API functions
**Phase 2**: Add typespecs to internal helper functions
**Phase 3**: Run Dialyzer in CI/CD with warnings
**Phase 4**: Enable `:unmatched_returns` flag
**Phase 5**: Fail build on Dialyzer errors

**Running Dialyzer**:

```bash
# First time: build PLT
mix dialyzer --plt

# Run analysis
mix dialyzer

# Explain warnings
mix dialyzer --explain

# Format output
mix dialyzer --format short
mix dialyzer --format dialyzer
mix dialyzer --format github
```

## Module Organization Quality

### Module Naming Conventions - Prescriptive Rules

**MUST** follow these module naming conventions:

**Pattern**: `ProjectName.Domain.SubDomain.ModuleName`

**Rules**:

1. **Root namespace**: Match project name (`FinancialPlatform`)
2. **Domain grouping**: Group by business domain (`Donations`, `Campaigns`)
3. **PascalCase**: All module names use PascalCase
4. **Avoid abbreviations**: Use full words (`Donation`, not `Don`)
5. **Singular nouns**: Use singular for entities (`Donation`, not `Donations` for struct)

**Examples**:

```elixir
# ✅ Good module naming
FinancialPlatform.Donations.Donation
FinancialPlatform.Donations.Campaign
FinancialPlatform.Accounts.User
FinancialPlatform.Billing.Invoice

# ❌ Bad module naming
financial_platform.donations.donation  # snake_case
FinPlatform.Donations.Don             # abbreviations
FinancialPlatform.Donations.Donations # plural for struct
Donations.Donation                     # missing root namespace
```

### Module Size Limits - Maximum Lines Per Module

**SHOULD** limit module size to maximum 500 lines.

**Rationale**: Large modules indicate poor separation of concerns.

**When module exceeds 500 lines**:

1. Extract submodules
2. Create separate concerns
3. Move helpers to utilities

**Example: Refactoring Large Module**:

```elixir
# ❌ Bad - 800 lines in single module
defmodule FinancialPlatform.Donations do
  # 800 lines of mixed concerns
end

# ✅ Good - split into focused modules
defmodule FinancialPlatform.Donations do
  # 200 lines - main context
  alias FinancialPlatform.Donations.{
    Validation,
    Calculator,
    Notifier
  }
end

defmodule FinancialPlatform.Donations.Validation do
  # 150 lines - validation logic
end

defmodule FinancialPlatform.Donations.Calculator do
  # 200 lines - calculation logic
end

defmodule FinancialPlatform.Donations.Notifier do
  # 150 lines - notification logic
end
```

### Function Organization - Public/Private Separation

**MUST** organize functions with clear public/private separation:

**Pattern**:

1. Module documentation (`@moduledoc`)
2. Type definitions (`@type`)
3. Public functions (documented with `@doc`)
4. Private functions (`defp`)

**Example**:

```elixir
defmodule FinancialPlatform.Donations do
  @moduledoc """
  Context for managing donations.
  """

  # Type definitions
  @type donation_attrs :: %{
    optional(:campaign_id) => String.t(),
    optional(:amount) => Decimal.t()
  }

  # ---- Public API ----

  @doc """
  Creates a new donation.
  """
  @spec create_donation(donation_attrs()) :: {:ok, Donation.t()} | {:error, term()}
  def create_donation(attrs) do
    # Implementation
  end

  @doc """
  Lists all donations.
  """
  @spec list_donations(keyword()) :: [Donation.t()]
  def list_donations(opts \\ []) do
    # Implementation
  end

  # ---- Private Functions ----

  @spec apply_filters(Ecto.Query.t(), keyword()) :: Ecto.Query.t()
  defp apply_filters(query, []), do: query

  defp apply_filters(query, [{:status, status} | rest]) do
    # Implementation
  end
end
```

### Module Documentation - @moduledoc Requirements

**MUST** add `@moduledoc` to all public modules.

**Format**:

```elixir
defmodule FinancialPlatform.Donations do
  @moduledoc """
  Context for managing donations and campaigns.

  Provides functions for:
  - Creating and managing donations
  - Processing donation payments
  - Generating donation reports
  - Notifying donors

  ## Examples

      iex> FinancialPlatform.Donations.create_donation(%{amount: Decimal.new("100.00")})
      {:ok, %Donation{}}
  """

  # Module implementation
end
```

**Prohibited**:

```elixir
# ❌ Bad - missing @moduledoc
defmodule FinancialPlatform.Donations do
  def create_donation(attrs), do: # ...
end

# ❌ Bad - @moduledoc false without justification
defmodule FinancialPlatform.Donations do
  @moduledoc false
  # ...
end
```

## Code Metrics

### Cyclomatic Complexity - Target Thresholds

**SHOULD** maintain cyclomatic complexity below these thresholds:

| Metric                | Threshold | Action          |
| --------------------- | --------- | --------------- |
| Cyclomatic Complexity | ≤15       | Warning at 16+  |
| ABC Size              | ≤100      | Warning at 101+ |
| Cognitive Complexity  | ≤20       | Warning at 21+  |

**Credo Configuration**:

```elixir
# .credo.exs
checks: %{
  enabled: [
    {Credo.Check.Refactor.CyclomaticComplexity, [max_complexity: 15]},
    {Credo.Check.Refactor.ABCSize, [max_size: 100]},
    {Credo.Check.Refactor.Nesting, [max_nesting: 3]}
  ]
}
```

### Function Length - Maximum Lines Per Function

**SHOULD** limit function length to maximum 50 lines.

**Rationale**: Long functions indicate poor decomposition.

**When function exceeds 50 lines**:

1. Extract helper functions
2. Use `with` for chained operations
3. Move validation to separate function

**Example**:

```elixir
# ❌ Bad - 80 lines in single function
def process_donation(attrs) do
  # 80 lines of validation, processing, notification
end

# ✅ Good - decomposed into focused functions
def process_donation(attrs) do
  with {:ok, validated} <- validate_donation(attrs),
       {:ok, processed} <- process_payment(validated),
       {:ok, notified} <- send_notifications(processed) do
    {:ok, notified}
  end
end

defp validate_donation(attrs) do
  # 20 lines
end

defp process_payment(donation) do
  # 20 lines
end

defp send_notifications(donation) do
  # 20 lines
end
```

### Module Coupling - Dependency Limits

**SHOULD** limit module dependencies:

| Metric                  | Threshold | Action              |
| ----------------------- | --------- | ------------------- |
| Direct dependencies     | ≤10       | Refactor at 11+     |
| Transitive dependencies | ≤30       | Review architecture |

**Check dependencies**:

```bash
# Show dependency tree
mix deps.tree

# Analyze module coupling (custom task)
mix xref graph --format stats
```

## Quality Tool Summary

| Tool           | When        | Enforcement | Purpose              |
| -------------- | ----------- | ----------- | -------------------- |
| mix format     | Compile     | Auto-fix    | Code formatting      |
| Credo          | Pre-commit  | Build fails | Static analysis      |
| Dialyzer       | CI/CD       | Warnings    | Type checking        |
| Module metrics | Code review | Guidelines  | Architecture quality |

## CI/CD Integration

**GitHub Actions** (.github/workflows/ci.yml):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  MIX_ENV: test

jobs:
  test:
    name: Test (Elixir ${{matrix.elixir}} / OTP ${{matrix.otp}})
    runs-on: ubuntu-latest

    strategy:
      matrix:
        elixir: ["1.17.3", "1.19.0"]
        otp: ["27.2"]

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: financial_platform_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Elixir
        uses: erlef/setup-beam@v1
        with:
          elixir-version: ${{matrix.elixir}}
          otp-version: ${{matrix.otp}}

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            deps
            _build
          key: ${{ runner.os }}-mix-${{ hashFiles('**/mix.lock') }}
          restore-keys: ${{ runner.os }}-mix-

      - name: Cache Dialyzer PLT
        uses: actions/cache@v3
        with:
          path: priv/plts
          key: ${{ runner.os }}-plt-${{ hashFiles('**/mix.lock') }}
          restore-keys: ${{ runner.os }}-plt-

      - name: Install dependencies
        run: mix deps.get

      - name: Check formatting
        run: mix format --check-formatted

      - name: Compile with warnings as errors
        run: mix compile --warnings-as-errors

      - name: Run Credo
        run: mix credo --strict --all

      - name: Run tests
        run: mix test --cover

      - name: Build Dialyzer PLT
        run: mix dialyzer --plt

      - name: Run Dialyzer
        run: mix dialyzer --halt-exit-status
```

## Related Documentation

**Enforces**:

- [Best Practices](./coding-standards.md) - Elixir best practices enforced by quality tools
- [Type Safety](./type-safety-standards.md) - Dialyzer type checking

**Build Setup**:

- [OTP Application](./otp-application.md) - Application configuration for quality tools

**Related Standards**:

- [Testing](./testing-standards.md) - Test coverage requirements
- [Dependencies](./build-configuration-standards.md) - Dependency management and coupling

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - mix format auto-formats code on every compilation (no manual formatting)
   - Credo catches quality issues at commit time (before code review)
   - Dialyzer prevents type errors at compile time (not runtime)
   - Pre-commit hooks enforce quality automatically (zero-friction quality)

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Explicit `@spec` annotations make type contracts clear
   - Explicit Credo severity thresholds (cyclomatic complexity ≤15)
   - Explicit quality rules in `.credo.exs` (no hidden style expectations)

3. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Same mix format version across all developer machines (enforced in mix.exs)
   - Credo runs identically in CI/CD and local builds
   - Quality tool versions pinned in mix.exs configuration

---

**Maintainers**: Platform Documentation Team

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19.0 (latest)
