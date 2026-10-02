---
description: |-
  Executes PR Review Propagation on a frozen review ledger, answering each blocking row on one change with a fix, a reasoned reject, or a deferral, tagging each answer's cause, and committing fixes only to the change's own branch.
effort: xhigh
model: sonnet
name: pr-review-fixer
skills:
  - pr-review-fixer-resolution
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
