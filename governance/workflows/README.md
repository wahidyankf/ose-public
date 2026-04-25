---
title: "Workflows"
description: Orchestrated multi-step processes that compose AI agents for systematic content creation, validation, and remediation
category: explanation
subcategory: workflows
tags:
  - index
  - workflows
  - orchestration
  - agents
created: 2026-01-04
---

# Workflows Index

**Purpose**: Orchestrated multi-step processes that compose AI agents to achieve specific goals with clear termination criteria.

**Layer**: 5th layer in repository hierarchy (orchestrates Layer 4 agents)

## What Are Workflows?

Workflows are **composed processes** that:

- 🔄 Orchestrate multiple AI agents in sequence
- 🎯 Have clear goals and termination criteria
- 📊 Manage state between steps
- ⚡ Support parallel, sequential, and conditional execution
- 👤 Include human approval checkpoints
- ♻️ Are reusable and composable

**Key insight**: Workflows are to Agents what Agents are to Tools - a composition layer.

## Repository Hierarchy

Workflows are **Layer 5** in the six-layer architecture. See [Repository Governance Architecture](../repository-governance-architecture.md) for complete governance model.

```
Layer 0: Vision (WHY WE EXIST)     → Foundational purpose
Layer 1: Principles (WHY)          → Foundational values
Layer 2: Conventions (WHAT)        → Documentation rules
Layer 3: Development (HOW)         → Software practices
Layer 4: AI Agents (WHO)           → Atomic task executors
Layer 5: Workflows (WHEN)          → Multi-step processes ← YOU ARE HERE
```

## Quick Start

### Understanding Workflows

1. Read [Workflow Pattern Convention](./meta/workflow-identifier.md) for structure and rules
2. Create workflows as needed following the convention patterns
3. Review workflow families below

### Using Workflows

**How to execute workflows**:

```
User: "Run [workflow-name] workflow for [scope] in [mode] mode"
```

Workflows support two execution modes (see [Workflow Execution Mode Convention](./meta/execution-modes.md)):

**Agent Delegation (preferred)**: Invoke specialized agents via the Agent tool with `subagent_type`. Each agent runs in an isolated context, returns results to the orchestrating conversation, and file changes persist to the filesystem.

**Manual Orchestration (fallback)**: When agents are unavailable as subagent types, the AI assistant follows workflow steps directly using Read/Write/Edit tools in the main execution context.

All workflows support standard input parameters:

- **mode**: Quality threshold (lax/normal/strict/ocd) - default: normal
- **max-concurrency**: Parallel execution limit - default: 2
- **min-iterations**: Minimum check-fix cycles - optional
- **max-iterations**: Maximum check-fix cycles - optional

## Available Workflows

