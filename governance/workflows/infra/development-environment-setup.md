---
name: development-environment-setup
goal: "Set up a complete local development environment with all toolchains required for pre-commit, pre-push, integration tests, and E2E tests across all projects"
termination: "npm run doctor reports all tools OK and nx affected -t test:quick passes for all projects"
inputs:
  - name: platform
    type: enum
    values: [macos, linux]
    description: Target operating system
    required: false
    default: macos
  - name: scope
    type: enum
    values: [full, minimal]
    description: "full: all 19 tools for all projects; minimal: core tools only (Node.js, Go, Docker, jq)"
    required: false
    default: full
outputs:
  - name: doctor-status
    type: enum
    values: [all-ok, warnings, missing]
    description: Result of npm run doctor after setup
  - name: tools-installed
    type: number
    description: Count of tools successfully installed and verified
---

# Development Environment Setup Workflow

**Purpose**: Guide a developer (or AI assistant helping a developer) through installing and
configuring every tool required to work on any project in this monorepo — from git hooks to
integration tests to E2E tests.

**When to use**:

- New developer onboarding to the repository
- Setting up a new machine or fresh OS install
- Recovering from a broken toolchain (e.g., after a major OS upgrade)
- Verifying an existing environment is complete after adding a new project language

## Execution Mode

**Preferred Mode**: Manual Orchestration — a developer follows these steps, optionally guided
by an AI assistant. This workflow involves system-level installations that require human
confirmation and shell access.

## Tool Inventory

All tools checked by `rhino-cli doctor`:

| #   | Tool           | Required Version      | Version Source                                | Manager        |
| --- | -------------- | --------------------- | --------------------------------------------- | -------------- |
| 1   | git            | Any                   | (no config file)                              | System/Brew    |
| 2   | volta          | Any                   | (no config file)                              | curl script    |
| 3   | node           | 24.13.1               | package.json > volta.node                     | Volta          |
| 4   | npm            | 11.10.1               | package.json > volta.npm                      | Volta          |
| 5   | java           | 25+ (major)           | apps/organiclever-be-jasb/pom.xml             | SDKMAN         |
| 6   | maven          | Any                   | (no config file)                              | SDKMAN         |
| 7   | golang         | >= go.mod directive   | apps/rhino-cli/go.mod                         | Brew/asdf      |
| 8   | python         | >= .python-version    | apps/a-demo-be-python-fastapi/.python-version | pyenv/System   |
| 9   | rust (rustc)   | >= 1.80 (MSRV)        | apps/a-demo-be-rust-axum/Cargo.toml           | rustup         |
| 10  | cargo-llvm-cov | Any                   | (no config file)                              | cargo          |
| 11  | elixir         | >= 1.19.5             | .tool-versions                                | asdf           |
| 12  | erlang         | >= 27 (major)         | .tool-versions                                | asdf           |
| 13  | dotnet         | >= global.json major  | apps/a-demo-be-fsharp-giraffe/global.json     | Brew/Script    |
| 14  | clojure (clj)  | Any                   | (no config file)                              | Brew           |
| 15  | dart           | >= pubspec.yaml SDK   | apps/a-demo-fe-dart-flutterweb/pubspec.yaml   | Flutter        |
| 16  | flutter        | >= 3.41.0             | apps/a-demo-fe-dart-flutterweb/pubspec.yaml   | Manual/Brew    |
| 17  | docker         | Any                   | (no config file)                              | Docker Desktop |
| 18  | jq             | Any                   | (no config file)                              | Brew           |
| 19  | playwright     | (matches npm version) | node_modules                                  | npx            |

## Quick Start: `doctor --fix`

