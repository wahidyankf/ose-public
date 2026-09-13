# Plan: Consolidate CLI Specs Under `behavior/`

## Overview

Move all `specs/apps/*/cli/` directories into `specs/apps/*/behavior/cli/` for
`oseplatform`, `ayokoding`, and `rhino`. Unifies all Gherkin behavioral specs under
`behavior/`, organized by interface type (`web/`, `api/`, `cli/`).

**Scope**: `ose-public` only.

**Why**: `cli/` at the top level of each app spec folder breaks the type-based split.
`behavior/` is the home for all Gherkin contracts. `cli/` is an interface perspective —
same kind as `web/` and `api/` — and belongs there.

## Documents

- [brd.md](./brd.md) — business rationale
- [prd.md](./prd.md) — requirements + Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — exact file inventory, path changes, edge cases
- [delivery.md](./delivery.md) — granular execution checklist

## Blast Radius Summary

| App         | Spec files moved                    | Go test files | project.json | Other                                 |
| ----------- | ----------------------------------- | ------------- | ------------ | ------------------------------------- |
| oseplatform | 2 (1 feature + 1 README)            | 2             | 1            | behavior/README.md, app README        |
| ayokoding   | 2 (1 feature + 1 README)            | 2             | 1            | behavior/README.md, app README        |
| rhino       | 19 (18 features + 1 README, merged) | 36            | 1            | specs/rhino/README.md, governance doc |

**Total live file edits**: ~52 (excluding `.nx/` cache and worktrees).

## Worktree

See [delivery.md](./delivery.md) §Worktree for the canonical declaration, path, and provisioning command.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
