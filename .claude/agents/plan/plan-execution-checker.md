---
description: Audits finished plan execution in fixed order and returns the terminal verdict that permits or blocks archival.
effort: high
model: opus
name: plan-execution-checker
tools: |-
  Read, Glob, Grep, Bash
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-execution-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
