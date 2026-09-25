---
description: Collects success metrics, related sibling workflows, operational notes, and the principles/conventions/documentation this workflow implements and references.
when_to_use: Use when looking for related workflows, tracking success metrics across runs, or tracing which principles and conventions this workflow implements.
---

# Workflow Metadata and References

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed for EXCELLENT status
- **Success rate**: Percentage reaching zero findings and floor targets
- **Common issues**: What problems appear most frequently (density, missing artifacts, mode
  mismatches)
- **Fix success rate**: Percentage of fixes applied without errors
- **Tutorial improvement velocity**: Worked-example/scenario count increase per iteration

## Related Workflows

This workflow is part of the **Tutorial Quality Family**:

- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: General
  pattern
- **[AyoKoding Web By-Example Quality Gate](../ayokoding-web-swe-by-example-quality-gate.md)**:
  Sibling workflow for language-syntax-centric topics
- **[AyoKoding Web Primer Quality Gate](../ayokoding-web-primer-quality-gate.md)**: Sibling
  workflow for "Just Enough X" language/tool on-ramps
- **ayokoding-web-general-quality-gate**: General content validation

## Notes

- **User-driven**: Requires manual decision points (user review), not fully automated
- **Iterative**: Multiple checker-fixer cycles until quality achieved
- **Bounded**: Max-iterations prevents runaway execution
- **Observable**: Generates detailed audit and fix reports
- **Flexible**: Auto-fix-level parameter controls automation degree
- **Focused**: Specialized for Annotated-concept tutorials only (both modes), not By Example or
  Primer tutorials

**Parallelization**: Currently executes sequentially due to user decision points
(maker-checker-fixer pattern). The `max-concurrency` parameter is reserved for future enhancements
where validation dimensions could run concurrently after user approval.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, decisions, and criteria are explicit — including
  the mandatory mode-detection step
- PASS: **Automation Over Manual**: Automated validation and fixing where safe
- PASS: **Quality Over Speed**: Iterative refinement until excellent
- PASS: **Convention Over Configuration**: Standardized Annotated-concept validation criteria
- PASS: **Simplicity Over Complexity**: Clear flow despite maker-checker-fixer complexity
- PASS: **Progressive Disclosure**: Can adjust iteration limits and auto-fix levels

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow file follows
  plain name convention for workflows
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use
  GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Active voice, proper
  heading hierarchy, single H1

## Related Documentation

- **[Tutorial Convention](../../../conventions/tutorials/general.md)**: Base tutorial standards
- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: Workflow
  pattern
- **[Fixer Confidence Levels](../../../development/quality/fixer-confidence-levels.md)**: Confidence
  assessment
- **[`apps-ayokoding-www-annotated-concept-checker` agent](../../../../.agents/agents/apps-ayokoding-www-annotated-concept-checker.md)**:
  Validation agent
- **[`apps-ayokoding-www-annotated-concept-fixer` agent](../../../../.agents/agents/apps-ayokoding-www-annotated-concept-fixer.md)**:
  Fixing agent
- **[`apps-ayokoding-www-annotated-concept-maker` agent](../../../../.agents/agents/apps-ayokoding-www-annotated-concept-maker.md)**:
  Content creation agent
