# Requirements: Native Dev Setup Improvements

## Current Gaps

### Gap 1: Doctor is diagnose-only

When doctor reports `✗ missing golang`, the developer must find Phase 5 in the 620-line workflow
doc, read the install instructions, and run them manually. This is the primary friction point in
onboarding.

**Impact**: A new developer spends 1-2 hours following 11 manual phases instead of running one
command.

### Gap 2: Hugo is legacy dead weight

Doctor checks for Hugo and reads from `apps/oseplatform-web/vercel.json` for `HUGO_VERSION`. But
oseplatform-web migrated to Next.js — Hugo is unused. Every new developer installs Hugo just to
avoid a doctor warning.

**Impact**: Unnecessary tool installation, misleading doctor output.

### Gap 3: No `.env` bootstrap for fresh setups

`rhino-cli env restore` requires a prior backup from `rhino-cli env backup`. On a truly fresh setup
(new developer, no backup), there's no command to create `.env` files from the 18
`.env.example` templates in `infra/dev/`.

**Impact**: Developer manually copies 18 `.env.example` → `.env` files, which is error-prone and
tedious.

### Gap 4: Playwright browsers not checked

Doctor verifies 19 CLI tools but not Playwright browsers. A developer can pass doctor 19/19 and
then fail all E2E tests because `npx playwright install` was never run.

**Impact**: False confidence from doctor — E2E tests fail on first run.

### Gap 5: Homebrew dependencies not declarative

~8 tools are installed via Homebrew (go, jq, dotnet, pyenv, asdf, clojure, flutter, hugo) but
there's no `Brewfile`. Developers must install each one individually.

**Impact**: Slower setup, easy to miss a tool.

### Gap 6: No minimal scope option

A developer working only on TypeScript + Go projects installs Java 25, Elixir, Rust, Dart, .NET,
Clojure — tools they will never use. Doctor flags warnings for all of them.

**Impact**: Unnecessary installation time, noisy doctor output.

### Gap 7: Postinstall rebuilds rhino-cli unnecessarily

`"doctor": "nx run rhino-cli:build --skip-nx-cache && ..."` rebuilds from source on every
`npm install`. The `--skip-nx-cache` flag prevents Nx from using cached builds. Go compilation
is fast (0.3s) but Nx overhead adds ~4s.

**Impact**: ~4s wasted per `npm install`.

### Gap 8: Version pinning gaps

9 of 19 tools have no version requirement:

| Tool           | Current behavior      | Risk                                         |
| -------------- | --------------------- | -------------------------------------------- |
| git            | Any version           | Low (stable CLI)                             |
| volta          | Any version           | Low (stable)                                 |
| maven          | Any version           | Low (JDK matters more)                       |
| hugo           | Read from vercel.json | Being removed (Gap 2)                        |
| rust           | Any version           | **Medium** — edition/MSRV differences        |
| cargo-llvm-cov | Any version           | Low (follows rustc)                          |
| clojure        | Any version           | Low (JVM matters more)                       |
| flutter        | Any version           | **Medium** — breaking changes between majors |
| docker         | Any version           | Low (compose v2 is standard)                 |
| jq             | Any version           | Low (stable CLI)                             |

**Impact**: Subtle differences between Rust 1.80 and 1.94, or Flutter 3.x majors, can cause
hard-to-debug failures.

## Requirements

### R1: `doctor --fix` auto-install

**Priority**: HIGH

The `doctor` command must accept a `--fix` flag that attempts to install missing tools using the
appropriate package manager for the current platform (macOS only for initial implementation).

**Constraints**:

- macOS only (the primary development platform; Linux can be added later)
- Must be idempotent — running `--fix` when all tools are installed is a no-op
- Must handle tools that require version managers (Volta → Node/npm, SDKMAN → Java/Maven,
  asdf → Elixir/Erlang, pyenv → Python, rustup → Rust)
- Must handle tools installed directly via Homebrew (go, jq, dotnet, clojure, flutter)
- Must print what it's doing (not silent)
- Must NOT auto-install without `--fix` flag (doctor remains read-only by default)
- Should skip tools that are already installed and at the correct version
- Should report what was installed and what failed at the end

### R2: Remove Hugo from doctor

**Priority**: HIGH

Remove the Hugo tool check from `buildToolDefs()` in `tools.go`. Remove the `readHugoVersion`,
`parseHugoVersion` functions and their tests. Update the workflow doc to remove Phase 11.

### R3: `rhino-cli env init` command

**Priority**: MEDIUM

Add an `env init` subcommand that finds all `.env.example` files under `infra/dev/` and copies
each to the corresponding `.env` location without overwriting existing `.env` files.

**Constraints**:

- Must NOT overwrite existing `.env` files (safe to run repeatedly)
- Must support a `--force` flag to overwrite existing files
- Must print which files were created, skipped, or overwritten
- Must handle the mapping from `infra/dev/<app>/.env.example` to the correct destination
  (same directory: `infra/dev/<app>/.env`)

### R4: Add Playwright to doctor

**Priority**: MEDIUM

Add a Playwright browser check to doctor. This should verify that Playwright browser binaries
exist, not just that the `npx playwright` command works.

**Constraints**:

