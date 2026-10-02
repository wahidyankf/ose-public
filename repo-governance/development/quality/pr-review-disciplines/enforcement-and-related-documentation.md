---
description: "How this convention is enforced, and related references."
when_to_use: "Use to locate the automated enforcement or a related convention."
---

# Enforcement, and Related Documentation

## Enforcement

This convention is enforced by:

- **`rules-checker`**: audits the eleven pr-review agent definitions (nine lens checkers, `pr-review-scout`, and `pr-review-checker`) against the
  discipline table's owned/routed-to scope and flags a specialist charter that omits its
  `SUPPRESS` block, misstates a routing target, or contradicts a grey-zone ruling.
- **`pr-review-checker`**: applies the boundary tie-breaker rule and the seven grey-zone
  rulings live, during its re-categorize function, against every raw finding the nine specialists
  emit.

Neither the agent definitions nor their prompts are edited here — this document records the
disciplines, the tie-breaker, the grey zones, and the cost/noise mechanics those agents implement.

## Related Documentation

- [PR Leak Review workflow](../../../workflows/quality/pr-leak-review.md) - Mandatory exact-head leak-only review.
- [PR Review Cycle workflow](../../../workflows/quality/pr-review-quality-gate.md) - Optionally orchestrates
  the fan-out → synthesize → fixer loop this convention's disciplines and tie-breaker feed
- [PR Merge Protocol Convention](../../workflow/pr-merge-protocol.md) - The five hardened merge
  preconditions that gate on this pipeline's review-cycle completion
- [Criticality Levels Convention](.././criticality-levels.md) - CRITICAL/HIGH/MEDIUM/LOW severity
  scale every specialist inherits unchanged
- [Maker-Checker-Fixer Pattern](../../pattern/maker-checker-fixer.md) - The three-role pattern this
  fan-out variant adapts into nine lens checkers plus one coordinating checker
- [CI Blocker Resolution Convention](.././ci-blocker-resolution.md) - Root-cause-first handling of CI
  blockers that the CI-gaming/test-integrity discipline enforces at review time
- [Regression Test Mandate](.././regression-test-mandate.md) - Every bug fix needs a reproducing test;
  owned by the CI-gaming/test-integrity discipline, not correctness
- [Feature Change Completeness Convention](.././feature-change-completeness.md) - Companion-artifact
  completeness underlying grey-zone ruling (d)
- [Root Cause Orientation Principle](../../../principles/general/root-cause-orientation.md) - Underlies
  the discipline split's CI-gaming watch
- [AGENTS.md](../../../../AGENTS.md) - Primary guidance; lists the PR Review Cycle agent family
