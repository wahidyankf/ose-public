---
title: "Deployment Strategies"
date: 2026-02-05T00:00:00+07:00
draft: false
weight: 1000026
description: "Production deployment strategies from Mix tasks through modern OTP releases with Docker"
tags: ["elixir", "deployment", "mix-release", "docker", "otp", "production"]
prev: "/en/learn/software-engineering/programming-languages/elixir/in-the-field/documentation-practices"
next: "/en/learn/software-engineering/programming-languages/elixir/in-the-field/configuration-management"
---

**Deploying Elixir to production?** This guide progresses from basic Mix compilation through modern OTP releases with Docker deployment, showing you how to package and deploy Shariah-compliant financial applications reliably.

## Why Deployment Strategy Matters

Elixir applications require proper packaging for production. Wrong approaches cause:

- **Development dependencies in production** - Bloated deployments with dev tools
- **Manual server setup** - Error-prone configuration replication
- **Environment-specific bugs** - "Works on my machine" problems
- **Downtime deployments** - Service interruptions during updates
- **Missing configuration** - Runtime errors from environment variables
- **Resource exhaustion** - Memory limits, connection pools misconfigured
- **Supervision failures** - Applications crashing on startup

**Modern deployment strategies prevent production disasters** by packaging self-contained releases with proper configuration management.

## Financial Domain Example

Examples deploy a donation platform with:

- **Zakat calculation** - Processing charity percentages
- **Donation tracking** - Managing contribution records
- **Transaction auditing** - Recording financial operations

This demonstrates real production deployment with business logic.

## Standard Library Approach

### Mix Tasks for Compilation

Basic deployment uses Mix compilation directly.

**Standard Library**: Mix build tasks.

```elixir
# Mix project configuration
defmodule DonationPlatform.MixProject do
  use Mix.Project                                    # => Imports Mix.Project behavior
                                                     # => Provides project/0 callback

  def project do
    [
      app: :donation_platform,                       # => Application name (atom)
      version: "0.1.0",                              # => Application version
      elixir: "~> 1.14",                             # => Required Elixir version
                                                     # => ~> means compatible with 1.14+
      start_permanent: Mix.env() == :prod,           # => Start app automatically in production
                                                     # => Supervisor starts on VM boot
      deps: deps()                                   # => Function call for dependencies
    ]                                                # => Returns keyword list
  end

  def application do
    [
      extra_applications: [:logger],                 # => Start logger application
                                                     # => logger is OTP app from Erlang
      mod: {DonationPlatform.Application, []}        # => Application callback module
                                                     # => Starts supervision tree
    ]                                                # => Returns keyword list
  end

  defp deps do
    [
      {:phoenix, "~> 1.7.0"},                        # => Web framework
      {:ecto_sql, "~> 3.10"},                        # => Database wrapper
      {:postgrex, ">= 0.0.0"}                        # => PostgreSQL driver
    ]                                                # => Returns dependency list
  end
end
```

**Compile for production**:

```bash
# Set production environment
export MIX_ENV=prod                                  # => Sets environment variable
                                                     # => Mix reads MIX_ENV for environment

# Get dependencies
mix deps.get --only prod                             # => Downloads dependencies
                                                     # => --only prod excludes dev/test deps
                                                     # => Creates deps/ directory

# Compile application
mix compile                                          # => Compiles Elixir source to BEAM
                                                     # => Outputs to _build/prod/lib/
                                                     # => Creates .beam bytecode files

# Compile assets (Phoenix)
mix assets.deploy                                    # => Compiles and minifies CSS/JS
                                                     # => Outputs to priv/static/
                                                     # => Digests filenames for caching
```

**Server starts**:

```elixir
# Development server
iex -S mix phx.server                                # => Starts IEx with Phoenix
                                                     # => Loads application code
                                                     # => Starts supervision tree
                                                     # => Listens on port 4000

# Production with compiled code
MIX_ENV=prod mix phx.server                          # => Runs without release
                                                     # => Requires Elixir on server
                                                     # => Needs Mix on production server
```

**Best practice**: Mix compilation is suitable for development only. Production deployments should use releases.

## Limitations of Mix Compilation

### Problem 1: Development Dependencies

Mix deploys entire Elixir toolchain to production.

