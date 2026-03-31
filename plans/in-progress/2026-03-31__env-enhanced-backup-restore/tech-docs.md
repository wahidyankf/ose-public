# Technical Documentation: Enhanced Env Backup/Restore

## Architecture

### Package Layout (Changes)

```text
apps/rhino-cli/
├── cmd/
│   ├── env_backup.go                       # MODIFY: --force, --include-config flags; confirmation logic
│   ├── env_backup_test.go                  # EXTEND: new Gherkin steps for confirm + config scenarios
│   ├── env_backup.integration_test.go      # EXTEND: integration steps for confirm + config scenarios
│   ├── env_restore.go                      # MODIFY: --force, --include-config flags; confirmation logic
│   ├── env_restore_test.go                 # EXTEND: new Gherkin steps for confirm + config scenarios
│   ├── env_restore.integration_test.go     # EXTEND: integration steps for confirm + config scenarios
│   ├── testable.go                         # EXTEND: confirmFn function variable
│   └── steps_common_test.go               # EXTEND: confirm + config step regex constants
└── internal/
    └── envbackup/
        ├── types.go                        # EXTEND: ConfigPattern, Source field, ConfirmFn, Force, IncludeConfig
        ├── config.go                       # NEW: DiscoverConfig(), DefaultConfigPatterns
        ├── config_test.go                  # NEW: unit tests for config discovery
        ├── confirm.go                      # NEW: FindExisting(), DefaultConfirmFn()
        ├── confirm_test.go                 # NEW: unit tests for conflict detection and confirmation
        ├── backup.go                       # MODIFY: add confirmation + config integration
        ├── backup_test.go                  # EXTEND: tests for confirmation and config backup
        ├── restore.go                      # MODIFY: add confirmation + config integration
        ├── restore_test.go                 # EXTEND: tests for confirmation and config restore
        ├── reporter.go                     # MODIFY: display source type and config counts
        └── reporter_test.go               # EXTEND: tests for source type and cancelled output
```

### Spec Layout (Changes)

```text
specs/apps/rhino-cli/env/
├── env-backup.feature                      # EXTEND: @env-backup-confirm and @env-backup-config scenarios
└── env-restore.feature                     # EXTEND: @env-restore-confirm and @env-restore-config scenarios
```

## Design Decisions

### D1: Confirmation via `ConfirmFn` Callback (Not Raw Stdin)

The confirmation prompt is injected as a function callback in `Options`, not by reading `os.Stdin`
directly in the internal package.

```go
// In types.go
type Options struct {
    // ... existing fields ...
    Force          bool                         // Skip confirmation prompt
    IncludeConfig  bool                         // Also discover config files
    ConfirmFn      func(existing []string) bool // Called when destinations exist; nil = force
}
```

**Why**: Direct stdin reading is untestable in unit tests and fragile in integration tests. A
callback allows:

- Unit tests: inject `func(_ []string) bool { return true/false }`
- Integration tests: inject the same deterministic callbacks
- Cmd layer: inject `DefaultConfirmFn(os.Stdin)` which reads from real stdin
- CI/non-TTY: set `Force: true` to bypass entirely

### D2: Config Discovery via Exact Path Checking (Not Walk)

Config files are discovered by checking a list of known exact relative paths against the repo root,
not by walking the tree.

```go
// In config.go
type ConfigPattern struct {
    RelPath     string // Exact relative path from repo root
    Description string // Human-readable description
    Category    string // "ai-tools", "docker", "version-mgrs", "environment"
}

var DefaultConfigPatterns = []ConfigPattern{
    {RelPath: ".claude/settings.local.json", Description: "Claude Code local settings", Category: "ai-tools"},
    {RelPath: ".claude/settings.local.json.bkup", Description: "Claude Code settings backup", Category: "ai-tools"},
    {RelPath: ".cursor/mcp.json", Description: "Cursor MCP configuration", Category: "ai-tools"},
    // ... etc
}

func DiscoverConfig(repoRoot string, patterns []ConfigPattern, maxSize int64) ([]FileEntry, error)
```

**Why**: Config files live at known, fixed paths. Walking the tree would be wasteful and could
accidentally match unintended files. Exact path checking is O(n) where n = number of patterns
(currently 14), fast and predictable.

### D3: Source Field on FileEntry

