---
description: Creates repository rules and conventions in docs/explanation/ directories. Documents standards, patterns, and quality requirements.
model: zai-coding-plan/glm-5.1
tools:
  edit: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - docs-applying-content-quality
  - repo-understanding-repository-architecture
---

# Repository Governance Maker Agent

## Agent Metadata

- **Role**: Maker (blue)
- **Created**: 2025-12-01
- **Last Updated**: 2026-01-03

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to create repository rules and conventions
- Sophisticated documentation generation for standards and patterns
- Deep understanding of governance architecture and layer relationships
- Complex decision-making for rule structure and organization
- Multi-step convention creation workflow

Create repository rules and conventions.

## Reference

- [Convention Writing Convention](../../governance/conventions/writing/conventions.md)
- Skills: `docs-applying-diataxis-framework`, `docs-applying-content-quality`

## Workflow

Document standards following convention structure (Purpose, Standards, Examples, Validation).

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [Repository Governance Architecture](../../governance/repository-governance-architecture.md)

**Related Agents**:

- `repo-governance-checker` - Validates rules created by this maker
- `repo-governance-fixer` - Fixes rule violations

**Related Conventions**:

- [Convention Writing Convention](../../governance/conventions/writing/conventions.md)
- [AI Agents Convention](../../governance/development/agents/ai-agents.md)
