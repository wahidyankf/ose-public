---
title: Elixir Build Configuration Standards
description: Authoritative OSE Platform build configuration standards for Mix, Hex, umbrella projects, release management, and version control with asdf/MISE
category: explanation
subcategory: prog-lang
tags:
  - elixir
  - mix
  - hex
  - build-configuration
  - dependency-management
  - reproducibility
  - umbrella-projects
  - asdf
  - releases
principles:
  - reproducibility
  - explicit-over-implicit
  - automation-over-manual
created: 2026-02-05
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Elixir fundamentals from [AyoKoding Elixir Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an Elixir tutorial. We define HOW to apply Elixir build tools in THIS codebase, not WHAT Mix or Hex are.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Elixir Build Configuration Standards

## Purpose

This document defines **authoritative build configuration standards** for Elixir development in the OSE Platform. These prescriptive rules govern Mix project structure, Hex dependency management, version control with asdf/MISE, umbrella project organization, and OTP release configuration.

**Target Audience**: OSE Platform Elixir developers, build engineers, DevOps teams

**Scope**: Mix build tool, Hex package manager, dependency versioning, umbrella projects, release configuration, version management, build automation

**Principles Applied**:

- **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)** - MUST ensure deterministic builds
- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - MUST declare all configuration explicitly
- **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)** - MUST automate build processes

## 🔧 Mix Build Tool

### Project Structure (MUST Follow)

**Standard Mix project structure**:

```
financial_domain/
├── _build/           # Compiled artifacts (MUST NOT commit)
├── deps/             # Downloaded dependencies (MUST NOT commit)
├── lib/              # Application source code (MUST commit)
│   ├── financial_domain.ex
│   └── financial_domain/
│       ├── donation.ex
│       └── zakat.ex
├── test/             # Test files (MUST commit)
│   ├── test_helper.exs
│   └── financial_domain_test.exs
├── config/           # Configuration files (MUST commit)
│   ├── config.exs    # Compile-time configuration
│   ├── runtime.exs   # Runtime configuration
│   ├── dev.exs       # Development environment
│   ├── test.exs      # Test environment
│   └── prod.exs      # Production environment (DEPRECATED - use runtime.exs)
├── priv/             # Static assets, database migrations (MUST commit)
├── mix.exs           # Project configuration (MUST commit)
├── mix.lock          # Dependency lock file (MUST commit - CRITICAL)
└── README.md
```

**Critical Rules**:

- ✅ **MUST** commit `mix.lock` to version control (reproducibility requirement)
- ✅ **MUST** gitignore `_build/` and `deps/` (generated artifacts)
- ✅ **MUST** place runtime configuration in `config/runtime.exs` (NOT `config/prod.exs`)
- ❌ **MUST NOT** commit compiled artifacts in `_build/`
- ❌ **MUST NOT** commit downloaded dependencies in `deps/`

### mix.exs Configuration (MUST Requirements)

**Required fields and structure**:

```elixir
defmodule FinancialDomain.MixProject do
  use Mix.Project

  def project do
    [
      # === REQUIRED FIELDS ===
      # MUST: Application name (atom)
      app: :financial_domain,

      # MUST: Semantic version (string)
      version: "0.1.0",

      # MUST: Elixir version constraint (string)
      elixir: "~> 1.17",

      # MUST: Production stability flag
      start_permanent: Mix.env() == :prod,

      # === BUILD CONFIGURATION ===
      # MUST: Specify compilation paths per environment
      elixirc_paths: elixirc_paths(Mix.env()),

      # MUST: Specify compiler options (warnings as errors in CI)
      elixirc_options: [warnings_as_errors: System.get_env("CI") == "true"],

      # MUST: Specify compilers
      compilers: Mix.compilers(),

      # === DEPENDENCIES ===
      # MUST: Dependency function
      deps: deps(),

      # === OPTIONAL CONFIGURATION ===
      # SHOULD: Releases configuration for production
      releases: releases(),

      # SHOULD: Documentation configuration
      name: "Financial Domain",
      source_url: "https://github.com/oseplatform/financial_domain",
      docs: docs(),

      # SHOULD: Test coverage configuration
      test_coverage: test_coverage(),
      preferred_cli_env: preferred_cli_env(),

      # SHOULD: Dialyzer configuration
      dialyzer: dialyzer()
    ]
  end

  # OTP application configuration
  def application do
    [
      extra_applications: [:logger, :runtime_tools],
      mod: {FinancialDomain.Application, []}
    ]
  end

  # MUST: Specify compilation paths per environment
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # MUST: Dependency declarations
  defp deps do
    [
      # Production dependencies
      {:phoenix, "~> 1.7.0"},
      {:ecto_sql, "~> 3.12"},
      {:postgrex, ">= 0.0.0"},
      {:jason, "~> 1.4"},

      # Development and test dependencies
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:ex_doc, "~> 0.31", only: :dev, runtime: false},
      {:excoveralls, "~> 0.18", only: :test}
    ]
  end

  # SHOULD: Release configuration
  defp releases do
    [
      financial_domain: [
        include_executables_for: [:unix],
        applications: [runtime_tools: :permanent]
      ]
    ]
  end

  # SHOULD: Documentation configuration
  defp docs do
    [
      main: "FinancialDomain",
      extras: ["README.md"]
    ]
  end

  # SHOULD: Test coverage configuration
  defp test_coverage do
    [tool: ExCoveralls]
  end

  # SHOULD: CLI environment preferences
  defp preferred_cli_env do
    [
      coveralls: :test,
      "coveralls.detail": :test,
      "coveralls.post": :test,
      "coveralls.html": :test
    ]
  end

  # SHOULD: Dialyzer configuration
  defp dialyzer do
    [
      plt_add_apps: [:ex_unit],
      plt_file: {:no_warn, "priv/plts/dialyzer.plt"}
    ]
  end
end
```

### Compilation Options (MUST Enable)

**Warnings as errors in CI/CD**:

```elixir
# MUST: Enable warnings_as_errors in CI environment
elixirc_options: [warnings_as_errors: System.get_env("CI") == "true"]
```

**Rationale**: Prevents warning accumulation; MUST fail CI builds on warnings but SHOULD NOT block local development.

### Build Paths (Standard Organization)

**MUST** use standard Mix build paths:

- `_build/dev/` - Development compiled artifacts
- `_build/test/` - Test compiled artifacts
- `_build/prod/` - Production compiled artifacts
- `deps/` - Downloaded dependencies (shared across environments)

**Custom build paths** (umbrella projects):

```elixir
def project do
  [
    # Shared build directory for umbrella
    build_path: "../../_build",
    config_path: "../../config/config.exs",
    deps_path: "../../deps",
    lockfile: "../../mix.lock"
  ]
end
```

### Mix Tasks (Custom Task Creation)

**SHOULD** create custom Mix tasks for project-specific operations:

```elixir
# lib/mix/tasks/financial_domain.setup.ex
defmodule Mix.Tasks.FinancialDomain.Setup do
  @moduledoc """
  Setup task for financial domain.

  ## Usage

      mix financial_domain.setup

  This task performs:
  - Database creation and migration
  - Seed data loading
  - External service verification
  """
  use Mix.Task

  @shortdoc "Setup financial domain for development"

  @impl Mix.Task
  def run(_args) do
    Mix.Task.run("ecto.create")
    Mix.Task.run("ecto.migrate")
    Mix.Task.run("run", ["priv/repo/seeds.exs"])
  end
end
```

**Common custom tasks**:

- `mix [app].setup` - Initial project setup
- `mix [app].reset` - Reset development environment
- `mix [app].check` - Run all quality checks

## 📦 Dependency Management with Hex

### mix.exs deps() Function (MUST Requirements)

**MUST** use semantic versioning constraints:

```elixir
defp deps do
  [
    # === RECOMMENDED: ~> constraint (allows patches) ===
    {:phoenix, "~> 1.7.0"},       # >= 1.7.0 and < 1.8.0
    {:ecto_sql, "~> 3.12"},       # >= 3.12.0 and < 4.0.0

    # === ALLOWED: >= constraint (with upper bound) ===
    {:postgrex, ">= 0.0.0 and < 1.0.0"},

    # === PROHIBITED: Exact version (prevents security patches) ===
    # {:phoenix, "== 1.7.0"},  # ❌ NEVER USE

    # === PROHIBITED: Loose ranges (too permissive) ===
    # {:phoenix, ">= 1.0.0"},  # ❌ NO UPPER BOUND

    # === ENVIRONMENT-SPECIFIC DEPENDENCIES ===
    {:phoenix_live_reload, "~> 1.4", only: :dev},
    {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
    {:excoveralls, "~> 0.18", only: :test},

    # === GIT DEPENDENCIES (use sparingly) ===
    {:custom_lib, git: "https://github.com/org/custom_lib.git", tag: "v1.0.0"},

    # === PATH DEPENDENCIES (umbrella only) ===
    {:financial_core, in_umbrella: true}
  ]
end
```

