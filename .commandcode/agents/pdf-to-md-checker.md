---
description: Compares a converted Markdown file with its source PDF across seven fidelity dimensions and returns rated findings without editing either file.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pdf-to-md-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pdf-to-md-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
