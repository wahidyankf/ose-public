---
title: Phoenix REST APIs Guide
description: Comprehensive guide to building RESTful APIs with Phoenix including JSON API, versioning, pagination, filtering, authentication, and documentation
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - elixir
  - rest
  - api
  - json
  - versioning
  - pagination
related:
  - security.md
  - testing.md
  - best-practices.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Phoenix REST APIs Guide

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [Elixir Phoenix](./README.md) > REST APIs

### At a Glance

| API Feature    | Phoenix Approach    | Key Libraries   |
| -------------- | ------------------- | --------------- |
| JSON Rendering | Phoenix.JSON, Jason | jason, phoenix  |
| API Versioning | URL/header-based    | custom plugs    |
| Authentication | JWT, OAuth2         | guardian, joken |
| Pagination     | Offset/cursor-based | scrivener_ecto  |
| Documentation  | OpenAPI spec        | open_api_spex   |
| Validation     | Ecto changesets     | ecto            |

## Overview

Phoenix excels at building high-performance RESTful APIs with clean architecture and functional patterns. This guide covers building production-ready REST APIs for Islamic finance applications handling Zakat calculations, charitable donations, and Murabaha contracts.

**Target Audience**: Developers building REST APIs with Phoenix for external consumption or microservices architecture.

**Versions**: Phoenix 1.7+, Elixir 1.14+, Jason 1.4+

