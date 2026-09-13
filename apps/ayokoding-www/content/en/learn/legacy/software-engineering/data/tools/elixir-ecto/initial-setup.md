---
title: "Initial Setup"
date: 2026-01-29T00:00:00+07:00
draft: false
weight: 100001
description: "Get Ecto installed and running with Elixir - installation, verification, and your first working database schema"
tags: ["elixir", "ecto", "database", "installation", "setup", "beginner"]
---

**Want to start working with databases in Elixir?** This initial setup guide gets Ecto installed and working in your Elixir project. By the end, you'll have Ecto running and will create your first schema with queries.

This tutorial provides 0-5% coverage - just enough to get Ecto working. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/data/tools/elixir-ecto/quick-start) (5-30% coverage).

## Prerequisites

Before installing Ecto, you need:

- Elixir 1.14+ installed (with Erlang/OTP 25+)
- PostgreSQL or MySQL database server running
- A terminal/command prompt
- A text editor or IDE (VS Code with ElixirLS, Emacs, Vim)
- Basic Elixir knowledge (modules, functions, pattern matching)

No prior Ecto or database experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Install** Ecto and database adapter in an Elixir project
2. **Configure** database connection settings
3. **Create** your first migration and schema
4. **Verify** that Ecto can connect and query the database
5. **Execute** basic queries using Ecto.Query and Ecto.Repo

## Install Elixir and PostgreSQL

Ecto requires Elixir and a database server. Verify installations before proceeding.

### Verify Elixir Installation

```bash
elixir --version
```

**Expected output**:

```
Erlang/OTP 26 [erts-14.2.1] [source] [64-bit]

Elixir 1.16.0 (compiled with Erlang/OTP 26)
```

If Elixir is not installed, see [Elixir Initial Setup](/en/learn/software-engineering/programming-languages/elixir/initial-setup).

### Verify PostgreSQL Installation

```bash
psql --version

pg_isready
```

**Expected output**:

```
psql (PostgreSQL) 16.1
/var/run/postgresql:5432 - accepting connections
```

If PostgreSQL is not installed, see [PostgreSQL Initial Setup](/en/learn/software-engineering/data/databases/postgresql/initial-setup).

**Alternative**: Use Docker for PostgreSQL:

```bash
docker run --name postgres-ecto \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=ecto_tutorial \
  -p 5432:5432 \
  -d postgres:16

docker ps | grep postgres-ecto
```

## Create New Mix Project

Create a new Elixir project using Mix.

### Create Project

```bash
mix new ecto_tutorial --sup

cd ecto_tutorial
```

**Flags explained**:

- `--sup`: Creates project with supervision tree (required for Ecto)

**Directory structure**:

```
ecto_tutorial/
├── lib/
│   ├── ecto_tutorial.ex
│   └── ecto_tutorial/
│       └── application.ex      # OTP application entry point
├── test/
├── mix.exs                     # Project dependencies
├── mix.lock                    # Dependency lock file
└── config/
    └── config.exs              # Application configuration
```

## Add Ecto Dependencies

Add Ecto and PostgreSQL adapter to your project.

### Edit mix.exs

Open `mix.exs` and add dependencies:

```elixir
defmodule EctoTutorial.MixProject do
  use Mix.Project

  def project do
    [
      app: :ecto_tutorial,
      version: "0.1.0",
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {EctoTutorial.Application, []}
    ]
  end

  defp deps do
    [
      # Ecto core library
      {:ecto_sql, "~> 3.11"},
      # PostgreSQL adapter
      {:postgrex, "~> 0.17"}
      # For MySQL instead: {:myxql, "~> 0.6"}
    ]
  end
end
```

**Dependencies explained**:

- `ecto_sql`: Ecto core with SQL support (migrations, queries, schemas)
- `postgrex`: PostgreSQL driver for Elixir
- Alternative: `myxql` for MySQL, `tds` for SQL Server, `sqlitex` for SQLite

### Install Dependencies

```bash
mix deps.get
mix deps.compile
```

**Expected output**:

```
Resolving Hex dependencies...
Dependency resolution completed:
  ecto_sql 3.11.0
  postgrex 0.17.4
* Getting ecto_sql (Hex package)
* Getting postgrex (Hex package)
Compiling 50 files (.ex)
Generated ecto_tutorial app
```

**Troubleshooting**:

- If compilation fails, verify Elixir 1.14+ is installed
- If network error, check internet connection and Hex package manager
- If version conflict, update Elixir: `asdf install elixir latest`