```bash
# What gets deployed with Mix approach
/app
├── _build/prod/                                     # => Compiled BEAM files
├── deps/                                            # => ALL dependencies
├── lib/                                             # => Source code (not needed)
├── test/                                            # => Test files (not needed)
├── config/                                          # => Configuration
└── mix.exs                                          # => Mix project file

# Server requirements
elixir --version                                     # => Elixir runtime REQUIRED
                                                     # => Full Elixir installation
                                                     # => Mix tool required

# Problems
du -sh /app                                          # => Large deployment size (500MB+)
                                                     # => Includes source, tests, Mix
                                                     # => Development tools on production
```

**Issue**: Production servers need full Elixir installation, Mix tool, and source code. Bloated deployments with security risks.

### Problem 2: Manual Configuration

Environment configuration requires manual setup.

```bash
# Server needs environment variables
export DATABASE_URL="postgresql://..."               # => Database connection
export SECRET_KEY_BASE="..."                         # => Phoenix secret
export PORT=4000                                     # => HTTP port
                                                     # => Manual configuration per server
                                                     # => Error-prone replication

# Configuration files
cat config/prod.exs                                  # => Production configuration
                                                     # => Hardcoded or ENV vars
                                                     # => Compiled into release
```

**Issue**: No self-contained configuration. Deployment requires coordinating environment variables across servers.

### Problem 3: Manual Deployment

No packaged artifact for deployment.

```bash
# Deployment steps (manual)
scp -r . server:/app                                 # => Copy entire source tree
                                                     # => Includes unnecessary files
ssh server                                           # => Connect to server
cd /app                                              # => Navigate to app directory
MIX_ENV=prod mix deps.get                            # => Download deps on server
MIX_ENV=prod mix compile                             # => Compile on server
MIX_ENV=prod mix phx.server                          # => Start server manually
                                                     # => Process management needed
```

**Issue**: Deployment is manual, error-prone process. No rollback mechanism. No process supervision beyond application supervision tree.

**Best practice**: Use releases instead of Mix compilation for production.

## Mix Release (Modern Approach)

### OTP Releases from Elixir 1.9+

Mix Release creates self-contained production packages.

**OTP Primitive**: Mix Release (built into Elixir 1.9+).

```elixir
# Release configuration in mix.exs
defmodule DonationPlatform.MixProject do
  use Mix.Project

  def project do
    [
      app: :donation_platform,
      version: "0.1.0",
      releases: [
        donation_platform: [
          include_executables_for: [:unix],          # => Unix shell scripts
                                                     # => Generates bin/donation_platform
          applications: [runtime_tools: :permanent]  # => Include runtime_tools
                                                     # => :permanent means always running
        ]                                            # => Release name matches app name
      ]                                              # => Returns keyword list
    ]
  end
end
```

**Build release**:

```bash
# Build production release
MIX_ENV=prod mix release                             # => Creates self-contained release
                                                     # => Outputs to _build/prod/rel/
                                                     # => Includes ERTS (Erlang runtime)
                                                     # => Packages all dependencies
                                                     # => Generates start scripts

# Release structure
tree _build/prod/rel/donation_platform               # => Release directory
├── bin/                                             # => Executable scripts
│   └── donation_platform                            # => Start script
├── erts-13.2/                                       # => Erlang runtime system
├── lib/                                             # => Application code + deps
└── releases/                                        # => Release configurations
    └── 0.1.0/
        ├── env.sh                                   # => Environment setup
        └── vm.args                                  # => VM arguments
```

**Release benefits**:

```bash
# Size comparison
du -sh _build/prod/rel/donation_platform             # => ~30MB (release)
du -sh /app                                          # => ~500MB (Mix approach)
                                                     # => 94% size reduction
                                                     # => No source code
                                                     # => No test files
                                                     # => No Mix tool

# Server requirements
# No Elixir installation needed!                    # => Release includes ERTS
# No Mix tool needed!                               # => Release is self-contained
# Only Linux runtime libs needed                    # => libc, SSL libraries
```

**Best practice**: Use Mix Release for all production deployments. It's built into Elixir, requires no external tools.

### Release Commands

Releases provide production-ready commands.