### Request Pipeline Architecture

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A[HTTP Request] --> B[Endpoint]
    B --> C{Content-Type?}
    C -->|application/json| D[Plug.Parsers<br/>JSON Parser]
    C -->|Other| E[Skip Parser]

    D --> F[Router]
    E --> F

    F --> G[Pipeline Plugs]
    G --> H[Rate Limiter]
    H --> I[Authentication]
    I --> J[CORS Headers]

    J --> K{Route Match?}
    K -->|Yes| L[Controller Action]
    K -->|No| M[404 Not Found]

    L --> N[Action Function]
    N --> O[Context Call]
    O --> P[Ecto Schema/Changeset]
    P --> Q[(Database)]

    Q --> R{Result?}
    R -->|{:ok, data}| S[Render JSON View]
    R -->|{:error, changeset}| T[FallbackController]

    T --> U[render_error#40;422#41;]
    S --> V[Format Response]
    U --> V

    V --> W[Add Headers]
    W --> X[JSON Encode]
    X --> Y[HTTP Response]

    M --> Y

    style A fill:#0173B2,color:#fff
    style L fill:#029E73,color:#fff
    style N fill:#029E73,color:#fff
    style O fill:#CC78BC,color:#fff
    style Q fill:#DE8F05,color:#fff
    style S fill:#029E73,color:#fff
    style Y fill:#0173B2,color:#fff
```

**Pipeline Stages**:

1. **Endpoint** (blue): Entry point, handles static files, logging, telemetry
2. **Parser**: Decodes JSON body into Elixir map
3. **Router**: Matches request to controller action
4. **Pipeline plugs**: Authentication, rate limiting, CORS
5. **Controller** (teal): Orchestrates request handling
6. **Context** (purple): Business logic layer
7. **Database** (orange): Ecto queries and changesets
8. **View/Fallback**: Formats response (success or error)
9. **Response** (blue): JSON encoding, headers, status code

**Key Plugs**:

- `Plug.Parsers` - Parse JSON request bodies
- `Plug.RequestId` - Generate unique request ID
- `Plug.Logger` - Log requests
- `Plug.Telemetry` - Emit telemetry events
- Custom plugs - Authentication, rate limiting, CORS

## Table of Contents

1. [RESTful Design Principles](#restful-design-principles)
2. [JSON API Structure](#json-api-structure)
3. [API Versioning](#api-versioning)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Filtering and Sorting](#filtering-and-sorting)
7. [Request Validation](#request-validation)
8. [Authentication](#authentication)
9. [Rate Limiting](#rate-limiting)
10. [API Documentation](#api-documentation)
11. [Content Negotiation](#content-negotiation)
12. [HATEOAS](#hateoas)

## RESTful Design Principles

### Resource-Oriented Design

Design APIs around resources (nouns) rather than actions (verbs).

**❌ BAD - Action-Oriented**

```
POST /api/calculateZakat
POST /api/createDonation
GET /api/getDonationById/123
```

**✅ GOOD - Resource-Oriented**

```
POST /api/zakat/calculations
POST /api/donations
GET /api/donations/123
```

### HTTP Methods

Use HTTP methods semantically:

- **GET** - Retrieve resources (idempotent, safe)
- **POST** - Create new resources
- **PUT** - Replace entire resource
- **PATCH** - Partial update
- **DELETE** - Remove resource

```elixir
# RESTful routes for Zakat calculations
scope "/api/v1", OsePlatformWeb.API.V1 do
  pipe_through :api

  resources "/zakat/calculations", ZakatCalculationController, only: [:index, :show, :create, :update, :delete]
  resources "/donations", DonationController, except: [:new, :edit]
  resources "/charities", CharityController, only: [:index, :show]
end
```

### Status Codes

Use appropriate HTTP status codes:

- **2xx Success**
  - 200 OK - Successful GET, PUT, PATCH
  - 201 Created - Successful POST
  - 204 No Content - Successful DELETE
- **4xx Client Error**
  - 400 Bad Request - Invalid request syntax
  - 401 Unauthorized - Authentication required
  - 403 Forbidden - Authenticated but not authorized
  - 404 Not Found - Resource doesn't exist
  - 422 Unprocessable Entity - Validation failed
  - 429 Too Many Requests - Rate limit exceeded
- **5xx Server Error**
  - 500 Internal Server Error - Unexpected error
  - 503 Service Unavailable - Temporary downtime

## JSON API Structure

### Controller Pattern

```elixir
defmodule OsePlatformWeb.API.V1.DonationController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Donations
  alias OsePlatform.Donations.Donation

  action_fallback OsePlatformWeb.FallbackController

  def index(conn, params) do
    donations = Donations.list_donations(params)
    render(conn, :index, donations: donations)
  end

  def show(conn, %{"id" => id}) do
    donation = Donations.get_donation!(id)
    render(conn, :show, donation: donation)
  end

  def create(conn, %{"donation" => donation_params}) do
    with {:ok, %Donation{} = donation} <- Donations.create_donation(donation_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/donations/#{donation.id}")
      |> render(:show, donation: donation)
    end
  end

  def update(conn, %{"id" => id, "donation" => donation_params}) do
    donation = Donations.get_donation!(id)

    with {:ok, %Donation{} = donation} <- Donations.update_donation(donation, donation_params) do
      render(conn, :show, donation: donation)
    end
  end

  def delete(conn, %{"id" => id}) do
    donation = Donations.get_donation!(id)

    with {:ok, %Donation{}} <- Donations.delete_donation(donation) do
      send_resp(conn, :no_content, "")
    end
  end
end
```

### JSON View

```elixir
defmodule OsePlatformWeb.API.V1.DonationJSON do
  alias OsePlatform.Donations.Donation

  def index(%{donations: donations}) do
    %{data: for(donation <- donations, do: data(donation))}
  end

  def show(%{donation: donation}) do
    %{data: data(donation)}
  end

  defp data(%Donation{} = donation) do
    %{
      id: donation.id,
      amount: donation.amount,
      currency: donation.currency,
      donor_name: donation.donor_name,
      charity_id: donation.charity_id,
      status: donation.status,
      donated_at: donation.donated_at,
      inserted_at: donation.inserted_at
    }
  end
end
```

### Fallback Controller

Handle errors consistently across all controllers.

```elixir
defmodule OsePlatformWeb.FallbackController do
  use OsePlatformWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: OsePlatformWeb.ChangesetJSON)
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

  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: OsePlatformWeb.ErrorJSON)
    |> render(:"403")
  end