## Create Ecto Repository

Create the Ecto repository that manages database connections.

### Create Repo Module

Create `lib/ecto_tutorial/repo.ex`:

```elixir
defmodule EctoTutorial.Repo do
  use Ecto.Repo,
    otp_app: :ecto_tutorial,
    adapter: Ecto.Adapters.Postgres
end
```

**Code explained**:

- `use Ecto.Repo`: Defines repository with database functions
- `otp_app: :ecto_tutorial`: Links repo to your application
- `adapter: Ecto.Adapters.Postgres`: Uses PostgreSQL adapter

**For MySQL**, change adapter:

```elixir
adapter: Ecto.Adapters.MyXQL
```

### Add Repo to Supervision Tree

Edit `lib/ecto_tutorial/application.ex`:

```elixir
defmodule EctoTutorial.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Add Repo to supervision tree
      EctoTutorial.Repo
    ]

    opts = [strategy: :one_for_one, name: EctoTutorial.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
```

**What this does**:

- Starts `EctoTutorial.Repo` when application starts
- Supervises repo process (restarts if crashes)
- Enables database connection pooling

## Configure Database Connection

Configure Ecto to connect to your PostgreSQL database.

### Create config/config.exs

If not exists, create `config/config.exs`:

```elixir
import Config

config :ecto_tutorial, EctoTutorial.Repo,
  database: "ecto_tutorial_dev",
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  port: 5432,
  pool_size: 10

config :ecto_tutorial,
  ecto_repos: [EctoTutorial.Repo]
```

**Configuration explained**:

- `database`: Database name (created later)
- `username`/`password`: PostgreSQL credentials
- `hostname`: Database server address
- `port`: PostgreSQL port (default: 5432)
- `pool_size`: Number of database connections in pool
- `ecto_repos`: List of Ecto repositories (for Mix tasks)

### Environment-Specific Configuration

Create `config/dev.exs` for development overrides:

```elixir
import Config

config :ecto_tutorial, EctoTutorial.Repo,
  database: "ecto_tutorial_dev",
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :logger, level: :debug
```

Create `config/test.exs` for test environment:

```elixir
import Config

config :ecto_tutorial, EctoTutorial.Repo,
  database: "ecto_tutorial_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10

config :logger, level: :warning
```

Update `config/config.exs` to import environment configs:

```elixir
import Config

config :ecto_tutorial, EctoTutorial.Repo,
  # ... (same as above)

config :ecto_tutorial,
  ecto_repos: [EctoTutorial.Repo]

import_config "#{config_env()}.exs"
```

## Create Database

Use Ecto Mix tasks to create the database.

### Create Database

```bash
mix ecto.create
```

**Expected output**:

```
Compiling 1 file (.ex)
The database for EctoTutorial.Repo has been created
```

**What this does**:

- Reads config from `config/dev.exs` (default environment)
- Connects to PostgreSQL server
- Creates database `ecto_tutorial_dev`

**Troubleshooting**:

- If "database already exists", database was created previously (safe to ignore)
- If connection refused, verify PostgreSQL server is running: `pg_isready`
- If authentication failed, check username/password in `config/dev.exs`
- If permission denied, grant database creation rights:

```sql
-- In PostgreSQL
ALTER USER postgres CREATEDB;
```

### Verify Database Creation

```bash
psql -U postgres -d ecto_tutorial_dev -c "SELECT version();"
```

**Expected output**:

```
PostgreSQL 16.1 on x86_64-pc-linux-gnu, compiled by gcc...
```

## Create Your First Schema

Schemas map Elixir structs to database tables.

### Create Users Schema

Create `lib/ecto_tutorial/user.ex`:

```elixir
defmodule EctoTutorial.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :username, :string
    field :email, :string
    field :age, :integer

    timestamps()  # Adds inserted_at and updated_at
  end

  @doc """
  Changeset for creating and updating users.
  """
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :email, :age])
    |> validate_required([:username, :email])
    |> validate_length(:username, min: 3, max: 50)
    |> validate_format(:email, ~r/@/)
    |> unique_constraint(:username)
    |> unique_constraint(:email)
  end
end
```

**Schema explained**:

- `use Ecto.Schema`: Enables schema definition
- `schema "users"`: Maps to `users` table
- `field :username, :string`: String field named username
- `timestamps()`: Auto-managed inserted_at and updated_at fields
- `changeset/2`: Validates and casts data before database operations

### Create Migration for Users Table

Generate migration file:

```bash
mix ecto.gen.migration create_users
```

