# Technical Documentation: .env Backup and Restore

## Architecture

### Command Hierarchy

```text
rhino-cli
└── env                          # Group command (no action)
    ├── backup                   # Scan repo, copy .env* to backup dir
    └── restore                  # Scan backup dir, copy .env* back to repo
```

### Package Layout

```text
apps/rhino-cli/
├── cmd/
│   ├── env.go                              # Group command registration
│   ├── env_backup.go                       # Backup subcommand + RunE (calls envBackupFn); Args: cobra.NoArgs
│   ├── env_backup_test.go                  # Godog unit tests (mocked deps via testable.go)
│   ├── env_backup.integration_test.go      # Godog integration tests (real /tmp fixtures)
│   ├── env_restore.go                      # Restore subcommand + RunE (calls envRestoreFn); Args: cobra.NoArgs
│   ├── env_restore_test.go                 # Godog unit tests (mocked deps via testable.go)
│   ├── env_restore.integration_test.go     # Godog integration tests (real /tmp fixtures)
│   ├── testable.go                         # (EXISTING) — add envBackupFn, envRestoreFn vars
│   ├── testable_mock_test.go               # (EXISTING) — mockFileInfo already present
│   └── steps_common_test.go                # (EXISTING) — add env step constants
└── internal/
    └── envbackup/
        ├── types.go             # Result, FileEntry, Options structs
        ├── discover.go          # Walk repo, find .env* files
        ├── discover_test.go
        ├── backup.go            # Copy files to backup dir
        ├── backup_test.go
        ├── restore.go           # Copy files from backup dir to repo
        ├── restore_test.go
        ├── worktree.go          # Git worktree detection and name resolution
        ├── worktree_test.go
        ├── reporter.go          # text/json/markdown formatters
        └── reporter_test.go
```

### Why a New `internal/envbackup` Package

Following existing patterns (`internal/testcoverage`, `internal/doctor`, `internal/docs`), the
business logic lives in `internal/envbackup` and the Cobra wiring lives in `cmd/`. This keeps the
core logic unit-testable without depending on Cobra.

Note: `internal/fileutil/fileutil.go` exists as a shared utilities package, but it contains
markdown-specific and git-specific helpers — it does not include file copy utilities. The
`copyFile()` function needed here is new and belongs in `internal/envbackup/`.

### Dependency Injection via `testable.go`

Per the CLI testing alignment standard, all internal package function calls in `cmd/*.go` files use
package-level function variables defined in `cmd/testable.go`. This allows unit tests to mock the
internal logic while integration tests use the real implementations.

Add these to `cmd/testable.go`:

```go
// env backup command delegation.
var envBackupFn = envbackup.Backup

// env restore command delegation.
var envRestoreFn = envbackup.Restore
```

The `cmd/env_backup.go` RunE calls `envBackupFn(opts)` (not `envbackup.Backup(opts)` directly),
and `cmd/env_restore.go` RunE calls `envRestoreFn(opts)`.

### Dual-Level Gherkin Consumption

Both unit and integration tests consume the **same** Gherkin feature files from
`specs/apps/rhino-cli/env/`. Step implementations differ:

| Level       | Test File                            | Step Implementation                                           |
| ----------- | ------------------------------------ | ------------------------------------------------------------- |
| Unit        | `cmd/env_backup_test.go`             | Mock `envBackupFn` via `testable.go`, mock `osGetwd`/`osStat` |
| Integration | `cmd/env_backup.integration_test.go` | Real filesystem via `/tmp` fixtures, calls `cmd.RunE()`       |

Unit tests:

- Name the test function `TestUnitEnvBackup(t *testing.T)` / `TestUnitEnvRestore(t *testing.T)`
- Mock `envBackupFn`/`envRestoreFn` to return predetermined `*envbackup.Result` or error
- Mock `osGetwd` and `osStat` for `findGitRoot()` (same pattern as `doctor_test.go`)
- Use `mockFileInfo` from `testable_mock_test.go`
- Assert on command exit code and output content
- Include non-BDD tests for initialization checks and edge cases beyond Gherkin

Integration tests:

- Use `//go:build integration` build tag
- Name the test function `TestIntegrationEnvBackup(t *testing.T)` / `TestIntegrationEnvRestore(t *testing.T)`
- Create real `/tmp` fixture directories per scenario
- Call `cmd.RunE()` against the real `envbackup` package

