---
title: Phoenix Configuration Guide
description: Comprehensive guide to Phoenix configuration including config files, runtime configuration, environment variables, and secrets management
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - elixir
  - configuration
  - environment
  - secrets
  - runtime
related:
  - deployment.md
  - security.md
  - best-practices.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Phoenix Configuration Guide

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [Elixir Phoenix](./README.md) > Configuration

### Configuration Sources

- [config/config.exs](#configconfigexs-compile-time-configuration) - Compile-time configuration
- [config/runtime.exs](#configruntimeexs-runtime-configuration) - Runtime configuration
- [Environment Variables](#environment-variables) - Externalized secrets
- [Application Environment](#application-environment-access) - Accessing configuration

### Key Topics

- [Configuration Files](#configuration-files)
- [Environment-Specific Config](#environment-specific-configuration)
- [Secrets Management](#secrets-management)
- [Configuration Validation](#configuration-validation)
- [Database Configuration](#database-configuration)

### Related Documentation

- **[Deployment](deployment.md)** - Production configuration
- **[Security](security.md)** - Secrets security
- **[Best Practices](best-practices.md)** - Configuration patterns

## Overview

Phoenix uses Elixir's configuration system with compile-time (`config.exs`) and runtime (`runtime.exs`) configuration support. Proper configuration management is essential for deploying secure, maintainable Phoenix applications handling sensitive Islamic financial data.

**Target Audience**: Developers configuring Phoenix applications for different environments (development, test, production).

**Versions**: Phoenix 1.7+, Elixir 1.14+

**Key Principles**:

- **Explicit over Implicit** - All configuration should be explicit
- **Secrets Externalized** - Never hardcode secrets
- **Environment-Specific** - Different configs for dev/test/prod
- **Runtime-Configurable** - Use `runtime.exs` for environment-dependent values

### Configuration Loading Hierarchy

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A[Application Startup] --> B[Load config/config.exs]
    B --> C{MIX_ENV?}

    C -->|dev| D[Load config/dev.exs]
    C -->|test| E[Load config/test.exs]
    C -->|prod| F[Load config/prod.exs]

    D --> G[Merge Configurations]
    E --> G
    F --> G

    G --> H[Compile Application]

    H --> I[Release Build]
    I --> J[Load config/runtime.exs]

    J --> K{Environment Variables?}
    K -->|DATABASE_URL| L[Override Database Config]
    K -->|SECRET_KEY_BASE| M[Override Secret Config]
    K -->|PHX_HOST| N[Override Endpoint Config]
    K -->|Custom Vars| O[Override Custom Config]

    L --> P[Final Application Config]
    M --> P
    N --> P
    O --> P

    P --> Q[Application.get_env#40;#41;]
    Q --> R[Running Application]

    subgraph "Compile Time #40;Mix#41;"
        B
        C
        D
        E
        F
        G
        H
    end

    subgraph "Runtime #40;Release#41;"
        I
        J
        K
        L
        M
        N
        O
        P
    end

    style B fill:#0173B2,color:#fff
    style D fill:#0173B2,color:#fff
    style E fill:#0173B2,color:#fff
    style F fill:#0173B2,color:#fff
    style J fill:#029E73,color:#fff
    style L fill:#029E73,color:#fff
    style M fill:#029E73,color:#fff
    style N fill:#029E73,color:#fff
    style P fill:#DE8F05,color:#fff
    style R fill:#CC78BC,color:#fff
```

**Configuration Loading Phases**:

1. **Compile Time** (blue):
   - `config/config.exs` loaded first (base configuration)
   - Environment-specific file loaded based on `MIX_ENV`
   - Configurations merged (env-specific overrides base)
   - Application compiled with these values

2. **Runtime** (teal):
   - `config/runtime.exs` loaded when release starts
   - Environment variables read from system
   - Runtime config overrides compile-time config
   - Enables dynamic configuration without recompilation

3. **Final Config** (orange):
   - Merged configuration available via `Application.get_env/3`
   - Used by running application

**Priority Order** (highest to lowest):

1. `config/runtime.exs` + environment variables (highest)
2. `config/{dev,test,prod}.exs`
3. `config/config.exs` (lowest)

**Best Practices**:

- **Compile-time**: Static values (feature flags, defaults)
- **Runtime**: Dynamic values (database URLs, secrets, host)
- **Secrets**: Always use environment variables in `runtime.exs`
- **Validation**: Validate required config in `runtime.exs`

## Configuration Files

### config/config.exs (Compile-Time Configuration)

The main configuration file evaluated at compile time. Use for application structure, compile-time dependencies, and development defaults.

```elixir
# config/config.exs
import Config

# Configure the application
config :ose_platform, OsePlatform.Repo,
  adapter: Ecto.Adapters.Postgres,
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

# Configure the endpoint
config :ose_platform, OsePlatformWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "dev-secret-key-change-in-production",
  render_errors: [
    formats: [html: OsePlatformWeb.ErrorHTML, json: OsePlatformWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: OsePlatform.PubSub,
  live_view: [signing_salt: "dev-signing-salt"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :transaction_id]

# Configure JSON library
config :phoenix, :json_library, Jason

# Zakat calculation settings
config :ose_platform, :zakat,
  nisab_percentage: Decimal.new("0.025"),
  hawal_days: 354,
  default_currency: "USD"

# Import environment-specific config
import_config "#{config_env()}.exs"
```

**Best Practices**:

- Use for structural configuration
- Avoid secrets (use `runtime.exs` instead)
- Import environment-specific configs at the end
- Use `config_env()` instead of `Mix.env()` (works in releases)

### config/runtime.exs (Runtime Configuration)

Evaluated at runtime, enabling environment variable access for secrets and environment-specific values.

```elixir
# config/runtime.exs
import Config

# Configure database from environment
if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :ose_platform, OsePlatform.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  # Configure endpoint from environment
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :ose_platform, OsePlatformWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base

  # Configure external API keys
  config :ose_platform, :external_apis,
    nisab_api_key: System.fetch_env!("NISAB_API_KEY"),
    payment_gateway_key: System.fetch_env!("PAYMENT_GATEWAY_KEY"),
    sms_provider_key: System.get_env("SMS_PROVIDER_KEY")
end

# Development and test configurations can also use runtime.exs
if config_env() == :dev do
  config :ose_platform, OsePlatformWeb.Endpoint,
    code_reloader: true,
    debug_errors: true,
    check_origin: false,
    watchers: [
      esbuild: {Esbuild, :install_and_run, [:default, ~w(--sourcemap=inline --watch)]},
      tailwind: {Tailwind, :install_and_run, [:default, ~w(--watch)]}
    ]
end
```

**Best Practices**:

- Load all secrets from environment variables
- Use `System.fetch_env!/1` for required variables (fails fast)
- Use `System.get_env/2` with defaults for optional variables
- Validate critical environment variables early

### Environment-Specific Configuration

#### config/dev.exs

Development environment configuration.

```elixir
# config/dev.exs
import Config

# Database configuration for development
config :ose_platform, OsePlatform.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "ose_platform_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# Endpoint configuration
config :ose_platform, OsePlatformWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "dev-secret-use-runtime-exs-for-production",
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/ose_platform_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Development tools
config :phoenix, :plug_init_mode, :runtime

# Enable dev routes for dashboard and mailbox
config :ose_platform, dev_routes: true

# Logging
config :logger, :console,
  format: "[$level] $message\n",
  level: :debug
```

#### config/test.exs

Test environment configuration.

```elixir
# config/test.exs
import Config

# Test database (separate from dev)
config :ose_platform, OsePlatform.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "ose_platform_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

# Test endpoint runs on random port
config :ose_platform, OsePlatformWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test-secret-key-only-for-testing",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
```

#### config/prod.exs

Production environment configuration (minimal, most config in `runtime.exs`).

```elixir
# config/prod.exs
import Config

# Production defaults (override in runtime.exs)
config :ose_platform, OsePlatformWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json"

# Logging
config :logger, level: :info

# Runtime configuration will be applied via config/runtime.exs
```

## Environment Variables

### Local Development (.env)

Use `.env` file for local development (never commit to version control).

```bash
# .env (load with direnv or export manually)

# Database
DATABASE_URL=ecto://postgres:postgres@localhost/ose_platform_dev
POOL_SIZE=10

# Endpoint
SECRET_KEY_BASE=dev-secret-change-in-production
PHX_HOST=localhost
PORT=4000

# External APIs (development keys)
NISAB_API_KEY=dev-nisab-key
PAYMENT_GATEWAY_KEY=dev-payment-key

# Optional services (disabled in dev)
SMS_PROVIDER_KEY=
```

**Loading environment variables in development**:

```bash
# Option 1: direnv (recommended)
# Install direnv, create .envrc
echo 'dotenv' > .envrc
direnv allow

# Option 2: Manual export
export $(cat .env | xargs)

# Option 3: Load in shell config
source .env
```

### Production Environment Variables

Production secrets should come from secure storage (Kubernetes Secrets, AWS Secrets Manager, etc.).

```bash
# Production environment (Kubernetes Secret, AWS Parameter Store, etc.)

# Database (required)
DATABASE_URL=ecto://prod_user:SECURE_PASSWORD@prod-db.example.com/ose_platform
POOL_SIZE=20
ECTO_IPV6=false

# Endpoint (required)
SECRET_KEY_BASE=LONG_SECURE_RANDOM_STRING_64_CHARS
PHX_HOST=oseplatform.com
PORT=4000

# External APIs (required)
NISAB_API_KEY=prod-nisab-api-key-secure
PAYMENT_GATEWAY_KEY=prod-payment-gateway-key-secure
SMS_PROVIDER_KEY=prod-sms-provider-key

# Optional features
ENABLE_TELEMETRY=true
LOG_LEVEL=info
```

**Generating secrets**:

```bash
# Generate SECRET_KEY_BASE (64 bytes)
mix phx.gen.secret

# Example output
5eJ4bXx3d8Kq9vN2Lp0Hs7Uj6Wf1Zm3Gc4Rt8Yn5Tb2Oe9Qw1Ia0Ud3Pv6Mk7Xl4Cs8
```

## Secrets Management

### Development Secrets

Use non-sensitive defaults in development, override with environment variables if needed.

```elixir
# config/runtime.exs (development)
if config_env() == :dev do
  config :ose_platform, :external_apis,
    # Use development keys or mock services
    nisab_api_key: System.get_env("NISAB_API_KEY", "dev-key-mock"),
    payment_gateway_key: System.get_env("PAYMENT_GATEWAY_KEY", "dev-key-mock")
end
```

### Production Secrets

**Kubernetes Secrets** (recommended for Kubernetes deployments):

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ose-platform-secrets
type: Opaque
stringData:
  DATABASE_URL: "ecto://prod_user:SECURE_PASSWORD@postgres:5432/ose_platform"
  SECRET_KEY_BASE: "LONG_SECURE_RANDOM_STRING"
  NISAB_API_KEY: "prod-nisab-api-key"
  PAYMENT_GATEWAY_KEY: "prod-payment-gateway-key"
```

**AWS Secrets Manager** (for AWS deployments):

```elixir
# config/runtime.exs
if config_env() == :prod do
  # Fetch secrets from AWS Secrets Manager at runtime
  {:ok, secrets} = ExAws.SecretsManager.get_secret_value("ose-platform/prod")
  |> ExAws.request()

  secret_map = Jason.decode!(secrets["SecretString"])

  config :ose_platform, OsePlatform.Repo,
    url: secret_map["DATABASE_URL"],
    pool_size: 20

  config :ose_platform, OsePlatformWeb.Endpoint,
    secret_key_base: secret_map["SECRET_KEY_BASE"]
end
```

### Vault Integration (HashiCorp Vault)

```elixir
# config/runtime.exs
if config_env() == :prod do
  vault_token = System.fetch_env!("VAULT_TOKEN")
  vault_path = "secret/data/ose-platform/prod"

  {:ok, %{body: vault_response}} = Vault.read(vault_path, token: vault_token)
  secrets = vault_response["data"]["data"]

  config :ose_platform, :external_apis,
    nisab_api_key: secrets["nisab_api_key"],
    payment_gateway_key: secrets["payment_gateway_key"]
end
```

## Application Environment Access

### Reading Configuration

```elixir
# Access configuration in your application code
defmodule OsePlatform.ZakatCalculator do
  @nisab_percentage Application.compile_env(:ose_platform, [:zakat, :nisab_percentage])
  @hawal_days Application.compile_env(:ose_platform, [:zakat, :hawal_days])

  def calculate_zakat(wealth) do
    # Use compile-time configuration
    nisab = wealth * @nisab_percentage

    # Or runtime configuration
    currency = Application.get_env(:ose_platform, :zakat)[:default_currency]

    # Calculation logic...
  end
end
```

**Compile-Time vs Runtime**:

- `Application.compile_env/2` - Evaluated at compile time (faster, but requires recompilation)
- `Application.get_env/3` - Evaluated at runtime (slower, but dynamic)

### Dynamic Configuration

```elixir
# For values that change at runtime
defmodule OsePlatform.ExternalAPI do
  def nisab_api_key do
    Application.get_env(:ose_platform, :external_apis)[:nisab_api_key]
  end

  def call_nisab_api(params) do
    HTTPoison.get(
      "https://api.nisab.example.com/rates",
      [{"Authorization", "Bearer #{nisab_api_key()}"}]
    )
  end
end
```

## Configuration Validation

### Validating Required Configuration

```elixir
# lib/ose_platform/application.ex
defmodule OsePlatform.Application do
  use Application

  @impl true
  def start(_type, _args) do
    # Validate configuration before starting application
    validate_configuration!()

    children = [
      OsePlatform.Repo,
      OsePlatformWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: OsePlatform.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp validate_configuration! do
    required_configs = [
      {:ose_platform, OsePlatformWeb.Endpoint, :secret_key_base},
      {:ose_platform, :external_apis, :nisab_api_key}
    ]

    Enum.each(required_configs, fn {app, key_path, subkey} ->
      config = Application.get_env(app, key_path)

      if is_nil(config[subkey]) or config[subkey] == "" do
        raise """
        Missing required configuration: #{inspect(app)}.#{inspect(key_path)}.#{inspect(subkey)}

        Please ensure this is set in your environment variables or config/runtime.exs
        """
      end
    end)
  end
end
```

### Configuration Structs

```elixir
# lib/ose_platform/config/zakat_config.ex
defmodule OsePlatform.Config.ZakatConfig do
  @moduledoc """
  Validated configuration for Zakat calculations.
  """

  @type t :: %__MODULE__{
    nisab_percentage: Decimal.t(),
    hawal_days: pos_integer(),
    default_currency: String.t()
  }

  defstruct [
    :nisab_percentage,
    :hawal_days,
    :default_currency
  ]

  @doc """
  Loads and validates Zakat configuration from application environment.
  """
  def load! do
    config = Application.fetch_env!(:ose_platform, :zakat)

    %__MODULE__{
      nisab_percentage: validate_nisab_percentage!(config[:nisab_percentage]),
      hawal_days: validate_hawal_days!(config[:hawal_days]),
      default_currency: validate_currency!(config[:default_currency])
    }
  end

  defp validate_nisab_percentage!(value) when is_struct(value, Decimal) do
    if Decimal.compare(value, Decimal.new(0)) == :gt and
       Decimal.compare(value, Decimal.new(1)) != :gt do
      value
    else
      raise ArgumentError, "nisab_percentage must be between 0 and 1"
    end
  end
  defp validate_nisab_percentage!(_), do: raise ArgumentError, "nisab_percentage must be a Decimal"

  defp validate_hawal_days!(value) when is_integer(value) and value > 0 and value <= 366, do: value
  defp validate_hawal_days!(_), do: raise ArgumentError, "hawal_days must be between 1 and 366"

  defp validate_currency!(value) when is_binary(value) and byte_size(value) == 3, do: value
  defp validate_currency!(_), do: raise ArgumentError, "default_currency must be a 3-letter currency code"
end
```

## Database Configuration

### Basic Database Configuration

```elixir
# config/runtime.exs
config :ose_platform, OsePlatform.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  queue_target: 5000,
  queue_interval: 1000
```

### Advanced Database Configuration

```elixir
# config/runtime.exs (production)
if config_env() == :prod do
  database_url = System.fetch_env!("DATABASE_URL")

  config :ose_platform, OsePlatform.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "20"),
    queue_target: 5000,
    queue_interval: 1000,
    timeout: 60_000,
    connect_timeout: 15_000,
    handshake_timeout: 15_000,
    pool_timeout: 5000,
    ssl: true,
    ssl_opts: [
      verify: :verify_peer,
      cacertfile: "/path/to/ca-cert.pem",
      server_name_indication: 'prod-db.example.com',
      customize_hostname_check: [
        match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
      ]
    ],
    prepare: :named,
    parameters: [
      plan_cache_mode: "force_custom_plan"
    ]
end
```

### Connection Pool Configuration

```elixir
# config/runtime.exs
config :ose_platform, OsePlatform.Repo,
  pool_size: pool_size,
  queue_target: 5000,        # Target queue time (ms)
  queue_interval: 1000,      # Check interval (ms)
  timeout: 60_000,           # Query timeout (ms)
  pool_timeout: 5000,        # Checkout timeout (ms)
  ownership_timeout: 60_000  # Test ownership timeout (ms)

# Pool size calculation based on environment
pool_size =
  case config_env() do
    :dev -> 10
    :test -> 2
    :prod ->
      # Calculate based on available database connections
      # Rule: (total_db_connections / num_app_instances) - reserved_connections
      max_connections = String.to_integer(System.get_env("DB_MAX_CONNECTIONS") || "100")
      app_instances = String.to_integer(System.get_env("APP_INSTANCES") || "5")
      reserved = 10  # For migrations, admin tools

      div(max_connections - reserved, app_instances)
  end
```

## Islamic Finance Configuration Examples

### Zakat Calculation Configuration

```elixir
# config/config.exs
config :ose_platform, :zakat,
  # Nisab threshold (2.5% of wealth)
  nisab_percentage: Decimal.new("0.025"),

  # Hawal period (354 days - lunar year)
  hawal_days: 354,

  # Default currency
  default_currency: "USD",

  # Gold nisab (85 grams)
  gold_nisab_grams: Decimal.new("85"),

  # Silver nisab (595 grams)
  silver_nisab_grams: Decimal.new("595"),

  # Calculation method (:gold | :silver | :average)
  nisab_method: :silver,

  # Enable automatic reminders
  enable_reminders: true,
  reminder_days_before: [30, 14, 7, 1]
```

### Murabaha Configuration

```elixir
# config/config.exs
config :ose_platform, :murabaha,
  # Maximum profit margin (percentage)
  max_profit_margin: Decimal.new("0.30"),

  # Minimum down payment (percentage)
  min_down_payment: Decimal.new("0.20"),

  # Maximum contract term (months)
  max_term_months: 120,

  # Early payment discount allowed
  allow_early_payment_discount: true,

  # Late payment handling (no penalty interest, only damages)
  late_payment_charity_percentage: Decimal.new("0.01")
```

### Donation Platform Configuration

```elixir
# config/config.exs
config :ose_platform, :donations,
  # Payment gateway
  payment_gateway: :stripe,

  # Supported currencies
  supported_currencies: ["USD", "EUR", "GBP", "SAR", "AED"],

  # Minimum donation amounts (per currency)
  min_donation: %{
    "USD" => Decimal.new("1.00"),
    "EUR" => Decimal.new("1.00"),
    "GBP" => Decimal.new("1.00"),
    "SAR" => Decimal.new("5.00"),
    "AED" => Decimal.new("5.00")
  },

  # Tax receipt configuration
  enable_tax_receipts: true,
  tax_receipt_email_from: "receipts@oseplatform.com",

  # Anonymous donations
  allow_anonymous: true
```

### Waqf Configuration

```elixir
# config/config.exs
config :ose_platform, :waqf,
  # Waqf types
  supported_types: [:perpetual, :temporary, :cash, :property],

  # Distribution methods
  distribution_methods: [:immediate, :scheduled, :threshold_based],

  # Beneficiary verification
  require_beneficiary_verification: true,

  # Reporting frequency (days)
  reporting_frequency: 30
```

## Configuration Best Practices

### PASS Examples

**Externalize secrets**:

```elixir
# ✅ PASS - Secrets from environment
config :ose_platform, :external_apis,
  nisab_api_key: System.fetch_env!("NISAB_API_KEY")
```

**Validate early**:

```elixir
# ✅ PASS - Validate on application start
def start(_type, _args) do
  validate_configuration!()
  # ...
end
```

**Use runtime.exs for environment-dependent values**:

```elixir
# ✅ PASS - Runtime configuration
# config/runtime.exs
if config_env() == :prod do
  config :ose_platform, OsePlatform.Repo,
    url: System.fetch_env!("DATABASE_URL")
end
```

### FAIL Examples

**Hardcoded secrets**:

```elixir
# ❌ FAIL - Secret in source code
config :ose_platform, :external_apis,
  nisab_api_key: "sk_live_hardcoded_secret_key"
```

**No validation**:

```elixir
# ❌ FAIL - Missing validation
config :ose_platform, :zakat,
  nisab_percentage: "invalid_value"  # String instead of Decimal
```

**Compile-time environment variables**:

```elixir
# ❌ FAIL - Environment variable at compile time (config.exs)
# This won't work in releases
config :ose_platform, OsePlatform.Repo,
  url: System.get_env("DATABASE_URL")  # Returns nil in releases
```

## Related Documentation

- **[Deployment](deployment.md)** - Production configuration and releases
- **[Security](security.md)** - Secrets security and encryption
- **[Best Practices](best-practices.md)** - Configuration patterns and conventions
- **[Testing](testing.md)** - Test configuration and setup

---

**Phoenix Version**: 1.7+
**Elixir Version**: 1.14+
