# Requirements: Enhanced Env Backup/Restore

## Functional Requirements

### FR-1: Overwrite Confirmation Prompt (Backup)

Before copying files during `env backup`, check whether any destination files already exist in the
backup directory. If so, prompt the user for confirmation.

| Requirement | Detail                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1.1      | After discovery and before any copy, compute the list of destination paths that already exist in the backup directory                           |
| FR-1.2      | If one or more destination files exist, display: `N file(s) already exist. Overwrite? [y/N]` followed by the list of conflicting relative paths |
| FR-1.3      | Default answer is "No" (pressing Enter without input aborts the operation)                                                                      |
| FR-1.4      | Accept `y`, `Y`, `yes`, `YES`, `Yes` as confirmation; all other inputs (including empty) abort                                                  |
| FR-1.5      | If the user declines, exit 0 with message "Backup cancelled." and 0 files copied                                                                |
| FR-1.6      | If no destination files exist (fresh backup), proceed without prompting                                                                         |
| FR-1.7      | The `--force` / `-f` flag skips the confirmation prompt entirely — always overwrite (preserves current idempotent behavior)                     |
| FR-1.8      | JSON and markdown output modes (`-o json`, `-o markdown`) imply `--force` (non-interactive contexts should not prompt)                          |

### FR-2: Overwrite Confirmation Prompt (Restore)

Before copying files during `env restore`, check whether any destination files already exist in the
repository. If so, prompt the user for confirmation.

| Requirement | Detail                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-2.1      | After discovering backup files and before any copy, compute the list of repo paths that already exist                                           |
| FR-2.2      | If one or more destination files exist, display: `N file(s) already exist. Overwrite? [y/N]` followed by the list of conflicting relative paths |
| FR-2.3      | Default answer is "No" (pressing Enter without input aborts)                                                                                    |
| FR-2.4      | Accept same confirmation inputs as FR-1.4                                                                                                       |
| FR-2.5      | If the user declines, exit 0 with message "Restore cancelled." and 0 files copied                                                               |
| FR-2.6      | If no destination files exist, proceed without prompting                                                                                        |
| FR-2.7      | The `--force` / `-f` flag skips the prompt                                                                                                      |
| FR-2.8      | JSON and markdown output modes imply `--force`                                                                                                  |

### FR-3: Config File Backup (`--include-config`)

Extend `env backup` to also back up known uncommitted local configuration files when the
`--include-config` flag is provided.

| Requirement | Detail                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| FR-3.1      | New `--include-config` boolean flag on `env backup` (default: false)                                                    |
| FR-3.2      | When enabled, discover config files from `DefaultConfigPatterns` in addition to `.env*` files                           |
| FR-3.3      | Config patterns are exact relative paths checked against repo root (not glob walks)                                     |
| FR-3.4      | Only back up config files that actually exist on disk (missing patterns silently skipped)                               |
| FR-3.5      | Config files follow the same backup mechanics: preserve relative path, preserve permissions, respect `--worktree-aware` |
| FR-3.6      | Config files participate in the overwrite confirmation prompt (FR-1)                                                    |
| FR-3.7      | Config files are included in result output (text, JSON, markdown) with a `"source": "config"` marker in JSON            |
| FR-3.8      | Config files respect the same 1 MB size limit as `.env*` files                                                          |
| FR-3.9      | Symlink config files are skipped with a warning (same as `.env*`)                                                       |

### FR-4: Config File Restore (`--include-config`)

Extend `env restore` to also restore config files when `--include-config` is provided.

| Requirement | Detail                                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-4.1      | New `--include-config` boolean flag on `env restore` (default: false)                                                                                                                                                                             |
| FR-4.2      | When enabled, discover config files in the backup directory via `DiscoverConfig()` and restore them to original paths. Config entries (identified by `Source: "config"`) must bypass the existing `.env` basename filter in the restore copy loop |
| FR-4.3      | Config file identification in backup: match against `DefaultConfigPatterns` relative paths                                                                                                                                                        |
| FR-4.4      | Config files participate in the overwrite confirmation prompt (FR-2)                                                                                                                                                                              |
| FR-4.5      | Config files are included in result output with appropriate markers                                                                                                                                                                               |

### FR-5: Default Config Patterns

Curated list of known uncommitted local configuration files. Organized by category.