| Workflow                                                                                                                  | Purpose                                                                                                                                                                   | Agents Used                                                                                                                                                             | Complexity |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [Repository Rules Validation](./repo/repo-rules-quality-gate.md)                                                          | Validate repository consistency and apply fixes iteratively until ZERO findings                                                                                           | repo-rules-checker, repo-rules-fixer                                                                                                                                    | Medium     |
| [ose-primer Sync Execution](./repo/repo-ose-primer-sync-execution.md)                                                     | Single-pass sync between `ose-public` and `ose-primer` (adopt or propagate, dry-run or apply); in apply mode opens a draft PR against the primer                          | repo-ose-primer-adoption-maker, repo-ose-primer-propagation-maker                                                                                                       | Medium     |
| [ose-primer Extraction Execution](./repo/repo-ose-primer-extraction-execution.md)                                         | One-time Phase 8 orchestration for the 2026-04-18 ose-primer-separation plan: parity gate, bounded catch-up loop, and ten ordered extraction commits with CI verification | repo-ose-primer-propagation-maker (parity-check + apply modes)                                                                                                          | High       |
| [Plan Quality Gate](./plan/plan-quality-gate.md)                                                                          | Validate plan completeness and accuracy, apply fixes iteratively until ZERO findings                                                                                      | plan-checker, plan-fixer                                                                                                                                                | Medium     |
| [Plan Execution](./plan/plan-execution.md)                                                                                | Execute plan tasks systematically with validation and completion tracking (calling context orchestrates, delegates per-item to specialized agents)                        | plan-execution-checker                                                                                                                                                  | Medium     |
| [Documentation Quality Gate](./docs/docs-quality-gate.md)                                                                 | Validate all docs/ content quality (factual accuracy, pedagogical structure, link validity), apply fixes iteratively until ZERO findings                                  | docs-checker, docs-tutorial-checker, docs-link-checker, docs-fixer, docs-tutorial-fixer                                                                                 | High       |
| [AyoKoding Web General Quality Gate](./ayokoding-web/ayokoding-web-general-quality-gate.md)                               | Validate all ayokoding-web content quality (factual accuracy, links), apply fixes iteratively until ZERO findings                                                         | apps-ayokoding-web-general-checker, apps-ayokoding-web-facts-checker, apps-ayokoding-web-link-checker, apps-ayokoding-web-general-fixer, apps-ayokoding-web-facts-fixer | High       |
| [AyoKoding Web By-Example Quality Gate](./ayokoding-web/ayokoding-web-by-example-quality-gate.md)                         | Validate by-example tutorial quality (95% coverage through 75-85 examples) and apply fixes iteratively until EXCELLENT status achieved                                    | apps-ayokoding-web-by-example-checker, apps-ayokoding-web-by-example-fixer                                                                                              | Medium     |
| [AyoKoding Web In-the-Field Quality Gate](./ayokoding-web/ayokoding-web-in-the-field-quality-gate.md)                     | Validate in-the-field production guide quality and apply fixes iteratively until EXCELLENT status achieved                                                                | apps-ayokoding-web-in-the-field-checker, apps-ayokoding-web-in-the-field-fixer                                                                                          | Medium     |
| [Documentation Software Engineering Separation Quality Gate](./docs/docs-software-engineering-separation-quality-gate.md) | Validate software engineering documentation separation between OSE Platform style guides and AyoKoding educational content, apply fixes iteratively until ZERO findings   | docs-software-engineering-separation-checker, docs-software-engineering-separation-fixer                                                                                | Medium     |
| [Specs Validation](./specs/specs-quality-gate.md)                                                                         | Validate specs/ directory for structural completeness, content accuracy, cross-spec consistency, and C4 diagram correctness, apply fixes iteratively until ZERO findings  | specs-checker, specs-fixer                                                                                                                                              | Medium     |
| [UI Quality Gate](./ui/ui-quality-gate.md)                                                                                | Validate UI component quality (tokens, accessibility, patterns, dark mode, responsive), apply fixes iteratively until ZERO findings                                       | swe-ui-checker, swe-ui-fixer                                                                                                                                            | Medium     |
| [CI Quality Gate](./ci/ci-quality-gate.md)                                                                                | Validate all projects conform to CI/CD standards (Nx targets, coverage, Docker, Gherkin, workflows), apply fixes iteratively until ZERO findings                          | ci-checker, ci-fixer                                                                                                                                                    | Medium     |
| [Development Environment Setup](./infra/development-environment-setup.md)                                                 | Install and verify all 18+ polyglot toolchains required for development, testing, and git hooks across all projects                                                       | (manual orchestration — developer-guided)                                                                                                                               | High       |

