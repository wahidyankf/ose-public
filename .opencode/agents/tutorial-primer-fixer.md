---
description: |-
  Executes Tutorial Primer Propagation on a frozen tutorial-primer ledger, repairing only what each example itself settles, with every threshold read from the adopting repository's adapter, and leaving authoring and pedagogy to the author.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/tutorial-primer-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
