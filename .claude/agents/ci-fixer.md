---
description: Applies validated fixes from ci-checker audit reports. Re-validates findings before applying to prevent false positives.
effort: xhigh
model: sonnet
name: ci-fixer
skills:
  - ci-standards
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/ci-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
