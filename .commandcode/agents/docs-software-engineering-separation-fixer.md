---
description: |-
  Executes Software Engineering Separation Propagation on a frozen ledger, adding prerequisite statements, removing duplicated teaching from style guides, and repairing table entries and cross-links, without ever writing AyoKoding educational content.
disallowedTools: |-
  agent, agent_output
name: docs-software-engineering-separation-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-software-engineering-separation-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
