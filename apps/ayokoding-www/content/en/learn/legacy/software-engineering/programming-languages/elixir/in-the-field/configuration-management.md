---
title: "Configuration Management"
date: 2026-02-05T00:00:00+07:00
draft: false
weight: 1000027
description: "From hardcoded values to production-ready configuration with Config module, runtime config, and secure secret management"
tags: ["elixir", "configuration", "config", "runtime", "secrets", "vault"]
prev: "/en/learn/software-engineering/programming-languages/elixir/in-the-field/deployment-strategies"
next: "/en/learn/software-engineering/programming-languages/elixir/in-the-field/logging-observability"
---

**How do you manage configuration in production Elixir applications?** This guide teaches the progression from hardcoded values through compile-time config.exs to runtime configuration with environment variables, secure secret management, and validation strategies.

## Why Configuration Management Matters

Production applications need environment-specific configuration without code changes:

- **Database connections** - Different credentials for dev, staging, production
- **API keys** - Payment gateways, external services (never in source code)
- **Feature flags** - Enable/disable features per environment
- **Resource limits** - Connection pools, timeouts, memory limits
- **Shariah compliance settings** - Prayer time API endpoints, halal certification validation

Real-world configuration scenarios:

- **Financial services** - Database URLs, payment processor keys, audit log paths
- **E-commerce platforms** - Payment gateway credentials, shipping API keys, tax rates
- **Microservices** - Service discovery URLs, authentication tokens, circuit breaker thresholds
- **Multi-tenant systems** - Per-tenant database connections, feature toggles, rate limits

Production question: Should you hardcode values, use compile-time config, or load configuration at runtime? The answer depends on your deployment model and security requirements.

## Standard Library - Hardcoded Configuration

Elixir's standard library provides Application module for accessing configuration, but doesn't solve how to set it safely.

### Module Attributes - Compile-Time Constants

```elixir
# Hardcoded configuration values
defmodule PaymentService do
  @api_key "pk_live_1234567890abcdef"                # => Hardcoded API key (DANGEROUS!)
                                                      # => Compiled into bytecode
                                                      # => Type: binary()
                                                      # => Cannot change without recompile

  @database_url "postgresql://user:pass@localhost/db"
                                                      # => Database credentials in source
                                                      # => Version control exposes secrets
                                                      # => Type: binary()

  def process_payment(amount) do
    HTTPoison.post(
      "https://api.payment.com/charge",
      %{amount: amount, api_key: @api_key}           # => Uses hardcoded key
                                                      # => Cannot switch environments
    )
  end
end
```

Hardcoded values are compiled into bytecode, cannot change without recompiling, and expose secrets in version control.

### Application.get_env/3 - Reading Configuration

```elixir
# Reading application configuration
defmodule ConfigReader do
  def database_url do
    Application.get_env(:myapp, :database_url)       # => Read :myapp config
                                                      # => Key: :database_url
                                                      # => Returns: term() | nil
                                                      # => Still need to SET config somewhere
  end

  def database_url_with_default do
    Application.get_env(
      :myapp,                                         # => Application name
      :database_url,                                  # => Config key
      "postgresql://localhost/myapp_dev"              # => Default value
    )                                                 # => Returns: term()
                                                      # => Type-safe with defaults
  end
end
```

`Application.get_env/3` reads configuration but doesn't solve where configuration comes from.

## Limitations of Hardcoded Configuration

### Problem 1 - Environment-Specific Config

```elixir
# Cannot switch between environments
defmodule DatabaseConnection do
  @dev_url "postgresql://localhost/myapp_dev"
  @prod_url "postgresql://prod.db.com/myapp"

  def connect do
    # Which URL to use? Need code change!
    Postgrex.start_link(hostname: @dev_url)          # => Hardcoded to dev
                                                      # => Production deployment fails
                                                      # => Type: {:ok, pid()} | {:error, term()}
  end
end
```

Changing environments requires code modification and recompilation.

### Problem 2 - Secrets in Source Code

```elixir
# Security vulnerability
defmodule PaymentProcessor do
  @stripe_key "sk_live_actual_secret_key"           # => Secret in version control
                                                      # => All developers see key
                                                      # => Git history exposes forever
                                                      # => Security audit failure

  @aws_secret "aws_secret_access_key_value"         # => Cannot rotate without deploy
                                                      # => Compliance violation
end
```