**Version Constraint Rules**:

| Constraint Pattern | Meaning              | Use Case                        | Status     |
| ------------------ | -------------------- | ------------------------------- | ---------- |
| `~> 1.7.0`         | >= 1.7.0 and < 1.8.0 | **RECOMMENDED** for stable deps | ✅ Use     |
| `~> 1.7`           | >= 1.7.0 and < 2.0.0 | **ACCEPTABLE** for libraries    | ✅ Use     |
| `>= 0.0.0`         | Any version          | **ACCEPTABLE** for Erlang libs  | ⚠️ Caution |
| `== 1.7.0`         | Exact version        | **PROHIBITED** (blocks patches) | ❌ Never   |
| `>= 1.0.0`         | No upper bound       | **PROHIBITED** (too loose)      | ❌ Never   |

### mix.lock Management (MUST Commit)

**CRITICAL**: `mix.lock` MUST be committed to version control for reproducible builds.

**Lock file ensures**:

- Exact dependency versions across all environments
- Reproducible builds on CI/CD
- Same dependency tree for all developers
- Security through verified checksums

**Example lock file structure**:

```elixir
%{
  "phoenix": {:hex, :phoenix, "1.7.11", "sha256:...", [:mix], [{:plug, "~> 1.15", [...]}], "hexpm", "..."},
  "plug": {:hex, :plug, "1.15.3", "sha256:...", [:mix], [], "hexpm", "..."},
  "ecto": {:hex, :ecto, "3.11.2", "sha256:...", [:mix], [...], "hexpm", "..."}
}
```

**Lock file workflow**:

```bash
# Initial setup: Creates mix.lock
mix deps.get

# Later: Uses locked versions
mix deps.get

# Update specific dependency (updates mix.lock)
mix deps.update phoenix

# Update all dependencies (updates mix.lock)
mix deps.update --all

# Verify checksums
mix deps.get --check-locked
```

**Rules**:

- ✅ **MUST** commit `mix.lock` to git
- ✅ **MUST** use `mix deps.get` for reproducible builds
- ✅ **SHOULD** use `mix deps.update` explicitly when updating
- ❌ **MUST NOT** use `mix deps.update` in CI/CD pipelines
- ❌ **MUST NOT** edit `mix.lock` manually

### Hex Package Versions (MUST Use Specific Versions)

**MUST** avoid overly permissive version ranges in production applications.

**Correct approach**:

```elixir
defp deps do
  [
    # Specific minor version constraint
    {:phoenix, "~> 1.7.0"},      # Allows 1.7.x, blocks 1.8.x

    # Specific major version constraint
    {:ecto_sql, "~> 3.12"},      # Allows 3.x.x, blocks 4.x.x

    # Override transitive dependency if needed
    {:plug, "~> 1.15", override: true}
  ]
end
```

**Prohibited ranges**:

```elixir
defp deps do
  [
    # ❌ NO UPPER BOUND (too permissive)
    {:phoenix, ">= 1.7.0"},

    # ❌ EXACT VERSION (prevents patches)
    {:phoenix, "== 1.7.11"}
  ]
end
```

**Rationale**: Balance between stability (specific versions) and security (allowing patches).

### Private Hex Repositories (When to Use)

**Use cases for private Hex repos**:

- Internal shared libraries not suitable for public hex.pm
- Organization-specific domain logic packages
- Security-sensitive code requiring access control

**Configuration for Hex.pm organizations**:

```bash
# Authenticate with organization
mix hex.organization auth oseplatform

# Or set environment variable
export HEX_ORGANIZATION_KEY=your-key-here
```

**Declaring private dependencies**:

```elixir
defp deps do
  [
    # Public package
    {:phoenix, "~> 1.7.0"},

    # Private organization package
    {:financial_core, "~> 1.0", organization: "oseplatform"}
  ]
end
```

### Dependency Conflict Resolution

