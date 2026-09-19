---
description: Standards for reliable local development infrastructure, toolchains, and artifacts
when_to_use: Use when setting up local development tooling, naming Nx targets, organizing temporary files, or writing testable acceptance criteria.
---

# Infrastructure Development

Use these standards to make a local checkout dependable: set up tools, name targets consistently, keep temporary output contained, and write acceptance criteria that can be checked. Covers temporary files, build artifacts, acceptance criteria, Nx target naming/caching, CI/CD, Docker, and Vercel deployment — not production infrastructure (deployment/hosting), content organization (conventions/), or workflow (workflow/).

## Documents

- [Acceptance Criteria Convention](./acceptance-criteria.md) — Writing testable acceptance criteria using Gherkin format for clarity and automation. Use when writing or reviewing acceptance criteria for a plan, feature spec, or test scenario.
- [Anti-Patterns in Infrastructure Development](./anti-patterns.md) — Common anti-patterns in infrastructure development — scattered files, placeholder values, missing tools, vague criteria — with problems, examples, and solutions for each. Use when reviewing infrastructure code, checker agents, or Gherkin scenarios for a common mistake before it ships, or when explaining why a pattern is discouraged.
- [Behaviour-Driven Development](../behaviour-driven-development.md) — Canonical recursive Gherkin corpus, project-role adapter boundaries, exemptions, coverage, and execution rules for every behaviour owner. Use when adding or reviewing a scenario, test adapter, target, or gate.
- [BDD Spec-to-Test Mapping](./bdd-spec-test-mapping.md) — Compatibility entry point for older mapping references; delegates to the canonical BDD standard.
- [Best Practices for Infrastructure Development](./best-practices.md) — Index of best practices for managing development infrastructure — temporary files, report generation, execution tracking, acceptance criteria, and audit trails — split across focused child documents. Use when looking for best-practice guidance on temporary file handling, report naming/generation, execution tracking, Gherkin acceptance criteria, or audit-trail hygiene, and need to find the right child document.
- [Build-Artifact Sweeper Convention](./build-artifact-sweeper.md) — An ambient scheduled sweeper deletes gitignored build output and caches on the host machine at any time — a missing artifact is expected environmental behaviour to regenerate and continue from, never an incident to investigate. Use when a build artifact is unexpectedly missing and you need to decide whether it's a defect or expected sweeper behaviour.
- [CI/CD Conventions](./ci-conventions.md) — Central reference for CI/CD conventions in the multi-language Nx monorepo. Use when writing or reviewing a git hook, CI workflow, Dockerfile, or test setup.
- [Docker Monorepo Build Patterns](./docker-monorepo-builds.md) — Patterns and pitfalls for building Docker images in an npm workspace monorepo. Use when building or debugging a Docker image for an app inside this npm workspace monorepo, or when a build fails to resolve a shared `libs/` package.
- [GitHub Actions Workflow Naming Convention](./github-actions-workflow-naming.md) — Domain-first filename grammar and name-mirrors-filename rule for all workflow files. Use when naming a new GitHub Actions workflow file or its `name:` field, or when auditing an existing workflow filename/name pair for alignment.
- [Nx Target Naming Convention](./nx-target-naming.md) — Derivation rules for Nx target names, covering the `{domain}:{work}` scheme for governance and validation targets and the lifecycle naming scheme for build/test targets. Use when naming a new Nx target or Rhino subcommand, or deciding whether a check belongs in lint-staged.
- [Nx Target Standards](./nx-targets.md) — Standardized Nx target definitions for apps and libs in the monorepo. Use when defining, naming, or auditing Nx targets in a project's project.json.
- [Temporary Files Convention](./temporary-files.md) — Guidelines for AI agents creating temporary uncommitted files and folders. Use when an AI agent needs to create a temporary uncommitted file or folder — a report, a scratch file, or anything not meant for git.
- [Vercel Deployment Convention](./vercel-deployment.md) — Rules for configuring vercel.json when Nx build targets must run before the framework build. Use when configuring `vercel.json` for a Vercel-deployed app whose Nx `build` target has `dependsOn` prerequisites.
- [Vercel MCP Capability Convention](./vercel-mcp.md) — The Vercel MCP server is an assumed capability for plans touching a Vercel-deployed surface, probed at planning time and again at execution Phase 0. Use when a plan or its execution touches a Vercel-deployed surface and you need to know whether the Vercel MCP capability is assumed available, what it may be used for, or how to proceed when it is absent.

## Related Documentation

- [Development Index](../README.md) — All development practices
- [Behaviour-Driven Development](../behaviour-driven-development.md) — Defines `test:unit`/`test:integration`/`test:e2e` per isolation level
- [Explicit Over Implicit Principle](../../principles/software-engineering/explicit-over-implicit.md) — Why clear organization matters
- [AI Agents Convention](../agents/ai-agents.md) — Agent development standards
- [Repository Architecture](../../repository-governance-architecture.md) — Six-layer governance model

## Principles and Conventions

Respects [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) (explicit temporary-file locations, explicit target declarations), [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) (Gherkin criteria, consistent target naming enable workspace-wide automation), and [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) (minimal required target set per project type). Aligns with the [Plans Organization](../../conventions/structure/plans.md) and [File Naming](../../conventions/structure/file-naming.md) conventions for acceptance-criteria format and temporary-file/target naming patterns.
