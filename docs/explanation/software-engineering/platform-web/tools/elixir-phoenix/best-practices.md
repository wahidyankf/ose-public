---
title: "Phoenix Best Practices"
description: Production-ready Phoenix development standards and proven approaches
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - best-practices
  - production
  - code-quality
  - standards
related:
  - idioms.md
  - anti-patterns.md
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Phoenix Best Practices

## Project Organization

- [Project Structure](#project-structure) - Directory and module organization
- [Context Design](#context-design) - Bounded context patterns
- [Dependency Management](#dependency-management) - Mix dependencies

## Code Quality

- [Naming Conventions](#naming-conventions) - Clear, descriptive names
- [Documentation](#documentation) - Module and function docs
- [Type Specifications](#type-specifications) - Typespecs and Dialyzer

## Data and Persistence

- [Schema Design](#schema-design) - Ecto schema patterns
- [Changeset Validation](#changeset-validation) - Data validation
- [Query Optimization](#query-optimization) - Efficient queries
- [Migrations](#migrations) - Database migrations

## API Design

- [REST API Design](#rest-api-design) - RESTful conventions
- [JSON API Standards](#json-api-standards) - Response formats
- [Error Handling](#error-handling) - Error responses

## Real-Time Features

- [Channel Design](#channel-design) - WebSocket patterns
- [LiveView Optimization](#liveview-optimization) - LiveView best practices
- [PubSub Usage](#pubsub-usage) - Event broadcasting

## Security

- [Authentication](#authentication) - User authentication patterns
- [Authorization](#authorization) - Access control
- [Input Validation](#input-validation) - Security boundaries

## Testing

- [Testing Strategy](#testing-strategy) - Test organization
- [Test Data](#test-data) - Fixtures and factories

## Production Readiness

- [Configuration](#configuration) - Runtime configuration
- [Logging](#logging) - Structured logging
- [Monitoring](#monitoring) - Telemetry and metrics
- [Performance](#performance) - Optimization techniques

## Overview

This document provides proven best practices for building production-ready Phoenix applications in the open-sharia-enterprise platform. These practices emphasize maintainability, testability, security, and operational excellence.

### Recommended Directory Organization

```
lib/ose_platform/
├── zakat/                    # Zakat context
│   ├── calculation.ex        # Schema
│   ├── queries.ex           # Query module
│   ├── calculators.ex       # Business logic
│   └── validators.ex        # Custom validators
├── donations/               # Donations context
│   ├── donation.ex
│   ├── donor.ex
│   ├── campaign.ex
│   └── queries.ex
├── murabaha/               # Murabaha context
│   ├── contract.ex
│   ├── payment.ex
│   ├── schedules.ex
│   └── queries.ex
└── shared/                 # Shared kernel
    ├── money.ex           # Value objects
    ├── email.ex
    └── date_helpers.ex

lib/ose_platform_web/
├── controllers/
│   ├── zakat_controller.ex
│   ├── donation_controller.ex
│   └── fallback_controller.ex
├── channels/
│   ├── donation_channel.ex
│   └── user_socket.ex
├── live/
│   ├── zakat_calculator_live.ex
│   └── dashboard_live.ex
├── components/
│   ├── core_components.ex
│   └── zakat_components.ex
├── views/
│   └── error_json.ex
└── router.ex

test/
├── ose_platform/
│   ├── zakat_test.exs
│   └── donations_test.exs
├── ose_platform_web/
│   ├── controllers/
│   └── live/
└── support/
    ├── fixtures.ex
    ├── conn_case.ex
    ├── channel_case.ex
    └── data_case.ex
```

### Keep Contexts Cohesive

**PASS**:

```elixir
defmodule OsePlatform.Zakat do
  @moduledoc """
  The Zakat context handles all Zakat calculation operations.
  """

  import Ecto.Query
  alias OsePlatform.Repo
  alias OsePlatform.Zakat.Calculation

  # Clear, focused API for Zakat operations
  def create_calculation(attrs), do: # ...
  def get_calculation!(id), do: # ...
  def list_user_calculations(user_id), do: # ...
  def update_calculation(calculation, attrs), do: # ...
  def delete_calculation(calculation), do: # ...
end
```

**FAIL - Context coupling**:

```elixir
defmodule OsePlatform.Zakat do
  # ❌ Don't call other contexts directly
  alias OsePlatform.Donations  # Context coupling

  def create_calculation_with_donation(attrs) do
    with {:ok, calculation} <- create_calculation(attrs),
         {:ok, _donation} <- Donations.create_from_zakat(calculation) do
      {:ok, calculation}
    end
  end
end
```

**Use events instead**:

```elixir
defmodule OsePlatform.Zakat do
  def create_calculation(attrs) do
    with {:ok, calculation} <- insert_calculation(attrs) do
      # Publish event instead of calling other context
      Phoenix.PubSub.broadcast(
        OsePlatform.PubSub,
        "zakat",
        {:calculation_created, calculation}
      )

      {:ok, calculation}
    end
  end
end
```

### Expose Minimal API

**PASS**:

```elixir
defmodule OsePlatform.Zakat do
  # Public API - well-documented
  @doc "Creates a Zakat calculation"
  def create_calculation(attrs)

  @doc "Gets a calculation by ID"
  def get_calculation!(id)

  # Private functions
  defp insert_calculation(attrs)
  defp broadcast_event(event)
  defp validate_nisab_threshold(changeset)
end
```

### Use Specific Versions

**PASS - mix.exs**:

```elixir
defp deps do
  [
    # Phoenix
    {:phoenix, "~> 1.7.0"},
    {:phoenix_ecto, "~> 4.4"},
    {:phoenix_live_view, "~> 0.20.0"},

    # Database
    {:ecto_sql, "~> 3.10"},
    {:postgrex, ">= 0.0.0"},

    # JSON
    {:jason, "~> 1.4"},

    # Development
    {:phoenix_live_reload, "~> 1.4", only: :dev},

    # Testing
    {:ex_machina, "~> 2.7", only: :test}
  ]
end
```

### Group Dependencies Logically

```elixir
defp deps do
  phoenix_deps() ++
  ecto_deps() ++
  auth_deps() ++
  dev_deps() ++
  test_deps()
end

defp phoenix_deps do
  [
    {:phoenix, "~> 1.7.0"},
    {:phoenix_html, "~> 3.3"},
    {:phoenix_live_reload, "~> 1.4", only: :dev},
    {:phoenix_live_view, "~> 0.20.0"}
  ]
end

defp ecto_deps do
  [
    {:ecto_sql, "~> 3.10"},
    {:postgrex, ">= 0.0.0"}
  ]
end
```

### Module Names

- **Contexts**: `OsePlatform.Zakat`, `OsePlatform.Donations`
- **Schemas**: `OsePlatform.Zakat.Calculation`, `OsePlatform.Donations.Donation`
- **Controllers**: `OsePlatformWeb.ZakatController`
- **Channels**: `OsePlatformWeb.DonationChannel`
- **LiveViews**: `OsePlatformWeb.ZakatCalculatorLive`

### Function Names

```elixir
defmodule OsePlatform.Zakat do
  # Query functions return lists
  def list_calculations(user_id)
  def list_eligible_calculations(user_id)

  # Get functions return single result or nil
  def get_calculation(id)

  # Get! functions raise if not found
  def get_calculation!(id)

  # Create/update/delete return {:ok, result} | {:error, changeset}
  def create_calculation(attrs)
  def update_calculation(calculation, attrs)
  def delete_calculation(calculation)

  # Boolean predicates end with ?
  def eligible?(calculation)
  def expired?(calculation)

  # Change functions return changesets
  def change_calculation(calculation, attrs \\ %{})
end
```

### Module Documentation

**PASS**:

```elixir
defmodule OsePlatform.Zakat do
  @moduledoc """
  The Zakat context.

  Handles Zakat calculations, including:
  - Creating and managing calculations
  - Determining Zakat eligibility
  - Calculating Zakat amounts based on Nisab
  - Generating Zakat reports
  """

  @doc """
  Creates a Zakat calculation.

  ## Examples

      iex> create_calculation(%{wealth: 10000, nisab: 5000})
      {:ok, %Calculation{}}

      iex> create_calculation(%{wealth: -100})
      {:error, %Ecto.Changeset{}}

  ## Parameters

    - `attrs` - Map of calculation attributes
      - `:wealth` - Total wealth (required, must be >= 0)
      - `:nisab` - Nisab threshold (required, must be > 0)
      - `:calculation_date` - Date of calculation (required)
  """
  @spec create_calculation(map()) :: {:ok, Calculation.t()} | {:error, Ecto.Changeset.t()}
  def create_calculation(attrs \\ %{}) do
    # Implementation
  end
end
```

### Add Typespecs to Public Functions

```elixir
defmodule OsePlatform.Zakat.Calculation do
  @type t :: %__MODULE__{
    id: Ecto.UUID.t(),
    user_id: Ecto.UUID.t(),
    wealth: Decimal.t(),
    nisab: Decimal.t(),
    zakat_amount: Decimal.t(),
    eligible: boolean(),
    calculation_date: Date.t()
  }
end

defmodule OsePlatform.Zakat do
  alias OsePlatform.Zakat.Calculation

  @spec create_calculation(map()) :: {:ok, Calculation.t()} | {:error, Ecto.Changeset.t()}
  def create_calculation(attrs)

  @spec get_calculation(Ecto.UUID.t()) :: Calculation.t() | nil
  def get_calculation(id)

  @spec list_user_calculations(Ecto.UUID.t()) :: [Calculation.t()]
  def list_user_calculations(user_id)
end
```

### Use Binary IDs

**PASS**:

```elixir
defmodule OsePlatform.Zakat.Calculation do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "zakat_calculations" do
    belongs_to :user, OsePlatform.Accounts.User

    field :wealth, :decimal
    field :nisab, :decimal
    field :zakat_amount, :decimal
    field :eligible, :boolean

    timestamps(type: :utc_datetime)
  end
end
```

### Use Timestamps

```elixir
schema "zakat_calculations" do
  # ... fields

  timestamps(type: :utc_datetime)
end
```

### Explicit Associations

```elixir
schema "murabaha_contracts" do
  belongs_to :user, OsePlatform.Accounts.User
  has_many :payments, OsePlatform.Murabaha.Payment

  # ... fields
end

schema "payments" do
  belongs_to :contract, OsePlatform.Murabaha.Contract

  # ... fields
end
```

### Comprehensive Validation

**PASS**:

```elixir
defmodule OsePlatform.Zakat.Calculation do
  def changeset(calculation, attrs) do
    calculation
    |> cast(attrs, [:user_id, :wealth, :nisab, :calculation_date, :notes])
    |> validate_required([:user_id, :wealth, :nisab, :calculation_date])
    |> validate_number(:wealth, greater_than_or_equal_to: 0,
                                 message: "must be non-negative")
    |> validate_number(:nisab, greater_than: 0,
                                message: "must be positive")
    |> validate_length(:notes, max: 500)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint([:user_id, :calculation_date],
                        name: :unique_user_calculation_per_day)
    |> calculate_zakat()
    |> determine_eligibility()
  end
end
```

### Custom Validators

```elixir
defmodule OsePlatform.Zakat.Calculation do
  import Ecto.Changeset

  def changeset(calculation, attrs) do
    calculation
    |> cast(attrs, [:wealth, :nisab, :calculation_date])
    |> validate_required([:wealth, :nisab, :calculation_date])
    |> validate_calculation_date()
    |> validate_nisab_threshold()
  end

  defp validate_calculation_date(changeset) do
    case get_field(changeset, :calculation_date) do
      nil ->
        changeset

      date ->
        if Date.compare(date, Date.utc_today()) in [:lt, :eq] do
          changeset
        else
          add_error(changeset, :calculation_date, "cannot be in the future")
        end
    end
  end

  defp validate_nisab_threshold(changeset) do
    wealth = get_field(changeset, :wealth)
    nisab = get_field(changeset, :nisab)

    cond do
      is_nil(wealth) or is_nil(nisab) ->
        changeset

      Decimal.compare(nisab, Decimal.new(0)) != :gt ->
        add_error(changeset, :nisab, "must be greater than zero")

      true ->
        changeset
    end
  end
end
```

### Avoid N+1 Queries

**FAIL**:

```elixir
def list_contracts_with_payments do
  contracts = Repo.all(Contract)

  # ❌ N+1 query - one query per contract
  Enum.map(contracts, fn contract ->
    payments = Repo.all(from p in Payment, where: p.contract_id == ^contract.id)
    %{contract: contract, payments: payments}
  end)
end
```

**PASS - Preload**:

```elixir
def list_contracts_with_payments do
  Contract
  |> Repo.all()
  |> Repo.preload(:payments)
end
```

**PASS - Join**:

```elixir
def list_contracts_with_payments do
  from(c in Contract,
    left_join: p in assoc(c, :payments),
    preload: [payments: p]
  )
  |> Repo.all()
end
```

### Use Indexes

```elixir
# In migration
def change do
  create table(:zakat_calculations, primary_key: false) do
    add :id, :binary_id, primary_key: true
    add :user_id, references(:users, type: :binary_id, on_delete: :delete_all)
    add :calculation_date, :date

    timestamps()
  end

  create index(:zakat_calculations, [:user_id])
  create index(:zakat_calculations, [:calculation_date])
  create unique_index(:zakat_calculations, [:user_id, :calculation_date],
                     name: :unique_user_calculation_per_day)
end
```

### Select Only Needed Fields

```elixir
def list_calculation_summaries(user_id) do
  from(c in Calculation,
    where: c.user_id == ^user_id,
    select: %{
      id: c.id,
      zakat_amount: c.zakat_amount,
      calculation_date: c.calculation_date
    }
  )
  |> Repo.all()
end
```

### Always Reversible

**PASS**:

```elixir
defmodule OsePlatform.Repo.Migrations.AddZakatCalculations do
  use Ecto.Migration

  def change do
    create table(:zakat_calculations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all)
      add :wealth, :decimal, precision: 19, scale: 2, null: false
      add :nisab, :decimal, precision: 19, scale: 2, null: false
      add :zakat_amount, :decimal, precision: 19, scale: 2
      add :eligible, :boolean, default: false
      add :calculation_date, :date, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:zakat_calculations, [:user_id])
    create index(:zakat_calculations, [:calculation_date])
  end
end
```

### Data Migrations Separate

```elixir
defmodule OsePlatform.Repo.Migrations.MigrateOldZakatData do
  use Ecto.Migration

  def up do
    execute """
    INSERT INTO zakat_calculations (id, user_id, wealth, nisab, zakat_amount, eligible, calculation_date, inserted_at, updated_at)
    SELECT
      gen_random_uuid(),
      user_id,
      wealth,
      nisab,
      wealth * 0.025,
      wealth >= nisab,
      calculation_date,
      NOW(),
      NOW()
    FROM old_zakat_table
    """
  end

  def down do
    execute "DELETE FROM zakat_calculations WHERE calculation_date < '2026-01-01'"
  end
end
```

### Follow RESTful Conventions

```elixir
defmodule OsePlatformWeb.Router do
  use OsePlatformWeb, :router

  scope "/api/v1", OsePlatformWeb do
    pipe_through :api

    resources "/zakat", ZakatController, only: [:index, :create, :show, :update, :delete]
    resources "/donations", DonationController, only: [:index, :create, :show]

    get "/zakat/:id/report", ZakatController, :report
  end
end
```

### Controller Implementation

```elixir
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat

  action_fallback OsePlatformWeb.FallbackController

  def index(conn, %{"user_id" => user_id}) do
    calculations = Zakat.list_user_calculations(user_id)
    render(conn, :index, calculations: calculations)
  end

  def create(conn, %{"calculation" => params}) do
    with {:ok, calculation} <- Zakat.create_calculation(params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/zakat/#{calculation}")
      |> render(:show, calculation: calculation)
    end
  end

  def show(conn, %{"id" => id}) do
    calculation = Zakat.get_calculation!(id)
    render(conn, :show, calculation: calculation)
  end

  def update(conn, %{"id" => id, "calculation" => params}) do
    calculation = Zakat.get_calculation!(id)

    with {:ok, calculation} <- Zakat.update_calculation(calculation, params) do
      render(conn, :show, calculation: calculation)
    end
  end

  def delete(conn, %{"id" => id}) do
    calculation = Zakat.get_calculation!(id)

    with {:ok, _calculation} <- Zakat.delete_calculation(calculation) do
      send_resp(conn, :no_content, "")
    end
  end
end
```

### JSON View

```elixir
defmodule OsePlatformWeb.ZakatJSON do
  alias OsePlatform.Zakat.Calculation

  def index(%{calculations: calculations}) do
    %{data: for(calculation <- calculations, do: data(calculation))}
  end

  def show(%{calculation: calculation}) do
    %{data: data(calculation)}
  end

  defp data(%Calculation{} = calculation) do
    %{
      id: calculation.id,
      user_id: calculation.user_id,
      wealth: calculation.wealth,
      nisab: calculation.nisab,
      zakat_amount: calculation.zakat_amount,
      eligible: calculation.eligible,
      calculation_date: calculation.calculation_date,
      inserted_at: calculation.inserted_at,
      updated_at: calculation.updated_at
    }
  end
end
```

### Fallback Controller

```elixir
defmodule OsePlatformWeb.FallbackController do
  use OsePlatformWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: OsePlatformWeb.ErrorJSON)
    |> render(:error, changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: OsePlatformWeb.ErrorJSON)
    |> render(:"404")
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: OsePlatformWeb.ErrorJSON)
    |> render(:"401")
  end
end
```

### Error JSON View

```elixir
defmodule OsePlatformWeb.ErrorJSON do
  def render("error.json", %{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  def render(template, _assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template)}}
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, &translate_error/1)
  end
end
```

### Authentication on Join

```elixir
defmodule OsePlatformWeb.DonationChannel do
  use OsePlatformWeb, :channel

  def join("donation:lobby", _params, socket) do
    {:ok, socket}
  end

  def join("donation:campaign:" <> campaign_id, %{"token" => token}, socket) do
    case verify_token(token) do
      {:ok, user_id} ->
        {:ok,
         socket
         |> assign(:user_id, user_id)
         |> assign(:campaign_id, campaign_id)}

      {:error, _} ->
        {:error, %{reason: "unauthorized"}}
    end
  end

  defp verify_token(token) do
    # Implement token verification
    {:ok, "user-123"}
  end
end
```

### Reduce Assigns

```elixir
defmodule OsePlatformWeb.ZakatCalculatorLive do
  use OsePlatformWeb, :live_view

  # ❌ Bad - sends entire list on every update
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :calculations, Zakat.list_all_calculations())}
  end

  # ✅ Good - only send IDs, fetch full data when needed
  def mount(_params, _session, socket) do
    calculation_ids = Zakat.list_calculation_ids()
    {:ok, assign(socket, :calculation_ids, calculation_ids)}
  end

  def handle_event("show_details", %{"id" => id}, socket) do
    calculation = Zakat.get_calculation!(id)
    {:noreply, assign(socket, :selected_calculation, calculation)}
  end
end
```

### Use Temporary Assigns

```elixir
def mount(_params, _session, socket) do
  {:ok,
   socket
   |> assign(:form, to_form(%{}))
   |> assign(:calculation, nil)
   |> temporary_assigns([calculation: nil])}  # Don't keep in memory after render
end
```

### Runtime Configuration

**config/runtime.exs**:

```elixir
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      """

  config :ose_platform, OsePlatform.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      """

  config :ose_platform, OsePlatformWeb.Endpoint,
    http: [
      ip: {0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "4000")
    ],
    secret_key_base: secret_key_base
end
```

### Structured Logging

```elixir
require Logger

def create_calculation(attrs) do
  Logger.info("Creating Zakat calculation",
    user_id: attrs["user_id"],
    wealth: attrs["wealth"]
  )

  case insert_calculation(attrs) do
    {:ok, calculation} ->
      Logger.info("Zakat calculation created",
        calculation_id: calculation.id,
        zakat_amount: calculation.zakat_amount
      )
      {:ok, calculation}

    {:error, changeset} ->
      Logger.warning("Failed to create calculation",
        errors: changeset_errors(changeset)
      )
      {:error, changeset}
  end
end
```

### Telemetry Events

```elixir
defmodule OsePlatform.Telemetry do
  use Supervisor

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def periodic_measurements do
    [
      {OsePlatform.Zakat, :count_calculations, []},
      {:process_info, event: [:ose_platform, :process_info]}
    ]
  end
end
```

### Test Organization

```
test/
├── ose_platform/
│   ├── zakat_test.exs           # Context tests
│   ├── zakat/
│   │   └── calculation_test.exs  # Schema tests
├── ose_platform_web/
│   ├── controllers/
│   │   └── zakat_controller_test.exs
│   ├── channels/
│   │   └── donation_channel_test.exs
│   └── live/
│       └── zakat_calculator_live_test.exs
└── support/
    ├── fixtures/
    │   └── zakat_fixtures.ex
    ├── conn_case.ex
    ├── channel_case.ex
    └── data_case.ex
```

### Context Tests

```elixir
defmodule OsePlatform.ZakatTest do
  use OsePlatform.DataCase

  alias OsePlatform.Zakat

  describe "create_calculation/1" do
    test "creates calculation with valid data" do
      attrs = %{
        user_id: Ecto.UUID.generate(),
        wealth: Decimal.new("10000"),
        nisab: Decimal.new("5000"),
        calculation_date: Date.utc_today()
      }

      assert {:ok, calculation} = Zakat.create_calculation(attrs)
      assert calculation.wealth == Decimal.new("10000")
      assert calculation.zakat_amount == Decimal.new("250.00")
      assert calculation.eligible == true
    end

    test "returns error with invalid data" do
      attrs = %{wealth: Decimal.new("-100")}

      assert {:error, changeset} = Zakat.create_calculation(attrs)
      assert "must be non-negative" in errors_on(changeset).wealth
    end
  end
end
```

### Connection Pooling

**config/prod.exs**:

```elixir
config :ose_platform, OsePlatform.Repo,
  pool_size: 20,
  queue_target: 5000,
  queue_interval: 1000
```

### Caching

```elixir
defmodule OsePlatform.Zakat.NisabRateCache do
  use GenServer

  @refresh_interval :timer.hours(24)

  # ... GenServer implementation with caching
end
```

## Related Documentation

- **[Phoenix Idioms](idioms.md)** - Framework patterns
- **[Phoenix Anti-Patterns](anti-patterns.md)** - Common mistakes
- **[Data Access](data-access.md)** - Ecto patterns
- **[Security](security.md)** - Security practices

---

**Phoenix Version**: 1.7+
