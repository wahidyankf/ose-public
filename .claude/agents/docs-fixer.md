---
description: Applies validated fixes from docs-checker audit reports. Re-validates factual accuracy findings before applying changes. Use after reviewing docs-checker output.
effort: xhigh
model: sonnet
name: docs-fixer
skills:
  - docs-fixing-factual-accuracy
  - docs-applying-content-quality
  - docs-applying-diataxis-framework
  - docs-validating-factual-accuracy
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