**Common conflict scenario**:

```elixir
# Package A requires {:shared, "~> 1.0"}
# Package B requires {:shared, "~> 2.0"}
# Conflict!
```

**Resolution strategies**:

**Strategy 1: Use override (if compatible)**:

```elixir
defp deps do
  [
    {:package_a, "~> 1.0"},
    {:package_b, "~> 2.0"},
    {:shared, "~> 2.0", override: true}  # Force version 2.0
  ]
end
```

**Strategy 2: Update dependent packages**:

```bash
mix deps.update package_a package_b
```

**Strategy 3: Fork and fix (last resort)**:

```elixir
defp deps do
  [
    {:package_a, git: "https://github.com/yourfork/package_a", branch: "update-deps"}
  ]
end
```

**Debugging conflicts**:

```bash
# Show dependency tree
mix deps.tree

# Show why a dependency is included
mix deps.tree | grep shared

# Check for conflicts
mix deps.check

# Verbose resolution info
mix deps.get --verbose
```

## 🎯 Version Management (MUST for Reproducibility)

### asdf/MISE with .tool-versions (MUST Pin Versions)

**MUST** use asdf or MISE to pin Elixir and Erlang/OTP versions.

**.tool-versions structure**:

```
# OSE Platform standard versions
elixir 1.17.3-otp-27
erlang 27.2
```

**Commands**:

```bash
# Install specific versions
asdf install elixir 1.17.3-otp-27
asdf install erlang 27.2

# Set local project versions
asdf local elixir 1.17.3-otp-27
asdf local erlang 27.2

# Verify versions
asdf current
```

**Rules**:

- ✅ **MUST** commit `.tool-versions` to version control
- ✅ **MUST** pin Elixir version with OTP suffix (e.g., `1.17.3-otp-27`)
- ✅ **MUST** pin Erlang/OTP version
- ❌ **MUST NOT** rely on system-installed Elixir
- ❌ **MUST NOT** use generic version specifiers (e.g., `latest`)

### Elixir Version Directive in mix.exs (MUST Specify)

**MUST** specify Elixir version compatibility in `mix.exs`:

```elixir
def project do
  [
    app: :financial_domain,
    version: "0.1.0",

    # MUST: Specify Elixir version constraint
    elixir: "~> 1.17",  # >= 1.17.0 and < 2.0.0

    # For stricter control
    # elixir: "~> 1.17.3",  # >= 1.17.3 and < 1.18.0
  ]
end
```

**Version strategy alignment**:

| Requirement Level   | Version Constraint  | Use Case                          |
| ------------------- | ------------------- | --------------------------------- |
| Baseline (1.12+)    | `elixir: "~> 1.12"` | Legacy support                    |
| Recommended (1.17+) | `elixir: "~> 1.17"` | **Current OSE Platform standard** |
| Latest (1.19)       | `elixir: "~> 1.19"` | New projects                      |

### Erlang/OTP Version Compatibility (MUST Document)

**MUST** document Erlang/OTP compatibility in README:

```markdown
## Requirements

- Elixir: 1.17.3+
- Erlang/OTP: 27.2+
- PostgreSQL: 16+
```

**Elixir-Erlang compatibility matrix**:

| Elixir Version | Required OTP | Recommended OTP |
| -------------- | ------------ | --------------- |
| 1.12.x         | 22 - 24      | 24              |
| 1.17.x         | 25 - 27      | 27              |
| 1.19.x         | 26 - 27      | 27              |

**Rationale**: Erlang/OTP version impacts performance, features, and security.

### CI/CD Version Alignment (MUST Match)

**MUST** ensure CI/CD uses same versions as local development.

**GitHub Actions example**:

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # MUST: Use erlef/setup-beam with pinned versions
      - uses: erlef/setup-beam@v1
        with:
          elixir-version: "1.17.3"
          otp-version: "27.2"

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            deps
            _build
          key: ${{ runner.os }}-mix-${{ hashFiles('**/mix.lock') }}

      - name: Install dependencies
        run: mix deps.get

      - name: Run tests
        run: mix test
