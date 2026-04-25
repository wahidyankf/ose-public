---
title: Phoenix Deployment Guide
description: Comprehensive guide to deploying Phoenix applications including Mix releases, Docker, Kubernetes, clustering, migrations, zero-downtime deployment, and production best practices
category: explanation
subcategory: platform-web
tags:
  - phoenix
  - elixir
  - deployment
  - releases
  - clustering
  - docker
  - kubernetes
related:
  - configuration.md
  - performance.md
  - observability.md
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
---

# Phoenix Deployment Guide

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [Elixir Phoenix](./README.md) > Deployment

### At a Glance

| Deployment Aspect | Approach                   | Tools                 |
| ----------------- | -------------------------- | --------------------- |
| Release Building  | Mix releases               | Elixir 1.9+           |
| Containerization  | Multi-stage Docker         | Docker, BuildKit      |
| Orchestration     | Kubernetes/ECS             | kubectl, Helm         |
| Clustering        | libcluster                 | libcluster, DNS       |
| Migrations        | Release tasks              | Ecto migrations       |
| Load Balancing    | Nginx/HAProxy              | nginx, haproxy        |
| SSL/TLS           | Let's Encrypt/cert-manager | certbot, cert-manager |

## Overview

Deploying Phoenix applications for production requires careful consideration of releases, clustering, migrations, and zero-downtime strategies. This guide covers deploying Islamic finance applications handling Zakat calculations, charitable donations, and Murabaha contracts with high availability and fault tolerance.

**Target Audience**: DevOps engineers and developers deploying Phoenix applications to production environments.

**Versions**: Phoenix 1.7+, Elixir 1.14+, OTP 25+

## Table of Contents