```bash
# Start application (daemon)
_build/prod/rel/donation_platform/bin/donation_platform start
                                                     # => Starts application as daemon
                                                     # => Runs in background
                                                     # => Returns immediately

# Start with console
_build/prod/rel/donation_platform/bin/donation_platform start_iex
                                                     # => Starts with IEx console
                                                     # => Interactive debugging
                                                     # => Runs in foreground

# Connect to running node
_build/prod/rel/donation_platform/bin/donation_platform remote
                                                     # => Connects to running release
                                                     # => Opens IEx session
                                                     # => For live debugging

# Stop application
_build/prod/rel/donation_platform/bin/donation_platform stop
                                                     # => Graceful shutdown
                                                     # => Stops supervision tree
                                                     # => Waits for processes to terminate

# Restart application
_build/prod/rel/donation_platform/bin/donation_platform restart
                                                     # => Stops then starts
                                                     # => No hot code upgrade
                                                     # => Brief downtime
```

**Best practice**: Use `start` for production servers, `start_iex` for debugging, `remote` for live inspection.

### Runtime Configuration

Releases support runtime configuration.

```elixir
# config/runtime.exs - Loaded at runtime
import Config                                        # => Imports Config module
                                                     # => Provides config/2 function

# Database configuration from environment
config :donation_platform, DonationPlatform.Repo,
  url: System.get_env("DATABASE_URL"),               # => Runtime environment variable
                                                     # => Evaluated when release starts
                                                     # => Not compiled into release
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")
                                                     # => Defaults to 10 connections
                                                     # => Parses string to integer

# Phoenix endpoint configuration
config :donation_platform, DonationPlatformWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT") || "4000")],
                                                     # => HTTP port from environment
                                                     # => Defaults to 4000
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
                                                     # => Phoenix secret
                                                     # => Required for sessions
  url: [host: System.get_env("HOST"), port: 443]     # => External URL configuration
                                                     # => Used for generating URLs
```

**Environment variables on production**:

```bash
# Set production environment
export DATABASE_URL="postgresql://user:pass@localhost/prod_db"
                                                     # => Database connection string
export SECRET_KEY_BASE="$(mix phx.gen.secret)"       # => Generated secret
export PORT=4000                                     # => HTTP listen port
export HOST="donations.example.com"                  # => External hostname
export POOL_SIZE=20                                  # => Database connections

# Start with configuration
./bin/donation_platform start                        # => Reads environment variables
                                                     # => Applies runtime configuration
                                                     # => Starts supervision tree
```

**Best practice**: Use `config/runtime.exs` for environment-specific configuration. Compile-time config goes in `config/prod.exs`.

## Legacy Approach: Distillery

### Historical Context

Distillery was the standard release tool before Elixir 1.9.

**Third-Party Tool**: Distillery (now deprecated).

```elixir
# mix.exs - Old Distillery approach
defp deps do
  [
    {:distillery, "~> 2.1", runtime: false}          # => Distillery dependency
                                                     # => runtime: false means build-time only
                                                     # => Not included in release
  ]                                                  # => Returns dependency list
end
```

**Why deprecated**:

```elixir
# Distillery required separate configuration
# rel/config.exs - Complex configuration
use Mix.Releases.Config,
  default_release: :default,
  default_environment: :prod                         # => Extra configuration file
                                                     # => More complexity than Mix Release

# Mix Release (modern) - simpler
# Configuration in mix.exs directly                  # => Single configuration location
                                                     # => No extra files needed
```

**Migration path**:

```bash
# Remove Distillery
mix deps.unlock distillery                           # => Remove from lockfile
                                                     # => Remove dependency

# Remove configuration
rm rel/config.exs                                    # => Delete Distillery config
                                                     # => Not needed for Mix Release

# Update mix.exs
# Add releases: [...] to project/0                   # => Use Mix Release config
                                                     # => Built into Elixir
```

**Best practice**: Do not use Distillery for new projects. Migrate existing projects to Mix Release (built into Elixir 1.9+).

## Docker Deployment

### Multi-Stage Docker Build

Docker provides consistent deployment environments.

