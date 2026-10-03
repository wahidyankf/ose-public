---
description: |-
  Checks one pinned change for the pr-review family by coordinating one review pass: after the lens checkers report, it deduplicates, re-categorizes, filters, verifies, and rates raw findings for criticality, then publishes the one review bound to the pinned head, editing no file.
model: inherit
name: pr-review-checker
skills:
  - pr-review-synthesis-coordination
  - repo-generating-validation-reports
  - pr-review-specialist-protocol
  - repo-assessing-criticality-confidence
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
