---
description: Creates workflow documentation in governance/workflows/ following workflow pattern convention.
model: inherit
tools:
  edit: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - docs-applying-content-quality
  - plan-writing-gherkin-criteria
  - repo-defining-workflows
  - docs-applying-diataxis-framework
---

# Workflow Maker Agent

## Agent Metadata

- **Role**: Maker (blue)
- **Created**: 2025-12-28
- **Last Updated**: 2026-01-03

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to create standardized workflow documentation
- Sophisticated workflow generation following pattern conventions
- Deep understanding of agent orchestration and execution modes
- Complex decision-making for workflow structure and parameters
- Multi-step workflow creation workflow

Create workflow documentation following workflow pattern convention.

## Reference

- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)
- Skills: `docs-applying-diataxis-framework`, `docs-applying-content-quality`

## Workflow

`docs-applying-diataxis-framework` Skill provides documentation organization.

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)

**Related Agents**:

- `repo-workflow-checker` - Validates workflows created by this maker
- `repo-workflow-fixer` - Fixes workflow violations

**Related Conventions**:

- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)
- [Execution Modes Convention](../../governance/workflows/meta/execution-modes.md)
