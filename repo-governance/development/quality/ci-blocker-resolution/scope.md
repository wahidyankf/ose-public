---
description: "What this convention applies to."
when_to_use: "Use when checking whether this convention applies to a CI failure."
---

# Scope

This convention applies to:

- All CI quality gates, including `test:quick` with Unit runtime and the static
  `test:behaviour:coverage` check
- All projects in the Nx workspace
- All contributors: human developers and AI agents
- All branches: main, worktree branches, and PR branches

It does not apply to:

- Intentional test removals that are part of a documented refactoring plan (the plan itself must justify the removal)
- CI infrastructure failures unrelated to code (GitHub Actions outage, runner disk full, network timeout) -- these are operational issues, not code quality issues
