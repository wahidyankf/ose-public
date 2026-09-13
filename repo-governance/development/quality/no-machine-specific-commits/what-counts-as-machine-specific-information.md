---
description: "The prohibited categories: absolute local paths, embedded usernames, local IPs/hostnames, and environment-specific literals."
when_to_use: "Use when deciding whether a specific value is machine-specific and must not be committed."
---

# What Counts as Machine-Specific Information

The following categories must never appear in committed files:

## Absolute Local Paths

Paths rooted at a user's home directory or a tool's local installation prefix are machine-specific.

**Prohibited examples:**

```text
/Users/<name>/projects/open-sharia-enterprise
/home/<name>/go/bin/golangci-lint
/opt/homebrew/bin/node
C:\Users\bob\AppData\Local\Programs\...
```

**Acceptable alternatives:** relative paths, workspace-relative paths, or paths derived at runtime from environment variables such as `$HOME`, `$GOPATH`, or `$PROJECT_ROOT`.

## Formal Plan Delivery Documents

Committed formal-plan delivery documents, including `plans/**/delivery.md`, must identify a
worktree only by its repository-relative route, such as `worktrees/<plan-identifier>/`. They must
not record a resolved host path, a home-directory path, a tool-installation prefix, a Windows drive
path, or a UNC path. During execution and cleanup, resolve that route against the selected
repository root and reconcile the resulting runtime path with `git worktree list --porcelain`.

Keep any runtime path evidence under an ignored runtime-evidence root. A plan may retain its
portable route, branch, creator, and timestamp as its committed identity. `plan-checker` rejects a
nonportable worktree identity, and the required PR leak review inspects the complete changed
delivery document for real machine-specific absolute paths.

## Usernames Embedded in Paths or Configuration

A username embedded in a path (e.g., `/Users/<name>/`) is machine-specific by definition. The same applies to usernames used as literal database credentials or API identifiers in source files.

## Local IP Addresses and Hostnames

Addresses such as `192.168.x.42`, `10.x.0.5`, or a machine's local hostname reflect a developer's local network configuration.

**Acceptable exceptions:** `127.0.0.1` and `localhost` are standard loopback references and may appear in test configuration that explicitly targets a locally running service. However, they must never appear alongside a literal password (see "Verifying a Commit Before Pushing" below).

## Environment-Specific Configuration Committed as Literals

Database connection strings, API keys, secret tokens, or tool paths that differ between developer machines and CI/CD must not appear as literal values in committed files.
