# Fix Mermaid Validation and Violations

## Navigation

| Document                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, problem statements, success criteria, risks  |
| [prd.md](./prd.md)             | Product requirements, user stories, Gherkin acceptance criteria  |
| [tech-docs.md](./tech-docs.md) | Implementation details, fix strategies, batch delivery structure |
| [delivery.md](./delivery.md)   | Step-by-step delivery checklist                                  |

## Summary

Three-phase initiative to resolve direction-aware validation bugs in Mermaid diagram
checking and fix resulting violations across documentation.

## Core Problem

The validator contains a critical flaw: it evaluates the `width_exceeded` rule using
only the `span` metric, regardless of diagram direction. This causes false positives in
left-right oriented graphs, where the relevant dimension is `depth` (rank columns), not
`span` (row height).

## Three-Phase Approach

**Phase 0** updates `apps/rhino-cli/internal/mermaid/validator.go` to respect diagram
direction when selecting which dimension to validate. The fix distinguishes between
LR/RL diagrams (check `depth > MaxWidth`) and TD/TB/BT diagrams (check `span > MaxWidth`).

**Phase 1** systematically corrects violations across batches organized by documentation
area. Teams may apply fixes through direction flipping, sequential node chaining, diagram
splitting, or label shortening.

**Phase 2** propagates validated rules back into governance documentation, using
`repo-rules-maker` and `repo-rules-quality-gate` to ensure consistency and correctness.

## Success Criteria

- Direction-aware tests pass in the rhino-cli test suite
- Validator produces zero error lines (`✗`) after Phase 1 completion
- Governance documentation reflects updated width rules
- Quality gates pass in strict mode

## Baseline Audit

Audit run 2026-04-25 (direction-blind validator, MaxWidth=3, MaxDepth=5):

| Metric                      | Count |
| --------------------------- | ----- |
| Files with violations       | 102   |
| `width_exceeded` violations | 180   |
| `label_too_long` violations | 56    |
| `complex_diagram` warnings  | 14    |

## Post-Phase-0 Audit

Audit run 2026-04-25 (direction-aware validator, MaxWidth=4, MaxDepth=unlimited):

| Metric                  | Count | Notes                                       |
| ----------------------- | ----- | ------------------------------------------- |
| Files with violations   | 101   | 1 fewer than baseline (LR reclassification) |
| Total violations        | 218   | 18 fewer than baseline                      |
| `complex_diagram` warns | 0     | MaxDepth=unlimited eliminates all warnings  |

Batch breakdown for Phase 1:

| Batch | Area                   | Files |
| ----- | ---------------------- | ----- |
| 1     | TypeScript             | 17    |
| 2     | Python                 | 13    |
| 3     | Go                     | 12    |
| 4     | Elixir                 | 17    |
| 5     | JVM / Spring Boot      | 10    |
| 6     | Platform-web / Next.js | 13    |
| 7     | Architecture           | 10    |
| 8     | Remaining (misc)       | 9     |