| Category         | Relative Path                      | Description                              |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| **AI Tools**     | `.claude/settings.local.json`      | Claude Code project-level local settings |
| AI Tools         | `.claude/settings.local.json.bkup` | Claude Code settings backup              |
| AI Tools         | `.cursor/mcp.json`                 | Cursor MCP server configuration          |
| AI Tools         | `.windsurfrules`                   | Windsurf project rules                   |
| AI Tools         | `.clinerules`                      | Cline project rules                      |
| AI Tools         | `.aider.conf.yml`                  | Aider project configuration              |
| AI Tools         | `.aiderignore`                     | Aider ignore patterns                    |
| AI Tools         | `.continue/config.json`            | Continue extension configuration         |
| AI Tools         | `.gemini/settings.json`            | Gemini CLI project settings              |
| AI Tools         | `.amazonq/mcp.json`                | Amazon Q MCP configuration               |
| AI Tools         | `.roomodes`                        | Roo Code custom modes                    |
| **Docker**       | `docker-compose.override.yml`      | Docker Compose local overrides           |
| **Version Mgrs** | `mise.local.toml`                  | mise-en-place local overrides            |
| **Environment**  | `.envrc`                           | direnv environment setup                 |

> **Design note**: The list is intentionally conservative — only files that are (a) typically
> gitignored, (b) contain non-recoverable local configuration, and (c) commonly found in
> development repos. IDE workspace files (`.idea/workspace.xml`, `.vscode/launch.json`) are
> excluded because they are either committed or auto-regenerated.

### FR-6: Rename Default Backup Directory

| Requirement | Detail                                                                           |
| ----------- | -------------------------------------------------------------------------------- |
| FR-6.1      | Change default backup directory from `~/ose-env-bkup` to `~/ose-open-env-backup` |
| FR-6.2      | Update `DefaultBackupDir` constant in `types.go`                                 |
| FR-6.3      | Update help text for `--dir` flag on both `env backup` and `env restore`         |
| FR-6.4      | Update `apps/rhino-cli/README.md` references to the default backup directory     |

### FR-7: Output Format Updates

| Requirement | Detail                                                                                |
| ----------- | ------------------------------------------------------------------------------------- |
| FR-7.1      | Text output: config files displayed with `[config]` tag alongside the relative path   |
| FR-7.2      | JSON output: `FileEntry` gains an optional `"source"` field (`"env"` or `"config"`)   |
| FR-7.3      | Confirmation prompt output (the conflict list) clearly labels each file's source type |
| FR-7.4      | Summary line includes config file count when `--include-config` is used               |

## Edge Cases

| Case                                                           | Behavior                                      |
| -------------------------------------------------------------- | --------------------------------------------- |
| Backup with no existing destinations                           | Proceed without prompt, copy all files        |
| Backup with all destinations existing                          | Prompt lists all files; user decides          |
| Backup with `--force` and existing files                       | Overwrite without prompt                      |
| Backup with `-o json` and existing files                       | Overwrite without prompt (JSON implies force) |
| `--include-config` with no config files found                  | Back up only `.env*` files, no error          |
| `--include-config` with only config files (no `.env*`)         | Back up only config files                     |
| Config file is a symlink                                       | Skip with warning (same as `.env*`)           |
| Config file exceeds 1 MB                                       | Skip with warning (same as `.env*`)           |
| Restore with `--include-config` but backup has no config files | Restore only `.env*` files                    |
| Pipe/redirect detected (non-TTY stdin)                         | Behave as `--force` (no prompt possible)      |
| `--force` combined with `--include-config`                     | Both flags work independently                 |
| `--include-config` with `--worktree-aware`                     | Config files namespaced same as `.env*`       |

## Non-Functional Requirements

| Requirement | Detail                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| NFR-1       | No new external dependencies — confirmation uses `bufio.NewScanner(os.Stdin)`                                           |
| NFR-2       | Backward compatible — without `--force` or `--include-config`, only change is the new confirmation prompt on overwrites |
| NFR-3       | `--force` restores exact pre-enhancement behavior (silent overwrite)                                                    |
| NFR-4       | Testable via dependency injection — `ConfirmFn` callback in `Options` for stdin mocking                                 |
| NFR-5       | Config patterns list is a package-level variable (`DefaultConfigPatterns`) extensible by tests                          |
| NFR-6       | >=90% line coverage maintained                                                                                          |
| NFR-7       | Dual-level Gherkin consumption maintained (unit + integration)                                                          |

## Acceptance Criteria (Gherkin)

### Confirmation Prompt — Backup

