---
description: Applies validated fixes from specs-checker audit reports for explicitly listed spec folders. Re-validates findings before applying. Use after reviewing specs-checker output.
effort: high
model: opus
name: specs-fixer
skills:
  - specs-validating-structure
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - docs-applying-content-quality
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/specs-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