end
```

### Islamic Finance Example: Zakat API

```elixir
defmodule OsePlatformWeb.API.V1.ZakatCalculationController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat
  alias OsePlatform.Zakat.Calculation

  action_fallback OsePlatformWeb.FallbackController

  def index(conn, params) do
    user = conn.assigns.current_user
    calculations = Zakat.list_user_calculations(user.id, params)

    render(conn, :index, calculations: calculations)
  end

  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    calculation = Zakat.get_calculation!(id)

    # Authorization check
    if calculation.user_id == user.id || user.role == "admin" do
      render(conn, :show, calculation: calculation)
    else
      {:error, :forbidden}
    end
  end

  def create(conn, %{"calculation" => calc_params}) do
    user = conn.assigns.current_user

    with {:ok, %Calculation{} = calculation} <- Zakat.create_calculation(user, calc_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/zakat/calculations/#{calculation.id}")
      |> render(:show, calculation: calculation)
    end
  end

  def update(conn, %{"id" => id, "calculation" => calc_params}) do
    user = conn.assigns.current_user
    calculation = Zakat.get_calculation!(id)

    # Authorization
    if calculation.user_id == user.id do
      with {:ok, %Calculation{} = calculation} <- Zakat.update_calculation(calculation, calc_params) do
        render(conn, :show, calculation: calculation)
      end
    else
      {:error, :forbidden}
    end
  end
end
```

```elixir
# JSON view for Zakat calculations
defmodule OsePlatformWeb.API.V1.ZakatCalculationJSON do
  alias OsePlatform.Zakat.Calculation

  def index(%{calculations: calculations}) do
    %{
      data: for(calc <- calculations, do: data(calc)),
      meta: %{
        total: length(calculations)
      }
    }
  end

  def show(%{calculation: calculation}) do
    %{data: data(calculation)}
  end

  defp data(%Calculation{} = calc) do
    %{
      id: calc.id,
      year: calc.year,
      total_assets: calc.total_assets,
      total_liabilities: calc.total_liabilities,
      net_worth: calc.net_worth,
      nisab_threshold: calc.nisab_threshold,
      is_eligible: calc.is_eligible,
      zakat_amount: calc.zakat_amount,
      status: calc.status,
      calculated_at: calc.calculated_at,
      inserted_at: calc.inserted_at,
      assets: render_assets(calc.assets),
      liabilities: render_liabilities(calc.liabilities)
    }
  end

  defp render_assets(assets) when is_list(assets) do
    Enum.map(assets, fn asset ->
      %{
        id: asset.id,
        type: asset.asset_type,
        description: asset.description,
        amount: asset.amount
      }
    end)
  end
  defp render_assets(_), do: []

  defp render_liabilities(liabilities) when is_list(liabilities) do
    Enum.map(liabilities, fn liability ->
      %{
        id: liability.id,
        type: liability.liability_type,
        description: liability.description,
        amount: liability.amount
      }
    end)
  end
  defp render_liabilities(_), do: []
end
```

## API Versioning

### URL-Based Versioning

Most common and explicit approach.

```elixir
# Router
defmodule OsePlatformWeb.Router do
  use OsePlatformWeb, :router

  # API v1
  scope "/api/v1", OsePlatformWeb.API.V1, as: :api_v1 do
    pipe_through :api

    resources "/donations", DonationController
    resources "/zakat/calculations", ZakatCalculationController
  end

  # API v2 with breaking changes
  scope "/api/v2", OsePlatformWeb.API.V2, as: :api_v2 do
    pipe_through :api

    resources "/donations", DonationController
    resources "/zakat/calculations", ZakatCalculationController
  end
end
```

### Header-Based Versioning

```elixir
defmodule OsePlatformWeb.Plugs.APIVersion do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    version = get_req_header(conn, "accept")
    |> List.first()
    |> parse_version()

    assign(conn, :api_version, version)
  end

  defp parse_version("application/vnd.oseplatform.v1+json"), do: :v1
  defp parse_version("application/vnd.oseplatform.v2+json"), do: :v2
  defp parse_version(_), do: :v1  # Default to v1
end

# In controller
def index(conn, params) do
  case conn.assigns.api_version do
    :v1 -> render_v1(conn, params)
    :v2 -> render_v2(conn, params)
  end
end
```

### Deprecation Headers

```elixir
defmodule OsePlatformWeb.Plugs.DeprecationWarning do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, opts) do
    if deprecated?(conn, opts) do
      conn
      |> put_resp_header("deprecation", "true")
      |> put_resp_header("sunset", opts[:sunset_date])
      |> put_resp_header("link", "<#{opts[:migration_guide]}>; rel=\"sunset\"")
    else
      conn
    end
  end

  defp deprecated?(conn, opts) do
    conn.request_path =~ opts[:deprecated_path]
  end
