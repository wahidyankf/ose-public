---
description: |-
  Audits the separation between the platform style guides under docs/explanation/software-engineering/ and AyoKoding educational content, for each relationship the Software Design Reference lists, and returns criticality-rated findings without modifying anything.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: docs-software-engineering-separation-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-software-engineering-separation-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