```

**Rules**:

- ✅ **MUST** pin Elixir and OTP versions in CI config
- ✅ **MUST** cache `deps/` and `_build/` for faster CI
- ✅ **MUST** use `mix.lock` for cache key
- ❌ **MUST NOT** use `latest` or floating versions

## 🏗️ Umbrella Projects (Context-Specific)

### When to Use Umbrella Projects

**Use umbrella projects when**:

- Multiple deployable applications share domain logic
- Clear separation between domain, web, API, and worker apps
- Testing isolation required for different components
- Independent deployment of different interfaces

**Do NOT use umbrella projects when**:

- Single monolithic application suffices
- Complexity outweighs benefits
- Team unfamiliar with umbrella structure

### Umbrella Structure (Standard Organization)

```
financial_platform/          # Umbrella root
├── apps/
│   ├── financial_core/      # Domain logic (MUST be core)
│   │   ├── lib/
│   │   ├── test/
│   │   └── mix.exs
│   ├── financial_web/       # Phoenix web interface
│   │   ├── lib/
│   │   ├── test/
│   │   └── mix.exs
│   ├── financial_api/       # REST API
│   │   ├── lib/
│   │   ├── test/
│   │   └── mix.exs
│   └── financial_worker/    # Background jobs
│       ├── lib/
│       ├── test/
│       └── mix.exs
├── config/                   # Shared configuration
│   ├── config.exs
│   ├── runtime.exs
│   ├── dev.exs
│   └── test.exs
├── mix.exs                  # Umbrella configuration
└── mix.lock                 # Shared lock file (CRITICAL)
```

**Creating umbrella projects**:

```bash
# Create umbrella
mix new financial_platform --umbrella

# Navigate to apps directory
cd financial_platform/apps

# Create child apps
mix new financial_core
mix phx.new financial_web
mix new financial_api --sup
```

### Shared Dependencies (Umbrella Management)

**Umbrella root mix.exs**:

```elixir
# financial_platform/mix.exs
defmodule FinancialPlatform.MixProject do
  use Mix.Project

  def project do
    [
      apps_path: "apps",
      version: "0.1.0",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases()
    ]
  end

  # Shared dependencies for all apps
  defp deps do
    [
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["cmd mix deps.get --all", "cmd mix ecto.setup"],
      test: ["cmd mix test --all"]
    ]
  end
end
```

**Child app mix.exs**:

```elixir
# apps/financial_web/mix.exs
defmodule FinancialWeb.MixProject do
  use Mix.Project

  def project do
    [
      app: :financial_web,
      version: "0.1.0",

      # MUST: Point to umbrella root
      build_path: "../../_build",
      config_path: "../../config/config.exs",
      deps_path: "../../deps",
      lockfile: "../../mix.lock",

      elixir: "~> 1.17",
      deps: deps()
    ]
  end

  defp deps do
    [
      # Depend on sibling app
      {:financial_core, in_umbrella: true},

      # External dependencies
      {:phoenix, "~> 1.7.0"},
      {:phoenix_html, "~> 4.0"}
    ]
  end
end
```

### Cross-App Communication (Internal API Patterns)

**MUST** communicate through public module APIs, not internal implementation:

```elixir
# apps/financial_core/lib/financial_core/donations.ex
defmodule FinancialCore.Donations do
  @moduledoc """
  Public API for donation operations.
  """

  def create_donation(attrs) do
    # Implementation
  end

  def list_donations(filters) do
    # Implementation
  end
end