**Expected output**:

```
* creating priv/repo/migrations/20260129103045_create_users.exs
```

Edit generated migration file (`priv/repo/migrations/XXXXXX_create_users.exs`):

```elixir
defmodule EctoTutorial.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :username, :string, null: false
      add :email, :string, null: false
      add :age, :integer

      timestamps()
    end

    # Create unique indexes
    create unique_index(:users, [:username])
    create unique_index(:users, [:email])
  end
end
```

**Migration explained**:

- `create table(:users)`: Creates users table
- `add :username, :string, null: false`: Required string column
- `timestamps()`: Creates inserted_at and updated_at columns
- `create unique_index`: Ensures usernames and emails are unique

### Run Migration

```bash
mix ecto.migrate
```

**Expected output**:

```
[info] == Running EctoTutorial.Repo.Migrations.CreateUsers.change/0 forward
[info] create table users
[info] create index users_username_index
[info] create index users_email_index
[info] == Migrated in 0.0s
```

**Verify table creation**:

```bash
psql -U postgres -d ecto_tutorial_dev

\dt

\d users
```

**Expected output**:

```
          Table "public.users"
   Column    |            Type             | Nullable
-------------+-----------------------------+----------
 id          | bigint                      | not null
 username    | character varying(255)      | not null
 email       | character varying(255)      | not null
 age         | integer                     |
 inserted_at | timestamp without time zone | not null
 updated_at  | timestamp without time zone | not null

Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_index" UNIQUE, btree (email)
    "users_username_index" UNIQUE, btree (username)
```

## Your First Ecto Queries

Execute database operations using Ecto.

### Start IEx with Project

```bash
iex -S mix
```

### Insert Data

```elixir
user_params = %{
  username: "alice",
  email: "alice@example.com",
  age: 30
}

changeset = EctoTutorial.User.changeset(%EctoTutorial.User{}, user_params)
{:ok, user} = EctoTutorial.Repo.insert(changeset)

EctoTutorial.Repo.insert!(%EctoTutorial.User{
  username: "bob",
  email: "bob@example.com",
  age: 25
})
```

**Expected output**:

```elixir
%EctoTutorial.User{
  __meta__: #Ecto.Schema.Metadata<:loaded, "users">,
  id: 1,
  username: "alice",
  email: "alice@example.com",
  age: 30,
  inserted_at: ~N[2026-01-29 10:45:30],
  updated_at: ~N[2026-01-29 10:45:30]
}
```

### Query Data

```elixir
import Ecto.Query

EctoTutorial.Repo.all(EctoTutorial.User)

EctoTutorial.Repo.get(EctoTutorial.User, 1)

EctoTutorial.Repo.get_by(EctoTutorial.User, username: "alice")

query = from u in EctoTutorial.User, where: u.age > 25
EctoTutorial.Repo.all(query)

query = from u in EctoTutorial.User, select: {u.username, u.email}
EctoTutorial.Repo.all(query)

query = from u in EctoTutorial.User, select: count(u.id)
EctoTutorial.Repo.one(query)
```

**Expected output**:

```elixir
[%EctoTutorial.User{...}, %EctoTutorial.User{...}]

%EctoTutorial.User{id: 1, username: "alice", ...}

%EctoTutorial.User{id: 1, username: "alice", ...}

[%EctoTutorial.User{id: 1, username: "alice", age: 30}]

[{"alice", "alice@example.com"}, {"bob", "bob@example.com"}]

2
```

### Update Data

```elixir
user = EctoTutorial.Repo.get(EctoTutorial.User, 1)

changeset = EctoTutorial.User.changeset(user, %{age: 31})
{:ok, updated_user} = EctoTutorial.Repo.update(changeset)

query = from u in EctoTutorial.User, where: u.age < 30
{count, _} = EctoTutorial.Repo.update_all(query, inc: [age: 1])
```

**Expected output**:

```elixir
{:ok, %EctoTutorial.User{id: 1, age: 31, ...}}

{1, nil}  # Updated 1 row
```

### Delete Data

```elixir
user = EctoTutorial.Repo.get(EctoTutorial.User, 2)

{:ok, deleted_user} = EctoTutorial.Repo.delete(user)

query = from u in EctoTutorial.User, where: u.age > 100
{count, _} = EctoTutorial.Repo.delete_all(query)
```

**Expected output**:

```elixir
{:ok, %EctoTutorial.User{id: 2, username: "bob", ...}}

{0, nil}  # Deleted 0 rows (no users > 100)
```

