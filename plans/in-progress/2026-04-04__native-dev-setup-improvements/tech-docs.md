# Technical Documentation: Native Dev Setup Improvements

## Architecture Overview

All improvements target `apps/rhino-cli/` (Go) and repository root config files. No new
applications or libraries are introduced. The changes extend the existing `doctor` package and
`env` command.

```
apps/rhino-cli/
├── cmd/
│   ├── doctor.go           # CLI command — add --fix, --scope flags
│   └── env.go              # CLI command — add "init" subcommand
├── internal/
│   └── doctor/
│       ├── tools.go        # Tool definitions — remove Hugo, add Playwright, add install commands
│       ├── checker.go      # Check logic — add scope filtering, fix runner
│       ├── checker_test.go # Tests
│       ├── fixer.go        # NEW — auto-install logic
│       ├── fixer_test.go   # NEW — fixer tests
│       ├── reporter.go     # Reporter — update summary for scope
│       └── reporter_test.go
```

## Improvement 1: `doctor --fix`

### Design

Add an `installCmd` field to `toolDef` that returns the shell command(s) to install the tool on
the current platform. The `--fix` flag triggers a second pass after `CheckAll`: for each tool with
`StatusMissing`, execute its `installCmd`.

```go
type toolDef struct {
    // ... existing fields ...
    installCmd func(required string) []installStep // nil = cannot auto-install
}

type installStep struct {
    description string   // "Install Go via Homebrew"
    command     string   // "brew"
    args        []string // ["install", "go"]
}
```

### Install commands per tool (macOS)

