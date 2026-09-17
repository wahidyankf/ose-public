---
name: swe-developing-applications-common
description: Common software development workflow patterns shared across all language developer agents
created: 2026-01-25
---

# Common Software Development Workflow

This Skill provides universal development workflow guidance shared across all language-specific developer agents in the Open Sharia Enterprise platform.

## Purpose

Use this Skill when developing applications in any language within the Nx monorepo, following platform git workflow standards, or leveraging platform automation.

## Tool Usage for Developers

Standard developer tools: read, write, edit, glob, grep, bash — prefer glob/grep over `bash find`/`bash grep`, and edit over write for existing files. See [Tool Usage and Development Workflow Pattern](./reference/tool-usage-and-workflow-pattern.md) for full tool purposes and selection guidance.

## Nx Monorepo Integration

Nx manages the monorepo: apps in `apps/[app-name]` never import other apps; libraries in `libs/[lib-name]` are flat and form a dependency DAG. Use canonical [Nx Target Standards](../../../repo-governance/development/infra/nx-targets.md) names (`dev`, `test:quick`, `start`, never `serve`/`test` as a `dev`/`start` alias — a narrow `serve` exception exists for a no-own-app E2E orchestrator; see [Nx Target Naming Rules](../../../repo-governance/development/infra/nx-targets/target-naming-rules.md)) and `nx affected:*` to build/test only what changed. See [Nx Monorepo Integration](./reference/nx-monorepo-integration.md) for structure, commands, and best practices.

## Git Workflow

All development targets `main` via Conventional Commits (`<type>(<scope>): <description>`). Never
stage or commit without explicit authorization of the named change set; once authorized, use the
fewest build-valid, independently reviewable/revertible thematic commits. See
[Git Workflow](./reference/git-workflow.md) for branch strategy, composition, and git discipline.

## Pre-commit Automation

Husky + lint-staged auto-run Prettier, markdown lint, and link validation on commit; commit-msg
validates Conventional Commits; pre-push runs `nx affected -t test:quick`. Integration and E2E
remain manual-and-impacted during development/review and scheduled-and-complete in CI. See
[Pre-commit Automation](./reference/pre-commit-automation.md) for the full hook list and
common-failure fixes.

## Development Environment Setup

Verify the toolchain before implementing anything: `rtk npm run doctor` (add `-- --fix` to
auto-install). `rhino-cli` manages `.env` files. Right after creating a worktree, run
`rtk ./hippo run --class ephemeral --disk-path . -- npm install` and then
`rtk npm run doctor -- --fix`; re-entry alone does not trigger setup. See
[Development Environment Setup](./reference/development-environment-setup.md) for the full command
reference and when-to-run guidance.

## Development Workflow Pattern

All language developers follow the same 6-step pattern (requirements, design, implementation, testing, review, docs) and "make it work → make it right → make it fast" — avoid premature optimization, over-engineering, and skipping tests. See [Tool Usage and Development Workflow Pattern](./reference/tool-usage-and-workflow-pattern.md) for the full step list and philosophy.

## Reference Documentation Patterns and TDD

Language developers reference CLAUDE.md, monorepo structure, and workflow/quality conventions; each language also has coding standards under `docs/explanation/software-engineering/programming-languages/[language]/README.md`. TDD is required for all code changes: Unit is mandatory, while Integration/E2E start red when their real boundary applies. See [Reference Documentation Patterns and TDD](./reference/reference-docs-and-tdd.md) for the full list, TDD cycle, and canonical references.

## Related Conventions

See [Related Conventions](./reference/related-conventions.md) for workflow, quality, and architecture conventions this Skill builds on (Trunk Based Development, PR Merge Protocol, Commit Messages, Code Quality, Feature Change Completeness, Nx Target Standards, Functional Programming, and more).

## Related Skills

Language-specific skills provide deep expertise: `swe-programming-typescript`, `swe-programming-rust`, `swe-programming-fsharp`, `swe-programming-csharp`.