Add a `Source` field to `FileEntry` to distinguish `.env*` files from config files:

```go
type FileEntry struct {
    RelPath string // Relative to repo root
    AbsPath string // Absolute path in source location
    Size    int64
    Skipped bool
    Reason  string
    Source  string // "env" or "config" — empty defaults to "env" for backward compat
}
```

**Why**: The reporter needs to distinguish sources for display (`[config]` tag in text output,
`"source"` field in JSON). Using a field on `FileEntry` keeps it simple — no parallel data
structures needed.

**Backward compatibility**: Existing code that doesn't set `Source` gets empty string, which the
reporter treats as `"env"`. JSON marshaling uses `omitempty` so existing JSON consumers see no
change unless `--include-config` is used.

### D4: Confirmation Check Flow

```text
Backup flow:
  1. Discover .env* files (existing Discover())
  2. If --include-config: DiscoverConfig() → merge into entries
  3. Compute destRoot (existing worktree-aware logic)
  4. If !Force && ConfirmFn != nil:
     a. FindExisting(entries, destRoot) → []string of existing paths
     b. If len(existing) > 0: call ConfirmFn(existing)
     c. If ConfirmFn returns false → return Result with Cancelled: true
  5. Copy files (existing logic)

Restore flow:
  1. Discover .env* files in backup (existing Discover())
  2. If --include-config: DiscoverConfig(srcRoot, patterns, opts.MaxSize) → merge config entries
  3. If !Force && ConfirmFn != nil:
     a. FindExisting(entries, repoRoot) → []string of existing paths
     b. If ConfirmFn returns false → return Result with Cancelled: true
  4. Copy files (existing logic)
```

### D5: `Cancelled` Field on Result

Add a `Cancelled bool` field to `Result`:

```go
type Result struct {
    // ... existing fields ...
    Cancelled bool // True if user declined confirmation prompt
}
```

**Why**: The cmd layer needs to distinguish "0 files copied because none existed" from "0 files
copied because user cancelled". The reporter uses this to emit `"Backup cancelled."` /
`"Restore cancelled."` messages.

### D6: Force Implied by Non-Interactive Contexts

The cmd layer sets `Force: true` when:

- `--force` / `-f` flag is passed
- Output format is `json` or `markdown` (non-interactive)
- Stdin is not a TTY (pipe/redirect detection via `term.IsTerminal()` from `golang.org/x/term`,
  or simpler: `os.Stdin.Stat()` checking for `ModeCharDevice`)

**Why**: Prompting in non-interactive contexts (CI, JSON consumers, pipes) would cause the command
to hang indefinitely. Detecting non-TTY is a standard Unix convention.

**Implementation note**: Use `os.Stdin.Stat()` with `fi.Mode()&os.ModeCharDevice != 0` to detect
TTY — this is stdlib-only, no external dependency needed.

## Implementation Details

### confirm.go

```go
package envbackup

import (
    "bufio"
    "fmt"
    "io"
    "os"
    "path/filepath"
    "strings"
)

// FindExisting returns the subset of entries whose destination paths already
// exist on disk. For backup, destRoot is the backup directory; for restore,
// destRoot is the repo root.
func FindExisting(entries []FileEntry, destRoot string) []string {
    var existing []string
    for _, e := range entries {
        if e.Skipped {
            continue
        }
        dst := filepath.Join(destRoot, e.RelPath)
        if _, err := os.Stat(dst); err == nil {
            existing = append(existing, e.RelPath)
        }
    }
    return existing
}

// DefaultConfirmFn returns a confirmation function that reads from the given
// reader (typically os.Stdin). It prints the list of conflicting files and
// prompts with [y/N]. Returns true only for affirmative answers.
func DefaultConfirmFn(r io.Reader, w io.Writer) func(existing []string) bool {
    return func(existing []string) bool {
        fmt.Fprintf(w, "%d file(s) already exist. Overwrite? [y/N]\n", len(existing))
        for _, p := range existing {
            fmt.Fprintf(w, "  - %s\n", p)
        }
        scanner := bufio.NewScanner(r)
        if scanner.Scan() {
            answer := strings.TrimSpace(scanner.Text())
            switch strings.ToLower(answer) {
            case "y", "yes":
                return true
            }
        }
        return false
    }
}
```

### config.go