If you already have Homebrew (macOS) or apt (Linux) and Node.js/npm installed:

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
npm install
npm run doctor -- --fix          # Auto-install all missing tools
npm run doctor -- --fix --dry-run  # Preview what would be installed (no changes)
```

`doctor --fix` detects your platform (macOS or Linux) and uses the appropriate package
manager for each tool. It is idempotent — running it when all tools are installed is a no-op.

For manual step-by-step installation, follow the phases below.

## Steps

### Phase 1: System Package Manager (Sequential)

Install the system package manager needed for subsequent tool installations.

#### 1.1 Install Homebrew (macOS only)

**Condition**: `{input.platform} == macos`

```bash
# Check if Homebrew is installed
brew --version

# If not installed:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Success criteria**: `brew --version` returns a version string.

**On failure**: Follow manual instructions at <https://brew.sh>.

**Alternative**: After installing Homebrew, you can install all Homebrew-managed dependencies
at once using the `Brewfile` at the repository root:

```bash
brew bundle
```

This installs Go, jq, dotnet, pyenv, asdf, Clojure CLI, and Flutter. Tools managed by other
installers (Volta, SDKMAN, rustup) still need separate installation in subsequent phases.

#### 1.2 Update system package manager

```bash
# macOS
brew update

# Linux (Debian/Ubuntu)
sudo apt-get update
```

**Success criteria**: Package index updated without errors.

---

### Phase 2: Core Tools (Sequential)

Install foundational tools required before anything else.

#### 2.1 Install Git

```bash
# macOS (usually pre-installed with Xcode CLT)
git --version || xcode-select --install

# Linux
sudo apt-get install -y git
```

**Success criteria**: `git --version` returns a version string.

#### 2.2 Install Docker Desktop

```bash
# macOS — download and install Docker Desktop
# https://docs.docker.com/desktop/setup/install/mac-install/
# After installation, start Docker Desktop from Applications

# Linux — install Docker Engine + Compose plugin
# https://docs.docker.com/engine/install/

# Verify
docker --version
docker compose version
```

**Success criteria**: `docker --version` and `docker compose version` both return version strings.
Docker daemon is running (`docker info` succeeds).

**On failure**: Ensure Docker Desktop is running. On Linux, add user to docker group:
`sudo usermod -aG docker $USER` then log out and back in.

#### 2.3 Install jq

```bash
# macOS
brew install jq

# Linux
sudo apt-get install -y jq
```

**Success criteria**: `jq --version` returns a version string. Required for Claude Code hooks.

---

### Phase 3: Node.js Ecosystem (Sequential)

#### 3.1 Install Volta

```bash
# Install Volta (manages Node.js and npm versions)
curl https://get.volta.sh | bash

# Restart shell or source profile
source ~/.zshrc  # or ~/.bashrc
```

**Success criteria**: `volta --version` returns a version string.

**On failure**: Ensure `~/.volta/bin` is in your PATH. Check `~/.zshrc` or `~/.bashrc` for
the Volta PATH entry.

#### 3.2 Install Node.js and npm via Volta

Volta auto-installs the correct versions when you enter the repo directory, because
`package.json` pins them via `volta.node` and `volta.npm`. Just run:

```bash
cd /path/to/open-sharia-enterprise
node --version   # Should show v24.13.1
npm --version    # Should show 11.10.1
```

If versions don't match, force install:

```bash
volta install node@24.13.1
volta install npm@11.10.1
```

**Success criteria**: `node --version` shows `v24.13.1` and `npm --version` shows `11.10.1`.

---

### Phase 4: JVM Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-be-java-springboot`, `a-demo-be-java-vertx`, `a-demo-be-kotlin-ktor`,
`a-demo-be-clojure-pedestal`

#### 4.1 Install SDKMAN

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

**Success criteria**: `sdk version` returns a version string.

#### 4.2 Install Java 25+

```bash
sdk install java 25-tem
java -version
```

**Success criteria**: `java -version` shows major version 25 or higher. The required version
is in `apps/a-demo-be-java-springboot/pom.xml` under `<java.version>`.

#### 4.3 Install Maven

```bash
sdk install maven
mvn --version
```

