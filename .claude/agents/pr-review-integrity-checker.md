---
description: |-
  Reviews one pinned change for the test integrity discipline, finding tests that were loosened, disabled, or cut back, gamed coverage, and bug fixes that land without a regression test, and returns anchored findings.
effort: xhigh
model: sonnet
name: pr-review-integrity-checker
skills:
  - pr-review-specialist-protocol
  - repo-assessing-criticality-confidence
  - ci-standards
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-integrity-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
