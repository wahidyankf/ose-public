---
description: |-
  Creates and updates tutorial documentation following Diátaxis framework and tutorial conventions
disallowedTools: |-
  agent, agent_output
name: docs-tutorial-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-tutorial-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
