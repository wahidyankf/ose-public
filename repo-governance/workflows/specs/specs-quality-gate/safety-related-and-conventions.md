---
description: "Covers the loop's infinite-loop and false-positive safeguards, related workflows, operating notes, and the principles/conventions/agents this workflow implements."
when_to_use: "Use when checking the convergence safeguards behind this workflow, how it relates to other quality gates, or which agents and conventions back it."
---

# Safety, Related Workflows, and Conventions

## Safety Features

**Infinite Loop Prevention**:

- max-iterations defaults to 7 (override with higher value for more attempts)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring
- Escalation warning at iteration 5 if not converging

**Convergence Safeguards**:

- Checker loads `.known-false-positives.md` skip list at start of each iteration
- Fixer persists new FALSE_POSITIVEs to skip list after each run
- Re-validation uses scoped scan (changed files only) to prevent scope expansion
- Factual claims verified in iteration 1 are cached, not re-verified with WebSearch
- Escalation after repeated checker-fixer disagreements on the same finding

**False Positive Protection**:

- Fixer re-validates each finding before applying
- Skips FALSE_POSITIVE findings automatically
- Maintains `.known-false-positives.md` for persistent memory

**Error Recovery**:

- Continues to verification even if some fixes fail
- Reports which fixes succeeded/failed
- Generates final report regardless of status

## Related Workflows

- [Repository Rules Validation](../../rules/rules-quality-gate.md) — Validates
  governance layer consistency (principles, conventions, development practices)
- [Docs Propagation](../../docs/docs-propagation.md) — Keeps the documents that cite these
  specifications true to them
- [Plan Quality Gate](../../plan/plan-quality-gate.md) — Validates plan completeness

## Notes

- **Fully automated**: No human checkpoints, runs to completion
- **Idempotent**: Safe to run multiple times, won't break working state
- **Conservative**: Fixer skips uncertain changes (preserves correctness)
- **Observable**: Generates audit reports for every iteration
- **Explicitly scoped**: Only validates folders you list — no implicit discovery

**Concurrency**: Currently validates and fixes sequentially. The `max-concurrency` parameter
is reserved for future enhancements where multiple listed folders could be validated in parallel.

## Principles Implemented/Respected

- **Explicit Over Implicit**: All steps, conditions, and termination criteria are explicit
- **Automation Over Manual**: Fully automated validation and fixing without human intervention
- **Simplicity Over Complexity**: Clear linear flow with loop control
- **Accessibility First**: Validates C4 diagrams use accessible color palette
- **Documentation First**: Ensures every spec directory has proper README documentation
- **No Time Estimates**: Focus on quality outcomes, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow file follows
  plain name convention for workflows
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use
  GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Active voice, proper
  heading hierarchy, single H1
- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: Three-stage
  workflow with criticality and confidence assessment

## Agents

- [specs-checker](../../../../.claude/agents/specs/specs-checker.md) — validates specs directory for structural completeness, content accuracy, and C4 diagram correctness
- [specs-fixer](../../../../.claude/agents/specs/specs-fixer.md) — fixes specs structural and accuracy issues