Secrets in source code create security risks, compliance violations, and rotation difficulties.

### Problem 3 - No Configuration Validation

```elixir
# Invalid configuration crashes at runtime
defmodule FeatureFlags do
  @max_connections "100"                              # => String instead of integer
                                                      # => Type error at runtime
                                                      # => No compile-time validation

  def get_pool_size do
    @max_connections + 10                             # => Runtime error!
                                                      # => Cannot add string and integer
                                                      # => Crash in production
  end
end
```

No validation means configuration errors only surface at runtime.

## Config Module - Compile-Time Configuration

Mix provides Config module for managing environment-specific configuration.

### config/config.exs - Base Configuration

```elixir
# config/config.exs - Compile-time configuration
import Config                                         # => Import Config macros
                                                      # => Provides config/3, import_config/1

# Application configuration
config :myapp, :database,
  pool_size: 10,                                      # => Connection pool size
                                                      # => Type: pos_integer()
  timeout: 5000,                                      # => Query timeout (ms)
                                                      # => Type: pos_integer()
  queue_target: 50                                    # => Queue target time (ms)
                                                      # => Type: pos_integer()

config :myapp, MyApp.Repo,
  database: "myapp_dev",                              # => Database name
  username: "postgres",                               # => Database user
  password: "postgres",                               # => Hardcoded password (still not ideal)
  hostname: "localhost"                               # => Database host
                                                      # => All values compile-time only

# Import environment-specific config
import_config "#{config_env()}.exs"                   # => Load dev.exs, test.exs, or prod.exs
                                                      # => config_env() returns :dev | :test | :prod
```

`config.exs` provides structured configuration but values are still compile-time.

### config/dev.exs - Development Environment

```elixir
# config/dev.exs - Development-specific configuration
import Config

config :myapp, MyApp.Repo,
  database: "myapp_dev",                              # => Development database
  show_sensitive_data_on_connection_error: true,      # => Debug mode
  pool_size: 10                                       # => Smaller pool for dev
                                                      # => Type: pos_integer()

config :myapp, MyAppWeb.Endpoint,
  http: [port: 4000],                                 # => Development port
                                                      # => Type: [port: pos_integer()]
  debug_errors: true,                                 # => Show detailed errors
  code_reloader: true                                 # => Hot code reloading
```

### config/prod.exs - Production Environment

```elixir
# config/prod.exs - Production configuration
import Config

config :myapp, MyApp.Repo,
  pool_size: 20,                                      # => Larger pool for production
                                                      # => Type: pos_integer()
  queue_target: 50,                                   # => Queue management
  queue_interval: 1000                                # => Type: pos_integer()

config :myapp, MyAppWeb.Endpoint,
  http: [port: 80],                                   # => Production HTTP port
  url: [host: "example.com", port: 443],              # => Public URL
  cache_static_manifest: "priv/static/cache_manifest.json"
                                                      # => Asset cache manifest
                                                      # => Type: binary()

# Note: Still has hardcoded values!
# Need runtime.exs for true runtime config
```

Environment-specific files allow different settings per environment, but still compile-time.

### Reading Config in Application Code

```elixir
# Using configuration in modules
defmodule MyApp.PaymentService do
  @api_base Application.compile_env(:myapp, :payment_api_base)
                                                      # => Read at compile time
                                                      # => Crash if not configured
                                                      # => Type: term()

  def process_payment(amount) do
    url = "#{@api_base}/charge"                       # => Uses compile-time value
    # Make API call...
  end
end

# Runtime configuration reading
defmodule MyApp.DynamicService do
  def get_feature_flag(flag_name) do
    flags = Application.get_env(:myapp, :feature_flags, %{})
                                                      # => Read at runtime
                                                      # => Returns map or default
                                                      # => Type: map()

    Map.get(flags, flag_name, false)                  # => Get specific flag
                                                      # => Default: false
  end
end
```

Mix of compile-time (`Application.compile_env/2`) and runtime (`Application.get_env/3`) configuration.

## Runtime Configuration - config/runtime.exs

Mix 1.11+ provides `config/runtime.exs` for true runtime configuration with environment variables.

### config/runtime.exs - Runtime Configuration