end
```

## Error Handling

### Standardized Error Format

```elixir
defmodule OsePlatformWeb.ErrorJSON do
  def render("404.json", _assigns) do
    %{
      error: %{
        code: "not_found",
        message: "Resource not found",
        status: 404
      }
    }
  end

  def render("401.json", _assigns) do
    %{
      error: %{
        code: "unauthorized",
        message: "Authentication required",
        status: 401
      }
    }
  end

  def render("403.json", _assigns) do
    %{
      error: %{
        code: "forbidden",
        message: "Insufficient permissions",
        status: 403
      }
    }
  end

  def render("500.json", _assigns) do
    %{
      error: %{
        code: "internal_server_error",
        message: "Internal server error",
        status: 500
      }
    }
  end
end
```

### Validation Errors

```elixir
defmodule OsePlatformWeb.ChangesetJSON do
  def error(%{changeset: changeset}) do
    %{
      error: %{
        code: "validation_error",
        message: "Validation failed",
        status: 422,
        details: translate_errors(changeset)
      }
    }
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end

# Example error response:
# {
#   "error": {
#     "code": "validation_error",
#     "message": "Validation failed",
#     "status": 422,
#     "details": {
#       "amount": ["must be greater than 0"],
#       "charity_id": ["can't be blank"]
#     }
#   }
# }
```

### Custom Business Logic Errors

```elixir
defmodule OsePlatformWeb.API.V1.ZakatCalculationController do
  # ...

  def create(conn, %{"calculation" => calc_params}) do
    user = conn.assigns.current_user

    case Zakat.create_calculation(user, calc_params) do
      {:ok, calculation} ->
        conn
        |> put_status(:created)
        |> render(:show, calculation: calculation)

      {:error, :below_nisab} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          error: %{
            code: "below_nisab",
            message: "Net worth is below nisab threshold. Zakat is not obligatory.",
            status: 422,
            details: %{
              net_worth: calc_params["net_worth"],
              nisab_threshold: Zakat.current_nisab_threshold()
            }
          }
        })

      {:error, :invalid_lunar_year} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          error: %{
            code: "invalid_lunar_year",
            message: "Full lunar year has not passed since last calculation",
            status: 422
          }
        })

      {:error, changeset} ->
        {:error, changeset}
    end
  end
end
```

## Pagination

### Offset-Based Pagination

```elixir
defmodule OsePlatform.Donations do
  import Ecto.Query

  def list_donations(params) do
    page = Map.get(params, "page", "1") |> String.to_integer()
    page_size = Map.get(params, "page_size", "20") |> String.to_integer() |> min(100)

    offset = (page - 1) * page_size

    query = from d in Donation,
      order_by: [desc: d.inserted_at],
      limit: ^page_size,
      offset: ^offset

    donations = Repo.all(query)
    total = Repo.aggregate(Donation, :count)

    %{
      data: donations,
      pagination: %{
        page: page,
        page_size: page_size,
        total: total,
        total_pages: ceil(total / page_size)
      }
    }
  end
end
```

```elixir
# JSON response with pagination
defmodule OsePlatformWeb.API.V1.DonationJSON do
  def index(%{donations: %{data: donations, pagination: pagination}}) do
    %{
      data: for(donation <- donations, do: data(donation)),
      meta: %{
        pagination: %{
          page: pagination.page,
          page_size: pagination.page_size,
          total: pagination.total,
          total_pages: pagination.total_pages
        }
      },
      links: %{
        self: "/api/v1/donations?page=#{pagination.page}",
        first: "/api/v1/donations?page=1",
        last: "/api/v1/donations?page=#{pagination.total_pages}",
        next: next_page_link(pagination),
        prev: prev_page_link(pagination)
      }
    }
  end

  defp next_page_link(%{page: page, total_pages: total}) when page < total do
    "/api/v1/donations?page=#{page + 1}"
  end
  defp next_page_link(_), do: nil

  defp prev_page_link(%{page: page}) when page > 1 do
    "/api/v1/donations?page=#{page - 1}"
  end
  defp prev_page_link(_), do: nil
