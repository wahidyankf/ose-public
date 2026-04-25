# AyoKoding Web Workflows

Orchestrated workflows for ayokoding-web content quality validation and management.

## Purpose

These workflows define **WHEN and HOW to validate ayokoding-web content**, orchestrating multiple agents in sequence to ensure content quality, factual accuracy, and link validity.

## Scope

**✅ Workflows Here:**

- General content quality validation (facts, links)
- By-example tutorial quality validation
- Multi-agent orchestration for ayokoding-web
- Iterative check-fix-verify cycles

**❌ Not Included:**

- Single-agent operations (use agents directly)
- Other Hugo sites (oseplatform-web has separate workflows)
- Non-workflow documentation (that's conventions/)

## Workflows

- [AyoKoding Web By-Example Quality Gate](./ayokoding-web-by-example-quality-gate.md) - Validate by-example tutorial quality (95% coverage through 75-90 examples) and apply fixes iteratively until EXCELLENT status
- [AyoKoding Web General Quality Gate](./ayokoding-web-general-quality-gate.md) - Validate all ayokoding-web content quality (factual accuracy, links), apply fixes iteratively until ZERO findings
- [AyoKoding Web In-the-Field Quality Gate](./ayokoding-web-in-the-field-quality-gate.md) - Validate in-the-field production guide quality and apply fixes iteratively until EXCELLENT status

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [AyoKoding Web Conventions](../../conventions/hugo/ayokoding.md) - Content conventions these workflows enforce
- [By Example Tutorial Convention](../../conventions/tutorials/by-example.md) - By-example standards
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