```go
package envbackup

// ConfigPattern defines a known uncommitted config file.
type ConfigPattern struct {
    RelPath     string
    Description string
    Category    string
}

// DefaultConfigPatterns lists known uncommitted local configuration files.
var DefaultConfigPatterns = []ConfigPattern{
    // AI Tools
    {RelPath: ".claude/settings.local.json", Description: "Claude Code local settings", Category: "ai-tools"},
    {RelPath: ".claude/settings.local.json.bkup", Description: "Claude Code settings backup", Category: "ai-tools"},
    {RelPath: ".cursor/mcp.json", Description: "Cursor MCP configuration", Category: "ai-tools"},
    {RelPath: ".windsurfrules", Description: "Windsurf project rules", Category: "ai-tools"},
    {RelPath: ".clinerules", Description: "Cline project rules", Category: "ai-tools"},
    {RelPath: ".aider.conf.yml", Description: "Aider configuration", Category: "ai-tools"},
    {RelPath: ".aiderignore", Description: "Aider ignore patterns", Category: "ai-tools"},
    {RelPath: ".continue/config.json", Description: "Continue configuration", Category: "ai-tools"},
    {RelPath: ".gemini/settings.json", Description: "Gemini CLI settings", Category: "ai-tools"},
    {RelPath: ".amazonq/mcp.json", Description: "Amazon Q MCP configuration", Category: "ai-tools"},
    {RelPath: ".roomodes", Description: "Roo Code custom modes", Category: "ai-tools"},
    // Docker
    {RelPath: "docker-compose.override.yml", Description: "Docker Compose local overrides", Category: "docker"},
    // Version Managers
    {RelPath: "mise.local.toml", Description: "mise local overrides", Category: "version-mgrs"},
    // Environment
    {RelPath: ".envrc", Description: "direnv environment setup", Category: "environment"},
}

// DiscoverConfig checks each pattern against repoRoot and returns FileEntry
// items for files that exist. Applies the same symlink and size checks as
// Discover(). Each returned entry has Source: "config".
func DiscoverConfig(repoRoot string, patterns []ConfigPattern, maxSize int64) ([]FileEntry, error) {
    // Check each pattern path, lstat, size check, symlink check
    // Return sorted entries with Source: "config"
}
```

### Changes to backup.go

```go
func Backup(opts Options) (*Result, error) {
    // ... existing setup (expand tilde, validate, discover) ...

    entries, err := Discover(opts)
    // ...

    // NEW: config discovery
    if opts.IncludeConfig {
        configEntries, err := DiscoverConfig(opts.RepoRoot, DefaultConfigPatterns, opts.MaxSize)
        if err != nil {
            return nil, fmt.Errorf("discover config files: %w", err)
        }
        entries = append(entries, configEntries...)
        sort.Slice(entries, func(i, j int) bool { return entries[i].RelPath < entries[j].RelPath })
    }

    destRoot := opts.BackupDir
    // ... existing worktree-aware logic ...

    // NEW: confirmation check
    if !opts.Force && opts.ConfirmFn != nil {
        existing := FindExisting(entries, destRoot)
        if len(existing) > 0 {
            if !opts.ConfirmFn(existing) {
                return &Result{Direction: "backup", Dir: opts.BackupDir, Cancelled: true}, nil
            }
        }
    }

    // ... existing copy logic (unchanged) ...
}
```

### Changes to restore.go

The existing restore copy loop has a `.env` basename filter:

```go
base := filepath.Base(e.RelPath)
if !strings.HasPrefix(base, ".env") {
    continue
}
```

When `IncludeConfig` is active, config entries (identified by `Source: "config"`) must bypass
this filter. Update the filter condition to:

```go
if e.Source != "config" && !strings.HasPrefix(base, ".env") {
    continue
}
```

Config entries discovered via `DiscoverConfig()` are merged into the entries list before the copy
loop, and the `Source: "config"` field serves as the discriminator. The confirmation check and
worktree namespacing are inherited from the existing `srcRoot` / `repoRoot` computation.

### Changes to cmd/env_backup.go