```elixir
# config/runtime.exs - Loaded at application startup
import Config                                         # => Import Config macros
                                                      # => Runs when application starts
                                                      # => NOT at compile time

# Only run in production
if config_env() == :prod do
  # Database configuration from environment
  database_url = System.get_env("DATABASE_URL") ||
    raise "DATABASE_URL not set"                      # => Read from environment variable
                                                      # => Crash if missing
                                                      # => Type: binary()

  config :myapp, MyApp.Repo,
    url: database_url,                                # => Full database URL
                                                      # => Type: binary()
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")
                                                      # => Convert string to integer
                                                      # => Default: 10
                                                      # => Type: pos_integer()

  # API keys from environment
  secret_key_base = System.get_env("SECRET_KEY_BASE") ||
    raise "SECRET_KEY_BASE not set"                   # => Phoenix secret key
                                                      # => Must be 64+ chars
                                                      # => Type: binary()

  config :myapp, MyAppWeb.Endpoint,
    http: [
      port: String.to_integer(System.get_env("PORT") || "4000")
                                                      # => Dynamic port
    ],
    secret_key_base: secret_key_base                  # => Runtime secret
                                                      # => Type: binary()

  # Payment service configuration
  config :myapp, :payment,
    api_key: System.get_env("STRIPE_API_KEY") ||
      raise "STRIPE_API_KEY not set",                 # => Payment API key
    webhook_secret: System.get_env("STRIPE_WEBHOOK_SECRET")
                                                      # => Webhook validation
                                                      # => Type: binary() | nil
end
```

`runtime.exs` loads at application startup, reads environment variables, validates required values.

### Environment Variables - Setting Configuration

```bash
# Setting environment variables for production
export DATABASE_URL="postgresql://user:${DB_PASSWORD}@db.prod.com/myapp"
export POOL_SIZE="20"
export SECRET_KEY_BASE="very_long_secret_key_base_string_64_chars_min"
export STRIPE_API_KEY="sk_live_actual_production_key"
export PORT="8080"

# Start application with runtime config
mix run --no-halt
# => Reads environment variables
# => Configures application at startup
# => No recompilation needed
```

Environment variables enable configuration changes without recompilation.

### Configuration Validation

```elixir
# config/runtime.exs - Validating configuration
import Config

if config_env() == :prod do
  # Helper function for required env vars
  get_required_env = fn name ->
    System.get_env(name) ||
      raise """
      Environment variable #{name} is missing.
      Set it before starting the application.
      """
  end

  # Validate and parse integer config
  pool_size = System.get_env("POOL_SIZE", "10")       # => Default: "10"
              |> String.to_integer()                  # => Convert to integer
                                                      # => Type: integer()

  if pool_size < 1 or pool_size > 100 do
    raise "POOL_SIZE must be between 1 and 100"      # => Validation at startup
                                                      # => Fast failure
  end

  # Validate URL format
  database_url = get_required_env.("DATABASE_URL")    # => Required variable
  unless String.starts_with?(database_url, ["postgresql://", "postgres://"]) do
    raise "DATABASE_URL must be PostgreSQL URL"      # => URL format validation
  end

  config :myapp, MyApp.Repo,
    url: database_url,
    pool_size: pool_size                              # => Validated integer
end
```

Validation in `runtime.exs` provides fast failure with clear error messages.

## Production Configuration Strategies

### Strategy 1 - Config Providers (Vault, AWS Parameter Store)

```elixir
# lib/myapp/config_provider.ex - Custom config provider
defmodule MyApp.ConfigProvider do
  @behaviour Config.Provider

  def init(path) when is_binary(path) do
    path                                              # => Return path for later use
                                                      # => Type: binary()
  end

  def load(config, path) do
    # Load secrets from Vault
    vault_token = System.get_env("VAULT_TOKEN")       # => Vault authentication token
                                                      # => Type: binary()

    secrets = fetch_from_vault(vault_token, path)     # => Fetch secrets from Vault
                                                      # => Type: map()

    # Merge into configuration
    Config.Reader.merge(
      config,
      myapp: [
        repo: [
          username: secrets["db_username"],           # => Database user from Vault
          password: secrets["db_password"]            # => Database pass from Vault
                                                      # => Type: binary()
        ],
        payment: [
          api_key: secrets["stripe_key"]              # => Payment key from Vault
        ]
      ]
    )
  end

  defp fetch_from_vault(token, path) do
    # Vault API call implementation
    # Returns map of secrets
  end
end
```

