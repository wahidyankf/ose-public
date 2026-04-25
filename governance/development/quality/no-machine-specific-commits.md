---
title: No Machine-Specific Information in Commits
description: Practice prohibiting absolute local paths, usernames, IP addresses, and environment-specific configuration from committed code
category: explanation
subcategory: development
tags:
  - git
  - commits
  - security
  - portability
  - environment
  - quality
created: 2026-03-24
---

# No Machine-Specific Information in Commits

**Purpose**: Prevent committed code from containing information specific to one developer's machine, ensuring the repository remains portable, reproducible, and free of accidental credential exposure.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: A repository that embeds absolute local paths or machine usernames only works on the committing developer's machine. Keeping commits machine-neutral ensures every contributor can check out, build, and run the project identically.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Runtime configuration that differs per environment belongs in explicit environment variables or `.env` files — not implicitly baked into source code where its machine-specific origin is invisible.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Machine-specific paths appearing in committed files are a symptom of missing environment variable usage or missing `.env.example` templates. This practice fixes the root cause rather than patching individual leaks after the fact.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Configuration template files follow the standard naming pattern (e.g., `.env.example`) so they are discoverable and version-controlled without exposing real values.

## Overview

Every developer works on a different machine. Absolute paths, usernames, local IP addresses, and environment-specific configuration reflect one person's setup. When these values enter the git history, they cause two classes of harm:

1. **Portability failures**: Other contributors check out the code and tests or scripts reference a path that does not exist on their machine.
2. **Accidental information disclosure**: Usernames, local network addresses, or credentials committed to a shared (or public) repository become permanently visible in git history.

This practice defines what constitutes machine-specific information, where the line sits between prohibited values and acceptable test data, and how to handle runtime configuration correctly.

## What Counts as Machine-Specific Information

The following categories must never appear in committed files:

### Absolute Local Paths

Paths rooted at a user's home directory or a tool's local installation prefix are machine-specific.

**Prohibited examples:**

```text
/Users/jane/projects/open-sharia-enterprise
/home/alice/go/bin/golangci-lint
/opt/homebrew/bin/node
C:\Users\bob\AppData\Local\Programs\...
```

**Acceptable alternatives:** relative paths, workspace-relative paths, or paths derived at runtime from environment variables such as `$HOME`, `$GOPATH`, or `$PROJECT_ROOT`.

### Usernames Embedded in Paths or Configuration

A username embedded in a path (e.g., `/Users/jane/`) is machine-specific by definition. The same applies to usernames used as literal database credentials or API identifiers in source files.

### Local IP Addresses and Hostnames

Addresses such as `192.168.1.42`, `10.0.0.5`, or a machine's local hostname reflect a developer's local network configuration.

**Acceptable exceptions:** `127.0.0.1` and `localhost` are standard loopback references and may appear in test configuration that explicitly targets a locally running service. However, they must never appear alongside a literal password (see "Verifying a Commit Before Pushing" below).

### Environment-Specific Configuration Committed as Literals

Database connection strings, API keys, secret tokens, or tool paths that differ between developer machines and CI/CD must not appear as literal values in committed files.

## Acceptable Test Data

Test data that simulates realistic tool or system output is acceptable even when it resembles machine-specific information, provided it tests parsing logic rather than encoding actual machine identity.

**Acceptable examples:**

```go
// Tests the OS/arch parser — uses realistic values, not the real machine
assert.Equal(t, "darwin/arm64", parseOSArch(mockOutput))
```

```python
# Tests hostname parsing logic — the value is synthetic test input
assert parse_hostname("my-dev-machine.local") == "my-dev-machine"
```

The distinction: if a value exists in the test to verify that the code correctly handles a format or string pattern, it is test data. If the value was copied from the developer's machine because it was convenient, it is machine-specific information.

## What Belongs in Source Files vs. Environment Configuration