```dockerfile
# Dockerfile - Multi-stage build
# Stage 1: Build environment
FROM elixir:1.14-alpine AS build                     # => Elixir 1.14 on Alpine Linux
                                                     # => Named stage "build"
                                                     # => Small base image (~200MB)

# Install build dependencies
RUN apk add --no-cache build-base git                # => Install C compiler
                                                     # => Needed for native deps
                                                     # => git for dependency fetching

# Set build environment
ENV MIX_ENV=prod                                     # => Production environment
                                                     # => Compiles with optimizations

# Copy source
WORKDIR /app                                         # => Set working directory
COPY mix.exs mix.lock ./                             # => Copy dependency files first
                                                     # => Docker layer caching
RUN mix local.hex --force && \
    mix local.rebar --force                          # => Install Hex and Rebar
                                                     # => --force skips prompts
RUN mix deps.get --only prod                         # => Get production dependencies
                                                     # => Cached if mix files unchanged

COPY config ./config                                 # => Copy configuration
COPY lib ./lib                                       # => Copy application source
COPY priv ./priv                                     # => Copy static assets

# Compile and build release
RUN mix compile                                      # => Compile application
                                                     # => Creates BEAM files
RUN mix release                                      # => Build OTP release
                                                     # => Outputs to _build/prod/rel/

# Stage 2: Production runtime
FROM alpine:3.17 AS app                              # => Minimal Alpine image
                                                     # => Only ~5MB base
                                                     # => Named stage "app"

# Install runtime dependencies
RUN apk add --no-cache libstdc++ openssl ncurses-libs
                                                     # => libstdc++ for C++ deps
                                                     # => openssl for HTTPS
                                                     # => ncurses for terminal
                                                     # => No Elixir installation!

# Copy release from build stage
WORKDIR /app                                         # => Set working directory
COPY --from=build /app/_build/prod/rel/donation_platform ./
                                                     # => Copy release from build stage
                                                     # => Self-contained release
                                                     # => Includes ERTS

# Create non-root user
RUN addgroup -S app && adduser -S app -G app         # => Create app user/group
                                                     # => -S creates system user
USER app                                             # => Switch to app user
                                                     # => Security: run as non-root

# Runtime configuration
ENV HOME=/app                                        # => Set home directory
                                                     # => For ERTS runtime

# Start application
CMD ["bin/donation_platform", "start"]               # => Default command
                                                     # => Starts release
                                                     # => Runs in foreground
```

**Build and run**:

```bash
# Build Docker image
docker build -t donation-platform:0.1.0 .            # => Builds multi-stage image
                                                     # => Tags as donation-platform:0.1.0
                                                     # => Uses Docker layer caching

# Run container
docker run -d \                                      # => Run detached (background)
  -p 4000:4000 \                                     # => Map port 4000
                                                     # => Container:Host
  -e DATABASE_URL="postgresql://..." \               # => Set environment variables
  -e SECRET_KEY_BASE="..." \                         # => Pass configuration
  --name donation-app \                              # => Container name
  donation-platform:0.1.0                            # => Image tag
                                                     # => Starts container

# View logs
docker logs donation-app                             # => View application logs
                                                     # => Follows stdout/stderr

# Connect to running container
docker exec -it donation-app bin/donation_platform remote
                                                     # => Opens IEx session
                                                     # => For live debugging
```

**Image size comparison**:

```bash
# Without multi-stage
docker images elixir:1.14                            # => ~1.2GB Elixir base image
                                                     # => Includes build tools

# With multi-stage
docker images donation-platform:0.1.0                # => ~50MB final image
                                                     # => Only runtime dependencies
                                                     # => 96% reduction
```

**Best practice**: Always use multi-stage Docker builds. Final image should only contain release and runtime dependencies.

## Hot Code Upgrades (Advanced)

### Basic Hot Upgrade Concepts

Hot upgrades allow code changes without stopping the application.

```elixir
# Create release with versioning
# mix.exs
def project do
  [
    version: "0.2.0",                                # => New version
                                                     # => Previous was 0.1.0
    releases: [
      donation_platform: [
        include_executables_for: [:unix],
        steps: [:assemble, :tar]                     # => Generate tarball
                                                     # => Needed for upgrades
      ]
    ]
  ]
end
```

**Build upgrade release**:

```bash
# Build new version
MIX_ENV=prod mix release                             # => Builds version 0.2.0
                                                     # => Creates tarball
                                                     # => Outputs to _build/prod/rel/

# Copy tarball to running system
scp _build/prod/rel/donation_platform/releases/0.2.0/donation_platform.tar.gz \
  server:/app/releases/0.2.0/                        # => Copy to releases directory
                                                     # => Server file structure expected

# Upgrade running system
./bin/donation_platform upgrade 0.2.0                # => Performs hot upgrade
                                                     # => Loads new code
                                                     # => No process restart
                                                     # => Maintains state
```

