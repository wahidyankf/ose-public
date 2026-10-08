---
description: |-
  Creates new spec areas, missing README files, and scaffolds Gherkin feature structure at explicitly specified paths under specs/. Use when adding a new app or library to the specs directory.
disallowedTools: |-
  agent, agent_output
name: specs-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/specs-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
