---
description: |-
  Applies validated fixes from docs-software-engineering-separation-checker audit reports. Fixes missing prerequisite statements, removes duplicated educational content from style guides, and ensures docs/explanation focuses on repository-specific conventions only. Re-validates findings before applying changes.
effort: xhigh
model: sonnet
name: docs-software-engineering-separation-fixer
skills:
  - docs-validating-software-engineering-separation
  - docs-applying-content-quality
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-software-engineering-separation-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