**Hot upgrade characteristics**:

```elixir
# Benefits
# - Zero downtime                                   # => No service interruption
# - State preservation                              # => GenServer state maintained
# - Connection preservation                         # => WebSocket connections stay open

# Limitations
# - Complex to implement                            # => Requires appup files
# - Limited use cases                               # => Schema migrations difficult
# - Rollback complexity                             # => Downgrade appups needed
# - Testing difficulty                              # => Hard to test upgrade path
```

**Best practice**: Hot upgrades are rarely worth the complexity. Use rolling deployments with blue-green patterns instead.

## Systemd Service Management

### Production Process Management

Systemd manages application lifecycle.

```ini
# /etc/systemd/system/donation-platform.service
[Unit]
Description=Donation Platform Elixir Application    # => Service description
After=network.target                                 # => Start after network ready
                                                     # => Ensures networking available

[Service]
Type=forking                                         # => Service forks to background
                                                     # => "start" command returns immediately
User=app                                             # => Run as app user
                                                     # => Security: non-root
WorkingDirectory=/opt/donation-platform              # => Application directory
                                                     # => Contains release

# Environment variables
Environment="PORT=4000"                              # => HTTP port
Environment="MIX_ENV=prod"                           # => Production environment
EnvironmentFile=/opt/donation-platform/.env          # => Load from file
                                                     # => Secrets stored separately

# Start command
ExecStart=/opt/donation-platform/bin/donation_platform start
                                                     # => Start application
                                                     # => Runs as daemon

# Stop command
ExecStop=/opt/donation-platform/bin/donation_platform stop
                                                     # => Graceful shutdown
                                                     # => Stops supervision tree

# Restart behavior
Restart=on-failure                                   # => Restart if crashes
RestartSec=5                                         # => Wait 5 seconds before restart
                                                     # => Prevents restart loops

[Install]
WantedBy=multi-user.target                           # => Enable at boot
                                                     # => Multi-user target dependency
```

**Systemd commands**:

```bash
# Enable service (start on boot)
sudo systemctl enable donation-platform              # => Creates symlink
                                                     # => Service starts at boot

# Start service
sudo systemctl start donation-platform               # => Starts application
                                                     # => Runs ExecStart command

# Check status
sudo systemctl status donation-platform              # => Shows running state
                                                     # => Displays recent logs
                                                     # => Shows PID and memory

# View logs
sudo journalctl -u donation-platform -f              # => Follow service logs
                                                     # => -f streams new logs
                                                     # => Persistent logging

# Restart service
sudo systemctl restart donation-platform             # => Stop then start
                                                     # => Brief downtime
                                                     # => Reload configuration
```

**Best practice**: Use systemd for process management on Linux. It provides automatic restarts, logging, and resource limits.

## Configuration Management

### Environment-Based Configuration

Production configuration must be flexible.

```elixir
# config/runtime.exs - Runtime configuration
import Config

# Validate required environment variables
required_vars = ~w(DATABASE_URL SECRET_KEY_BASE)     # => List of required vars
                                                     # => ~w creates word list

Enum.each(required_vars, fn var ->
  unless System.get_env(var) do
    raise "Environment variable #{var} is required!"  # => Fails fast on missing config
                                                      # => Clear error message
  end                                                 # => Returns :ok or raises
end)                                                  # => Validates all required vars

# Database configuration
config :donation_platform, DonationPlatform.Repo,
  url: System.get_env("DATABASE_URL"),               # => Full connection string
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
                                                     # => Default 10 connections
  ssl: true,                                         # => Require SSL
  ssl_opts: [
    verify: :verify_peer,                            # => Verify certificate
    cacertfile: System.get_env("SSL_CERT_FILE")      # => CA certificate path
  ]                                                  # => SSL configuration

# Phoenix configuration
config :donation_platform, DonationPlatformWeb.Endpoint,
  url: [
    scheme: "https",                                 # => HTTPS only
    host: System.get_env("HOST"),                    # => External hostname
    port: 443                                        # => HTTPS port
  ],                                                 # => URL configuration
  http: [
    port: String.to_integer(System.get_env("PORT") || "4000"),
    transport_options: [socket_opts: [:inet6]]       # => IPv6 support
  ],                                                 # => HTTP configuration
  secret_key_base: System.get_env("SECRET_KEY_BASE")
```

