---
description: Applies validated fixes from docs-tutorial-checker audit reports. Re-validates pedagogical findings before applying changes. Use after reviewing docs-tutorial-checker output.
disallowedTools: |-
  agent, agent_output
name: docs-tutorial-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-tutorial-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
