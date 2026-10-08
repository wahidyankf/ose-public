---
description: Audits finished plan execution in fixed order and returns the terminal verdict that permits or blocks archival.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: plan-execution-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/plan-execution-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
