---
description: |-
  Audits a repository's rules as a whole for contradictions across levels, inaccurate references, inconsistent terms and strengths, missing traceability, and duplicated bodies, and returns rated findings without editing.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: rules-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/rules-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
