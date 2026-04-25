---
title: "Elixir Security Standards"
description: Prescriptive security requirements for Phoenix applications including authentication, authorization, and data protection
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - security
  - phoenix
  - ecto
  - input-validation
  - xss-prevention
  - sql-injection-prevention
  - csrf-protection
  - authentication
  - authorization
  - data-encryption
related:
  - ./coding-standards.md
  - ./framework-integration-standards.md
  - ./coding-standards.md
principles:
  - explicit-over-implicit
---

# Elixir Security Standards

**Prescriptive security requirements** for Elixir/Phoenix applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Quick Reference**:

- [Input Validation](#input-validation) - Ecto changesets, parameter validation
- [XSS Prevention](#xss-prevention) - Phoenix HTML escaping, CSP
- [SQL Injection Prevention](#sql-injection-prevention) - Parameterized queries
- [CSRF Protection](#csrf-protection) - Token validation
- [Authentication](#authentication) - Password hashing, JWT
- [Authorization](#authorization) - RBAC, policy-based
- [Data Protection](#data-protection) - Encryption, secret management
- [Security Headers](#security-headers) - HTTP security headers
- [Audit Logging](#audit-logging) - Security event tracking

## Input Validation

### CRITICAL: Ecto Changeset Requirements

**REQUIRED**: All user inputs MUST be validated through Ecto changesets before database operations.

**PASS**: Comprehensive changeset validation

```elixir
defmodule FinancialPlatform.Donations.Donation do
  use Ecto.Schema
  import Ecto.Changeset

  @required_fields [:amount, :currency, :donor_email, :donor_name]
  @optional_fields [:payment_method, :notes]
  @valid_currencies ["IDR", "USD", "EUR"]
  @valid_payment_methods ["credit_card", "bank_transfer", "ewallet"]

  def changeset(donation \\ %__MODULE__{}, attrs) do
    donation
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_amount()
    |> validate_currency()
    |> validate_email()
    |> validate_payment_method()
    |> validate_length(:donor_name, min: 2, max: 100)
    |> validate_length(:notes, max: 500)
  end

  defp validate_amount(changeset) do
    validate_number(changeset, :amount,
      greater_than: 0,
      less_than_or_equal_to: 1_000_000_000,
      message: "must be between 0 and 1,000,000,000"
    )
  end

  defp validate_currency(changeset) do
    validate_inclusion(changeset, :currency, @valid_currencies,
      message: "must be one of: #{Enum.join(@valid_currencies, ", ")}"
    )
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:donor_email, ~r/^[^\s]+@[^\s]+$/,
      message: "must be a valid email address"
    )
    |> validate_length(:donor_email, max: 160)
  end
end
```

**FAIL**: Skipping changeset validation

```elixir
# ❌ PROHIBITED - Direct database insert without validation
def update_donation(id, attrs) do
  Donation
  |> Repo.get(id)
  |> Repo.update(attrs)  # DANGEROUS: No validation
end
```

**REQUIRED**: Changesets MUST:

- Define all required and optional fields explicitly
- Validate data types, ranges, and formats
- Use whitelist approach (`cast/3` with explicit field list)
- Return descriptive error messages
- Validate business rules in custom validators

**REQUIRED**: Validation coverage MUST include:

- Required field presence
- Numeric ranges (min/max)
- String lengths (min/max)
- Format validation (email, phone, URL)
- Whitelist validation (enum values)
- Cross-field validation (dependent fields)

### CRITICAL: Controller Parameter Validation

**REQUIRED**: Controllers MUST validate and sanitize parameters before processing.

**PASS**: Whitelisted and sanitized parameters

```elixir
defmodule FinancialWeb.DonationController do
  use FinancialWeb, :controller

  def create(conn, params) do
    with {:ok, validated_params} <- validate_params(params),
         {:ok, donation} <- Donations.create_donation(validated_params) do
      conn
      |> put_status(:created)
      |> json(%{donation: donation})
    else
      {:error, :invalid_params} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid parameters"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  defp validate_params(%{"donation" => donation_params}) when is_map(donation_params) do
    # REQUIRED: Whitelist allowed keys
    allowed_keys = ["amount", "currency", "donor_email", "donor_name", "payment_method", "notes"]

    params =
      donation_params
      |> Map.take(allowed_keys)
      |> sanitize_strings()

    {:ok, params}
  end

  defp validate_params(_), do: {:error, :invalid_params}

  defp sanitize_strings(params) do
    Map.new(params, fn {key, value} ->
      {key, sanitize_value(value)}
    end)
  end

  defp sanitize_value(value) when is_binary(value) do
    value
    |> String.trim()
    |> String.slice(0, 1000)  # REQUIRED: Limit length
  end

  defp sanitize_value(value), do: value
end
```

**FAIL**: Accepting unvalidated parameters

```elixir
# ❌ PROHIBITED - No parameter whitelisting
def create(conn, params) do
  Donations.create_donation(params)  # DANGEROUS: All params accepted
end
```

**REQUIRED**: Parameter validation MUST:

- Whitelist allowed keys (reject unknown parameters)
- Sanitize string inputs (trim, length limits)
- Validate parameter structure (map vs list)
- Return appropriate HTTP status codes (400, 422)

## XSS Prevention

### CRITICAL: Phoenix HTML Escaping

**REQUIRED**: Phoenix automatic HTML escaping MUST NOT be bypassed except for pre-sanitized trusted content.

**PASS**: Automatic escaping (default)

```elixir
# In template (.heex)
# ✅ SAFE: Automatic escaping
<p><%= @user_input %></p>
<!-- Even if @user_input = "<script>alert('xss')</script>" -->
<!-- Rendered as: &lt;script&gt;alert('xss')&lt;/script&gt; -->
```

**FAIL**: Bypassing escaping without sanitization

```elixir
# ❌ PROHIBITED - Raw HTML without sanitization
<%= raw(@user_input) %>  # DANGEROUS: XSS vulnerability
```

**REQUIRED**: For user-provided HTML content MUST use `html_sanitize_ex`:

```elixir
# Add to mix.exs
{:html_sanitize_ex, "~> 1.4"}

defmodule FinancialPlatform.Campaigns do
  def create_campaign(attrs) do
    attrs
    |> sanitize_description()
    |> Campaign.changeset()
    |> Repo.insert()
  end

  defp sanitize_description(%{"description" => desc} = attrs) when is_binary(desc) do
    # REQUIRED: Allow only safe HTML tags
    sanitized = HtmlSanitizeEx.basic_html(desc)
    Map.put(attrs, "description", sanitized)
  end

  defp sanitize_description(attrs), do: attrs
end
```

### CRITICAL: Content Security Policy

**REQUIRED**: Phoenix applications MUST set CSP headers.

**PASS**: Strict CSP configuration

```elixir
defmodule FinancialWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :financial_platform

  plug :put_security_headers

  defp put_security_headers(conn, _opts) do
    conn
    |> put_resp_header("content-security-policy",
      "default-src 'self'; " <>
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " <>
      "style-src 'self' 'unsafe-inline'; " <>
      "img-src 'self' data: https:; " <>
      "font-src 'self'; " <>
      "connect-src 'self'; " <>
      "frame-ancestors 'none'"
    )
  end
end
```

**FAIL**: Missing CSP headers

```elixir
# ❌ PROHIBITED - No CSP headers
# Vulnerable to XSS attacks
```

**REQUIRED**: CSP MUST:

- Set `default-src 'self'` as baseline
- Explicitly allow external resources (CDNs)
- Use `frame-ancestors 'none'` to prevent clickjacking
- Set `script-src` restrictively (avoid `'unsafe-eval'` if possible)

## SQL Injection Prevention

### CRITICAL: Parameterized Query Requirements

**REQUIRED**: All database queries MUST use Ecto parameterized queries.

**PASS**: Parameterized query with `^` pin operator

```elixir
defmodule FinancialPlatform.Donations do
  import Ecto.Query

  # ✅ SAFE - parameterized query
  def search_donations(email) do
    from(d in Donation,
      where: d.donor_email == ^email
    )
    |> Repo.all()
  end

  # ✅ SAFE - Ecto handles escaping
  def search_by_amount_range(min, max) do
    from(d in Donation,
      where: d.amount >= ^min and d.amount <= ^max
    )
    |> Repo.all()
  end

  # ✅ SAFE - even with LIKE queries
  def search_by_name_pattern(pattern) do
    # Ecto escapes the pattern
    like_pattern = "%#{pattern}%"

    from(d in Donation,
      where: like(d.donor_name, ^like_pattern)
    )
    |> Repo.all()
  end
end
```

**FAIL**: String interpolation in queries

```elixir
# ❌ PROHIBITED - SQL injection vulnerable
def search_donations_unsafe(email) do
  query = "SELECT * FROM donations WHERE donor_email = '#{email}'"
  Repo.query(query)  # DANGEROUS: SQL INJECTION
end
```

**PROHIBITED**: The following are NEVER allowed:

- String interpolation in SQL queries
- `Repo.query/2` with user input concatenation
- Dynamic SQL without parameterization

**REQUIRED**: Parameterized queries MUST:

- Use `^` pin operator for all user inputs
- Use Ecto query DSL for dynamic queries
- Validate column names with whitelist for `ORDER BY`

## CSRF Protection

### CRITICAL: CSRF Token Validation

**REQUIRED**: Phoenix applications MUST enable CSRF protection for state-changing operations.

**PASS**: CSRF protection enabled

```elixir
# REQUIRED: Enabled in endpoint.ex
defmodule FinancialWeb.Endpoint do
  plug Plug.Session, @session_options
  plug :protect_from_forgery
  plug :put_secure_browser_headers
end

# In forms (.heex)
<.form for={@changeset} action={~p"/donations"} method="post">
  <%= csrf_token() %>
  <!-- Form fields -->
</.form>
```

**FAIL**: Disabling CSRF protection

```elixir
# ❌ PROHIBITED - CSRF protection disabled
defmodule FinancialWeb.API.DonationController do
  plug :skip_csrf_protection  # Only for token-based APIs
end
```

**REQUIRED**: CSRF protection MUST:

- Be enabled for all browser-based state-changing operations
- Use CSRF tokens in all forms
- Validate tokens on POST, PUT, DELETE, PATCH
- Only be disabled for stateless token-based APIs

## Authentication

### CRITICAL: Password Hashing Requirements

**REQUIRED**: Passwords MUST be hashed with bcrypt (minimum cost: 10).

**PASS**: Bcrypt password hashing

```elixir
# Add to mix.exs
{:bcrypt_elixir, "~> 3.1"}

defmodule FinancialPlatform.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true
    field :password_hash, :string
  end

  def registration_changeset(user \\ %__MODULE__{}, attrs) do
    user
    |> cast(attrs, [:email, :password])
    |> validate_required([:email, :password])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> validate_length(:password, min: 12)
    |> validate_password_strength()
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp validate_password_strength(changeset) do
    password = get_change(changeset, :password)

    cond do
      is_nil(password) ->
        changeset

      not String.match?(password, ~r/[A-Z]/) ->
        add_error(changeset, :password, "must contain at least one uppercase letter")

      not String.match?(password, ~r/[a-z]/) ->
        add_error(changeset, :password, "must contain at least one lowercase letter")

      not String.match?(password, ~r/[0-9]/) ->
        add_error(changeset, :password, "must contain at least one number")

      not String.match?(password, ~r/[!@#$%^&*(),.?":{}|<>]/) ->
        add_error(changeset, :password, "must contain at least one special character")

      true ->
        changeset
    end
  end

  defp put_password_hash(changeset) do
    case get_change(changeset, :password) do
      nil -> changeset
      password -> put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(password))
    end
  end
end

defmodule FinancialPlatform.Accounts do
  def authenticate(email, password) do
    with %User{} = user <- Repo.get_by(User, email: email),
         true <- Bcrypt.verify_pass(password, user.password_hash) do
      {:ok, user}
    else
      _ ->
        # REQUIRED: Prevent timing attacks - always run hash verification
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}
    end
  end
end
```

**FAIL**: Weak password hashing

```elixir
# ❌ PROHIBITED - Plain text passwords
field :password, :string  # DANGEROUS: Never store plain text

# ❌ PROHIBITED - Weak hashing (MD5, SHA-1)
password_hash = :crypto.hash(:md5, password)  # VULNERABLE
```

**REQUIRED**: Password handling MUST:

- Use bcrypt with cost factor 10+ (default: 12)
- Hash passwords in changeset before database insert
- Never store plain text passwords
- Run `no_user_verify()` on authentication failure (timing attack prevention)
- Validate password strength (min 12 chars, uppercase, lowercase, number, special char)

### CRITICAL: JWT Authentication

**REQUIRED**: JWT tokens MUST expire within 1 hour (access tokens).

**PASS**: Guardian JWT with expiration

```elixir
# Add to mix.exs
{:guardian, "~> 2.3"}

# config/config.exs
config :financial_platform, FinancialPlatform.Guardian,
  issuer: "financial_platform",
  secret_key: System.get_env("GUARDIAN_SECRET_KEY")

defmodule FinancialPlatform.Guardian do
  use Guardian, otp_app: :financial_platform

  def subject_for_token(%{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      nil -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end
end

defmodule FinancialWeb.AuthController do
  use FinancialWeb, :controller

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user, %{}, ttl: {1, :hour})

        conn
        |> put_status(:ok)
        |> json(%{token: token, user: user_json(user)})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid credentials"})
    end
  end
end
```

**FAIL**: Long-lived JWT tokens

```elixir
# ❌ PROHIBITED - Token expires after 30 days
{:ok, token, _claims} = Guardian.encode_and_sign(user, %{}, ttl: {30, :day})
```

**REQUIRED**: JWT authentication MUST:

- Set access token TTL to 1 hour maximum
- Set refresh token TTL to 7 days maximum
- Validate JWT signatures with RS256 or HS256
- Store JWT secrets in environment variables
- Implement token refresh endpoint

## Authorization

### CRITICAL: Role-Based Access Control

**REQUIRED**: Financial operations MUST enforce role-based permissions.

**PASS**: RBAC with method-level checks

```elixir
defmodule FinancialPlatform.Accounts.User do
  use Ecto.Schema

  schema "users" do
    field :email, :string
    field :role, Ecto.Enum, values: [:donor, :admin, :finance_manager]
  end
end

defmodule FinancialWeb.Plugs.RequireRole do
  import Plug.Conn
  import Phoenix.Controller

  def init(roles) when is_list(roles), do: roles

  def call(conn, required_roles) do
    user = conn.assigns[:current_user]

    if user && user.role in required_roles do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Insufficient permissions"})
      |> halt()
    end
  end
end

# In router
pipeline :admin do
  plug FinancialWeb.Plugs.RequireRole, [:admin]
end

scope "/api/admin", FinancialWeb.Admin do
  pipe_through [:api, :auth, :admin]
  resources "/users", UserController
end
```

**FAIL**: No authorization checks

```elixir
# ❌ PROHIBITED - No role validation
def delete(conn, %{"id" => id}) do
  # Anyone can delete!
  Donations.delete_donation(id)
end
```

**REQUIRED**: Authorization MUST:

- Define explicit roles (USER, ADMIN, AUDITOR, FINANCE_MANAGER)
- Enforce least privilege principle
- Validate ownership for user-scoped operations
- Log all authorization failures

### CRITICAL: Policy-Based Authorization

**REQUIRED**: Use Bodyguard for resource-level permissions.

**PASS**: Bodyguard policy enforcement

```elixir
# Add to mix.exs
{:bodyguard, "~> 2.4"}

defmodule FinancialPlatform.Donations.Policy do
  @behaviour Bodyguard.Policy

  # Admins can do anything
  def authorize(:all, %User{role: :admin}, _), do: :ok

  # Donors can view their own donations
  def authorize(:view_donation, %User{id: user_id}, %Donation{donor_id: donor_id})
      when user_id == donor_id do
    :ok
  end

  # Finance managers can approve donations
  def authorize(:approve_donation, %User{role: :finance_manager}, %Donation{}) do
    :ok
  end

  # Default deny
  def authorize(_, _, _), do: :error
end

defmodule FinancialWeb.DonationController do
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    donation = Donations.get_donation(id)

    with :ok <- Bodyguard.permit(Policy, :view_donation, user, donation) do
      json(conn, %{donation: donation})
    else
      :error ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "You don't have permission to view this donation"})
    end
  end
end
```

**FAIL**: No resource-level checks

```elixir
# ❌ PROHIBITED - No ownership validation
def show(conn, %{"id" => id}) do
  donation = Donations.get_donation(id)  # Anyone can view any donation
  json(conn, %{donation: donation})
end
```

**REQUIRED**: Policy-based authorization MUST:

- Check resource ownership
- Validate role permissions
- Return `:ok` or `:error` tuples
- Log policy violations

## Data Protection

### CRITICAL: PII Encryption Requirements

**REQUIRED**: All PII MUST be encrypted at rest using AES-256-GCM.

**PASS**: AES-256-GCM encryption

```elixir
defmodule FinancialPlatform.EncryptionService do
  @algorithm :aes_256_gcm
  @tag_length 16

  def encrypt(plaintext) do
    key = get_encryption_key()
    iv = :crypto.strong_rand_bytes(12)

    {ciphertext, tag} = :crypto.crypto_one_time_aead(
      @algorithm,
      key,
      iv,
      plaintext,
      "",
      @tag_length,
      true
    )

    # Return IV + tag + ciphertext (all needed for decryption)
    Base.encode64(iv <> tag <> ciphertext)
  end

  def decrypt(encrypted_base64) do
    key = get_encryption_key()
    decoded = Base.decode64!(encrypted_base64)

    <<iv::binary-12, tag::binary-16, ciphertext::binary>> = decoded

    case :crypto.crypto_one_time_aead(
           @algorithm,
           key,
           iv,
           ciphertext,
           "",
           tag,
           false
         ) do
      plaintext when is_binary(plaintext) -> {:ok, plaintext}
      :error -> {:error, :decryption_failed}
    end
  end

  defp get_encryption_key do
    # REQUIRED: Load from secrets manager or environment variable
    key_base64 = System.get_env("ENCRYPTION_KEY") ||
      raise "ENCRYPTION_KEY environment variable not set"

    Base.decode64!(key_base64)
  end
end
```

**FAIL**: Storing PII in plain text

```elixir
# ❌ PROHIBITED - Plain text PII
field :national_id, :string  # DANGEROUS: Must be encrypted
```

**REQUIRED**: PII encryption MUST:

- Use AES-256-GCM (not AES-CBC)
- Generate random IV per encryption
- Store encryption keys in secrets manager (not config files)
- Implement key rotation every 12 months

**REQUIRED**: PII includes:

- Full names, email addresses, phone numbers
- National ID numbers, passport numbers
- Account numbers, transaction details
- IP addresses, location data

### CRITICAL: Logging Sanitization

**REQUIRED**: Logs MUST NOT contain PII or sensitive data.

**PASS**: Sanitized logging

```elixir
defmodule FinancialPlatform.SanitizedLogger do
  require Logger

  def log_account_access(account, action) do
    Logger.info("Account access",
      action: action,
      account_id: account.id,
      masked_account_number: mask_account_number(account.account_number)
    )
  end

  defp mask_account_number(account_number) when is_binary(account_number) do
    if String.length(account_number) <= 4 do
      "****"
    else
      String.duplicate("*", String.length(account_number) - 4) <>
        String.slice(account_number, -4..-1)
    end
  end

  def log_authentication(username, token) do
    Logger.info("Authentication",
      username: username,
      token_hash: hash_token(token)
    )
  end

  defp hash_token(token) do
    :crypto.hash(:sha256, token)
    |> Base.encode16()
    |> String.slice(0..7)
  end
end
```

**FAIL**: Logging sensitive data

```elixir
# ❌ PROHIBITED - Logging full account numbers
Logger.info("Processing payment for account: #{account_number}")

# ❌ PROHIBITED - Logging passwords
Logger.debug("Login attempt: #{username} / #{password}")
```

**PROHIBITED**: Never log:

- Passwords
- Full account numbers (show last 4 digits only)
- JWT tokens (hash before logging)
- Credit card numbers
- API keys
- Session tokens

## Security Headers

### CRITICAL: HTTP Security Headers

**REQUIRED**: All responses MUST include security headers.

**PASS**: Comprehensive security headers

```elixir
defmodule FinancialWeb.SecurityHeaders do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> put_resp_header("x-frame-options", "DENY")
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("x-xss-protection", "1; mode=block")
    |> put_resp_header("referrer-policy", "strict-origin-when-cross-origin")
    |> put_resp_header("permissions-policy", "geolocation=(), microphone=(), camera=()")
    |> put_resp_header("strict-transport-security", "max-age=31536000; includeSubDomains")
  end
end

# In endpoint.ex
plug FinancialWeb.SecurityHeaders
```

**FAIL**: Missing security headers

```elixir
# ❌ PROHIBITED - No security headers
# Vulnerable to clickjacking, MIME sniffing, XSS
```

**REQUIRED**: Security headers MUST include:

- `X-Frame-Options: DENY` (prevent clickjacking)
- `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
- `X-XSS-Protection: 1; mode=block` (XSS protection)
- `Strict-Transport-Security: max-age=31536000` (HTTPS enforcement)
- `Referrer-Policy: strict-origin-when-cross-origin` (privacy)
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` (permissions)

## Audit Logging

### CRITICAL: Financial Audit Trail

**REQUIRED**: All financial operations MUST be logged for audit compliance.

**PASS**: Comprehensive audit logging

```elixir
defmodule FinancialPlatform.AuditLogger do
  alias FinancialPlatform.AuditLog

  def log_financial_transaction(user_id, type, amount, source, destination, status) do
    %AuditLog{}
    |> AuditLog.changeset(%{
      timestamp: DateTime.utc_now(),
      user_id: user_id,
      correlation_id: Logger.metadata()[:correlation_id],
      event_type: "FINANCIAL_TRANSACTION",
      transaction_type: type,
      amount: amount,
      source_account: source,
      destination_account: destination,
      status: status,
      ip_address: get_client_ip(),
      user_agent: get_user_agent()
    })
    |> Repo.insert!()  # REQUIRED: Synchronous write (not async)
  end

  def log_authentication(username, result) do
    %AuditLog{}
    |> AuditLog.changeset(%{
      timestamp: DateTime.utc_now(),
      event_type: "AUTHENTICATION",
      username: username,
      authentication_result: result,
      ip_address: get_client_ip()
    })
    |> Repo.insert!()
  end

  def log_authorization_failure(user_id, resource, action) do
    %AuditLog{}
    |> AuditLog.changeset(%{
      timestamp: DateTime.utc_now(),
      user_id: user_id,
      event_type: "AUTHORIZATION_FAILURE",
      resource: resource,
      action: action,
      ip_address: get_client_ip()
    })
    |> Repo.insert!()

    alert_security("Authorization failure: user=#{user_id}, resource=#{resource}")
  end
end
```

**FAIL**: Missing audit logs

```elixir
# ❌ PROHIBITED - No audit trail for financial transaction
def process_payment(amount) do
  # Process payment without logging
end
```

**REQUIRED**: Audit logs MUST:

- Be written synchronously (not deferred)
- Include timestamp, user ID, correlation ID, IP address
- Be stored in append-only database (tamper-proof)
- Be retained for minimum 7 years (regulatory compliance)
- Be accessible for audit queries with sub-second response time

**REQUIRED**: Audit the following events:

- Financial transactions (debits, credits, transfers)
- Authentication attempts (success and failure)
- Authorization failures
- Account modifications
- Zakat calculations and payments
- Configuration changes
- Data exports

## Dependency Security

### CRITICAL: Vulnerability Scanning

**REQUIRED**: All dependencies MUST be scanned for vulnerabilities.

**PASS**: Automated dependency scanning

```bash
# Add to CI/CD pipeline

# Audit dependencies for known vulnerabilities
mix deps.audit

# Update dependencies
mix deps.update --all

# Check outdated dependencies
mix hex.outdated
```

**FAIL**: No vulnerability scanning

```elixir
# ❌ PROHIBITED - Dependencies never audited
# Vulnerable to known CVEs
```

**REQUIRED**: Dependency scanning MUST:

- Run on every build (CI/CD integration)
- Fail build on HIGH or CRITICAL vulnerabilities
- Generate reports for security team review
- Update dependencies monthly (or immediately for critical CVEs)

**RECOMMENDED**: Use GitHub Dependabot or similar for automated dependency updates.

## Related Documentation

### OSE Platform Standards

- [Best Practices](./coding-standards.md) - Elixir coding standards
- [Web Services](./framework-integration-standards.md) - Phoenix API security
- [Anti-patterns](./coding-standards.md) - Security anti-patterns to avoid

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Explicit changeset validations make requirements clear
   - Explicit role checks in authorization policies
   - Explicit CSP directives define allowed resources

2. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Phoenix automatically escapes HTML by default
   - Guardian automatically validates JWT expiration
   - CSRF protection automatically validates tokens

## Compliance Checklist

Before deploying financial services, verify:

- [ ] All inputs validated through Ecto changesets
- [ ] Phoenix HTML escaping enabled (not bypassed)
- [ ] All queries use parameterized statements
- [ ] CSRF protection enabled for state-changing operations
- [ ] Passwords hashed with bcrypt (cost 10+)
- [ ] JWT tokens expire within 1 hour
- [ ] RBAC enforced for financial operations
- [ ] PII encrypted at rest with AES-256-GCM
- [ ] Logs sanitized (no PII or sensitive data)
- [ ] Security headers configured
- [ ] Financial audit logs enabled
- [ ] Dependency vulnerability scanning in CI/CD

---

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19.0 (latest)
**Phoenix Version**: 1.7+
**Status**: Active (mandatory for all Phoenix financial applications)
