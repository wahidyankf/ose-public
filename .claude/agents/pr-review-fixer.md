---
description: |-
  Resolves unresolved GitHub PR review threads posted by pr-review-synthesis-maker's single consolidated review. Enumerates every unresolved thread via the GitHub Reviews API, applies a 4-way triage (fix / reject-with-reason / defer-with-reason / clarify), pushes fixes to the PR branch, replies to every thread, and resolves only the threads it actually addressed. Use as the fixer half of the explicit PR-Review Maker→Fixer Cycle workflow (`repo-governance/workflows/pr/pr-review-cycle.md`), never standalone.
effort: xhigh
model: sonnet
name: pr-review-fixer
skills:
  - pr-review-fixer-resolution
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
tools: |-
  Read, Glob, Grep, Write, Edit, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
