---
description: |-
  Re-validates harness compatibility findings against current files and their cited sources, repairs mechanical drift at the canonical source, regenerates adapters, and hands every decision to a person.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/harness-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