end
```

### Cursor-Based Pagination

Better for real-time data and large datasets.

```elixir
defmodule OsePlatform.Donations do
  import Ecto.Query

  def list_donations_cursor(params) do
    cursor = Map.get(params, "cursor")
    limit = Map.get(params, "limit", "20") |> String.to_integer() |> min(100)

    query = from d in Donation, order_by: [desc: d.inserted_at], limit: ^(limit + 1)

    query = if cursor do
      cursor_time = decode_cursor(cursor)
      from d in query, where: d.inserted_at < ^cursor_time
    else
      query
    end

    donations = Repo.all(query)

    {data, has_more} = if length(donations) > limit do
      {Enum.take(donations, limit), true}
    else
      {donations, false}
    end

    next_cursor = if has_more do
      List.last(data) |> encode_cursor()
    else
      nil
    end

    %{
      data: data,
      meta: %{
        has_more: has_more,
        next_cursor: next_cursor
      }
    }
  end

  defp encode_cursor(%{inserted_at: time}) do
    DateTime.to_unix(time) |> Integer.to_string() |> Base.url_encode64()
  end

  defp decode_cursor(cursor) do
    cursor
    |> Base.url_decode64!()
    |> String.to_integer()
    |> DateTime.from_unix!()
  end
end
```

## Filtering and Sorting

### Query Parameters for Filtering

```elixir
defmodule OsePlatform.Donations.Query do
  import Ecto.Query

  def filter(query \\ Donation, params) do
    query
    |> filter_by_charity(params["charity_id"])
    |> filter_by_status(params["status"])
    |> filter_by_amount_range(params["min_amount"], params["max_amount"])
    |> filter_by_date_range(params["start_date"], params["end_date"])
    |> sort_by(params["sort_by"], params["order"])
  end

  defp filter_by_charity(query, nil), do: query
  defp filter_by_charity(query, charity_id) do
    from d in query, where: d.charity_id == ^charity_id
  end

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status) when status in ["pending", "completed", "cancelled"] do
    from d in query, where: d.status == ^status
  end
  defp filter_by_status(query, _), do: query

  defp filter_by_amount_range(query, nil, nil), do: query
  defp filter_by_amount_range(query, min, nil) do
    from d in query, where: d.amount >= ^Decimal.new(min)
  end
  defp filter_by_amount_range(query, nil, max) do
    from d in query, where: d.amount <= ^Decimal.new(max)
  end
  defp filter_by_amount_range(query, min, max) do
    from d in query,
      where: d.amount >= ^Decimal.new(min) and d.amount <= ^Decimal.new(max)
  end

  defp filter_by_date_range(query, nil, nil), do: query
  defp filter_by_date_range(query, start_date, end_date) do
    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)

    case {start_dt, end_dt} do
      {nil, nil} -> query
      {start_dt, nil} -> from d in query, where: d.donated_at >= ^start_dt
      {nil, end_dt} -> from d in query, where: d.donated_at <= ^end_dt
      {start_dt, end_dt} -> from d in query, where: d.donated_at >= ^start_dt and d.donated_at <= ^end_dt
    end
  end

  defp sort_by(query, nil, _order), do: from(d in query, order_by: [desc: d.inserted_at])
  defp sort_by(query, "amount", "asc"), do: from(d in query, order_by: [asc: d.amount])
  defp sort_by(query, "amount", _), do: from(d in query, order_by: [desc: d.amount])
  defp sort_by(query, "date", "asc"), do: from(d in query, order_by: [asc: d.donated_at])
  defp sort_by(query, "date", _), do: from(d in query, order_by: [desc: d.donated_at])
  defp sort_by(query, _, _), do: query

  defp parse_date(nil), do: nil
  defp parse_date(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> DateTime.new!(date, ~T[00:00:00])
      {:error, _} -> nil
    end
  end
end

# Controller usage
def index(conn, params) do
  donations = Donation
    |> Donations.Query.filter(params)
    |> Repo.all()

  render(conn, :index, donations: donations)
end
```

**Example API calls:**

```bash
GET /api/v1/donations?charity_id=123&status=completed&min_amount=100&max_amount=1000&sort_by=amount&order=desc
GET /api/v1/donations?start_date=2024-01-01&end_date=2024-12-31
```

## Request Validation

### Changeset Validation

```elixir
defmodule OsePlatform.Donations.Donation do
  use Ecto.Schema
  import Ecto.Changeset

  schema "donations" do
    field :amount, :decimal
    field :currency, :string, default: "USD"
    field :donor_name, :string
    field :donor_email, :string
    field :charity_id, :id
    field :status, :string, default: "pending"
    field :donated_at, :utc_datetime

    timestamps()
  end

  def changeset(donation, attrs) do
    donation
    |> cast(attrs, [:amount, :currency, :donor_name, :donor_email, :charity_id, :donated_at])
    |> validate_required([:amount, :charity_id])
    |> validate_number(:amount, greater_than: 0, less_than: 1_000_000)
    |> validate_inclusion(:currency, ["USD", "EUR", "SAR", "AED"])
    |> validate_format(:donor_email, ~r/@/)
    |> validate_length(:donor_name, min: 2, max: 100)
    |> foreign_key_constraint(:charity_id)
    |> put_change(:donated_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end
end
```

### Input Sanitization

```elixir
defmodule OsePlatformWeb.Plugs.SanitizeParams do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    params = conn.params
    |> sanitize_params()

    %{conn | params: params}
  end

  defp sanitize_params(params) when is_map(params) do
    Enum.reduce(params, %{}, fn {key, value}, acc ->
      Map.put(acc, key, sanitize_value(value))
    end)
  end

  defp sanitize_value(value) when is_binary(value) do
    value
    |> String.trim()
    |> HtmlSanitizeEx.strip_tags()
  end
  defp sanitize_value(value) when is_map(value), do: sanitize_params(value)
  defp sanitize_value(value), do: value
end
```

## Authentication

### JWT Authentication

```elixir
defmodule OsePlatformWeb.API.V1.AuthController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Accounts
  alias OsePlatform.Guardian

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)

        conn
        |> put_status(:ok)
        |> json(%{
          data: %{
            token: token,
            token_type: "Bearer",
            expires_in: 86400,  # 24 hours
            user: %{
              id: user.id,
              email: user.email,
              role: user.role
            }
          }
        })

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          error: %{
            code: "invalid_credentials",
            message: "Invalid email or password"
          }
        })
    end
  end

  def refresh(conn, %{"token" => old_token}) do
    case Guardian.exchange(old_token, "refresh", "access") do
      {:ok, _old_stuff, {new_token, _new_claims}} ->
        json(conn, %{data: %{token: new_token}})

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: %{code: "invalid_token", message: "Invalid or expired token"}})
    end
  end