1. [Mix Releases](#mix-releases)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Clustering](#clustering)
5. [Database Migrations](#database-migrations)
6. [Zero-Downtime Deployment](#zero-downtime-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Secrets Management](#secrets-management)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Health Checks](#health-checks)
11. [Deployment Strategies](#deployment-strategies)
12. [Production Checklist](#production-checklist)

## Mix Releases

Mix releases package your application with the Erlang VM into a single deployable unit.

### Creating a Release

```elixir
# mix.exs
def project do
  [
    app: :ose_platform,
    version: "1.0.0",
    elixir: "~> 1.14",
    start_permanent: Mix.env() == :prod,
    releases: [
      ose_platform: [
        include_executables_for: [:unix],
        applications: [runtime_tools: :permanent],
        steps: [:assemble, :tar]
      ]
    ]
  ]
end
```

### Building the Release

```bash
# Set environment
export MIX_ENV=prod

# Install dependencies
mix deps.get --only prod

# Compile assets (if using Phoenix LiveView)
mix assets.deploy

# Compile application
mix compile

# Build release
mix release

# Output: _build/prod/rel/ose_platform/
```

### Release Module

```elixir
# lib/ose_platform/release.ex
defmodule OsePlatform.Release do
  @moduledoc """
  Tasks to run in production releases
  """

  @app :ose_platform

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  def seed do
    load_app()

    for repo <- repos() do
      seed_script = priv_path_for(repo, "seeds.exs")

      if File.exists?(seed_script) do
        {:ok, _} = Ecto.Migrator.with_repo(repo, fn _repo ->
          Code.eval_file(seed_script)
        end)
      end
    end
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end

  defp priv_path_for(repo, filename) do
    app = Keyword.get(repo.config(), :otp_app)
    repo_name = repo |> Module.split() |> List.last() |> Macro.underscore()
    Path.join([priv_dir(app), "repo", repo_name, filename])
  end

  defp priv_dir(app), do: "#{:code.priv_dir(app)}"
end
```

### Running Release Commands

```bash
# Start the application
_build/prod/rel/ose_platform/bin/ose_platform start

# Run in daemon mode
_build/prod/rel/ose_platform/bin/ose_platform daemon

# Run migrations
_build/prod/rel/ose_platform/bin/ose_platform eval "OsePlatform.Release.migrate()"

# Seed database
_build/prod/rel/ose_platform/bin/ose_platform eval "OsePlatform.Release.seed()"

# Remote console
_build/prod/rel/ose_platform/bin/ose_platform remote

# Stop the application
_build/prod/rel/ose_platform/bin/ose_platform stop
```

## Docker Deployment

### Multi-Stage Dockerfile

```dockerfile
# Build stage
FROM hexpm/elixir:1.14.5-erlang-25.3.2.3-debian-bullseye-20230612-slim AS builder

# Install build dependencies
RUN apt-get update -y && apt-get install -y build-essential git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build ENV
ENV MIX_ENV=prod

# Install mix dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

# Copy config files
COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile

# Copy application code
COPY priv priv
COPY lib lib

# Compile and build release
RUN mix compile
RUN mix release

# Runtime stage
FROM debian:bullseye-20230612-slim AS runner

# Install runtime dependencies
RUN apt-get update -y && \
    apt-get install -y libstdc++6 openssl libncurses5 locales \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Set locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR /app

# Create non-root user
RUN groupadd -r oseplatform && useradd -r -g oseplatform oseplatform
RUN chown -R oseplatform:oseplatform /app

USER oseplatform

# Copy release from builder
COPY --from=builder --chown=oseplatform:oseplatform /app/_build/prod/rel/ose_platform ./

ENV HOME=/app

# Expose Phoenix port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD ["/app/bin/ose_platform", "rpc", "IO.puts(:erlang.is_alive())"]

CMD ["/app/bin/ose_platform", "start"]
```

### Docker Compose for Local Testing

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: oseplatform
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: oseplatform_prod
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oseplatform"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: ecto://oseplatform:postgres@postgres/oseplatform_prod
      REDIS_URL: redis://redis:6379
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      PORT: 4000
      POOL_SIZE: 10
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "
        /app/bin/ose_platform eval 'OsePlatform.Release.migrate()' &&
        /app/bin/ose_platform start
      "

volumes:
  postgres_data:
  redis_data:
```

### Building and Running

```bash
# Build image
docker build -t ose-platform:1.0.0 .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Kubernetes Deployment

### Deployment Architecture

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    subgraph "External Traffic"
        U[Users]
        LB[Load Balancer]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Ingress Layer"
            ING[Ingress Controller<br/>nginx/Traefik]
        end

        subgraph "Application Layer"
            SVC[Service<br/>ClusterIP]
            POD1[Phoenix Pod 1<br/>4000:4000]
            POD2[Phoenix Pod 2<br/>4000:4000]
            POD3[Phoenix Pod 3<br/>4000:4000]
        end

        subgraph "Data Layer"
            PGSVC[PostgreSQL Service]
            PG[(PostgreSQL<br/>StatefulSet)]
            REDISSVC[Redis Service]
            RD[(Redis<br/>StatefulSet)]
        end

        subgraph "Configuration"
            CM[ConfigMaps<br/>Runtime Config]
            SEC[Secrets<br/>Credentials]
        end

        subgraph "Storage"
            PV[Persistent Volumes]
        end
    end

    U -->|HTTPS| LB
    LB -->|HTTP/WS| ING
    ING -->|Route| SVC
    SVC -->|Round Robin| POD1
    SVC -->|Round Robin| POD2
    SVC -->|Round Robin| POD3

    POD1 -.->|Env Vars| CM
    POD1 -.->|Secrets| SEC
    POD2 -.->|Env Vars| CM
    POD2 -.->|Secrets| SEC
    POD3 -.->|Env Vars| CM
    POD3 -.->|Secrets| SEC

    POD1 -->|SQL| PGSVC
    POD2 -->|SQL| PGSVC
    POD3 -->|SQL| PGSVC
    PGSVC --> PG

    POD1 -->|Cache| REDISSVC
    POD2 -->|Cache| REDISSVC
    POD3 -->|Cache| REDISSVC
    REDISSVC --> RD

    PG -.->|Mount| PV
    RD -.->|Mount| PV

    POD1 -.Clustering.-> POD2
    POD2 -.Clustering.-> POD3
    POD3 -.Clustering.-> POD1

    style U fill:#0173B2,color:#fff
    style LB fill:#0173B2,color:#fff
    style ING fill:#029E73,color:#fff
    style POD1 fill:#DE8F05,color:#fff
    style POD2 fill:#DE8F05,color:#fff
    style POD3 fill:#DE8F05,color:#fff
    style PG fill:#CC78BC,color:#fff
    style RD fill:#CC78BC,color:#fff
```

**Architecture Components**:

- **Load Balancer** (blue): External traffic entry point (AWS ELB, GCP Load Balancer)
- **Ingress Controller** (teal): Routes HTTPS/WebSocket traffic to services
- **Phoenix Pods** (orange): Clustered application instances (3+ replicas)
- **Services**: ClusterIP services for internal routing
- **Databases** (purple): StatefulSets for PostgreSQL and Redis
- **Configuration**: ConfigMaps for runtime config, Secrets for credentials
- **Storage**: Persistent volumes for database data

**Key Features**:

- **Rolling updates**: Zero-downtime deployment with maxUnavailable: 0
- **Health checks**: Liveness and readiness probes
- **Clustering**: Pods discover each other via libcluster + DNS
- **Horizontal scaling**: Add pods with `kubectl scale deployment`
- **Resource limits**: CPU/memory requests and limits per pod

### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ose-platform
  labels:
    app: ose-platform
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ose-platform
  template:
    metadata:
      labels:
        app: ose-platform
    spec:
      containers:
        - name: ose-platform
          image: your-registry/ose-platform:1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 4000
              name: http
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: ose-platform-secrets
                  key: database-url
            - name: SECRET_KEY_BASE
              valueFrom:
                secretKeyRef:
                  name: ose-platform-secrets
                  key: secret-key-base
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
            - name: RELEASE_NODE
              value: "ose@$(POD_IP)"
            - name: RELEASE_DISTRIBUTION
              value: "name"
            - name: RELEASE_COOKIE
              valueFrom:
                secretKeyRef:
                  name: ose-platform-secrets
                  key: erlang-cookie
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: ose-platform
spec:
  type: ClusterIP
  selector:
    app: ose-platform
  ports:
    - port: 80
      targetPort: 4000
      protocol: TCP
      name: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ose-platform
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.oseplatform.com
      secretName: ose-platform-tls
  rules:
    - host: api.oseplatform.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ose-platform
                port:
                  number: 80
```

### Secrets Management

```yaml
# k8s/secrets.yaml (encrypted with sealed-secrets or external-secrets)
apiVersion: v1
kind: Secret
metadata:
  name: ose-platform-secrets
type: Opaque
stringData:
  database-url: "ecto://user:pass@postgres:5432/oseplatform_prod"
  secret-key-base: "your-secret-key-base-here"
  erlang-cookie: "your-erlang-cookie-here"
```

### Database Migration Job

```yaml
# k8s/migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ose-platform-migrate
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: your-registry/ose-platform:1.0.0
          command: ["/app/bin/ose_platform", "eval", "OsePlatform.Release.migrate()"]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: ose-platform-secrets
                  key: database-url
  backoffLimit: 3
```

### Deployment Commands

```bash
# Apply configuration
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml

# Run migrations
kubectl apply -f k8s/migration-job.yaml

# Check deployment status
kubectl rollout status deployment/ose-platform

# View pods
kubectl get pods -l app=ose-platform

# View logs
kubectl logs -f deployment/ose-platform

# Scale deployment
kubectl scale deployment/ose-platform --replicas=5

# Rollback deployment
kubectl rollout undo deployment/ose-platform
```

## Clustering

### libcluster Configuration

```elixir
# mix.exs
defp deps do
  [
    {:libcluster, "~> 3.3"}
  ]
end

# config/runtime.exs
config :libcluster,
  topologies: [
    k8s: [
      strategy: Cluster.Strategy.Kubernetes,
      config: [
        mode: :dns,
        kubernetes_node_basename: "ose-platform",
        kubernetes_selector: "app=ose-platform",
        kubernetes_namespace: System.get_env("KUBERNETES_NAMESPACE") || "default",
        polling_interval: 10_000
      ]
    ]
  ]

# Application supervisor
defmodule OsePlatform.Application do
  use Application

  def start(_type, _args) do
    topologies = Application.get_env(:libcluster, :topologies, [])

    children = [
      {Cluster.Supervisor, [topologies, [name: OsePlatform.ClusterSupervisor]]},
      OsePlatform.Repo,
      OsePlatformWeb.Endpoint,
      {Phoenix.PubSub, name: OsePlatform.PubSub}
    ]

    opts = [strategy: :one_for_one, name: OsePlatform.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

### DNS-Based Clustering

```elixir
# For environments without Kubernetes
config :libcluster,
  topologies: [
    dns: [
      strategy: Cluster.Strategy.Gossip,
      config: [
        port: 45892,
        if_addr: "0.0.0.0",
        multicast_addr: "255.255.255.255",
        multicast_ttl: 1,
        secret: System.get_env("CLUSTER_SECRET")
      ]
    ]
  ]
```

### Islamic Finance Example: Distributed Zakat System

```elixir
defmodule OsePlatform.Zakat.Distributed do
  @moduledoc """
  Distributed Zakat calculation across cluster nodes
  """

  def calculate_zakat_distributed(user_id) do
    # Distribute calculation across cluster nodes
    nodes = [Node.self() | Node.list()]

    tasks = Enum.map(nodes, fn node ->
      Task.Supervisor.async({OsePlatform.TaskSupervisor, node}, fn ->
        calculate_partial(user_id)
      end)
    end)

    Task.await_many(tasks, 30_000)
    |> aggregate_results()
  end

  defp calculate_partial(user_id) do
    # Partial calculation on this node
    OsePlatform.Zakat.calculate(user_id)
  end

  defp aggregate_results(results) do
    # Combine results from all nodes
    Enum.reduce(results, %{}, fn result, acc ->
      Map.merge(acc, result, fn _key, v1, v2 -> Decimal.add(v1, v2) end)
    end)
  end
end
```

## Database Migrations

### Zero-Downtime Migration Strategy

```elixir
# lib/ose_platform/release.ex
defmodule OsePlatform.Release do
  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end

    :ok
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
    :ok
  end

  defp repos do
    Application.fetch_env!(:ose_platform, :ecto_repos)
  end

  defp load_app do
    Application.load(:ose_platform)
  end
end
```

### Migration Best Practices

```elixir
# priv/repo/migrations/20240115_add_zakat_fields.exs
defmodule OsePlatform.Repo.Migrations.AddZakatFields do
  use Ecto.Migration

  def change do
    # ✅ SAFE: Adding nullable column (no lock)
    alter table(:users) do
      add :nisab_threshold, :decimal, precision: 15, scale: 2
    end

    # ✅ SAFE: Adding index concurrently
    create index(:donations, [:charity_id], concurrently: true)
  end
end

# ❌ AVOID: These cause locks
# alter table(:users) do
#   add :required_field, :string, null: false  # Locks table!
# end
#
# create index(:large_table, [:field])  # Locks table!

# Instead, do it in stages:
# 1. Add column as nullable
# 2. Backfill data
# 3. Add NOT NULL constraint
```

### Migration Execution

```bash
# In Docker/Kubernetes init container
/app/bin/ose_platform eval "OsePlatform.Release.migrate()"

# Check migration status
/app/bin/ose_platform eval "OsePlatform.Repo.Migrations.status()"

# Rollback single migration
/app/bin/ose_platform eval "OsePlatform.Release.rollback(OsePlatform.Repo, 20240115)"
```

## Zero-Downtime Deployment

### Rolling Update Strategy

```yaml
# k8s/deployment.yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # 1 pod above desired count
      maxUnavailable: 0 # No pods can be unavailable
```

### Blue-Green Deployment

```bash
# Deploy green environment
kubectl apply -f k8s/deployment-green.yaml

# Test green environment
kubectl port-forward deployment/ose-platform-green 4000:4000

# Switch traffic to green
kubectl patch service ose-platform -p '{"spec":{"selector":{"version":"green"}}}'

# Delete blue environment
kubectl delete deployment ose-platform-blue
```

### Canary Deployment

```yaml
# Deploy canary with 10% traffic
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ose-platform
spec:
  hosts:
    - api.oseplatform.com
  http:
    - match:
        - headers:
            canary:
              exact: "true"
      route:
        - destination:
            host: ose-platform-canary
            port:
              number: 80
    - route:
        - destination:
            host: ose-platform
            port:
              number: 80
          weight: 90
        - destination:
            host: ose-platform-canary
            port:
              number: 80
          weight: 10
```

## Environment Configuration

### Runtime Configuration

```elixir
# config/runtime.exs
import Config

if config_env() == :prod do
  database_url = System.get_env("DATABASE_URL") ||
    raise "environment variable DATABASE_URL is missing."

  config :ose_platform, OsePlatform.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    ssl: true,
    ssl_opts: [
      verify: :verify_peer,
      cacertfile: System.get_env("DATABASE_CA_CERT_PATH"),
      server_name_indication: String.to_charlist(System.get_env("DATABASE_HOST") || "localhost")
    ]

  secret_key_base = System.get_env("SECRET_KEY_BASE") ||
    raise "environment variable SECRET_KEY_BASE is missing."

  host = System.get_env("PHX_HOST") || "api.oseplatform.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :ose_platform, OsePlatformWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base,
    server: true
end
```

## Secrets Management

### Using External Secrets Operator

```yaml
# k8s/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ose-platform-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: ose-platform-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: ose-platform/prod/database-url
    - secretKey: secret-key-base
      remoteRef:
        key: ose-platform/prod/secret-key-base
    - secretKey: erlang-cookie
      remoteRef:
        key: ose-platform/prod/erlang-cookie
```

### Sealed Secrets

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
kubectl create secret generic ose-platform-secrets \
  --from-literal=database-url="ecto://..." \
  --from-literal=secret-key-base="..." \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > k8s/sealed-secret.yaml

# Apply sealed secret
kubectl apply -f k8s/sealed-secret.yaml
```

## SSL/TLS Configuration

### Let's Encrypt with cert-manager

```yaml
# k8s/cert-manager-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@oseplatform.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### TLS in Phoenix

```elixir
# config/runtime.exs
if config_env() == :prod do
  config :ose_platform, OsePlatformWeb.Endpoint,
    https: [
      port: 443,
      cipher_suite: :strong,
      certfile: System.get_env("SSL_CERT_PATH"),
      keyfile: System.get_env("SSL_KEY_PATH"),
      transport_options: [socket_opts: [:inet6]]
    ],
    force_ssl: [hsts: true]
end
```

## Health Checks

### Health Endpoint

```elixir
defmodule OsePlatformWeb.HealthController do
  use OsePlatformWeb, :controller

  def index(conn, _params) do
    checks = %{
      database: check_database(),
      redis: check_redis(),
      disk_space: check_disk_space()
    }

    all_healthy = Enum.all?(checks, fn {_, status} -> status == :ok end)

    status_code = if all_healthy, do: 200, else: 503

    conn
    |> put_status(status_code)
    |> json(%{
      status: if(all_healthy, do: "healthy", else: "unhealthy"),
      checks: checks,
      timestamp: DateTime.utc_now()
    })
  end

  def ready(conn, _params) do
    # Readiness check - is app ready to serve traffic?
    if ready_to_serve?() do
      json(conn, %{status: "ready"})
    else
      conn
      |> put_status(503)
      |> json(%{status: "not_ready"})
    end
  end

  defp check_database do
    case Ecto.Adapters.SQL.query(OsePlatform.Repo, "SELECT 1", []) do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
  end

  defp check_redis do
    case Redix.command(:redix, ["PING"]) do
      {:ok, "PONG"} -> :ok
      _ -> :error
    end
  end

  defp check_disk_space do
    # Check if disk space is > 10%
    :ok
  end

  defp ready_to_serve? do
    # Check if migrations are complete
    # Check if essential services are running
    true
  end
end
```

## Deployment Strategies

### Blue-Green Deployment Script

```bash
#!/bin/bash
# deploy-blue-green.sh

set -e

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./deploy-blue-green.sh <environment> <version>"
  exit 1
fi

echo "Deploying version $VERSION to $ENVIRONMENT"

# Determine current color
CURRENT_COLOR=$(kubectl get service ose-platform -o jsonpath='{.spec.selector.color}')
NEW_COLOR=$([ "$CURRENT_COLOR" == "blue" ] && echo "green" || echo "blue")

echo "Current color: $CURRENT_COLOR, deploying to: $NEW_COLOR"

# Deploy new version
kubectl apply -f k8s/deployment-${NEW_COLOR}.yaml
kubectl set image deployment/ose-platform-${NEW_COLOR} \
  ose-platform=your-registry/ose-platform:${VERSION}

# Wait for rollout
kubectl rollout status deployment/ose-platform-${NEW_COLOR}

# Run smoke tests
echo "Running smoke tests..."
./scripts/smoke-test.sh ose-platform-${NEW_COLOR}

# Switch traffic
kubectl patch service ose-platform -p "{\"spec\":{\"selector\":{\"color\":\"${NEW_COLOR}\"}}}"

echo "Traffic switched to $NEW_COLOR"

# Wait and monitor
sleep 60

# If no errors, delete old deployment
kubectl delete deployment ose-platform-${CURRENT_COLOR}

echo "Deployment complete!"
```

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Secrets stored securely (Vault, AWS Secrets Manager)
- [ ] Database migrations tested
- [ ] SSL/TLS certificates valid
- [ ] Load balancer configured
- [ ] Health checks implemented
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested

### Deployment

- [ ] Database migrations run successfully
- [ ] Application starts without errors
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] No error spikes in logs
- [ ] Response times within SLA
- [ ] Database connection pool stable
- [ ] Memory usage normal
- [ ] No critical security vulnerabilities

### Post-Deployment

- [ ] Monitor error rates for 1 hour
- [ ] Check application metrics
- [ ] Verify database performance
- [ ] Test critical user flows
- [ ] Review logs for errors
- [ ] Confirm backup jobs running
- [ ] Update documentation
- [ ] Notify stakeholders

### Islamic Finance Specific

- [ ] Zakat calculation accuracy verified
- [ ] Donation processing working
- [ ] Murabaha contract generation tested
- [ ] Financial data encrypted at rest
- [ ] Audit logs enabled
- [ ] Compliance requirements met

## Related Documentation

- **[Configuration](configuration.md)** - Production configuration
- **[Performance](performance.md)** - Scaling and optimization
- **[Observability](observability.md)** - Monitoring and logging
- **[Security](security.md)** - Production security
