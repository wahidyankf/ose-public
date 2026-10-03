---
description: |-
  Audits each project's test targets, local hooks, and pipeline definitions against the adopted gate standards and returns rated findings, without modifying anything.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/ci-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
