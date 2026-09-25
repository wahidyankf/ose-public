---
description: |-
  Validates explicitly listed specs/ folders (and their subfolders) for structural completeness, content accuracy, internal consistency, and cross-folder coherence. Use when auditing specification quality or before major spec refactors.
effort: high
model: opus
name: specs-checker
skills:
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - docs-applying-content-quality
  - plan-writing-gherkin-criteria
  - repo-maintaining-task-lists
  - specs-validating-structure
tools: |-
  Read, Glob, Grep, Write, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/specs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
