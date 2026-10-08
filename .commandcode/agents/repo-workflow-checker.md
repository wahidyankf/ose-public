---
description: Validates workflow documentation quality and compliance with workflow pattern convention.
disallowedTools: |-
  agent, agent_output, edit_file
name: repo-workflow-checker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/repo-workflow-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
