---
title: Phoenix Security Guide
description: Comprehensive guide to authentication, authorization, CSRF protection, XSS prevention, session management, and API security in Phoenix applications
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - elixir
  - security
  - authentication
  - authorization
  - csrf
  - xss
  - sessions
related:
  - channels.md
  - liveview.md
  - rest-apis.md
  - best-practices.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Phoenix Security Guide

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [Elixir Phoenix](./README.md) > Security

### At a Glance

| Security Layer   | Phoenix Approach        | Key Libraries               |
| ---------------- | ----------------------- | --------------------------- |
| Authentication   | Plugs, Sessions, Tokens | Guardian, Pow, phx.gen.auth |
| Authorization    | Policy modules, Plugs   | Bodyguard, Canada           |
| CSRF Protection  | Built-in tokens         | Phoenix.Controller          |
| SQL Injection    | Parameterized queries   | Ecto                        |
| XSS Prevention   | Auto-escaping templates | HEEx                        |
| Session Security | Signed cookies          | Plug.Session                |
| API Security     | JWT, OAuth2             | Guardian, Joken             |

## Overview

Security is paramount for Phoenix applications, especially those handling sensitive Islamic financial data like Zakat calculations, Murabaha contracts, and charitable donations. This guide covers authentication, authorization, and protection against common vulnerabilities.

**Target Audience**: Developers implementing secure authentication, authorization, and data protection in Phoenix applications.

