---
description: Collects success metrics, related sibling workflows, operational notes, and the principles/conventions/documentation this workflow implements and references.
when_to_use: Use when looking for related workflows, tracking success metrics across runs, or tracing which principles and conventions this workflow implements.
---

# Workflow Metadata and References

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed for EXCELLENT status
- **Success rate**: Percentage reaching zero findings and coverage targets
- **Common issues**: What problems appear most frequently (imports, annotations, diagrams)
- **Fix success rate**: Percentage of fixes applied without errors
- **Tutorial improvement velocity**: Example count and coverage increase per iteration

## Related Workflows

This workflow is part of the **Tutorial Quality Family**:

- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: General pattern
- **docs-tutorial workflow**: General tutorial validation
- **ayokoding-web-swe-by-example-quality-gate** (this workflow): Specialized for by-example tutorials
- **ayokoding-web workflow**: General content validation

## Notes

- **User-driven**: Requires manual decision points (user review), not fully automated
- **Iterative**: Multiple checker-fixer cycles until quality achieved
- **Bounded**: Max-iterations prevents runaway execution
- **Observable**: Generates detailed audit and fix reports
- **Flexible**: Auto-fix-level parameter controls automation degree
- **Focused**: Specialized for by-example tutorials only (not general tutorials)

**Parallelization**: Currently executes sequentially due to user decision points (maker-checker-fixer pattern). The `max-concurrency` parameter is reserved for future enhancements where validation dimensions could run concurrently after user approval.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, decisions, and criteria are explicit
- PASS: **Automation Over Manual**: Automated validation and fixing where safe
- PASS: **Quality Over Speed**: Iterative refinement until excellent
- PASS: **Convention Over Configuration**: Standardized by-example validation criteria
- PASS: **Simplicity Over Complexity**: Clear flow despite maker-checker-fixer complexity
- PASS: **Progressive Disclosure**: Can adjust iteration limits and auto-fix levels

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1

## Related Documentation

- **[By-Example Tutorial Convention](../../../conventions/tutorials/swe-by-example.md)**: Quality standards
- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: Workflow pattern
- **[Fixer Confidence Levels](../../../development/quality/fixer-confidence-levels.md)**: Confidence assessment
- **[`apps-ayokoding-www-by-example-checker` agent](../../../../.agents/agents/apps-ayokoding-www-by-example-checker.md)**: Validation agent
- **[`apps-ayokoding-www-by-example-fixer` agent](../../../../.agents/agents/apps-ayokoding-www-by-example-fixer.md)**: Fixing agent
- **[`apps-ayokoding-www-by-example-maker` agent](../../../../.agents/agents/apps-ayokoding-www-by-example-maker.md)**: Content creation agent
