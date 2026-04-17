# Documentation Workflows

Orchestrated workflows for validating project documentation quality (docs/ directory).

## Purpose

These workflows define **WHEN and HOW to validate documentation**, orchestrating multiple checker and fixer agents in sequence to ensure factual accuracy, pedagogical structure, and link validity across all docs/ content.

## Scope

**✅ Workflows Here:**

- Documentation quality validation
- Tutorial quality validation
- Link validity checking
- Multi-agent orchestration for docs/
- Iterative check-fix-verify cycles

**❌ Not Included:**

- Hugo site validation (that's ayokoding-web/)
- README validation (that's separate workflow)
- Single-agent operations (use agents directly)

## Workflows

- [Documentation Quality Gate](./docs-quality-gate.md) - Validate all docs/ content quality (factual accuracy, pedagogical structure, link validity), apply fixes iteratively until ZERO findings
- [Documentation Software Engineering Separation Quality Gate](./docs-software-engineering-separation-quality-gate.md) - Validate software engineering documentation separation, apply fixes iteratively until ZERO findings

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Content Quality Principles](../../conventions/writing/quality.md) - Quality standards these workflows enforce
- [Tutorial Convention](../../conventions/tutorials/general.md) - Tutorial standards
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern

---

**Last Updated**: 2026-01-01
