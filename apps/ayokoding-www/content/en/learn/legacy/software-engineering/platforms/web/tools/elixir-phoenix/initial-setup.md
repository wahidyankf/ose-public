---
title: "Initial Setup"
date: 2025-01-29T00:00:00+07:00
draft: false
weight: 10000000
description: "Get Phoenix Framework installed and running - Elixir setup, PostgreSQL installation, Phoenix generator, and your first web application"
tags: ["phoenix", "elixir", "setup", "installation", "web-framework", "beginner"]
---

**Want to start building with Phoenix Framework?** This initial setup guide gets Phoenix installed and working on your system in minutes. By the end, you'll have Phoenix running and will create your first web application.

This tutorial provides 0-5% coverage - just enough to get Phoenix working on your machine. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/quick-start) (5-30% coverage).

## Prerequisites

Before installing Phoenix, you need:

- A computer running Windows, macOS, or Linux
- Administrator/sudo access for installation
- A terminal/command prompt
- A text editor (VS Code, IntelliJ IDEA, Emacs, Vim)
- Basic command-line navigation skills
- Elixir 1.14+ installed (see [Elixir Initial Setup](/en/learn/software-engineering/programming-languages/elixir/initial-setup))
- PostgreSQL database (we'll install this)
- Node.js 14+ (for asset compilation)

No prior Phoenix or web framework experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Install** PostgreSQL database
2. **Install** Phoenix Framework and hex package manager
3. **Create** a new Phoenix web application
4. **Start** the Phoenix development server
5. **Access** your first Phoenix application in a browser

## Verify Elixir Installation

Phoenix requires Elixir 1.14 or later.

```bash
elixir --version
```

Expected output:

```
Erlang/OTP 26 [erts-14.2] [64-bit] [smp:8:8] [async-threads:1] [jit]

Elixir 1.16.0 (compiled with Erlang/OTP 26)
```

**Required**: Elixir 1.14+ and Erlang/OTP 24+

If not installed, follow [Elixir Initial Setup](/en/learn/software-engineering/programming-languages/elixir/initial-setup) first.

## PostgreSQL Installation

Phoenix uses PostgreSQL as the default database.

### Windows PostgreSQL Installation

**Step 1: Download PostgreSQL Installer**

1. Visit [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Click "Download the installer" (from EnterpriseDB)
3. Select PostgreSQL 15 or later for Windows x86-64

**Step 2: Run Installer**

1. Double-click downloaded `.exe` file
2. Follow installation wizard:
   - Click Next through welcome
   - Keep default installation directory
   - Select components: PostgreSQL Server, pgAdmin, Command Line Tools
   - Keep default data directory
   - **Set password for postgres user** (remember this!)
   - Keep default port: 5432
   - Keep default locale
   - Click Next through summary
   - Click Finish

**Step 3: Verify Installation**

Open Command Prompt:

```cmd
psql --version
```

Expected output:

```
psql (PostgreSQL) 15.5
```

**Alternative: Chocolatey**

```powershell
choco install postgresql
```

**Troubleshooting Windows**:

- If `psql` not found, add `C:\Program Files\PostgreSQL\15\bin` to PATH
- Restart Command Prompt after installation

### macOS PostgreSQL Installation

**Step 1: Install via Homebrew**

```bash
brew install postgresql@15
```

**Step 2: Start PostgreSQL Service**

```bash
brew services start postgresql@15
```

**Step 3: Verify Installation**

```bash
psql --version
```

Expected output:

```
psql (PostgreSQL) 15.5
```

**Alternative: Postgres.app (GUI)**

1. Download [Postgres.app](https://postgresapp.com/)
2. Drag to Applications folder
3. Open Postgres.app
4. Click "Initialize" to create database

**Troubleshooting macOS**:

- If `psql` not found, add to PATH: `export PATH="/usr/local/opt/postgresql@15/bin:$PATH"`
- Add to `~/.zshrc` for persistence

### Linux PostgreSQL Installation

**Ubuntu/Debian**:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Start service:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Fedora/RHEL/CentOS**:

```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Arch Linux**:

```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Verify Installation**:

```bash
psql --version
```

Expected output:

```
psql (PostgreSQL) 15.5
```

**Troubleshooting Linux**:

- If service fails to start: `sudo systemctl status postgresql` shows errors
- Check PostgreSQL logs: `/var/log/postgresql/`

## Configure PostgreSQL for Phoenix

Phoenix needs a database user with creation privileges.

### Create Phoenix Database User

**Linux/macOS**:

```bash
sudo -u postgres psql

CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;

\q
```

**Windows**:

```cmd
psql -U postgres

ALTER USER postgres WITH PASSWORD 'postgres';

\q
```

**Phoenix defaults**:

- Username: `postgres`
- Password: `postgres`
- Host: `localhost`
- Port: `5432`

You can change these in Phoenix config files later.

### Verify Database Connection

```bash
psql -U postgres -h localhost
```

Enter password when prompted. If you see PostgreSQL prompt, connection works:

```
psql (15.5)
Type "help" for help.

postgres=#
```

Exit with `\q`.

## Node.js Installation

Phoenix uses Node.js for asset compilation (JavaScript/CSS).

### Verify Node.js Installation

```bash
node --version
```

**Required**: Node.js 14 or later

If not installed, follow platform-specific instructions:

**Windows**: Download from [https://nodejs.org/](https://nodejs.org/) or use `choco install nodejs`

**macOS**: `brew install node`

**Linux**: `sudo apt install nodejs npm` (Ubuntu/Debian) or `sudo dnf install nodejs` (Fedora)

## Install Hex Package Manager

Hex is Elixir's package manager (similar to npm for Node.js).

```bash
mix local.hex
```

Output:

```
Are you sure you want to install "https://repo.hex.pm/installs/1.16.0/hex-2.0.6.ez"? [Yn] y
* creating /home/<user>/.mix/archives/hex-2.0.6
```

Type `y` and press Enter to install.

## Install Phoenix Framework

Install Phoenix archive (project generator):

```bash
mix archive.install hex phx_new
```

Output:

```
Resolving Hex dependencies...
Resolution completed in 0.1s
New:
  phx_new 1.7.10
* creating /home/<user>/.mix/archives/phx_new-1.7.10

Are you sure you want to install "phx_new 1.7.10"? [Yn] y
```

Type `y` and press Enter.

**Verify installation**:

```bash
mix phx.new --version
```

Expected output:

```
Phoenix installer v1.7.10
```

## Create Your First Phoenix Application

Let's create a Phoenix web application.

### Generate New Project

```bash
mix phx.new hello_phoenix
```

Output:

```
* creating hello_phoenix/config/config.exs
* creating hello_phoenix/config/dev.exs
* creating hello_phoenix/config/prod.exs
* creating hello_phoenix/config/runtime.exs
* creating hello_phoenix/config/test.exs
* creating hello_phoenix/lib/hello_phoenix/application.ex
* creating hello_phoenix/lib/hello_phoenix.ex
...
* creating hello_phoenix/assets/js/app.js
* creating hello_phoenix/assets/css/app.css

Fetch and install dependencies? [Yn] y
```

Type `y` to install dependencies.

Phoenix downloads:

- Elixir dependencies (Phoenix, Ecto, Plug, etc.)
- Node.js dependencies (esbuild, etc.)

This takes 2-5 minutes.

**Output summary**:

```
We are almost there! The following steps are missing:

    $ cd hello_phoenix

Then configure your database in config/dev.exs and run:

    $ mix ecto.create

Start your Phoenix app with:

    $ mix phx.server

You can also run your app inside IEx (Interactive Elixir) as:

    $ iex -S mix phx.server
```

### Explore Project Structure

```bash
cd hello_phoenix
```

Phoenix creates this structure:

```
hello_phoenix/
├── _build/              # Compiled artifacts
├── assets/              # Frontend assets (JS, CSS)
│   ├── css/
│   ├── js/
│   └── vendor/
├── config/              # Configuration files
│   ├── config.exs       # Shared config
│   ├── dev.exs          # Development config
│   ├── prod.exs         # Production config
│   ├── runtime.exs      # Runtime config
│   └── test.exs         # Test config
├── deps/                # Elixir dependencies
├── lib/
│   ├── hello_phoenix/   # Business logic
│   │   ├── application.ex
│   │   ├── repo.ex      # Database repository
│   │   └── ...
│   ├── hello_phoenix_web/  # Web layer
│   │   ├── controllers/
│   │   ├── components/
│   │   ├── endpoint.ex
│   │   ├── router.ex    # URL routing
│   │   └── ...
│   └── hello_phoenix.ex
├── priv/
│   ├── repo/            # Database migrations
│   │   └── migrations/
│   ├── static/          # Compiled static assets
│   └── gettext/         # Internationalization
├── test/                # Test files
├── mix.exs              # Project configuration
└── mix.lock             # Dependency lock file
```

### Configure Database

Phoenix generates default database config in `config/dev.exs`.

**View config**:

```bash
cat config/dev.exs | grep -A 10 "Configure your database"
```

Default configuration:

```elixir
config :hello_phoenix, HelloPhoenix.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "hello_phoenix_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
```

**If your PostgreSQL credentials differ**, edit `config/dev.exs` with your username/password.

### Create Database

```bash
mix ecto.create
```

Output:

```
Compiling 14 files (.ex)
Generated hello_phoenix app
The database for HelloPhoenix.Repo has been created
```

This creates `hello_phoenix_dev` database in PostgreSQL.

**Troubleshooting database creation**:

- **Connection refused**: Ensure PostgreSQL service running
  - Linux: `sudo systemctl status postgresql`
  - macOS: `brew services list`
  - Windows: Check Services app
- **Authentication failed**: Verify username/password in `config/dev.exs`
- **Database already exists**: Safe to ignore or use `mix ecto.drop` to delete first

## Start Phoenix Development Server

### Launch Server

```bash
mix phx.server
```

First run compiles project and starts server:

```
[info] Running HelloPhoenixWeb.Endpoint with Bandit 1.1.0 at 127.0.0.1:4000 (http)
[info] Access HelloPhoenixWeb.Endpoint at http://localhost:4000
[debug] Downloading esbuild from https://registry.npmjs.org/esbuild-linux-x64/...
[watch] build finished, watching for changes...
```

**Server is ready when you see**:

```
[info] Access HelloPhoenixWeb.Endpoint at http://localhost:4000
```

### Access Your Application

Open browser and visit:

```
http://localhost:4000
```

You should see the **Phoenix Framework welcome page** with:

- Phoenix logo
- "Peace of mind from prototype to production"
- Links to documentation and resources

**Congratulations!** Your Phoenix application is running.

### Explore Default Routes

Phoenix includes these routes by default:

- `http://localhost:4000/` - Home page
- `http://localhost:4000/dev/dashboard` - Phoenix LiveDashboard (development metrics)

**Try LiveDashboard**:

Visit `http://localhost:4000/dev/dashboard` to see:

- Request metrics
- Application tree
- OS data
- ETS tables
- Ports and processes

This dashboard shows real-time application insights.

### Stop the Server

Press `Ctrl+C` twice in terminal to stop Phoenix server.

## Interactive Development with IEx

Phoenix can run inside IEx for interactive development.

### Start Phoenix in IEx

```bash
iex -S mix phx.server
```

Server starts and you get IEx prompt:

```
[info] Running HelloPhoenixWeb.Endpoint with Bandit 1.1.0 at 127.0.0.1:4000 (http)
[info] Access HelloPhoenixWeb.Endpoint at http://localhost:4000
Interactive Elixir (1.16.0) - press Ctrl+C to exit
iex(1)>
```

**Now you can**:

- Access application at `http://localhost:4000` (server runs in background)
- Execute Elixir code in IEx
- Test functions interactively
- Inspect application state

**Example - query application modules**:

```elixir
iex(1)> HelloPhoenixWeb.Endpoint.config(:url)
[host: "localhost"]

iex(2)> HelloPhoenixWeb.Router.__routes__()
```

**Exit**: Press `Ctrl+C` twice.

## Understanding Phoenix Project Files

### Key Files and Directories

**mix.exs** - Project configuration and dependencies:

```elixir
defp deps do
  [
    {:phoenix, "~> 1.7.10"},
    {:phoenix_ecto, "~> 4.4"},
    {:ecto_sql, "~> 3.10"},
    {:postgrex, ">= 0.0.0"},
    {:phoenix_live_view, "~> 0.20.1"},
    # ...
  ]
end
```

**lib/hello_phoenix_web/router.ex** - URL routing:

```elixir
scope "/", HelloPhoenixWeb do
  pipe_through :browser

  get "/", PageController, :home
end
```

Defines routes mapping URLs to controller actions.

**lib/hello_phoenix_web/controllers/page_controller.ex** - Controller handling requests:

```elixir
defmodule HelloPhoenixWeb.PageController do
  use HelloPhoenixWeb, :controller

  def home(conn, _params) do
    render(conn, :home, layout: false)
  end
end
```

**lib/hello_phoenix_web/endpoint.ex** - HTTP endpoint configuration.

**config/dev.exs** - Development environment configuration.

### Phoenix Architecture Layers

Phoenix follows this structure:

```
Browser
   ↓
Endpoint (HTTP)
   ↓
Router (URL matching)
   ↓
Pipeline (plugs)
   ↓
Controller (business logic)
   ↓
View (rendering)
   ↓
Template (HTML)
```

We'll explore this in detail in later tutorials.

## Verify Your Setup Works

Let's confirm everything is functioning correctly.

### Test 1: Elixir and Phoenix Installed

```bash
elixir --version
mix phx.new --version
```

Should show Elixir 1.14+ and Phoenix 1.7+.

### Test 2: PostgreSQL Running

```bash
psql -U postgres -h localhost
```

Should connect to PostgreSQL. Exit with `\q`.

### Test 3: Create Project and Database

```bash
mix phx.new test_app --no-install
cd test_app
mix deps.get
mix ecto.create
```

Should create project and database without errors.

### Test 4: Start Server

```bash
mix phx.server
```

Should start server on port 4000.

### Test 5: Access Application

Open browser to `http://localhost:4000` - should see Phoenix welcome page.

**All tests passed?** Your Phoenix setup is complete!

## Summary

**What you've accomplished**:

- Verified Elixir 1.14+ installation
- Installed and configured PostgreSQL database
- Installed Hex package manager for Elixir
- Installed Phoenix Framework generator
- Created your first Phoenix web application
- Started Phoenix development server
- Accessed application in browser
- Explored Phoenix LiveDashboard

**Key commands learned**:

- `mix local.hex` - Install Hex package manager
- `mix archive.install hex phx_new` - Install Phoenix generator
- `mix phx.new <app_name>` - Create new Phoenix project
- `mix ecto.create` - Create database
- `mix phx.server` - Start development server
- `iex -S mix phx.server` - Start server in IEx
- `mix deps.get` - Fetch dependencies

**Skills gained**:

- PostgreSQL setup for Phoenix development
- Phoenix project generation and structure
- Development server operation
- Interactive development with IEx
- Phoenix architecture awareness

## Next Steps

**Ready to learn Phoenix fundamentals?**

- [Quick Start](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/quick-start) (5-30% coverage) - Touch all core Phoenix concepts in a fast-paced tour

**Want comprehensive Phoenix mastery?**

- [Beginner Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner) (0-60% coverage) - Deep dive into Phoenix with extensive practice

**Prefer code-first learning?**

- [By-Example Tutorial](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example) - Learn through heavily annotated examples

**Want to understand Phoenix's design philosophy?**

- [Overview](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/overview) - Why Phoenix exists and when to use it

## Troubleshooting Common Issues

### "mix: command not found"

**Problem**: Elixir not installed or not in PATH.

**Solution**:

- Install Elixir first: [Elixir Initial Setup](/en/learn/software-engineering/programming-languages/elixir/initial-setup)
- Ensure Elixir bin directory in PATH
- Restart terminal after installation

### "connection refused" when creating database

**Problem**: PostgreSQL not running.

**Solution**:

- **Linux**: `sudo systemctl start postgresql`
- **macOS**: `brew services start postgresql@15`
- **Windows**: Start PostgreSQL service in Services app
- Verify: `psql -U postgres -h localhost`

### "authentication failed" for database

**Problem**: Wrong username/password.

**Solution**:

- Edit `config/dev.exs` with correct credentials
- Or reset PostgreSQL password:
  - Linux/macOS: `sudo -u postgres psql` then `ALTER USER postgres PASSWORD 'newpass';`
  - Windows: Connect with pgAdmin and change password

### "esbuild" download fails

**Problem**: Node.js asset compilation issues.

**Solution**:

- Ensure Node.js installed: `node --version`
- Check internet connection (downloads from npm registry)
- Delete `assets/node_modules` and retry: `cd assets && npm install`

### Port 4000 already in use

**Problem**: Another process using port 4000.

**Solution**:

- Stop other Phoenix server (press Ctrl+C twice)
- Or change port in `config/dev.exs`:

  ```elixir
  config :hello_phoenix, HelloPhoenixWeb.Endpoint,
    http: [ip: {127, 0, 0, 1}, port: 4001]
  ```

- Restart server

### LiveDashboard shows "not found"

**Problem**: Route not configured.

**Solution**:

- LiveDashboard only works in development mode
- Verify `config/dev.exs` has LiveDashboard configuration
- Ensure you're running `mix phx.server` (not production mode)

### Compilation errors after project creation

**Problem**: Dependency or configuration issues.

**Solution**:

- Delete dependencies: `rm -rf deps _build`
- Fetch again: `mix deps.get`
- Recompile: `mix compile`
- If errors persist, recreate project

## Further Resources

**Official Phoenix Documentation**:

- [Phoenix Guides](https://hexdocs.pm/phoenix/overview.html) - Official comprehensive guides
- [Phoenix Docs](https://hexdocs.pm/phoenix/) - API documentation
- [Phoenix GitHub](https://github.com/phoenixframework/phoenix) - Source code and examples

**Database and Ecto**:

- [Ecto Documentation](https://hexdocs.pm/ecto/) - Database wrapper
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database reference

**Interactive Learning**:

- [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/) - Real-time features
- [Phoenix Generators](https://hexdocs.pm/phoenix/Mix.Tasks.Phx.Gen.Html.html) - Code generators

**Community**:

- [Elixir Forum](https://elixirforum.com/) - Active community discussion
- [Phoenix Forum Category](https://elixirforum.com/c/phoenix-forum/15) - Phoenix-specific help
- [Elixir Slack #phoenix](https://elixir-slackin.herokuapp.com/) - Real-time chat

**Books**:

- [Programming Phoenix](https://pragprog.com/titles/phoenix14/programming-phoenix-1-4/) - Comprehensive Phoenix book
- [Phoenix in Action](https://www.manning.com/books/phoenix-in-action) - Practical Phoenix development
