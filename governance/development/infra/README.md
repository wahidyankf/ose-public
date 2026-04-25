# Infrastructure Development

Development infrastructure standards covering temporary files, build artifacts, and acceptance criteria.

## Purpose

These standards define **HOW to manage development infrastructure**, including where AI agents should create temporary files, how build artifacts are organized, and how to write testable acceptance criteria using Gherkin format.

## Scope

**✅ Belongs Here:**

- Temporary file organization
- Build artifact management
- Acceptance criteria standards
- Development infrastructure patterns
- Nx target naming standards and caching rules

**❌ Does NOT Belong:**

- Production infrastructure (deployment, hosting)
- Content organization (that's conventions/)
- Development workflow (that's workflow/)

## Documents

- [Acceptance Criteria Convention](./acceptance-criteria.md) - Writing testable acceptance criteria using Gherkin format for clarity and automation
- [BDD Spec-to-Test Mapping Convention](./bdd-spec-test-mapping.md) - Mandatory 1:1 mapping between CLI commands and Gherkin specifications
- [CI/CD Conventions](./ci-conventions.md) - Central reference for CI/CD conventions: git hooks, test level definitions, coverage thresholds, Docker patterns, GitHub Actions structure, and naming rules
- [Docker Monorepo Build Patterns](./docker-monorepo-builds.md) - Patterns and pitfalls for building Docker images in an npm workspace monorepo (symlink resolution, direct node_modules injection, transitive dependency hoisting)
- [GitHub Actions Workflow Naming Convention](./github-actions-workflow-naming.md) - Workflow filenames must mirror their `name:` field using a consistent kebab-case derivation rule
- [Nx Target Standards](./nx-targets.md) - Standard Nx targets that apps and libs must expose, canonical target names, caching rules, build output conventions, and the four-dimension tag scheme for `project.json`
- [Temporary Files Convention](./temporary-files.md) - Guidelines for AI agents creating temporary uncommitted files and folders
- [Vercel Deployment Convention](./vercel-deployment.md) - Rules for configuring `vercel.json` when Nx build targets must run before the framework build

## Companion Documents

- [Anti-Patterns](./anti-patterns.md) - Common infrastructure mistakes to avoid (with examples and corrections)
- [Best Practices](./best-practices.md) - Recommended infrastructure patterns and techniques

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Three-Level Testing Standard](../quality/three-level-testing-standard.md) - Defines what `test:unit`, `test:integration`, and `test:e2e` must do at each isolation level for all projects
- [Explicit Over Implicit Principle](../../principles/software-engineering/explicit-over-implicit.md) - Why clear organization matters
- [AI Agents Convention](../agents/ai-agents.md) - Agent development standards
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Temporary Files Convention defines explicit locations for agent-generated files, making it clear where temporary artifacts should be stored. Nx Target Standards require every project to declare its capabilities through explicit, consistently named targets.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Gherkin acceptance criteria enable automated testing and validation, ensuring requirements are met through executable specifications. Consistent target naming (e.g., `test:quick`) enables workspace-level automation across all project types without special cases.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Nx Target Standards define a minimal required target set per project type — each project exposes only the targets it needs, no more.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Plans Organization Convention](../../conventions/structure/plans.md)**: Acceptance criteria format aligns with Gherkin standard used for project planning and requirement specification.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Temporary files follow naming patterns with UUID chains and timestamps for traceability and collision prevention. Nx target names follow the kebab-case + colon-variant pattern defined in the Nx Target Standards.