### Shared Step Constants in `steps_common_test.go`

Add env-specific step regex constants to `cmd/steps_common_test.go`:

```go
// Env backup step patterns.
const (
    stepRepoWithEnvFilesAtRootAndSubdirs    = `^a repository with \.env files at root and in app subdirectories$`
    stepRepoWithEnvFiles                    = `^a repository with \.env files$`
    stepDeveloperRunsEnvBackup              = `^the developer runs env backup$`
    stepDeveloperRunsEnvBackupWithDir       = `^the developer runs env backup --dir (.+)$`
    // ... etc for all Gherkin step texts
)
```

This follows the established pattern where all step regex constants are centralized and shared
between unit and integration test files.

## Data Structures

```go
// Options configures a backup or restore operation.
type Options struct {
    RepoRoot       string   // Absolute path to git root (or worktree root)
    BackupDir      string   // Absolute path to backup directory
    SkipDirs       []string // Directory basenames to skip during walk
    MaxSize        int64    // Max file size in bytes (default 1 MB)
    WorktreeAware  bool     // If true, namespace backup by worktree/repo name
    WorktreeName   string   // Set by cmd layer from detectWorktree(); used to populate Result and namespace the dir
}

// FileEntry represents a single .env file found or processed.
type FileEntry struct {
    RelPath  string // Relative to repo root (e.g., "apps/ayokoding-web/.env.local")
    AbsPath  string // Absolute path in source location
    Size     int64  // File size in bytes
    Skipped  bool   // True if skipped (symlink, too large)
    Reason   string // Skip reason (empty if not skipped)
}

// Result holds the outcome of a backup or restore operation.
type Result struct {
    Direction    string      // "backup" or "restore"
    Dir          string      // Backup directory path
    Files        []FileEntry // All discovered files (including skipped)
    Copied       int         // Count of successfully copied files
    Skipped      int         // Count of skipped files
    Errors       []string    // Non-fatal warnings
    WorktreeName string      // Worktree/repo name when --worktree-aware is used (empty otherwise)
}
```

## File Discovery Algorithm

```text
1. Start at RepoRoot
2. Walk the file tree using filepath.WalkDir
3. For each directory entry:
   a. If basename is in SkipDirs → SkipDir
   b. If basename starts with "." and is not ".env*" → SkipDir (skip hidden dirs)
4. For each file entry:
   a. If basename does not match ".env*" pattern → skip
   b. Lstat the file → if symlink → add as Skipped with reason "symlink"
   c. If size > MaxSize → add as Skipped with reason "exceeds 1 MB"
   d. Otherwise → add as valid FileEntry
5. Return sorted list of FileEntry (sorted by RelPath for deterministic output)
```

**Skip directories** (hardcoded, matching common build/dependency dirs):

```go
var DefaultSkipDirs = []string{
    // Version control
    ".git",
    // JavaScript/TypeScript package managers & build tools
    "node_modules", "bower_components",
    ".nx", ".next", ".turbo", ".cache", ".parcel-cache", ".nyc_output",
    // General build output
    "dist", "build", "coverage",
    // Python
    "__pycache__", ".venv", "venv",
    // JVM (Java, Kotlin, Scala, Clojure)
    "target", ".gradle",
    // Go
    "vendor",
    // Erlang/Elixir
    "_build", "deps", ".elixir_ls", ".mix",
    // Dart/Flutter
    ".dart_tool",
    // Rust
    ".cargo",
    // Zig
    "zig-cache",
    // Haskell
    ".stack-work",
    // Elm
    "elm-stuff",
    // C/C++
    "_deps",
    // IaC
    ".terraform", ".pulumi",
    // Project-specific generated code
    "generated-contracts",
}
```

**Why these dirs are skipped**: All of these are auto-generated or dependency directories that may
contain `.env` files from third-party packages (e.g., `node_modules/some-lib/.env.example`). These
are not the developer's secrets — backing them up would be noise and potentially very slow on large
`node_modules` trees. The walker uses `filepath.SkipDir` to prune the entire subtree, avoiding
any traversal into these directories.

**Pattern matching**: `strings.HasPrefix(basename, ".env")` — this catches `.env`, `.env.local`,
`.env.development`, `.env.production.local`, etc.

