---
description: |-
  Re-validates harness compatibility findings against current files and their cited sources, repairs mechanical drift at the canonical source, regenerates adapters, and hands every decision to a person.
disallowedTools: |-
  agent, agent_output
name: harness-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/harness-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
