---
description: Workflows for checking that specifications remain coherent, complete, and actionable
when_to_use: Use when routing to a workflow that validates specs/ structural completeness, accuracy, or cross-spec coherence.
---

# Specs Workflows

Use these workflows when specifications need an independent quality pass. They check whether a spec remains coherent for people who need to understand the product as well as systems that need to validate it.

## Purpose

These workflows define **WHEN and HOW to validate specifications**, orchestrating specs-checker and specs-fixer agents to ensure structural completeness, content accuracy, internal consistency, and cross-folder coherence.

## Scope

**Workflows Here:**

- Specification structural and content validation
- Cross-spec consistency checking (shared domains, actors, terminology)
- C4 diagram accessibility and coherence
- Iterative check-fix-verify cycles with mode-based filtering

**Not Included:**

- Implementation code validation (that's `swe-code-maker` and CI)
- Test binding substance (use the [Gherkin implementation review](../gherkin-implementation-review.md))
- Repository governance (that's repository/)
- Documentation quality (that's docs/)

## Workflows

- [specs-quality-gate](./specs-quality-gate.md) — Validate explicitly listed specs/ folders for structural completeness, content accuracy, internal consistency, and cross-folder coherence, then apply fixes iteratively until zero findings. Use after creating or restructuring spec areas, before major spec refactors, after bulk feature-file changes, or after adding a new app/library to the monorepo.

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Behaviour-Driven Development](../../development/behaviour-driven-development.md) - Testing standard and scenario-to-adapter mapping that specs support
- [Gherkin Implementation Review](../gherkin-implementation-review.md) - Semantic adapter review