## Backup Flow

```text
env backup [--dir <path>] [--worktree-aware]

1. findGitRoot() → repoRoot
2. Resolve backupDir:
   a. If --dir provided → expand ~ → resolve to absolute
   b. Else → ~/ose-env-bkup
3. If --worktree-aware:
   a. detectWorktree(repoRoot) → WorktreeInfo
   b. backupDir = filepath.Join(backupDir, info.WorktreeName)
4. Validate backupDir is not inside repoRoot (filepath.Rel check)
5. Discover .env* files in repoRoot
6. For each valid FileEntry:
   a. destPath = filepath.Join(backupDir, entry.RelPath)
   b. os.MkdirAll(filepath.Dir(destPath))
   c. copyFile(entry.AbsPath, destPath) — byte-stream copy, preserve permissions
7. Build Result, format output, return
```

## Restore Flow

```text
env restore [--dir <path>] [--worktree-aware]

1. findGitRoot() → repoRoot
2. Resolve sourceDir:
   a. If --dir provided → expand ~ → resolve to absolute
   b. Else → ~/ose-env-bkup
3. If --worktree-aware:
   a. detectWorktree(repoRoot) → WorktreeInfo
   b. sourceDir = filepath.Join(sourceDir, info.WorktreeName)
4. Validate sourceDir exists (os.Stat)
5. Walk sourceDir for .env* files (same discovery logic, but rooted at sourceDir)
6. For each valid FileEntry:
   a. destPath = filepath.Join(repoRoot, entry.RelPath)
   b. os.MkdirAll(filepath.Dir(destPath))
   c. copyFile(entry.AbsPath, destPath)
7. Build Result, format output, return
```

## File Copy Implementation

```go
func copyFile(src, dst string) error {
    // 1. os.Lstat(src) to get mode
    // 2. os.Open(src)
    // 3. os.OpenFile(dst, O_WRONLY|O_CREATE|O_TRUNC, srcMode.Perm())
    // 4. io.Copy(dst, src)
    // 5. Close both
    // Return any error
}
```

Key: uses `Lstat` (not `Stat`), preserves permission bits via `srcMode.Perm()`, and uses
`O_TRUNC` to overwrite cleanly.

## Tilde Expansion

Go's `os/exec` and `filepath` do not expand `~`. Must handle manually:

```go
func expandTilde(path string) (string, error) {
    if !strings.HasPrefix(path, "~") {
        return path, nil
    }
    home, err := os.UserHomeDir()
    if err != nil {
        return "", fmt.Errorf("cannot expand ~: %w", err)
    }
    return filepath.Join(home, path[1:]), nil
}
```

Only `~/...` is supported (not `~user/...`).

## Git Worktree Detection

A git worktree has a `.git` **file** (not directory) at its root, containing a pointer:

```text
gitdir: /Users/<you>/main-repo/.git/worktrees/feature-branch
```

Detection and name resolution:

```go
// WorktreeInfo holds identity information for the current working tree.
type WorktreeInfo struct {
    IsWorktree    bool   // true if .git is a file (worktree), false if directory (main repo)
    WorktreeName  string // basename of the worktree root dir (or main repo dir if not a worktree)
    RootDir       string // absolute path of the working tree root
}

func detectWorktree(repoRoot string) (WorktreeInfo, error) {
    gitPath := filepath.Join(repoRoot, ".git")
    info, err := os.Lstat(gitPath)
    if err != nil {
        return WorktreeInfo{}, fmt.Errorf("no .git at %s: %w", repoRoot, err)
    }

    name := filepath.Base(repoRoot)
    if info.IsDir() {
        // Normal repo — .git is a directory
        return WorktreeInfo{IsWorktree: false, WorktreeName: name, RootDir: repoRoot}, nil
    }

    // Worktree — .git is a file containing "gitdir: <path>"
    // Parse it to confirm it's a valid worktree pointer
    content, err := os.ReadFile(gitPath)
    if err != nil {
        return WorktreeInfo{}, fmt.Errorf("cannot read .git file: %w", err)
    }
    line := strings.TrimSpace(string(content))
    if !strings.HasPrefix(line, "gitdir: ") {
        return WorktreeInfo{}, fmt.Errorf(".git file has unexpected format: %s", line)
    }

    return WorktreeInfo{IsWorktree: true, WorktreeName: name, RootDir: repoRoot}, nil
}
```