| Tool           | Install steps                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| git            | `xcode-select --install`                                                                                |
| volta          | `curl https://get.volta.sh \| bash`                                                                     |
| node           | `volta install node@{required}`                                                                         |
| npm            | `volta install npm@{required}`                                                                          |
| java           | `sdk install java {required}-tem` (requires SDKMAN)                                                     |
| maven          | `sdk install maven` (requires SDKMAN)                                                                   |
| golang         | `brew install go`                                                                                       |
| python         | `brew install pyenv && pyenv install {required} && pyenv global {required}`                             |
| rust           | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`                                       |
| cargo-llvm-cov | `cargo install cargo-llvm-cov`                                                                          |
| elixir         | `asdf plugin add elixir && asdf install elixir {required} && asdf global elixir {required}`             |
| erlang         | `asdf plugin add erlang && asdf install erlang {required} && asdf global erlang {required}`             |
| dotnet         | `brew install dotnet`                                                                                   |
| clojure        | `brew install clojure/tools/clojure`                                                                    |
| dart/flutter   | `brew install flutter` (Flutter includes Dart)                                                          |
| docker         | Print message: "Install Docker Desktop from https://docs.docker.com/desktop/setup/install/mac-install/" |
| jq             | `brew install jq`                                                                                       |
| playwright     | `npx playwright install`                                                                                |

### Dependency ordering

Some tools depend on others (e.g., node requires volta, java requires SDKMAN). The fix loop must
process tools in the order defined in `buildToolDefs()` (which is already dependency-ordered:
volta before node, etc.). For SDKMAN, the fixer should check if `sdk` is in PATH and prompt the
user to install it if missing (SDKMAN install requires shell restart).

### Error handling

- If an install step fails, log the error, mark the tool as `failed`, continue to the next tool
- At the end, print a summary: `Fixed: 3, Failed: 1, Already OK: 15`
- Return exit code 1 if any tool remains missing/failed after fix attempt

### Gherkin specs

rhino-cli enforces `spec-coverage validate` in pre-push. Existing specs:

- `specs/apps/rhino/cli/gherkin/doctor.feature` — 4 scenarios (all-ok, missing, warning, JSON)
- `specs/apps/rhino/cli/gherkin/env-backup.feature` and `env-restore.feature` — existing env specs

New features require new Gherkin scenarios:

- **`doctor --fix`**: Add scenarios to `doctor.feature` (fix missing tool, skip already-installed,
  fix failure handling)
- **`doctor --scope`**: Add scenarios to `doctor.feature` (minimal scope, full scope default)
- **`env init`**: Create `specs/apps/rhino/cli/gherkin/env-init.feature`

### Testing strategy

- Unit tests: mock `CommandRunner` to simulate missing tools, verify correct install commands
  are generated
- Integration test: run `doctor --fix` on a system where all tools are already installed, verify
  no install commands are executed (idempotency)

## Improvement 2: Remove Hugo

### Changes

1. **`tools.go`**: Remove the Hugo `toolDef` entry from `buildToolDefs()`
2. **`tools.go`**: Remove `vercelJSONPath` variable (no longer needed)
3. **`checker.go`**: Remove `readHugoVersion`, `parseHugoVersion`, `vercelJSON` type
4. **`checker_test.go`**: Remove Hugo-related test cases
5. **`reporter_test.go`**: Update expected tool count from 19 to 18
6. **Workflow doc**: Remove Phase 11 (Hugo) from
   `governance/workflows/infra/development-environment-setup.md`
7. **Workflow doc**: Update tool inventory table (remove row 8, renumber)
8. **Workflow doc**: Update minimal scope table if Hugo was referenced

### Risk

None. Hugo is unused. No active project references it.

## Improvement 3: `rhino-cli env init`

### Design

Add `init` subcommand to the existing `env` command group. The command:

1. Walks `infra/dev/` looking for `.env.example` files
2. For each, creates a `.env` file in the same directory (if not exists)
3. Copies the content verbatim

```go
// cmd/env_init.go
var envInitCmd = &cobra.Command{
    Use:   "init",
    Short: "Create .env files from .env.example templates",
    Long:  `Finds all .env.example files in infra/dev/ and copies them to .env
in the same directory. Existing .env files are not overwritten unless --force is used.`,
}
```

### Mapping

The `.env.example` files are co-located with their `.env` targets:

```
infra/dev/a-demo-be-golang-gin/.env.example → infra/dev/a-demo-be-golang-gin/.env
infra/dev/organiclever/.env.example         → infra/dev/organiclever/.env
```

No path transformation needed — just replace `.env.example` with `.env` in the same directory.

### Flags

- `--force`: Overwrite existing `.env` files (default: false)

### Output

```
Created: infra/dev/a-demo-be-golang-gin/.env (from .env.example)
Skipped: infra/dev/organiclever/.env (already exists, use --force to overwrite)
Created: infra/dev/ayokoding-web/.env (from .env.example)
...
Summary: 15 created, 3 skipped
```

## Improvement 4: Playwright in Doctor

### Design

Add a new `toolDef` for Playwright. Unlike other tools, Playwright isn't a CLI binary — it's
browser binaries in a cache directory. The check should:

1. Verify `npx playwright --version` works (Playwright npm package installed)
2. Check if browser binaries exist in `~/Library/Caches/ms-playwright/` (macOS)

### Implementation

```go
{
    name:     "playwright",
    binary:   "npx",
    source:   "node_modules (npx playwright)",
    args:     []string{"playwright", "--version"},
    parseVer: parseTrimVersion,
    compare:  comparePlaywright, // custom: also checks browser cache dir
    readReq:  noReq,             // version comes from npm, not a config file
}
```

The `comparePlaywright` function checks for the existence of browser directories after version
parsing succeeds. If the CLI works but browsers are missing, return `StatusWarning` with a helpful
note.

### Browser cache detection

```go
func checkPlaywrightBrowsers() bool {
    home, _ := os.UserHomeDir()
    cacheDir := filepath.Join(home, "Library", "Caches", "ms-playwright")
    entries, err := os.ReadDir(cacheDir)
    if err != nil {
        return false
    }
    // At least chromium should be present
    for _, e := range entries {
        if strings.HasPrefix(e.Name(), "chromium-") {
            return true
        }
    }
    return false
}
```

### `--fix` integration

The install command for Playwright: `npx playwright install`.

## Improvement 5: Brewfile

### Content

```ruby
# Brewfile — Homebrew dependencies for open-sharia-enterprise
# Run: brew bundle
# Note: This covers Homebrew-installable tools only.
# Tools managed by other installers (Volta, SDKMAN, rustup, asdf, pyenv)
# are handled by rhino-cli doctor --fix.

brew "go"
brew "jq"
brew "dotnet"
brew "pyenv"
brew "asdf"
brew "clojure/tools/clojure"
brew "flutter"
```

### Location

Repository root (`Brewfile`).

### Gitignore

`Brewfile.lock.json` should be added to `.gitignore` (Homebrew generates this on `brew bundle`).

## Improvement 6: `doctor --scope minimal`

### Design

Add a `scope` field to `CheckOptions` and filter `buildToolDefs()` output based on scope.

```go
type Scope string

