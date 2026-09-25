---
name: repo-assessing-criticality-confidence
description: Universal classification system for checker and fixer agents using orthogonal criticality (CRITICAL/HIGH/MEDIUM/LOW importance) and confidence (HIGH/MEDIUM/FALSE_POSITIVE certainty) dimensions. Covers priority matrix (P0-P4), execution order, dual-label pattern for verification status, standardized report format, and domain-specific examples. Essential for implementing checker/fixer agents and processing audit reports
---

# Criticality-Confidence System Skill

## Purpose

This Skill provides comprehensive guidance on the **criticality-confidence classification system** used by all checker and fixer agents in the repository.

**When to use this Skill:**

- Implementing checker agents (categorizing findings)
- Implementing fixer agents (assessing confidence, determining priority)
- Processing audit reports
- Understanding priority execution order (P0-P4)
- Working with dual-label patterns (verification + criticality)
- Writing standardized audit reports

## Core Concepts

See [Core Concepts](./reference/core-concepts.md) for the two orthogonal dimensions (criticality and confidence) and their four/three levels respectively.

## Criticality × Confidence Priority Matrix

See [Priority Matrix](./reference/priority-matrix.md) for the P0-P4 decision matrix and the fixer's strict execution order.

## Checker Agent Responsibilities

See [Checker Responsibilities](./reference/checker-responsibilities.md) for the criticality decision tree, the standardized audit report format, and the dual-label pattern (verification + criticality) used by five agents.

## Fixer Agent Responsibilities

See [Fixer Responsibilities](./reference/fixer-responsibilities.md) for the re-validation process, confidence assessment steps, priority-based execution code patterns, and the fix report format.

## False Positives and Domain-Specific Examples

See [False Positives and Domain Examples](./reference/false-positives-and-domain-examples.md) for the false-positive report format and worked criticality examples across repo-governance, ayokoding-web, and documentation domains.

## Common Patterns

See [Common Patterns](./reference/common-patterns.md) for three worked examples: checker categorizing a finding, fixer assessing confidence, and a dual-label finding.

## Best Practices and Common Mistakes

See [Best Practices and Common Mistakes](./reference/best-practices-and-common-mistakes.md) for role-specific DO/DON'T guidance and the four most common classification mistakes.

## Creating Domain-Specific Confidence Examples

Fixer agents should include domain-specific examples of HIGH/MEDIUM/FALSE_POSITIVE confidence assessments to guide re-validation decisions. See [Purpose and Template](./reference/domain-examples-purpose-and-template.md), [Examples by Agent Family](./reference/domain-examples-by-agent-family.md) (docs-fixer, readme-fixer, docs-tutorial-fixer), and [Guidelines and Anti-Patterns](./reference/domain-examples-guidelines-and-notes.md) for placement and quality bar.

## References

**Primary Conventions**:

- [Criticality Levels Convention](../../../repo-governance/development/quality/criticality-levels.md) - Complete criticality system
- [Fixer Confidence Levels Convention](../../../repo-governance/development/quality/fixer-confidence-levels.md) - Complete confidence system

**Related Conventions**:

- [Repository Validation Methodology](../../../repo-governance/development/quality/repository-validation.md) - Standard validation patterns
- [Maker-Checker-Fixer Pattern](../../../repo-governance/development/pattern/maker-checker-fixer.md) - Three-stage workflow

**Related Skills**:

- `repo-applying-maker-checker-fixer` - Understanding three-stage workflow
- `docs-validating-factual-accuracy` - Verification label system

**Related Agents**:

All checker agents and fixer agents use this system. See [`.agents/agents/README.md`](../../../.agents/agents/README.md) for the complete catalog.

---

This Skill packages the critical criticality-confidence classification system for maintaining consistent quality validation and automated fixing. For comprehensive details, consult the primary convention documents.