# apps/financial_web/lib/financial_web/controllers/donation_controller.ex
defmodule FinancialWeb.DonationController do
  use FinancialWeb, :controller

  # CORRECT: Use public API from core
  alias FinancialCore.Donations

  def create(conn, %{"donation" => donation_params}) do
    case Donations.create_donation(donation_params) do
      {:ok, donation} ->
        render(conn, :show, donation: donation)

      {:error, changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end
end
```

**Rules**:

- ✅ **MUST** use `{:app_name, in_umbrella: true}` for inter-app dependencies
- ✅ **MUST** call public APIs from sibling apps
- ❌ **MUST NOT** access internal modules directly
- ❌ **MUST NOT** create circular dependencies between apps

## 🚀 Release Configuration (MUST for Production)

### mix release Setup (OTP Releases)

**MUST** use `mix release` for production deployments:

```elixir
# mix.exs
def project do
  [
    app: :financial_domain,
    version: "0.1.0",
    releases: releases()
  ]
end

defp releases do
  [
    financial_domain: [
      # MUST: Include executables
      include_executables_for: [:unix],

      # MUST: Specify permanent applications
      applications: [
        runtime_tools: :permanent,
        financial_domain: :permanent
      ],

      # SHOULD: Include release steps
      steps: [:assemble, :tar],

      # SHOULD: Strip debug information for smaller size
      strip_beams: [keep: ["Docs"]]
    ]
  ]
end
```

**Building releases**:

```bash
# Build release
MIX_ENV=prod mix release

# Build release with specific version
MIX_ENV=prod mix release --version 1.0.0

# Build tarball
MIX_ENV=prod mix release --overwrite
```

### Release Configuration (runtime.exs vs config.exs)

**MUST** use `config/runtime.exs` for runtime configuration (environment variables):

```elixir
# config/runtime.exs
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  config :financial_domain, FinancialDomain.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  config :financial_web, FinancialWeb.Endpoint,
    http: [port: String.to_integer(System.get_env("PORT") || "4000")],
    secret_key_base: secret_key_base
end
```

**DEPRECATED: Do NOT use config/prod.exs for runtime config**:

```elixir
# ❌ WRONG: config/prod.exs (compile-time, baked into release)
config :financial_domain, FinancialDomain.Repo,
  url: System.get_env("DATABASE_URL")  # Evaluated at compile time!
```

**Rationale**: `config/runtime.exs` evaluated at runtime; `config/prod.exs` evaluated at compile time.

### Environment Variables (Configuration Requirements)

**MUST** document all required environment variables:

```markdown
## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string (e.g., `ecto://user:pass@localhost/db`)
- `SECRET_KEY_BASE` - Phoenix secret key (generate with `mix phx.gen.secret`)

### Optional

- `PORT` - HTTP port (default: 4000)
- `POOL_SIZE` - Database connection pool size (default: 10)
- `LOG_LEVEL` - Logging level (default: info)
```

**Configuration validation**:

```elixir
# config/runtime.exs
defmodule ConfigValidator do
  def require_env!(name) do
    System.get_env(name) ||
      raise """
      environment variable #{name} is missing.
      """
  end
end

database_url = ConfigValidator.require_env!("DATABASE_URL")
secret_key_base = ConfigValidator.require_env!("SECRET_KEY_BASE")
```

### Hot Code Upgrades (When Appropriate - Rarely)

**Hot code upgrades are RARELY appropriate in OSE Platform**.

**Use hot upgrades ONLY when**:

- Zero-downtime requirement is absolute
- Load balancer not available
- State loss unacceptable

**For most cases, SHOULD use rolling deployments instead**:

1. Deploy new version to new instances
2. Drain traffic from old instances
3. Shut down old instances

**Rationale**: Hot upgrades are complex, error-prone, and rarely worth the effort in containerized deployments.

## ⚙️ Build Automation (MUST Requirements)

### Mix Aliases (Custom Build Commands)

**SHOULD** define custom aliases for common workflows:

```elixir
# mix.exs
def project do
  [
    aliases: aliases()
  ]
end

defp aliases do
  [
    # Setup project
    setup: ["deps.get", "ecto.setup"],

    # Database operations
    "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
    "ecto.reset": ["ecto.drop", "ecto.setup"],

    # Testing with database setup
    test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],

    # Quality checks
    check: ["format --check-formatted", "credo --strict", "dialyzer"],

    # Asset compilation
    "assets.deploy": ["esbuild default --minify", "phx.digest"]
  ]
end
```

**Usage**:

```bash
# Setup project for first time
mix setup

# Run quality checks
mix check

# Reset database
mix ecto.reset
```

### Pre-Commit Hooks (Formatting and Linting)

**SHOULD** use Git pre-commit hooks for automatic formatting:

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Format staged Elixir files
mix format --check-formatted || {
  echo "Code formatting issues detected. Running mix format..."
  mix format
  exit 1
}

# Run Credo
mix credo --strict || {
  echo "Credo issues detected. Fix before committing."
  exit 1
}
```

