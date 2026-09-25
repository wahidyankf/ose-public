---
description: |-
  Planning-grade PR-review pass stage 0. Pins one head, selects the risk-routed specialist set, assembles shared context, and records the probe before one fan-out. Never discovers or posts findings.
effort: high
model: opus
name: pr-review-scout-maker
skills:
  - pr-review-scout-classification
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-scout-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