**Environment file example**:

```bash
# /opt/donation-platform/.env
DATABASE_URL=postgresql://user:<password>@db.example.com/prod
                                                     # => Database connection
SECRET_KEY_BASE=abc123...                            # => Phoenix secret
PORT=4000                                            # => HTTP port
HOST=donations.example.com                           # => External hostname
POOL_SIZE=20                                         # => Database connections
SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt          # => SSL certificates
```

**Best practice**: Use `config/runtime.exs` for environment-dependent configuration. Validate required variables at startup.

## Best Practices Summary

**Modern deployment workflow**:

```bash
# 1. Build release locally or in CI
MIX_ENV=prod mix release                             # => Create self-contained release
                                                     # => Includes ERTS
                                                     # => No Elixir needed on server

# 2. Package with Docker (recommended)
docker build -t app:version .                        # => Multi-stage build
                                                     # => Minimal runtime image
                                                     # => ~50MB final size

# 3. Deploy to production
docker push app:version                              # => Push to registry
kubectl apply -f deployment.yaml                     # => Deploy to Kubernetes
# OR
ansible-playbook deploy.yml                          # => Deploy with Ansible

# 4. Manage with systemd
sudo systemctl restart donation-platform             # => Restart service
                                                     # => Systemd handles lifecycle
```

**Key principles**:

1. **Use Mix Release** - Built into Elixir 1.9+, no external tools needed
2. **Runtime configuration** - `config/runtime.exs` for environment variables
3. **Docker multi-stage** - Small production images, ~50MB vs ~1GB
4. **Systemd management** - Automatic restarts, logging, resource limits
5. **Rolling deployments** - Blue-green or canary instead of hot upgrades
6. **Validate configuration** - Fail fast on missing required variables
7. **Security** - Non-root users, SSL connections, secret management

## Common Mistakes

**Mistake 1: Deploying with Mix**

```bash
# WRONG: Requires Elixir on production
MIX_ENV=prod mix phx.server                          # => Needs full Elixir installation
                                                     # => Includes development tools
                                                     # => Large deployment size
```

**Solution**: Use Mix Release for self-contained deployment.

**Mistake 2: Compile-time configuration**

```elixir
# WRONG: Hardcoded in config/prod.exs
config :app, Repo,
  url: "postgresql://localhost/prod"                 # => Compiled into release
                                                     # => Can't change without rebuild
```

**Solution**: Use `config/runtime.exs` with environment variables.

**Mistake 3: Running as root**

```dockerfile
# WRONG: Container runs as root
FROM alpine:3.17
COPY --from=build /app/_build/prod/rel/app ./
CMD ["bin/app", "start"]                             # => Runs as root user
                                                     # => Security vulnerability
```

**Solution**: Create non-root user in Dockerfile.

**Mistake 4: Missing resource limits**

```ini
# WRONG: No resource limits
[Service]
ExecStart=/opt/app/bin/app start                     # => No memory limits
                                                     # => No CPU limits
                                                     # => Can consume all resources
```

**Solution**: Add systemd resource limits (MemoryLimit, CPUQuota).

## Next Steps

- **[Testing Strategies](/en/learn/software-engineering/programming-languages/elixir/in-the-field/testing-strategies)** - Test releases before deployment
- **[Phoenix Framework](/en/learn/software-engineering/programming-languages/elixir/in-the-field/phoenix-framework)** - Deploy Phoenix applications
- **[Best Practices](/en/learn/software-engineering/programming-languages/elixir/in-the-field/best-practices)** - Production patterns for reliability

## Further Reading

- [Mix Release Docs](https://hexdocs.pm/mix/Mix.Tasks.Release.html) - Official Mix Release documentation
- [Phoenix Deployment Guides](https://hexdocs.pm/phoenix/deployment.html) - Phoenix-specific deployment
- [Erlang/OTP Releases](https://www.erlang.org/doc/design_principles/release_structure.html) - OTP release structure
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/) - Docker best practices
