---
description: |-
  Checks one pinned change for the pr-review family by coordinating one review pass: after the lens checkers report, it deduplicates, re-categorizes, filters, verifies, and rates raw findings for criticality, then publishes the one review bound to the pinned head, editing no file.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