**Success criteria**: `mvn --version` returns Apache Maven version.

#### 4.4 Install Kotlin (for Ktor project)

Kotlin compilation is handled by Gradle (bundled wrapper in the project), so no separate
Kotlin install is needed. The JDK from step 4.2 is sufficient.

**Success criteria**: `./gradlew --version` works in `apps/a-demo-be-kotlin-ktor/`.

#### 4.5 Install Clojure CLI

```bash
# macOS
brew install clojure/tools/clojure

# Linux
# https://clojure.org/guides/install_clojure
```

**Success criteria**: `clj --version` returns a version string.

---

### Phase 5: Go Ecosystem (Sequential)

Required for: `rhino-cli`, `ayokoding-cli`, `oseplatform-cli`, `a-demo-be-golang-gin`,
`libs/golang-commons`

#### 5.1 Install Go

```bash
# macOS
brew install go

# Linux — download from https://go.dev/dl/
```

The required minimum version is specified in `apps/rhino-cli/go.mod`. As of this writing,
Go >= 1.26.

**Success criteria**: `go version` shows a version >= the go.mod directive.

---

### Phase 6: Python Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-be-python-fastapi`

#### 6.1 Install Python 3.13+

```bash
# macOS (via pyenv, recommended)
brew install pyenv
pyenv install 3.13.5
pyenv global 3.13.5

# Or use Homebrew directly
brew install python@3.13

# Linux
sudo apt-get install -y python3 python3-pip python3-venv
```

The required minimum version is in `apps/a-demo-be-python-fastapi/.python-version`.

**Success criteria**: `python3 --version` shows a version >= the `.python-version` file.

---

### Phase 7: Rust Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-be-rust-axum`

#### 7.1 Install Rust via rustup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

**Success criteria**: `rustc --version` returns a version string.

#### 7.2 Install cargo-llvm-cov (coverage tool)

```bash
cargo install cargo-llvm-cov
```

**Success criteria**: `cargo llvm-cov --version` returns a version string.

---

### Phase 8: Elixir/Erlang Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-be-elixir-phoenix`

#### 8.1 Install asdf version manager

```bash
# macOS
brew install asdf

# Linux
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
source ~/.bashrc
```

**Success criteria**: `asdf --version` returns a version string.

#### 8.2 Install Erlang

```bash
asdf plugin add erlang
asdf install erlang 27.3

# Set global default
asdf global erlang 27.3
```

The required version is pinned in `.tool-versions` (currently `erlang 27.3`).

**Note**: Erlang compilation requires build dependencies. On macOS: `brew install autoconf
openssl wxwidgets`. On Linux: `sudo apt-get install -y build-essential autoconf libncurses-dev
libssl-dev`.

**Success criteria**: `erl -noshell -eval 'io:format("~s",[erlang:system_info(otp_release)]),halt().'`
shows `27`.

#### 8.3 Install Elixir

```bash
asdf plugin add elixir
asdf install elixir 1.19.5-otp-27

# Set global default
asdf global elixir 1.19.5-otp-27
```

The required version is pinned in `.tool-versions` (currently `elixir 1.19.5-otp-27`).

**Success criteria**: `elixir --version` shows Elixir 1.19.5.

---

### Phase 9: .NET Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-be-fsharp-giraffe`, `a-demo-be-csharp-aspnetcore`, `organiclever-be`

#### 9.1 Install .NET SDK

```bash
# macOS
brew install dotnet

# Linux — https://learn.microsoft.com/en-us/dotnet/core/install/linux
```

The required major version is in `apps/a-demo-be-fsharp-giraffe/global.json` under
`sdk.version`.

**Success criteria**: `dotnet --version` shows a version with the same or higher major version
as `global.json`.

---

### Phase 10: Dart/Flutter Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: `a-demo-fe-dart-flutterweb`

#### 10.1 Install Flutter (includes Dart)

```bash
# macOS
brew install --cask flutter

# Or manual install: https://docs.flutter.dev/get-started/install
```