Config providers fetch secrets from external systems (Vault, AWS, GCP) at startup.

### Strategy 2 - Structured Environment Variables

```elixir
# config/runtime.exs - Structured env var parsing
import Config

if config_env() == :prod do
  # Parse JSON configuration from environment
  payment_config = System.get_env("PAYMENT_CONFIG") ||
    ~s({"api_key": "", "webhook_secret": ""})        # => JSON default
                                                      # => Type: binary()

  payment_map = Jason.decode!(payment_config)         # => Parse JSON
                                                      # => Type: map()
                                                      # => Crash if invalid JSON

  # Shariah compliance configuration
  shariah_config = System.get_env("SHARIAH_CONFIG") ||
    ~s({"prayer_api": "https://api.aladhan.com", "halal_cert_validation": true})
                                                      # => Shariah compliance settings
                                                      # => Type: binary()

  shariah_map = Jason.decode!(shariah_config)         # => Parse JSON config

  config :myapp, :payment,
    api_key: payment_map["api_key"],                  # => Extract API key
    webhook_secret: payment_map["webhook_secret"]     # => Extract webhook secret

  config :myapp, :shariah,
    prayer_api_url: shariah_map["prayer_api"],        # => Prayer time API
    halal_validation: shariah_map["halal_cert_validation"]
                                                      # => Halal certification validation
end
```

Structured environment variables allow complex configuration in single env var.

### Strategy 3 - Configuration Modules

```elixir
# lib/myapp/config.ex - Configuration access module
defmodule MyApp.Config do
  @moduledoc """
  Centralized configuration access with validation and defaults.
  """

  # Database configuration
  def database_pool_size do
    Application.get_env(:myapp, :database)            # => Get database config
    |> Keyword.get(:pool_size, 10)                    # => Get pool_size with default
                                                      # => Type: pos_integer()
  end

  def database_timeout do
    Application.get_env(:myapp, :database)
    |> Keyword.get(:timeout, 5000)                    # => Get timeout with default
                                                      # => Type: pos_integer()
  end

  # Payment configuration
  def payment_api_key! do
    case Application.get_env(:myapp, :payment)[:api_key] do
      nil -> raise "Payment API key not configured"   # => Crash if missing
      ""  -> raise "Payment API key is empty"         # => Validate non-empty
      key -> key                                      # => Return valid key
                                                      # => Type: binary()
    end
  end

  # Shariah compliance configuration
  def shariah_prayer_api_url do
    Application.get_env(:myapp, :shariah)
    |> Keyword.get(:prayer_api_url, "https://api.aladhan.com")
                                                      # => Prayer time API URL
                                                      # => Type: binary()
  end

  def halal_validation_enabled? do
    Application.get_env(:myapp, :shariah)
    |> Keyword.get(:halal_validation, true)           # => Halal certification validation
                                                      # => Type: boolean()
  end

  # Feature flags
  def feature_enabled?(flag_name) do
    Application.get_env(:myapp, :feature_flags, %{})  # => Get feature flags map
    |> Map.get(flag_name, false)                      # => Get specific flag
                                                      # => Type: boolean()
  end
end
```

Configuration modules provide centralized access, validation, type safety, and documentation.

## Complete Example - Financial Application Configuration

