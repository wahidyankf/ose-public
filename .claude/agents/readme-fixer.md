---
description: Applies validated fixes from readme-checker audit reports. Re-validates README findings before applying changes. Use after reviewing readme-checker output.
effort: xhigh
model: sonnet
name: readme-fixer
skills:
  - readme-fixing-quality
  - docs-applying-content-quality
  - readme-writing-readme-files
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/readme-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
