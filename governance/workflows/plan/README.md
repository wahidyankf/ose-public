# Plan Workflows

Orchestrated workflows for project planning quality validation and systematic execution.

## Purpose

These workflows define **WHEN and HOW to validate and execute plans**. The plan-quality-gate workflow orchestrates `plan-checker` and `plan-fixer` for authoring-time validation. The plan-execution workflow is orchestrated directly by the calling context (which delegates per-item work to specialized agents) and invokes `plan-execution-checker` for independent validation at the end.

## Scope

**✅ Workflows Here:**

- Plan quality validation
- Plan execution tracking
- Iterative plan improvement
- Multi-agent orchestration for plans/
- Check-fix-verify and execution cycles

**❌ Not Included:**

- Content quality validation (that's docs/)
- Hugo content validation (that's ayokoding-web/)
- Single-agent operations (use agents directly)

## Workflows

- [Plan Execution](./plan-execution.md) - Execute plan tasks systematically with validation and completion tracking; orchestrated directly by the calling context, validated by `plan-execution-checker`
- [Plan Quality Gate](./plan-quality-gate.md) - Validate plan completeness and accuracy, apply fixes iteratively until ZERO findings using plan-checker and plan-fixer

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Plans Organization Convention](../../conventions/structure/plans.md) - Plan structure standards
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model