**Versions**: Phoenix 1.7+, Elixir 1.14+, Guardian 2.0+

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [CSRF Protection](#csrf-protection)
4. [SQL Injection Prevention](#sql-injection-prevention)
5. [XSS Prevention](#xss-prevention)
6. [Session Management](#session-management)
7. [API Security](#api-security)
8. [Channel Security](#channel-security)
9. [Security Headers](#security-headers)
10. [Common Vulnerabilities](#common-vulnerabilities)

## Authentication

### Password-Based Authentication

#### Password Hashing with Bcrypt

```elixir
# Schema with password hashing
defmodule OsePlatform.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :role, :string, default: "user"

    timestamps()
  end

  def registration_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:email, :password, :role])
    |> validate_email()
    |> validate_password(opts)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:email, max: 160)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset, opts) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 12, max: 72)
    |> validate_format(:password, ~r/[a-z]/, message: "at least one lowercase letter")
    |> validate_format(:password, ~r/[A-Z]/, message: "at least one uppercase letter")
    |> validate_format(:password, ~r/[0-9]/, message: "at least one digit")
    |> validate_format(:password, ~r/[^a-zA-Z0-9]/, message: "at least one special character")
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :hash_password, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      changeset
      # Bcrypt with cost 14 for strong hashing
      |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end

  def valid_password?(%__MODULE__{hashed_password: hashed_password}, password)
      when is_binary(hashed_password) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hashed_password)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end
end
```

**Islamic Finance Example**: Securing User Accounts for Zakat Platform

```elixir
defmodule OsePlatform.Zakat.ZakatUser do
  use Ecto.Schema
  import Ecto.Changeset

  schema "zakat_users" do
    field :email, :string
    field :hashed_password, :string, redact: true
    field :full_name, :string
    field :can_calculate_zakat, :boolean, default: true
    field :can_view_reports, :boolean, default: false

    has_many :zakat_calculations, OsePlatform.Zakat.Calculation

    timestamps()
  end

  # Strong password requirements for financial data access
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :full_name, :can_calculate_zakat, :can_view_reports])
    |> validate_required([:email, :full_name])
    |> validate_email()
    |> unique_constraint(:email)
  end
end
```

#### Session-Based Authentication

```elixir
# Authentication context
defmodule OsePlatform.Accounts do
  import Ecto.Query, warn: false
  alias OsePlatform.Repo
  alias OsePlatform.Accounts.User

  ## User registration

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  ## Session management

  def get_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    user = Repo.get_by(User, email: email)
    if User.valid_password?(user, password), do: user
  end

  def create_user_session_token(user) do
    {token, user_token} = UserToken.build_session_token(user)
    Repo.insert!(user_token)
    token
  end

  def get_user_by_session_token(token) do
    {:ok, query} = UserToken.verify_session_token_query(token)
    Repo.one(query)
  end

  def delete_user_session_token(token) do
    Repo.delete_all(UserToken.token_and_context_query(token, "session"))
    :ok
  end
end
```

```elixir
# Authentication plug
defmodule OsePlatformWeb.UserAuth do
  use OsePlatformWeb, :verified_routes

  import Plug.Conn
  import Phoenix.Controller

  alias OsePlatform.Accounts

  # Plug to fetch current user from session
  def fetch_current_user(conn, _opts) do
    {user_token, conn} = ensure_user_token(conn)
    user = user_token && Accounts.get_user_by_session_token(user_token)
    assign(conn, :current_user, user)
  end

  defp ensure_user_token(conn) do
    if token = get_session(conn, :user_token) do
      {token, conn}
    else
      conn = fetch_cookies(conn, signed: [@remember_me_cookie])

      if token = conn.cookies[@remember_me_cookie] do
        {token, put_session(conn, :user_token, token)}
      else
        {nil, conn}
      end
    end
  end

  # Plug to require authenticated user
  def require_authenticated_user(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_flash(:error, "You must log in to access this page.")
      |> maybe_store_return_to()
      |> redirect(to: ~p"/users/log_in")
      |> halt()
    end
  end

  defp maybe_store_return_to(%{method: "GET"} = conn) do
    put_session(conn, :user_return_to, current_path(conn))
  end

  defp maybe_store_return_to(conn), do: conn

  @remember_me_cookie "_ose_platform_web_user_remember_me"
  @remember_me_options [sign: true, max_age: 60 * 60 * 24 * 60, same_site: "Lax"]

  def log_in_user(conn, user, params \\ %{}) do
    token = Accounts.create_user_session_token(user)
    user_return_to = get_session(conn, :user_return_to)

    conn
    |> renew_session()
    |> put_session(:user_token, token)
    |> maybe_write_remember_me_cookie(token, params)
    |> redirect(to: user_return_to || signed_in_path(conn))
  end

  defp maybe_write_remember_me_cookie(conn, token, %{"remember_me" => "true"}) do
    put_resp_cookie(conn, @remember_me_cookie, token, @remember_me_options)
  end

  defp maybe_write_remember_me_cookie(conn, _token, _params), do: conn

  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end

  def log_out_user(conn) do
    user_token = get_session(conn, :user_token)
    user_token && Accounts.delete_user_session_token(user_token)

    conn
    |> renew_session()
    |> delete_resp_cookie(@remember_me_cookie)
    |> redirect(to: ~p"/")
  end
end
```

### Token-Based Authentication with Guardian

```elixir
# Guardian configuration
defmodule OsePlatform.Guardian do
  use Guardian, otp_app: :ose_platform

  alias OsePlatform.Accounts

  def subject_for_token(%{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def subject_for_token(_, _) do
    {:error, :reason_for_error}
  end

  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      nil -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end

  def resource_from_claims(_claims) do
    {:error, :reason_for_error}
  end

  # Custom claims for Islamic finance permissions
  def build_claims(claims, %{role: role, can_calculate_zakat: can_calc}, _opts) do
    {:ok, claims
     |> Map.put("role", role)
     |> Map.put("zakat_calc", can_calc)}
  end

  def build_claims(claims, _resource, _opts) do
    {:ok, claims}
  end
end
```

```elixir
# Guardian pipeline for API
defmodule OsePlatformWeb.Guardian.AuthPipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :ose_platform,
    module: OsePlatform.Guardian,
    error_handler: OsePlatformWeb.Guardian.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource
end
```

```elixir
# API controller using Guardian
defmodule OsePlatformWeb.API.V1.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat
  alias OsePlatform.Guardian

  plug OsePlatformWeb.Guardian.AuthPipeline when action in [:create, :update, :delete]

  def create(conn, %{"calculation" => params}) do
    current_user = Guardian.Plug.current_resource(conn)

    # Verify user has permission
    unless current_user.can_calculate_zakat do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Insufficient permissions"})
      |> halt()
    end

    case Zakat.create_calculation(current_user, params) do
      {:ok, calculation} ->
        conn
        |> put_status(:created)
        |> json(%{data: calculation})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end
end
```

### Custom JWT Implementation

```elixir
# JWT token module using Joken
defmodule OsePlatform.Token do
  use Joken.Config

  @impl true
  def token_config do
    default_claims(default_exp: 60 * 60 * 24) # 24 hours
    |> add_claim("user_id", nil, &is_integer/1)
    |> add_claim("role", nil, &is_binary/1)
  end

  def generate_and_sign(user) do
    extra_claims = %{
      "user_id" => user.id,
      "role" => user.role,
      "email" => user.email
    }

    generate_and_sign!(extra_claims)
  end

  def verify_and_validate(token) do
    with {:ok, claims} <- verify_and_validate(token) do
      {:ok, claims}
    end
  end
end
```

**❌ FAIL - Weak Token Security**

```elixir
# BAD: Token without expiration
defmodule BadToken do
  def generate(user_id) do
    # No expiration, can be used forever!
    Phoenix.Token.sign(MyAppWeb.Endpoint, "user", user_id)
  end
end

# BAD: No token validation
def create(conn, %{"token" => token}) do
  # Directly trusting client token without verification
  user_id = String.to_integer(token)
  user = Accounts.get_user!(user_id)
end
```

**✅ PASS - Secure Token Implementation**

```elixir
# GOOD: Token with expiration and validation
defmodule GoodToken do
  @max_age 86400 # 24 hours

  def generate(user_id) do
    Phoenix.Token.sign(MyAppWeb.Endpoint, "user", user_id)
  end

  def verify(token) do
    Phoenix.Token.verify(MyAppWeb.Endpoint, "user", token, max_age: @max_age)
  end
end

# GOOD: Proper token validation
def create(conn, %{"token" => token}) do
  with {:ok, user_id} <- GoodToken.verify(token),
       %User{} = user <- Accounts.get_user(user_id) do
    # Token validated, user exists
    render(conn, :show, user: user)
  else
    _ ->
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "Invalid or expired token"})
  end
end
```

## Authorization

### Policy-Based Authorization with Bodyguard

```elixir
# Policy module
defmodule OsePlatform.Zakat.Policy do
  @moduledoc """
  Authorization policies for Zakat calculations
  """

  @behaviour Bodyguard.Policy

  alias OsePlatform.Accounts.User
  alias OsePlatform.Zakat.Calculation

  # Admin can do anything
  def authorize(:view_calculation, %User{role: "admin"}, _calculation), do: :ok
  def authorize(:create_calculation, %User{role: "admin"}, _), do: :ok
  def authorize(:update_calculation, %User{role: "admin"}, _calculation), do: :ok
  def authorize(:delete_calculation, %User{role: "admin"}, _calculation), do: :ok

  # Users can only view their own calculations
  def authorize(:view_calculation, %User{id: user_id}, %Calculation{user_id: user_id}), do: :ok

  # Users with permission can create calculations
  def authorize(:create_calculation, %User{can_calculate_zakat: true}, _), do: :ok

  # Users can update their own calculations
  def authorize(:update_calculation, %User{id: user_id}, %Calculation{user_id: user_id}), do: :ok

  # Users can delete their own calculations
  def authorize(:delete_calculation, %User{id: user_id}, %Calculation{user_id: user_id}), do: :ok

  # Deny everything else
  def authorize(_, _, _), do: :error
end
```

```elixir
# Using the policy in controller
defmodule OsePlatformWeb.ZakatController do
  use OsePlatformWeb, :controller

  alias OsePlatform.Zakat
  alias OsePlatform.Zakat.Policy

  def show(conn, %{"id" => id}) do
    calculation = Zakat.get_calculation!(id)

    with :ok <- Bodyguard.permit(Policy, :view_calculation, conn.assigns.current_user, calculation) do
      render(conn, :show, calculation: calculation)
    else
      :error ->
        conn
        |> put_status(:forbidden)
        |> put_flash(:error, "You don't have permission to view this calculation")
        |> redirect(to: ~p"/zakat")
    end
  end

  def create(conn, %{"calculation" => params}) do
    with :ok <- Bodyguard.permit(Policy, :create_calculation, conn.assigns.current_user, nil) do
      case Zakat.create_calculation(conn.assigns.current_user, params) do
        {:ok, calculation} ->
          conn
          |> put_flash(:info, "Calculation created successfully")
          |> redirect(to: ~p"/zakat/#{calculation}")

        {:error, changeset} ->
          render(conn, :new, changeset: changeset)
      end
    else
      :error ->
        conn
        |> put_status(:forbidden)
        |> put_flash(:error, "You don't have permission to create calculations")
        |> redirect(to: ~p"/zakat")
    end
  end
end
```

### Role-Based Access Control (RBAC)

```elixir
# Authorization plug for role-based access
defmodule OsePlatformWeb.Plugs.RequireRole do
  import Plug.Conn
  import Phoenix.Controller

  def init(roles) when is_list(roles), do: roles
  def init(role), do: [role]

  def call(conn, required_roles) do
    user = conn.assigns.current_user

    if user && user.role in required_roles do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> put_flash(:error, "Insufficient permissions")
      |> redirect(to: "/")
      |> halt()
    end
  end
end
```

```elixir
# Using role-based authorization in router
defmodule OsePlatformWeb.Router do
  use OsePlatformWeb, :router

  pipeline :admin do
    plug :require_authenticated_user
    plug OsePlatformWeb.Plugs.RequireRole, "admin"
  end

  pipeline :zakat_calculator do
    plug :require_authenticated_user
    plug OsePlatformWeb.Plugs.RequireRole, ["admin", "zakat_calculator"]
  end

  scope "/admin", OsePlatformWeb.Admin do
    pipe_through [:browser, :admin]

    resources "/users", UserController
    resources "/reports", ReportController
  end

  scope "/zakat", OsePlatformWeb do
    pipe_through [:browser, :zakat_calculator]

    resources "/calculations", ZakatController
  end
end
```

### Attribute-Based Access Control

```elixir
# Donation policy with attribute-based authorization
defmodule OsePlatform.Donations.Policy do
  @moduledoc """
  Authorization policies for charitable donations
  """

  alias OsePlatform.Accounts.User
  alias OsePlatform.Donations.Donation

  # View public donations
  def can_view?(%User{}, %Donation{is_public: true}), do: true

  # View own donations
  def can_view?(%User{id: user_id}, %Donation{donor_id: user_id}), do: true

  # Admins can view all
  def can_view?(%User{role: "admin"}, %Donation{}), do: true

  # Charity managers can view donations to their charity
  def can_view?(
    %User{role: "charity_manager", managed_charity_id: charity_id},
    %Donation{charity_id: charity_id}
  ), do: true

  def can_view?(_, _), do: false

  # Create donation - must have verified account
  def can_create?(%User{email_verified: true, status: "active"}), do: true
  def can_create?(_), do: false

  # Update donation - only within 1 hour of creation
  def can_update?(%User{id: user_id}, %Donation{donor_id: user_id, inserted_at: inserted_at}) do
    DateTime.diff(DateTime.utc_now(), inserted_at, :second) < 3600
  end
  def can_update?(_, _), do: false
end
```

## CSRF Protection

### Built-in CSRF Protection

Phoenix automatically includes CSRF protection for forms. The CSRF token is embedded in forms and verified on submission.

```heex
<!-- CSRF token automatically included in forms -->
<.form for={@changeset} action={~p"/zakat"}>
  <.input field={@changeset[:amount]} label="Amount" />
  <.input field={@changeset[:asset_type]} label="Asset Type" />
  <.button>Calculate Zakat</.button>
</.form>
```

### CSRF Protection in API Endpoints

```elixir
# Configuring CSRF for API
defmodule OsePlatformWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :ose_platform

  @session_options [
    store: :cookie,
    key: "_ose_platform_key",
    signing_salt: "your_signing_salt",
    same_site: "Lax"
  ]

  plug Plug.Session, @session_options

  # CSRF protection for web routes
  plug :protect_from_forgery
  plug :put_secure_browser_headers
end
```

```elixir
# Exempting API routes from CSRF
defmodule OsePlatformWeb.Router do
  use OsePlatformWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    # No CSRF protection for API - use token auth instead
  end

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {OsePlatformWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug OsePlatformWeb.UserAuth.fetch_current_user
  end
end
```

### CSRF in LiveView

```elixir
# LiveView automatically handles CSRF
defmodule OsePlatformWeb.ZakatLive.Form do
  use OsePlatformWeb, :live_view

  def render(assigns) do
    ~H"""
    <div>
      <.form for={@form} phx-submit="save">
        <.input field={@form[:wealth]} label="Total Wealth" type="number" />
        <.input field={@form[:debts]} label="Debts" type="number" />
        <.button>Calculate Zakat</.button>
      </.form>
    </div>
    """
  end

  def handle_event("save", %{"calculation" => params}, socket) do
    # CSRF automatically verified by LiveView
    case Zakat.create_calculation(socket.assigns.current_user, params) do
      {:ok, calculation} ->
        {:noreply,
         socket
         |> put_flash(:info, "Zakat calculated: #{calculation.amount}")
         |> push_navigate(to: ~p"/zakat/#{calculation}")}

      {:error, changeset} ->
        {:noreply, assign(socket, form: to_form(changeset))}
    end
  end
end
```

## SQL Injection Prevention

Ecto provides automatic protection against SQL injection through parameterized queries.

**❌ FAIL - SQL Injection Vulnerability**

```elixir
# DANGEROUS: String interpolation in queries
defmodule BadQueries do
  def search_donations(name) do
    # SQL INJECTION VULNERABILITY!
    query = "SELECT * FROM donations WHERE donor_name = '#{name}'"
    Ecto.Adapters.SQL.query!(Repo, query, [])
  end

  def filter_by_amount(amount) do
    # SQL INJECTION VULNERABILITY!
    from(d in Donation, where: fragment("amount > #{amount}"))
    |> Repo.all()
  end
end
```

**✅ PASS - Safe Parameterized Queries**

```elixir
# SAFE: Ecto's query DSL
defmodule SafeQueries do
  import Ecto.Query

  def search_donations(name) do
    # Safe - Ecto parameterizes the query
    from(d in Donation, where: d.donor_name == ^name)
    |> Repo.all()
  end

  def filter_by_amount(amount) do
    # Safe - parameter binding
    from(d in Donation, where: d.amount > ^amount)
    |> Repo.all()
  end

  def complex_search(min_amount, charity_id, status) do
    # Safe - all parameters properly bound
    from(d in Donation,
      where: d.amount >= ^min_amount,
      where: d.charity_id == ^charity_id,
      where: d.status == ^status
    )
    |> Repo.all()
  end

  # Even fragments are safe when using parameter binding
  def search_with_fragment(search_term) do
    # Safe - parameter is bound
    from(d in Donation,
      where: fragment("donor_name ILIKE ?", ^"%#{search_term}%")
    )
    |> Repo.all()
  end
end
```

**Islamic Finance Example**: Safe Zakat Calculation Queries

```elixir
defmodule OsePlatform.Zakat.Queries do
  import Ecto.Query

  def list_calculations_for_user(user_id, year) do
    from(c in Calculation,
      where: c.user_id == ^user_id,
      where: c.year == ^year,
      order_by: [desc: c.inserted_at]
    )
    |> Repo.all()
  end

  def get_total_zakat_by_charity(charity_id, start_date, end_date) do
    from(d in Distribution,
      where: d.charity_id == ^charity_id,
      where: d.distributed_at >= ^start_date,
      where: d.distributed_at <= ^end_date,
      select: sum(d.amount)
    )
    |> Repo.one()
  end

  # Safe dynamic queries
  def filter_calculations(filters) do
    Calculation
    |> filter_by_year(filters[:year])
    |> filter_by_status(filters[:status])
    |> filter_by_min_amount(filters[:min_amount])
    |> Repo.all()
  end

  defp filter_by_year(query, nil), do: query
  defp filter_by_year(query, year) do
    from(c in query, where: c.year == ^year)
  end

  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status) do
    from(c in query, where: c.status == ^status)
  end

  defp filter_by_min_amount(query, nil), do: query
  defp filter_by_min_amount(query, amount) do
    from(c in query, where: c.total_zakat >= ^amount)
  end
end
```

## XSS Prevention

### HEEx Auto-Escaping

Phoenix's HEEx templates automatically escape all output, preventing XSS attacks.

**❌ FAIL - XSS Vulnerability**

```heex
<!-- DANGEROUS: raw/1 bypasses escaping -->
<div>
  <%= raw(@user_comment) %>
</div>

<!-- DANGEROUS: Passing unsanitized data to JavaScript -->
<script>
  var userName = "<%= @user.name %>";
</script>
```

**✅ PASS - Safe Output Escaping**

```heex
<!-- SAFE: HEEx automatically escapes -->
<div>
  <%= @user_comment %>
</div>

<!-- SAFE: JSON encoding for JavaScript -->
<script>
  var userName = <%= Jason.encode!(@user.name) %>;
</script>

<!-- SAFE: Using data attributes -->
<div data-user-name={@user.name}>
  User details
</div>
```

### Content Security Policy

```elixir
# Adding CSP headers
defmodule OsePlatformWeb.SecureHeaders do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> put_resp_header("content-security-policy", csp_header())
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("x-frame-options", "DENY")
    |> put_resp_header("x-xss-protection", "1; mode=block")
    |> put_resp_header("referrer-policy", "strict-origin-when-cross-origin")
  end

  defp csp_header do
    """
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self';
    frame-ancestors 'none';
    """
    |> String.replace("\n", " ")
    |> String.trim()
  end
end
```

## Session Management

### Secure Session Configuration

```elixir
# config/config.exs
config :ose_platform, OsePlatformWeb.Endpoint,
  # ... other config
  session: [
    store: :cookie,
    key: "_ose_platform_key",
    signing_salt: "your_signing_salt",
    encryption_salt: "your_encryption_salt",
    # 30 days
    max_age: 60 * 60 * 24 * 30,
    secure: true, # HTTPS only
    http_only: true, # Not accessible via JavaScript
    same_site: "Lax" # CSRF protection
  ]
```

### Session Renewal on Authentication

```elixir
defmodule OsePlatformWeb.UserAuth do
  # ...

  def log_in_user(conn, user, params \\ %{}) do
    token = Accounts.create_user_session_token(user)
    user_return_to = get_session(conn, :user_return_to)

    conn
    # Renew session to prevent session fixation
    |> renew_session()
    |> put_session(:user_token, token)
    |> put_session(:live_socket_id, "users_sessions:#{Base.url_encode64(token)}")
    |> maybe_write_remember_me_cookie(token, params)
    |> redirect(to: user_return_to || signed_in_path(conn))
  end

  defp renew_session(conn) do
    conn
    |> configure_session(renew: true)
    |> clear_session()
  end
end
```

## API Security

### API Key Authentication

```elixir
defmodule OsePlatformWeb.Plugs.APIKeyAuth do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "x-api-key") do
      [api_key] ->
        verify_api_key(conn, api_key)

      _ ->
        conn
        |> send_resp(401, Jason.encode!(%{error: "Missing API key"}))
        |> halt()
    end
  end

  defp verify_api_key(conn, api_key) do
    case OsePlatform.APIKeys.verify(api_key) do
      {:ok, client} ->
        assign(conn, :api_client, client)

      {:error, :invalid} ->
        conn
        |> send_resp(401, Jason.encode!(%{error: "Invalid API key"}))
        |> halt()
    end
  end
end
```

### Rate Limiting

```elixir
# Using Hammer for rate limiting
defmodule OsePlatformWeb.Plugs.RateLimit do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, opts) do
    key = rate_limit_key(conn, opts)
    limit = Keyword.get(opts, :limit, 100)
    window = Keyword.get(opts, :window_ms, 60_000) # 1 minute

    case Hammer.check_rate(key, window, limit) do
      {:allow, _count} ->
        conn

      {:deny, _limit} ->
        conn
        |> send_resp(429, Jason.encode!(%{error: "Rate limit exceeded"}))
        |> halt()
    end
  end

  defp rate_limit_key(conn, opts) do
    case Keyword.get(opts, :by, :ip) do
      :ip ->
        ip = conn.remote_ip |> Tuple.to_list() |> Enum.join(".")
        "rate_limit:ip:#{ip}"

      :user ->
        user_id = conn.assigns[:current_user]&.id || "anonymous"
        "rate_limit:user:#{user_id}"

      :api_key ->
        api_key = get_req_header(conn, "x-api-key") |> List.first()
        "rate_limit:api_key:#{api_key}"
    end
  end
end
```

**Islamic Finance Example**: Protecting Donation API

```elixir
defmodule OsePlatformWeb.API.V1.DonationController do
  use OsePlatformWeb, :controller

  # Rate limit: 10 donations per minute per user
  plug OsePlatformWeb.Plugs.RateLimit, by: :user, limit: 10, window_ms: 60_000 when action == :create
  plug OsePlatformWeb.Guardian.AuthPipeline

  def create(conn, %{"donation" => params}) do
    current_user = Guardian.Plug.current_resource(conn)

    with {:ok, donation} <- Donations.create_donation(current_user, params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/donations/#{donation.id}")
      |> json(%{
        data: %{
          id: donation.id,
          amount: donation.amount,
          charity: donation.charity_id,
          status: donation.status
        }
      })
    else
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end
end
```

## Channel Security

### Channel Authentication

```elixir
# Socket authentication
defmodule OsePlatformWeb.UserSocket do
  use Phoenix.Socket

  channel "zakat:*", OsePlatformWeb.ZakatChannel
  channel "donations:*", OsePlatformWeb.DonationsChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "users_socket:#{socket.assigns.user_id}"
end
```

```elixir
# Channel authorization
defmodule OsePlatformWeb.ZakatChannel do
  use OsePlatformWeb, :channel

  alias OsePlatform.Zakat

  @impl true
  def join("zakat:lobby", _payload, socket) do
    # Anyone can join the lobby
    {:ok, socket}
  end

  def join("zakat:" <> calculation_id, _params, socket) do
    calculation = Zakat.get_calculation!(calculation_id)
    user_id = socket.assigns.user_id

    # Only owner or admin can join private calculation room
    if authorized_to_view?(user_id, calculation) do
      {:ok, assign(socket, :calculation_id, calculation_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  defp authorized_to_view?(user_id, %{user_id: owner_id}) when user_id == owner_id, do: true
  defp authorized_to_view?(user_id, _calculation) do
    user = Accounts.get_user!(user_id)
    user.role == "admin"
  end

  @impl true
  def handle_in("update_calculation", %{"amount" => amount}, socket) do
    calculation = Zakat.get_calculation!(socket.assigns.calculation_id)

    # Verify user owns this calculation
    if calculation.user_id == socket.assigns.user_id do
      case Zakat.update_calculation(calculation, %{amount: amount}) do
        {:ok, updated} ->
          broadcast!(socket, "calculation_updated", %{calculation: updated})
          {:reply, {:ok, %{calculation: updated}}, socket}

        {:error, _changeset} ->
          {:reply, {:error, %{reason: "Update failed"}}, socket}
      end
    else
      {:reply, {:error, %{reason: "unauthorized"}}, socket}
    end
  end
end
```

## Security Headers

```elixir
defmodule OsePlatformWeb.SecureHeaders do
  import Plug.Conn

  @security_headers [
    # Prevent MIME type sniffing
    {"x-content-type-options", "nosniff"},
    # Prevent clickjacking
    {"x-frame-options", "DENY"},
    # Enable XSS protection (legacy browsers)
    {"x-xss-protection", "1; mode=block"},
    # Referrer policy
    {"referrer-policy", "strict-origin-when-cross-origin"},
    # Prevent browsers from guessing content type
    {"x-download-options", "noopen"},
    # Disable DNS prefetching
    {"x-dns-prefetch-control", "off"}
  ]

  def init(opts), do: opts

  def call(conn, _opts) do
    Enum.reduce(@security_headers, conn, fn {key, value}, acc ->
      put_resp_header(acc, key, value)
    end)
  end
end
```

## Common Vulnerabilities

### Insecure Direct Object References (IDOR)

**❌ FAIL - IDOR Vulnerability**

```elixir
# VULNERABLE: No authorization check
def show(conn, %{"id" => id}) do
  calculation = Zakat.get_calculation!(id)
  render(conn, :show, calculation: calculation)
end
```

**✅ PASS - Proper Authorization**

```elixir
# SECURE: Authorization before access
def show(conn, %{"id" => id}) do
  calculation = Zakat.get_calculation!(id)
  current_user = conn.assigns.current_user

  with :ok <- Bodyguard.permit(ZakatPolicy, :view_calculation, current_user, calculation) do
    render(conn, :show, calculation: calculation)
  else
    :error ->
      conn
      |> put_status(:forbidden)
      |> put_flash(:error, "You don't have permission to view this calculation")
      |> redirect(to: ~p"/zakat")
  end
end
```

### Mass Assignment

**❌ FAIL - Mass Assignment Vulnerability**

```elixir
# VULNERABLE: Allowing all params
def update(conn, %{"id" => id, "user" => user_params}) do
  user = Accounts.get_user!(id)

  # User could set role="admin" in params!
  changeset = User.changeset(user, user_params)

  case Repo.update(changeset) do
    {:ok, user} -> render(conn, :show, user: user)
    {:error, changeset} -> render(conn, :edit, changeset: changeset)
  end
end
```

**✅ PASS - Controlled Parameter Casting**

```elixir
# SECURE: Only allow specific fields
defmodule User do
  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :full_name]) # role NOT allowed
    |> validate_required([:email, :full_name])
  end

  def admin_update_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :full_name, :role]) # role only for admins
    |> validate_required([:email, :full_name])
    |> validate_inclusion(:role, ["user", "admin", "zakat_calculator"])
  end
end

def update(conn, %{"id" => id, "user" => user_params}) do
  user = Accounts.get_user!(id)
  current_user = conn.assigns.current_user

  # Use appropriate changeset based on authorization
  changeset = if current_user.role == "admin" do
    User.admin_update_changeset(user, user_params)
  else
    User.update_changeset(user, user_params)
  end

  case Repo.update(changeset) do
    {:ok, user} -> render(conn, :show, user: user)
    {:error, changeset} -> render(conn, :edit, changeset: changeset)
  end
end
```

## Security Checklist

### Pre-Deployment Security Review

- [ ] All passwords are hashed with bcrypt (cost 12+)
- [ ] CSRF protection enabled for all forms
- [ ] Session cookies are httponly and secure
- [ ] API endpoints require authentication
- [ ] Authorization checks before data access
- [ ] SQL queries use parameterized bindings
- [ ] User input is validated with changesets
- [ ] HEEx templates don't use raw/1 unnecessarily
- [ ] Security headers configured
- [ ] Rate limiting on sensitive endpoints
- [ ] Secrets stored in environment variables
- [ ] Database credentials not in version control
- [ ] HTTPS enforced in production
- [ ] Content Security Policy configured
- [ ] Error messages don't leak sensitive info
- [ ] File uploads validated and scanned
- [ ] Session timeout implemented
- [ ] Account lockout after failed logins
- [ ] Audit logging for sensitive operations

## Related Documentation

- **[REST APIs](rest-apis.md)** - API authentication and authorization patterns
- **[Channels](channels.md)** - WebSocket security and authentication
- **[LiveView](liveview.md)** - LiveView security considerations
- **[Best Practices](best-practices.md)** - Security best practices
- **[Configuration](configuration.md)** - Secure configuration management
