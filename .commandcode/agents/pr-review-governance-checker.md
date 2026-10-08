---
description: |-
  Reviews one pinned change for the governance discipline, checking mechanical conformance to rules the repository documents, such as naming, structure, and required files and sections, and returns anchored findings.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-governance-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-governance-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
