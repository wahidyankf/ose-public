---
description: |-
  Reviews one pinned change for the documentation discipline, judging substantive completeness, clarity, mode fit, drift from the code, accessibility, and whether the change description matches the diff, and returns anchored findings.
effort: xhigh
model: sonnet
name: pr-review-docs-checker
skills:
  - pr-review-specialist-protocol
  - repo-assessing-criticality-confidence
  - docs-authoring-standards
  - docs-applying-content-quality
  - docs-applying-diataxis-framework
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-docs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
