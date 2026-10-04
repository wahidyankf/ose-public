---
description: |-
  Reviews one pinned change for the performance discipline, finding concrete or likely regressions, hot-path changes, complexity growth, and memory and I/O cost, and returns anchored findings to the review coordinator, the pr-review checker.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-performance-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