const (
    ScopeFull    Scope = "full"
    ScopeMinimal Scope = "minimal"
)

var minimalTools = map[string]bool{
    "git": true, "volta": true, "node": true, "npm": true,
    "golang": true, "docker": true, "jq": true,
}
```

### CLI flag

```go
doctorCmd.Flags().String("scope", "full", "tool scope: full or minimal")
```

### Reporter update

The summary line should include scope when not `full`:

```
Summary: 7/7 tools OK (scope: minimal)
```

## Improvement 7: Fix Postinstall Caching

### Change

In `package.json`:

```diff
- "doctor": "nx run rhino-cli:build --skip-nx-cache && ./apps/rhino-cli/dist/rhino-cli doctor"
+ "doctor": "nx run rhino-cli:build && ./apps/rhino-cli/dist/rhino-cli doctor"
```

### Why `--skip-nx-cache` was there

Likely to ensure doctor always runs the latest rhino-cli code during development. But Nx cache
invalidation is based on source file hashes — if `apps/rhino-cli/` source changes, Nx already
invalidates the cache. The `--skip-nx-cache` is redundant.

### Risk

Low. If the cache is stale (shouldn't happen with Nx's hash-based invalidation), `npm run doctor`
would use the old binary. Developer can always `nx run rhino-cli:build --skip-nx-cache` manually.

## Improvement 8: Pin Rust and Flutter Versions

### Rust

`apps/a-demo-be-rust-axum/rust-toolchain.toml` already exists with `channel = "stable"` but no
MSRV. `Cargo.toml` has `edition = "2021"` but no `rust-version` field.

Add `rust-version` (MSRV) to `Cargo.toml`:

```toml
# In Cargo.toml [package] section
rust-version = "1.80"
```

Update `tools.go`:

```go
{
    name:     "rust",
    binary:   "rustc",
    source:   "apps/a-demo-be-rust-axum/Cargo.toml → rust-version",
    args:     []string{"--version"},
    parseVer: parseRustVersion,
    compare:  compareGTE,  // was: compareExact
    readReq:  func() string { v, _ := readRustVersion(cargoTomlPath); return v },
}
```

### Flutter

`apps/a-demo-fe-dart-flutterweb/pubspec.yaml` currently has `environment.sdk: ^3.11.1` but
no `environment.flutter` constraint. Add one:

```yaml
environment:
  sdk: ^3.11.1
  flutter: ">=3.41.0"
```

Update `tools.go`:

```go
{
    name:     "flutter",
    binary:   "flutter",
    source:   "apps/a-demo-fe-dart-flutterweb/pubspec.yaml → environment.flutter",
    args:     []string{"--version"},
    parseVer: parseFlutterVersion,
    compare:  compareGTE,  // was: compareExact
    readReq:  func() string { v, _ := readFlutterVersion(pubspecPath); return v },
}
```

### Version reader for Rust MSRV

```go
func readRustVersion(cargoTomlPath string) (string, error) {
    data, err := os.ReadFile(cargoTomlPath)
    if err != nil {
        return "", err
    }
    for _, line := range strings.Split(string(data), "\n") {
        trimmed := strings.TrimSpace(line)
        if strings.HasPrefix(trimmed, "rust-version") {
            // rust-version = "1.80"
            parts := strings.SplitN(trimmed, "=", 2)
            if len(parts) == 2 {
                ver := strings.TrimSpace(parts[1])
                ver = strings.Trim(ver, "\"")
                return ver, nil
            }
        }
    }
    return "", nil // no MSRV specified
}
```

### Version reader for Flutter

```go
func readFlutterVersion(pubspecPath string) (string, error) {
    data, err := os.ReadFile(pubspecPath)
    if err != nil {
        return "", err
    }
    inEnv := false
    for _, line := range strings.Split(string(data), "\n") {
        trimmed := strings.TrimSpace(line)
        if trimmed == "environment:" {
            inEnv = true
            continue
        }
        if inEnv {
            if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") && trimmed != "" {
                break
            }
            if strings.HasPrefix(trimmed, "flutter:") {
                ver := strings.TrimSpace(strings.TrimPrefix(trimmed, "flutter:"))
                ver = strings.TrimPrefix(ver, "^")
                ver = strings.TrimPrefix(ver, ">=")
                return strings.TrimSpace(ver), nil
            }
        }
    }
    return "", nil // no flutter constraint
}
```