Flutter bundles the Dart SDK. The minimum Dart SDK version is in
`apps/a-demo-fe-dart-flutterweb/pubspec.yaml` under `environment.sdk`.

**Success criteria**: `flutter --version` and `dart --version` both return version strings.
Dart version >= the pubspec constraint.

#### 10.2 Enable Flutter Web

```bash
flutter config --enable-web
flutter doctor
```

**Success criteria**: `flutter doctor` shows no critical issues for web development.

---

### Phase 11: Repository Bootstrap (Sequential)

**Depends on**: Phases 1-3 (minimum), Phases 4-10 (for full scope)

#### 11.1 Clone the repository

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
```

**Condition**: Skip if already cloned.

#### 11.2 Install npm dependencies

```bash
npm install
```

This also triggers Husky to install git hooks (pre-commit, commit-msg, pre-push).

**Success criteria**: `npm install` exits 0. `.husky/pre-commit`, `.husky/commit-msg`,
`.husky/pre-push` exist.

#### 11.3 Restore environment files

`.env` files are gitignored but required by many apps. If you have a previous backup
(from `rhino-cli env backup`), restore them now:

```bash
# Restore .env files from default backup location (~/ose-open-env-backup)
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force

# Include uncommitted config files (AI tool settings, Docker overrides, direnv, etc.)
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force --include-config
```

**Condition**: Skip if this is a brand-new setup with no previous backup. Instead, use
`env init` to bootstrap `.env` files from `.env.example` templates:

```bash
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env init
```

This creates `.env` files from all `.env.example` templates in `infra/dev/`. Use `--force`
to overwrite existing files.

**Success criteria**: Restored files appear in their original app directories (e.g.,
`apps/ayokoding-web/.env.local`, `apps/organiclever-be/.env`).

**On failure**: If no backup exists, copy `.env.example` to `.env` in each app you plan to
work on and fill in the required values.

#### 11.4 Run doctor to verify all tools

```bash
npm run doctor
```

**Success criteria**: All tools show `ok` status. No `missing` entries.

**On failure**: Review doctor output. Each missing tool maps to one of the phases above.
Install the missing tool and re-run doctor.

---

### Phase 12: Playwright Browsers (Sequential)

**Depends on**: Phase 11

Required for: All E2E tests (`*-e2e` projects)

#### 12.1 Install Playwright browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers used by Playwright E2E tests.
Doctor now checks for Playwright browsers — if browsers are missing, it shows a warning
with the install command.

**Success criteria**: `npx playwright install` exits 0 without errors. `npm run doctor`
shows playwright as OK (not warning).

**On failure**: On Linux, install system dependencies first:
`npx playwright install-deps`

---

### Phase 13: Verification (Sequential)

**Depends on**: All previous phases

#### 13.1 Verify pre-commit hook

```bash
# Create a test change and attempt a commit
echo "# test" >> /tmp/test-precommit.md
cp /tmp/test-precommit.md README.md
git add README.md
git commit -m "test: verify pre-commit hook"
# Pre-commit hook should run Prettier, markdownlint, and lint-staged
# Then abort: git reset HEAD~1 && git checkout README.md
git reset HEAD~1
git checkout README.md
```

**Success criteria**: Pre-commit hook runs without errors (Prettier, markdownlint).

#### 13.2 Verify pre-push targets (cache warm)

```bash
# Run the same targets pre-push would run, for affected projects
npx nx affected -t typecheck lint test:quick spec-coverage
```

**Success criteria**: All affected targets pass. This also warms the Nx cache so subsequent
pushes are fast.

#### 13.3 Verify integration tests (one backend)

```bash
# Pick any backend to validate Docker + PostgreSQL integration
nx run a-demo-be-golang-gin:test:integration
```

**Success criteria**: Integration tests pass. Docker starts PostgreSQL, runs migrations, and
executes Gherkin scenarios against a real database.

**On failure**: Ensure Docker is running (`docker info`). Check for port conflicts on 5432.

#### 13.4 Verify E2E tests (one backend)

```bash
# Start a backend
nx run a-demo-be-golang-gin:dev &