### Backup Directory Resolution with `--worktree-aware`

```text
Without --worktree-aware:
  backupDir = ~/ose-env-bkup
  destPath  = ~/ose-env-bkup/apps/ayokoding-web/.env.local

With --worktree-aware (main repo "open-sharia-enterprise"):
  backupDir = ~/ose-env-bkup/open-sharia-enterprise
  destPath  = ~/ose-env-bkup/open-sharia-enterprise/apps/ayokoding-web/.env.local

With --worktree-aware (worktree "feature-branch"):
  backupDir = ~/ose-env-bkup/feature-branch
  destPath  = ~/ose-env-bkup/feature-branch/apps/ayokoding-web/.env.local
```

This lets multiple worktrees coexist in the same backup root without overwriting each other.

### Claude Code Agent Worktrees

Claude Code's `Agent` tool with `isolation: "worktree"` creates temporary git worktrees
(e.g., `/tmp/claude-worktree-abc123/`). These are standard git worktrees — `detectWorktree()`
handles them identically. The worktree name would be something like `claude-worktree-abc123`.

Without `--worktree-aware`, an agent's backup would overwrite the main repo's backup (and vice
versa). With `--worktree-aware`, each gets its own namespace. For typical agent workflows
(read-only or isolated changes), env backup/restore is unlikely to be needed, but the tool
handles it correctly regardless.

## "Inside Repo" Validation

```go
func isInsideRepo(backupDir, repoRoot string) bool {
    rel, err := filepath.Rel(repoRoot, backupDir)
    if err != nil {
        return false
    }
    return !strings.HasPrefix(rel, "..")
}
```

If `backupDir` resolves to a path inside `repoRoot`, reject with a clear error message. This
prevents accidentally committing secrets.

## Output Formatting

Follows the existing `outputFuncs` pattern from `cmd/helpers.go`:

### Text (default)

```text
Backed up 3 files to /Users/<you>/ose-env-bkup

  apps/ayokoding-web/.env.local
  apps/oseplatform-web/.env
  .env

Skipped 1 file:
  apps/organiclever-web/.env.symlink (symlink)
```

With `--verbose`:

```text
Backed up 3 files to /Users/<you>/ose-env-bkup

  /Users/<you>/project/apps/ayokoding-web/.env.local → /Users/<you>/ose-env-bkup/apps/ayokoding-web/.env.local (245 B)
  ...
```

With `--quiet`:

```text
Backed up 3 files to /Users/<you>/ose-env-bkup
```

### JSON

```json
{
  "direction": "backup",
  "dir": "/Users/<you>/ose-env-bkup",
  "files": [
    { "relPath": "apps/ayokoding-web/.env.local", "size": 245, "skipped": false },
    { "relPath": "apps/organiclever-web/.env.symlink", "size": 0, "skipped": true, "reason": "symlink" }
  ],
  "copied": 3,
  "skipped": 1
}
```

### Markdown

```markdown
## Env Backup Report

**Direction**: backup
**Directory**: `/Users/<you>/ose-env-bkup`
**Copied**: 3 | **Skipped**: 1

| File                                 | Size  | Status            |
| ------------------------------------ | ----- | ----------------- |
| `apps/ayokoding-web/.env.local`      | 245 B | copied            |
| `apps/organiclever-web/.env.symlink` | —     | skipped (symlink) |
```

## Test Strategy

All tests use `os.MkdirTemp("", "rhino-env-*")` to create fixture directories under the OS
temp dir (`/tmp` on macOS/Linux). Every test creates its own isolated temp tree and cleans up
via `t.Cleanup()` (unit) or godog `After` hook (integration). No test reads from or writes to
the real filesystem outside `/tmp`.

Testing follows the **three-level testing standard** for Go CLI apps:

1. **Internal unit tests** (`internal/envbackup/*_test.go`) — pure logic validation
2. **Cmd-layer unit tests** (`cmd/env_*_test.go`) — godog + mocked deps via `testable.go`
3. **Cmd-layer integration tests** (`cmd/env_*.integration_test.go`) — godog + real `/tmp` fixtures

Levels 2 and 3 consume the **same Gherkin specs** from `specs/apps/rhino-cli/env/`.

