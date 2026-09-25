---
description: Applies validated fixes from docs-tutorial-checker audit reports. Re-validates pedagogical findings before applying changes. Use after reviewing docs-tutorial-checker output.
effort: xhigh
model: sonnet
name: docs-tutorial-fixer
skills:
  - docs-fixing-tutorial-quality
  - docs-applying-content-quality
  - docs-applying-diataxis-framework
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-tutorial-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