| Information type                                      | Correct location                                             |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| Database host for local development                   | `.env` (gitignored), default via `.env.example`              |
| API keys and secrets                                  | `.env` (gitignored)                                          |
| Absolute paths to installed tools                     | Derived at runtime from `$PATH`, `$GOPATH`, etc.             |
| Port numbers for local services                       | `.env` (gitignored) or documented defaults in `.env.example` |
| Relative paths within the workspace                   | Source files (acceptable)                                    |
| Standard loopback address (`127.0.0.1` / `localhost`) | Test configuration (acceptable, no literal password)         |

### Providing .env.example Templates

When a service or tool requires environment-specific values, commit a `.env.example` file that documents every required variable with a safe placeholder value. The actual `.env` file must be listed in `.gitignore`.

```bash
# .env.example — commit this
DATABASE_URL=postgres://user:password@localhost:5432/mydb
API_KEY=your-api-key-here
GOPATH=/path/to/your/gopath
```

```bash
# .env — gitignored, never commit this
DATABASE_URL=postgres://alice:s3cr3t@localhost:5432/devdb
API_KEY=sk-live-abc123
GOPATH=/Users/alice/go
```

## Verifying a Commit Before Pushing

Before committing, inspect staged changes for common machine-specific patterns:

```bash
git diff --cached | grep -i "/Users/\|/home/\|/opt/homebrew\|localhost.*password\|127\.0\.0"
```

The output should be empty. Any match is a signal to review that line and either replace it with an environment variable reference or confirm it is intentional test data.

Run this check whenever you stage new test fixtures, configuration files, or script output containing paths.

## Examples

### Prohibited: Hardcoded absolute path in a script

```bash
# WRONG — only works on one machine
export GOPATH=/Users/jane/go
```

```bash
# CORRECT — derived from the environment
export GOPATH="${GOPATH:-$HOME/go}"
```

### Prohibited: Hardcoded path in a test fixture

```go
// WRONG — encodes the developer's home directory
configPath := "/Users/jane/.config/tool/config.yaml"
```

```go
// CORRECT — resolved from the environment at runtime
configPath := filepath.Join(os.Getenv("HOME"), ".config", "tool", "config.yaml")
```

### Prohibited: Credential in a committed configuration file

```yaml
# WRONG — literal credential in source
database:
  url: postgres://alice:s3cr3t@localhost:5432/devdb
```

```yaml
# CORRECT — references environment variable
database:
  url: ${DATABASE_URL}
```

### Acceptable: Realistic value in a parser test

```go
// CORRECT — tests OS/arch parsing; value is synthetic test input, not the real machine
func TestParseOSArch(t *testing.T) {
    result := parseOSArch("darwin/arm64")
    assert.Equal(t, "darwin", result.OS)
    assert.Equal(t, "arm64", result.Arch)
}
```

## Scope

This rule applies to:

- All source code files
- All test files and test fixtures
- All configuration files (including Nx project.json, nx.json, docker-compose files)
- All shell scripts and CI workflow files
- All documentation committed to the repository

It does not apply to:

- `.env` files (which must be gitignored)
- Files listed in `.gitignore` (they are not committed)

## Remediation

If machine-specific information has already been committed:

1. Remove the value from the current working tree and replace it with an environment variable reference or relative path.
2. Commit the corrected version.
3. If the value was sensitive (a credential or API key), rotate the credential immediately — git history is permanent and the value is considered exposed even after removal from HEAD.

For non-sensitive path leaks (e.g., a developer's home directory appeared in a test), a simple corrective commit is sufficient.

## Related Documentation

- [Code Quality Convention](./code.md) - Git hooks and pre-commit automation that help catch violations before they reach the remote
- [Reproducible Environments](../workflow/reproducible-environments.md) - Volta pinning, package-lock.json, and `.env.example` templates for consistent developer environments
- [Commit Message Convention](../workflow/commit-messages.md) - Conventional Commits format for the corrective commit