### Internal Unit Tests (`internal/envbackup/*_test.go`)

Unit tests validate pure logic in isolation. Each `*_test.go` file focuses on one module.

#### `discover_test.go` — File Discovery

| Test Case                                | Fixture Setup                                                                               | Assertion                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Discovers root `.env`                    | `/tmp/repo/.git/` (dir) + `/tmp/repo/.env`                                                  | Returns 1 entry with RelPath `.env`                          |
| Discovers nested `.env*`                 | `/tmp/repo/.git/` + `/tmp/repo/apps/web/.env.local` + `/tmp/repo/apps/web/.env.development` | Returns 2 entries sorted by RelPath                          |
| Skips `node_modules`                     | `/tmp/repo/.git/` + `/tmp/repo/node_modules/.env`                                           | Returns 0 entries                                            |
| Skips `dist`                             | `/tmp/repo/.git/` + `/tmp/repo/dist/.env`                                                   | Returns 0 entries                                            |
| Skips `build`                            | `/tmp/repo/.git/` + `/tmp/repo/apps/web/build/.env`                                         | Returns 0 entries                                            |
| Skips `.next`                            | `/tmp/repo/.git/` + `/tmp/repo/.next/.env`                                                  | Returns 0 entries                                            |
| Skips `__pycache__`                      | `/tmp/repo/.git/` + `/tmp/repo/__pycache__/.env`                                            | Returns 0 entries                                            |
| Skips `target`                           | `/tmp/repo/.git/` + `/tmp/repo/apps/be/target/.env`                                         | Returns 0 entries                                            |
| Skips `vendor`                           | `/tmp/repo/.git/` + `/tmp/repo/vendor/.env`                                                 | Returns 0 entries                                            |
| Skips `coverage`                         | `/tmp/repo/.git/` + `/tmp/repo/coverage/.env`                                               | Returns 0 entries                                            |
| Skips `generated-contracts`              | `/tmp/repo/.git/` + `/tmp/repo/apps/be/generated-contracts/.env`                            | Returns 0 entries                                            |
| Skips nested auto-generated dirs         | `/tmp/repo/.git/` + `/tmp/repo/apps/web/node_modules/pkg/.env` + `/tmp/repo/apps/web/.env`  | Returns 1 entry (only `apps/web/.env`)                       |
| Skips multiple auto-gen dirs in one tree | Fixture with `.env` inside `node_modules/`, `dist/`, `.next/`, `__pycache__/`, `target/`    | Returns 0 entries for all                                    |
| Skips symlink `.env`                     | `/tmp/repo/.git/` + symlink `/tmp/repo/.env` → `/tmp/target`                                | Returns 1 entry with `Skipped: true, Reason: "symlink"`      |
| Skips oversized `.env`                   | `/tmp/repo/.git/` + `/tmp/repo/.env` (2 MB content)                                         | Returns 1 entry with `Skipped: true, Reason: "exceeds 1 MB"` |
| No `.env` files                          | `/tmp/repo/.git/` + `/tmp/repo/README.md`                                                   | Returns empty slice                                          |
| Mixed: valid + skipped                   | Valid `.env` + symlink `.env.link` + oversized `.env.big`                                   | Returns 3 entries: 1 valid, 2 skipped                        |
| Does not match non-env dotfiles          | `/tmp/repo/.git/` + `/tmp/repo/.gitignore` + `/tmp/repo/.eslintrc`                          | Returns 0 entries                                            |
| Sorts results by RelPath                 | Multiple `.env*` files in different directories                                             | Entries sorted alphabetically by RelPath                     |

#### `worktree_test.go` — Git Worktree Detection

| Test Case                   | Fixture Setup                                              | Assertion                                   |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| Normal repo (`.git/` dir)   | `/tmp/repo/.git/` (directory)                              | `IsWorktree: false`, `WorktreeName: "repo"` |
| Worktree (`.git` file)      | `/tmp/wt/.git` file with `gitdir: /main/.git/worktrees/wt` | `IsWorktree: true`, `WorktreeName: "wt"`    |
| Invalid `.git` file content | `/tmp/bad/.git` file with `garbage content`                | Returns error                               |
| Missing `.git`              | `/tmp/norepo/` (no `.git` at all)                          | Returns error                               |

#### `backup_test.go` — Backup Orchestration

