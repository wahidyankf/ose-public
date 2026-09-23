---
description: Catalog of ten actionable best practices for code quality, validation, and content preservation.
when_to_use: "Use when looking for a proven practice to apply during quality-focused development."
---

# Best Practices for Quality Development

> **Companion Document**: For common mistakes to avoid, see [Anti-Patterns](../quality/anti-patterns.md)

## Documents

- [Best Practices 1-3](./best-practices/best-practices-1-3.md) — Automate quality checks in git hooks, use criticality for prioritization, assess fixer confidence. Use when applying these three quality best practices.
- [Best Practices 4-6](./best-practices/best-practices-4-6.md) — Preserve content during refactoring, run affected tests only, use standardized validation patterns. Use when applying these three quality best practices.
- [Best Practices 7-9](./best-practices/best-practices-7-9.md) — Combine criticality and confidence, enable staged-path gates, document validation rules. Use when applying these three quality best practices.
- [Best Practices 10](./best-practices/best-practices-10.md) — Fail the build on quality violations in CI. Use when wiring a quality gate to fail CI on violation.

## Overview and Purpose

### Overview

This document outlines best practices for maintaining code quality, validation methodologies, and content preservation. Following these practices ensures high-quality, consistent, and well-validated codebases.

### Purpose

Provide actionable guidance for:

- Automated quality enforcement
- Repository validation
- Criticality and confidence assessment
- Content preservation during refactoring
- Quality gate implementation

## Principles and Conventions Implemented/Respected

### Principles Implemented/Respected

- **Automation Over Manual**: Git hooks, automated validation, CI enforcement
- **Documentation First**: Preserve content, document validation rules
- **Explicit Over Implicit**: Clear criticality levels, confidence assessment
- **Simplicity Over Complexity**: Incremental quality, affected tests only

### Conventions Implemented/Respected

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, clear documentation of quality practices
- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Quality documents and reports follow standardized naming
- **[Dynamic Collection References Convention](../../conventions/writing/dynamic-collection-references.md)**: Avoid hardcoded counts in quality reports

## Related Documentation

- [Code Quality Convention](./code.md) - Automated quality tools and git hooks
- [Behaviour-Driven Development](../behaviour-driven-development.md) - Mandatory Unit proof and boundary-applicable Integration/E2E architecture
- [Criticality Levels Convention](./criticality-levels.md) - Issue categorization
- [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) - Confidence assessment
- [Repository Validation Methodology](./repository-validation.md) - Validation patterns
- [Nx Target Standards](../infra/nx-targets.md) - Canonical target names and CI execution model
- [Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid

## Summary

Following these best practices ensures:

1. Automate quality checks in git hooks
2. Use criticality levels for prioritization
3. Assess fixer confidence before applying
4. Preserve content during refactoring
5. Run affected tests only in pre-push
6. Use standardized validation patterns
7. Combine criticality and confidence for priority
8. Enable staged-path gates for incremental quality
9. Document validation rules and rationale
10. Fail build on quality violations in CI

Quality development following these practices is automated, systematic, and maintainable.