end
```

### API Key Authentication

```elixir
defmodule OsePlatformWeb.Plugs.APIKeyAuth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "x-api-key") do
      [api_key] ->
        verify_api_key(conn, api_key)

      [] ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: %{code: "missing_api_key", message: "API key required"}})
        |> halt()
    end
  end

  defp verify_api_key(conn, api_key) do
    case OsePlatform.APIKeys.verify(api_key) do
      {:ok, client} ->
        conn
        |> assign(:api_client, client)
        |> assign(:rate_limit_key, "api_key:#{api_key}")

      {:error, :invalid} ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: %{code: "invalid_api_key", message: "Invalid API key"}})
        |> halt()
    end
  end
end
```

## Rate Limiting

### Token Bucket Algorithm

```elixir
defmodule OsePlatformWeb.Plugs.RateLimit do
  import Plug.Conn
  require Logger

  def init(opts), do: opts

  def call(conn, opts) do
    key = rate_limit_key(conn)
    limit = Keyword.get(opts, :limit, 100)
    window_ms = Keyword.get(opts, :window_ms, 60_000)

    case check_rate_limit(key, limit, window_ms) do
      {:ok, remaining} ->
        conn
        |> put_resp_header("x-rate-limit-limit", to_string(limit))
        |> put_resp_header("x-rate-limit-remaining", to_string(remaining))
        |> put_resp_header("x-rate-limit-reset", to_string(reset_time(window_ms)))

      {:error, retry_after} ->
        conn
        |> put_status(:too_many_requests)
        |> put_resp_header("retry-after", to_string(retry_after))
        |> put_resp_header("x-rate-limit-limit", to_string(limit))
        |> put_resp_header("x-rate-limit-remaining", "0")
        |> Phoenix.Controller.json(%{
          error: %{
            code: "rate_limit_exceeded",
            message: "Too many requests. Please try again later.",
            retry_after: retry_after
          }
        })
        |> halt()
    end
  end

  defp rate_limit_key(conn) do
    cond do
      conn.assigns[:api_client] ->
        "rate_limit:client:#{conn.assigns.api_client.id}"

      conn.assigns[:current_user] ->
        "rate_limit:user:#{conn.assigns.current_user.id}"

      true ->
        ip = conn.remote_ip |> Tuple.to_list() |> Enum.join(".")
        "rate_limit:ip:#{ip}"
    end
  end

  defp check_rate_limit(key, limit, window_ms) do
    Hammer.check_rate(key, window_ms, limit)
  end

  defp reset_time(window_ms) do
    System.system_time(:second) + div(window_ms, 1000)
  end