**Or use Husky for JavaScript ecosystem integration**:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "mix format && mix credo"
    }
  }
}
```

### CI/CD Integration (GitHub Actions/GitLab CI Patterns)

**GitHub Actions CI/CD template**:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: erlef/setup-beam@v1
        with:
          elixir-version: "1.17.3"
          otp-version: "27.2"

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            deps
            _build
          key: ${{ runner.os }}-mix-${{ hashFiles('**/mix.lock') }}
          restore-keys: |
            ${{ runner.os }}-mix-

      - name: Install dependencies
        run: mix deps.get

      - name: Check formatting
        run: mix format --check-formatted

      - name: Run Credo
        run: mix credo --strict

      - name: Run tests
        run: mix test --cover

      - name: Run Dialyzer
        run: mix dialyzer
```

### Reproducible Builds (Ensuring Deterministic Compilation)

**Checklist for reproducible builds**:

- ✅ Pin Elixir version in `.tool-versions`
- ✅ Pin Erlang/OTP version in `.tool-versions`
- ✅ Commit `mix.lock` to version control
- ✅ Use `mix deps.get` (NOT `mix deps.update`) in CI
- ✅ Use same Elixir/OTP versions in CI as local
- ✅ Cache dependencies with lock file hash as key
- ✅ Use `MIX_ENV=prod` for release builds
- ✅ Strip debug information for consistency
- ❌ DO NOT rely on system-installed Elixir
- ❌ DO NOT use floating version constraints

## Best Practices Checklist

### Build Configuration

- [ ] `mix.lock` committed to version control
- [ ] `.tool-versions` committed with pinned versions
- [ ] Elixir version constraint specified in `mix.exs`
- [ ] Warnings as errors enabled in CI (`warnings_as_errors: true`)
- [ ] Custom Mix aliases defined for common tasks
- [ ] Release configuration defined for production

### Dependency Management

- [ ] All dependencies use `~>` constraints (not `==`)
- [ ] No overly permissive ranges (e.g., `>= 1.0`)
- [ ] Environment-specific dependencies scoped with `:only`
- [ ] Runtime dependencies marked with `runtime: false` if compile-time only
- [ ] Private dependencies use `:organization` if on Hex.pm
- [ ] Git dependencies use `:tag` (not `:branch`) for stability

### Version Management

- [ ] asdf/MISE configured with `.tool-versions`
- [ ] CI/CD uses same Elixir/OTP versions as local
- [ ] README documents required Elixir/Erlang versions
- [ ] Compatibility matrix provided for major frameworks

### Umbrella Projects (if applicable)

- [ ] Clear separation between domain, web, API, worker apps
- [ ] Core domain app has minimal external dependencies
- [ ] Cross-app communication uses public APIs only
- [ ] Shared configuration in umbrella root
- [ ] Single `mix.lock` at umbrella root

### Release Configuration

- [ ] `config/runtime.exs` used for runtime configuration
- [ ] Environment variables validated at startup
- [ ] README documents all required environment variables
- [ ] Release stripped of debug information
- [ ] Release tarball generation configured

### Build Automation

- [ ] Pre-commit hooks format code automatically
- [ ] CI/CD runs format check, Credo, Dialyzer, tests
- [ ] Dependencies cached in CI using `mix.lock` hash
- [ ] Test coverage measured and enforced (>85%)
- [ ] Quality gates prevent merging non-compliant code

## Related Documentation

**Elixir Standards**:

- [Coding Standards](./coding-standards.md) - Naming conventions, module structure
- [Testing Standards](./testing-standards.md) - ExUnit, doctests, property-based testing
- [Code Quality Standards](./code-quality-standards.md) - mix format, Credo, Dialyzer
- [Dependency Management](./build-configuration-standards.md) - Mix, Hex, umbrella projects

**Software Engineering Principles**:

- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

**Development Practices**:

- [Code Quality Standards](../../../../../governance/development/quality/code.md)
- [Implementation Workflow](../../../../../governance/development/workflow/implementation.md)

## Sources

- [Mix Documentation](https://hexdocs.pm/mix/)
- [Hex Package Manager](https://hex.pm/docs)
- [Mix Release Documentation](https://hexdocs.pm/mix/Mix.Tasks.Release.html)
- [Umbrella Projects Guide](https://elixir-lang.org/getting-started/mix-otp/dependencies-and-umbrella-projects.html)
- [asdf Elixir Plugin](https://github.com/asdf-vm/asdf-elixir)
- [Semantic Versioning](https://semver.org/)

---

**Elixir Version**: 1.12+ (baseline), 1.17+ (recommended), 1.19 (latest)
**Maintainers**: Platform Architecture Team
