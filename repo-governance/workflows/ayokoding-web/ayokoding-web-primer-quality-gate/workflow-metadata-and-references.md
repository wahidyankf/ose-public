---
description: Collects success metrics, related sibling workflows, operational notes, and the principles/conventions/documentation this workflow implements and references.
when_to_use: Use when looking for related workflows, tracking success metrics across runs, or tracing which principles and conventions this workflow implements.
---

# Workflow Metadata and References

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed for EXCELLENT status
- **Success rate**: Percentage reaching zero findings and coverage targets
- **Common issues**: What problems appear most frequently (imports, annotations, scope creep)
- **Fix success rate**: Percentage of fixes applied without errors
- **Primer improvement velocity**: Example count increase per iteration

## Related Workflows

This workflow is part of the **Tutorial Quality Family**:

- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: General
  pattern
- **[AyoKoding Web By-Example Quality Gate](../ayokoding-web-swe-by-example-quality-gate.md)**:
  Sibling workflow this format is authored at the same pace as
- **[AyoKoding Web Annotated-Concept Quality Gate](../ayokoding-web-annotated-concept-quality-gate.md)**:
  Sibling workflow for concept-centric subject topics
- **ayokoding-web-general-quality-gate**: General content validation

## Notes

- **User-driven**: Requires manual decision points (user review), not fully automated
- **Iterative**: Multiple checker-fixer cycles until quality achieved
- **Bounded**: Max-iterations prevents runaway execution
- **Observable**: Generates detailed audit and fix reports
- **Flexible**: Auto-fix-level parameter controls automation degree
- **Focused**: Specialized for Primer tutorials only (not By Example or Annotated-concept)

**Parallelization**: Currently executes sequentially due to user decision points
(maker-checker-fixer pattern). The `max-concurrency` parameter is reserved for future enhancements
where validation dimensions could run concurrently after user approval.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, decisions, and criteria are explicit — including
  the mandatory scope-discipline check
- PASS: **Automation Over Manual**: Automated validation and fixing where safe
- PASS: **Quality Over Speed**: Iterative refinement until excellent
- PASS: **Convention Over Configuration**: Standardized Primer validation criteria
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

- **[By-Example Tutorial Convention](../../../conventions/tutorials/swe-by-example.md)**: The
  mechanical standards Primer reuses at the same pace
- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: Workflow
  pattern
- **[Fixer Confidence Levels](../../../development/quality/fixer-confidence-levels.md)**: Confidence
  assessment
- **[`apps-ayokoding-www-primer-checker` agent](../../../../.agents/agents/apps-ayokoding-www-primer-checker.md)**:
  Validation agent
- **[`apps-ayokoding-www-primer-fixer` agent](../../../../.agents/agents/apps-ayokoding-www-primer-fixer.md)**:
  Fixing agent
- **[`apps-ayokoding-www-primer-maker` agent](../../../../.agents/agents/apps-ayokoding-www-primer-maker.md)**:
  Content creation agent