All _-quality-gate workflows follow the [_-check-fix Workflow Pattern](./meta/workflow-identifier.md#-check-fix-workflow-pattern) which fixes ALL findings (CRITICAL, HIGH, MEDIUM, LOW criticality levels) and iterates until ZERO findings remain.

## Naming Rule

Every workflow filename follows: `<scope>(-<qualifier>)*-<type>`

- `scope` — top-level domain matching the parent directory (`ci`, `docs`, `plan`, `repo`, `specs`, `ui`, `infra`, `ayokoding-web`, etc.).
- `qualifier` — zero or more refinement tokens (e.g., `rules`, `by-example`, `software-engineering-separation`).
- `type` — exactly one trailing token from the Type Vocabulary below.

No other structure is permitted. No exceptions, except for reference material under `governance/workflows/meta/` (documented below).

Normative source: [Workflow Naming Convention](../conventions/structure/workflow-naming.md).

## Type Vocabulary

| Type           | Semantics                                                  | Example workflows                                            |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `quality-gate` | Iterative maker → checker → fixer loop until zero findings | `ci-quality-gate`, `plan-quality-gate`, `specs-quality-gate` |
| `execution`    | Executes a defined procedure or plan against inputs        | `plan-execution`                                             |
| `setup`        | One-time environment or resource provisioning              | `development-environment-setup`                              |

## Meta reference exception

Files under `governance/workflows/meta/` are **reference documentation about the workflow system** (e.g., `execution-modes.md`, `workflow-identifier.md`). They describe how workflows work, not workflows themselves. They are exempt from the type-suffix rule.

Enforcement: `rhino-cli workflows validate-naming` (wired into pre-push and CI).

## Workflow Families

### Documentation Workflows

Workflows for creating and validating documentation:

- **docs**: Project documentation (tutorials, how-to, reference, explanation)
- **readme**: README.md quality and engagement (planned - no workflow file yet)
- **plan**: Project planning documents

### Web Content Workflows

Workflows for web application content (Next.js sites, formerly Hugo):

- **ayokoding-web**: ayokoding-web content creation and validation
- **ayokoding-facts**: Factual accuracy validation for ayokoding-web (planned - no workflow file yet)
- **ayokoding-structure**: Navigation structure and weight management (planned - no workflow file yet)
- **oseplatform-web-content**: oseplatform-web content (planned - no workflow file yet)

### Specification Workflows

Workflows for specification quality:

- **specs**: Validate specs/ for structural completeness, content accuracy, cross-spec consistency, C4 diagrams

### UI Workflows

Workflows for UI component quality:

- **ui**: UI component quality validation (tokens, accessibility, patterns, dark mode, responsive)

### CI/CD Workflows

Workflows for CI/CD standards compliance:

- **ci-quality-gate**: Validate all projects conform to CI/CD conventions (Nx targets, coverage, Docker, Gherkin, workflows)

### Infrastructure Workflows

Workflows for development environment and infrastructure:

- **development-environment-setup**: Install and verify all toolchains for local development

### Repository Governance Workflows

Workflows for repository rules:

- **repo-rules**: Validate consistency across principles, conventions, development, agents, AGENTS.md

## Step Execution Patterns

Workflows support three step execution patterns:

### Sequential

Steps execute one after another:

```
Step 1 → Step 2 → Step 3 → Step 4
```

Later steps can reference outputs from earlier steps.

**Use when:** Step N requires outputs from step N-1 (e.g., Maker-Checker-Fixer where fixer needs checker's audit report).

### Parallel

Steps execute simultaneously:

```
        ┌─ Step 2a ─┐
Step 1 ─┼─ Step 2b ─┼─ Step 3
        └─ Step 2c ─┘
```

Improves efficiency when steps are independent.

**Use when:** Steps are independent and can run simultaneously for speed (e.g., validating multiple content types in parallel).

### Conditional

Steps execute only if conditions are met:

```
Step 1 → Step 2 (checkpoint) → Step 3 (if approved)
                            └→ Skip to Step 5 (if rejected)
```

Enables branching logic and human decision points.

**Use when:** Workflow branches based on user decisions or validation results (e.g., deploy to production only if tests pass).

## Human Checkpoints

Workflows pause for user approval at critical points:

- 🔍 **Review audit reports** - Before applying fixes
- ✅ **Approve deployments** - Before pushing to production
- 🎯 **Choose approach** - When multiple valid options exist
- 🛑 **Handle errors** - When automated recovery is insufficient

Human checkpoints use the `AskUserQuestion` tool.

## State Management

Workflows pass data between steps using references:

- `{input.name}` - Workflow input parameters
- `{stepN.outputs.name}` - Output from step N
- `{stepN.status}` - Status of step N (success/fail/partial)
- `{stepN.user-approved}` - User decision from checkpoint

## Workflow vs Plans

| Aspect    | Plans                              | Workflows                                    |
| --------- | ---------------------------------- | -------------------------------------------- |
| Purpose   | Strategic planning (WHAT to build) | Tactical execution (HOW to build)            |
| Audience  | Humans                             | Agents + Humans                              |
| Format    | Free-form Markdown                 | Structured Markdown with YAML                |
| Execution | Manual, guided by human            | Automated, orchestrated by workflow executor |
| Lifecycle | Created → Updated → Archived       | Created → Executed repeatedly → Deprecated   |
| Location  | `plans/` directory                 | `governance/workflows/`                      |

**Relationship**: Plans can reference workflows ("Use deployment-workflow for release"). Workflows can be generated from plan checklists.

## Creating New Workflows

To create a new workflow:

1. **Identify need**: 2 or more agents in sequence, or repeated process, or complex orchestration
2. **Design structure**: Define inputs, steps, outputs, goals, termination criteria
3. **Write workflow file**: Use plain descriptive name in the appropriate subdirectory of `governance/workflows/[category]/`
4. **Document thoroughly**: Purpose, when to use, example usage, related workflows
5. **Validate**: Check frontmatter schema, agent references, dependencies
6. **Test manually**: Run workflow steps to verify correctness
7. **Add to index**: Update this README with workflow description

See [Workflow Pattern Convention](./meta/workflow-identifier.md) for complete requirements.

## Validation

All workflows should be validated for:

- ✅ **Frontmatter completeness** - All required fields present
- ✅ **Agent existence** - All referenced agents exist in `.claude/agents/` (primary) or `.opencode/agent/` (secondary)
- ✅ **Type correctness** - Inputs/outputs use valid types
- ✅ **Dependency acyclicity** - No circular step dependencies
- ✅ **Reference resolution** - All `{stepN.outputs}` references resolve
- ✅ **File naming** - Plain name in correct subdirectory of `governance/workflows/`
- ✅ **Documentation quality** - Clear purpose, examples, termination criteria

Future: `workflow-validator` agent will automate this validation.

## Metrics and Observability

Track workflow performance:

- **Execution count** - How often workflows run
- **Success rate** - Percentage reaching "success" termination
- **Failure modes** - Common reasons for "partial" or "fail"
- **Step duration** - Time spent in each step (if measured)
- **Human intervention** - How often checkpoints pause workflows

## Principles Implemented/Respected

All workflows must respect core principles:

- ✅ **Explicit Over Implicit** - All steps, dependencies, conditions visible
- ✅ **Automation Over Manual** - Automate complex multi-step processes
- ✅ **Simplicity Over Complexity** - Break complex workflows into smaller ones
- ✅ **Progressive Disclosure** - Simple workflows stay simple
- ✅ **Accessibility First** - Human-readable format, clear documentation
- ✅ **No Time Estimates** - Define WHAT and HOW, not WHEN or HOW LONG

## Related Documentation

### Core Documentation

- [Workflow Pattern Convention](./meta/workflow-identifier.md) - How workflows are structured
- [Maker-Checker-Fixer Pattern](../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [AI Agents Convention](../development/agents/ai-agents.md) - How agents work

### Supporting Documentation

- [Fixer Confidence Levels](../development/quality/fixer-confidence-levels.md) - How fixers assess changes
- [Content Preservation](../development/quality/content-preservation.md) - Preserving meaning during fixes
- [Temporary Files](../development/infra/temporary-files.md) - Where workflow outputs go
- [Plans Organization](../conventions/structure/plans.md) - How plans relate to workflows

### Layer Documentation

- [Repository Governance Architecture](../repository-governance-architecture.md) - Complete six-layer architecture explanation
- [Vision](../vision/open-sharia-enterprise.md) - Layer 0: Foundational purpose
- [Core Principles](../principles/README.md) - Layer 1: Foundational values
- [Conventions](../conventions/README.md) - Layer 2: Documentation rules
- [Development](../development/README.md) - Layer 3: Software practices
- [AI Agents](../../.claude/agents/README.md) - Layer 4: Task executors

## Future Enhancements

Planned workflow features:

- 🤖 **Workflow Executor Agent** - Automate workflow execution
- 📊 **Workflow Visualization** - Auto-generate diagrams from definitions
- 🧪 **Workflow Testing** - Dry-run mode, validation suite
- 📈 **Metrics Dashboard** - Track workflow performance
- 🔄 **Workflow Composition** - Nest workflows within workflows
- ⏱️ **Timeouts and Retries** - Handle long-running or failing steps
- 🔙 **Rollback Support** - Undo steps on failure

## Questions?

- **What is a workflow?** - A composed multi-step process orchestrating agents
- **When should I create a workflow?** - When 2 or more agents are used repeatedly in sequence
- **How do I run a workflow?** - Use manual orchestration (see "Using Workflows" above)
- **Can workflows call other workflows?** - Yes, workflows are composable
- **Do workflows replace agents?** - No, workflows orchestrate agents
- **Do workflows replace plans?** - No, plans are strategic, workflows are tactical

See [Workflow Pattern Convention](./meta/workflow-identifier.md) and [Execution Modes Convention](./meta/execution-modes.md) for comprehensive answers.