```go
var envBackupForce bool
var envBackupIncludeConfig bool

func init() {
    // ... existing flags ...
    envBackupCmd.Flags().BoolVarP(&envBackupForce, "force", "f", false, "skip overwrite confirmation")
    envBackupCmd.Flags().BoolVar(&envBackupIncludeConfig, "include-config", false,
        "also back up known uncommitted config files")
}

func runEnvBackup(cmd *cobra.Command, _ []string) error {
    // ... existing setup ...

    // Determine if force mode (explicit flag, non-text output, or non-TTY)
    force := envBackupForce || output != "text"
    if !force {
        if fi, err := os.Stdin.Stat(); err == nil {
            if fi.Mode()&os.ModeCharDevice == 0 {
                force = true // stdin is not a terminal
            }
        }
    }

    opts := envbackup.Options{
        // ... existing fields ...
        Force:         force,
        IncludeConfig: envBackupIncludeConfig,
    }

    if !force {
        opts.ConfirmFn = confirmFn(os.Stdin, cmd.OutOrStderr())
    }

    // ... existing worktree logic ...
    // ... call envBackupFn(opts) ...
}
```

### Changes to testable.go

```go
// confirm prompt function delegation.
var confirmFn = envbackup.DefaultConfirmFn
```

### Dependency Injection for Tests

**Unit tests** mock `confirmFn` to return deterministic callbacks:

```go
// In env_backup_test.go
confirmFn = func(_ io.Reader, _ io.Writer) func([]string) bool {
    return func(_ []string) bool { return true } // always confirm
}
```

**Integration tests** inject `strings.NewReader("y\n")` as the reader:

```go
confirmFn = func(r io.Reader, w io.Writer) func([]string) bool {
    return envbackup.DefaultConfirmFn(strings.NewReader("y\n"), w)
}
```

## Testing Strategy

### New Gherkin Scenarios

Add to `specs/apps/rhino-cli/env/env-backup.feature`:

- 4 scenarios with `@env-backup-confirm` tag (prompt confirm, decline, force, no-conflict)
- 3 scenarios with `@env-backup-config` tag (include-config, without flag, no config found)

Add to `specs/apps/rhino-cli/env/env-restore.feature`:

- 4 scenarios with `@env-restore-confirm` tag (prompt confirm, decline, force, no-conflict)
- 2 scenarios with `@env-restore-config` tag (include-config, without flag)

### Unit Tests (cmd layer)

- Mock `envBackupFn` / `envRestoreFn` to return `Result` with/without `Cancelled: true`
- Mock `confirmFn` to return confirm/decline callbacks
- Non-BDD tests: `TestEnvBackupCmd_ForceFlag`, `TestEnvRestoreCmd_ForceFlag`,
  `TestEnvBackupCmd_IncludeConfigFlag`, `TestEnvRestoreCmd_IncludeConfigFlag`

### Unit Tests (internal layer)

- `confirm_test.go`: test `FindExisting()` with various existing/missing files, test
  `DefaultConfirmFn()` with `strings.NewReader("y\n")`, `"n\n"`, `"\n"`, `"YES\n"`
- `config_test.go`: test `DiscoverConfig()` with temp fixtures containing subset of patterns,
  test symlink config, test oversized config, test missing patterns
- Extend `backup_test.go`: test confirmation flow (confirm + proceed, decline + cancel), test
  config files in backup
- Extend `restore_test.go`: test confirmation flow, test config files in restore

### Integration Tests

- Extend `env_backup.integration_test.go`: real filesystem confirmation scenarios (inject
  `strings.NewReader`), real config file fixtures
- Extend `env_restore.integration_test.go`: same patterns

### Manual Validation

After implementation, manually run:

```bash
# Test confirmation prompt (backup)
cd /path/to/repo
go run main.go env backup                    # First time: no prompt
go run main.go env backup                    # Second time: should prompt (files exist)
go run main.go env backup --force            # Should skip prompt
go run main.go env backup -o json            # Should skip prompt (JSON implies force)

# Test confirmation prompt (restore)
go run main.go env restore                   # Should prompt if .env files exist
go run main.go env restore --force           # Should skip prompt

# Test config backup
go run main.go env backup --include-config --force  # Should include config files
go run main.go env restore --include-config --force # Should restore config files

# Verify config files
ls ~/ose-open-env-backup/.claude/settings.local.json  # Should exist after --include-config backup
```

## Version Bump

Bump version from `0.14.0` to `0.15.0` in `cmd/root.go` — this is a feature release adding new
flags and behavior.
