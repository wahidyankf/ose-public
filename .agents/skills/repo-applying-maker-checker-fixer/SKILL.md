---
name: repo-applying-maker-checker-fixer
description: Three-stage content quality workflow pattern (Maker creates, Checker validates, Fixer remediates) with detailed execution workflows. Use when working with content quality workflows, validation processes, audit reports, or implementing maker/checker/fixer agent roles.
---

# Maker-Checker-Fixer Pattern (Comprehensive)

Complete guidance on the three-stage content quality workflow pattern used across repository agent families for systematic content creation, validation, and remediation.

## Purpose

Use when implementing content quality workflows, working with maker/checker/fixer agents, validating content against conventions, applying validated fixes from audit reports, or creating new checker/fixer agents.

## The Three Stages

**Maker** creates/updates content with cascading dependency management. **Checker** validates content against conventions and generates a criticality-categorized audit report (non-destructive). **Fixer** re-validates each finding, then applies only HIGH-confidence fixes, skipping MEDIUM and FALSE_POSITIVE for manual review.

See [Stage 1: Maker and Stage 2 Checker Role](./reference/stage1-maker-and-checker-role.md) for the Maker workflow and the Checker's role/criticality categories.

The Checker's 5-step process (Initialize → Validate → Finalize) is detailed in [Checker Workflow: 5-Step Process](./reference/checker-workflow-steps.md) and [Checker Report Finalization and Progressive Writing](./reference/checker-finalization.md).

The Fixer's 6-step process is detailed across [Fixer Role, Priority, and Report Discovery](./reference/fixer-role-and-detection.md), [Fixer Mode Parameter Handling and Fix Application](./reference/fixer-mode-and-application.md) (lax/normal/strict/ocd), and [Fix Report Structure and Trust Model](./reference/fixer-reporting-and-trust.md) (why fixers lack web tools).

## Lifecycle-Owned Validation

Before any quality-gate checker, fixer, or recheck invocation, apply the canonical
[lifecycle ownership Step 0](../../../repo-governance/development/workflow/quality-gate-contract.md).
Exclude registry-owned predicates from prompts and report them through `lifecycle-status`; keep
`final-status` domain-only.

## Common Workflows and Agent Families

See [Common Workflows and Agent Families](./reference/common-workflows-and-agent-families.md) for the basic and iterative maker→checker→fixer sequences and the repository-wide list of agent families using this pattern.

## Best Practices and Common Mistakes

See [Best Practices and Common Mistakes](./reference/best-practices-and-common-mistakes.md) for role-specific DO/DON'T guidance and the most common mistakes for all roles, checkers, and fixers.

## Tool Requirements

See [Tool Requirements](./reference/tool-requirements.md) for the typical tool set for checkers (read-only + report generation) and fixers (no web tools — trust checker's verification).

## Preventing Iteration Loops

Without explicit safeguards, checker-fixer workflows can loop indefinitely. See [Preventing Iteration Loops](./reference/preventing-iteration-loops.md) for the four structural safeguards: FALSE_POSITIVE persistence, scoped re-validation, self-verification after bash edits, and escalation after repeated disagreements.

## Integration with Conventions

The pattern integrates with:

- **[Criticality Levels Convention](../../../repo-governance/development/quality/criticality-levels.md)** - Checkers categorize by criticality, fixers use for priority
- **[Fixer Confidence Levels Convention](../../../repo-governance/development/quality/fixer-confidence-levels.md)** - Fixers assess confidence, combine with criticality
- **[Temporary Files Convention](../../../repo-governance/development/infra/temporary-files.md)** - Checker/fixer reports stored in `local-tmp/<agent-family>/`
- **[Repository Validation Methodology](../../../repo-governance/development/quality/repository-validation.md)** - Standard validation patterns
- **[AI Agents Convention](../../../repo-governance/development/agents/ai-agents.md)** - Agent structure, tool permissions, color coding

## References

- **[Maker-Checker-Fixer Pattern Convention](../../../repo-governance/development/pattern/maker-checker-fixer.md)** - Complete pattern documentation
- **[Criticality Levels Convention](../../../repo-governance/development/quality/criticality-levels.md)** - Severity classification
- **[Fixer Confidence Levels Convention](../../../repo-governance/development/quality/fixer-confidence-levels.md)** - Confidence assessment
- **[Temporary Files Convention](../../../repo-governance/development/infra/temporary-files.md)** - Report file organization and naming
- **[Repository Validation Methodology](../../../repo-governance/development/quality/repository-validation.md)** - Validation patterns

## Related Skills

- `repo-assessing-criticality-confidence` - Deep dive into criticality/confidence levels and priority matrix
- `repo-generating-validation-reports` - UUID chain generation, report format, progressive writing
- `repo-understanding-repository-architecture` - Understanding the six-layer governance and where patterns fit
