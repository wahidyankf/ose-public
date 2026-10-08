---
description: Applies validated fixes from readme-checker audit reports. Re-validates README findings before applying changes. Use after reviewing readme-checker output.
disallowedTools: |-
  agent, agent_output
name: readme-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/readme-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
