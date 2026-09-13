# Requirements: .env Backup and Restore

## Functional Requirements

### FR-1: File Discovery

The tool discovers `.env*` files by walking the repository from the git root.

| Requirement | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1.1      | Match files whose basename starts with `.env` (e.g., `.env`, `.env.local`, `.env.development.local`, `.env.production`)                                                                                                                                                                                                                                                                                                                                                                 |
| FR-1.2      | Walk only tracked directories — skip auto-generated/dependency directories: `.git/`, `node_modules/`, `dist/`, `build/`, `.nx/`, `.next/`, `__pycache__/`, `.venv/`, `venv/`, `target/`, `vendor/`, `_build/`, `.dart_tool/`, `.gradle/`, `deps/`, `_deps/`, `.turbo/`, `.cache/`, `.parcel-cache/`, `coverage/`, `.nyc_output/`, `generated-contracts/`, `.terraform/`, `.pulumi/`, `bower_components/`, `.cargo/`, `zig-cache/`, `.stack-work/`, `elm-stuff/`, `.elixir_ls/`, `.mix/` |
| FR-1.3      | Follow the repository boundary (git root / worktree root) — never walk above it                                                                                                                                                                                                                                                                                                                                                                                                         |
| FR-1.4      | Include `.env*` files at any depth (root, `apps/*/`, `libs/*/`, nested)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| FR-1.5      | Support git worktrees: detect `.git` as both a directory (normal repo) and a file (worktree pointer). Walk the worktree root, not the main repo                                                                                                                                                                                                                                                                                                                                         |

### FR-1A: Git Worktree Support

Git worktrees (`git worktree add`) create separate working directories that share a
common `.git` object store. In a worktree, `.git` is a **file** (not a directory) containing
`gitdir: /path/to/main/.git/worktrees/<name>`. This affects backup identity — multiple
worktrees of the same repo have the same relative file paths but potentially different
`.env*` contents.

| Requirement | Detail                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1A.1     | `findGitRoot()` already uses `os.Stat` which succeeds for both files and dirs — no change needed for root detection                          |
| FR-1A.2     | Detect worktree: if `.git` is a file, parse it to extract `gitdir:` path → this is a worktree                                                |
| FR-1A.3     | Resolve **worktree name**: basename of the worktree root directory (e.g., for `/tmp/agent-worktree-abc` → `agent-worktree-abc`)              |
| FR-1A.4     | Default (no flag): flat backup `<backup-dir>/<relative-path>` — simple, works for single checkout; last-write-wins if multiple worktrees run |
| FR-1A.5     | `--worktree-aware` flag: namespaced backup `<backup-dir>/<worktree-name>/<relative-path>` — each worktree gets its own backup namespace      |
| FR-1A.6     | Both `env backup` and `env restore` accept `--worktree-aware`; restore reads from the matching namespace                                     |
| FR-1A.7     | For the main repo (not a worktree), `--worktree-aware` uses the directory basename as the namespace (e.g., `open-sharia-enterprise`)         |
| FR-1A.8     | Claude Code worktrees (`isolation: "worktree"`) are standard git worktrees — handled identically, no special case                            |

### FR-2: Backup (`env backup`)

| Requirement | Detail                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| FR-2.1      | Default backup directory: `~/ose-env-bkup`                                                                       |
| FR-2.2      | Overridable via `--dir <path>` flag                                                                              |
| FR-2.3      | Preserve relative path structure: `apps/ayokoding-web/.env.local` → `<backup-dir>/apps/ayokoding-web/.env.local` |
| FR-2.4      | Create intermediate directories as needed (`os.MkdirAll`)                                                        |
| FR-2.5      | Overwrite existing backup files without prompting (idempotent)                                                   |
| FR-2.6      | Preserve original file permissions                                                                               |
| FR-2.7      | Report each file backed up in text output                                                                        |
| FR-2.8      | Report total count and backup directory path on completion                                                       |
| FR-2.9      | Exit 0 on success (even if 0 files found — not an error, just nothing to back up)                                |
| FR-2.10     | Exit 1 on I/O errors (permission denied, disk full, etc.)                                                        |

### FR-3: Restore (`env restore`)

