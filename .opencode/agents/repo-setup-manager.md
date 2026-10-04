---
description: |-
  Executes Phase 0 of a plan delivery checklist: uses HIPPO for dependency and toolchain convergence, then runs scoped baselines and resolves preexisting failures before plan work begins.
mode: subagent
permission:
  bash: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/repo-setup-manager.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
