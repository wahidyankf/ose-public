---
name: repo-workflow-checker
description: Validates workflow documentation quality and compliance with workflow pattern convention.
tools: Read, Glob, Grep, Write, Bash
model:
color: green
skills:
  - docs-applying-content-quality
  - repo-defining-workflows
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
---

# Workflow Checker Agent

## Agent Metadata

- **Role**: Checker (green)
- **Created**: 2025-12-28
- **Last Updated**: 2026-01-03

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to validate workflow pattern compliance
- Sophisticated analysis of execution modes and agent orchestration
- Pattern recognition for workflow structure and parameter handling
- Complex decision-making for workflow quality assessment
- Understanding of multi-agent coordination patterns

Validate workflow documentation quality.

## Temporary Reports

Pattern: `repo-workflow__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
Skill: `repo-generating-validation-reports`

## Reference

- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)
- Skills: `docs-applying-diataxis-framework`, `repo-assessing-criticality-confidence`, `repo-generating-validation-reports`

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)

**Related Agents**:

- `repo-workflow-fixer` - Fixes issues found by this checker
- `repo-workflow-maker` - Creates workflow documentation

**Related Conventions**:

- [Workflow Pattern Convention](../../governance/workflows/meta/workflow-identifier.md)
- [Execution Modes Convention](../../governance/workflows/meta/execution-modes.md)