| Test Case                        | Fixture Setup                                                                 | Assertion                                                      |
| -------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Basic backup                     | `/tmp/repo/` with `.env` + `.env.local`, backup to `/tmp/bkup/`               | Files exist at `/tmp/bkup/.env` and `/tmp/bkup/.env.local`     |
| Preserves relative paths         | `/tmp/repo/apps/web/.env.local`, backup to `/tmp/bkup/`                       | File at `/tmp/bkup/apps/web/.env.local`                        |
| Creates intermediate dirs        | `/tmp/repo/apps/deep/nested/.env`, backup to `/tmp/bkup/`                     | `/tmp/bkup/apps/deep/nested/.env` exists                       |
| Preserves file permissions       | `/tmp/repo/.env` with mode 0600                                               | `/tmp/bkup/.env` has mode 0600                                 |
| Preserves file content           | `/tmp/repo/.env` with known content                                           | `/tmp/bkup/.env` has identical bytes                           |
| Overwrites existing backup       | Pre-existing `/tmp/bkup/.env` with old content, then backup new content       | `/tmp/bkup/.env` has new content                               |
| Rejects backup dir inside repo   | Backup to `/tmp/repo/backups/`                                                | Returns error "must be outside the repository"                 |
| Worktree-aware namespaces        | `/tmp/repo/` (normal), backup to `/tmp/bkup/`, worktreeAware=true             | Files at `/tmp/bkup/repo/...`                                  |
| Worktree-aware with worktree     | `/tmp/wt/` (worktree `.git` file), backup to `/tmp/bkup/`, worktreeAware=true | Files at `/tmp/bkup/wt/...`                                    |
| Auto-gen dirs not traversed      | `/tmp/repo/node_modules/.env` + `/tmp/repo/.env`, backup to `/tmp/bkup/`      | Only `/tmp/bkup/.env` exists, no `node_modules/.env` in backup |
| Zero files produces empty result | Empty `/tmp/repo/` (no `.env*`), backup to `/tmp/bkup/`                       | Result.Copied == 0, no files in `/tmp/bkup/`                   |

#### `restore_test.go` — Restore Orchestration

| Test Case                        | Fixture Setup                                                               | Assertion                                                     |
| -------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Basic restore                    | `/tmp/bkup/.env` + `/tmp/bkup/apps/web/.env.local`, restore to `/tmp/repo/` | Files at `/tmp/repo/.env` and `/tmp/repo/apps/web/.env.local` |
| Creates intermediate dirs        | `/tmp/bkup/apps/deep/.env`, restore to `/tmp/repo/` (no `apps/deep/` dir)   | `/tmp/repo/apps/deep/.env` exists                             |
| Preserves permissions            | `/tmp/bkup/.env` with mode 0600                                             | `/tmp/repo/.env` has mode 0600                                |
| Overwrites existing repo files   | Pre-existing `/tmp/repo/.env`, then restore from backup                     | `/tmp/repo/.env` has backup content                           |
| Missing backup dir errors        | Restore from `/tmp/nonexistent/`                                            | Returns error "does not exist"                                |
| Only restores `.env*` files      | `/tmp/bkup/.env` + `/tmp/bkup/README.md`, restore to `/tmp/repo/`           | Only `.env` restored; `README.md` ignored                     |
| Worktree-aware reads namespace   | `/tmp/bkup/wt/.env`, restore to worktree `/tmp/wt/`, worktreeAware=true     | File at `/tmp/wt/.env`                                        |
| Zero files produces empty result | Empty `/tmp/bkup/`, restore to `/tmp/repo/`                                 | Result.Copied == 0                                            |

#### `reporter_test.go` — Output Formatters

| Test Case                       | Input                           | Assertion                                    |
| ------------------------------- | ------------------------------- | -------------------------------------------- |
| Text: lists files               | Result with 2 copied files      | Output contains both RelPaths + summary line |
| Text quiet: summary only        | Result with 2 files, quiet=true | Only summary line, no per-file lines         |
| Text verbose: absolute paths    | Result with files, verbose=true | Output contains AbsPath + size               |
| JSON: valid structure           | Result with files               | Valid JSON with direction, dir, files, count |
| JSON: skipped files included    | Result with 1 skipped entry     | JSON entry has `skipped: true` + reason      |
| Markdown: table format          | Result with files               | Contains markdown table headers and rows     |
| Worktree-aware: shows namespace | Result with worktree name       | Output mentions worktree namespace           |

