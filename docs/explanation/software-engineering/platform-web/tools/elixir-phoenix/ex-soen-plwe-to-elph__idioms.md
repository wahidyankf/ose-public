---
title: "Phoenix Idioms"
description: Phoenix-specific patterns and idiomatic framework usage
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - idioms
  - patterns
  - contexts
  - liveview
  - channels
related:
  - ./ex-soen-plwe-elph__best-practices.md
  - ./ex-soen-plwe-elph__anti-patterns.md
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
updated: 2026-01-25
---

### Core Phoenix Patterns

**Context Organization**:

- [Contexts as API Boundaries](#1-contexts-as-api-boundaries) - Organizing business logic
- [Schema and Changeset Patterns](#2-schema-and-changeset-patterns) - Data validation
- [Query Composition](#3-ecto-query-composition) - Building queries functionally

**Real-Time Features**:

- [Phoenix Channels](#4-phoenix-channels-for-real-time) - WebSocket communication
- [Phoenix LiveView](#5-phoenix-liveview-patterns) - Server-rendered interactivity
- [PubSub Broadcasting](#6-pubsub-broadcasting) - Event distribution

**Functional Patterns**:

- [Pipe Operator](#7-pipe-operator-for-data-transformation) - Data transformation chains
- [Pattern Matching](#8-pattern-matching-in-controllers) - Control flow
- [With Statement](#9-with-statement-for-error-handling) - Error handling

**Application Architecture**:

- [Supervision Trees](#10-supervision-trees) - Fault tolerance
- [GenServer for State](#11-genserver-for-stateful-processes) - State management

### Related Documentation

- [Best Practices](ex-soen-plwe-to-elph__best-practices.md)
- [Anti-Patterns](ex-soen-plwe-to-elph__anti-patterns.md)
- [Contexts](ex-soen-plwe-to-elph__contexts.md)
- [LiveView](ex-soen-plwe-to-elph__liveview.md)
- [Channels](ex-soen-plwe-to-elph__channels.md)

## Overview

Phoenix idioms are established patterns that leverage the framework's features and Elixir's functional programming capabilities. These patterns align with Phoenix's philosophy of developer productivity while maintaining explicitness, fault tolerance, and scalability.

This guide focuses on **Phoenix 1.7+ idioms** with Elixir 1.14+, incorporating examples from Islamic financial domains including Zakat calculation, Murabaha contracts, and donation management.

### Why Phoenix Idioms Matter

- **Productivity**: Idiomatic Phoenix reduces boilerplate and accelerates development
- **Maintainability**: Following conventions makes code easier to understand
- **Fault Tolerance**: Built-in supervision and recovery patterns
- **Scalability**: Patterns designed for massive concurrency
- **Real-Time**: Native support for WebSockets and live updates

### Target Audience

This document targets developers building Phoenix applications in the open-sharia-enterprise platform, particularly those working on real-time financial services and domain-driven design implementations.

### 1. Contexts as API Boundaries

**Pattern**: Use contexts to group related functionality and provide clean API boundaries.

**Idiom**: Contexts are your application's public API - keep them cohesive and well-defined.

**Example - Zakat Context**:

```elixir
defmodule OsePlatform.Zakat do
  @moduledoc """
  The Zakat context - handles all Zakat-related operations.
  """

  import Ecto.Query, warn: false
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.Calculation

  @doc """
  Creates a new Zakat calculation.

  ## Examples

      iex> create_calculation(%{wealth: 10000, nisab: 5000})
      {:ok, %Calculation{}}

      iex> create_calculation(%{wealth: -100})
      {:error, %Ecto.Changeset{}}
  """
  def create_calculation(attrs \\ %{}) do
    %Calculation{}
    |> Calculation.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Gets a single calculation.

  Raises `Ecto.NoResultsError` if the Calculation does not exist.
  """
  def get_calculation!(id), do: Repo.get!(Calculation, id)

  @doc """
  Returns the list of calculations for a user.
  """
  def list_user_calculations(user_id) do
    Calculation
    |> where([c], c.user_id == ^user_id)
    |> order_by([c], desc: c.calculation_date)
    |> Repo.all()
  end

  @doc """
  Updates a calculation.
  """
  def update_calculation(%Calculation{} = calculation, attrs) do
    calculation
    |> Calculation.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a calculation.
  """
  def delete_calculation(%Calculation{} = calculation) do
    Repo.delete(calculation)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking calculation changes.
  """
  def change_calculation(%Calculation{} = calculation, attrs \\ %{}) do
    Calculation.changeset(calculation, attrs)
  end
end
```

**Context Organization**:

```
lib/ose_platform/
├── zakat/                    # Zakat context
│   ├── calculation.ex        # Schema
│   ├── queries.ex            # Complex queries
│   └── calculators.ex        # Business logic
├── donations/                # Donations context
│   ├── donation.ex
│   ├── donor.ex
│   └── campaigns.ex
└── murabaha/                 # Murabaha context
    ├── contract.ex
    ├── payment.ex
    └── schedules.ex
```

**Benefits**:

- Clear API boundaries between business domains
- Easy to test - mock entire contexts
- Prevents tight coupling between domains
- Natural fit for bounded contexts in DDD

### 2. Schema and Changeset Patterns

**Pattern**: Use schemas to define data structures and changesets for validation and casting.

**Idiom**: Schemas define structure, changesets define validation rules.

**Schema Definition**:

```elixir
defmodule OsePlatform.Zakat.Calculation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "zakat_calculations" do
    field :user_id, :binary_id
    field :wealth, :decimal
    field :nisab, :decimal
    field :zakat_amount, :decimal
    field :eligible, :boolean, default: false
    field :calculation_date, :date
    field :notes, :string

    timestamps()
  end

  @doc false
  def changeset(calculation, attrs) do
    calculation
    |> cast(attrs, [:user_id, :wealth, :nisab, :calculation_date, :notes])
    |> validate_required([:user_id, :wealth, :nisab, :calculation_date])
    |> validate_number(:wealth, greater_than_or_equal_to: 0)
    |> validate_number(:nisab, greater_than: 0)
    |> calculate_zakat()
    |> determine_eligibility()
  end

  defp calculate_zakat(changeset) do
    case {get_field(changeset, :wealth), get_field(changeset, :nisab)} do
      {wealth, nisab} when is_number(wealth) and is_number(nisab) and wealth >= nisab ->
        zakat = Decimal.mult(wealth, Decimal.new("0.025"))
        put_change(changeset, :zakat_amount, zakat)

      _ ->
        put_change(changeset, :zakat_amount, Decimal.new(0))
    end
  end

  defp determine_eligibility(changeset) do
    wealth = get_field(changeset, :wealth)
    nisab = get_field(changeset, :nisab)

    eligible = wealth != nil and nisab != nil and Decimal.compare(wealth, nisab) != :lt

    put_change(changeset, :eligible, eligible)
  end
end
```

**Multiple Changesets for Different Operations**:

```elixir
defmodule OsePlatform.Murabaha.Contract do
  use Ecto.Schema
  import Ecto.Changeset

  schema "murabaha_contracts" do
    field :asset_cost, :decimal
    field :profit_rate, :decimal
    field :term_months, :integer
    field :status, Ecto.Enum, values: [:pending, :active, :completed, :cancelled]
    field :monthly_payment, :decimal

    has_many :payments, OsePlatform.Murabaha.Payment

    timestamps()
  end

  # Changeset for creating new contracts
  def create_changeset(contract, attrs) do
    contract
    |> cast(attrs, [:asset_cost, :profit_rate, :term_months])
    |> validate_required([:asset_cost, :profit_rate, :term_months])
    |> validate_number(:asset_cost, greater_than: 0)
    |> validate_number(:profit_rate, greater_than: 0, less_than_or_equal_to: 1)
    |> validate_number(:term_months, greater_than: 0, less_than_or_equal_to: 360)
    |> calculate_monthly_payment()
    |> put_change(:status, :pending)
  end

  # Changeset for activating contracts
  def activate_changeset(contract, attrs \\ %{}) do
    contract
    |> cast(attrs, [])
    |> validate_required([])
    |> validate_status(:pending)
    |> put_change(:status, :active)
  end

  # Changeset for completing contracts
  def complete_changeset(contract, attrs \\ %{}) do
    contract
    |> cast(attrs, [])
    |> validate_status(:active)
    |> put_change(:status, :completed)
  end

  defp calculate_monthly_payment(changeset) do
    case {get_field(changeset, :asset_cost),
          get_field(changeset, :profit_rate),
          get_field(changeset, :term_months)} do
      {cost, rate, months} when not is_nil(cost) and not is_nil(rate) and not is_nil(months) ->
        total = Decimal.mult(cost, Decimal.add(1, rate))
        monthly = Decimal.div(total, months)
        put_change(changeset, :monthly_payment, monthly)

      _ ->
        changeset
    end
  end

  defp validate_status(changeset, expected_status) do
    if get_field(changeset, :status) == expected_status do
      changeset
    else
      add_error(changeset, :status, "must be #{expected_status}")
    end
  end
end
```

### 3. Ecto Query Composition

**Pattern**: Build queries functionally by composing small, reusable query fragments.

**Idiom**: Queries are data - compose them with pipes.

**Query Module**:

```elixir
defmodule OsePlatform.Zakat.Queries do
  import Ecto.Query
  alias OsePlatform.Zakat.Calculation

  @doc """
  Base query for calculations.
  """
  def base do
    from c in Calculation, as: :calculation
  end

  @doc """
  Filter by user.
  """
  def by_user(query \\ base(), user_id) do
    where(query, [calculation: c], c.user_id == ^user_id)
  end

  @doc """
  Filter by eligibility.
  """
  def eligible(query \\ base(), eligible \\ true) do
    where(query, [calculation: c], c.eligible == ^eligible)
  end

  @doc """
  Filter by date range.
  """
  def between_dates(query \\ base(), start_date, end_date) do
    query
    |> where([calculation: c], c.calculation_date >= ^start_date)
    |> where([calculation: c], c.calculation_date <= ^end_date)
  end

  @doc """
  Order by calculation date descending.
  """
  def recent_first(query \\ base()) do
    order_by(query, [calculation: c], desc: c.calculation_date)
  end

  @doc """
  Limit results.
  """
  def limit_results(query, limit) do
    limit(query, ^limit)
  end
end
```

**Using Query Composition**:

```elixir
defmodule OsePlatform.Zakat do
  alias OsePlatform.Zakat.Queries
  alias OsePlatform.Repo

  def list_recent_eligible_calculations(user_id, limit \\ 10) do
    Queries.base()
    |> Queries.by_user(user_id)
    |> Queries.eligible()
    |> Queries.recent_first()
    |> Queries.limit_results(limit)
    |> Repo.all()
  end

  def list_calculations_in_range(user_id, start_date, end_date) do
    Queries.base()
    |> Queries.by_user(user_id)
    |> Queries.between_dates(start_date, end_date)
    |> Queries.recent_first()
    |> Repo.all()
  end
end
```

### 4. Phoenix Channels for Real-Time

**Pattern**: Use Phoenix Channels for bidirectional WebSocket communication.

**Idiom**: Channels handle real-time events - authenticate on join, broadcast selectively.

**Channel Implementation**:

```elixir
defmodule OsePlatformWeb.DonationChannel do
  use OsePlatformWeb, :channel

  alias OsePlatform.Donations
  alias Phoenix.PubSub

  @impl true
  def join("donation:lobby", _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def join("donation:campaign:" <> campaign_id, payload, socket) do
    if authorized?(payload, campaign_id) do
      send(self(), :after_join)
      {:ok, assign(socket, :campaign_id, campaign_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    campaign_id = socket.assigns.campaign_id

    # Send current campaign stats on join
    stats = Donations.get_campaign_stats(campaign_id)
    push(socket, "campaign_stats", stats)

    # Subscribe to campaign updates
    PubSub.subscribe(OsePlatform.PubSub, "campaigns:#{campaign_id}")

    {:noreply, socket}
  end

  @impl true
  def handle_in("new_donation", %{"amount" => amount}, socket) do
    campaign_id = socket.assigns.campaign_id
    user_id = socket.assigns.user_id

    case Donations.create_donation(%{
           campaign_id: campaign_id,
           user_id: user_id,
           amount: amount
         }) do
      {:ok, donation} ->
        # Broadcast to all subscribers
        broadcast!(socket, "donation_received", %{
          amount: donation.amount,
          total: Donations.get_campaign_total(campaign_id)
        })

        {:reply, {:ok, %{donation_id: donation.id}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset_errors(changeset)}}, socket}
    end
  end

  # Handle PubSub messages
  @impl true
  def handle_info({:campaign_updated, stats}, socket) do
    push(socket, "campaign_stats", stats)
    {:noreply, socket}
  end

  defp authorized?(_payload, _campaign_id) do
    # Implement authorization logic
    true
  end

  defp changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
```

### 5. Phoenix LiveView Patterns

**Pattern**: Use LiveView for interactive UIs without JavaScript.

**Idiom**: LiveView maintains state on the server - think stateful components.

**LiveView Module**:

```elixir
defmodule OsePlatformWeb.ZakatCalculatorLive do
  use OsePlatformWeb, :live_view

  alias OsePlatform.Zakat

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:calculation, nil)
     |> assign(:form, to_form(Zakat.change_calculation(%Zakat.Calculation{})))}
  end

  @impl true
  def handle_event("validate", %{"calculation" => params}, socket) do
    changeset =
      %Zakat.Calculation{}
      |> Zakat.Calculation.changeset(params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, :form, to_form(changeset))}
  end

  @impl true
  def handle_event("calculate", %{"calculation" => params}, socket) do
    case Zakat.create_calculation(params) do
      {:ok, calculation} ->
        {:noreply,
         socket
         |> assign(:calculation, calculation)
         |> put_flash(:info, "Zakat calculated successfully")
         |> push_navigate(to: ~p"/zakat/#{calculation.id}")}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign(socket, :form, to_form(changeset))}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Zakat Calculator</h1>

      <.form for={@form} phx-change="validate" phx-submit="calculate">
        <.input field={@form[:wealth]} label="Wealth (USD)" type="number" step="0.01" />
        <.input field={@form[:nisab]} label="Nisab (USD)" type="number" step="0.01" />
        <.input field={@form[:calculation_date]} label="Calculation Date" type="date" />

        <.button phx-disable-with="Calculating...">Calculate Zakat</.button>
      </.form>

      <%= if @calculation do %>
        <div class="mt-6 p-4 bg-green-100 rounded">
          <h2 class="text-xl font-semibold">Result</h2>
          <p>Zakat Amount: $<%= @calculation.zakat_amount %></p>
          <p>Eligible: <%= if @calculation.eligible, do: "Yes", else: "No" %></p>
        </div>
      <% end %>
    </div>
    """
  end
end
```

**LiveView with Real-Time Updates**:

```elixir
defmodule OsePlatformWeb.CampaignLive.Show do
  use OsePlatformWeb, :live_view

  alias OsePlatform.Donations
  alias Phoenix.PubSub

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    campaign = Donations.get_campaign!(id)

    if connected?(socket) do
      PubSub.subscribe(OsePlatform.PubSub, "campaigns:#{id}")
    end

    {:ok,
     socket
     |> assign(:campaign, campaign)
     |> assign(:total_raised, Donations.get_campaign_total(id))
     |> assign(:recent_donations, Donations.list_recent_donations(id, 10))}
  end

  @impl true
  def handle_info({:donation_received, donation}, socket) do
    {:noreply,
     socket
     |> update(:total_raised, &Decimal.add(&1, donation.amount))
     |> update(:recent_donations, fn donations ->
       [donation | Enum.take(donations, 9)]
     end)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="campaign-show">
      <h1><%= @campaign.name %></h1>
      <div class="progress">
        <p>Raised: $<%= @total_raised %> / $<%= @campaign.goal %></p>
        <div class="progress-bar" style={"width: #{progress_percentage(@total_raised, @campaign.goal)}%"}></div>
      </div>

      <div class="recent-donations">
        <h2>Recent Donations</h2>
        <%= for donation <- @recent_donations do %>
          <div class="donation" id={"donation-#{donation.id}"}>
            <span>$<%= donation.amount %></span>
            <span><%= relative_time(donation.inserted_at) %></span>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp progress_percentage(raised, goal) do
    Decimal.div(raised, goal)
    |> Decimal.mult(100)
    |> Decimal.round(2)
    |> Decimal.to_float()
  end

  defp relative_time(datetime) do
    # Implement relative time display
    "#{DateTime.diff(DateTime.utc_now(), datetime, :second)}s ago"
  end
end
```

### 6. PubSub Broadcasting

**Pattern**: Use Phoenix PubSub for broadcasting events across the application.

**Idiom**: Publish events locally, subscribe where needed - built for distribution.

**Publishing Events**:

```elixir
defmodule OsePlatform.Donations do
  alias Phoenix.PubSub

  def create_donation(attrs) do
    with {:ok, donation} <- insert_donation(attrs) do
      # Broadcast to campaign channel
      PubSub.broadcast(
        OsePlatform.PubSub,
        "campaigns:#{donation.campaign_id}",
        {:donation_received, donation}
      )

      # Broadcast to global donations channel
      PubSub.broadcast(
        OsePlatform.PubSub,
        "donations:lobby",
        {:new_donation, donation}
      )

      {:ok, donation}
    end
  end
end
```

**Subscribing to Events**:

```elixir
defmodule OsePlatformWeb.DashboardLive do
  use OsePlatformWeb, :live_view

  alias Phoenix.PubSub

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Subscribe to multiple topics
      PubSub.subscribe(OsePlatform.PubSub, "donations:lobby")
      PubSub.subscribe(OsePlatform.PubSub, "campaigns:updates")
    end

    {:ok, assign(socket, :recent_activity, [])}
  end

  @impl true
  def handle_info({:new_donation, donation}, socket) do
    {:noreply,
     update(socket, :recent_activity, fn activity ->
       [format_donation(donation) | Enum.take(activity, 19)]
     end)}
  end

  @impl true
  def handle_info({:campaign_updated, campaign}, socket) do
    {:noreply,
     update(socket, :recent_activity, fn activity ->
       [format_campaign_update(campaign) | Enum.take(activity, 19)]
     end)}
  end

  defp format_donation(donation) do
    %{type: :donation, amount: donation.amount, timestamp: DateTime.utc_now()}
  end

  defp format_campaign_update(campaign) do
    %{type: :campaign_update, name: campaign.name, timestamp: DateTime.utc_now()}
  end
end
```

### 7. Pipe Operator for Data Transformation

**Pattern**: Use the pipe operator to create readable data transformation pipelines.

**Idiom**: Data flows through pipes - read top to bottom, left to right.

**Example - Report Generation**:

```elixir
defmodule OsePlatform.Reports.ZakatReport do
  alias OsePlatform.Zakat

  def generate_annual_report(user_id, year) do
    user_id
    |> Zakat.list_calculations_for_year(year)
    |> filter_eligible()
    |> calculate_totals()
    |> group_by_month()
    |> add_summary_statistics()
    |> format_report()
  end

  defp filter_eligible(calculations) do
    Enum.filter(calculations, & &1.eligible)
  end

  defp calculate_totals(calculations) do
    total = Enum.reduce(calculations, Decimal.new(0), fn calc, acc ->
      Decimal.add(acc, calc.zakat_amount)
    end)

    %{calculations: calculations, total: total}
  end

  defp group_by_month(%{calculations: calculations} = report) do
    by_month =
      calculations
      |> Enum.group_by(fn calc ->
        Date.beginning_of_month(calc.calculation_date)
      end)
      |> Enum.map(fn {month, calcs} ->
        {month, %{
          count: length(calcs),
          total: Enum.reduce(calcs, Decimal.new(0), &Decimal.add(&2, &1.zakat_amount))
        }}
      end)
      |> Enum.into(%{})

    Map.put(report, :by_month, by_month)
  end

  defp add_summary_statistics(%{calculations: calculations} = report) do
    stats = %{
      total_calculations: length(calculations),
      average_wealth: calculate_average(calculations, :wealth),
      average_zakat: calculate_average(calculations, :zakat_amount)
    }

    Map.put(report, :statistics, stats)
  end

  defp format_report(report) do
    %{
      year: report.year,
      total_zakat: Decimal.to_string(report.total),
      monthly_breakdown: format_monthly(report.by_month),
      statistics: report.statistics
    }
  end

  defp calculate_average(calculations, field) do
    if length(calculations) > 0 do
      total = Enum.reduce(calculations, Decimal.new(0), &Decimal.add(&2, Map.get(&1, field)))
      Decimal.div(total, length(calculations))
    else
      Decimal.new(0)
    end
  end

  defp format_monthly(by_month) do
    by_month
    |> Enum.map(fn {month, data} ->
      %{
        month: Calendar.strftime(month, "%B %Y"),
        count: data.count,
        total: Decimal.to_string(data.total)
      }
    end)
    |> Enum.sort_by(& &1.month)
  end
end
```

### 8. Pattern Matching in Controllers

**Pattern**: Use pattern matching to handle different outcomes explicitly.

**Idiom**: Match on results - make success and failure paths explicit.

**Controller with Pattern Matching**:

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat

  def create(conn, %{"calculation" => calculation_params}) do
    case Zakat.create_calculation(calculation_params) do
      {:ok, calculation} ->
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/zakat/#{calculation}")
        |> render(:show, calculation: calculation)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    case Zakat.get_calculation(id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> render(:error, message: "Calculation not found")

      calculation ->
        render(conn, :show, calculation: calculation)
    end
  end

  def update(conn, %{"id" => id, "calculation" => params}) do
    calculation = Zakat.get_calculation!(id)

    case Zakat.update_calculation(calculation, params) do
      {:ok, updated_calculation} ->
        render(conn, :show, calculation: updated_calculation)

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
```

### 9. With Statement for Error Handling

**Pattern**: Use `with` for chaining operations that can fail.

**Idiom**: With clauses read like a happy path - else catches all errors.

**Complex Business Logic**:

```elixir
defmodule OsePlatform.Murabaha do
  def create_contract_with_payment(user_id, contract_params, payment_params) do
    with {:ok, user} <- get_verified_user(user_id),
         {:ok, contract} <- create_contract(user, contract_params),
         {:ok, schedule} <- generate_payment_schedule(contract),
         {:ok, _payment} <- record_initial_payment(contract, payment_params),
         {:ok, _notification} <- send_confirmation_email(user, contract) do
      {:ok, %{contract: contract, schedule: schedule}}
    else
      {:error, :user_not_verified} ->
        {:error, "User must be verified to create contracts"}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:error, changeset}

      {:error, :payment_failed} = error ->
        # Rollback would happen automatically if using Ecto.Multi
        error

      error ->
        {:error, "Unexpected error: #{inspect(error)}"}
    end
  end

  defp get_verified_user(user_id) do
    case Repo.get(User, user_id) do
      %User{verified: true} = user -> {:ok, user}
      %User{verified: false} -> {:error, :user_not_verified}
      nil -> {:error, :user_not_found}
    end
  end

  # ... other private functions
end
```

**Using Ecto.Multi for Transactional Operations**:

```elixir
defmodule OsePlatform.Murabaha do
  alias Ecto.Multi

  def create_contract_with_schedule(user_id, contract_params) do
    Multi.new()
    |> Multi.run(:user, fn repo, _changes ->
      case repo.get(User, user_id) do
        %User{verified: true} = user -> {:ok, user}
        _ -> {:error, :user_not_verified}
      end
    end)
    |> Multi.insert(:contract, fn %{user: user} ->
      Contract.create_changeset(%Contract{user_id: user.id}, contract_params)
    end)
    |> Multi.insert_all(:payments, Payment, fn %{contract: contract} ->
      generate_payment_entries(contract)
    end)
    |> Multi.run(:notification, fn _repo, %{contract: contract, user: user} ->
      send_confirmation_email(user, contract)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{contract: contract, payments: payments}} ->
        {:ok, %{contract: contract, payments: payments}}

      {:error, _failed_operation, failed_value, _changes_so_far} ->
        {:error, failed_value}
    end
  end

  defp generate_payment_entries(contract) do
    1..contract.term_months
    |> Enum.map(fn month ->
      %{
        contract_id: contract.id,
        amount: contract.monthly_payment,
        due_date: Date.add(contract.start_date, month * 30),
        status: :pending,
        inserted_at: DateTime.utc_now() |> DateTime.truncate(:second),
        updated_at: DateTime.utc_now() |> DateTime.truncate(:second)
      }
    end)
  end
end
```

### 10. Supervision Trees

**Pattern**: Use supervision trees to organize processes and ensure fault tolerance.

**Idiom**: Let it crash - supervisors will restart failed processes.

**Application Supervision Tree**:

```elixir
defmodule OsePlatform.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      OsePlatformWeb.Telemetry,

      # Start the Ecto repository
      OsePlatform.Repo,

      # Start the PubSub system
      {Phoenix.PubSub, name: OsePlatform.PubSub},

      # Start Finch
      {Finch, name: OsePlatform.Finch},

      # Start the Endpoint (http/https)
      OsePlatformWeb.Endpoint,

      # Start custom supervisors
      OsePlatform.Zakat.Supervisor,
      OsePlatform.Donations.Supervisor
    ]

    opts = [strategy: :one_for_one, name: OsePlatform.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

**Domain-Specific Supervisor**:

```elixir
defmodule OsePlatform.Zakat.Supervisor do
  use Supervisor

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children = [
      # Cache for Nisab rates
      {OsePlatform.Zakat.NisabCache, []},

      # Worker for scheduled calculations
      {OsePlatform.Zakat.ScheduledCalculator, []},

      # Registry for calculation sessions
      {Registry, keys: :unique, name: OsePlatform.Zakat.SessionRegistry}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
```

### 11. GenServer for Stateful Processes

**Pattern**: Use GenServer for maintaining state and performing asynchronous work.

**Idiom**: GenServers encapsulate state - communicate via messages.

**GenServer Example - Nisab Rate Cache**:

```elixir
defmodule OsePlatform.Zakat.NisabCache do
  use GenServer
  require Logger

  @refresh_interval :timer.hours(24)

  # Client API

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def get_rate(currency) do
    GenServer.call(__MODULE__, {:get_rate, currency})
  end

  def refresh_rates do
    GenServer.cast(__MODULE__, :refresh_rates)
  end

  # Server Callbacks

  @impl true
  def init(_opts) do
    schedule_refresh()
    {:ok, %{rates: %{}, last_updated: nil}, {:continue, :load_rates}}
  end

  @impl true
  def handle_continue(:load_rates, state) do
    case fetch_rates_from_api() do
      {:ok, rates} ->
        Logger.info("Loaded Nisab rates: #{inspect(Map.keys(rates))}")
        {:noreply, %{state | rates: rates, last_updated: DateTime.utc_now()}}

      {:error, reason} ->
        Logger.error("Failed to load Nisab rates: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_call({:get_rate, currency}, _from, %{rates: rates} = state) do
    rate = Map.get(rates, currency)
    {:reply, rate, state}
  end

  @impl true
  def handle_cast(:refresh_rates, state) do
    case fetch_rates_from_api() do
      {:ok, rates} ->
        Logger.info("Refreshed Nisab rates")
        {:noreply, %{state | rates: rates, last_updated: DateTime.utc_now()}}

      {:error, reason} ->
        Logger.error("Failed to refresh rates: #{inspect(reason)}")
        {:noreply, state}
    end
  end

  @impl true
  def handle_info(:refresh, state) do
    schedule_refresh()
    send(self(), :refresh_rates)
    {:noreply, state}
  end

  # Private Functions

  defp schedule_refresh do
    Process.send_after(self(), :refresh, @refresh_interval)
  end

  defp fetch_rates_from_api do
    # Simulate API call
    {:ok, %{
      "USD" => Decimal.new("5000"),
      "EUR" => Decimal.new("4500"),
      "GBP" => Decimal.new("4000")
    }}
  end
end
```

## Related Documentation

- **[Phoenix Best Practices](ex-soen-plwe-to-elph__best-practices.md)** - Production standards
- **[Phoenix Anti-Patterns](ex-soen-plwe-to-elph__anti-patterns.md)** - Common mistakes
- **[Contexts](ex-soen-plwe-to-elph__contexts.md)** - Context design patterns
- **[LiveView](ex-soen-plwe-to-elph__liveview.md)** - LiveView patterns
- **[Channels](ex-soen-plwe-to-elph__channels.md)** - Real-time communication

---

**Last Updated**: 2026-01-25
**Phoenix Version**: 1.7+
