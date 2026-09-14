---
name: plan-execution-checker
description: Validates completed plan implementation by verifying all requirements met, code quality standards followed, and acceptance criteria satisfied. Final quality gate before marking plan complete.
tools: Read, Glob, Grep, Bash, Write
model: opus
effort: high
color: green
skills:
  - plan-verifying-execution
  - plan-writing-gherkin-criteria
  - plan-creating-project-plans
  - docs-validating-factual-accuracy
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-execution-checker.md and
follow it as authoritative. If it cannot be read, stop and report the missing path.

**Model Selection Justification**: `model: opus` (planning grade) — deciding whether a completed
implementation actually satisfies its requirements and acceptance criteria means reasoning about
intent against evidence, across every file the delivery touched. It is the last gate before
archival, so a wrong pass is expensive to detect and expensive to undo.
