---
description: Validates project plan quality including requirements completeness, technical documentation clarity, and delivery checklist executability. Use when reviewing plans before execution.
permission:
  bash: allow
  glob: allow
  grep: allow
  read: allow
  webfetch: allow
  websearch: allow
  write: allow
color: success
skills:
  - docs-applying-content-quality
  - plan-writing-gherkin-criteria
  - plan-creating-project-plans
  - plan-validating-quality
  - docs-validating-factual-accuracy
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-checker.md and
follow it as authoritative. If it cannot be read, stop and report the missing path.

**Model Selection Justification**: `model: opus` (planning grade) — judging whether a plan is
complete, sequenced, and executable is open-ended reasoning over a whole delivery, not a checklist
sweep: the defect is usually a missing step or a wrong order, which is visible only against an
intent the plan never states. A governance trio sits at planning grade because a wrong call
reshapes work across the repository rather than one file.