### Cmd-Layer Unit Tests (`cmd/env_backup_test.go`, `cmd/env_restore_test.go`)

Cmd-layer unit tests use godog to consume the same Gherkin specs from `specs/apps/rhino-cli/env/`,
but with all dependencies mocked via `testable.go` function variables.

Following the per-file variable convention (e.g., `specsDirUnitDoctor` in `doctor_test.go`), each
test file declares its own constant pointing to the same specs path:

```go
// In env_backup_test.go
const specsDirUnitEnvBackup = "../../../specs/apps/rhino-cli/env"

// In env_restore_test.go
const specsDirUnitEnvRestore = "../../../specs/apps/rhino-cli/env"
```

**Pattern** (follows `doctor_test.go`):

```go
package cmd

type envBackupUnitSteps struct {
    cmdErr    error
    cmdOutput string
}

func (s *envBackupUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
    verbose = false
    quiet = false
    output = "text"
    s.cmdErr = nil
    s.cmdOutput = ""

    // Mock findGitRoot via osGetwd/osStat
    osGetwd = func() (string, error) { return "/mock-repo", nil }
    osStat = func(name string) (os.FileInfo, error) {
        if name == "/mock-repo/.git" {
            return &mockFileInfo{name: ".git", isDir: true}, nil
        }
        return nil, os.ErrNotExist
    }

    // Default mock: no files backed up
    envBackupFn = func(_ envbackup.Options) (*envbackup.Result, error) {
        return &envbackup.Result{Copied: 0, Files: nil}, nil
    }

    return context.Background(), nil
}

func (s *envBackupUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
    envBackupFn = envbackup.Backup
    osGetwd = os.Getwd
    osStat = os.Stat
    return context.Background(), nil
}

func TestUnitEnvBackup(t *testing.T) {
    s := &envBackupUnitSteps{}
    suite := godog.TestSuite{
        ScenarioInitializer: func(sc *godog.ScenarioContext) {
            sc.Before(s.before)
            sc.After(s.after)
            // Register step definitions using constants from steps_common_test.go
        },
        Options: &godog.Options{
            Format:   "pretty",
            Paths:    []string{specsDirUnitEnvBackup},
            TestingT: t,
            Tags:     "env-backup",
        },
    }
    if suite.Run() != 0 {
        t.Fatal("non-zero status returned, failed to run unit feature tests")
    }
}
```

**Non-BDD tests** (outside Gherkin): Include `TestEnvBackupCmd_Initialization` (verifies command
Use/Short metadata) and `TestEnvBackupCmd_FnError` (verifies error propagation from internal fn).

### Integration Tests (`cmd/env_backup.integration_test.go`, `cmd/env_restore.integration_test.go`)

Integration tests use godog to consume the same Gherkin specs from `specs/apps/rhino-cli/env/`.
They exercise the full Cobra command pipeline (flag parsing → internal package → formatted output)
with real filesystem fixtures.

**Pattern**: Same as existing rhino-cli integration tests (see `doctor.integration_test.go`):

```go
//go:build integration

package cmd
```

#### Fixture Management

Every scenario's `Before` hook creates an isolated temp tree under `/tmp`:

```go
func (s *envBackupSteps) before(ctx context.Context, _ *godog.Scenario) (context.Context, error) {
    // Reset global flags
    verbose = false
    quiet = false
    output = "text"

    // Create isolated temp dir
    tmpDir, err := os.MkdirTemp("", "rhino-env-test-*")
    s.tmpDir = tmpDir

    // Create fake git repo
    s.repoDir = filepath.Join(tmpDir, "repo")
    os.MkdirAll(filepath.Join(s.repoDir, ".git"), 0755)

    // Create backup target outside repo
    s.backupDir = filepath.Join(tmpDir, "backup")

    // Chdir into repo (commands use findGitRoot from cwd)
    s.originalWd, _ = os.Getwd()
    os.Chdir(s.repoDir)

    return ctx, nil
}
```

`After` hook restores cwd and removes temp dir:

```go
func (s *envBackupSteps) after(ctx context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
    os.Chdir(s.originalWd)
    os.RemoveAll(s.tmpDir)
    return ctx, nil
}
```

