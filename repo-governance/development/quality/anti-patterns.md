---
description: Catalog of eleven common quality-development anti-patterns and why each undermines reliability, maintainability, or consistency.
when_to_use: "Use when reviewing a change for a common quality anti-pattern."
---

# Anti-Patterns in Quality Development

> **Companion Document**: For positive guidance on what to do, see [Best Practices](../quality/best-practices.md)

## Documents

- [Anti-Patterns 1-3](./anti-patterns/anti-patterns-1-3.md) — Manual quality checks, no issue prioritization, fixes without confidence assessment. Use when reviewing for these three quality anti-patterns.
- [Anti-Patterns 4-6](./anti-patterns/anti-patterns-4-6.md) — Deleting content without preservation, running tests in a git hook, ad-hoc validation logic. Use when reviewing for these three quality anti-patterns.
- [Anti-Patterns 7-9](./anti-patterns/anti-patterns-7-9.md) — Ignoring criticality in fixes, no CI quality gates, undocumented validation rules. Use when reviewing for these three quality anti-patterns.
- [Anti-Patterns 10-11](./anti-patterns/anti-patterns-10-11.md) — Formatting the entire repo on every commit, mixing test levels. Use when reviewing for these two quality anti-patterns.
- [Summary of Anti-Patterns](./anti-patterns/summary-of-anti-patterns.md) — A quick-reference summary table of all eleven anti-patterns. Use for a quick-reference summary of all anti-patterns.

## Conclusion

Avoiding these anti-patterns ensures:

- Automated quality enforcement
- Clear issue prioritization
- Safe automated remediation
- Preserved documentation value
- Fast feedback loops
- Consistent validation patterns
- Priority-based fix execution
- Strong CI quality gates
- Well-documented rules
- Efficient incremental quality

When implementing quality processes, ask: **Am I adding automation or friction?** If friction, refactor to follow quality development best practices.

## Overview and Purpose

### Overview

Understanding common mistakes in quality development helps teams build more reliable, maintainable, and consistent codebases. These anti-patterns cause quality issues, technical debt, and maintenance burden.

### Purpose

This document provides:

- Common anti-patterns in quality development
- Examples of problematic implementations
- Solutions and corrections for each anti-pattern
- Quality and maintenance considerations

## Related Documentation

- [Code Quality Convention](./code.md) - Automated quality tools and git hooks
- [Behaviour-Driven Development](../behaviour-driven-development.md) - Mandatory Unit proof and boundary-applicable Integration/E2E rules
- [Criticality Levels Convention](./criticality-levels.md) - Issue categorization
- [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) - Confidence assessment
- [Repository Validation Methodology](./repository-validation.md) - Validation patterns
- [Nx Target Standards](../infra/nx-targets.md) - Canonical target names and CI execution model
- [Best Practices](./best-practices.md) - Recommended patterns

## Principles and Conventions Implemented/Respected

### Principles Implemented/Respected

- **Automation Over Manual**: Git hooks, CI gates, automated validation
- **Documentation First**: Preserve content, document validation rules
- **Explicit Over Implicit**: Clear criticality, documented rationale
- **Simplicity Over Complexity**: Incremental quality, affected tests only

### Conventions Implemented/Respected

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, clear problem/solution format in documentation
- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Quality documents follow standardized kebab-case naming
- **[Linking Convention](../../conventions/formatting/linking.md)**: GitHub-compatible links to related quality documentation
