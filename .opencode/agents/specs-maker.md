---
description: |-
  Creates new spec areas, missing README files, and scaffolds Gherkin feature structure at explicitly specified paths under specs/. Use when adding a new app or library to the specs directory.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/specs-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