end

# Router usage
scope "/api/v1", OsePlatformWeb.API.V1 do
  pipe_through [:api, :api_auth]

  # 10 requests per minute for donations
  scope "/donations" do
    pipe_through [{OsePlatformWeb.Plugs.RateLimit, limit: 10, window_ms: 60_000}]
    resources "/", DonationController, only: [:create]
  end

  # 100 requests per minute for reading
  resources "/charities", CharityController, only: [:index, :show]
end
```

## API Documentation

### OpenAPI with open_api_spex

```elixir
# mix.exs
{:open_api_spex, "~> 3.17"}

# API spec module
defmodule OsePlatformWeb.ApiSpec do
  alias OpenApiSpex.{Info, OpenApi, Paths, Server}

  def spec do
    %OpenApi{
      info: %Info{
        title: "OSE Platform API",
        version: "1.0.0",
        description: "API for Islamic finance operations including Zakat calculations and charitable donations"
      },
      servers: [
        %Server{url: "https://api.oseplatform.com"},
        %Server{url: "http://localhost:4000"}
      ],
      paths: Paths.from_router(OsePlatformWeb.Router)
    }
    |> OpenApiSpex.resolve_schema_modules()
  end
end

# Schema definition
defmodule OsePlatformWeb.Schemas.Donation do
  require OpenApiSpex
  alias OpenApiSpex.Schema

  OpenApiSpex.schema(%{
    title: "Donation",
    description: "A charitable donation",
    type: :object,
    properties: %{
      id: %Schema{type: :string, format: :uuid},
      amount: %Schema{type: :number, format: :decimal, minimum: 0},
      currency: %Schema{type: :string, enum: ["USD", "EUR", "SAR", "AED"]},
      donor_name: %Schema{type: :string, minLength: 2, maxLength: 100},
      donor_email: %Schema{type: :string, format: :email},
      charity_id: %Schema{type: :string, format: :uuid},
      status: %Schema{type: :string, enum: ["pending", "completed", "cancelled"]},
      donated_at: %Schema{type: :string, format: :"date-time"},
      inserted_at: %Schema{type: :string, format: :"date-time"}
    },
    required: [:amount, :charity_id],
    example: %{
      "id" => "123e4567-e89b-12d3-a456-426614174000",
      "amount" => 100.00,
      "currency" => "USD",
      "donor_name" => "Ahmed Ali",
      "donor_email" => "ahmed@example.com",
      "charity_id" => "987fcdeb-51a2-43f7-b123-456789abcdef",
      "status" => "completed",
      "donated_at" => "2024-01-15T10:30:00Z",
      "inserted_at" => "2024-01-15T10:30:00Z"
    }
  })
end

# Annotated controller
defmodule OsePlatformWeb.API.V1.DonationController do
  use OsePlatformWeb, :controller
  use OpenApiSpex.ControllerSpecs

  alias OpenApiSpex.Schema
  alias OsePlatformWeb.Schemas

  tags ["Donations"]

  operation :index,
    summary: "List donations",
    parameters: [
      charity_id: [in: :query, type: :string, description: "Filter by charity ID"],
      status: [in: :query, type: :string, enum: ["pending", "completed", "cancelled"]],
      page: [in: :query, type: :integer, minimum: 1],
      page_size: [in: :query, type: :integer, minimum: 1, maximum: 100]
    ],
    responses: [
      ok: {"Donations list", "application/json", Schemas.DonationsResponse}
    ]

  def index(conn, params) do
    # Implementation
  end

  operation :create,
    summary: "Create donation",
    request_body: {"Donation params", "application/json", Schemas.DonationRequest, required: true},
    responses: [
      created: {"Donation created", "application/json", Schemas.DonationResponse},
      unprocessable_entity: {"Validation errors", "application/json", Schemas.ErrorResponse}
    ]

  def create(conn, params) do
    # Implementation
  end