```gherkin
@env-backup-confirm
Scenario: Backup prompts when destination files already exist
  Given a git repository containing a .env file at the root
  And the backup directory already contains a backed-up .env file
  When the developer runs rhino-cli env backup and confirms the overwrite
  Then the command exits successfully
  And the .env file is overwritten in the backup directory

@env-backup-confirm
Scenario: Backup aborts when user declines overwrite
  Given a git repository containing a .env file at the root
  And the backup directory already contains a backed-up .env file
  When the developer runs rhino-cli env backup and declines the overwrite
  Then the command exits successfully
  And the output reports that backup was cancelled
  And the existing backup file is unchanged

@env-backup-confirm
Scenario: Backup with --force skips confirmation
  Given a git repository containing a .env file at the root
  And the backup directory already contains a backed-up .env file
  When the developer runs rhino-cli env backup with --force
  Then the command exits successfully
  And the .env file is overwritten in the backup directory without prompting

@env-backup-confirm
Scenario: Backup proceeds without prompt when no conflicts exist
  Given a git repository containing a .env file at the root
  And the backup directory is empty
  When the developer runs rhino-cli env backup
  Then the command exits successfully
  And no confirmation prompt is shown
  And the .env file is copied to the backup directory
```

### Confirmation Prompt — Restore

```gherkin
@env-restore-confirm
Scenario: Restore prompts when destination files already exist
  Given a backup directory containing a previously backed-up .env file
  And the repository already contains a .env file at the original path
  When the developer runs rhino-cli env restore and confirms the overwrite
  Then the command exits successfully
  And the .env file in the repository is overwritten with the backup

@env-restore-confirm
Scenario: Restore aborts when user declines overwrite
  Given a backup directory containing a previously backed-up .env file
  And the repository already contains a .env file at the original path
  When the developer runs rhino-cli env restore and declines the overwrite
  Then the command exits successfully
  And the output reports that restore was cancelled
  And the existing repository file is unchanged

@env-restore-confirm
Scenario: Restore with --force skips confirmation
  Given a backup directory containing a previously backed-up .env file
  And the repository already contains a .env file at the original path
  When the developer runs rhino-cli env restore with --force
  Then the command exits successfully
  And the .env file in the repository is overwritten without prompting

@env-restore-confirm
Scenario: Restore proceeds without prompt when no conflicts exist
  Given a backup directory containing a previously backed-up .env file
  And the repository does not contain a .env file at the original path
  When the developer runs rhino-cli env restore
  Then the command exits successfully
  And no confirmation prompt is shown
  And the .env file is restored to the repository
```

### Config File Backup

```gherkin
@env-backup-config
Scenario: Backup includes config files with --include-config
  Given a git repository containing a .env file and a .claude/settings.local.json file
  When the developer runs rhino-cli env backup with --include-config and --force
  Then the command exits successfully
  And the .env file is copied to the backup directory
  And the .claude/settings.local.json is copied to the backup directory preserving its relative path

@env-backup-config
Scenario: Backup without --include-config ignores config files
  Given a git repository containing a .env file and a .claude/settings.local.json file
  When the developer runs rhino-cli env backup with --force
  Then the command exits successfully
  And the .env file is copied to the backup directory
  And the .claude/settings.local.json is not copied to the backup directory

@env-backup-config
Scenario: Backup with --include-config and no config files found
  Given a git repository containing a .env file but no known config files
  When the developer runs rhino-cli env backup with --include-config and --force
  Then the command exits successfully
  And only the .env file is copied to the backup directory
```

### Config File Restore

```gherkin
@env-restore-config
Scenario: Restore includes config files with --include-config
  Given a backup directory containing a .env file and a .claude/settings.local.json file
  When the developer runs rhino-cli env restore with --include-config and --force
  Then the command exits successfully
  And the .env file is restored to the repository
  And the .claude/settings.local.json is restored to the repository preserving its relative path

@env-restore-config
Scenario: Restore without --include-config ignores config files in backup
  Given a backup directory containing a .env file and a .claude/settings.local.json file
  When the developer runs rhino-cli env restore with --force
  Then the command exits successfully
  And the .env file is restored to the repository
  And the .claude/settings.local.json is not restored to the repository
```

## Risk Assessment

| Risk                                              | Likelihood | Impact | Mitigation                                                                                             |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Confirmation prompt breaks CI pipelines           | Medium     | High   | `--force` flag; JSON/markdown output implies force; non-TTY stdin implies force                        |
| Config pattern list becomes stale as tools evolve | Medium     | Low    | Patterns are a package-level variable, easy to update; conservative initial list                       |
| Prompt on every backup annoys power users         | Medium     | Medium | `--force` flag; prompt only triggers when files actually exist; default for fresh backups is no prompt |
| Config file contains secrets backed up insecurely | Low        | Medium | Same security model as `.env*` files — backup dir permissions are 0o750, user responsibility           |
| Stdin mock in tests is flaky                      | Low        | Medium | Use `ConfirmFn` callback injection, not raw stdin — fully deterministic                                |
