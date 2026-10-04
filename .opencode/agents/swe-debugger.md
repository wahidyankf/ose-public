---
description: |-
  Resolves failing type checks, lint findings, and tests one cause at a time, diagnosing each before changing code, keeping pinned behaviour intact, and never suppressing or bypassing a check.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/swe-debugger.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