| Requirement | Detail                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FR-3.1      | Default restore source directory: `~/ose-env-bkup`                                                                                |
| FR-3.2      | Overridable via `--dir <path>` flag                                                                                               |
| FR-3.3      | Reverse the path mapping: `<backup-dir>/apps/ayokoding-web/.env.local` → `apps/ayokoding-web/.env.local` (relative to git root)   |
| FR-3.4      | Create intermediate directories in the repo if missing                                                                            |
| FR-3.5      | Overwrite existing `.env*` files in the repo (the backup is the source of truth)                                                  |
| FR-3.6      | Preserve file permissions from the backup                                                                                         |
| FR-3.7      | Report each file restored in text output                                                                                          |
| FR-3.8      | Report total count and source directory path on completion                                                                        |
| FR-3.9      | Exit 0 on success (even if 0 files found in backup dir)                                                                           |
| FR-3.10     | Exit 1 if the backup directory does not exist                                                                                     |
| FR-3.11     | Exit 1 on I/O errors                                                                                                              |
| FR-3.12     | Only restore files whose basename matches `.env*` (ignore any non-env files that may have been manually placed in the backup dir) |

### FR-4: Output Formats

Both commands support the global `--output` flag:

| Format     | Content                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `text`     | One line per file (relative path), summary line at end                                         |
| `json`     | `{ "direction": "backup"/"restore", "dir": "...", "files": [...], "copied": N, "skipped": N }` |
| `markdown` | Markdown table of files with summary (covered by `reporter_test.go`, not Gherkin scenarios)    |

`--verbose` adds absolute paths and file sizes. `--quiet` suppresses per-file lines, shows only
the summary.

> **Note**: `--verbose` and `--quiet` flag behavior is covered by internal reporter unit tests
> (`reporter_test.go`), not Gherkin scenarios. The Gherkin scenarios focus on functional
> correctness (files discovered, paths preserved, exit codes) rather than output formatting modes.

### FR-5: Safety

| Requirement | Detail                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| FR-5.1      | Never follow symlinks (use `os.Lstat`, not `os.Stat`, for discovery)                                     |
| FR-5.2      | Never back up files larger than 1 MB (likely not an env file — warn and skip)                            |
| FR-5.3      | Backup directory must be outside the git root (reject if inside to prevent accidental commit of secrets) |

## Edge Cases

| Case                                              | Behavior                                                  |
| ------------------------------------------------- | --------------------------------------------------------- |
| No `.env*` files in repo                          | Exit 0, report "0 files backed up"                        |
| Backup dir already exists with old files          | Overwrite matching files; leave unmatched files untouched |
| Backup dir does not exist                         | Create it (backup); error (restore)                       |
| `.env*` file is a symlink                         | Skip with warning                                         |
| `.env*` file is >1 MB                             | Skip with warning                                         |
| `--dir` points inside the git root                | Error: "backup directory must be outside the repository"  |
| File has no read permission                       | Error and exit 1                                          |
| Backup dir path contains `~`                      | Expand to `$HOME` (Go `os.UserHomeDir()`)                 |
| Running in a git worktree (no flag)               | Works normally — flat backup, same as main repo           |
| Running in a git worktree with `--worktree-aware` | Backup namespaced under worktree dir basename             |
| Two worktrees backup without `--worktree-aware`   | Last write wins — documented, not an error                |
| Claude Code agent worktree                        | Standard worktree — no special handling needed            |

## Non-Functional Requirements

