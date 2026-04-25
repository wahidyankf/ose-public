---
title: "Elixir Framework Integration Standards"
description: OSE Platform standards for Phoenix, Ecto, Nx, Broadway, and web services integration with prescriptive patterns and mandatory requirements
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - phoenix
  - ecto
  - broadway
  - nx
  - web-services
  - framework-integration
  - rest-api
  - liveview
  - graphql
  - database-toolkit
  - data-pipelines
related:
  - ./coding-standards.md
  - ./testing-standards.md
  - ./security-standards.md
  - ./concurrency-standards.md
principles:
  - explicit-over-implicit
  - automation-over-manual
  - pure-functions
created: 2026-02-05
---

# Framework Integration Standards

**This document establishes authoritative standards** for integrating Phoenix, Ecto, Broadway, Nx, and web services frameworks in OSE Platform Elixir applications. All framework integration MUST follow these mandatory standards.

**Architecture Philosophy**: "Standard Library → Limitations → Framework" progression. Understand Plug foundation before Phoenix, understand Elixir data structures before Ecto, understand GenServer before Broadway.

**Quick Navigation**:

- [Part 1: Standard Library HTTP (Baseline)](#part-1-standard-library-http-baseline)
- [Part 2: Phoenix Framework (Web Applications)](#part-2-phoenix-framework-web-applications)
- [Part 3: Phoenix LiveView (Real-Time UI)](#part-3-phoenix-liveview-real-time-ui)
- [Part 4: Phoenix Channels (WebSocket Communication)](#part-4-phoenix-channels-websocket-communication)
- [Part 5: Ecto Database Toolkit (Persistence)](#part-5-ecto-database-toolkit-persistence)
- [Part 6: Advanced Data Processing](#part-6-advanced-data-processing)

## Part 1: Standard Library HTTP (Baseline)

**Philosophy**: MUST understand Plug before using Phoenix. Phoenix is built on Plug.

### 📊 Plug - HTTP Foundation

**What it is**: Composable HTTP middleware specification for Elixir.

**MUST understand**:

- Plug is the foundation - Phoenix uses Plug internally
- `Plug.Conn` struct represents request/response
- Plugs are functions that transform connections
- Pipeline execution stops with `halt()`

### ✅ Plug.Conn - Request/Response Handling

```elixir
# PASS - Understanding Conn struct
defmodule MyApp.AuthPlug do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    # Conn has request data
    token = get_req_header(conn, "authorization")

    case validate_token(token) do
      {:ok, user} ->
        # Transform conn: add assigns
        assign(conn, :current_user, user)

      {:error, _reason} ->
        # Transform conn: set status and halt pipeline
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Unauthorized"})
        |> halt()  # MUST halt to stop pipeline
    end
  end

  defp validate_token(_token), do: {:ok, %{id: 1, name: "John"}}
  defp json(conn, data), do: send_resp(conn, conn.status || 200, Jason.encode!(data))
end
```

❌ **FAIL - Not halting after error**:

```elixir
# ❌ WRONG - Missing halt() allows pipeline to continue
def call(conn, _opts) do
  case validate_token(conn) do
    {:error, _} ->
      conn
      |> put_status(:unauthorized)
      # Missing halt() - next plugs execute anyway
  end
end
```

### ✅ Plug.Router - Basic Routing

```elixir
# PASS - Simple Plug router without Phoenix
defmodule MyApp.Router do
  use Plug.Router

  plug :match
  plug :dispatch

  get "/health" do
    send_resp(conn, 200, "OK")
  end

  get "/api/donations/:id" do
    donation = fetch_donation(id)
    send_resp(conn, 200, Jason.encode!(donation))
  end

  post "/api/donations" do
    {:ok, body, conn} = read_body(conn)
    {:ok, params} = Jason.decode(body)

    case create_donation(params) do
      {:ok, donation} ->
        conn
        |> put_status(201)
        |> send_resp(201, Jason.encode!(donation))

      {:error, errors} ->
        conn
        |> put_status(422)
        |> send_resp(422, Jason.encode!(%{errors: errors}))
    end
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp fetch_donation(_id), do: %{id: 1, amount: 10000}
  defp create_donation(_params), do: {:ok, %{id: 1}}
end
```

### 📋 When Standard Library Sufficient vs Phoenix Needed

**Use Plug.Router (Standard Library) when**:

- Simple HTTP APIs (< 10 endpoints)
- Webhooks or callbacks
- Health check servers
- Minimal dependencies required

**Use Phoenix when**:

- ✅ Web applications with HTML rendering
- ✅ Real-time features (LiveView, Channels)
- ✅ Complex routing (nested resources, scopes)
- ✅ Authentication/authorization pipelines
- ✅ WebSocket support required
- ✅ Form validation and error handling
- ✅ Multi-page applications
- ✅ GraphQL APIs

**CRITICAL**: If you use Phoenix, you MUST understand Plug. Phoenix is Plug-based.

## Part 2: Phoenix Framework (Web Applications)

**Mandatory**: Phoenix 1.7+ for all OSE Platform web applications.

### 📊 Phoenix Setup - Mandatory Configuration

**MUST use Phoenix 1.7+ features**:

- ✅ Verified routes (`~p"/path"` not `"/path"`)
- ✅ Phoenix.Component for UI components
- ✅ Function components (not class-based)
- ✅ Tailwind CSS for styling
- ✅ esbuild for JavaScript
- ✅ Context modules for business logic

**Installation**:

```bash
# REQUIRED - Install Phoenix 1.7+
mix archive.install hex phx_new

# Create web application with database
mix phx.new financial_platform --database postgres

# Create API-only (no HTML/assets)
mix phx.new financial_api --no-html --no-assets

# Create with LiveView (recommended for real-time)
mix phx.new financial_live --live
```

### ✅ Router Patterns - Verified Routes

```elixir
# PASS - Phoenix 1.7+ verified routes
defmodule FinancialWeb.Router do
  use FinancialWeb, :router

  # API pipeline - JSON only
  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :protect_from_forgery
  end

  # Browser pipeline - HTML
  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {FinancialWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  # Authentication pipeline
  pipeline :require_auth do
    plug FinancialWeb.Plugs.RequireAuth
  end

  # Public API routes
  scope "/api", FinancialWeb do
    pipe_through :api

    post "/auth/login", AuthController, :login
    post "/auth/register", AuthController, :register
  end

  # Protected API routes
  scope "/api", FinancialWeb do
    pipe_through [:api, :require_auth]

    resources "/donations", DonationController
    resources "/campaigns", CampaignController

    # Nested resources
    resources "/campaigns", CampaignController do
      resources "/donations", CampaignDonationController, only: [:index, :create]
    end
  end

  # Browser routes
  scope "/", FinancialWeb do
    pipe_through [:browser, :require_auth]

    get "/", PageController, :home
    get "/dashboard", DashboardController, :index

    # LiveView routes
    live "/campaigns", CampaignLive.Index, :index
    live "/campaigns/:id", CampaignLive.Show, :show
  end
end
```

❌ **FAIL - String paths (Phoenix 1.6 style)**:

```elixir
# ❌ WRONG - Use ~p sigil, not strings
redirect(conn, to: "/donations/#{id}")

# ✅ CORRECT - Verified routes
redirect(conn, to: ~p"/donations/#{donation}")
```

### ✅ Controllers - Prescriptive Patterns

**MUST follow**: Action fallback pattern for error handling.

```elixir
# PASS - RESTful controller with fallback
defmodule FinancialWeb.DonationController do
  use FinancialWeb, :controller

  alias FinancialPlatform.Donations
  alias FinancialPlatform.Donations.Donation

  # REQUIRED - Fallback controller for {:error, _} tuples
  action_fallback FinancialWeb.FallbackController

  # GET /api/donations
  def index(conn, params) do
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer()

    donations = Donations.list_donations(page: page, per_page: per_page)

    conn
    |> put_status(:ok)
    |> render("index.json", donations: donations)
  end

  # GET /api/donations/:id
  def show(conn, %{"id" => id}) do
    # With fallback controller, just return error tuple
    with {:ok, donation} <- Donations.get_donation(id) do
      render(conn, "show.json", donation: donation)
    end
  end

  # POST /api/donations
  def create(conn, %{"donation" => donation_params}) do
    with {:ok, donation} <- Donations.create_donation(donation_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/donations/#{donation}")
      |> render("show.json", donation: donation)
    end
  end

  # PUT/PATCH /api/donations/:id
  def update(conn, %{"id" => id, "donation" => donation_params}) do
    with {:ok, donation} <- Donations.get_donation(id),
         {:ok, updated} <- Donations.update_donation(donation, donation_params) do
      render(conn, "show.json", donation: updated)
    end
  end

  # DELETE /api/donations/:id
  def delete(conn, %{"id" => id}) do
    with {:ok, donation} <- Donations.get_donation(id),
         {:ok, _} <- Donations.delete_donation(donation) do
      send_resp(conn, :no_content, "")
    end
  end
end
```

**REQUIRED - Fallback Controller**:

```elixir
# PASS - Centralized error handling
defmodule FinancialWeb.FallbackController do
  use Phoenix.Controller

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: FinancialWeb.ErrorJSON)
    |> render(:"404")
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: FinancialWeb.ChangesetJSON)
    |> render("error.json", changeset: changeset)
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: FinancialWeb.ErrorJSON)
    |> render(:"401")
  end

  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: FinancialWeb.ErrorJSON)
    |> render(:"403")
  end
end
```

### ✅ Context Modules - Bounded Context Organization

**MUST use**: Phoenix contexts for business logic separation.

```elixir
# PASS - Context module isolates business logic
defmodule FinancialPlatform.Donations do
  @moduledoc """
  Donation context - manages all donation operations.

  MUST NOT access other contexts' private functions.
  SHOULD use public APIs of other contexts.
  """

  import Ecto.Query, warn: false
  alias FinancialPlatform.Repo
  alias FinancialPlatform.Donations.Donation

  @doc """
  Lists donations with pagination.
  """
  def list_donations(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    offset = (page - 1) * per_page

    Donation
    |> limit(^per_page)
    |> offset(^offset)
    |> order_by([d], desc: d.inserted_at)
    |> Repo.all()
  end

  @doc """
  Gets a single donation.
  """
  def get_donation(id) do
    case Repo.get(Donation, id) do
      nil -> {:error, :not_found}
      donation -> {:ok, donation}
    end
  end

  @doc """
  Creates a donation with validation.
  """
  def create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a donation.
  """
  def update_donation(%Donation{} = donation, attrs) do
    donation
    |> Donation.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a donation.
  """
  def delete_donation(%Donation{} = donation) do
    Repo.delete(donation)
  end
end
```

❌ **FAIL - Controller accessing Repo directly**:

```elixir
# ❌ WRONG - Controller bypassing context
defmodule FinancialWeb.DonationController do
  def index(conn, _params) do
    # ❌ Direct Repo access in controller
    donations = FinancialPlatform.Repo.all(Donation)
    render(conn, "index.json", donations: donations)
  end
end

# ✅ CORRECT - Use context
defmodule FinancialWeb.DonationController do
  def index(conn, _params) do
    donations = Donations.list_donations()
    render(conn, "index.json", donations: donations)
  end
end
```

### ✅ Phoenix Components - HEEx Templates

**MUST use**: Function components with HEEx templates (Phoenix 1.7+).

```elixir
# PASS - Function component for reusable UI
defmodule FinancialWeb.CoreComponents do
  use Phoenix.Component

  @doc """
  Renders a donation card.
  """
  attr :donation, :map, required: true
  attr :class, :string, default: ""

  def donation_card(assigns) do
    ~H"""
    <div class={"donation-card #{@class}"}>
      <h3><%= @donation.donor_name %></h3>
      <p class="amount">
        <%= format_money(@donation.amount, @donation.currency) %>
      </p>
      <p class="status">
        <.badge status={@donation.status} />
      </p>
      <time datetime={@donation.inserted_at}>
        <%= format_date(@donation.inserted_at) %>
      </time>
    </div>
    """
  end

  @doc """
  Renders a status badge.
  """
  attr :status, :atom, required: true

  def badge(assigns) do
    ~H"""
    <span class={"badge badge-#{@status}"}>
      <%= format_status(@status) %>
    </span>
    """
  end

  defp format_money(amount, currency) do
    Money.to_string(Money.new(amount, currency))
  end

  defp format_date(datetime) do
    Calendar.strftime(datetime, "%B %d, %Y")
  end

  defp format_status(:pending), do: "Pending"
  defp format_status(:approved), do: "Approved"
  defp format_status(:rejected), do: "Rejected"
end
```

### ✅ Telemetry Integration - Required Monitoring

**MUST implement**: Telemetry events for monitoring Phoenix applications.

```elixir
# PASS - Telemetry configuration
defmodule FinancialWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      # Telemetry poller for periodic measurements
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      # Phoenix endpoint metrics
      summary("phoenix.endpoint.stop.duration",
        unit: {:native, :millisecond},
        tags: [:route]
      ),

      # Phoenix router metrics
      summary("phoenix.router_dispatch.stop.duration",
        unit: {:native, :millisecond},
        tags: [:route]
      ),

      # Database query metrics
      summary("financial_platform.repo.query.total_time",
        unit: {:native, :millisecond},
        tags: [:source]
      ),

      # VM metrics
      summary("vm.memory.total", unit: {:byte, :megabyte}),
      summary("vm.total_run_queue_lengths.total"),
      summary("vm.total_run_queue_lengths.cpu"),
      summary("vm.total_run_queue_lengths.io")
    ]
  end

  defp periodic_measurements do
    []
  end
end
```

## Part 3: Phoenix LiveView (Real-Time UI)

**Mandatory**: LiveView for real-time interactive UIs without JavaScript complexity.

### 📊 LiveView Setup - Socket and Mount Requirements

**MUST understand**: LiveView lifecycle executes twice (static render → WebSocket mount).

```elixir
# PASS - Complete LiveView lifecycle
defmodule FinancialWeb.CampaignLive.Index do
  use FinancialWeb, :live_view

  alias FinancialPlatform.Campaigns

  # 1. mount/3 - RUNS TWICE (static + connected)
  @impl true
  def mount(_params, _session, socket) do
    # MUST check connected?() for expensive operations
    if connected?(socket) do
      # Only subscribe on WebSocket connection
      Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "campaigns")
    end

    {:ok, assign(socket, campaigns: [], loading: true)}
  end

  # 2. handle_params/3 - Handle URL parameters
  @impl true
  def handle_params(params, _url, socket) do
    page = Map.get(params, "page", "1") |> String.to_integer()

    campaigns = Campaigns.list_campaigns(page: page)

    {:noreply, assign(socket, campaigns: campaigns, loading: false)}
  end

  # 3. render/1 - Render template
  @impl true
  def render(assigns) do
    ~H"""
    <div class="campaigns">
      <h1>Active Campaigns</h1>

      <div :if={@loading}>Loading...</div>

      <.table :if={!@loading} id="campaigns" rows={@campaigns}>
        <:col :let={campaign} label="Name"><%= campaign.name %></:col>
        <:col :let={campaign} label="Goal">
          <%= format_money(campaign.goal_amount, campaign.currency) %>
        </:col>
        <:col :let={campaign} label="Progress">
          <div class="progress-bar">
            <div class="fill" style={"width: #{campaign.progress}%"}></div>
          </div>
          <%= campaign.progress %>%
        </:col>
        <:col :let={campaign} label="Actions">
          <.link navigate={~p"/campaigns/#{campaign}"}>View</.link>
        </:col>
      </.table>
    </div>
    """
  end

  # 4. handle_event/3 - Handle user interactions
  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    case Campaigns.delete_campaign(id) do
      {:ok, _} ->
        {:noreply, put_flash(socket, :info, "Campaign deleted")}

      {:error, _} ->
        {:noreply, put_flash(socket, :error, "Failed to delete campaign")}
    end
  end

  # 5. handle_info/2 - Handle PubSub messages
  @impl true
  def handle_info({:campaign_updated, campaign}, socket) do
    campaigns = Enum.map(socket.assigns.campaigns, fn c ->
      if c.id == campaign.id, do: campaign, else: c
    end)

    {:noreply, assign(socket, campaigns: campaigns)}
  end

  defp format_money(amount, currency) do
    Money.to_string(Money.new(amount, currency))
  end
end
```

❌ **FAIL - Expensive operations in disconnected mount**:

```elixir
# ❌ WRONG - Subscribing on static render
def mount(_params, _session, socket) do
  # This runs TWICE - wastes resources
  Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "campaigns")

  {:ok, socket}
end

# ✅ CORRECT - Check connected?()
def mount(_params, _session, socket) do
  if connected?(socket) do
    Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "campaigns")
  end

  {:ok, socket}
end
```

### ✅ Stateful Components - When to Use

**Use LiveComponent when**:

- ✅ Need isolated state per component instance
- ✅ Handling events within component
- ✅ Reusing complex UI with behavior

```elixir
# PASS - LiveComponent for stateful reusable UI
defmodule FinancialWeb.CampaignLive.StatsComponent do
  use FinancialWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div id={@id} class="campaign-stats">
      <div class="stat">
        <span class="label">Total Raised</span>
        <span class="value">
          <%= format_money(@campaign.total_raised, @campaign.currency) %>
        </span>
      </div>

      <div class="stat">
        <span class="label">Goal</span>
        <span class="value">
          <%= format_money(@campaign.goal_amount, @campaign.currency) %>
        </span>
      </div>

      <div class="stat">
        <span class="label">Progress</span>
        <span class="value"><%= @campaign.progress %>%</span>
      </div>

      <button phx-click="refresh" phx-target={@myself}>
        Refresh
      </button>
    </div>
    """
  end

  @impl true
  def handle_event("refresh", _params, socket) do
    # Component handles its own events
    campaign = Campaigns.get_campaign!(socket.assigns.campaign.id)
    {:noreply, assign(socket, campaign: campaign)}
  end

  defp format_money(amount, currency) do
    Money.to_string(Money.new(amount, currency))
  end
end

# Use in parent LiveView
defmodule FinancialWeb.CampaignLive.Show do
  use FinancialWeb, :live_view

  def render(assigns) do
    ~H"""
    <div class="campaign">
      <h1><%= @campaign.name %></h1>

      <.live_component
        module={FinancialWeb.CampaignLive.StatsComponent}
        id={"stats-#{@campaign.id}"}
        campaign={@campaign}
      />
    </div>
    """
  end
end
```

### ✅ LiveView Streams - Efficient Rendering

**MUST use**: Streams for large collections with frequent updates.

```elixir
# PASS - LiveView streams for donations list
defmodule FinancialWeb.DonationLive.Index do
  use FinancialWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "donations")
    end

    {:ok, stream(socket, :donations, [])}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    donations = Donations.list_donations(limit: 100)

    {:noreply, stream(socket, :donations, donations, reset: true)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="donations">
      <h1>Recent Donations</h1>

      <div id="donations-stream" phx-update="stream">
        <div
          :for={{dom_id, donation} <- @streams.donations}
          id={dom_id}
          class="donation-item"
        >
          <span><%= donation.donor_name %></span>
          <span><%= format_money(donation.amount, donation.currency) %></span>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def handle_info({:donation_created, donation}, socket) do
    # Stream automatically prepends new item
    {:noreply, stream_insert(socket, :donations, donation, at: 0)}
  end

  @impl true
  def handle_info({:donation_updated, donation}, socket) do
    # Stream updates existing item by ID
    {:noreply, stream_insert(socket, :donations, donation)}
  end

  @impl true
  def handle_info({:donation_deleted, donation}, socket) do
    # Stream removes item
    {:noreply, stream_delete(socket, :donations, donation)}
  end

  defp format_money(amount, currency) do
    Money.to_string(Money.new(amount, currency))
  end
end
```

### ✅ PubSub for Real-Time Updates - Mandatory Patterns

**MUST implement**: PubSub broadcasting for real-time synchronization.

```elixir
# PASS - Broadcasting updates from context
defmodule FinancialPlatform.Donations do
  alias FinancialPlatform.Repo
  alias FinancialPlatform.Donations.Donation

  def create_donation(attrs) do
    %Donation{}
    |> Donation.changeset(attrs)
    |> Repo.insert()
    |> broadcast_change(:donation_created)
  end

  def update_donation(%Donation{} = donation, attrs) do
    donation
    |> Donation.changeset(attrs)
    |> Repo.update()
    |> broadcast_change(:donation_updated)
  end

  def delete_donation(%Donation{} = donation) do
    Repo.delete(donation)
    |> broadcast_change(:donation_deleted)
  end

  # REQUIRED - Broadcast changes to all subscribers
  defp broadcast_change({:ok, donation}, event) do
    Phoenix.PubSub.broadcast(
      FinancialPlatform.PubSub,
      "donations",
      {event, donation}
    )

    {:ok, donation}
  end

  defp broadcast_change({:error, _changeset} = error, _event), do: error
end
```

### ✅ Testing LiveView - Required Test Coverage

```elixir
# PASS - LiveView integration tests
defmodule FinancialWeb.CampaignLive.IndexTest do
  use FinancialWeb.ConnCase

  import Phoenix.LiveViewTest

  test "displays campaigns", %{conn: conn} do
    campaign = insert(:campaign, name: "Build Mosque")

    {:ok, _view, html} = live(conn, ~p"/campaigns")

    assert html =~ "Build Mosque"
  end

  test "creates campaign via form", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/campaigns/new")

    assert view
           |> form("#campaign-form", campaign: %{
             name: "New Campaign",
             goal_amount: "100000",
             currency: "IDR"
           })
           |> render_submit()

    assert_redirect(view, ~p"/campaigns/#{campaign_id}")
  end

  test "updates in real-time via PubSub", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/campaigns")

    # Simulate external update
    campaign = insert(:campaign)
    Phoenix.PubSub.broadcast(
      FinancialPlatform.PubSub,
      "campaigns",
      {:campaign_updated, campaign}
    )

    assert render(view) =~ campaign.name
  end
end
```

## Part 4: Phoenix Channels (WebSocket Communication)

**Use when**: Need bidirectional WebSocket communication outside LiveView.

### ✅ Channel Setup - Socket and Channel Requirements

```elixir
# PASS - Channel for campaign updates
defmodule FinancialWeb.CampaignChannel do
  use Phoenix.Channel

  @impl true
  def join("campaign:" <> campaign_id, _params, socket) do
    if authorized?(socket, campaign_id) do
      send(self(), :after_join)
      {:ok, assign(socket, :campaign_id, campaign_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    campaign = Campaigns.get_campaign!(socket.assigns.campaign_id)
    push(socket, "campaign_data", %{campaign: campaign})
    {:noreply, socket}
  end

  @impl true
  def handle_in("new_donation", %{"amount" => amount}, socket) do
    case Donations.create_donation(%{
           campaign_id: socket.assigns.campaign_id,
           amount: amount
         }) do
      {:ok, donation} ->
        broadcast!(socket, "donation_received", %{donation: donation})
        {:reply, {:ok, %{donation: donation}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  defp authorized?(_socket, _campaign_id), do: true

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end

# Socket configuration
defmodule FinancialWeb.UserSocket do
  use Phoenix.Socket

  channel "campaign:*", FinancialWeb.CampaignChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user} ->
        {:ok, assign(socket, :current_user, user)}

      _ ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user:#{socket.assigns.current_user.id}"

  defp verify_token(_token), do: {:ok, %{id: 1}}
end
```

### ✅ Presence Tracking - Real-Time Presence

```elixir
# PASS - Presence module
defmodule FinancialWeb.Presence do
  use Phoenix.Presence,
    otp_app: :financial_platform,
    pubsub_server: FinancialPlatform.PubSub
end

# Track users in channel
defmodule FinancialWeb.CampaignChannel do
  alias FinancialWeb.Presence

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.current_user.id, %{
      online_at: System.system_time(:second),
      name: socket.assigns.current_user.name
    })

    push(socket, "presence_state", Presence.list(socket))

    {:noreply, socket}
  end
end
```

## Part 5: Ecto Database Toolkit (Persistence)

**Mandatory**: Ecto 3.12+ for all database operations.

### 📊 Ecto.Repo Configuration - Mandatory Setup

```elixir
# PASS - Repo configuration
defmodule FinancialPlatform.Repo do
  use Ecto.Repo,
    otp_app: :financial_platform,
    adapter: Ecto.Adapters.Postgres
end

# config/runtime.exs
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      """

  config :financial_platform, FinancialPlatform.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    ssl: true,
    ssl_opts: [
      verify: :verify_peer,
      cacertfile: "/etc/ssl/cert.pem"
    ]
end
```

### ✅ Ecto.Schema - Data Structures

```elixir
# PASS - Schema with embedded schema for money
defmodule FinancialPlatform.Donations.Donation do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "donations" do
    field :donor_name, :string
    field :donor_email, :string
    field :amount, :decimal
    field :currency, :string
    field :status, Ecto.Enum, values: [:pending, :approved, :rejected]

    belongs_to :campaign, FinancialPlatform.Campaigns.Campaign

    timestamps()
  end
end
```

### ✅ Ecto.Changeset - Validation Requirements

**MUST validate**: ALL user input through changesets.

```elixir
# PASS - Comprehensive validation
defmodule FinancialPlatform.Donations.Donation do
  import Ecto.Changeset

  def changeset(donation, attrs) do
    donation
    |> cast(attrs, [:donor_name, :donor_email, :amount, :currency, :campaign_id])
    |> validate_required([:donor_name, :donor_email, :amount, :currency, :campaign_id])
    |> validate_format(:donor_email, ~r/@/)
    |> validate_number(:amount, greater_than: 0)
    |> validate_inclusion(:currency, ["IDR", "USD", "EUR"])
    |> foreign_key_constraint(:campaign_id)
    |> unique_constraint([:donor_email, :campaign_id])
  end
end
```

❌ **FAIL - Missing validation**:

```elixir
# ❌ WRONG - No validation
def changeset(donation, attrs) do
  cast(donation, attrs, [:amount])
end

# ✅ CORRECT - Validate all fields
def changeset(donation, attrs) do
  donation
  |> cast(attrs, [:amount])
  |> validate_required([:amount])
  |> validate_number(:amount, greater_than: 0)
end
```

### ✅ Ecto.Query - Query Composition Patterns

```elixir
# PASS - Composable query functions
defmodule FinancialPlatform.Donations do
  import Ecto.Query

  def list_donations(opts \\ []) do
    Donation
    |> filter_by_campaign(opts[:campaign_id])
    |> filter_by_status(opts[:status])
    |> order_by_date(opts[:order] || :desc)
    |> paginate(opts[:page], opts[:per_page])
    |> Repo.all()
    |> Repo.preload(:campaign)
  end

  defp filter_by_campaign(query, nil), do: query
  defp filter_by_campaign(query, campaign_id) do
    where(query, [d], d.campaign_id == ^campaign_id)
  end

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status) do
    where(query, [d], d.status == ^status)
  end

  defp order_by_date(query, :asc) do
    order_by(query, [d], asc: d.inserted_at)
  end
  defp order_by_date(query, :desc) do
    order_by(query, [d], desc: d.inserted_at)
  end

  defp paginate(query, nil, _), do: query
  defp paginate(query, page, per_page) do
    per_page = per_page || 20
    offset = (page - 1) * per_page

    query
    |> limit(^per_page)
    |> offset(^offset)
  end
end
```

### ✅ Ecto.Multi - Transaction Requirements

**MUST use**: Multi for multi-step database operations requiring atomicity.

```elixir
# PASS - Multi for donation approval with side effects
defmodule FinancialPlatform.Donations do
  alias Ecto.Multi

  def approve_donation(%Donation{} = donation) do
    Multi.new()
    |> Multi.update(:donation, Donation.approve_changeset(donation))
    |> Multi.run(:campaign, fn _repo, %{donation: donation} ->
      # Update campaign total
      campaign = Campaigns.get_campaign!(donation.campaign_id)
      new_total = Decimal.add(campaign.total_raised, donation.amount)
      Campaigns.update_campaign(campaign, %{total_raised: new_total})
    end)
    |> Multi.insert(:notification, fn %{donation: donation} ->
      Notification.changeset(%Notification{}, %{
        user_id: donation.user_id,
        message: "Your donation has been approved"
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{donation: donation}} -> {:ok, donation}
      {:error, _operation, changeset, _changes} -> {:error, changeset}
    end
  end
end
```

❌ **FAIL - Sequential operations without transaction**:

```elixir
# ❌ WRONG - Not atomic, can fail partially
def approve_donation(%Donation{} = donation) do
  # If this succeeds but campaign update fails, inconsistent state
  {:ok, donation} = Repo.update(Donation.approve_changeset(donation))

  campaign = Campaigns.get_campaign!(donation.campaign_id)
  Campaigns.update_campaign(campaign, %{total_raised: new_total})

  {:ok, donation}
end

# ✅ CORRECT - Use Multi for atomicity
def approve_donation(%Donation{} = donation) do
  Multi.new()
  |> Multi.update(:donation, Donation.approve_changeset(donation))
  |> Multi.run(:campaign, fn _repo, %{donation: donation} ->
    # Both succeed or both rollback
    campaign = Campaigns.get_campaign!(donation.campaign_id)
    Campaigns.update_campaign(campaign, %{total_raised: new_total})
  end)
  |> Repo.transaction()
end
```

### ✅ Migrations - Schema Versioning Requirements

```elixir
# PASS - Migration with constraints
defmodule FinancialPlatform.Repo.Migrations.CreateDonations do
  use Ecto.Migration

  def change do
    create table(:donations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :donor_name, :string, null: false
      add :donor_email, :string, null: false
      add :amount, :decimal, precision: 15, scale: 2, null: false
      add :currency, :string, null: false
      add :status, :string, default: "pending", null: false

      add :campaign_id, references(:campaigns, type: :binary_id, on_delete: :restrict),
        null: false

      timestamps()
    end

    create index(:donations, [:campaign_id])
    create index(:donations, [:status])
    create index(:donations, [:inserted_at])
    create unique_index(:donations, [:donor_email, :campaign_id])

    create constraint(:donations, :amount_must_be_positive,
             check: "amount > 0"
           )

    create constraint(:donations, :valid_currency,
             check: "currency IN ('IDR', 'USD', 'EUR')"
           )
  end
end
```

## Part 6: Advanced Data Processing

**Context-specific**: Use when standard patterns insufficient.

### 📊 Nx for Numerical Computing - Financial Analytics Use Case

**When to use**:

- ✅ Financial analytics and calculations
- ✅ Zakat calculation algorithms
- ✅ Portfolio optimization
- ✅ Risk modeling

**NOT for**: General application logic, simple arithmetic.

```elixir
# Example use case (Nx not yet in OSE Platform stack)
# Future consideration for complex financial calculations

# PASS - Nx for Zakat calculation matrices
defmodule FinancialPlatform.Zakat.Calculator do
  import Nx.Defn

  @nisab_gold_grams 85
  @zakat_rate 0.025  # 2.5%

  defn calculate_zakat_portfolio(assets, prices) do
    # assets: [gold_grams, silver_grams, cash_idr, stocks_value]
    # prices: [gold_price_per_gram, silver_price_per_gram, 1.0, 1.0]

    total_value = Nx.dot(assets, prices)
    nisab_threshold = @nisab_gold_grams * prices[0]

    if total_value >= nisab_threshold do
      total_value * @zakat_rate
    else
      0.0
    end
  end
end

# Usage
assets = Nx.tensor([100.0, 500.0, 50_000_000.0, 25_000_000.0])
prices = Nx.tensor([1_000_000.0, 15_000.0, 1.0, 1.0])

zakat_amount = FinancialPlatform.Zakat.Calculator.calculate_zakat_portfolio(assets, prices)
```

### 📊 Broadway for Data Pipelines - High-Throughput Processing Requirements

**MUST use**: Broadway for high-throughput event processing.

**When to use**:

- ✅ Processing donation queues from payment gateways
- ✅ Event streaming from Kafka/RabbitMQ/SQS
- ✅ Batch processing with backpressure
- ✅ Data ingestion pipelines

```elixir
# PASS - Broadway pipeline for donation processing
defmodule FinancialPlatform.DonationPipeline do
  use Broadway

  alias Broadway.Message

  def start_link(_opts) do
    Broadway.start_link(__MODULE__,
      name: __MODULE__,
      producer: [
        module: {BroadwayRabbitMQ.Producer,
          queue: "donations",
          connection: [
            host: System.get_env("RABBITMQ_HOST", "localhost"),
            username: System.get_env("RABBITMQ_USER", "guest"),
            password: System.get_env("RABBITMQ_PASSWORD", "guest")
          ],
          qos: [
            prefetch_count: 50
          ]
        },
        concurrency: 1
      ],
      processors: [
        default: [
          concurrency: 10
        ]
      ],
      batchers: [
        default: [
          batch_size: 100,
          batch_timeout: 2000,
          concurrency: 5
        ]
      ]
    )
  end

  @impl true
  def handle_message(_processor, message, _context) do
    donation = Jason.decode!(message.data)

    case validate_donation(donation) do
      :ok ->
        Message.put_data(message, donation)

      {:error, reason} ->
        Message.failed(message, reason)
    end
  end

  @impl true
  def handle_batch(_batcher, messages, _batch_info, _context) do
    donations = Enum.map(messages, & &1.data)

    case Donations.insert_batch(donations) do
      {:ok, _results} ->
        messages

      {:error, reason} ->
        Enum.map(messages, &Message.failed(&1, reason))
    end
  end

  defp validate_donation(donation) do
    if donation["amount"] > 0, do: :ok, else: {:error, :invalid_amount}
  end
end
```

**Broadway with AWS SQS**:

```elixir
# PASS - Broadway with SQS producer
defmodule FinancialPlatform.PaymentProcessor do
  use Broadway

  alias Broadway.Message

  def start_link(_opts) do
    Broadway.start_link(__MODULE__,
      name: __MODULE__,
      producer: [
        module: {BroadwaySQS.Producer,
          queue_name: "financial-payments",
          config: [
            access_key_id: System.get_env("AWS_ACCESS_KEY_ID"),
            secret_access_key: System.get_env("AWS_SECRET_ACCESS_KEY"),
            region: System.get_env("AWS_REGION", "us-east-1")
          ]
        },
        concurrency: 2
      ],
      processors: [
        default: [
          concurrency: 20,
          max_demand: 10
        ]
      ],
      batchers: [
        database: [
          batch_size: 50,
          batch_timeout: 5000,
          concurrency: 10
        ],
        notifications: [
          batch_size: 100,
          batch_timeout: 2000,
          concurrency: 5
        ]
      ]
    )
  end

  @impl true
  def handle_message(_processor, message, _context) do
    payment = Jason.decode!(message.data)

    case process_payment(payment) do
      {:ok, processed} ->
        message
        |> Message.put_data(processed)
        |> Message.put_batcher(:database)

      {:error, :notify} ->
        message
        |> Message.put_batcher(:notifications)

      {:error, reason} ->
        Message.failed(message, reason)
    end
  end

  @impl true
  def handle_batch(:database, messages, _batch_info, _context) do
    payments = Enum.map(messages, & &1.data)
    save_payments(payments)
    messages
  end

  @impl true
  def handle_batch(:notifications, messages, _batch_info, _context) do
    messages
    |> Enum.map(& &1.data)
    |> send_failure_notifications()

    messages
  end

  defp process_payment(payment), do: {:ok, payment}
  defp save_payments(_payments), do: :ok
  defp send_failure_notifications(_payments), do: :ok
end
```

### ✅ GenStage - Backpressure Handling

**When to use**: Custom backpressure requirements not covered by Broadway.

```elixir
# PASS - GenStage for custom event pipeline
defmodule FinancialPlatform.EventProducer do
  use GenStage

  def start_link(initial) do
    GenStage.start_link(__MODULE__, initial, name: __MODULE__)
  end

  def init(initial) do
    {:producer, initial}
  end

  def handle_demand(demand, state) do
    events = fetch_events(demand)
    {:noreply, events, state}
  end

  defp fetch_events(demand) do
    # Fetch events from source
    Enum.take([], demand)
  end
end

defmodule FinancialPlatform.EventProcessor do
  use GenStage

  def start_link(_opts) do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    {:producer_consumer, :ok}
  end

  def handle_events(events, _from, state) do
    processed = Enum.map(events, &process_event/1)
    {:noreply, processed, state}
  end

  defp process_event(event), do: event
end
```

## Framework Integration Best Practices

**MUST follow**:

1. ✅ **Understand Plug before Phoenix** - Phoenix is Plug-based
2. ✅ **Use Phoenix contexts** - Isolate business logic from web layer
3. ✅ **Always use fallback controllers** - Centralized error handling
4. ✅ **Validate all input with Ecto changesets** - Never trust user data
5. ✅ **Use Ecto.Multi for transactions** - Atomic multi-step operations
6. ✅ **Check connected?() in LiveView mount** - Avoid expensive ops on static render
7. ✅ **Broadcast changes via PubSub** - Real-time synchronization
8. ✅ **Use Broadway for high-throughput** - Event processing with backpressure
9. ✅ **Test all layers** - Controllers, contexts, LiveViews, channels
10. ✅ **Monitor with Telemetry** - Required for production applications

## Common Integration Mistakes

### ❌ Mistake 1: Controller accessing Repo directly

**Wrong**: Bypassing context layer

```elixir
# ❌ Controller knows about Repo
def index(conn, _params) do
  donations = Repo.all(Donation)
  render(conn, "index.json", donations: donations)
end
```

**Right**: Use context

```elixir
# ✅ Controller uses context API
def index(conn, _params) do
  donations = Donations.list_donations()
  render(conn, "index.json", donations: donations)
end
```

### ❌ Mistake 2: Not using fallback controller

**Wrong**: Handling errors in every action

```elixir
# ❌ Duplicate error handling
def show(conn, %{"id" => id}) do
  case Donations.get_donation(id) do
    {:ok, donation} ->
      render(conn, "show.json", donation: donation)

    {:error, :not_found} ->
      conn
      |> put_status(:not_found)
      |> render("error.json")
  end
end
```

**Right**: Use action_fallback

```elixir
# ✅ Fallback handles all errors
action_fallback FinancialWeb.FallbackController

def show(conn, %{"id" => id}) do
  with {:ok, donation} <- Donations.get_donation(id) do
    render(conn, "show.json", donation: donation)
  end
end
```

### ❌ Mistake 3: Not using Ecto.Multi for transactions

**Wrong**: Sequential operations

```elixir
# ❌ Partial failures leave inconsistent state
def transfer_funds(from_account, to_account, amount) do
  {:ok, _} = withdraw(from_account, amount)
  {:ok, _} = deposit(to_account, amount)  # If this fails, money lost!
end
```

**Right**: Use Multi

```elixir
# ✅ Atomic - all succeed or all rollback
def transfer_funds(from_account, to_account, amount) do
  Multi.new()
  |> Multi.run(:withdraw, fn _repo, _changes ->
    withdraw(from_account, amount)
  end)
  |> Multi.run(:deposit, fn _repo, _changes ->
    deposit(to_account, amount)
  end)
  |> Repo.transaction()
end
```

### ❌ Mistake 4: Expensive operations in disconnected LiveView mount

**Wrong**: Subscribing on static render

```elixir
# ❌ Subscribes twice (static + connected)
def mount(_params, _session, socket) do
  Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "topic")
  {:ok, socket}
end
```

**Right**: Check connected?()

```elixir
# ✅ Subscribe only on WebSocket connection
def mount(_params, _session, socket) do
  if connected?(socket) do
    Phoenix.PubSub.subscribe(FinancialPlatform.PubSub, "topic")
  end

  {:ok, socket}
end
```

## Related Standards

**MUST also follow**:

- [Coding Standards](./coding-standards.md) - Naming, module structure
- [Testing Standards](./testing-standards.md) - Testing Phoenix, Ecto, LiveView
- [Security Standards](./security-standards.md) - Authentication, authorization, input validation
- [Concurrency Standards](./concurrency-standards.md) - GenServer, Task, processes
- [Error Handling Standards](./error-handling-standards.md) - Supervision, "let it crash"

## Sources

- [Phoenix Framework Documentation](https://www.phoenixframework.org/)
- [Phoenix LiveView Documentation](https://hexdocs.pm/phoenix_live_view/)
- [Ecto Documentation](https://hexdocs.pm/ecto/)
- [Broadway Documentation](https://hexdocs.pm/broadway/)
- [Plug Documentation](https://hexdocs.pm/plug/)
- [Phoenix Channels Guide](https://hexdocs.pm/phoenix/channels.html)
- [Absinthe GraphQL](https://hexdocs.pm/absinthe/)

---

**Status**: Authoritative Standard (Mandatory Compliance)

**Phoenix Version**: 1.7+
**Ecto Version**: 3.12+
**Broadway Version**: 1.0+
**Maintainers**: Platform Architecture Team