- Check should verify browser binaries exist in the Playwright cache directory
  (`~/Library/Caches/ms-playwright/` on macOS)
- Version should match the Playwright npm package version
- Status should be `warning` (not `missing`) if browsers aren't installed, since it's not a
  CLI tool — it's a browser binary cache

### R5: Add `Brewfile`

**Priority**: LOW

Create a `Brewfile` at the repository root listing all Homebrew-installable dependencies.

**Constraints**:

- Include only tools that doctor checks and are available via Homebrew
- Include `brew "asdf"` and `brew "pyenv"` as version manager dependencies
- Do NOT include tools installed via non-Homebrew managers (Volta, SDKMAN, rustup)
- Include a comment header explaining the relationship to doctor

### R6: `doctor --scope minimal`

**Priority**: MEDIUM

Add a `--scope` flag to doctor that accepts `full` (default) or `minimal`.

Minimal scope checks: git, volta, node, npm, golang, docker, jq (7 tools).
Full scope checks: all tools (current behavior, minus Hugo per R2).

**Constraints**:

- Default scope is `full` (backward compatible)
- Minimal scope covers TypeScript + Go projects, git hooks, and basic E2E
- Summary line should indicate scope: `Summary: 7/7 tools OK (scope: minimal)`

### R7: Fix postinstall caching

**Priority**: LOW

Change the `doctor` npm script to not use `--skip-nx-cache`, allowing Nx to cache the rhino-cli
build between runs.

**Constraints**:

- Remove `--skip-nx-cache` from the doctor script in `package.json`
- The pre-built binary in `apps/rhino-cli/dist/rhino-cli` should be reused when source hasn't
  changed

### R8: Pin Rust and Flutter versions

**Priority**: LOW

Add version requirements for Rust (from `rust-toolchain.toml` or `Cargo.toml` edition) and
Flutter (from `pubspec.yaml` or a new `.flutter-version` file).

**Constraints**:

- Rust: Read minimum version from `apps/a-demo-be-rust-axum/rust-toolchain.toml` (create if
  needed) or use `edition` from `Cargo.toml` to derive minimum rustc version
- Flutter: Read from `pubspec.yaml` `environment.flutter` constraint if present, or create
  `.flutter-version` file
- Use `compareGTE` (not exact match) for both — developers can use newer versions

## Acceptance Criteria

```gherkin
Feature: Doctor auto-install (R1)

  Scenario: Install missing tools on macOS
    Given a macOS machine with Homebrew installed
    And golang is not installed
    When I run "rhino-cli doctor --fix"
    Then golang should be installed via "brew install go"
    And doctor should report "installed: golang"
    And a subsequent "rhino-cli doctor" should show golang as OK

  Scenario: Skip already-installed tools
    Given all tools are installed at correct versions
    When I run "rhino-cli doctor --fix"
    Then no installation commands should be executed
    And doctor should report "nothing to fix"

  Scenario: Handle version manager tools
    Given volta is installed but node is missing
    When I run "rhino-cli doctor --fix"
    Then node should be installed via "volta install node@24.13.1"
    And the installed version should match package.json volta.node

Feature: Hugo removal (R2)

  Scenario: Doctor no longer checks Hugo
    When I run "rhino-cli doctor"
    Then the output should not contain "hugo"
    And the summary should show 18 tools (not 19)

Feature: Env init (R3)

  Scenario: Bootstrap env files from examples
    Given no .env files exist in infra/dev/
    When I run "rhino-cli env init"
    Then .env files should be created from each .env.example in infra/dev/
    And the output should list each created file

  Scenario: Do not overwrite existing env files
    Given infra/dev/a-demo-be-golang-gin/.env already exists
    When I run "rhino-cli env init"
    Then infra/dev/a-demo-be-golang-gin/.env should not be modified
    And the output should show it was skipped

Feature: Playwright check (R4)

  Scenario: Doctor detects missing Playwright browsers
    Given Playwright npm package is installed but browsers are not
    When I run "rhino-cli doctor"
    Then playwright should show status "warning"
    And the note should say "browsers not installed — run: npx playwright install"

Feature: Brewfile (R5)

  Scenario: Install all Homebrew dependencies
    When I run "brew bundle" in the repository root
    Then all Homebrew-installable tools should be installed

Feature: Doctor minimal scope (R6)

  Scenario: Minimal scope checks only core tools
    When I run "rhino-cli doctor --scope minimal"
    Then only git, volta, node, npm, golang, docker, and jq should be checked
    And the summary should show "7/7 tools OK (scope: minimal)"

Feature: Postinstall caching (R7)

  Scenario: Nx caches rhino-cli build
    Given rhino-cli source has not changed since last build
    When I run "npm install"
    Then rhino-cli build should use Nx cache
    And doctor should complete faster than a fresh build

Feature: Version pinning (R8)

  Scenario: Rust version is validated
    Given rust-toolchain.toml specifies minimum Rust 1.80
    When I run "rhino-cli doctor"
    Then rust should show "required: >=1.80"
    And a Rust 1.94 installation should show status "ok"

  Scenario: Flutter version is validated
    Given pubspec.yaml environment.flutter specifies ">=3.41.0"
    When I run "rhino-cli doctor"
    Then flutter should show "required: >=3.41.0"
```