| Requirement | Detail                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1       | No external dependencies beyond stdlib + cobra                                                                                                                               |
| NFR-2       | File copy via byte stream (not shell `cp`) for portability                                                                                                                   |
| NFR-3       | Works on macOS, Linux, and WSL                                                                                                                                               |
| NFR-4       | >=90% line coverage for unit tests (enforced by `project.json` and CLAUDE.md; note: `specs/apps/rhino-cli/README.md` mentions 95% but the project-enforced threshold is 90%) |
| NFR-5       | Dual-level Gherkin consumption: same `.feature` files consumed by both godog unit tests (mocked deps) and godog integration tests (real fs)                                  |
| NFR-6       | Dependency injection via `testable.go` function variables — cmd files never call internal packages directly                                                                  |
| NFR-7       | Step regex constants centralized in `steps_common_test.go` — shared between unit and integration test files                                                                  |

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Environment file backup and restore

  Scenario: Backup discovers and copies all .env files
    Given a repository with .env files at root and in app subdirectories
    When the developer runs env backup
    Then all .env files are copied to ~/ose-env-bkup preserving relative paths
    And the output lists each file backed up
    And the command exits successfully

  Scenario: Backup with custom directory
    Given a repository with .env files
    When the developer runs env backup --dir /tmp/my-env-backup
    Then all .env files are copied to /tmp/my-env-backup preserving relative paths

  Scenario: Restore copies files back from backup
    Given a backup directory containing previously backed-up .env files
    When the developer runs env restore
    Then all .env files are restored to their original repository paths
    And the command exits successfully

  Scenario: Restore with custom source directory
    Given a backup at /tmp/my-env-backup
    When the developer runs env restore --dir /tmp/my-env-backup
    Then files are restored from that directory

  Scenario: Restore fails when backup directory does not exist
    When the developer runs env restore --dir /nonexistent
    Then the command exits with a failure code
    And the output reports that the directory does not exist

  Scenario: Backup rejects a directory inside the repository
    Given a repository at /home/<user>/project
    When the developer runs env backup --dir /home/<user>/project/backups
    Then the command exits with a failure code
    And the output warns that the backup dir must be outside the repo

  Scenario: Symlinks and oversized files are skipped
    Given a repository with a .env symlink and a .env file larger than 1 MB
    When the developer runs env backup
    Then the symlink is skipped with a warning
    And the oversized file is skipped with a warning
    And other .env files are backed up normally

  Scenario: Backup with zero .env files
    Given a repository with no .env files
    When the developer runs env backup
    Then the command exits successfully
    And the output reports 0 files backed up

  Scenario: JSON output for backup
    Given a repository with .env files
    When the developer runs env backup with JSON output
    Then the output is valid JSON
    And the JSON contains direction, dir, files array, copied, and skipped

  Scenario: JSON output for restore
    Given a backup directory with .env files
    When the developer runs env restore with JSON output
    Then the output is valid JSON
    And the JSON contains direction, dir, files array, copied, and skipped

  Scenario: Env files inside auto-generated directories are not discovered
    Given a repository with .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts
    When the developer runs env backup
    Then none of those .env files are backed up
    And the output reports 0 files backed up

  Scenario: Env files inside nested auto-generated directories are not discovered
    Given a repository with apps/web/node_modules/.env and apps/web/.env.local
    When the developer runs env backup
    Then only apps/web/.env.local is backed up
    And the node_modules/.env is not backed up

  Scenario: Backup works in a git worktree
    Given a git worktree with .env files
    When the developer runs env backup
    Then all .env files are copied to the flat backup directory
    And the command exits successfully

  Scenario: Worktree-aware backup namespaces by worktree name
    Given a git worktree named "feature-branch" with .env files
    When the developer runs env backup --worktree-aware
    Then .env files are backed up under <backup-dir>/feature-branch/
    And the command exits successfully

  Scenario: Worktree-aware restore reads from correct namespace
    Given a worktree-aware backup for worktree "feature-branch"
    When the developer runs env restore --worktree-aware from the same worktree
    Then .env files are restored from the feature-branch namespace
    And the command exits successfully

  Scenario: Main repo with worktree-aware uses repo directory name
    Given the main repository (not a worktree) named "open-sharia-enterprise"
    When the developer runs env backup --worktree-aware
    Then .env files are backed up under <backup-dir>/open-sharia-enterprise/
```

## Risk Assessment

| Risk                                        | Likelihood | Impact | Mitigation                                                 |
| ------------------------------------------- | ---------- | ------ | ---------------------------------------------------------- |
| Accidental backup of non-secret large files | Low        | Low    | 1 MB size limit with skip + warning                        |
| Backup dir inside repo → secrets committed  | Medium     | High   | Validate backup dir is outside git root (FR-5.3)           |
| Symlink following leads to unexpected files | Low        | Medium | Use `os.Lstat`, skip symlinks (FR-5.1)                     |
| Restore overwrites manually edited env file | Medium     | Medium | Documented as intended behavior; backup is source of truth |
| Platform-specific path issues (Windows `~`) | Low        | Low    | Use `os.UserHomeDir()`, only support macOS/Linux/WSL       |
