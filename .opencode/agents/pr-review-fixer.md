---
description: |-
  Executes PR Review Propagation on a frozen review ledger, answering each blocking row on one change with a fix, a reasoned reject, or a deferral, tagging each answer's cause, and committing fixes only to the change's own branch.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
