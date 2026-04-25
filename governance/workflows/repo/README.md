# Repository Workflows

Orchestrated workflows for validating repository-level operations across principles, conventions, development practices, and agents.

## Purpose

These workflows define **WHEN and HOW to validate repository rules**, orchestrating repo-rules-checker and repo-rules-fixer agents to ensure consistency across all governance layers (principles, conventions, development practices, agents).

## Scope

**✅ Workflows Here:**

- Repository-wide consistency validation
- Cross-layer governance checking
- Agent standards enforcement
- Iterative check-fix-verify cycles

**❌ Not Included:**

- Content quality validation (that's docs/)
- Hugo content validation (that's ayokoding-web/)
- Plan validation (that's plan/)

## Workflows

- [Repository Rules Validation](./repo-rules-quality-gate.md) - Validate repository consistency across all layers (principles, conventions, development, agents) and apply fixes iteratively until ZERO findings. Supports four strictness modes (lax, normal, strict, ocd)
- [ose-primer Sync Execution](./repo-ose-primer-sync-execution.md) - Single-pass sync orchestration between `ose-public` and `ose-primer`. Dispatches the adoption-maker or propagation-maker agent, collects its report, and (in apply mode) surfaces the resulting primer PR URL.
- [ose-primer Extraction Execution](./repo-ose-primer-extraction-execution.md) - One-time orchestration for Phase 8 of the 2026-04-18 ose-primer-separation plan. Runs the primer-parity gate, a bounded catch-up loop, and ten ordered extraction commits (A → J) with per-commit CI verification.

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model these workflows enforce
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Core Principles](../../principles/README.md) - Layer 1 governance