# Wait for it to be ready, then run E2E
sleep 5
nx run a-demo-be-e2e:test:e2e

# Stop the backend
kill %1
```

**Success criteria**: Playwright E2E tests pass against the running backend.

---

## Termination Criteria

- **Success**: `npm run doctor` shows all tools OK, `nx affected -t typecheck lint test:quick spec-coverage`
  passes, at least one integration test and one E2E test pass
- **Partial**: Doctor shows all tools OK but some tests fail (likely a project-specific issue,
  not a toolchain issue)
- **Failure**: Doctor reports missing tools after completing all phases

## Minimal Scope Quick Reference

For `scope: minimal` (core development only — TypeScript/Go projects, git hooks, unit tests):

| Phase | Steps     | Tools Installed                  |
| ----- | --------- | -------------------------------- |
| 1     | 1.1-1.2   | Homebrew                         |
| 2     | 2.1-2.3   | Git, Docker, jq                  |
| 3     | 3.1-3.2   | Volta, Node.js 24, npm           |
| 5     | 5.1       | Go                               |
| 11    | 11.1-11.4 | npm deps, env restore, git hooks |
| 12    | 12.1      | Playwright browsers              |
| 13    | 13.1-13.2 | Verification                     |

This covers: pre-commit hooks, pre-push hooks, TypeScript/Go unit tests, and basic E2E tests.

## Notes

- **Version pinning**: All version requirements are read from config files in the repo
  (package.json, go.mod, .tool-versions, global.json, .python-version, pubspec.yaml).
  The doctor command verifies these automatically.
- **Idempotency**: Every step can be re-run safely. Running an install command for an
  already-installed tool is a no-op or an upgrade.
- **macOS focus**: This workflow prioritizes macOS (the primary development platform).
  Linux instructions are provided as alternatives where they differ.
- **No Windows support**: Windows is not a supported development platform for this repository.
- **CI parity**: CI uses Docker containers with all tools pre-installed. This workflow ensures
  your local environment matches CI capabilities.
- **Git worktree compatible**: All commands (`doctor`, `doctor --fix`, `env init`) work
  correctly from git worktrees. `findGitRoot()` handles both `.git` directories and worktree
  `.git` files.

## Principles Implemented/Respected

- **Reproducibility First**: Pinned versions from config files ensure identical environments
- **Explicit Over Implicit**: Every tool, version, and verification step is documented
- **Automation Over Manual**: Doctor automates verification; version managers automate switching
- **Documentation First**: This workflow exists so setup is never tribal knowledge
- **Progressive Disclosure**: Minimal scope for quick starts; full scope for complete setup

## Conventions Implemented/Respected

- **[Workflow Identifier Convention](../meta/workflow-identifier.md)**: Follows standard workflow
  structure with YAML frontmatter
- **[Reproducible Environments](../../development/workflow/reproducible-environments.md)**: Implements
  the environment reproducibility practices defined in governance
- **[Code Quality Convention](../../development/quality/code.md)**: Verification steps ensure
  git hooks work correctly

## Related Workflows

- [CI Quality Gate](../ci/ci-quality-gate.md) — Validates CI/CD compliance (assumes toolchain
  is already set up)

## Related Documentation

- [How to Set Up Your Development Environment](../../../docs/how-to/setup-development-environment.md) —
  Developer-facing companion guide
- [Reproducible Environments](../../development/workflow/reproducible-environments.md) — Volta,
  npm, Docker reproducibility practices
- [Local Development with Docker](../../../docs/how-to/local-dev-docker.md) — Docker
  Compose setup for running services
- [Code Quality Convention](../../development/quality/code.md) — Git hooks and formatting
