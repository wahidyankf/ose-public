---
description: |-
  Reviews one pinned change for the documentation discipline, judging substantive completeness, clarity, mode fit, drift from the code, accessibility, and whether the change description matches the diff, and returns anchored findings.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-docs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
