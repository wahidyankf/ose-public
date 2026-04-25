---
title: "Phoenix Anti-Patterns"
description: Common Phoenix mistakes and problematic patterns to avoid
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - elixir
  - anti-patterns
  - code-smells
  - mistakes
  - avoid
related:
  - idioms.md
  - best-practices.md
  - contexts.md
  - liveview.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
---

# Phoenix Anti-Patterns

## Context Anti-Patterns

- [Fat Contexts](#1-fat-contexts) - Contexts doing too much
- [Anemic Contexts](#2-anemic-contexts) - Contexts with no business logic
- [Cross-Context Database Access](#3-cross-context-database-access) - Bypassing context APIs
- [God Schemas](#4-god-schemas) - Schemas with too many responsibilities

## LiveView Anti-Patterns

- [Large LiveView Modules](#5-large-liveview-modules) - Monolithic LiveView files
- [Overusing Assigns](#6-overusing-assigns) - Too much state in assigns
- [Missing Loading States](#7-missing-loading-states) - Poor UX during async operations
- [Direct Database Access in LiveView](#8-direct-database-access-in-liveview) - Bypassing contexts

## Data Access Anti-Patterns

- [N+1 Query Problem](#9-n1-query-problem) - Missing preloads
- [Ecto in Controllers](#10-ecto-in-controllers) - Data access outside contexts
- [Missing Changesets](#11-missing-changesets) - No data validation
- [Overusing Bang Functions](#12-overusing-bang-functions) - Improper error handling

## Channel Anti-Patterns

- [Missing Authentication](#13-missing-channel-authentication) - Unauthenticated channels
- [Heavy Processing in Handlers](#14-heavy-processing-in-channel-handlers) - Blocking operations
- [Not Leveraging PubSub](#15-not-leveraging-pubsub) - Direct process messaging

## Testing Anti-Patterns

- [Testing Implementation Details](#16-testing-implementation-details) - Brittle tests
- [Missing Async Tests](#17-missing-async-tests) - Slow test suites
- [Ignoring SQL Sandbox](#18-ignoring-sql-sandbox) - Database test pollution

## Overview

This document identifies common anti-patterns in Phoenix applications that lead to maintainability issues, performance problems, or security vulnerabilities. Each anti-pattern includes a FAIL example showing the problem and a PASS example demonstrating the idiomatic Phoenix approach.

These examples use Phoenix 1.7+ with Elixir 1.14+ and focus on Islamic financial domains including Zakat calculation, Murabaha contracts, and donation management.

### ❌ FAIL - Fat Context

**Problem**: Contexts that handle too many concerns become difficult to maintain and test.

```elixir
defmodule OsePlatform.Finance do
  @moduledoc """
  ❌ Fat context handling Zakat, donations, and Murabaha!
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Finance.{
    ZakatCalculation,
    Donation,
    MurabahaContract,
    Payment,
    Receipt,
    Report
  }

  # Zakat functions
  def create_zakat_calculation(attrs), do: ...
  def calculate_zakat_amount(attrs), do: ...
  def list_zakat_calculations(user_id), do: ...
  def send_zakat_receipt(zakat_id), do: ...

  # Donation functions
  def create_donation(attrs), do: ...
  def process_donation_payment(donation_id), do: ...
  def list_donations_by_campaign(campaign_id), do: ...
  def send_donation_receipt(donation_id), do: ...

  # Murabaha functions
  def create_murabaha_contract(attrs), do: ...
  def calculate_payment_schedule(contract_id), do: ...
  def process_murabaha_payment(payment_id), do: ...
  def generate_contract_document(contract_id), do: ...

  # Report functions
  def generate_financial_report(params), do: ...
  def export_tax_report(user_id, year), do: ...

  # Payment gateway integration
  def process_payment(payment_params), do: ...
  def refund_payment(payment_id), do: ...

  # Email notifications
  def send_reminder_email(user_id, type), do: ...
  def send_confirmation_email(user_id, type), do: ...

  # ... 50+ more functions
end
```

**Issues**:

- Violates Single Responsibility Principle
- Hard to navigate and understand
- Testing requires understanding entire domain
- Multiple teams editing same file (merge conflicts)
- Impossible to reason about dependencies
- Context name too vague

### ✅ PASS - Focused Contexts

```elixir
# Focused Zakat context
defmodule OsePlatform.Zakat do
  @moduledoc """
  ✅ Focused context for Zakat calculations and management.

  Handles:
  - Creating and calculating Zakat obligations
  - Tracking Zakat payments
  - Generating Zakat reports
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.Calculation

  @doc """
  Creates a new Zakat calculation for a user.
  """
  def create_calculation(attrs) do
    %Calculation{}
    |> Calculation.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Calculates Zakat amount based on wealth and nisab.
  """
  def calculate_zakat_amount(wealth, nisab) do
    if Decimal.compare(wealth, nisab) == :gt do
      Decimal.mult(wealth, Decimal.new("0.025"))
    else
      Decimal.new("0")
    end
  end

  @doc """
  Lists all Zakat calculations for a user.
  """
  def list_calculations(user_id) do
    Calculation
    |> where([c], c.user_id == ^user_id)
    |> order_by([c], desc: c.inserted_at)
    |> Repo.all()
  end
end

# Focused Donations context
defmodule OsePlatform.Donations do
  @moduledoc """
  ✅ Focused context for donation management.

  Handles:
  - Creating and tracking donations
  - Managing donation campaigns
  - Processing donation payments
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Donations.{Donation, Campaign}

  def create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
  end

  def list_donations_by_campaign(campaign_id) do
    Donation
    |> where([d], d.campaign_id == ^campaign_id)
    |> order_by([d], desc: d.inserted_at)
    |> Repo.all()
  end
end

# Focused Murabaha context
defmodule OsePlatform.Murabaha do
  @moduledoc """
  ✅ Focused context for Islamic financing contracts.

  Handles:
  - Creating and managing Murabaha contracts
  - Calculating payment schedules
  - Tracking contract payments
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Murabaha.{Contract, Payment}

  def create_contract(attrs) do
    %Contract{}
    |> Contract.changeset(attrs)
    |> Repo.insert()
  end

  def calculate_payment_schedule(contract) do
    # Payment schedule calculation logic
  end
end

# Shared Notifications context
defmodule OsePlatform.Notifications do
  @moduledoc """
  ✅ Shared context for notifications across domains.

  Handles:
  - Sending emails
  - SMS notifications
  - In-app notifications
  """

  def send_receipt_email(user_id, receipt_type, data) do
    # Email sending logic
  end

  def send_reminder(user_id, reminder_type) do
    # Reminder logic
  end
end
```

### ❌ FAIL - Anemic Context (CRUD Only)

**Problem**: Contexts that are just thin wrappers around Ecto queries with no business logic.

```elixir
defmodule OsePlatform.Zakat do
  @moduledoc """
  ❌ Anemic context - just CRUD operations, no domain logic
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.Calculation

  # Just basic CRUD - no business logic!
  def get_calculation(id), do: Repo.get(Calculation, id)
  def list_calculations, do: Repo.all(Calculation)
  def create_calculation(attrs), do: %Calculation{} |> Calculation.changeset(attrs) |> Repo.insert()
  def update_calculation(calculation, attrs), do: calculation |> Calculation.changeset(attrs) |> Repo.update()
  def delete_calculation(calculation), do: Repo.delete(calculation)

  # Where is the Zakat calculation logic?
  # Where is the nisab validation?
  # Where is the hawal (lunar year) tracking?
end

# Business logic leaked to controllers!
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller
  alias OsePlatform.Zakat

  def calculate(conn, %{"wealth" => wealth, "nisab" => nisab}) do
    # ❌ Business logic in controller!
    zakat_amount = if Decimal.compare(wealth, nisab) == :gt do
      Decimal.mult(wealth, Decimal.new("0.025"))
    else
      Decimal.new("0")
    end

    attrs = %{
      wealth: wealth,
      nisab: nisab,
      zakat_amount: zakat_amount,
      eligible: Decimal.compare(wealth, nisab) == :gt
    }

    case Zakat.create_calculation(attrs) do
      {:ok, calculation} ->
        render(conn, "show.json", calculation: calculation)
      {:error, changeset} ->
        render(conn, "error.json", changeset: changeset)
    end
  end
end
```

**Issues**:

- Business logic scattered in controllers and LiveViews
- Difficult to test domain logic
- Cannot reuse calculation logic
- Controllers become fat
- Violates separation of concerns

### ✅ PASS - Rich Context with Domain Logic

```elixir
defmodule OsePlatform.Zakat do
  @moduledoc """
  ✅ Rich context with domain logic encapsulated.
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.{Calculation, Calculator, HawalTracker}

  # Query functions (simple data access)
  defp get_calculation_query(id) do
    from(c in Calculation, where: c.id == ^id)
  end

  @doc """
  Gets a Zakat calculation by ID.
  """
  def get_calculation(id) do
    case Repo.one(get_calculation_query(id)) do
      nil -> {:error, :not_found}
      calculation -> {:ok, calculation}
    end
  end

  @doc """
  Creates a new Zakat calculation with full business logic.

  This function:
  - Validates wealth against nisab
  - Checks hawal (lunar year) completion
  - Calculates Zakat amount using Islamic formula
  - Tracks calculation history
  """
  def calculate_zakat(attrs) do
    with {:ok, validated_attrs} <- validate_zakat_params(attrs),
         {:ok, hawal_status} <- HawalTracker.check_hawal(validated_attrs.user_id),
         {:ok, zakat_data} <- Calculator.calculate(validated_attrs, hawal_status) do
      %Calculation{}
      |> Calculation.changeset(zakat_data)
      |> Repo.insert()
    end
  end

  @doc """
  Calculates Zakat amount based on wealth type.

  Handles different nisab thresholds for:
  - Gold and silver (85 grams gold equivalent)
  - Cash and trade goods
  - Agricultural produce (varies by irrigation)
  - Livestock (specific nisab per animal type)
  """
  def calculate_amount(wealth, wealth_type, nisab) do
    Calculator.calculate_by_type(wealth, wealth_type, nisab)
  end

  @doc """
  Checks if user's wealth has completed hawal (354 days).
  """
  def hawal_completed?(user_id, date) do
    HawalTracker.completed?(user_id, date)
  end

  # Private helper functions
  defp validate_zakat_params(attrs) do
    required_keys = [:user_id, :wealth, :nisab, :wealth_type]

    if Enum.all?(required_keys, &Map.has_key?(attrs, &1)) do
      {:ok, attrs}
    else
      {:error, :missing_required_params}
    end
  end
end

# Dedicated Calculator module for business logic
defmodule OsePlatform.Zakat.Calculator do
  @moduledoc """
  Zakat calculation business logic.
  """

  @zakat_rate Decimal.new("0.025")  # 2.5%

  def calculate(attrs, hawal_status) do
    wealth = Decimal.new(attrs.wealth)
    nisab = Decimal.new(attrs.nisab)

    eligible? = hawal_status.completed? and Decimal.compare(wealth, nisab) == :gt

    zakat_amount = if eligible? do
      Decimal.mult(wealth, @zakat_rate)
    else
      Decimal.new("0")
    end

    {:ok, %{
      user_id: attrs.user_id,
      wealth: wealth,
      nisab: nisab,
      wealth_type: attrs.wealth_type,
      zakat_amount: zakat_amount,
      eligible: eligible?,
      hawal_completed: hawal_status.completed?,
      calculation_date: Date.utc_today()
    }}
  end

  def calculate_by_type(wealth, :gold, nisab) do
    # Gold-specific calculation (85 grams)
  end

  def calculate_by_type(wealth, :agricultural, nisab) do
    # Agricultural produce (5-10% depending on irrigation)
  end

  def calculate_by_type(wealth, :livestock, nisab) do
    # Livestock-specific nisab and rates
  end

  def calculate_by_type(wealth, _type, nisab) do
    # Default 2.5% for cash and trade goods
  end
end

# Now controller is thin!
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller
  alias OsePlatform.Zakat

  def calculate(conn, params) do
    # ✅ Just delegates to context - no business logic
    case Zakat.calculate_zakat(params) do
      {:ok, calculation} ->
        render(conn, "show.json", calculation: calculation)
      {:error, :missing_required_params} ->
        conn
        |> put_status(:bad_request)
        |> render("error.json", error: "Missing required parameters")
      {:error, changeset} ->
        render(conn, "error.json", changeset: changeset)
    end
  end
end
```

### ❌ FAIL - Bypassing Context APIs

**Problem**: Directly accessing another context's database tables breaks encapsulation.

```elixir
defmodule OsePlatform.Donations do
  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation
  alias OsePlatform.Zakat.Calculation  # ❌ Importing another context's schema!

  def create_donation_from_zakat(donation_attrs) do
    # ❌ Directly querying Zakat context's table!
    zakat_calculation = Repo.get(Calculation, donation_attrs.zakat_id)

    if zakat_calculation.zakat_amount > 0 do
      %Donation{}
      |> Donation.changeset(%{
        amount: zakat_calculation.zakat_amount,
        user_id: zakat_calculation.user_id,
        source: "zakat_calculation"
      })
      |> Repo.insert()
    else
      {:error, :insufficient_zakat}
    end
  end
end
```

**Issues**:

- Tight coupling between contexts
- Breaks encapsulation
- Cannot change Zakat schema without breaking Donations
- Makes testing difficult
- Violates context boundaries

### ✅ PASS - Use Context Public APIs

```elixir
defmodule OsePlatform.Donations do
  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation
  alias OsePlatform.Zakat  # ✅ Import context, not schema!

  @doc """
  Creates a donation from a Zakat calculation.

  Uses Zakat context public API to retrieve calculation data.
  """
  def create_donation_from_zakat(zakat_id, donation_attrs) do
    # ✅ Use context public API
    with {:ok, zakat_calculation} <- Zakat.get_calculation(zakat_id),
         :ok <- validate_zakat_eligible(zakat_calculation),
         {:ok, donation} <- create_donation(zakat_calculation, donation_attrs) do
      {:ok, donation}
    end
  end

  defp validate_zakat_eligible(zakat_calculation) do
    # ✅ Access via public struct fields, not internal implementation
    if zakat_calculation.eligible and zakat_calculation.zakat_amount > 0 do
      :ok
    else
      {:error, :zakat_not_eligible}
    end
  end

  defp create_donation(zakat_calculation, attrs) do
    donation_params = %{
      amount: zakat_calculation.zakat_amount,
      user_id: zakat_calculation.user_id,
      source: "zakat_calculation",
      reference_id: zakat_calculation.id
    }
    |> Map.merge(attrs)

    %Donation{}
    |> Donation.changeset(donation_params)
    |> Repo.insert()
  end
end

# Zakat context provides clean public API
defmodule OsePlatform.Zakat do
  @moduledoc """
  Public API for Zakat context.
  """

  # ✅ Public function for other contexts to use
  def get_calculation(id) do
    case Repo.get(Calculation, id) do
      nil -> {:error, :not_found}
      calculation -> {:ok, calculation}
    end
  end

  # ✅ Public function to check eligibility
  def eligible_for_zakat?(calculation) do
    calculation.eligible and calculation.zakat_amount > 0
  end
end
```

### ❌ FAIL - God Schema

**Problem**: Schemas with too many fields and responsibilities.

```elixir
defmodule OsePlatform.Finance.Transaction do
  use Ecto.Schema
  import Ecto.Changeset

  # ❌ God schema handling everything!
  schema "transactions" do
    field :type, :string  # "zakat", "donation", "murabaha_payment", "refund", ...
    field :amount, :decimal

    # Zakat fields
    field :zakat_calculation_id, :string
    field :nisab, :decimal
    field :wealth_type, :string
    field :hawal_completed, :boolean

    # Donation fields
    field :campaign_id, :string
    field :donor_name, :string
    field :anonymous, :boolean
    field :tax_deductible, :boolean

    # Murabaha fields
    field :contract_id, :string
    field :payment_number, :integer
    field :due_date, :date
    field :profit_amount, :decimal

    # Payment gateway fields
    field :gateway, :string
    field :gateway_transaction_id, :string
    field :gateway_status, :string

    # Receipt fields
    field :receipt_number, :string
    field :receipt_sent, :boolean

    # Refund fields
    field :refund_reason, :string
    field :refunded_at, :utc_datetime

    # ... 30+ more fields

    timestamps()
  end

  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [...])  # ❌ 40+ fields to validate!
    |> validate_required([...])
    # ❌ Complex conditional validation based on type
    |> validate_zakat_fields()
    |> validate_donation_fields()
    |> validate_murabaha_fields()
  end
end
```

**Issues**:

- Violates Single Responsibility Principle
- Most fields null most of the time
- Complex conditional validation
- Difficult to query efficiently
- Cannot optimize indexes
- Hard to evolve independently

### ✅ PASS - Focused Schemas

```elixir
# ✅ Focused Zakat schema
defmodule OsePlatform.Zakat.Calculation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "zakat_calculations" do
    field :user_id, :binary_id
    field :wealth, :decimal
    field :nisab, :decimal
    field :wealth_type, :string
    field :zakat_amount, :decimal
    field :eligible, :boolean
    field :hawal_completed, :boolean
    field :calculation_date, :date

    timestamps()
  end

  @doc false
  def changeset(calculation, attrs) do
    calculation
    |> cast(attrs, [:user_id, :wealth, :nisab, :wealth_type, :zakat_amount, :eligible, :hawal_completed, :calculation_date])
    |> validate_required([:user_id, :wealth, :nisab, :wealth_type, :zakat_amount, :eligible])
    |> validate_number(:wealth, greater_than_or_equal_to: 0)
    |> validate_number(:nisab, greater_than: 0)
    |> validate_inclusion(:wealth_type, ["gold", "silver", "cash", "agricultural", "livestock"])
  end
end

# ✅ Focused Donation schema
defmodule OsePlatform.Donations.Donation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "donations" do
    field :user_id, :binary_id
    field :campaign_id, :binary_id
    field :amount, :decimal
    field :donor_name, :string
    field :anonymous, :boolean, default: false
    field :tax_deductible, :boolean, default: true

    timestamps()
  end

  @doc false
  def changeset(donation, attrs) do
    donation
    |> cast(attrs, [:user_id, :campaign_id, :amount, :donor_name, :anonymous, :tax_deductible])
    |> validate_required([:amount])
    |> validate_number(:amount, greater_than: 0)
  end
end

# ✅ Focused Murabaha Payment schema
defmodule OsePlatform.Murabaha.Payment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "murabaha_payments" do
    belongs_to :contract, OsePlatform.Murabaha.Contract, type: :binary_id

    field :payment_number, :integer
    field :due_date, :date
    field :amount, :decimal
    field :profit_amount, :decimal
    field :paid, :boolean, default: false
    field :paid_at, :utc_datetime

    timestamps()
  end

  @doc false
  def changeset(payment, attrs) do
    payment
    |> cast(attrs, [:contract_id, :payment_number, :due_date, :amount, :profit_amount, :paid, :paid_at])
    |> validate_required([:contract_id, :payment_number, :due_date, :amount])
    |> validate_number(:amount, greater_than: 0)
    |> validate_number(:payment_number, greater_than: 0)
  end
end

# ✅ Shared Payment Gateway schema (if needed)
defmodule OsePlatform.Payments.Transaction do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "payment_transactions" do
    field :payable_type, :string  # "Donation", "MurabahaPayment", etc.
    field :payable_id, :binary_id
    field :amount, :decimal
    field :gateway, :string
    field :gateway_transaction_id, :string
    field :status, :string

    timestamps()
  end
end
```

### ❌ FAIL - Monolithic LiveView

**Problem**: Single LiveView file handling multiple concerns and state.

```elixir
defmodule OsePlatformWeb.ZakatLive.Dashboard do
  use OsePlatformWeb, :live_view

  # ❌ Massive LiveView with 1000+ lines!

  def mount(_params, _session, socket) do
    # ❌ Too much initialization
    socket = socket
    |> assign(:calculations, [])
    |> assign(:campaigns, [])
    |> assign(:donations, [])
    |> assign(:contracts, [])
    |> assign(:payments, [])
    |> assign(:stats, %{})
    |> assign(:chart_data, [])
    |> assign(:loading, true)
    |> load_all_data()

    {:ok, socket}
  end

  # ❌ 50+ event handlers in one file!
  def handle_event("calculate_zakat", params, socket), do: ...
  def handle_event("create_donation", params, socket), do: ...
  def handle_event("update_campaign", params, socket), do: ...
  def handle_event("process_payment", params, socket), do: ...
  def handle_event("generate_report", params, socket), do: ...
  def handle_event("export_csv", params, socket), do: ...
  def handle_event("send_email", params, socket), do: ...

  # ... 40+ more event handlers

  # ❌ Complex rendering logic mixed with business logic
  def render(assigns) do
    ~H"""
    <!-- 500+ lines of template code -->
    <div>
      <!-- Zakat section -->
      <!-- Donations section -->
      <!-- Murabaha section -->
      <!-- Reports section -->
      <!-- Settings section -->
    </div>
    """
  end
end
```

**Issues**:

- Difficult to navigate and maintain
- Testing requires understanding entire module
- Cannot reuse components
- Slow compilation
- Merge conflicts common

### ✅ PASS - Modular LiveView with Components

```elixir
# ✅ Main LiveView is thin orchestrator
defmodule OsePlatformWeb.ZakatLive.Dashboard do
  use OsePlatformWeb, :live_view

  alias OsePlatformWeb.ZakatLive.Components.{
    CalculationForm,
    CalculationList,
    StatsCard
  }

  def mount(_params, %{"user_id" => user_id}, socket) do
    socket = socket
    |> assign(:user_id, user_id)
    |> assign(:page_title, "Zakat Dashboard")

    {:ok, socket, temporary_assigns: [calculations: []]}
  end

  def render(assigns) do
    ~H"""
    <div class="zakat-dashboard">
      <.live_component
        module={StatsCard}
        id="zakat-stats"
        user_id={@user_id}
      />

      <.live_component
        module={CalculationForm}
        id="calculation-form"
        user_id={@user_id}
      />

      <.live_component
        module={CalculationList}
        id="calculation-list"
        user_id={@user_id}
      />
    </div>
    """
  end
end

# ✅ Focused LiveComponent for calculation form
defmodule OsePlatformWeb.ZakatLive.Components.CalculationForm do
  use OsePlatformWeb, :live_component

  alias OsePlatform.Zakat

  def mount(socket) do
    {:ok, assign(socket, :form, to_form(%{}))}
  end

  def handle_event("calculate", params, socket) do
    case Zakat.calculate_zakat(params) do
      {:ok, calculation} ->
        send(self(), {:calculation_created, calculation})
        {:noreply, put_flash(socket, :info, "Zakat calculated successfully")}

      {:error, changeset} ->
        {:noreply, assign(socket, :form, to_form(changeset))}
    end
  end

  def render(assigns) do
    ~H"""
    <div class="calculation-form">
      <.form for={@form} phx-submit="calculate" phx-target={@myself}>
        <!-- Form fields -->
      </.form>
    </div>
    """
  end
end

# ✅ Focused LiveComponent for calculation list
defmodule OsePlatformWeb.ZakatLive.Components.CalculationList do
  use OsePlatformWeb, :live_component

  alias OsePlatform.Zakat

  def update(assigns, socket) do
    calculations = Zakat.list_calculations(assigns.user_id)

    socket = socket
    |> assign(assigns)
    |> assign(:calculations, calculations)

    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="calculation-list">
      <%= for calculation <- @calculations do %>
        <div class="calculation-item">
          <!-- Calculation details -->
        </div>
      <% end %>
    </div>
    """
  end
end
```

### ❌ FAIL - Too Many Assigns

**Problem**: Storing too much state in LiveView assigns causes performance issues.

```elixir
defmodule OsePlatformWeb.MurabahaLive.ContractForm do
  use OsePlatformWeb, :live_view

  def mount(_params, _session, socket) do
    # ❌ Loading entire database into assigns!
    socket = socket
    |> assign(:all_users, Accounts.list_users())  # 10,000+ users
    |> assign(:all_products, Products.list_products())  # 5,000+ products
    |> assign(:all_contracts, Murabaha.list_contracts())  # 20,000+ contracts
    |> assign(:all_payments, Payments.list_payments())  # 100,000+ payments
    |> assign(:search_results, [])
    |> assign(:filtered_results, [])
    |> assign(:sorted_results, [])
    |> assign(:paginated_results, [])

    {:ok, socket}
  end

  def handle_event("search", %{"query" => query}, socket) do
    # ❌ Filtering in LiveView instead of database!
    results = Enum.filter(socket.assigns.all_contracts, fn contract ->
      String.contains?(contract.name, query)
    end)

    {:noreply, assign(socket, :search_results, results)}
  end
end
```

**Issues**:

- Massive memory usage
- Slow initial page load
- Inefficient updates (diffs are huge)
- Should filter in database, not memory

### ✅ PASS - Minimal Assigns with Temporary State

```elixir
defmodule OsePlatformWeb.MurabahaLive.ContractForm do
  use OsePlatformWeb, :live_view

  def mount(_params, _session, socket) do
    # ✅ Only load what's needed for current view
    socket = socket
    |> assign(:search_query, "")
    |> assign(:current_page, 1)
    |> assign(:page_size, 20)

    # ✅ Use temporary_assigns for data that changes frequently
    {:ok, socket, temporary_assigns: [contracts: []]}
  end

  def handle_params(params, _uri, socket) do
    # ✅ Load data based on current params
    contracts = load_contracts(socket, params)

    socket = socket
    |> assign(:contracts, contracts)
    |> assign(:search_query, params["query"] || "")
    |> assign(:current_page, String.to_integer(params["page"] || "1"))

    {:noreply, socket}
  end

  def handle_event("search", %{"query" => query}, socket) do
    # ✅ Push to URL, let handle_params reload
    {:noreply, push_patch(socket, to: ~p"/murabaha/contracts?query=#{query}")}
  end

  defp load_contracts(socket, params) do
    # ✅ Filter and paginate in database
    query = params["query"] || ""
    page = String.to_integer(params["page"] || "1")

    Murabaha.search_contracts(
      query: query,
      page: page,
      page_size: socket.assigns.page_size
    )
  end

  # ✅ Use streams for large lists (Phoenix 1.7+)
  def mount_with_streams(_params, _session, socket) do
    socket = socket
    |> stream(:contracts, [])

    {:ok, socket}
  end

  def handle_info({:new_contract, contract}, socket) do
    # ✅ Stream insert - efficient updates
    {:noreply, stream_insert(socket, :contracts, contract, at: 0)}
  end
end
```

### ❌ FAIL - No Loading Indicators

**Problem**: Poor UX during async operations - users don't know if something is happening.

```elixir
defmodule OsePlatformWeb.ZakatLive.Calculate do
  use OsePlatformWeb, :live_view

  def handle_event("calculate", params, socket) do
    # ❌ Long-running operation with no loading state
    result = Zakat.calculate_zakat(params)  # Takes 2-3 seconds

    {:noreply, assign(socket, :result, result)}
  end

  def render(assigns) do
    ~H"""
    <div>
      <button phx-click="calculate">Calculate Zakat</button>

      <%= if @result do %>
        <!-- ❌ Result appears suddenly after 3 seconds -->
        <div><%= @result.zakat_amount %></div>
      <% end %>
    </div>
    """
  end
end
```

**Issues**:

- User doesn't know if button click worked
- Feels unresponsive
- Users might click multiple times
- Poor user experience

### ✅ PASS - Proper Loading States

```elixir
defmodule OsePlatformWeb.ZakatLive.Calculate do
  use OsePlatformWeb, :live_view

  def mount(_params, _session, socket) do
    socket = socket
    |> assign(:calculating, false)
    |> assign(:result, nil)

    {:ok, socket}
  end

  def handle_event("calculate", params, socket) do
    # ✅ Set loading state immediately
    socket = assign(socket, :calculating, true)

    # ✅ Perform async calculation
    Task.Supervisor.async_nolink(OsePlatform.TaskSupervisor, fn ->
      Zakat.calculate_zakat(params)
    end)

    {:noreply, socket}
  end

  def handle_info({ref, result}, socket) when is_reference(ref) do
    # ✅ Handle async result
    Process.demonitor(ref, [:flush])

    socket = socket
    |> assign(:calculating, false)
    |> assign(:result, result)

    {:noreply, socket}
  end

  def handle_info({:DOWN, _ref, :process, _pid, _reason}, socket) do
    # ✅ Handle async failure
    socket = socket
    |> assign(:calculating, false)
    |> put_flash(:error, "Calculation failed. Please try again.")

    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div>
      <button
        phx-click="calculate"
        disabled={@calculating}
        class={if @calculating, do: "opacity-50 cursor-not-allowed"}
      >
        <%= if @calculating do %>
          <!-- ✅ Loading indicator -->
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calculating...
        <% else %>
          Calculate Zakat
        <% end %>
      </button>

      <%= if @result do %>
        <!-- ✅ Result appears after loading completes -->
        <div class="fade-in">
          <p>Zakat Amount: <%= @result.zakat_amount %></p>
        </div>
      <% end %>
    </div>
    """
  end
end
```

### ❌ FAIL - Ecto Queries in LiveView

**Problem**: LiveView directly accessing Repo instead of using contexts.

```elixir
defmodule OsePlatformWeb.DonationLive.Index do
  use OsePlatformWeb, :live_view

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation

  def mount(_params, _session, socket) do
    # ❌ Direct database access in LiveView!
    donations = Repo.all(
      from d in Donation,
      where: d.user_id == ^socket.assigns.current_user.id,
      order_by: [desc: d.inserted_at],
      preload: [:campaign]
    )

    {:ok, assign(socket, :donations, donations)}
  end

  def handle_event("delete", %{"id" => id}, socket) do
    # ❌ Direct Repo access!
    donation = Repo.get!(Donation, id)
    Repo.delete!(donation)

    {:noreply, socket}
  end
end
```

**Issues**:

- Bypasses context API
- Cannot reuse query logic
- Testing requires database setup
- Violates layer separation
- Business logic leaks into view layer

### ✅ PASS - Use Context APIs

```elixir
defmodule OsePlatformWeb.DonationLive.Index do
  use OsePlatformWeb, :live_view

  alias OsePlatform.Donations  # ✅ Use context, not Repo!

  def mount(_params, _session, socket) do
    # ✅ Use context public API
    donations = Donations.list_user_donations(socket.assigns.current_user.id)

    {:ok, assign(socket, :donations, donations)}
  end

  def handle_event("delete", %{"id" => id}, socket) do
    # ✅ Use context public API
    case Donations.delete_donation(id, socket.assigns.current_user.id) do
      {:ok, _donation} ->
        donations = Donations.list_user_donations(socket.assigns.current_user.id)
        {:noreply, assign(socket, :donations, donations)}

      {:error, :not_found} ->
        {:noreply, put_flash(socket, :error, "Donation not found")}

      {:error, :unauthorized} ->
        {:noreply, put_flash(socket, :error, "Not authorized")}
    end
  end
end

# Context provides clean API
defmodule OsePlatform.Donations do
  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation

  @doc """
  Lists all donations for a user.
  """
  def list_user_donations(user_id) do
    Donation
    |> where([d], d.user_id == ^user_id)
    |> order_by([d], desc: d.inserted_at)
    |> preload([:campaign])
    |> Repo.all()
  end

  @doc """
  Deletes a donation (with authorization check).
  """
  def delete_donation(donation_id, user_id) do
    with {:ok, donation} <- get_donation(donation_id),
         :ok <- authorize_delete(donation, user_id) do
      Repo.delete(donation)
    end
  end

  defp get_donation(id) do
    case Repo.get(Donation, id) do
      nil -> {:error, :not_found}
      donation -> {:ok, donation}
    end
  end

  defp authorize_delete(donation, user_id) do
    if donation.user_id == user_id do
      :ok
    else
      {:error, :unauthorized}
    end
  end
end
```

### ❌ FAIL - Missing Preloads

**Problem**: Loading associations in a loop causes N+1 queries.

```elixir
defmodule OsePlatform.Murabaha do
  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Murabaha.Contract

  def list_contracts_with_payments do
    # ❌ Missing preload!
    contracts = Repo.all(Contract)  # 1 query

    # ❌ N queries in Enum.map
    Enum.map(contracts, fn contract ->
      # Lazy load payments - 1 query per contract!
      %{
        id: contract.id,
        amount: contract.amount,
        payments: contract.payments,  # ❌ Lazy load!
        total_paid: calculate_total_paid(contract.payments)
      }
    end)
    # Total: 1 + N queries
  end
end
```

**Console Output**:

```
[debug] SELECT c0."id", c0."amount" FROM "murabaha_contracts" AS c0  -- 1 query
[debug] SELECT p0."id", p0."amount" FROM "payments" AS p0 WHERE p0."contract_id" = $1  -- Query 1
[debug] SELECT p0."id", p0."amount" FROM "payments" AS p0 WHERE p0."contract_id" = $1  -- Query 2
[debug] SELECT p0."id", p0."amount" FROM "payments" AS p0 WHERE p0."contract_id" = $1  -- Query 3
... (N queries)
```

### ✅ PASS - Use Preload

```elixir
defmodule OsePlatform.Murabaha do
  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Murabaha.Contract

  def list_contracts_with_payments do
    # ✅ Preload payments in single query
    contracts = Contract
    |> preload(:payments)
    |> Repo.all()

    # ✅ No additional queries - payments already loaded
    Enum.map(contracts, fn contract ->
      %{
        id: contract.id,
        amount: contract.amount,
        payments: contract.payments,  # ✅ Already loaded!
        total_paid: calculate_total_paid(contract.payments)
      }
    end)
    # Total: 2 queries (1 for contracts, 1 for all payments)
  end

  # ✅ For complex queries, use join and select
  def list_contracts_with_payment_totals do
    Contract
    |> join(:left, [c], p in assoc(c, :payments))
    |> group_by([c], c.id)
    |> select([c, p], %{
      id: c.id,
      amount: c.amount,
      total_paid: sum(p.amount)
    })
    |> Repo.all()
    # Total: 1 query with JOIN
  end

  # ✅ Use Repo.preload for dynamic preloading
  def get_contract_with_associations(id, opts \\ []) do
    preloads = Keyword.get(opts, :preload, [])

    Contract
    |> Repo.get(id)
    |> Repo.preload(preloads)
  end

  # Usage:
  # get_contract_with_associations(id, preload: [:payments])
  # get_contract_with_associations(id, preload: [:payments, :user])
end
```

### ❌ FAIL - Direct Ecto in Controller

**Problem**: Controllers directly using Ecto instead of contexts.

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.Calculation

  def index(conn, _params) do
    # ❌ Ecto query in controller!
    calculations = Repo.all(
      from c in Calculation,
      where: c.user_id == ^conn.assigns.current_user.id,
      order_by: [desc: c.inserted_at]
    )

    render(conn, "index.json", calculations: calculations)
  end

  def create(conn, params) do
    # ❌ Ecto changeset in controller!
    changeset = Calculation.changeset(%Calculation{}, params)

    case Repo.insert(changeset) do
      {:ok, calculation} ->
        conn
        |> put_status(:created)
        |> render("show.json", calculation: calculation)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render("error.json", changeset: changeset)
    end
  end
end
```

**Issues**:

- Controller knows about database
- Cannot reuse query logic
- Testing requires database
- Violates separation of concerns

### ✅ PASS - Use Context

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat  # ✅ Use context!

  def index(conn, _params) do
    # ✅ Delegate to context
    calculations = Zakat.list_user_calculations(conn.assigns.current_user.id)
    render(conn, "index.json", calculations: calculations)
  end

  def create(conn, params) do
    # ✅ Delegate to context
    params_with_user = Map.put(params, "user_id", conn.assigns.current_user.id)

    case Zakat.calculate_zakat(params_with_user) do
      {:ok, calculation} ->
        conn
        |> put_status(:created)
        |> render("show.json", calculation: calculation)

      {:error, :missing_required_params} ->
        conn
        |> put_status(:bad_request)
        |> put_view(json: %{error: "Missing required parameters"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render("error.json", changeset: changeset)
    end
  end
end
```

### ❌ FAIL - No Changeset Validation

**Problem**: Creating records without proper validation.

```elixir
defmodule OsePlatform.Donations do
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation

  def create_donation(attrs) do
    # ❌ No validation - dangerous!
    donation = struct!(Donation, attrs)
    Repo.insert(donation)
  end
end

# ❌ Schema without changeset function
defmodule OsePlatform.Donations.Donation do
  use Ecto.Schema

  schema "donations" do
    field :amount, :decimal
    field :user_id, :binary_id
    field :campaign_id, :binary_id

    timestamps()
  end

  # ❌ No changeset function!
end
```

**Issues**:

- No validation
- Allows invalid data
- Security vulnerabilities (mass assignment)
- Cannot provide user-friendly errors

### ✅ PASS - Proper Changeset Validation

```elixir
defmodule OsePlatform.Donations do
  alias OsePlatform.Repo
  alias OsePlatform.Donations.Donation

  def create_donation(attrs) do
    # ✅ Use changeset for validation
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
  end
end

# ✅ Schema with comprehensive changeset
defmodule OsePlatform.Donations.Donation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "donations" do
    field :amount, :decimal
    field :user_id, :binary_id
    field :campaign_id, :binary_id
    field :anonymous, :boolean, default: false
    field :message, :string

    timestamps()
  end

  @doc """
  Changeset for creating/updating donations.

  Validations:
  - Amount must be positive
  - User and campaign are required
  - Message is optional but limited to 500 chars
  """
  def changeset(donation, attrs) do
    donation
    |> cast(attrs, [:amount, :user_id, :campaign_id, :anonymous, :message])
    |> validate_required([:amount, :user_id, :campaign_id])
    |> validate_number(:amount,
      greater_than: 0,
      less_than_or_equal_to: 1_000_000,
      message: "must be between 0 and 1,000,000"
    )
    |> validate_length(:message, max: 500)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:campaign_id)
  end

  @doc """
  Changeset for updating donation amount only.
  """
  def amount_changeset(donation, attrs) do
    donation
    |> cast(attrs, [:amount])
    |> validate_required([:amount])
    |> validate_number(:amount, greater_than: 0)
  end
end
```

### ❌ FAIL - Bang Functions Everywhere

**Problem**: Using bang functions (`!`) without proper error handling causes crashes.

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat

  def show(conn, %{"id" => id}) do
    # ❌ Crashes entire request if not found!
    calculation = Zakat.get_calculation!(id)

    render(conn, "show.json", calculation: calculation)
  end

  def delete(conn, %{"id" => id}) do
    # ❌ Crashes if deletion fails!
    calculation = Zakat.get_calculation!(id)
    Zakat.delete_calculation!(calculation)

    send_resp(conn, :no_content, "")
  end
end
```

**Issues**:

- Crashes entire process on error
- Cannot provide user-friendly error messages
- No way to handle different error cases
- Poor user experience

### ✅ PASS - Proper Error Handling

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat

  def show(conn, %{"id" => id}) do
    # ✅ Handle errors gracefully
    case Zakat.get_calculation(id) do
      {:ok, calculation} ->
        render(conn, "show.json", calculation: calculation)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> put_view(json: %{error: "Calculation not found"})
    end
  end

  def delete(conn, %{"id" => id}) do
    # ✅ Handle multiple error cases
    with {:ok, calculation} <- Zakat.get_calculation(id),
         :ok <- authorize_delete(conn.assigns.current_user, calculation),
         {:ok, _deleted} <- Zakat.delete_calculation(calculation) do
      send_resp(conn, :no_content, "")
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> put_view(json: %{error: "Calculation not found"})

      {:error, :unauthorized} ->
        conn
        |> put_status(:forbidden)
        |> put_view(json: %{error: "Not authorized to delete this calculation"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render("error.json", changeset: changeset)
    end
  end

  defp authorize_delete(user, calculation) do
    if calculation.user_id == user.id do
      :ok
    else
      {:error, :unauthorized}
    end
  end
end

# Context provides both versions
defmodule OsePlatform.Zakat do
  @doc """
  Gets a calculation by ID.

  Returns {:ok, calculation} or {:error, :not_found}.
  """
  def get_calculation(id) do
    case Repo.get(Calculation, id) do
      nil -> {:error, :not_found}
      calculation -> {:ok, calculation}
    end
  end

  @doc """
  Gets a calculation by ID, raises if not found.

  Use only in tests or when you're certain the record exists.
  """
  def get_calculation!(id) do
    Repo.get!(Calculation, id)
  end
end
```

### ❌ FAIL - Unauthenticated Channel

**Problem**: Channels that don't authenticate users are security risks.

```elixir
defmodule OsePlatformWeb.DonationChannel do
  use Phoenix.Channel

  # ❌ No authentication!
  def join("donations:lobby", _params, socket) do
    {:ok, socket}
  end

  # ❌ Anyone can access any user's donations!
  def join("donations:user:" <> user_id, _params, socket) do
    {:ok, socket}
  end

  def handle_in("new_donation", params, socket) do
    # ❌ No authorization check!
    # Anyone can create donations for any user
    {:reply, {:ok, params}, socket}
  end
end
```

**Issues**:

- Security vulnerability
- Anyone can join any channel
- No authorization
- Data leakage

### ✅ PASS - Authenticated Channel

```elixir
defmodule OsePlatformWeb.DonationChannel do
  use Phoenix.Channel

  alias OsePlatform.{Donations, Accounts}

  # ✅ Authenticate on join
  def join("donations:lobby", _params, socket) do
    # ✅ Verify user is authenticated
    if socket.assigns[:current_user] do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  # ✅ Authorize user-specific channel
  def join("donations:user:" <> user_id, _params, socket) do
    current_user = socket.assigns.current_user

    # ✅ Only allow user to join their own channel
    if current_user && current_user.id == user_id do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  # ✅ Authorize actions
  def handle_in("new_donation", params, socket) do
    current_user = socket.assigns.current_user

    # ✅ Verify user can create donation
    case Donations.create_donation(Map.put(params, "user_id", current_user.id)) do
      {:ok, donation} ->
        broadcast!(socket, "donation_created", %{donation: donation})
        {:reply, {:ok, donation}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end
end

# ✅ Authenticate in user socket
defmodule OsePlatformWeb.UserSocket do
  use Phoenix.Socket

  channel "donations:*", OsePlatformWeb.DonationChannel

  # ✅ Verify token on connect
  def connect(%{"token" => token}, socket, _connect_info) do
    case Accounts.verify_user_token(token) do
      {:ok, user} ->
        socket = assign(socket, :current_user, user)
        {:ok, socket}

      {:error, _reason} ->
        :error
    end
  end

  # ✅ Reject connection without token
  def connect(_params, _socket, _connect_info) do
    :error
  end

  def id(socket) do
    "user_socket:#{socket.assigns.current_user.id}"
  end
end
```

### ❌ FAIL - Blocking Channel Handler

**Problem**: Long-running operations block the channel process.

```elixir
defmodule OsePlatformWeb.ReportChannel do
  use Phoenix.Channel

  alias OsePlatform.Reports

  def handle_in("generate_report", params, socket) do
    # ❌ Blocks channel for 30+ seconds!
    report = Reports.generate_annual_report(
      socket.assigns.current_user.id,
      params["year"]
    )  # Takes 30 seconds!

    # Channel is blocked - cannot handle other messages!
    {:reply, {:ok, report}, socket}
  end
end
```

**Issues**:

- Blocks channel process
- Cannot handle other messages
- Poor user experience
- Timeout risks

### ✅ PASS - Async Processing

```elixir
defmodule OsePlatformWeb.ReportChannel do
  use Phoenix.Channel

  alias OsePlatform.Reports

  def handle_in("generate_report", params, socket) do
    user_id = socket.assigns.current_user.id
    year = params["year"]

    # ✅ Start async task
    Task.Supervisor.start_child(OsePlatform.TaskSupervisor, fn ->
      report = Reports.generate_annual_report(user_id, year)

      # ✅ Send result back to channel
      OsePlatformWeb.Endpoint.broadcast(
        "reports:user:#{user_id}",
        "report_ready",
        %{report: report, year: year}
      )
    end)

    # ✅ Immediate reply - processing in background
    {:reply, {:ok, %{status: "processing"}}, socket}
  end

  # ✅ Handle async result
  def handle_info({:report_generated, report}, socket) do
    push(socket, "report_ready", %{report: report})
    {:noreply, socket}
  end
end

# })
```

### ❌ FAIL - Direct Process Messaging

**Problem**: Manually tracking and messaging processes instead of using PubSub.

```elixir
defmodule OsePlatform.Donations do
  def create_donation(attrs) do
    case do_create_donation(attrs) do
      {:ok, donation} ->
        # ❌ Manually finding and messaging channel processes!
        channel_pids = find_channel_pids("donations:lobby")

        Enum.each(channel_pids, fn pid ->
          send(pid, {:donation_created, donation})
        end)

        {:ok, donation}

      error -> error
    end
  end

  # ❌ Complex process tracking
  defp find_channel_pids(topic) do
    # Manual process registry lookup...
  end
end
```

**Issues**:

- Complex process tracking
- Doesn't scale
- Manual subscription management
- Tight coupling

### ✅ PASS - Use Phoenix PubSub

```elixir
defmodule OsePlatform.Donations do
  alias Phoenix.PubSub

  def create_donation(attrs) do
    case do_create_donation(attrs) do
      {:ok, donation} ->
        # ✅ Broadcast via PubSub - simple and scalable!
        PubSub.broadcast(
          OsePlatform.PubSub,
          "donations:lobby",
          {:donation_created, donation}
        )

        # ✅ Broadcast to user-specific topic
        PubSub.broadcast(
          OsePlatform.PubSub,
          "donations:user:#{donation.user_id}",
          {:donation_created, donation}
        )

        {:ok, donation}

      error -> error
    end
  end

  defp do_create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
  end
end

# ✅ Channel subscribes to PubSub
defmodule OsePlatformWeb.DonationChannel do
  use Phoenix.Channel

  def join("donations:lobby", _params, socket) do
    # ✅ Automatic subscription via channel topic
    {:ok, socket}
  end

  # ✅ Handle PubSub messages
  def handle_info({:donation_created, donation}, socket) do
    push(socket, "donation_created", %{donation: donation})
    {:noreply, socket}
  end
end

# ✅ LiveView also subscribes
defmodule OsePlatformWeb.DonationLive.Index do
  use OsePlatformWeb, :live_view

  def mount(_params, _session, socket) do
    # ✅ Subscribe to PubSub topic
    if connected?(socket) do
      Phoenix.PubSub.subscribe(OsePlatform.PubSub, "donations:lobby")
    end

    {:ok, socket}
  end

  # ✅ Handle PubSub message
  def handle_info({:donation_created, donation}, socket) do
    {:noreply, stream_insert(socket, :donations, donation, at: 0)}
  end
end
```

### ❌ FAIL - Brittle Tests

**Problem**: Tests coupled to implementation details break on refactoring.

```elixir
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase

  alias OsePlatform.Zakat

  test "calculate_zakat/1 calls Calculator.calculate/2" do
    # ❌ Testing implementation detail (internal function call)!
    Calculator = Mox.defmock(CalculatorMock, for: Calculator)

    Mox.expect(CalculatorMock, :calculate, fn _attrs, _hawal ->
      {:ok, %{zakat_amount: Decimal.new("250")}}
    end)

    # Test breaks if we refactor Calculator implementation!
  end

  test "calculate_zakat/1 calls Repo.insert with correct changeset" do
    # ❌ Testing Repo implementation!
    # What if we switch to bulk insert?
    # What if we add transaction wrapper?
  end
end
```

**Issues**:

- Tests break on refactoring
- Coupled to implementation
- Hard to maintain
- False positives

### ✅ PASS - Test Behavior, Not Implementation

```elixir
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase

  alias OsePlatform.Zakat

  describe "calculate_zakat/1" do
    test "calculates correct zakat amount for eligible wealth" do
      # ✅ Test behavior (input -> output)
      attrs = %{
        user_id: "user-123",
        wealth: Decimal.new("10000"),
        nisab: Decimal.new("5000"),
        wealth_type: "cash"
      }

      # ✅ Test public API
      assert {:ok, calculation} = Zakat.calculate_zakat(attrs)

      # ✅ Verify behavior
      assert calculation.zakat_amount == Decimal.new("250")
      assert calculation.eligible == true
    end

    test "returns zero zakat for wealth below nisab" do
      # ✅ Test edge case behavior
      attrs = %{
        user_id: "user-123",
        wealth: Decimal.new("4000"),
        nisab: Decimal.new("5000"),
        wealth_type: "cash"
      }

      assert {:ok, calculation} = Zakat.calculate_zakat(attrs)

      # ✅ Verify expected behavior
      assert calculation.zakat_amount == Decimal.new("0")
      assert calculation.eligible == false
    end

    test "validates required fields" do
      # ✅ Test error behavior
      attrs = %{wealth: Decimal.new("10000")}

      assert {:error, :missing_required_params} = Zakat.calculate_zakat(attrs)
    end
  end
end
```

### ❌ FAIL - Synchronous Tests

**Problem**: All tests run synchronously, making test suite slow.

```elixir
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase  # ❌ Defaults to async: false

  # All tests run one at a time - slow!
  test "test 1", do: ...
  test "test 2", do: ...
  test "test 3", do: ...
  # ... 100 more tests
end
```

### ✅ PASS - Async Tests

```elixir
defmodule OsePlatform.ZakatTest do
  # ✅ Enable async tests (safe because of SQL Sandbox)
  use OsePlatform.DataCase, async: true

  # Tests run in parallel - fast!
  test "test 1", do: ...
  test "test 2", do: ...
  test "test 3", do: ...
end

# ❌ Don't use async if test has side effects
defmodule OsePlatform.EmailTest do
  use OsePlatform.DataCase  # async: false (default)

  # Test sends actual emails - cannot run in parallel
  test "sends email notification" do
    # Side effect - must run synchronously
  end
end
```

### ❌ FAIL - Shared Database State

**Problem**: Tests pollute database and affect each other.

```elixir
# test/support/data_case.ex
defmodule OsePlatform.DataCase do
  use ExUnit.CaseTemplate

  setup _tags do
    # ❌ No SQL Sandbox - tests share database!
    :ok
  end
end

# Tests interfere with each other
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase

  test "creates calculation" do
    # Creates record in shared database
    Zakat.calculate_zakat(attrs)
  end

  test "lists calculations" do
    # ❌ Sees records from previous test!
    calculations = Zakat.list_calculations("user-123")
    assert length(calculations) == 1  # Flaky! Depends on test order
  end
end
```

**Issues**:

- Tests affect each other
- Order-dependent failures
- Flaky tests
- Cannot run in parallel

### ✅ PASS - Use SQL Sandbox

```elixir
# test/support/data_case.ex
defmodule OsePlatform.DataCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      alias OsePlatform.Repo

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import OsePlatform.DataCase
    end
  end

  setup tags do
    # ✅ Use SQL Sandbox for test isolation
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(OsePlatform.Repo, shared: not tags[:async])

    on_exit(fn ->
      Ecto.Adapters.SQL.Sandbox.stop_owner(pid)
    end)

    :ok
  end
end

# ✅ Tests are isolated
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase, async: true

  test "creates calculation" do
    # Creates record in isolated transaction
    Zakat.calculate_zakat(attrs)
  end

  test "lists calculations" do
    # ✅ Clean database - no interference!
    calculations = Zakat.list_calculations("user-123")
    assert length(calculations) == 0  # Predictable!
  end
end
```

## Related Documentation

- **[Phoenix Idioms](idioms.md)** - Idiomatic patterns
- **[Phoenix Best Practices](best-practices.md)** - Production standards
- **[Contexts](contexts.md)** - Context design patterns
- **[LiveView](liveview.md)** - LiveView best practices
- **[Testing](testing.md)** - Testing strategies

---

**Phoenix Version**: 1.7+
**Elixir Version**: 1.14+