end

# Serve OpenAPI spec
scope "/api" do
  pipe_through :api

  get "/openapi", OpenApiSpex.Plug.RenderSpec, []
end
```

### Swagger UI

```elixir
# Add to router
scope "/api" do
  pipe_through :browser

  get "/swagger", OpenApiSpex.Plug.SwaggerUI, path: "/api/openapi"
end
```

Access Swagger UI at: `http://localhost:4000/api/swagger`

## Content Negotiation

### Accept Header Handling

```elixir
defmodule OsePlatformWeb.Plugs.ContentNegotiation do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    accept_header = get_req_header(conn, "accept") |> List.first() || "application/json"

    case accept_header do
      "application/json" ->
        conn

      "application/xml" ->
        # XML support if needed
        conn

      "application/vnd.api+json" ->
        # JSON API spec compliance
        assign(conn, :json_api_format, true)

      _ ->
        conn
        |> put_status(:not_acceptable)
        |> Phoenix.Controller.json(%{
          error: %{
            code: "unsupported_media_type",
            message: "Supported formats: application/json"
          }
        })
        |> halt()
    end
  end
end
```

## HATEOAS

### Hypermedia Links

```elixir
defmodule OsePlatformWeb.API.V1.DonationJSON do
  def show(%{donation: donation}) do
    %{
      data: data(donation),
      links: %{
        self: "/api/v1/donations/#{donation.id}",
        charity: "/api/v1/charities/#{donation.charity_id}",
        receipts: "/api/v1/donations/#{donation.id}/receipts"
      }
    }
  end

  defp data(donation) do
    %{
      id: donation.id,
      amount: donation.amount,
      currency: donation.currency,
      status: donation.status,
      # Include available actions
      actions: available_actions(donation)
    }
  end

  defp available_actions(%{status: "pending"}) do
    [
      %{
        name: "cancel",
        method: "DELETE",
        href: "/api/v1/donations/#{donation.id}"
      },
      %{
        name: "complete",
        method: "PATCH",
        href: "/api/v1/donations/#{donation.id}",
        body: %{status: "completed"}
      }
    ]
  end
  defp available_actions(%{status: "completed"}) do
    [
      %{
        name: "download_receipt",
        method: "GET",
        href: "/api/v1/donations/#{donation.id}/receipt.pdf"
      }
    ]
  end
  defp available_actions(_), do: []
end
```

## Best Practices Checklist

### API Design

- [ ] RESTful resource-oriented URLs
- [ ] Appropriate HTTP methods and status codes
- [ ] Consistent error response format
- [ ] API versioning strategy implemented
- [ ] Pagination for list endpoints
- [ ] Filtering and sorting support
- [ ] HATEOAS links where appropriate

### Security

- [ ] Authentication required (JWT/API keys)
- [ ] Authorization checks on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation with changesets
- [ ] HTTPS enforced in production
- [ ] CORS configured properly
- [ ] SQL injection protection (Ecto)
- [ ] XSS prevention (JSON encoding)

### Documentation

- [ ] OpenAPI specification generated
- [ ] Swagger UI available
- [ ] Example requests/responses
- [ ] Error codes documented
- [ ] Authentication flow documented
- [ ] Rate limits documented

### Performance

- [ ] Response caching headers
- [ ] Database query optimization
- [ ] N+1 queries eliminated
- [ ] Connection pooling configured
- [ ] Compression enabled

## Related Documentation

- **[Security](security.md)** - API authentication and authorization
- **[Testing](testing.md)** - API testing strategies
- **[Best Practices](best-practices.md)** - General Phoenix best practices
- **[Performance](performance.md)** - API performance optimization