## Useful Mix Tasks

Manage database and migrations with Mix tasks.

### Database Tasks

```bash
mix ecto.create

mix ecto.drop

mix ecto.reset

mix ecto.dump
```

### Migration Tasks

```bash
mix ecto.gen.migration migration_name

mix ecto.migrate

mix ecto.rollback

mix ecto.rollback --step 2

mix ecto.migrations
```

### Schema Tasks

```bash
mix phx.gen.schema User users username:string email:string age:integer

```

## Common Ecto Patterns

Master fundamental patterns for daily database work.

### Pattern Matching on Results

```elixir
case EctoTutorial.Repo.insert(changeset) do
  {:ok, user} ->
    IO.puts("Created user: #{user.username}")
  {:error, changeset} ->
    IO.inspect(changeset.errors)
end

user = EctoTutorial.Repo.insert!(changeset)
```

### Preloading Associations

```elixir
user = EctoTutorial.Repo.get(User, 1) |> EctoTutorial.Repo.preload(:posts)

user = EctoTutorial.Repo.get(User, 1) |> EctoTutorial.Repo.preload([:posts, :comments])

query = from u in User, where: u.id == ^id, preload: [:posts]
user = EctoTutorial.Repo.one(query)
```

### Transactions

```elixir
EctoTutorial.Repo.transaction(fn ->
  {:ok, user} = EctoTutorial.Repo.insert(user_changeset)
  {:ok, post} = EctoTutorial.Repo.insert(post_changeset)
  {:ok, user, post}
end)

EctoTutorial.Repo.transaction(fn ->
  user = EctoTutorial.Repo.insert!(user_changeset)
  if some_condition do
    EctoTutorial.Repo.rollback(:invalid_condition)
  end
  user
end)
```

## Next Steps

You now have Ecto installed and working. Here's what to learn next:

1. **[Quick Start](/en/learn/software-engineering/data/tools/elixir-ecto/quick-start)** - Build a complete application with associations, queries, and transactions (5-30% coverage)
2. **[By-Example Tutorial](/en/learn/software-engineering/data/tools/elixir-ecto/by-example)** - Learn through annotated examples covering 95% of Ecto
3. **[Ecto Documentation](https://hexdocs.pm/ecto/)** - Comprehensive reference and guides

## Summary

In this initial setup tutorial, you learned how to:

1. Add Ecto and database adapter dependencies to Mix project
2. Create Ecto repository and add to supervision tree
3. Configure database connection settings
4. Create database using Mix tasks
5. Define schema with fields and validations
6. Generate and run migrations
7. Execute basic CRUD operations (insert, query, update, delete)
8. Use Ecto.Query DSL for database queries

You're now ready to explore Ecto's powerful features: associations, changesets, transactions, and advanced queries. Continue to the Quick Start tutorial to build a real application.

## Common Issues and Solutions

### Connection Refused

**Problem**: Ecto can't connect to database

**Solutions**:

1. Verify PostgreSQL is running: `pg_isready`
2. Check hostname/port in config: `hostname: "localhost", port: 5432`
3. Verify credentials: `username: "postgres", password: "postgres"`
4. For Docker PostgreSQL, use `hostname: "host.docker.internal."` on macOS/Windows

### Migration Already Applied

**Problem**: Migration fails because already run

**Solution**: Check migration status and rollback if needed:

```bash
mix ecto.migrations

mix ecto.rollback

mix ecto.migrate
```

### Compilation Error

**Problem**: Ecto modules not compiling

**Solutions**:

1. Clean build artifacts: `mix clean`
2. Fetch dependencies again: `mix deps.clean --all && mix deps.get`
3. Verify Elixir version: `elixir --version` (requires 1.14+)

### Changeset Errors Not Showing

**Problem**: Insert fails silently without error details

**Solution**: Use bang version to raise or pattern match:

```elixir
EctoTutorial.Repo.insert!(changeset)

case EctoTutorial.Repo.insert(changeset) do
  {:ok, user} -> user
  {:error, changeset} -> IO.inspect(changeset.errors)
end
```

## Additional Resources

- [Ecto Official Documentation](https://hexdocs.pm/ecto/)
- [Ecto GitHub Repository](https://github.com/elixir-ecto/ecto)
- [Programming Ecto (Book)](https://pragprog.com/titles/wmecto/programming-ecto/)
- [Ecto Cheat Sheet](https://devhints.io/ecto)
- [Elixir Forum - Ecto Category](https://elixirforum.com/c/databases-and-data-persistence/ecto/23)
