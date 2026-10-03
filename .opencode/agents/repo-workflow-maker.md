---
description: |-
  Creates workflow documentation in repo-governance/workflows/ following workflow pattern convention.
mode: subagent
permission:
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/repo-workflow-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
