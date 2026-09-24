---
description: "Overview of the automated code-quality tooling."
when_to_use: "Use when orienting to the code-quality toolchain."
---

# Overview

This project enforces code quality through automated tools that run during the development workflow:

- **Prettier** - Automatic code formatting
- **Husky** - Git hooks management
- **Rhino gate registry** - `repo-config.yml` gates the hooks run; `format-staged` formats staged files only
- **Commitlint** - Conventional Commits check you run on demand; no hook or CI step runs it (see [Commit Message Convention](../../workflow/commit-messages.md))

The hooks run the registry gates automatically. Commit-message format is the exception: review
checks it.