#### Backup Integration Fixture Layout

```text
/tmp/rhino-env-test-XXXXXX/
├── repo/                        # Fake git root (chdir here before running command)
│   ├── .git/                    # Directory → normal repo
│   ├── .env                     # Root env file
│   ├── apps/
│   │   └── web/
│   │       ├── .env.local
│   │       └── .env.development
│   ├── node_modules/            # Auto-generated → must be skipped
│   │   └── some-pkg/
│   │       └── .env             # Must NOT be discovered
│   ├── dist/                    # Auto-generated → must be skipped
│   │   └── .env
│   ├── .next/                   # Auto-generated → must be skipped
│   │   └── .env
│   ├── __pycache__/             # Auto-generated → must be skipped
│   │   └── .env
│   ├── target/                  # Auto-generated → must be skipped
│   │   └── .env
│   ├── coverage/                # Auto-generated → must be skipped
│   │   └── .env
│   ├── generated-contracts/     # Auto-generated → must be skipped
│   │   └── .env
│   ├── .env.symlink → /tmp/...  # Symlink → must be skipped with warning
│   └── .env.oversized           # 2 MB file → must be skipped with warning
└── backup/                      # Backup target (outside repo)
```

#### Worktree Fixture Layout

```text
/tmp/rhino-env-test-XXXXXX/
├── main-repo/                   # Main repo
│   ├── .git/                    # Directory (real .git)
│   │   └── worktrees/
│   │       └── feature-branch/  # Worktree metadata (can be empty for test)
│   └── .env
├── feature-branch/              # Worktree checkout
│   ├── .git                     # FILE: "gitdir: ../main-repo/.git/worktrees/feature-branch"
│   ├── .env                     # Different content from main-repo/.env
│   └── apps/
│       └── web/
│           └── .env.local
└── backup/                      # Shared backup target
```

#### Restore Integration Fixture Layout

```text
/tmp/rhino-env-test-XXXXXX/
├── repo/                        # Empty fake git root (restore target)
│   └── .git/
├── backup/                      # Pre-populated backup (flat layout)
│   ├── .env
│   ├── apps/
│   │   └── web/
│   │       └── .env.local
│   └── README.md                # Non-env file → must be ignored during restore
└── backup-namespaced/           # Pre-populated backup (worktree-aware layout)
    └── feature-branch/
        ├── .env
        └── apps/
            └── web/
                └── .env.local
```

#### Key Step Definitions

```go
// "Given a repository with .env files at root and in app subdirectories"
func (s *envBackupSteps) aRepoWithEnvFiles() error {
    os.WriteFile(filepath.Join(s.repoDir, ".env"), []byte("ROOT_KEY=val"), 0644)
    os.MkdirAll(filepath.Join(s.repoDir, "apps", "web"), 0755)
    os.WriteFile(filepath.Join(s.repoDir, "apps", "web", ".env.local"), []byte("WEB_KEY=val"), 0644)
    return nil
}

// "Given a repository with .env files inside node_modules, dist, ..."
func (s *envBackupSteps) aRepoWithEnvInAutoGenDirs() error {
    for _, dir := range []string{"node_modules", "dist", "build", ".next", "__pycache__", "target", "vendor", "coverage", "generated-contracts"} {
        p := filepath.Join(s.repoDir, dir)
        os.MkdirAll(p, 0755)
        os.WriteFile(filepath.Join(p, ".env"), []byte("SHOULD_NOT_BACKUP=true"), 0644)
    }
    return nil
}

// "When the developer runs env backup --dir <path>"
func (s *envBackupSteps) runsEnvBackupWithDir(dir string) error {
    // Set flag, execute envBackupCmd, capture stdout/stderr
}

// "Then all .env files are copied to <dir> preserving relative paths"
func (s *envBackupSteps) envFilesAreCopiedPreservingPaths() error {
    // Verify files exist at expected paths in backup dir
    // Verify content matches source
}

// "Then none of those .env files are backed up"
func (s *envBackupSteps) noAutoGenEnvFilesBackedUp() error {
    // Walk backup dir, assert 0 files found
}
```

## Version Bump

rhino-cli version in `cmd/root.go` should be bumped from `0.13.0` to `0.14.0` to reflect the new
command group.