```elixir
# config/runtime.exs - Production financial app configuration
import Config

if config_env() == :prod do
  # Helper for required config
  require_env! = fn name ->
    System.get_env(name) ||
      raise "Missing required environment variable: #{name}"
  end

  # Database configuration
  database_url = require_env!.("DATABASE_URL")        # => Required database URL
  pool_size = String.to_integer(System.get_env("POOL_SIZE") || "20")
                                                      # => Pool size with default

  config :finance_app, FinanceApp.Repo,
    url: database_url,
    pool_size: pool_size,
    queue_target: 50,                                 # => Queue management
    queue_interval: 1000,                             # => Queue interval (ms)
    ssl: true,                                        # => Require SSL
    ssl_opts: [
      verify: :verify_peer,                           # => Verify SSL certificate
      cacerts: :public_key.cacerts_get()              # => System CA certificates
    ]

  # Payment processor configuration
  config :finance_app, :payment,
    stripe_key: require_env!.("STRIPE_API_KEY"),      # => Stripe API key
    stripe_webhook: require_env!.("STRIPE_WEBHOOK_SECRET"),
                                                      # => Webhook verification
    currency: System.get_env("DEFAULT_CURRENCY") || "USD"
                                                      # => Default currency

  # Audit logging configuration
  config :finance_app, :audit,
    log_path: System.get_env("AUDIT_LOG_PATH") || "/var/log/finance_app/audit.log",
                                                      # => Audit log file path
    log_level: System.get_env("AUDIT_LOG_LEVEL") || "info"
                                                      # => Audit log level

  # Shariah compliance configuration
  config :finance_app, :shariah,
    riba_check_enabled: System.get_env("RIBA_CHECK_ENABLED") == "true",
                                                      # => Enable Riba checking
    zakat_calculation_endpoint: System.get_env("ZAKAT_API_URL") ||
      "https://api.islamic-finance.com/zakat",        # => Zakat calculation API
    halal_investment_validator: System.get_env("HALAL_VALIDATOR_URL")
                                                      # => Halal investment validation

  # Feature flags
  feature_flags =
    System.get_env("FEATURE_FLAGS") ||
    ~s({"new_dashboard": false, "advanced_charts": false})
                                                      # => JSON feature flags
    |> Jason.decode!()                                # => Parse to map

  config :finance_app, :features, feature_flags       # => Set feature flags

  # Validate critical configuration
  unless String.length(database_url) > 0 do
    raise "DATABASE_URL cannot be empty"
  end

  unless pool_size > 0 and pool_size <= 100 do
    raise "POOL_SIZE must be between 1 and 100"
  end
end

# lib/finance_app/config.ex - Configuration access module
defmodule FinanceApp.Config do
  @moduledoc """
  Centralized configuration for financial application.
  """

  # Database configuration
  def db_pool_size do
    Application.get_env(:finance_app, FinanceApp.Repo)
    |> Keyword.get(:pool_size, 10)
  end

  # Payment configuration
  def stripe_api_key! do
    Application.get_env(:finance_app, :payment)[:stripe_key] ||
      raise "Stripe API key not configured"
  end

  def default_currency, do: get_payment_config(:currency, "USD")

  # Audit configuration
  def audit_log_path do
    Application.get_env(:finance_app, :audit)[:log_path]
  end

  # Shariah compliance
  def riba_check_enabled? do
    Application.get_env(:finance_app, :shariah)[:riba_check_enabled] || false
  end

  def zakat_api_url do
    Application.get_env(:finance_app, :shariah)[:zakat_calculation_endpoint]
  end

  def halal_investment_validator_url do
    Application.get_env(:finance_app, :shariah)[:halal_investment_validator]
  end

  # Feature flags
  def feature_enabled?(flag_name) do
    Application.get_env(:finance_app, :features, %{})
    |> Map.get(to_string(flag_name), false)
  end

  # Private helpers
  defp get_payment_config(key, default) do
    Application.get_env(:finance_app, :payment)
    |> Keyword.get(key, default)
  end
end
```

Complete financial application configuration with database, payment processing, audit logging, Shariah compliance settings, and feature flags.

## Key Takeaways

**Progression**:

1. Hardcoded values (compile-time, insecure)
2. config.exs (compile-time, environment-specific)
3. runtime.exs (runtime, environment variables)
4. Config providers (external secret management)

**Best Practices**:

- Use `config/runtime.exs` for production configuration
- Read secrets from environment variables (never hardcode)
- Validate configuration at startup (fast failure)
- Provide sensible defaults where appropriate
- Use configuration modules for centralized access
- Consider config providers (Vault) for sensitive secrets
- Document required environment variables
- Separate compile-time and runtime configuration

**Security**:

- Never commit secrets to version control
- Use environment variables in production
- Rotate secrets without redeployment
- Validate configuration values
- Use SSL for database connections
- Enable certificate verification

**Production Pattern**: Use `config/runtime.exs` with environment variables for all environment-specific configuration, validate at startup, and provide centralized configuration access through dedicated modules.
