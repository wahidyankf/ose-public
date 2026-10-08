---
description: |-
  Reviews one pinned change for the correctness discipline, judging behaviour against domain intent and the acceptance criteria across normal, edge, and error cases, and returns anchored findings.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-logic-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-logic-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
