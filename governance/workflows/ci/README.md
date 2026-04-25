# CI Workflows

Orchestrated workflows for validating CI/CD compliance across all projects in the repository.

## Purpose

These workflows define **WHEN and HOW to validate CI/CD standards**, orchestrating ci-checker and ci-fixer agents to ensure all projects conform to documented CI conventions, workflow structure, and infrastructure requirements.

## Scope

**Workflows Here:**

- CI/CD standards compliance validation
- Project-level CI configuration checking
- Iterative check-fix-verify cycles with bounded iterations

**Not Included:**

- CI/CD convention definitions (that's development/infra/)
- Repository governance validation (that's repository/)
- Content quality validation (that's docs/)

## Workflows

- [CI Quality Gate](./ci-quality-gate.md) - Validate all projects conform to CI/CD standards defined in governance, then iteratively fix non-compliance until zero findings. Supports bounded iteration with configurable max-iterations

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [CI/CD Conventions](../../development/infra/ci-conventions.md) - The standards these workflows validate
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model
