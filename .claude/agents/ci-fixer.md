---
description: |-
  Applies a CI checker's findings to test targets, hooks, and pipeline definitions after re-validating each one, and records what it fixed, disproved, and left for a person.
effort: xhigh
model: sonnet
name: ci-fixer
skills:
  - ci-standards
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
  - repo-generating-validation-reports
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/ci-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
